import type { ProjectRepo } from "./interfaces/project-repo"
import type { DocumentRepo, DocumentLinkRepo } from "./interfaces/document-repo"
import type { BundleRepo } from "./interfaces/bundle-repo"
import type { PromptRepo } from "./interfaces/prompt-repo"
import type { UserRepo } from "./interfaces/user-repo"
import {
  CloudProjectRepo,
  CloudDocumentRepo,
  CloudDocumentLinkRepo,
  CloudBundleRepo,
  CloudPromptRepo,
  CloudUserRepo,
} from "./cloud"

// Re-export interfaces for convenience
export type { ProjectRepo, CreateProjectData, CreateDocumentData, CreateLinkData } from "./interfaces/project-repo"
export type { DocumentRepo, DocumentLinkRepo } from "./interfaces/document-repo"
export type { BundleRepo } from "./interfaces/bundle-repo"
export type { PromptRepo } from "./interfaces/prompt-repo"
export type { UserRepo } from "./interfaces/user-repo"

const isDesktop = process.env.SHIPFLOW_RUNTIME === "desktop"

// Lazy-initialized singletons — avoids importing native modules in cloud builds.
let _projectRepo: ProjectRepo | null = null
let _documentRepo: DocumentRepo | null = null
let _documentLinkRepo: DocumentLinkRepo | null = null
let _bundleRepo: BundleRepo | null = null
let _promptRepo: PromptRepo | null = null
let _userRepo: UserRepo | null = null

function createCloudRepos() {
  _projectRepo = new CloudProjectRepo()
  _documentRepo = new CloudDocumentRepo()
  _documentLinkRepo = new CloudDocumentLinkRepo()
  _bundleRepo = new CloudBundleRepo()
  _promptRepo = new CloudPromptRepo()
  _userRepo = new CloudUserRepo()
}

function createDesktopRepos() {
  // Keep desktop repositories lazily loaded so cloud builds do not import native desktop modules.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const desktopRepos = require("./desktop") as typeof import("./desktop")
  const {
    DesktopProjectRepo,
    DesktopDocumentRepo,
    DesktopDocumentLinkRepo,
    DesktopBundleRepo,
    DesktopPromptRepo,
    DesktopUserRepo,
  } = desktopRepos

  _projectRepo = new DesktopProjectRepo()
  _documentRepo = new DesktopDocumentRepo()
  _documentLinkRepo = new DesktopDocumentLinkRepo()
  _bundleRepo = new DesktopBundleRepo()
  _promptRepo = new DesktopPromptRepo()
  _userRepo = new DesktopUserRepo()
}

function ensureRepos() {
  if (_projectRepo) return
  if (isDesktop) {
    createDesktopRepos()
  } else {
    createCloudRepos()
  }
}

export function getProjectRepo(): ProjectRepo {
  ensureRepos()
  return _projectRepo!
}

export function getDocumentRepo(): DocumentRepo {
  ensureRepos()
  return _documentRepo!
}

export function getDocumentLinkRepo(): DocumentLinkRepo {
  ensureRepos()
  return _documentLinkRepo!
}

export function getBundleRepo(): BundleRepo {
  ensureRepos()
  return _bundleRepo!
}

export function getPromptRepo(): PromptRepo {
  ensureRepos()
  return _promptRepo!
}

export function getUserRepo(): UserRepo {
  ensureRepos()
  return _userRepo!
}
