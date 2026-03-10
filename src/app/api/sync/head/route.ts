import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getServerSeq } from "@/lib/sync/cloud-sync-service"
import type { SyncHeadResponse } from "@/lib/sync/types"

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const deviceId = request.nextUrl.searchParams.get("deviceId") ?? ""
  const serverSeq = await getServerSeq(session.user.id)

  return NextResponse.json({
    serverSeq,
    deviceId,
    lastSyncAt: new Date().toISOString(),
  } satisfies SyncHeadResponse)
}
