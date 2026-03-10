// Cloud-side sync service — manages the SyncChange log in Postgres.
// Used by the sync API endpoints.

import { prisma } from "@/lib/prisma"
import type { Prisma } from "@prisma/client"
import type { ProjectStatus } from "@/lib/types/enums"
import type { SyncEntityType, SyncOperation, SyncChange } from "./types"

/**
 * Get the latest sequence number for a user.
 */
export async function getServerSeq(userId: string): Promise<number> {
  const result = await prisma.syncChange.aggregate({
    where: { userId },
    _max: { seq: true },
  })
  return result._max.seq ?? 0
}

/**
 * Record a change in the sync log.
 * Returns the new sequence number.
 */
export async function recordChange(
  userId: string,
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown> | null,
  deviceId: string | null = null
): Promise<number> {
  const currentSeq = await getServerSeq(userId)
  const newSeq = currentSeq + 1

  await prisma.syncChange.create({
    data: {
      userId,
      seq: newSeq,
      entityType,
      entityId,
      operation,
      payload: (payload as Prisma.InputJsonValue) ?? undefined,
      deviceId,
    },
  })

  return newSeq
}

/**
 * Pull changes since a given sequence number.
 * Returns up to `limit` changes.
 */
export async function pullChanges(
  userId: string,
  sinceSeq: number,
  limit: number = 100
): Promise<{ changes: SyncChange[]; hasMore: boolean }> {
  const rows = await prisma.syncChange.findMany({
    where: {
      userId,
      seq: { gt: sinceSeq },
    },
    orderBy: { seq: "asc" },
    take: limit + 1, // Fetch one extra to detect hasMore
  })

  const hasMore = rows.length > limit
  const changes = (hasMore ? rows.slice(0, limit) : rows).map((row) => ({
    id: row.id,
    seq: row.seq,
    entityType: row.entityType as SyncEntityType,
    entityId: row.entityId,
    operation: row.operation as SyncOperation,
    payload: (row.payload as Record<string, unknown>) ?? null,
    deviceId: row.deviceId,
    createdAt: row.createdAt.toISOString(),
  }))

  return { changes, hasMore }
}

/**
 * Apply a pushed change from a desktop client.
 * Validates the change and records it in the log.
 * Returns the new server seq, or throws on validation failure.
 */
export async function applyPushedChange(
  userId: string,
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown> | null,
  deviceId: string
): Promise<number> {
  // Validate entity ownership
  const isOwned = await validateEntityOwnership(userId, entityType, entityId)
  if (!isOwned && operation !== "create") {
    throw new Error(`Entity ${entityType}:${entityId} not found or not owned`)
  }

  // Apply the mutation to the actual database
  await applyMutation(userId, entityType, entityId, operation, payload)

  // Record in sync log
  return recordChange(userId, entityType, entityId, operation, payload, deviceId)
}

async function validateEntityOwnership(
  userId: string,
  entityType: SyncEntityType,
  entityId: string
): Promise<boolean> {
  switch (entityType) {
    case "project": {
      const p = await prisma.project.findFirst({ where: { id: entityId, userId } })
      return !!p
    }
    case "document": {
      const d = await prisma.document.findFirst({
        where: { id: entityId, project: { userId } },
      })
      return !!d
    }
    case "documentLink": {
      const l = await prisma.documentLink.findFirst({
        where: { id: entityId, fromDoc: { project: { userId } } },
      })
      return !!l
    }
    case "bundle": {
      const b = await prisma.contextBundle.findFirst({
        where: { id: entityId, project: { userId } },
      })
      return !!b
    }
    case "bundleDocument": {
      const bd = await prisma.bundleDocument.findFirst({
        where: { id: entityId, bundle: { project: { userId } } },
      })
      return !!bd
    }
    case "prompt": {
      const gp = await prisma.generatedPrompt.findFirst({
        where: { id: entityId, project: { userId } },
      })
      return !!gp
    }
    default:
      return false
  }
}

