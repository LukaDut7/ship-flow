import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { registerDevice } from "@/lib/sync/cloud-sync-service"
import type { SyncRegisterRequest, SyncRegisterResponse } from "@/lib/sync/types"

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body: SyncRegisterRequest = await request.json()
  if (!body.deviceName || !body.platform) {
    return NextResponse.json({ error: "deviceName and platform required" }, { status: 400 })
  }

  const deviceId = await registerDevice(session.user.id, body.deviceName, body.platform)

  return NextResponse.json({ deviceId } satisfies SyncRegisterResponse)
}
