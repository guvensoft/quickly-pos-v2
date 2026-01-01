"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
function shorten(text, maxLen = 500) {
    const s = typeof text === 'string' ? text : String(text);
    if (s.length <= maxLen)
        return s;
    return `${s.slice(0, maxLen)}…`;
}
function sendRendererLog(level, message, meta) {
    var _a;
    try {
        electron_1.ipcRenderer.send('app:renderer-log', {
            level,
            message: shorten(message),
            meta: Object.assign({ url: (_a = window.location) === null || _a === void 0 ? void 0 : _a.href }, (meta !== null && meta !== void 0 ? meta : {}))
        });
    }
    catch (_b) {
        // ignore
    }
}
window.addEventListener('error', (event) => {
    var _a;
    sendRendererLog('error', event.message || 'window.error', {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: shorten((_a = event.error) === null || _a === void 0 ? void 0 : _a.stack, 1200)
    });
});
window.addEventListener('unhandledrejection', (event) => {
    var _a;
    const reason = event.reason;
    sendRendererLog('error', 'unhandledrejection', {
        reason: shorten(typeof reason === 'string' ? reason : ((_a = reason === null || reason === void 0 ? void 0 : reason.message) !== null && _a !== void 0 ? _a : String(reason))),
        stack: shorten(reason === null || reason === void 0 ? void 0 : reason.stack, 1200)
    });
});
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    writeFile: (filePath, data) => __awaiter(void 0, void 0, void 0, function* () {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron').remote || require('electron');
        // Resolve path to userData directory if relative
        let fullPath = filePath;
        if (!path.isAbsolute(filePath)) {
            const userDataPath = (app === null || app === void 0 ? void 0 : app.getPath('userData')) || process.cwd();
            fullPath = path.join(userDataPath, filePath);
        }
        // Create directory if it doesn't exist
        const dir = path.dirname(fullPath);
        yield fs.promises.mkdir(dir, { recursive: true });
        // Write file with base64 handling if needed
        if (data.startsWith('data:') && data.includes('base64,')) {
            const base64Data = data.replace(/^data:[^;]+;base64,/, '');
            yield fs.promises.writeFile(fullPath, Buffer.from(base64Data, 'base64'));
        }
        else {
            yield fs.promises.writeFile(fullPath, data);
        }
    }),
    readFile: (filePath) => __awaiter(void 0, void 0, void 0, function* () {
        const fs = require('fs');
        const path = require('path');
        const { app } = require('electron').remote || require('electron');
        // Resolve path to userData directory if relative
        let fullPath = filePath;
        if (!path.isAbsolute(filePath)) {
            const userDataPath = (app === null || app === void 0 ? void 0 : app.getPath('userData')) || process.cwd();
            fullPath = path.join(userDataPath, filePath);
        }
        try {
            return yield fs.promises.readFile(fullPath, 'utf8');
        }
        catch (error) {
            // Return empty string if file not found instead of throwing
            if (error.code === 'ENOENT') {
                return '';
            }
            throw error;
        }
    }),
    send: (channel, ...args) => {
        const validChannels = [
            'printTest', 'printOrder', 'printTableOrder', 'printCheck',
            'printPayment', 'printEndDay', 'printReport', 'printCancel',
            'printQRcode', 'kickCashdraw', 'toMain',
            'window:fullscreen', 'window:reload', 'window:devtools',
            'app:relaunch', 'app:quit',
            'shell:command', 'shell:spawn', 'appServer', 'closeServer'
        ];
        if (validChannels.includes(channel)) {
            electron_1.ipcRenderer.send(channel, ...args);
        }
        else {
            console.warn(`Blocked sending channel: ${channel}`);
        }
    },
    receive: (channel, func) => {
        const validChannels = [
            'fromMain', 'error', 'print-success', 'print-error'
        ];
        if (validChannels.includes(channel)) {
            // Deliberately strip event as it includes `sender` 
            electron_1.ipcRenderer.on(channel, (_event, ...args) => func(...args));
        }
    }
});
//# sourceMappingURL=preload.js.map