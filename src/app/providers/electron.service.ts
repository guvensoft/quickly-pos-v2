import { Injectable } from '@angular/core';

// Electron API'yi window.electronAPI üzerinden kullanacağız (preload.ts'de tanımlanmış)
declare global {
  interface Window {
    electronAPI: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  // Angular 21 + Electron 39 için güvenli yapı
  // contextBridge üzerinden erişim sağlanıyor

  isElectron(): boolean {
    return !!(window && window.electronAPI);
  }

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // Not: Electron API'leri artık preload.ts üzerinden expose ediliyor
  // Her fonksiyon window.electronAPI üzerinden çağrılacak
  // ============================================

  // IPC Renderer wrapper
  send(channel: string, ...args: any[]): void {
    if (this.isElectron()) {
      window.electronAPI.send(channel, ...args);
    }
  }

  on(channel: string, func: (...args: any[]) => void): void {
    if (this.isElectron()) {
      window.electronAPI.receive(channel, func);
    }
  }

  // File system operations via IPC
  async saveLogo(data: string): Promise<void> {
    if (this.isElectron()) {
      const base64Data = data.replace(/^data:image\/png;base64,/, '');
      await window.electronAPI.writeFile('data/customer.png', base64Data);
    }
  }

  async backupData(data: any, date: string): Promise<void> {
    if (this.isElectron()) {
      const json = JSON.stringify(data);
      await window.electronAPI.writeFile(`data/backup/${date}`, json);
    }
  }

  async writeFile(path: string, data: string): Promise<void> {
    if (this.isElectron()) {
      await window.electronAPI.writeFile(path, data);
    }
  }

  async readBackupData(filename: string): Promise<any> {
    if (this.isElectron()) {
      const data = await window.electronAPI.readFile(`data/backup/${filename}`);
      return JSON.parse(data);
    }
    throw new Error('Not in Electron environment');
  }

  // Platform bilgisi
  getPlatform(): string {
    if (this.isElectron()) {
      return window.electronAPI.platform;
    }
    return 'unknown';
  }

  // Window operations - Bu fonksiyonlar main process'e IPC ile gönderilmeli
  fullScreen(status: boolean): void {
    if (this.isElectron()) {
      this.send('window:fullscreen', status);
    }
  }

  reloadProgram(): void {
    if (this.isElectron()) {
      this.send('window:reload');
    }
  }

  relaunchProgram(): void {
    if (this.isElectron()) {
      this.send('app:relaunch');
    }
  }

  exitProgram(): void {
    if (this.isElectron()) {
      this.send('app:quit');
    }
  }

  openDevTools(): void {
    if (this.isElectron()) {
      this.send('window:devtools');
    }
  }

  // Network operations
  getLocalIP(): string {
    // Bu fonksiyon main process'ten gelmeli
    // Şimdilik mock data
    return '127.0.0.1';
  }

  // Shell commands - IPC üzerinden
  shellCommand(command: string): void {
    if (this.isElectron()) {
      this.send('shell:command', command);
    }
  }

  shellSpawn(command: string, args?: string[], opts?: any): void {
    if (this.isElectron()) {
      this.send('shell:spawn', command, args, opts);
    }
  }

  // Compatibility methods
  get ipcRenderer() {
    return {
      send: this.send.bind(this),
      on: this.on.bind(this)
    };
  }

  get appRealPath(): string {
    // Bu değer main process'ten gelmeli, şimdilik process.cwd() mock
    return './';
  }

  get appPath(): string {
    return './';
  }
}
