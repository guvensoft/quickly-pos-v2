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
  selector: 'app-admin-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Uygulama Ayarları</h5>
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
          <label class="form-label">Şirket Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="company_name"
            [class.is-invalid]="isFieldInvalid('company_name')"
          />
          @if (isFieldInvalid('company_name')) {
            <div class="invalid-feedback">
              Şirket adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Yetkili Adı</label>
          <input
            type="text"
            class="form-control"
            formControlName="owner_name"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Telefon</label>
          <input
            type="text"
            class="form-control"
            formControlName="phone"
            placeholder="örn: +90 555 123 4567"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Adres</label>
          <textarea
            class="form-control"
            formControlName="address"
            rows="3"
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Uygulama Adı</label>
          <input
            type="text"
            class="form-control"
            formControlName="app_name"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Uygulama Sürümü</label>
          <input
            type="text"
            class="form-control"
            formControlName="app_version"
            placeholder="örn: 1.0.0"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Lisans Anahtarı</label>
          <input
            type="text"
            class="form-control"
            formControlName="license_key"
          />
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
export class AdminModalComponent extends BaseModalComponent {
  form: FormGroup;

  private fb = inject(FormBuilder);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.form = this.fb.group({
      company_name: [data?.company_name || '', (control) => Validators.required(control)],
      owner_name: [data?.owner_name || ''],
      phone: [data?.phone || ''],
      address: [data?.address || ''],
      app_name: [data?.app_name || ''],
      app_version: [data?.app_version || ''],
      license_key: [data?.license_key || ''],
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
