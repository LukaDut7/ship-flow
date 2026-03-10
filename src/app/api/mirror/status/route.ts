// GET /api/mirror/status — Get current file mirror status.

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function GET() {
  if (process.env.SHIPFLOW_RUNTIME !== "desktop") {
    return NextResponse.json({
      linked: false,
      projectId: null,
      workspaceRoot: null,
      watching: false,
      fileCount: 0,
    })
  }

  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const { getMirrorStatus } = await import("@/lib/file-mirror")
    return NextResponse.json(getMirrorStatus())
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
