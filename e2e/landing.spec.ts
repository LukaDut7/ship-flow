import { test, expect } from "@playwright/test"

test.describe("Landing Page", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("renders hero section with branding", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("h1")).toContainText("project brain")
    await expect(page.locator("header")).toContainText("ShipFlow")
  })

  test("shows feature cards", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: "Lifecycle-Organized Docs" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Context-Rich Prompts" })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Tool-Agnostic" })
    ).toBeVisible()
  })

  test("shows how-it-works steps", async ({ page }) => {
    await page.goto("/")
    await expect(
      page.getByRole("heading", { name: "Organize", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Generate", exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("heading", { name: "Ship", exact: true })
    ).toBeVisible()
  })

  test("sign in button links to login", async ({ page }) => {
    await page.goto("/")
    const signInLink = page.getByRole("link", { name: /sign in/i })
    await expect(signInLink).toHaveAttribute("href", "/login")
  })

  test("get started button links to login", async ({ page }) => {
    await page.goto("/")
    const ctaLinks = page.getByRole("link", { name: /get started free/i })
    await expect(ctaLinks.first()).toHaveAttribute("href", "/login")
  })
})
