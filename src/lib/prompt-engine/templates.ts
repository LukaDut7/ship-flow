import type { PromptTemplateConfig } from "@/types"

export const BUILT_IN_TEMPLATES: PromptTemplateConfig[] = [
  {
    id: "generate-feature-spec-from-brief",
    name: "Generate Feature Spec from Project Brief",
    description:
      "Create a detailed feature specification from your project brief and user research.",
    phase: "PLANNING",
    requiredDocTypes: ["PROJECT_BRIEF"],
    suggestedDocTypes: ["USER_RESEARCH"],
    instructionTemplate:
      "Based on the project brief above, generate a detailed feature specification. Include user stories, acceptance criteria, edge cases, and priority levels.",
  },
  {
    id: "create-api-contract-from-spec",
    name: "Create API Contract from Feature Spec",
    description:
      "Design a complete API contract from your feature spec and architecture decisions.",
    phase: "ARCHITECTURE",
    requiredDocTypes: ["FEATURE_SPEC"],
    suggestedDocTypes: ["TECH_DECISION", "DATA_MODEL"],
    instructionTemplate:
      "Based on the feature spec and related context, design a complete API contract. Define endpoints, HTTP methods, request/response schemas, authentication requirements, and error handling.",
  },
  {
    id: "write-implementation-plan",
    name: "Write Implementation Plan from Spec + ADRs",
    description:
      "Create a step-by-step implementation plan from feature spec and architecture decisions.",
    phase: "DEVELOPMENT",
    requiredDocTypes: ["FEATURE_SPEC"],
    suggestedDocTypes: ["TECH_DECISION", "API_CONTRACT"],
    instructionTemplate:
      "Based on the feature spec and architecture decisions, create a step-by-step implementation plan. Include which files to create/modify, key functions to implement, data flow, and potential gotchas.",
  },
  {
    id: "generate-tests-from-spec",
    name: "Generate Tests from Spec + Implementation",
    description:
      "Generate comprehensive test cases from implementation notes and feature spec.",
    phase: "TESTING",
    requiredDocTypes: ["IMPLEMENTATION_NOTES"],
    suggestedDocTypes: ["FEATURE_SPEC", "TEST_STRATEGY"],
    instructionTemplate:
      "Based on the implementation notes and feature spec, generate comprehensive test cases. Include unit tests, integration tests, edge case coverage, and any mocking requirements.",
  },
  {
    id: "create-deploy-checklist",
    name: "Create Deploy Checklist from Infra Config",
    description:
      "Generate a complete deployment checklist from deployment configuration.",
    phase: "SHIPPING",
    requiredDocTypes: ["DEPLOY_CONFIG"],
    suggestedDocTypes: ["ENV_SETUP", "LAUNCH_CHECKLIST"],
    instructionTemplate:
      "Based on the deployment configuration, generate a complete deployment checklist. Include pre-deployment verification, deployment steps, post-deployment validation, monitoring setup, and rollback procedures.",
  },
  {
    id: "analyze-feedback-suggest-iterations",
    name: "Analyze Feedback and Suggest Iterations",
    description:
      "Analyze user feedback and suggest specific iteration tasks with success criteria.",
    phase: "ITERATION",
    requiredDocTypes: ["FEEDBACK_CAPTURE"],
    suggestedDocTypes: ["FEATURE_SPEC", "ITERATION_LOG"],
    instructionTemplate:
      "Analyze the user feedback captured above. Identify patterns, prioritize issues by impact and frequency, and suggest specific iteration tasks with clear success criteria.",
  },
]
