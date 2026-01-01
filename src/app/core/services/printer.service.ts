import { Injectable, inject } from '@angular/core';
import { ElectronService } from './electron/electron.service';
import { MessageService } from './message.service';
import { SettingsService } from './settings.service';
import { Order, OrderItem } from '../models/order.model';
import { PrintOut, PrintOutStatus } from '../models/print.model';
import { MainService } from './main.service';
import { Check, CheckProduct, PaymentStatus } from '../models/check.model';
import { Table } from '../models/table.model';
import { EndDayDocument } from '../models/database.types';

export interface PrinterDevice {
  name: string;
  type: number; // 0: USB, 1: Network, 2: Serial
  ip?: string;
  port?: string;
  address?: string;
}

interface PrintItem {
  name: string;
  note?: string;
  price: number;
  total_price?: number;
  count: number;
  status?: number;
}

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

  printTest(device: PrinterDevice): void {
    this.electron.send('printTest', device);
  }

  printOrder(device: PrinterDevice, table: string | Table, orders: Array<OrderItem | CheckProduct>, owner: string): void {
    const ordersArray: PrintItem[] = [];
    orders.forEach(element => {
      const contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          ordersArray[index].price += element.price;
          ordersArray[index].count++;
        }
      } else {
        const schema: PrintItem = { name: element.name, note: (element as any).note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, owner);
  }

  printTableOrder(device: PrinterDevice, table: string | Table, order: Order): void {
    const ordersArray: PrintItem[] = [];
    order.items.forEach(element => {
      const contains = ordersArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = ordersArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          ordersArray[index].price += element.price;
          ordersArray[index].count++;
        }
      } else {
        const schema: PrintItem = { name: element.name, note: element.note, price: element.price, count: 1 };
        ordersArray.push(schema);
      }
    });
    this.electron.send('printOrder', device, table, ordersArray, order.user.name);
  }

  printCheck(device: PrinterDevice, table: string | Table, check: Check): void {
    const productsArray: PrintItem[] = [];
    const payedArray: PrintItem[] = [];

    check.products.forEach((element: CheckProduct) => {
      const contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          if (productsArray[index].total_price !== undefined) {
            productsArray[index].total_price! += element.price;
          }
          productsArray[index].count++;
        }
      } else {
        const schema: PrintItem = {
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
        const payedProds = check.payment_flow.map((obj: PaymentStatus) => obj.payed_products);
        payedProds.forEach((element: any) => {
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
            if (payedArray[index].total_price !== undefined) {
              payedArray[index].total_price! += element.price;
            }
            payedArray[index].count++;
          }
        } else {
          const schema: PrintItem = {
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
    (newCheck as any).products = productsArray;
    (newCheck as any).payed_products = payedArray;
    this.electron.send('printCheck', device, newCheck, table, this.storeLogo, '');
  }

  printPayment(device: PrinterDevice, table: string | Table, payment: any): void {
    const productsArray: PrintItem[] = [];
    payment.payed_products.forEach((element: any) => {
      const contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note);
      if (contains) {
        const index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
        if (index !== -1) {
          if (productsArray[index].total_price !== undefined) {
            productsArray[index].total_price! += element.price;
          }
          productsArray[index].count++;
        }
      } else {
        const schema: PrintItem = {
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

  printEndDay(device: PrinterDevice, EndDayData: EndDayDocument): void {
    this.electron.send('printEndDay', device, EndDayData, this.quicklyLogo);
  }

  printReport(device: PrinterDevice, category: string, reports: any[]): void {
    this.electron.send('printReport', device, category, reports);
  }

  printCancel(device: PrinterDevice, product: any, reason: string, table: string | Table, owner: string): void {
    this.electron.send('printCancel', device, product, reason, table, owner);
  }

  printQRCode(device: PrinterDevice, data: string, table: string | Table, owner: string): void {
    this.electron.send('printQRcode', device, data, table, owner);
  }

  kickCashdraw(device: PrinterDevice): void {
    console.log('kickMustWork', device);
    this.electron.send('kickCashdraw', device);
  }

  getUSBPrinters(): any[] {
    console.warn('getUSBPrinters should be called via IPC from main process');
    return [];
  }

  getSerialPrinters(path: string): PrinterDevice | null {
    console.warn('getSerialPrinters should be called via IPC from main process');
    return null;
  }
}
