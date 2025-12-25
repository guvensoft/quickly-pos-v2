import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import swal from 'sweetalert';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private subject = new Subject<any>();

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  sendMessage(message: string): void {
    this.subject.next({ text: message });
    setTimeout(() => {
      this.subject.next(undefined);
    }, 2000);
  }

  getMessage(): Observable<any> {
    return this.subject.asObservable();
  }

  sendAlert(header: string, message: string, type: any): void {
    swal(header, message, type, {
      buttons: {
        confirm: {
          text: 'Tamam',
          value: true,
          visible: true,
          className: 'btn btn-lg btn-success',
          closeModal: true
        }
      }
    });
  }

  sendConfirm(message: string): Promise<any> {
    return swal(message, {
      buttons: {
        cancel: {
          text: 'İptal',
          value: false,
          visible: true,
          className: 'btn btn-lg btn-danger',
          closeModal: true
        },
        confirm: {
          text: 'Tamam',
          value: true,
          visible: true,
          className: 'btn btn-lg btn-success',
          closeModal: true
        }
      }
    });
  }
}
