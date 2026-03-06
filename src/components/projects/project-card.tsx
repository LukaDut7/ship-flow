"use client"

import Link from "next/link"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { timeAgo } from "@/lib/time-ago"

interface ProjectCardProps {
  project: {
    id: string
    name: string
    description: string
    updatedAt: Date
    _count?: { documents: number }
  }
}

export function ProjectCard({ project }: ProjectCardProps) {
  const docCount = project._count?.documents ?? 0
  const truncatedDesc =
    project.description.length > 100
      ? project.description.slice(0, 100) + "..."
      : project.description

  return (
    <Link href={`/projects/${project.id}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardHeader>
          <CardTitle className="line-clamp-1">{project.name}</CardTitle>
          {truncatedDesc && (
            <CardDescription className="line-clamp-2">
              {truncatedDesc}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-2">
          <Badge variant="secondary">{docCount} docs</Badge>
          <span className="text-xs text-muted-foreground">
            {timeAgo(new Date(project.updatedAt))}
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
