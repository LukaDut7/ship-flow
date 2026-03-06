"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, requireProjectAccess, requireDocAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, DOC_TYPE_TO_PHASE } from "@/lib/constants"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import fs from "fs/promises"
import path from "path"
import type { DocType, LinkType } from "@prisma/client"

const DOC_TYPE_FILE_MAP: Record<DocType, string> = {
  PROJECT_BRIEF: "project-brief",
  USER_RESEARCH: "user-research",
  FEATURE_SPEC: "feature-spec",
  DESIGN_SYSTEM: "design-system",
  WIREFRAME_NOTES: "wireframe-notes",
  TECH_DECISION: "tech-decision",
  API_CONTRACT: "api-contract",
  DATA_MODEL: "data-model",
  IMPLEMENTATION_NOTES: "implementation-notes",
  ENV_SETUP: "env-setup",
  TEST_STRATEGY: "test-strategy",
  DEPLOY_CONFIG: "deploy-config",
  LAUNCH_CHECKLIST: "launch-checklist",
  ITERATION_LOG: "iteration-log",
  FEEDBACK_CAPTURE: "feedback-capture",
}

async function loadTemplate(docType: DocType): Promise<string> {
  const filename = DOC_TYPE_FILE_MAP[docType]
  const templatePath = path.join(
    process.cwd(),
    "src",
    "lib",
    "doc-templates",
    `${filename}.md`
  )
  try {
    return await fs.readFile(templatePath, "utf-8")
  } catch {
    return `# ${DOC_TYPE_LABELS[docType]}\n\n> Start documenting here.\n`
  }
}

export async function createDocument(projectId: string, formData: FormData) {
  await requireProjectAccess(projectId)

  const docType = formData.get("docType") as DocType
  const customTitle = formData.get("title") as string | null
  const title = customTitle || DOC_TYPE_LABELS[docType]
  const phase = DOC_TYPE_TO_PHASE[docType]
  const content = await loadTemplate(docType)

  const maxOrder = await prisma.document.aggregate({
    where: { projectId },
    _max: { sortOrder: true },
  })

  const doc = await prisma.document.create({
    data: {
      projectId,
      title,
      content,
      phase,
      docType,
      sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      isFromTemplate: true,
    },
  })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}/docs/${doc.id}`)
}

export async function saveContent(docId: string, content: string) {
  await requireDocAccess(docId)

  await prisma.document.update({
    where: { id: docId },
    data: { content, updatedAt: new Date() },
  })

  return { savedAt: new Date().toISOString() }
}

export async function updateDocument(docId: string, formData: FormData) {
  const { doc } = await requireDocAccess(docId)

  const title = formData.get("title") as string

  await prisma.document.update({
    where: { id: docId },
    data: { title },
  })

  revalidatePath(`/projects/${doc.project.id}`)
}

export async function deleteDocument(docId: string) {
  const { doc } = await requireDocAccess(docId)
  const projectId = doc.project.id

  await prisma.document.delete({ where: { id: docId } })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function addDocumentLink(
  fromDocId: string,
  toDocId: string,
  linkType: LinkType
) {
  await requireDocAccess(fromDocId)

  const existing = await prisma.documentLink.findUnique({
    where: { fromDocId_toDocId: { fromDocId, toDocId } },
  })
  if (existing) return { error: "Link already exists" }

  await prisma.documentLink.create({
    data: { fromDocId, toDocId, linkType },
  })

  revalidatePath(`/projects/`)
  return { success: true }
}

export async function removeDocumentLink(linkId: string) {
  const link = await prisma.documentLink.findUnique({
    where: { id: linkId },
    include: { fromDoc: { select: { projectId: true } } },
  })
  if (!link) throw new Error("Link not found")
  await requireProjectAccess(link.fromDoc.projectId)

  await prisma.documentLink.delete({ where: { id: linkId } })

  revalidatePath(`/projects/`)
  return { success: true }
}
