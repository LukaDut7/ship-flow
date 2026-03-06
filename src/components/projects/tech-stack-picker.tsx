"use client"

import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { COMMON_TECH_STACK } from "@/lib/constants"
import { cn } from "@/lib/utils"
import { X } from "lucide-react"

interface TechStackPickerProps {
  value: string[]
  onChange: (value: string[]) => void
}

export function TechStackPicker({ value, onChange }: TechStackPickerProps) {
  const [input, setInput] = React.useState("")
  const [showSuggestions, setShowSuggestions] = React.useState(false)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const filteredSuggestions = React.useMemo(() => {
    const lower = input.toLowerCase().trim()
    return COMMON_TECH_STACK.filter(
      (tech) =>
        !value.includes(tech) &&
        (lower === "" || tech.toLowerCase().includes(lower))
    )
  }, [input, value])

  const addTech = (tech: string) => {
    const trimmed = tech.trim()
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed])
    }
    setInput("")
    setShowSuggestions(false)
  }

  const removeTech = (tech: string) => {
    onChange(value.filter((t) => t !== tech))
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && input.trim()) {
      e.preventDefault()
      addTech(input.trim())
    }
  }

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tech) => (
          <Badge
            key={tech}
            variant="secondary"
            className="gap-1 pr-1"
          >
            {tech}
            <button
              type="button"
              onClick={() => removeTech(tech)}
              className="rounded-full p-0.5 hover:bg-muted"
              aria-label={`Remove ${tech}`}
            >
              <X className="size-3" />
            </button>
          </Badge>
        ))}
      </div>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder="Add tech..."
          value={input}
          onChange={(e) => {
            setInput(e.target.value)
            setShowSuggestions(true)
          }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          className="pr-3"
        />
        {showSuggestions && filteredSuggestions.length > 0 && (
          <ul
            className={cn(
              "absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border bg-popover py-1 shadow-md"
            )}
          >
            {filteredSuggestions.slice(0, 10).map((tech) => (
              <li key={tech}>
                <button
                  type="button"
                  className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                  onClick={() => addTech(tech)}
                >
                  {tech}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      <input
        type="hidden"
        name="techStack"
        value={value.join(", ")}
        readOnly
      />
    </div>
  )
}
