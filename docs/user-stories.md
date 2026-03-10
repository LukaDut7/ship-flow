# ShipFlow User Stories

> Derived from [Product Blueprint](./blueprint.md)
> Organized by feature area, mapped to lifecycle phases and product layers

---

## Epic 1: Authentication & Onboarding

### US-1.1: OAuth Sign-In
**As a** developer visiting ShipFlow for the first time,
**I want to** sign in with my GitHub or Google account,
**So that** I can get started without creating a new username/password.

**Acceptance Criteria:**
- Landing page shows "Sign In" and "Get Started" CTAs
- OAuth buttons for GitHub and Google are displayed on the sign-in page
- After successful OAuth, user is redirected to the dashboard
- User record is created with FREE tier by default

### US-1.2: Authenticated Access
**As a** signed-in user,
**I want to** be redirected to the dashboard when I access the app,
**So that** I land on a useful page after authentication.

**Acceptance Criteria:**
- Unauthenticated users are redirected to the landing/sign-in page
- Authenticated users accessing `/` are redirected to `/dashboard`

### US-1.3: Sign Out
**As a** signed-in user,
**I want to** sign out from my account,
**So that** I can secure my session when I'm done.

**Acceptance Criteria:**
- Sign-out option is accessible from the app layout
- After sign-out, user is redirected to the landing page

---

## Epic 2: Project Management

### US-2.1: Create a Project
**As a** developer,
**I want to** create a new project with a name, description, and tech stack,
**So that** I have an organized workspace for all my project knowledge.

**Acceptance Criteria:**
- "New Project" button is accessible from the dashboard
- Form includes Name, Description, Tech Stack picker, and Project Template selector
- On creation, lifecycle-phase template documents are auto-generated (15 doc types across 8 phases)
- User is redirected to the project overview page after creation
- Project appears on the dashboard

### US-2.2: Project Templates
**As a** developer starting a new project,
**I want to** select a project template (SaaS Web App, REST API, Mobile App, Chrome Extension, CLI Tool, or Blank),
**So that** the tech stack is pre-filled with sensible defaults for my project type.

**Acceptance Criteria:**
- Template options displayed as selectable cards on the new project form
- Selecting a template pre-fills the tech stack (e.g., SaaS Web App fills Next.js, React, TypeScript, PostgreSQL)
- "Blank Project" option starts with an empty tech stack
- User can still modify the tech stack after template selection

### US-2.3: View Dashboard
**As a** developer with multiple projects,
**I want to** see all my projects on a dashboard,
**So that** I can quickly navigate to any project.

**Acceptance Criteria:**
- Dashboard shows project cards with name and metadata
- Clicking a project card navigates to the project overview
- Empty state shows "No projects yet" with a "Create Project" link
- "New Project" button is always visible on the dashboard

### US-2.4: Project Overview
**As a** developer working on a project,
**I want to** see an overview with phase progress, quick links, and suggested next steps,
**So that** I know the status of my project at a glance.

**Acceptance Criteria:**
- Project name and description are displayed
- 8 phase progress cards shown (Ideation through Iteration)
- Each phase card links to the docs list filtered by that phase
- Quick links to Prompt History and Context Bundles are visible
- "Generate Prompt" and "Settings" buttons are accessible
- If the Project Brief is empty, "Suggested Next Steps" are shown

### US-2.5: Update Project Settings
**As a** developer,
**I want to** update my project's name, description, and tech stack,
**So that** I can keep project metadata accurate as it evolves.

**Acceptance Criteria:**
- Settings page accessible from the project overview
- Form pre-filled with current project name, description, and tech stack
- Tech stack picker allows adding and removing technologies
- Changes persist after saving and are reflected on the project overview

### US-2.6: Delete a Project
**As a** developer,
**I want to** delete a project I no longer need,
**So that** my dashboard stays clean and I free up any tier limits.

**Acceptance Criteria:**
- "Delete Project" button in project settings (danger zone)
- Confirmation dialog warns the action cannot be undone
- After deletion, user is redirected to the dashboard
- All associated documents, bundles, and prompts are cascade-deleted

### US-2.7: Free Tier Project Limit
**As a** free-tier user,
**I want to** be informed when I've reached the 3-project limit,
**So that** I understand why I can't create more projects and can consider upgrading.

**Acceptance Criteria:**
- Free-tier users can create up to 3 projects
- Attempting to create a 4th project shows an error/limit message
- Pro-tier users have unlimited projects

