// Hand-written enum types — source of truth for both web and desktop runtimes.
// These must stay in sync with prisma/schema.prisma enums.

export type UserTier = "FREE" | "PRO" | "PRO_AGENTS"

export type ProjectStatus = "ACTIVE" | "ARCHIVED"

export type Phase =
  | "IDEATION"
  | "PLANNING"
  | "DESIGN"
  | "ARCHITECTURE"
  | "DEVELOPMENT"
  | "TESTING"
  | "SHIPPING"
  | "ITERATION"

export type DocType =
  | "PROJECT_BRIEF"
  | "USER_RESEARCH"
  | "FEATURE_SPEC"
  | "DESIGN_SYSTEM"
  | "WIREFRAME_NOTES"
  | "TECH_DECISION"
  | "API_CONTRACT"
  | "DATA_MODEL"
  | "IMPLEMENTATION_NOTES"
  | "ENV_SETUP"
  | "TEST_STRATEGY"
  | "DEPLOY_CONFIG"
  | "LAUNCH_CHECKLIST"
  | "ITERATION_LOG"
  | "FEEDBACK_CAPTURE"

export type TargetTool =
  | "CURSOR"
  | "CLAUDE_PROJECTS"
  | "CLAUDE_CODE"
  | "CHATGPT"
  | "GENERIC"

export type LinkType =
  | "REFERENCES"
  | "DEPENDS_ON"
  | "IMPLEMENTS"
  | "SUPERSEDES"
