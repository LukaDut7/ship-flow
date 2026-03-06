import { test, expect } from "@playwright/test"
import {
  cleanupTestProjects,
  createProjectViaUI,
  savePromptViaUI,
} from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Prompt Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Prompt Generation", () => {
  test("can navigate to prompt generation page", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)
    await expect(
      page.getByRole("heading", { name: "Generate Prompt" })
    ).toBeVisible()
  })

  test("prompt generation page lists project documents", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)
    await expect(page.getByText("Project Brief").first()).toBeVisible()
  })

  test("can navigate to prompt history page", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts`)
    await expect(page.locator("body")).toBeVisible()
  })

  test("preview loads automatically for first document", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Preview should render content in the prose area
    const preview = page.locator(".prose").last()
    await expect(preview).not.toBeEmpty({ timeout: 15000 })

    // Char/token count should be visible
    await expect(page.getByText(/\d+ chars/)).toBeVisible()
    await expect(page.getByText(/tokens/)).toBeVisible()
  })

  test("can switch target tool format", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for initial preview
    const preview = page.locator(".prose").last()
    await expect(preview).not.toBeEmpty({ timeout: 15000 })
    const initialText = await preview.textContent()

    // Click "Cursor" tool format button
    await page.getByRole("button", { name: "Cursor" }).click()

    // Wait for preview to update
    await page.waitForTimeout(1000)
    await expect(preview).not.toBeEmpty()
  })

  test("can toggle context options", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for initial preview
    const preview = page.locator(".prose").last()
    await expect(preview).not.toBeEmpty({ timeout: 15000 })

    // Uncheck "Include tech stack"
    const techStackCheckbox = page
      .locator("label")
      .filter({ hasText: "Include tech stack" })
      .locator('input[type="checkbox"]')
    await techStackCheckbox.uncheck()

    // Wait for preview to update
    await page.waitForTimeout(1000)
    await expect(preview).not.toBeEmpty()
  })

  test("can add custom instructions", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for initial preview
    const preview = page.locator(".prose").last()
    await expect(preview).not.toBeEmpty({ timeout: 15000 })

    // Add custom instructions
    const customInstructions = "Always use TypeScript strict mode"
    await page
      .getByPlaceholder("Add custom instructions for the prompt...")
      .fill(customInstructions)

    // Wait for debounced preview update
    await page.waitForTimeout(1000)

    // Preview should include the custom instruction text
    await expect(preview).toContainText(customInstructions, { timeout: 10000 })
  })

  test("can copy prompt to clipboard", async ({ page, context }) => {
    // Grant clipboard permissions
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for preview to load
    await expect(page.locator(".prose").last()).not.toBeEmpty({
      timeout: 15000,
    })

    // Click Copy to Clipboard
    await page.getByRole("button", { name: "Copy to Clipboard" }).click()

    // Toast should appear
    await expect(page.getByText("Copied to clipboard")).toBeVisible({
      timeout: 5000,
    })
  })

  test("can save prompt to history", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for preview
    await expect(page.locator(".prose").last()).not.toBeEmpty({
      timeout: 15000,
    })

    // Click Save to History
    await page.getByRole("button", { name: "Save to History" }).click()

    // Toast should appear
    await expect(page.getByText("Saved to history")).toBeVisible({
      timeout: 5000,
    })

    // Navigate to prompt history and verify entry exists
    await page.goto(`/projects/${projectId}/prompts`)
    await expect(page.getByText("Project Brief").first()).toBeVisible({
      timeout: 10000,
    })
  })
})

test.describe("Prompt History", () => {
  test.beforeAll(async ({ browser }) => {
    // Ensure at least one prompt is saved
    const context = await browser.newContext({
      storageState: "e2e/.auth/session.json",
    })
    const page = await context.newPage()
    await savePromptViaUI(page, projectId)
    await context.close()
  })

  test("history shows saved prompts with tool badge", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts`)

    // A prompt card with the document title should be visible
    await expect(page.getByText("Project Brief").first()).toBeVisible({
      timeout: 10000,
    })

    // Tool badge should be visible (default is "Generic (Markdown)")
    await expect(
      page.getByText("Generic (Markdown)").first()
    ).toBeVisible()
  })

  test("can copy a prompt from history", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"])

    await page.goto(`/projects/${projectId}/prompts`)
    await expect(page.getByText("Project Brief").first()).toBeVisible({
      timeout: 10000,
    })

    // Click the Copy button on the first prompt card
    await page.getByRole("button", { name: "Copy" }).first().click()

    await expect(page.getByText("Copied to clipboard")).toBeVisible({
      timeout: 5000,
    })
  })

  test("can delete a prompt from history", async ({ page }) => {
    // Save another prompt first so we have one to delete
    await savePromptViaUI(page, projectId)

    await page.goto(`/projects/${projectId}/prompts`)
    await expect(page.getByText("Project Brief").first()).toBeVisible({
      timeout: 10000,
    })

    // Click Delete on the first prompt
    await page.getByRole("button", { name: "Delete" }).first().click()

    // Confirmation dialog should appear
    await expect(page.getByText("Delete prompt?")).toBeVisible()

    // Confirm delete
    await page
      .locator('[role="dialog"]')
      .getByRole("button", { name: "Delete" })
      .click()

    // Success toast
    await expect(page.getByText("Prompt deleted")).toBeVisible({
      timeout: 5000,
    })
  })
})

test.describe("Prompt Download & Templates", () => {
  test("can download prompt as markdown", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for preview
    await expect(page.locator(".prose").last()).not.toBeEmpty({
      timeout: 15000,
    })

    // Open download dropdown
    await page.getByRole("button", { name: /download/i }).click()

    // Click "Download as .md"
    const downloadPromise = page.waitForEvent("download")
    await page.getByRole("menuitem", { name: /download as \.md/i }).click()
    const download = await downloadPromise
    expect(download.suggestedFilename()).toBe("prompt.md")
  })

  test("can select a template", async ({ page }) => {
    await page.goto(`/projects/${projectId}/prompts/generate`)

    // Wait for preview
    await expect(page.locator(".prose").last()).not.toBeEmpty({
      timeout: 15000,
    })

    // Open the template select
    await page
      .locator("button")
      .filter({ hasText: "None" })
      .click()

    // Select first template
    await page
      .getByRole("option", { name: /generate feature spec/i })
      .click()

    // Custom instructions textarea should now contain template text
    await expect(
      page.getByPlaceholder("Add custom instructions for the prompt...")
    ).not.toBeEmpty({ timeout: 5000 })
  })

  test("prompt history expand/collapse", async ({ page }) => {
    // Save a prompt with content long enough to trigger expand
    await savePromptViaUI(page, projectId)

    await page.goto(`/projects/${projectId}/prompts`)
    await expect(page.getByText("Project Brief").first()).toBeVisible({
      timeout: 10000,
    })

    // If there's an Expand button, click it
    const expandBtn = page.getByRole("button", { name: /expand/i }).first()
    if (await expandBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expandBtn.click()
      // Should now show Collapse
      await expect(
        page.getByRole("button", { name: /collapse/i }).first()
      ).toBeVisible()

      // Collapse it back
      await page.getByRole("button", { name: /collapse/i }).first().click()
      await expect(expandBtn).toBeVisible()
    }
  })
})
