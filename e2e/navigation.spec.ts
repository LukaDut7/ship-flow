import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Nav Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("App Sidebar Navigation", () => {
  test("app sidebar shows dashboard link", async ({ page }) => {
    await page.goto("/dashboard")
    // The sidebar contains a Dashboard link (outside of main)
    await expect(
      page.getByRole("link", { name: "Dashboard" })
    ).toBeVisible({ timeout: 10000 })
  })

  test("app sidebar shows project after creation", async ({ page }) => {
    await page.goto("/dashboard")
    // The sidebar lists the project as a link (exact match to avoid main content card)
    await expect(
      page.getByRole("link", { name: "Nav Test Project", exact: true })
    ).toBeVisible({ timeout: 10000 })
  })

  test("app sidebar navigates to project", async ({ page }) => {
    await page.goto("/dashboard")
    await page
      .getByRole("link", { name: "Nav Test Project", exact: true })
      .click()
    await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 10000 })
  })
})

test.describe("Project Sidebar", () => {
  test("project sidebar shows documents grouped by phase", async ({
    page,
  }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    // Project sidebar (complementary role) should show phase headers
    const sidebar = page.locator("aside")
    await expect(sidebar.getByText("Ideation").first()).toBeVisible({
      timeout: 10000,
    })
    // Should show doc links
    await expect(sidebar.getByText("Project Brief").first()).toBeVisible()
  })

  test("project sidebar search filters documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    const sidebar = page.locator("aside")

    // Type in the search input
    const searchInput = page.getByPlaceholder("Search documents...")
    await searchInput.fill("Brief")

    // Project Brief should still be visible in the sidebar
    await expect(sidebar.getByText("Project Brief").first()).toBeVisible()

    // Search for something that doesn't exist
    await searchInput.clear()
    await searchInput.fill("xyznonexistent")

    // Wait for filter
    await page.waitForTimeout(300)

    // Project Brief should no longer be visible in the sidebar doc list
    await expect(
      sidebar.getByRole("link", { name: "Project Brief" })
    ).not.toBeVisible({ timeout: 3000 })
  })
})
