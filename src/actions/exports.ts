"use server"

import JSZip from "jszip"
import { getDocumentRepo, getBundleRepo } from "@/lib/repositories"
import {
  requireProjectAccess,
  requireDocAccess,
  requireAuth,
} from "@/lib/auth-guard"
import { PHASE_LABELS, PHASES } from "@/lib/constants"
import { formatCursor } from "@/lib/prompt-engine/formatters/cursor"
import { formatClaudeProjects } from "@/lib/prompt-engine/formatters/claude-projects"
import type { Phase } from "@/lib/types/enums"

function sanitizeFilename(name: string): string {
  return name.replace(/[/\\:*?"<>|]/g, "-").trim() || "untitled"
}

function buildAssembledContent(
  project: { name: string; description: string; techStack: string[] },
  docs: Array<{ title: string; content: string; phase: Phase }>
): string {
  const sections: string[] = []

  sections.push(
    `## Project Context\n\n**${project.name}**\n\n${project.description}`
  )

  if (project.techStack.length > 0) {
    const bullets = project.techStack.map((tech) => `- ${tech}`).join("\n")
    sections.push(`## Tech Stack\n\n${bullets}`)
  }

  const sortedDocs = [...docs].sort(
    (a, b) => PHASES.indexOf(a.phase) - PHASES.indexOf(b.phase)
  )

  for (const doc of sortedDocs) {
    if (doc.content.trim()) {
      sections.push(`## ${doc.title}\n\n${doc.content}`)
    }
  }

  return sections.join("\n\n")
}

export async function exportProjectAsZip(projectId: string): Promise<string> {
  const { project } = await requireProjectAccess(projectId)

  const documentRepo = getDocumentRepo()
  const documents = await documentRepo.findManyByProject(projectId, {
    orderBy: [{ field: "phase", direction: "asc" }, { field: "sortOrder", direction: "asc" }],
  })

  const zip = new JSZip()

  for (const doc of documents) {
    const phaseLabel = PHASE_LABELS[doc.phase] ?? doc.phase
    const phaseFolder = sanitizeFilename(phaseLabel)
    const docFilename = sanitizeFilename(doc.title) + ".md"
    const path = `${phaseFolder}/${docFilename}`
    zip.file(path, doc.content)
  }

  return zip.generateAsync({ type: "base64" })
}

export async function exportDocument(
  docId: string
): Promise<{ filename: string; content: string }> {
  const { doc } = await requireDocAccess(docId)

  const filename = sanitizeFilename(doc.title) + ".md"
  return { filename, content: doc.content }
}

export async function exportAsCursorRules(
  projectId: string
): Promise<{ filename: string; content: string }> {
  const { project } = await requireProjectAccess(projectId)

  const documentRepo = getDocumentRepo()
  const documents = await documentRepo.findManyByProject(projectId, {
    orderBy: [{ field: "phase", direction: "asc" }, { field: "sortOrder", direction: "asc" }],
  })

  const assembled = buildAssembledContent(
    {
      name: project.name,
      description: project.description,
      techStack: (project.techStack as string[]) ?? [],
    },
    documents.map((d) => ({ title: d.title, content: d.content, phase: d.phase }))
  )

  const content = formatCursor(assembled)
  const projectSlug = sanitizeFilename(project.name)
  return { filename: `${projectSlug}.cursorrules`, content }
}

export async function exportAsClaudeProject(
  projectId: string
): Promise<{ filename: string; content: string }> {
  const { project } = await requireProjectAccess(projectId)

  const documentRepo = getDocumentRepo()
  const documents = await documentRepo.findManyByProject(projectId, {
    orderBy: [{ field: "phase", direction: "asc" }, { field: "sortOrder", direction: "asc" }],
  })

  const assembled = buildAssembledContent(
    {
      name: project.name,
      description: project.description,
      techStack: (project.techStack as string[]) ?? [],
    },
    documents.map((d) => ({ title: d.title, content: d.content, phase: d.phase }))
  )

  const content = formatClaudeProjects(assembled)
  const projectSlug = sanitizeFilename(project.name)
  return { filename: `${projectSlug}-claude-project.md`, content }
}

export async function exportBundle(
  bundleId: string
): Promise<{ filename: string; content: string }> {
  const bundleRepo = getBundleRepo()
  const bundle = await bundleRepo.findByIdWithProjectAndDocs(bundleId)

  if (!bundle) throw new Error("Bundle not found")

  const user = await requireAuth()
  if (bundle.project.userId !== user.id) {
    throw new Error("Bundle not found")
  }

  const sections: string[] = []

  sections.push(
    `# ${bundle.name}\n\n${bundle.description || ""}\n\n---\n\n`
  )

  sections.push(
    `## Project: ${bundle.project.name}\n\n${bundle.project.description}\n\n`
  )

  for (const entry of bundle.documents) {
    const doc = entry.document
    sections.push(`## ${doc.title}\n\n${doc.content}\n\n---\n\n`)
  }

  const content = sections.join("")
  const bundleSlug = sanitizeFilename(bundle.name)
  return { filename: `${bundleSlug}.md`, content }
}
