"use client"

import { useState } from "react"
import Link from "next/link"
import { createBundle, updateBundle } from "@/actions/bundles"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { BundleDocPicker } from "./bundle-doc-picker"

interface Document {
  id: string
  title: string
  phase: string
}

interface BundleFormProps {
  projectId: string
  documents: Document[]
  bundle?: {
    id: string
    name: string
    description: string
    documentIds: string[]
  }
}

export function BundleForm({
  projectId,
  documents,
  bundle,
}: BundleFormProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(
    bundle?.documentIds ?? []
  )
  const isEditing = !!bundle
  const bundleAction = isEditing
    ? updateBundle.bind(null, bundle.id)
    : createBundle.bind(null, projectId)

  return (
    <form
      action={bundleAction}
      className="flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Name (required)</Label>
        <Input
          id="name"
          name="name"
          defaultValue={bundle?.name}
          placeholder="e.g. Full Context for Feature X"
          required
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="description">Description (optional)</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={bundle?.description}
          placeholder="Brief description of what this bundle contains"
          rows={3}
          className="text-sm"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label>Documents</Label>
        <BundleDocPicker
          documents={documents}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
        />
        <input
          type="hidden"
          name="documentIds"
          value={selectedIds.join(",")}
          readOnly
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">
          {isEditing ? "Update Bundle" : "Create Bundle"}
        </Button>
        <Link href={`/projects/${projectId}/bundles`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
