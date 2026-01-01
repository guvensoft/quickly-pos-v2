import { Injectable, ElementRef } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KeyboardService {
  signal = new Subject<any>();
  input = new Subject<ElementRef>();

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  triggerKeyboard(command: string, element: ElementRef): void {
    this.signal.next(command);
    this.input.next(element);
  }

  listenKeyboard(): Observable<any> {
    return this.signal.asObservable();
  }

  listenInput(): Observable<ElementRef> {
    return this.input.asObservable();
  }

  syncInputs(element: ElementRef): void {
    this.input.next(element);
  }
}
