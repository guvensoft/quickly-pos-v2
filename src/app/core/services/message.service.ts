/* eslint-disable @typescript-eslint/no-floating-promises, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unused-vars */
import { Injectable, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import swal from 'sweetalert';
import { ToastService } from './toast.service';

export interface Message {
    text: string;
}

export interface SwalOptions {
    title: string;
    text?: string;
    icon?: 'warning' | 'error' | 'success' | 'info';
    buttons: {
        [key: string]: {
            text: string;
            value: boolean;
            visible: boolean;
            className: string;
            closeModal: boolean;
        } | boolean;
    };
}

@Injectable({
    providedIn: 'root'
})
export class MessageService {
    private subject = new Subject<Message | null>();
    private readonly toastService = inject(ToastService);

    sendMessage(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') {
        // Send via toast service for new UI
        this.toastService[type](message);

        // Keep subject for legacy compatibility
        this.subject.next({ text: message });
        setTimeout(
            () => {
                this.subject.next(null);
            }, 2000);
    }

    getMessage(): Observable<Message | null> {
        return this.subject.asObservable();
    }

    sendAlert(header: string, message: string, type: 'warning' | 'error' | 'success' | 'info') {
        const swalOptions: SwalOptions = {
            title: header,
            text: message,
            icon: type as any, // Cast for swal compatibility if needed
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
        swal(swalOptions as any);
    }

    sendConfirm(message: string): Promise<boolean> {
        const swalOptions: SwalOptions = {
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
        return swal(swalOptions as any) as Promise<boolean>;
    }
}
