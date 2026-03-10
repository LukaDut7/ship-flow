import {
  autoUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent,
  type UpdateInfo,
} from "electron-updater"
import { app, dialog, BrowserWindow } from "electron"

let updateAvailable = false

export function initAutoUpdater(mainWindow: BrowserWindow): void {
  // Don't check in development
  if (!app.isPackaged) return

  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on("checking-for-update", () => {
    console.log("[updater] Checking for updates...")
  })

  autoUpdater.on("update-available", (info: UpdateInfo) => {
    console.log(`[updater] Update available: ${info.version}`)
    updateAvailable = true
    mainWindow.webContents.send("update:available", {
      version: info.version,
    })
  })

  autoUpdater.on("update-not-available", () => {
    console.log("[updater] No update available")
  })

  autoUpdater.on("download-progress", (progress: ProgressInfo) => {
    console.log(`[updater] Download progress: ${Math.round(progress.percent)}%`)
  })

  autoUpdater.on("update-downloaded", (info: UpdateDownloadedEvent) => {
    console.log(`[updater] Update downloaded: ${info.version}`)
    mainWindow.webContents.send("update:downloaded", {
      version: info.version,
    })

    // Show dialog to user
    dialog
      .showMessageBox(mainWindow, {
        type: "info",
        title: "Update Ready",
        message: `Ship Flow ${info.version} has been downloaded.`,
        detail: "Restart to install the update?",
        buttons: ["Restart Now", "Later"],
        defaultId: 0,
      })
      .then(({ response }) => {
        if (response === 0) {
          autoUpdater.quitAndInstall()
        }
      })
  })

  autoUpdater.on("error", (err: Error) => {
    console.error("[updater] Error:", err.message)
  })

  // Check on launch
  autoUpdater.checkForUpdates()

  // Check periodically (every 4 hours)
  setInterval(() => {
    autoUpdater.checkForUpdates()
  }, 4 * 60 * 60 * 1000)
}

export function isUpdateAvailable(): boolean {
  return updateAvailable
}
