import { Injectable, inject } from '@angular/core';
import { MainService } from './main.service';
import { OrderDocument } from '../models/database.types';

// PHASE 2 - Type Safety: PouchDB Changes Feed interface
interface PouchDBChangesFeed {
  on(event: string, callback: (change: PouchDBChangeEvent) => void): PouchDBChangesFeed;
  cancel(): void;
}

// PHASE 2 - Type Safety: PouchDB Change Event interface
interface PouchDBChangeEvent {
  id: string;
  seq: string | number; // PouchDB allows both string and number for seq
  doc?: OrderDocument;
  deleted?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private mainService = inject(MainService);

  // PHASE 2 - Type Safety: Properly typed changes feed
  orderListener: PouchDBChangesFeed | null = null;

  // ============================================
  // İş Mantığı - AYNEN KORUNDU
  // ============================================

  /**
   * PHASE 2 - Type Safety: Start listening to order changes
   * Uses properly typed PouchDB changes feed
   * Note: changes parameter uses 'any' due to complex PouchDB internal types
   */
  startOrderListener(): void {
    this.orderListener = this.mainService.LocalDB['orders']
      .changes({ since: 'now', live: true, include_docs: true })
      .on('change', (changes: any) => {
        console.log(changes.doc);
        // this.mainService.getBulk([])
      }) as PouchDBChangesFeed;
  }

  closeOrderListener(): void {
    if (this.orderListener) {
      this.orderListener.cancel();
    }
  }

  orderToCheck(): void {
    // İş mantığı korundu - boş fonksiyon olarak
  }

  orderToPrint(): void {
    // İş mantığı korundu - boş fonksiyon olarak
  }
}
