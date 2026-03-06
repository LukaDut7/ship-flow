import { test as setup, expect } from "@playwright/test"
import { randomUUID } from "crypto"
import { Client } from "pg"

const AUTH_FILE = "e2e/.auth/session.json"
const TEST_EMAIL = "e2e@shipflow.test"
const SESSION_TOKEN = `e2e-test-session-${randomUUID()}`

setup("authenticate", async ({ page }) => {
  // Seed user and session directly in the database
  const client = new Client({
    connectionString:
      process.env.DATABASE_URL ||
      "postgresql://shipflow:shipflow@localhost:5434/shipflow",
  })
  await client.connect()

  try {
    // Upsert test user
    const userResult = await client.query(
      `INSERT INTO "User" (id, email, name, "createdAt")
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (email) DO UPDATE SET name = $3
       RETURNING id`,
      [`e2e-test-user-${randomUUID().slice(0, 8)}`, TEST_EMAIL, "E2E Test User"]
    )
    const userId = userResult.rows[0].id

    // Clean up old test sessions
    await client.query(
      `DELETE FROM "Session" WHERE "userId" IN (SELECT id FROM "User" WHERE email = $1)`,
      [TEST_EMAIL]
    )

    // Create a session that expires in 24 hours
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await client.query(
      `INSERT INTO "Session" (id, "sessionToken", "userId", expires)
       VALUES ($1, $2, $3, $4)`,
      [randomUUID(), SESSION_TOKEN, userId, expires]
    )
  } finally {
    await client.end()
  }

  // Set the session cookie and navigate to dashboard
  await page.context().addCookies([
    {
      name: "authjs.session-token",
      value: SESSION_TOKEN,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ])

  await page.goto("/dashboard")
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible({ timeout: 15000 })

  // Save storage state for reuse across tests
  await page.context().storageState({ path: AUTH_FILE })
})
