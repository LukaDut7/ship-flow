# AI Personas

ShipFlow uses 6 AI personas — specialized assistants that guide you through different aspects of software development. Each persona has a distinct perspective, expertise, and communication style.

## Why Personas?

A generic AI gives generic answers. When you ask "review my code," a generic AI checks syntax. When Marcus (Lead Dev) reviews your code, he checks test coverage, Prisma N+1 queries, NestJS guard placement, and platform-specific bugs — because that's his job.

Personas provide:
- **Contextual expertise** — each knows their domain deeply
- **Consistent perspective** — Sara always thinks about users, Taylor always tries to break things
- **Cross-pollination** — asking Taylor about your test strategy gives a different (valuable) answer than asking Marcus

## The Six Personas

---

### 📋 Sara — Product Manager
**Color:** `#3B82F6` (Blue)
**Greeting:** "Let's define what we're building."

**Expertise:**
- Product definition and scoping
- User research and personas
- Story writing and prioritization
- Roadmap planning
- Launch strategy and go-to-market
- Pricing and growth
- Release communication
- Sprint retrospectives

**Default on 16 items** across Phases 1, 4, 8, 9, 10.

**When to override and use Sara:**
- You need to scope or cut features from any phase
- Your technical work lost sight of the user problem
- You need to communicate progress to stakeholders
- You're stuck and need to re-prioritize

---

### 🧭 Jordan — CTO
**Color:** `#8B5CF6` (Purple)
**Greeting:** "Let's make architecture decisions."

**Expertise:**
- Tech stack decisions (ADRs)
- Microservice architecture and decomposition
- Authentication and authorization design
- Data modeling (Prisma per service)
- API contract design
- System-level tradeoff analysis

**Default on 5 items** in Phase 2.

**When to override and use Jordan:**
- Any architectural question from any phase
- "Should we split this into a separate service?"
- "Is this the right tradeoff?"
- Technical debt decisions during Build phase

---

### 🎨 Yuki — Designer
**Color:** `#EC4899` (Pink)
**Greeting:** "Let's design something users enjoy."

**Expertise:**
- Screen inventory and UI planning
- User flow mapping
- Screen states (loading, empty, error, edge cases)
- Navigation architecture (Expo Router)
- Responsive strategy (NativeWind)
- Landing page design and copy
- Accessibility

**Default on 6 items** across Phases 3, 9.

**When to override and use Yuki:**
- Any UI/UX question during Build phase
- "How should this screen handle the error state?"
- "Does this flow make sense for mobile vs web?"
- Copy and visual design questions

---

### 🔧 Alex — DevOps Engineer
**Color:** `#10B981` (Green)
**Greeting:** "Let's set up infra that doesn't break."

**Expertise:**
- AWS architecture (EKS, RDS, ECR, S3, CloudFront, SQS)
- Kubernetes cluster design and management
- Docker and container orchestration
- CI/CD pipelines (GitHub Actions)
- Environment and secrets management
- Security review (K8s RBAC, network policies, secrets)
- Production readiness and deployment
- Monitoring setup (Prometheus, Grafana, Sentry)

**Default on 9 items** across Phases 2, 4, 6, 8.

**When to override and use Alex:**
- "Why is my pod crashing?"
- "How do I add a new environment variable?"
- "Is my deployment configuration correct?"
- Any infra, DevOps, or security question from any phase

---

### 🔨 Marcus — Lead Developer
**Color:** `#F59E0B` (Amber)
**Greeting:** "Show me the criterion. Test first."

**Expertise:**
- TDD methodology (RED → GREEN → REFACTOR)
- Test strategy and architecture
- NestJS service implementation
- Expo component development
- Code review and quality
- Task breakdown and estimation
- Refactoring and edge case handling
- Integration testing (Supertest + Prisma)

**Default on 7 items** across Phases 4, 5, 6.

**When to override and use Marcus:**
- "How should I structure this test?"
- "Is this the right abstraction?"
- "How long will this take?"
- Any implementation question

---

### 🧪 Taylor — QA Engineer
**Color:** `#EF4444` (Red)
**Greeting:** "I'm going to break everything."

**Expertise:**
- Cross-platform testing (iOS, Android, Web)
- Edge case discovery
- Load testing (k6)
- API testing
- Accessibility testing (VoiceOver, TalkBack)
- Bug triage and prioritization
- K8s health validation

**Default on 2 items** in Phase 7.

**When to override and use Taylor:**
- "What edge cases am I missing?"
- "How should I test this flow?"
- "Is this ready to ship?"
- Any quality question from any phase

---

## Persona Selection Model

### Default Persona per Checklist

Every checklist item has a **default persona** (`dp` field). This is the persona whose expertise best matches the deliverable. Defaults are shown as a faded icon on the checklist item header.

### Override Anytime

A dropdown on each expanded checklist item lets you pick **any persona** for that item. Common useful overrides:

| Scenario | Default | Override | Why |
|----------|---------|----------|-----|
| Review test strategy | Marcus | Taylor | QA perspective on test coverage |
| Review data model | Jordan | Marcus | Implementation feasibility |
| Review landing copy | Yuki | Sara | Marketing alignment |
| Review CI/CD pipeline | Alex | Marcus | Dev experience feedback |
| Review security | Alex | Jordan | Architecture-level security |

### Chat History per Persona per File

When you chat with multiple personas about the same checklist item, each conversation is preserved separately. The chat panel shows tabs for each persona who has contributed, letting you switch between perspectives.

The sidebar and checklist items show small persona icons (badges) for every assistant who has chatted on that file, giving a visual history of which experts have been consulted.

## Future: Custom Personas

The persona system is designed to be extensible. Future versions may support:
- User-defined personas with custom system prompts
- Industry-specific personas (e.g., HIPAA compliance officer, fintech risk analyst)
- Connecting personas to real Claude API with persistent project context
