import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { MessageService } from './message.service';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private messageService = inject(MessageService);
  private mainService = inject(MainService);

  private subject = new Subject<any>();

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  parseJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length < 2) {
        throw new Error('Invalid JWT format');
      }
      const base64Url = parts[1];
      const base64 = base64Url.replace('-', '+').replace('_', '/');
      return JSON.parse(atob(base64));
    } catch (error) {
      console.error('AuthService: Error parsing JWT', error);
      return null;
    }
  }

  saveToken(userType: string): void {
    localStorage.setItem('userType', userType);
  }

  login(user: any): void {
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userType', user.role);
    localStorage.setItem('userAuth', user.role_id);
    localStorage.setItem('userID', user._id);
    this.subject.next({ name: user.name, type: user.role });
  }

  logout(): void {
    localStorage.removeItem('userType');
    localStorage.removeItem('userName');
    localStorage.removeItem('userAuth');
    localStorage.removeItem('userID');
    localStorage.removeItem('userPermissions');
  }

  getToken(): string | null {
    return localStorage.getItem('userType');
  }

  isAnonymous(): boolean {
    const token = this.getToken();
    if (token) {
      return false;
    } else {
      this.messageService.sendMessage('Şifre girilmedi.');
      return true;
    }
  }

  getCurrentUser(): Observable<any> {
    return this.subject.asObservable();
  }

  setPermissions(): Promise<void> {
    const auth = localStorage.getItem('userAuth');
    if (auth) {
      return this.mainService.getData('users_group', auth).then(result => {
        if (result && result.auth) {
          delete result.auth.components;
          localStorage.setItem('userPermissions', JSON.stringify(result.auth));
        }
      }).catch(err => {
        console.error('AuthService: Error setting permissions', err);
      });
    }
    return Promise.resolve();
  }

  isAuthed(url: string): Promise<boolean> | undefined {
    const auth = localStorage.getItem('userAuth');
    console.log('AuthService: checking auth for', url);
    if (auth) {
      // Handle URLs starting with / or not
      const segments = url.split('/').filter(s => s.length > 0);
      const mainSegment = segments[0];

      console.log('AuthService: main segment', mainSegment);

      return this.mainService.getData('users_group', auth).then(result => {
        if (!result || !result.auth || !result.auth.components) {
          console.error('AuthService: Invalid user group data');
          return false;
        }

        const guard = result.auth.components;
        console.log('AuthService: permissions', guard);
        switch (mainSegment) {
          case 'settings':
            return !!guard.settings;
          case 'selling-screen':
            return !!guard.store;
          case 'fast-selling':
            return !!guard.store;
          case 'store':
            return !!guard.store;
          case 'reports':
            return !!guard.reports;
          case 'endoftheday':
            return !!guard.endoftheday;
          case 'cashbox':
            return !!guard.cashbox;
          default:
            console.log('AuthService: no guard matched for', mainSegment);
            // Allow unknown routes to proceed to 404 or other handlers if we don't explicitly block them?
            // Or block by default? Legacy code returned false.
            return false;
        }
      }).catch(err => {
        console.error('AuthService: error getting permissions', err);
        return false;
      });
    } else {
      this.messageService.sendMessage('Şifre girilmedi.');
      return undefined;
    }
  }
}
