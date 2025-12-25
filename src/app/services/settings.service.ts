import { Injectable, inject } from '@angular/core';
import { Subject } from 'rxjs';
import { Settings } from '../mocks/settings';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private mainService = inject(MainService);

  Settings!: Array<Settings>;
  AppInformation: Subject<Settings> = new Subject<Settings>();
  AppSettings: Subject<Settings> = new Subject<Settings>();
  AuthInfo: Subject<Settings> = new Subject<Settings>();
  ActivationStatus: Subject<Settings> = new Subject<Settings>();
  RestaurantInfo: Subject<Settings> = new Subject<Settings>();
  Printers: Subject<Settings> = new Subject<Settings>();
  ServerSettings: Subject<Settings> = new Subject<Settings>();
  DateSettings: Subject<Settings> = new Subject<Settings>();

  constructor() {
    // Constructor'da mainService kullanımı - İş mantığı AYNEN
    this.mainService.getAllBy('settings', {}).then((res) => {
      this.Settings = res.docs;

      const appSettings = this.Settings.find((setting) => setting.key == 'AppSettings');
      if (appSettings) this.AppSettings.next(appSettings);

      const authInfo = this.Settings.find((setting) => setting.key == 'AuthInfo');
      if (authInfo) this.AuthInfo.next(authInfo);

      const activationStatus = this.Settings.find((setting) => setting.key == 'ActivationStatus');
      if (activationStatus) this.ActivationStatus.next(activationStatus);

      const appInformation = this.Settings.find((setting) => setting.key == 'AppInformation');
      if (appInformation) this.AppInformation.next(appInformation);

      const restaurantInfo = this.Settings.find((setting) => setting.key == 'RestaurantInfo');
      if (restaurantInfo) this.RestaurantInfo.next(restaurantInfo);

      const printers = this.Settings.find((setting) => setting.key == 'Printers');
      if (printers) this.Printers.next(printers);

      const dateSettings = this.Settings.find((setting) => setting.key == 'DateSettings');
      if (dateSettings) this.DateSettings.next(dateSettings);

      let appType = localStorage.getItem('AppType');
      switch (appType) {
        case 'Primary': {
          const serverSettings = this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 0);
          if (serverSettings) this.ServerSettings.next(serverSettings);
          break;
        }
        case 'Secondary': {
          const serverSettings = this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 1);
          if (serverSettings) this.ServerSettings.next(serverSettings);
          break;
        }
        default:
          break;
      }
    }).catch(err => {
      console.log('SettingsService: Ayarlar yüklenemedi (İlk kurulum olabilir)', err);
    });
  }

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  getUser(value: string): string | null {
    let result: string | null = null;
    switch (value) {
      case 'id':
        result = localStorage.getItem('userID');
        break;
      case 'auth':
        result = localStorage.getItem('userAuth');
        break;
      case 'type':
        result = localStorage.getItem('userType');
        break;
      case 'name':
        result = localStorage.getItem('userName');
        break;
      default:
        break;
    }
    return result;
  }

  setLocalStorage(): void {
    this.DateSettings.subscribe(res => {
      if (res) {
        localStorage.setItem('DayStatus', JSON.stringify(res.value));
      }
    });
  }

  setAppSettings(Key: string, SettingsData: any): Promise<any> {
    let AppSettings = new Settings(Key, SettingsData, Key, Date.now());
    return this.mainService.getAllBy('settings', { key: Key }).then(res => {
      return this.mainService.updateData('settings', res.docs[0]._id, AppSettings);
    });
  }

  getPrinters() {
    return this.Printers.asObservable();
  }

  addPrinter(printerData: any): void {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      if (res.docs.length > 0) {
        res.docs[0].value.push(printerData);
        this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
        this.Printers.next(res.docs[0]);
      } else {
        let printerSettings = new Settings('Printers', [printerData], 'Yazıcılar', Date.now());
        this.mainService.addData('settings', printerSettings);
        this.Printers.next(printerSettings);
      }
    });
  }

  updatePrinter(newPrinter: any, oldPrinter: any): void {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      res.docs[0].value = res.docs[0].value.filter((obj: any) => obj.name !== oldPrinter.name);
      res.docs[0].value.push(newPrinter);
      this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
      this.Printers.next(res.docs[0]);
    });
  }

  removePrinter(printer: any): void {
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(res => {
      res.docs[0].value = res.docs[0].value.filter((obj: any) => obj.name !== printer.name);
      this.mainService.updateData('settings', res.docs[0]._id, res.docs[0]);
      this.Printers.next(res.docs[0]);
    });
  }

  getDate() {
    return this.DateSettings.asObservable();
  }

  getActivationStatus() {
    return this.ActivationStatus.asObservable();
  }

  getAppSettings() {
    return this.AppSettings.asObservable();
  }
}
