import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  ipcRenderer: any;
  appPath: string = '';
  appRealPath: string = '';

  constructor() {
    if (this.isElectron) {
      this.ipcRenderer = {
        send: (channel: string, ...args: any[]) => {
          (window as any).electronAPI.send(channel, ...args);
        },
        on: (channel: string, listener: (...args: any[]) => void) => {
          (window as any).electronAPI.receive(channel, listener);
        }
      };
      // Mocking properties used in old service.
      // These usually come from 'remote' which is not available.
      // We should eventually fetch paths via IPC from Main.
      // For now, empty strings, but this might break things relying on path concatenation.
      // 'appPath' and 'appRealPath' need to be requested from Main.

      // We can't block constructor. We assume they are available or we refactor logic to be async.
      // Old code: this.appPath = this.app.getAppPath();
      // Old code: this.appRealPath = window.process.cwd();
    }
  }

  get isElectron(): boolean {
    return !!(window && window.navigator && (window.navigator.userAgent.toLowerCase().indexOf(' electron/') > -1));
  }

  // Method to request paths if needed, but for now we leave properties.
}
