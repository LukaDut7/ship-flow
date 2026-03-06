"use server"

import { prisma } from "@/lib/prisma"
import { requireProjectAccess } from "@/lib/auth-guard"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createBundle(projectId: string, formData: FormData) {
  await requireProjectAccess(projectId)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const documentIdsRaw = formData.get("documentIds") as string | null
  const documentIds = documentIdsRaw
    ? documentIdsRaw.split(",").filter(Boolean)
    : []

  const bundle = await prisma.contextBundle.create({
    data: {
      projectId,
      name,
      description,
      documents: {
        create: documentIds.map((documentId, index) => ({
          documentId,
          sortOrder: index,
        })),
      },
    },
  })

  revalidatePath(`/projects/${projectId}/bundles`)
  redirect(`/projects/${projectId}/bundles/${bundle.id}`)
}

export async function updateBundle(bundleId: string, formData: FormData) {
  const bundle = await prisma.contextBundle.findUnique({
    where: { id: bundleId },
    include: { project: { select: { id: true, userId: true } } },
  })
  if (!bundle) throw new Error("Bundle not found")

  await requireProjectAccess(bundle.project.id)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const documentIdsRaw = formData.get("documentIds") as string | null
  const documentIds = documentIdsRaw
    ? documentIdsRaw.split(",").filter(Boolean)
    : []

  await prisma.$transaction([
    prisma.bundleDocument.deleteMany({ where: { bundleId } }),
    prisma.contextBundle.update({
      where: { id: bundleId },
      data: {
        name,
        description,
        documents: {
          create: documentIds.map((documentId, index) => ({
            documentId,
            sortOrder: index,
          })),
        },
      },
    }),
  ])

  revalidatePath(`/projects/${bundle.project.id}/bundles`)
  revalidatePath(`/projects/${bundle.project.id}/bundles/${bundleId}`)
}

export async function deleteBundle(bundleId: string) {
  const bundle = await prisma.contextBundle.findUnique({
    where: { id: bundleId },
    include: { project: { select: { id: true, userId: true } } },
  })
  if (!bundle) throw new Error("Bundle not found")

  await requireProjectAccess(bundle.project.id)

  await prisma.contextBundle.delete({ where: { id: bundleId } })

  revalidatePath(`/projects/${bundle.project.id}/bundles`)
  redirect(`/projects/${bundle.project.id}/bundles`)
}
