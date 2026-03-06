import { prisma } from "@/lib/prisma"
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

  const documents = await prisma.document.findMany({
    where: { projectId },
    select: { id: true, title: true, phase: true, docType: true, content: true },
    orderBy: [{ phase: "asc" }, { sortOrder: "asc" }],
  })

  return (
    <div className="flex min-h-0 flex-1">
      <ProjectSidebar projectId={projectId} documents={documents} />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  )
}
