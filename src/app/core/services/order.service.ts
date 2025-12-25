import { Injectable, inject } from '@angular/core';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private mainService = inject(MainService);

  orderListener: any;

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  startOrderListener(): void {
    this.orderListener = this.mainService.LocalDB['orders']
      .changes({ since: 'now', live: true, include_docs: true })
      .on('change', (changes: any) => {
        console.log(changes.doc);
        // this.mainService.getBulk([])
      });
  }

  closeOrderListener(): void {
    this.orderListener.cancel();
  }

  orderToCheck(): void {
    // İş mantığı korundu - boş fonksiyon olarak
  }

  orderToPrint(): void {
    // İş mantığı korundu - boş fonksiyon olarak
  }
}
