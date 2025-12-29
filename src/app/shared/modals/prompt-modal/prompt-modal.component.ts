import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

export interface PromptData {
  title?: string;
  message?: string;
  placeholder?: string;
  value?: string;
  required?: boolean;
}

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-prompt-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h5 class="modal-title">{{ data?.title || 'Bilgi Girişi' }}</h5>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-3">
        <p class="text-muted">{{ data?.message || 'Lütfen bilgiyi giriniz.' }}</p>
        <input #promptInput type="text" class="form-control form-control-lg" [placeholder]="data?.placeholder || ''" [ngModel]="data?.value || ''" autofocus>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        <button type="button" class="btn btn-primary btn-lg" [disabled]="data?.required && !promptInput.value" (click)="close(promptInput.value)">Tamam</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
  `]
})
export class PromptModalComponent extends BaseModalComponent<PromptData> {
  constructor(
    dialogRef: DialogRef<string>,
    @Inject(DIALOG_DATA) data: PromptData
  ) {
    super(dialogRef, data);
  }
}
