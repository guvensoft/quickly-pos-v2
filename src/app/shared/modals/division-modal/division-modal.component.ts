import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
    standalone: true,
    imports: [CommonModule, PricePipe],
    selector: 'app-division-modal',
    template: `
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Ödeme Bölme</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="row">
          <div class="col">
            <div class="card bg-light border-0">
              <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-center">
                  <h3 class="mb-0 text-muted">Bölünecek Tutar:</h3>
                  <h2 class="mb-0 font-weight-bold text-primary">{{ data.totalAmount | price }}</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="row mt-4">
          <div class="col-12">
            <h4 class="mb-3">Bölüm Sayısı:</h4>
          </div>
          @for (item of [2,3,4,5,6,8,10]; track item) {
          <div class="col-3 mb-3">
            <button type="button" (click)="close(item)"
              class="btn btn-outline-warning btn-block btn-lg p-3 font-weight-bold">
              {{item}}
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
export class DivisionModalComponent extends BaseModalComponent<number> {
    constructor(
        dialogRef: DialogRef<number>,
        @Inject(DIALOG_DATA) public override data: { totalAmount: number }
    ) {
        super(dialogRef, data);
    }
}
