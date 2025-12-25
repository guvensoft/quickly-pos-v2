import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { MessageService } from '../../core/services/message.service';
import { AuthService } from '../../core/services/auth.service';
import { SettingsService } from '../../core/services/settings.service';

// ============================================
// Modern Angular 21 Guard Functions
// İş Mantığı - %100 AYNEN KORUNDU
// ============================================

export const CanActivateViaAuthGuard: CanActivateFn = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
): Promise<boolean> | boolean => {
    const authService = inject(AuthService);
    const result = authService.isAuthed(state.url);
    if (result instanceof Promise) {
        return result;
    }
    return result !== undefined ? result : false;
};

export const AnonymousCanActivate: CanActivateFn = (): boolean => {
    const authService = inject(AuthService);
    return !authService.isAnonymous();
};

export const SetupFinished: CanActivateFn = (): boolean => {
    const settings = inject(SettingsService);
    return true;
};

export const DayStarted: CanActivateFn = (): boolean => {
    const settings = inject(SettingsService);
    const messageService = inject(MessageService);
    const router = inject(Router);

    const StatusStr = localStorage.getItem('DayStatus');
    if (!StatusStr) {
        messageService.sendAlert('Dikkat', 'Lütfen Gün Başlangıcı Yapınız', 'warning');
        router.navigate(['/endoftheday']);
        return false;
    }

    const Status = JSON.parse(StatusStr);
    const isStarted: boolean = Status.started;

    if (isStarted == false) {
        messageService.sendAlert('Dikkat', 'Lütfen Gün Başlangıcı Yapınız', 'warning');
        router.navigate(['/endoftheday']);
    }

    return isStarted;
};
