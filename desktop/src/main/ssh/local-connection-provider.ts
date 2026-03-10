import {
  startServer,
  stopServer,
  isServerRunning,
  getServerPort,
  healthCheck,
} from "../server-manager"
import type { ConnectionProvider, ConnectionStatusInfo } from "./types"

export class LocalConnectionProvider implements ConnectionProvider {
  private port = 0
  private statusCallback: ((status: ConnectionStatusInfo) => void) | null = null

  async start(): Promise<{ port: number }> {
    this.emitStatus("connecting")
    try {
      const port = await startServer()
      this.port = port
      this.emitStatus("ready")
      return { port }
    } catch (err) {
      this.emitStatus("error", (err as Error).message)
      throw err
    }
  }

  async stop(): Promise<void> {
    stopServer()
    this.port = 0
    this.emitStatus("disconnected")
  }

  async healthCheck(): Promise<boolean> {
    if (this.port === 0) return false
    return healthCheck(this.port)
  }

  getPort(): number {
    return this.port
  }

  onStatusChange(cb: (status: ConnectionStatusInfo) => void): void {
    this.statusCallback = cb
  }

  private emitStatus(status: ConnectionStatusInfo["status"], error?: string): void {
    this.statusCallback?.({
      status,
      mode: "local",
      error,
    })
  }
}
