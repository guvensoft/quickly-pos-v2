import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService } from '../../../core/services/main.service';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { NgForm } from '@angular/forms';
import { Customer } from '../../../core/models/customer.model';
import { Report } from '../../../core/models/report.model';
import { Check, CheckNo, CheckType } from '../../../core/models/check.model';
import { PrinterService } from '../../../core/services/printer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { NgxMaskPipe } from 'ngx-mask';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, PricePipe, GeneralPipe, TimeAgoPipe, NgxMaskPipe],
  selector: 'app-customer-settings',
  templateUrl: './customer-settings.component.html',
  styleUrls: ['./customer-settings.component.scss']
})
export class CustomerSettingsComponent implements OnInit {
  customers!: Array<Customer>;
  selectedCustomer: any;
  onUpdate!: boolean;

  credits!: Array<any>;
  creditsView!: Array<any>;

  @ViewChild('customerForm') customerForm!: NgForm;
  checkDetail!: any;
  day: any;
  printers: any;

  constructor(
    private mainService: MainService, private settingsService: SettingsService, private printerService: PrinterService, private messageService: MessageService, private logService: LogService) {
  }

  ngOnInit() {
    this.onUpdate = false;
    this.settingsService.DateSettings.subscribe((res: any) => {
      this.day = res.value.day;
    });
    this.settingsService.getPrinters().subscribe((res: any) => {
      this.printers = res.value;
    });
    this.fillData();
  }

  setDefault() {
    this.onUpdate = false;
    this.selectedCustomer = undefined;
    this.customerForm.reset();
  }

  addCustomer(customerForm: NgForm) {
    const form = customerForm.value;
    if (form.name == undefined) {
      this.messageService.sendMessage('Müşteri Adı Girmek Zorundasınız.');
      return false;
    }
    if (form.type == undefined) {
      this.messageService.sendMessage('Müşteri Tipi Seçmek Zorundasınız.');
      return false;
    }
    if (form.phone_number == undefined) {
      this.messageService.sendMessage('Telefon Numarası Girmek Zorundasınız.');
      return false;
    }
    if (form.address == undefined) {
      this.messageService.sendMessage('Adres Girmek Zorundasınız.');
      return false;
    }
    form.phone_number = parseInt(form.phone_number);
    if (form._id == undefined) {
      this.mainService.getAllBy('customers', { phone_number: form.phone_number }).then((result: any) => {
        if (result.docs.length > 0) {
          this.messageService.sendMessage('Bu telefon numarası ile başka bir Müşteri kayıtlı. Lütfen başka bir numara deneyin.');
          customerForm.reset();
        } else {
          const schema = new Customer(form.name, form.surname, form.phone_number, form.address, '', form.type, Date.now());
          this.mainService.addData('customers', schema).then((response: any) => {
            this.mainService.addData('reports', new Report('Customer', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now())).then((res: any) => {
              this.logService.createLog(logType.CUSTOMER_CREATED, res.id, `${form.name} Adlı Müşteri Oluşturuldu`);
            });
            this.messageService.sendMessage('Müşteri Oluşturuldu!');
            this.fillData();
            customerForm.reset();
            (window as any).$('#customerModal').modal('hide');
          });
        }
      });
    } else {
      this.mainService.getAllBy('customers', { phone_number: form.phone_number }).then((result: any) => {
        if (result.docs.length > 0 && result.docs[0].phone_number != form.phone_number) {
          this.messageService.sendMessage('Bu telefon numarası ile başka bir Müşteri kayıtlı. Lütfen başka bir numara deneyin.');
        } else {
          this.mainService.updateData('customers', form._id, form).then((res: any) => {
            this.logService.createLog(logType.CUSTOMER_UPDATED, res.id, `${form.name} Adlı Müşteri Güncellendi`);
            this.messageService.sendMessage('Bilgiler Güncellendi!');
            this.fillData();
            customerForm.reset();
            (window as any).$('#customerModal').modal('hide');
          });
        }
      });
    }
  }

