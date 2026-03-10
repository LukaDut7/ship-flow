"use server"

import { getBundleRepo } from "@/lib/repositories"
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

  const bundleRepo = getBundleRepo()
  const bundle = await bundleRepo.create({
    projectId,
    name,
    description,
    documentIds,
  })

  revalidatePath(`/projects/${projectId}/bundles`)
  redirect(`/projects/${projectId}/bundles/${bundle.id}`)
}

export async function updateBundle(bundleId: string, formData: FormData) {
  const bundleRepo = getBundleRepo()
  const bundle = await bundleRepo.findByIdWithProject(bundleId)
  if (!bundle) throw new Error("Bundle not found")

  await requireProjectAccess(bundle.project.id)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const documentIdsRaw = formData.get("documentIds") as string | null
  const documentIds = documentIdsRaw
    ? documentIdsRaw.split(",").filter(Boolean)
    : []

  await bundleRepo.update(bundleId, { name, description, documentIds })

  revalidatePath(`/projects/${bundle.project.id}/bundles`)
  revalidatePath(`/projects/${bundle.project.id}/bundles/${bundleId}`)
}

export async function deleteBundle(bundleId: string) {
  const bundleRepo = getBundleRepo()
  const bundle = await bundleRepo.findByIdWithProject(bundleId)
  if (!bundle) throw new Error("Bundle not found")

  await requireProjectAccess(bundle.project.id)

  await bundleRepo.delete(bundleId)

  revalidatePath(`/projects/${bundle.project.id}/bundles`)
  redirect(`/projects/${bundle.project.id}/bundles`)
}
