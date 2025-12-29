import { app, BrowserWindow, screen, session, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let win: BrowserWindow | null = null;
const args = process.argv.slice(1),
  serve = args.some(val => val === '--serve');

type LogLevel = 'log' | 'warn' | 'error';

let logFilePath: string | null = null;
function getLogFilePath(): string {
  if (logFilePath) return logFilePath;

  const fileName = 'quickly-pos.log';
  const preferred = path.join(process.cwd(), fileName);
  try {
    fs.appendFileSync(preferred, '');
    logFilePath = preferred;
    return logFilePath;
  } catch {
    if (app.isReady()) {
      logFilePath = path.join(app.getPath('userData'), fileName);
      return logFilePath;
    }
    // app hazır değilken userData erişimi güvenli olmayabilir; bir sonraki log denemesinde tekrar denenecek.
    return preferred;
  }
}

function shorten(text: unknown, maxLen = 800): string {
  const s = typeof text === 'string' ? text : String(text);
  if (s.length <= maxLen) return s;
  return `${s.slice(0, maxLen)}…`;
}

function sanitizeMeta(meta: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
  if (!meta) return undefined;
  const cloned: Record<string, unknown> = { ...meta };

  if (typeof cloned.stack === 'string') cloned.stack = shorten(cloned.stack, 1200);
  if (typeof cloned.reason === 'string') cloned.reason = shorten(cloned.reason, 800);
  if (typeof cloned.url === 'string') cloned.url = shorten(cloned.url, 300);

  return cloned;
}

function appendLog(level: LogLevel, message: string, meta?: Record<string, unknown>) {
  const filePath = getLogFilePath();
  const ts = new Date().toISOString();
  const safeMeta = sanitizeMeta(meta);
  const metaText = safeMeta ? ` ${JSON.stringify(safeMeta)}` : '';
  try {
    fs.appendFileSync(filePath, `[${ts}] [${level}] ${shorten(message)}${metaText}\n`, { encoding: 'utf8' });
  } catch {
    // ignore (avoid recursive logging)
  }
}

function hookProcessLogging() {
  const original = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args: any[]) => {
    original.log(...args);
  };
  console.warn = (...args: any[]) => {
    original.warn(...args);
  };
  console.error = (...args: any[]) => {
    appendLog('error', args.map(String).join(' '));
    original.error(...args);
  };

  process.on('uncaughtException', (err) => {
    appendLog('error', 'uncaughtException', { message: err?.message, stack: err?.stack });
  });
  process.on('unhandledRejection', (reason: any) => {
    appendLog('error', 'unhandledRejection', { reason: String(reason) });
  });
}

function createWindow(): BrowserWindow {

  const size = screen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false,
      webSecurity: false,
      allowRunningInsecureContent: serve,
      preload: path.join(__dirname, 'preload.js')
    },
  });

  // Bypass CORS - Handle both preflight and actual requests
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    callback({
      requestHeaders: {
        ...details.requestHeaders,
        'Origin': 'http://localhost:4200'
      }
    });
  });

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Access-Control-Allow-Origin': ['*'],
        'Access-Control-Allow-Headers': ['*'],
        'Access-Control-Allow-Methods': ['GET, POST, PUT, DELETE, OPTIONS'],
        'Access-Control-Allow-Credentials': ['true']
      }
    });
  });

  if (serve) {
    // Open DevTools in development mode
    win.webContents.openDevTools();

    import('electron-debug').then(debug => {
      debug.default({ isEnabled: true, showDevTools: false }); // Already opened above
    });

    import('electron-reloader').then(reloader => {
      const reloaderFn = (reloader as any).default || reloader;
      reloaderFn(module);
    });
    win.loadURL('http://localhost:4200');
  } else {
    // Path when running electron executable
    let pathIndex = './browser/index.html';

    if (fs.existsSync(path.join(__dirname, '../dist/browser/index.html'))) {
      // Path when running electron in local folder
      pathIndex = '../dist/browser/index.html';
    }

    const fullPath = path.join(__dirname, pathIndex);
    const url = `file://${path.resolve(fullPath).replace(/\\/g, '/')}`;
    win.loadURL(url);
  }

  win.webContents.on('console-message', (_event, level, message, line, sourceId) => {
    if (typeof sourceId === 'string' && sourceId.startsWith('devtools://')) return;
    if (typeof message === 'string' &&
      message.includes('Request Autofill.') &&
      message.includes("wasn't found")) return;
    const url = win?.webContents.getURL();
    const mapped: LogLevel = level === 2 ? 'warn' : level === 3 ? 'error' : 'log';
    if (mapped === 'error') {
      appendLog('error', message, { source: 'renderer', url, line, sourceId });
    }
  });

  win.webContents.on('render-process-gone', (_event, details) => {
    const url = win?.webContents.getURL();
    appendLog('error', '[render-process-gone]', { ...details, url });
  });

  // Open DevTools automatically on startup (dev only)
  win.webContents.on('did-finish-load', () => {
    if (serve) win?.webContents.openDevTools();
  });

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });

  return win;
}

try {
  hookProcessLogging();

  ipcMain.on('app:renderer-log', (_event, payload: { level: LogLevel; message: string; meta?: any }) => {
    if (!payload || typeof payload.message !== 'string') return;
    if ((payload.level ?? 'log') !== 'error') return;
    appendLog('error', payload.message, { source: 'renderer', ...(payload.meta ?? {}) });
  });

  ipcMain.on('window:reload', () => {
    if (win) win.reload();
  });

  ipcMain.on('window:fullscreen', (event, flag) => {
    if (win) win.setFullScreen(flag);
  });

  ipcMain.on('window:devtools', () => {
    if (win) win.webContents.openDevTools();
  });

  ipcMain.on('app:relaunch', () => {
    app.relaunch();
    app.exit(0);
  });

  ipcMain.on('app:quit', () => {
    app.quit();
  });

  ipcMain.on('closeServer', () => {
    // Implement server closing logic if needed
    // For now logging it
    console.log('Close server requested');
  });

  // Ignore certificate errors for development
  app.commandLine.appendSwitch('ignore-certificate-errors');

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  // Added 400 ms to fix the black background issue while using transparent window. More detais at https://github.com/electron/electron/issues/15947
  app.on('ready', () => setTimeout(createWindow, 400));

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });

} catch (e) {
  // Catch Error
  // throw e;
}
