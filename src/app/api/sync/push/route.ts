import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  applyPushedChange,
  getServerSeq,
  touchDevice,
} from "@/lib/sync/cloud-sync-service"
import type { SyncPushRequest, SyncPushResponse } from "@/lib/sync/types"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: SyncPushRequest = await request.json()

  if (!body.deviceId || !Array.isArray(body.changes)) {
    return NextResponse.json({ error: "deviceId and changes required" }, { status: 400 })
  }

  // Check for stale push — if server has advanced beyond what client knows,
  // the client should pull first to avoid conflicts
  const currentServerSeq = await getServerSeq(session.user.id)
  if (body.lastKnownServerSeq < currentServerSeq) {
    // There are server changes the client hasn't seen.
    // We still try to apply, but flag conflicts.
  }

  let accepted = 0
  const rejected: SyncPushResponse["rejected"] = []

  // Sort changes by clientSeq to maintain ordering
  const sortedChanges = [...body.changes].sort((a, b) => a.clientSeq - b.clientSeq)

  for (const change of sortedChanges) {
    try {
      await applyPushedChange(
        session.user.id,
        change.entityType,
        change.entityId,
        change.operation,
        change.payload,
        body.deviceId
      )
      accepted++
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error"

      // For update conflicts, try to provide server version
      let serverVersion: Record<string, unknown> | undefined
      if (change.operation === "update" && change.entityType === "document") {
        try {
          const { prisma } = await import("@/lib/prisma")
          const doc = await prisma.document.findUnique({ where: { id: change.entityId } })
          if (doc) {
            serverVersion = {
              id: doc.id,
              title: doc.title,
              content: doc.content,
              updatedAt: doc.updatedAt.toISOString(),
            }
          }
        } catch {
          // Non-fatal
        }
      }

      rejected.push({
        entityId: change.entityId,
        reason: message,
        serverVersion,
      })
    }
  }

  // Update device last sync time
  try {
    await touchDevice(body.deviceId)
  } catch {
    // Non-fatal
  }

  const serverSeq = await getServerSeq(session.user.id)

  return NextResponse.json({
    accepted,
    rejected,
    serverSeq,
  } satisfies SyncPushResponse)
}
