# Architecture

Technical architecture of the ShipFlow application itself.

## Overview

ShipFlow is a **client-side Next.js application** with no backend. All state lives in React Context and resets on page reload. This is intentional for v1 — persistence comes later.

```
┌─────────────────────────────────────────────────┐
│                    TopBar                        │
├──────────┬─────────────────────┬────────────────┤
│          │                     │                │
│ Sidebar  │    MiddlePanel      │   ChatPanel    │
│ (220px)  │    (flex-1)         │   (280px)      │
│          │                     │                │
│ Phases   │  PhaseView          │  Persona       │
│  └Files  │   └ChecklistItems  │  Chat history  │
│          │  OR                 │  Input         │
│          │  FileEditor         │  Persona tabs  │
│          │                     │                │
└──────────┴─────────────────────┴────────────────┘
```

## Data Layer

### Types (`lib/types.ts`)

```typescript
PersonaKey    // "sara" | "jordan" | "yuki" | "alex" | "marcus" | "taylor"
Persona       // { name, role, icon, color, greeting }
FileSpec      // { id, name, label, dp, what, done, prompt, template }
Phase         // { id, num, name, icon, color, duration, goal, files, gate }
FileData      // { content, versions[], complete }
ChatMessage   // { role, text, ts, persona? }
```

### Static Data

| File | Contains | Size |
|------|----------|------|
| `lib/personas.ts` | 6 persona definitions + response templates | ~1KB |
| `lib/phases.ts` | 10 phases, 45 checklist items, all prompts + templates | ~33KB |

Phases and personas are static data arrays. They don't change at runtime.

### State (`lib/store.tsx`)

All mutable state lives in a single React Context provider. Key state:

| State | Type | Purpose |
|-------|------|---------|
| `activePhaseId` | `string` | Currently selected phase |
| `activeFileId` | `string \| null` | Currently open file (null = phase view) |
| `activePersonaKey` | `PersonaKey` | Currently selected AI persona |
| `expandedItem` | `string \| null` | Expanded checklist item in phase view |
| `expandedPhases` | `Record<string, boolean>` | Sidebar phase expansion state |
| `chatActive` | `boolean` | Whether chat panel is in active mode |
| `chatInput` | `string` | Current chat input text |
| `files` | `Record<string, FileData>` | All file content, versions, completion state |
| `chatMessages` | `Record<string, ChatMessage[]>` | All chat history |
| `chatPersonas` | `Record<string, PersonaKey[]>` | Which personas chatted per file |
| `copied` | `string \| null` | ID of recently copied prompt (for UI feedback) |

### Key Patterns

**File key:** `"phaseId/fileId"` (e.g., `"02-design/auth-flow"`)
- Used to look up file content, completion state, and persona history

**Chat key:** `"phaseId/fileId/personaKey"` (e.g., `"02-design/auth-flow/jordan"`)
- Each persona has a separate chat history per file
- Switching personas in chat shows that persona's conversation

**Persona tracking:** `chatPersonas["02-design/auth-flow"] = ["jordan", "alex"]`
- Records which personas have been consulted on each file
- Displayed as icon badges in sidebar and checklist items
- Enables quick switching between persona conversations

## Component Architecture

### Component Tree

```
StoreProvider
└── Layout (TopBar + 3-column flex)
    ├── TopBar              — progress counter, stack badge
    ├── Sidebar             — phase tree, file list, persona badges
    ├── MiddlePanel         — routes between:
    │   ├── PhaseView       — checklist items + gate
    │   │   └── ChecklistItem (×N) — expandable with prompt, selector, actions
    │   └── FileEditor      — textarea + toolbar + versions
    └── ChatPanel           — persona header, messages, input, persona tabs
```

### Component Responsibilities

| Component | Reads | Writes |
|-----------|-------|--------|
| `TopBar` | total progress | — |
| `Sidebar` | phases, files, expanded, personas | activePhase, activeFile, expandedPhases |
| `PhaseView` | activePhase | navigatePhase |
| `ChecklistItem` | file data, persona, expanded | expandedItem, startChat, copyPrompt |
| `FileEditor` | file content, versions | content, versions, complete |
| `ChatPanel` | messages, personas, input | messages, input, activePersona |
| `PersonaSelector` | activePersona | activePersona |

### Data Flow

```
User clicks checklist item "Chat with Jordan"
  → startChat("auth-flow", "jordan")
    → setActivePersonaKey("jordan")
    → setActiveFileId("auth-flow")
    → setChatActive(true)
    → trackPersona("02-design/auth-flow", "jordan")
    → init greeting message in chatMessages["02-design/auth-flow/jordan"]

User sends message
  → sendChat()
    → append user message to chatMessages[chatKey]
    → append mock assistant response (in production: Claude API call)
    → trackPersona (ensure persona is in chatPersonas for this file)

User clicks "📎 → file.md"
  → pasteToFile(text)
    → append text to files[fileKey].content

User clicks persona tab in chat
  → setActivePersona(pk) + startChat(fileId, pk)
    → chatKey changes → different message history loads
    → persona color/icon updates throughout UI
```

## Styling

- **Tailwind CSS** with custom color tokens in `tailwind.config.ts`
- Dark theme only (bg: `#09090B`, borders: `#1E1E22`)
- Persona colors used dynamically via `style={{ color: persona.color }}`
- Custom scrollbar styles in `globals.css`
- System fonts (no external font loading)

## File Organization Conventions

- `app/` — Next.js pages and layouts only
- `components/` — React components, one per file, named for what they render
- `lib/` — Data, types, state — no UI code
- `docs/` — Human-readable documentation

## Build & Bundle

- Static export (no server-side logic)
- All state client-side (React Context)
- ~120KB first load JS (Next.js + React + app code)
- No external API calls in current version
