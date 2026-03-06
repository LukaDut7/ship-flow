import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { requireProjectAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, PHASES, PHASE_LABELS } from "@/lib/constants"
import { timeAgo } from "@/lib/time-ago"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import type { DocType, Phase } from "@prisma/client"

export default async function DocsPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ phase?: string }>
}) {
  const { projectId } = await params
  const { phase: phaseParam } = await searchParams
  await requireProjectAccess(projectId)

  const documents = await prisma.document.findMany({
    where: { projectId },
    orderBy: [{ phase: "asc" }, { sortOrder: "asc" }],
  })

  const initialTab =
    phaseParam && PHASES.includes(phaseParam as Phase) ? phaseParam : "all"

  const docsByPhase = (phase: Phase) =>
    documents.filter((d) => d.phase === phase)

  return (
    <div className="flex h-full flex-col">
      <Header title="Documents" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <Tabs defaultValue={initialTab} key={initialTab}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <TabsList className="flex-wrap lg:flex-nowrap">
                <TabsTrigger value="all">All</TabsTrigger>
                {PHASES.map((phase) => (
                  <TabsTrigger key={phase} value={phase}>
                    {PHASE_LABELS[phase]}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Link href={`/projects/${projectId}/docs/new`}>
                <Button className="w-full shrink-0 sm:w-auto">
                  New Document
                </Button>
              </Link>
            </div>
            <TabsContent value="all" className="mt-4">
              <DocGrid documents={documents} projectId={projectId} />
            </TabsContent>
            {PHASES.map((phase) => (
              <TabsContent key={phase} value={phase} className="mt-4">
                <DocGrid
                  documents={docsByPhase(phase)}
                  projectId={projectId}
                />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  )
}

function DocGrid({
  documents,
  projectId,
}: {
  documents: Array<{
    id: string
    title: string
    phase: Phase
    docType: string
    content: string
    updatedAt: Date
  }>
  projectId: string
}) {
  if (documents.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No documents in this category.
      </p>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <Link key={doc.id} href={`/projects/${projectId}/docs/${doc.id}`}>
          <Card className="h-full transition-colors hover:bg-muted/50">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-medium line-clamp-2">{doc.title}</h3>
                <Badge variant="secondary" className="shrink-0 text-[10px]">
                  {PHASE_LABELS[doc.phase]}
                </Badge>
              </div>
              <Badge variant="outline" className="w-fit text-[10px]">
                {DOC_TYPE_LABELS[doc.docType as DocType]}
              </Badge>
            </CardHeader>
            <CardContent className="pt-0">
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {doc.content.slice(0, 100)}
                {doc.content.length > 100 ? "…" : ""}
              </p>
              <p className="mt-2 text-[10px] text-muted-foreground">
                Updated {timeAgo(doc.updatedAt)}
              </p>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
