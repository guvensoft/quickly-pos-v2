import { Injectable, inject } from '@angular/core';
import { Log, logType } from '../models/log.model';
import { MainService } from './main.service';

export { logType } from '../models/log.model';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private mainService = inject(MainService);

  user!: string;

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  createLog(type: logType, connection_id: string, message: string): void {
    this.user = localStorage.getItem('userName')!;
    let log = new Log(type, this.user, connection_id, message, 0, Date.now());
    this.mainService.addData('logs', log);
  }

  deleteLog(id: string): void {
    this.mainService.removeData('logs', id);
  }
}
