import { Component, Inject, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    selector: 'app-json-editor-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">{{ data?.onCreate ? 'Döküman Oluştur' : 'Döküman Düzenle' }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-2">
        <textarea #editArea rows="18" class="form-control json-editor" [ngModel]="jsonString"></textarea>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
        @if (!data?.onCreate) {
          <button type="button" (click)="onDelete()" class="btn btn-danger btn-lg">Sil</button>
          <button type="button" (click)="onSave(editArea.value)" class="btn btn-success btn-lg">Kaydet</button>
        }
        @if (data?.onCreate) {
          <button type="button" (click)="onSave(editArea.value)" class="btn btn-success btn-lg">Oluştur</button>
        }
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; }
    .json-editor { font-family: monospace; font-size: 14px; background-color: #f8f9fa; }
  `]
})
export class JsonEditorModalComponent extends BaseModalComponent<any> {
    jsonString: string = '';

    constructor(
        dialogRef: DialogRef<any>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
        this.jsonString = JSON.stringify(data.document || {}, null, 2);
    }

    onSave(value: string) {
        this.close({ action: 'save', value });
    }

    onDelete() {
        this.close({ action: 'delete' });
    }
}
