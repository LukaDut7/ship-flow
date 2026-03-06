"use client"

import { TARGET_TOOL_LABELS } from "@/lib/constants"
import { cn } from "@/lib/utils"

const TARGET_TOOLS = [
  "CURSOR",
  "CLAUDE_PROJECTS",
  "CLAUDE_CODE",
  "CHATGPT",
  "GENERIC",
] as const

interface ToolFormatPickerProps {
  value: string
  onChange: (value: string) => void
}

export function ToolFormatPicker({ value, onChange }: ToolFormatPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {TARGET_TOOLS.map((tool) => (
        <button
          key={tool}
          type="button"
          onClick={() => onChange(tool)}
          className={cn(
            "rounded-lg border px-3 py-2.5 text-left text-sm font-medium transition-colors",
            value === tool
              ? "border-primary bg-primary/10 text-primary"
              : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
          )}
        >
          {TARGET_TOOL_LABELS[tool] ?? tool}
        </button>
      ))}
    </div>
  )
}
