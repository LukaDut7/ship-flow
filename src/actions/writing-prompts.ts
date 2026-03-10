"use server"

import { getProjectRepo, getDocumentRepo } from "@/lib/repositories"
import { requireDocAccess } from "@/lib/auth-guard"
import { WRITING_PROMPTS } from "@/lib/prompt-engine/writing-prompts"
import { DOC_TYPE_LABELS, PHASE_LABELS } from "@/lib/constants"
import type { DocType, Phase } from "@/lib/types/enums"

interface WritingPromptOptions {
  includeProjectContext?: boolean
  includeTechStack?: boolean
  contextDocIds?: string[]
  additionalInstructions?: string
}

export async function generateWritingPromptWithOptions(
  docId: string,
  options: WritingPromptOptions = {}
): Promise<string> {
  const {
    includeProjectContext = true,
    includeTechStack = true,
    contextDocIds = [],
    additionalInstructions,
  } = options

  const { doc } = await requireDocAccess(docId)

  const projectRepo = getProjectRepo()
  const project = await projectRepo.findById(doc.projectId)
  if (!project) throw new Error("Project not found")

  const config = WRITING_PROMPTS[doc.docType as DocType]
  const docLabel = DOC_TYPE_LABELS[doc.docType as DocType]
  const phaseLabel = PHASE_LABELS[doc.phase as Phase]

  const sections: string[] = []

  // Role & goal
  sections.push(`You are ${config.role}.\n\n${config.goal}`)

  // Project context
  if (includeProjectContext) {
    const contextParts = [`**Project:** ${project.name}`]
    if (project.description) {
      contextParts.push(`**Description:** ${project.description}`)
    }
    contextParts.push(`**Current Phase:** ${phaseLabel}`)
    contextParts.push(`**Document Type:** ${docLabel}`)
    sections.push(`## Project Context\n\n${contextParts.join("\n")}`)
  }

  // Tech stack
  const techStack = project.techStack as string[]
  if (includeTechStack && techStack.length > 0) {
    sections.push(`## Tech Stack\n\n${techStack.join(", ")}`)
  }

  // Linked document context (explicitly selected by user)
  if (contextDocIds.length > 0) {
    const documentRepo = getDocumentRepo()
    const linkedDocs = await documentRepo.findManyByIds(contextDocIds, doc.projectId, {
      select: ["title", "content", "phase", "docType"],
      orderBy: [{ field: "sortOrder", direction: "asc" }],
    })

    if (linkedDocs.length > 0) {
      const parts = linkedDocs.map((d) => {
        const label = DOC_TYPE_LABELS[d.docType as DocType]
        return `### ${label}\n\n\`\`\`markdown\n${d.content}\n\`\`\``
      })
      sections.push(
        `## Related Documents\n\nThis document depends on or references these documents:\n\n${parts.join("\n\n")}`
      )
    }
  }

  // Questions to address
  sections.push(
    `## Questions to Address\n\nHelp me answer these questions for my ${docLabel}:\n\n${config.questions.map((q, i) => `${i + 1}. ${q}`).join("\n")}`
  )

  // Current content (if any)
  const currentContent = doc.content.trim()
  const hasContent = currentContent.length > 200
  if (hasContent) {
    sections.push(
      `## My Current Draft\n\nHere's what I have so far. Please improve, expand, and fill in the gaps:\n\n\`\`\`markdown\n${currentContent}\n\`\`\``
    )
  }

  // Additional instructions from user
  if (additionalInstructions?.trim()) {
    sections.push(
      `## Additional Instructions\n\n${additionalInstructions.trim()}`
    )
  }

  // Output format
  sections.push(
    `## Output Format\n\nReturn the completed document in this exact markdown format:\n\n\`\`\`markdown\n${config.outputFormat}\n\`\`\`\n\n${hasContent ? "Improve my current draft — keep what's good, fill gaps, and make it more specific." : "Start by asking me the questions above one at a time, OR if you have enough context from the project information provided, generate a first draft I can refine."}`
  )

  return sections.join("\n\n")
}
