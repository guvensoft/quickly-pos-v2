import { Component, Inject, signal, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { NgxMaskPipe } from 'ngx-mask';
import { Call } from '../../../core/models/caller.model';
import { Customer } from '../../../core/models/customer.model';

export interface CallerData {
  call: Call;
  customer: Customer | null;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, NgxMaskPipe],
  selector: 'app-caller-modal',
  template: `
    <div class="modal-content">
      <div class="modal-header">
        <h5 class="modal-title font-weight-bold">
          <i class="fa fa-phone mr-2" aria-hidden="true"></i> Gelen Çağrı
        </h5>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body">
        <div class="text-center mb-4">
          <h4 class="text-muted mb-2">Arayan Numara:</h4>
          <h1 class="font-weight-bold text-primary">{{ data.call.number | mask: '0 (000) 000 00 00' }}</h1>
        </div>

        @if (data.customer) {
        <div class="card bg-success text-white text-center p-4 border-0 rounded-lg">
          <small class="d-block mb-3 font-weight-bold">MÜŞTERİ BULUNDU</small>
          <i class="fa fa-user-circle fa-4x mb-3" aria-hidden="true"></i>
          <h2 class="mb-2">{{ data.customer.name }} {{ data.customer.surname }}</h2>
          <h5 class="mb-0 opacity-75"><b>{{ data.customer.address }}</b></h5>
        </div>
        } @else {
        <div class="alert alert-warning text-center py-3 mb-4 rounded-lg">
          <i class="fa fa-exclamation-triangle mr-2"></i>
          <strong>Müşteri Bulunamadı!</strong>
        </div>
        
        <form #customerForm="ngForm">
          <div class="form-group mb-3">
            <div class="input-group input-group-lg shadow-sm">
              <div class="input-group-prepend">
                <span class="input-group-text bg-white border-right-0"><i class="fa fa-user"></i></span>
              </div>
              <input type="text" name="name" placeholder="Adı" class="form-control border-left-0" ngModel required />
            </div>
          </div>
          <div class="form-group mb-3">
            <div class="input-group input-group-lg shadow-sm">
              <div class="input-group-prepend">
                <span class="input-group-text bg-white border-right-0"><i class="fa fa-user-o"></i></span>
              </div>
              <input type="text" name="surname" placeholder="Soyadı" class="form-control border-left-0" ngModel required />
            </div>
          </div>
          <div class="form-group">
            <div class="input-group input-group-lg shadow-sm">
              <div class="input-group-prepend">
                <span class="input-group-text bg-white border-right-0"><i class="fa fa-map-marker"></i></span>
              </div>
              <textarea name="address" rows="3" placeholder="Adres" class="form-control border-left-0" ngModel required></textarea>
            </div>
          </div>
        </form>
        }
      </div>
      <div class="modal-footer bg-light">
        <button type="button" class="btn btn-lg btn-secondary px-4" (click)="cancel()">Kapat</button>
        
        @if (data.customer) {
        <button (click)="submit('open')" type="button" class="btn btn-lg btn-primary px-4 shadow">
          <i class="fa fa-sticky-note mr-2" aria-hidden="true"></i> Hesap Aç
        </button>
        } @else {
        <button (click)="submit('save')" [disabled]="!customerForm()?.form?.valid" type="button" class="btn btn-lg btn-success px-4 shadow">
          <i class="fa fa-save mr-2" aria-hidden="true"></i> Kaydet ve Hesap Aç
        </button>
        }
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border-radius: 15px; overflow: hidden; border: none; }
    .rounded-lg { border-radius: 12px; }
  `]
})
export class CallerModalComponent extends BaseModalComponent<CallerData> {
  customerForm = viewChild<NgForm>('customerForm');

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: CallerData
  ) {
    super(dialogRef, data);
  }

  submit(action: 'open' | 'save') {
    if (action === 'save') {
      this.close({ action, formValue: this.customerForm()?.value });
    } else {
      this.close({ action });
    }
  }
}
