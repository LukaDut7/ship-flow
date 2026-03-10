// POST /api/mirror/unlink — Unlink the workspace folder.
// Stops the file watcher but does NOT delete the files.

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
    const { unlinkWorkspace } = await import("@/lib/file-mirror")
    await unlinkWorkspace()
    return NextResponse.json({ unlinked: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unlink failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
