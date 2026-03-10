import Link from "next/link"
import { getBundleRepo } from "@/lib/repositories"
import { requireProjectAccess } from "@/lib/auth-guard"
import { Header } from "@/components/layout/header"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default async function BundlesPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = await params
  await requireProjectAccess(projectId)

  const bundles = await getBundleRepo().findManyByProject(projectId)

  return (
    <div className="flex h-full flex-col">
      <Header title="Context Bundles" />
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="flex justify-end">
            <Link href={`/projects/${projectId}/bundles/new`}>
              <Button>New Bundle</Button>
            </Link>
          </div>

          {bundles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">
                  No context bundles yet.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create a bundle to group documents for prompt generation.
                </p>
                <Link href={`/projects/${projectId}/bundles/new`}>
                  <Button className="mt-4">Create your first bundle</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {bundles.map((bundle) => (
                <Link
                  key={bundle.id}
                  href={`/projects/${projectId}/bundles/${bundle.id}`}
                >
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-medium line-clamp-2">{bundle.name}</h3>
                        {bundle.isPreset && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">
                            Preset
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {bundle.description ? (
                        <p className="line-clamp-2 text-xs text-muted-foreground">
                          {bundle.description}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">
                          No description
                        </p>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {bundle._count.documents} document
                        {bundle._count.documents !== 1 ? "s" : ""}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
