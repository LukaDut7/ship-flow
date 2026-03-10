"use client"

import { useState } from "react"
import { X, Plus, ArrowRight, ArrowLeft } from "lucide-react"
import { addDocumentLink, removeDocumentLink } from "@/actions/documents"
import { LINK_TYPE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import type { LinkType } from "@/lib/types/enums"

interface DocLink {
  id: string
  linkType: string
  toDoc?: { id: string; title: string }
  fromDoc?: { id: string; title: string }
}

interface DocLinkManagerProps {
  docId: string
  projectId: string
  linksFrom: DocLink[]
  linksTo: DocLink[]
  allDocs: Array<{ id: string; title: string }>
}

const LINK_TYPES: LinkType[] = [
  "REFERENCES",
  "DEPENDS_ON",
  "IMPLEMENTS",
  "SUPERSEDES",
]

export function DocLinkManager({
  docId,
  projectId,
  linksFrom,
  linksTo,
  allDocs,
}: DocLinkManagerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState<string>("")
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType>("DEPENDS_ON")

  const availableDocs = allDocs.filter((d) => d.id !== docId)
  const linkedDocIds = new Set(linksFrom.map((l) => l.toDoc?.id).filter(Boolean))

  const handleAddLink = async () => {
    if (!selectedDocId) return
    if (linkedDocIds.has(selectedDocId)) return

    const result = await addDocumentLink(docId, selectedDocId, selectedLinkType)
    if (result?.error) return

    setOpen(false)
    setSelectedDocId("")
    setSelectedLinkType("DEPENDS_ON")
    router.refresh()
  }

  const handleRemoveLink = async (linkId: string) => {
    await removeDocumentLink(linkId)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Add Link button */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button size="sm" className="w-full">
            <Plus className="mr-1.5 size-3.5" />
            Add Link
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Document Link</DialogTitle>
            <DialogDescription>
              Link this document to another document in the project.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label>Document</Label>
              <Select
                value={selectedDocId}
                onValueChange={setSelectedDocId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a document" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocs.filter((d) => !linkedDocIds.has(d.id)).map((doc) => (
                    <SelectItem key={doc.id} value={doc.id}>
                      {doc.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Link Type</Label>
              <Select
                value={selectedLinkType}
                onValueChange={(v) => setSelectedLinkType(v as LinkType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LINK_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {LINK_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddLink}
              disabled={!selectedDocId}
            >
              Add Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Outgoing links — this doc depends on / references these */}
      <div className="space-y-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ArrowRight className="size-3 text-primary" />
            <span>This doc uses</span>
          </div>
          <p className="ml-[18px] text-[11px] text-muted-foreground">
            Documents this one depends on or references
          </p>
        </div>
        {linksFrom.length > 0 ? (
          <div className="space-y-1.5">
            {linksFrom.map((link) => (
              <div
                key={link.id}
                className="group flex items-center gap-2.5 rounded-lg border bg-muted/30 px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{link.toDoc?.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {LINK_TYPE_LABELS[link.linkType] || link.linkType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label="Remove link"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No outgoing links</p>
          </div>
        )}
      </div>

      {/* Incoming links — other docs that reference this one */}
      <div className="space-y-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium">
            <ArrowLeft className="size-3 text-muted-foreground" />
            <span>Used by</span>
          </div>
          <p className="ml-[18px] text-[11px] text-muted-foreground">
            Other documents that depend on or reference this one
          </p>
        </div>
        {linksTo.length > 0 ? (
          <div className="space-y-1.5">
            {linksTo.map((link) => (
              <div
                key={link.id}
                className="group flex items-center gap-2.5 rounded-lg border border-dashed px-3 py-2.5"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm">{link.fromDoc?.title}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {LINK_TYPE_LABELS[link.linkType] || link.linkType}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveLink(link.id)}
                  className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                  aria-label="Remove link"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No incoming links</p>
          </div>
        )}
      </div>
    </div>
  )
}
