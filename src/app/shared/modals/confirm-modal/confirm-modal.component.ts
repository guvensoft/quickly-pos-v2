import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
  selector: 'app-confirm-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">{{ data?.title || 'Onay' }}</h5>
      <button
        type="button"
        class="btn-close"
        (click)="cancel()"
        aria-label="Close"
      ></button>
    </div>

    <div class="modal-body">
      <p class="mb-0">{{ data?.message }}</p>
    </div>

    <div class="modal-footer">
      <button
        type="button"
        class="btn btn-secondary"
        (click)="cancel()"
      >
        İptal
      </button>
      <button
        type="button"
        class="btn btn-danger"
        (click)="confirm()"
      >
        Evet, Sil
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .modal-header,
    .modal-body,
    .modal-footer {
      padding: 1rem;
    }
    .modal-header {
      border-bottom: 1px solid #dee2e6;
    }
    .modal-footer {
      border-top: 1px solid #dee2e6;
    }
  `]
})
export class ConfirmModalComponent extends BaseModalComponent {
  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);
  }

  confirm() {
    this.close(true);
  }
}
