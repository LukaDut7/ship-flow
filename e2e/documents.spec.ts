import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI, getDocUrl } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Doc Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Document Management", () => {
  test("project creates default template documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await expect(
      page.getByRole("heading", { name: "Project Brief" }).first()
    ).toBeVisible()
  })

  test("can open a document for editing", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    await expect(page.getByRole("tab", { name: "Edit" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Preview" })).toBeVisible()
    await expect(page.getByRole("tab", { name: "Split" })).toBeVisible()
  })

  test("editor shows word count", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    await expect(page.getByText(/\d+ words/).first()).toBeVisible()
  })

  test("can edit document content and see auto-save", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    await page.getByRole("tab", { name: "Edit" }).click()

    const textarea = page.locator("textarea").first()
    await textarea.click()
    await textarea.fill("# My Test Project\n\nThis is an E2E test document.")

    await expect(page.getByText(/saving|saved/i).first()).toBeVisible({
      timeout: 5000,
    })
  })

  test("can navigate to create new document page", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs/new`)

    await expect(page.locator("#docType")).toBeVisible()
    await expect(
      page.getByRole("button", { name: /create document/i })
    ).toBeVisible()
  })

  test("can create a new document", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs/new`)

    await page.locator("#docType").selectOption("FEATURE_SPEC")
    await page.getByRole("button", { name: /create document/i }).click()

    await page.waitForURL(/\/docs\/(?!new)/, { timeout: 15000 })
    await expect(page.getByRole("tab", { name: "Edit" })).toBeVisible()
  })

  test("editor tabs switch between edit and preview modes", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    // Switch to preview
    await page.getByRole("tab", { name: "Preview" }).click()
    await expect(page.locator(".prose")).toBeVisible()

    // Switch to edit
    await page.getByRole("tab", { name: "Edit" }).click()
    await expect(page.locator("textarea").first()).toBeVisible()

    // Switch to split
    await page.getByRole("tab", { name: "Split" }).click()
    await expect(page.locator("textarea").first()).toBeVisible()
    await expect(page.locator(".prose")).toBeVisible()
  })
})

test.describe("Document Linking", () => {
  let docUrl: string

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/session.json",
    })
    const page = await context.newPage()

    // Create a second document so we have something to link to
    await page.goto(`/projects/${projectId}/docs/new`)
    await page.locator("#docType").selectOption("FEATURE_SPEC")
    await page.getByRole("button", { name: /create document/i }).click()
    await page.waitForURL(/\/docs\/(?!new)/, { timeout: 15000 })

    // Navigate to the Project Brief document for link tests
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)
    docUrl = page.url()

    await context.close()
  })

  test("document page shows link manager", async ({ page }) => {
    await page.goto(docUrl)

    // Link manager section should be visible
    await expect(page.getByText("Document Links")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "Add Link" })
    ).toBeVisible()
    await expect(page.getByText("No outgoing links")).toBeVisible()
  })

  test("can add a document link", async ({ page }) => {
    await page.goto(docUrl)

    // Click Add Link
    await page.getByRole("button", { name: "Add Link" }).click()

    // Dialog should open
    await expect(page.getByText("Add Document Link")).toBeVisible()

    // Select a document from the dropdown
    await page.locator('[role="dialog"]').getByRole("combobox").first().click()
    // Pick the first available document option
    await page.getByRole("option").first().click()

    // Click Add Link in the dialog footer
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: "Add Link" })
      .click()

    // Dialog should close and a link badge should appear
    await expect(page.getByText("No outgoing links")).not.toBeVisible({
      timeout: 5000,
    })
  })

  test("can remove a document link", async ({ page }) => {
    await page.goto(docUrl)

    // If no link exists yet, add one first
    const noLinks = page.getByText("No outgoing links")
    if (await noLinks.isVisible().catch(() => false)) {
      await page.getByRole("button", { name: "Add Link" }).click()
      await page
        .locator('[role="dialog"]')
        .getByRole("combobox")
        .first()
        .click()
      await page.getByRole("option").first().click()
      await page
        .locator('[role="dialog"]')
        .getByRole("button", { name: "Add Link" })
        .click()
      await expect(noLinks).not.toBeVisible({ timeout: 5000 })
    }

    // Click the remove button on the link badge
    await page.getByLabel("Remove link").first().click()

    // Should show "No outgoing links" again
    await expect(page.getByText("No outgoing links")).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe("Docs List Page", () => {
  test("docs list shows All tab with documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs`)
    await expect(page.getByRole("tab", { name: "All" })).toBeVisible()
    // Default template docs should be visible
    await expect(page.getByText("Project Brief").first()).toBeVisible()
  })

  test("docs list can filter by phase tab", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs`)
    await page.getByRole("tab", { name: "Ideation" }).click()
    await expect(page.getByText("Project Brief").first()).toBeVisible()
  })

  test("docs list New Document button navigates", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs`)
    await page.getByRole("link", { name: "New Document" }).click()
    await page.waitForURL(/\/docs\/new/, { timeout: 10000 })
  })

  test("docs list shows doc cards with badges", async ({ page }) => {
    await page.goto(`/projects/${projectId}/docs`)
    // Phase badge on the card
    await expect(page.getByText("Ideation").first()).toBeVisible()
    // Doc type badge
    await expect(page.getByText("Project Brief").first()).toBeVisible()
  })
})

test.describe("Document Title & Generate", () => {
  let detailDocUrl: string

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext({
      storageState: "e2e/.auth/session.json",
    })
    const page = await context.newPage()
    detailDocUrl = await getDocUrl(page, projectId)
    await context.close()
  })

  test("can update document title", async ({ page }) => {
    await page.goto(detailDocUrl)

    const titleInput = page.getByPlaceholder("Document title")
    await titleInput.clear()
    await titleInput.fill("Renamed Brief")
    await titleInput.blur()

    // Wait for server action to complete
    await page.waitForTimeout(1000)

    // Reload and verify persisted
    await page.reload()
    await expect(page.getByPlaceholder("Document title")).toHaveValue(
      "Renamed Brief"
    )

    // Restore original title
    const restore = page.getByPlaceholder("Document title")
    await restore.clear()
    await restore.fill("Project Brief")
    await restore.blur()
    await page.waitForTimeout(1000)
  })

  test("can generate prompt from document page", async ({ page }) => {
    await page.goto(detailDocUrl)

    await page
      .getByRole("link", { name: /generate prompt/i })
      .click()
    await page.waitForURL(/\/prompts\/generate\?docId=/, { timeout: 10000 })
  })
})

test.describe("Document Delete & Export", () => {
  test("can delete a document", async ({ page }) => {
    // Create a throwaway document to delete
    await page.goto(`/projects/${projectId}/docs/new`)
    await page.locator("#docType").selectOption("FEATURE_SPEC")
    await page.getByRole("button", { name: /create document/i }).click()
    await page.waitForURL(/\/docs\/(?!new)/, { timeout: 15000 })

    // Click delete button on doc page
    await page.getByRole("button", { name: /delete/i }).click()

    // Confirmation dialog should appear
    await expect(
      page.locator('[role="dialog"]').getByText(/delete/i).first()
    ).toBeVisible()

    // Confirm delete
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: /delete/i })
      .click()

    // Should redirect to project overview
    await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 15000 })
  })

  test("can export a single document", async ({ page }) => {
    // Navigate to an existing document
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    // Click export button
    await page.getByRole("button", { name: /export/i }).click()

    // Should show success toast
    await expect(page.getByText(/exported/i).first()).toBeVisible({
      timeout: 5000,
    })
  })
})
