"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"

interface WorkspaceLinkCardProps {
  projectId: string
}

declare global {
  interface Window {
    shipflow?: {
      invoke: (channel: string, ...args: unknown[]) => Promise<unknown>
      isDesktop?: boolean
    }
  }
}

export function WorkspaceLinkCard({ projectId }: WorkspaceLinkCardProps) {
  const [status, setStatus] = React.useState<{
    linked: boolean
    workspaceRoot: string | null
    fileCount: number
  }>({ linked: false, workspaceRoot: null, fileCount: 0 })
  const [isLinking, setIsLinking] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const isDesktop = typeof window !== "undefined" && window.shipflow?.isDesktop

  React.useEffect(() => {
    if (!isDesktop) return
    fetch("/api/mirror/status")
      .then((res) => res.json())
      .then((data) => {
        if (data.projectId === projectId) {
          setStatus({
            linked: data.linked,
            workspaceRoot: data.workspaceRoot,
            fileCount: data.fileCount,
          })
        }
      })
      .catch(() => {})
  }, [isDesktop, projectId])

  if (!isDesktop) return null

  async function handleLink() {
    setError(null)
    setIsLinking(true)
    try {
      const folderPath = await window.shipflow!.invoke("folder:pick")
      if (!folderPath) {
        setIsLinking(false)
        return
      }

      const res = await fetch("/api/mirror/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, workspaceRoot: folderPath }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Failed to link workspace")
      } else {
        setStatus({
          linked: true,
          workspaceRoot: folderPath as string,
          fileCount: data.filesWritten,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link workspace")
    } finally {
      setIsLinking(false)
    }
  }

  async function handleUnlink() {
    try {
      await fetch("/api/mirror/unlink", { method: "POST" })
      setStatus({ linked: false, workspaceRoot: null, fileCount: 0 })
    } catch {
      setError("Failed to unlink workspace")
    }
  }

  async function handleResync() {
    try {
      await fetch("/api/mirror/resync", { method: "POST" })
    } catch {
      setError("Failed to resync")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workspace Folder</CardTitle>
        <CardDescription>
          Mirror your project documents as markdown files in a local folder.
          Edit files in VS Code, Cursor, or any editor — changes sync
          automatically.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {status.linked ? (
          <>
            <div className="rounded-md bg-muted p-3 text-sm">
              <p className="font-medium">Linked to:</p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                {status.workspaceRoot}
              </p>
              <p className="mt-1 text-muted-foreground">
                {status.fileCount} file{status.fileCount !== 1 ? "s" : ""} mirrored
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleResync}>
                Re-sync Files
              </Button>
              <Button variant="outline" size="sm" onClick={handleUnlink}>
                Unlink Folder
              </Button>
            </div>
          </>
        ) : (
          <Button onClick={handleLink} disabled={isLinking}>
            {isLinking ? "Linking..." : "Link Workspace Folder"}
          </Button>
        )}
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </CardContent>
    </Card>
  )
}
