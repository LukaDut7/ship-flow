# System Overview

## Purpose

ShipFlow solves a specific problem: **solo developers and small teams know how to code but don't know how to ship.** They skip architecture, rush past testing, forget about CI/CD, and end up rewriting everything three months later.

ShipFlow is a structured, interactive guide that walks you through the entire software development lifecycle — from a rough idea to a production app with paying users — using AI assistants that play specific expert roles at each step.

## Core Concepts

### 1. Phases

The SDLC is broken into **10 sequential phases**. Each phase has a clear goal, a time estimate, and a **gate** — a condition that must be true before moving to the next phase.

Phases are sequential for a reason. You can't build (Phase 5) before you've designed the architecture (Phase 2). You can't QA (Phase 7) before you've built something (Phase 5). The order prevents the most common development mistakes.

```
1. Define      → What are we building?
2. Design      → How does it work technically?
3. Design UI   → What does it look like?
4. Plan        → What's the roadmap + setup?
5. Build (TDD) → Write code (test-first)
6. Review      → Is it correct + secure?
7. QA          → Does it break?
8. Ship        → Deploy everywhere
9. Sell        → Get users + revenue
10. Iterate    → Learn → back to Build
```

### 2. Checklist Items (Files)

Each phase contains **3-7 checklist items**. Each item produces a **markdown file** — a concrete deliverable that captures decisions, designs, or plans. These files:

- Have a **clear purpose** ("what") and **completion criteria** ("done when")
- Include a **pre-written AI prompt** optimized for the task
- Include a **markdown template** as a starting point
- Have a **default AI persona** assigned based on expertise required
- Track **which personas have been consulted**

The key insight: every deliverable is a markdown file that lives alongside your code. When you're done, you have a `/docs` folder that explains every decision you made.

### 3. AI Personas

Six AI assistants, each with a distinct role and expertise. Unlike generic AI chat, each persona has context about:

- Their specific role (PM, CTO, Designer, DevOps, Lead Dev, QA)
- The current phase and checklist item
- The tech stack (Expo + NestJS + K8s + AWS)
- What "good" looks like for their domain

Personas are **assigned per checklist item, not per phase**. A CI/CD pipeline checklist defaults to Alex (DevOps) even though it's in Phase 4 (Plan). You can override and ask any persona about any item — maybe you want Taylor (QA) to review your test strategy, or Jordan (CTO) to weigh in on your data model.

### 4. Gates

Each phase ends with a gate — a non-negotiable condition that must be true. Gates prevent the most common development failure mode: rushing past important steps.

Examples:
- Phase 1 gate: "Every criterion is testable. Vague → rewrite."
- Phase 5 gate: "All tests green. Coverage > 70% FE, > 80% BE."
- Phase 8 gate: "Smoke tested on real devices + production API."

## How It Works

### Workflow per checklist item

```
1. Read the "what" and "done when" to understand the deliverable
2. Copy the prompt → paste into any AI (Claude, ChatGPT, etc.)
   OR click "Chat" to use the built-in chat with the assigned persona
3. Iterate on the AI's response until it meets "done when"
4. Paste the result into the file editor (or use the 📎 button from chat)
5. Save a version snapshot (💾)
6. Mark complete (✓ Done)
```

### Workflow per phase

```
1. Read the phase goal and time estimate
2. Work through each checklist item top-to-bottom
3. At the gate, verify all conditions are met
4. Move to next phase
```

### Workflow for a full project

```
Phase 1-3:  Planning + design (1-2 weeks)
Phase 4:    Setup + roadmap (1-2 days)
Phase 5-7:  Build → Review → QA loop (per milestone)
Phase 8:    Ship (4-8 hours)
Phase 9:    Sell (ongoing)
Phase 10:   Retro → back to Phase 5 for next milestone
```

## What ShipFlow Is NOT

- **Not a code generator.** It doesn't write your app. It guides you through decisions and provides AI prompts that help you make those decisions well.
- **Not a project management tool.** No Gantt charts, no sprint boards, no team assignments. It's a personal guide.
- **Not a boilerplate/template.** It doesn't generate starter code. It produces documentation files that describe what to build and why.
- **Not tied to one AI.** Prompts work with any LLM. The built-in chat is a convenience layer, not a requirement.

## Who It's For

- **Solo developers** building their first production app who want structure without a team
- **Small teams (2-5)** who need a shared process but not enterprise tooling
- **Developers learning full-stack** who need to understand the complete lifecycle
- **Side project builders** who want to actually ship, not just code forever

## Design Principles

1. **Every output is a file.** Decisions are documented as markdown, committable to git alongside code.
2. **Expert per task, not per phase.** The right persona for CI/CD is DevOps, regardless of which phase it's in.
3. **Gates prevent skipping.** The most common failure is rushing. Gates force rigor.
4. **Stack-specific, not generic.** Prompts reference the exact tools (Expo, NestJS, Prisma, K8s) — not abstract concepts.
5. **Opinionated but overridable.** Default personas and templates are suggestions. You can use any persona for any item.
