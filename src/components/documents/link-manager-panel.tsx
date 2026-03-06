"use client"

import { useState } from "react"
import { PanelRightClose, PanelRightOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DocLinkManager } from "./doc-link-manager"
import { cn } from "@/lib/utils"

interface LinkManagerPanelProps {
  docId: string
  projectId: string
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

export function LinkManagerPanel({
  docId,
  projectId,
  linksFrom,
  linksTo,
  allDocs,
}: LinkManagerPanelProps) {
  const [open, setOpen] = useState(true)

  return (
    <div
      className={cn(
        "flex flex-col border-l bg-muted/20 md:min-w-[240px] md:max-w-[280px]",
        !open && "md:min-w-0 md:max-w-12"
      )}
    >
      <div className="flex items-center justify-between border-b p-2 md:justify-end">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setOpen(!open)}
          aria-label={open ? "Collapse links panel" : "Expand links panel"}
        >
          {open ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )}
        </Button>
      </div>
      {open && (
        <div className="flex-1 overflow-y-auto p-4">
          <DocLinkManager
            docId={docId}
            projectId={projectId}
            linksFrom={linksFrom}
            linksTo={linksTo}
            allDocs={allDocs}
          />
        </div>
      )}
    </div>
  )
}
