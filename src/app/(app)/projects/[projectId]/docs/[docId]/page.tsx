import { getDocumentRepo } from "@/lib/repositories"
import { requireDocAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, PHASE_LABELS } from "@/lib/constants"
import { timeAgo } from "@/lib/time-ago"
import { Header } from "@/components/layout/header"
import { DocPageContent } from "@/components/documents/doc-page-content"

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

  const documentRepo = getDocumentRepo()
  const [docWithLinks, allProjectDocs] = await Promise.all([
    documentRepo.findByIdWithLinks(docId),
    documentRepo.findManyByProject(projectId),
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

  // Build linked docs list for the writing panel (only outgoing — docs this one depends on)
  const linkedDocs = docWithLinks.linksFrom.map((l) => ({
    docId: l.toDoc.id,
    docTitle: l.toDoc.title,
    linkType: l.linkType,
  }))

  return (
    <div className="flex h-full flex-col">
      <Header title={docWithLinks.title} />
      <DocPageContent
        docId={docId}
        projectId={projectId}
        title={docWithLinks.title}
        content={docWithLinks.content}
        phase={docWithLinks.phase}
        docType={docWithLinks.docType}
        phaseLabel={PHASE_LABELS[docWithLinks.phase]}
        docTypeLabel={DOC_TYPE_LABELS[docWithLinks.docType]}
        updatedAgo={timeAgo(docWithLinks.updatedAt)}
        wordCount={wordCount(docWithLinks.content)}
        linkedDocs={linkedDocs}
        linksFrom={linksFrom}
        linksTo={linksTo}
        allDocs={allProjectDocs}
      />
    </div>
  )
}