---

## Epic 3: Document Management

### US-3.1: View Documents by Phase
**As a** developer,
**I want to** browse my project documents organized by lifecycle phase,
**So that** I can find the right document quickly.

**Acceptance Criteria:**
- Docs list page shows tabs: All, Ideation, Planning, Design, Architecture, Development, Testing, Shipping, Iteration
- Clicking a phase tab filters the document list
- Each document card shows the document name, phase badge, and type badge
- "New Document" button is visible on the docs list

### US-3.2: View and Edit a Document
**As a** developer,
**I want to** view a document in preview mode and edit it in a markdown editor,
**So that** I can read polished content and write in a familiar format.

**Acceptance Criteria:**
- Document page has "Preview" and "Edit" tabs
- Preview tab renders markdown as formatted HTML
- Edit tab shows a textarea with raw markdown content
- Word count is displayed and updates in real time
- Title is editable inline (input field at the top)

### US-3.3: Auto-Save Document Content
**As a** developer editing a document,
**I want to** have my changes saved automatically,
**So that** I don't lose work if I navigate away or close the browser.

**Acceptance Criteria:**
- Changes in the editor trigger auto-save after a brief debounce
- "Saving..." indicator appears during save
- "Saved" indicator appears after successful save
- No manual save button needed

### US-3.4: Create a New Document
**As a** developer,
**I want to** create additional documents of any type within a project,
**So that** I can add more specs, notes, or decisions as the project grows.

**Acceptance Criteria:**
- "New Document" button on the docs list page
- Form allows selecting a document type from a dropdown
- New document is pre-filled with the template for the selected type
- After creation, user is redirected to the new document's editor

### US-3.5: Get AI Help Writing a Document
**As a** developer staring at a blank template,
**I want to** click "Help me write this" and get a tailored prompt I can paste into any AI tool,
**So that** the AI helps me fill out this specific document type using my project context.

**Acceptance Criteria:**
- "Help me write this" button visible on every document page (sparkles icon)
- Clicking opens a dialog with a generated writing prompt
- The prompt includes:
  - A role and goal specific to the document type (e.g., "product strategist" for Project Brief, "backend architect" for API Contract)
  - Project context (name, description, tech stack)
  - Existing project knowledge from other filled documents
  - Targeted questions for the user to answer (specific to that doc type)
  - The exact output format matching the document's template structure
- If the document already has content (>200 chars), the prompt asks the AI to improve the draft
- If the document is empty, the prompt asks the AI to ask questions or generate a first draft
- "Copy to Clipboard" button with success toast: "Copied! Paste into ChatGPT, Claude, or any AI tool."
- Character count and estimated token count displayed
- Works on all 15 document types
- No AI API key required (free tier feature)

### US-3.6: Delete a Document
**As a** developer,
**I want to** delete a document I no longer need,
**So that** I can keep my project repository clean.

**Acceptance Criteria:**
- "Delete" button is visible on the document detail page
- Confirmation dialog warns the action cannot be undone
- After deletion, user is redirected to the project overview
- Associated bundle entries and prompt references are cleaned up

### US-3.7: Export a Single Document
**As a** developer,
**I want to** export a single document as a markdown file,
**So that** I can use it outside ShipFlow or share it with others.

**Acceptance Criteria:**
- "Export" button on the document detail page
- Clicking triggers a `.md` file download with the document content
- Success toast is displayed after export

### US-3.8: Sidebar Document Navigation
**As a** developer working within a project,
**I want to** see all documents grouped by phase in a sidebar,
**So that** I can quickly jump between documents without going back to the list.

**Acceptance Criteria:**
- Project sidebar shows documents grouped under phase headings
- Clicking a document name navigates to that document
- Search input in the sidebar filters documents by name

---

## Epic 4: Prompt Generation

### US-4.1: Generate a Prompt from a Document
**As a** developer,
**I want to** generate a context-rich prompt from any document,
**So that** I can paste it into my AI tool with full project context.

**Acceptance Criteria:**
- "Generate Prompt" button on every document detail page
- Prompt generation page lets user select a target tool (Cursor, Claude Projects, Claude Code, ChatGPT, Generic)
- Options to include/exclude: project context, tech stack, phase context, linked documents
- Custom instructions textarea for additional guidance
- Live preview of the assembled prompt

