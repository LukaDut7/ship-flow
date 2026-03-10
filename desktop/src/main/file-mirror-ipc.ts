// IPC handlers for file mirror — workspace folder linking, sync triggers, status.
// Registered in the Electron main process.

import { ipcMain, dialog, BrowserWindow } from "electron"

export function registerFileMirrorIpc(mainWindow: BrowserWindow): void {
  // Pick a workspace folder
  ipcMain.handle("folder:pick", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ["openDirectory", "createDirectory"],
      title: "Choose Workspace Folder",
      message: "Select a folder to mirror your project documents",
    })

    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    return result.filePaths[0]
  })

  // Mirror status updates → renderer
  ipcMain.handle("mirror:status", () => {
    // This will be called from the renderer to get current status.
    // The actual status comes from the Next.js server via an API call,
    // so we just provide the IPC bridge here.
    return { ok: true }
  })
}
