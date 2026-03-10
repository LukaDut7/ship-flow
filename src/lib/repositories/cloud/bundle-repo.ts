import { prisma } from "@/lib/prisma"
import type { ContextBundle, BundleDocument, Document } from "@/lib/types"
import type { BundleRepo } from "../interfaces/bundle-repo"

export class CloudBundleRepo implements BundleRepo {
  async findById(id: string): Promise<ContextBundle | null> {
    return prisma.contextBundle.findUnique({
      where: { id },
    }) as Promise<ContextBundle | null>
  }

  async findByIdWithProject(
    id: string
  ): Promise<
    (ContextBundle & { project: { id: string; userId: string } }) | null
  > {
    return prisma.contextBundle.findUnique({
      where: { id },
      include: { project: { select: { id: true, userId: true } } },
    }) as Promise<
      (ContextBundle & { project: { id: string; userId: string } }) | null
    >
  }

  async findByIdAndProject(
    id: string,
    projectId: string
  ) {
    return prisma.contextBundle.findUnique({
      where: { id, projectId },
      include: {
        documents: {
          include: { document: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    }) as ReturnType<BundleRepo["findByIdAndProject"]>
  }

  async findByIdWithProjectAndDocs(id: string) {
    const result = await prisma.contextBundle.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            userId: true,
            name: true,
            description: true,
            techStack: true,
          },
        },
        documents: {
          orderBy: { sortOrder: "asc" },
          include: { document: true },
        },
      },
    })
    if (!result) return null
    return {
      ...result,
      project: {
        ...result.project,
        techStack: Array.isArray(result.project.techStack)
          ? result.project.techStack
          : JSON.parse(String(result.project.techStack ?? "[]")),
      },
    } as Awaited<ReturnType<BundleRepo["findByIdWithProjectAndDocs"]>>
  }

  async findManyByProject(
    projectId: string
  ): Promise<(ContextBundle & { _count: { documents: number } })[]> {
    return prisma.contextBundle.findMany({
      where: { projectId },
      include: { _count: { select: { documents: true } } },
      orderBy: { name: "asc" },
    }) as Promise<(ContextBundle & { _count: { documents: number } })[]>
  }

  async create(data: {
    projectId: string
    name: string
    description: string
    documentIds: string[]
  }): Promise<ContextBundle> {
    return prisma.contextBundle.create({
      data: {
        projectId: data.projectId,
        name: data.name,
        description: data.description,
        documents: {
          create: data.documentIds.map((documentId, index) => ({
            documentId,
            sortOrder: index,
          })),
        },
      },
    }) as Promise<ContextBundle>
  }

  async update(
    id: string,
    data: { name: string; description: string; documentIds: string[] }
  ): Promise<void> {
    await prisma.$transaction([
      prisma.bundleDocument.deleteMany({ where: { bundleId: id } }),
      prisma.contextBundle.update({
        where: { id },
        data: {
          name: data.name,
          description: data.description,
          documents: {
            create: data.documentIds.map((documentId, index) => ({
              documentId,
              sortOrder: index,
            })),
          },
        },
      }),
    ])
  }

  async delete(id: string): Promise<void> {
    await prisma.contextBundle.delete({ where: { id } })
  }
}
