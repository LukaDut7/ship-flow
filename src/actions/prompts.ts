"use server"

import { prisma } from "@/lib/prisma"
import { requireProjectAccess, requireDocAccess, checkTierLimit, requireAuth } from "@/lib/auth-guard"
import { assemblePrompt } from "@/lib/prompt-engine/assembler"
import { formatPrompt } from "@/lib/prompt-engine/formatter"
import { resolveContext } from "@/lib/prompt-engine/context-resolver"
import { revalidatePath } from "next/cache"
import type { TargetTool } from "@prisma/client"

interface GenerateOptions {
  includeProjectContext: boolean
  includeTechStack: boolean
  includePhaseContext: boolean
  includeLinkedDocs: boolean
  customInstructions?: string
}

export async function generateAndSavePrompt(
  projectId: string,
  documentId: string,
  targetTool: TargetTool,
  options: GenerateOptions
) {
  const { user, project } = await requireProjectAccess(projectId)
  await checkTierLimit(user.id, "prompts")

  const document = await prisma.document.findUnique({
    where: { id: documentId, projectId },
  })
  if (!document) throw new Error("Document not found")

  const { linkedDocs } = await resolveContext(documentId)
  const resolvedLinked = options.includeLinkedDocs
    ? linkedDocs.map((d) => ({
        title: d.title,
        content: d.content,
        phase: d.phase,
        linkType: d.linkType,
      }))
    : []

  const assembled = assemblePrompt({
    project: {
      name: project.name,
      description: project.description,
      techStack: project.techStack as string[],
    },
    primaryDoc: {
      title: document.title,
      content: document.content,
      phase: document.phase,
      docType: document.docType,
    },
    linkedDocs: resolvedLinked,
    options,
  })

  const formatted = formatPrompt(assembled, targetTool)

  const prompt = await prisma.generatedPrompt.create({
    data: {
      projectId,
      documentId,
      targetTool,
      promptContent: formatted,
      options: JSON.parse(JSON.stringify(options)),
    },
  })

  revalidatePath(`/projects/${projectId}/prompts`)

  return {
    id: prompt.id,
    content: formatted,
    createdAt: prompt.createdAt.toISOString(),
  }
}

export async function generatePromptPreview(
  projectId: string,
  documentId: string,
  targetTool: TargetTool,
  options: GenerateOptions
) {
  const { project } = await requireProjectAccess(projectId)

  const document = await prisma.document.findUnique({
    where: { id: documentId, projectId },
  })
  if (!document) throw new Error("Document not found")

  const { linkedDocs } = await resolveContext(documentId)
  const resolvedLinked = options.includeLinkedDocs
    ? linkedDocs.map((d) => ({
        title: d.title,
        content: d.content,
        phase: d.phase,
        linkType: d.linkType,
      }))
    : []

  const assembled = assemblePrompt({
    project: {
      name: project.name,
      description: project.description,
      techStack: project.techStack as string[],
    },
    primaryDoc: {
      title: document.title,
      content: document.content,
      phase: document.phase,
      docType: document.docType,
    },
    linkedDocs: resolvedLinked,
    options,
  })

  return formatPrompt(assembled, targetTool)
}

export async function deletePromptHistory(promptId: string) {
  const user = await requireAuth()

  const prompt = await prisma.generatedPrompt.findUnique({
    where: { id: promptId },
    include: { project: { select: { userId: true } } },
  })
  if (!prompt || prompt.project.userId !== user.id) {
    throw new Error("Prompt not found")
  }

  await prisma.generatedPrompt.delete({ where: { id: promptId } })

  revalidatePath(`/projects/${prompt.projectId}/prompts`)
  return { success: true }
}
