import type { DocType } from "@/lib/types/enums"

export interface WritingPromptConfig {
  docType: DocType
  role: string
  goal: string
  outputFormat: string
  questions: string[]
}

export const WRITING_PROMPTS: Record<DocType, WritingPromptConfig> = {
  PROJECT_BRIEF: {
    docType: "PROJECT_BRIEF",
    role: "a product strategist helping a developer define their project",
    goal: "Help me write a clear, concise Project Brief by asking me the right questions and organizing my answers into a structured document.",
    outputFormat: `# Project Brief

## Problem Statement
[2-3 sentences: what problem, who has it, current workaround]

## Target Audience
[Primary personas with roles, goals, and constraints]

## Constraints & Boundaries
[Timeline, budget, tech limits, out-of-scope items]

## Success Metrics
[Measurable outcomes and KPIs]

## Competitive Context
[Alternatives, differentiation, positioning]`,
    questions: [
      "What problem are you solving, and who experiences it?",
      "What do people currently do instead (workaround)?",
      "Who are your primary users? What are their goals?",
      "What are your hard constraints (timeline, budget, tech stack)?",
      "How will you know this project succeeded? What metrics matter?",
      "What alternatives or competitors exist? How are you different?",
    ],
  },

  USER_RESEARCH: {
    docType: "USER_RESEARCH",
    role: "a UX researcher helping organize user insights",
    goal: "Help me structure my user research findings into actionable insights, personas, and identified pain points.",
    outputFormat: `# User Research Notes

## Interview Summary
[Key insights and direct quotes]

## Feedback Themes
[Recurring patterns grouped by theme]

## Pain Points
[Top frustrations ranked by severity]

## Personas
[2-4 user archetypes with goals and fears]

## Research Gaps
[What we still don't know]`,
    questions: [
      "Who have you talked to (or observed)? What roles/backgrounds?",
      "What are the top 3 complaints or frustrations they expressed?",
      "Are there any direct quotes that stood out?",
      "What patterns did you notice across multiple users?",
      "What questions are you still unsure about?",
    ],
  },

  FEATURE_SPEC: {
    docType: "FEATURE_SPEC",
    role: "a product manager helping define a feature specification",
    goal: "Help me write a complete Feature Spec with user stories, acceptance criteria, and edge cases. Ask me about the feature, then structure my answers.",
    outputFormat: `# Feature Specification

## Overview
[One sentence: what this feature does and who benefits]

## User Stories
- As a [role], I want [goal] so that [benefit]
[Priority ordered]

## Acceptance Criteria
[For each story: specific, testable conditions using Given/When/Then]

## Edge Cases & Error Handling
[Empty states, validation rules, error messages, failure modes]

## Priority & Dependencies
[P0/P1/P2 ordering, what blocks what]`,
    questions: [
      "What feature are you building? Describe it in one sentence.",
      "Who is the primary user of this feature?",
      "What can the user do with this feature? List the key actions.",
      "For each action, what must be true for it to be 'done'?",
      "What happens when things go wrong (bad input, network error, empty state)?",
      "Does this feature depend on anything else being built first?",
    ],
  },

  DESIGN_SYSTEM: {
    docType: "DESIGN_SYSTEM",
    role: "a UI/UX designer helping document a design system",
    goal: "Help me document my design system including colors, typography, components, and accessibility rules.",
    outputFormat: `# Design System Notes

## Colors
[Palette with hex values and usage rules]

## Typography
[Fonts, sizes, weight hierarchy]

## Components
[Buttons, inputs, cards, modals with variants]

## Patterns
[Navigation, forms, notifications]

## Accessibility
[WCAG compliance, keyboard nav, ARIA requirements]`,
    questions: [
      "What is the visual style (minimal, bold, playful, corporate)?",
      "What are your primary and accent colors?",
      "What font(s) are you using?",
      "What core UI components do you need (buttons, forms, cards, modals)?",
      "Are there specific accessibility requirements?",
    ],
  },

  WIREFRAME_NOTES: {
    docType: "WIREFRAME_NOTES",
    role: "a UX designer helping document wireframe and prototype decisions",
    goal: "Help me capture the key layout decisions, interaction patterns, and UX rationale for my wireframes.",
    outputFormat: `# Wireframe / Prototype Notes

## Page Layout
[Key screens with layout structure]

## Interaction Patterns
[How users navigate, click, scroll]

## UX Rationale
[Why these layout choices were made]

## Responsive Behavior
[How layouts adapt across screen sizes]

## Open Questions
[Unresolved design decisions]`,
    questions: [
      "What are the key screens/pages in your app?",
      "For each screen, what is the primary action the user takes?",
      "How do users navigate between screens?",
      "Are there any specific interaction patterns (drag-drop, infinite scroll, modals)?",
      "How should the layout change on mobile vs desktop?",
    ],
  },

  TECH_DECISION: {
    docType: "TECH_DECISION",
    role: "a senior architect helping document an Architecture Decision Record (ADR)",
    goal: "Help me write a clear ADR by walking through the context, options considered, and rationale for the decision.",
    outputFormat: `# Tech Decision (ADR)

## Decision Title
[Short name for this decision]

## Context
[Problem and constraints that led to this decision]

## Options Considered
[Each option with pros and cons]

## Decision
[What was chosen]

## Rationale
[Why this option was selected]

## Consequences
[Trade-offs, implications, follow-up work needed]`,
    questions: [
      "What technical decision are you documenting?",
      "What problem or constraint led to needing this decision?",
      "What options did you consider? (List at least 2-3)",
      "What did you choose, and why?",
      "What are the trade-offs or risks of this choice?",
    ],
  },

  API_CONTRACT: {
    docType: "API_CONTRACT",
    role: "a backend architect helping design an API contract",
    goal: "Help me define a complete API contract with endpoints, request/response schemas, authentication, and error handling.",
    outputFormat: `# API Contract

## Base URL & Versioning
[Base URL and versioning strategy]

## Authentication
[Auth method: API keys, OAuth, JWT]

## Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /resource | List resources |

## Request & Response Schemas
[Example payloads with types]

## Error Codes
[HTTP status codes and their meanings]`,
    questions: [
      "What resources/entities does your API expose?",
      "What operations are needed (CRUD, search, etc.)?",
      "How are users authenticated?",
      "What does a typical request/response look like?",
      "What error scenarios need specific handling?",
    ],
  },

  DATA_MODEL: {
    docType: "DATA_MODEL",
    role: "a database architect helping design a data model",
    goal: "Help me define entities, relationships, constraints, and migration considerations for my data model.",
    outputFormat: `# Data Model

## Entities
[Each entity with fields, types, and constraints]

## Relationships
[How entities relate: one-to-many, many-to-many]

## Constraints
[Unique keys, required fields, validation rules]

## Indexes
[Performance-critical queries and their indexes]

## Migration Notes
[Schema evolution considerations]`,
    questions: [
      "What are the core entities/objects in your system?",
      "What fields does each entity have?",
      "How do entities relate to each other?",
      "What fields must be unique or required?",
      "Are there any performance-sensitive queries to optimize for?",
    ],
  },

  IMPLEMENTATION_NOTES: {
    docType: "IMPLEMENTATION_NOTES",
    role: "a senior developer helping document implementation decisions",
    goal: "Help me capture what was built, the approach taken, gotchas encountered, and dependencies.",
    outputFormat: `# Implementation Notes

## What Was Built
[Summary of the implementation]

## Approach
[Technical approach and key design patterns used]

## Key Files & Functions
[Important code locations]

## Gotchas & Workarounds
[Non-obvious issues and how they were resolved]

## Dependencies
[Libraries, services, or systems this depends on]`,
    questions: [
      "What did you build or change?",
      "What approach did you take and why?",
      "What were the tricky parts or gotchas?",
      "Are there any workarounds or tech debt to note?",
      "What external dependencies does this rely on?",
    ],
  },

  ENV_SETUP: {
    docType: "ENV_SETUP",
    role: "a DevOps engineer helping document environment setup",
    goal: "Help me document the local development setup, environment variables, and third-party service configurations.",
    outputFormat: `# Environment Setup

## Prerequisites
[Required tools, versions, system requirements]

## Local Setup Steps
[Step-by-step setup instructions]

## Environment Variables
[All env vars with descriptions and example values]

## Third-Party Services
[External services, API keys, configuration]

## Troubleshooting
[Common setup issues and fixes]`,
    questions: [
      "What tools/software does a developer need installed?",
      "What are the step-by-step setup instructions?",
      "What environment variables are needed?",
      "What third-party services does the project use?",
      "What are common setup problems and their fixes?",
    ],
  },

  TEST_STRATEGY: {
    docType: "TEST_STRATEGY",
    role: "a QA engineer helping define a test strategy",
    goal: "Help me define what to test, coverage targets, testing tools, and known gaps.",
    outputFormat: `# Test Strategy

## Testing Scope
[What to test and what not to test]

## Test Types
[Unit, integration, E2E, manual — with tooling]

## Coverage Targets
[Coverage goals by area]

## Critical Paths
[Most important user flows to test]

## Known Gaps
[Areas without coverage and risk assessment]`,
    questions: [
      "What are the most critical user flows in your app?",
      "What testing tools are you using or planning to use?",
      "What level of coverage are you targeting?",
      "Are there areas you know are under-tested?",
      "What types of tests do you plan to write (unit, integration, E2E)?",
    ],
  },

  DEPLOY_CONFIG: {
    docType: "DEPLOY_CONFIG",
    role: "a DevOps engineer helping document deployment configuration",
    goal: "Help me document deployment environments, CI/CD pipeline, secrets management, and rollback procedures.",
    outputFormat: `# Deploy & Infra Config

## Environments
[Production, staging, development — with URLs]

## CI/CD Pipeline
[Build, test, deploy steps]

## Secrets Management
[How secrets are stored and rotated]

## Infrastructure
[Hosting, databases, CDN, monitoring]

## Rollback Procedures
[How to roll back a bad deploy]`,
    questions: [
      "Where is the app hosted (Vercel, AWS, etc.)?",
      "What environments do you have (prod, staging, dev)?",
      "What does your CI/CD pipeline look like?",
      "How do you manage secrets and env vars in production?",
      "What's your rollback strategy if a deploy goes wrong?",
    ],
  },

  LAUNCH_CHECKLIST: {
    docType: "LAUNCH_CHECKLIST",
    role: "a release manager helping create a launch checklist",
    goal: "Help me create a comprehensive launch checklist covering pre-launch verification, monitoring, and rollback planning.",
    outputFormat: `# Launch Checklist

## Pre-Launch Verification
- [ ] All tests passing
- [ ] Security review complete
- [ ] Performance benchmarks met

## Launch Steps
- [ ] Deploy to production
- [ ] Verify critical paths
- [ ] Enable monitoring

## Post-Launch Monitoring
- [ ] Error rate baseline
- [ ] Performance metrics
- [ ] User feedback channels

## Rollback Plan
[Conditions that trigger rollback and steps to execute]`,
    questions: [
      "What must be verified before launching?",
      "What are the exact deployment steps?",
      "What should be monitored after launch?",
      "What would trigger a rollback, and how would you do it?",
      "Who needs to be notified about the launch?",
    ],
  },

  ITERATION_LOG: {
    docType: "ITERATION_LOG",
    role: "a product manager helping document an iteration cycle",
    goal: "Help me log what changed, why it changed, learnings from this iteration, and metrics before/after.",
    outputFormat: `# Iteration Log

## What Changed
[Summary of changes in this iteration]

## Why
[Motivation: user feedback, metrics, bugs, new requirements]

## Learnings
[What we learned from this iteration]

## Metrics Before / After
[Quantitative impact of changes]

## Next Steps
[What this iteration suggests we do next]`,
    questions: [
      "What did you change in this iteration?",
      "What motivated the changes (feedback, data, bugs)?",
      "What did you learn from making these changes?",
      "Did any metrics improve or regress?",
      "What should the next iteration focus on?",
    ],
  },

  FEEDBACK_CAPTURE: {
    docType: "FEEDBACK_CAPTURE",
    role: "a product manager helping organize user feedback",
    goal: "Help me structure raw user feedback into categorized, prioritized insights with clear action items.",
    outputFormat: `# User Feedback Capture

## Feedback Sources
[Where feedback came from: support tickets, interviews, analytics]

## Bug Reports
[Bugs with severity and reproduction steps]

## Feature Requests
[Requested features ranked by frequency and impact]

## User Signals
[Behavioral patterns from analytics]

## Action Items
[Prioritized list of what to do with this feedback]`,
    questions: [
      "Where is this feedback coming from (support, interviews, analytics)?",
      "What bugs have users reported?",
      "What features are users asking for most?",
      "Are there any usage patterns that surprised you?",
      "What's the most urgent thing to address?",
    ],
  },
}
