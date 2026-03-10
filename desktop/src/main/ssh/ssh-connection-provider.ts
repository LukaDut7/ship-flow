import { Client } from "ssh2"
import * as fs from "fs"
import * as net from "net"
import * as http from "http"
import { findFreePort } from "../server-manager"
import {
  checkRemoteNode,
  deployRemoteServer,
  reuseIfRunning,
  startRemoteServer,
  stopRemoteServer,
} from "./remote-server-manager"
import type {
  ConnectionProvider,
  ConnectionStatusInfo,
  SSHConnectionConfig,
  DeployProgress,
} from "./types"

const MAX_RECONNECT_ATTEMPTS = 5
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000]

export class SSHConnectionProvider implements ConnectionProvider {
  private client: Client | null = null
  private config: SSHConnectionConfig
  private localPort = 0
  private remotePort = 0
  private remotePid = 0
  private tunnelServer: net.Server | null = null
  private statusCallback: ((status: ConnectionStatusInfo) => void) | null = null
  private deployCallback: ((progress: DeployProgress) => void) | null = null
  private reconnecting = false
  private stopped = false
  private passphraseCallback: (() => Promise<string | null>) | null = null

  constructor(
    config: SSHConnectionConfig,
    options?: {
      onPassphraseNeeded?: () => Promise<string | null>
      onDeployProgress?: (progress: DeployProgress) => void
    }
  ) {
    this.config = config
    this.passphraseCallback = options?.onPassphraseNeeded ?? null
    this.deployCallback = options?.onDeployProgress ?? null
  }

  async start(): Promise<{ port: number }> {
    this.stopped = false
    this.emitStatus("connecting")

    try {
      // Read private key
      const privateKey = await this.readPrivateKey()

      // Connect SSH
      this.client = await this.connectSSH(privateKey, this.config.passphrase)

      // Setup reconnection listeners
      this.setupReconnection(privateKey)

      // Check Node.js on remote
      this.emitStatus("deploying")
      await checkRemoteNode(this.client)

      // Deploy if needed
      await deployRemoteServer(this.client, this.deployCallback ?? undefined)

      // Reuse running server or start a new one
      let remotePort = await reuseIfRunning(this.client)
      if (remotePort) {
        this.remotePort = remotePort
        console.log(`[ssh] Reusing existing remote server on port ${remotePort}`)
      } else {
        this.deployCallback?.({ stage: "starting", message: "Starting remote server...", percent: 90 })
        const result = await startRemoteServer(this.client)
        this.remotePort = result.port
        this.remotePid = result.pid
        console.log(`[ssh] Started remote server: pid=${result.pid}, port=${result.port}`)
      }

      // Setup local tunnel
      this.localPort = await this.createTunnel()
      console.log(`[ssh] Tunnel: 127.0.0.1:${this.localPort} → remote:${this.remotePort}`)

      // Verify through tunnel
      const ok = await this.tunnelHealthCheck()
      if (!ok) {
        throw new Error("Server health check failed through tunnel")
      }

      this.emitStatus("ready")
      return { port: this.localPort }
    } catch (err) {
      const msg = (err as Error).message
      this.emitStatus("error", msg)
      await this.cleanup()
      throw err
    }
  }

  async stop(): Promise<void> {
    this.stopped = true
    await this.cleanup()
    this.emitStatus("disconnected")
  }

  async healthCheck(): Promise<boolean> {
    return this.tunnelHealthCheck()
  }

  getPort(): number {
    return this.localPort
  }

  onStatusChange(cb: (status: ConnectionStatusInfo) => void): void {
    this.statusCallback = cb
  }

  // --- Private methods ---

  private async readPrivateKey(): Promise<Buffer> {
    const keyPath = this.config.privateKeyPath
    try {
      return fs.readFileSync(keyPath)
    } catch (err) {
      throw new Error(`SSH key file not found: ${keyPath}`)
    }
  }

