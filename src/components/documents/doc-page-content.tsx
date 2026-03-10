"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Sparkles, Link2 } from "lucide-react"
import { DocEditor } from "@/components/documents/doc-editor"
import { DocDeleteButton } from "@/components/documents/doc-delete-button"
import { DocExportButton } from "@/components/documents/doc-export-button"
import { DocLinkManager } from "@/components/documents/doc-link-manager"
import { WritingPanel } from "@/components/documents/writing-panel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

interface LinkedDoc {
  docId: string
  docTitle: string
  linkType: string
}

interface DocPageContentProps {
  docId: string
  title: string
  content: string
  phase: string
  docType: string
  phaseLabel: string
  docTypeLabel: string
  updatedAgo: string
  wordCount: number
  linkedDocs: LinkedDoc[]
  linksFrom: Array<{
    id: string
    linkType: string
    toDoc: { id: string; title: string }
  }>
  linksTo: Array<{
    id: string
    linkType: string
    fromDoc: { id: string; title: string }
  }>
  allDocs: Array<{ id: string; title: string }>
}

const MIN_PANEL_WIDTH = 320
const DEFAULT_PANEL_WIDTH = 400

export function DocPageContent({
  docId,
  title,
  content,
  phaseLabel,
  docTypeLabel,
  updatedAgo,
  wordCount,
  linkedDocs,
  linksFrom,
  linksTo,
  allDocs,
}: DocPageContentProps) {
  const [panelOpen, setPanelOpen] = useState(false)
  const [linksOpen, setLinksOpen] = useState(false)
  const [panelWidth, setPanelWidth] = useState(DEFAULT_PANEL_WIDTH)
  const [isResizing, setIsResizing] = useState(false)
  const resizeRef = useRef({ startX: 0, startWidth: 0 })

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setIsResizing(true)
    resizeRef.current = { startX: e.clientX, startWidth: panelWidth }
  }, [panelWidth])

  useEffect(() => {
    if (!isResizing) return

    const handleMouseMove = (e: MouseEvent) => {
      const diff = resizeRef.current.startX - e.clientX
      const maxWidth = window.innerWidth * 0.5
      const newWidth = Math.max(
        MIN_PANEL_WIDTH,
        Math.min(maxWidth, resizeRef.current.startWidth + diff)
      )
      setPanelWidth(newWidth)
    }

    const handleMouseUp = () => setIsResizing(false)

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isResizing])

  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <main className="min-w-0 flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{phaseLabel}</Badge>
            <Badge variant="outline">{docTypeLabel}</Badge>
            <span className="text-xs text-muted-foreground">
              Updated {updatedAgo}
            </span>
            <span className="text-xs text-muted-foreground">
              {wordCount} words
            </span>
            <Button
              size="sm"
              variant={panelOpen ? "default" : "outline"}
              onClick={() => setPanelOpen(!panelOpen)}
            >
              <Sparkles className="mr-1 size-3.5" />
              Help me write this
            </Button>
            <Sheet open={linksOpen} onOpenChange={setLinksOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="ghost">
                  <Link2 className="mr-1 size-3.5" />
                  Links
                </Button>
              </SheetTrigger>
              <SheetContent className="px-5 py-5">
                <SheetHeader className="px-0">
                  <SheetTitle>Document Links</SheetTitle>
                </SheetHeader>
                <div className="mt-2 min-h-0 flex-1 overflow-y-auto">
                  <DocLinkManager
                    docId={docId}
                    linksFrom={linksFrom}
                    linksTo={linksTo}
                    allDocs={allDocs}
                  />
                </div>
              </SheetContent>
            </Sheet>
            <DocExportButton docId={docId} />
            <DocDeleteButton docId={docId} />
          </div>

          <DocEditor
            docId={docId}
            initialContent={content}
            initialTitle={title}
          />
        </div>
      </main>

      {panelOpen && (
        <>
          {/* Resize handle */}
          <div
            onMouseDown={handleResizeStart}
            className="w-1 shrink-0 cursor-col-resize bg-border transition-colors hover:bg-primary/40 active:bg-primary/60"
          />
          <WritingPanel
            docId={docId}
            linkedDocs={linkedDocs}
            onClose={() => setPanelOpen(false)}
            width={panelWidth}
          />
        </>
      )}
    </div>
  )
}
