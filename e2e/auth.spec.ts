import { test, expect } from "@playwright/test"

test.describe("Authentication", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("login page renders with OAuth providers", async ({ page }) => {
    await page.goto("/login")
    await expect(page.getByText("Welcome to ShipFlow")).toBeVisible({
      timeout: 10000,
    })
    await expect(page.getByText("Continue with GitHub")).toBeVisible()
    await expect(page.getByText("Continue with Google")).toBeVisible()
  })

  test("unauthenticated user is redirected to login from dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await page.waitForURL("**/login**")
  })

  test("unauthenticated user is redirected to login from projects", async ({ page }) => {
    await page.goto("/projects/new")
    await page.waitForURL("**/login**")
  })
})

test.describe("Authenticated Session", () => {
  test("dashboard is accessible when logged in", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(
      page.getByRole("heading", { name: "Dashboard" })
    ).toBeVisible()
  })
})
