import { prisma } from "@/lib/prisma"
import type { Project, ProjectStatus } from "@/lib/types"
import type { ProjectRepo, CreateProjectData } from "../interfaces/project-repo"

function toProject(row: Record<string, unknown>): Project {
  return {
    ...row,
    techStack: Array.isArray(row.techStack) ? row.techStack : JSON.parse(String(row.techStack ?? "[]")),
  } as Project
}

export class CloudProjectRepo implements ProjectRepo {
  async findById(id: string): Promise<Project | null> {
    const row = await prisma.project.findUnique({ where: { id } })
    return row ? toProject(row as Record<string, unknown>) : null
  }

  async findByIdAndUser(id: string, userId: string): Promise<Project | null> {
    const row = await prisma.project.findUnique({
      where: { id, userId },
    })
    return row ? toProject(row as Record<string, unknown>) : null
  }

  async findManyByUser(
    userId: string,
    status?: ProjectStatus
  ): Promise<Project[]> {
    const rows = await prisma.project.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
    })
    return rows.map((r) => toProject(r as Record<string, unknown>))
  }

  async findManyByUserWithDocCount(
    userId: string,
    status?: ProjectStatus
  ): Promise<(Project & { _count: { documents: number } })[]> {
    const rows = await prisma.project.findMany({
      where: { userId, ...(status ? { status } : {}) },
      orderBy: { updatedAt: "desc" },
      include: {
        documents: {
          where: { content: { not: "" } },
          select: { id: true },
        },
      },
    })
    return rows.map((r) => ({
      ...toProject(r as Record<string, unknown>),
      _count: { documents: r.documents.length },
    }))
  }

  async countByUser(userId: string, status?: ProjectStatus): Promise<number> {
    return prisma.project.count({
      where: { userId, ...(status ? { status } : {}) },
    })
  }

  async create(data: CreateProjectData): Promise<Project> {
    const row = await prisma.project.create({ data })
    return toProject(row as Record<string, unknown>)
  }

  async update(
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "techStack" | "status">>
  ): Promise<Project> {
    const row = await prisma.project.update({ where: { id }, data })
    return toProject(row as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    await prisma.project.delete({ where: { id } })
  }
}
