import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  writeFile: async (path: string, data: string) => {
    const fs = require('fs');
    return fs.promises.writeFile(path, data);
  },
  readFile: async (path: string) => {
    const fs = require('fs');
    return fs.promises.readFile(path, 'utf8');
  },
  send: (channel: string, ...args: any[]) => {
    const validChannels = [
      'printTest', 'printOrder', 'printTableOrder', 'printCheck',
      'printPayment', 'printEndDay', 'printReport', 'printCancel',
      'printQRcode', 'kickCashdraw', 'toMain',
      'window:fullscreen', 'window:reload', 'window:devtools',
      'app:relaunch', 'app:quit',
      'shell:command', 'shell:spawn', 'appServer', 'closeServer'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    } else {
      console.warn(`Blocked sending channel: ${channel}`);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = [
      'fromMain', 'error', 'print-success', 'print-error'
    ];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  }
});
