import { Component, OnInit, inject, ChangeDetectorRef, signal, computed } from '@angular/core';
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
import { ToastContainerComponent } from './shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MessageComponent, KeyboardComponent, CallerComponent, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private callerService = inject(CallerIDService);
  private scalerService = inject(ScalerService);
  private electronService = inject(ElectronService);
  private mainService = inject(MainService);
  private router = inject(Router);
  private applicationService = inject(ApplicationService);
  private settingsService = inject(SettingsService);
  private messageService = inject(MessageService);
  private authService = inject(AuthService);
  private conflictService = inject(ConflictService);
  private printerService = inject(PrinterService);

  readonly title = signal('Quickly');
  readonly description = signal('Quickly');
  readonly version = signal('1.9.5');
  readonly windowStatus = signal(false);
  readonly connectionStatus = signal(false);
  readonly setupFinished = signal(false);
  readonly onSync = signal(true);
  readonly hasError = signal(false);
  readonly statusMessage = signal('');
  readonly date = signal(Date.now());

  readonly printers = signal<any[]>([]);
  readonly categories = signal<Category[]>([]);

  readonly activationStatus = signal<boolean | undefined>(undefined);
  readonly serverSettings = signal<ServerInfo | undefined>(undefined);
  readonly dayStatus = signal<DayInfo | undefined>(undefined);

  ngOnInit(): void {
    this.settingsService.setLocalStorage();
    this.initAppSettings();
    this.initConnectivityAndTime();
    this.settingsService.getPrinters().subscribe(res => this.printers.set(res.value));
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
                const primarySetting = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 0);
                if (primarySetting) {
                  this.serverSettings.set(primarySetting.value);
                } else {
                  throw new Error('Primary server settings not found');
                }
                break;
              case 'Secondary':
                const secondarySetting = settings.find(obj => obj.key == 'ServerSettings' && obj.value.type == 1);
                if (secondarySetting) {
                  this.serverSettings.set(secondarySetting.value);
                } else {
                  throw new Error('Secondary server settings not found');
                }
                break;
              default:
                break;
            }
          } catch (error) {
            console.error('Server settings error:', error);
            this.messageService.sendAlert('Bağlantı Hatası', 'Sunucu Bağlantı Anahtarı Bulunamadı!', 'error');
            this.findServerSettings();
          }
          try {
            const daySettings = settings.find(obj => obj.key == 'DateSettings');
            if (daySettings) {
              this.dayStatus.set(daySettings.value);
            } else {
              throw new Error('Date settings not found');
            }
          } catch (error) {
            console.error('Day status error:', error);
            this.messageService.sendAlert('Gün Dökümanı Hatası', 'Tarih Eşleştirmesi Başarısız', 'error');
            this.findAppSettings();
          }
          try {
            const activationSettings = settings.find(obj => obj.key == 'ActivationStatus');
            if (activationSettings) {
              this.activationStatus.set(activationSettings.value);
            } else {
              throw new Error('Activation settings not found');
            }
          } catch (error) {
            console.error('Activation status error:', error);
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
      this.date.set(Date.now());
      this.connectionStatus.set(this.applicationService.connectionStatus());
    }, 5000);
  }

  initAppProcess(): void {
    const activation = this.activationStatus();
    const server = this.serverSettings();

    switch (activation) {
      case true:
        this.setupFinished.set(true);
        if (server !== undefined) {
          if (server.status == 1) {
            ////// Birincil Ekran ///////
            if (server.type == 0) {
              this.electronService.send('appServer', server.key, server.ip_port);
              this.mainService.syncToServer();
              this.conflictService.conflictListener();
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync.set(false);
                  this.updateActivityReport();
                  this.updateLastSeen();
                  this.router.navigate(['']);
                  this.dayCheck();
                }
              }).catch(err => {
                console.log(err);
                this.loadFromBackup();
              });
            } else if (server.type == 1) {
              ////// İkincil Ekran //////
              this.serverReplication();
            }
          } else {
            if (server.type == 0) {
              this.mainService.loadAppData().then((isLoaded: boolean) => {
                if (isLoaded) {
                  this.onSync.set(false);
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
        this.setupFinished.set(false);
        this.onSync.set(false);
        this.router.navigate(['/activation']);
        break;
      default:
        this.onSync.set(false);
        this.router.navigate(['/setup']);
        break;
    }
    if (server && server.type == 0) {
      setTimeout(() => this.orderListener(), 10000);
    }
  }

  serverReplication(): void {
    this.hasError.set(false);
    console.log('Server Replicating Started!');
    const server = this.serverSettings();
    if (!server) return;

    this.mainService
      .replicateDB(server)
      .on('change', (sync: any) => {
        this.statusMessage.set(`${sync.docs_written} - Senkronize Ediliyor `);
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
        this.hasError.set(true);
        this.electronService.openDevTools();
        this.serverReplication();
      });
  }

  orderListener(): void {
    console.log('Order Listener Process Started');
    this.mainService.getAllBy('settings', { key: 'Printers' }).then(prints => {
      if (!prints.docs || prints.docs.length === 0) {
        console.error('No printers found in settings');
        return;
      }
      const printersList = prints.docs[0].value;
      this.mainService.LocalDB['orders'].changes({ since: 'now', live: true, include_docs: true }).on('change', (res: any) => {
        if (!this.onSync()) {
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
                      const catPrinter = (category && category.printer) ? category.printer : (printersList.length > 0 ? printersList[0].name : null);

                      if (catPrinter) {
                        const contains = splitPrintArray.some(element => element.printer.name == catPrinter);
                        if (contains) {
                          const index = splitPrintArray.findIndex(p_name => p_name.printer.name == catPrinter);
                          if (index >= 0) {
                            splitPrintArray[index].products.push(obj);
                          }
                        } else {
                          const thePrinter = printersList.find((p: any) => p.name == catPrinter);
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
    const day = this.dayStatus();
    if (!day) return;

    if (new Date().getDay() !== day.day) {
      if (day.started) {
        this.messageService.sendAlert('Dikkat!', 'Gün Sonu Yapılmamış.', 'warning');
      } else {
        this.mainService.RemoteDB.find({ selector: { db_name: 'settings', key: 'DateSettings' }, limit: 5000 }).then((res: any) => {
          if (!res.docs || res.docs.length === 0) {
            console.error('No date settings found on remote server');
            return;
          }
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
        this.onSync.set(false);
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
      this.mainService.cancelRemoteSync();
      console.log('Endday Processing...');
      this.onSync.set(true);
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
      if (!this.onSync()) {
        setTimeout(() => {
          this.electronService.reloadProgram();
        }, 5000);
      }
    });
  }

  printsListener(): any {
    console.log('Printer Listener Process Started');
    return this.mainService.LocalDB['prints'].changes({ since: 'now', live: true, include_docs: true }).on('change', (change: any) => {
      if (!this.onSync()) {
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
    const AppType = localStorage.getItem('AppType');
    this.mainService.getAllBy('allData', { key: 'ServerSettings' }).then(res => {
      let serverDocument: any;
      switch (AppType) {
        case 'Primary':
          serverDocument = res.docs.find((obj: any) => obj.value.type == 0);
          if (serverDocument) {
            delete serverDocument._rev;
            this.mainService.putDoc('settings', serverDocument).then(() => {
              this.electronService.reloadProgram();
            }).catch(err => console.error('Failed to put server document:', err));
          } else {
            console.error('Primary server settings not found in allData');
          }
          break;
        case 'Secondary':
          serverDocument = res.docs.find((obj: any) => obj.value.type == 1);
          if (serverDocument) {
            delete serverDocument._rev;
            this.mainService.putDoc('settings', serverDocument).then(() => {
              this.electronService.reloadProgram();
            }).catch(err => console.error('Failed to put server document:', err));
          } else {
            console.error('Secondary server settings not found in allData');
          }
          break;
        default:
          break;
      }
    }).catch(err => console.error('Failed to get server settings from allData:', err));
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
          if (res.docs.length > 0) {
            checks_total_amount = res.docs.map((obj: any) => obj.total_price + obj.discount).reduce((a: number, b: number) => a + b, 0);
            activity_value = checks_total_amount / checks_total_count;
          } else {
            checks_total_amount = 0;
            activity_value = 0;
          }
          const activity_count = tables.docs.length > 0 ? (checks_total_count * 100) / tables.docs.length : 0;
          this.mainService.getAllBy('reports', { type: 'Activity' }).then(res => {
            if (!res.docs || res.docs.length === 0) {
              console.error('No activity report found');
              return;
            }
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
    const status = this.windowStatus();
    this.electronService.fullScreen(status);
    this.windowStatus.set(!status);
  }
}
