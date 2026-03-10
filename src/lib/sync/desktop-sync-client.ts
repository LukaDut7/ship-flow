// Desktop sync client — manages the push/pull loop.
// Only runs when SHIPFLOW_RUNTIME=desktop.

import type {
  SyncChange,
  SyncPullResponse,
  SyncPushRequest,
  SyncPushResponse,
  SyncHeadResponse,
} from "./types"
import { DESKTOP_SESSION_COOKIE_NAME } from "@/lib/auth-constants"

interface SyncState {
  deviceId: string | null
  lastServerSeq: number
  pendingChanges: SyncPushRequest["changes"]
  isSyncing: boolean
  baseUrl: string
  authToken: string | null
}

const state: SyncState = {
  deviceId: null,
  lastServerSeq: 0,
  pendingChanges: [],
  isSyncing: false,
  baseUrl: "",
  authToken: null,
}

let pullInterval: ReturnType<typeof setInterval> | null = null
let pushDebounce: ReturnType<typeof setTimeout> | null = null
let clientSeqCounter = 0
let retryDelay = 1000 // Exponential backoff for errors

type SyncListener = (event: SyncEvent) => void
type SyncEvent =
  | { type: "pull-complete"; changes: SyncChange[] }
  | { type: "push-complete"; accepted: number; rejected: number }
  | { type: "error"; message: string }
  | { type: "conflict"; entityId: string; serverVersion: Record<string, unknown> }

const listeners: Set<SyncListener> = new Set()

