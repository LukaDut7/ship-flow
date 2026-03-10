// File writer — writes documents from DB to the filesystem as frontmatter markdown.
// Called after initial link, after sync pulls, and after local edits in the UI.

import fs from "fs"
import path from "path"
import crypto from "crypto"
import type { Document, Project } from "@/lib/types/models"
import { toFrontmatterMarkdown, type DocumentFrontmatter } from "./frontmatter"
import {
  getDocumentAbsolutePath,
  getDocumentRelativePath,
  getPhaseFolders,
} from "./path-utils"
import {
  readManifest,
  writeManifest,
  createManifest,
  findMappingByDocId,
  upsertMapping,
  removeMapping,
  type ProjectManifest,
} from "./manifest"

function contentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex")
}

/**
 * Ensure all phase folders exist in the workspace.
 */
function ensurePhaseFolders(workspaceRoot: string): void {
  for (const folder of getPhaseFolders()) {
    const dir = path.join(workspaceRoot, folder)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
  }
}

/**
 * Write a single document to disk.
 * Updates the manifest mapping.
 * Returns the relative path written.
 */
export function writeDocumentFile(
  workspaceRoot: string,
  manifest: ProjectManifest,
  doc: Document
): string {
  const meta: DocumentFrontmatter = {
    id: doc.id,
    title: doc.title,
    phase: doc.phase,
    docType: doc.docType,
    sortOrder: doc.sortOrder,
    isFromTemplate: doc.isFromTemplate,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  }

  const markdown = toFrontmatterMarkdown(meta, doc.content)
  const hash = contentHash(markdown)

  // Check if there's an existing mapping — if path changed (rename), remove old file
  const existing = findMappingByDocId(manifest, doc.id)
  const newRelPath = getDocumentRelativePath(doc.phase, doc.title, doc.docType)

  if (existing && existing.relativePath !== newRelPath) {
    // Document was renamed or moved to different phase — remove old file
    const oldAbsPath = path.join(workspaceRoot, existing.relativePath)
    if (fs.existsSync(oldAbsPath)) {
      fs.unlinkSync(oldAbsPath)
    }
  }

  // Skip write if content hasn't changed
  if (existing && existing.contentHash === hash && existing.relativePath === newRelPath) {
    return newRelPath
  }

  const absPath = getDocumentAbsolutePath(
    workspaceRoot,
    doc.phase,
    doc.title,
    doc.docType
  )

  // Ensure directory exists
  const dir = path.dirname(absPath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  fs.writeFileSync(absPath, markdown, "utf-8")

  upsertMapping(manifest, {
    docId: doc.id,
    relativePath: newRelPath,
    contentHash: hash,
    lastWrittenAt: new Date().toISOString(),
  })

  return newRelPath
}

/**
 * Remove a document's file from disk.
 */
export function removeDocumentFile(
  workspaceRoot: string,
  manifest: ProjectManifest,
  docId: string
): void {
  const mapping = findMappingByDocId(manifest, docId)
  if (!mapping) return

  const absPath = path.join(workspaceRoot, mapping.relativePath)
  if (fs.existsSync(absPath)) {
    fs.unlinkSync(absPath)
  }

  removeMapping(manifest, docId)
}

/**
 * Full sync: write all documents for a project to the workspace.
 * Creates the manifest if it doesn't exist.
 * Removes files for deleted documents.
 */
export function syncAllDocuments(
  workspaceRoot: string,
  project: Project,
  documents: Document[]
): ProjectManifest {
  let manifest = readManifest(workspaceRoot)
  if (!manifest) {
    manifest = createManifest(project.id, project.name)
  }

  ensurePhaseFolders(workspaceRoot)

  // Track which doc IDs are still active
  const activeDocIds = new Set(documents.map((d) => d.id))

  // Write each document
  for (const doc of documents) {
    writeDocumentFile(workspaceRoot, manifest, doc)
  }

  // Remove files for documents that no longer exist
  const orphaned = manifest.mappings.filter((m) => !activeDocIds.has(m.docId))
  for (const mapping of orphaned) {
    const absPath = path.join(workspaceRoot, mapping.relativePath)
    if (fs.existsSync(absPath)) {
      fs.unlinkSync(absPath)
    }
  }
  manifest.mappings = manifest.mappings.filter((m) => activeDocIds.has(m.docId))

  // Save manifest
  writeManifest(workspaceRoot, manifest)

  return manifest
}
