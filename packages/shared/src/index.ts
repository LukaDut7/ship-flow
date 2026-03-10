// @shipflow/shared — types, constants, and pure functions shared across web and desktop.
// During Phase 1, shared code will be migrated here from the web app's src/lib/.

export type {
  UserTier,
  ProjectStatus,
  Phase,
  DocType,
  TargetTool,
  LinkType,
} from "./types/enums"

export type {
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
} from "./types/models"
