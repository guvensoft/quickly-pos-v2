import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from '../../core/services/message.service';
import { SettingsService } from './settings.service';

// jQuery type declaration for modal operations
declare var $: any;

@Injectable({
  providedIn: 'root'
})
export class ApplicationService {
  private settings = inject(SettingsService);
  private messageService = inject(MessageService);
  private router = inject(Router);

  appLockTime!: number;
  appDayStatus!: object;
  appWeekStatus!: object;
  appConnectionStatus!: boolean;
  appActivationStatus!: boolean;
  countDown: any;
  timer!: number;

  constructor() {
    // İş mantığı AYNEN korundu
    this.settings.AppSettings.subscribe((data) => {
      if (data) {
        this.appLockTime = data.value.timeout;
        this.screenLock('start');
      }
    });
  }

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  isActive(): void {
    this.settings.ActivationStatus.subscribe(res => {
      if (res.value) {
        console.log('İşletme Hesabı Aktif.');
      } else {
        console.warn('İşletme Hesabı Aktif Değil.');
        this.router.navigate(['/setup']);
      }
    });
  }

  connectionStatus(): boolean {
    if (navigator.onLine) {
      return true;
    } else {
      return false;
    }
  }

  screenLock(command: string): void {
    switch (command) {
      case 'start':
        this.timer = this.appLockTime;
        this.countDown = setInterval(() => {
          if (this.timer == 0) {
            if (
              this.router.url === '/' ||
              this.router.url.match('payment') ||
              this.router.url === '/endoftheday' ||
              this.router.url === '/endoftheday_no_guard' ||
              this.router.url === '/activation' ||
              this.router.url === '/settings' ||
              this.router.url === '/reports' ||
              this.router.url === '/setup' ||
              this.router.url === '/admin'
            ) {
              this.timer = this.appLockTime;
            } else {
              this.timer = this.appLockTime;
              if ($('body').hasClass('modal-open')) {
                $('*').modal('hide');
              }
              this.router.navigate(['']);
              this.messageService.sendMessage('Zaman aşımına uğrandı.');
            }
          }
          this.timer--;
        }, 1000);
        break;
      case 'reset':
        this.timer = this.appLockTime;
        break;
      case 'stop':
        clearInterval(this.countDown);
        break;
      default:
        break;
    }
  }
}
