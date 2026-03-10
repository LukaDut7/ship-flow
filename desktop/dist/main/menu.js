"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createMenu = createMenu;
const electron_1 = require("electron");
function createMenu(connectionManager) {
    const isMac = process.platform === "darwin";
    const connectionSubmenu = [
        {
            label: "Return to Local Workspace",
            click: async () => {
                try {
                    const port = await connectionManager?.connectLocal();
                    if (port) {
                        const win = electron_1.BrowserWindow.getFocusedWindow() ?? electron_1.BrowserWindow.getAllWindows()[0];
                        await win?.loadURL(`http://127.0.0.1:${port}/dashboard`);
                    }
                }
                catch (err) {
                    const win = electron_1.BrowserWindow.getFocusedWindow() ?? electron_1.BrowserWindow.getAllWindows()[0];
                    if (win) {
                        electron_1.dialog.showMessageBox(win, {
                            type: "error",
                            title: "Local Workspace Error",
                            message: "Unable to start the local workspace.",
                            detail: err.message,
                        });
                    }
                }
            },
        },
        {
            label: "Connect to Remote...",
            click: () => {
                connectionManager?.loadConnectPage();
            },
        },
        {
            label: "Disconnect Remote",
            enabled: connectionManager?.getStatus().mode === "ssh",
            click: async () => {
                try {
                    await connectionManager?.disconnect();
                    const port = await connectionManager?.connectLocal();
                    if (port) {
                        const win = electron_1.BrowserWindow.getFocusedWindow() ?? electron_1.BrowserWindow.getAllWindows()[0];
                        await win?.loadURL(`http://127.0.0.1:${port}/dashboard`);
                    }
                }
                catch (err) {
                    const win = electron_1.BrowserWindow.getFocusedWindow() ?? electron_1.BrowserWindow.getAllWindows()[0];
                    if (win) {
                        electron_1.dialog.showMessageBox(win, {
                            type: "error",
                            title: "Remote Disconnect Error",
                            message: "Unable to return to the local workspace.",
                            detail: err.message,
                        });
                    }
                }
            },
        },
        { type: "separator" },
        {
            label: "Connection Status",
            click: () => {
                const status = connectionManager?.getStatus();
                const win = electron_1.BrowserWindow.getFocusedWindow();
                if (win && status) {
                    const detail = status.mode === "ssh"
                        ? `Mode: Remote SSH\nHost: ${status.host}\nStatus: ${status.status}`
                        : `Mode: Local\nStatus: ${status.status}`;
                    electron_1.dialog.showMessageBox(win, {
                        type: "info",
                        title: "Connection Status",
                        message: `Ship Flow — ${status.mode === "ssh" ? "Remote" : "Local"}`,
                        detail,
                    });
                }
            },
        },
    ];
    const template = [
        ...(isMac
            ? [
                {
                    label: electron_1.app.name,
                    submenu: [
                        { role: "about" },
                        { type: "separator" },
                        { role: "services" },
                        { type: "separator" },
                        { role: "hide" },
                        { role: "hideOthers" },
                        { role: "unhide" },
                        { type: "separator" },
                        { role: "quit" },
                    ],
                },
            ]
            : []),
        {
            label: "File",
            submenu: [isMac ? { role: "close" } : { role: "quit" }],
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
                        { type: "separator" },
                        { role: "front" },
                    ]
                    : [{ role: "close" }]),
            ],
        },
        {
            role: "help",
            submenu: [
                {
                    label: "Ship Flow Documentation",
                    click: () => {
                        electron_1.shell.openExternal("https://shipflow.dev/docs");
                    },
                },
                {
                    label: "Report an Issue",
                    click: () => {
                        electron_1.shell.openExternal("https://github.com/shipflow/desktop/issues");
                    },
                },
            ],
        },
    ];
    const menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