### US-4.2: Copy Prompt to Clipboard
**As a** developer,
**I want to** copy the generated prompt to my clipboard with one click,
**So that** I can quickly paste it into my AI tool.

**Acceptance Criteria:**
- "Copy to Clipboard" button on the prompt preview
- Success feedback (toast or button text change) after copying
- Full formatted prompt is copied

### US-4.3: Download Prompt as Markdown
**As a** developer,
**I want to** download the generated prompt as a `.md` file,
**So that** I can save it locally or share it.

**Acceptance Criteria:**
- Download option available on the prompt generation page
- Clicking triggers a `.md` file download with the prompt content

### US-4.4: Select a Prompt Template
**As a** developer,
**I want to** choose from pre-built prompt templates for common tasks,
**So that** I get expert-quality prompts without writing instructions from scratch.

**Acceptance Criteria:**
- Template dropdown on the prompt generation page
- Selecting a template fills in the custom instructions field
- Templates are organized by use case (e.g., "Generate feature spec", "Write tests", "Create API contract")

### US-4.5: Save Prompt to History
**As a** developer,
**I want to** save generated prompts to a history,
**So that** I can reuse or reference them later.

**Acceptance Criteria:**
- "Save to History" button on the prompt generation page
- Success feedback after saving
- Saved prompts appear on the Prompt History page

### US-4.6: View Prompt History
**As a** developer,
**I want to** browse my previously generated prompts,
**So that** I can reuse, compare, or learn from past prompts.

**Acceptance Criteria:**
- Prompt History page lists all saved prompts for the project
- Each entry shows target tool, date, and a preview of the content
- Long prompts have an expand/collapse toggle
- Empty state shows "No prompts generated yet"

### US-4.7: Delete a Prompt from History
**As a** developer,
**I want to** delete old prompts from history,
**So that** I can keep my prompt history relevant and clean.

**Acceptance Criteria:**
- Delete button on each prompt history entry
- Prompt is removed from the list after deletion

---

## Epic 5: Context Bundles

### US-5.1: Create a Context Bundle
**As a** developer working on a complex task,
**I want to** select multiple documents and bundle them into a single context export,
**So that** I can give my AI tool cross-document context for tasks like "build the payment feature."

**Acceptance Criteria:**
- "New Bundle" page with a name field and document picker
- Document picker shows documents grouped by phase with checkboxes
- "Select All" button per phase to quickly select all docs in a phase
- Selection count displayed (e.g., "3 documents selected")
- After creation, user is redirected to the bundle detail page

### US-5.2: View Bundle Detail
**As a** developer,
**I want to** see a bundle's included documents and available actions,
**So that** I can verify the bundle contents and take action.

**Acceptance Criteria:**
- Bundle detail page shows bundle name as heading
- "Included documents" section lists all bundled documents
- "Generate Prompt from Bundle" link navigates to the prompt generator with the bundle pre-selected
- "Export Bundle" button is available

### US-5.3: Edit a Bundle
**As a** developer,
**I want to** update a bundle's name and document selection,
**So that** I can keep bundles accurate as the project evolves.

**Acceptance Criteria:**
- "Edit Bundle" section on the bundle detail page
- Name field is editable
- Document selection can be changed
- "Update Bundle" button saves changes

### US-5.4: Delete a Bundle
**As a** developer,
**I want to** delete a bundle I no longer need,
**So that** my bundle list stays clean.

**Acceptance Criteria:**
- "Delete Bundle" button on the bundle detail page
- Confirmation dialog appears before deletion
- After deletion, user is redirected to the bundles list

### US-5.5: Export a Bundle as Markdown
**As a** developer,
**I want to** export a bundle as a single markdown file,
**So that** I can use the assembled context outside ShipFlow.

**Acceptance Criteria:**
- "Export Bundle" button on the bundle detail page
- Clicking triggers a `.md` file download containing all bundled document content
- Success toast is displayed

### US-5.6: Bundles List and Empty State
**As a** developer,
**I want to** see all my bundles or a helpful empty state,
**So that** I can manage existing bundles or create my first one.

**Acceptance Criteria:**
- Bundles list page shows all bundles for the project
- Empty state shows "No context bundles yet" with a "Create your first bundle" link

---

## Epic 6: Project Export

### US-6.1: Export Project as ZIP
**As a** developer,
**I want to** export my entire project as a ZIP file with documents organized by phase,
**So that** I have a portable backup of all my project knowledge.

