import { prisma } from "@/lib/prisma"
import { requireDocAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, PHASE_LABELS } from "@/lib/constants"
import { timeAgo } from "@/lib/time-ago"
import { Header } from "@/components/layout/header"
import { DocEditor } from "@/components/documents/doc-editor"
import { DocDeleteButton } from "@/components/documents/doc-delete-button"
import { DocExportButton } from "@/components/documents/doc-export-button"
import { LinkManagerPanel } from "@/components/documents/link-manager-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export default async function DocPage({
  params,
}: {
  params: Promise<{ projectId: string; docId: string }>
}) {
  const { projectId, docId } = await params
  const { doc } = await requireDocAccess(docId)

  const [docWithLinks, allProjectDocs] = await Promise.all([
    prisma.document.findUnique({
      where: { id: docId },
      include: {
        linksFrom: { include: { toDoc: { select: { id: true, title: true } } } },
        linksTo: { include: { fromDoc: { select: { id: true, title: true } } } },
      },
    }),
    prisma.document.findMany({
      where: { projectId },
      select: { id: true, title: true },
      orderBy: { sortOrder: "asc" },
    }),
  ])

  if (!docWithLinks) return null

  const linksFrom = docWithLinks.linksFrom.map((l) => ({
    id: l.id,
    linkType: l.linkType,
    toDoc: l.toDoc,
  }))
  const linksTo = docWithLinks.linksTo.map((l) => ({
    id: l.id,
    linkType: l.linkType,
    fromDoc: l.fromDoc,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title={docWithLinks.title} />
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <main className="flex-1 overflow-y-auto p-4">
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {PHASE_LABELS[docWithLinks.phase]}
              </Badge>
              <Badge variant="outline">
                {DOC_TYPE_LABELS[docWithLinks.docType]}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Updated {timeAgo(docWithLinks.updatedAt)}
              </span>
              <span className="text-xs text-muted-foreground">
                {wordCount(docWithLinks.content)} words
              </span>
              <Link
                href={`/projects/${projectId}/prompts/generate?docId=${docId}`}
              >
                <Button size="sm" variant="outline">
                  Generate Prompt
                </Button>
              </Link>
              <DocExportButton docId={docId} />
              <DocDeleteButton docId={docId} />
            </div>

            <DocEditor
              docId={docId}
              initialContent={docWithLinks.content}
              initialTitle={docWithLinks.title}
            />
          </div>
        </main>

        <aside className="flex flex-col border-t md:border-l md:border-t-0">
          <LinkManagerPanel
            docId={docId}
            projectId={projectId}
            linksFrom={linksFrom}
            linksTo={linksTo}
            allDocs={allProjectDocs}
          />
        </aside>
      </div>
    </div>
  )
}
