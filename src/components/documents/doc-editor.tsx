"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useTransition } from "react"
import { CollapsibleMarkdown } from "@/components/ui/collapsible-markdown"
import { saveContent, updateDocument } from "@/actions/documents"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Check, Loader2, CircleDot } from "lucide-react"

interface DocEditorProps {
  docId: string
  initialContent: string
  initialTitle: string
}

function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  ms: number
): (...args: A) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null
  return (...args: A) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => fn(...args), ms)
  }
}

function wordCount(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

export function DocEditor({
  docId,
  initialContent,
  initialTitle,
}: DocEditorProps) {
  const [content, setContent] = useState(initialContent)
  const [title, setTitle] = useState(initialTitle)
  const [viewMode, setViewMode] = useState<"edit" | "preview">("edit")
  const [saveStatus, setSaveStatus] = useState<
    "saved" | "unsaved" | "saving"
  >("saved")
  const [isPending, startTransition] = useTransition()
  const titleInputRef = useRef<HTMLInputElement>(null)
  const savedContentRef = useRef(initialContent)

  const debouncedSave = useCallback(
    debounce((value: string) => {
      startTransition(async () => {
        setSaveStatus("saving")
        await saveContent(docId, value)
        savedContentRef.current = value
        setSaveStatus("saved")
      })
    }, 800),
    [docId]
  )

  useEffect(() => {
    if (content !== savedContentRef.current) {
      setSaveStatus("unsaved")
      debouncedSave(content)
    }
  }, [content, debouncedSave])

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value)
  }

  const handleTitleBlur = () => {
    if (title !== initialTitle && title.trim()) {
      const formData = new FormData()
      formData.set("title", title.trim())
      updateDocument(docId, formData)
    }
  }

  const isSaving = isPending || saveStatus === "saving"

  return (
    <div className="flex flex-col gap-4">
      <Input
        ref={titleInputRef}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={handleTitleBlur}
        className="text-lg font-semibold"
        placeholder="Document title"
      />

      <Tabs
        value={viewMode}
        onValueChange={(v) => setViewMode(v as "edit" | "preview")}
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              {isSaving ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "unsaved" ? (
                <>
                  <CircleDot className="size-3 text-amber-500" />
                  Unsaved changes
                </>
              ) : (
                <>
                  <Check className="size-3 text-emerald-500" />
                  Saved
                </>
              )}
            </span>
            <span className="text-muted-foreground/60">|</span>
            <span>{wordCount(content)} words</span>
          </div>
        </div>

        <TabsContent value="edit" className="mt-4">
          <Textarea
            value={content}
            onChange={handleContentChange}
            className="min-h-[500px] font-mono text-sm leading-relaxed"
            placeholder="Write your document in Markdown..."
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          <CollapsibleMarkdown
            content={content}
            className="prose prose-sm dark:prose-invert max-w-none min-h-[500px] rounded-lg border bg-card p-6 shadow-sm prose-headings:font-semibold prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-p:leading-relaxed prose-li:leading-relaxed prose-blockquote:border-l-primary/50 prose-blockquote:text-muted-foreground prose-code:rounded prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:text-xs prose-pre:bg-muted prose-pre:text-xs"
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
