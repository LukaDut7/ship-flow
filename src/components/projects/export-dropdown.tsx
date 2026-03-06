"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  exportProjectAsZip,
  exportAsCursorRules,
  exportAsClaudeProject,
} from "@/actions/exports"
import { Download } from "lucide-react"
import { toast } from "sonner"

function downloadContent(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function downloadBase64Zip(filename: string, base64: string) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  const blob = new Blob([bytes], { type: "application/zip" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function ExportDropdown({ projectId }: { projectId: string }) {
  async function handleExportZip() {
    try {
      const base64 = await exportProjectAsZip(projectId)
      downloadBase64Zip("project-export.zip", base64)
      toast.success("Project exported as ZIP")
    } catch {
      toast.error("Failed to export project")
    }
  }

  async function handleExportCursor() {
    try {
      const result = await exportAsCursorRules(projectId)
      downloadContent(result.filename, result.content)
      toast.success("Exported as .cursorrules")
    } catch {
      toast.error("Failed to export")
    }
  }

  async function handleExportClaude() {
    try {
      const result = await exportAsClaudeProject(projectId)
      downloadContent(result.filename, result.content)
      toast.success("Exported for Claude Projects")
    } catch {
      toast.error("Failed to export")
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleExportZip}>
          Export as ZIP
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportCursor}>
          Export as .cursorrules
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleExportClaude}>
          Export for Claude Projects
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
