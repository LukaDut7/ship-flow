import fs from "fs"
import path from "path"

const root = process.cwd()
const standaloneDir = path.join(root, ".next", "standalone")
const standaloneNextDir = path.join(standaloneDir, ".next")
const standaloneExternalModulesDir = path.join(standaloneNextDir, "node_modules")
const standaloneStaticDir = path.join(standaloneNextDir, "static")
const sourceStaticDir = path.join(root, ".next", "static")
const sourcePublicDir = path.join(root, "public")
const standalonePublicDir = path.join(standaloneDir, "public")

function resetDir(targetPath) {
  fs.rmSync(targetPath, { recursive: true, force: true })
}

function copyIfExists(sourcePath, targetPath) {
  if (!fs.existsSync(sourcePath)) return
  fs.mkdirSync(path.dirname(targetPath), { recursive: true })
  fs.cpSync(sourcePath, targetPath, { recursive: true })
}

function materializeSymlinks(currentPath) {
  if (!fs.existsSync(currentPath)) return

  for (const entry of fs.readdirSync(currentPath, { withFileTypes: true })) {
    const entryPath = path.join(currentPath, entry.name)
    const stats = fs.lstatSync(entryPath)

    if (stats.isSymbolicLink()) {
      const targetPath = path.resolve(path.dirname(entryPath), fs.readlinkSync(entryPath))
      fs.rmSync(entryPath, { recursive: true, force: true })
      fs.cpSync(targetPath, entryPath, { recursive: true, dereference: true })
      continue
    }

    if (entry.isDirectory()) {
      materializeSymlinks(entryPath)
    }
  }
}

if (!fs.existsSync(standaloneDir)) {
  throw new Error(`Standalone build not found at ${standaloneDir}`)
}

resetDir(standaloneStaticDir)
resetDir(standalonePublicDir)

copyIfExists(sourceStaticDir, standaloneStaticDir)
copyIfExists(sourcePublicDir, standalonePublicDir)
materializeSymlinks(standaloneExternalModulesDir)
