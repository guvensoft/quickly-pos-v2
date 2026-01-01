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
  writeFile: async (filePath: string, data: string) => {
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron').remote || require('electron');

    // Resolve path to userData directory if relative
    let fullPath = filePath;
    if (!path.isAbsolute(filePath)) {
      const userDataPath = app?.getPath('userData') || process.cwd();
      fullPath = path.join(userDataPath, filePath);
    }

    // Create directory if it doesn't exist
    const dir = path.dirname(fullPath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write file with base64 handling if needed
    if (data.startsWith('data:') && data.includes('base64,')) {
      const base64Data = data.replace(/^data:[^;]+;base64,/, '');
      await fs.promises.writeFile(fullPath, Buffer.from(base64Data, 'base64'));
    } else {
      await fs.promises.writeFile(fullPath, data);
    }
  },
  readFile: async (filePath: string) => {
    const fs = require('fs');
    const path = require('path');
    const { app } = require('electron').remote || require('electron');

    // Resolve path to userData directory if relative
    let fullPath = filePath;
    if (!path.isAbsolute(filePath)) {
      const userDataPath = app?.getPath('userData') || process.cwd();
      fullPath = path.join(userDataPath, filePath);
    }

    try {
      return await fs.promises.readFile(fullPath, 'utf8');
    } catch (error) {
      // Return empty string if file not found instead of throwing
      if ((error as any).code === 'ENOENT') {
        return '';
      }
      throw error;
    }
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
