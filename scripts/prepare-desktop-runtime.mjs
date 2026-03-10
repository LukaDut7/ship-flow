import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(scriptDir, "..")
const sourceNode = process.execPath
const runtimeDir = path.join(rootDir, "desktop", ".runtime")
const targetNode = path.join(
  runtimeDir,
  process.platform === "win32" ? "node.exe" : "node"
)

fs.mkdirSync(runtimeDir, { recursive: true })
fs.copyFileSync(sourceNode, targetNode)

if (process.platform !== "win32") {
  fs.chmodSync(targetNode, 0o755)
}

console.log(`Prepared desktop Node runtime at ${targetNode}`)
