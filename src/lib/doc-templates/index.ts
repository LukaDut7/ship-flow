import type { DocType } from "@/lib/types/enums";

export const TEMPLATES: Record<DocType, string> = {
  PROJECT_BRIEF: `# Project Brief

> Define the problem space, audience, and success criteria before building.

## Problem Statement

<!-- Guiding question: What specific problem are we solving, and for whom? -->

*Describe the core problem in 2–3 sentences. Who experiences it? What is the current workaround or pain?*

## Target Audience

<!-- Guiding question: Who are the primary and secondary users? What are their goals and constraints? -->

*Define primary personas: roles, goals, technical comfort, and key motivations.*

## Constraints & Boundaries

<!-- Guiding question: What are the hard limits—budget, timeline, tech, compliance, or scope? -->

*List constraints: timeline, budget, technical stack, regulatory requirements, or out-of-scope items.*

## Success Metrics

<!-- Guiding question: How will we know this project succeeded? What numbers matter? -->

*Define measurable outcomes: adoption targets, performance KPIs, satisfaction scores, or business metrics.*

## Competitive Context

<!-- Guiding question: What alternatives exist? How do we differentiate or learn from them? -->

*Summarize competitors, alternatives, and our unique value or positioning.*`,

  USER_RESEARCH: `# User Research

> Capture insights from real users to inform product decisions.

## Interview Summary

<!-- Guiding question: Who did we talk to, and what did we learn? -->

*Summarize key interviews: participants, roles, main themes, and notable quotes.*

## Feedback Themes

<!-- Guiding question: What patterns emerged across interviews, surveys, or support tickets? -->

*Group feedback into themes: recurring requests, complaints, and praise.*

## Pain Points

<!-- Guiding question: What frustrates users most? Where do they get stuck? -->

*List top pain points with severity and frequency where known.*

## Personas

<!-- Guiding question: Who are our archetypal users? What do they need and fear? -->

*Define 2–4 personas: name, role, goals, frustrations, and key behaviors.*

## Research Gaps

<!-- Guiding question: What do we still not know? Who should we talk to next? -->

*Note unanswered questions, underrepresented segments, and follow-up research needed.*`,

  FEATURE_SPEC: `# Feature Specification

> Define what we're building and how we'll know it's done.

## Overview

<!-- Guiding question: What is this feature in one sentence? Who benefits? -->

*Brief description of the feature, its purpose, and primary users.*

## User Stories

<!-- Guiding question: What can users do? Write as "As a [role], I want [goal] so that [benefit]." -->

*List user stories in priority order. Example: As a project manager, I want to filter tasks by assignee so that I can track workload.*

## Acceptance Criteria

<!-- Guiding question: What must be true for each story to be "done"? -->

*For each story, list specific, testable criteria. Use Given/When/Then where helpful.*

## Edge Cases & Error Handling

<!-- Guiding question: What happens when things go wrong or inputs are unexpected? -->

*Document empty states, validation rules, error messages, and failure modes.*

## Priority & Dependencies

<!-- Guiding question: What must ship first? What blocks what? -->

*Order stories by priority (P0/P1/P2). Note dependencies on other features or systems.*`,

  DESIGN_SYSTEM: `# Design System

> Document visual and interaction standards for consistency and accessibility.

## Colors

<!-- Guiding question: What is our palette? What do colors communicate? -->

*Define primary, secondary, semantic (success, error, warning), and neutral colors with hex/rgb values.*

## Typography

<!-- Guiding question: What fonts and scales do we use? How do we establish hierarchy? -->

*Specify font families, sizes, weights, line heights, and heading scale.*

## Components

<!-- Guiding question: What reusable UI building blocks exist? How are they used? -->

*List core components: buttons, inputs, cards, modals, etc. with usage notes and variants.*

## Patterns

<!-- Guiding question: How do we handle common flows—navigation, forms, feedback, loading? -->

*Document interaction patterns: navigation structure, form layouts, toast/notification behavior.*

## Accessibility

<!-- Guiding question: How do we meet WCAG and support assistive tech? -->

*Note contrast ratios, focus states, keyboard nav, screen reader support, and ARIA usage.*`,

  WIREFRAME_NOTES: `# Wireframe Notes

> Capture layout and interaction decisions behind the design.

## Layout Decisions

<!-- Guiding question: Why is the page structured this way? What drove the hierarchy? -->

*Explain key layout choices: grid, spacing, content priority, and responsive behavior.*

## Interaction Patterns

<!-- Guiding question: How do users move through the flow? What triggers what? -->

*Describe clicks, hovers, transitions, and state changes. Note any non-obvious interactions.*

## UX Rationale

<!-- Guiding question: Why did we choose this approach over alternatives? -->

*Document design rationale: what we tried, what we rejected, and why.*

## Responsive Considerations

<!-- Guiding question: How does this adapt to different screen sizes? -->

*Note breakpoints, mobile-specific changes, and touch targets.*

## Open Questions

<!-- Guiding question: What design decisions are still unresolved? -->

*List items needing validation, A/B test ideas, or stakeholder input.*`,

  TECH_DECISION: `# Technical Decision Record

> Document an important technical decision, its context, and consequences (ADR format).

## Decision Title

<!-- Guiding question: What is this decision about? Use a short, descriptive name. -->

*e.g., Use PostgreSQL for primary data store*

## Context

<!-- Guiding question: What situation prompted this decision? What constraints exist? -->

*Describe the problem, requirements, and constraints that led to this decision.*

## Options Considered

<!-- Guiding question: What alternatives did we evaluate? -->

*List options with brief pros and cons. Example: Option A (PostgreSQL), Option B (MongoDB), Option C (MySQL).*

## Decision

<!-- Guiding question: What did we decide? -->

*State the chosen option clearly.*

## Rationale

<!-- Guiding question: Why did we choose this over the alternatives? -->

*Explain the reasoning: technical fit, team expertise, ecosystem, cost, or risk.*

## Consequences

<!-- Guiding question: What are the implications? What do we gain or give up? -->

*Document positive outcomes, trade-offs, and follow-up actions required.*`,

  API_CONTRACT: `# API Contract

> Define the interface between clients and services for integration and testing.

## Base URL & Versioning

<!-- Guiding question: Where is the API hosted? How do we version it? -->

*Document base URL(s), versioning strategy (path, header, or query), and environment differences.*

## Authentication

<!-- Guiding question: How do clients authenticate? What tokens or keys are required? -->

*Describe auth method: API key, OAuth, JWT, etc. Include header names and example values.*

## Endpoints

<!-- Guiding question: What operations are available? What are the routes and methods? -->

| Method | Path | Description |
|--------|------|-------------|
| *GET* | *\`/resource\`* | *List or retrieve resources* |
| *POST* | *\`/resource\`* | *Create a new resource* |
| *PUT* | *\`/resource/:id\`* | *Update a resource* |
| *DELETE* | *\`/resource/:id\`* | *Remove a resource* |

## Request & Response Schemas

<!-- Guiding question: What does each endpoint expect and return? -->

*Include example payloads, field types, required vs optional, and nested structures.*

## Error Codes

<!-- Guiding question: What errors can occur? How are they structured? -->

*Document HTTP status codes, error response format, and meaning of each code (e.g., 400 validation, 401 unauthorized, 404 not found).*`,

  DATA_MODEL: `# Data Model

> Document entities, relationships, and database design.

## Entities

<!-- Guiding question: What are the core data objects? What attributes do they have? -->

*List entities with key fields. Example: User (id, email, name, created_at), Project (id, name, owner_id, status).*

## Relationships

<!-- Guiding question: How do entities relate? One-to-one, one-to-many, many-to-many? -->

*Describe relationships: foreign keys, join tables, cardinality. Use diagrams or text.*

## Constraints

<!-- Guiding question: What rules enforce data integrity? -->

*Document unique constraints, not-null rules, check constraints, and indexes.*

## Migration Notes

<!-- Guiding question: How do we evolve the schema? What migrations exist? -->

*Note migration strategy, backward compatibility, and any data backfill requirements.*`,

  IMPLEMENTATION_NOTES: `# Implementation Notes

> Capture what was built, how, and what to watch out for.

## What Was Built

<!-- Guiding question: What did we actually ship? What's in scope? -->

*Summarize the implementation: features delivered, components added, APIs created.*

## Approach

<!-- Guiding question: How did we approach the work? What patterns or libraries did we use? -->

*Describe architecture decisions, patterns used, and key implementation choices.*

## Gotchas & Workarounds

<!-- Guiding question: What surprised us? What hacks or workarounds did we need? -->

*Document non-obvious issues, library quirks, and temporary fixes that may need revisiting.*

## TODOs & Follow-ups

<!-- Guiding question: What's left to do? What should future devs know? -->

*List known TODOs, tech debt, and recommended next steps.*`,

  ENV_SETUP: `# Environment Setup

> Get developers running locally with minimal friction.

## Prerequisites

<!-- Guiding question: What must be installed before starting? -->

*List required tools: Node version, package manager, Docker, database client, etc.*

## Local Dev Setup

<!-- Guiding question: What steps get a new dev from clone to running app? -->

*Step-by-step setup: clone, install deps, copy env file, run migrations, start services.*

## Environment Variables

<!-- Guiding question: What env vars are needed? What are safe defaults? -->

| Variable | Description | Example / Default |
|----------|-------------|-------------------|
| *\`DATABASE_URL\`* | *PostgreSQL connection string* | *\`postgres://localhost:5432/app\`* |
| *\`API_KEY\`* | *External service key* | *Required for prod* |

## Third-Party Config

<!-- Guiding question: What external services need setup? How do we configure them? -->

*Document OAuth apps, API keys, webhooks, and any sandbox or test account setup.*`,

  TEST_STRATEGY: `# Test Strategy

> Define what we test, how, and where gaps remain.

## What to Test

<!-- Guiding question: What layers and behaviors do we cover? -->

*Outline unit tests (logic, utils), integration tests (API, DB), and E2E tests (critical flows).*

## Coverage Targets

<!-- Guiding question: What coverage do we aim for? Where is it measured? -->

*Specify target percentages by layer, tools used (Jest, Vitest, Playwright), and how to run.*

## Known Gaps

<!-- Guiding question: What are we not testing? Why? -->

*Document untested areas, flaky tests, and areas deferred for later.*

## Edge Cases

<!-- Guiding question: What tricky scenarios must we cover? -->

*List edge cases: empty inputs, boundary values, concurrency, error paths, and security.*`,

  DEPLOY_CONFIG: `# Deployment Configuration

> Document how we ship to each environment and manage releases.

## Environments

<!-- Guiding question: What environments exist? What is each used for? -->

*List environments: dev, staging, prod. Include URLs, purpose, and who has access.*

## CI/CD Pipeline

<!-- Guiding question: How does code get from merge to production? -->

*Describe pipeline: build, test, deploy steps. Note triggers (push, tag, manual) and tools.*

## Secrets Management

<!-- Guiding question: How do we handle secrets? Where are they stored? -->

*Document where secrets live (env vars, vault, provider), rotation policy, and who can access.*

## Rollback Procedure

<!-- Guiding question: How do we revert a bad deploy? -->

*Step-by-step rollback: how to identify issue, revert to previous version, and verify.*`,

  LAUNCH_CHECKLIST: `# Launch Checklist

> Verify readiness before going live and know how to respond if things go wrong.

## Pre-Launch Verification

<!-- Guiding question: What must be true before we flip the switch? -->

*Checklist: smoke tests pass, monitoring configured, backups verified, DNS/SSL correct, feature flags set.*

## Monitoring & Alerts

<!-- Guiding question: How do we know if something breaks? -->

*List metrics, dashboards, alert thresholds, and on-call escalation.*

## Rollback Plan

<!-- Guiding question: If we need to revert, what do we do? -->

*Document rollback steps, decision criteria, and communication plan.*

## Post-Launch

<!-- Guiding question: What do we do in the first 24–48 hours after launch? -->

*Define watch period, success criteria, and when to declare launch stable.*`,

  ITERATION_LOG: `# Iteration Log

> Track what changed, why, and what we learned.

## What Changed

<!-- Guiding question: What did we ship in this iteration? -->

*Summarize changes: features, fixes, refactors. Link to PRs or tickets where relevant.*

## Why

<!-- Guiding question: What drove these changes? User feedback, metrics, tech debt? -->

*Explain the motivation: user request, bug fix, performance, or internal improvement.*

## Learnings

<!-- Guiding question: What did we learn? What would we do differently? -->

*Capture insights: what worked, what didn't, surprises, and process improvements.*

## Metrics Before / After

<!-- Guiding question: Did we move the needle? By how much? -->

*Compare key metrics: adoption, performance, error rate, satisfaction—before and after this iteration.*`,

  FEEDBACK_CAPTURE: `# Feedback Capture

> Collect and triage user feedback for product improvement.

## Bug Reports

<!-- Guiding question: What's broken? How do we reproduce and prioritize? -->

*Log bugs: description, steps to reproduce, severity, status. Link to tickets.*

## Feature Requests

<!-- Guiding question: What do users want that we don't have? -->

*Capture requests: source (user, support, sales), description, and initial priority assessment.*

## User Signals

<!-- Guiding question: What behavior or sentiment suggests opportunity or risk? -->

*Note churn signals, support volume spikes, NPS changes, or usage patterns.*

## Analytics

<!-- Guiding question: What does the data tell us? Where do users drop off or succeed? -->

*Summarize key analytics: funnel conversion, feature adoption, retention, and anomalies.*`,
};
