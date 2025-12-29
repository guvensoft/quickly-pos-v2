import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-table-selection-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">{{ data?.title || 'Masa Seçiniz' }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-0">
        <div class="row no-gutters">
          <!-- Floors Sidebar -->
          <div class="col-md-3 bg-light border-right floor-sidebar">
            <div class="list-group list-group-flush">
              <button (click)="selectedFloorId.set(null)" 
                class="list-group-item list-group-item-action p-4"
                [class.active]="selectedFloorId() === null">
                Tüm Masalar
              </button>
              @for (floor of data?.floors; track floor._id) {
                <button (click)="selectedFloorId.set(floor._id)" 
                  class="list-group-item list-group-item-action p-4"
                  [class.active]="selectedFloorId() === floor._id">
                  {{ floor.name }}
                </button>
              }
            </div>
          </div>
          
          <!-- Tables Grid -->
          <div class="col-md-9 p-3 table-grid-container">
            <div class="row">
              @for (table of filteredTables(); track table._id) {
                <div class="col-4 col-lg-3 mb-3">
                  <button (click)="selectedTableId.set(table._id)" 
                    class="btn btn-block table-btn p-3 d-flex flex-column align-items-center"
                    [class.btn-dark]="selectedTableId() === table._id"
                    [class.btn-outline-success]="table.status === 2 && selectedTableId() !== table._id"
                    [class.btn-outline-danger]="table.status === 3 && selectedTableId() !== table._id"
                    [class.btn-outline-warning]="table.status === 1 && table._id !== data?.currentTableId && selectedTableId() !== table._id"
                    [class.btn-info]="table._id === data?.currentTableId && selectedTableId() !== table._id">
                    <span class="font-weight-bold truncate">{{ table.name }}</span>
                    <small><i class="fa fa-user"></i> {{ table.capacity }}</small>
                  </button>
                </div>
              } @empty {
                <div class="col-12 text-center py-5">
                  <p class="text-muted">Bu katta masa bulunamadı.</p>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        <button type="button" class="btn btn-primary btn-lg" [disabled]="!selectedTableId()" (click)="close(selectedTableId())">
          {{ data?.actionText || 'Tamam' }}
        </button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; max-width: 90vw; }
    .floor-sidebar { max-height: 70vh; overflow-y: auto; }
    .table-grid-container { max-height: 70vh; overflow-y: auto; }
    .table-btn { 
      min-height: 80px; 
      border-radius: 10px; 
      transition: all 0.2s;
    }
    .truncate {
      width: 100%;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .btn-block { width: 100%; }
    .list-group-item.active { background-color: #dc3545; border-color: #dc3545; }
  `]
})
export class TableSelectionModalComponent extends BaseModalComponent<string> {
    readonly selectedFloorId = signal<string | null>(null);
    readonly selectedTableId = signal<string | null>(null);

    readonly filteredTables = computed(() => {
        const floorId = this.selectedFloorId();
        if (!floorId) return this.data.tables;
        return this.data.tables.filter((t: any) => t.floor_id === floorId);
    });

    constructor(
        dialogRef: DialogRef<string>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
    }
}
