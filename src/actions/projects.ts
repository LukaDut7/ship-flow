"use server"

import { prisma } from "@/lib/prisma"
import { requireAuth, checkTierLimit } from "@/lib/auth-guard"
import { PHASE_DOC_MAP, DOC_TYPE_LABELS, DOC_TYPE_TO_PHASE } from "@/lib/constants"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import fs from "fs/promises"
import path from "path"
import type { DocType, Phase } from "@prisma/client"

async function loadTemplate(docType: DocType): Promise<string> {
  const filename = DOC_TYPE_LABELS[docType]
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
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

async function loadTemplateByType(docType: DocType): Promise<string> {
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
    return loadTemplate(docType)
  }
}

export async function createProject(formData: FormData) {
  const user = await requireAuth()
  await checkTierLimit(user.id, "projects")

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const techStackRaw = formData.get("techStack") as string
  const techStack = techStackRaw
    ? techStackRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const project = await prisma.project.create({
    data: {
      userId: user.id,
      name,
      description,
      techStack,
    },
  })

  const docPromises: Promise<unknown>[] = []
  let sortOrder = 0

  for (const [phase, configs] of Object.entries(PHASE_DOC_MAP)) {
    for (const config of configs) {
      const content = await loadTemplateByType(config.docType)
      docPromises.push(
        prisma.document.create({
          data: {
            projectId: project.id,
            title: DOC_TYPE_LABELS[config.docType],
            content,
            phase: phase as Phase,
            docType: config.docType,
            sortOrder: sortOrder++,
            isFromTemplate: true,
          },
        })
      )
    }
  }

  await Promise.all(docPromises)

  revalidatePath("/dashboard")
  redirect(`/projects/${project.id}`)
}

export async function updateProject(projectId: string, formData: FormData) {
  const { project } = await (await import("@/lib/auth-guard")).requireProjectAccess(projectId)

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const techStackRaw = formData.get("techStack") as string
  const techStack = techStackRaw
    ? techStackRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : (project.techStack as string[])

  await prisma.project.update({
    where: { id: projectId },
    data: { name, description, techStack },
  })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
}

export async function deleteProject(projectId: string) {
  await (await import("@/lib/auth-guard")).requireProjectAccess(projectId)

  await prisma.project.delete({ where: { id: projectId } })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function archiveProject(projectId: string) {
  await (await import("@/lib/auth-guard")).requireProjectAccess(projectId)

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "ARCHIVED" },
  })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
