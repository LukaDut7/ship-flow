import { prisma } from "@/lib/prisma"
import type { LinkType } from "@prisma/client"

export interface ResolvedDoc {
  title: string
  content: string
  phase: string
  linkType: string
}

export interface ResolveContextResult {
  linkedDocs: ResolvedDoc[]
  optionalDocs: ResolvedDoc[]
}

const AUTO_INCLUDE_LINK_TYPES: LinkType[] = ["DEPENDS_ON", "IMPLEMENTS"]
const OPTIONAL_LINK_TYPES: LinkType[] = ["REFERENCES"]
const EXCLUDED_LINK_TYPES: LinkType[] = ["SUPERSEDES"]

/**
 * Resolves linked documents for prompt assembly.
 * - DEPENDS_ON and IMPLEMENTS → linkedDocs (auto-included)
 * - REFERENCES → optionalDocs (user can toggle)
 * - SUPERSEDES targets → excluded entirely
 * - Depth limit: 1 level (no recursion)
 */
export async function resolveContext(
  documentId: string
): Promise<ResolveContextResult> {
  const links = await prisma.documentLink.findMany({
    where: { fromDocId: documentId },
    include: { toDoc: true },
  })

  const linkedDocs: ResolvedDoc[] = []
  const optionalDocs: ResolvedDoc[] = []

  for (const link of links) {
    if (EXCLUDED_LINK_TYPES.includes(link.linkType)) {
      continue
    }

    const doc = {
      title: link.toDoc.title,
      content: link.toDoc.content,
      phase: link.toDoc.phase,
      linkType: link.linkType,
    }

    if (AUTO_INCLUDE_LINK_TYPES.includes(link.linkType)) {
      linkedDocs.push(doc)
    } else if (OPTIONAL_LINK_TYPES.includes(link.linkType)) {
      optionalDocs.push(doc)
    }
  }

  return { linkedDocs, optionalDocs }
}
