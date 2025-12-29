import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    selector: 'app-note-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Not Ekle ( {{ data?.productName || 'Ürün' }} )</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #noteForm="ngForm" (ngSubmit)="close({ action: 'note', value: noteForm.value.description })">
        <div class="modal-body p-3">
          <div class="form-group mb-3">
            <input #noteInput type="text" placeholder="Notunuz..." name="description"
              class="form-control form-control-lg" [ngModel]="data?.currentNote" autofocus>
          </div>
          @if (data?.readyNotes?.length > 0) {
            <div class="row g-2">
              @for (note of data.readyNotes; track note) {
                <div class="col-lg-4 mb-2">
                  <button type="button" class="btn btn-outline-info btn-lg btn-block" (click)="noteInput.value = note">
                    {{ note }}
                  </button>
                </div>
              }
            </div>
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-warning btn-lg" (click)="close({ action: 'dont_give' })">Verme</button>
          @if (data?.permissions?.discount) {
            <button type="button" class="btn btn-danger btn-lg" (click)="close({ action: 'gift' })">İkram</button>
          }
          <button type="submit" class="btn btn-primary btn-lg">Not Ekle</button>
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; }
    .btn-block { width: 100%; }
  `]
})
export class NoteModalComponent extends BaseModalComponent<any> {
    constructor(
        dialogRef: DialogRef<any>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
    }
}
