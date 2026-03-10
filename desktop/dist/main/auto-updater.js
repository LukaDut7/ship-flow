"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initAutoUpdater = initAutoUpdater;
exports.isUpdateAvailable = isUpdateAvailable;
const electron_updater_1 = require("electron-updater");
const electron_1 = require("electron");
let updateAvailable = false;
function initAutoUpdater(mainWindow) {
    // Don't check in development
    if (!electron_1.app.isPackaged)
        return;
    electron_updater_1.autoUpdater.autoDownload = true;
    electron_updater_1.autoUpdater.autoInstallOnAppQuit = true;
    electron_updater_1.autoUpdater.on("checking-for-update", () => {
        console.log("[updater] Checking for updates...");
    });
    electron_updater_1.autoUpdater.on("update-available", (info) => {
        console.log(`[updater] Update available: ${info.version}`);
        updateAvailable = true;
        mainWindow.webContents.send("update:available", {
            version: info.version,
        });
    });
    electron_updater_1.autoUpdater.on("update-not-available", () => {
        console.log("[updater] No update available");
    });
    electron_updater_1.autoUpdater.on("download-progress", (progress) => {
        console.log(`[updater] Download progress: ${Math.round(progress.percent)}%`);
    });
    electron_updater_1.autoUpdater.on("update-downloaded", (info) => {
        console.log(`[updater] Update downloaded: ${info.version}`);
        mainWindow.webContents.send("update:downloaded", {
            version: info.version,
        });
        // Show dialog to user
        electron_1.dialog
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
                electron_updater_1.autoUpdater.quitAndInstall();
            }
        });
    });
    electron_updater_1.autoUpdater.on("error", (err) => {
        console.error("[updater] Error:", err.message);
    });
    // Check on launch
    electron_updater_1.autoUpdater.checkForUpdates();
    // Check periodically (every 4 hours)
    setInterval(() => {
        electron_updater_1.autoUpdater.checkForUpdates();
    }, 4 * 60 * 60 * 1000);
}
function isUpdateAvailable() {
    return updateAvailable;
}
