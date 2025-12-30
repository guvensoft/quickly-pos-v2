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
import { MainService } from '../../../core/services/main.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-customer-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Müşteri Düzenle' : 'Müşteri Ekle' }}
      </h5>
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
          <label class="form-label">Müşteri Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Müşteri adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Soyadı</label>
          <input
            type="text"
            class="form-control"
            formControlName="surname"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Telefon *</label>
          <input
            type="tel"
            class="form-control"
            formControlName="phone_number"
            [class.is-invalid]="isFieldInvalid('phone_number')"
          />
          @if (isFieldInvalid('phone_number')) {
            <div class="invalid-feedback">
              Geçerli telefon numarası giriniz
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Adres</label>
          <textarea
            class="form-control"
            formControlName="address"
            rows="2"
          ></textarea>
        </div>

        <div class="mb-3">
          <label class="form-label">Müşteri Tipi *</label>
          <select
            class="form-select"
            formControlName="type"
            [class.is-invalid]="isFieldInvalid('type')"
          >
            <option value="">Seçiniz</option>
            <option value="0">Restoran</option>
            <option value="1">Paket Servis</option>
          </select>
          @if (isFieldInvalid('type')) {
            <div class="invalid-feedback">
              Müşteri tipi seçiniz
            </div>
          }
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
          [disabled]="!form.valid || loading"
        >
          @if (loading) {
            <span class="spinner-border spinner-border-sm me-2"></span>
          }
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
export class CustomerModalComponent extends BaseModalComponent {
  form: FormGroup;
  loading = false;

  private fb = inject(FormBuilder);
  private mainService = inject(MainService);
  private notification = inject(NotificationService);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.form = this.fb.group({
      name: [data?.name || '', (control) => Validators.required(control)],
      surname: [data?.surname || ''],
      phone_number: [
        data?.phone_number || '',
        [(control) => Validators.required(control), Validators.minLength(10)],
      ],
      address: [data?.address || ''],
      type: [data?.type || '', (control) => Validators.required(control)],
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

    // Return the form data to the parent component
    // Parent component handles the actual submission with business logic
    const formValue = this.form.value;
    this.close(formValue);
  }
}
