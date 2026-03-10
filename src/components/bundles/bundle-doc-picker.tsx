"use client"

import { PHASES, PHASE_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { Phase } from "@/lib/types/enums"

interface Document {
  id: string
  title: string
  phase: string
}

interface BundleDocPickerProps {
  documents: Document[]
  selectedIds: string[]
  onChange: (ids: string[]) => void
}

export function BundleDocPicker({
  documents,
  selectedIds,
  onChange,
}: BundleDocPickerProps) {
  const docsByPhase = PHASES.reduce(
    (acc, phase) => {
      acc[phase] = documents.filter((d) => d.phase === phase)
      return acc
    },
    {} as Record<Phase, Document[]>
  )

  const toggleDoc = (docId: string) => {
    if (selectedIds.includes(docId)) {
      onChange(selectedIds.filter((id) => id !== docId))
    } else {
      onChange([...selectedIds, docId])
    }
  }

  const selectAllInPhase = (phase: Phase) => {
    const phaseDocIds = docsByPhase[phase].map((d) => d.id)
    const allSelected = phaseDocIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      onChange(selectedIds.filter((id) => !phaseDocIds.includes(id)))
    } else {
      const merged = new Set([...selectedIds, ...phaseDocIds])
      onChange(Array.from(merged))
    }
  }

  const deselectAllInPhase = (phase: Phase) => {
    const phaseDocIds = docsByPhase[phase].map((d) => d.id)
    onChange(selectedIds.filter((id) => !phaseDocIds.includes(id)))
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {selectedIds.length} document{selectedIds.length !== 1 ? "s" : ""}{" "}
        selected
      </p>
      <div className="space-y-4">
        {PHASES.map((phase) => {
          const phaseDocs = docsByPhase[phase]
          if (phaseDocs.length === 0) return null

          const selectedInPhase = phaseDocs.filter((d) =>
            selectedIds.includes(d.id)
          ).length
          const allSelected = selectedInPhase === phaseDocs.length

          return (
            <div key={phase} className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">{PHASE_LABELS[phase]}</h4>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => selectAllInPhase(phase)}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    {allSelected ? "Deselect All" : "Select All"}
                  </button>
                  {selectedInPhase > 0 && (
                    <button
                      type="button"
                      onClick={() => deselectAllInPhase(phase)}
                      className="text-xs text-muted-foreground hover:text-foreground"
                    >
                      Deselect All
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-1.5 rounded-md border p-3">
                {phaseDocs.map((doc) => (
                  <label
                    key={doc.id}
                    className={cn(
                      "flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 hover:bg-muted/50",
                      selectedIds.includes(doc.id) && "bg-muted/50"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(doc.id)}
                      onChange={() => toggleDoc(doc.id)}
                      className="h-4 w-4 rounded border-input"
                    />
                    <span className="text-sm">{doc.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
