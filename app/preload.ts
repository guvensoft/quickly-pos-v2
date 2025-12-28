import { contextBridge, ipcRenderer } from 'electron';

function shorten(text: unknown, maxLen = 500): string {
  const s = typeof text === 'string' ? text : String(text);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

function sendRendererLog(level: 'log' | 'warn' | 'error', message: string, meta?: any) {
  try {
    ipcRenderer.send('app:renderer-log', {
      level,
      message: shorten(message),
      meta: {
        url: window.location?.href,
        ...(meta ?? {})
      }
    });
  } catch {
    // ignore
  }
}

window.addEventListener('error', (event) => {
  sendRendererLog('error', event.message || 'window.error', {
    filename: (event as any).filename,
    lineno: (event as any).lineno,
    colno: (event as any).colno,
    stack: shorten((event as any).error?.stack, 1200)
  });
});

window.addEventListener('unhandledrejection', (event) => {
  const reason: any = (event as any).reason;
  sendRendererLog('error', 'unhandledrejection', {
    reason: shorten(typeof reason === 'string' ? reason : (reason?.message ?? String(reason))),
    stack: shorten(reason?.stack, 1200)
  });
});

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
