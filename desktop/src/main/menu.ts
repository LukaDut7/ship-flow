import { app, Menu, BrowserWindow, shell, dialog } from "electron"
import type { ConnectionManager } from "./ssh"

export function createMenu(connectionManager?: ConnectionManager): void {
  const isMac = process.platform === "darwin"

  const connectionSubmenu: Electron.MenuItemConstructorOptions[] = [
    {
      label: "Return to Local Workspace",
      click: async () => {
        try {
          const port = await connectionManager?.connectLocal()
          if (port) {
            const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
            await win?.loadURL(`http://127.0.0.1:${port}/dashboard`)
          }
        } catch (err) {
          const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
          if (win) {
            dialog.showMessageBox(win, {
              type: "error",
              title: "Local Workspace Error",
              message: "Unable to start the local workspace.",
              detail: (err as Error).message,
            })
          }
        }
      },
    },
    {
      label: "Connect to Remote...",
      click: () => {
        connectionManager?.loadConnectPage()
      },
    },
    {
      label: "Disconnect Remote",
      enabled: connectionManager?.getStatus().mode === "ssh",
      click: async () => {
        try {
          await connectionManager?.disconnect()
          const port = await connectionManager?.connectLocal()
          if (port) {
            const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
            await win?.loadURL(`http://127.0.0.1:${port}/dashboard`)
          }
        } catch (err) {
          const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
          if (win) {
            dialog.showMessageBox(win, {
              type: "error",
              title: "Remote Disconnect Error",
              message: "Unable to return to the local workspace.",
              detail: (err as Error).message,
            })
          }
        }
      },
    },
    { type: "separator" },
    {
      label: "Connection Status",
      click: () => {
        const status = connectionManager?.getStatus()
        const win = BrowserWindow.getFocusedWindow()
        if (win && status) {
          const detail =
            status.mode === "ssh"
              ? `Mode: Remote SSH\nHost: ${status.host}\nStatus: ${status.status}`
              : `Mode: Local\nStatus: ${status.status}`
          dialog.showMessageBox(win, {
            type: "info",
            title: "Connection Status",
            message: `Ship Flow — ${status.mode === "ssh" ? "Remote" : "Local"}`,
            detail,
          })
        }
      },
    },
  ]

  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" as const },
              { type: "separator" as const },
              { role: "services" as const },
              { type: "separator" as const },
              { role: "hide" as const },
              { role: "hideOthers" as const },
              { role: "unhide" as const },
              { type: "separator" as const },
              { role: "quit" as const },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [isMac ? { role: "close" as const } : { role: "quit" as const }],
    },
    {
      label: "Connection",
      submenu: connectionSubmenu,
    },
    {
      label: "Edit",
      submenu: [
        { role: "undo" },
        { role: "redo" },
        { type: "separator" },
        { role: "cut" },
        { role: "copy" },
        { role: "paste" },
        { role: "selectAll" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "reload" },
        { role: "forceReload" },
        { role: "toggleDevTools" },
        { type: "separator" },
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [
        { role: "minimize" },
        { role: "zoom" },
        ...(isMac
          ? [
              { type: "separator" as const },
              { role: "front" as const },
            ]
          : [{ role: "close" as const }]),
      ],
    },
    {
      role: "help",
      submenu: [
        {
          label: "Ship Flow Documentation",
          click: () => {
            shell.openExternal("https://shipflow.dev/docs")
          },
        },
        {
          label: "Report an Issue",
          click: () => {
            shell.openExternal("https://github.com/shipflow/desktop/issues")
          },
        },
      ],
    },
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}
