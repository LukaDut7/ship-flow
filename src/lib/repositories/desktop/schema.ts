// Drizzle schema for desktop SQLite — mirrors the Prisma/Postgres schema
// minus auth-specific models (User, Account, Session, VerificationToken).
// Desktop stores only application data; auth is handled via JWT.

import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core"

// ─── User (cached from cloud, not authoritative) ───

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name"),
  email: text("email"),
  image: text("image"),
  tier: text("tier").notNull().default("FREE"), // UserTier
  cachedAt: integer("cached_at", { mode: "timestamp" }).notNull(),
})

// ─── Application Models ───

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  techStack: text("tech_stack").notNull().default("[]"), // JSON-serialized string[]
  status: text("status").notNull().default("ACTIVE"), // ProjectStatus
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // Soft delete for sync
})

export const documents = sqliteTable("documents", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  phase: text("phase").notNull(), // Phase enum
  docType: text("doc_type").notNull(), // DocType enum
  sortOrder: integer("sort_order").notNull().default(0),
  isFromTemplate: integer("is_from_template", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // Soft delete for sync
})

export const documentLinks = sqliteTable("document_links", {
  id: text("id").primaryKey(),
  fromDocId: text("from_doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  toDocId: text("to_doc_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  linkType: text("link_type").notNull().default("REFERENCES"), // LinkType enum
})

export const contextBundles = sqliteTable("context_bundles", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  isPreset: integer("is_preset", { mode: "boolean" }).notNull().default(false),
  deletedAt: integer("deleted_at", { mode: "timestamp" }), // Soft delete for sync
})

export const bundleDocuments = sqliteTable("bundle_documents", {
  id: text("id").primaryKey(),
  bundleId: text("bundle_id").notNull().references(() => contextBundles.id, { onDelete: "cascade" }),
  documentId: text("document_id").notNull().references(() => documents.id, { onDelete: "cascade" }),
  sortOrder: integer("sort_order").notNull().default(0),
})

export const generatedPrompts = sqliteTable("generated_prompts", {
  id: text("id").primaryKey(),
  projectId: text("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
  documentId: text("document_id").references(() => documents.id, { onDelete: "set null" }),
  targetTool: text("target_tool").notNull(), // TargetTool enum
  promptContent: text("prompt_content").notNull(),
  options: text("options").notNull().default("{}"), // JSON-serialized
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
})

// ─── Sync tracking ───

export const syncState = sqliteTable("sync_state", {
  key: text("key").primaryKey(), // e.g. "lastServerSeq", "deviceId"
  value: text("value").notNull(),
})

export const syncChangesLocal = sqliteTable("sync_changes_local", {
  id: text("id").primaryKey(),
  entityType: text("entity_type").notNull(), // SyncEntityType
  entityId: text("entity_id").notNull(),
  operation: text("operation").notNull(), // SyncOperation
  payload: text("payload"), // JSON-serialized or null for deletes
  clientSeq: integer("client_seq").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
  pushed: integer("pushed", { mode: "boolean" }).notNull().default(false),
})

// ─── Desktop-specific: schema version tracking ───

export const schemaMeta = sqliteTable("schema_meta", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
})
