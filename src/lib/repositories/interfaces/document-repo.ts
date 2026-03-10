import type { Document, DocumentLink, Phase, DocType, LinkType } from "@/lib/types"

export interface DocumentRepo {
  findById(id: string): Promise<Document | null>
  findByIdWithProject(
    id: string
  ): Promise<(Document & { project: { userId: string; id: string } }) | null>
  findByIdWithLinks(
    id: string
  ): Promise<
    | (Document & {
        linksFrom: (DocumentLink & { toDoc: Pick<Document, "id" | "title"> })[]
        linksTo: (DocumentLink & { fromDoc: Pick<Document, "id" | "title"> })[]
      })
    | null
  >
  findManyByProject(
    projectId: string,
    options?: {
      select?: (keyof Document)[]
      orderBy?: Array<{ field: keyof Document; direction: "asc" | "desc" }>
    }
  ): Promise<Document[]>
  findManyByIds(
    ids: string[],
    projectId: string,
    options?: {
      select?: (keyof Document)[]
      orderBy?: Array<{ field: keyof Document; direction: "asc" | "desc" }>
    }
  ): Promise<Document[]>
  getMaxSortOrder(projectId: string): Promise<number>
  create(data: {
    projectId: string
    title: string
    content: string
    phase: Phase
    docType: DocType
    sortOrder: number
    isFromTemplate: boolean
  }): Promise<Document>
  update(
    id: string,
    data: Partial<Pick<Document, "title" | "content" | "updatedAt">>
  ): Promise<Document>
  delete(id: string): Promise<void>
}

export interface DocumentLinkRepo {
  findByFromDoc(
    fromDocId: string
  ): Promise<
    (DocumentLink & {
      toDoc: Pick<Document, "id" | "title" | "content" | "phase">
    })[]
  >
  findByUniqueKey(
    fromDocId: string,
    toDocId: string
  ): Promise<DocumentLink | null>
  findByIdWithFromDoc(
    id: string
  ): Promise<(DocumentLink & { fromDoc: { projectId: string } }) | null>
  create(data: {
    fromDocId: string
    toDocId: string
    linkType: LinkType
  }): Promise<DocumentLink>
  createMany(
    data: Array<{ fromDocId: string; toDocId: string; linkType: LinkType }>
  ): Promise<void>
  delete(id: string): Promise<void>
}
