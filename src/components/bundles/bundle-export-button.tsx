"use client"

import { Download } from "lucide-react"
import { toast } from "sonner"
import { exportBundle } from "@/actions/exports"
import { Button } from "@/components/ui/button"

export function BundleExportButton({ bundleId }: { bundleId: string }) {
  async function handleExport() {
    try {
      const { filename, content } = await exportBundle(bundleId)
      const blob = new Blob([content], { type: "text/markdown" })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = filename
      a.click()
      URL.revokeObjectURL(url)
      toast.success("Bundle exported as markdown")
    } catch {
      toast.error("Failed to export bundle")
    }
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download className="mr-2 h-4 w-4" />
      Export Bundle
    </Button>
  )
}
