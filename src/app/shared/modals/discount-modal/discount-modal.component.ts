import { Component, Inject, signal, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

export interface DiscountData {
  currentAmount: number;
  discounts: number[];
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-discount-modal',
  template: `
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">İndirim Yap</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col">
            <div class="input-group input-group-lg">
              <input #discountInput type="number" min="1" placeholder="İndirim Tutarı Giriniz"
                class="form-control" (keyup.enter)="applyAmount(discountInput.value)">
              <div class="input-group-append">
                <span class="input-group-text">₺</span>
              </div>
              <div class="input-group-append">
                <button class="btn btn-primary" [disabled]="!discountInput.value || +discountInput.value >= data.currentAmount"
                  (click)="applyAmount(discountInput.value)">
                  <i class="fa fa-arrow-down mr-1"></i> İndirim Yap
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          @for (item of data.discounts; track item) {
          <div class="col-4 mb-3">
            <button type="button" (click)="applyPercent(item)"
              class="btn btn-outline-primary btn-block btn-lg p-3">
              % {{item}}
            </button>
          </div>
          }
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border-radius: 15px; overflow: hidden; }
    .btn-block { width: 100%; }
  `]
})
export class DiscountModalComponent extends BaseModalComponent<DiscountData> {
  constructor(
    dialogRef: DialogRef<{ type: 'amount' | 'percent', value: number }>,
    @Inject(DIALOG_DATA) data: DiscountData
  ) {
    super(dialogRef, data);
  }

  applyAmount(val: string) {
    const amount = parseFloat(val);
    if (!isNaN(amount) && amount > 0 && amount < this.data.currentAmount) {
      this.close({ type: 'amount', value: amount });
    }
  }

  applyPercent(val: number) {
    this.close({ type: 'percent', value: val });
  }
}
