import { requireProjectAccess } from "@/lib/auth-guard"
import {
  DOC_TYPE_LABELS,
  PHASES,
  PHASE_LABELS,
  PHASE_DOC_MAP,
} from "@/lib/constants"
import { Header } from "@/components/layout/header"
import { createDocument } from "@/actions/documents"
import { NewDocForm } from "./new-doc-form"
import type { Phase } from "@/lib/types/enums"

export default async function NewDocPage({
  params,
  searchParams,
}: {
  params: Promise<{ projectId: string }>
  searchParams: Promise<{ phase?: string }>
}) {
  const { projectId } = await params
  const { phase: phaseParam } = await searchParams
  await requireProjectAccess(projectId)

  const initialPhase =
    phaseParam && PHASES.includes(phaseParam as Phase)
      ? (phaseParam as Phase)
      : undefined

  return (
    <div className="flex h-full flex-col">
      <Header title="New Document" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-xl">
          <NewDocForm projectId={projectId} initialPhase={initialPhase} />
        </div>
      </div>
    </div>
  )
}
