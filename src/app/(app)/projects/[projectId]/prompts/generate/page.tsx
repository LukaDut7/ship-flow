import { prisma } from "@/lib/prisma"
import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { PromptGenerator } from "@/components/prompts/prompt-generator"

export default async function GeneratePromptPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ docId?: string }>
}) {
  const { projectId } = await params
  const { docId } = await searchParams
  await requireProjectAccess(projectId)

  const documents = await prisma.document.findMany({
    where: { projectId },
    select: { id: true, title: true, phase: true, docType: true, content: true },
    orderBy: [{ phase: "asc" }, { sortOrder: "asc" }],
  })

  const docs = documents.map((d) => ({
    id: d.id,
    title: d.title,
    phase: d.phase,
    docType: d.docType,
    content: d.content,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title="Generate Prompt" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-6xl">
          <PromptGenerator
            projectId={projectId}
            documents={docs}
            initialDocId={docId ?? undefined}
          />
        </div>
      </div>
    </div>
  )
}
