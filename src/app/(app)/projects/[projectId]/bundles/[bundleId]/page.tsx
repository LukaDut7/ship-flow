import Link from "next/link"
import { getBundleRepo, getDocumentRepo } from "@/lib/repositories"
import { requireProjectAccess } from "@/lib/auth-guard"
import { DOC_TYPE_LABELS, PHASE_LABELS } from "@/lib/constants"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { BundleForm } from "@/components/bundles/bundle-form"
import { BundleActions } from "@/components/bundles/bundle-actions"
import { BundleExportButton } from "@/components/bundles/bundle-export-button"
import type { DocType, Phase } from "@/lib/types/enums"

export default async function BundleDetailPage({
  params,
}: {
  params: Promise<{ projectId: string; bundleId: string }>
}) {
  const { projectId, bundleId } = await params
  await requireProjectAccess(projectId)

  const bundle = await getBundleRepo().findByIdAndProject(bundleId, projectId)

  if (!bundle) return null

  const documents = await getDocumentRepo().findManyByProject(projectId)

  const docs = documents.map((d) => ({
    id: d.id,
    title: d.title,
    phase: d.phase,
  }))

  const documentIds = bundle.documents.map((bd) => bd.document.id)

  return (
    <div className="flex h-full flex-col">
      <Header title={bundle.name} />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            {bundle.isPreset && (
              <Badge variant="secondary">Preset</Badge>
            )}
            <Link
              href={`/projects/${projectId}/prompts/generate?bundleId=${bundleId}`}
            >
              <Button>Help Me Write from Bundle</Button>
            </Link>
            <BundleExportButton bundleId={bundleId} />
            <BundleActions
              projectId={projectId}
              bundleId={bundleId}
              bundleName={bundle.name}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
              {bundle.description && (
                <p className="text-sm text-muted-foreground">
                  {bundle.description}
                </p>
              )}
            </CardHeader>
            <CardContent>
              <h4 className="mb-2 text-sm font-medium">Included documents</h4>
              {bundle.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No documents in this bundle.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {bundle.documents.map((bd) => (
                    <li
                      key={bd.id}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Badge variant="outline" className="text-[10px]">
                        {PHASE_LABELS[bd.document.phase as Phase]}
                      </Badge>
                      <Link
                        href={`/projects/${projectId}/docs/${bd.document.id}`}
                        className="text-primary hover:underline"
                      >
                        {bd.document.title}
                      </Link>
                      <span className="text-muted-foreground">
                        ({DOC_TYPE_LABELS[bd.document.docType as DocType]})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Separator />

          <div>
            <h3 className="mb-4 text-sm font-medium">Edit Bundle</h3>
            <BundleForm
              projectId={projectId}
              documents={docs}
              bundle={{
                id: bundle.id,
                name: bundle.name,
                description: bundle.description,
                documentIds,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
