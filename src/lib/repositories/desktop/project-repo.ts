import { eq, and, count, sql } from "drizzle-orm"
import { getDesktopDb } from "./db"
import { projects, documents } from "./schema"
import { generateId } from "./id"
import type { Project, ProjectStatus } from "@/lib/types"
import type { ProjectRepo, CreateProjectData } from "../interfaces/project-repo"

function rowToProject(row: typeof projects.$inferSelect): Project {
  return {
    id: row.id,
    userId: row.userId,
    name: row.name,
    description: row.description,
    techStack: JSON.parse(row.techStack),
    status: row.status as ProjectStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export class DesktopProjectRepo implements ProjectRepo {
  async findById(id: string): Promise<Project | null> {
    const db = getDesktopDb()
    const rows = await db.select().from(projects).where(eq(projects.id, id)).limit(1)
    return rows[0] ? rowToProject(rows[0]) : null
  }

  async findByIdAndUser(id: string, userId: string): Promise<Project | null> {
    const db = getDesktopDb()
    const rows = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, id), eq(projects.userId, userId)))
      .limit(1)
    return rows[0] ? rowToProject(rows[0]) : null
  }

  async findManyByUser(userId: string, status?: ProjectStatus): Promise<Project[]> {
    const db = getDesktopDb()
    const conditions = [eq(projects.userId, userId)]
    if (status) conditions.push(eq(projects.status, status))
    const rows = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(sql`${projects.updatedAt} DESC`)
    return rows.map(rowToProject)
  }

  async findManyByUserWithDocCount(
    userId: string,
    status?: ProjectStatus
  ): Promise<(Project & { _count: { documents: number } })[]> {
    const db = getDesktopDb()
    const conditions = [eq(projects.userId, userId)]
    if (status) conditions.push(eq(projects.status, status))
    const rows = await db
      .select()
      .from(projects)
      .where(and(...conditions))
      .orderBy(sql`${projects.updatedAt} DESC`)
    const result: (Project & { _count: { documents: number } })[] = []
    for (const row of rows) {
      const countRows = await db
        .select({ cnt: count() })
        .from(documents)
        .where(and(eq(documents.projectId, row.id), sql`${documents.content} != ''`))
      result.push({
        ...rowToProject(row),
        _count: { documents: countRows[0]?.cnt ?? 0 },
      })
    }
    return result
  }

  async countByUser(userId: string, status?: ProjectStatus): Promise<number> {
    const db = getDesktopDb()
    const conditions = [eq(projects.userId, userId)]
    if (status) conditions.push(eq(projects.status, status))
    const rows = await db
      .select({ cnt: count() })
      .from(projects)
      .where(and(...conditions))
    return rows[0]?.cnt ?? 0
  }

  async create(data: CreateProjectData): Promise<Project> {
    const db = getDesktopDb()
    const now = new Date()
    const id = generateId()
    await db.insert(projects).values({
      id,
      userId: data.userId,
      name: data.name,
      description: data.description,
      techStack: JSON.stringify(data.techStack),
      status: "ACTIVE",
      createdAt: now,
      updatedAt: now,
    })
    return (await this.findById(id))!
  }

  async update(
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "techStack" | "status">>
  ): Promise<Project> {
    const db = getDesktopDb()
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (data.name !== undefined) updateData.name = data.name
    if (data.description !== undefined) updateData.description = data.description
    if (data.techStack !== undefined) updateData.techStack = JSON.stringify(data.techStack)
    if (data.status !== undefined) updateData.status = data.status
    await db.update(projects).set(updateData).where(eq(projects.id, id))
    return (await this.findById(id))!
  }

  async delete(id: string): Promise<void> {
    const db = getDesktopDb()
    await db.delete(projects).where(eq(projects.id, id))
  }
}
