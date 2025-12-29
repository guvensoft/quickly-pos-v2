import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-payment-method-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Ödeme Yöntemi Seçin</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-4">
        <div class="row">
          @for (method of data?.methods; track method.name) {
            <div class="col-6 col-md-3 mb-3">
              <button (click)="close(method.name)" 
                class="btn btn-outline-dark btn-block p-4 payment-btn d-flex flex-column align-items-center justify-content-center"
                [style.borderColor]="method.color"
                [style.color]="method.color">
                <i class="fa {{method.icon}} fa-3x mb-3"></i>
                <span class="font-weight-bold h5 mb-0">{{method.name}}</span>
              </button>
            </div>
          }
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; }
    .payment-btn { 
      border-width: 2px; 
      transition: all 0.2s; 
      border-radius: 12px;
      min-height: 160px;
    }
    .payment-btn:hover { 
      background-color: #f8f9fa;
      transform: translateY(-5px);
      box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    }
  `]
})
export class PaymentMethodModalComponent extends BaseModalComponent<string> {
    constructor(
        dialogRef: DialogRef<string>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
    }
}
