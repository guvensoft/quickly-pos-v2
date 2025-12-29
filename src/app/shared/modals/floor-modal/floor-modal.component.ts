import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { Floor } from '../../../core/models/table.model';

@Component({
    standalone: true,
    imports: [CommonModule, FormsModule],
    selector: 'app-floor-modal',
    template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">{{ data ? 'Bölge Düzenle' : 'Bölge Oluştur' }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #floorForm="ngForm" (ngSubmit)="close(floorForm.value)">
        <div class="modal-body">
          <input type="hidden" name="_id" [ngModel]="data?._id">
          <input type="hidden" name="_rev" [ngModel]="data?._rev">
          <input type="hidden" name="status" [ngModel]="data?.status || 1">
          <input type="hidden" name="timestamp" [ngModel]="data?.timestamp">

          <div class="form-group">
            <div class="input-group">
              <div class="input-group-prepend">
                <div class="input-group-text">Bölüm Adı</div>
              </div>
              <input type="text" name="name" class="form-control form-control-lg" [ngModel]="data?.name" required />
            </div>
            
            <div class="input-group mt-2">
              <div class="input-group-prepend">
                <div class="input-group-text">Durum</div>
              </div>
              <select name="special" class="form-control form-control-lg" [ngModel]="data?.special || 1">
                <option [value]="1">Herkese Açık</option>
                <option [value]="2">Sadece Rezervasyon</option>
                <option [value]="3">İşletmeye Özel</option>
              </select>
            </div>
            
            <div class="input-group mt-2">
              <div class="input-group-prepend">
                <div class="input-group-text">Açıklama</div>
              </div>
              <input type="text" name="description" class="form-control form-control-lg" [ngModel]="data?.description" />
            </div>
          </div>

          <h5 class="mt-3">Bölge Özellikleri</h5>
          <table class="table table-bordered text-center">
            <thead>
              <tr>
                <th width="20%" class="text-center">Rezervasyon</th>
                <th width="20%" class="text-center">Açık Hava</th>
                <th width="20%" class="text-center">Sigara</th>
                <th width="20%" class="text-center">Müzik</th>
                <th width="20%" class="text-center">Etkinlik</th>
              </tr>
            </thead>
            <tbody>
              <tr class="text-center">
                <td>
                  <input type="checkbox" name="reservation" class="form-control" [ngModel]="data?.conditions?.reservation" />
                </td>
                <td>
                  <input type="checkbox" name="air" class="form-control" [ngModel]="data?.conditions?.air" />
                </td>
                <td>
                  <input type="checkbox" name="cigarate" class="form-control" [ngModel]="data?.conditions?.cigarate" />
                </td>
                <td>
                  <input type="checkbox" name="music" class="form-control" [ngModel]="data?.conditions?.music" />
                </td>
                <td>
                  <input type="checkbox" name="events" class="form-control" [ngModel]="data?.conditions?.events" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
          <button type="submit" class="btn btn-primary btn-lg" [disabled]="!floorForm.valid">Kaydet</button>
        </div>
      </form>
    </div>
  `,
    styles: [`
    .modal-content { border: none; box-shadow: none; }
    .input-group-text { min-width: 120px; }
    .form-control-lg { font-size: 1.1rem; }
  `]
})
export class FloorModalComponent extends BaseModalComponent<Floor> {
    constructor(
        dialogRef: DialogRef<any>,
        @Inject(DIALOG_DATA) data: Floor
    ) {
        super(dialogRef, data);
    }
}
