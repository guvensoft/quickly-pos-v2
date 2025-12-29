import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

export interface PasswordData {
  title?: string;
  message?: string;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-password-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h5 class="modal-title">{{ data?.title || 'Şifre Gerekli' }}</h5>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-3">
        <p class="text-muted">{{ data?.message || 'Lütfen devam etmek için şifreyi giriniz.' }}</p>
        <input #passInput type="password" class="form-control form-control-lg" placeholder="Şifre" autofocus>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        <button type="button" class="btn btn-primary btn-lg" (click)="close(passInput.value)">Giriş Yap</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
  `]
})
export class PasswordModalComponent extends BaseModalComponent<PasswordData> {
  constructor(
    dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) data: PasswordData
  ) {
    super(dialogRef, data);
  }
}
