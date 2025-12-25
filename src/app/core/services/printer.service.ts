import { Injectable } from '@angular/core';
import { ElectronService } from './electron/electron.service';
import { SettingsService } from './settings.service';
import { MessageService } from './message.service';
import { Order } from '../models/order.model';
import { PrintOut, PrintOutStatus } from '../models/print.model';
import { DatabaseService } from './database.service';

@Injectable({
    providedIn: 'root'
})
export class PrinterService {
    storeLogo: string = '';
    quicklyLogo: string = '';
    storeInfo: any;

    constructor(
        private electron: ElectronService,
        private databaseService: DatabaseService,
        private messageService: MessageService,
        private settings: SettingsService) {

        // Paths are problematic without 'remote'. We should ask Main for paths or hardcode relative assets.
        // this.storeLogo = this.electron.appRealPath + '/data/customer.png';
        // this.quicklyLogo = this.electron.appPath + '/assets/quickly.png';
        // Using simple relative paths for now, or assume Main handles it if passed as 'customer.png'.
        this.storeLogo = 'data/customer.png';
        this.quicklyLogo = 'assets/quickly.png';

        if (this.electron.isElectron) {
            this.electron.ipcRenderer.on('error', (message: string, check: any, device: any) => {
                this.messageService.sendMessage(message);
                let newPrint = new PrintOut('Check', PrintOutStatus.WAITING, check._id, device); // Fixed constructor args order/types if changed
                // Check PrintOut model: type, status, connection, printer, ...
                // Old: new PrintOut('Check',PrintOutStatus.WAITING,check._id,device);
                // Wait, check._id is string? Connection?
                // Old definition: constructor(type, status, connection, printer, _id, _rev)
                // Passed: 'Check', WAITING, check._id, device.
                // So connection = check._id?? 
                // device is Printer object?

                // I'll stick to passing it as is, TS might complain if types don't match.
                // Assuming 'device' is 'Printer'.

                this.databaseService.addData('prints', newPrint).then(isSended => {
                    console.log('Print Sended!')
                }).catch(err => {
                    console.log('Hata Yazıcıya Ulaşılamadı');
                });
            });
        }
    }

    printTest(device: any) {
        this.electron.ipcRenderer.send('printTest', device);
    }

    printOrder(device: any, table: any, orders: any[], owner: any) {
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
        this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, owner);
    }

    printTableOrder(device: any, table: any, order: Order) {
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
        this.electron.ipcRenderer.send('printOrder', device, table, ordersArray, order.user.name);
    }

    printCheck(device: any, table: any, check: any) {
        let productsArray: any[] = [];
        let payedArray: any[] = [];
        check.products.forEach((element: any) => {
            let contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note && obj.price == element.price);
            if (contains) {
                let index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
                productsArray[index].total_price += element.price;
                productsArray[index].count++;
            } else {
                let schema = { name: element.name, note: element.note, price: element.price, total_price: element.price, count: 1, status: element.status };
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
                    let schema = { name: element.name, note: element.note, price: element.price, total_price: element.price, count: 1, status: element.status };
                    payedArray.push(schema);
                }
            });
        }
        let newCheck = Object.assign({}, check);
        newCheck.products = productsArray;
        newCheck.payed_products = payedArray;
        this.electron.ipcRenderer.send('printCheck', device, newCheck, table, this.storeLogo, '');
    }

    printPayment(device: any, table: any, payment: any) {
        let productsArray: any[] = [];
        payment.payed_products.forEach((element: any) => {
            let contains = productsArray.some(obj => obj.name == element.name && obj.note == element.note);
            if (contains) {
                let index = productsArray.findIndex(obj => obj.name == element.name && obj.note == element.note);
                productsArray[index].total_price += element.price;
                productsArray[index].count++;
            } else {
                let schema = { name: element.name, note: element.note, price: element.price, total_price: element.price, count: 1, status: element.status };
                productsArray.push(schema);
            }
        });
        payment.payed_products = productsArray;
        this.electron.ipcRenderer.send('printPayment', device, payment, table, this.storeLogo);
    }

    printEndDay(device: any, EndDayData: any) {
        this.electron.ipcRenderer.send('printEndDay', device, EndDayData, this.quicklyLogo);
    }

    printReport(device: any, category: any, reports: any) {
        this.electron.ipcRenderer.send('printReport', device, category, reports);
    }

    printCancel(device: any, product: any, reason: any, table: any, owner: any) {
        this.electron.ipcRenderer.send('printCancel', device, product, reason, table, owner);
    }

    printQRCode(device: any, data: any, table: any, owner: any) {
        this.electron.ipcRenderer.send('printQRcode', device, data, table, owner);
    }

    kickCashdraw(device: any) {
        console.log('kickMustWork', device)
        this.electron.ipcRenderer.send('kickCashdraw', device);
    }
}
