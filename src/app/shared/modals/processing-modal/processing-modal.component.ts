import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';

@Component({
    standalone: true,
    imports: [CommonModule],
    selector: 'app-processing-modal',
    template: `
    <div class="modal-content text-center p-5">
      <div class="modal-body">
        <h4 class="mb-4">{{ data.title }}</h4>
        <div class="spinner-container mb-4">
           <i class="fa fa-refresh fa-spin fa-5x text-info"></i>
        </div>
        <div class="progress-status mt-3 font-weight-bold h5 text-muted">
          {{ message() }}
        </div>
      </div>
    </div>
  `,
    styles: [`
    .modal-content { border-radius: 20px; border: none; }
    .spinner-container { height: 100px; display: flex; align-items: center; justify-content: center; }
  `]
})
export class ProcessingModalComponent extends BaseModalComponent<void> {
    readonly message = signal<string>('');

    constructor(
        dialogRef: DialogRef<void>,
        @Inject(DIALOG_DATA) public override data: { title: string, message: string }
    ) {
        super(dialogRef, data);
        this.message.set(data.message);
    }
}
