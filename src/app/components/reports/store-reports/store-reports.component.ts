import { Component, inject, signal, computed, viewChild, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Check, ClosedCheck, PaymentStatus, CheckType, CheckStatus, CheckNo } from '../../../core/models/check.model';
import { Log } from '../../../core/models/log.model';
import { MessageService } from '../../../core/services/message.service';
import { PrinterService } from '../../../core/services/printer.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe, GeneralPipe],
  selector: 'app-store-reports',
  templateUrl: './store-reports.component.html',
  styleUrls: ['./store-reports.component.scss'],
})

export class StoreReportsComponent {
  private readonly mainService = inject(MainService);
  private readonly printerService = inject(PrinterService);
  private readonly settingsService = inject(SettingsService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly zone = inject(NgZone);

  readonly AllChecks = signal<ClosedCheck[]>([]);
  readonly FastChecks = signal<ClosedCheck[]>([]);
  readonly DeliveryChecks = signal<ClosedCheck[]>([]);
  readonly NormalChecks = signal<ClosedCheck[]>([]);
  readonly NotPayedChecks = signal<ClosedCheck[]>([]);

  readonly checkDetail = signal<any>(null);
  readonly selectedCat = signal<any>(null);
  readonly selectedPayment = signal<PaymentStatus | null>(null);
  readonly selectedPaymentIndex = signal<number>(0);

  readonly NormalTotal = computed(() =>
    this.NormalChecks()
      .filter((obj: any) => obj.payment_method !== 'İkram')
      .map((obj: any) => obj.total_price)
      .reduce((a: number, b: number) => a + b, 0)
  );
  readonly FastTotal = computed(() =>
    this.FastChecks()
      .filter((obj: any) => obj.payment_method !== 'İkram')
      .map((obj: any) => obj.total_price)
      .reduce((a: number, b: number) => a + b, 0)
  );
  readonly DeliveryTotal = computed(() =>
    this.DeliveryChecks()
      .filter((obj: any) => obj.payment_method !== 'İkram')
      .map((obj: any) => obj.total_price)
      .reduce((a: number, b: number) => a + b, 0)
  );

  readonly printers = signal<any[]>([]);
  readonly sellingLogs = signal<Log[]>([]);
  readonly day = signal<number>(0);
  readonly permissions = signal<any>({});

  editForm = viewChild<NgForm>('checkEdit');

  constructor() {
    // Initialize permissions from localStorage
    try {
      const userPermissions = localStorage.getItem('userPermissions');
      this.permissions.set(userPermissions ? JSON.parse(userPermissions) : {});
    } catch (error) {
      console.error('Error parsing userPermissions:', error);
      this.permissions.set({});
    }

    // DateSettings subscription
    effect(() => {
      this.settingsService.DateSettings.subscribe(res => {
        this.day.set(res.value.day);
      });
    }, { allowSignalWrites: true });

    // getPrinters subscription
    effect(() => {
      this.settingsService.getPrinters().subscribe(res => {
        this.printers.set(res.value);
      });
    }, { allowSignalWrites: true });

    this.fillData();
  }

  getDetail(check: any) {
    this.checkDetail.set(check);
    this.zone.run(() => {
      (window as any).$('#reportDetail').modal('show');
    });
  }

  filterTables(value: string) {
    if (value == '' || null) {
      this.fillData();
    } else {
      const regexp = new RegExp(value, 'i');
      this.mainService.getAllBy('tables', { name: { $regex: regexp } }).then(data => {
        this.zone.run(() => {
          if (data.docs.length > 0) {
            const results = this.AllChecks().filter((obj: any) => obj.table_id == data.docs[0]._id);
            if (results.length > 0) {
              this.NormalChecks.set(results);
            }
          }
        });
      });
    }
  }

  filterChecks(value: string) {
    if (this.AllChecks()) {
      this.FastChecks.set(this.AllChecks().filter((obj: any) => obj.owner.toLocaleLowerCase().includes(value.toLocaleLowerCase()) && obj.type == 2));
    }
  }

  getFastChecksBy(method: any) {
    if (this.AllChecks()) {
      this.FastChecks.set(this.AllChecks().filter((obj: any) => obj.payment_method == method && obj.type == 2));
    }
  }

  getNormalChecksBy(method: any) {
    if (this.AllChecks()) {
      this.NormalChecks.set(this.AllChecks().filter((obj: any) => obj.payment_method == method && obj.type == CheckType.NORMAL));
    }
  }

  getDeliveryChecksBy(method: any) {
    if (this.AllChecks()) {
      this.DeliveryChecks.set(this.AllChecks().filter((obj: any) => obj.payment_method == method && obj.type == CheckType.ORDER));
    }
  }

  rePrintCheck(check: any) {
    this.mainService.getData('tables', check.table_id).then(res => {
      this.zone.run(() => {
        const printers = this.printers();
        if (!printers || printers.length === 0) return;

        if (check.products && check.products.length > 0) {
          this.printerService.printCheck(printers[0], res.name, check);
        } else {
          if (check.payment_flow && Array.isArray(check.payment_flow)) {
            check.products = check.payment_flow.reduce((a: any, b: any) => {
              return a.concat(b.payed_products || []);
            }, []);
          } else {
            check.products = [];
          }
          this.printerService.printCheck(printers[0], res.name, check);
        }
      });
    }).catch(err => {
      this.zone.run(() => {
        const printers = this.printers();
        if (printers && printers.length > 0) {
          this.printerService.printCheck(printers[0], check.table_id, check);
        }
      });
    });
  }

  reOpenCheck(check: ClosedCheck) {
    let checkWillReOpen;
    let discount = 0;
    if (check.payment_flow) {
      check.payment_flow.forEach(element => {
        discount += element.amount;
      });
      checkWillReOpen = new Check('Hızlı Satış', 0, discount, check.owner, 'Geri Açılan', check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    } else {
      checkWillReOpen = new Check('Hızlı Satış', check.total_price, check.discount, check.owner, 'Geri Açılan', check.status, check.products, Date.now(), CheckType.FAST, CheckNo(), check.payment_flow);
    }
    this.mainService.addData('checks', checkWillReOpen).then(res => {
      this.zone.run(() => {
        this.mainService.removeData('closed_checks', (check as any)._id).then(res => {
          this.fillData();
          this.zone.run(() => {
            (window as any).$('#checkDetail').modal('hide');
          });
          this.messageService.sendAlert('Başarılı !', 'Hesap Geri Açıldı', 'success');
        });
      });
    });
    const currentDay = this.day();
    if (check.payment_method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: check.payment_method }).then(res => {
        if (res && res.docs && res.docs.length > 0) {
          this.mainService.changeData('reports', res.docs[0]._id!, (doc: any) => {
            doc.weekly[currentDay] -= check.total_price;
            doc.weekly_count[currentDay]--;
            return doc;
          });
        }
      });
    } else {
      check.payment_flow!.forEach((element: any) => {
        this.mainService.getAllBy('reports', { connection_id: element.method }).then(res => {
          if (res && res.docs && res.docs.length > 0) {
            this.mainService.changeData('reports', res.docs[0]._id!, (doc: any) => {
              doc.weekly[currentDay] -= element.amount;
              return doc;
            });
          }
        });
      });
    }
  }

