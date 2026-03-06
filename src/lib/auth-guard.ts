import { auth } from "./auth"
import { prisma } from "./prisma"
import { redirect } from "next/navigation"
import { TIER_LIMITS } from "./constants"
import type { UserTier } from "@prisma/client"

export async function requireAuth() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  return session.user as { id: string; name?: string | null; email?: string | null; image?: string | null }
}

export async function requireProjectAccess(projectId: string) {
  const user = await requireAuth()
  const project = await prisma.project.findUnique({
    where: { id: projectId, userId: user.id },
  })
  if (!project) throw new Error("Project not found")
  return { user, project }
}

export async function requireDocAccess(docId: string) {
  const user = await requireAuth()
  const doc = await prisma.document.findUnique({
    where: { id: docId },
    include: { project: { select: { userId: true, id: true } } },
  })
  if (!doc || doc.project.userId !== user.id)
    throw new Error("Document not found")
  return { user, doc }
}

export async function checkTierLimit(
  userId: string,
  resource: "projects" | "prompts"
) {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
  })
  const limits = TIER_LIMITS[user.tier as UserTier]

  if (resource === "projects") {
    const count = await prisma.project.count({
      where: { userId, status: "ACTIVE" },
    })
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
    const userProjects = await prisma.project.findMany({
      where: { userId },
      select: { id: true },
    })
    const projectIds = userProjects.map((p) => p.id)
    const count = await prisma.generatedPrompt.count({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: startOfMonth },
      },
    })
    if (count >= limits.promptsPerMonth) {
      throw new Error("Monthly prompt limit reached. Upgrade to Pro for unlimited prompts.")
    }
  }
}
