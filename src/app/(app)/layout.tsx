import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const projects = await prisma.project.findMany({
    where: { userId: session.user.id, status: "ACTIVE" },
    select: { id: true, name: true },
    orderBy: { updatedAt: "desc" },
  })

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
