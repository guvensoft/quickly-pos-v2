import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { BaseChartDirective } from 'ng2-charts';

@Component({
    standalone: true,
    imports: [CommonModule, BaseChartDirective],
    selector: 'app-chart-modal',
    template: `
    <div class="modal-content">
      <div class="modal-header">
        <h4 class="modal-title">{{ data.title }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-4 bg-dark">
        <div style="display: block; width: 100%; height: 400px;">
          <canvas baseChart 
            [datasets]="data.datasets"
            [labels]="data.labels"
            [options]="data.options"
            [legend]="data.legend"
            [type]="data.type">
          </canvas>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border-radius: 15px; overflow: hidden; border: none; }
    .modal-header { border-bottom: none; background: #fff; }
    .modal-footer { border-top: none; background: #fff; }
  `]
})
export class ChartModalComponent extends BaseModalComponent<void> {
    constructor(
        dialogRef: DialogRef<void>,
        @Inject(DIALOG_DATA) public override data: {
            title: string,
            datasets: any[],
            labels: string[],
            options: any,
            legend: boolean,
            type: any
        }
    ) {
        super(dialogRef, data);
    }
}
