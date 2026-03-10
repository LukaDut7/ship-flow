import { getDocumentRepo } from "@/lib/repositories"
import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { BundleForm } from "@/components/bundles/bundle-form"

export default async function NewBundlePage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  await requireProjectAccess(projectId)

  const documents = await getDocumentRepo().findManyByProject(projectId)

  const docs = documents.map((d) => ({
    id: d.id,
    title: d.title,
    phase: d.phase,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title="New Bundle" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-2xl">
          <BundleForm projectId={projectId} documents={docs} />
        </div>
      </div>
    </div>
  )
}
