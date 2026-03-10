"use strict";
// IPC handlers for file mirror — workspace folder linking, sync triggers, status.
// Registered in the Electron main process.
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileMirrorIpc = registerFileMirrorIpc;
const electron_1 = require("electron");
function registerFileMirrorIpc(mainWindow) {
    // Pick a workspace folder
    electron_1.ipcMain.handle("folder:pick", async () => {
        const result = await electron_1.dialog.showOpenDialog(mainWindow, {
            properties: ["openDirectory", "createDirectory"],
            title: "Choose Workspace Folder",
            message: "Select a folder to mirror your project documents",
        });
        if (result.canceled || result.filePaths.length === 0) {
            return null;
        }
        return result.filePaths[0];
    });
    // Mirror status updates → renderer
    electron_1.ipcMain.handle("mirror:status", () => {
        // This will be called from the renderer to get current status.
        // The actual status comes from the Next.js server via an API call,
        // so we just provide the IPC bridge here.
        return { ok: true };
    });
}
