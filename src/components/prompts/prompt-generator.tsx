"use client"

import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { CollapsibleMarkdown } from "@/components/ui/collapsible-markdown"
import { DownloadIcon } from "lucide-react"
import { BUILT_IN_TEMPLATES } from "@/lib/prompt-engine/templates"
import { generatePromptPreview, generateAndSavePrompt } from "@/actions/prompts"
import { ToolFormatPicker } from "./tool-format-picker"
import { CopyButton } from "./copy-button"
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
import type { Phase, TargetTool } from "@/lib/types/enums"

interface Document {
  id: string
  title: string
  phase: string
  docType: string
  content: string
}

interface PromptGeneratorProps {
  projectId: string
  documents: Document[]
  initialDocId?: string
}

export function PromptGenerator({
  projectId,
  documents,
  initialDocId,
}: PromptGeneratorProps) {
  const [selectedDocId, setSelectedDocId] = useState<string>(
    initialDocId ?? documents[0]?.id ?? ""
  )
  const [templateId, setTemplateId] = useState<string>("")
  const [targetTool, setTargetTool] = useState<TargetTool>("GENERIC")
  const [includeProjectContext, setIncludeProjectContext] = useState(true)
  const [includeTechStack, setIncludeTechStack] = useState(true)
  const [includePhaseContext, setIncludePhaseContext] = useState(true)
  const [includeLinkedDocs, setIncludeLinkedDocs] = useState(true)
  const [customInstructions, setCustomInstructions] = useState("")
  const [preview, setPreview] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const options = {
    includeProjectContext,
    includeTechStack,
    includePhaseContext,
    includeLinkedDocs,
    customInstructions: customInstructions.trim() || undefined,
  }

  const fetchPreview = useCallback(async () => {
    if (!selectedDocId) {
      setPreview("")
      return
    }
    setIsLoading(true)
    try {
      const opts = {
        includeProjectContext,
        includeTechStack,
        includePhaseContext,
        includeLinkedDocs,
        customInstructions: customInstructions.trim() || undefined,
      }
      const result = await generatePromptPreview(
        projectId,
        selectedDocId,
        targetTool,
        opts
      )
      setPreview(result)
    } catch (err) {
      setPreview("")
      toast.error(err instanceof Error ? err.message : "Failed to generate preview")
    } finally {
      setIsLoading(false)
    }
  }, [
    projectId,
    selectedDocId,
    targetTool,
    includeProjectContext,
    includeTechStack,
    includePhaseContext,
    includeLinkedDocs,
    customInstructions,
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

  useEffect(() => {
    if (templateId) {
      const t = BUILT_IN_TEMPLATES.find((x) => x.id === templateId)
      if (t) setCustomInstructions(t.instructionTemplate)
    }
  }, [templateId])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(preview)
      toast.success("Copied to clipboard")
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
      await generateAndSavePrompt(projectId, selectedDocId, targetTool, options)
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
    a.download = `prompt.${ext}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const docsByPhase = documents.reduce<Record<string, Document[]>>((acc, d) => {
    const phase = d.phase
    if (!acc[phase]) acc[phase] = []
    acc[phase].push(d)
    return acc
  }, {})

  const charCount = preview.length
  const estTokens = Math.ceil(charCount / 4)

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <div className="flex-1 space-y-6 lg:max-w-md">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-medium">Configuration</h2>
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
                      <SelectLabel>{PHASE_LABELS[phase as Phase] ?? phase}</SelectLabel>
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
              <Label>Choose Template (optional)</Label>
              <Select
                value={templateId || "__none__"}
                onValueChange={(v) => setTemplateId(v === "__none__" ? "" : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="None" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {BUILT_IN_TEMPLATES.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Target Tool</Label>
              <ToolFormatPicker
                value={targetTool}
                onChange={(v) => setTargetTool(v as TargetTool)}
              />
            </div>

            <div className="space-y-2">
              <Label>Context Options</Label>
              <div className="flex flex-col gap-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeProjectContext}
                    onChange={(e) => setIncludeProjectContext(e.target.checked)}
                    className="rounded border-input"
                  />
                  Include project context
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeTechStack}
                    onChange={(e) => setIncludeTechStack(e.target.checked)}
                    className="rounded border-input"
                  />
                  Include tech stack
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includePhaseContext}
                    onChange={(e) => setIncludePhaseContext(e.target.checked)}
                    className="rounded border-input"
                  />
                  Include phase context
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={includeLinkedDocs}
                    onChange={(e) => setIncludeLinkedDocs(e.target.checked)}
                    className="rounded border-input"
                  />
                  Include linked documents
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Custom Instructions</Label>
              <Textarea
                value={customInstructions}
                onChange={(e) => setCustomInstructions(e.target.value)}
                placeholder="Add custom instructions for the prompt..."
                rows={4}
                className="resize-none"
              />
            </div>

            <Separator />

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleCopy} disabled={!preview || isLoading}>
                Copy to Clipboard
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

      <div className="flex-1 min-w-0">
        <Card className="h-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h2 className="text-sm font-medium">Preview</h2>
            <span className="text-xs text-muted-foreground">
              {charCount} chars · ~{estTokens} tokens
            </span>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Generating preview…</p>
            ) : preview ? (
              <CollapsibleMarkdown
                content={preview}
                className="prose prose-sm dark:prose-invert max-w-none max-h-[60vh] overflow-y-auto"
              />
            ) : (
              <p className="text-sm text-muted-foreground">
                Select a document to see the preview.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
