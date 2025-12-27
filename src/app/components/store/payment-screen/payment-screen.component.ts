import { Component, ElementRef, OnInit, OnDestroy, inject, signal, computed, effect, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Check, CheckProduct, ClosedCheck, PaymentStatus, CheckNo } from '../../../core/models/check.model';
import { PaymentMethod } from '../../../core/models/settings.model';
import { MessageService } from '../../../core/services/message.service';
import { PrinterService } from '../../../core/services/printer.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { DatabaseService } from '../../../core/services/database.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe, GeneralPipe, FormsModule],
  selector: 'app-payment-screen',
  templateUrl: './payment-screen.component.html',
  styleUrls: ['./payment-screen.component.scss'],
})
export class PaymentScreenComponent implements OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);
  private readonly mainService = inject(MainService);
  private readonly databaseService = inject(DatabaseService);
  private readonly printerService = inject(PrinterService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);

  readonly id = signal<string | undefined>(undefined);
  readonly check_type = signal<'Normal' | 'Fast' | 'Order'>('Normal');

  readonly numpad = signal<string>('');
  readonly isFirstTime = signal<boolean>(true);
  readonly payedPrice = signal<number>(0);
  readonly discount = signal<number | undefined>(undefined);
  readonly discountAmount = signal<number>(0);
  readonly productsWillPay = signal<CheckProduct[]>([]);
  readonly askForPrint = signal<boolean>(false);
  readonly onClosing = signal<boolean>(false);
  readonly payedShow = signal<boolean>(false);

  readonly check = computed(() => {
    const checkId = this.id();
    return this.databaseService.checks().find(c => c._id === checkId);
  });

  readonly table = computed(() => {
    const c = this.check();
    if (!c) return '';
    if (c.type === 1) {
      const t = this.databaseService.tables().find(tbl => tbl._id === c.table_id);
      return t?.name || '';
    }
    return c.note === '' ? 'Hızlı Satış' : c.note;
  });

  readonly priceWillPay = computed(() => {
    return this.productsWillPay().reduce((acc, p) => acc + (p.price || 0), 0);
  });

  readonly currentAmount = computed(() => {
    return this.priceWillPay() - this.discountAmount();
  });

  readonly changePrice = computed(() => {
    return this.payedPrice() - this.priceWillPay() + this.discountAmount();
  });

  readonly changeMessage = computed(() => {
    return this.changePrice() > 0 ? 'Para Üstü' : 'Kalan Ödeme';
  });

  readonly payedTitle = computed(() => {
    return this.payedShow() ? 'Ödemeleri Gizle' : 'Ödemeleri Göster';
  });

  readonly userId = signal<string | undefined>(undefined);
  readonly userName = signal<string | undefined>(undefined);
  readonly day = signal<number>(0);
  readonly permissions = signal<any>({});

  readonly printers = this.databaseService.receipts;
  readonly customers = this.databaseService.customers;

  readonly discounts = signal([5, 10, 15, 20, 25, 40]);
  readonly numboard = signal([[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "✔"]]);

  readonly paymentMethods = signal([
    new PaymentMethod('Nakit', 'Nakit Ödeme', '#5cb85c', 'fa-money', 1, 1),
    new PaymentMethod('Kart', 'Kredi veya Banka Kartı', '#f0ad4e', 'fa-credit-card', 2, 1),
    new PaymentMethod('Kupon', 'İndirim Kuponu veya Yemek Çeki', '#5bc0de', 'fa-bookmark', 3, 1),
    new PaymentMethod('İkram', 'İkram Hesap', '#c9302c', 'fa-handshake-o', 4, 1)
  ]);

  discountInput = viewChild<ElementRef>('discountInput');
  customerInput = viewChild<ElementRef>('customerInput');
  creditNote = viewChild<ElementRef>('creditNote');

  constructor() {
    // route.params subscription wrapped in effect
    effect(() => {
      this.route.params.subscribe(params => {
        this.id.set(params['id']);
        if (params['type']) {
          this.check_type.set(params['type']);
        }
      });
    }, { allowSignalWrites: true });

    try {
      const userPermissions = localStorage.getItem('userPermissions');
      this.permissions.set(userPermissions ? JSON.parse(userPermissions) : {});
    } catch (error) {
      console.error('Error parsing userPermissions:', error);
    }

    // DateSettings subscription wrapped in effect
    effect(() => {
      this.settingsService.DateSettings.subscribe((res: any) => {
        if (res && res.value) {
          this.day.set(res.value.day);
        }
      });
    }, { allowSignalWrites: true });

    // AppSettings subscription wrapped in effect
    effect(() => {
      this.settingsService.getAppSettings().subscribe((res: any) => {
        if (res && res.value) {
          this.askForPrint.set(res.value.ask_print_check === 'Sor');
        }
      });
    }, { allowSignalWrites: true });

    this.userId.set(this.settingsService.getUser('id') as string);
    this.userName.set(this.settingsService.getUser('name') as string);

    // Discount calculation effect (already existed)
    effect(() => {
      const c = this.check();
      if (c && c.discountPercent) {
        this.discount.set(c.discountPercent);
        this.discountAmount.set((this.priceWillPay() * c.discountPercent) / 100);
      }
    });
  }

  ngOnDestroy() {
    if (this.onClosing() && this.check() && this.productsWillPay().length > 0) {
      const currentCheck = { ...this.check()! };
      this.productsWillPay().forEach(element => {
        currentCheck.products.push(element);
        currentCheck.total_price += element.price;
      });
      if (currentCheck._id) {
        this.mainService.updateData('checks', currentCheck._id, currentCheck);
      }
    }
  }

  readonly availableProducts = computed(() => {
    const c = this.check();
    if (!c) return [];
    const willPay = this.productsWillPay();
    return c.products.filter(p => p.status === 2 && !willPay.includes(p));
  });

  readonly canceledProducts = computed(() => {
    return this.check()?.products.filter(p => p.status === 3) || [];
  });

  payProducts(method: string) {
    if (this.discountAmount() > 0) {
      this.logService.createLog(logType.DISCOUNT, this.userId() || '', `${this.table()} Hesabına ${this.discountAmount()} TL tutarında indirim yapıldı.`);
    }

    const c = this.check();
    if (!c) return;

    if (c.total_price === 0 && this.changePrice() >= 0) {
      this.closeCheck(method);
    } else {
      this.onClosing.set(true);
      let newPayment: PaymentStatus = undefined!;
      const willPay = [...this.productsWillPay()];
      let activePayPrice = this.payedPrice();
      if (this.discount()) {
        activePayPrice += this.discountAmount();
      }

      if (this.changePrice() < 0) {
        const isAnyEqual = willPay.some(obj => obj.price === activePayPrice);
        const isAnyGreat = willPay.some(obj => obj.price > activePayPrice);
        const isAnyLittle = willPay.some(obj => obj.price < activePayPrice);

        if (isAnyEqual) {
          const indexOfEqual = willPay.findIndex(obj => obj.price === activePayPrice);
          if (indexOfEqual > -1) {
            const equalProduct = willPay[indexOfEqual];
            newPayment = new PaymentStatus(this.userName() || '', method, (activePayPrice - this.discountAmount()), this.discountAmount(), Date.now(), [equalProduct]);
            willPay.splice(indexOfEqual, 1);
            this.productsWillPay.set(willPay);
          }
        } else if (isAnyGreat) {
          const sortedProducts = [...willPay].sort((a: any, b: any) => b.price - a.price);
          const greatOne = sortedProducts[0];
          if (greatOne) {
            const greatOneCopy = { ...greatOne };
            greatOneCopy.price = activePayPrice;
            newPayment = new PaymentStatus(this.userName() || '', method, (activePayPrice - this.discountAmount()), this.discountAmount(), Date.now(), [greatOneCopy]);
            greatOne.price -= activePayPrice;
            this.productsWillPay.set(willPay);
          }
        } else if (isAnyLittle) {
          newPayment = new PaymentStatus(this.userName() || '', method, (activePayPrice - this.discountAmount()), this.discountAmount(), Date.now(), []);
          let priceCount = activePayPrice;
          let willRemove = 0;
          const sorted = [...willPay].sort((a: any, b: any) => b.price - a.price);
          sorted.forEach((product: any, index: number) => {
            if (priceCount > 0) {
              if (priceCount >= product.price) {
                newPayment.payed_products.push({ ...product });
                willRemove++;
                priceCount -= product.price;
              } else {
                const productWillPush = { ...product };
                productWillPush.price = priceCount;
                newPayment.payed_products.push(productWillPush);
                product.price -= priceCount;
                priceCount = 0;
              }
            }
          });
          this.productsWillPay.set(sorted.slice(willRemove));
        }

        if (newPayment) {
          this.numpad.set((this.priceWillPay()).toFixed(2).toString());
        }
      } else {
        newPayment = new PaymentStatus(this.userName() || '', method, this.currentAmount(), this.discountAmount(), Date.now(), willPay);
        this.productsWillPay.set([]);
      }

      if (newPayment) {
        const checkToUpdate = { ...c };
        if (!checkToUpdate.payment_flow) checkToUpdate.payment_flow = [];
        checkToUpdate.payment_flow.push(newPayment);
        checkToUpdate.discount += newPayment.amount;

        if (this.changePrice() >= 0) {
          this.setPayment();
          this.messageService.sendMessage(`Ürünler ${method} olarak ödendi`);
        } else {
          this.messageService.sendMessage(`Ürünlerin ${newPayment.amount} TL'si ${method} olarak ödendi`);
          this.discount.set(undefined);
          this.discountAmount.set(0);
        }

        this.mainService.updateData('checks', c._id!, checkToUpdate);
        this.logService.createLog(logType.CHECK_PAYED, c._id!, `${this.table()} Hesabından ${newPayment.amount} TL tutarında ${method} ödeme alındı.`);
        this.payedPrice.set(0);
        this.isFirstTime.set(true);
      }
    }
  }

  closeCheck(method: string) {
    const c = this.check();
    if (!c) return;

    let total_discounts = 0;
    let checkWillClose: ClosedCheck;
    this.onClosing.set(false);

    const willPayProds = [...this.productsWillPay()];

    if (c.payment_flow !== undefined && c.payment_flow.length > 0) {
      const realMethod = method;
      method = 'Parçalı';
      const lastPayment = new PaymentStatus(this.userName() || '', realMethod, this.currentAmount(), this.discountAmount(), Date.now(), willPayProds);

      const checkUpdate = { ...c };
      checkUpdate.payment_flow!.push(lastPayment);
      checkUpdate.discount += this.priceWillPay();

      total_discounts = checkUpdate.payment_flow!.reduce((acc, obj) => acc + (obj.discount || 0), 0);
      const total_price = checkUpdate.payment_flow!.reduce((acc, obj) => acc + (obj.amount || 0), 0);

      checkWillClose = new ClosedCheck(c.table_id, total_price, total_discounts, this.userName() || '', c.note, c.status, c.products, Date.now(), c.type, method, checkUpdate.payment_flow, undefined, c.occupation);
    } else {
      total_discounts = this.discountAmount();
      checkWillClose = new ClosedCheck(c.table_id, this.currentAmount(), total_discounts, this.userName() || '', c.note, c.status, willPayProds, Date.now(), c.type, method, undefined, undefined, c.occupation);
    }

    if (this.askForPrint()) {
      this.messageService.sendConfirm('Fiş Yazdırılsın mı ?').then((isOK: any) => {
        if (isOK) {
          this.printerService.printCheck(this.printers()[0], this.table(), checkWillClose);
        }
      });
    } else {
      this.printerService.printCheck(this.printers()[0], this.table(), checkWillClose);
    }

    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
      if (res.ok) {
        this.mainService.removeData('checks', c._id!).then(() => {
          if (c.type === 1) {
            this.mainService.updateData('tables', c.table_id, { status: 1 });
          }
          this.logService.createLog(logType.CHECK_CLOSED, res.id, `${this.table()} Hesabı ${this.currentAmount()} TL tutarında ödeme alınarak kapatıldı.`);
          this.messageService.sendMessage(`Hesap '${method}' olarak kapatıldı`);
          this.updateSellingReport(method);
          if (c.type === 1) {
            this.updateTableReport(c, method);
          }
          this.router.navigate(['/store']);
        });
      }
    });
  }

  createCredit(customer: string, creditNote: string) {
    const c = this.check();
    if (!c) return;

    if (c.payment_flow !== undefined) {
      let paymentMethod;
      (c.payment_flow.length > 1) ? paymentMethod = 'Parçalı' : (c.payment_flow.length === 1 ? paymentMethod = c.payment_flow[0].method : paymentMethod = 'Belirsiz');
      const checkWillClose = new ClosedCheck(c.table_id, c.discount, 0, this.userName() || '', '', c.status, c.products, Date.now(), c.type, paymentMethod, c.payment_flow, undefined, c.occupation);
      this.updateSellingReport(paymentMethod);
      if (c.type === 1) {
        this.updateTableReport(c, paymentMethod);
      }
      this.mainService.addData('closed_checks', checkWillClose);
    }

    const creditData = {
      customer_id: customer,
      amount: this.priceWillPay(),
      description: creditNote,
      timestamp: Date.now(),
      status: 0
    };

    this.mainService.addData('credits', creditData as any).then((res: any) => {
      if (res.ok) {
        if (c.type === 1) {
          this.mainService.updateData('tables', c.table_id, { status: 1 });
        }
        this.mainService.removeData('checks', c._id!).then((result: any) => {
          if (result.ok) {
            (window as any).$ ? (window as any).$('#otherOptions').modal('hide') : null;
            this.router.navigate(['/store']);
          }
        })
      }
    });
  }

  setDiscount(discount: number | undefined) {
    this.discount.set(discount);
    if (this.payedPrice() === 0) {
      this.payedPrice.set(this.priceWillPay());
    }
    if (discount === undefined) {
      this.discountAmount.set(0);
    } else {
      this.discountAmount.set((this.priceWillPay() * discount) / 100);
    }

    if (this.discountInput()) {
      this.discountInput()!.nativeElement.value = 0;
    }
    (window as any).$ ? (window as any).$('#discount').modal('hide') : null;
  }

  divideWillPay(division: number) {
    if (division <= 0) return;
    this.payedPrice.set(this.priceWillPay() / division);
    this.numpad.set(this.payedPrice().toFixed(2).toString());
    (window as any).$ ? (window as any).$('#calculator').modal('hide') : null;
  }

  togglePayed() {
    this.payedShow.set(!this.payedShow());
  }

  addProductToList(product: CheckProduct) {
    this.productsWillPay.update(prev => [...prev, product]);
    this.numpad.set(this.priceWillPay().toFixed(2).toString());
    this.payedShow.set(false);
  }

  addProductToCheck(product: CheckProduct) {
    this.productsWillPay.update(prev => prev.filter(obj => obj !== product));
    this.numpad.set(this.priceWillPay().toFixed(2).toString());
  }

  sendAllProducts() {
    const c = this.check();
    if (!c) return;

    const allProds = c.products.filter(p => p.status === 2);
    this.productsWillPay.set([...allProds]);
    this.numpad.set(this.priceWillPay().toFixed(2).toString());
  }

  getPayment(number: number) {
    this.payedPrice.update(prev => prev + number);
    this.numpad.set(this.payedPrice().toString());
  }

  pushKey(key: any) {
    if (key === "✔") {
      this.payedPrice.set(parseFloat(this.numpad()) || 0);
      this.numpad.set('');
    } else {
      if (this.isFirstTime()) {
        this.numpad.set('');
        this.isFirstTime.set(false);
      }
      this.numpad.update(prev => prev + key);
    }
  }

  cleanPad() {
    this.numpad.set('');
    this.payedPrice.set(0);
    this.discount.set(undefined);
    this.discountAmount.set(0);
    this.isFirstTime.set(true);
  }

  printCheck() {
    const c = this.check();
    if (c) {
      this.printerService.printCheck(this.printers()[0], this.table(), c);
    }
  }

  setPayment() {
    this.productsWillPay.set([]);
    this.discountAmount.set(0);
    this.payedPrice.set(0);
    this.numpad.set('');
    this.isFirstTime.set(true);
    this.discount.set(undefined);
  }

  updateSellingReport(method: string) {
    const reports = this.databaseService.reports();
    if (method !== 'Parçalı') {
      const doc = reports.find(r => r.connection_id === method);
      if (doc) {
        const updated = { ...doc };
        updated.count++;
        updated.weekly_count[this.day()]++;
        updated.monthly_count[new Date().getMonth()]++;
        updated.amount += this.currentAmount();
        updated.weekly[this.day()] += this.currentAmount();
        updated.monthly[new Date().getMonth()] += this.currentAmount();
        updated.timestamp = Date.now();
        this.mainService.updateData('reports', doc._id, updated);
      }
    } else {
      const sellingReports = reports.filter(r => r.type === "Store");
      const c = this.check();
      if (!c) return;

      c.payment_flow?.forEach((obj: any) => {
        const reportWillChange = sellingReports.find((report: any) => report.connection_id == obj.method);
        if (reportWillChange) {
          const updated = { ...reportWillChange };
          updated.count++;
          updated.weekly_count[this.day()]++;
          updated.amount += obj.amount;
          updated.weekly[this.day()] += obj.amount;
          updated.monthly[new Date().getMonth()] += obj.amount;
          updated.timestamp = Date.now();
          this.mainService.updateData('reports', updated._id, updated);
        }
      });
    }
  }

  updateTableReport(check: Check, method: string) {
    const reports = this.databaseService.reports();
    const doc = reports.find(r => r.connection_id === check.table_id);
    if (!doc) return;

    const updated = { ...doc };
    if (method !== 'Parçalı') {
      updated.count++;
      updated.amount += this.currentAmount();
      updated.timestamp = Date.now();
      updated.weekly[this.day()] += this.currentAmount();
      updated.weekly_count[this.day()]++;
      updated.monthly[new Date().getMonth()] += this.currentAmount();
      updated.monthly_count[new Date().getMonth()]++;
    } else {
      updated.count++;
      updated.weekly_count[this.day()]++;
      updated.monthly_count[new Date().getMonth()]++;
      updated.timestamp = Date.now();
      check.payment_flow?.forEach((obj: any) => {
        updated.amount += obj.amount;
        updated.weekly[this.day()] += obj.amount;
        updated.monthly[new Date().getMonth()] += obj.amount;
      });
    }
    this.mainService.updateData('reports', updated._id, updated);
  }
}
