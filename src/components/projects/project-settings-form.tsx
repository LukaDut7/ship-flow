"use client"

import * as React from "react"
import { updateProject } from "@/actions/projects"
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

interface ProjectSettingsFormProps {
  projectId: string
  initialName: string
  initialDescription: string
  initialTechStack: string[]
}

export function ProjectSettingsForm({
  projectId,
  initialName,
  initialDescription,
  initialTechStack,
}: ProjectSettingsFormProps) {
  const [techStack, setTechStack] = React.useState<string[]>(initialTechStack)

  async function handleSubmit(formData: FormData) {
    formData.set("techStack", techStack.join(", "))
    await updateProject(projectId, formData)
  }

  return (
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>General</CardTitle>
          <CardDescription>
            Update your project name, description, and tech stack.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={initialName}
              placeholder="My Awesome Project"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={initialDescription}
              placeholder="Brief description of your project..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Tech Stack</Label>
            <TechStackPicker value={techStack} onChange={setTechStack} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit">Save</Button>
        </CardFooter>
      </Card>
    </form>
  )
}
