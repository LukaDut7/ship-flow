"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CollapsibleMarkdown } from "@/components/ui/collapsible-markdown"
import { DownloadIcon, Copy, Check } from "lucide-react"
import { generateWritingPromptWithOptions } from "@/actions/writing-prompts"
import { generateAndSavePrompt } from "@/actions/prompts"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { PHASE_LABELS } from "@/lib/constants"
import type { Phase } from "@/lib/types/enums"

interface Document {
  id: string
  title: string
  phase: string
  docType: string
}

interface WritingAssistantProps {
  projectId: string
  documents: Document[]
  initialDocId?: string
}

export function WritingAssistant({
  projectId,
  documents,
  initialDocId,
}: WritingAssistantProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocId ?? documents[0]?.id ?? ""
  )
  const [includeProjectContext, setIncludeProjectContext] = useState(true)
  const [includeTechStack, setIncludeTechStack] = useState(true)
  const [additionalInstructions, setAdditionalInstructions] = useState("")
  const [preview, setPreview] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchPreview = useCallback(async () => {
    if (!selectedDocId) {
      setPreview("")
      return
    }
    setIsLoading(true)
    try {
      const result = await generateWritingPromptWithOptions(selectedDocId, {
        includeProjectContext,
        includeTechStack,
        additionalInstructions: additionalInstructions.trim() || undefined,
      })
      setPreview(result)
    } catch (err) {
      setPreview("")
      toast.error(
        err instanceof Error ? err.message : "Failed to generate prompt"
      )
    } finally {
      setIsLoading(false)
    }
  }, [
    selectedDocId,
    includeProjectContext,
    includeTechStack,
    additionalInstructions,
  ])

  useEffect(() => {
    if (!selectedDocId) return
    const t = setTimeout(fetchPreview, 500)
    return () => clearTimeout(t)
  }, [selectedDocId, fetchPreview])

  useEffect(() => {
    if (initialDocId && documents.some((d) => d.id === initialDocId)) {
      setSelectedDocId(initialDocId)
    } else if (documents.length > 0 && !selectedDocId) {
      setSelectedDocId(documents[0].id)
    }
  }, [initialDocId, documents, selectedDocId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview)
      setCopied(true)
      toast.success("Copied! Paste into ChatGPT, Claude, or any AI tool.")
      setTimeout(() => setCopied(false), 3000)
    } catch {
      toast.error("Failed to copy")
    }
  }

  const handleSave = async () => {
    if (!selectedDocId) {
      toast.error("Please select a document")
      return
    }
    setIsSaving(true)
    try {
      await generateAndSavePrompt(projectId, selectedDocId, "GENERIC", {
        includeProjectContext,
        includeTechStack,
        includePhaseContext: true,
        includeLinkedDocs: true,
        customInstructions: `[Writing Assistant] ${additionalInstructions}`.trim(),
      })
      toast.success("Saved to history")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDownload = (ext: "md" | "txt") => {
    const blob = new Blob([preview], {
      type: ext === "md" ? "text/markdown" : "text/plain",
    })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `writing-prompt.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const docsByPhase = documents.reduce<Record<string, Document[]>>(
    (acc, d) => {
      const phase = d.phase
      if (!acc[phase]) acc[phase] = []
      acc[phase].push(d)
      return acc
    },
    {}
  )

  const selectedDoc = documents.find((d) => d.id === selectedDocId)
  const charCount = preview.length
  const estTokens = Math.ceil(charCount / 4)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6 lg:max-w-md">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">
              Which document do you need help with?
            </h2>
            <p className="text-xs text-muted-foreground">
              We&apos;ll generate a prompt you can copy into any AI tool to help
              you write this document.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Document</Label>
              <Select
                value={selectedDocId}
                onValueChange={setSelectedDocId}
                disabled={documents.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a document" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(docsByPhase).map(([phase, docs]) => (
                    <SelectGroup key={phase}>
                      <SelectLabel>
                        {PHASE_LABELS[phase as Phase] ?? phase}
                      </SelectLabel>
                      {docs.map((doc) => (
                        <SelectItem key={doc.id} value={doc.id}>
                          {doc.title}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>What to include in the prompt</Label>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeProjectContext}
                    onChange={(e) => setIncludeProjectContext(e.target.checked)}
                    className="rounded border-input"
                  />
                  Project name & description
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeTechStack}
                    onChange={(e) => setIncludeTechStack(e.target.checked)}
                    className="rounded border-input"
                  />
                  Tech stack
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="additional-instructions">
                Additional Instructions (optional)
              </Label>
              <Textarea
                id="additional-instructions"
                value={additionalInstructions}
                onChange={(e) => setAdditionalInstructions(e.target.value)}
                placeholder={
                  selectedDoc
                    ? `e.g., "Focus on the payments feature" or "Keep it concise, bullet points only"`
                    : "Select a document first..."
                }
                rows={3}
                className="resize-none"
              />
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy} disabled={!preview || isLoading}>
                {copied ? (
                  <>
                    <Check className="mr-1 size-3.5" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="mr-1 size-3.5" />
                    Copy to Clipboard
                  </>
                )}
              </Button>
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={!selectedDocId || isLoading || isSaving}
              >
                Save to History
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" disabled={!preview || isLoading}>
                    <DownloadIcon className="size-4" />
                    Download
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleDownload("md")}>
                    Download as .md
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDownload("txt")}>
                    Download as .txt
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="min-w-0 flex-1">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">Prompt Preview</h2>
            <span className="text-xs text-muted-foreground">
              {charCount > 0 && `${charCount} chars · ~${estTokens} tokens`}
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">
                Generating prompt...
              </p>
            ) : preview ? (
              <CollapsibleMarkdown
                content={preview}
                className="prose prose-sm dark:prose-invert max-h-[60vh] max-w-none overflow-y-auto"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a document to see the writing prompt.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
