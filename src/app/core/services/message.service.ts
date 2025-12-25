import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import swal from 'sweetalert';

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private subject = new Subject<any>();

    sendMessage(message: string) {
        this.subject.next({ text: message });
        setTimeout(
            () => {
                this.subject.next(null); // Changed to null to be clearer than undefined
            }, 2000);
    }

    getMessage(): Observable<any> {
        return this.subject.asObservable();
    }

    sendAlert(header: string, message: string, type: 'warning' | 'error' | 'success' | 'info') {
        const swalOptions: any = {
            title: header,
            text: message,
            icon: type,
            buttons: {
                confirm: {
                    text: "Tamam",
                    value: true,
                    visible: true,
                    className: "btn btn-lg btn-success",
                    closeModal: true
                }
            }
        };
        swal(swalOptions);
    }

    sendConfirm(message: string): Promise<any> {
        const swalOptions: any = {
            title: message,
            buttons: {
                cancel: {
                    text: "İptal",
                    value: false,
                    visible: true,
                    className: "btn btn-lg btn-danger",
                    closeModal: true,
                },
                confirm: {
                    text: "Tamam",
                    value: true,
                    visible: true,
                    className: "btn btn-lg btn-success",
                    closeModal: true
                }
            },
        };
        return swal(swalOptions);
    }
}
