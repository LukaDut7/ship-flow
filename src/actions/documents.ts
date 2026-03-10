"use server"

import { getDocumentRepo, getDocumentLinkRepo } from "@/lib/repositories"
import { requireProjectAccess, requireDocAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, DOC_TYPE_TO_PHASE } from "@/lib/constants"
import { TEMPLATES } from "@/lib/doc-templates"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { DocType, LinkType } from "@/lib/types/enums"

function loadTemplate(docType: DocType): string {
  return TEMPLATES[docType] ?? `# ${DOC_TYPE_LABELS[docType]}\n\n> Start documenting here.\n`
}

export async function createDocument(projectId: string, formData: FormData) {
  await requireProjectAccess(projectId)

  const docType = formData.get("docType") as DocType
  const customTitle = formData.get("title") as string | null
  const title = customTitle || DOC_TYPE_LABELS[docType]
  const phase = DOC_TYPE_TO_PHASE[docType]
  const content = loadTemplate(docType)

  const documentRepo = getDocumentRepo()
  const maxOrder = await documentRepo.getMaxSortOrder(projectId)

  const doc = await documentRepo.create({
    projectId,
    title,
    content,
    phase,
    docType,
    sortOrder: maxOrder + 1,
    isFromTemplate: true,
  })

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}/docs/${doc.id}`)
}

export async function saveContent(docId: string, content: string) {
  await requireDocAccess(docId)

  const documentRepo = getDocumentRepo()
  await documentRepo.update(docId, { content, updatedAt: new Date() })

  return { savedAt: new Date().toISOString() }
}

export async function updateDocument(docId: string, formData: FormData) {
  const { doc } = await requireDocAccess(docId)

  const title = formData.get("title") as string

  const documentRepo = getDocumentRepo()
  await documentRepo.update(docId, { title })

  revalidatePath(`/projects/${doc.project.id}`)
}

export async function deleteDocument(docId: string) {
  const { doc } = await requireDocAccess(docId)
  const projectId = doc.project.id

  const documentRepo = getDocumentRepo()
  await documentRepo.delete(docId)

  revalidatePath(`/projects/${projectId}`)
  redirect(`/projects/${projectId}`)
}

export async function addDocumentLink(
  fromDocId: string,
  toDocId: string,
  linkType: LinkType
) {
  await requireDocAccess(fromDocId)

  const documentLinkRepo = getDocumentLinkRepo()
  const existing = await documentLinkRepo.findByUniqueKey(fromDocId, toDocId)
  if (existing) return { error: "Link already exists" }

  const link = await documentLinkRepo.create({ fromDocId, toDocId, linkType })

  revalidatePath(`/projects/`)
  return { success: true, link }
}

export async function removeDocumentLink(linkId: string) {
  const documentLinkRepo = getDocumentLinkRepo()
  const link = await documentLinkRepo.findByIdWithFromDoc(linkId)
  if (!link) throw new Error("Link not found")
  await requireProjectAccess(link.fromDoc.projectId)

  await documentLinkRepo.delete(linkId)

  revalidatePath(`/projects/`)
  return { success: true }
}
