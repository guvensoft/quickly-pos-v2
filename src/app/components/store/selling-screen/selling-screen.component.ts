import { Component, ElementRef, OnInit, ViewChild, NgZone, ChangeDetectorRef, inject, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonDirective } from '../../../shared/directives/button.directive';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Order, OrderItem, OrderStatus, OrderType } from '../../../core/models/order.model';
import { Check, CheckProduct, ClosedCheck, PaymentStatus, CheckStatus, CheckType, CheckNo, Occupation } from '../../../core/models/check.model';
import { Category, Ingredient, Product, ProductSpecs, SubCategory, ProductType, ProductStatus } from '../../../core/models/product.model';
import { PaymentMethod, Printer } from '../../../core/models/settings.model';
import { Floor, Table, TableStatus } from '../../../core/models/table.model';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { MessageService } from '../../../core/services/message.service';
import { PrinterService } from '../../../core/services/printer.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { ScalerService } from '../../../core/services/scaler.service';
import { DatabaseService } from '../../../core/services/database.service';
import { Subscription } from 'rxjs';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, PricePipe, GeneralPipe, TimeAgoPipe, ButtonDirective],
  selector: 'app-selling-screen',
  templateUrl: './selling-screen.component.html',
  styleUrls: ['./selling-screen.component.scss'],
  providers: [SettingsService]
})

export class SellingScreenComponent implements OnInit, OnDestroy {
  private readonly db = inject(DatabaseService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly mainService = inject(MainService);
  private readonly printerService = inject(PrinterService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly electron = inject(ElectronService);
  private readonly message = inject(MessageService);
  private readonly settingsService = inject(SettingsService);
  private readonly scalerService = inject(ScalerService);
  private readonly logService = inject(LogService);
  private readonly zone = inject(NgZone);

  readonly id = signal<string | undefined>(undefined);
  readonly type = signal<string | undefined>(undefined);

  readonly categories = this.db.categories;
  readonly sub_categories = this.db.sub_categories;
  readonly products = this.db.products;
  readonly floors = this.db.floors;
  readonly tables = this.db.tables;

  readonly check = signal<any>({});
  readonly check_id = signal<string>('');
  readonly selectedCatId = signal<string | undefined>(undefined);
  readonly selectedSubCatId = signal<string | undefined>(undefined);
  readonly filterText = signal<string>('');

  readonly subCatsView = computed(() => {
    const catId = this.selectedCatId();
    if (!catId) return [];
    return this.sub_categories().filter((s: any) => s.cat_id === catId);
  });

  readonly productsView = computed(() => {
    const catId = this.selectedCatId();
    const subCatId = this.selectedSubCatId();
    const filter = this.filterText().toLowerCase();

    if (filter) {
      const regexp = new RegExp(filter, 'i');
      return this.products().filter(({ name }) => name.match(regexp));
    }

    if (subCatId) {
      return this.products().filter(p => p.subcat_id === subCatId);
    }

    if (catId) {
      return this.products().filter(p => p.cat_id === catId);
    }

    return this.products();
  });

  readonly table = computed(() => {
    return this.tables().find(t => t._id === this.id()) || {} as any;
  });

  readonly tablesView = computed(() => {
    const floorId = this.selectedFloorId();
    let result = this.tables()
      .filter(t => t._id !== this.id())
      .filter(t => t.status !== 3);

    if (floorId) {
      result = result.filter(t => t.floor_id === floorId);
    }

    return result.sort((a, b) => a.name.localeCompare(b.name));
  });

  readonly selectedFloorId = signal<string | undefined>(undefined);

  selectedProduct = signal<CheckProduct | undefined>(undefined);
  selectedIndex = signal<number | undefined>(undefined);
  noteForm!: NgForm;
  readonly owner = signal<string>('');
  readonly ownerRole = signal<string>('');
  readonly ownerId = signal<string>('');
  readonly newOrders = signal<Array<CheckProduct>>([]);
  readonly countData = signal<Array<any>>([]);
  readonly payedShow = signal<boolean>(false);
  readonly payedTitle = computed(() => this.payedShow() ? 'Alınan Ödemeleri Gizle' : 'Alınan Ödemeleri Görüntüle');
  readonly permissions = signal<any>({});
  readonly readyNotes = signal<any[]>([]);
  readonly productSpecs = signal<any[]>([]);
  readonly printers = signal<any[]>([]);
  readonly scalerValue = signal<number>(0);
  readonly productStock = signal<any>(undefined);
  readonly productWithSpecs = signal<any>(undefined);
  readonly numpad = signal<any>('');
  readonly isFirstTime = signal<boolean>(true);
  readonly numboard: Array<any> = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '◂']
  ];
  readonly discounts: Array<number> = [5, 10, 15, 20, 25, 40];
  readonly paymentMethods: Array<any> = [
    new PaymentMethod('Nakit', 'Nakit Ödeme', '#5cb85c', 'fa-money', 1, 1),
    new PaymentMethod('Kart', 'Kredi veya Banka Kartı', '#f0ad4e', 'fa-credit-card', 2, 1),
    new PaymentMethod('Kupon', 'İndirim Kuponu veya Yemek Çeki', '#5bc0de', 'fa-bookmark', 3, 1),
    new PaymentMethod('İkram', 'İkram Hesap', '#c9302c', 'fa-handshake-o', 4, 1)
  ];
  readonly cancelReasons: Array<string> = [
    'Zayi',
    'Stokta Yok',
    'Yanlış Sipariş',
    'Müşteri İstemedi',
  ];
  readonly day = signal<number>(new Date().getDay());
  readonly askForPrint = signal<boolean>(false);
  readonly askForCheckPrint = signal<boolean>(false);
  readonly tareNumber = signal<any>(0);
  readonly onProductChange = signal<boolean>(false);
  readonly selectedQuantity = signal<number>(1);
  readonly takeaway = signal<boolean>(false);
  readonly changes = signal<any>(undefined);
  scalerListener!: Subscription;
  readonly selectedTableId = signal<string | undefined>(undefined);

  readonly selectedTable = computed(() => {
    return this.tables().find(t => t._id === this.selectedTableId());
  });

  @ViewChild('productName') productFilterInput!: ElementRef;
  @ViewChild('specsUnit') productUnit!: ElementRef;
  @ViewChild('noteInput') noteInput!: ElementRef;

