import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { Settings } from '../models/settings.model';
import { DatabaseService } from './database.service';

@Injectable({
    providedIn: 'root'
})
export class SettingsService {
    Settings: Array<Settings> = [];
    AppInformation: Subject<Settings> = new Subject<Settings>();
    AppSettings: Subject<Settings> = new Subject<Settings>();
    AuthInfo: Subject<Settings> = new Subject<Settings>();
    ActivationStatus: Subject<Settings> = new Subject<Settings>();
    RestaurantInfo: Subject<Settings> = new Subject<Settings>();
    Printers: Subject<Settings> = new Subject<Settings>();
    ServerSettings: Subject<Settings> = new Subject<Settings>();
    DateSettings: Subject<Settings> = new Subject<Settings>();

    constructor(private databaseService: DatabaseService) {
        this.initSettings();
    }

    initSettings() {
        this.databaseService.getAllBy('settings', {}).then((res: any) => {
            this.Settings = res.docs;

            const findSetting = (key: string) => this.Settings.find((setting) => setting.key == key);

            const appSettings = findSetting('AppSettings');
            if (appSettings) this.AppSettings.next(appSettings);

            const authInfo = findSetting('AuthInfo');
            if (authInfo) this.AuthInfo.next(authInfo);

            const activationStatus = findSetting('ActivationStatus');
            if (activationStatus) this.ActivationStatus.next(activationStatus);

            const appInformation = findSetting('AppInformation');
            if (appInformation) this.AppInformation.next(appInformation);

            const restaurantInfo = findSetting('RestaurantInfo');
            if (restaurantInfo) this.RestaurantInfo.next(restaurantInfo);

            const printers = findSetting('Printers');
            if (printers) this.Printers.next(printers);

            const dateSettings = findSetting('DateSettings');
            if (dateSettings) this.DateSettings.next(dateSettings);

            let appType = localStorage.getItem('AppType');
            if (appType) {
                switch (appType) {
                    case 'Primary':
                        const primarySettings = this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 0);
                        if (primarySettings) this.ServerSettings.next(primarySettings);
                        break;
                    case 'Secondary':
                        const secondarySettings = this.Settings.find((setting) => setting.key == 'ServerSettings' && setting.value.type == 1);
                        if (secondarySettings) this.ServerSettings.next(secondarySettings);
                        break; // Added break
                    default:
                        break;
                }
            }
        }).catch(err => console.error("SettingsService Init Error", err));
    }

    getUser(value: string) {
        let result;
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

    getUserName() {
        return this.getUser('name');
    }

    setLocalStorage() {
        this.DateSettings.subscribe(res => {
            if (res) {
                localStorage.setItem('DayStatus', JSON.stringify(res.value));
            }
        });
    }

    setAppSettings(Key: string, SettingsData: any) {
        let AppSettings = new Settings(Key, SettingsData, Key, Date.now());
        return this.databaseService.getAllBy('settings', { key: Key }).then((res: any) => {
            if (res.docs && res.docs.length > 0) {
                return this.databaseService.updateData('settings', res.docs[0]._id, AppSettings);
            } else {
                return this.databaseService.addData('settings', AppSettings);
            }
        });
    }

    getPrinters() {
        return this.Printers.asObservable();
    }

    addPrinter(printerData: any) {
        this.databaseService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
            if (res.docs.length > 0) {
                res.docs[0].value.push(printerData);
                this.databaseService.updateData('settings', res.docs[0]._id, res.docs[0]);
                this.Printers.next(res.docs[0]);
            } else {
                let printerSettings = new Settings('Printers', [printerData], 'Yazıcılar', Date.now());
                this.databaseService.addData('settings', printerSettings);
                this.Printers.next(printerSettings);
            }
        });
    }

    updatePrinter(newPrinter: any, oldPrinter: any) {
        this.databaseService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
            res.docs[0].value = res.docs[0].value.filter((obj: any) => obj.name !== oldPrinter.name);
            res.docs[0].value.push(newPrinter);
            this.databaseService.updateData('settings', res.docs[0]._id, res.docs[0]);
            this.Printers.next(res.docs[0]);
        });
    }

    removePrinter(printer: any) {
        this.databaseService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
            res.docs[0].value = res.docs[0].value.filter((obj: any) => obj.name !== printer.name);
            this.databaseService.updateData('settings', res.docs[0]._id, res.docs[0]);
            this.Printers.next(res.docs[0]);
        });
    }

    getDate() {
        return this.DateSettings.asObservable(); // Added return
    }

    getActivationStatus() {
        return this.ActivationStatus.asObservable();
    }

    getAppSettings() {
        return this.AppSettings.asObservable();
    }
}
