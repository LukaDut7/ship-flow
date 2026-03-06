import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { ProjectSettingsForm } from "@/components/projects/project-settings-form"
import { DangerZoneCard } from "@/components/projects/danger-zone-card"

export default async function ProjectSettingsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { project } = await requireProjectAccess(projectId)

  const techStack = (project.techStack as string[]) ?? []

  return (
    <>
      <Header title="Project Settings" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <ProjectSettingsForm
          projectId={project.id}
          initialName={project.name}
          initialDescription={project.description}
          initialTechStack={techStack}
        />
        <DangerZoneCard projectId={project.id} />
      </div>
    </>
  )
}
