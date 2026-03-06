import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

test.beforeAll(async () => {
  await cleanupTestProjects()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Dashboard", () => {
  test("shows empty state when no projects", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(
      page.locator("main").getByText("No projects yet")
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.locator("main").getByRole("link", { name: "Create Project" })
    ).toBeVisible()
  })

  test("shows project cards after creation", async ({ page }) => {
    await createProjectViaUI(page, "Dashboard Card Project")
    await page.goto("/dashboard")
    await expect(
      page.locator("main").getByText("Dashboard Card Project")
    ).toBeVisible({ timeout: 10000 })
    // ProjectCard shows doc count badge
    await expect(
      page.locator("main").getByText(/\d+ docs/).first()
    ).toBeVisible()
  })

  test("project card navigates to project overview", async ({ page }) => {
    await page.goto("/dashboard")
    await page
      .locator("main")
      .getByText("Dashboard Card Project")
      .click()
    await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 10000 })
    await expect(
      page.getByText("Dashboard Card Project").first()
    ).toBeVisible()
  })

  test("New Project button navigates to form", async ({ page }) => {
    await page.goto("/dashboard")
    await page
      .locator("main")
      .getByRole("link", { name: "New Project" })
      .click()
    await page.waitForURL(/\/projects\/new/, { timeout: 10000 })
    await expect(page.getByLabel("Name")).toBeVisible()
  })
})
