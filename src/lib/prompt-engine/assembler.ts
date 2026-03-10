import { PHASE_LABELS } from "@/lib/constants"
import type { Phase } from "@/lib/types/enums"

export interface AssemblerInput {
  project: { name: string; description: string; techStack: string[] }
  primaryDoc: { title: string; content: string; phase: string; docType: string }
  linkedDocs: Array<{
    title: string
    content: string
    phase: string
    linkType: string
  }>
  options: {
    includeProjectContext: boolean
    includeTechStack: boolean
    includePhaseContext: boolean
    includeLinkedDocs: boolean
    customInstructions?: string
  }
}

export function assemblePrompt(input: AssemblerInput): string {
  const sections: string[] = []

  if (input.options.includeProjectContext) {
    sections.push(
      `## Project Context\n\n**${input.project.name}**\n\n${input.project.description}`
    )
  }

  if (input.options.includeTechStack && input.project.techStack.length > 0) {
    const bullets = input.project.techStack
      .map((tech) => `- ${tech}`)
      .join("\n")
    sections.push(`## Tech Stack\n\n${bullets}`)
  }

  if (input.options.includePhaseContext) {
    const phaseLabel =
      PHASE_LABELS[input.primaryDoc.phase as Phase] ?? input.primaryDoc.phase
    sections.push(
      `## Current Phase: ${phaseLabel}\n\nYou are working in the **${phaseLabel}** phase. Use the document below as the primary context for this task.`
    )
  }

  sections.push(
    `## ${input.primaryDoc.title}\n\n${input.primaryDoc.content}`
  )

  if (input.options.includeLinkedDocs && input.linkedDocs.length > 0) {
    const linkedSections = input.linkedDocs.map(
      (doc) => `### ${doc.title}\n\n${doc.content}`
    )
    sections.push(`## Related Context\n\n${linkedSections.join("\n\n")}`)
  }

  if (input.options.customInstructions?.trim()) {
    sections.push(
      `## Instructions\n\n${input.options.customInstructions.trim()}`
    )
  }

  return sections.join("\n\n")
}