export function onSyncEvent(listener: SyncListener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function emit(event: SyncEvent): void {
  for (const listener of listeners) {
    try {
      listener(event)
    } catch {
      // Don't let listener errors break sync
    }
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  if (state.authToken) {
    headers.set("Cookie", `${DESKTOP_SESSION_COOKIE_NAME}=${state.authToken}`)
  }
  return fetch(url, { ...options, headers })
}

/**
 * Initialize the sync client.
 * Call after authentication is complete.
 */
export async function initSync(config: {
  baseUrl: string
  authToken: string | null
  deviceId: string | null
}): Promise<void> {
  state.baseUrl = config.baseUrl
  state.authToken = config.authToken
  state.deviceId = config.deviceId

  // Register device if needed
  if (!state.deviceId) {
    const res = await fetchWithAuth(`${state.baseUrl}/api/sync/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceName: require("os").hostname(),
        platform: process.platform,
      }),
    })
    if (res.ok) {
      const data = await res.json()
      state.deviceId = data.deviceId
    }
  }

  // Get current server head
  try {
    const head = await getHead()
    state.lastServerSeq = head.serverSeq
  } catch {
    // Will sync on next interval
  }
}

/**
 * Start the automatic sync loop.
 */
export function startSyncLoop(intervalMs: number = 15000): void {
  if (pullInterval) return

  // Pull immediately on start
  pull()

  // Then pull on interval
  pullInterval = setInterval(() => {
    if (!state.isSyncing) {
      pull()
    }
  }, intervalMs)
}

/**
 * Stop the automatic sync loop.
 */
export function stopSyncLoop(): void {
  if (pullInterval) {
    clearInterval(pullInterval)
    pullInterval = null
  }
  if (pushDebounce) {
    clearTimeout(pushDebounce)
    pushDebounce = null
  }
}

/**
 * Queue a local change for push.
 * Called by the desktop repository implementations after mutations.
 */
export function queueChange(change: Omit<SyncPushRequest["changes"][0], "clientSeq">): void {
  state.pendingChanges.push({
    ...change,
    clientSeq: ++clientSeqCounter,
  })

  // Debounce push: wait 2s after last change before pushing
  if (pushDebounce) clearTimeout(pushDebounce)
  pushDebounce = setTimeout(() => push(), 2000)
}

/**
 * Trigger an immediate sync (push then pull).
 */
export async function syncNow(): Promise<void> {
  await push()
  await pull()
}

async function getHead(): Promise<SyncHeadResponse> {
  const res = await fetchWithAuth(
    `${state.baseUrl}/api/sync/head?deviceId=${state.deviceId ?? ""}`
  )
  if (!res.ok) throw new Error(`Head failed: ${res.status}`)
  return res.json()
}

async function pull(): Promise<void> {
  if (state.isSyncing) return
  state.isSyncing = true

  try {
    let hasMore = true
    const allChanges: SyncChange[] = []

    while (hasMore) {
      const res = await fetchWithAuth(
        `${state.baseUrl}/api/sync/pull?since=${state.lastServerSeq}&deviceId=${state.deviceId ?? ""}`
      )

      if (!res.ok) {
        throw new Error(`Pull failed: ${res.status}`)
      }

      const data: SyncPullResponse = await res.json()

      // Filter out changes from this device (we already have them locally)
      const remoteChanges = data.changes.filter(
        (c) => c.deviceId !== state.deviceId
      )

      allChanges.push(...remoteChanges)
      state.lastServerSeq = data.serverSeq
      hasMore = data.hasMore
    }

    if (allChanges.length > 0) {
      await applyRemoteChanges(allChanges)
      emit({ type: "pull-complete", changes: allChanges })
    }

    retryDelay = 1000 // Reset backoff on success
  } catch (err) {
    const message = err instanceof Error ? err.message : "Pull error"
    emit({ type: "error", message })

    // Exponential backoff (max 60s)
    retryDelay = Math.min(retryDelay * 2, 60000)
  } finally {
    state.isSyncing = false
  }
}

async function push(): Promise<void> {
  if (state.pendingChanges.length === 0) return
  if (state.isSyncing) return
  if (!state.deviceId) return

  state.isSyncing = true

  // Take a snapshot of pending changes
  const changesToPush = [...state.pendingChanges]
  state.pendingChanges = []

  try {
    const res = await fetchWithAuth(`${state.baseUrl}/api/sync/push`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        deviceId: state.deviceId,
        changes: changesToPush,
        lastKnownServerSeq: state.lastServerSeq,
      } satisfies SyncPushRequest),
    })

    if (!res.ok) {
      // Re-queue failed changes
      state.pendingChanges = [...changesToPush, ...state.pendingChanges]
      throw new Error(`Push failed: ${res.status}`)
    }

    const data: SyncPushResponse = await res.json()
    state.lastServerSeq = data.serverSeq

    // Handle rejected changes
    for (const rejection of data.rejected) {
      if (rejection.serverVersion) {
        emit({
          type: "conflict",
          entityId: rejection.entityId,
          serverVersion: rejection.serverVersion,
        })
      }
    }

    emit({
      type: "push-complete",
      accepted: data.accepted,
      rejected: data.rejected.length,
    })

    retryDelay = 1000
  } catch (err) {
    const message = err instanceof Error ? err.message : "Push error"
    emit({ type: "error", message })
    retryDelay = Math.min(retryDelay * 2, 60000)
  } finally {
    state.isSyncing = false
  }
}

/**
 * Apply remote changes to the local SQLite database.
 * Must handle ordering: creates before relationships, relationship deletes before entity deletes.
 */
async function applyRemoteChanges(changes: SyncChange[]): Promise<void> {
  // Import desktop repos dynamically
  const {
    DesktopProjectRepo,
    DesktopDocumentRepo,
    DesktopDocumentLinkRepo,
    DesktopBundleRepo,
    DesktopPromptRepo,
  } = await import("@/lib/repositories/desktop")

  const projectRepo = new DesktopProjectRepo()
  const documentRepo = new DesktopDocumentRepo()
  const documentLinkRepo = new DesktopDocumentLinkRepo()
  const bundleRepo = new DesktopBundleRepo()
  const promptRepo = new DesktopPromptRepo()

  // Sort: creates first, then updates, then deletes
  // Within deletes: relationships first, then entities
  const sortOrder: Record<string, number> = {
    create: 0,
    update: 1,
    delete: 2,
  }
  const entityDeleteOrder: Record<string, number> = {
    bundleDocument: 0,
    documentLink: 0,
    prompt: 1,
    document: 2,
    bundle: 2,
    project: 3,
  }

  const sorted = [...changes].sort((a, b) => {
    const opDiff = (sortOrder[a.operation] ?? 1) - (sortOrder[b.operation] ?? 1)
    if (opDiff !== 0) return opDiff
    if (a.operation === "delete") {
      return (
        (entityDeleteOrder[a.entityType] ?? 1) -
        (entityDeleteOrder[b.entityType] ?? 1)
      )
    }
    return 0
  })

  for (const change of sorted) {
    try {
      if (change.operation === "create" && change.payload) {
        switch (change.entityType) {
          case "project":
            await projectRepo.create({
              userId: change.payload.userId as string,
              name: change.payload.name as string,
              description: (change.payload.description as string) ?? "",
              techStack: (change.payload.techStack as string[]) ?? [],
            })
            break
          case "document":
            await documentRepo.create({
              projectId: change.payload.projectId as string,
              title: change.payload.title as string,
              content: (change.payload.content as string) ?? "",
              phase: change.payload.phase as any,
              docType: change.payload.docType as any,
              sortOrder: (change.payload.sortOrder as number) ?? 0,
              isFromTemplate: (change.payload.isFromTemplate as boolean) ?? false,
            })
            break
          case "documentLink":
            await documentLinkRepo.create({
              fromDocId: change.payload.fromDocId as string,
              toDocId: change.payload.toDocId as string,
              linkType: change.payload.linkType as any,
            })
            break
          case "bundle":
            await bundleRepo.create({
              projectId: change.payload.projectId as string,
              name: change.payload.name as string,
              description: (change.payload.description as string) ?? "",
              documentIds: [],
            })
            break
          case "prompt":
            await promptRepo.create({
              projectId: change.payload.projectId as string,
              documentId: (change.payload.documentId as string) ?? null,
              targetTool: change.payload.targetTool as any,
              promptContent: change.payload.promptContent as string,
              options: (change.payload.options as Record<string, unknown>) ?? {},
            })
            break
        }
      } else if (change.operation === "update" && change.payload) {
        switch (change.entityType) {
          case "project":
            await projectRepo.update(change.entityId, change.payload as any)
            break
          case "document":
            await documentRepo.update(change.entityId, change.payload as any)
            break
          case "bundle":
            // Only update name/description via sync
            if (change.payload.name || change.payload.description) {
              await bundleRepo.update(change.entityId, {
                name: change.payload.name as string,
                description: (change.payload.description as string) ?? "",
                documentIds: (change.payload.documentIds as string[]) ?? [],
              })
            }
            break
        }
      } else if (change.operation === "delete") {
        switch (change.entityType) {
          case "project":
            await projectRepo.delete(change.entityId)
            break
          case "document":
            await documentRepo.delete(change.entityId)
            break
          case "documentLink":
            await documentLinkRepo.delete(change.entityId)
            break
          case "bundle":
            await bundleRepo.delete(change.entityId)
            break
          case "prompt":
            await promptRepo.delete(change.entityId)
            break
        }
      }
    } catch {
      // Log but continue — individual change failures shouldn't stop the whole pull
      console.error(`[sync] Failed to apply change ${change.id}: ${change.entityType}/${change.operation}`)
    }
  }
}

export function getSyncState() {
  return {
    deviceId: state.deviceId,
    lastServerSeq: state.lastServerSeq,
    pendingCount: state.pendingChanges.length,
    isSyncing: state.isSyncing,
  }
}