  updateCustomer(id: string) {
    this.onUpdate = true;
    this.selectedCustomer = id;
    this.mainService.getData('customers', id).then((result: any) => {
      delete result.role;
      this.customerForm.setValue(result);
      (window as any).$('#customerModal').modal('show');
    });
  }

  removeCustomer(id: string) {
    const isOk = confirm('Müşteriyi Silmek Üzerisiniz. Bu işlem Geri Alınamaz.');
    if (isOk) {
      this.mainService.removeData('customers', id).then((result: any) => {
        this.logService.createLog(logType.CUSTOMER_DELETED, result.id, `${this.customerForm.value.name} Adlı Müşteri Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id! }).then((res: any) => {
          this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.messageService.sendMessage('Müşteri Silindi!');
        this.fillData();
        (window as any).$('#customerModal').modal('hide');
      });
    }
  }

  reOpenCheck(check: Check) {
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
    this.mainService.addData('checks', checkWillReOpen).then(() => {
      this.mainService.removeData('credits', check._id!).then(() => {
        this.fillData();
        (window as any).$('#checkDetail').modal('hide');
        this.messageService.sendAlert('Başarılı !', 'Hesap Geri Açıldı', 'success');
      });
    });
    // if (check.payment_method !== 'Parçalı') {
    //   this.mainService.getAllBy('reports', { connection_id: check.payment_method }).then(res => {
    //     this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
    //       doc.weekly[this.day] -= check.total_price;
    //       doc.weekly_count[this.day]--;
    //       return doc;
    //     });
    //   });
    // } else {
    //   check.payment_flow.forEach(element => {
    //     this.mainService.getAllBy('reports', { connection_id: element.method }).then(res => {
    //       this.mainService.changeData('reports', res.docs[0]._id, (doc) => {
    //         doc.weekly[this.day] -= element.amount;
    //         return doc;
    //       });
    //     });
    //   });
    // }
  }

  rePrintCheck(check: any) {
    this.mainService.getData('tables', check.table_id).then((res: any) => {
      if (check.products.length > 0) {
        this.printerService.printCheck(this.printers[0], res.name, check);
      } else {
        check.products = check.payment_flow.reduce((a: any, b: any) => a.payed_products.concat(b.payed_products));
        this.printerService.printCheck(this.printers[0], res.name, check);
      }
    }).catch(err => {
      this.printerService.printCheck(this.printers[0], check.table_id, check);
    });
  }

  getDetail(check: Check) {
    this.checkDetail = check;
    (window as any).$('#reportDetail').modal('show');
  }

  cancelCheck(id: string, note: string) {
    this.messageService.sendConfirm('Kapanmış Hesap İptal Edilecek! Bu işlem geri alınamaz!').then((isOK: any) => {
      if (isOK) {
        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then((res: any) => {
          this.logService.createLog(logType.CHECK_CANCELED, id, `${this.checkDetail!.total_price} TL tutarındaki kapatılan hesap iptal edildi. Açıklama:'${note}'`)
          this.fillData();
          (window as any).$('#cancelDetail').modal('hide');
        });
      }
    });
  }

  customerCredit(customer_id: string) {
    return this.credits.filter(obj => obj.table_id == customer_id).map(obj => obj.total_price).reduce((a: number, b: number) => a + b, 0) || 0;
  }

  filterChecks(customer_id: string) {
    this.creditsView = this.credits.filter(obj => obj.table_id == customer_id);
  }

  filterCustomers(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('customers', { name: { $regex: regexp } }).then((res: any) => {
      this.customers = res.docs as any;
    });
  }

  fillData() {
    this.mainService.getAllBy('customers', {}).then((result: any) => {
      this.customers = result.docs as any;
    });
    this.mainService.getAllBy('credits', {}).then((res: any) => {
      this.credits = res.docs as any;
      this.creditsView = this.credits.sort((a: any, b: any) => a.timestamp - b.timestamp);
    })
  }
}