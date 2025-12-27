import { Component, OnInit, ElementRef, OnDestroy, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../shared/pipes/general.pipe';
import { MainService } from '../../core/services/main.service';
import { DatabaseService } from '../../core/services/database.service';
import { Router } from '@angular/router';
import { Floor, Table } from '../../core/models/table.model';
import { Check, CheckProduct, CheckType, PaymentStatus } from '../../core/models/check.model';
import { Order, OrderItem, OrderStatus, OrderType, User } from '../../core/models/order.model';
import { Ingredient, Product } from '../../core/models/product.model';
import { SettingsService } from '../../core/services/settings.service';
import { Stock } from '../../core/models/stocks.model';
import { Report } from '../../core/models/report.model';
import { DayInfo } from '../../core/models/settings.model';
import { logType } from '../../core/services/log.service';
import { Receipt, ReceiptMethod, ReceiptStatus, ReceiptType } from '../../core/models/receipt.model';
import { TimeAgoPipe } from '../../shared/pipes/time-ago.pipe';

export interface CountData { product: string; count: number; total: number; };

@Component({
  standalone: true,
  imports: [CommonModule, RouterModule, PricePipe, GeneralPipe, TimeAgoPipe],
  selector: 'app-store',
  templateUrl: './store.component.html',
  styleUrls: ['./store.component.scss']
})

export class StoreComponent implements OnInit, OnDestroy {
  private readonly dbService = inject(DatabaseService);
  private readonly mainService = inject(MainService);
  private readonly router = inject(Router);
  private readonly settingsService = inject(SettingsService);

  // Use signals from DatabaseService
  readonly floors = this.dbService.floors;
  readonly tables = this.dbService.tables;
  readonly checks = this.dbService.checks;
  readonly orders = this.dbService.orders;
  readonly receipts = this.dbService.receipts;
  readonly products = this.dbService.products;

  // Local state signals
  readonly selectedFloorId = signal<string | null>(null);
  readonly section = signal<string>('Masalar');
  readonly filterText = signal<string>('');
  readonly owner = signal<string>(this.settingsService.getUser('name') as string);
  readonly ownerId = signal<string>(this.settingsService.getUser('id') as string);
  readonly closedDelivery = signal<any[]>([]);

  // Computed views (Reactive!)
  readonly tableViews = computed(() => {
    const floorId = this.selectedFloorId();
    const filter = this.filterText().toLowerCase();
    let result = this.tables();

    if (floorId && floorId !== 'All') {
      result = result.filter(t => t.floor_id === floorId);
    }

    if (filter) {
      result = result.filter(t => t.name.toLowerCase().includes(filter));
    }

    return result.sort((a, b) => a.name.localeCompare(b.name, 'tr', { numeric: true, sensitivity: 'base' }));
  });

  readonly checksView = computed(() => {
    const viewTables = this.tableViews();
    return this.checks().filter(({ table_id }) => viewTables.some(table => table._id === table_id));
  });

  readonly ordersView = computed(() => {
    const viewChecks = this.checksView();
    return this.orders()
      .filter(o => o.status === OrderStatus.WAITING || o.status === OrderStatus.PREPARING)
      .filter(o => o.type !== OrderType.EMPLOOYEE)
      .filter(({ check }: any) => viewChecks.some(obj => obj._id === check))
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
  });

  readonly receiptsView = computed(() => {
    const viewChecks = this.checksView();
    return this.receipts()
      .filter(r => r.status === ReceiptStatus.WAITING || r.status === ReceiptStatus.READY)
      .filter(({ check }: any) => viewChecks.some(obj => obj._id === check))
      .sort((a: any, b: any) => b.timestamp - a.timestamp);
  });

  readonly waitingOrders = computed(() => this.ordersView().length);
  readonly waitingReceipts = computed(() => this.receiptsView().length);

  constructor() {
    const selectedSection = localStorage.getItem('selectedSection');
    if (selectedSection) {
      this.section.set(selectedSection);
    }

    const selectedFloor = localStorage.getItem('selectedFloor');
    if (selectedFloor) {
      try {
        this.selectedFloorId.set(JSON.parse(selectedFloor));
      } catch (e) {
        this.selectedFloorId.set(null);
      }
    }
  }

  ngOnInit() {
    this.fetchClosedDelivery();
  }

  async fetchClosedDelivery() {
    const res = await this.mainService.getAllBy('closed_checks', { type: CheckType.ORDER });
    let delivery = res.docs.sort((a: any, b: any) => b.timestamp - a.timestamp);
    // Combine with current delivery checks
    const deliveryChecks = this.checks().filter(obj => obj.type === CheckType.ORDER);
    deliveryChecks.forEach(check => {
      delivery.unshift(check as any);
    });
    this.closedDelivery.set(delivery);
  }

  ngOnDestroy() {
  }

  changeSection(section: string) {
    this.section.set(section);
    localStorage.setItem('selectedSection', section);
  }

  getTablesBy(id: string) {
    if (id !== 'All') {
      this.selectedFloorId.set(id);
      localStorage.setItem('selectedFloor', JSON.stringify(id));
    } else {
      this.selectedFloorId.set(null);
      localStorage.removeItem('selectedFloor');
    }
  }

  getTableTotal(table_id: string): number {
    const thatCheck = this.checks().find(check => check.table_id === table_id);
    return thatCheck ? thatCheck.total_price : 0;
  }

  filterTables(value: string) {
    this.filterText.set(value);
  }

  // Business logic methods preserved 100%
  statusNote(status: OrderStatus): string {
    switch (status) {
      case OrderStatus.WAITING: return "Onay Bekliyor";
      case OrderStatus.PREPARING: return "Hazırlanıyor";
      case OrderStatus.APPROVED: return "Onaylandı";
      case OrderStatus.CANCELED: return "İptal Edildi";
      case OrderStatus.PAYED: return "Ödeme Yapıldı";
      default: return "";
    }
  }

  acceptOrder(order: Order) {
    this.mainService.updateData('orders', order._id!, { status: OrderStatus.PREPARING });
  }

  approoveOrder(order: Order) {
    const approveTime = Date.now();
    const CountData: Array<CountData> = [];
    this.mainService.changeData('checks', order.check, (check: Check) => {
      order.items.forEach((orderItem: any) => {
        const mappedProduct = this.products().find(product => product._id === orderItem.product_id || product.name === orderItem.name);
        if (mappedProduct) {
          const newProduct = new CheckProduct(mappedProduct._id!, mappedProduct.cat_id, mappedProduct.name + (orderItem.type ? ' ' + orderItem.type : ''), orderItem.price, orderItem.note, 2, this.ownerId(), approveTime, mappedProduct.tax_value, mappedProduct.barcode);
          this.countProductsData(CountData, newProduct.id, newProduct.price);
          check.total_price = check.total_price + newProduct.price;
          check.products.push(newProduct);
        }
      });
      return check;
    }).then(() => {
      this.updateProductReport(CountData);
      this.mainService.updateData('orders', order._id!, { status: OrderStatus.APPROVED, timestamp: approveTime });
    });
  }

  cancelOrder(order: Order) {
    this.mainService.updateData('orders', order._id!, { status: OrderStatus.CANCELED });
  }

  acceptReceipt(receipt: Receipt) {
    this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.READY, timestamp: Date.now() });
  }

  approoveReceipt(receipt: Receipt) {
    const Check = this.checks().find(check => check._id === receipt.check);
    if (!Check) return;

    const User: User = receipt.user;
    const userItems = receipt.orders.filter(order => order.status === OrderStatus.APPROVED);
    userItems.map(obj => { obj.status = OrderStatus.PAYED; return obj; });

    const productsWillPay = Check.products.filter(product => userItems.map(obj => obj.timestamp).includes(product.timestamp));
    const receiptMethod = (receipt.method === ReceiptMethod.CARD ? 'Kart' : receipt.method === ReceiptMethod.CASH ? 'Nakit' : receipt.method === ReceiptMethod.COUPON ? 'Kupon' : 'İkram');

    const newPayment: PaymentStatus = { owner: User.name, method: receiptMethod, amount: receipt.total, discount: receipt.discount, timestamp: Date.now(), payed_products: productsWillPay };

    if (Check.payment_flow === undefined) Check.payment_flow = [];
    Check.payment_flow.push(newPayment);
    Check.discount += newPayment.amount;
    Check.products = Check.products.filter(product => !productsWillPay.includes(product));
    Check.total_price = Check.products.length > 0 ? Check.products.map(p => p.price).reduce((a, b) => a + b, 0) : 0;

    this.mainService.LocalDB['allData'].bulkDocs(userItems).then(() => {
      this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.APPROVED, timestamp: Date.now() }).then(() => {
        this.mainService.updateData('checks', Check._id!, Check);
      });
    });
  }

  cancelReceipt(receipt: Receipt) {
    this.mainService.updateData('receipts', receipt._id!, { status: ReceiptStatus.CANCELED, timestamp: Date.now() });
  }

  paymentNote(method: ReceiptMethod): string {
    switch (method) {
      case ReceiptMethod.CASH: return "Nakit";
      case ReceiptMethod.CARD: return "Kredi Kartı";
      case ReceiptMethod.COUPON: return "Yemek Kartı - Kupon";
      case ReceiptMethod.MOBILE: return "Mobil Ödeme";
      case ReceiptMethod.CRYPTO: return "Bitcoin";
      default: return "";
    }
  }

  paymentStatus(status: ReceiptStatus): string {
    switch (status) {
      case ReceiptStatus.WAITING: return "Onay Bekliyor";
      case ReceiptStatus.READY: return "İşlemde";
      case ReceiptStatus.APPROVED: return "Onaylandı";
      case ReceiptStatus.CANCELED: return "İptal Edildi";
      default: return "";
    }
  }

  isOwner(check_id: string) {
    const check = this.checks().find(obj => obj._id === check_id);
    return check?.owner === this.owner();
  }

  findTable(check_id: string) {
    const check = this.checks().find(obj => obj._id === check_id);
    const table = this.tables().find(obj => obj._id === check?.table_id);
    return table?.name ?? "";
  }

  countProductsData = (counDataArray: Array<CountData>, id: string, price: number, manuelCount?: number): Array<CountData> => {
    let countObj: CountData = { product: id, count: manuelCount ?? 1, total: price };
    const index = counDataArray.findIndex(p => p.product === id);
    if (index > -1) {
      counDataArray[index].count += (manuelCount ?? 1);
      counDataArray[index].total += price;
    } else {
      counDataArray.push(countObj);
    }
    return counDataArray;
  }

  updateProductReport = async (count_data: Array<CountData>): Promise<boolean> => {
    try {
      const StoreDayInfo: DayInfo = (await (this.mainService.LocalDB['allData'] as any).find({ selector: { key: 'DateSettings' } })).docs[0].value;
      const Month = new Date(StoreDayInfo.time).getMonth();

      count_data.forEach(async (obj: CountData) => {
        const ProductReport: Report = (await (this.mainService.LocalDB['allData'] as any).find({ selector: { db_name: 'reports', connection_id: obj.product } })).docs[0];
        const ProductRecipe: any = (await (this.mainService.LocalDB['allData'] as any).find({ selector: { db_name: 'recipes', product_id: obj.product } })).docs[0];
        if (ProductReport) {
          (this.mainService.LocalDB['allData'] as any).upsert(ProductReport._id, (doc: Report) => {
            doc.count += obj.count;
            doc.amount += obj.total;
            doc.weekly[StoreDayInfo.day] += obj.total;
            doc.weekly_count[StoreDayInfo.day] += obj.count;
            doc.monthly[Month] += obj.total;
            doc.weekly_count[Month] += obj.count;
            return doc;
          });
        }
        if (ProductRecipe && ProductRecipe.recipe) {
          ProductRecipe.recipe.forEach((ingredient: any) => {
            const downStock = ingredient.amount * obj.count;
            (this.mainService.LocalDB['allData'] as any).upsert(ingredient.stock_id, (doc: Stock) => {
              doc.left_total -= downStock;
              doc.quantity = doc.left_total / doc.total;
              return doc;
            });
          });
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}
