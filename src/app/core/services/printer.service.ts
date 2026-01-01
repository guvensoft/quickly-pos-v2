import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron/electron.service';
import { MessageService } from './message.service';
import { SettingsService } from './settings.service';
import { Order } from '../models/order.model';
import { PrintOut, PrintOutStatus } from '../models/print.model';
import { MainService } from './main.service';

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private electron = inject(ElectronService);
  private mainService = inject(MainService);
  private messageService = inject(MessageService);
  private settings = inject(SettingsService);

  storeLogo: string;
  quicklyLogo: string;
  storeInfo: any;

  constructor() {
    // Use absolute path or assets folder based on environment
    if (this.electron.isElectron()) {
      const basePath = this.electron.appRealPath.endsWith('/')
        ? this.electron.appRealPath
        : this.electron.appRealPath + '/';
      this.storeLogo = basePath + 'data/customer.png';
      this.quicklyLogo = basePath + 'assets/quickly.png';
    } else {
      // Development mode - use assets folder
      this.storeLogo = 'assets/data/customer.png';
      this.quicklyLogo = 'assets/quickly.png';
    }

    // Error handling - İş mantığı AYNEN
    this.electron.on('error', (message: string, check: any, device: any) => {
      this.messageService.sendMessage(message);
      const newPrint = new PrintOut('Check', PrintOutStatus.WAITING, check._id, device);
      this.mainService
        .addData('prints', newPrint)
        .then(isSended => {
          console.log('Print Sended!');
        })
        .catch(err => {
          console.log('Hata Yazıcıya Ulaşılamadı');
        });
    });
  }

  // ============================================
  // İş Mantığı - %100 AYNEN KORUNDU
  // ============================================

  printTest(device: any): void {
    this.electron.send('printTest', device);
  }

  printOrder(device: any, table: any, orders: any[], owner: string): void {
    const ordersArray: any[] = [];
    orders.forEach(element => {
      const contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          ordersArray[index].price += element.price;
          ordersArray[index].count++;
        }
      } else {
        const schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, owner);
  }

  printTableOrder(device: any, table: any, order: Order): void {
    const ordersArray: any[] = [];
    order.items.forEach(element => {
      const contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          ordersArray[index].price += element.price;
          ordersArray[index].count++;
        }
      } else {
        const schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, order.user.name);
  }

  printCheck(device: any, table: any, check: any): void {
    const productsArray: any[] = [];
    const payedArray: any[] = [];

    check.products.forEach((element: any) => {
      const contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          productsArray[index].total_price += element.price;
          productsArray[index].count++;
        }
      } else {
        const schema = {
          name: element.name,
          note: element.note,
          price: element.price,
          total_price: element.price,
          count: 1,
          status: element.status
        };
        productsArray.push(schema);
      }
    });

    if (check.payment_flow && check.payment_flow.length > 0) {
      let payed: any[] = [];
      if (check.payment_flow.length > 1) {
        const things = check.payment_flow.map((obj: any) => obj.payed_products);
        things.forEach((element: any) => {
          if (element) {
            payed = payed.concat(element);
          }
        });
      } else if (check.payment_flow[0] && check.payment_flow[0].payed_products) {
        payed = check.payment_flow[0].payed_products;
      }

      payed.forEach(element => {
        const contains = payedArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
        if (contains) {
          const index = payedArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
          if (index !== -1) {
            payedArray[index].total_price += element.price;
            payedArray[index].count++;
          }
        } else {
          const schema = {
            name: element.name,
            note: element.note,
            price: element.price,
            total_price: element.price,
            count: 1,
            status: element.status
          };
          payedArray.push(schema);
        }
      });
    }

    const newCheck = Object.assign({}, check);
    newCheck.products = productsArray;
    newCheck.payed_products = payedArray;
    this.electron.send('printCheck', device, newCheck, table, this.storeLogo, '');
  }

  printPayment(device: any, table: any, payment: any): void {
    const productsArray: any[] = [];
    payment.payed_products.forEach((element: any) => {
      const contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          productsArray[index].total_price += element.price;
          productsArray[index].count++;
        }
      } else {
        const schema = {
          name: element.name,
          note: element.note,
          price: element.price,
          total_price: element.price,
          count: 1,
          status: element.status
        };
        productsArray.push(schema);
      }
    });
    payment.payed_products = productsArray;
    this.electron.send('printPayment', device, payment, table, this.storeLogo);
  }

  printEndDay(device: any, EndDayData: any): void {
    this.electron.send('printEndDay', device, EndDayData, this.quicklyLogo);
  }

  printReport(device: any, category: any, reports: any): void {
    this.electron.send('printReport', device, category, reports);
  }

  printCancel(device: any, product: any, reason: any, table: any, owner: any): void {
    this.electron.send('printCancel', device, product, reason, table, owner);
  }

  printQRCode(device: any, data: any, table: any, owner: any): void {
    this.electron.send('printQRcode', device, data, table, owner);
  }

  kickCashdraw(device: any): void {
    console.log('kickMustWork', device);
    this.electron.send('kickCashdraw', device);
  }

  // NOT: escpos USB ve Serial printer fonksiyonları Electron tarafında handle edilmeli
  // Angular 21'de doğrudan native module kullanımı desteklenmiyor
  getUSBPrinters(): any {
    // Bu fonksiyon main process'ten IPC ile çağrılmalı
    console.warn('getUSBPrinters should be called via IPC from main process');
    return [];
  }

  getSerialPrinters(path: string): any {
    // Bu fonksiyon main process'ten IPC ile çağrılmalı
    console.warn('getSerialPrinters should be called via IPC from main process');
    return null;
  }
}
