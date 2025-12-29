import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';

export interface CheckEditData {
  total_price?: number;
  payment_method?: string;
  payment_flow?: any[];
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe],
  selector: 'app-check-edit-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Hesap Düzenle</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #checkEditForm="ngForm" (ngSubmit)="close({ action: 'save', value: checkEditForm.value })">
        <div class="modal-body p-3">
          @if (!data?.payment_flow) {
            <div class="form-group mb-3">
              <label class="form-label">Hesap Tutarı</label>
              <div class="input-group">
                <input type="number" class="form-control form-control-lg" name="total_price" [ngModel]="data?.total_price">
                <div class="input-group-append">
                  <span class="input-group-text">TL</span>
                </div>
              </div>
            </div>
            <div class="form-group mb-3">
              <label class="form-label">Hesap Tipi</label>
              <select name="payment_method" class="form-control form-control-lg" [ngModel]="data?.payment_method">
                <option>Nakit</option>
                <option>Kart</option>
                <option>Kupon</option>
                <option>İkram</option>
              </select>
            </div>
          } @else {
            <p class="text-muted mb-2">Düzenlemek istediğiniz ödemeyi seçin</p>
            @for (payment of data?.payment_flow; track $index) {
              <button type="button" class="btn btn-outline-secondary btn-block btn-lg text-left mb-2 d-flex justify-content-between align-items-center"
                (click)="onEditPayment($index, payment)">
                <span>{{ payment.method }}</span>
                <span class="font-weight-bold">{{ payment.amount | price }}</span>
              </button>
            }
          }
        </div>
        <div class="modal-footer">
          <button type="button" (click)="close({ action: 'reopen' })" class="btn btn-info btn-lg">
            <i class="fa fa-undo"></i> Hesabı Geri Aç
          </button>
          @if (!data?.payment_flow) {
            <button type="submit" class="btn btn-success btn-lg">
              <i class="fa fa-check" aria-hidden="true"></i> Kaydet
            </button>
          }
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
    .btn-block { width: 100%; }
  `]
})
export class CheckEditModalComponent extends BaseModalComponent<CheckEditData> {
  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: CheckEditData
  ) {
    super(dialogRef, data);
  }

  onEditPayment(index: number, payment: any) {
    this.close({ action: 'edit_payment', index, payment });
  }
}
