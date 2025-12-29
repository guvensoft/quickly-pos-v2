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
  selector: 'app-subcategory-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Alt Kategori Düzenle' : 'Alt Kategori Ekle' }}
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
          <label class="form-label">Alt Kategori Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Alt kategori adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Açıklama</label>
          <textarea
            class="form-control"
            formControlName="description"
            rows="2"
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
export class SubcategoryModalComponent extends BaseModalComponent {
  form: FormGroup;

  private fb = inject(FormBuilder);

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

    // Return the form data to the parent component
    // Parent component handles the actual submission with business logic
    const formValue = this.form.value;
    this.close(formValue);
  }
}
