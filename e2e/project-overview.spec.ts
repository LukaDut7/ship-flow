import { test, expect } from "@playwright/test"
import { cleanupTestProjects, createProjectViaUI } from "./fixtures"

let projectId: string

test.beforeAll(async ({ browser }) => {
  await cleanupTestProjects()

  const context = await browser.newContext({
    storageState: "e2e/.auth/session.json",
  })
  const page = await context.newPage()
  projectId = await createProjectViaUI(page, "Overview Test Project")
  await context.close()
})

test.afterAll(async () => {
  await cleanupTestProjects()
})

test.describe("Project Overview", () => {
  test("shows project name and description", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    await expect(
      page.getByText("Overview Test Project").first()
    ).toBeVisible()
  })

  test("shows phase progress cards", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    // 8 phase cards should be visible in main content, each with "X/Y docs"
    const main = page.locator("main")
    await expect(main.getByText("Ideation").first()).toBeVisible()
    await expect(main.getByText("Planning").first()).toBeVisible()
    await expect(main.getByText("Design").first()).toBeVisible()
    await expect(main.getByText("Architecture").first()).toBeVisible()
    await expect(main.getByText("Development").first()).toBeVisible()
    await expect(main.getByText("Testing").first()).toBeVisible()
    await expect(main.getByText("Shipping").first()).toBeVisible()
    await expect(main.getByText("Iteration").first()).toBeVisible()
  })

  test("phase card links to filtered docs", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    // Phase cards are links — click the one containing "Ideation" and "docs"
    await page
      .locator("main")
      .getByRole("link", { name: /Ideation.*docs/i })
      .click()
    await page.waitForURL(/\/docs\?phase=IDEATION/, { timeout: 10000 })
  })

  test("shows quick links", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    await expect(
      page.locator("main").getByText("Prompt History")
    ).toBeVisible()
    await expect(
      page.locator("main").getByText("Context Bundles")
    ).toBeVisible()
  })

  test("Help Me Write button navigates", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    await page
      .locator("main")
      .getByRole("link", { name: /help me write/i })
      .click()
    await page.waitForURL(/\/prompts\/generate/, { timeout: 10000 })
  })

  test("Settings button navigates", async ({ page }) => {
    await page.goto(`/projects/${projectId}`)
    const settingsLink = page.locator(
      `main a[href="/projects/${projectId}/settings"]`
    )
    await settingsLink.click()
    await page.waitForURL(/\/settings/, { timeout: 10000 })
  })

  test("shows suggested next steps for empty brief", async ({ page }) => {
    // Clear the Project Brief content so quickActions triggers
    await page.goto(`/projects/${projectId}/docs?phase=IDEATION`)
    await page.getByText("Project Brief").first().click()
    await page.waitForURL(/\/docs\/(?!new)/)

    // Clear content
    await page.getByRole("tab", { name: "Edit" }).click()
    const textarea = page.locator("textarea").first()
    await textarea.click()
    await textarea.fill("")
    await expect(page.getByText(/saving|saved/i).first()).toBeVisible({
      timeout: 5000,
    })
    await page.waitForTimeout(1500)

    // Now visit project overview
    await page.goto(`/projects/${projectId}`)
    await expect(
      page.locator("main").getByText("Suggested Next Steps")
    ).toBeVisible({ timeout: 10000 })
    await expect(
      page.locator("main").getByText("Start by describing your project")
    ).toBeVisible()
  })
})
