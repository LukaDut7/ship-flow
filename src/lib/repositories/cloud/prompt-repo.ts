import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { GeneratedPrompt, TargetTool, Document } from "@/lib/types"
import type { PromptRepo } from "../interfaces/prompt-repo"

export class CloudPromptRepo implements PromptRepo {
  async findById(id: string): Promise<GeneratedPrompt | null> {
    return prisma.generatedPrompt.findUnique({
      where: { id },
    }) as Promise<GeneratedPrompt | null>
  }

  async findByIdWithProject(
    id: string
  ): Promise<
    (GeneratedPrompt & { project: { userId: string } }) | null
  > {
    return prisma.generatedPrompt.findUnique({
      where: { id },
      include: { project: { select: { userId: true } } },
    }) as Promise<
      (GeneratedPrompt & { project: { userId: string } }) | null
    >
  }

  async findManyByProject(
    projectId: string
  ): Promise<
    (GeneratedPrompt & { document: Pick<Document, "title"> | null })[]
  > {
    return prisma.generatedPrompt.findMany({
      where: { projectId },
      orderBy: { createdAt: "desc" },
      include: { document: { select: { title: true } } },
    }) as Promise<
      (GeneratedPrompt & { document: Pick<Document, "title"> | null })[]
    >
  }

  async countByUserProjects(
    projectIds: string[],
    since: Date
  ): Promise<number> {
    return prisma.generatedPrompt.count({
      where: {
        projectId: { in: projectIds },
        createdAt: { gte: since },
      },
    })
  }

  async create(data: {
    projectId: string
    documentId: string | null
    targetTool: TargetTool
    promptContent: string
    options: Record<string, unknown>
  }): Promise<GeneratedPrompt> {
    return prisma.generatedPrompt.create({
      data: { ...data, options: data.options as Prisma.InputJsonValue },
    }) as Promise<GeneratedPrompt>
  }

  async delete(id: string): Promise<void> {
    await prisma.generatedPrompt.delete({ where: { id } })
  }
}
