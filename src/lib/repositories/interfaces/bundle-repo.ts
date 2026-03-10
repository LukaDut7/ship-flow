import type { ContextBundle, BundleDocument, Document } from "@/lib/types"

export interface BundleRepo {
  findById(id: string): Promise<ContextBundle | null>
  findByIdWithProject(
    id: string
  ): Promise<
    (ContextBundle & { project: { id: string; userId: string } }) | null
  >
  findByIdAndProject(
    id: string,
    projectId: string
  ): Promise<
    | (ContextBundle & {
        documents: (BundleDocument & { document: Document })[]
      })
    | null
  >
  findByIdWithProjectAndDocs(
    id: string
  ): Promise<
    | (ContextBundle & {
        project: {
          userId: string
          name: string
          description: string
          techStack: string[]
        }
        documents: (BundleDocument & { document: Document })[]
      })
    | null
  >
  findManyByProject(
    projectId: string
  ): Promise<(ContextBundle & { _count: { documents: number } })[]>
  create(data: {
    projectId: string
    name: string
    description: string
    documentIds: string[]
  }): Promise<ContextBundle>
  update(
    id: string,
    data: {
      name: string
      description: string
      documentIds: string[]
    }
  ): Promise<void>
  delete(id: string): Promise<void>
}
