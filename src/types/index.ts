import type {
  Project,
  Document,
  DocumentLink,
  ContextBundle,
  BundleDocument,
  GeneratedPrompt,
  Phase,
  DocType,
  TargetTool,
  LinkType,
} from "@prisma/client"

export type {
  Project,
  Document,
  DocumentLink,
  ContextBundle,
  BundleDocument,
  GeneratedPrompt,
  Phase,
  DocType,
  TargetTool,
  LinkType,
}

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

export interface AssemblerInput {
  project: {
    name: string
    description: string
    techStack: string[]
  }
  primaryDoc: {
    title: string
    content: string
    phase: string
    docType: string
  }
  linkedDocs: Array<{
    title: string
    content: string
    phase: string
    linkType: string
  }>
  options: {
    includeProjectContext: boolean
    includeTechStack: boolean
    includePhaseContext: boolean
    includeLinkedDocs: boolean
    customInstructions?: string
  }
}

export interface PromptTemplateConfig {
  id: string
  name: string
  description: string
  phase: Phase
  requiredDocTypes: DocType[]
  suggestedDocTypes: DocType[]
  instructionTemplate: string
}
