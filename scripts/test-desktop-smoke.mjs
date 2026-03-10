import { _electron as electron } from "playwright"

const app = await electron.launch({
  args: ["desktop"],
  cwd: process.cwd(),
  timeout: 60_000,
})

try {
  const window = await app.firstWindow()
  await window.waitForURL(/\/dashboard$/, { timeout: 60_000 })
  await window.waitForLoadState("networkidle")

  const body = await window.locator("body").innerText()

  if (!/Local Workspace/.test(body)) {
    throw new Error("Desktop smoke test failed: missing Local Workspace session copy")
  }

  if (!/Create your first project|No projects yet/.test(body)) {
    throw new Error("Desktop smoke test failed: dashboard content did not render")
  }

  console.log(
    JSON.stringify(
      {
        url: window.url(),
        ok: true,
      },
      null,
      2
    )
  )
} finally {
  await app.close()
}
