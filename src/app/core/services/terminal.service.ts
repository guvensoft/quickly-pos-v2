import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron/electron.service';

@Injectable({
  providedIn: 'root'
})
export class TerminalService {
  private electron = inject(ElectronService);

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  printOrders(printers: any[], categories: any[], check: any, tables: any[]): void {
    if (printers.length > 0) {
      const orders = check.products.filter((obj: any) => obj.status == 1);
      if (orders.length > 0) {
        const splitPrintArray: any[] = [];
        orders.forEach((obj: any, index: number) => {
          const category = categories.find(cat => cat._id == obj.cat_id);
          const catPrinter = category?.printer || printers[0]?.name || 'default';
          const contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            const idx = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            if (idx !== -1) {
              splitPrintArray[idx].products.push(obj);
            }
          } else {
            const thePrinter = printers.find(p => p.name == catPrinter);
            if (thePrinter) {
              const splitPrintOrder = { printer: thePrinter, products: [obj] };
              splitPrintArray.push(splitPrintOrder);
            }
          }
          if (index == orders.length - 1) {
            const table = tables.find(t => t._id == check.table_id);
            const table_name = table?.name || 'Unknown';
            splitPrintArray.forEach(order => {
              this.printOrder(order.printer, table_name, order.products);
            });
          }
        });
      }
    }
  }

  printOrder(device: any, table: string, orders: any[]): void {
    if (!orders || orders.length === 0) return;

    const ordersArray: any[] = [];
    orders.forEach(element => {
      const contains = ordersArray.some(obj => obj.name == element.name);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name == element.name);
        if (index !== -1) {
          ordersArray[index].price += element.price;
          ordersArray[index].count++;
        }
      } else {
        const schema = { name: element.name, note: '', price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    const owner = orders[0]?.owner || 'Unknown';
    this.electron.send('printOrder', device, table, ordersArray, owner);
  }
}