  private connectSSH(privateKey: Buffer, passphrase?: string): Promise<Client> {
    return new Promise((resolve, reject) => {
      const client = new Client()
      let authFailed = false

      client.on("ready", () => resolve(client))

      client.on("error", async (err: Error & { level?: string }) => {
        // Handle encrypted key needing passphrase
        if (
          !authFailed &&
          (err.message.includes("decrypt") ||
            err.message.includes("passphrase") ||
            err.message.includes("bad decrypt"))
        ) {
          authFailed = true
          if (this.passphraseCallback) {
            const passphrase = await this.passphraseCallback()
            if (passphrase) {
              this.config.passphrase = passphrase
              try {
                const newClient = await this.connectSSH(privateKey, passphrase)
                resolve(newClient)
              } catch (retryErr) {
                reject(retryErr)
              }
              return
            }
          }
          reject(new Error("Passphrase required for encrypted SSH key"))
          return
        }

        if (err.level === "client-authentication") {
          reject(new Error("Authentication failed. Check your SSH key and username."))
          return
        }

        reject(err)
      })

      client.connect({
        host: this.config.host,
        port: this.config.port,
        username: this.config.username,
        privateKey,
        passphrase,
        readyTimeout: 15000,
        keepaliveInterval: 10000,
        keepaliveCountMax: 3,
      })
    })
  }

  private setupReconnection(privateKey: Buffer): void {
    if (!this.client) return

    this.client.on("close", () => {
      if (!this.stopped) {
        this.attemptReconnect(privateKey)
      }
    })

    this.client.on("end", () => {
      if (!this.stopped) {
        this.attemptReconnect(privateKey)
      }
    })
  }

  private async attemptReconnect(privateKey: Buffer): Promise<void> {
    if (this.reconnecting || this.stopped) return
    this.reconnecting = true
    this.emitStatus("reconnecting")

    for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
      if (this.stopped) break

      const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)]
      console.log(`[ssh] Reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`)
      await new Promise((r) => setTimeout(r, delay))

      if (this.stopped) break

      try {
        // Clean up old state
        this.closeTunnel()
        this.client?.destroy()

        // Reconnect
        this.client = await this.connectSSH(privateKey, this.config.passphrase)
        this.setupReconnection(privateKey)

        // Reuse or restart remote server
        let remotePort = await reuseIfRunning(this.client)
        if (!remotePort) {
          const result = await startRemoteServer(this.client)
          remotePort = result.port
          this.remotePid = result.pid
        }
        this.remotePort = remotePort

        // Re-establish tunnel
        this.localPort = await this.createTunnel()

        const ok = await this.tunnelHealthCheck()
        if (ok) {
          console.log("[ssh] Reconnected successfully")
          this.reconnecting = false
          this.emitStatus("ready")
          return
        }
      } catch (err) {
        console.error(`[ssh] Reconnect attempt ${attempt + 1} failed:`, (err as Error).message)
      }
    }

    this.reconnecting = false
    this.emitStatus("error", "Failed to reconnect after multiple attempts")
  }

  private createTunnel(): Promise<number> {
    return new Promise(async (resolve, reject) => {
      const localPort = await findFreePort()

      const server = net.createServer((localSocket) => {
        if (!this.client) {
          localSocket.destroy()
          return
        }

        this.client.forwardOut(
          "127.0.0.1",
          localPort,
          "127.0.0.1",
          this.remotePort,
          (err, remoteSocket) => {
            if (err) {
              localSocket.destroy()
              return
            }
            localSocket.pipe(remoteSocket).pipe(localSocket)

            localSocket.on("error", () => remoteSocket.destroy())
            remoteSocket.on("error", () => localSocket.destroy())
            localSocket.on("close", () => remoteSocket.destroy())
            remoteSocket.on("close", () => localSocket.destroy())
          }
        )
      })

      server.on("error", reject)

      server.listen(localPort, "127.0.0.1", () => {
        this.tunnelServer = server
        resolve(localPort)
      })
    })
  }

  private closeTunnel(): void {
    if (this.tunnelServer) {
      this.tunnelServer.close()
      this.tunnelServer = null
    }
  }

  private tunnelHealthCheck(): Promise<boolean> {
    if (this.localPort === 0) return Promise.resolve(false)
    return new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${this.localPort}/api/health`, (res) => {
        resolve(res.statusCode === 200)
      })
      req.on("error", () => resolve(false))
      req.setTimeout(5000, () => {
        req.destroy()
        resolve(false)
      })
    })
  }

  private async cleanup(): Promise<void> {
    this.closeTunnel()
    if (this.client) {
      this.client.destroy()
      this.client = null
    }
    this.localPort = 0
  }

  private emitStatus(status: ConnectionStatusInfo["status"], error?: string): void {
    this.statusCallback?.({
      status,
      mode: "ssh",
      error,
      host: this.config.host,
    })
  }
}
