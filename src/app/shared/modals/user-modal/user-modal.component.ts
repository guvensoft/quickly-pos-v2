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
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">Kullanıcı Ekle/Düzenle</h5>
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
          <label class="form-label">Kullanıcı Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="username"
            [class.is-invalid]="isFieldInvalid('username')"
          />
          @if (isFieldInvalid('username')) {
            <div class="invalid-feedback">
              Kullanıcı adı gerekli
            </div>
          }
        </div>

        @if (!data?._id) {
          <div class="mb-3">
            <label class="form-label">Şifre *</label>
            <input
              type="password"
              class="form-control"
              formControlName="password"
              [class.is-invalid]="isFieldInvalid('password')"
            />
            @if (isFieldInvalid('password')) {
              <div class="invalid-feedback">
                Şifre gerekli
              </div>
            }
          </div>
        } @else {
          <div class="mb-3">
            <label class="form-label">Yeni Şifre (opsiyonel)</label>
            <input
              type="password"
              class="form-control"
              formControlName="password"
              placeholder="Değiştirmek için yeni şifre giriniz"
            />
          </div>
        }

        <div class="mb-3">
          <label class="form-label">Ad Soyad *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">
              Ad soyad gerekli
            </div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Kullanıcı Grubu</label>
          <select
            class="form-select"
            formControlName="group_id"
          >
            <option value="">Grup Seçiniz</option>
            @if (data?.groups) {
              @for (group of data.groups; track group._id) {
                <option [value]="group._id">{{ group.name }}</option>
              }
            }
          </select>
        </div>

        <div class="mb-3">
          <div class="form-check">
            <input
              type="checkbox"
              class="form-check-input"
              formControlName="is_active"
              id="is_active"
            />
            <label class="form-check-label" for="is_active">
              Aktif
            </label>
          </div>
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
export class UserModalComponent extends BaseModalComponent {
  form: FormGroup;

  private fb = inject(FormBuilder);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    // Determine if password is required (for new users only)
    const passwordValidators = data?._id ? [] : [Validators.required];

    this.form = this.fb.group({
      username: [data?.username || '', Validators.required],
      password: [data?.password || '', passwordValidators],
      name: [data?.name || '', Validators.required],
      group_id: [data?.group_id || ''],
      is_active: [data?.is_active !== undefined ? data.is_active : true],
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

    // Don't send password if it's empty (for edit mode)
    if (this.data?._id && !formValue.password) {
      delete formValue.password;
    }

    this.close(formValue);
  }
}
