import type { Project, Document, DocType, Phase, LinkType, ProjectStatus } from "@/lib/types"

export interface CreateProjectData {
  userId: string
  name: string
  description: string
  techStack: string[]
}

export interface CreateDocumentData {
  projectId: string
  title: string
  content: string
  phase: Phase
  docType: DocType
  sortOrder: number
  isFromTemplate: boolean
}

export interface CreateLinkData {
  fromDocId: string
  toDocId: string
  linkType: LinkType
}

export interface ProjectRepo {
  findById(id: string): Promise<Project | null>
  findByIdAndUser(id: string, userId: string): Promise<Project | null>
  findManyByUser(userId: string, status?: ProjectStatus): Promise<Project[]>
  findManyByUserWithDocCount(
    userId: string,
    status?: ProjectStatus
  ): Promise<(Project & { _count: { documents: number } })[]>
  countByUser(userId: string, status?: ProjectStatus): Promise<number>
  create(data: CreateProjectData): Promise<Project>
  update(
    id: string,
    data: Partial<Pick<Project, "name" | "description" | "techStack" | "status">>
  ): Promise<Project>
  delete(id: string): Promise<void>
}
