import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  AbstractControl,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { MainService } from '../../../core/services/main.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Ürün Düzenle' : 'Ürün Ekle' }}
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
          <label class="form-label">Ürün Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Ürün adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Fiyat *</label>
          <input
            type="number"
            class="form-control"
            formControlName="price"
            [class.is-invalid]="isFieldInvalid('price')"
          />
          @if (isFieldInvalid('price')) {
            <div class="invalid-feedback">
              Geçerli fiyat giriniz
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Kategori *</label>
          <select
            class="form-select"
            formControlName="cat_id"
            [class.is-invalid]="isFieldInvalid('cat_id')"
          >
            <option value="">Seçiniz</option>
            @for (cat of categories; track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>
          @if (isFieldInvalid('cat_id')) {
            <div class="invalid-feedback">
              Kategori seçiniz
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
export class ProductModalComponent extends BaseModalComponent {
  form: FormGroup;
  categories: any[] = [];
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
      name: [data?.name || '', (control: AbstractControl) => Validators.required(control)],
      price: [data?.price || 0, [(control: AbstractControl) => Validators.required(control), Validators.min(0)]],
      cat_id: [data?.cat_id || '', (control: AbstractControl) => Validators.required(control)],
    });

    this.loadCategories();
  }

  private loadCategories() {
    this.mainService.getAllBy('categories', {}).then((res: any) => {
      this.categories = res.docs;
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

    this.loading = true;
    const formValue = this.form.value;

    const promise = this.data?._id
      ? this.mainService.updateData('products', this.data._id, formValue)
      : this.mainService.addData('products', formValue);

    promise
      .then((result: any) => {
        this.loading = false;
        this.notification.success(
          this.data?._id ? 'Ürün güncellendi' : 'Ürün eklendi'
        );
        this.close(result);
      })
      .catch((error: any) => {
        this.loading = false;
        this.notification.error('Kayıt başarısız: ' + error.message);
      });
  }
}
