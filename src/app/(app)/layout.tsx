import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { auth } from "@/lib/auth"
import { getProjectRepo } from "@/lib/repositories"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const allProjects = await getProjectRepo().findManyByUser(session.user.id, "ACTIVE")
  const projects = allProjects.map((p) => ({ id: p.id, name: p.name }))

  return (
    <SidebarProvider>
      <AppSidebar
        projects={projects}
        userName={session.user.name}
      />
      <SidebarInset>{children}</SidebarInset>
    </SidebarProvider>
  )
}
