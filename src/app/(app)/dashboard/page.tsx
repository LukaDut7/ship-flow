import { requireAuth } from "@/lib/auth-guard"
import { getProjectRepo } from "@/lib/repositories"
import { Header } from "@/components/layout/header"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProjectCard } from "@/components/projects/project-card"
import Link from "next/link"

export default async function DashboardPage() {
  const user = await requireAuth()

  const projectsWithCount = await getProjectRepo().findManyByUserWithDocCount(user.id, "ACTIVE")

  return (
    <>
      <Header title="Dashboard" />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex justify-end">
          <Button asChild size="sm">
            <Link href="/projects/new">New Project</Link>
          </Button>
        </div>
        {projectsWithCount.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16">
            <CardHeader>
              <CardTitle>No projects yet</CardTitle>
              <CardDescription>
                Create your first project to get started.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild>
                <Link href="/projects/new">Create Project</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {projectsWithCount.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </>
  )
}
