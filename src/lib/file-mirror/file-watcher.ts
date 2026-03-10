// File watcher — monitors workspace folder for changes and syncs back to DB.
// Uses chokidar for reliable cross-platform file watching.
// Only active in desktop runtime.

import fs from "fs"
import path from "path"
import crypto from "crypto"
import type { FSWatcher } from "chokidar"
import type { Phase } from "@/lib/types/enums"
import { parseFrontmatterMarkdown } from "./frontmatter"
import {
  readManifest,
  writeManifest,
  findMappingByPath,
  findMappingByDocId,
  upsertMapping,
  type ProjectManifest,
} from "./manifest"
import { parseRelativePath } from "./path-utils"

export interface FileChange {
  type: "modified" | "deleted"
  docId: string
  relativePath: string
  newTitle?: string
  newContent?: string
  newPhase?: Phase
}

type ChangeListener = (changes: FileChange[]) => void

let watcher: FSWatcher | null = null
let watchedRoot: string | null = null
let changeListener: ChangeListener | null = null

// Debounce: collect changes over a short window then emit as batch
let pendingChanges: FileChange[] = []
let debounceTimer: ReturnType<typeof setTimeout> | null = null
const DEBOUNCE_MS = 500

// Ignore set: paths we're currently writing to (avoid feedback loops)
const ignoreSet = new Set<string>()
const IGNORE_DURATION_MS = 2000

function contentHash(content: string): string {
  return crypto.createHash("sha256").update(content, "utf-8").digest("hex")
}

/**
 * Mark a file path as "our write" to suppress the next change event.
 */
export function ignoreNextChange(absolutePath: string): void {
  ignoreSet.add(absolutePath)
  setTimeout(() => ignoreSet.delete(absolutePath), IGNORE_DURATION_MS)
}

/**
 * Start watching a workspace folder for changes.
 * Only one workspace can be watched at a time.
 */
export async function startWatching(
  workspaceRoot: string,
  listener: ChangeListener
): Promise<void> {
  // Stop existing watcher if any
  await stopWatching()

  watchedRoot = workspaceRoot
  changeListener = listener

  // Dynamic import chokidar (may not be available in web builds)
  const { watch } = await import("chokidar")

  watcher = watch(workspaceRoot, {
    ignored: [
      /(^|[/\\])\../, // dotfiles (including .shipflow/)
      /node_modules/,
    ],
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 300,
      pollInterval: 100,
    },
  })

  watcher.on("change", (filePath: string) => handleFileEvent("change", filePath))
  watcher.on("unlink", (filePath: string) => handleFileEvent("unlink", filePath))
}

/**
 * Stop the file watcher.
 */
export async function stopWatching(): Promise<void> {
  if (watcher) {
    await watcher.close()
    watcher = null
  }
  watchedRoot = null
  changeListener = null
  pendingChanges = []
  if (debounceTimer) {
    clearTimeout(debounceTimer)
    debounceTimer = null
  }
}

function handleFileEvent(event: "change" | "unlink", absolutePath: string): void {
  if (!watchedRoot) return
  if (!absolutePath.endsWith(".md")) return

  // Check if this is our own write
  if (ignoreSet.has(absolutePath)) {
    ignoreSet.delete(absolutePath)
    return
  }

  const relativePath = path.relative(watchedRoot, absolutePath)
  const manifest = readManifest(watchedRoot)
  if (!manifest) return

  if (event === "unlink") {
    // File was deleted
    const mapping = findMappingByPath(manifest, relativePath)
    if (mapping) {
      pendingChanges.push({
        type: "deleted",
        docId: mapping.docId,
        relativePath,
      })
      scheduleBatchEmit()
    }
    return
  }

  // File was modified
  const mapping = findMappingByPath(manifest, relativePath)

  if (mapping) {
    // Known file — check if content actually changed
    const raw = fs.readFileSync(absolutePath, "utf-8")
    const hash = contentHash(raw)
    if (hash === mapping.contentHash) return // No actual change

    const parsed = parseFrontmatterMarkdown(raw)
    if (!parsed) return // Invalid frontmatter — skip

    pendingChanges.push({
      type: "modified",
      docId: mapping.docId,
      relativePath,
      newTitle: parsed.meta.title,
      newContent: parsed.content,
    })

    // Update manifest hash immediately
    upsertMapping(manifest, {
      ...mapping,
      contentHash: hash,
      lastWrittenAt: new Date().toISOString(),
    })
    writeManifest(watchedRoot, manifest)

    scheduleBatchEmit()
  } else {
    // Unknown file in a phase folder — could be a new document
    // We only handle known files for now (external creation requires UI action)
    const parsedPath = parseRelativePath(relativePath)
    if (!parsedPath) return

    // Read and check if it has frontmatter with a doc ID
    try {
      const raw = fs.readFileSync(absolutePath, "utf-8")
      const parsed = parseFrontmatterMarkdown(raw)
      if (parsed && parsed.meta.id) {
        // Has a doc ID in frontmatter — this is a managed file
        const existingById = findMappingByDocId(manifest, parsed.meta.id)
        if (existingById) {
          // File was moved/renamed — update mapping
          pendingChanges.push({
            type: "modified",
            docId: parsed.meta.id,
            relativePath,
            newTitle: parsed.meta.title,
            newContent: parsed.content,
            newPhase: parsedPath.phase,
          })
          scheduleBatchEmit()
        }
      }
    } catch {
      // Ignore read errors
    }
  }
}

function scheduleBatchEmit(): void {
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    if (pendingChanges.length > 0 && changeListener) {
      const batch = [...pendingChanges]
      pendingChanges = []
      changeListener(batch)
    }
  }, DEBOUNCE_MS)
}

/**
 * Check if the watcher is currently active.
 */
export function isWatching(): boolean {
  return watcher !== null
}

/**
 * Get the currently watched workspace root.
 */
export function getWatchedRoot(): string | null {
  return watchedRoot
}
