// Path utilities for the file mirror — maps documents to filesystem paths.
// Documents are organized: <workspace>/<phase>/<filename>.md

import type { Phase, DocType } from "@/lib/types/enums"
import path from "path"

/** Human-readable folder names for each phase. */
const PHASE_FOLDERS: Record<Phase, string> = {
  IDEATION: "01-ideation",
  PLANNING: "02-planning",
  DESIGN: "03-design",
  ARCHITECTURE: "04-architecture",
  DEVELOPMENT: "05-development",
  TESTING: "06-testing",
  SHIPPING: "07-shipping",
  ITERATION: "08-iteration",
}

/** Convert a document title to a safe filename. */
export function titleToFilename(title: string): string {
  return (
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 80) || "untitled"
  )
}

/**
 * Get the relative path for a document within the workspace.
 * Format: <phase-folder>/<filename>.md
 */
export function getDocumentRelativePath(
  phase: Phase,
  title: string,
  _docType: DocType
): string {
  const folder = PHASE_FOLDERS[phase]
  const filename = titleToFilename(title)
  return path.join(folder, `${filename}.md`)
}

/**
 * Get the full absolute path for a document in a workspace.
 */
export function getDocumentAbsolutePath(
  workspaceRoot: string,
  phase: Phase,
  title: string,
  docType: DocType
): string {
  return path.join(workspaceRoot, getDocumentRelativePath(phase, title, docType))
}

/**
 * Get the .shipflow manifest directory path.
 */
export function getManifestDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, ".shipflow")
}

/**
 * Get the project manifest file path.
 */
export function getManifestPath(workspaceRoot: string): string {
  return path.join(getManifestDir(workspaceRoot), "project.json")
}

/**
 * Parse a relative file path back to phase (if it matches our convention).
 * Returns null if the path doesn't match the expected structure.
 */
export function parseRelativePath(
  relativePath: string
): { phase: Phase; filename: string } | null {
  const parts = relativePath.split(path.sep)
  if (parts.length < 2) return null

  const folderName = parts[0]
  const filename = parts.slice(1).join(path.sep)

  if (!filename.endsWith(".md")) return null

  for (const [phase, folder] of Object.entries(PHASE_FOLDERS)) {
    if (folder === folderName) {
      return { phase: phase as Phase, filename: filename.replace(/\.md$/, "") }
    }
  }

  return null
}

/**
 * Get all phase folder names.
 */
export function getPhaseFolders(): string[] {
  return Object.values(PHASE_FOLDERS)
}
