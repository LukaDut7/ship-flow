# Roadmap

What's planned for ShipFlow, from current state to long-term vision.

## Current State (v1.0)

A fully functional client-side SDLC guide with:

- ✅ 10 phases, 45 checklist items
- ✅ 6 AI personas with per-checklist-item assignment
- ✅ Pre-written prompts optimized for Expo + NestJS + K8s + AWS
- ✅ Markdown templates for every deliverable
- ✅ In-memory file editor with version snapshots
- ✅ Chat panel with per-persona-per-file history tracking
- ✅ Persona badges showing consultation history
- ✅ Progress tracking (per-phase and global)
- ✅ Gate conditions per phase
- ✅ Dark theme UI

**Limitation:** All state is in-memory. Refresh = reset.

---

## v1.1 — Persistence

**Goal:** Don't lose work on refresh.

| Feature | Details |
|---------|---------|
| LocalStorage persistence | Auto-save files, chat, progress to browser storage |
| Export to JSON | Download full project state as `.shipflow.json` |
| Import from JSON | Resume a project from exported state |
| Export to ZIP | Download all markdown files as a zip |

---

## v1.2 — Real AI Integration

**Goal:** Chat panel connects to Claude API.

| Feature | Details |
|---------|---------|
| Claude API integration | Each persona sends system prompt + project context + phase context |
| Project context injection | Automatically include relevant prior files as context (e.g., pitch.md when writing stories) |
| Streaming responses | Real-time token streaming in chat |
| API key management | User provides their own API key (stored locally) |

### Persona System Prompts

Each persona's API call would include:
1. **System prompt** — role definition, expertise, communication style
2. **Project context** — completed files from prior phases (auto-selected)
3. **Phase context** — current phase goal, checklist item description, "done when" criteria
4. **Stack context** — tech stack reference (Expo + NestJS + K8s + AWS)

---

## v1.3 — Git Integration

**Goal:** Files are real, not just in-memory.

| Feature | Details |
|---------|---------|
| Generate files to disk | "Export to project" writes markdown files to a repo's `/docs` folder |
| Git status integration | Show which files have changed since last commit |
| Version control via git | Replace in-app versions with git commits |
| Monorepo awareness | Detect Expo + NestJS monorepo structure |

---

## v2.0 — Platform Packs

**Goal:** Support stacks beyond Expo + NestJS + K8s + AWS.

A "Pack" is a set of stack-specific prompts, templates, and checklist items that plug into the same 10-phase framework.

| Pack | Frontend | Backend | Infra |
|------|----------|---------|-------|
| **Expo + NestJS** (current) | Expo SDK 52 | NestJS microservices | K8s + AWS |
| **Next.js + tRPC** | Next.js App Router | tRPC + Prisma | Vercel + PlanetScale |
| **React + Express** | Vite + React | Express + Mongoose | Docker + Railway |
| **Flutter + FastAPI** | Flutter | FastAPI + SQLAlchemy | GCP + Cloud Run |
| **Swift + Vapor** | SwiftUI | Vapor + Fluent | AWS + ECS |

Each pack overrides:
- Phase 2: Architecture files (service patterns, data models)
- Phase 4: Setup files (init commands, docker config, CI/CD)
- Phase 5: Test templates (framework-specific test patterns)
- Phase 8: Deploy steps (platform-specific deploy commands)

Phases 1, 3, 9, 10 remain mostly stack-agnostic.

---

## v2.1 — Custom Personas

**Goal:** Users define their own AI assistants.

| Feature | Details |
|---------|---------|
| Create persona | Name, role, icon, color, system prompt |
| Assign to checklists | Override defaults with custom personas |
| Share personas | Export/import persona definitions |
| Industry personas | Pre-built: compliance officer, data engineer, etc. |

---

## v2.2 — Team Features

**Goal:** Multiple people on one ShipFlow project.

| Feature | Details |
|---------|---------|
| Shared project state | Real-time sync via WebSocket or CRDT |
| Person assignments | Assign checklist items to team members |
| Comments | Leave notes on files for teammates |
| Activity feed | Who completed what, when |

---

## v3.0 — Analytics & Learning

**Goal:** ShipFlow learns from your development patterns.

| Feature | Details |
|---------|---------|
| Time tracking | How long each phase/item actually takes |
| Estimation accuracy | Predicted vs actual, with correction factor |
| Bottleneck detection | Which phases slow you down consistently |
| Recommendations | "Teams like yours usually spend more time on X" |
| Template learning | Improve templates based on what users actually write |

---

## Long-term Vision

ShipFlow becomes the **operating system for building software** — not just a guide, but an active participant that:

1. **Knows your project** — every decision, every file, every conversation
2. **Guides proactively** — "You haven't written tests for Story 3" or "Your infra design doesn't account for the async events in your microservices doc"
3. **Connects to your tools** — creates Jira tickets from tasks, opens PRs from code, deploys from the ship phase
4. **Learns from the community** — aggregated patterns from thousands of projects improve the framework for everyone
5. **Adapts to your pace** — solo founder building nights/weekends gets different timeline guidance than a funded team

The core principle remains: **every output is a file, every file is committable, every decision is documented.**
