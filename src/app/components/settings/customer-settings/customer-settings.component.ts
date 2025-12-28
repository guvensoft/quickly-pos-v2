import { Component, OnInit, inject, signal, viewChild, computed, effect, NgZone, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainService } from '../../../core/services/main.service';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { SignalValidatorService } from '../../../core/services/signal-validator.service';
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
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);
  private readonly printerService = inject(PrinterService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly validatorService = inject(SignalValidatorService);
  private readonly zone = inject(NgZone);

  readonly customers = signal<Array<Customer>>([]);
  readonly selectedCustomer = signal<string | undefined>(undefined);
  readonly onUpdate = signal<boolean>(false);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

  // Form field signals for validation
  readonly customerName = signal<string>('');
  readonly customerPhone = signal<string>('');
  readonly customerAddress = signal<string>('');
  readonly customerType = signal<string>('');

  // Validation error signals
  readonly nameError = signal<string | null>(null);
  readonly phoneError = signal<string | null>(null);
  readonly addressError = signal<string | null>(null);
  readonly typeError = signal<string | null>(null);

  readonly credits = signal<Array<any>>([]);
  readonly creditsView = signal<Array<any>>([]);

  customerForm = viewChild<NgForm>('customerForm');
  readonly checkDetail = signal<any>(undefined);
  readonly day = signal<number>(new Date().getDay());
  readonly printers = signal<any[]>([]);

  // Computed properties for reactive filtering and derived state
  readonly selectedCustomerObj = computed(() => {
    const custId = this.selectedCustomer();
    if (!custId) return undefined;
    return this.customers().find(c => c._id === custId);
  });

  readonly sortedCreditsView = computed(() => {
    return [...this.creditsView()].sort((a: any, b: any) => a.timestamp - b.timestamp);
  });

  readonly selectedCustomerCredits = computed(() => {
    const custId = this.selectedCustomer();
    if (!custId) return [];
    return this.creditsView().filter((c: any) => c.table_id === custId);
  });

  readonly customerCredits = computed(() => {
    const creditsMap = new Map<string, number>();
    this.credits().forEach((credit: any) => {
      const customerId = credit.table_id;
      const currentTotal = creditsMap.get(customerId) ?? 0;
      creditsMap.set(customerId, currentTotal + (credit.total_price || 0));
    });
    return creditsMap;
  });

  // Form validation computed property
  readonly isCustomerFormValid = computed(() => {
    return !this.nameError() && !this.phoneError() && !this.addressError() && !this.typeError();
  });

  constructor() {
    // Set up reactive effect for DateSettings changes
    effect(() => {
      this.settingsService.DateSettings.subscribe((res: any) => {
        this.day.set(res.value.day);
      });
    }, { allowSignalWrites: true });

    // Set up reactive effect for Printer changes
    effect(() => {
      this.settingsService.getPrinters().subscribe((res: any) => {
        this.printers.set(res.value || []);
      });
    }, { allowSignalWrites: true });

    // Auto-filter credits when customer selected
    effect(() => {
      const custId = this.selectedCustomer();
      if (custId) {
        this.filterChecks(custId);
      }
    });

    // Validate name field
    effect(() => {
      const name = this.customerName();
      if (!name || !name.trim()) {
        this.nameError.set('Müşteri Adı Belirtmelisiniz');
      } else if (name.length < 2) {
        this.nameError.set('Müşteri Adı en az 2 karakter olmalıdır');
      } else {
        this.nameError.set(null);
      }
    });

    // Validate phone field
    effect(() => {
      const phone = this.customerPhone();
      if (!phone || !phone.trim()) {
        this.phoneError.set('Telefon Numarası Belirtmelisiniz');
      } else {
        const digitsOnly = phone.replace(/\D/g, '');
        if (digitsOnly.length < 10) {
          this.phoneError.set('Telefon Numarası en az 10 rakam olmalıdır');
        } else {
          this.phoneError.set(null);
        }
      }
    });

    // Validate address field
    effect(() => {
      const address = this.customerAddress();
      if (!address || !address.trim()) {
        this.addressError.set('Adres Belirtmelisiniz');
      } else {
        this.addressError.set(null);
      }
    });

    // Validate type field
    effect(() => {
      const type = this.customerType();
      if (!type) {
        this.typeError.set('Müşteri Tipi Seçmelisiniz');
      } else {
        this.typeError.set(null);
      }
    });
  }

  ngOnInit() {
    this.onUpdate.set(false);
    this.fillData();
  }

  setDefault() {
    this.onUpdate.set(false);
    this.selectedCustomer.set(undefined);
    // Clear form field signals
    this.customerName.set('');
    this.customerPhone.set('');
    this.customerAddress.set('');
    this.customerType.set('');
    // Clear validation errors
    this.nameError.set(null);
    this.phoneError.set(null);
    this.addressError.set(null);
    this.typeError.set(null);
    if (this.customerForm()) this.customerForm()!.reset();
  }

  addCustomer(customerForm: NgForm) {
    const form = customerForm.value;

    // Update validation signals from form
    this.customerName.set(form.name || '');
    this.customerType.set(form.type || '');
    this.customerPhone.set(form.phone_number || '');
    this.customerAddress.set(form.address || '');

    // Check if form is valid
    if (!this.isCustomerFormValid()) {
      this.messageService.sendMessage('Lütfen tüm zorunlu alanları doldurunuz.');
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
          this.mainService.addData('customers', schema as any).then((response: any) => {
            this.mainService.addData('reports', new Report('Customer', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), form.name, Date.now()) as any).then((res: any) => {
              this.logService.createLog(logType.CUSTOMER_CREATED, res.id, `${form.name} Adlı Müşteri Oluşturuldu`);
            });
            this.messageService.sendMessage('Müşteri Oluşturuldu!');
            this.fillData();
            customerForm.reset();
            this.zone.run(() => {
              (window as any).$('#customerModal').modal('hide');
            });
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
            this.zone.run(() => {
              (window as any).$('#customerModal').modal('hide');
            });
          });
        }
      });
    }
    return true;
  }

  updateCustomer(id: string) {
    this.onUpdate.set(true);
    this.selectedCustomer.set(id);
    this.mainService.getData('customers', id).then((result: any) => {
      delete result.role;
      // Sync form data to validation signals
      this.customerName.set(result.name || '');
      this.customerPhone.set(result.phone_number || '');
      this.customerAddress.set(result.address || '');
      this.customerType.set(result.type || '');
      if (this.customerForm()) {
        this.customerForm()!.form.patchValue(result);
      }
      this.zone.run(() => {
        (window as any).$('#customerModal').modal('show');
      });
    });
  }

  removeCustomer(id: string) {
    const isOk = confirm('Müşteriyi Silmek Üzerisiniz. Bu işlem Geri Alınamaz.');
    if (isOk) {
      this.mainService.removeData('customers', id).then((result: any) => {
        const customerName = this.customerForm() ? this.customerForm()!.value.name : 'Müşteri';
        this.logService.createLog(logType.CUSTOMER_DELETED, result.id, `${customerName} Adlı Müşteri Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id! }).then((res: any) => {
          if (res && res.docs && res.docs.length > 0 && res.docs[0]._id) {
            this.mainService.removeData('reports', res.docs[0]._id);
          }
        });
        this.messageService.sendMessage('Müşteri Silindi!');
        this.fillData();
        this.zone.run(() => {
          (window as any).$('#customerModal').modal('hide');
        });
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
        this.zone.run(() => {
          (window as any).$('#checkDetail').modal('hide');
        });
        this.messageService.sendAlert('Başarılı !', 'Hesap Geri Açıldı', 'success');
      });
    });
  }

  rePrintCheck(check: any) {
    const currentPrinters = this.printers();
    const printer = currentPrinters.length > 0 ? currentPrinters[0] : undefined;
    if (!printer) return;

    this.mainService.getData('tables', check.table_id).then((res: any) => {
      if (check.products && check.products.length > 0) {
        this.printerService.printCheck(printer, res.name, check);
      } else {
        if (check.payment_flow && Array.isArray(check.payment_flow)) {
          check.products = check.payment_flow.reduce((a: any, b: any) => {
            return a.concat(b.payed_products || []);
          }, []);
        } else {
          check.products = [];
        }
        this.printerService.printCheck(printer, res.name, check);
      }
    }).catch(err => {
      this.printerService.printCheck(printer, check.table_id, check);
    });
  }

  getDetail(check: Check) {
    this.checkDetail.set(check);
    this.zone.run(() => {
      (window as any).$('#reportDetail').modal('show');
    });
  }

  cancelCheck(id: string, note: string) {
    this.messageService.sendConfirm('Kapanmış Hesap İptal Edilecek! Bu işlem geri alınamaz!').then((isOK: any) => {
      if (isOK) {
        this.mainService.updateData('closed_checks', id, { description: note, type: 3 }).then((res: any) => {
          const detail = this.checkDetail();
          const price = detail ? detail.total_price : 0;
          this.logService.createLog(logType.CHECK_CANCELED, id, `${price} TL tutarındaki kapatılan hesap iptal edildi. Açıklama:'${note}'`)
          this.fillData();
          this.zone.run(() => {
            (window as any).$('#cancelDetail').modal('hide');
          });
        });
      }
    });
  }

  customerCredit(customer_id: string) {
    return this.credits().filter(obj => obj.table_id == customer_id).map(obj => obj.total_price).reduce((a: number, b: number) => a + b, 0) || 0;
  }

  filterChecks(customer_id: string) {
    this.creditsView.set(this.credits().filter(obj => obj.table_id == customer_id));
  }

  filterCustomers(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('customers', { name: { $regex: regexp } }).then((res: any) => {
      this.customers.set(res.docs);
    });
  }

  fillData() {
    this.mainService.getAllBy('customers', {}).then((result: any) => {
      this.customers.set(result.docs);
    });
    this.mainService.getAllBy('credits', {}).then((res: any) => {
      this.credits.set(res.docs);
      this.creditsView.set([...res.docs].sort((a: any, b: any) => a.timestamp - b.timestamp));
    })
  }
}