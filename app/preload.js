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
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    platform: process.platform,
    writeFile: (path, data) => __awaiter(void 0, void 0, void 0, function* () {
        const fs = require('fs');
        return fs.promises.writeFile(path, data);
    }),
    readFile: (path) => __awaiter(void 0, void 0, void 0, function* () {
        const fs = require('fs');
        return fs.promises.readFile(path, 'utf8');
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