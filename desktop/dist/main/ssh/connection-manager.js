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
exports.ConnectionManager = void 0;
const electron_1 = require("electron");
const path = __importStar(require("path"));
const local_connection_provider_1 = require("./local-connection-provider");
const ssh_connection_provider_1 = require("./ssh-connection-provider");
const connection_store_1 = require("./connection-store");
class ConnectionManager {
    constructor() {
        this.provider = null;
        this.mainWindow = null;
        this.statusInfo = {
            status: "disconnected",
            mode: "local",
        };
        this.healthInterval = null;
        this.activeConnectionId = null;
    }
    getActivePort() {
        return this.provider?.getPort() ?? 0;
    }
    getStatus() {
        return this.statusInfo;
    }
    async connectLocal() {
        await this.disconnect();
        const provider = new local_connection_provider_1.LocalConnectionProvider();
        provider.onStatusChange((s) => this.onStatusChanged(s));
        this.provider = provider;
        const { port } = await provider.start();
        this.startHealthMonitor();
        return port;
    }
    async connectSSH(config, connectionId) {
        await this.disconnect();
        const provider = new ssh_connection_provider_1.SSHConnectionProvider(config, {
            onPassphraseNeeded: () => this.promptPassphrase(),
            onDeployProgress: (p) => this.onDeployProgress(p),
        });
        provider.onStatusChange((s) => this.onStatusChanged(s));
        this.provider = provider;
        this.activeConnectionId = connectionId ?? null;
        const { port } = await provider.start();
        if (connectionId) {
            (0, connection_store_1.updateLastConnected)(connectionId);
        }
        this.startHealthMonitor();
        return port;
    }
    async disconnect() {
        this.stopHealthMonitor();
        if (this.provider) {
            await this.provider.stop();
            this.provider = null;
        }
        this.activeConnectionId = null;
    }
    registerIPC(mainWindow) {
        this.mainWindow = mainWindow;
        // Invoke handlers (request-response)
        electron_1.ipcMain.handle("ssh:status", () => this.getStatus());
        electron_1.ipcMain.handle("ssh:list-connections", () => (0, connection_store_1.loadConnections)());
        electron_1.ipcMain.handle("ssh:save-connection", (_event, conn) => (0, connection_store_1.saveConnection)(conn));
        electron_1.ipcMain.handle("ssh:delete-connection", (_event, id) => (0, connection_store_1.deleteConnection)(id));
        electron_1.ipcMain.handle("ssh:test-connection", async (_event, config) => {
            try {
                const { Client } = await Promise.resolve().then(() => __importStar(require("ssh2")));
                const client = new Client();
                const fs = await Promise.resolve().then(() => __importStar(require("fs")));
                return new Promise((resolve) => {
                    const timeout = setTimeout(() => {
                        client.destroy();
                        resolve({ ok: false, error: "Connection timed out" });
                    }, 10000);
                    client.on("ready", () => {
                        clearTimeout(timeout);
                        client.end();
                        resolve({ ok: true });
                    });
                    client.on("error", (err) => {
                        clearTimeout(timeout);
                        resolve({ ok: false, error: err.message });
                    });
                    let privateKey;
                    try {
                        privateKey = fs.readFileSync(config.privateKeyPath);
                    }
                    catch {
                        clearTimeout(timeout);
                        resolve({ ok: false, error: `Key file not found: ${config.privateKeyPath}` });
                        return;
                    }
                    client.connect({
                        host: config.host,
                        port: config.port,
                        username: config.username,
                        privateKey,
                        passphrase: config.passphrase,
                        readyTimeout: 10000,
                    });
                });
            }
            catch (err) {
                return { ok: false, error: err.message };
            }
        });
        electron_1.ipcMain.handle("ssh:browse-key", async () => {
            if (!mainWindow)
                return null;
            const result = await electron_1.dialog.showOpenDialog(mainWindow, {
                title: "Select SSH Private Key",
                defaultPath: path.join(process.env.HOME || process.env.USERPROFILE || "", ".ssh"),
                properties: ["openFile", "showHiddenFiles"],
                filters: [{ name: "All Files", extensions: ["*"] }],
            });
            if (result.canceled || result.filePaths.length === 0)
                return null;
            return result.filePaths[0];
        });
        // One-way handlers
        electron_1.ipcMain.on("ssh:connect", async (_event, config) => {
            try {
                const port = await this.connectSSH(config, config.connectionId);
                mainWindow?.loadURL(`http://127.0.0.1:${port}/dashboard`);
            }
            catch (err) {
                this.sendToRenderer("ssh:error", err.message);
            }
        });
        electron_1.ipcMain.on("ssh:connect-local", async () => {
            try {
                const port = await this.connectLocal();
                mainWindow?.loadURL(`http://127.0.0.1:${port}/dashboard`);
            }
            catch (err) {
                this.sendToRenderer("ssh:error", err.message);
            }
        });
        electron_1.ipcMain.on("ssh:disconnect", async () => {
            await this.disconnect();
            this.loadConnectPage();
        });
        // Power monitor — pause/resume health checks on sleep/wake
        electron_1.powerMonitor.on("suspend", () => {
            console.log("[connection] System suspending — pausing health checks");
            this.stopHealthMonitor();
        });
        electron_1.powerMonitor.on("resume", () => {
            console.log("[connection] System resumed — checking connection");
            if (this.provider && this.statusInfo.status === "ready") {
                this.startHealthMonitor();
                // Immediate health check
                this.provider.healthCheck().then((ok) => {
                    if (!ok && this.statusInfo.mode === "ssh") {
                        // SSH provider handles reconnection internally
                        console.log("[connection] Health check failed after resume — SSH will auto-reconnect");
                    }
                });
            }
        });
    }
    loadConnectPage() {
        if (!this.mainWindow)
            return;
        const connectPath = path.join(__dirname, "..", "renderer", "connect.html");
        this.mainWindow.loadFile(connectPath);
    }
    // --- Private methods ---
    onStatusChanged(status) {
        this.statusInfo = status;
        this.sendToRenderer("ssh:status-changed", status);
    }
    onDeployProgress(progress) {
        this.sendToRenderer("ssh:deploy-progress", progress);
    }
    async promptPassphrase() {
        if (!this.mainWindow)
            return null;
        return new Promise((resolve) => {
            const child = new electron_1.BrowserWindow({
                parent: this.mainWindow,
                modal: true,
                width: 420,
                height: 200,
                resizable: false,
                minimizable: false,
                maximizable: false,
                title: "SSH Key Passphrase",
                webPreferences: {
                    preload: path.join(__dirname, "..", "preload", "index.js"),
                    contextIsolation: true,
                    nodeIntegration: false,
                    sandbox: true,
                },
            });
            const dialogPath = path.join(__dirname, "..", "renderer", "passphrase-dialog.html");
            child.loadFile(dialogPath);
            child.setMenu(null);
            // Listen for passphrase response
            const handler = (_event, passphrase) => {
                electron_1.ipcMain.removeListener("ssh:passphrase-response", handler);
                child.close();
                resolve(passphrase);
            };
            electron_1.ipcMain.on("ssh:passphrase-response", handler);
            child.on("closed", () => {
                electron_1.ipcMain.removeListener("ssh:passphrase-response", handler);
                resolve(null);
            });
        });
    }
    sendToRenderer(channel, ...args) {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(channel, ...args);
        }
    }
    startHealthMonitor() {
        this.stopHealthMonitor();
        this.healthInterval = setInterval(async () => {
            if (!this.provider)
                return;
            const ok = await this.provider.healthCheck();
            if (!ok && this.statusInfo.status === "ready") {
                console.log("[connection] Health check failed");
                // For SSH, the provider handles reconnection internally
                // For local, we just report the error
                if (this.statusInfo.mode === "local") {
                    this.onStatusChanged({
                        status: "error",
                        mode: "local",
                        error: "Local server stopped responding",
                    });
                }
            }
        }, 15000);
    }
    stopHealthMonitor() {
        if (this.healthInterval) {
            clearInterval(this.healthInterval);
            this.healthInterval = null;
        }
    }
}
exports.ConnectionManager = ConnectionManager;