  constructor() {
    this.owner.set(this.settingsService.getUser('name') as string);
    this.ownerRole.set(this.settingsService.getUser('type') as string);
    this.ownerId.set(this.settingsService.getUser('id') as string);

    this.route.params.subscribe((params: any) => {
      this.id.set(params['id']);
      this.type.set(params['type']);
      const currentId = this.id();
      const currentType = this.type();
      const ownerName = this.owner();

      switch (currentType) {
        case 'Normal':
          this.check.set(new Check(currentId!, 0, 0, ownerName, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.NORMAL, CheckNo()));
          this.getCheck({ table_id: currentId }).finally(() => {
            if (this.check().status == CheckStatus.PASSIVE) {
              (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          });
          break;
        case 'Fast':
          if (currentId == 'New') {
            this.check.set(new Check('Hızlı Satış', 0, 0, ownerName, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo()));
          } else {
            this.check.set(new Check('Hızlı Satış', 0, 0, ownerName, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo()));
            this.getCheck({ _id: currentId }).finally(() => {
              if (this.check().status == CheckStatus.PASSIVE) {
                (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
              }
            });
          }
          break;
        case 'Order':
          this.check.set(new Check('Paket Servis', 0, 0, ownerName, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo()));
          this.getCheck({ _id: currentId }).finally(() => {
            if (this.check().status == CheckStatus.PASSIVE) {
              (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          });
          break;
      }
    });

    this.settingsService.DateSettings.subscribe((res: any) => {
      this.day.set(res.value.day);
    });

    this.settingsService.AppSettings.subscribe((res: any) => {
      const takeawayValue = res.value.takeaway;
      this.takeaway.set(takeawayValue !== 'Kapalı');
    });

    try {
      const userPermissions = localStorage.getItem('userPermissions');
      this.permissions.set(userPermissions ? JSON.parse(userPermissions) : {});
    } catch (error) {
      console.error('Error parsing userPermissions:', error);
      this.permissions.set({});
    }

    this.settingsService.getPrinters().subscribe((res: any) => this.printers.set(res.value));

    try {
      const selectedFloor = localStorage.getItem('selectedFloor');
      if (selectedFloor) {
        this.selectedFloorId.set(JSON.parse(selectedFloor));
      }
    } catch (error) {
      console.error('Error parsing selectedFloor:', error);
    }
  }

  ngOnInit() {
    this.fillData();
    const ch = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change: any) => {
      if (change.id == this.check_id()) {
        if (!change.deleted) {
          this.mainService.getData('checks', change.id).then((res: any) => {
            this.check.set(res);
            this.id.set(res.table_id);
            if (res.status == CheckStatus.PROCESSING) {
              this.router.navigate(['/store']);
            }
          })
        } else {
          this.router.navigate(['/store']);
        }
      }
    });
    this.changes.set(ch);

    this.zone.runOutsideAngular(() => {
      const $ = (window as any).$;
      if ($ && typeof $ === 'function') {
        const productSpecsModal = $('#productSpecs');
        if (productSpecsModal.length) {
          productSpecsModal.on('hide.bs.modal', () => {
            if (this.scalerListener && typeof this.scalerListener.unsubscribe === 'function') {
              this.scalerListener.unsubscribe();
            }
          });
        }

        const specsModal = $('#specsModal');
        if (specsModal.length) {
          specsModal.on('hide.bs.modal', () => {
            this.selectedQuantity.set(1);
          });
        }
      }
    });
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    const ch = this.changes();
    if (ch) {
      ch.cancel();
    }

    // Unsubscribe scaler listener to prevent memory leak
    if (this.scalerListener && typeof this.scalerListener.unsubscribe === 'function') {
      this.scalerListener.unsubscribe();
    }

    // Clean up jQuery modal event listeners
    const $ = (window as any).$;
    if ($ && typeof $ === 'function') {
      const productSpecsModal = $('#productSpecs');
      if (productSpecsModal.length) {
        productSpecsModal.off('hide.bs.modal');
      }

      const specsModal = $('#specsModal');
      if (specsModal.length) {
        specsModal.off('hide.bs.modal');
      }
    }

    const currentCheck = this.check();
    if (currentCheck.type == CheckType.ORDER && currentCheck.status == CheckStatus.PASSIVE) {
      if (currentCheck.products.length == 0 && !currentCheck.hasOwnProperty('payment_flow')) {
        this.mainService.removeData('checks', currentCheck._id);
      }
    }
  }

  goPayment() {
    const currentCheck = this.check();
    if (currentCheck.type == CheckType.FAST) {
      if (currentCheck.status == CheckStatus.PASSIVE) {
        this.updateUserReport();
        this.updateProductReport(this.countData());
        currentCheck.products.map((obj: any) => obj.status = 2);
        currentCheck.status = CheckStatus.OCCUPIED;
        this.mainService.addData('checks', currentCheck).then((res: any) => {
          if (res.ok) {
            this.router.navigate(['/payment', res.id]);
          }
        });
      } else {
        this.router.navigate(['/payment', this.check_id()]);
      }
    } else {
      this.router.navigate(['/payment', this.check_id()]);
    }
  }

  getCheck(filter: object) {
    return this.mainService.getAllBy('checks', filter).then((result: any) => {
      if (result.docs.length > 0) {
        this.check.set(result.docs[0]);
        this.check_id.set(result.docs[0]._id);
      }
    }).catch((err: any) => {
      console.error('getCheck error:', err);
    });
  }


  tareScaler() {
    this.tareNumber.set(this.numpad());
  }

  addToCheck(product: Product) {
    if (product.type == ProductType.MANUEL) {
      this.isFirstTime.set(true);
      this.productWithSpecs.set(product);
      this.mainService.getAllBy('recipes', { product_id: product._id! }).then((res: any) => {
        const ps = res.docs[0].recipe[0];
        this.productStock.set(ps);
        this.numpad.set(ps.amount);
        this.scalerListener = this.scalerService.listenScalerEvent().subscribe((weight: number) => {
          if (weight && weight !== 0) {
            let val = weight * ps.amount;
            if (this.tareNumber() !== 0) {
              val = val - this.tareNumber();
            }
            this.numpad.set(val);
          }
        })
      });
      (window as any).$('#productSpecs').modal('show');
    } else {
      this.productFilterInput.nativeElement.value = '';
      this.filterText.set('');

      const newProduct = new CheckProduct(product._id!, product.cat_id, product.name, product.price, '', 1, this.ownerId(), Date.now(), product.tax_value, product.barcode);
      const currentCheck = { ...this.check() };

      if (![0.5, 1.5].includes(this.selectedQuantity())) {
        for (let index = 0; index < this.selectedQuantity(); index++) {
          this.countProductsData(product._id!, product.price);
          currentCheck.total_price = (currentCheck.total_price || 0) + product.price;
          currentCheck.products.push({ ...newProduct });
          this.newOrders.update(orders => [...orders, { ...newProduct }]);
        }
      } else {
        const quantity = this.selectedQuantity();
        this.countProductsData(product._id!, (product.price * quantity), quantity);
        currentCheck.total_price = (currentCheck.total_price || 0) + (product.price * quantity);
        newProduct.price = (product.price * quantity);
        newProduct.name = newProduct.name + ' ' + quantity + ' Porsiyon';
        currentCheck.products.push({ ...newProduct });
        this.newOrders.update(orders => [...orders, { ...newProduct }]);
      }

      this.check.set(currentCheck);
      this.selectedIndex.set(currentCheck.products.length - 1);
      this.selectedProduct.set(currentCheck.products[this.selectedIndex()!]);

      try {
        this.readyNotes.set(product.notes.split(','));
      } catch (error) {
        this.readyNotes.set([]);
      }

      if (product.specifies && product.specifies.length > 0) {
        this.getSpecies(newProduct);
        (window as any).$('#specsModal').modal({ backdrop: 'static', keyboard: false });
      } else {
        this.selectedQuantity.set(1);
      }
    }
    setTimeout(() => {
      (window as any).$('#check-products').scrollTop(999999);
    }, 200);
  }

  numpadToCheck() {
    const amount = this.numpad();
    const productWS = this.productWithSpecs();
    const pStock = this.productStock();
    const newAmount = (amount * productWS.price) / pStock.amount;
    const newNote = `${amount} ${this.productUnit.nativeElement.innerHTML}`;
    const newProduct = new CheckProduct(productWS._id, productWS.cat_id, productWS.name, newAmount, newNote, 1, this.ownerId(), Date.now(), productWS.tax_value, productWS.barcode);

    const currentCheck = { ...this.check() };
    currentCheck.total_price = (currentCheck.total_price || 0) + newProduct.price;
    const countFor = newAmount / productWS.price;

    if (this.productUnit.nativeElement.innerHTML === 'Adet') {
      for (let index = 0; index < countFor; index++) {
        const repeatingProduct = new CheckProduct(productWS._id, productWS.cat_id, productWS.name, productWS.price, '', 1, this.ownerId(), Date.now(), productWS.tax_value, productWS.barcode);
        currentCheck.products.push(repeatingProduct);
        this.newOrders.update(orders => [...orders, repeatingProduct]);
      }
    } else {
      currentCheck.products.push(newProduct);
      this.newOrders.update(orders => [...orders, newProduct]);
    }

    this.check.set(currentCheck);
    this.countProductsData(productWS._id, newAmount, countFor);
    this.tareNumber.set(0);
    this.numpad.set(0);
    (window as any).$('#productSpecs').modal('hide');
  }

  pushKey(key: any) {
    if (key === "◂") {
      this.numpad.set('');
    } else {
      if (this.isFirstTime()) {
        this.numpad.set('');
        this.isFirstTime.set(false);
      }
      this.numpad.update(curr => (curr || '') + key);
    }
  }

  confirmCheck() {
    this.router.navigate(['/store']);
    const timestamp = Date.now();
    const currentCheck = { ...this.check() };

    currentCheck.products.forEach((element: any) => {
      if (element.status === 1) {
        element.status = 2;
        element.timestamp = timestamp;
      }
    });

    if (currentCheck.status !== CheckStatus.PASSIVE) {
      if (currentCheck.type == CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id() as string, { status: 2 });
      }
      this.mainService.updateData('checks', this.check_id(), currentCheck).then((res: any) => {
        if (res.ok) {
          const newOrder = new Order(currentCheck._id, { id: this.ownerId(), name: this.owner() + ' ( Personel )' }, [], OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp);
          this.newOrders().forEach(order => {
            const orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            }
            newOrder.items.push(orderItem);
          });
          this.mainService.addData('orders', newOrder).then((res: any) => {
            const pricesTotal = this.newOrders().length > 0
              ? this.newOrders().map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
              : 0;
            if (currentCheck.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_UPDATED, currentCheck._id, `${this.table().name} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            } else {
              this.logService.createLog(logType.CHECK_UPDATED, currentCheck._id, `${currentCheck.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          }).catch((err: any) => {
            console.error(err);
          })
        }
      });
    } else {
      currentCheck.status = CheckStatus.READY;
      if (currentCheck.type == CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id() as string, { status: 2, timestamp: Date.now() });
      }
      this.mainService.addData('checks', currentCheck).then((res: any) => {
        if (res.ok) {
          const newOrder = new Order(res.id, { id: this.ownerId(), name: this.owner() + ' ( Personel )' }, [], OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp);
          this.newOrders().forEach((order: any) => {
            const orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            }
            newOrder.items.push(orderItem);
          })
          this.mainService.addData('orders', newOrder).then((res: any) => {
            if (currentCheck.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_CREATED, res.id, `${this.table().name} Masasına '${this.owner()}' tarafından hesap açıldı`);
            } else {
              this.logService.createLog(logType.CHECK_CREATED, res.id, `${currentCheck.note} Notlu Hızlı Hesap '${this.owner()}' tarafından açıldı`);
            }
          }).catch((err: any) => {
            console.error(err);
          })
        }
      });
    }
    this.updateUserReport();
    this.updateProductReport(this.countData());
  }

