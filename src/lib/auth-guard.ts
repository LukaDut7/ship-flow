import { auth } from "./auth"
import { redirect } from "next/navigation"
import { TIER_LIMITS } from "./constants"
import { getProjectRepo, getDocumentRepo, getUserRepo, getPromptRepo } from "./repositories"
import type { UserTier } from "@/lib/types/enums"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }
}

export async function requireProjectAccess(projectId: string) {
  const user = await requireAuth()
  const projectRepo = getProjectRepo()
  const project = await projectRepo.findByIdAndUser(projectId, user.id)
  if (!project) throw new Error("Project not found")
  return { user, project }
}

export async function requireDocAccess(docId: string) {
  const user = await requireAuth()
  const documentRepo = getDocumentRepo()
  const doc = await documentRepo.findByIdWithProject(docId)
  if (!doc || doc.project.userId !== user.id)
    throw new Error("Document not found")
  return { user, doc }
}

export async function checkTierLimit(
  userId: string,
  resource: "projects" | "prompts"
) {
  const userRepo = getUserRepo()
  const user = await userRepo.findByIdOrThrow(userId)
  const limits = TIER_LIMITS[user.tier as UserTier]

  if (resource === "projects") {
    const projectRepo = getProjectRepo()
    const count = await projectRepo.countByUser(userId, "ACTIVE")
    if (count >= limits.projects) {
      throw new Error("Project limit reached. Upgrade to Pro for unlimited projects.")
    }
  }

  if (resource === "prompts") {
    const startOfMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    )
    const projectRepo = getProjectRepo()
    const projects = await projectRepo.findManyByUser(userId)
    const projectIds = projects.map((p) => p.id)
    const promptRepo = getPromptRepo()
    const count = await promptRepo.countByUserProjects(projectIds, startOfMonth)
    if (count >= limits.promptsPerMonth) {
      throw new Error("Monthly prompt limit reached. Upgrade to Pro for unlimited prompts.")
    }
  }
}
