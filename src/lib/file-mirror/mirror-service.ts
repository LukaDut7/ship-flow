// Mirror service — orchestrates the bidirectional file mirror.
// Coordinates between the file writer, file watcher, and repositories.
// Only active in desktop runtime.

import type { Document } from "@/lib/types/models"
import { getDocumentRepo, getProjectRepo } from "@/lib/repositories"
import { syncAllDocuments, writeDocumentFile, removeDocumentFile } from "./file-writer"
import {
  startWatching,
  stopWatching,
  isWatching,
  getWatchedRoot,
  ignoreNextChange,
  type FileChange,
} from "./file-watcher"
import { readManifest, writeManifest, type ProjectManifest } from "./manifest"
import { getDocumentAbsolutePath } from "./path-utils"

interface MirrorConfig {
  projectId: string
  workspaceRoot: string
}

let _config: MirrorConfig | null = null
let _manifest: ProjectManifest | null = null

type MirrorListener = (event: MirrorEvent) => void
type MirrorEvent =
  | { type: "sync-complete"; filesWritten: number }
  | { type: "file-changed"; docId: string }
  | { type: "file-deleted"; docId: string }
  | { type: "error"; message: string }

const listeners: Set<MirrorListener> = new Set()

function emit(event: MirrorEvent): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch {
      // Don't let listener errors break the mirror
    }
  }
}

export function onMirrorEvent(listener: MirrorListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/**
 * Link a project to a workspace folder and perform initial sync.
 * Writes all existing documents to the folder.
 */
export async function linkWorkspace(
  projectId: string,
  workspaceRoot: string
): Promise<{ filesWritten: number }> {
  const projectRepo = getProjectRepo()
  const documentRepo = getDocumentRepo()

  const project = await projectRepo.findById(projectId)
  if (!project) throw new Error(`Project ${projectId} not found`)

  const documents = await documentRepo.findManyByProject(projectId)

  // Write all documents to the workspace
  _manifest = syncAllDocuments(workspaceRoot, project, documents)

  _config = { projectId, workspaceRoot }

  // Start watching for external edits
  await startWatching(workspaceRoot, handleFileChanges)

  emit({ type: "sync-complete", filesWritten: documents.length })

  return { filesWritten: documents.length }
}

/**
 * Unlink the workspace — stop watching and clear config.
 * Does NOT delete the files.
 */
export async function unlinkWorkspace(): Promise<void> {
  await stopWatching()
  _config = null
  _manifest = null
}

/**
 * Notify the mirror that a document was created or updated in the DB.
 * Writes the updated file to disk.
 */
export function onDocumentChanged(doc: Document): void {
  if (!_config || !_manifest) return
  if (doc.projectId !== _config.projectId) return

  const absPath = getDocumentAbsolutePath(
    _config.workspaceRoot,
    doc.phase,
    doc.title,
    doc.docType
  )
  ignoreNextChange(absPath)

  writeDocumentFile(_config.workspaceRoot, _manifest, doc)
  writeManifest(_config.workspaceRoot, _manifest)
}

/**
 * Notify the mirror that a document was deleted from the DB.
 * Removes the corresponding file from disk.
 */
export function onDocumentDeleted(docId: string): void {
  if (!_config || !_manifest) return

  removeDocumentFile(_config.workspaceRoot, _manifest, docId)
  writeManifest(_config.workspaceRoot, _manifest)
}

/**
 * Re-sync all documents (e.g., after a pull from cloud).
 */
export async function resyncAll(): Promise<void> {
  if (!_config) return

  const projectRepo = getProjectRepo()
  const documentRepo = getDocumentRepo()

  const project = await projectRepo.findById(_config.projectId)
  if (!project) return

  const documents = await documentRepo.findManyByProject(_config.projectId)

  _manifest = syncAllDocuments(_config.workspaceRoot, project, documents)

  emit({ type: "sync-complete", filesWritten: documents.length })
}

/**
 * Handle changes detected by the file watcher.
 */
async function handleFileChanges(changes: FileChange[]): Promise<void> {
  const documentRepo = getDocumentRepo()

  for (const change of changes) {
    try {
      if (change.type === "deleted") {
        await documentRepo.delete(change.docId)
        emit({ type: "file-deleted", docId: change.docId })
      } else if (change.type === "modified") {
        const updateData: { title?: string; content?: string; updatedAt?: Date } = {
          updatedAt: new Date(),
        }
        if (change.newTitle !== undefined) updateData.title = change.newTitle
        if (change.newContent !== undefined) updateData.content = change.newContent

        await documentRepo.update(change.docId, updateData)
        emit({ type: "file-changed", docId: change.docId })
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Mirror error"
      emit({ type: "error", message })
    }
  }
}

/**
 * Get current mirror status.
 */
export function getMirrorStatus(): {
  linked: boolean
  projectId: string | null
  workspaceRoot: string | null
  watching: boolean
  fileCount: number
} {
  return {
    linked: !!_config,
    projectId: _config?.projectId ?? null,
    workspaceRoot: _config?.workspaceRoot ?? null,
    watching: isWatching(),
    fileCount: _manifest?.mappings.length ?? 0,
  }
}
