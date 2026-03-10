// File mirror barrel export

export {
  linkWorkspace,
  unlinkWorkspace,
  onDocumentChanged,
  onDocumentDeleted,
  resyncAll,
  getMirrorStatus,
  onMirrorEvent,
} from "./mirror-service"

export { syncAllDocuments, writeDocumentFile, removeDocumentFile } from "./file-writer"
export { startWatching, stopWatching, isWatching } from "./file-watcher"
export { readManifest, writeManifest } from "./manifest"
export { toFrontmatterMarkdown, parseFrontmatterMarkdown } from "./frontmatter"
export {
  getDocumentRelativePath,
  getDocumentAbsolutePath,
  titleToFilename,
} from "./path-utils"
