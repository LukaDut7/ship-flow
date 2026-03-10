import { app, BrowserWindow } from "electron"
import { loadWindowState, saveWindowState } from "./window-state"
import { createMenu } from "./menu"
import { registerFileMirrorIpc } from "./file-mirror-ipc"
import { ConnectionManager } from "./ssh"
import * as path from "path"

let mainWindow: BrowserWindow | null = null
const connectionManager = new ConnectionManager()

// Single instance lock — prevent multiple instances corrupting SQLite
const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  }
})

// Register shipflow:// protocol for OAuth callbacks
if (process.defaultApp) {
  if (process.argv.length >= 2) {
    app.setAsDefaultProtocolClient("shipflow", process.execPath, [
      path.resolve(process.argv[1]),
    ])
  }
} else {
  app.setAsDefaultProtocolClient("shipflow")
}

// Handle protocol URLs on macOS
app.on("open-url", (_event, url) => {
  handleProtocolUrl(url)
})

function handleProtocolUrl(url: string) {
  // shipflow://auth/callback?token=...
  if (mainWindow && url.startsWith("shipflow://auth/callback")) {
    const params = new URL(url).searchParams
    const token = params.get("token")
    if (token) {
      const port = connectionManager.getActivePort()
      if (port) {
        mainWindow.loadURL(
          `http://127.0.0.1:${port}/api/desktop/session/exchange?token=${encodeURIComponent(token)}`
        )
      }
    }
  }
}

async function connectLocalWorkspace(): Promise<void> {
  if (!mainWindow) return

  try {
    const port = await connectionManager.connectLocal()
    await mainWindow.loadURL(`http://127.0.0.1:${port}/dashboard`)
  } catch (err) {
    console.error("[desktop] Failed to start local workspace:", (err as Error).message)
    connectionManager.loadConnectPage()
  }
}

async function createWindow() {
  const state = loadWindowState()

  mainWindow = new BrowserWindow({
    x: state.x,
    y: state.y,
    width: state.width,
    height: state.height,
    minWidth: 800,
    minHeight: 600,
    title: "Ship Flow",
    webPreferences: {
      preload: path.join(__dirname, "..", "preload", "index.js"),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
      sandbox: true,
    },
    show: false, // Show after ready-to-show
  })

  if (state.maximized) {
    mainWindow.maximize()
  }

  // Save window state on changes
  mainWindow.on("resize", () => saveWindowState(mainWindow!))
  mainWindow.on("move", () => saveWindowState(mainWindow!))
  mainWindow.on("maximize", () => saveWindowState(mainWindow!))
  mainWindow.on("unmaximize", () => saveWindowState(mainWindow!))

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show()
  })

  mainWindow.on("closed", () => {
    mainWindow = null
  })

  // Register file mirror IPC handlers
  registerFileMirrorIpc(mainWindow)

  // Register SSH/connection IPC handlers
  connectionManager.registerIPC(mainWindow)

  // Desktop defaults to the local workspace. Remote SSH is an explicit action.
  await connectLocalWorkspace()
}

app.whenReady().then(async () => {
  createMenu(connectionManager)
  await createWindow()

  app.on("activate", () => {
    // macOS: re-create window when dock icon clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit()
  }
})

app.on("before-quit", async () => {
  await connectionManager.disconnect()
})
