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
  selector: 'app-table-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Masa Düzenle' : 'Masa Ekle' }}
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
        @if (floors.length > 0) {
        <div class="mb-3">
          <label class="form-label">Bölüm *</label>
          <select
            class="form-select"
            formControlName="floor_id"
            [class.is-invalid]="isFieldInvalid('floor_id')"
          >
            <option value="">Seçiniz</option>
            @for (floor of floors; track floor._id) {
              <option [value]="floor._id">{{ floor.name }}</option>
            }
          </select>
          @if (isFieldInvalid('floor_id')) {
            <div class="invalid-feedback">
              Bölüm seçiniz
            </div>
          }
        </div>
        }

        <div class="mb-3">
          <label class="form-label">Masa Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Masa adı gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Kapasite *</label>
          <input
            type="number"
            class="form-control"
            formControlName="capacity"
            [class.is-invalid]="isFieldInvalid('capacity')"
          />
          @if (isFieldInvalid('capacity')) {
            <div class="invalid-feedback">
              Kapasite gerekli
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
export class TableModalComponent extends BaseModalComponent {
  form: FormGroup;
  loading = false;
  floors: any[] = [];

  private fb = inject(FormBuilder);
  private mainService = inject(MainService);
  private notification = inject(NotificationService);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.floors = data?.floors || [];
    const hasFloors = this.floors.length > 0;

    this.form = this.fb.group({
      name: [data?.name || '', (control) => Validators.required(control)],
      capacity: [data?.capacity || 2, [(control) => Validators.required(control), Validators.min(1)]],
      description: [data?.description || ''],
      floor_id: [data?.floor_id || '', hasFloors ? (control) => Validators.required(control) : []],
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