async function applyMutation(
  userId: string,
  entityType: SyncEntityType,
  entityId: string,
  operation: SyncOperation,
  payload: Record<string, unknown> | null
): Promise<void> {
  if (operation === "delete") {
    // Soft-delete for syncable entities, hard-delete for relationships
    switch (entityType) {
      case "project":
        await prisma.project.update({ where: { id: entityId }, data: { deletedAt: new Date() } })
        break
      case "document":
        await prisma.document.update({ where: { id: entityId }, data: { deletedAt: new Date() } })
        break
      case "bundle":
        await prisma.contextBundle.update({ where: { id: entityId }, data: { deletedAt: new Date() } })
        break
      case "documentLink":
        await prisma.documentLink.delete({ where: { id: entityId } })
        break
      case "bundleDocument":
        await prisma.bundleDocument.delete({ where: { id: entityId } })
        break
      case "prompt":
        await prisma.generatedPrompt.delete({ where: { id: entityId } })
        break
    }
    return
  }

  if (!payload) return

  if (operation === "create") {
    switch (entityType) {
      case "project":
        await prisma.project.create({
          data: {
            id: entityId,
            userId,
            name: payload.name as string,
            description: (payload.description as string) ?? "",
            techStack: payload.techStack ?? [],
            status: (payload.status as ProjectStatus) ?? "ACTIVE",
          },
        })
        break
      case "document":
        await prisma.document.create({
          data: {
            id: entityId,
            projectId: payload.projectId as string,
            title: payload.title as string,
            content: (payload.content as string) ?? "",
            phase: payload.phase as any,
            docType: payload.docType as any,
            sortOrder: (payload.sortOrder as number) ?? 0,
            isFromTemplate: (payload.isFromTemplate as boolean) ?? false,
          },
        })
        break
      case "documentLink":
        await prisma.documentLink.create({
          data: {
            id: entityId,
            fromDocId: payload.fromDocId as string,
            toDocId: payload.toDocId as string,
            linkType: payload.linkType as any,
          },
        })
        break
      case "bundle":
        await prisma.contextBundle.create({
          data: {
            id: entityId,
            projectId: payload.projectId as string,
            name: payload.name as string,
            description: (payload.description as string) ?? "",
          },
        })
        break
      case "bundleDocument":
        await prisma.bundleDocument.create({
          data: {
            id: entityId,
            bundleId: payload.bundleId as string,
            documentId: payload.documentId as string,
            sortOrder: (payload.sortOrder as number) ?? 0,
          },
        })
        break
      case "prompt":
        await prisma.generatedPrompt.create({
          data: {
            id: entityId,
            projectId: payload.projectId as string,
            documentId: (payload.documentId as string) ?? null,
            targetTool: payload.targetTool as any,
            promptContent: payload.promptContent as string,
            options: payload.options ?? {},
          },
        })
        break
    }
    return
  }

  // operation === "update"
  switch (entityType) {
    case "project": {
      const data: Record<string, unknown> = {}
      if (payload.name !== undefined) data.name = payload.name
      if (payload.description !== undefined) data.description = payload.description
      if (payload.techStack !== undefined) data.techStack = payload.techStack
      if (payload.status !== undefined) data.status = payload.status
      await prisma.project.update({ where: { id: entityId }, data })
      break
    }
    case "document": {
      const data: Record<string, unknown> = {}
      if (payload.title !== undefined) data.title = payload.title
      if (payload.content !== undefined) data.content = payload.content
      if (payload.sortOrder !== undefined) data.sortOrder = payload.sortOrder
      await prisma.document.update({ where: { id: entityId }, data })
      break
    }
    case "bundle": {
      const data: Record<string, unknown> = {}
      if (payload.name !== undefined) data.name = payload.name
      if (payload.description !== undefined) data.description = payload.description
      await prisma.contextBundle.update({ where: { id: entityId }, data })
      break
    }
  }
}

/**
 * Register a new sync device for a user.
 */
export async function registerDevice(
  userId: string,
  deviceName: string,
  platform: string
): Promise<string> {
  const device = await prisma.syncDevice.create({
    data: { userId, deviceName, platform },
  })
  return device.id
}

/**
 * Update the last sync timestamp for a device.
 */
export async function touchDevice(deviceId: string): Promise<void> {
  await prisma.syncDevice.update({
    where: { id: deviceId },
    data: { lastSyncAt: new Date() },
  })
}
