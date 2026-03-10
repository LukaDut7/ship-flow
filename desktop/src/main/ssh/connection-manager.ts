import { ipcMain, dialog, BrowserWindow, powerMonitor } from "electron"
import * as path from "path"
import { LocalConnectionProvider } from "./local-connection-provider"
import { SSHConnectionProvider } from "./ssh-connection-provider"
import {
  loadConnections,
  saveConnection,
  deleteConnection,
  updateLastConnected,
} from "./connection-store"
import type {
  ConnectionProvider,
  ConnectionStatusInfo,
  SSHConnectionConfig,
  DeployProgress,
} from "./types"

export class ConnectionManager {
  private provider: ConnectionProvider | null = null
  private mainWindow: BrowserWindow | null = null
  private statusInfo: ConnectionStatusInfo = {
    status: "disconnected",
    mode: "local",
  }
  private healthInterval: ReturnType<typeof setInterval> | null = null
  private activeConnectionId: string | null = null

  getActivePort(): number {
    return this.provider?.getPort() ?? 0
  }

  getStatus(): ConnectionStatusInfo {
    return this.statusInfo
  }

  async connectLocal(): Promise<number> {
    await this.disconnect()
    const provider = new LocalConnectionProvider()
    provider.onStatusChange((s) => this.onStatusChanged(s))
    this.provider = provider

    const { port } = await provider.start()
    this.startHealthMonitor()
    return port
  }

  async connectSSH(
    config: SSHConnectionConfig,
    connectionId?: string
  ): Promise<number> {
    await this.disconnect()

    const provider = new SSHConnectionProvider(config, {
      onPassphraseNeeded: () => this.promptPassphrase(),
      onDeployProgress: (p) => this.onDeployProgress(p),
    })
    provider.onStatusChange((s) => this.onStatusChanged(s))
    this.provider = provider
    this.activeConnectionId = connectionId ?? null

    const { port } = await provider.start()

    if (connectionId) {
      updateLastConnected(connectionId)
    }

    this.startHealthMonitor()
    return port
  }

  async disconnect(): Promise<void> {
    this.stopHealthMonitor()
    if (this.provider) {
      await this.provider.stop()
      this.provider = null
    }
    this.activeConnectionId = null
  }

  registerIPC(mainWindow: BrowserWindow): void {
    this.mainWindow = mainWindow

    // Invoke handlers (request-response)
    ipcMain.handle("ssh:status", () => this.getStatus())

    ipcMain.handle("ssh:list-connections", () => loadConnections())

    ipcMain.handle("ssh:save-connection", (_event, conn) => saveConnection(conn))

    ipcMain.handle("ssh:delete-connection", (_event, id: string) => deleteConnection(id))

    ipcMain.handle("ssh:test-connection", async (_event, config: SSHConnectionConfig) => {
      try {
        const { Client } = await import("ssh2")
        const client = new Client()
        const fs = await import("fs")

        return new Promise<{ ok: boolean; error?: string }>((resolve) => {
          const timeout = setTimeout(() => {
            client.destroy()
            resolve({ ok: false, error: "Connection timed out" })
          }, 10000)

          client.on("ready", () => {
            clearTimeout(timeout)
            client.end()
            resolve({ ok: true })
          })

          client.on("error", (err: Error) => {
            clearTimeout(timeout)
            resolve({ ok: false, error: err.message })
          })

          let privateKey: Buffer
          try {
            privateKey = fs.readFileSync(config.privateKeyPath)
          } catch {
            clearTimeout(timeout)
            resolve({ ok: false, error: `Key file not found: ${config.privateKeyPath}` })
            return
          }

          client.connect({
            host: config.host,
            port: config.port,
            username: config.username,
            privateKey,
            passphrase: config.passphrase,
            readyTimeout: 10000,
          })
        })
      } catch (err) {
        return { ok: false, error: (err as Error).message }
      }
    })

    ipcMain.handle("ssh:browse-key", async () => {
      if (!mainWindow) return null
      const result = await dialog.showOpenDialog(mainWindow, {
        title: "Select SSH Private Key",
        defaultPath: path.join(
          process.env.HOME || process.env.USERPROFILE || "",
          ".ssh"
        ),
        properties: ["openFile", "showHiddenFiles"],
        filters: [{ name: "All Files", extensions: ["*"] }],
      })
      if (result.canceled || result.filePaths.length === 0) return null
      return result.filePaths[0]
    })

    // One-way handlers
    ipcMain.on("ssh:connect", async (_event, config: SSHConnectionConfig & { connectionId?: string }) => {
      try {
        const port = await this.connectSSH(config, config.connectionId)
        mainWindow?.loadURL(`http://127.0.0.1:${port}/dashboard`)
      } catch (err) {
        this.sendToRenderer("ssh:error", (err as Error).message)
      }
    })

    ipcMain.on("ssh:connect-local", async () => {
      try {
        const port = await this.connectLocal()
        mainWindow?.loadURL(`http://127.0.0.1:${port}/dashboard`)
      } catch (err) {
        this.sendToRenderer("ssh:error", (err as Error).message)
      }
    })

    ipcMain.on("ssh:disconnect", async () => {
      await this.disconnect()
      this.loadConnectPage()
    })

    // Power monitor — pause/resume health checks on sleep/wake
    powerMonitor.on("suspend", () => {
      console.log("[connection] System suspending — pausing health checks")
      this.stopHealthMonitor()
    })

    powerMonitor.on("resume", () => {
      console.log("[connection] System resumed — checking connection")
      if (this.provider && this.statusInfo.status === "ready") {
        this.startHealthMonitor()
        // Immediate health check
        this.provider.healthCheck().then((ok) => {
          if (!ok && this.statusInfo.mode === "ssh") {
            // SSH provider handles reconnection internally
            console.log("[connection] Health check failed after resume — SSH will auto-reconnect")
          }
        })
      }
    })
  }

