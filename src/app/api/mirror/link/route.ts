// POST /api/mirror/link — Link a project to a workspace folder.
// Desktop-only endpoint. Triggers initial file sync.

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { projectId, workspaceRoot } = body as {
    projectId: string
    workspaceRoot: string
  }

  if (!projectId || !workspaceRoot) {
    return NextResponse.json(
      { error: "projectId and workspaceRoot are required" },
      { status: 400 }
    )
  }

  try {
    const { linkWorkspace } = await import("@/lib/file-mirror")
    const result = await linkWorkspace(projectId, workspaceRoot)

    return NextResponse.json({
      linked: true,
      filesWritten: result.filesWritten,
      workspaceRoot,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Link failed"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
