import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Settings Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Project Settings", () => {
  test("can navigate to project settings", async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await expect(page.getByLabel("Name")).toBeVisible()
    await expect(page.getByLabel("Description")).toBeVisible()
  })

  test("settings page shows danger zone", async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    await expect(page.getByText(/danger zone/i)).toBeVisible()
  })

  test("can update project name", async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)
    const nameInput = page.getByLabel("Name")
    await nameInput.clear()
    await nameInput.fill("Updated Settings Project")
    await page.getByRole("button", { name: /save/i }).first().click()

    // Verify the update persisted
    await page.waitForTimeout(1000)
    await page.goto(`/projects/${projectId}/settings`)
    await expect(page.getByLabel("Name")).toHaveValue(
      "Updated Settings Project"
    )
  })

  test("can update project description", async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)

    const descInput = page.getByLabel("Description")
    await descInput.clear()
    await descInput.fill("Updated description for E2E test")
    await page.getByRole("button", { name: /save/i }).first().click()

    // Verify the update persisted
    await page.waitForTimeout(1000)
    await page.goto(`/projects/${projectId}/settings`)
    await expect(page.getByLabel("Description")).toHaveValue(
      "Updated description for E2E test"
    )
  })

  test("can archive project", async ({ page }) => {
    // Create a temporary project to archive
    const tempProjectId = await createProjectViaUI(
      page,
      "Project To Archive"
    )

    await page.goto(`/projects/${tempProjectId}/settings`)

    // Click Archive Project
    await page.getByRole("button", { name: /archive project/i }).click()

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Archived project should not be visible on dashboard
    await expect(page.getByText("Project To Archive")).not.toBeVisible({
      timeout: 5000,
    })
  })

  test("can edit tech stack in settings", async ({ page }) => {
    await page.goto(`/projects/${projectId}/settings`)

    // Type a tech into the tech stack input
    const techInput = page.getByPlaceholder("Add tech...")
    await techInput.fill("React")
    await techInput.press("Enter")

    // Badge should appear
    await expect(page.getByText("React").first()).toBeVisible()

    // Save settings
    await page.getByRole("button", { name: /save/i }).first().click()
    await page.waitForTimeout(1000)

    // Reload and verify persisted
    await page.goto(`/projects/${projectId}/settings`)
    await expect(page.getByText("React").first()).toBeVisible()

    // Remove the tech
    await page.getByLabel("Remove React").click()
    await page.getByRole("button", { name: /save/i }).first().click()
  })

  test("can delete project with confirmation", async ({ page }) => {
    // Create a temporary project to delete
    const tempProjectId = await createProjectViaUI(
      page,
      "Project To Delete"
    )

    await page.goto(`/projects/${tempProjectId}/settings`)

    // Click Delete Project
    await page.getByRole("button", { name: /delete project/i }).first().click()

    // Confirmation dialog should appear
    await expect(
      page.getByRole("heading", { name: "Delete Project" })
    ).toBeVisible()
    await expect(
      page.getByText("This will permanently delete the project")
    ).toBeVisible()

    // Confirm delete (click the Delete Project button inside the dialog)
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: /delete project/i })
      .click()

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 15000 })

    // Deleted project should not be visible
    await expect(page.getByText("Project To Delete")).not.toBeVisible({
      timeout: 5000,
    })
  })
})
