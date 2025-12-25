import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron.service';

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
      let orders = check.products.filter((obj: any) => obj.status == 1);
      if (orders.length > 0) {
        let splitPrintArray: any[] = [];
        orders.forEach((obj: any, index: number) => {
          let catPrinter = categories.filter(cat => cat._id == obj.cat_id)[0].printer || printers[0].name;
          let contains = splitPrintArray.some(element => element.printer.name == catPrinter);
          if (contains) {
            let idx = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
            splitPrintArray[idx].products.push(obj);
          } else {
            let thePrinter = printers.filter(p => p.name == catPrinter)[0];
            let splitPrintOrder = { printer: thePrinter, products: [obj] };
            splitPrintArray.push(splitPrintOrder);
          }
          if (index == orders.length - 1) {
            let table_name = tables.filter(t => t._id == check.table_id)[0].name;
            splitPrintArray.forEach(order => {
              this.printOrder(order.printer, table_name, order.products);
            });
          }
        });
      }
    }
  }

  printOrder(device: any, table: string, orders: any[]): void {
    let ordersArray: any[] = [];
    orders.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: '', price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, orders[0].owner);
  }
}
