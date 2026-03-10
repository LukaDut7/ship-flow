"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Expose a safe API to the renderer via contextBridge.
// All IPC channels are explicitly allowlisted.
const ALLOWED_SEND_CHANNELS = [
    "sync:trigger",
    "folder:pick",
    "app:quit",
    "ssh:connect",
    "ssh:disconnect",
    "ssh:connect-local",
    "ssh:passphrase-response",
];
const ALLOWED_INVOKE_CHANNELS = [
    "sync:status",
    "sync:trigger",
    "folder:pick",
    "mirror:status",
    "app:getVersion",
    "app:getDataDir",
    "keychain:get",
    "keychain:set",
    "keychain:delete",
    "ssh:status",
    "ssh:list-connections",
    "ssh:save-connection",
    "ssh:delete-connection",
    "ssh:test-connection",
    "ssh:browse-key",
];
const ALLOWED_RECEIVE_CHANNELS = [
    "sync:progress",
    "sync:complete",
    "sync:error",
    "mirror:sync-complete",
    "mirror:file-changed",
    "mirror:error",
    "update:available",
    "update:downloaded",
    "ssh:status-changed",
    "ssh:deploy-progress",
    "ssh:error",
];
electron_1.contextBridge.exposeInMainWorld("shipflow", {
    // One-way messages to main process
    send(channel, ...args) {
        if (ALLOWED_SEND_CHANNELS.includes(channel)) {
            electron_1.ipcRenderer.send(channel, ...args);
        }
    },
    // Request-response to main process
    invoke(channel, ...args) {
        if (ALLOWED_INVOKE_CHANNELS.includes(channel)) {
            return electron_1.ipcRenderer.invoke(channel, ...args);
        }
        return Promise.reject(new Error(`Channel not allowed: ${channel}`));
    },
    // Listen for messages from main process
    on(channel, callback) {
        if (ALLOWED_RECEIVE_CHANNELS.includes(channel)) {
            const handler = (_event, ...args) => callback(...args);
            electron_1.ipcRenderer.on(channel, handler);
            return () => electron_1.ipcRenderer.removeListener(channel, handler);
        }
        return () => { };
    },
    // Platform info
    platform: process.platform,
    isDesktop: true,
});
