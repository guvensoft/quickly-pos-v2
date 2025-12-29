import { Component, Inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PricePipe } from '../../pipes/price.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe],
  selector: 'app-numpad-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">{{ data?.productName }}</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <div class="modal-body p-0">
        <div class="card border-0">
          <div class="card-body p-3 bg-light">
            <div class="input-group input-group-lg shadow-sm">
              <input type="text" readonly class="form-control text-right display-font" [value]="numpad()">
              <div class="input-group-append">
                <span class="input-group-text unit-font">{{ data?.unit || 'Adet' }}</span>
              </div>
              @if (data?.showTare) {
                <div class="input-group-append">
                  <button (click)="tare()" class="btn btn-danger">Dara</button>
                </div>
              }
            </div>
          </div>
          <div class="card-body p-3">
            <div class="row g-2">
              @for (key of numboard; track key) {
                <div class="col-4 mb-2">
                  <button (click)="pushKey(key)" 
                    class="btn btn-outline-dark btn-block btn-lg p-4 key-btn"
                    [disabled]="isKeyDisabled(key)">
                    {{ key }}
                  </button>
                </div>
              }
            </div>
          </div>
          <div class="card-footer bg-white border-top-0 p-4">
            <div class="d-flex justify-content-between align-items-center">
              <h3 class="mb-0 text-muted">Toplam Tutar:</h3>
              <h2 class="mb-0 font-weight-bold text-primary">{{ totalPrice() | price }}</h2>
            </div>
          </div>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">Kapat</button>
        <button type="button" (click)="submit()" [disabled]="totalPrice() === 0" class="btn btn-success btn-lg px-5">
          <i class="fa fa-check mr-2"></i> Onayla
        </button>
      </div>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; border-radius: 15px; overflow: hidden; }
    .display-font { font-size: 2.5rem; font-weight: 600; font-family: 'Courier New', Courier, monospace; }
    .unit-font { font-size: 1.2rem; font-weight: 500; }
    .key-btn { font-size: 1.8rem; font-weight: 700; border-radius: 12px; transition: all 0.1s; border-width: 2px; }
    .key-btn:active { background-color: #343a40 !important; color: white !important; transform: scale(0.95); }
    .btn-block { width: 100%; }
  `]
})
export class NumpadModalComponent extends BaseModalComponent<number> {
  readonly numpad = signal<string>('');
  readonly numboard = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '◂'];

  readonly totalPrice = computed(() => {
    const val = parseFloat(this.numpad()) || 0;
    const price = this.data.productPrice || 0;
    const referenceAmount = this.data.stockAmount || 1;
    return (val * price) / referenceAmount;
  });

  constructor(
    dialogRef: DialogRef<number>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);
    if (data?.scaler$) {
      // Unsubscribe happens when modal is destroyed because we use a local subscription if we had one,
      // but here we just subscribe. For better hygiene, let's track it.
      data.scaler$.subscribe((v: number) => {
        if (v !== undefined && v !== null) {
          this.numpad.set(v.toString());
        }
      });
    }
  }

  isKeyDisabled(key: string): boolean {
    if (key === '◂') return this.numpad() === '';
    if (key === '.') return this.numpad().includes('.') || this.numpad() === '' || this.data.unit === 'Adet';
    if (key === '0') return this.numpad() === '';
    return false;
  }

  pushKey(key: string) {
    if (key === '◂') {
      this.numpad.update(v => v.slice(0, -1));
    } else {
      this.numpad.update(v => v + key);
    }
  }

  tare() {
    if (this.data?.onTare) {
      this.data.onTare(parseFloat(this.numpad()) || 0);
    }
  }

  submit() {
    this.close(parseFloat(this.numpad()));
  }
}
