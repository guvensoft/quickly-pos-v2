import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ScalerService {
  private electron = inject(ElectronService);
  private messageService = inject(MessageService);
  private settings = inject(SettingsService);

  private scalerEvent: Subject<string> = new Subject<string>();
  private decoder: TextDecoder = new TextDecoder('utf-8');

  constructor() {
    // İş mantığı AYNEN korundu
    this.electron.on('scalerError', (message: string) => {
      console.log('Scaler ERR:', message.toString());
      this.messageService.sendMessage(message);
    });

    this.electron.on('scalerData', (data: Uint8Array) => {
      this.scalerEvent.next(this.decoder.decode(data));
    });
  }

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  startScaler(): void {
    console.log('Scaler Service Started...');
    this.electron.send('startScaler');
  }

  closeScaler(): void {
    this.electron.send('closeScaler');
  }

  listenScalerEvent(): Observable<any> {
    return this.scalerEvent.asObservable().pipe(
      map((obj: string) => {
        if (obj) {
          let formatted = obj.replace('S', '').replace('U', '').replace('kg', '').replace('- ', '-').trim();
          return parseFloat(formatted);
        }
        return null;
      })
    );
  }
}