  sendCheck() {
    const currentCheck = this.check();
    switch (currentCheck.type) {
      case CheckType.NORMAL:
        if (this.askForPrint()) {
          this.message.sendConfirm('Fiş Yazdırılsın mı ?').then((isOk: any) => {
            if (isOk) {
              this.printOrder();
              this.confirmCheck();
            } else {
              this.confirmCheck();
            }
          });
        } else {
          this.printOrder();
          this.confirmCheck();
        }
        break;
      case CheckType.FAST:
        if (currentCheck.note == '' || currentCheck.note == undefined) {
          this.message.sendConfirm('Hızlı Hesap oluşturmanız için hesaba not eklemek zorundasınız.').then((isOk: any) => {
            if (isOk) {
              (window as any).$('#checkNote').modal('show');
              return false;
            } else {
              return false;
            }
          })
        } else {
          if (this.askForPrint()) {
            this.message.sendConfirm('Fiş Yazdırılsın mı ?').then((isOk: any) => {
              if (isOk) {
                this.printOrder();
                this.confirmCheck();
              } else {
                this.confirmCheck();
              }
            });
          } else {
            this.printOrder();
            this.confirmCheck();
          }
        }
        break;
      case CheckType.ORDER:
        currentCheck.products.map((element: any) => {
          if (element.status === 1) {
            element.status = 2;
          }
        });
        if (currentCheck.status == CheckStatus.PASSIVE) {
          currentCheck.status = CheckStatus.READY;
          this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
            if (res.ok) {
              const pricesTotal = this.newOrders().length > 0
                ? this.newOrders().map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
                : 0;
              this.logService.createLog(logType.CHECK_UPDATED, currentCheck._id, `${currentCheck.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          });
        } else {
          this.mainService.updateData('closed_checks', this.check_id(), currentCheck).then((res: any) => {
            if (res.ok) {
              this.logService.createLog(logType.CHECK_UPDATED, currentCheck._id, `${currentCheck.note} hesabı ${this.owner()} tarafından güncellendi.`);
            }
          });
        }
        this.router.navigate(['/store']);
        this.updateUserReport();
        this.updateProductReport(this.countData());
        break;
    }
  }

  endCheck() {
    this.message.sendConfirm('Dikkat! Hesap Kapatılacak.').then((isOK: any) => {
      if (isOK) {
        const currentCheck = this.check();
        const checkWillClose = new ClosedCheck(currentCheck.table_id, (currentCheck.total_price + currentCheck.discount) - 0, 0, currentCheck.owner, currentCheck.note, CheckStatus.OCCUPIED, currentCheck.products, currentCheck.timestamp, currentCheck.type, 'Parçalı', currentCheck.payment_flow, undefined, currentCheck.occupation);
        this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
          this.updateSellingReport('Parçalı');
        });
        if (currentCheck._id !== undefined) {
          this.mainService.removeData('checks', currentCheck._id);
          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
          this.updateTableReport(currentCheck);
        }
        this.router.navigate(['/store']);
      }
    });
  }

  closeCheck(method: string) {
    if (method == 'Nakit') {
      this.printerService.kickCashdraw(this.printers()[0]);
    }
    let total_discounts = 0;
    let general_discount = 0;
    const currentCheck = { ...this.check() };

    if (currentCheck.payment_flow) {
      let lastAmount = 0;
      const lastProducts = currentCheck.products.filter((obj: any) => obj.status == 2);
      lastProducts.forEach((product: any) => {
        lastAmount += product.price;
      })
      if (currentCheck.discountPercent) {
        general_discount = (currentCheck.total_price * currentCheck.discountPercent) / 100;
      }
      const lastPayment = new PaymentStatus(this.owner(), method, lastAmount - general_discount, general_discount, Date.now(), lastProducts);
      currentCheck.payment_flow.push(lastPayment);
      currentCheck.products = [];
      method = 'Parçalı';
      total_discounts = currentCheck.payment_flow.map((obj: any) => obj.discount).reduce((a: number, b: number) => a + b);
    } else {
      if (currentCheck.discountPercent) {
        general_discount = (currentCheck.total_price * currentCheck.discountPercent) / 100;
        total_discounts += general_discount;
      }
    }
    (window as any).$('#closeCheck').modal('hide');
    const checkWillClose = new ClosedCheck(currentCheck.table_id, (currentCheck.total_price + (currentCheck.discount || 0)) - general_discount, total_discounts, this.owner(), currentCheck.note, CheckStatus.OCCUPIED, currentCheck.products, currentCheck.timestamp, currentCheck.type, method, currentCheck.payment_flow, undefined, currentCheck.occupation);
    if (currentCheck.type == CheckType.ORDER) {
      checkWillClose.products.map((obj: any) => obj.status = 2);
      checkWillClose.status = 2;
    }
    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
      this.updateSellingReport(method);
    });
    if (currentCheck._id !== undefined) {
      this.mainService.removeData('checks', currentCheck._id);
    }
    if (currentCheck.type == CheckType.NORMAL || currentCheck.type == CheckType.ORDER) {
      if (currentCheck.type == CheckType.ORDER) {
        this.updateProductReport(this.countData());
      } else {
        this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
        this.updateTableReport(currentCheck);
      }
      this.router.navigate(['/store']);
    } else {
      this.updateUserReport();
      this.updateProductReport(this.countData());
      if (this.takeaway()) {
        this.router.navigate(['']);
      } else {
        this.router.navigate(['/store']);
      }
    }
    if (currentCheck.type == CheckType.FAST) {
      this.logService.createLog(logType.CHECK_CLOSED, this.ownerId(), `${this.owner()} tarafından ${currentCheck.table_id} Hesabı ${currentCheck.total_price} TL ${method} ödeme alınarak kapatıldı.`)
    } else if (currentCheck.type == CheckType.NORMAL) {
      this.logService.createLog(logType.CHECK_CLOSED, currentCheck._id, `${this.owner()} tarafından ${this.table().name} Masası ${currentCheck.total_price} TL '${method}' ödeme alınarak kapatıldı.`)
    } else {
      this.logService.createLog(logType.CHECK_CLOSED, currentCheck._id, `${this.owner()} tarafından Paket Servis- ${currentCheck.note} hesabı ${currentCheck.total_price} TL '${method}' ödeme alınarak kapatıldı.`)
    }

    if (this.askForCheckPrint()) {
      this.message.sendConfirm('Fiş Yazdırılsın mı ?').then((isOK: any) => {
        if (isOK) {
          if (currentCheck.type == CheckType.NORMAL) {
            this.printerService.printCheck(this.printers()[0], this.table().name, checkWillClose);
          } else {
            this.printerService.printCheck(this.printers()[0], currentCheck.table_id, checkWillClose);
          }
        }
      });
    }
    this.message.sendMessage(`Hesap ${currentCheck.total_price} TL tutarında ödeme alınarak kapatıldı`);
  }

  updateSellingReport(method: string) {
    let general_discount = 0;
    const currentCheck = this.check();
    if (currentCheck.discountPercent) {
      general_discount = (currentCheck.total_price * currentCheck.discountPercent) / 100;
    }
    const currentDay = this.day();

    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then((res: any) => {
        if (res.docs.length > 0) {
          const doc = res.docs[0];
          doc.count++;
          doc.amount += (currentCheck.total_price + (currentCheck.discount || 0)) - general_discount;
          doc.weekly[currentDay] += (currentCheck.total_price + (currentCheck.discount || 0)) - general_discount;
          doc.weekly_count[currentDay]++;
          doc.monthly[new Date().getMonth()] += (currentCheck.total_price + (currentCheck.discount || 0)) - general_discount;
          doc.monthly_count[new Date().getMonth()]++;
          doc.timestamp = Date.now();
          this.mainService.updateData('reports', doc._id, doc);
        }
      });
    } else {
      this.mainService.getAllBy('reports', { type: "Store" }).then((res: any) => {
        const sellingReports = res.docs;
        currentCheck.payment_flow?.forEach((obj: any, index: number) => {
          const reportWillChange = sellingReports.find((report: any) => report.connection_id == obj.method);
          if (reportWillChange) {
            reportWillChange.count++;
            reportWillChange.amount += obj.amount;
            reportWillChange.weekly[currentDay] += obj.amount;
            reportWillChange.weekly_count[currentDay]++;
            reportWillChange.monthly[new Date().getMonth()] += obj.amount;
            reportWillChange.monthly_count[new Date().getMonth()]++;
            reportWillChange.timestamp = Date.now();
          }
          if (currentCheck.payment_flow?.length == index + 1) {
            sellingReports.forEach((report: any) => {
              if (currentCheck.payment_flow?.some((payFlow: any) => payFlow.method == report.connection_id)) {
                this.mainService.updateData('reports', report._id, report);
              }
            });
          }
        });
      });
    }
  }

  updateTableReport(check: Check) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then((res: any) => {
      if (res.docs.length > 0) {
        const report = res.docs[0];
        const currentDay = this.day();
        report.count++;
        report.amount += check.total_price + (check.discount || 0);
        report.timestamp = Date.now();
        report.weekly[currentDay] += check.total_price + (check.discount || 0);
        report.weekly_count[currentDay]++;
        report.monthly[new Date().getMonth()] += check.total_price + (check.discount || 0);
        report.monthly_count[new Date().getMonth()]++;
        this.mainService.updateData('reports', report._id, report);
      }
    });
  }

  togglePayed() {
    this.payedShow.update(val => !val);
  }

  selectProduct(index: number) {
    if (this.selectedIndex() === index) {
      this.selectedIndex.set(undefined);
      this.selectedProduct.set(undefined);
    } else {
      const selected = this.check().products[index];
      this.selectedProduct.set(selected);
      this.selectedIndex.set(index);
      try {
        const prod = this.products().find((obj: any) => obj._id == selected.id);
        this.readyNotes.set(prod?.notes?.split(',') || []);
      } catch (error) {
        this.readyNotes.set([]);
      }
    }
  }

  getSpecies(product: any) {
    this.productSpecs.set(this.products().find((obj: any) => obj._id == product.id)?.specifies || []);
  }


  recalculateTotal() {
    const currentCheck = { ...this.check() };
    const activeProducts = currentCheck.products.filter((obj: any) => obj.status != 3);
    currentCheck.total_price = activeProducts.length > 0
      ? activeProducts.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
      : 0;
    this.check.set(currentCheck);
  }

  changeSpecs(spec: any) {
    const selected = this.selectedProduct();
    if (!selected) return;
    if (![0.5, 1.5].includes(this.selectedQuantity())) {
      selected.name = selected.name + ' ' + spec.spec_name;
      selected.price = spec.spec_price;
    } else {
      selected.name = selected.name + ' ' + spec.spec_name;
      selected.price = (spec.spec_price * this.selectedQuantity());
    }
    this.recalculateTotal();
    (window as any).$('#specsModal').modal('hide');
  }

  addNote(form: NgForm) {
    const selected = this.selectedProduct();
    const idx = this.selectedIndex();
    if (selected != undefined && idx != undefined) {
      const note = form.value.description;
      if (note == '' || note == null || note == ' ') {
        this.message.sendMessage('Not Alanı Boş Bırakılamaz');
      } else {
        const currentCheck = { ...this.check() };
        currentCheck.products[idx].note = note;
        this.check.set(currentCheck);
        form.reset();
        (window as any).$('#noteModal').modal('hide');
      }
    }
  }

  addReadyNotes(note: string) {
    // this.check.products[this.selectedIndex].note += note + ', ';
    this.noteInput.nativeElement.value += note + ', ';
    this.noteInput.nativeElement.dispatchEvent(new Event('input'));
  }

  makeGift() {
    const selected = this.selectedProduct();
    const idx = this.selectedIndex();
    if (selected != undefined && idx != undefined) {
      const currentCheck = { ...this.check() };
      currentCheck.products[idx].name += ' (İkram)';
      currentCheck.total_price -= currentCheck.products[idx].price;
      currentCheck.products[idx].price = 0;
      this.check.set(currentCheck);
      (window as any).$('#noteModal').modal('hide');
    }
  }

  dontGive() {
    const selected = this.selectedProduct();
    const idx = this.selectedIndex();
    if (selected != undefined && idx != undefined) {
      const currentCheck = { ...this.check() };
      currentCheck.products[idx].note = 'Verme';
      this.check.set(currentCheck);
      (window as any).$('#noteModal').modal('hide');
    }
  }

  addCheckNote(form: NgForm) {
    const note = form.value.description;
    if (note == '' || note == null || note == ' ') {
      this.message.sendMessage('Not Alanı Boş Bırakılamaz!');
    } else {
      const currentCheck = { ...this.check() };
      currentCheck.note = note;
      if (currentCheck.status !== CheckStatus.PASSIVE) {
        this.mainService.updateData('checks', this.check_id(), { note: note }).then((res: any) => {
          currentCheck._rev = res.rev;
          this.check.set(currentCheck);
        });
      } else {
        this.check.set(currentCheck);
      }
      form.reset();
      (window as any).$('#checkNote').modal('hide');
    }
  }

  cancelProduct(reason: string) {
    if (this.selectedProduct() !== undefined) {
      const currentCheck = { ...this.check() };
      const idx = this.selectedIndex()!;
      const ownerName = this.owner();

      currentCheck.products[idx].status = 3;
      currentCheck.products[idx].note = reason;
      currentCheck.products[idx].owner = ownerName;
      currentCheck.products[idx].timestamp = Date.now();
      currentCheck.total_price -= this.selectedProduct()!.price;

      const productAfterCancel = currentCheck.products.filter((obj: any) => obj.status == 1);
      currentCheck.products = currentCheck.products.filter((obj: any) => obj.status !== 1);
      const analyzeCheck = currentCheck.products.some((obj: any) => obj.status !== 3);

      if (analyzeCheck) {
        this.mainService.updateData(currentCheck.type == CheckType.ORDER ? 'closed_checks' : 'checks', this.check_id(), currentCheck).then((res: any) => {
          if (res.ok) {
            if (currentCheck.type == CheckType.NORMAL) {
              const pCat = this.categories().find((obj: any) => obj._id == currentCheck.products[idx].cat_id);
              if (pCat) {
                const device = this.printers().find((obj: any) => obj.name == pCat.printer);
                if (device) {
                  this.printerService.printCancel(device, currentCheck.products[idx], reason, this.table().name, ownerName);
                }
              }
              this.logService.createLog(logType.ORDER_CANCELED, currentCheck._id, `${this.table().name} Masasından ${this.selectedProduct()!.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            } else {
              this.logService.createLog(logType.ORDER_CANCELED, currentCheck._id, `${currentCheck.note} Hesabından ${this.selectedProduct()!.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            }
            this.check.set(currentCheck);
            this.message.sendMessage('Ürün İptal Edildi');
            this.selectedProduct.set(undefined);
            this.selectedIndex.set(undefined);
            (window as any).$('#cancelProduct').modal('hide');
            productAfterCancel.forEach((element: any) => {
              currentCheck.products.push(element);
            });
            this.check.set(currentCheck);
          }
        });
      } else {
        (window as any).$('#cancelProduct').modal('hide');
        const canceledTotalPrice = currentCheck.products.length > 0
          ? currentCheck.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
          : 0;
        const checkToCancel = new ClosedCheck(currentCheck.table_id, canceledTotalPrice, 0, ownerName, currentCheck.note, 3, currentCheck.products, Date.now(), 3, 'İkram', [], undefined, currentCheck.occupation);
        checkToCancel.description = 'Bütün Ürünler İptal Edildi';
        this.mainService.addData('closed_checks', checkToCancel).then((res: any) => {
          this.message.sendMessage('Hesap İptal Edildi');
          this.logService.createLog(logType.CHECK_CANCELED, currentCheck._id, `${this.table().name}'de kalan bütün ürünler iptal edildi. Hesap Kapatıldı.`)
        });
        this.mainService.removeData('checks', currentCheck._id);
        if (currentCheck.type == CheckType.NORMAL) {
          this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
        }
        this.router.navigate(['/store']);
      }
    }
  }

  //// 28900848 Protocol DAD
  //// CODENAME:BELALIM

  undoChanges() {
    const selectedProd = this.selectedProduct();
    const currentCheck = { ...this.check() };

    if (selectedProd) {
      if (selectedProd.status == ProductStatus.ACTIVE) {
        const idx = this.selectedIndex()!;
        const newIndex = this.newOrders().indexOf(currentCheck.products[idx]);
        this.decountProductsData(currentCheck.products[idx]);
        currentCheck.total_price = (currentCheck.total_price || 0) - currentCheck.products[idx].price;
        currentCheck.products.splice(idx, 1);
        this.newOrders.update(orders => {
          const updated = [...orders];
          if (newIndex > -1) updated.splice(newIndex, 1);
          return updated;
        });
        this.check.set(currentCheck);
        this.selectedIndex.set(undefined);
        this.selectedProduct.set(undefined);
      } else {
        return false;
      }
    } else {
      const orders = [...this.newOrders()];
      const lastOrder = orders.pop();
      this.newOrders.set(orders);

      const products = [...currentCheck.products];
      if (products.length > 0) {
        if (products[products.length - 1].status !== 2) {
          this.selectedIndex.set(undefined);
          this.selectedProduct.set(undefined);
          const lastItem = products.pop();
          if (lastItem) {
            this.decountProductsData(lastItem);
            currentCheck.total_price = (currentCheck.total_price || 0) - lastItem.price;
            currentCheck.products = products;
            this.check.set(currentCheck);
          }
        } else {
          return false;
        }
      }
    }
    return true;
  }

  decountProductsData(deProduct: CheckProduct) {
    this.countData.update(data => {
      const index = data.findIndex((obj: any) => obj.product === deProduct.id);
      if (index > -1) {
        data[index].count--;
        data[index].total -= deProduct.price;
        if (data[index].count == 0) {
          return data.filter((obj: any) => obj.product !== deProduct.id);
        }
      }
      return [...data];
    });
  }

  countProductsData(id: string, price: number, manuelCount?: number) {
    this.countData.update(data => {
      const index = data.findIndex(obj => obj.product === id);
      if (index > -1) {
        if (manuelCount) {
          data[index].count += manuelCount;
        } else {
          data[index].count++;
        }
        data[index].total += price;
      } else {
        let countObj;
        if (manuelCount) {
          countObj = { product: id, count: manuelCount, total: price };
        } else {
          countObj = { product: id, count: 1, total: price };
        }
        data.push(countObj);
      }
      return [...data];
    });
  }

  updateUserReport() {
    if (this.newOrders().length > 0) {
      const currentCheck = this.check();
      const ownerName = this.owner();
      const pricesTotal = this.newOrders().map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0);
      if (currentCheck.type == CheckType.NORMAL) {
        this.logService.createLog(logType.ORDER_CREATED, currentCheck._id, `'${ownerName}' ${this.table().name} masasına ${pricesTotal} TL tutarında sipariş girdi.`);
      } else {
        this.logService.createLog(logType.ORDER_CREATED, currentCheck._id, `'${ownerName}' Hızlı Satış - ${currentCheck.note} hesabına ${pricesTotal} TL tutarında sipariş girdi.`);
      }
      this.mainService.getAllBy('reports', { connection_id: this.ownerId() }).then((res: any) => {
        if (res.docs.length > 0) {
          const doc = res.docs[0];
          const currentDay = this.day();
          doc.amount += pricesTotal;
          doc.count++;
          doc.weekly[currentDay] += pricesTotal;
          doc.weekly_count[currentDay]++;
          doc.monthly[new Date().getMonth()] += pricesTotal;
          doc.monthly_count[new Date().getMonth()]++;
          if (doc.weekly_count[currentDay] == 100) {
            this.logService.createLog(logType.USER_CHECKPOINT, this.ownerId(), `'${ownerName}' günün 100. siparişini girdi.`);
          }
          doc.timestamp = Date.now();
          this.mainService.updateData('reports', doc._id, doc).then();
        }
      });
    }
  }

  updateProductReport(data: any) {
    const currentDay = this.day();
    data.forEach((obj: any, index: number) => {
      this.mainService.getAllBy('reports', { connection_id: obj.product }).then((res: any) => {
        if (res.docs.length > 0) {
          const report = res.docs[0];
          this.mainService.changeData('reports', report._id, (doc: any) => {
            doc.count += obj.count;
            doc.amount += obj.total;
            doc.timestamp = Date.now();
            doc.weekly[currentDay] += obj.total;
            doc.weekly_count[currentDay] += obj.count;
            doc.monthly[new Date().getMonth()] += obj.total;
            doc.monthly_count[new Date().getMonth()]++;
            return doc;
          });
        }
      });
      this.mainService.getAllBy('recipes', { product_id: obj.product }).then((result: any) => {
        if (result.docs.length > 0) {
          const pRecipe: Array<Ingredient> = result.docs[0].recipe;
          pRecipe.forEach((stock: any) => {
            const downStock = stock.amount * obj.count;
            this.mainService.changeData('stocks', stock.stock_id, (doc: any) => {
              doc.left_total -= downStock;
              doc.quantity = doc.total > 0 ? doc.left_total / doc.total : 0;
              if (doc.left_total < doc.warning_limit) {
                if (doc.db_name) {
                  if (doc.left_total <= 0) {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok tükendi!`);
                  } else {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id, `${doc.name} adlı stok bitmek üzere! - Kalan: '${doc.left_total + ' ' + doc.unit}'`);
                  }
                }
              }
              return doc;
            });
          });
        }
      });
    });
  }


  qrCode(printer: any) {
    (window as any).$('#qrPrintersModal').modal('hide');
    if (!printer) {
      printer = this.printers()[0];
    }
    const slug = localStorage.getItem('Slug')
    const currentCheck = { ...this.check() };
    const ownerName = this.owner();

    if (currentCheck._id !== undefined) {
      const qrdata = `https://quickly.cafe/${slug}/${currentCheck._id}`;
      this.printerService.printQRCode(printer, qrdata, this.table().name, ownerName);
    } else {
      currentCheck.status = CheckStatus.OCCUPIED;
      if (currentCheck.products.some((obj: any) => obj.status == 1)) {
        currentCheck.products = currentCheck.products.filter((obj: any) => obj.status !== 1);
        this.mainService.addData('checks', currentCheck).then((res: any) => {
          this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
            setTimeout(() => {
              const qrdata = `https://quickly.cafe/${slug}/${res.id}`;
              this.printerService.printQRCode(printer, qrdata, this.table().name, ownerName);
            }, 100)
          });
        })
      } else {
        this.mainService.addData('checks', currentCheck).then((res: any) => {
          this.mainService.updateData('tables', this.table()._id, { status: 2, timestamp: Date.now() }).then(() => {
            setTimeout(() => {
              const qrdata = `https://quickly.cafe//${slug}/${res.id}`;
              this.printerService.printQRCode(printer, qrdata, this.table().name, ownerName);
            }, 100)
          });
        })
      }
    }
    this.router.navigate(['/store']);
  }

  printOrder() {
    const currentPrinters = this.printers();
    const currentCheck = this.check();
    if (currentPrinters.length > 0) {
      const orders = currentCheck.products.filter((obj: any) => obj.status == 1);
      if (orders.length > 0) {
        const splitPrintArray: Array<any> = [];
        orders.forEach((obj: any, index: number) => {
          const category = this.categories().find(cat => cat._id == obj.cat_id);
          const catPrinter = category?.printer || currentPrinters[0]?.name || 'default';
          const contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            const index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            splitPrintArray[index].products.push(obj);
          } else {
            const thePrinter = currentPrinters.find((printer: any) => printer.name == catPrinter);
            if (thePrinter) {
              const splitPrintOrder = { printer: thePrinter, products: [obj] };
              splitPrintArray.push(splitPrintOrder);
            }
          }
          if (index == orders.length - 1) {
            let table_name: string;
            if (currentCheck.type == CheckType.FAST) {
              table_name = currentCheck.note;
            } else {
              table_name = this.table().name;
            }
            const ownerName = this.owner();
            splitPrintArray.forEach((order: any) => {
              this.printerService.printOrder(order.printer, table_name, order.products, ownerName);
            });
          }
        });
      }
    }
  }

  printCheck(selectedPrinter: any) {
    (window as any).$('#printersModal').modal('hide');
    const currentCheck = { ...this.check() };
    const currentTable = this.table();

    if (currentCheck.type == CheckType.NORMAL) {
      currentCheck.products = currentCheck.products.filter((obj: any) => obj.status == 2);
      currentCheck.total_price = currentCheck.products.length > 0
        ? currentCheck.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
        : 0;
      if (currentTable.status !== TableStatus.WILL_READY) {
        this.printerService.printCheck(selectedPrinter, currentTable.name, currentCheck);
        if (currentCheck.status !== CheckStatus.PASSIVE) {
          if (currentCheck.type == CheckType.NORMAL) {
            this.mainService.updateData('tables', this.id()!, { status: 3 }).then((res: any) => {
              this.router.navigate(['store']);
            });
            this.message.sendMessage('Hesap Yazdırıldı..');
          }
        }
      } else {
        this.message.sendConfirm('Adisyon Tekrar Yazdırılsın mı?').then((isOk: any) => {
          if (isOk) {
            this.printerService.printCheck(selectedPrinter, currentTable.name, currentCheck);
          }
        });
      }
    } else if (currentCheck.type == CheckType.FAST) {
      currentCheck.total_price = currentCheck.products.length > 0
        ? currentCheck.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0)
        : 0;
      this.printerService.printCheck(selectedPrinter, currentCheck.note, currentCheck);
    }
  }

  getProductsBy(id: string) {
    this.selectedCatId.set(id);
    this.selectedSubCatId.set(undefined);
  }

  getProductsBySubCat(id: string) {
    this.selectedSubCatId.set(id);
  }

  selectTable(id: string) {
    this.selectedTableId.set(id);
  }

  splitProduct() {
    const selectedProd = this.selectedProduct();
    const selectedTab = this.selectedTable() as any;
    const currentCheck = { ...this.check() };
    const ownerName = this.owner();

    if (!selectedProd || !selectedTab) return;

    if (selectedTab.status == TableStatus.ACTIVE) {
      this.message.sendConfirm(`${selectedProd.name}, ${selectedTab.name} Masasına Aktarılacak ve Yeni Hesap Açılacak.`).then(isOk => {
        if (isOk) {
          const newCheck = new Check(selectedTab._id, selectedProd.price, 0, ownerName, '', 1, [selectedProd], Date.now(), CheckType.NORMAL, CheckNo());
          this.mainService.addData('checks', newCheck).then(res => {
            if (res.ok) {
              const idx = this.selectedIndex()!;
              currentCheck.products.splice(idx, 1);
              currentCheck.total_price -= selectedProd.price;
              this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() }).then((res: any) => {
                if (res.ok) {
                  if (currentCheck.products.length == 0) {
                    if (currentCheck.payment_flow) {
                      let payedDiscounts = 0;
                      currentCheck.payment_flow.forEach((obj: any, index: number) => {
                        payedDiscounts += obj.discount;
                        this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
                          const currentDay = this.day();
                          this.mainService.changeData('reports', (r.docs[0])._id, (doc: any) => {
                            doc.count++;
                            doc.weekly_count[currentDay]++;
                            doc.amount += obj.amount;
                            doc.weekly[currentDay] += obj.amount;
                            doc.monthly[new Date().getMonth()] += obj.amount;
                            doc.monthly_count[new Date().getMonth()]++;
                            doc.timestamp = Date.now();
                            return doc;
                          });
                        });
                      });
                      const checksForPayed = new ClosedCheck(currentCheck.table_id, currentCheck.discount, payedDiscounts, ownerName, currentCheck.note, currentCheck.status, [], Date.now(), currentCheck.type, 'Parçalı', currentCheck.payment_flow, undefined, currentCheck.occupation);
                      this.mainService.addData('closed_checks', checksForPayed);
                    }
                    this.mainService.removeData('checks', currentCheck._id).then((res: any) => {
                      if (res.ok) {
                        (window as any).$('#splitTable').modal('hide');
                        this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
                          this.message.sendMessage(`Ürün ${selectedTab.name} Masasına Aktarıldı`);
                        });
                        this.router.navigate(['/store']);
                      }
                    });
                  } else {
                    this.mainService.updateData('checks', currentCheck._id, currentCheck).then((res: any) => {
                      if (res.ok) {
                        this.message.sendMessage(`Ürün ${selectedTab.name} Masasına Aktarıldı`);
                        currentCheck._rev = res.rev;
                        this.check.set(currentCheck);
                        this.setDefault();
                        (window as any).$('#splitTable').modal('hide');
                      }
                    });
                  }
                }
              })
            }
          })
        }
      });
    } else {
      this.mainService.getAllBy('checks', { table_id: selectedTab._id! }).then((res: any) => {
        if (res.docs.length > 0) {
          const otherCheck: Check = res.docs[0];
          const idx = this.selectedIndex()!;
          otherCheck.products.push(selectedProd);
          otherCheck.total_price += selectedProd.price;
          currentCheck.total_price -= selectedProd.price;
          currentCheck.products.splice(idx, 1);
          this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
            if (res.ok) {
              if (currentCheck.products.length == 0) {
                if (currentCheck.payment_flow) {
                  let payedDiscounts = 0;
                  currentCheck.payment_flow.forEach((obj: any, index: number) => {
                    payedDiscounts += obj.discount;
                    this.mainService.getAllBy('reports', { connection_id: obj.method }).then((r: any) => {
                      const currentDay = this.day();
                      this.mainService.changeData('reports', (r.docs[0])._id, (doc: any) => {
                        doc.count++;
                        doc.weekly_count[currentDay]++;
                        doc.amount += obj.amount;
                        doc.weekly[currentDay] += obj.amount;
                        doc.monthly[new Date().getMonth()] += obj.amount;
                        doc.monthly_count[new Date().getMonth()]++;
                        doc.timestamp = Date.now();
                        return doc;
                      });
                    });
                  });
                  const checksForPayed = new ClosedCheck(currentCheck.table_id, currentCheck.discount, payedDiscounts, ownerName, currentCheck.note, currentCheck.status, [], Date.now(), currentCheck.type, 'Parçalı', currentCheck.payment_flow, undefined, currentCheck.occupation);
                  this.mainService.addData('closed_checks', checksForPayed);
                }
                this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
                  if (r.ok) {
                    (window as any).$('#splitTable').modal('hide');
                    this.mainService.updateData('tables', currentCheck.table_id, { status: 1 }).then((res: any) => {
                      this.message.sendMessage(`Ürün ${selectedTab.name} Masasına Aktarıldı`);
                    });
                    this.router.navigate(['/store']);
                  }
                });
              } else {
                this.mainService.updateData('checks', currentCheck._id, currentCheck).then((r: any) => {
                  if (r.ok) {
                    this.message.sendMessage(`Ürün ${selectedTab.name} Masasına Aktarıldı`);
                    currentCheck._rev = r.rev;
                    this.check.set(currentCheck);
                    this.setDefault();
                    (window as any).$('#splitTable').modal('hide');
                  }
                });
              }
            }
            this.logService.createLog(logType.ORDER_MOVED, selectedProd.id, `${selectedProd.name} siparişi ${this.table().name} masasından ${selectedTab.name} masasına aktarıldı`)
          });
        }
      });
    }
  }

  splitTable() {
    const selectedTab = this.selectedTable() as any;
    const currentCheck = { ...this.check() };
    const currentTable = this.table() as any;

    if (!selectedTab) return;

    if (selectedTab.status == TableStatus.ACTIVE) {
      if (currentCheck.status !== CheckStatus.PASSIVE) {
        if (currentCheck.type == CheckType.NORMAL) {
          this.mainService.updateData('tables', currentCheck.table_id, { status: 1, timestamp: Date.now() });
        }
        this.mainService.updateData('tables', selectedTab._id, { status: 2, timestamp: Date.now() });
        this.mainService.updateData('checks', this.check_id(), { table_id: selectedTab._id!, type: 1 }).then((res: any) => {
          if (res.ok) {
            this.message.sendMessage(`Hesap ${selectedTab.name} Masasına Aktarıldı.`)
            if (currentCheck.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_MOVED, currentCheck._id, `${currentTable.name} Hesabı ${selectedTab.name} masasına taşındı.`);
            } else {
              this.logService.createLog(logType.CHECK_MOVED, currentCheck._id, `${currentCheck.note} Hesabı ${selectedTab.name} masasına taşındı.`);
            }
            (window as any).$('#splitTable').modal('hide');
            this.router.navigate(['/store']);
          }
        })
      }
    } else {
      this.message.sendConfirm(`Bütün Ürünler, ${selectedTab.name} Masasına Aktarılacak.`).then(isOk => {
        if (isOk) {
          this.mainService.getAllBy('checks', { table_id: selectedTab._id }).then(res => {
            if (res.docs.length > 0) {
              const otherCheck: Check = res.docs[0];
              otherCheck.products = otherCheck.products.concat(currentCheck.products);
              otherCheck.total_price += currentCheck.total_price;
              if (currentCheck.type == CheckType.NORMAL) {
                this.logService.createLog(logType.CHECK_MOVED, currentCheck._id, `${currentTable.name} Masası ${selectedTab.name} ile Birleştirildi.`);
              } else {
                otherCheck.note = `${currentCheck.note} Hesabı İle Birleştirildi`;
                this.logService.createLog(logType.CHECK_MOVED, currentCheck._id, `${currentCheck.note} Hesabı ${selectedTab.name} Masasına Aktarıldı.`);
              }
              if (currentCheck.payment_flow) {
                if (otherCheck.payment_flow) {
                  otherCheck.payment_flow = otherCheck.payment_flow.concat(currentCheck.payment_flow);
                } else {
                  otherCheck.payment_flow = currentCheck.payment_flow;
                }
                otherCheck.discount += (currentCheck.discount || 0);
                otherCheck.timestamp = Date.now();
              }
              this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
                if (res.ok) {
                  if (currentCheck.type == CheckType.NORMAL) {
                    this.mainService.updateData('tables', currentCheck.table_id, { status: 1 });
                  }
                  this.mainService.removeData('checks', currentCheck._id).then((r: any) => {
                    if (r.ok) {
                      this.message.sendMessage(`Hesap ${selectedTab.name} Masası ile Birleştirildi.`);
                      (window as any).$('#splitTable').modal('hide');
                      this.router.navigate(['/store']);
                    }
                  });
                }
              });
            }
          });
        }
      });
    }
  }

  setDiscount(value: any) {
    const currentCheck = { ...this.check() };
    currentCheck.discountPercent = value;
    this.check.set(currentCheck);

    (window as any).$('#checkDiscount').modal('hide');
    if (currentCheck.type == CheckType.NORMAL) {
      if (currentCheck.status !== CheckStatus.PASSIVE) {
        this.mainService.changeData('checks', currentCheck._id, (doc: any) => {
          doc.discountPercent = value;
          return doc;
        });
      }
    }
  }

  catName(id: string) {
    return this.categories().find((cat: any) => cat._id === id)?.name || '';
  }

  filterProducts(text: string) {
    this.filterText.set(text);
  }

  filterTables(id: string) {
    this.selectedFloorId.set(id);
    this.selectedTableId.set(undefined);
  }

  incrementMale() {
    const current = this.check();
    if (!current.occupation) current.occupation = { male: 0, female: 0 };
    current.occupation.male = (current.occupation.male || 0) + 1;
    this.check.set({ ...current });
  }

  decrementMale() {
    const current = this.check();
    if (current.occupation && (current.occupation.male || 0) > 0) {
      current.occupation.male--;
      this.check.set({ ...current });
    }
  }

  setMale(val: number) {
    const current = this.check();
    if (!current.occupation) current.occupation = { male: 0, female: 0 };
    current.occupation.male = val;
    this.check.set({ ...current });
  }

  incrementFemale() {
    const current = this.check();
    if (!current.occupation) current.occupation = { male: 0, female: 0 };
    current.occupation.female = (current.occupation.female || 0) + 1;
    this.check.set({ ...current });
  }

  decrementFemale() {
    const current = this.check();
    if (current.occupation && (current.occupation.female || 0) > 0) {
      current.occupation.female--;
      this.check.set({ ...current });
    }
  }

  setFemale(val: number) {
    const current = this.check();
    if (!current.occupation) current.occupation = { male: 0, female: 0 };
    current.occupation.female = val;
    this.check.set({ ...current });
  }

  setDefault() {
    this.selectedIndex.set(undefined);
    this.selectedTableId.set(undefined);
    this.selectedProduct.set(undefined);
    this.selectedFloorId.set(undefined);
    this.onProductChange.set(false);
    this.fillData();
  }

  fillData() {
    this.selectedCatId.set(undefined);
    this.settingsService.AppSettings.subscribe((res: any) => {
      this.askForPrint.set(res.value.ask_print_order === 'Sor');
      this.askForCheckPrint.set(res.value.ask_print_check === 'Sor');
    });
  }
}