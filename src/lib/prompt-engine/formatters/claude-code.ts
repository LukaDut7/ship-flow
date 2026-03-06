/**
 * Formats content as CLAUDE.md.
 * Standard CLAUDE.md format with hierarchical markdown headers.
 * Starts with a "# Project Context" header.
 */
export function formatClaudeCode(assembled: string): string {
  if (assembled.startsWith("# ")) {
    return assembled
  }
  return `# Project Context\n\n${assembled}`
}
