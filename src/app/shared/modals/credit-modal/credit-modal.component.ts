import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    selector: 'app-credit-modal',
    template: `
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">Alacaklı Kapat (Cari)</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="form-group mb-4">
          <label class="font-weight-bold">Müşteri Seçin</label>
          <select [(ngModel)]="selectedCustomerId" class="form-control form-control-lg custom-select">
            <option value="" disabled selected>Müşteri Seçiniz...</option>
            @for (customer of data.customers; track customer._id) {
            <option [value]="customer._id">{{customer.name}} {{customer.surname}}</option>
            }
          </select>
        </div>
        <div class="form-group mb-0">
          <label class="font-weight-bold">Cari Hesap Notu</label>
          <input [(ngModel)]="note" type="text" placeholder="Notunuz..." class="form-control form-control-lg">
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
        <button class="btn btn-primary btn-lg px-5"
          [disabled]="!selectedCustomerId || !note.trim()"
          (click)="submit()" type="button">
          <i class="fa fa-arrow-down mr-2"></i> Cari Kapat
        </button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border-radius: 15px; overflow: hidden; }
    .custom-select { height: calc(1.5em + 1rem + 2px); }
  `]
})
export class CreditModalComponent extends BaseModalComponent<{ customer_id: string, note: string }> {
    selectedCustomerId: string = '';
    note: string = '';

    constructor(
        dialogRef: DialogRef<{ customer_id: string, note: string }>,
        @Inject(DIALOG_DATA) public override data: { customers: any[] }
    ) {
        super(dialogRef, data);
    }

    submit() {
        if (this.selectedCustomerId && this.note.trim()) {
            this.close({ customer_id: this.selectedCustomerId, note: this.note });
        }
    }
}
