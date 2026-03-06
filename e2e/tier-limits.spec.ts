import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

test.beforeAll(async () => {
  await cleanupTestProjects()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Tier Limits", () => {
  test("blocked after 3 projects on free tier", async ({ page }) => {
    // Create 3 projects (the free tier limit)
    await createProjectViaUI(page, "Tier Limit Project 1")
    await createProjectViaUI(page, "Tier Limit Project 2")
    await createProjectViaUI(page, "Tier Limit Project 3")

    // Try to create a 4th project
    await page.goto("/projects/new")
    await page.getByLabel("Name").fill("Tier Limit Project 4")
    await page.getByRole("button", { name: /create project/i }).click()

    // Should see an error about the project limit
    await expect(
      page.getByText(/project limit|upgrade to pro/i).first()
    ).toBeVisible({ timeout: 10000 })
  })
})