  editCheck(form: NgForm) {
    const Form = form.value;
    const currentDay = this.day();
    const detail = this.checkDetail();
    if (detail.payment_method !== Form.payment_method) {
      this.mainService.getAllBy('reports', { connection_id: detail.payment_method }).then(res => {
        if (res && res.docs && res.docs.length > 0) {
          const docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id!, (doc: any) => {
            doc.weekly[currentDay] -= detail.total_price;
            doc.weekly_count[currentDay]--
            return doc;
          });
        }
      });
      this.mainService.getAllBy('reports', { connection_id: Form.payment_method }).then(res => {
        if (res && res.docs && res.docs.length > 0) {
          const docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id!, (doc: any) => {
            doc.weekly[currentDay] += Form.total_price;
            doc.weekly_count[currentDay]++
            return doc;
          });
        }
      });
      this.mainService.updateData('closed_checks', detail._id, { total_price: Form.total_price, payment_method: Form.payment_method }).then(res => {
        this.zone.run(() => {
          this.messageService.sendMessage('Hesap Düzenlendi!');
          this.fillData();
          this.zone.run(() => {
            (window as any).$('#editCheck').modal('hide');
          });
        });
      });
    } else {
      if (detail.total_price !== Form.total_price) {
        this.mainService.getAllBy('reports', { connection_id: detail.payment_method }).then(res => {
          if (res && res.docs && res.docs.length > 0) {
            const docReport = res.docs[0];
            this.mainService.changeData('reports', docReport._id!, (doc: any) => {
              doc.weekly[currentDay] -= detail.total_price;
              doc.weekly[currentDay] += Form.total_price;
              return doc;
            });
          }
        });
        this.mainService.updateData('closed_checks', detail._id, { total_price: Form.total_price }).then(res => {
          this.zone.run(() => {
            this.messageService.sendMessage('Hesap Düzenlendi!');
            this.fillData();
            this.zone.run(() => {
              (window as any).$('#editCheck').modal('hide');
            });
          });
        });
      } else {
        return false;
      }
    }
    this.logService.createLog(logType.CHECK_UPDATED, Form._id, `${detail.total_price} TL tutarındaki kapatılan ${detail.payment_method} hesap ${Form.total_price} TL ${Form.payment_method} olarak güncellendi.`);
  }

  cancelCheck(id: any, note: any) {
    const detail = this.checkDetail();
    this.messageService.sendConfirm('Kapanmış Hesap İptal Edilecek! Bu işlem geri alınamaz!').then(isOK => {
      if (isOK) {
        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then(res => {
          this.zone.run(() => {
            this.logService.createLog(logType.CHECK_CANCELED, id, `${detail.total_price} TL tutarındaki kapatılan hesap iptal edildi. Açıklama:'${note}'`);
            this.fillData();
            this.zone.run(() => {
              (window as any).$('#cancelDetail').modal('hide');
            });
          });
        });
      }
    });
  }

  editPayment(i: number) {
    this.zone.run(() => {
      (window as any).$('#editCheck').modal('hide');
    });
    const detail = this.checkDetail();
    this.selectedPayment.set(detail.payment_flow[i]);
    this.selectedPaymentIndex.set(i);
    this.zone.run(() => {
      (window as any).$('#paymentDetail').modal('show');
    });
  }

  changePayment(paymentDetail: NgForm) {
    const Form = paymentDetail.value;
    const selectedPay = this.selectedPayment();
    const detail = this.checkDetail();
    const currentDay = this.day();

    if (!selectedPay || !detail) return;

    if (Form.method !== selectedPay.method) {
      this.mainService.getAllBy('reports', { connection_id: selectedPay.method }).then(res => {
        if (res && res.docs && res.docs.length > 0) {
          const docReport = res.docs[0];
          this.mainService.changeData('reports', docReport._id!, (doc: any) => {
            doc.weekly[currentDay] -= selectedPay.amount;
            doc.weekly_count[currentDay]--
            return doc;
          });
        }
        this.mainService.getAllBy('reports', { connection_id: Form.method }).then(res => {
          if (res && res.docs && res.docs.length > 0) {
            const docReport = res.docs[0];
            this.mainService.changeData('reports', docReport._id!, (doc: any) => {
              doc.weekly[currentDay] += Form.amount;
              doc.weekly_count[currentDay]++
              return doc;
            });
          }
        }).then(res => {
          detail.total_price -= selectedPay.amount;
          detail.total_price += Form.amount;
          selectedPay.amount = Form.amount;
          selectedPay.method = Form.method;
          this.mainService.updateData('closed_checks', detail._id, { total_price: detail.total_price, payment_flow: detail.payment_flow }).then(res => {
            this.messageService.sendMessage('Hesap Düzenlendi!');
            this.fillData();
            this.zone.run(() => {
              (window as any).$('#editCheck').modal('show');
              (window as any).$('#paymentDetail').modal('hide');
            });
          });
        });
      });
    } else {
      if (selectedPay.amount !== Form.amount) {
        this.mainService.getAllBy('reports', { connection_id: selectedPay.method }).then(res => {
          if (res && res.docs && res.docs.length > 0) {
            const docReport = res.docs[0];
            this.mainService.changeData('reports', docReport._id!, (doc: any) => {
              doc.weekly[currentDay] -= selectedPay.amount;
              doc.weekly[currentDay] += Form.amount;
              return doc;
            })
          }
        }).then(res => {
          detail.total_price -= selectedPay.amount;
          detail.total_price += Form.amount;
          selectedPay.amount = Form.amount;
          this.mainService.updateData('closed_checks', detail._id, { total_price: detail.total_price, payment_flow: detail.payment_flow }).then(res => {
            this.messageService.sendMessage('Hesap Düzenlendi!');
            this.fillData();
            this.zone.run(() => {
              (window as any).$('#editCheck').modal('show');
              (window as any).$('#paymentDetail').modal('hide');
            });
          });
        });

      } else {
        return false;
      }
    }
  }

  getLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.zone.run(() => {
        const logs = (res.docs.filter((obj: any) => (obj.type >= logType.CHECK_CREATED && obj.type <= logType.ORDER_MOVED) || obj.type == logType.DISCOUNT).sort((a: any, b: any) => b.timestamp - a.timestamp)) as Log[];
        this.sellingLogs.set(logs);
      });
    });
  }

  fillData() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {
      this.zone.run(() => {
        if (res.docs.length > 0) {
          const all = res.docs as ClosedCheck[];
          all.sort((a: any, b: any) => b.timestamp - a.timestamp);
          this.AllChecks.set(all);
          this.NotPayedChecks.set(all.filter((obj: any) => obj.type == CheckType.CANCELED));
          this.FastChecks.set(all.filter((obj: any) => obj.type == CheckType.FAST));
          this.NormalChecks.set(all.filter((obj: any) => obj.type == CheckType.NORMAL));
          this.DeliveryChecks.set(all.filter((obj: any) => obj.type == CheckType.ORDER));
        }
      });
    });
  }
}
