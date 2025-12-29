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
  selector: 'app-category-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Kategori Düzenle' : 'Kategori Ekle' }}
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
          <label class="form-label">Kategori Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Kategori adı gerekli
            </div>
          }
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
export class CategoryModalComponent extends BaseModalComponent {
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
      name: [data?.name || '', Validators.required],
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

    this.loading = true;
    const formValue = this.form.value;

    const promise = this.data?._id
      ? this.mainService.updateData('categories', this.data._id, formValue)
      : this.mainService.addData('categories', formValue);

    promise
      .then((result: any) => {
        this.loading = false;
        this.notification.success(
          this.data?._id ? 'Kategori güncellendi' : 'Kategori eklendi'
        );
        this.close(result);
      })
      .catch((error: any) => {
        this.loading = false;
        this.notification.error('Kayıt başarısız: ' + error.message);
      });
  }
}
