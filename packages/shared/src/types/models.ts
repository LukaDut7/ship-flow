// Hand-written model types — database-agnostic interfaces.
// These must stay structurally compatible with Prisma-generated types.

import type {
  Phase,
  DocType,
  TargetTool,
  LinkType,
  ProjectStatus,
  UserTier,
} from "./enums"


export interface User {
  id: string
  name: string | null
  email: string | null
  emailVerified: Date | null
  image: string | null
  tier: UserTier
  createdAt: Date
}

export interface Project {
  id: string
  userId: string
  name: string
  description: string
  techStack: string[]
  status: ProjectStatus
  createdAt: Date
  updatedAt: Date
}

export interface Document {
  id: string
  projectId: string
  title: string
  content: string
  phase: Phase
  docType: DocType
  sortOrder: number
  isFromTemplate: boolean
  createdAt: Date
  updatedAt: Date
}

export interface DocumentLink {
  id: string
  fromDocId: string
  toDocId: string
  linkType: LinkType
}

export interface ContextBundle {
  id: string
  projectId: string
  name: string
  description: string
  isPreset: boolean
}

export interface BundleDocument {
  id: string
  bundleId: string
  documentId: string
  sortOrder: number
}

export interface GeneratedPrompt {
  id: string
  projectId: string
  documentId: string | null
  targetTool: TargetTool
  promptContent: string
  options: Record<string, unknown>
  createdAt: Date
}

// Composite types used by the UI

export type ProjectWithDocs = Project & {
  documents: Document[]
}

export type DocumentWithLinks = Document & {
  linksFrom: (DocumentLink & { toDoc: Document })[]
  linksTo: (DocumentLink & { fromDoc: Document })[]
}

export type ContextBundleWithDocs = ContextBundle & {
  documents: (BundleDocument & { document: Document })[]
}
