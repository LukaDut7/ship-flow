import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { PromptHistoryList } from "@/components/prompts/prompt-history-list"

export default async function PromptsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  await requireProjectAccess(projectId)

  const prompts = await prisma.generatedPrompt.findMany({
    where: { projectId },
    orderBy: { createdAt: "desc" },
    include: {
      document: { select: { title: true } },
    },
  })

  const items = prompts.map((p) => ({
    id: p.id,
    targetTool: p.targetTool,
    promptContent: p.promptContent,
    createdAt: p.createdAt.toISOString(),
    document: p.document ? { title: p.document.title } : null,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title="Prompt History" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex justify-end">
            <Link href={`/projects/${projectId}/prompts/generate`}>
              <Button>Generate Prompt</Button>
            </Link>
          </div>
          <PromptHistoryList prompts={items} projectId={projectId} />
        </div>
      </div>
    </div>
  )
}
