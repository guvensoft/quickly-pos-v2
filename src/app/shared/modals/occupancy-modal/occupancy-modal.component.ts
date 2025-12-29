import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-occupancy-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Kişi Sayısı</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-4">
        <div class="occupancy-control mb-5">
          <div class="d-flex align-items-center mb-3">
             <i class="fa fa-male fa-3x text-primary mr-4" style="width: 40px"></i>
             <div class="btn-group btn-group-lg flex-grow-1 shadow-sm">
               @for (num of [1,2,3,4,5,6,7,8]; track num) {
                 <button (click)="maleCount.set(num)" 
                  class="btn btn-outline-primary" 
                  [class.active]="maleCount() === num">{{ num }}</button>
               }
             </div>
          </div>
        </div>

        <div class="occupancy-control">
          <div class="d-flex align-items-center">
             <i class="fa fa-female fa-3x text-danger mr-4" style="width: 40px"></i>
             <div class="btn-group btn-group-lg flex-grow-1 shadow-sm">
               @for (num of [1,2,3,4,5,6,7,8]; track num) {
                 <button (click)="femaleCount.set(num)" 
                  class="btn btn-outline-danger" 
                  [class.active]="femaleCount() === num">{{ num }}</button>
               }
             </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
        <button type="button" (click)="close({ male: maleCount(), female: femaleCount() })" class="btn btn-primary btn-lg px-5">Tamam</button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; border-radius: 15px; }
    .btn-group .btn { min-width: 60px; font-weight: bold; border-width: 2px; }
    .btn-group .btn.active { box-shadow: inset 0 3px 5px rgba(0,0,0,0.125); }
  `]
})
export class OccupancyModalComponent extends BaseModalComponent<{ male: number, female: number }> {
    readonly maleCount = signal<number>(0);
    readonly femaleCount = signal<number>(0);

    constructor(
        dialogRef: DialogRef<{ male: number, female: number }>,
        @Inject(DIALOG_DATA) data: any
    ) {
        super(dialogRef, data);
        if (data?.occupation) {
            this.maleCount.set(data.occupation.male || 0);
            this.femaleCount.set(data.occupation.female || 0);
        }
    }
}
