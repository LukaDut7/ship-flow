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
exports.SSHConnectionProvider = void 0;
const ssh2_1 = require("ssh2");
const fs = __importStar(require("fs"));
const net = __importStar(require("net"));
const http = __importStar(require("http"));
const server_manager_1 = require("../server-manager");
const remote_server_manager_1 = require("./remote-server-manager");
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];
class SSHConnectionProvider {
    constructor(config, options) {
        this.client = null;
        this.localPort = 0;
        this.remotePort = 0;
        this.remotePid = 0;
        this.tunnelServer = null;
        this.statusCallback = null;
        this.deployCallback = null;
        this.reconnecting = false;
        this.stopped = false;
        this.passphraseCallback = null;
        this.config = config;
        this.passphraseCallback = options?.onPassphraseNeeded ?? null;
        this.deployCallback = options?.onDeployProgress ?? null;
    }
    async start() {
        this.stopped = false;
        this.emitStatus("connecting");
        try {
            // Read private key
            const privateKey = await this.readPrivateKey();
            // Connect SSH
            this.client = await this.connectSSH(privateKey, this.config.passphrase);
            // Setup reconnection listeners
            this.setupReconnection(privateKey);
            // Check Node.js on remote
            this.emitStatus("deploying");
            await (0, remote_server_manager_1.checkRemoteNode)(this.client);
            // Deploy if needed
            await (0, remote_server_manager_1.deployRemoteServer)(this.client, this.deployCallback ?? undefined);
            // Reuse running server or start a new one
            let remotePort = await (0, remote_server_manager_1.reuseIfRunning)(this.client);
            if (remotePort) {
                this.remotePort = remotePort;
                console.log(`[ssh] Reusing existing remote server on port ${remotePort}`);
            }
            else {
                this.deployCallback?.({ stage: "starting", message: "Starting remote server...", percent: 90 });
                const result = await (0, remote_server_manager_1.startRemoteServer)(this.client);
                this.remotePort = result.port;
                this.remotePid = result.pid;
                console.log(`[ssh] Started remote server: pid=${result.pid}, port=${result.port}`);
            }
            // Setup local tunnel
            this.localPort = await this.createTunnel();
            console.log(`[ssh] Tunnel: 127.0.0.1:${this.localPort} → remote:${this.remotePort}`);
            // Verify through tunnel
            const ok = await this.tunnelHealthCheck();
            if (!ok) {
                throw new Error("Server health check failed through tunnel");
            }
            this.emitStatus("ready");
            return { port: this.localPort };
        }
        catch (err) {
            const msg = err.message;
            this.emitStatus("error", msg);
            await this.cleanup();
            throw err;
        }
    }
    async stop() {
        this.stopped = true;
        await this.cleanup();
        this.emitStatus("disconnected");
    }
    async healthCheck() {
        return this.tunnelHealthCheck();
    }
    getPort() {
        return this.localPort;
    }
    onStatusChange(cb) {
        this.statusCallback = cb;
    }
    // --- Private methods ---
    async readPrivateKey() {
        const keyPath = this.config.privateKeyPath;
        try {
            return fs.readFileSync(keyPath);
        }
        catch (err) {
            throw new Error(`SSH key file not found: ${keyPath}`);
        }
    }
    connectSSH(privateKey, passphrase) {
        return new Promise((resolve, reject) => {
            const client = new ssh2_1.Client();
            let authFailed = false;
            client.on("ready", () => resolve(client));
            client.on("error", async (err) => {
                // Handle encrypted key needing passphrase
                if (!authFailed &&
                    (err.message.includes("decrypt") ||
                        err.message.includes("passphrase") ||
                        err.message.includes("bad decrypt"))) {
                    authFailed = true;
                    if (this.passphraseCallback) {
                        const passphrase = await this.passphraseCallback();
                        if (passphrase) {
                            this.config.passphrase = passphrase;
                            try {
                                const newClient = await this.connectSSH(privateKey, passphrase);
                                resolve(newClient);
                            }
                            catch (retryErr) {
                                reject(retryErr);
                            }
                            return;
                        }
                    }
                    reject(new Error("Passphrase required for encrypted SSH key"));
                    return;
                }
                if (err.level === "client-authentication") {
                    reject(new Error("Authentication failed. Check your SSH key and username."));
                    return;
                }
                reject(err);
            });
            client.connect({
                host: this.config.host,
                port: this.config.port,
                username: this.config.username,
                privateKey,
                passphrase,
                readyTimeout: 15000,
                keepaliveInterval: 10000,
                keepaliveCountMax: 3,
            });
        });
    }
    setupReconnection(privateKey) {
        if (!this.client)
            return;
        this.client.on("close", () => {
            if (!this.stopped) {
                this.attemptReconnect(privateKey);
            }
        });
        this.client.on("end", () => {
            if (!this.stopped) {
                this.attemptReconnect(privateKey);
            }
        });
    }
    async attemptReconnect(privateKey) {
        if (this.reconnecting || this.stopped)
            return;
        this.reconnecting = true;
        this.emitStatus("reconnecting");
        for (let attempt = 0; attempt < MAX_RECONNECT_ATTEMPTS; attempt++) {
            if (this.stopped)
                break;
            const delay = RECONNECT_DELAYS[Math.min(attempt, RECONNECT_DELAYS.length - 1)];
            console.log(`[ssh] Reconnect attempt ${attempt + 1}/${MAX_RECONNECT_ATTEMPTS} in ${delay}ms`);
            await new Promise((r) => setTimeout(r, delay));
            if (this.stopped)
                break;
            try {
                // Clean up old state
                this.closeTunnel();
                this.client?.destroy();
                // Reconnect
                this.client = await this.connectSSH(privateKey, this.config.passphrase);
                this.setupReconnection(privateKey);
                // Reuse or restart remote server
                let remotePort = await (0, remote_server_manager_1.reuseIfRunning)(this.client);
                if (!remotePort) {
                    const result = await (0, remote_server_manager_1.startRemoteServer)(this.client);
                    remotePort = result.port;
                    this.remotePid = result.pid;
                }
                this.remotePort = remotePort;
                // Re-establish tunnel
                this.localPort = await this.createTunnel();
                const ok = await this.tunnelHealthCheck();
                if (ok) {
                    console.log("[ssh] Reconnected successfully");
                    this.reconnecting = false;
                    this.emitStatus("ready");
                    return;
                }
            }
            catch (err) {
                console.error(`[ssh] Reconnect attempt ${attempt + 1} failed:`, err.message);
            }
        }
        this.reconnecting = false;
        this.emitStatus("error", "Failed to reconnect after multiple attempts");
    }
    createTunnel() {
        return new Promise(async (resolve, reject) => {
            const localPort = await (0, server_manager_1.findFreePort)();
            const server = net.createServer((localSocket) => {
                if (!this.client) {
                    localSocket.destroy();
                    return;
                }
                this.client.forwardOut("127.0.0.1", localPort, "127.0.0.1", this.remotePort, (err, remoteSocket) => {
                    if (err) {
                        localSocket.destroy();
                        return;
                    }
                    localSocket.pipe(remoteSocket).pipe(localSocket);
                    localSocket.on("error", () => remoteSocket.destroy());
                    remoteSocket.on("error", () => localSocket.destroy());
                    localSocket.on("close", () => remoteSocket.destroy());
                    remoteSocket.on("close", () => localSocket.destroy());
                });
            });
            server.on("error", reject);
            server.listen(localPort, "127.0.0.1", () => {
                this.tunnelServer = server;
                resolve(localPort);
            });
        });
    }
    closeTunnel() {
        if (this.tunnelServer) {
            this.tunnelServer.close();
            this.tunnelServer = null;
        }
    }
    tunnelHealthCheck() {
        if (this.localPort === 0)
            return Promise.resolve(false);
        return new Promise((resolve) => {
            const req = http.get(`http://127.0.0.1:${this.localPort}/api/health`, (res) => {
                resolve(res.statusCode === 200);
            });
            req.on("error", () => resolve(false));
            req.setTimeout(5000, () => {
                req.destroy();
                resolve(false);
            });
        });
    }
    async cleanup() {
        this.closeTunnel();
        if (this.client) {
            this.client.destroy();
            this.client = null;
        }
        this.localPort = 0;
    }
    emitStatus(status, error) {
        this.statusCallback?.({
            status,
            mode: "ssh",
            error,
            host: this.config.host,
        });
    }
}
exports.SSHConnectionProvider = SSHConnectionProvider;
