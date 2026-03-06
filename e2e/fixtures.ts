import { test as base, expect, type Page } from "@playwright/test"
import { Client } from "pg"

const DB_URL =
  process.env.DATABASE_URL ||
  "postgresql://shipflow:shipflow@localhost:5434/shipflow"

export async function cleanupTestProjects() {
  const client = new Client({ connectionString: DB_URL })
  await client.connect()
  try {
    await client.query(
      `DELETE FROM "Project" WHERE "userId" IN (SELECT id FROM "User" WHERE email = 'e2e@shipflow.test')`
    )
  } finally {
    await client.end()
  }
}

/** Create a project via the UI and return the project ID */
export async function createProjectViaUI(
  page: Page,
  name: string
): Promise<string> {
  await page.goto("/projects/new")

  // Retry once if page has a chunk load error (transient dev server issue)
  const nameInput = page.getByLabel("Name")
  if (!(await nameInput.isVisible({ timeout: 5000 }).catch(() => false))) {
    await page.reload()
    await nameInput.waitFor({ state: "visible", timeout: 10000 })
  }

  await nameInput.fill(name)
  await page.getByRole("button", { name: /create project/i }).click()

  // Wait for redirect to a real project page (not /projects/new)
  await page.waitForURL(/\/projects\/(?!new)[^/]+/, { timeout: 30000 })
  const match = page.url().match(/\/projects\/([^/]+)/)
  return match?.[1] || ""
}

/** Create a bundle via the UI and return the bundle ID */
export async function createBundleViaUI(
  page: Page,
  projectId: string,
  name: string,
  docLabels: string[] = []
): Promise<string> {
  await page.goto(`/projects/${projectId}/bundles/new`)
  await page.getByLabel("Name (required)").fill(name)

  for (const label of docLabels) {
    const checkbox = page
      .locator("label")
      .filter({ hasText: label })
      .locator('input[type="checkbox"]')
    await checkbox.check()
  }

  await page.getByRole("button", { name: /create bundle/i }).click()

  // Wait for redirect to bundle detail
  await page.waitForURL(/\/bundles\/(?!new)[^/]+/, { timeout: 30000 })
  const match = page.url().match(/\/bundles\/([^/]+)/)
  return match?.[1] || ""
}

/** Save a prompt to history via the UI */
export async function savePromptViaUI(
  page: Page,
  projectId: string
): Promise<void> {
  await page.goto(`/projects/${projectId}/prompts/generate`)

  // Wait for preview to load (the prose area should have content)
  await expect(page.locator(".prose").last()).not.toBeEmpty({ timeout: 15000 })

  await page.getByRole("button", { name: "Save to History" }).click()
  await expect(page.getByText("Saved to history")).toBeVisible({ timeout: 5000 })
}

/** Navigate to docs list, click first doc, return its URL */
export async function getDocUrl(
  page: Page,
  projectId: string
): Promise<string> {
  await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
  await page.getByText("Project Brief").first().click()
  await page.waitForURL(/\/docs\/(?!new)/)
  return page.url()
}

export { base as test, expect }
