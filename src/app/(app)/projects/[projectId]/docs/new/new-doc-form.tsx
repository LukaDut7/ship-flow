import Link from "next/link"
import { createDocument } from "@/actions/documents"
import {
  DOC_TYPE_LABELS,
  PHASES,
  PHASE_LABELS,
  PHASE_DOC_MAP,
} from "@/lib/constants"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { Phase } from "@/lib/types/enums"

interface NewDocFormProps {
  projectId: string
  initialPhase?: Phase
}

export function NewDocForm({ projectId, initialPhase }: NewDocFormProps) {
  const createWithProject = createDocument.bind(null, projectId)

  return (
    <form
      action={createWithProject}
      className="flex flex-col gap-6 rounded-lg border bg-card p-6 shadow-sm"
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="docType">Document Type</Label>
        <select
          id="docType"
          name="docType"
          required
          className="h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
        >
          {initialPhase ? (
            PHASE_DOC_MAP[initialPhase].map((config) => (
              <option key={config.docType} value={config.docType}>
                {DOC_TYPE_LABELS[config.docType]}
              </option>
            ))
          ) : (
            PHASES.map((phase) => (
              <optgroup key={phase} label={PHASE_LABELS[phase]}>
                {PHASE_DOC_MAP[phase].map((config) => (
                  <option key={config.docType} value={config.docType}>
                    {DOC_TYPE_LABELS[config.docType]}
                  </option>
                ))}
              </optgroup>
            ))
          )}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="title">Custom Title (optional)</Label>
        <Input
          id="title"
          name="title"
          placeholder="Leave blank to use default from document type"
          className="text-sm"
        />
      </div>

      <div className="flex gap-2">
        <Button type="submit">Create Document</Button>
        <Link href={`/projects/${projectId}/docs`}>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
      </div>
    </form>
  )
}
