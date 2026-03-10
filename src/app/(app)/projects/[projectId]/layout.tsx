import { getDocumentRepo } from "@/lib/repositories"
import { requireProjectAccess } from "@/lib/auth-guard"
import { ProjectSidebar } from "@/components/layout/project-sidebar"

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { project } = await requireProjectAccess(projectId)

  const documents = await getDocumentRepo().findManyByProject(projectId)

  return (
    <div className="flex min-h-0 flex-1">
      <ProjectSidebar projectId={projectId} documents={documents} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
