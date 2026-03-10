import { getDocumentRepo } from "@/lib/repositories"
import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { WritingAssistant } from "@/components/prompts/writing-assistant"

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

  const documents = await getDocumentRepo().findManyByProject(projectId)

  const docs = documents.map((d) => ({
    id: d.id,
    title: d.title,
    phase: d.phase,
    docType: d.docType,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title="Help Me Write" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-6xl">
          <WritingAssistant
            projectId={projectId}
            documents={docs}
            initialDocId={docId ?? undefined}
          />
        </div>
      </div>
    </div>
  )
}
