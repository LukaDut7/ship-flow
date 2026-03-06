"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { addDocumentLink, removeDocumentLink } from "@/actions/documents"
import { LINK_TYPE_LABELS } from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import type { LinkType } from "@prisma/client"

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
  const [selectedLinkType, setSelectedLinkType] = useState<LinkType>("REFERENCES")

  const availableDocs = allDocs.filter((d) => d.id !== docId)
  const linkedDocIds = new Set(linksFrom.map((l) => l.toDoc?.id).filter(Boolean))

  const handleAddLink = async () => {
    if (!selectedDocId) return
    if (linkedDocIds.has(selectedDocId)) return

    const result = await addDocumentLink(docId, selectedDocId, selectedLinkType)
    if (result?.error) return

    setOpen(false)
    setSelectedDocId("")
    setSelectedLinkType("REFERENCES")
    router.refresh()
  }

  const handleRemoveLink = async (linkId: string) => {
    await removeDocumentLink(linkId)
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Document Links</h3>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" variant="outline">
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
      </div>

      <div className="space-y-2">
        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
            Links to
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {linksFrom.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No outgoing links
              </span>
            ) : (
              linksFrom.map((link) => (
                <Badge
                  key={link.id}
                  variant="secondary"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="text-[10px]">
                    {LINK_TYPE_LABELS[link.linkType] || link.linkType}:
                  </span>
                  <span>{link.toDoc?.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link.id)}
                    className="rounded p-0.5 hover:bg-muted"
                    aria-label="Remove link"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>

        <div>
          <h4 className="mb-1.5 text-xs font-medium text-muted-foreground">
            Linked from
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {linksTo.length === 0 ? (
              <span className="text-xs text-muted-foreground">
                No incoming links
              </span>
            ) : (
              linksTo.map((link) => (
                <Badge
                  key={link.id}
                  variant="outline"
                  className="flex items-center gap-1 pr-1"
                >
                  <span className="text-[10px]">
                    {LINK_TYPE_LABELS[link.linkType] || link.linkType}:
                  </span>
                  <span>{link.fromDoc?.title}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLink(link.id)}
                    className="rounded p-0.5 hover:bg-muted"
                    aria-label="Remove link"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
