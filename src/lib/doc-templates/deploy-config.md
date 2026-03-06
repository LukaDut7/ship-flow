# Deployment Configuration

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

*Step-by-step rollback: how to identify issue, revert to previous version, and verify.*
