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
import { SelectComponent, type SelectOption } from '../../../shared/components/ui-components';

@Component({
  selector: 'app-stock-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Stok Düzenle' : 'Stok Ekle' }}
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
          <label class="form-label">Stok Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Stok adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Miktar *</label>
          <input
            type="number"
            class="form-control"
            formControlName="quantity"
            [class.is-invalid]="isFieldInvalid('quantity')"
            min="0.01"
            step="0.01"
          />
          @if (isFieldInvalid('quantity')) {
            <div class="invalid-feedback">
              Miktar 0'dan büyük olmalıdır
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Uyarı Limiti</label>
          <input
            type="number"
            class="form-control"
            formControlName="warning_limit"
            min="0"
            step="0.01"
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Fiyat</label>
          <input
            type="number"
            class="form-control"
            formControlName="price"
            [class.is-invalid]="isFieldInvalid('price')"
            min="0"
            step="0.01"
          />
          @if (isFieldInvalid('price')) {
            <div class="invalid-feedback">
              Fiyat 0 veya daha büyük olmalıdır
            </div>
          }
        </div>

        <div class="mb-3">
          <app-select
            formControlName="unit"
            label="Birim"
            placeholder="Seçiniz"
            [options]="unitOptions"
          ></app-select>
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
export class StockModalComponent extends BaseModalComponent {
  form: FormGroup;
  unitOptions: SelectOption[] = [
    { label: 'Gram', value: 'Gram' },
    { label: 'Mililitre', value: 'Mililitre' },
    { label: 'Adet', value: 'Adet' }
  ];

  private fb = inject(FormBuilder);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      quantity: [
        data?.quantity || 0,
        [Validators.required, Validators.min(0.01)]
      ],
      warning_limit: [data?.warning_limit || null],
      price: [data?.price || null, [Validators.min(0)]],
      unit: [data?.unit || ''],
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
