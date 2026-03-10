// Re-export all types from the canonical hand-written type definitions.
// Consumer code should import from "@/types" or "@/lib/types".

export type {
  UserTier,
  ProjectStatus,
  Phase,
  DocType,
  TargetTool,
  LinkType,
  User,
  Project,
  Document,
  DocumentLink,
  ContextBundle,
  BundleDocument,
  GeneratedPrompt,
  ProjectWithDocs,
  DocumentWithLinks,
  ContextBundleWithDocs,
} from "@/lib/types"

export type { AssemblerInput } from "@/lib/prompt-engine/assembler"

export interface PromptTemplateConfig {
  id: string
  name: string
  description: string
  phase: Phase
  requiredDocTypes: DocType[]
  suggestedDocTypes: DocType[]
  instructionTemplate: string
}

// Import Phase and DocType for use in the interface above
import type { Phase, DocType } from "@/lib/types"
