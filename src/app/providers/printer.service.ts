import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron.service';
import { MessageService } from './message.service';
import { SettingsService } from '../services/settings.service';
import { Order } from '../mocks/order';
import { PrintOut, PrintOutStatus } from '../mocks/print';
import { MainService } from '../services/main.service';

@Injectable({
  providedIn: 'root'
})
export class PrinterService {
  private electron = inject(ElectronService);
  private mainService = inject(MainService);
  private messageService = inject(MessageService);
  private settings = inject(SettingsService);

  storeLogo!: string;
  quicklyLogo!: string;
  storeInfo: any;

  constructor() {
    this.storeLogo = this.electron.appRealPath + '/data/customer.png';
    this.quicklyLogo = this.electron.appPath + '/assets/quickly.png';

    // Error handling - İş mantığı AYNEN
    this.electron.on('error', (message: string, check: any, device: any) => {
      this.messageService.sendMessage(message);
      let newPrint = new PrintOut('Check', PrintOutStatus.WAITING, check._id, device);
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
    let ordersArray: any[] = [];
    orders.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, owner);
  }

  printTableOrder(device: any, table: any, order: Order): void {
    let ordersArray: any[] = [];
    order.items.forEach(element => {
      let contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        ordersArray[index].price += element.price;
        ordersArray[index].count++;
      } else {
        let schema = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, order.user.name);
  }

  printCheck(device: any, table: any, check: any): void {
    let productsArray: any[] = [];
    let payedArray: any[] = [];

    check.products.forEach((element: any) => {
      let contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
      if (contains) {
        let index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        productsArray[index].total_price += element.price;
        productsArray[index].count++;
      } else {
        let schema = {
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

    if (check.payment_flow) {
      let payed: any[] = [];
      if (check.payment_flow.length > 1) {
        let things = check.payment_flow.map((obj: any) => obj.payed_products);
        things.forEach((element: any) => {
          payed = payed.concat(element);
        });
      } else {
        payed = check.payment_flow[0].payed_products;
      }

      payed.forEach(element => {
        let contains = payedArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
        if (contains) {
          let index = payedArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
          payedArray[index].total_price += element.price;
          payedArray[index].count++;
        } else {
          let schema = {
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

    let newCheck = Object.assign({}, check);
    newCheck.products = productsArray;
    newCheck.payed_products = payedArray;
    this.electron.send('printCheck', device, newCheck, table, this.storeLogo, '');
  }

  printPayment(device: any, table: any, payment: any): void {
    let productsArray: any[] = [];
    payment.payed_products.forEach((element: any) => {
      let contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        let index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        productsArray[index].total_price += element.price;
        productsArray[index].count++;
      } else {
        let schema = {
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
