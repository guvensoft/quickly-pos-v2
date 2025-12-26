import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
/* eslint-disable @typescript-eslint/no-require-imports, @angular-eslint/no-empty-lifecycle-method, no-dupe-else-if, @angular-eslint/no-input-rename, no-case-declarations, @typescript-eslint/no-unused-expressions */
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink } from '@angular/router';
import { ElectronService } from './core/services/electron/electron.service';
import { MessageService } from './core/services/message.service';
import { ApplicationService } from './core/services/application.service';
import { AuthService } from './core/services/auth.service';
import { MainService } from './core/services/main.service';
import { SettingsService } from './core/services/settings.service';
import { ConflictService } from './core/services/conflict.service';
import { CallerIDService } from './core/services/caller-id.service';
import { ScalerService } from './core/services/scaler.service';
import { PrinterService } from './core/services/printer.service';
import { Settings, ServerInfo, DayInfo } from './core/models/settings.model';
import { Order, OrderStatus, OrderType } from './core/models/order.model';
import { Category } from './core/models/product.model';
import { Check, CheckProduct } from './core/models/check.model';
import { Table } from './core/models/table.model';
import { PrintOut, PrintOutStatus } from './core/models/print.model';
import { MessageComponent } from './components/helpers/message/message.component';
import { KeyboardComponent } from './components/helpers/keyboard/keyboard.component';
import { CallerComponent } from './components/helpers/caller/caller.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MessageComponent, KeyboardComponent, CallerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private callerService: CallerIDService = inject(CallerIDService);
  private scalerService: ScalerService = inject(ScalerService);
  private electronService: ElectronService = inject(ElectronService);
  private mainService: MainService = inject(MainService);
  private router = inject(Router);
  private applicationService: ApplicationService = inject(ApplicationService);
  private settingsService: SettingsService = inject(SettingsService);
  private messageService: MessageService = inject(MessageService);
  private authService: AuthService = inject(AuthService);
  private conflictService: ConflictService = inject(ConflictService);
  private printerService: PrinterService = inject(PrinterService);
  private cdr = inject(ChangeDetectorRef);

  title = 'Quickly';
  description = 'Quickly';
  version = '1.9.5';
  windowStatus: boolean = false;
  connectionStatus: boolean = false;
  setupFinished: boolean = false;
  onSync: boolean = true;
  hasError: boolean = false;
  statusMessage: string = '';
  date: number = Date.now();

  printers: Array<any> = [];
  categories: Array<Category> = [];

  activationStatus!: boolean;
  serverSettings!: ServerInfo;
  dayStatus!: DayInfo;

  ngOnInit(): void {
    // Ensure jQuery is available globally early
    if (typeof (window as any).$ === 'undefined') {
      try {
        const $ = require('jquery');
        (window as any).$ = (window as any).jQuery = $;
      } catch (e) {
        console.warn('jQuery early load failed in AppComponent', e);
      }
    }
    this.settingsService.setLocalStorage();
    this.initAppSettings();
    this.initConnectivityAndTime();
    this.settingsService.getPrinters().subscribe(res => (this.printers = res.value));
  }

  callMe(): void { }

  initAppSettings(): void {
    this.mainService
      .getAllBy('settings', {})
      .then(res => {
        if (res.docs.length > 0) {
          const settings: Array<Settings> = res.docs;
          try {
            const appType = localStorage.getItem('AppType');
            switch (appType) {
              case 'Primary':
                this.serverSettings = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 0)!.value;
                break;
              case 'Secondary':
                this.serverSettings = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 1)!.value;
                break;
              default:
                break;
            }
          } catch (error) {
            this.messageService.sendAlert('Bağlantı Hatası', 'Sunucu Bağlantı Anahtarı Bulunamadı!', 'error');
            this.findServerSettings();
          }
          try {
            this.dayStatus = settings.find(obj => obj.key == 'DateSettings')!.value;
          } catch (error) {
            this.messageService.sendAlert('Gün Dökümanı Hatası', 'Tarih Eşleştirmesi Başarısız', 'error');
            this.findAppSettings();
          }
          try {
            this.activationStatus = settings.find(obj => obj.key == 'ActivationStatus')!.value;
          } catch (error) {
            this.messageService.sendAlert('Aktivasyon Hatası', 'Aktivasyon Anahtarı Bulunamadı!', 'error');
            this.findAppSettings();
          }
        }
      })
      .catch(err => {
        console.log(err);
      })
      .finally(() => {
        this.initAppProcess();
      });
  }

  initConnectivityAndTime(): void {
    setInterval(() => {
      this.date = Date.now();
      this.connectionStatus = this.applicationService.connectionStatus();
    }, 5000);
  }

  initAppProcess(): void {
    switch (this.activationStatus) {
      case true:
        this.setupFinished = true;
        if (this.serverSettings !== undefined) {
          if (this.serverSettings.status == 1) {
            ////// Birincil Ekran ///////
            if (this.serverSettings.type == 0) {
              this.electronService.send('appServer', this.serverSettings.key, this.serverSettings.ip_port);
              this.mainService.syncToServer();
              this.conflictService.conflictListener();
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync = false;
                  this.cdr.detectChanges();
                  this.updateActivityReport();
                  this.updateLastSeen();
                  this.router.navigate(['']);
                  this.dayCheck();
                }
              }).catch(err => {
                console.log(err);
                this.loadFromBackup();
              });
            } else if (this.serverSettings.type == 1) {
              ////// İkincil Ekran //////
              this.serverReplication();
            }
          } else {
            if (this.serverSettings.type == 0) {
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync = false;
                  this.cdr.detectChanges();
                  this.router.navigate(['']);
                  this.dayCheck();
                }
              }).catch(err => {
                console.log(err);
              });
              this.updateActivityReport();
              this.updateLastSeen();
            }
          }
          this.mainService.syncToRemote();
        } else {
          this.findServerSettings();
        }
        break;
      case false:
        this.setupFinished = false;
        this.onSync = false;
        this.router.navigate(['/activation']);
        break;
      default:
        this.onSync = false;
        this.router.navigate(['/setup']);
        break;
    }
    if (this.serverSettings && this.serverSettings.type == 0) {
      setTimeout(() => this.orderListener(), 10000);
      // this.printsListener();
    }
    // this.commandListener();
  }

  serverReplication(): void {
    this.hasError = false;
    console.log('Server Replicating Started!');
    this.mainService
      .replicateDB(this.serverSettings)
      .on('change', (sync: any) => {
        this.statusMessage = `${sync.docs_written} - Senkronize Ediliyor `;
      })
      .on('complete', () => {
        setTimeout(() => this.appDataInitializer(), 2000);
      })
      .on('active', () => {
        console.log('active');
      })
      .on('denied', (ass: any) => {
        console.log(ass, 'denied');
      })
      .on('error', (err: any) => {
        console.log(err);
      })
      .catch((err: any) => {
        console.warn('Server Replicating Error:', err);
        this.hasError = true;
        this.electronService.openDevTools();
        this.serverReplication();
      });
  }

  orderListener(): void {
    console.log('Order Listener Process Started');
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(prints => {
      const printers = prints.docs[0].value;
      this.mainService.LocalDB['orders'].changes({ since: 'now', live: true, include_docs: true }).on('change', (res: any) => {
        if (!this.onSync) {
          const Order: Order = res.doc;
          console.log(Order);
          if (Order.status == OrderStatus.APPROVED && Order.type !== OrderType.EMPLOOYEE) {
            this.mainService.getAllBy('categories', {}).then(cats => {
              const categories = cats.docs;
              this.mainService.getData('checks', Order.check).then((check: Check) => {
                this.mainService.getData('tables', check.table_id).then((table: Table) => {
                  const orders: Array<CheckProduct> = check.products.filter(product => Order.timestamp == product.timestamp);
                  if (orders.length > 0) {
                    const splitPrintArray: any[] = [];
                    orders.forEach((obj: any) => {
                      const category = categories.find((cat: any) => cat._id == obj.cat_id);
                      const catPrinter = (category && category.printer) ? category.printer : (printers.length > 0 ? printers[0].name : null);

                      if (catPrinter) {
                        const contains = splitPrintArray.some(element => element.printer.name == catPrinter);
                        if (contains) {
                          const index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
                          splitPrintArray[index].products.push(obj);
                        } else {
                          const thePrinter = printers.filter((p: any) => p.name == catPrinter)[0];
                          if (thePrinter) {
                            const splitPrintOrder = { printer: thePrinter, products: [obj] };
                            splitPrintArray.push(splitPrintOrder);
                          }
                        }
                      }
                    });
                    splitPrintArray.forEach(order => {
                      this.printerService.printOrder(
                        order.printer,
                        table.name,
                        order.products,
                        Order.user.name + (Order.type == OrderType.INSIDE ? ' (Müşteri)' : '(El Terminali)')
                      );
                    });
                  }
                });
              });
            });
          }
        }
      });
    });
  }

  dayCheck(): void {
    if (new Date().getDay() !== this.dayStatus.day) {
      if (this.dayStatus.started) {
        this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
      } else {
        this.mainService.RemoteDB.find({ selector: { db_name: 'settings', key: 'DateSettings' }, limit: 5000 }).then((res: any) => {
          const serverDate: DayInfo = res.docs[0].value;
          if (serverDate.started) {
            this.mainService.getData('settings', res.docs[0]._id).then((settingsDoc: any) => {
              this.mainService.LocalDB['settings'].get(settingsDoc._id).then((localDoc: any) => {
                localDoc.value = serverDate;
                this.mainService.LocalDB['settings'].put(localDoc).then(() => {
                  this.electronService.reloadProgram();
                }).catch(err => console.log(err));
              }).catch(err => console.log(err));
            }).catch(err => console.log(err));
          } else {
            this.messageService.sendAlert('Dikkat!', 'Gün Başı Yapmalısınız.', 'warning');
          }
        }).catch(() => this.dayCheck());
      }
    }
  }

  loadFromBackup(): void {
    console.warn('loadFromBackup needs to be implemented via IPC');
  }

  commandListener(): void {
    console.log('Command Listener Process Started');
    this.mainService.LocalDB['commands'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change: any) => {
      if (!change.deleted) {
        const commandObj = change.doc;
        if (!commandObj.executed) {
          this.electronService.shellSpawn(commandObj.cmd, commandObj.args);
        }
      }
    });
  }

  appDataInitializer(): void {
    this.mainService.loadAppData().then((isLoaded: boolean) => {
      if (isLoaded) {
        this.onSync = false;
        this.cdr.detectChanges();
        this.router.navigate(['']);
        this.settingsListener();
        this.dayCheck();
        setTimeout(() => this.endDayListener(), 120000);
      }
    }).catch(err => {
      console.warn('LoadApp Data Error:', err);
    });
  }

  endDayListener(): void {
    console.log('Endday Listener Process Started');
    const signalListener = this.mainService.LocalDB['endday'].changes({ since: 'now', live: true }).on('change', () => {
      this.mainService.syncToRemote().cancel();
      console.log('Endday Processing...');
      this.onSync = true;
      signalListener.cancel();
      this.mainService.destroyDB('allData').then((res: any) => {
        if (res.ok) {
          this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program kapatılacak.', 'success');
          setTimeout(() => {
            this.electronService.relaunchProgram();
            console.log('Endday Finished');
          }, 5000);
        }
      });
    });
  }

  settingsListener(): any {
    console.log('Settings Listener Process Started');
    return this.mainService.LocalDB['settings'].changes({ since: 'now', live: true }).on('change', () => {
      if (!this.onSync) {
        setTimeout(() => {
          this.electronService.reloadProgram();
        }, 5000);
      }
    });
  }

  printsListener(): any {
    console.log('Printer Listener Process Started');
    return this.mainService.LocalDB['prints'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change: any) => {
      if (!this.onSync) {
        if (!change.deleted) {
          const printObj = change.doc as PrintOut | undefined;
          if (!printObj?._id) return;
          const printId = printObj._id;
          console.log(printObj);
          if (printObj.type == 'Check' && printObj.status == PrintOutStatus.WAITING) {
            this.mainService.getData('checks', printObj.connection).then((check: Check) => {
              this.mainService.getData('tables', check.table_id).then((table: any) => {
                this.mainService.updateData('prints', printId, { status: PrintOutStatus.PRINTED }).then(() => {
                  this.printerService.printCheck(printObj.printer, table.name, check);
                }).catch(err => console.log(err));
              }).catch(() => {
                this.mainService.updateData('prints', printId, { status: PrintOutStatus.ERROR });
              });
            }).catch(() => {
              this.mainService.updateData('prints', printId, { status: PrintOutStatus.ERROR });
            });
          }
        }
      }
    });
  }

  findAppSettings(): void {
    this.mainService.syncToLocal('settings').then(() => {
      this.messageService.sendMessage('Ayarlar Güncelleniyor...');
      this.electronService.reloadProgram();
    }).catch(() => {
      this.messageService.sendAlert('Hata!', 'Gün Dökümanı Bulunamadı!', 'error');
    });
  }

  findServerSettings(): void {
    let serverDocument: any;
    const AppType = localStorage.getItem('AppType');
    this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
      switch (AppType) {
        case 'Primary':
          serverDocument = res.docs.find((obj: any) => obj.value.type == 0);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(() => {
            this.electronService.reloadProgram();
          });
          break;
        case 'Secondary':
          serverDocument = res.docs.find((obj: any) => obj.value.type == 1);
          delete serverDocument._rev;
          this.mainService.putDoc('settings', serverDocument).then(() => {
            this.electronService.reloadProgram();
          });
          break;
        default:
          break;
      }
    });
  }

  updateLastSeen(): void {
    // setInterval(() => {
    //   this.mainService.changeData('settings', 'lastseen', (obj) => {
    //     obj.value.last_seen = new Date().toLocaleString('tr-TR');
    //     obj.timestamp = Date.now();
    //     return obj;
    //   })
    // }, 60000)
  }

  updateActivityReport(): void {
    setInterval(() => {
      this.mainService.getAllBy('tables', {}).then(tables => {
        this.mainService.getAllBy('checks', {}).then(res => {
          const checks_total_count = res.docs.length;
          let checks_total_amount: number;
          let activity_value: number;
          try {
            checks_total_amount = res.docs.map((obj: any) => obj.total_price + obj.discount).reduce((a: number, b: number) => a + b);
            activity_value = checks_total_amount / checks_total_count;
          } catch (error) {
            checks_total_amount = 0;
            activity_value = 0;
          }
          const activity_count = (checks_total_count * 100) / tables.docs.length;
          this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
            const sellingAct = res.docs[0];
            if (sellingAct && sellingAct._id) {
              const date = new Date();
              if (!sellingAct.activity) sellingAct.activity = [];
              if (!sellingAct.activity_count) sellingAct.activity_count = [];
              if (!sellingAct.activity_time) sellingAct.activity_time = [];

              sellingAct.activity.push(Math.round(activity_value));
              sellingAct.activity_count.push(Math.round(activity_count));
              sellingAct.activity_time.push(date.getHours() + ':' + (date.getMinutes() < 10 ? '0' : '') + date.getMinutes());
              this.mainService.updateData('reports', sellingAct._id, sellingAct);
            }
          });
        });
      });
    }, 360000);
  }

  resetTimer(): void {
    this.applicationService.screenLock('reset');
  }

  exitProgram(): void {
    this.messageService.sendConfirm('Program Kapatılacak!').then(isOK => {
      if (isOK) {
        this.authService.logout();
        this.electronService.exitProgram();
      }
    });
  }

  changeWindow(): void {
    this.electronService.fullScreen(this.windowStatus);
    this.windowStatus = !this.windowStatus;
  }
}
