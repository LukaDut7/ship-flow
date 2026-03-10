import type { GeneratedPrompt, TargetTool, Document } from "@/lib/types"

export interface PromptRepo {
  findById(id: string): Promise<GeneratedPrompt | null>
  findByIdWithProject(
    id: string
  ): Promise<
    (GeneratedPrompt & { project: { userId: string } }) | null
  >
  findManyByProject(
    projectId: string
  ): Promise<
    (GeneratedPrompt & { document: Pick<Document, "title"> | null })[]
  >
  countByUserProjects(
    projectIds: string[],
    since: Date
  ): Promise<number>
  create(data: {
    projectId: string
    documentId: string | null
    targetTool: TargetTool
    promptContent: string
    options: Record<string, unknown>
  }): Promise<GeneratedPrompt>
  delete(id: string): Promise<void>
}
