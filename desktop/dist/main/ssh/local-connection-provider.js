"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LocalConnectionProvider = void 0;
const server_manager_1 = require("../server-manager");
class LocalConnectionProvider {
    constructor() {
        this.port = 0;
        this.statusCallback = null;
    }
    async start() {
        this.emitStatus("connecting");
        try {
            const port = await (0, server_manager_1.startServer)();
            this.port = port;
            this.emitStatus("ready");
            return { port };
        }
        catch (err) {
            this.emitStatus("error", err.message);
            throw err;
        }
    }
    async stop() {
        (0, server_manager_1.stopServer)();
        this.port = 0;
        this.emitStatus("disconnected");
    }
    async healthCheck() {
        if (this.port === 0)
            return false;
        return (0, server_manager_1.healthCheck)(this.port);
    }
    getPort() {
        return this.port;
    }
    onStatusChange(cb) {
        this.statusCallback = cb;
    }
    emitStatus(status, error) {
        this.statusCallback?.({
            status,
            mode: "local",
            error,
        });
    }
}
exports.LocalConnectionProvider = LocalConnectionProvider;
