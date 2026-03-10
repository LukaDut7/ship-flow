// .shipflow/project.json manifest — tracks document-to-file identity mapping.
// This is the authoritative map for which files belong to which documents.

import fs from "fs"
import path from "path"
import { getManifestDir, getManifestPath } from "./path-utils"

export interface FileMapping {
  docId: string
  relativePath: string
  contentHash: string // SHA-256 of content for change detection
  lastWrittenAt: string // ISO 8601 — when we last wrote this file
}

export interface ProjectManifest {
  version: 1
  projectId: string
  projectName: string
  createdAt: string
  mappings: FileMapping[]
}

/**
 * Read the project manifest. Returns null if it doesn't exist.
 */
export function readManifest(workspaceRoot: string): ProjectManifest | null {
  const manifestPath = getManifestPath(workspaceRoot)
  try {
    const raw = fs.readFileSync(manifestPath, "utf-8")
    return JSON.parse(raw) as ProjectManifest
  } catch {
    return null
  }
}

/**
 * Write the project manifest to disk.
 */
export function writeManifest(
  workspaceRoot: string,
  manifest: ProjectManifest
): void {
  const dir = getManifestDir(workspaceRoot)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  // Also write a .gitignore in .shipflow/ to keep metadata out of user's git
  const gitignorePath = path.join(dir, ".gitignore")
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, "# Ship Flow metadata\nproject.json\n", "utf-8")
  }

  fs.writeFileSync(
    getManifestPath(workspaceRoot),
    JSON.stringify(manifest, null, 2) + "\n",
    "utf-8"
  )
}

/**
 * Create an initial manifest for a project.
 */
export function createManifest(
  projectId: string,
  projectName: string
): ProjectManifest {
  return {
    version: 1,
    projectId,
    projectName,
    createdAt: new Date().toISOString(),
    mappings: [],
  }
}

/**
 * Find a mapping by document ID.
 */
export function findMappingByDocId(
  manifest: ProjectManifest,
  docId: string
): FileMapping | undefined {
  return manifest.mappings.find((m) => m.docId === docId)
}

/**
 * Find a mapping by relative file path.
 */
export function findMappingByPath(
  manifest: ProjectManifest,
  relativePath: string
): FileMapping | undefined {
  return manifest.mappings.find((m) => m.relativePath === relativePath)
}

/**
 * Add or update a mapping.
 */
export function upsertMapping(
  manifest: ProjectManifest,
  mapping: FileMapping
): void {
  const idx = manifest.mappings.findIndex((m) => m.docId === mapping.docId)
  if (idx >= 0) {
    manifest.mappings[idx] = mapping
  } else {
    manifest.mappings.push(mapping)
  }
}

/**
 * Remove a mapping by document ID.
 */
export function removeMapping(
  manifest: ProjectManifest,
  docId: string
): void {
  manifest.mappings = manifest.mappings.filter((m) => m.docId !== docId)
}
