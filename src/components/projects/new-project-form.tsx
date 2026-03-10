"use client"

import * as React from "react"
import { createProjectWithState } from "@/actions/projects"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { TechStackPicker } from "@/components/projects/tech-stack-picker"
import { PROJECT_TEMPLATES } from "@/lib/project-templates"
import Link from "next/link"

const INITIAL_STATE = { error: null as string | null }

export function NewProjectForm() {
  const [techStack, setTechStack] = React.useState<string[]>([])
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(
    null
  )
  const [state, formAction, isPending] = React.useActionState(
    createProjectWithState,
    INITIAL_STATE
  )

  function selectTemplate(templateId: string) {
    const template = PROJECT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setSelectedTemplate(templateId)
      setTechStack(template.defaultTechStack)
    }
  }

  return (
    <form action={formAction}>
      <Card>
        <CardHeader>
          <CardTitle>New Project</CardTitle>
          <CardDescription>
            Start from a template or create a blank project.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <Label>Project Template (optional)</Label>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedTemplate(null)
                  setTechStack([])
                }}
                className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedTemplate === null
                    ? "border-primary bg-primary/5"
                    : "border-border"
                }`}
              >
                <p className="text-sm font-medium">Blank Project</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Start from scratch
                </p>
              </button>
              {PROJECT_TEMPLATES.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => selectTemplate(template.id)}
                  className={`rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 ${
                    selectedTemplate === template.id
                      ? "border-primary bg-primary/5"
                      : "border-border"
                  }`}
                >
                  <p className="text-sm font-medium">{template.name}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {template.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              placeholder="My Awesome Project"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of your project..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Tech Stack</Label>
            <TechStackPicker value={techStack} onChange={setTechStack} />
            <input
              type="hidden"
              name="techStack"
              value={techStack.join(", ")}
              readOnly
            />
          </div>
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="gap-2">
          <Button type="submit" disabled={isPending}>
            {isPending ? "Creating..." : "Create Project"}
          </Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/dashboard">Cancel</Link>
          </Button>
        </CardFooter>
      </Card>
    </form>
  )
}
