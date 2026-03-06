/**
 * Formats content for Claude Projects.
 * Wraps in XML-like structure that Claude Projects uses well for knowledge documents.
 */
export function formatClaudeProjects(assembled: string): string {
  const sectionRegex = /^## (.+)$/gm
  const parts: string[] = []
  let lastIndex = 0
  let match

  const sectionMatches: Array<{ title: string; start: number; end: number }> = []
  while ((match = sectionRegex.exec(assembled)) !== null) {
    sectionMatches.push({
      title: match[1].trim(),
      start: match.index,
      end: match.index + match[0].length,
    })
  }

  const contextParts: string[] = []
  let documentContent = ""
  let relatedContent = ""
  let instructionsContent = ""

  for (let i = 0; i < sectionMatches.length; i++) {
    const curr = sectionMatches[i]
    const next = sectionMatches[i + 1]
    const contentStart = curr.end
    const contentEnd = next ? next.start : assembled.length
    const content = assembled.slice(contentStart, contentEnd).trim()
    const fullSection = `## ${curr.title}\n\n${content}`

    if (
      curr.title === "Project Context" ||
      curr.title.startsWith("Tech Stack") ||
      curr.title.startsWith("Current Phase:")
    ) {
      contextParts.push(fullSection)
    } else if (curr.title === "Related Context") {
      relatedContent = fullSection
    } else if (curr.title === "Instructions") {
      instructionsContent = content
    } else {
      documentContent = fullSection
    }
  }

  const blocks: string[] = []

  if (contextParts.length > 0) {
    blocks.push(`<context>\n${contextParts.join("\n\n")}\n</context>`)
  }

  if (documentContent) {
    blocks.push(`<document>\n${documentContent}\n</document>`)
  }

  if (relatedContent) {
    blocks.push(`<related>\n${relatedContent}\n</related>`)
  }

  if (instructionsContent) {
    blocks.push(`<instructions>\n${instructionsContent}\n</instructions>`)
  }

  return blocks.join("\n\n")
}
