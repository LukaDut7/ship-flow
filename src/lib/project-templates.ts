export interface ProjectTemplate {
  id: string
  name: string
  description: string
  defaultTechStack: string[]
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: "saas-webapp",
    name: "SaaS Web App",
    description:
      "Full-stack SaaS application with user auth, billing, and dashboard",
    defaultTechStack: [
      "Next.js",
      "React",
      "TypeScript",
      "PostgreSQL",
      "Prisma",
      "Tailwind CSS",
      "Stripe",
    ],
  },
  {
    id: "rest-api",
    name: "REST API Service",
    description:
      "Backend API service with authentication, CRUD operations, and documentation",
    defaultTechStack: [
      "Node.js",
      "Express",
      "TypeScript",
      "PostgreSQL",
      "Prisma",
      "Docker",
    ],
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "Cross-platform mobile application with native UI",
    defaultTechStack: ["React Native", "TypeScript", "Expo", "Firebase"],
  },
  {
    id: "chrome-extension",
    name: "Chrome Extension",
    description: "Browser extension with popup, content scripts, and storage",
    defaultTechStack: ["TypeScript", "Chrome APIs", "Tailwind CSS"],
  },
  {
    id: "cli-tool",
    name: "CLI Tool",
    description: "Command-line tool with argument parsing and interactive prompts",
    defaultTechStack: ["Node.js", "TypeScript", "Commander.js"],
  },
]
