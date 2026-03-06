import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Empty States Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Empty States", () => {
  test("empty prompt history shows message", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts`)
    await expect(
      page.getByText("No prompts generated yet")
    ).toBeVisible({ timeout: 10000 })
  })
})
