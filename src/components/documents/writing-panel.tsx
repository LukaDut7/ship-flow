"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { toast } from "sonner"
import { CollapsibleMarkdown } from "@/components/ui/collapsible-markdown"
import {
  Sparkles,
  Copy,
  Check,
  X,
  Send,
  Lock,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react"
import { generateWritingPromptWithOptions } from "@/actions/writing-prompts"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import { LINK_TYPE_LABELS } from "@/lib/constants"

interface LinkedDoc {
  docId: string
  docTitle: string
  linkType: string
}

interface WritingPanelProps {
  docId: string
  linkedDocs: LinkedDoc[]
  onClose: () => void
  width?: number
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

export function WritingPanel({ docId, linkedDocs, onClose, width }: WritingPanelProps) {
  const [prompt, setPrompt] = useState("")
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [copied, setCopied] = useState(false)
  const fetchIdRef = useRef(0)

  // Context options
  const [includeProject, setIncludeProject] = useState(true)
  const [includeTechStack, setIncludeTechStack] = useState(true)
  const [selectedLinkedDocIds, setSelectedLinkedDocIds] = useState<string[]>(
    linkedDocs
      .filter((d) => d.linkType === "DEPENDS_ON" || d.linkType === "IMPLEMENTS")
      .map((d) => d.docId)
  )
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [contextOpen, setContextOpen] = useState(true)

  const fetchPrompt = useCallback(async () => {
    const id = ++fetchIdRef.current
    if (prompt) {
      setIsRefreshing(true)
    }
    try {
      const result = await generateWritingPromptWithOptions(docId, {
        includeProjectContext: includeProject,
        includeTechStack,
        contextDocIds: selectedLinkedDocIds,
        additionalInstructions: additionalInstructions.trim() || undefined,
      })
      if (id === fetchIdRef.current) {
        setPrompt(result)
      }
    } catch {
      toast.error("Failed to generate prompt")
    } finally {
      if (id === fetchIdRef.current) {
        setIsInitialLoad(false)
        setIsRefreshing(false)
      }
    }
  }, [
    docId,
    includeProject,
    includeTechStack,
    selectedLinkedDocIds,
    additionalInstructions,
    prompt,
  ])

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedFetch = useCallback(debounce(fetchPrompt, 400), [fetchPrompt])

  // Initial load
  useEffect(() => {
    fetchPrompt()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Regenerate on option changes (debounced)
  useEffect(() => {
    debouncedFetch()
  }, [
    includeProject,
    includeTechStack,
    selectedLinkedDocIds,
    additionalInstructions,
    debouncedFetch,
  ])

  function toggleLinkedDoc(id: string) {
    setSelectedLinkedDocIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      toast.success("Copied! Paste into ChatGPT, Claude, or any AI tool.")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const charCount = prompt.length
  const estTokens = Math.ceil(charCount / 4)

  return (
    <div
      className="flex h-full shrink-0 flex-col border-l bg-background"
      style={width ? { width: `${width}px` } : undefined}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" />
          <span className="text-sm font-medium">Writing Assistant</span>
          {isRefreshing && (
            <Loader2 className="size-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      {/* Context options (collapsible) */}
      <div className="shrink-0 border-b">
        <button
          className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-muted-foreground hover:bg-muted/50"
          onClick={() => setContextOpen(!contextOpen)}
        >
          {contextOpen ? (
            <ChevronDown className="size-3" />
          ) : (
            <ChevronRight className="size-3" />
          )}
          Prompt Context
        </button>

        {contextOpen && (
          <div className="space-y-2 px-4 pb-3">
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={includeProject}
                onChange={(e) => setIncludeProject(e.target.checked)}
                className="rounded border-input"
              />
              Project name & description
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={includeTechStack}
                onChange={(e) => setIncludeTechStack(e.target.checked)}
                className="rounded border-input"
              />
              Tech stack
            </label>

            {linkedDocs.length > 0 && (
              <>
                <Separator className="my-1" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                  Dependent Documents
                </span>
                {linkedDocs.map((ld) => (
                  <label
                    key={ld.docId}
                    className="flex cursor-pointer items-center gap-2 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLinkedDocIds.includes(ld.docId)}
                      onChange={() => toggleLinkedDoc(ld.docId)}
                      className="rounded border-input"
                    />
                    <span className="truncate">{ld.docTitle}</span>
                    <span className="ml-auto shrink-0 text-[10px] text-muted-foreground">
                      {LINK_TYPE_LABELS[ld.linkType] ?? ld.linkType}
                    </span>
                  </label>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Message area */}
      <div className="min-h-0 flex-1 overflow-y-auto p-4">
        {isInitialLoad ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-3.5 animate-pulse" />
            Generating prompt...
          </div>
        ) : (
          <div className="space-y-3">
            {/* AI message bubble */}
            <div className="overflow-hidden rounded-lg border bg-muted/30 p-3">
              <CollapsibleMarkdown
                content={prompt}
                className="prose prose-sm dark:prose-invert max-w-none break-words text-xs leading-relaxed [&_pre]:overflow-x-auto [&_code]:break-all"
              />
            </div>

            {/* Copy action */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {charCount > 0 &&
                  `${charCount.toLocaleString()} chars · ~${estTokens.toLocaleString()} tokens`}
              </span>
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? (
                  <>
                    <Check className="mr-1 size-3" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-3" />
                    Copy Prompt
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Chat input area — coming soon */}
      <div className="shrink-0 border-t p-3">
        <div className="relative">
          <Textarea
            placeholder="Ask AI about this document..."
            className="resize-none pr-10 text-sm"
            rows={2}
            value={additionalInstructions}
            onChange={(e) => setAdditionalInstructions(e.target.value)}
          />
          <Button
            size="icon-sm"
            variant="ghost"
            className="absolute bottom-2 right-2"
            disabled
          >
            <Send className="size-3.5" />
          </Button>
        </div>
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <Lock className="size-3" />
          <span>
            AI chat coming soon. For now, copy the prompt above and paste into
            any AI tool.
          </span>
        </div>
      </div>
    </div>
  )
}
