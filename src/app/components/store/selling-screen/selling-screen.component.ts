import { Component, ElementRef, OnInit, ViewChild, NgZone, ChangeDetectorRef, inject } from '@angular/core';
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

export class SellingScreenComponent implements OnInit {
  id!: string;
  type!: string;
  categories!: Array<Category>;
  sub_categories!: Array<SubCategory>;
  subCatsView?: Array<SubCategory>;
  products!: Array<Product>;
  productsView!: Array<Product>;
  checks!: Array<any>;
  floors!: Array<Floor>;
  selectedFloor?: string;
  tables: Array<Table> = [];
  selectedTable: any;
  tablesView: Array<any> = [];
  table: any = {};
  check: any = {};
  check_id!: string;
  selectedCat?: string;
  selectedProduct!: CheckProduct;
  selectedIndex!: number;
  noteForm!: NgForm;
  owner!: string;
  ownerRole!: string;
  ownerId!: string;
  newOrders: Array<CheckProduct> = [];
  countData: Array<any> = [];
  payedShow: boolean = false;
  payedTitle: string = 'Alınan Ödemeleri Görüntüle';
  permissions?: any;
  readyNotes: any[] = [];
  productSpecs: any[] = [];
  printers: any[] = [];
  scalerValue: number = 0;
  productStock: any;
  productWithSpecs: any;
  numpad: any = '';
  isFirstTime: boolean = true;
  numboard: Array<any> = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['.', '0', '◂']
  ];
  discounts: Array<number> = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80, 100];
  paymentMethods: Array<any> = [];
  cancelReasons: Array<string> = ['Yanlış Sipariş', 'Vazgeçildi', 'Zayi', 'Hatalı Kayıt'];
  day: number = new Date().getDay();
  askForPrint: boolean = false;
  askForCheckPrint: boolean = false;
  tareNumber: any = 0;
  onProductChange: boolean = false;
  selectedQuantity: number = 1;
  takeaway!: boolean;
  changes: any;
  scalerListener!: Subscription;
  private cdr = inject(ChangeDetectorRef);

  @ViewChild('productName') productFilterInput!: ElementRef;
  @ViewChild('specsUnit') productUnit!: ElementRef;
  @ViewChild('noteInput') noteInput!: ElementRef;

  constructor(private mainService: MainService, private printerService: PrinterService, private route: ActivatedRoute, private router: Router, private electron: ElectronService, private message: MessageService, private settingsService: SettingsService, private scalerService: ScalerService, private logService: LogService, private zone: NgZone) {
    this.owner = this.settingsService.getUser('name') as string;
    this.ownerRole = this.settingsService.getUser('type') as string;
    this.ownerId = this.settingsService.getUser('id') as string;
    this.discounts = [5, 10, 15, 20, 25, 40];
    this.selectedQuantity = 1;
    this.paymentMethods = [
      new PaymentMethod('Nakit', 'Nakit Ödeme', '#5cb85c', 'fa-money', 1, 1),
      new PaymentMethod('Kart', 'Kredi veya Banka Kartı', '#f0ad4e', 'fa-credit-card', 2, 1),
      new PaymentMethod('Kupon', 'İndirim Kuponu veya Yemek Çeki', '#5bc0de', 'fa-bookmark', 3, 1),
      new PaymentMethod('İkram', 'İkram Hesap', '#c9302c', 'fa-handshake-o', 4, 1)
    ];
    this.cancelReasons = [
      'Zayi',
      'Stokta Yok',
      'Yanlış Sipariş',
      'Müşteri İstemedi',
    ];
    this.numboard = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [".", 0, "◂"]];
    this.route.params.subscribe((params: any) => {
      this.id = params['id'];
      this.type = params['type'];
      switch (this.type) {
        case 'Normal':
          this.check = new Check(this.id, 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.NORMAL, CheckNo());
          this.getCheck({ table_id: this.id }).finally(() => {
            if (this.check.status == CheckStatus.PASSIVE) {
              (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          })
          break;
        case 'Fast':
          if (this.id == 'New') {
            this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo());
          } else {
            this.check = new Check('Hızlı Satış', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.FAST, CheckNo());
            this.getCheck({ _id: this.id }).finally(() => {
              if (this.check.status == CheckStatus.PASSIVE) {
                (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
              }
            })
          }
          break;
        case 'Order':
          this.check = new Check('Paket Servis', 0, 0, this.owner, '', CheckStatus.PASSIVE, [], Date.now(), CheckType.ORDER, CheckNo());
          this.getCheck({ _id: this.id }).finally(() => {
            if (this.check.status == CheckStatus.PASSIVE) {
              (window as any).$('#occupationModal').modal({ backdrop: 'static', keyboard: false });
            }
          })
          break;
        default:
          break;
      }
    });
    this.settingsService.DateSettings.subscribe((res: any) => {
      this.day = res.value.day;
    });
    this.settingsService.AppSettings.subscribe((res: any) => {
      let takeaway = res.value.takeaway;
      if (takeaway == 'Kapalı') {
        this.takeaway = false;
      } else {
        this.takeaway = true;
      }
    })
    this.permissions = JSON.parse(localStorage['userPermissions']) as any;
    this.settingsService.getPrinters().subscribe((res: any) => this.printers = res.value);
    if (localStorage.getItem('selectedFloor')) {
      this.selectedFloor = JSON.parse(localStorage['selectedFloor']);
    }
    this.tareNumber = 0;
  }

  ngOnInit() {
    this.fillData();
    this.changes = this.mainService.LocalDB['checks'].changes({ since: 'now', live: true }).on('change', (change: any) => {
      if (change.id == this.check_id) {
        if (!change.deleted) {
          this.mainService.getData('checks', change.id).then((res: any) => {
            this.check = res;
            this.id = res.table_id;
            if (this.check.status == CheckStatus.PROCESSING) {
              this.router.navigate(['/store']);
            }
          })
        } else {
          this.router.navigate(['/store']);
        }
      }
    });
    // setTimeout(() => {
    //   if (this.check.status == CheckStatus.PASSIVE) {
    //     $('#occupationModal').modal({backdrop:'static',keyboard:false});
    //   }
    // }, 500)

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
            this.selectedQuantity = 1;
          });
        }
      }
    });
    this.cdr.detectChanges();
  }

  ngOnDestroy() {
    this.changes.cancel();
    if (this.check.type == CheckType.ORDER && this.check.status == CheckStatus.PASSIVE) {
      if (this.check.products.length == 0 && !this.check.hasOwnProperty('payment_flow')) {
        this.mainService.removeData('checks', this.check._id!);
      }
    }
  }

  goPayment() {
    if (this.check.type == CheckType.FAST) {
      if (this.check.status == CheckStatus.PASSIVE) {
        this.updateUserReport();
        this.updateProductReport(this.countData);
        this.check.products.map((obj: any) => obj.status = 2);
        this.check.status = CheckStatus.OCCUPIED;
        this.mainService.addData('checks', this.check).then((res: any) => {
          if (res.ok) {
            this.router.navigate(['/payment', res.id]);
          }
        });
      } else {
        this.router.navigate(['/payment', this.check_id]);
      }
    } else {
      this.router.navigate(['/payment', this.check_id]);
    }
  }

  getCheck(filter: object) {
    if (this.type !== 'Order') {
      return this.mainService.getAllBy('checks', filter).then((result: any) => {
        if (result.docs.length > 0) {
          this.check = result.docs[0];
          this.check_id = result.docs[0]._id;
        }
      });
    } else {
      return this.mainService.getAllBy('checks', filter).then((result: any) => {
        if (result.docs.length > 0) {
          this.check = result.docs[0];
          this.check_id = result.docs[0]._id;
        }
      }).catch((err: any) => {
        console.log('Checks', err);
      });

      // setTimeout(() => {
      //   if (this.check.status == CheckStatus.PASSIVE) {
      //     $('#occupationModal').modal({backdrop:'static',keyboard:false});
      //   }
      // }, 500)
      // this.mainService.getAllBy('closed_checks', filter).then((result) => {
      //   if (result.docs.length > 0) {
      //     this.check = result.docs[0];
      //     this.check_id = result.docs[0]._id;
      //     this.check.occupation = { male: 0, female: 0 };
      //   }
      // }).catch(err => {
      //   console.log('Closed Checks', err);
      // });
    }
  }


  tareScaler() {
    this.tareNumber = this.numpad;
  }

  addToCheck(product: Product) {
    // this.selectedIndex = undefined;
    // this.selectedProduct = undefined;
    if (product.type == ProductType.MANUEL) {
      this.isFirstTime = true;
      this.productWithSpecs = product;
      this.mainService.getAllBy('recipes', { product_id: product._id! }).then((res: any) => {
        this.productStock = res.docs[0].recipe[0];
        this.numpad = this.productStock.amount;
        this.scalerListener = this.scalerService.listenScalerEvent().subscribe((weight: number) => {
          if (weight && weight !== 0) {
            this.numpad = weight * this.productStock.amount;
            if (this.tareNumber !== 0) {
              this.numpad = this.numpad - this.tareNumber;
            }

          }
        })
      });
      (window as any).$('#productSpecs').modal('show');
    } else {
      this.productFilterInput.nativeElement.value = '';
      let newProduct = new CheckProduct(product._id!, product.cat_id!, product.name!, product.price, '', 1, this.ownerId, Date.now(), product.tax_value!, product.barcode!);
      if (![0.5, 1.5].includes(this.selectedQuantity)) {
        for (let index = 0; index < this.selectedQuantity; index++) {
          this.countProductsData(product._id!, product.price);
          this.check.total_price = this.check.total_price + product.price;
          this.check.products.push(newProduct);
          this.newOrders.push(newProduct);
        }
      } else {
        this.countProductsData(product._id!, (product.price * this.selectedQuantity), this.selectedQuantity);
        this.check.total_price = this.check.total_price + (product.price * this.selectedQuantity);
        newProduct.price = (product.price * this.selectedQuantity);
        newProduct.name = newProduct.name + ' ' + this.selectedQuantity + ' Porsiyon'
        this.check.products.push(newProduct);
        this.newOrders.push(newProduct);
      }

      this.selectedIndex = this.check.products.length - 1;
      this.selectedProduct = this.check.products[this.selectedIndex];
      try {
        this.readyNotes = product.notes.split(',');
      } catch (error) {
        this.readyNotes = [];
      }
      if (product.specifies && product.specifies.length > 0) {
        // this.selectedIndex = this.check.products.length - 1;
        // this.selectedProduct = this.check.products[this.selectedIndex];
        this.getSpecies(newProduct);
        (window as any).$('#specsModal').modal({ backdrop: 'static', keyboard: false });
      } else {
        this.selectedQuantity = 1;
      }
    }
    setTimeout(() => {
      (window as any).$('#check-products').scrollTop(999999);
    }, 200)
    // this.selectedQuantity = 1;
  }

  numpadToCheck() {
    let newAmount = (this.numpad * this.productWithSpecs.price) / this.productStock.amount;
    let newNote = `${this.numpad} ${this.productUnit.nativeElement.innerHTML}`;
    const newProduct = new CheckProduct(this.productWithSpecs._id!, this.productWithSpecs.cat_id!, this.productWithSpecs.name!, newAmount, newNote, 1, this.owner, Date.now(), this.productWithSpecs.tax_value!, this.productWithSpecs.barcode!);
    this.check.total_price = this.check.total_price + newProduct.price;
    let countFor = newAmount / this.productWithSpecs.price;
    if (this.productUnit.nativeElement.innerHTML === 'Adet') {
      for (let index = 0; index < countFor; index++) {
        let repeatingProducts = new CheckProduct(this.productWithSpecs._id!, this.productWithSpecs.cat_id!, this.productWithSpecs.name!, this.productWithSpecs.price, '', 1, this.owner, Date.now(), this.productWithSpecs.tax_value!, this.productWithSpecs.barcode!);
        this.check.products.push(repeatingProducts);
        this.newOrders.push(repeatingProducts);
      }
    } else {
      this.check.products.push(newProduct);
      this.newOrders.push(newProduct);
    }
    this.countProductsData(this.productWithSpecs._id!, newAmount, countFor);
    this.tareNumber = 0;
    this.numpad = 0;
    (window as any).$('#productSpecs').modal('hide');
  }

  pushKey(key: any) {
    if (key === "◂") {
      this.numpad = '';
    } else {
      if (this.isFirstTime) {
        this.numpad = '';
        this.isFirstTime = false;
      }
      this.numpad += key;
    }
  }

  confirmCheck() {
    this.router.navigate(['/store']);
    let timestamp = Date.now();
    this.check.products.map((element: any) => {
      if (element.status === 1) {
        element.status = 2;
        element.timestamp = timestamp;
      }
    });
    if (this.check.status !== CheckStatus.PASSIVE) {
      if (this.check.type == CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id, { status: 2 });
      }
      this.mainService.updateData('checks', this.check_id, this.check).then((res: any) => {
        if (res.ok) {
          let newOrder = new Order(this.check._id, { id: this.ownerId, name: this.owner + ' ( Personel )' }, [], OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp)
          this.newOrders.forEach(order => {
            let orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            }
            newOrder.items.push(orderItem);
          })
          this.mainService.addData('orders', newOrder).then((res: any) => {
            let pricesTotal = this.newOrders.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
            if (this.check.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id!, `${this.table.name} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            } else {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id!, `${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          }).catch((err: any) => {
            console.log(err);
          })
        }
      });
    } else {
      this.check.status = CheckStatus.READY;
      if (this.check.type == CheckType.NORMAL) {
        this.mainService.updateData('tables', this.id, { status: 2, timestamp: Date.now() });
      }
      this.mainService.addData('checks', this.check).then((res: any) => {
        if (res.ok) {
          let newOrder = new Order(res.id, { id: this.ownerId, name: this.owner + ' ( Personel )' }, [], OrderStatus.APPROVED, OrderType.EMPLOOYEE, timestamp)
          this.newOrders.forEach((order: any) => {
            let orderItem: OrderItem = {
              name: order.name,
              price: order.price,
              note: order.note,
              product_id: order.id
            }
            newOrder.items.push(orderItem);
          })
          this.mainService.addData('orders', newOrder).then((res: any) => {
            if (this.check.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_CREATED, res.id, `${this.table.name} Masasına '${this.owner}' tarafından hesap açıldı`);
            } else {
              this.logService.createLog(logType.CHECK_CREATED, res.id, `${this.check.note} Notlu Hızlı Hesap '${this.owner}' tarafından açıldı`);
            }
          }).catch((err: any) => {
            console.log(err);
          })
        }
      });
    }
    this.updateUserReport();
    this.updateProductReport(this.countData);
  }

  sendCheck() {
    switch (this.check.type) {
      case CheckType.NORMAL:
        if (this.askForPrint) {
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
        if (this.check.note == '' || this.check.note == undefined) {
          this.message.sendConfirm('Hızlı Hesap oluşturmanız için hesaba not eklemek zorundasınız.').then((isOk: any) => {
            if (isOk) {
              (window as any).$('#checkNote').modal('show');
              return false;
            } else {
              return false;
            }
          })
        } else {
          if (this.askForPrint) {
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
        this.check.products.map((element: any) => {
          if (element.status === 1) {
            element.status = 2;
          }
        });
        if (this.check.status == CheckStatus.PASSIVE) {
          this.check.status = CheckStatus.READY;
          this.mainService.updateData('checks', this.check._id!, this.check).then((res: any) => {
            if (res.ok) {
              let pricesTotal = this.newOrders.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id!, `${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş eklendi.`);
            }
          });
        } else {
          this.mainService.updateData('closed_checks', this.check_id, this.check).then((res: any) => {
            if (res.ok) {
              this.logService.createLog(logType.CHECK_UPDATED, this.check._id!, `${this.check.note} hesabı ${this.owner} tarafından güncellendi.`);
            }
          });
        }
        this.router.navigate(['/store']);
        this.updateUserReport();
        this.updateProductReport(this.countData);
        break;
    }
  }

  endCheck() {
    this.message.sendConfirm('Dikkat! Hesap Kapatılacak.').then((isOK: any) => {
      if (isOK) {
        let checkWillClose = new ClosedCheck(this.check.table_id, (this.check.total_price + this.check.discount) - 0, 0, this.check.owner, this.check.note, CheckStatus.OCCUPIED, this.check.products, this.check.timestamp, this.check.type, 'Parçalı', this.check.payment_flow, undefined, this.check.occupation);
        this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
          this.updateSellingReport('Parçalı');
        });
        if (this.check._id !== undefined) {
          this.mainService.removeData('checks', this.check._id!);
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
          this.updateTableReport(this.check);
        }
        this.router.navigate(['/store']);
      }
    });
  }

  closeCheck(method: string) {
    if (method == 'Nakit') {
      this.printerService.kickCashdraw(this.printers[0])
    }
    let total_discounts = 0;
    let general_discount = 0;
    if (this.check.payment_flow) {
      let lastAmount = 0;
      let lastProducts = this.check.products.filter((obj: any) => obj.status == 2);
      lastProducts.forEach((product: any) => {
        lastAmount += product.price;
      })
      if (this.check.discountPercent) {
        general_discount = (this.check.total_price * this.check.discountPercent) / 100;
      }
      let lastPayment = new PaymentStatus(this.owner, method, lastAmount - general_discount, general_discount, Date.now(), lastProducts);
      this.check.payment_flow.push(lastPayment);
      this.check.products = [];
      method = 'Parçalı';
      total_discounts = this.check.payment_flow.map((obj: any) => obj.discount).reduce((a: number, b: number) => a + b);
    } else {
      if (this.check.discountPercent) {
        general_discount = (this.check.total_price * this.check.discountPercent) / 100;
        total_discounts += general_discount;
      }
    }
    (window as any).$('#closeCheck').modal('hide');
    let checkWillClose = new ClosedCheck(this.check.table_id, (this.check.total_price + this.check.discount) - general_discount, total_discounts, this.check.owner, this.check.note, CheckStatus.OCCUPIED, this.check.products, this.check.timestamp, this.check.type, method, this.check.payment_flow, undefined, this.check.occupation);
    if (this.check.type == CheckType.ORDER) {
      checkWillClose.products.map((obj: any) => obj.status = 2);
      checkWillClose.status = 2;
    }
    this.mainService.addData('closed_checks', checkWillClose).then((res: any) => {
      this.updateSellingReport(method);
    });
    if (this.check._id !== undefined) {
      this.mainService.removeData('checks', this.check._id!);
    }
    if (this.check.type == CheckType.NORMAL || this.check.type == CheckType.ORDER) {
      if (this.check.type == CheckType.ORDER) {
        this.updateProductReport(this.countData);
      } else {
        this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        this.updateTableReport(this.check);
      }
      this.router.navigate(['/store']);
    } else {
      this.updateUserReport();
      this.updateProductReport(this.countData);
      if (this.takeaway) {
        this.router.navigate(['']);
      } else {
        this.router.navigate(['/store']);
      }
    }
    if (this.check.type == CheckType.FAST) {
      this.logService.createLog(logType.CHECK_CLOSED, this.ownerId, `${this.owner} tarafından ${this.check.table_id} Hesabı ${this.check.total_price} TL ${method} ödeme alınarak kapatıldı.`)
    } else if (this.check.type == CheckType.NORMAL) {
      this.logService.createLog(logType.CHECK_CLOSED, this.check._id!, `${this.owner} tarafından ${this.table.name} Masası ${this.check.total_price} TL '${method}' ödeme alınarak kapatıldı.`)
    } else {
      this.logService.createLog(logType.CHECK_CLOSED, this.check._id!, `${this.owner} tarafından Paket Servis- ${this.check.note} hesabı ${this.check.total_price} TL '${method}' ödeme alınarak kapatıldı.`)
    }
    if (this.askForCheckPrint) {
      this.message.sendConfirm('Fiş Yazdırılsın mı ?').then((isOK: any) => {
        if (isOK) {
          if (this.check.type == CheckType.NORMAL) {
            this.printerService.printCheck(this.printers[0], this.table.name, checkWillClose);
          } else {
            this.printerService.printCheck(this.printers[0], this.check.table_id, checkWillClose);
          }
        }
      });
    } else {
      if (this.check.type == CheckType.NORMAL) {
        this.printerService.printCheck(this.printers[0], this.table.name, checkWillClose);
      } else {
        this.printerService.printCheck(this.printers[0], this.check.table_id, checkWillClose);
      }
    }
    this.message.sendMessage(`Hesap ${this.check.total_price} TL tutarında ödeme alınarak kapatıldı`);
  }

  updateSellingReport(method: string) {
    let general_discount = 0;
    if (this.check.discountPercent) {
      general_discount = (this.check.total_price * this.check.discountPercent) / 100;
    }
    if (method !== 'Parçalı') {
      this.mainService.getAllBy('reports', { connection_id: method }).then((res: any) => {
        if (res.docs.length > 0) {
          let doc = res.docs[0];
          doc.count++;
          doc.amount += (this.check.total_price + this.check.discount) - general_discount;
          doc.weekly[this.day] += (this.check.total_price + this.check.discount) - general_discount;
          doc.weekly_count[this.day]++;
          doc.monthly[new Date().getMonth()] += (this.check.total_price + this.check.discount) - general_discount;
          doc.monthly_count[new Date().getMonth()]++;
          doc.timestamp = Date.now();
          this.mainService.updateData('reports', doc._id!, doc);
        }
      });
    } else {
      this.mainService.getAllBy('reports', { type: "Store" }).then((res: any) => {
        let sellingReports = res.docs;
        this.check.payment_flow?.forEach((obj: any, index: number) => {
          let reportWillChange = sellingReports.find((report: any) => report.connection_id == obj.method);
          reportWillChange.count++;
          reportWillChange.amount += obj.amount;
          reportWillChange.weekly[this.day] += obj.amount;
          reportWillChange.weekly_count[this.day]++;
          reportWillChange.monthly[new Date().getMonth()] += obj.amount;
          reportWillChange.monthly_count[new Date().getMonth()]++;
          reportWillChange.timestamp = Date.now();
          if (this.check.payment_flow?.length == index + 1) {
            sellingReports.forEach((report: any) => {
              if (this.check.payment_flow?.some((payFlow: any) => payFlow.method == report.connection_id)) {
                this.mainService.updateData('reports', report._id!, report);
              }
            });
          }
        });
      });
    }
  }

  updateTableReport(check: Check) {
    this.mainService.getAllBy('reports', { connection_id: check.table_id }).then((res: any) => {
      let report = res.docs[0];
      report.count++;
      report.amount += this.check.total_price + this.check.discount;
      report.timestamp = Date.now();
      report.weekly[this.day] += this.check.total_price + this.check.discount;
      report.weekly_count[this.day]++;
      report.monthly[new Date().getMonth()] += this.check.total_price + this.check.discount;
      report.monthly_count[new Date().getMonth()]++;
      this.mainService.updateData('reports', report._id!, report);
    });
  }

  togglePayed() {
    if (this.payedShow) {
      this.payedShow = false;
      this.payedTitle = 'Alınan Ödemeleri Görüntüle';
    } else {
      this.payedShow = true;
      this.payedTitle = 'Alınan Ödemeleri Gizle';
    }
  }

  selectProduct(index: number) {
    if (this.selectedIndex == index) {
      this.selectedIndex = undefined!;
      this.selectedProduct = undefined!;
    } else {
      this.selectedProduct = this.check.products[index];
      this.selectedIndex = index;
      try {
        this.readyNotes = this.products.find((obj: any) => obj._id == this.selectedProduct.id)?.notes?.split(',') || [];
      } catch (error) {
        this.readyNotes = [];
      }
    }
  }

  getSpecies(product: any) {
    this.productSpecs = this.products.find((obj: any) => obj._id == product.id)?.specifies || [];
  }


  recalculateTotal() {
    this.check.total_price = this.check.products.filter((obj: any) => obj.status != 3).map((obj: any) => obj.price).reduce((a: number, b: number) => a + b, 0);
  }

  changeSpecs(spec: any) {
    const oldPrice = this.selectedProduct.price;
    if (![0.5, 1.5].includes(this.selectedQuantity)) {
      this.selectedProduct.name = this.selectedProduct.name + ' ' + spec.spec_name;
      this.selectedProduct.price = spec.spec_price;
    } else {
      this.selectedProduct.name = this.selectedProduct.name + ' ' + spec.spec_name;
      this.selectedProduct.price = (spec.spec_price * this.selectedQuantity);
    }
    this.recalculateTotal();
    (window as any).$('#specsModal').modal('hide');
  }

  addNote(form: NgForm) {
    if (this.selectedProduct != undefined) {
      let note = form.value.description;
      if (note == '' || note == null || note == ' ') {
        this.message.sendMessage('Not Alanı Boş Bırakılamaz');
      } else {
        this.check.products[this.selectedIndex].note = note;
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
    if (this.selectedProduct != undefined) {
      this.check.products[this.selectedIndex].name += ' (İkram)';
      this.check.total_price -= this.check.products[this.selectedIndex].price;
      this.check.products[this.selectedIndex].price = 0;
      (window as any).$('#noteModal').modal('hide');
    }
  }

  dontGive() {
    if (this.selectedProduct != undefined) {
      this.check.products[this.selectedIndex].note = 'Verme';
      (window as any).$('#noteModal').modal('hide');
    }
  }

  addCheckNote(form: NgForm) {
    let note = form.value.description;
    if (note == '' || note == null || note == ' ') {
      this.message.sendMessage('Not Alanı Boş Bırakılamaz!');
    } else {
      this.check.note = note;
      if (this.check.status !== CheckStatus.PASSIVE) {
        this.mainService.updateData('checks', this.check_id, { note: note }).then((res: any) => {
          this.check._rev = res.rev;
        });
      }
      form.reset();
      (window as any).$('#checkNote').modal('hide');
    }
  }

  cancelProduct(reason: string) {
    if (this.selectedProduct !== undefined) {
      this.check.products[this.selectedIndex].status = 3
      this.check.products[this.selectedIndex].note = reason;
      this.check.products[this.selectedIndex].owner = this.owner;
      this.check.products[this.selectedIndex].timestamp = Date.now();
      this.check.total_price -= this.selectedProduct.price;
      const productAfterCancel = this.check.products.filter((obj: any) => obj.status == 1);
      this.check.products = this.check.products.filter((obj: any) => obj.status !== 1);
      let analizeCheck = this.check.products.some((obj: any) => obj.status !== 3);
      if (analizeCheck) {
        this.mainService.updateData(this.check.type == CheckType.ORDER ? 'closed_checks' : 'checks', this.check_id, this.check).then((res: any) => {
          if (res.ok) {
            if (this.check.type == CheckType.NORMAL) {
              let pCat = this.categories.find((obj: any) => obj._id == this.check.products[this.selectedIndex].cat_id)!;
              let device = this.printers.find((obj: any) => obj.name == pCat.printer);
              this.printerService.printCancel(device!, this.check.products[this.selectedIndex], reason, this.table.name, this.owner);
              this.logService.createLog(logType.ORDER_CANCELED, this.check._id!, `${this.table.name} Masasından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            } else {
              this.logService.createLog(logType.ORDER_CANCELED, this.check._id!, `${this.check.note} Hesabından ${this.selectedProduct.name} adlı ürün iptal edildi Açıklama:'${reason}'`);
            }
            this.check._rev = res.rev;
            this.message.sendMessage('Ürün İptal Edildi');
            this.selectedProduct = undefined!;
            this.selectedIndex = undefined!;
            (window as any).$('#cancelProduct').modal('hide');
            productAfterCancel.forEach((element: any) => {
              this.check.products.push(element);
            })
          }
        });
      } else {
        (window as any).$('#cancelProduct').modal('hide');
        let canceledTotalPrice = this.check.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
        let checkToCancel = new ClosedCheck(this.check.table_id, canceledTotalPrice, 0, this.owner, this.check.note, 3, this.check.products, Date.now(), 3, 'İkram', [], undefined, this.check.occupation);
        checkToCancel.description = 'Bütün Ürünler İptal Edildi';
        this.mainService.addData('closed_checks', checkToCancel).then((res: any) => {
          this.message.sendMessage('Hesap İptal Edildi');
          this.logService.createLog(logType.CHECK_CANCELED, this.check._id!, `${this.table.name}'de kalan bütün ürünler iptal edildi. Hesap Kapatıldı.`)
        });
        if (this.check.payment_flow) {
          let payedDiscounts = 0;
          this.mainService.getAllBy('reports', { type: "Store" }).then((res: any) => {
            let sellingReports = res.docs;
            if (this.check.payment_flow) {
              this.check.payment_flow.forEach((obj: any, index: number) => {
                payedDiscounts += obj.discount;
                let reportWillChange = sellingReports.find((report: any) => report.connection_id == obj.method);
                if (reportWillChange) {
                  reportWillChange.count++;
                  reportWillChange.amount += obj.amount;
                  reportWillChange.weekly[this.day] += obj.amount;
                  reportWillChange.weekly_count[this.day]++;
                  reportWillChange.monthly[new Date().getMonth()] += obj.amount;
                  reportWillChange.monthly_count[new Date().getMonth()]++;
                  reportWillChange.timestamp = Date.now();
                }
                if (this.check.payment_flow?.length == index + 1) {
                  sellingReports.forEach((report: any) => {
                    if (this.check.payment_flow?.some((payFlow: any) => payFlow.method == report.connection_id)) {
                      this.mainService.updateData('reports', report._id!, report);
                    }
                  });
                }
              });
            }
          });
          let checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts, this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type, 'Parçalı', this.check.payment_flow, undefined, this.check.occupation);
          this.mainService.addData('closed_checks', checksForPayed);
        }
        this.mainService.removeData('checks', this.check._id!);
        if (this.check.type == CheckType.NORMAL) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1 });
        }
        this.router.navigate(['/store']);
      }
    }
  }

  //// 28900848 Protocol DAD
  //// CODENAME:BELALIM

  undoChanges() {
    if (this.selectedProduct) {
      if (this.selectedProduct.status == ProductStatus.ACTIVE) {
        let newIndex = this.newOrders.indexOf(this.check.products[this.selectedIndex]);
        this.decountProductsData(this.check.products[this.selectedIndex]);
        this.check.total_price = this.check.total_price - this.check.products[this.selectedIndex].price;
        this.check.products.splice(this.selectedIndex, 1);
        this.newOrders.splice(newIndex, 1);
        this.selectedIndex = undefined!;
        this.selectedProduct = undefined!;
      } else {
        return false;
      }
    } else {
      this.newOrders.pop();
      let count = this.check.products.length;
      if (count > 0) {
        if (this.check.products[count - 1].status !== 2) {
          this.selectedIndex = undefined!;
          this.selectedProduct = undefined!;
          let lastItem = this.check.products.pop();
          if (lastItem) {
            this.decountProductsData(lastItem);
            this.check.total_price = this.check.total_price - lastItem.price;
          }
        } else {
          return false;
        }
      }
    }
  }

  decountProductsData(deProduct: CheckProduct) {
    let contains = this.countData.some((obj: any) => obj.product === deProduct.id);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == deProduct.id);
      this.countData[index].count--;
      this.countData[index].total -= deProduct.price;
      if (this.countData[index].count == 0) {
        this.countData = this.countData.filter((obj: any) => obj.product !== deProduct.id);
      }
    }
  }

  countProductsData(id: string, price: number, manuelCount?: number) {
    let countObj;
    if (manuelCount) {
      countObj = { product: id, count: manuelCount, total: price };
    } else {
      countObj = { product: id, count: 1, total: price };
    }
    let contains = this.countData.some((obj: any) => obj.product === id);
    if (contains) {
      let index = this.countData.findIndex(p_id => p_id.product == id);
      if (manuelCount) {
        this.countData[index].count += manuelCount;
      } else {
        this.countData[index].count++;
      }
      this.countData[index].total += price;
    } else {
      this.countData.push(countObj);
    }
  }

  updateUserReport() {
    if (this.newOrders.length > 0) {
      let pricesTotal = this.newOrders.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
      if (this.check.type == CheckType.NORMAL) {
        this.logService.createLog(logType.ORDER_CREATED, this.check._id!, `'${this.owner}' ${this.table.name} masasına ${pricesTotal} TL tutarında sipariş girdi.`);
      } else {
        this.logService.createLog(logType.ORDER_CREATED, this.check._id!, `'${this.owner}' Hızlı Satış - ${this.check.note} hesabına ${pricesTotal} TL tutarında sipariş girdi.`);
      }
      this.mainService.getAllBy('reports', { connection_id: this.ownerId }).then((res: any) => {
        let doc = res.docs[0]
        doc.amount += pricesTotal;
        doc.count++;
        doc.weekly[this.day] += pricesTotal;
        doc.weekly_count[this.day]++;
        doc.monthly[new Date().getMonth()] += pricesTotal;
        doc.monthly_count[new Date().getMonth()]++;
        if (doc.weekly_count[this.day] == 100) {
          this.logService.createLog(logType.USER_CHECKPOINT, this.ownerId, `'${this.owner}' günün 100. siparişini girdi.`);
        }
        doc.timestamp = Date.now();
        this.mainService.updateData('reports', doc._id!, doc).then();
      });
    }
  }

  updateProductReport(data: any) {
    data.forEach((obj: any, index: number) => {
      this.mainService.getAllBy('reports', { connection_id: obj.product }).then((res: any) => {
        let report = res.docs[0];
        this.mainService.changeData('reports', report._id!, (doc: any) => {
          doc.count += obj.count;
          doc.amount += obj.total;
          doc.timestamp = Date.now();
          doc.weekly[this.day] += obj.total;
          doc.weekly_count[this.day] += obj.count;
          doc.monthly[new Date().getMonth()] += obj.total;
          doc.monthly_count[new Date().getMonth()]++;
          return doc;
        });
      });
      this.mainService.getAllBy('recipes', { product_id: obj.product }).then((result: any) => {
        if (result.docs.length > 0) {
          const pRecipe: Array<Ingredient> = result.docs[0].recipe;
          pRecipe.forEach((stock: any) => {
            let downStock = stock.amount * obj.count;
            this.mainService.changeData('stocks', stock.stock_id, (doc: any) => {
              doc.left_total -= downStock;
              doc.quantity = doc.left_total / doc.total;
              if (doc.left_total < doc.warning_limit) {
                if (doc.db_name) {
                  if (doc.left_total <= 0) {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id!, `${doc.name} adlı stok tükendi!`);
                  } else {
                    this.logService.createLog(logType.STOCK_CHECKPOINT, doc._id!, `${doc.name} adlı stok bitmek üzere! - Kalan: '${doc.left_total + ' ' + doc.unit}'`);
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
      printer = this.printers[0];
    }
    const slug = localStorage.getItem('Slug')
    console.log(this.check)
    if (this.check._id !== undefined) {
      let qrdata = `https://quickly.cafe/${slug}/${this.check._id}`;
      this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
    } else {
      this.check.status = CheckStatus.OCCUPIED;
      // this.check.type = CheckType.SELF;
      if (this.check.products.some((obj: any) => obj.status == 1)) {
        this.check.products = this.check.products.filter((obj: any) => obj.status !== 1);
        this.mainService.addData('checks', this.check).then((res: any) => {
          this.mainService.updateData('tables', this.table._id!, { status: 2, timestamp: Date.now() }).then(() => {
            console.log(this.check._id!);
            setTimeout(() => {
              let qrdata = `https://quickly.cafe/${slug}/${this.check._id!}`;
              this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
            }, 100)
          });
        })
      } else {
        this.mainService.addData('checks', this.check).then((res: any) => {
          this.mainService.updateData('tables', this.table._id!, { status: 2, timestamp: Date.now() }).then(() => {
            console.log(this.check._id!);
            setTimeout(() => {
              let qrdata = `https://quickly.cafe//${slug}/${this.check._id!}`;
              this.printerService.printQRCode(printer, qrdata, this.table.name, this.owner);
            }, 100)
          });
        })
      }
    }
    this.router.navigate(['/store']);
  }

  printOrder() {
    if (this.printers.length > 0) {
      let orders = this.check.products.filter((obj: any) => obj.status == 1);
      if (orders.length > 0) {
        let splitPrintArray: Array<any> = [];
        orders.forEach((obj: any, index: number) => {
          let catPrinter = this.categories.filter(cat => cat._id == obj.cat_id)[0].printer || this.printers[0].name;
          let contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            let index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            splitPrintArray[index].products.push(obj);
          } else {
            let thePrinter = this.printers.filter((obj: any) => obj.name == catPrinter)[0];
            let splitPrintOrder = { printer: thePrinter, products: [obj] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (index == orders.length - 1) {
            let table_name: string;
            if (this.check.type == CheckType.FAST) {
              table_name = this.check.note;
            } else {
              table_name = this.table.name;
            }
            splitPrintArray.forEach((order: any) => {
              this.printerService.printOrder(order.printer, table_name, order.products, this.owner);
            });
          }
        });
      }
    }
  }

  printCheck(selectedPrinter: any) {
    (window as any).$('#printersModal').modal('hide');
    if (this.check.type == CheckType.NORMAL) {
      this.check.products = this.check.products.filter((obj: any) => obj.status == 2);
      this.check.total_price = this.check.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
      if (this.table.status !== TableStatus.WILL_READY) {
        this.printerService.printCheck(selectedPrinter, this.table.name, this.check);
        if (this.check.status !== CheckStatus.PASSIVE) {
          if (this.check.type == CheckType.NORMAL) {
            this.mainService.updateData('tables', this.id, { status: 3 }).then((res: any) => {
              this.router.navigate(['store']);
            });
            this.message.sendMessage('Hesap Yazdırıldı..');
          }
        }
      } else {
        this.message.sendConfirm('Adisyon Tekrar Yazdırılsın mı?').then((isOk: any) => {
          if (isOk) {
            this.printerService.printCheck(selectedPrinter, this.table.name, this.check);
          }
        });
      }
    } else if (this.check.type == CheckType.FAST) {
      this.check.total_price = this.check.products.map((obj: any) => obj.price).reduce((a: number, b: number) => a + b);
      this.printerService.printCheck(selectedPrinter, this.check.note, this.check);
    }
  }

  getProductsBy(id: string) {
    this.selectedCat = id;
    this.subCatsView = this.sub_categories.filter((obj: any) => obj.cat_id == id);
    this.productsView = this.products.filter((obj: any) => obj.cat_id == id);
  }

  getProductsBySubCat(id: string) {
    this.productsView = this.products.filter((obj: any) => obj.subcat_id == id);
  }

  selectTable(id: string) {
    this.selectedTable = id;
  }

  splitProduct() {
    if (this.selectedTable.status == TableStatus.ACTIVE) {
      this.message.sendConfirm(`${this.selectedProduct.name}, ${this.selectedTable.name} Masasına Aktarılacak ve Yeni Hesap Açılacak.`).then(isOk => {
        if (isOk) {
          let newCheck = new Check(this.selectedTable._id, this.selectedProduct.price, 0, this.owner, '', 1, [this.selectedProduct], Date.now(), CheckType.NORMAL, CheckNo());
          this.mainService.addData('checks', newCheck).then(res => {
            if (res.ok) {
              this.check.products.splice(this.selectedIndex, 1);
              this.check.total_price -= this.selectedProduct.price;
              this.mainService.updateData('tables', this.selectedTable._id!, { status: 2, timestamp: Date.now() }).then((res: any) => {
                if (res.ok) {
                  if (this.check.products.length == 0) {
                    if (this.check.payment_flow) {
                      let payedDiscounts = 0;
                      this.check.payment_flow.forEach((obj: any, index: number) => {
                        payedDiscounts += obj.discount;
                        this.mainService.getAllBy('reports', { connection_id: obj.method }).then((res: any) => {
                          this.mainService.changeData('reports', (res.docs[0] as any)._id!, (doc: any) => {
                            doc.count++;
                            doc.weekly_count[this.day]++;
                            doc.amount += obj.amount;
                            doc.weekly[this.day] += obj.amount;
                            doc.monthly[new Date().getMonth()] += obj.amount;
                            doc.monthly_count[new Date().getMonth()]++;
                            doc.timestamp = Date.now();
                            return doc;
                          });
                        });
                      });
                      let checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts, this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type, 'Parçalı', this.check.payment_flow, undefined, this.check.occupation);
                      this.mainService.addData('closed_checks', checksForPayed);
                    }
                    this.mainService.removeData('checks', this.check._id!).then((res: any) => {
                      if (res.ok) {
                        (window as any).$('#splitTable').modal('hide');
                        this.mainService.updateData('tables', this.check.table_id, { status: 1 }).then((res: any) => {
                          this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                        });
                        this.router.navigate(['/store']);
                      }
                    });
                  } else {
                    this.mainService.updateData('checks', this.check._id!, this.check).then((res: any) => {
                      if (res.ok) {
                        this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                        this.check._rev = res.rev;
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
      this.mainService.getAllBy('checks', { table_id: this.selectedTable._id! }).then((res: any) => {
        let otherCheck: Check = res.docs[0];
        otherCheck.products.push(this.selectedProduct);
        otherCheck.total_price += this.selectedProduct.price;
        this.check.total_price -= this.selectedProduct.price;
        this.check.products.splice(this.selectedIndex, 1);
        this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
          if (res.ok) {
            if (this.check.products.length == 0) {
              if (this.check.payment_flow) {
                let payedDiscounts = 0;
                this.check.payment_flow.forEach((obj: any, index: number) => {
                  payedDiscounts += obj.discount;
                  this.mainService.getAllBy('reports', { connection_id: obj.method }).then((res: any) => {
                    this.mainService.changeData('reports', (res.docs[0] as any)._id!, (doc: any) => {
                      doc.count++;
                      doc.weekly_count[this.day]++;
                      doc.amount += obj.amount;
                      doc.weekly[this.day] += obj.amount;
                      doc.monthly[new Date().getMonth()] += obj.amount;
                      doc.monthly_count[new Date().getMonth()]++;
                      doc.timestamp = Date.now();
                      return doc;
                    });
                  });
                });
                let checksForPayed = new ClosedCheck(this.check.table_id, this.check.discount, payedDiscounts, this.owner, this.check.note, this.check.status, [], Date.now(), this.check.type, 'Parçalı', this.check.payment_flow, undefined, this.check.occupation);
                this.mainService.addData('closed_checks', checksForPayed);
              }
              this.mainService.removeData('checks', this.check._id!).then((res: any) => {
                if (res.ok) {
                  (window as any).$('#splitTable').modal('hide');
                  this.mainService.updateData('tables', this.check.table_id, { status: 1 }).then((res: any) => {
                    this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                  });
                  this.router.navigate(['/store']);
                }
              });
            } else {
              this.mainService.updateData('checks', this.check._id!, this.check).then((res: any) => {
                if (res.ok) {
                  this.message.sendMessage(`Ürün ${this.selectedTable.name} Masasına Aktarıldı`);
                  this.check._rev = res.rev;
                  this.setDefault();
                  (window as any).$('#splitTable').modal('hide');
                }
              });
            }
          }
          this.logService.createLog(logType.ORDER_MOVED, this.selectedProduct.id, `${this.selectedProduct.name} siparişi ${this.table.name} masasından ${this.selectedTable.name} masasına aktarıldı`)
        });
      });
    }
  }

  splitTable() {
    if (this.selectedTable.status == TableStatus.ACTIVE) {
      if (this.check.status !== CheckStatus.PASSIVE) {
        if (this.check.type == CheckType.NORMAL) {
          this.mainService.updateData('tables', this.check.table_id, { status: 1, timestamp: Date.now() });
        }
        this.mainService.updateData('tables', this.selectedTable._id!, { status: 2, timestamp: Date.now() });
        this.mainService.updateData('checks', this.check_id, { table_id: this.selectedTable._id!, type: 1 }).then((res: any) => {
          if (res.ok) {
            this.message.sendMessage(`Hesap ${this.selectedTable.name} Masasına Aktarıldı.`)
            if (this.check.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id!, `${this.table.name} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            } else {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id!, `${this.check.note} Hesabı ${this.selectedTable.name} masasına taşındı.`);
            }
            (window as any).$('#splitTable').modal('hide');
            this.router.navigate(['/store']);
          }
        })
      }
    } else {
      this.message.sendConfirm(`Bütün Ürünler, ${this.selectedTable.name} Masasına Aktarılacak.`).then(isOk => {
        if (isOk) {
          this.mainService.getAllBy('checks', { table_id: this.selectedTable._id }).then(res => {
            let otherCheck: Check = res.docs[0];
            otherCheck.products = otherCheck.products.concat(this.check.products);
            otherCheck.total_price += this.check.total_price;
            if (this.check.type == CheckType.NORMAL) {
              this.logService.createLog(logType.CHECK_MOVED, this.check._id!, `${this.table.name} Masası ${this.selectedTable.name} ile Birleştirildi.`);
            } else {
              otherCheck.note = `${this.check.note} Hesabı İle Birleştirildi`;
              this.logService.createLog(logType.CHECK_MOVED, this.check._id!, `${this.check.note} Hesabı ${this.selectedTable.name} Masasına Aktarıldı.`);
            }
            if (this.check.payment_flow) {
              if (otherCheck.payment_flow) {
                otherCheck.payment_flow = otherCheck.payment_flow.concat(this.check.payment_flow);
              } else {
                otherCheck.payment_flow = this.check.payment_flow;
              }
              otherCheck.discount += this.check.discount;
              otherCheck.timestamp = Date.now();
            }
            this.mainService.updateData('checks', otherCheck._id!, otherCheck).then((res: any) => {
              if (res.ok) {
                if (this.check.type == CheckType.NORMAL) {
                  this.mainService.updateData('tables', this.check.table_id, { status: 1 });
                }
                this.mainService.removeData('checks', this.check._id!).then((res: any) => {
                  if (res.ok) {
                    this.message.sendMessage(`Hesap ${this.selectedTable.name} Masası ile Birleştirildi.`);
                    (window as any).$('#splitTable').modal('hide');
                    this.router.navigate(['/store']);
                  }
                });
              }
            });
          });
        }
      });
    }
  }

  setDiscount(value: any) {
    this.check.discountPercent = value;
    (window as any).$('#checkDiscount').modal('hide');
    if (this.check.type == CheckType.NORMAL) {
      if (this.check.status !== CheckStatus.PASSIVE) {
        this.mainService.changeData('checks', this.check._id!, (doc: any) => {
          doc.discountPercent = value;
          return doc;
        });
      }
    }
  }

  catName(cat_id: string) {
    try {
      return this.categories.find((obj: any) => obj._id == cat_id)!.name;
    } catch (error) {
      return '';
    }
  }

  filterProducts(value: string) {
    if (value !== '') {
      let regexp = new RegExp(value, 'i');
      this.productsView = this.products.filter(({ name }) => name.match(regexp));
      this.selectedCat = 'OnSearch';
    } else {
      this.selectedCat = undefined;
    }

  }

  filterTables(id: string) {
    this.selectedFloor = id;
    this.selectedTable = undefined!;
    this.tablesView = this.tables.filter((obj: any) => obj.floor_id == id);
  }

  setDefault() {
    this.selectedIndex = undefined!;
    this.selectedTable = undefined!;
    this.selectedProduct = undefined!;
    this.selectedFloor = undefined!;
    this.onProductChange = false;
    this.fillData()
  }

  fillData() {
    this.selectedCat = undefined!;
    this.mainService.getAllBy('categories', {}).then((result: any) => {
      this.categories = result.docs;
      this.categories = this.categories.sort((a: any, b: any) => a.order - b.order);
    });
    this.mainService.getAllBy('sub_categories', {}).then((result: any) => {
      this.sub_categories = result.docs;
    });
    this.mainService.getAllBy('products', {}).then((result: any) => {
      this.products = result.docs;
      this.products = this.products.sort((a: any, b: any) => a.price - b.price);
      this.productsView = this.products;
    });
    this.mainService.getAllBy('tables', {}).then((res: any) => {
      this.tables = res.docs;
      this.table = this.tables.filter((obj: any) => obj._id == this.id)[0];
      this.tables = this.tables.filter((obj: any) => obj._id !== this.id).filter((obj: any) => obj.status !== 3).sort((a: any, b: any) => a.name.localeCompare(b.name));
      if (this.selectedFloor) {
        this.tablesView = this.tables.filter((obj: any) => obj.floor_id == this.selectedFloor);
      } else {
        this.tablesView = this.tables;
      }
    });
    this.mainService.getAllBy('floors', {}).then((res: any) => {
      this.floors = res.docs;
    });
    this.settingsService.getAppSettings().subscribe((res: any) => {

      if (res.value.ask_print_order == 'Sor') {
        this.askForPrint = true;
      } else {
        this.askForPrint = false;
      }

      if (res.value.ask_print_check == 'Sor') {
        this.askForCheckPrint = true;
      } else {
        this.askForCheckPrint = false;
      }
    });
  }
}