import { contextBridge, ipcRenderer } from "electron"

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
] as const

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
] as const

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
] as const

type SendChannel = (typeof ALLOWED_SEND_CHANNELS)[number]
type InvokeChannel = (typeof ALLOWED_INVOKE_CHANNELS)[number]
type ReceiveChannel = (typeof ALLOWED_RECEIVE_CHANNELS)[number]

contextBridge.exposeInMainWorld("shipflow", {
  // One-way messages to main process
  send(channel: SendChannel, ...args: unknown[]) {
    if ((ALLOWED_SEND_CHANNELS as readonly string[]).includes(channel)) {
      ipcRenderer.send(channel, ...args)
    }
  },

  // Request-response to main process
  invoke(channel: InvokeChannel, ...args: unknown[]): Promise<unknown> {
    if ((ALLOWED_INVOKE_CHANNELS as readonly string[]).includes(channel)) {
      return ipcRenderer.invoke(channel, ...args)
    }
    return Promise.reject(new Error(`Channel not allowed: ${channel}`))
  },

  // Listen for messages from main process
  on(channel: ReceiveChannel, callback: (...args: unknown[]) => void) {
    if ((ALLOWED_RECEIVE_CHANNELS as readonly string[]).includes(channel)) {
      const handler = (_event: Electron.IpcRendererEvent, ...args: unknown[]) =>
        callback(...args)
      ipcRenderer.on(channel, handler)
      return () => ipcRenderer.removeListener(channel, handler)
    }
    return () => {}
  },

  // Platform info
  platform: process.platform,
  isDesktop: true,
})
