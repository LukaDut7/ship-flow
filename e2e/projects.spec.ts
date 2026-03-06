import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

test.beforeAll(async () => {
  await cleanupTestProjects()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Project Management", () => {
  test("can navigate to new project page", async ({ page }) => {
    await page.goto("/dashboard")
    await page.getByRole("link", { name: /new project/i }).first().click()
    await page.waitForURL("**/projects/new")
    await expect(
      page.getByRole("heading", { name: "New Project" })
    ).toBeVisible()
  })

  test("new project form has required fields", async ({ page }) => {
    await page.goto("/projects/new")
    await expect(page.getByLabel("Name")).toBeVisible()
    await expect(page.getByLabel("Description")).toBeVisible()
    await expect(page.getByText("Tech Stack")).toBeVisible()
    await expect(page.getByText("Project Template")).toBeVisible()
  })

  test("can create a project and see it on dashboard", async ({ page }) => {
    const projectId = await createProjectViaUI(page, "E2E Test Project")
    expect(projectId).toBeTruthy()

    // The project name appears in the header
    await expect(
      page.getByRole("heading", { name: "E2E Test Project" })
    ).toBeVisible()

    // Verify phase cards are shown
    await expect(page.getByText("Ideation").first()).toBeVisible()
    await expect(page.getByText("Planning").first()).toBeVisible()

    // Verify project shows on dashboard
    await page.goto("/dashboard")
    await expect(page.getByText("E2E Test Project").first()).toBeVisible()
  })
})

test.describe("Project Templates", () => {
  test("template options displayed", async ({ page }) => {
    await page.goto("/projects/new")

    // Wait for the form to load
    await expect(page.getByText("Project Template")).toBeVisible({
      timeout: 10000,
    })

    // All template options should be visible as buttons
    await expect(
      page.getByRole("button", { name: /Blank Project/ })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /SaaS Web App/ })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /REST API Service/ })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Mobile App/ })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /Chrome Extension/ })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: /CLI Tool/ })
    ).toBeVisible()
  })

  test("selecting template pre-fills tech stack", async ({ page }) => {
    await page.goto("/projects/new")

    // Click "SaaS Web App" template
    await page
      .locator("button")
      .filter({ hasText: "SaaS Web App" })
      .click()

    // Tech stack badges should appear (from SaaS Web App defaults)
    await expect(page.getByText("Next.js").first()).toBeVisible()
    await expect(page.getByText("React").first()).toBeVisible()
    await expect(page.getByText("TypeScript").first()).toBeVisible()
    await expect(page.getByText("PostgreSQL").first()).toBeVisible()
  })
})
