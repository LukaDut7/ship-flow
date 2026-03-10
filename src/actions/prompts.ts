"use server"

import { getDocumentRepo, getPromptRepo } from "@/lib/repositories"
import { requireProjectAccess, requireDocAccess, checkTierLimit, requireAuth } from "@/lib/auth-guard"
import { assemblePrompt } from "@/lib/prompt-engine/assembler"
import { formatPrompt } from "@/lib/prompt-engine/formatter"
import { resolveContext } from "@/lib/prompt-engine/context-resolver"
import { revalidatePath } from "next/cache"
import type { TargetTool } from "@/lib/types/enums"

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

  const documentRepo = getDocumentRepo()
  const document = await documentRepo.findById(documentId)
  if (!document || document.projectId !== projectId) throw new Error("Document not found")

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

  const promptRepo = getPromptRepo()
  const prompt = await promptRepo.create({
    projectId,
    documentId,
    targetTool,
    promptContent: formatted,
    options: JSON.parse(JSON.stringify(options)),
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

  const documentRepo = getDocumentRepo()
  const document = await documentRepo.findById(documentId)
  if (!document || document.projectId !== projectId) throw new Error("Document not found")

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

  const promptRepo = getPromptRepo()
  const prompt = await promptRepo.findByIdWithProject(promptId)
  if (!prompt || prompt.project.userId !== user.id) {
    throw new Error("Prompt not found")
  }

  await promptRepo.delete(promptId)

  revalidatePath(`/projects/${prompt.projectId}/prompts`)
  return { success: true }
}
