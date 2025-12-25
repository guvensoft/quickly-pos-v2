import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  send: (channel: string, ...args: any[]) => {
    const validChannels = [
      'printTest', 'printOrder', 'printTableOrder', 'printCheck',
      'printPayment', 'printEndDay', 'printReport', 'printCancel',
      'printQRcode', 'kickCashdraw', 'toMain'
    ];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  },
  receive: (channel: string, func: (...args: any[]) => void) => {
    const validChannels = ['fromMain', 'error', 'print-success', 'print-error'];
    if (validChannels.includes(channel)) {
      // Deliberately strip event as it includes `sender` 
      ipcRenderer.on(channel, (_event, ...args) => func(...args));
    }
  }
});
