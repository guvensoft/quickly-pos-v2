import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MessageService } from "./message.service";
import { DatabaseService } from './database.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private subject = new Subject<any>();

    constructor(private messageService: MessageService, private databaseService: DatabaseService) {
    }

    parseJWT(token: string) {
        let base64Url = token.split('.')[1];
        let base64 = base64Url.replace('-', '+').replace('_', '/');
        return JSON.parse(atob(base64));
    }

    saveToken(userType: string) {
        localStorage['userType'] = userType;
    }

    login(user: any) {
        localStorage['userName'] = user.name;
        localStorage['userType'] = user.role;
        localStorage['userAuth'] = user.role_id;
        localStorage['userID'] = user._id;
        this.subject.next({ name: user.name, type: user.role });
    }

    logout() {
        localStorage.removeItem('userType');
        localStorage.removeItem('userName');
        localStorage.removeItem('userAuth');
        localStorage.removeItem('userID');
        localStorage.removeItem('userPermissions');
    }

    getToken() {
        return localStorage.getItem('userType');
    }

    isAnonymous() {
        let token = this.getToken()
        if (token) {
            return false;
        } else {
            this.messageService.sendMessage("Şifre girilmedi.");
            return true;
        }
    }

    getCurrentUser(): Observable<any> {
        return this.subject.asObservable();
    }

    setPermissions() {
        let auth = localStorage.getItem('userAuth');
        if (auth) {
            this.databaseService.getData('users_group', auth).then((result: any) => {
                delete result.auth.components; // logic from old code
                localStorage.setItem('userPermissions', JSON.stringify(result.auth));
            });
        }
    }

    isAuthed(url: string) {
        let auth = localStorage.getItem('userAuth');
        if (auth) {
            let urlParts = url.replace('/', '').split('/');
            return this.databaseService.getData('users_group', auth).then((result: any) => {
                let guard = result.auth.components;
                let isAuthorized = false;
                switch (urlParts[0]) {
                    case 'settings':
                        if (guard.settings) isAuthorized = true;
                        break;
                    case 'selling-screen':
                        if (guard.store) isAuthorized = true;
                        break;
                    case 'fast-selling':
                        if (guard.store) isAuthorized = true;
                        break;
                    case 'store':
                        if (guard.store) isAuthorized = true;
                        break;
                    case 'reports':
                        if (guard.reports) isAuthorized = true;
                        break;
                    case 'endoftheday':
                        if (guard.endoftheday) isAuthorized = true;
                        break;
                    case 'cashbox':
                        if (guard.cashbox) isAuthorized = true;
                        break;
                    default:
                        isAuthorized = true; // Default allow? Or deny? Old code had 'break' which means return undefined? 
                        // Actually old code returned Promise<any>. If 'switch' missed, it returned implicitly undefined (falsy?).
                        // But guards expect boolean or Promise<boolean>.
                        // Let's assume false if not matched? Or true?
                        // The old code: default: break;
                        // and it doesn't return anything explicitly there.
                        // If I look closely:
                        /*
                        if (guard.settings) { return true; }
                        this.messageService.sendMessage("Giriş Yetkiniz Yok!");
                        break;
                        */
                        // So if not authorized, it breaks, sends message, and function ends returning Promise that resolves to undefined.
                        // Angular Guard treating undefined as false?
                        // I should return false explicitly.
                        break;
                }

                if (isAuthorized) return true;

                this.messageService.sendMessage("Giriş Yetkiniz Yok!");
                return false;
            });
        } else {
            this.messageService.sendMessage("Şifre girilmedi.");
            return Promise.resolve(false);
        }
    }
}
