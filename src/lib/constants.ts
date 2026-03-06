import type { Phase, DocType } from "@prisma/client"

export const PHASES: Phase[] = [
  "IDEATION",
  "PLANNING",
  "DESIGN",
  "ARCHITECTURE",
  "DEVELOPMENT",
  "TESTING",
  "SHIPPING",
  "ITERATION",
]

export const PHASE_LABELS: Record<Phase, string> = {
  IDEATION: "Ideation",
  PLANNING: "Planning",
  DESIGN: "Design",
  ARCHITECTURE: "Architecture",
  DEVELOPMENT: "Development",
  TESTING: "Testing",
  SHIPPING: "Shipping",
  ITERATION: "Iteration",
}

export const PHASE_ICONS: Record<Phase, string> = {
  IDEATION: "Lightbulb",
  PLANNING: "ClipboardList",
  DESIGN: "Palette",
  ARCHITECTURE: "Building2",
  DEVELOPMENT: "Code2",
  TESTING: "FlaskConical",
  SHIPPING: "Rocket",
  ITERATION: "RefreshCw",
}

export const DOC_TYPE_LABELS: Record<DocType, string> = {
  PROJECT_BRIEF: "Project Brief",
  USER_RESEARCH: "User Research Notes",
  FEATURE_SPEC: "Feature Spec",
  DESIGN_SYSTEM: "Design System Notes",
  WIREFRAME_NOTES: "Wireframe / Prototype Notes",
  TECH_DECISION: "Tech Decision (ADR)",
  API_CONTRACT: "API Contract",
  DATA_MODEL: "Data Model",
  IMPLEMENTATION_NOTES: "Implementation Notes",
  ENV_SETUP: "Environment Setup",
  TEST_STRATEGY: "Test Strategy",
  DEPLOY_CONFIG: "Deploy & Infra Config",
  LAUNCH_CHECKLIST: "Launch Checklist",
  ITERATION_LOG: "Iteration Log",
  FEEDBACK_CAPTURE: "User Feedback Capture",
}

export interface PhaseDocConfig {
  docType: DocType
  multiplicity: "single" | "multiple"
}

export const PHASE_DOC_MAP: Record<Phase, PhaseDocConfig[]> = {
  IDEATION: [
    { docType: "PROJECT_BRIEF", multiplicity: "single" },
    { docType: "USER_RESEARCH", multiplicity: "multiple" },
  ],
  PLANNING: [{ docType: "FEATURE_SPEC", multiplicity: "multiple" }],
  DESIGN: [
    { docType: "DESIGN_SYSTEM", multiplicity: "single" },
    { docType: "WIREFRAME_NOTES", multiplicity: "multiple" },
  ],
  ARCHITECTURE: [
    { docType: "TECH_DECISION", multiplicity: "multiple" },
    { docType: "API_CONTRACT", multiplicity: "multiple" },
    { docType: "DATA_MODEL", multiplicity: "single" },
  ],
  DEVELOPMENT: [
    { docType: "IMPLEMENTATION_NOTES", multiplicity: "multiple" },
    { docType: "ENV_SETUP", multiplicity: "single" },
  ],
  TESTING: [{ docType: "TEST_STRATEGY", multiplicity: "single" }],
  SHIPPING: [
    { docType: "DEPLOY_CONFIG", multiplicity: "single" },
    { docType: "LAUNCH_CHECKLIST", multiplicity: "single" },
  ],
  ITERATION: [
    { docType: "ITERATION_LOG", multiplicity: "multiple" },
    { docType: "FEEDBACK_CAPTURE", multiplicity: "multiple" },
  ],
}

export const ALL_DOC_TYPES: DocType[] = Object.values(PHASE_DOC_MAP).flatMap(
  (configs) => configs.map((c) => c.docType)
)

export const DOC_TYPE_TO_PHASE: Record<DocType, Phase> = Object.entries(
  PHASE_DOC_MAP
).reduce(
  (acc, [phase, configs]) => {
    for (const c of configs) {
      acc[c.docType] = phase as Phase
    }
    return acc
  },
  {} as Record<DocType, Phase>
)

export const TIER_LIMITS = {
  FREE: { projects: 3, promptsPerMonth: 20 },
  PRO: { projects: Infinity, promptsPerMonth: Infinity },
  PRO_AGENTS: { projects: Infinity, promptsPerMonth: Infinity },
} as const

export const COMMON_TECH_STACK = [
  "React",
  "Next.js",
  "Vue",
  "Svelte",
  "Angular",
  "Node.js",
  "Express",
  "Python",
  "FastAPI",
  "Django",
  "TypeScript",
  "JavaScript",
  "PostgreSQL",
  "MySQL",
  "MongoDB",
  "Redis",
  "Prisma",
  "Drizzle",
  "Tailwind CSS",
  "Docker",
  "AWS",
  "Vercel",
  "Supabase",
  "Firebase",
  "Stripe",
  "GraphQL",
  "REST",
  "tRPC",
]

export const TARGET_TOOL_LABELS: Record<string, string> = {
  CURSOR: "Cursor",
  CLAUDE_PROJECTS: "Claude Projects",
  CLAUDE_CODE: "Claude Code",
  CHATGPT: "ChatGPT",
  GENERIC: "Generic (Markdown)",
}

export const LINK_TYPE_LABELS: Record<string, string> = {
  REFERENCES: "References",
  DEPENDS_ON: "Depends On",
  IMPLEMENTS: "Implements",
  SUPERSEDES: "Supersedes",
}
