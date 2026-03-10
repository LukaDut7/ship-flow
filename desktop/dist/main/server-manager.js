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
exports.findFreePort = findFreePort;
exports.healthCheck = healthCheck;
exports.startServer = startServer;
exports.stopServer = stopServer;
exports.getServerPort = getServerPort;
exports.isServerRunning = isServerRunning;
const child_process_1 = require("child_process");
const electron_1 = require("electron");
const net = __importStar(require("net"));
const path = __importStar(require("path"));
const http = __importStar(require("http"));
const fs = __importStar(require("fs"));
let serverProcess = null;
let serverPort = 0;
function findFreePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.listen(0, "127.0.0.1", () => {
            const addr = server.address();
            const port = addr.port;
            server.close(() => resolve(port));
        });
        server.on("error", reject);
    });
}
function getServerPath() {
    // In packaged app, standalone server is in resources
    if (electron_1.app.isPackaged) {
        return path.join(process.resourcesPath, "standalone", "server.js");
    }
    // In development, use the built standalone output
    return path.join(__dirname, "..", "..", "..", ".next", "standalone", "server.js");
}
function getNodePath() {
    if (electron_1.app.isPackaged) {
        const binaryName = process.platform === "win32" ? "node.exe" : "node";
        const bundledNode = path.join(process.resourcesPath, "node-bin", binaryName);
        if (!fs.existsSync(bundledNode)) {
            throw new Error(`Bundled Node runtime not found at ${bundledNode}`);
        }
        return bundledNode;
    }
    return process.env.SHIPFLOW_NODE_BINARY || process.env.NODE_BINARY || "node";
}
function healthCheck(port) {
    return new Promise((resolve) => {
        const req = http.get(`http://127.0.0.1:${port}/api/health`, (res) => {
            resolve(res.statusCode === 200);
        });
        req.on("error", () => resolve(false));
        req.setTimeout(2000, () => {
            req.destroy();
            resolve(false);
        });
    });
}
async function waitForServer(port, maxAttempts = 30) {
    for (let i = 0; i < maxAttempts; i++) {
        const ok = await healthCheck(port);
        if (ok)
            return;
        await new Promise((r) => setTimeout(r, 500));
    }
    throw new Error(`Server did not become ready after ${maxAttempts} attempts`);
}
async function startServer() {
    const port = await findFreePort();
    const serverPath = getServerPath();
    const nodePath = getNodePath();
    const dataDir = electron_1.app.getPath("userData");
    serverProcess = (0, child_process_1.spawn)(nodePath, [serverPath], {
        env: {
            ...process.env,
            PORT: String(port),
            HOSTNAME: "127.0.0.1",
            SHIPFLOW_RUNTIME: "desktop",
            SHIPFLOW_DATA_DIR: dataDir,
            AUTH_TRUST_HOST: "true",
            // JWT secret for desktop sessions
            NEXTAUTH_SECRET: `shipflow-desktop-${electron_1.app.getPath("userData")}`,
            NEXTAUTH_URL: `http://127.0.0.1:${port}`,
        },
        stdio: ["pipe", "pipe", "pipe"],
    });
    serverProcess.stdout?.on("data", (data) => {
        console.log(`[server] ${data.toString().trim()}`);
    });
    serverProcess.stderr?.on("data", (data) => {
        console.error(`[server] ${data.toString().trim()}`);
    });
    serverProcess.on("exit", (code, signal) => {
        console.log(`[server] Process exited: code=${code}, signal=${signal}`);
        serverProcess = null;
    });
    await waitForServer(port);
    serverPort = port;
    return port;
}
function stopServer() {
    if (serverProcess) {
        serverProcess.kill("SIGTERM");
        // Force kill after 5s if graceful shutdown fails
        setTimeout(() => {
            if (serverProcess && !serverProcess.killed) {
                serverProcess.kill("SIGKILL");
            }
        }, 5000);
        serverProcess = null;
    }
}
function getServerPort() {
    return serverPort;
}
function isServerRunning() {
    return serverProcess !== null && !serverProcess.killed;
}
