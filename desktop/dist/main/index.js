"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const window_state_1 = require("./window-state");
const menu_1 = require("./menu");
const file_mirror_ipc_1 = require("./file-mirror-ipc");
const ssh_1 = require("./ssh");
const path = __importStar(require("path"));
let mainWindow = null;
const connectionManager = new ssh_1.ConnectionManager();
// Single instance lock — prevent multiple instances corrupting SQLite
const gotLock = electron_1.app.requestSingleInstanceLock();
if (!gotLock) {
    electron_1.app.quit();
}
electron_1.app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized())
            mainWindow.restore();
        mainWindow.focus();
    }
});
// Register shipflow:// protocol for OAuth callbacks
if (process.defaultApp) {
    if (process.argv.length >= 2) {
        electron_1.app.setAsDefaultProtocolClient("shipflow", process.execPath, [
            path.resolve(process.argv[1]),
        ]);
    }
}
else {
    electron_1.app.setAsDefaultProtocolClient("shipflow");
}
// Handle protocol URLs on macOS
electron_1.app.on("open-url", (_event, url) => {
    handleProtocolUrl(url);
});
function handleProtocolUrl(url) {
    // shipflow://auth/callback?token=...
    if (mainWindow && url.startsWith("shipflow://auth/callback")) {
        const params = new URL(url).searchParams;
        const token = params.get("token");
        if (token) {
            const port = connectionManager.getActivePort();
            if (port) {
                mainWindow.loadURL(`http://127.0.0.1:${port}/api/desktop/session/exchange?token=${encodeURIComponent(token)}`);
            }
        }
    }
}
async function connectLocalWorkspace() {
    if (!mainWindow)
        return;
    try {
        const port = await connectionManager.connectLocal();
        await mainWindow.loadURL(`http://127.0.0.1:${port}/dashboard`);
    }
    catch (err) {
        console.error("[desktop] Failed to start local workspace:", err.message);
        connectionManager.loadConnectPage();
    }
}
async function createWindow() {
    const state = (0, window_state_1.loadWindowState)();
    mainWindow = new electron_1.BrowserWindow({
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
    });
    if (state.maximized) {
        mainWindow.maximize();
    }
    // Save window state on changes
    mainWindow.on("resize", () => (0, window_state_1.saveWindowState)(mainWindow));
    mainWindow.on("move", () => (0, window_state_1.saveWindowState)(mainWindow));
    mainWindow.on("maximize", () => (0, window_state_1.saveWindowState)(mainWindow));
    mainWindow.on("unmaximize", () => (0, window_state_1.saveWindowState)(mainWindow));
    mainWindow.once("ready-to-show", () => {
        mainWindow?.show();
    });
    mainWindow.on("closed", () => {
        mainWindow = null;
    });
    // Register file mirror IPC handlers
    (0, file_mirror_ipc_1.registerFileMirrorIpc)(mainWindow);
    // Register SSH/connection IPC handlers
    connectionManager.registerIPC(mainWindow);
    // Desktop defaults to the local workspace. Remote SSH is an explicit action.
    await connectLocalWorkspace();
}
electron_1.app.whenReady().then(async () => {
    (0, menu_1.createMenu)(connectionManager);
    await createWindow();
    electron_1.app.on("activate", () => {
        // macOS: re-create window when dock icon clicked
        if (electron_1.BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});
electron_1.app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        electron_1.app.quit();
    }
});
electron_1.app.on("before-quit", async () => {
    await connectionManager.disconnect();
});
