"use client"

import { useState, useMemo, createElement } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronDown, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface MarkdownSection {
  level: number
  title: string
  directContent: string
  children: MarkdownSection[]
}

const HEADING_STYLES: Record<number, string> = {
  1: "text-xl font-bold tracking-tight",
  2: "text-lg font-semibold tracking-tight border-b border-border pb-1.5 mb-3",
  3: "text-base font-semibold",
  4: "text-sm font-semibold",
  5: "text-sm font-medium",
  6: "text-xs font-medium uppercase tracking-wider text-muted-foreground",
}

const SECTION_GAP: Record<number, string> = {
  1: "mt-6 first:mt-0",
  2: "mt-5 first:mt-0",
  3: "mt-3 first:mt-0",
  4: "mt-2.5 first:mt-0",
  5: "mt-2 first:mt-0",
  6: "mt-2 first:mt-0",
}

function parseMarkdownSections(md: string) {
  const lines = md.split("\n")
  const preambleLines: string[] = []
  const flat: { level: number; title: string; lines: string[] }[] = []

  let inCodeBlock = false
  let closingFenceRe: RegExp | null = null

  for (const line of lines) {
    const trimmed = line.trimStart()

    if (inCodeBlock) {
      if (closingFenceRe && closingFenceRe.test(trimmed)) {
        inCodeBlock = false
        closingFenceRe = null
      }
      if (flat.length === 0) preambleLines.push(line)
      else flat[flat.length - 1].lines.push(line)
      continue
    }

    // Check for opening code fence
    const fenceMatch = trimmed.match(/^(`{3,}|~{3,})/)
    if (fenceMatch) {
      inCodeBlock = true
      const ch = fenceMatch[1][0]
      const len = fenceMatch[1].length
      closingFenceRe = new RegExp(`^${ch}{${len},}\\s*$`)
      if (flat.length === 0) preambleLines.push(line)
      else flat[flat.length - 1].lines.push(line)
      continue
    }

    // Check for heading
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/)
    if (headingMatch) {
      flat.push({
        level: headingMatch[1].length,
        title: headingMatch[2],
        lines: [],
      })
      continue
    }

    if (flat.length === 0) preambleLines.push(line)
    else flat[flat.length - 1].lines.push(line)
  }

  // Build tree
  let idx = 0
  function collect(parentLevel: number): MarkdownSection[] {
    const result: MarkdownSection[] = []
    while (idx < flat.length && flat[idx].level > parentLevel) {
      const s = flat[idx]
      idx++
      const children = collect(s.level)
      result.push({
        level: s.level,
        title: s.title,
        directContent: s.lines.join("\n").trim(),
        children,
      })
    }
    return result
  }

  return {
    preamble: preambleLines.join("\n").trim(),
    sections: collect(0),
  }
}

interface CollapsibleMarkdownProps {
  content: string
  className?: string
}

export function CollapsibleMarkdown({
  content,
  className,
}: CollapsibleMarkdownProps) {
  const parsed = useMemo(() => parseMarkdownSections(content), [content])

  return (
    <div className={className}>
      {parsed.preamble && (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {parsed.preamble}
        </ReactMarkdown>
      )}
      {parsed.sections.map((section, i) => (
        <CollapsibleSection key={`${section.level}-${i}`} section={section} />
      ))}
    </div>
  )
}

function CollapsibleSection({ section }: { section: MarkdownSection }) {
  const [isOpen, setIsOpen] = useState(true)

  const toggle = () => setIsOpen((v) => !v)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      toggle()
    }
  }

  const tag = `h${Math.min(section.level, 6)}`
  const headingStyle = HEADING_STYLES[section.level] || HEADING_STYLES[3]
  const sectionGap = SECTION_GAP[section.level] || SECTION_GAP[3]

  return (
    <div className={sectionGap}>
      {/* Heading row — not-prose so we control the style */}
      <div
        onClick={toggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        className={cn(
          "not-prose group flex cursor-pointer items-start gap-1.5 select-none rounded-sm",
          !isOpen && "opacity-50"
        )}
      >
        <span className="mt-[0.25em] shrink-0 text-muted-foreground/40 transition-colors group-hover:text-muted-foreground">
          {isOpen ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </span>
        {createElement(tag, { className: headingStyle }, section.title)}
      </div>

      {/* Content + children */}
      {isOpen && (
        <div className="mt-1">
          {section.directContent && (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {section.directContent}
            </ReactMarkdown>
          )}
          {section.children.map((child, i) => (
            <CollapsibleSection
              key={`${child.level}-${i}`}
              section={child}
            />
          ))}
        </div>
      )}
    </div>
  )
}
