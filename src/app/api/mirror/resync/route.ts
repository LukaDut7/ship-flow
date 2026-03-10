// POST /api/mirror/resync — Force a full re-sync of all documents to the workspace.

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST() {
  if (process.env.SHIPFLOW_RUNTIME !== "desktop") {
    return NextResponse.json(
      { error: "File mirror is only available on desktop" },
      { status: 400 }
    )
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { resyncAll } = await import("@/lib/file-mirror")
    await resyncAll()
    return NextResponse.json({ resynced: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Resync failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
