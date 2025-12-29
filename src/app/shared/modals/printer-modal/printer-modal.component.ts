import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
  selector: 'app-printer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Yazıcı Ekle/Düzenle</h5>
      <button
        type="button"
        class="btn-close"
        (click)="cancel()"
        aria-label="Close"
      ></button>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Yazıcı Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Yazıcı adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">IP Adresi</label>
          <input
            type="text"
            class="form-control"
            formControlName="ip_address"
            placeholder="örn: 192.168.1.100"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Port</label>
          <input
            type="number"
            class="form-control"
            formControlName="port"
            min="1"
            max="65535"
            placeholder="9100"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Açıklama</label>
          <textarea
            class="form-control"
            formControlName="description"
            rows="3"
          ></textarea>
        </div>
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
          type="submit"
          class="btn btn-primary"
          [disabled]="!form.valid"
        >
          Kaydet
        </button>
      </div>
    </form>
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
export class PrinterModalComponent extends BaseModalComponent {
  form: FormGroup;

  private fb = inject(FormBuilder);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      ip_address: [data?.ip_address || ''],
      port: [data?.port || 9100],
      description: [data?.description || ''],
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(
      control &&
      control.invalid &&
      (control.dirty || control.touched)
    );
  }

  onSubmit() {
    if (this.form.invalid) return;

    const formValue = this.form.value;
    this.close(formValue);
  }
}
