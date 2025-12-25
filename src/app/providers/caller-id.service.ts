import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Subject, Observable } from 'rxjs';
import { Call } from '../core/models/caller.model';

@Injectable({
  providedIn: 'root'
})
export class CallerIDService {
  private electron = inject(ElectronService);
  private messageService = inject(MessageService);
  private settings = inject(SettingsService);

  private CallEvent: Subject<Call> = new Subject<any>();

  constructor() {
    // İş mantığı AYNEN korundu
    this.electron.on('callerError', (message: string) => {
      this.messageService.sendMessage(message);
    });

    this.electron.on('phoneRequest', (data: any) => {
      if (
        data.toString().split('.')[1] == undefined ||
        data.toString().split('.')[0] == '    ----    CIDSHOW - 2020  - Sistemler'
      ) {
        console.log('Device Signal...');
      } else {
        const newCall: Call = {
          line: data.toString().split('.')[0],
          number: data.toString().split('.')[1],
          serial: data.toString().split('.')[3],
          timestamp: Date.now()
        };
        this.CallEvent.next(newCall);
      }
    });

    this.electron.on('callerPath', (message: any) => {
      console.log('CIDSHOW PATH:', message);
    });
  }

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  startCallerID(): void {
    console.log('CallerID Service Started...');
    this.electron.send('startCaller');
  }

  listenCallEvent(): Observable<Call> {
    return this.CallEvent.asObservable();
  }

  testCall(): void {
    const testCall: Call = { line: 0, number: '05448743568', serial: 5556666, timestamp: Date.now() };
    this.CallEvent.next(testCall);
  }
}
