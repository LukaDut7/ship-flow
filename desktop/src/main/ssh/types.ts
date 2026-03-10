// SSH Remote Connection Types

export interface SSHConnectionConfig {
  host: string
  port: number // default 22
  username: string
  privateKeyPath: string
  passphrase?: string // never persisted — memory only
}

export interface SavedConnection {
  id: string
  label: string
  host: string
  port: number
  username: string
  privateKeyPath: string
  lastConnectedAt: string | null
}

export type ConnectionStatus =
  | "connecting"
  | "deploying"
  | "ready"
  | "reconnecting"
  | "disconnected"
  | "error"

export interface ConnectionStatusInfo {
  status: ConnectionStatus
  mode: "local" | "ssh"
  error?: string
  host?: string
}

export interface ConnectionProvider {
  start(): Promise<{ port: number }>
  stop(): Promise<void>
  healthCheck(): Promise<boolean>
  getPort(): number
  onStatusChange(cb: (status: ConnectionStatusInfo) => void): void
}

export interface DeployProgress {
  stage: "checking" | "uploading" | "extracting" | "starting" | "done"
  message: string
  percent?: number
}
