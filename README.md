# ⚡ ShipFlow

**Idea → Production → Growth** — A structured SDLC guide with AI assistants that walks solo developers and small teams through every phase of building a production app.

## What is ShipFlow?

ShipFlow is an interactive development companion that breaks the entire software development lifecycle into **10 phases**, **45 checklist items**, and **6 AI personas**. Each checklist item comes with a ready-to-use AI prompt, a markdown template, and a recommended assistant — so you always know what to do next, who to ask, and what "done" looks like.

It's not a project management tool. It's not a CI/CD dashboard. It's the **missing guide between "I have an idea" and "it's live in the app store with paying users."**

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Tech Stack (ShipFlow itself)

| Layer | Choice |
|-------|--------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State | React Context |

## Tech Stack (What ShipFlow guides you to build)

| Layer | Choice |
|-------|--------|
| Mobile + Web | React Native + Expo SDK 52 |
| Backend | NestJS microservices (TypeScript monorepo) |
| Database | PostgreSQL (per service) |
| ORM | Prisma |
| Infrastructure | Docker + Kubernetes (AWS EKS) |
| Cloud | AWS (ECR, RDS, S3, CloudFront, SQS) |
| CI/CD | GitHub Actions → ECR → EKS + EAS Build |
| Monitoring | Sentry + Prometheus + Grafana |

## Documentation

| Doc | Description |
|-----|-------------|
| [System Overview](docs/SYSTEM.md) | What ShipFlow does, core concepts, architecture |
| [Phases & Checklists](docs/PHASES.md) | All 10 phases, 45 items, default personas |
| [Personas](docs/PERSONAS.md) | 6 AI assistants, their roles, when to use each |
| [Architecture](docs/ARCHITECTURE.md) | Code structure, state management, data flow |
| [Roadmap](docs/ROADMAP.md) | Planned features and future direction |

## Project Structure

```
shipflow/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout
│   ├── globals.css         # Tailwind + dark theme
│   └── page.tsx            # Main page
├── components/             # React components
│   ├── TopBar.tsx          # Header with progress
│   ├── Sidebar.tsx         # Phase tree + file list
│   ├── MiddlePanel.tsx     # Router: FileEditor or PhaseView
│   ├── PhaseView.tsx       # Phase checklist + gate
│   ├── ChecklistItem.tsx   # Expandable item with prompt + actions
│   ├── FileEditor.tsx      # Markdown editor + versions
│   ├── ChatPanel.tsx       # Per-persona chat with history
│   └── PersonaSelector.tsx # Reusable persona dropdown
├── lib/                    # Data and state
│   ├── types.ts            # TypeScript interfaces
│   ├── personas.ts         # 6 AI assistant definitions
│   ├── phases.ts           # 10 phases with 45 checklist items
│   └── store.tsx           # React Context state management
├── docs/                   # Documentation
└── package.json
```

## License

MIT
