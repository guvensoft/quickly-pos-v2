import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

export interface CheckOptionsData {
  permissions: { discount: boolean };
}

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-check-options-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Hesap İşlemleri</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-4">
        <div class="row">
          <div class="col-12 col-md-6 mb-3">
            <button (click)="close('add_note')" class="btn btn-outline-warning btn-block p-4 option-btn d-flex flex-column align-items-center">
              <i class="fa fa-sticky-note fa-3x mb-3"></i>
              <span class="font-weight-bold h5">Hesaba Not Ekle</span>
            </button>
          </div>
          <div class="col-12 col-md-6 mb-3">
            <button (click)="close('discount')" [disabled]="!data.permissions.discount" class="btn btn-outline-danger btn-block p-4 option-btn d-flex flex-column align-items-center">
              <i class="fa fa-arrow-down fa-3x mb-3"></i>
              <span class="font-weight-bold h5">İndirim Yap</span>
            </button>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; border-radius: 15px; }
    .option-btn { border-width: 2px; border-radius: 12px; transition: all 0.2s; }
    .option-btn:hover:not(:disabled) { background-color: #f8f9fa; transform: translateY(-5px); box-shadow: 0 5px 15px rgba(0,0,0,0.1); }
    .btn-block { width: 100%; }
  `]
})
export class CheckOptionsModalComponent extends BaseModalComponent<CheckOptionsData> {
  constructor(
    dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) data: CheckOptionsData
  ) {
    super(dialogRef, data);
  }
}
