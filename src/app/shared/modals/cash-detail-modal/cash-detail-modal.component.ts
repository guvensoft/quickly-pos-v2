import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
    standalone: true,
    imports: [CommonModule, PricePipe],
    selector: 'app-cash-detail-modal',
    template: `
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">{{ data.type }} Hareketi</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-0">
        <div class="card border-0">
          <div class="card-header bg-light">
            <h5 class="mb-0">{{ data.description }}</h5>
          </div>
          <div class="card-body p-0">
            <strong>
              <table class="table table-striped mb-0">
                <tbody>
                  <tr class="table-success">
                    <td width="10%">
                      <i class="fa fa-money" aria-hidden="true"></i>
                    </td>
                    <td>Nakit:</td>
                    <td width="30%">
                      <span class="pull-right">{{ data.cash || 0 | price }} </span>
                    </td>
                  </tr>
                  <tr class="table-warning">
                    <td width="10%">
                      <i class="fa fa-credit-card" aria-hidden="true"></i>
                    </td>
                    <td>Kart:</td>
                    <td>
                      <span class="pull-right">{{ data.card || 0 | price }} </span>
                    </td>
                  </tr>
                  <tr class="table-info">
                    <td width="10%">
                      <i class="fa fa-bookmark ml-1" aria-hidden="true"></i>
                    </td>
                    <td>Kupon:</td>
                    <td>
                      <span class="pull-right">{{ data.coupon || 0 | price }} </span>
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <i class="fa fa-check" aria-hidden="true"></i>
                    </td>
                    <td>Toplam:</td>
                    <td>
                      <span class="pull-right font-weight-bold text-primary">
                        {{ (data.coupon || 0) + (data.cash || 0) + (data.card || 0) | price }} 
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </strong>
          </div>
          <div class="card-footer bg-light d-flex justify-content-between">
            <span><i class="fa fa-user mr-1" aria-hidden="true"></i> {{ data.user }}</span>
            <span><i class="fa fa-clock-o mr-1"></i> {{ data.timestamp | date:'HH:mm' }}</span>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border-radius: 15px; overflow: hidden; }
  `]
})
export class CashDetailModalComponent extends BaseModalComponent<void> {
    constructor(
        dialogRef: DialogRef<void>,
        @Inject(DIALOG_DATA) public override data: any
    ) {
        super(dialogRef, data);
    }
}
