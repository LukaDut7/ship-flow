import { app } from "electron"
import * as fs from "fs"
import * as path from "path"
import * as crypto from "crypto"
import type { SavedConnection } from "./types"

const STORE_FILE = "ssh-connections.json"

function getStorePath(): string {
  return path.join(app.getPath("userData"), STORE_FILE)
}

function readStore(): SavedConnection[] {
  try {
    const data = fs.readFileSync(getStorePath(), "utf-8")
    return JSON.parse(data) as SavedConnection[]
  } catch {
    return []
  }
}

function writeStore(connections: SavedConnection[]): void {
  fs.writeFileSync(getStorePath(), JSON.stringify(connections, null, 2))
}

export function loadConnections(): SavedConnection[] {
  return readStore()
}

export function getConnection(id: string): SavedConnection | null {
  const connections = readStore()
  return connections.find((c) => c.id === id) ?? null
}

export function saveConnection(
  conn: Omit<SavedConnection, "id" | "lastConnectedAt"> & { id?: string }
): SavedConnection {
  const connections = readStore()
  const id = conn.id ?? crypto.randomUUID()
  const existing = connections.findIndex((c) => c.id === id)

  const saved: SavedConnection = {
    id,
    label: conn.label,
    host: conn.host,
    port: conn.port,
    username: conn.username,
    privateKeyPath: conn.privateKeyPath,
    lastConnectedAt: existing >= 0 ? connections[existing].lastConnectedAt : null,
  }

  if (existing >= 0) {
    connections[existing] = saved
  } else {
    connections.push(saved)
  }

  writeStore(connections)
  return saved
}

export function updateLastConnected(id: string): void {
  const connections = readStore()
  const conn = connections.find((c) => c.id === id)
  if (conn) {
    conn.lastConnectedAt = new Date().toISOString()
    writeStore(connections)
  }
}

export function deleteConnection(id: string): boolean {
  const connections = readStore()
  const filtered = connections.filter((c) => c.id !== id)
  if (filtered.length === connections.length) return false
  writeStore(filtered)
  return true
}
