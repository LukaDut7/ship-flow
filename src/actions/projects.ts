"use server"

import { getProjectRepo, getDocumentRepo, getDocumentLinkRepo } from "@/lib/repositories"
import { requireAuth, checkTierLimit } from "@/lib/auth-guard"
import { PHASE_DOC_MAP, DOC_TYPE_LABELS, DOC_TYPE_TO_PHASE } from "@/lib/constants"
import { TEMPLATES } from "@/lib/doc-templates"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import type { DocType, Phase, LinkType } from "@/lib/types/enums"

function loadTemplate(docType: DocType): string {
  return TEMPLATES[docType] ?? `# ${DOC_TYPE_LABELS[docType]}\n\n> Start documenting here.\n`
}

// Default links between template docs (from → to, linkType)
// "from" DEPENDS_ON/REFERENCES "to" means "from" uses "to" as input
const DEFAULT_DOC_LINKS: Array<{ from: DocType; to: DocType; type: LinkType }> = [
  // Ideation feeds into everything
  { from: "USER_RESEARCH", to: "PROJECT_BRIEF", type: "DEPENDS_ON" },
  { from: "FEATURE_SPEC", to: "PROJECT_BRIEF", type: "DEPENDS_ON" },
  { from: "FEATURE_SPEC", to: "USER_RESEARCH", type: "DEPENDS_ON" },
  // Design depends on specs
  { from: "DESIGN_SYSTEM", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "WIREFRAME_NOTES", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "WIREFRAME_NOTES", to: "DESIGN_SYSTEM", type: "REFERENCES" },
  // Architecture depends on specs
  { from: "TECH_DECISION", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "API_CONTRACT", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "API_CONTRACT", to: "TECH_DECISION", type: "REFERENCES" },
  { from: "DATA_MODEL", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "DATA_MODEL", to: "API_CONTRACT", type: "REFERENCES" },
  // Development depends on architecture
  { from: "IMPLEMENTATION_NOTES", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "IMPLEMENTATION_NOTES", to: "API_CONTRACT", type: "REFERENCES" },
  { from: "ENV_SETUP", to: "TECH_DECISION", type: "REFERENCES" },
  // Testing depends on specs
  { from: "TEST_STRATEGY", to: "FEATURE_SPEC", type: "DEPENDS_ON" },
  { from: "TEST_STRATEGY", to: "API_CONTRACT", type: "REFERENCES" },
  // Shipping references testing + deploy
  { from: "DEPLOY_CONFIG", to: "ENV_SETUP", type: "REFERENCES" },
  { from: "LAUNCH_CHECKLIST", to: "TEST_STRATEGY", type: "REFERENCES" },
  { from: "LAUNCH_CHECKLIST", to: "DEPLOY_CONFIG", type: "REFERENCES" },
  // Iteration references earlier work
  { from: "FEEDBACK_CAPTURE", to: "PROJECT_BRIEF", type: "REFERENCES" },
  { from: "ITERATION_LOG", to: "FEEDBACK_CAPTURE", type: "REFERENCES" },
]

export async function createProject(formData: FormData) {
  const user = await requireAuth()
  await checkTierLimit(user.id, "projects")

  const name = formData.get("name") as string
  const description = (formData.get("description") as string) || ""
  const techStackRaw = formData.get("techStack") as string
  const techStack = techStackRaw
    ? techStackRaw.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const projectRepo = getProjectRepo()
  const project = await projectRepo.create({
    userId: user.id,
    name,
    description,
    techStack,
  })

  // Create all template documents
  const docIdsByType: Partial<Record<DocType, string>> = {}
  let sortOrder = 0

  const documentRepo = getDocumentRepo()
  for (const [phase, configs] of Object.entries(PHASE_DOC_MAP)) {
    for (const config of configs) {
      const content = loadTemplate(config.docType)
      const doc = await documentRepo.create({
        projectId: project.id,
        title: DOC_TYPE_LABELS[config.docType],
        content,
        phase: phase as Phase,
        docType: config.docType,
        sortOrder: sortOrder++,
        isFromTemplate: true,
      })
      docIdsByType[config.docType] = doc.id
    }
  }

  // Create default links between docs
  const linkData = DEFAULT_DOC_LINKS
    .filter((l) => docIdsByType[l.from] && docIdsByType[l.to])
    .map((l) => ({
      fromDocId: docIdsByType[l.from]!,
      toDocId: docIdsByType[l.to]!,
      linkType: l.type,
    }))

  if (linkData.length > 0) {
    const documentLinkRepo = getDocumentLinkRepo()
    await documentLinkRepo.createMany(linkData)
  }

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

  const projectRepo = getProjectRepo()
  await projectRepo.update(projectId, { name, description, techStack })

  revalidatePath(`/projects/${projectId}`)
  revalidatePath("/dashboard")
}

export async function deleteProject(projectId: string) {
  await (await import("@/lib/auth-guard")).requireProjectAccess(projectId)

  const projectRepo = getProjectRepo()
  await projectRepo.delete(projectId)

  revalidatePath("/dashboard")
  redirect("/dashboard")
}

export async function archiveProject(projectId: string) {
  await (await import("@/lib/auth-guard")).requireProjectAccess(projectId)

  const projectRepo = getProjectRepo()
  await projectRepo.update(projectId, { status: "ARCHIVED" })

  revalidatePath("/dashboard")
  redirect("/dashboard")
}
