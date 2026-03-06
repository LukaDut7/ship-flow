import { test, expect } from "@playwright/test"
import {
  cleanupTestProjects,
  createProjectViaUI,
  createBundleViaUI,
} from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Bundle Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Context Bundles", () => {
  test("can navigate to bundles page", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles`)
    await expect(page.locator("body")).toBeVisible()
  })

  test("can navigate to new bundle form", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/new`)
    await expect(
      page.getByRole("heading", { name: "New Bundle" })
    ).toBeVisible()
    // The bundle form (not the signout form)
    await expect(
      page.locator("form").filter({ hasText: /name/i })
    ).toBeVisible()
  })

  test("doc picker shows phase headings and selection count", async ({
    page,
  }) => {
    await page.goto(`/projects/${projectId}/bundles/new`)

    // Phase heading visible
    await expect(page.getByText("Ideation").first()).toBeVisible()

    // Initial count shows 0
    await expect(page.getByText("0 documents selected")).toBeVisible()

    // Check a document
    const projectBriefCheckbox = page
      .locator("label")
      .filter({ hasText: "Project Brief" })
      .locator('input[type="checkbox"]')
    await projectBriefCheckbox.check()

    // Count updates
    await expect(page.getByText("1 document selected")).toBeVisible()
  })

  test("can create a bundle with selected documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/new`)

    // Fill name
    await page.getByLabel("Name (required)").fill("Test Bundle")

    // Select a document
    const projectBriefCheckbox = page
      .locator("label")
      .filter({ hasText: "Project Brief" })
      .locator('input[type="checkbox"]')
    await projectBriefCheckbox.check()

    // Submit
    await page.getByRole("button", { name: /create bundle/i }).click()

    // Should redirect to bundle detail page
    await page.waitForURL(/\/bundles\/(?!new)/, { timeout: 15000 })

    // Bundle name should be visible on the detail page
    await expect(
      page.getByRole("heading", { name: "Test Bundle" })
    ).toBeVisible()
  })
})

test.describe("Bundle Detail", () => {
  let bundleId: string

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/session.json",
    })
    const page = await context.newPage()
    bundleId = await createBundleViaUI(page, projectId, "Detail Bundle", [
      "Project Brief",
    ])
    await context.close()
  })

  test("bundle detail shows included documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/${bundleId}`)

    await expect(page.getByText("Included documents")).toBeVisible()
    await expect(page.getByText("Project Brief").first()).toBeVisible()
  })

  test("Generate Prompt from Bundle button links correctly", async ({
    page,
  }) => {
    await page.goto(`/projects/${projectId}/bundles/${bundleId}`)

    const generateLink = page.getByRole("link", {
      name: /generate prompt from bundle/i,
    })
    await expect(generateLink).toBeVisible()
    await expect(generateLink).toHaveAttribute(
      "href",
      new RegExp(`bundleId=${bundleId}`)
    )
  })

  test("can edit bundle name", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/${bundleId}`)

    // The Edit Bundle section has a BundleForm
    await expect(page.getByText("Edit Bundle")).toBeVisible()

    // Update name
    const nameInput = page.getByLabel("Name (required)")
    await nameInput.clear()
    await nameInput.fill("Updated Detail Bundle")

    await page.getByRole("button", { name: /update bundle/i }).click()

    // Wait for navigation/reload and verify name persists
    await page.waitForTimeout(1000)
    await page.goto(`/projects/${projectId}/bundles/${bundleId}`)
    await expect(
      page.getByRole("heading", { name: "Updated Detail Bundle" })
    ).toBeVisible()
  })

  test("can delete bundle with confirmation", async ({ page }) => {
    // Create a throwaway bundle to delete
    const tempBundleId = await createBundleViaUI(
      page,
      projectId,
      "Bundle To Delete",
      ["Project Brief"]
    )

    await page.goto(`/projects/${projectId}/bundles/${tempBundleId}`)

    // Click Delete Bundle
    await page.getByRole("button", { name: /delete bundle/i }).click()

    // Confirmation dialog should appear
    await expect(
      page.getByRole("heading", { name: "Delete Bundle" })
    ).toBeVisible()

    // Confirm delete
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: "Delete" })
      .click()

    // Should redirect to bundles list
    await page.waitForURL(/\/bundles$/, { timeout: 15000 })
  })

  test("can export bundle as markdown", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/${bundleId}`)

    // Click the Export Bundle button
    await page.getByRole("button", { name: /export bundle/i }).click()

    // Toast should appear
    await expect(page.getByText(/exported/i).first()).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe("Bundle Doc Picker & Empty State", () => {
  test("Select All selects all docs in a phase", async ({ page }) => {
    await page.goto(`/projects/${projectId}/bundles/new`)

    // Initial count shows 0
    await expect(page.getByText("0 documents selected")).toBeVisible()

    // Click "Select All" for the Ideation phase
    await page
      .getByRole("button", { name: "Select All" })
      .first()
      .click()

    // Count should increase (at least 1 doc in Ideation phase)
    await expect(page.getByText("0 documents selected")).not.toBeVisible({
      timeout: 5000,
    })
  })

  test("bundles list shows empty state", async ({ page }) => {
    // We need a project with no bundles - delete all existing bundles first
    // Actually, just check that the empty state text exists on the bundles page component
    // Since we created bundles above, let's create a fresh project
    const freshProjectId = await createProjectViaUI(
      page,
      "Empty Bundle Project"
    )
    await page.goto(`/projects/${freshProjectId}/bundles`)

    await expect(page.getByText("No context bundles yet")).toBeVisible({
      timeout: 10000,
    })
    await expect(
      page.getByRole("link", { name: "Create your first bundle" })
    ).toBeVisible()
  })
})
