// Sync protocol types — shared between cloud API and desktop sync loop.

export type SyncEntityType =
  | "project"
  | "document"
  | "documentLink"
  | "bundle"
  | "bundleDocument"
  | "prompt"

export type SyncOperation = "create" | "update" | "delete"

export interface SyncChange {
  id: string
  seq: number
  entityType: SyncEntityType
  entityId: string
  operation: SyncOperation
  payload: Record<string, unknown> | null // Full entity snapshot for create/update; null for delete
  deviceId: string | null
  createdAt: string // ISO 8601
}

export interface SyncPullResponse {
  changes: SyncChange[]
  serverSeq: number // Latest server sequence after these changes
  hasMore: boolean // Whether there are more changes to pull
}

export interface SyncPushRequest {
  deviceId: string
  changes: Array<{
    entityType: SyncEntityType
    entityId: string
    operation: SyncOperation
    payload: Record<string, unknown> | null
    clientSeq: number // Client-side ordering
  }>
  lastKnownServerSeq: number // For conflict detection
}

export interface SyncPushResponse {
  accepted: number
  rejected: Array<{
    entityId: string
    reason: string
    serverVersion?: Record<string, unknown> // For conflict resolution
  }>
  serverSeq: number
}

export interface SyncHeadResponse {
  serverSeq: number
  deviceId: string
  lastSyncAt: string
}

export interface SyncRegisterRequest {
  deviceName: string
  platform: string
}

export interface SyncRegisterResponse {
  deviceId: string
}
