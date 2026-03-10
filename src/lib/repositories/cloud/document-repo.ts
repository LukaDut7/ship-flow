import { prisma } from "@/lib/prisma"
import type { Document, DocumentLink, Phase, DocType, LinkType } from "@/lib/types"
import type { DocumentRepo, DocumentLinkRepo } from "../interfaces/document-repo"

export class CloudDocumentRepo implements DocumentRepo {
  async findById(id: string): Promise<Document | null> {
    return prisma.document.findUnique({ where: { id } }) as Promise<Document | null>
  }

  async findByIdWithProject(
    id: string
  ): Promise<(Document & { project: { userId: string; id: string } }) | null> {
    return prisma.document.findUnique({
      where: { id },
      include: { project: { select: { userId: true, id: true } } },
    }) as Promise<(Document & { project: { userId: string; id: string } }) | null>
  }

  async findByIdWithLinks(id: string) {
    return prisma.document.findUnique({
      where: { id },
      include: {
        linksFrom: {
          include: { toDoc: { select: { id: true, title: true } } },
        },
        linksTo: {
          include: { fromDoc: { select: { id: true, title: true } } },
        },
      },
    }) as ReturnType<DocumentRepo["findByIdWithLinks"]>
  }

  async findManyByProject(
    projectId: string,
    options?: {
      select?: (keyof Document)[]
      orderBy?: Array<{ field: keyof Document; direction: "asc" | "desc" }>
    }
  ): Promise<Document[]> {
    const orderBy = options?.orderBy?.map((o) => ({ [o.field]: o.direction })) ?? [
      { phase: "asc" as const },
      { sortOrder: "asc" as const },
    ]
    return prisma.document.findMany({
      where: { projectId },
      orderBy,
    }) as Promise<Document[]>
  }

  async findManyByIds(
    ids: string[],
    projectId: string,
    options?: {
      select?: (keyof Document)[]
      orderBy?: Array<{ field: keyof Document; direction: "asc" | "desc" }>
    }
  ): Promise<Document[]> {
    const orderBy = options?.orderBy?.map((o) => ({ [o.field]: o.direction })) ?? [
      { sortOrder: "asc" as const },
    ]
    return prisma.document.findMany({
      where: { id: { in: ids }, projectId },
      orderBy,
    }) as Promise<Document[]>
  }

  async getMaxSortOrder(projectId: string): Promise<number> {
    const result = await prisma.document.aggregate({
      where: { projectId },
      _max: { sortOrder: true },
    })
    return result._max.sortOrder ?? 0
  }

  async create(data: {
    projectId: string
    title: string
    content: string
    phase: Phase
    docType: DocType
    sortOrder: number
    isFromTemplate: boolean
  }): Promise<Document> {
    return prisma.document.create({ data }) as Promise<Document>
  }

  async update(
    id: string,
    data: Partial<Pick<Document, "title" | "content" | "updatedAt">>
  ): Promise<Document> {
    return prisma.document.update({ where: { id }, data }) as Promise<Document>
  }

  async delete(id: string): Promise<void> {
    await prisma.document.delete({ where: { id } })
  }
}

export class CloudDocumentLinkRepo implements DocumentLinkRepo {
  async findByFromDoc(fromDocId: string) {
    return prisma.documentLink.findMany({
      where: { fromDocId },
      include: { toDoc: true },
    }) as ReturnType<DocumentLinkRepo["findByFromDoc"]>
  }

  async findByUniqueKey(
    fromDocId: string,
    toDocId: string
  ): Promise<DocumentLink | null> {
    return prisma.documentLink.findUnique({
      where: { fromDocId_toDocId: { fromDocId, toDocId } },
    }) as Promise<DocumentLink | null>
  }

  async findByIdWithFromDoc(
    id: string
  ): Promise<(DocumentLink & { fromDoc: { projectId: string } }) | null> {
    return prisma.documentLink.findUnique({
      where: { id },
      include: { fromDoc: { select: { projectId: true } } },
    }) as Promise<(DocumentLink & { fromDoc: { projectId: string } }) | null>
  }

  async create(data: {
    fromDocId: string
    toDocId: string
    linkType: LinkType
  }): Promise<DocumentLink> {
    return prisma.documentLink.create({ data }) as Promise<DocumentLink>
  }

  async createMany(
    data: Array<{ fromDocId: string; toDocId: string; linkType: LinkType }>
  ): Promise<void> {
    if (data.length > 0) {
      await prisma.documentLink.createMany({ data })
    }
  }

  async delete(id: string): Promise<void> {
    await prisma.documentLink.delete({ where: { id } })
  }
}
