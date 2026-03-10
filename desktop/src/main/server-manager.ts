import { ChildProcess, spawn } from "child_process"
import { app } from "electron"
import * as net from "net"
import * as path from "path"
import * as http from "http"

let serverProcess: ChildProcess | null = null
let serverPort: number = 0

export function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer()
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as net.AddressInfo
      const port = addr.port
      server.close(() => resolve(port))
    })
    server.on("error", reject)
  })
}

function getServerPath(): string {
  // In packaged app, standalone server is in resources
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "standalone", "server.js")
  }
  // In development, use the built standalone output
  return path.join(__dirname, "..", "..", "..", ".next", "standalone", "server.js")
}

export function healthCheck(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
      resolve(res.statusCode === 200)
    })
    req.on("error", () => resolve(false))
    req.setTimeout(2000, () => {
      req.destroy()
      resolve(false)
    })
  })
}

async function waitForServer(port: number, maxAttempts = 30): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const ok = await healthCheck(port)
    if (ok) return
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Server did not become ready after ${maxAttempts} attempts`)
}

export async function startServer(): Promise<number> {
  const port = await findFreePort()
  const serverPath = getServerPath()
  const dataDir = app.getPath("userData")

  serverProcess = spawn(process.execPath, [serverPath], {
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      SHIPFLOW_RUNTIME: "desktop",
      SHIPFLOW_DATA_DIR: dataDir,
      // JWT secret for desktop sessions
      NEXTAUTH_SECRET: `shipflow-desktop-${app.getPath("userData")}`,
      NEXTAUTH_URL: `http://127.0.0.1:${port}`,
    },
    stdio: ["pipe", "pipe", "pipe"],
  })

  serverProcess.stdout?.on("data", (data: Buffer) => {
    console.log(`[server] ${data.toString().trim()}`)
  })

  serverProcess.stderr?.on("data", (data: Buffer) => {
    console.error(`[server] ${data.toString().trim()}`)
  })

  serverProcess.on("exit", (code, signal) => {
    console.log(`[server] Process exited: code=${code}, signal=${signal}`)
    serverProcess = null
  })

  await waitForServer(port)
  serverPort = port
  return port
}

export function stopServer(): void {
  if (serverProcess) {
    serverProcess.kill("SIGTERM")
    // Force kill after 5s if graceful shutdown fails
    setTimeout(() => {
      if (serverProcess && !serverProcess.killed) {
        serverProcess.kill("SIGKILL")
      }
    }, 5000)
    serverProcess = null
  }
}

export function getServerPort(): number {
  return serverPort
}

export function isServerRunning(): boolean {
  return serverProcess !== null && !serverProcess.killed
}
