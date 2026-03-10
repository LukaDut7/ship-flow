// Frontmatter serialization/deserialization for markdown files.
// Documents are mirrored as markdown with YAML frontmatter containing metadata.

import type { Phase, DocType } from "@/lib/types/enums"

export interface DocumentFrontmatter {
  id: string
  title: string
  phase: Phase
  docType: DocType
  sortOrder: number
  isFromTemplate: boolean
  createdAt: string // ISO 8601
  updatedAt: string // ISO 8601
}

/**
 * Serialize a document into frontmatter markdown.
 */
export function toFrontmatterMarkdown(
  meta: DocumentFrontmatter,
  content: string
): string {
  const lines = [
    "---",
    `id: "${meta.id}"`,
    `title: "${escapeYaml(meta.title)}"`,
    `phase: ${meta.phase}`,
    `docType: ${meta.docType}`,
    `sortOrder: ${meta.sortOrder}`,
    `isFromTemplate: ${meta.isFromTemplate}`,
    `createdAt: "${meta.createdAt}"`,
    `updatedAt: "${meta.updatedAt}"`,
    "---",
    "",
  ]

  return lines.join("\n") + content
}

/**
 * Parse frontmatter markdown back into metadata + content.
 * Returns null if the file doesn't have valid frontmatter.
 */
export function parseFrontmatterMarkdown(
  raw: string
): { meta: DocumentFrontmatter; content: string } | null {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return null

  const yamlBlock = match[1]
  const content = match[2]

  try {
    const meta = parseYamlBlock(yamlBlock)
    if (!meta.id || !meta.phase || !meta.docType) return null

    return {
      meta: {
        id: meta.id,
        title: meta.title ?? "",
        phase: meta.phase as Phase,
        docType: meta.docType as DocType,
        sortOrder: parseInt(meta.sortOrder ?? "0", 10),
        isFromTemplate: meta.isFromTemplate === "true",
        createdAt: meta.createdAt ?? new Date().toISOString(),
        updatedAt: meta.updatedAt ?? new Date().toISOString(),
      },
      content,
    }
  } catch {
    return null
  }
}

/**
 * Minimal YAML key-value parser (no dependency needed for simple frontmatter).
 */
function parseYamlBlock(block: string): Record<string, string> {
  const result: Record<string, string> = {}
  for (const line of block.split("\n")) {
    const colonIdx = line.indexOf(":")
    if (colonIdx === -1) continue
    const key = line.slice(0, colonIdx).trim()
    let value = line.slice(colonIdx + 1).trim()
    // Strip surrounding quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    result[key] = value
  }
  return result
}

function escapeYaml(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"')
}