**Acceptance Criteria:**
- Export option available in project settings or exports page
- ZIP contains folders per phase, each containing `.md` files for that phase's documents
- File downloads automatically

### US-6.2: Export as Cursor Rules File
**As a** developer using Cursor,
**I want to** export my project context as a `.cursorrules` file,
**So that** Cursor has persistent awareness of my project.

**Acceptance Criteria:**
- "Export as Cursor Rules" option available
- Generated file includes project context, tech stack, and all document content formatted for Cursor
- File downloads with `.cursorrules` extension

### US-6.3: Export as Claude Project Docs
**As a** developer using Claude Projects,
**I want to** export my project as a Claude-formatted knowledge document,
**So that** I can upload it to Claude Projects for persistent context.

**Acceptance Criteria:**
- "Export as Claude Project" option available
- Generated file is formatted for Claude Projects
- File downloads as `.md`

---

## Epic 7: Navigation & Layout

### US-7.1: App Sidebar
**As a** developer,
**I want to** see a sidebar with links to the dashboard and my projects,
**So that** I can navigate between projects without going back to the dashboard.

**Acceptance Criteria:**
- Sidebar shows a "Dashboard" link
- Sidebar lists the user's projects
- Clicking a project name navigates to that project's overview

### US-7.2: Landing Page
**As a** visitor,
**I want to** see what ShipFlow offers on the landing page,
**So that** I can decide whether to sign up.

**Acceptance Criteria:**
- Hero section with value proposition
- Features section explaining key capabilities
- "How it works" section
- CTA buttons linking to sign-in

---

## Epic 8: Tier & Pricing (Future)

### US-8.1: Upgrade to Pro
**As a** free-tier user who has hit the project or prompt limit,
**I want to** upgrade to Pro,
**So that** I get unlimited projects, context bundles, prompt history, and tool-specific formatting.

**Acceptance Criteria:**
- Upgrade prompt when hitting limits
- Pricing page shows Free / Pro ($12/mo) / Pro + Agents ($24/mo)
- After upgrade, limits are lifted immediately

### US-8.2: Smart Context Selection (Pro)
**As a** Pro user,
**I want to** describe what I'm about to do and have ShipFlow auto-select relevant documents,
**So that** I get the optimal prompt without manually picking documents.

**Acceptance Criteria:**
- Text input: "I'm about to build the Stripe integration"
- AI-powered selection of relevant docs (API contracts, security ADRs, etc.)
- User can review and adjust the selection before generating the prompt

---

## Epic 9: Agent Chat (Future - Layer 3)

### US-9.1: Spec Agent
**As a** developer with a feature idea,
**I want to** chat with an AI agent grounded in my project context,
**So that** a structured feature spec is generated from the conversation and filed into my repo.

### US-9.2: Architecture Advisor
**As a** developer making technical decisions,
**I want to** discuss trade-offs with an agent that knows my existing stack, constraints, and past decisions,
**So that** I get advice grounded in my project's reality, not generic best practices.

### US-9.3: Review Agent
**As a** developer seeking code review,
**I want to** paste code or a PR and have it reviewed against my project's design decisions, conventions, and test strategy,
**So that** reviews are context-aware and actionable.

### US-9.4: Ship Coach
**As a** developer wondering what to work on next,
**I want to** ask a coaching agent that examines my repo and identifies gaps,
**So that** I get prioritized suggestions (e.g., "no tests yet", "missing deploy config").

### US-9.5: Iteration Agent
**As a** developer processing post-launch feedback,
**I want to** feed in bug reports or user feedback and have an agent cross-reference my repo,
**So that** I know which specs, code, or tests need updating and get prompts for the changes.

---

## Story Map Summary

| Epic | Stories | Status |
|------|---------|--------|
| 1. Authentication & Onboarding | 3 | Implemented |
| 2. Project Management | 7 | Implemented |
| 3. Document Management | 8 | Implemented |
| 4. Prompt Generation | 7 | Implemented |
| 5. Context Bundles | 6 | Implemented |
| 6. Project Export | 3 | Implemented |
| 7. Navigation & Layout | 2 | Implemented |
| 8. Tier & Pricing | 2 | Partial (limits enforced, no payment UI) |
| 9. Agent Chat | 5 | Future (Layer 3) |
| **Total** | **43** | |
