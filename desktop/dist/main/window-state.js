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
exports.loadWindowState = loadWindowState;
exports.saveWindowState = saveWindowState;
const electron_1 = require("electron");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const STATE_FILE = "window-state.json";
function getStatePath() {
    return path.join(electron_1.app.getPath("userData"), STATE_FILE);
}
function loadWindowState() {
    const defaults = {
        x: 0,
        y: 0,
        width: 1280,
        height: 800,
        maximized: false,
    };
    try {
        const data = fs.readFileSync(getStatePath(), "utf-8");
        const state = JSON.parse(data);
        // Validate that the window is on a visible screen
        const displays = electron_1.screen.getAllDisplays();
        const isOnScreen = displays.some((display) => {
            const bounds = display.bounds;
            return (state.x >= bounds.x &&
                state.y >= bounds.y &&
                state.x + state.width <= bounds.x + bounds.width &&
                state.y + state.height <= bounds.y + bounds.height);
        });
        if (isOnScreen) {
            return state;
        }
    }
    catch {
        // File doesn't exist or is corrupted
    }
    // Center on primary display
    const primaryDisplay = electron_1.screen.getPrimaryDisplay();
    defaults.x = Math.round(primaryDisplay.bounds.x + (primaryDisplay.bounds.width - defaults.width) / 2);
    defaults.y = Math.round(primaryDisplay.bounds.y + (primaryDisplay.bounds.height - defaults.height) / 2);
    return defaults;
}
function saveWindowState(win) {
    if (win.isDestroyed())
        return;
    const maximized = win.isMaximized();
    const bounds = maximized ? win.getNormalBounds() : win.getBounds();
    const state = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        maximized,
    };
    try {
        fs.writeFileSync(getStatePath(), JSON.stringify(state));
    }
    catch {
        // Ignore write errors
    }
}
