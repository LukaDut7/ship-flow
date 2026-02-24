# Phases & Checklists

All 10 phases, 45 checklist items, with default persona assignments and rationale.

---

## Phase 1: Define 📋
**Duration:** 1-2 days · **Goal:** Idea → stories → testable acceptance criteria

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `pitch.md` | 📋 Sara (PM) | Product framing is PM work |
| 2 | `personas.md` | 📋 Sara (PM) | User research and segmentation |
| 3 | `user-stories.md` | 📋 Sara (PM) | Story writing and prioritization |
| 4 | `acceptance-criteria.md` | 📋 Sara (PM) | Testable criteria require PM + QA thinking |

**Gate:** Every criterion is testable. Vague → rewrite before proceeding.

---

## Phase 2: Design System 🏗️
**Duration:** 3-5 days · **Goal:** Architecture, services, data, infra — all decided before code

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `ADR-001-tech-stack.md` | 🧭 Jordan (CTO) | Stack decisions are architecture |
| 2 | `microservices.md` | 🧭 Jordan (CTO) | Service decomposition is architecture |
| 3 | `auth-flow.md` | 🧭 Jordan (CTO) | Auth design requires security + architecture |
| 4 | `data-model.md` | 🧭 Jordan (CTO) | Data modeling per service |
| 5 | `api-contract.md` | 🧭 Jordan (CTO) | API design is architecture |
| 6 | `infra-design.md` | 🔧 Alex (DevOps) | AWS + K8s is infrastructure, not architecture |

**Gate:** Trace each story: UI → gateway → service → DB → response. Every boundary clear.

---

## Phase 3: Design UI 🎨
**Duration:** 2-3 days · **Goal:** Every screen with all states before coding

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `screen-inventory.md` | 🎨 Yuki (Designer) | Screen listing is UX design |
| 2 | `user-flows.md` | 🎨 Yuki (Designer) | Flow mapping is UX design |
| 3 | `screen-states.md` | 🎨 Yuki (Designer) | State design prevents happy-path-only UIs |
| 4 | `navigation-map.md` | 🎨 Yuki (Designer) | Navigation requires UX + dev thinking |
| 5 | `responsive-strategy.md` | 🎨 Yuki (Designer) | Cross-platform layout is design |

**Gate:** Every screen has all states. Responsive works mobile → web.

---

## Phase 4: Plan & Roadmap 📊
**Duration:** 1-2 days · **Goal:** Roadmap + ordered tasks + repos initialized + CI green

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `roadmap.md` | 📋 Sara (PM) | Product roadmap is PM work |
| 2 | `milestone-current.md` | 📋 Sara (PM) | Scoping is PM work |
| 3 | `task-list.md` | 🔨 Marcus (Lead Dev) | Task breakdown requires technical estimation |
| 4 | `setup-frontend.md` | 🔧 Alex (DevOps) | Expo project setup is infrastructure |
| 5 | `setup-backend.md` | 🔧 Alex (DevOps) | NestJS monorepo + Docker is infrastructure |
| 6 | `ci-cd.md` | 🔧 Alex (DevOps) | GitHub Actions + ECR + K8s is DevOps |
| 7 | `env-management.md` | 🔧 Alex (DevOps) | Secrets + env vars is DevOps |

**Gate:** Repos initialized. Docker works. CI green. Roadmap approved. Env strategy documented.

---

## Phase 5: Build (TDD) 🔨
**Duration:** Per issue: hours to 2 days · **Goal:** RED → GREEN → REFACTOR per criterion

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `test-strategy.md` | 🔨 Marcus (Lead Dev) | Test architecture requires senior dev |
| 2 | `tdd-01-red.md` | 🔨 Marcus (Lead Dev) | Writing failing tests is dev work |
| 3 | `tdd-02-green.md` | 🔨 Marcus (Lead Dev) | Implementation is dev work |
| 4 | `tdd-03-refactor.md` | 🔨 Marcus (Lead Dev) | Refactoring requires senior judgment |
| 5 | `tdd-04-components.md` | 🔨 Marcus (Lead Dev) | Component testing is dev work |
| 6 | `tdd-05-api-tests.md` | 🔨 Marcus (Lead Dev) | Integration tests require backend expertise |

**Gate:** All tests green. Coverage > 70% FE, > 80% BE. Every criterion RED → GREEN → REFACTOR.

---

## Phase 6: Review 🔍
**Duration:** 30-60 min per PR · **Goal:** Self-review + security + infra check

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `pr-checklist.md` | 🔨 Marcus (Lead Dev) | Code review requires senior dev perspective |
| 2 | `security-review.md` | 🔧 Alex (DevOps) | Security spans auth, secrets, K8s, networking |

**Gate:** Coverage thresholds met. Security review passed. CI green.

---

## Phase 7: QA 🧪
**Duration:** 2-4 hours per milestone · **Goal:** Break frontend, backend, and infra

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `qa-frontend.md` | 🧪 Taylor (QA) | Manual + automated frontend testing |
| 2 | `qa-backend.md` | 🧪 Taylor (QA) | API testing + load testing + K8s health |

**Gate:** P1 bugs fixed. Critical paths pass all platforms. APIs handle target load.

---

## Phase 8: Ship 🚀
**Duration:** 4-8 hours · **Goal:** Deploy everything: K8s + app stores + web

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `infra-checklist.md` | 🔧 Alex (DevOps) | Production readiness is DevOps |
| 2 | `deploy-steps.md` | 🔧 Alex (DevOps) | Deployment commands are DevOps |
| 3 | `release-notes.md` | 📋 Sara (PM) | Release communication is PM work |

**Gate:** Smoke tested on real devices + production API. Monitoring clean.

---

## Phase 9: Sell 💰
**Duration:** Ongoing from launch · **Goal:** Get users + revenue

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `launch-strategy.md` | 📋 Sara (PM) | Go-to-market is PM/marketing |
| 2 | `app-store-listing.md` | 📋 Sara (PM) | ASO requires marketing expertise |
| 3 | `landing-page.md` | 🎨 Yuki (Designer) | Landing page needs design + copy |
| 4 | `pricing.md` | 📋 Sara (PM) | Pricing strategy is PM work |
| 5 | `growth-plan.md` | 📋 Sara (PM) | Growth planning is PM work |

**Gate:** Landing page + store listings live. First 10 users acquired. Feedback loop running.

---

## Phase 10: Iterate 🔄
**Duration:** Half day → back to Build · **Goal:** Learn → plan next → repeat

| # | File | Default Persona | Why This Persona |
|---|------|----------------|-----------------|
| 1 | `retro.md` | 📋 Sara (PM) | Retrospectives are PM-facilitated |
| 2 | `milestone-next.md` | 📋 Sara (PM) | Next milestone scoping is PM work |

**Gate:** Back to Phase 5. This loop IS software development.

---

## Persona Distribution Summary

| Persona | # Items | Phases |
|---------|---------|--------|
| 📋 Sara (PM) | 16 | 1, 4, 8, 9, 10 |
| 🧭 Jordan (CTO) | 5 | 2 |
| 🎨 Yuki (Designer) | 6 | 3, 9 |
| 🔧 Alex (DevOps) | 9 | 2, 4, 6, 8 |
| 🔨 Marcus (Lead Dev) | 7 | 4, 5, 6 |
| 🧪 Taylor (QA) | 2 | 7 |
| **Total** | **45** | |
