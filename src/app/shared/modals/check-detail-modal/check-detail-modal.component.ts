import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';
import { GeneralPipe } from '../../pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, PricePipe, GeneralPipe],
  selector: 'app-check-detail-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Hesap Detayı</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-0">
        <div class="card checkDetail border-0">
          <div class="card-header bg-light">
            <b>
              @if (data?.type === 'customer') {
                {{ data?.table_id | general:'customers' | async }}
              } @else {
                {{ data?.table_id | general:'tables' | async }}
              }
              @if (data?.timestamp) {
                <small class="text-muted"> ({{ data.timestamp | date:'dd/MM/yyyy HH:mm' }})</small>
              }
            </b>
            <span class="pull-right text-muted"> Hesap Türü : {{ data?.payment_method }}</span>
          </div>
          <div class="card-body flow p-0" style="max-height: 400px; overflow-y: auto;">
            @if (data?.payment_method !== 'Parçalı') {
              <table class="table table-striped table-bordered table-sm mb-0">
                <thead class="thead-dark">
                  <tr>
                    <th width="6%">#</th>
                    <th width="44%">Ürün</th>
                    <th width="17%">Garson</th>
                    <th width="14%">Saat</th>
                    <th width="17%">Fiyat</th>
                  </tr>
                </thead>
                <tbody>
                  @for (item of data?.products; track $index) {
                    <tr [ngClass]="{'table-danger': item.status === 3}">
                      <td>{{ $index + 1 }}</td>
                      <td>{{ item.name }}
                        @if (item.note) {
                          <small class="text-muted">({{ item.note }})</small>
                        }
                      </td>
                      <td>{{ item.owner | general:'users' | async }}</td>
                      <td>{{ item.timestamp | date:'HH:mm' }}</td>
                      <td>{{ item.price | price }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            }
            @if (data?.payment_method === 'Parçalı') {
              <section>
                @for (item of data?.payment_flow; track $index) {
                  <table class="table table-sm table-bordered table-striped mb-0">
                    <thead class="table-dark">
                      <tr>
                        <th width="6%">#</th>
                        <th width="45%">{{ item.owner }}</th>
                        <th width="15%">{{ item.method }}</th>
                        <th width="15%">{{ item.timestamp | date:'HH:mm' }}</th>
                        <th width="17%">{{ (item.amount || 0) + (item.discount || 0) | price }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      @if (item.discount > 0) {
                        <tr class="table-info">
                          <td><i class="fa fa-arrow-down" aria-hidden="true"></i></td>
                          <td colspan="3">İndirim Tutarı</td>
                          <td>{{ item.discount | price }}</td>
                        </tr>
                      }
                      @for (product of item.payed_products; track $index) {
                        <tr [ngClass]="{'table-danger': product.status === 3}">
                          <td width="4%">{{ $index + 1 }}</td>
                          <td width="48%">{{ product.name }}
                            @if (product.note) {
                              <small class="text-muted">({{ product.note }})</small>
                            }
                          </td>
                          <td width="15%">{{ product.owner | general:'users' | async }}</td>
                          <td width="15%">{{ product.timestamp | date:'HH:mm' }}</td>
                          <td width="17%">{{ product.price | price }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </section>
            }
          </div>
          <div class="card-footer bg-light p-2">
            <b>
              <i class="fa fa-user mr-1" aria-hidden="true"></i> Kullanıcı:
              <span class="pull-right">{{ data?.owner }}</span>
            </b>
          </div>
          @if ((data?.discount ?? 0) > 0) {
            <div class="card-footer bg-light p-2">
              <b>
                <i class="fa fa-arrow-down" aria-hidden="true"></i> Toplam İndirim Tutarı:
                <span class="pull-right">{{ data?.discount | price }}</span>
              </b>
            </div>
          }
          <div class="card-footer bg-light p-2">
            <b>
              <i class="fa fa-check" aria-hidden="true"></i> Ödenen Miktar:
              <span class="pull-right">{{ data?.total_price | price }}</span>
            </b>
          </div>
        </div>
      </div>
      <div class="modal-footer d-flex justify-content-center flex-wrap gap-2">
        <button (click)="close({ action: 'print', data: data })" class="btn btn-primary btn-lg">
          <i class="fa fa-print" aria-hidden="true"></i> Yazdır
        </button>
        
        @if (!data?.readOnly) {
          @if (data?.type !== 'customer' && data?.status !== 3) {
            <button (click)="close({ action: 'cancel_check', data: data })" class="btn btn-danger btn-lg">
              <i class="fa fa-times" aria-hidden="true"></i> İptal Et
            </button>
            
            <button (click)="close({ action: 'edit_check', data: data })" class="btn btn-success btn-lg">
              <i class="fa fa-edit" aria-hidden="true"></i> Hesap Düzelt
            </button>
          }

          @if (data?.type !== 'customer') {
            <button type="button" (click)="close({ action: 'reopen', data: data })" class="btn btn-info btn-lg">
              <i class="fa fa-undo"></i> Hesabı Geri Aç
            </button>
          }
        }
        
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
    .flow { max-height: 480px; overflow-y: auto; }
    .checkDetail .card-footer { font-size: 1rem; }
    .gap-2 { gap: 0.5rem; }
  `]
})
export class CheckDetailModalComponent extends BaseModalComponent<any> {
  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);
  }
}
