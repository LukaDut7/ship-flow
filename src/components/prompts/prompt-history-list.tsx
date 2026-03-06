"use client"

import { useState } from "react"
import { toast } from "sonner"
import { ChevronDownIcon, ChevronUpIcon, CopyIcon, Trash2Icon } from "lucide-react"
import { timeAgo } from "@/lib/time-ago"
import { TARGET_TOOL_LABELS } from "@/lib/constants"
import { deletePromptHistory } from "@/actions/prompts"
import { CopyButton } from "./copy-button"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PromptHistoryListProps {
  prompts: Array<{
    id: string
    targetTool: string
    promptContent: string
    createdAt: string
    document?: { title: string } | null
  }>
  projectId: string
}

export function PromptHistoryList({ prompts, projectId }: PromptHistoryListProps) {
  if (prompts.length === 0) {
    return (
      <p className="text-center text-sm text-muted-foreground">
        No prompts generated yet. Generate your first prompt to see it here.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {prompts.map((prompt) => (
        <PromptHistoryCard key={prompt.id} prompt={prompt} />
      ))}
    </div>
  )
}

function PromptHistoryCard({
  prompt,
}: {
  prompt: {
    id: string
    targetTool: string
    promptContent: string
    createdAt: string
    document?: { title: string } | null
  }
}) {
  const [expanded, setExpanded] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const title = prompt.document?.title ?? "Unknown"
  const preview = prompt.promptContent.slice(0, 120)
  const hasMore = prompt.promptContent.length > 120

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePromptHistory(prompt.id)
      toast.success("Prompt deleted")
      setDeleteDialogOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              <Badge variant="secondary" className="text-[10px]">
                {TARGET_TOOL_LABELS[prompt.targetTool] ?? prompt.targetTool}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {timeAgo(new Date(prompt.createdAt))}
              </span>
            </div>
            <div className="flex gap-2">
              <CopyButton text={prompt.promptContent} />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteDialogOpen(true)}
                className="gap-2"
              >
                <Trash2Icon className="size-4" />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              {expanded ? prompt.promptContent : `${preview}${hasMore ? "…" : ""}`}
            </p>
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded(!expanded)}
                className="h-8 gap-1 text-xs"
              >
                {expanded ? (
                  <>
                    <ChevronUpIcon className="size-3.5" />
                    Collapse
                  </>
                ) : (
                  <>
                    <ChevronDownIcon className="size-3.5" />
                    Expand
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete prompt?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The prompt will be permanently removed from history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
