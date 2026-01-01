import { Component, Inject, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { PrinterService } from '../../../core/services/printer.service';
import { MessageService } from '../../../core/services/message.service';
import { Printer } from '../../../core/models/settings.model';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  selector: 'app-printer-add-modal',
  template: `
    <div class="modal-content" (keydown)="onKeyDown($event)">
      <div class="modal-header">
        <h4 class="modal-title">Yazıcı Ekle</h4>
        <button type="button" class="close" (click)="cancel()" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
      <form #printerForm="ngForm" (ngSubmit)="onSubmit(printerForm.value)">
        <div class="modal-body">
          @if (printerProcess() === undefined) {
          <section id="selection">
            <p class="text-muted">Lütfen eklemek istediğiniz yazıcı tipini seçiniz.</p>
            <div class="row">
              <div class="col-lg-6 pr-2 mb-2">
                <button type="button" (click)="getPrinters('USB')" class="btn btn-primary btn-lg btn-block">
                  <i class="fa fa-usb" aria-hidden="true"></i> USB</button>
              </div>
              <div class="col-lg-6 pl-2 mb-2">
                <button type="button" (click)="getPrinters('LAN')" class="btn btn-primary btn-lg btn-block">
                  <i class="fa fa-sitemap" aria-hidden="true"></i> LAN</button>
              </div>
            </div>
            <div class="row mt-2">
              <div class="col-lg-6 pr-2 mb-2">
                <button type="button" (click)="getPrinters('SERIAL')" class="btn btn-primary btn-lg btn-block">
                  <i class="fa fa-plug" aria-hidden="true"></i> SERIAL</button>
              </div>
              <div class="col-lg-6 pl-2 mb-2">
                <button type="button" (click)="getPrinters('BLUETOOTH')" class="btn btn-primary btn-lg btn-block">
                  <i class="fa fa-bluetooth" aria-hidden="true"></i> BLUETOOTH</button>
              </div>
            </div>
          </section>
          } @else {
          <section id="form">
            @if (printersFound().length > 0 && selectedPrinter() === undefined) {
            <section id="usbPrinters">
              <p class="text-muted">Kurulum yapmak istediğiniz yazıcıyı seçiniz.</p>
              <div class="row">
                @for (item of printersFound(); track $index) {
                <div class="col-12 mb-2">
                  <div class="card p-3 bg-dark text-white">
                    <div class="card-body p-2">
                      <h5 class="card-title mb-1">
                        <i class="fa fa-print" aria-hidden="true"></i> USB Yazıcı
                      </h5>
                      <p class="card-text small mb-2">Bulunduğu Port: {{item.portNumbers[0]}}</p>
                      <div class="row">
                        <div class="col-6 pr-1">
                          <button type="button" (click)="printTest(item)" class="btn btn-sm btn-secondary btn-block">
                            <i class="fa fa-print" aria-hidden="true"></i> Sınama
                          </button>
                        </div>
                        <div class="col-6 pl-1">
                          <button type="button" (click)="selectedPrinter.set(item)"
                            class="btn btn-sm btn-success btn-block">
                            <i class="fa fa-check" aria-hidden="true"></i> Seç
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                }
              </div>
            </section>
            }
            @if (selectedPrinter() !== undefined || (printerProcess() === 'LAN' && printersFound().length === 0)) {
            <section id="printerFormHolder">
              <h4 class="h5 font-weight-bold mb-3">{{printerProcess()}} Yazıcı
                @if (printerProcess() === 'USB' && selectedPrinter()) {
                <span class="pull-right text-muted small">Port: {{selectedPrinter().portNumbers[0]}}</span>
                }
              </h4>
              <div class="form-group mb-2">
                <div class="input-group">
                  <div class="input-group-prepend">
                    <div class="input-group-text">Yazıcı Adı</div>
                  </div>
                  <input type="text" name="name" class="form-control form-control-lg" ngModel required>
                </div>
              </div>
              <div class="form-group mb-2">
                <div class="input-group">
                  <div class="input-group-prepend">
                    <div class="input-group-text">Açıklama</div>
                  </div>
                  <input type="text" name="note" class="form-control form-control-lg" ngModel>
                </div>
              </div>
                @if (printerProcess() === 'LAN') {
                <div class="form-group mb-2">
                  <div class="input-group">
                    <div class="input-group-prepend">
                      <div class="input-group-text">IP Adresi</div>
                    </div>
                    <input type="text" name="port_number" class="form-control form-control-lg" ngModel required>
                  </div>
                </div>
                }
              <div class="form-group mb-2">
                <div class="input-group">
                  <div class="input-group-prepend">
                    <div class="input-group-text">Tür</div>
                  </div>
                  <select name="mission" class="form-control form-control-lg" ngModel required>
                    <option value="Adisyon">Hesap Yazıcısı</option>
                    <option value="Sipariş">Sipariş Yazıcısı</option>
                  </select>
                </div>
              </div>
            </section>
            }
          </section>
          }
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-secondary btn-lg" (click)="cancel()">İptal</button>
          @if (selectedPrinter() !== undefined || printerProcess() === 'LAN') {
            <button type="submit" class="btn btn-danger btn-lg" [disabled]="!printerForm.valid">Kaydet</button>
          }
        </div>
      </form>
    </div>
  `,
  styles: [`
    .modal-content { border: none; box-shadow: none; }
    .input-group-text { min-width: 100px; }
    .card-primary { background-color: #007bff; }
  `]
})
export class PrinterAddModalComponent extends BaseModalComponent<any> {
  private readonly printerService = inject(PrinterService);
  private readonly message = inject(MessageService);

  readonly printerProcess = signal<string | undefined>(undefined);
  readonly printersFound = signal<Array<any>>([]);
  readonly selectedPrinter = signal<any>(undefined);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);
  }

  getPrinters(type: string) {
    switch (type) {
      case 'USB':
        const usbPrinters = this.printerService.getUSBPrinters();
        if (usbPrinters && Array.isArray(usbPrinters) && usbPrinters.length > 0) {
          this.printerProcess.set('USB');
          this.printersFound.set(usbPrinters);
        } else {
          this.message.sendMessage('USB portlarında takılı yazıcı bulunamadı..');
        }
        break;
      case 'LAN':
        this.printerProcess.set('LAN');
        this.printersFound.set([]);
        this.selectedPrinter.set({});
        break;
      case 'SERIAL':
        this.printerProcess.set('SERIAL');
        const serialPrinters = this.printerService.getSerialPrinters('/dev/ttyS0');
        this.printersFound.set(serialPrinters ? [serialPrinters] : []);
        this.selectedPrinter.set({});
        break;
      case 'BLUETOOTH':
        this.printerProcess.set('BLUETOOTH');
        this.printersFound.set([]);
        this.selectedPrinter.set({});
        break;
    }
  }

  printTest(device: any) {
    this.printerService.printTest(device);
  }

  onSubmit(form: any) {
    let address;
    if (form.port_number === undefined) {
      if (this.selectedPrinter() && this.selectedPrinter().portNumbers && this.selectedPrinter().portNumbers.length > 0) {
        address = this.selectedPrinter().portNumbers[0];
      }
    } else {
      address = form.port_number;
    }

    if (!form.name) {
      this.message.sendMessage('Yazıcı Adı Girmek Zorundasınız.');
      return;
    }

    const printer = new Printer(form.name, this.printerProcess()!, form.note, address, form.mission);
    this.close(printer);
  }
}
