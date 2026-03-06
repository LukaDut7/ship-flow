"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Search,
  Circle,
  CircleDot,
} from "lucide-react"
import { PHASES, PHASE_LABELS } from "@/lib/constants"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Phase } from "@prisma/client"

interface Document {
  id: string
  title: string
  phase: string
  docType: string
  content: string
}

interface ProjectSidebarProps {
  projectId: string
  documents: Document[]
  currentDocId?: string
}

export function ProjectSidebar({
  projectId,
  documents,
  currentDocId: currentDocIdProp,
}: ProjectSidebarProps) {
  const pathname = usePathname()
  const currentDocId =
    currentDocIdProp ??
    (pathname?.match(/\/projects\/[^/]+\/docs\/([^/]+)$/)?.[1])
  const [search, setSearch] = useState("")
  const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>(
    () => Object.fromEntries(PHASES.map((p) => [p, true]))
  )

  const filteredDocs = useMemo(() => {
    if (!search.trim()) return documents
    const q = search.toLowerCase().trim()
    return documents.filter((d) => d.title.toLowerCase().includes(q))
  }, [documents, search])

  const docsByPhase = useMemo(() => {
    const map: Record<string, Document[]> = {}
    for (const phase of PHASES) {
      map[phase] = filteredDocs.filter((d) => d.phase === phase)
    }
    return map
  }, [filteredDocs])

  const togglePhase = (phase: Phase) => {
    setExpandedPhases((prev) => ({ ...prev, [phase]: !prev[phase] }))
  }

  const getCompletionCount = (phase: Phase) => {
    const phaseDocs = documents.filter((d) => d.phase === phase)
    const filled = phaseDocs.filter((d) => d.content.length > 50).length
    return { filled, total: phaseDocs.length }
  }

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r bg-muted/30">
      <div className="border-b p-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search documents..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 pl-8 text-sm"
          />
        </div>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {PHASES.map((phase) => {
          const phaseDocs = docsByPhase[phase]
          const { filled, total } = getCompletionCount(phase)
          const isExpanded = expandedPhases[phase] ?? true

          return (
            <div key={phase} className="mb-1">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-6 w-6 shrink-0"
                  onClick={() => togglePhase(phase)}
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" />
                  ) : (
                    <ChevronRight className="size-3.5" />
                  )}
                </Button>
                <span className="flex-1 truncate text-xs font-medium text-muted-foreground">
                  {PHASE_LABELS[phase]}
                </span>
                <span className="shrink-0 text-[10px] text-muted-foreground">
                  {filled}/{total}
                </span>
                <Link
                  href={`/projects/${projectId}/docs/new?phase=${phase}`}
                  className="shrink-0 rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  aria-label={`Add document in ${PHASE_LABELS[phase]}`}
                >
                  <Plus className="size-3.5" />
                </Link>
              </div>
              {isExpanded && (
                <ul className="ml-2 mt-0.5 space-y-0.5">
                  {phaseDocs.map((doc) => {
                    const hasContent = doc.content.length > 50
                    const isCurrent = doc.id === currentDocId

                    return (
                      <li key={doc.id}>
                        <Link
                          href={`/projects/${projectId}/docs/${doc.id}`}
                          className={cn(
                            "flex items-center gap-1.5 rounded-md px-2 py-1 text-sm transition-colors",
                            isCurrent
                              ? "bg-accent font-medium text-accent-foreground"
                              : "hover:bg-accent/50"
                          )}
                        >
                          {hasContent ? (
                            <CircleDot className="size-3.5 shrink-0 text-primary" />
                          ) : (
                            <Circle className="size-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="min-w-0 truncate">{doc.title}</span>
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </nav>
    </aside>
  )
}
