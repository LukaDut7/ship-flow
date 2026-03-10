import { eq, and, inArray, sql } from "drizzle-orm"
import { getDesktopDb } from "./db"
import { documents, documentLinks } from "./schema"
import { generateId } from "./id"
import type { Document, DocumentLink, Phase, DocType, LinkType } from "@/lib/types"
import type { DocumentRepo, DocumentLinkRepo } from "../interfaces/document-repo"

function rowToDocument(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    content: row.content,
    phase: row.phase as Phase,
    docType: row.docType as DocType,
    sortOrder: row.sortOrder,
    isFromTemplate: row.isFromTemplate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

function rowToLink(row: typeof documentLinks.$inferSelect): DocumentLink {
  return {
    id: row.id,
    fromDocId: row.fromDocId,
    toDocId: row.toDocId,
    linkType: row.linkType as LinkType,
  }
}

export class DesktopDocumentRepo implements DocumentRepo {
  async findById(id: string): Promise<Document | null> {
    const db = getDesktopDb()
    const rows = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
    return rows[0] ? rowToDocument(rows[0]) : null
  }

  async findByIdWithProject(id: string) {
    const db = getDesktopDb()
    const rows = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
    if (!rows[0]) return null
    const doc = rowToDocument(rows[0])
    // Load project userId
    const { projects } = await import("./schema")
    const projRows = await db
      .select({ userId: projects.userId, id: projects.id })
      .from(projects)
      .where(eq(projects.id, rows[0].projectId))
      .limit(1)
    if (!projRows[0]) return null
    return { ...doc, project: { userId: projRows[0].userId, id: projRows[0].id } }
  }

  async findByIdWithLinks(id: string) {
    const db = getDesktopDb()
    const rows = await db.select().from(documents).where(eq(documents.id, id)).limit(1)
    if (!rows[0]) return null
    const doc = rowToDocument(rows[0])

    // Links from this doc
    const fromLinks = await db
      .select()
      .from(documentLinks)
      .where(eq(documentLinks.fromDocId, id))
    const linksFrom = []
    for (const link of fromLinks) {
      const toDocRows = await db
        .select({ id: documents.id, title: documents.title })
        .from(documents)
        .where(eq(documents.id, link.toDocId))
        .limit(1)
      if (toDocRows[0]) {
        linksFrom.push({ ...rowToLink(link), toDoc: toDocRows[0] })
      }
    }

    // Links to this doc
    const toLinks = await db
      .select()
      .from(documentLinks)
      .where(eq(documentLinks.toDocId, id))
    const linksTo = []
    for (const link of toLinks) {
      const fromDocRows = await db
        .select({ id: documents.id, title: documents.title })
        .from(documents)
        .where(eq(documents.id, link.fromDocId))
        .limit(1)
      if (fromDocRows[0]) {
        linksTo.push({ ...rowToLink(link), fromDoc: fromDocRows[0] })
      }
    }

    return { ...doc, linksFrom, linksTo } as Awaited<ReturnType<DocumentRepo["findByIdWithLinks"]>>
  }

  async findManyByProject(
    projectId: string,
    options?: {
      select?: (keyof Document)[]
      orderBy?: Array<{ field: keyof Document; direction: "asc" | "desc" }>
    }
  ): Promise<Document[]> {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.projectId, projectId))
      .orderBy(sql`${documents.phase} ASC, ${documents.sortOrder} ASC`)
    return rows.map(rowToDocument)
  }

  async findManyByIds(
    ids: string[],
    projectId: string,
  ): Promise<Document[]> {
    if (ids.length === 0) return []
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(documents)
      .where(and(inArray(documents.id, ids), eq(documents.projectId, projectId)))
      .orderBy(sql`${documents.sortOrder} ASC`)
    return rows.map(rowToDocument)
  }

  async getMaxSortOrder(projectId: string): Promise<number> {
    const db = getDesktopDb()
    const rows = await db
      .select({ maxOrder: sql<number>`COALESCE(MAX(${documents.sortOrder}), 0)` })
      .from(documents)
      .where(eq(documents.projectId, projectId))
    return rows[0]?.maxOrder ?? 0
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
    const db = getDesktopDb()
    const now = new Date()
    const id = generateId()
    await db.insert(documents).values({
      id,
      projectId: data.projectId,
      title: data.title,
      content: data.content,
      phase: data.phase,
      docType: data.docType,
      sortOrder: data.sortOrder,
      isFromTemplate: data.isFromTemplate,
      createdAt: now,
      updatedAt: now,
    })
    return (await this.findById(id))!
  }

  async update(
    id: string,
    data: Partial<Pick<Document, "title" | "content" | "updatedAt">>
  ): Promise<Document> {
    const db = getDesktopDb()
    const updateData: Record<string, unknown> = {}
    if (data.title !== undefined) updateData.title = data.title
    if (data.content !== undefined) updateData.content = data.content
    updateData.updatedAt = data.updatedAt ?? new Date()
    await db.update(documents).set(updateData).where(eq(documents.id, id))
    return (await this.findById(id))!
  }

  async delete(id: string): Promise<void> {
    const db = getDesktopDb()
    await db.delete(documents).where(eq(documents.id, id))
  }
}

export class DesktopDocumentLinkRepo implements DocumentLinkRepo {
  async findByFromDoc(fromDocId: string) {
    const db = getDesktopDb()
    const links = await db
      .select()
      .from(documentLinks)
      .where(eq(documentLinks.fromDocId, fromDocId))
    const result = []
    for (const link of links) {
      const toDocRows = await db
        .select({
          id: documents.id,
          title: documents.title,
          content: documents.content,
          phase: documents.phase,
        })
        .from(documents)
        .where(eq(documents.id, link.toDocId))
        .limit(1)
      if (toDocRows[0]) {
        result.push({
          ...rowToLink(link),
          toDoc: toDocRows[0] as Pick<Document, "id" | "title" | "content" | "phase">,
        })
      }
    }
    return result
  }

  async findByUniqueKey(fromDocId: string, toDocId: string): Promise<DocumentLink | null> {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(documentLinks)
      .where(and(eq(documentLinks.fromDocId, fromDocId), eq(documentLinks.toDocId, toDocId)))
      .limit(1)
    return rows[0] ? rowToLink(rows[0]) : null
  }

  async findByIdWithFromDoc(id: string) {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(documentLinks)
      .where(eq(documentLinks.id, id))
      .limit(1)
    if (!rows[0]) return null
    const link = rowToLink(rows[0])
    const docRows = await db
      .select({ projectId: documents.projectId })
      .from(documents)
      .where(eq(documents.id, rows[0].fromDocId))
      .limit(1)
    if (!docRows[0]) return null
    return { ...link, fromDoc: { projectId: docRows[0].projectId } }
  }

  async create(data: { fromDocId: string; toDocId: string; linkType: LinkType }): Promise<DocumentLink> {
    const db = getDesktopDb()
    const id = generateId()
    await db.insert(documentLinks).values({ id, ...data })
    return { id, ...data }
  }

  async createMany(data: Array<{ fromDocId: string; toDocId: string; linkType: LinkType }>): Promise<void> {
    if (data.length === 0) return
    const db = getDesktopDb()
    const values = data.map((d) => ({ id: generateId(), ...d }))
    await db.insert(documentLinks).values(values)
  }

  async delete(id: string): Promise<void> {
    const db = getDesktopDb()
    await db.delete(documentLinks).where(eq(documentLinks.id, id))
  }
}
