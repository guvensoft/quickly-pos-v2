import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';

export interface SelectionItem {
  id: any;
  label: string;
  subLabel?: string;
  data?: any;
}

export interface SelectionModalData {
  title?: string;
  items: SelectionItem[];
}

@Component({
  standalone: true,
  imports: [CommonModule, PricePipe],
  selector: 'app-selection-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">{{ data.title || 'Seçim Yapınız' }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-3">
        <div class="row g-2">
          @for (item of data.items; track item.id || $index) {
            <div class="col-12 col-md-6 mb-2">
              <button (click)="close(item)" class="btn btn-outline-primary btn-lg btn-block text-left p-3 d-flex justify-content-between align-items-center">
                <span>{{ item.label }}</span>
                @if (item.subLabel) {
                  <span class="badge badge-secondary">{{ item.subLabel }}</span>
                }
              </button>
            </div>
          } @empty {
            <div class="col-12 text-center py-5">
              <p class="text-muted">Seçenek bulunamadı.</p>
            </div>
          }
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
    .btn-block { width: 100%; }
  `]
})
export class SelectionModalComponent extends BaseModalComponent<SelectionModalData> {
  constructor(
    protected override dialogRef: DialogRef<SelectionItem>,
    @Inject(DIALOG_DATA) public override data: SelectionModalData
  ) {
    super(dialogRef, data);
  }
}
