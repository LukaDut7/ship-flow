/**
 * Formats content as ChatGPT system prompt.
 * Uses clear delimiters and section markers.
 * Starts with "You are helping with the following project:"
 */
export function formatChatGPT(assembled: string): string {
  const intro = "You are helping with the following project:\n\n"
  const sections = assembled.split(/\n(?=## )/).filter((s) => s.trim())
  const body = sections.map((s) => `---\n${s.trim()}\n---`).join("\n\n")
  return intro + body
}
