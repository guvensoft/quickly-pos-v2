import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { SettingsService } from '../services/settings.service';
import { MessageService } from '../services/message.service';

@Injectable({
    providedIn: 'root'
})
export class CanActivateViaAuthGuard implements CanActivate {
    constructor(private authService: AuthService) { }
    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {
        return this.authService.isAuthed(state.url);
    }
}

@Injectable({
    providedIn: 'root'
})
export class AnonymousCanActivate implements CanActivate {
    constructor(private authService: AuthService) { }
    canActivate(): boolean {
        return !this.authService.isAnonymous();
    }
}

@Injectable({
    providedIn: 'root'
})
export class SetupFinished implements CanActivate {
    constructor(private settings: SettingsService) { }
    canActivate(): boolean {
        return true;
    }
}

@Injectable({
    providedIn: 'root'
})
export class DayStarted implements CanActivate {
    constructor(private settings: SettingsService, private messageService: MessageService, private router: Router) { }
    canActivate(): boolean | UrlTree {
        let statusStr = localStorage.getItem('DayStatus');
        if (statusStr) {
            let Status = JSON.parse(statusStr);
            let isStarted: boolean = Status.started;
            if (isStarted == false) {
                this.messageService.sendAlert('Dikkat', 'Lütfen Gün Başlangıcı Yapınız', 'warning');
                return this.router.parseUrl('/endoftheday');
            }
            return isStarted;
        }
        return false;
    }
}
