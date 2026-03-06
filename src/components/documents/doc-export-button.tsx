"use client"

import { toast } from "sonner"
import { exportDocument } from "@/actions/exports"
import { Button } from "@/components/ui/button"

export function DocExportButton({ docId }: { docId: string }) {
  async function handleExport() {
    try {
      const { filename, content } = await exportDocument(docId)
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Document exported")
    } catch {
      toast.error("Failed to export document")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      Export
    </Button>
  )
}
