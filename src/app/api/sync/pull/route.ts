import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { pullChanges, getServerSeq, touchDevice } from "@/lib/sync/cloud-sync-service"
import type { SyncPullResponse } from "@/lib/sync/types"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sinceParam = request.nextUrl.searchParams.get("since")
  const limitParam = request.nextUrl.searchParams.get("limit")
  const deviceId = request.nextUrl.searchParams.get("deviceId")

  const sinceSeq = sinceParam ? parseInt(sinceParam, 10) : 0
  const limit = limitParam ? Math.min(parseInt(limitParam, 10), 500) : 100

  if (isNaN(sinceSeq)) {
    return NextResponse.json({ error: "Invalid since parameter" }, { status: 400 })
  }

  const { changes, hasMore } = await pullChanges(session.user.id, sinceSeq, limit)
  const serverSeq = await getServerSeq(session.user.id)

  // Update device last sync time
  if (deviceId) {
    try {
      await touchDevice(deviceId)
    } catch {
      // Non-fatal: device might not exist yet
    }
  }

  return NextResponse.json({
    changes,
    serverSeq,
    hasMore,
  } satisfies SyncPullResponse)
}
