import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    selector: 'app-cashbox-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h5 class="modal-title">{{ data?.type || 'İşlem' }} {{ data?.onUpdate ? 'Düzenle' : 'Ekle' }}</h5>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #cashboxForm="ngForm" (ngSubmit)="close(cashboxForm.value)">
        <div class="modal-body">
          <input type="hidden" name="_id" [ngModel]="data?.cashbox?._id">
          <input type="hidden" name="_rev" [ngModel]="data?.cashbox?._rev">
          <input type="hidden" name="type" [ngModel]="data?.type">
          <input type="hidden" name="timestamp" [ngModel]="data?.cashbox?.timestamp">
          <input type="hidden" name="user" [ngModel]="data?.cashbox?.user">

          <div class="form-group mb-2">
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Açıklama</div>
              </div>
              <input type="text" name="description" class="form-control form-control-lg" [ngModel]="data?.cashbox?.description" required>
            </div>
          </div>
          <div class="form-group mb-2">
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Nakit</div>
              </div>
              <input type="number" min="0" name="cash" class="form-control form-control-lg" [ngModel]="data?.cashbox?.cash || 0">
              <div class="input-group-append">
                <div class="input-group-text">TL</div>
              </div>
            </div>
          </div>
          <div class="form-group mb-2">
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Kart</div>
              </div>
              <input type="number" min="0" name="card" class="form-control form-control-lg" [ngModel]="data?.cashbox?.card || 0">
              <div class="input-group-append">
                <div class="input-group-text">TL</div>
              </div>
            </div>
          </div>
          <div class="form-group mb-2">
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Kupon</div>
              </div>
              <input type="number" min="0" name="coupon" class="form-control form-control-lg" [ngModel]="data?.cashbox?.coupon || 0">
              <div class="input-group-append">
                <div class="input-group-text">TL</div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
          @if (data?.onUpdate) {
            <button type="button" (click)="onDelete()" class="btn btn-danger btn-lg">
              <i class="fa fa-times" aria-hidden="true"></i> Kaydı Sil
            </button>
          }
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="!cashboxForm.valid">
            <i class="fa fa-check" aria-hidden="true"></i> Kaydet
          </button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; }
    .input-group-text { min-width: 100px; }
  `]
})
export class CashboxModalComponent extends BaseModalComponent<any> {
    constructor(
        dialogRef: DialogRef<any>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
    }

    onDelete() {
        this.close({ action: 'delete' });
    }
}
