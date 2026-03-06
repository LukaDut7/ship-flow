"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useTransition } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { saveContent, updateDocument } from "@/actions/documents"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

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
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "split">("split")
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [isPending, startTransition] = useTransition()
  const titleInputRef = useRef<HTMLInputElement>(null)

  const debouncedSave = useCallback(
    debounce((value: string) => {
      startTransition(async () => {
        setSaveStatus("saving")
        await saveContent(docId, value)
        setSaveStatus("saved")
        setTimeout(() => setSaveStatus("idle"), 2000)
      })
    }, 800),
    [docId]
  )

  useEffect(() => {
    if (content !== initialContent) {
      debouncedSave(content)
    }
  }, [content, debouncedSave, initialContent])

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

  const statusText =
    isPending || saveStatus === "saving"
      ? "Saving..."
      : saveStatus === "saved"
        ? "Saved"
        : null

  const editorArea = (
    <Textarea
      value={content}
      onChange={handleContentChange}
      className="min-h-[400px] font-mono text-sm"
      placeholder="Write your document in Markdown..."
    />
  )

  const previewArea = (
    <div className="prose prose-sm dark:prose-invert max-w-none min-h-[400px] rounded-md border bg-muted/30 p-4">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
    </div>
  )

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
        onValueChange={(v) => setViewMode(v as "edit" | "preview" | "split")}
      >
        <div className="flex items-center justify-between gap-4">
          <TabsList>
            <TabsTrigger value="edit">Edit</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="split">Split</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {statusText && <span>{statusText}</span>}
            <span>{wordCount(content)} words</span>
          </div>
        </div>

        <TabsContent value="edit" className="mt-4">
          {editorArea}
        </TabsContent>

        <TabsContent value="preview" className="mt-4">
          {previewArea}
        </TabsContent>

        <TabsContent value="split" className="mt-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-muted-foreground">
                Edit
              </span>
              {editorArea}
            </div>
            <div className="flex flex-col">
              <span className="mb-1 text-xs font-medium text-muted-foreground">
                Preview
              </span>
              {previewArea}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end text-xs text-muted-foreground">
        {wordCount(content)} words
      </div>
    </div>
  )
}
