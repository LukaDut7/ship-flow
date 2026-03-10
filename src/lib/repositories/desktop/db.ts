// Desktop SQLite database initialization and management.
// Only imported when SHIPFLOW_RUNTIME=desktop.

import Database from "better-sqlite3"
import { drizzle } from "drizzle-orm/better-sqlite3"
import * as schema from "./schema"
import path from "path"
import fs from "fs"

const SCHEMA_VERSION = 2

let _db: ReturnType<typeof drizzle> | null = null
let _sqlite: Database.Database | null = null

function getDbPath(): string {
  // In Electron, use app.getPath('userData') passed via env var
  const dataDir = process.env.SHIPFLOW_DATA_DIR
  if (!dataDir) {
    throw new Error("SHIPFLOW_DATA_DIR environment variable is required for desktop mode")
  }
  return path.join(dataDir, "shipflow.db")
}

function createTables(sqlite: Database.Database): void {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS schema_meta (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT,
      email TEXT,
      image TEXT,
      tier TEXT NOT NULL DEFAULT 'FREE',
      cached_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      tech_stack TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      phase TEXT NOT NULL,
      doc_type TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_from_template INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS document_links (
      id TEXT PRIMARY KEY,
      from_doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      to_doc_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      link_type TEXT NOT NULL DEFAULT 'REFERENCES'
    );

    CREATE TABLE IF NOT EXISTS context_bundles (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      is_preset INTEGER NOT NULL DEFAULT 0,
      deleted_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS bundle_documents (
      id TEXT PRIMARY KEY,
      bundle_id TEXT NOT NULL REFERENCES context_bundles(id) ON DELETE CASCADE,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      sort_order INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS generated_prompts (
      id TEXT PRIMARY KEY,
      project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
      document_id TEXT REFERENCES documents(id) ON DELETE SET NULL,
      target_tool TEXT NOT NULL,
      prompt_content TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL
    );

    -- Sync tracking
    CREATE TABLE IF NOT EXISTS sync_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sync_changes_local (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      operation TEXT NOT NULL,
      payload TEXT,
      client_seq INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      pushed INTEGER NOT NULL DEFAULT 0
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
    CREATE INDEX IF NOT EXISTS idx_documents_project_phase ON documents(project_id, phase);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_document_links_from_to ON document_links(from_doc_id, to_doc_id);
    CREATE INDEX IF NOT EXISTS idx_document_links_from ON document_links(from_doc_id);
    CREATE INDEX IF NOT EXISTS idx_document_links_to ON document_links(to_doc_id);
    CREATE INDEX IF NOT EXISTS idx_context_bundles_project ON context_bundles(project_id);
    CREATE INDEX IF NOT EXISTS idx_bundle_documents_bundle ON bundle_documents(bundle_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_bundle_documents_unique ON bundle_documents(bundle_id, document_id);
    CREATE INDEX IF NOT EXISTS idx_generated_prompts_project ON generated_prompts(project_id);
    CREATE INDEX IF NOT EXISTS idx_generated_prompts_project_created ON generated_prompts(project_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_sync_changes_local_pushed ON sync_changes_local(pushed);
    CREATE INDEX IF NOT EXISTS idx_sync_changes_local_entity ON sync_changes_local(entity_type, entity_id);
  `)

  // Record schema version
  sqlite.prepare(
    "INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', ?)"
  ).run(String(SCHEMA_VERSION))
}

function migrateIfNeeded(sqlite: Database.Database): void {
  const row = sqlite
    .prepare("SELECT value FROM schema_meta WHERE key = 'schema_version'")
    .get() as { value: string } | undefined

  const currentVersion = row ? parseInt(row.value, 10) : 0

  if (currentVersion < SCHEMA_VERSION) {
    if (currentVersion < 2) {
      // V2: Add sync tracking tables + soft-delete columns
      sqlite.exec(`
        CREATE TABLE IF NOT EXISTS sync_state (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sync_changes_local (
          id TEXT PRIMARY KEY,
          entity_type TEXT NOT NULL,
          entity_id TEXT NOT NULL,
          operation TEXT NOT NULL,
          payload TEXT,
          client_seq INTEGER NOT NULL,
          created_at INTEGER NOT NULL,
          pushed INTEGER NOT NULL DEFAULT 0
        );

        ALTER TABLE projects ADD COLUMN deleted_at INTEGER;
        ALTER TABLE documents ADD COLUMN deleted_at INTEGER;
        ALTER TABLE context_bundles ADD COLUMN deleted_at INTEGER;

        CREATE INDEX IF NOT EXISTS idx_sync_changes_local_pushed ON sync_changes_local(pushed);
        CREATE INDEX IF NOT EXISTS idx_sync_changes_local_entity ON sync_changes_local(entity_type, entity_id);
      `)
    }

    sqlite
      .prepare("INSERT OR REPLACE INTO schema_meta (key, value) VALUES ('schema_version', ?)")
      .run(String(SCHEMA_VERSION))
  }
}

export function getDesktopDb() {
  if (_db) return _db

  const dbPath = getDbPath()

  // Ensure directory exists
  const dir = path.dirname(dbPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Back up existing DB before migration
  const isNew = !fs.existsSync(dbPath)

  _sqlite = new Database(dbPath)
  _sqlite.pragma("journal_mode = WAL")
  _sqlite.pragma("foreign_keys = ON")

  if (isNew) {
    createTables(_sqlite)
  } else {
    migrateIfNeeded(_sqlite)
  }

  _db = drizzle(_sqlite, { schema })
  return _db
}

export function closeDesktopDb(): void {
  if (_sqlite) {
    _sqlite.close()
    _sqlite = null
    _db = null
  }
}
