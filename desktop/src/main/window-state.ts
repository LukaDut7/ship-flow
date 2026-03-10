import { app, BrowserWindow, screen } from "electron"
import * as fs from "fs"
import * as path from "path"

interface WindowState {
  x: number
  y: number
  width: number
  height: number
  maximized: boolean
}

const STATE_FILE = "window-state.json"

function getStatePath(): string {
  return path.join(app.getPath("userData"), STATE_FILE)
}

export function loadWindowState(): WindowState {
  const defaults: WindowState = {
    x: 0,
    y: 0,
    width: 1280,
    height: 800,
    maximized: false,
  }

  try {
    const data = fs.readFileSync(getStatePath(), "utf-8")
    const state = JSON.parse(data) as WindowState

    // Validate that the window is on a visible screen
    const displays = screen.getAllDisplays()
    const isOnScreen = displays.some((display) => {
      const bounds = display.bounds
      return (
        state.x >= bounds.x &&
        state.y >= bounds.y &&
        state.x + state.width <= bounds.x + bounds.width &&
        state.y + state.height <= bounds.y + bounds.height
      )
    })

    if (isOnScreen) {
      return state
    }
  } catch {
    // File doesn't exist or is corrupted
  }

  // Center on primary display
  const primaryDisplay = screen.getPrimaryDisplay()
  defaults.x = Math.round(
    primaryDisplay.bounds.x + (primaryDisplay.bounds.width - defaults.width) / 2
  )
  defaults.y = Math.round(
    primaryDisplay.bounds.y + (primaryDisplay.bounds.height - defaults.height) / 2
  )

  return defaults
}

export function saveWindowState(win: BrowserWindow): void {
  if (win.isDestroyed()) return

  const maximized = win.isMaximized()
  const bounds = maximized ? win.getNormalBounds() : win.getBounds()

  const state: WindowState = {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    maximized,
  }

  try {
    fs.writeFileSync(getStatePath(), JSON.stringify(state))
  } catch {
    // Ignore write errors
  }
}
