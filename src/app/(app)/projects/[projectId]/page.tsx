import {
  Lightbulb,
  ClipboardList,
  Palette,
  Building2,
  Code2,
  FlaskConical,
  Rocket,
  RefreshCw,
  Layers,
  Sparkles,
  Settings,
} from "lucide-react"
import Link from "next/link"
import { requireProjectAccess } from "@/lib/auth-guard"
import { prisma } from "@/lib/prisma"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  PHASES,
  PHASE_LABELS,
  PHASE_DOC_MAP,
} from "@/lib/constants"
import { ExportDropdown } from "@/components/projects/export-dropdown"
import type { Phase } from "@prisma/client"

const PHASE_ICON_MAP: Record<Phase, React.ComponentType<{ className?: string }>> = {
  IDEATION: Lightbulb,
  PLANNING: ClipboardList,
  DESIGN: Palette,
  ARCHITECTURE: Building2,
  DEVELOPMENT: Code2,
  TESTING: FlaskConical,
  SHIPPING: Rocket,
  ITERATION: RefreshCw,
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  const { project } = await requireProjectAccess(projectId)

  const documents = await prisma.document.findMany({
    where: { projectId },
    select: { id: true, title: true, phase: true, docType: true, content: true },
  })

  const techStack = (project.techStack as string[]) ?? []

  const phaseStats = PHASES.map((phase) => {
    const configs = PHASE_DOC_MAP[phase]
    const docTypesInPhase = new Set(configs.map((c) => c.docType))
    const phaseDocs = documents.filter((d) => docTypesInPhase.has(d.docType))
    const withContent = phaseDocs.filter((d) => d.content && d.content.trim() !== "")
    return {
      phase,
      total: phaseDocs.length,
      withContent: withContent.length,
    }
  })

  const emptyBrief = documents.find(
    (d) => d.docType === "PROJECT_BRIEF" && (!d.content || d.content.trim().length < 100)
  )
  const hasSpecs = documents.some(
    (d) => d.docType === "FEATURE_SPEC" && d.content && d.content.trim().length > 100
  )
  const hasADRs = documents.some(
    (d) => d.docType === "TECH_DECISION" && d.content && d.content.trim().length > 100
  )
  const hasImpl = documents.some(
    (d) => d.docType === "IMPLEMENTATION_NOTES" && d.content && d.content.trim().length > 100
  )
  const hasTests = documents.some(
    (d) => d.docType === "TEST_STRATEGY" && d.content && d.content.trim().length > 100
  )

  const quickActions: Array<{ label: string; href: string }> = []
  if (emptyBrief) {
    quickActions.push({
      label: "Start by describing your project",
      href: `/projects/${projectId}/docs/${emptyBrief.id}`,
    })
  }
  if (hasSpecs && !hasADRs) {
    quickActions.push({
      label: "Document your tech decisions",
      href: `/projects/${projectId}/docs/new?phase=ARCHITECTURE`,
    })
  }
  if (hasImpl && !hasTests) {
    quickActions.push({
      label: "Plan your testing approach",
      href: `/projects/${projectId}/docs/new?phase=TESTING`,
    })
  }

  return (
    <>
      <Header title={project.name} />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            {project.description && (
              <p className="text-muted-foreground">{project.description}</p>
            )}
            {techStack.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {techStack.map((tech) => (
                  <Badge key={tech} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <ExportDropdown projectId={projectId} />
            <Link href={`/projects/${projectId}/prompts/generate`}>
              <Button size="sm">
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Prompt
              </Button>
            </Link>
            <Link href={`/projects/${projectId}/settings`}>
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>

        {quickActions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suggested Next Steps</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {quickActions.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="text-sm text-primary hover:underline"
                >
                  &rarr; {action.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        <div className="flex flex-wrap gap-3">
          <Link href={`/projects/${projectId}/prompts`}>
            <Card className="flex flex-row items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/50">
              <Sparkles className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Prompt History</p>
                <p className="text-xs text-muted-foreground">
                  View generated prompts
                </p>
              </div>
            </Card>
          </Link>
          <Link href={`/projects/${projectId}/bundles`}>
            <Card className="flex flex-row items-center gap-3 px-5 py-4 transition-colors hover:bg-accent/50">
              <Layers className="size-5 shrink-0 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Context Bundles</p>
                <p className="text-xs text-muted-foreground">
                  Group documents for prompts
                </p>
              </div>
            </Card>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {phaseStats.map(({ phase, total, withContent }) => {
            const Icon = PHASE_ICON_MAP[phase]
            const pct = total > 0 ? Math.round((withContent / total) * 100) : 0
            return (
              <Link key={phase} href={`/projects/${projectId}/docs?phase=${phase}`}>
                <Card className="transition-colors hover:bg-accent/50">
                  <CardHeader className="flex flex-row items-center gap-3 pb-2">
                    {Icon && <Icon className="size-5 text-muted-foreground" />}
                    <CardTitle className="text-sm">
                      {PHASE_LABELS[phase]}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="mb-1 h-1.5 w-full rounded-full bg-muted">
                      <div
                        className="h-1.5 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {withContent}/{total} docs
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </div>
    </>
  )
}
