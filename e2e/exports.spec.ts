import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Export Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Export Functionality", () => {
  test("export dropdown shows three options", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)

    // Click the Export button
    await page.getByRole("button", { name: /export/i }).click()

    // Three menu items should be visible
    await expect(
      page.getByRole("menuitem", { name: /export as zip/i })
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /export as .cursorrules/i })
    ).toBeVisible()
    await expect(
      page.getByRole("menuitem", { name: /export for claude projects/i })
    ).toBeVisible()
  })

  test("can export as ZIP", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)

    await page.getByRole("button", { name: /export/i }).click()
    await page.getByRole("menuitem", { name: /export as zip/i }).click()

    await expect(page.getByText("Project exported as ZIP")).toBeVisible({
      timeout: 10000,
    })
  })

  test("can export as .cursorrules", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)

    await page.getByRole("button", { name: /export/i }).click()
    await page
      .getByRole("menuitem", { name: /export as .cursorrules/i })
      .click()

    await expect(page.getByText("Exported as .cursorrules")).toBeVisible({
      timeout: 10000,
    })
  })

  test("can export for Claude Projects", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)

    await page.getByRole("button", { name: /export/i }).click()
    await page
      .getByRole("menuitem", { name: /export for claude projects/i })
      .click()

    await expect(
      page.getByText("Exported for Claude Projects")
    ).toBeVisible({ timeout: 10000 })
  })
})
