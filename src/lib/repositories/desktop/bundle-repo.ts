import { eq, and } from "drizzle-orm"
import { getDesktopDb } from "./db"
import { contextBundles, bundleDocuments, documents, projects } from "./schema"
import { generateId } from "./id"
import type { ContextBundle, BundleDocument, Document } from "@/lib/types"
import type { BundleRepo } from "../interfaces/bundle-repo"

function rowToBundle(row: typeof contextBundles.$inferSelect): ContextBundle {
  return {
    id: row.id,
    projectId: row.projectId,
    name: row.name,
    description: row.description,
    isPreset: row.isPreset,
  }
}

function rowToDocument(row: typeof documents.$inferSelect): Document {
  return {
    id: row.id,
    projectId: row.projectId,
    title: row.title,
    content: row.content,
    phase: row.phase,
    docType: row.docType,
    sortOrder: row.sortOrder,
    isFromTemplate: row.isFromTemplate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  } as Document
}

export class DesktopBundleRepo implements BundleRepo {
  async findById(id: string): Promise<ContextBundle | null> {
    const db = getDesktopDb()
    const rows = await db.select().from(contextBundles).where(eq(contextBundles.id, id)).limit(1)
    return rows[0] ? rowToBundle(rows[0]) : null
  }

  async findByIdWithProject(id: string) {
    const db = getDesktopDb()
    const rows = await db.select().from(contextBundles).where(eq(contextBundles.id, id)).limit(1)
    if (!rows[0]) return null
    const projRows = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, rows[0].projectId))
      .limit(1)
    if (!projRows[0]) return null
    return { ...rowToBundle(rows[0]), project: projRows[0] }
  }

  async findByIdAndProject(id: string, projectId: string) {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(contextBundles)
      .where(and(eq(contextBundles.id, id), eq(contextBundles.projectId, projectId)))
      .limit(1)
    if (!rows[0]) return null
    const bundle = rowToBundle(rows[0])

    const bdRows = await db
      .select()
      .from(bundleDocuments)
      .where(eq(bundleDocuments.bundleId, id))
      .orderBy(bundleDocuments.sortOrder)
    const docs: (BundleDocument & { document: Document })[] = []
    for (const bd of bdRows) {
      const docRows = await db.select().from(documents).where(eq(documents.id, bd.documentId)).limit(1)
      if (docRows[0]) {
        docs.push({
          id: bd.id,
          bundleId: bd.bundleId,
          documentId: bd.documentId,
          sortOrder: bd.sortOrder,
          document: rowToDocument(docRows[0]),
        })
      }
    }
    return { ...bundle, documents: docs }
  }

  async findByIdWithProjectAndDocs(id: string) {
    const db = getDesktopDb()
    const rows = await db.select().from(contextBundles).where(eq(contextBundles.id, id)).limit(1)
    if (!rows[0]) return null
    const bundle = rowToBundle(rows[0])

    const projRows = await db
      .select()
      .from(projects)
      .where(eq(projects.id, rows[0].projectId))
      .limit(1)
    if (!projRows[0]) return null

    const bdRows = await db
      .select()
      .from(bundleDocuments)
      .where(eq(bundleDocuments.bundleId, id))
      .orderBy(bundleDocuments.sortOrder)
    const docs: (BundleDocument & { document: Document })[] = []
    for (const bd of bdRows) {
      const docRows = await db.select().from(documents).where(eq(documents.id, bd.documentId)).limit(1)
      if (docRows[0]) {
        docs.push({
          id: bd.id,
          bundleId: bd.bundleId,
          documentId: bd.documentId,
          sortOrder: bd.sortOrder,
          document: rowToDocument(docRows[0]),
        })
      }
    }

    return {
      ...bundle,
      project: {
        userId: projRows[0].userId,
        name: projRows[0].name,
        description: projRows[0].description,
        techStack: JSON.parse(projRows[0].techStack) as string[],
      },
      documents: docs,
    }
  }

  async findManyByProject(projectId: string) {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(contextBundles)
      .where(eq(contextBundles.projectId, projectId))
      .orderBy(contextBundles.name)
    const result: (ContextBundle & { _count: { documents: number } })[] = []
    for (const row of rows) {
      const countRows = await db
        .select({ cnt: bundleDocuments.id })
        .from(bundleDocuments)
        .where(eq(bundleDocuments.bundleId, row.id))
      result.push({ ...rowToBundle(row), _count: { documents: countRows.length } })
    }
    return result
  }

  async create(data: {
    projectId: string
    name: string
    description: string
    documentIds: string[]
  }): Promise<ContextBundle> {
    const db = getDesktopDb()
    const id = generateId()
    await db.insert(contextBundles).values({
      id,
      projectId: data.projectId,
      name: data.name,
      description: data.description,
    })
    if (data.documentIds.length > 0) {
      await db.insert(bundleDocuments).values(
        data.documentIds.map((docId, index) => ({
          id: generateId(),
          bundleId: id,
          documentId: docId,
          sortOrder: index,
        }))
      )
    }
    return (await this.findById(id))!
  }

  async update(id: string, data: { name: string; description: string; documentIds: string[] }): Promise<void> {
    const db = getDesktopDb()
    await db.delete(bundleDocuments).where(eq(bundleDocuments.bundleId, id))
    await db
      .update(contextBundles)
      .set({ name: data.name, description: data.description })
      .where(eq(contextBundles.id, id))
    if (data.documentIds.length > 0) {
      await db.insert(bundleDocuments).values(
        data.documentIds.map((docId, index) => ({
          id: generateId(),
          bundleId: id,
          documentId: docId,
          sortOrder: index,
        }))
      )
    }
  }

  async delete(id: string): Promise<void> {
    const db = getDesktopDb()
    await db.delete(contextBundles).where(eq(contextBundles.id, id))
  }
}