  loadConnectPage(): void {
    if (!this.mainWindow) return
    const connectPath = path.join(__dirname, "..", "renderer", "connect.html")
    this.mainWindow.loadFile(connectPath)
  }

  // --- Private methods ---

  private onStatusChanged(status: ConnectionStatusInfo): void {
    this.statusInfo = status
    this.sendToRenderer("ssh:status-changed", status)
  }

  private onDeployProgress(progress: DeployProgress): void {
    this.sendToRenderer("ssh:deploy-progress", progress)
  }

  private async promptPassphrase(): Promise<string | null> {
    if (!this.mainWindow) return null

    return new Promise((resolve) => {
      const child = new BrowserWindow({
        parent: this.mainWindow!,
        modal: true,
        width: 420,
        height: 200,
        resizable: false,
        minimizable: false,
        maximizable: false,
        title: "SSH Key Passphrase",
        webPreferences: {
          preload: path.join(__dirname, "..", "preload", "index.js"),
          contextIsolation: true,
          nodeIntegration: false,
          sandbox: true,
        },
      })

      const dialogPath = path.join(__dirname, "..", "renderer", "passphrase-dialog.html")
      child.loadFile(dialogPath)
      child.setMenu(null)

      // Listen for passphrase response
      const handler = (_event: Electron.IpcMainEvent, passphrase: string | null) => {
        ipcMain.removeListener("ssh:passphrase-response", handler)
        child.close()
        resolve(passphrase)
      }
      ipcMain.on("ssh:passphrase-response", handler)

      child.on("closed", () => {
        ipcMain.removeListener("ssh:passphrase-response", handler)
        resolve(null)
      })
    })
  }

  private sendToRenderer(channel: string, ...args: unknown[]): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send(channel, ...args)
    }
  }

  private startHealthMonitor(): void {
    this.stopHealthMonitor()
    this.healthInterval = setInterval(async () => {
      if (!this.provider) return
      const ok = await this.provider.healthCheck()
      if (!ok && this.statusInfo.status === "ready") {
        console.log("[connection] Health check failed")
        // For SSH, the provider handles reconnection internally
        // For local, we just report the error
        if (this.statusInfo.mode === "local") {
          this.onStatusChanged({
            status: "error",
            mode: "local",
            error: "Local server stopped responding",
          })
        }
      }
    }, 15000)
  }

  private stopHealthMonitor(): void {
    if (this.healthInterval) {
      clearInterval(this.healthInterval)
      this.healthInterval = null
    }
  }
}
