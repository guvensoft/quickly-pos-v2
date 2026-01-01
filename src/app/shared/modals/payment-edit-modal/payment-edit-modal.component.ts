import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

export interface PaymentEditData {
  amount: number;
  method: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-payment-edit-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Ödeme Düzenle</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #paymentEditForm="ngForm" (ngSubmit)="close(paymentEditForm.value)">
        <div class="modal-body p-3">
          <div class="form-group mb-3">
            <label class="form-label">Ödeme Tutarı</label>
            <div class="input-group">
              <input type="number" class="form-control form-control-lg" name="amount" [ngModel]="data.amount">
              <div class="input-group-append">
                <span class="input-group-text">TL</span>
              </div>
            </div>
          </div>
          <div class="form-group mb-3">
            <label class="form-label">Ödeme Tipi</label>
            <select name="method" class="form-control form-control-lg" [ngModel]="data.method">
              <option>Nakit</option>
              <option>Kart</option>
              <option>Kupon</option>
              <option>İkram</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button type="submit" class="btn btn-success btn-lg">
            <i class="fa fa-check"></i> Değiştir
          </button>
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
  `]
})
export class PaymentEditModalComponent extends BaseModalComponent<PaymentEditData> {
  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: PaymentEditData
  ) {
    super(dialogRef, data);
  }
}
