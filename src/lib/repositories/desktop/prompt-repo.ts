import { eq, and, inArray, gte, sql, count } from "drizzle-orm"
import { getDesktopDb } from "./db"
import { generatedPrompts, documents } from "./schema"
import { generateId } from "./id"
import type { GeneratedPrompt, TargetTool, Document } from "@/lib/types"
import type { PromptRepo } from "../interfaces/prompt-repo"

function rowToPrompt(row: typeof generatedPrompts.$inferSelect): GeneratedPrompt {
  return {
    id: row.id,
    projectId: row.projectId,
    documentId: row.documentId,
    targetTool: row.targetTool as TargetTool,
    promptContent: row.promptContent,
    options: JSON.parse(row.options),
    createdAt: row.createdAt,
  }
}

export class DesktopPromptRepo implements PromptRepo {
  async findById(id: string): Promise<GeneratedPrompt | null> {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(generatedPrompts)
      .where(eq(generatedPrompts.id, id))
      .limit(1)
    return rows[0] ? rowToPrompt(rows[0]) : null
  }

  async findByIdWithProject(id: string) {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(generatedPrompts)
      .where(eq(generatedPrompts.id, id))
      .limit(1)
    if (!rows[0]) return null
    const { projects } = await import("./schema")
    const projRows = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(eq(projects.id, rows[0].projectId))
      .limit(1)
    if (!projRows[0]) return null
    return { ...rowToPrompt(rows[0]), project: { userId: projRows[0].userId } }
  }

  async findManyByProject(projectId: string) {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(generatedPrompts)
      .where(eq(generatedPrompts.projectId, projectId))
      .orderBy(sql`${generatedPrompts.createdAt} DESC`)
    const result: (GeneratedPrompt & { document: Pick<Document, "title"> | null })[] = []
    for (const row of rows) {
      let doc: Pick<Document, "title"> | null = null
      if (row.documentId) {
        const docRows = await db
          .select({ title: documents.title })
          .from(documents)
          .where(eq(documents.id, row.documentId))
          .limit(1)
        doc = docRows[0] ?? null
      }
      result.push({ ...rowToPrompt(row), document: doc })
    }
    return result
  }

  async countByUserProjects(projectIds: string[], since: Date): Promise<number> {
    if (projectIds.length === 0) return 0
    const db = getDesktopDb()
    const rows = await db
      .select({ cnt: count() })
      .from(generatedPrompts)
      .where(
        and(
          inArray(generatedPrompts.projectId, projectIds),
          gte(generatedPrompts.createdAt, since)
        )
      )
    return rows[0]?.cnt ?? 0
  }

  async create(data: {
    projectId: string
    documentId: string | null
    targetTool: TargetTool
    promptContent: string
    options: Record<string, unknown>
  }): Promise<GeneratedPrompt> {
    const db = getDesktopDb()
    const id = generateId()
    const now = new Date()
    await db.insert(generatedPrompts).values({
      id,
      projectId: data.projectId,
      documentId: data.documentId,
      targetTool: data.targetTool,
      promptContent: data.promptContent,
      options: JSON.stringify(data.options),
      createdAt: now,
    })
    return (await this.findById(id))!
  }

  async delete(id: string): Promise<void> {
    const db = getDesktopDb()
    await db.delete(generatedPrompts).where(eq(generatedPrompts.id, id))
  }
}
