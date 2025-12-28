import { Component, signal, effect, inject, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cashbox } from '../../core/models/cashbox.model';
import { CheckType, ClosedCheck } from '../../core/models/check.model';
import { BackupData, EndDay } from '../../core/models/endoftheday.model';
import { Log } from '../../core/models/log.model';
import { Report } from '../../core/models/report.model';
import { ElectronService } from '../../core/services/electron/electron.service';
import { MessageService } from '../../core/services/message.service';
import { PrinterService } from '../../core/services/printer.service';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';
import { ConflictService } from '../../core/services/conflict.service';
import { HttpService } from '../../core/services/http.service';
import { DayDetailComponent } from './day-detail/day-detail.component';
import { PricePipe } from '../../shared/pipes/price.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, DayDetailComponent, PricePipe],
  selector: 'app-endoftheday',
  templateUrl: './endoftheday.component.html',
  styleUrls: ['./endoftheday.component.scss'],
})

export class EndofthedayComponent {
  readonly isStarted = signal<boolean>(false);
  readonly day = signal<number>(0);
  readonly dateToReport = signal<number>(0);
  readonly printers = signal<any>(undefined);
  readonly owner = signal<string>('');
  readonly endDayReport = signal<EndDay>(new EndDay(0, '', 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, { male: 0, female: 0 }, ''));
  readonly endDayData = signal<Array<EndDay>>([]);
  readonly backupData = signal<Array<BackupData>>([]);
  readonly checks = signal<Array<ClosedCheck>>([]);
  readonly reports = signal<Array<Report>>([]);
  readonly cashbox = signal<Array<Cashbox>>([]);
  readonly logs = signal<Array<Log>>([]);
  readonly selectedEndDay = signal<EndDay | undefined>(undefined);
  readonly lastDay = signal<any>(undefined);
  readonly progress = signal<string>('Veriler Senkorinize Ediliyor...');
  readonly permissions = signal<any>({});
  readonly appType = signal<any>(undefined);
  readonly serverSet = signal<any>(undefined);
  readonly token = signal<string>(localStorage.getItem("AccessToken") || '');
  readonly restaurantID = signal<string>('');

  private electronService = inject(ElectronService);
  private printerService = inject(PrinterService);
  private mainService = inject(MainService);
  private messageService = inject(MessageService);
  private settingsService = inject(SettingsService);
  private httpService = inject(HttpService);
  private conflictService = inject(ConflictService);
  private readonly zone = inject(NgZone);

  constructor() {
    this.owner.set(this.settingsService.getUser('id') || '');
    try {
      this.permissions.set(JSON.parse(localStorage.getItem('userPermissions') || '{}'));
    } catch (error) {
      console.error('Error parsing userPermissions:', error);
      this.permissions.set({});
    }

    effect(() => {
      this.settingsService.DateSettings.subscribe(res => {
        this.isStarted.set(res.value.started);
        this.day.set(res.value.day);
        this.dateToReport.set(res.value.time);
        this.endDayReport.set(new EndDay(res.value.time, this.owner(), 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, { male: 0, female: 0 }, ''));
      });
    }, { allowSignalWrites: true });

    effect(() => {
      this.settingsService.AppSettings.subscribe(res => this.lastDay.set(res.value.last_day));
    }, { allowSignalWrites: true });

    effect(() => {
      this.settingsService.RestaurantInfo.subscribe(res => this.restaurantID.set(res.value.id));
    }, { allowSignalWrites: true });

    effect(() => {
      this.settingsService.ServerSettings.subscribe(res => {
        this.serverSet.set(res);
        this.appType.set(res.value);
      });
    }, { allowSignalWrites: true });

    effect(() => {
      this.settingsService.getPrinters().subscribe(res => this.printers.set(res.value));
    }, { allowSignalWrites: true });

    this.fillData();
  }

  getDetail(data: EndDay) {
    if (this.permissions().end) {
      this.selectedEndDay.set(data);
    } else {
      this.messageService.sendMessage('Görüntüleme Yetkiniz Yok')
    }
  }

  startDay() {
    if (this.isStarted()) {
      this.messageService.sendMessage('Gün Sonu Yapmalısınız!');
      return false;
    } else {
      clearInterval(this.conflictService.conflictListener());
      const dateData = { started: true, day: new Date().getDay(), time: Date.now() };

      this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: { docs: any[] }) => {
        res.docs.forEach((element: any) => {
          this.mainService.changeData('reports', element._id, (doc: any) => {
            doc.activity = [0];
            doc.activity_count = [0];
            doc.activity_time = ['GB'];
            return doc;
          });
        });
      });

      this.messageService.sendMessage('Gün Başlatıldı. Program Yeniden Başlatılıyor..');

      if (this.day() == 1) {
        this.mainService.getAllBy('reports', {}).then(res => {
          const reports = res.docs.filter((obj: any) => obj.type !== 'Activity') as any;
          reports.forEach((element: any) => {
            this.mainService.changeData('reports', element._id, (doc: any) => {
              doc.weekly = [0, 0, 0, 0, 0, 0, 0];
              doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
              return doc;
            });
          });
        });
      }

      this.settingsService.setAppSettings('DateSettings', dateData).then((res) => {
        if (res.ok) {
          this.isStarted.set(true);
          this.messageService.sendAlert('Gün Başlatıldı!', 'Program 5 sn içinde yeniden başlatılacak.', 'success');
          setTimeout(() => {
            this.electronService.reloadProgram();
          }, 5000)
        }
      })

    }
  }

  endDay() {
    if (this.isStarted()) {
      this.mainService.getAllBy('checks', {}).then((res) => {
        if (res.docs.length == 0) {
          this.zone.run(() => {
            (window as any).$('#endDayModal').modal({ backdrop: 'static', keyboard: false });
          });
          clearInterval(this.conflictService.conflictListener());
          setTimeout(() => {
            this.stepChecks();
          }, 2000)
        } else {
          this.messageService.sendAlert('Dikkat!', 'Ödenmesi alınmamış hesaplar var!', 'warning');
        }
      });
    } else {
      this.messageService.sendMessage('Gün Başı Yapmalısınız!');
      return false;
    }
  }


  StoreSalesReport = (checks: Array<ClosedCheck>) => {
    const SalesReport = { cash: 0, card: 0, coupon: 0, free: 0, canceled: 0, discount: 0, checks: checks.length, customers: { male: 0, female: 0 } };

    const cashChecks = checks.filter(obj => obj.payment_method == 'Nakit');
    SalesReport.cash = cashChecks.length > 0 ? cashChecks.map(obj => obj.total_price).reduce((a, b) => a + b, 0) : 0;

    const cardChecks = checks.filter(obj => obj.payment_method == 'Kart');
    SalesReport.card = cardChecks.length > 0 ? cardChecks.map(obj => obj.total_price).reduce((a, b) => a + b, 0) : 0;

    const couponChecks = checks.filter(obj => obj.payment_method == 'Kupon');
    SalesReport.coupon = couponChecks.length > 0 ? couponChecks.map(obj => obj.total_price).reduce((a, b) => a + b, 0) : 0;

    const freeChecks = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.payment_method == 'İkram');
    SalesReport.free = freeChecks.length > 0 ? freeChecks.map(obj => obj.total_price).reduce((a, b) => a + b, 0) : 0;

    const canceledChecks = checks.filter(obj => obj.type == CheckType.CANCELED);
    SalesReport.canceled = canceledChecks.length > 0 ? canceledChecks.map(obj => obj.total_price).reduce((a, b) => a + b, 0) : 0;

    const discountChecks = checks.filter(obj => obj.type !== CheckType.CANCELED);
    SalesReport.discount = discountChecks.length > 0 ? discountChecks.map(obj => obj.discount).reduce((a, b) => a + b, 0) : 0;

    const maleChecks = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.hasOwnProperty('occupation') && obj.occupation);
    SalesReport.customers.male = maleChecks.length > 0 ? maleChecks.map(obj => obj.occupation!.male).reduce((a, b) => a + b, 0) : 0;

    const femaleChecks = checks.filter(obj => obj.type !== CheckType.CANCELED && obj.hasOwnProperty('occupation') && obj.occupation);
    SalesReport.customers.female = femaleChecks.length > 0 ? femaleChecks.map(obj => obj.occupation!.female).reduce((a, b) => a + b, 0) : 0;
    const partial = checks.filter(obj => obj.payment_method == 'Parçalı');
    partial.forEach(element => {
      SalesReport.discount += element.discount;
      if (element.payment_flow) {
        element.payment_flow.forEach(payment => {
          if (payment.method == 'Nakit') {
            SalesReport.cash += payment.amount;
          }
          if (payment.method == 'Kart') {
            SalesReport.card += payment.amount;
          }
          if (payment.method == 'Kupon') {
            SalesReport.coupon += payment.amount;
          }
          if (payment.method == 'İkram') {
            SalesReport.free += payment.amount;
          }
        })
      }
    });
    return SalesReport;
  }

  stepChecks() {
    this.mainService.getAllBy('closed_checks', {}).then(res => {

      this.progress.set('Kapatılan Hesaplar Yedekleniyor...');
      this.checks.set(res.docs as any);
      const checksBackup = new BackupData('closed_checks', this.checks());
      const newBackupData = [...this.backupData()];
      newBackupData.push(checksBackup);
      this.backupData.set(newBackupData);

      const Sales = this.StoreSalesReport(this.checks());

      const updatedReport = this.endDayReport();
      updatedReport.card_total = Sales.card;
      updatedReport.cash_total = Sales.cash;
      updatedReport.coupon_total = Sales.coupon;
      updatedReport.free_total = Sales.free;
      updatedReport.discount_total = Sales.discount;
      updatedReport.canceled_total = Sales.canceled;
      updatedReport.total_income = Sales.cash + Sales.card + Sales.coupon;
      updatedReport.check_count = this.checks().length;
      updatedReport.customers.male = Sales.customers.male;
      updatedReport.customers.female = Sales.customers.female;
      this.endDayReport.set(updatedReport);

      this.mainService.removeAll('closed_checks', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'closed_checks' }).then(() => {
          this.progress.set('Kapatılan Hesaplar Temizlendi...');
          this.stepCashbox();
        });
      });
    });
  }

  stepCashbox() {
    let incomes = 0;
    let outcomes = 0;
    this.mainService.getAllBy('cashbox', {}).then(res => {
      this.progress.set('Kasa Verileri Yedekleniyor...');
      this.cashbox.set(res.docs as any);
      const cashboxBackup = new BackupData('cashbox', this.cashbox());
      const newBackupData = [...this.backupData()];
      newBackupData.push(cashboxBackup);
      this.backupData.set(newBackupData);

      const incomeItems = this.cashbox().filter(obj => obj.type == 'Gelir');
      if (incomeItems.length > 0) {
        incomes = incomeItems.map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b, 0);
      } else {
        console.log('Kasa Geliri Yok..');
      }

      const outcomeItems = this.cashbox().filter(obj => obj.type == 'Gider');
      if (outcomeItems.length > 0) {
        outcomes = outcomeItems.map(obj => obj.card + obj.cash + obj.coupon).reduce((a, b) => a + b, 0);
      } else {
        console.log('Kasa Gideri Yok..');
      }

      const updatedReport = this.endDayReport();
      updatedReport.incomes = incomes;
      updatedReport.outcomes = outcomes;
      this.endDayReport.set(updatedReport);

      this.mainService.removeAll('cashbox', {}).then(res => {
        this.mainService.removeAll('allData', { db_name: 'cashbox' }).then(() => {
          this.progress.set('Kasa Verileri Temizlendi...');
          this.stepReports();
        });
      });
    });
  }

  stepReports() {
    this.mainService.getAllBy('reports', {}).then(res => {
      this.progress.set('Raporlar Yedekleniyor...');
      this.reports.set((res.docs.filter((obj: any) => obj.type !== 'Activity')) as any);
      const reportsBackup = new BackupData('reports', res.docs);
      const newBackupData = [...this.backupData()];
      newBackupData.push(reportsBackup);
      this.backupData.set(newBackupData);
      const activities = res.docs.filter((obj: any) => obj.type == 'Activity');

      this.mainService.localSyncBeforeRemote('reports').on('complete', () => {
        this.progress.set('Raporlar Temizlendi...');
        this.stepLogs();
      });

      activities.forEach((element: any) => {
        this.mainService.changeData('reports', element._id, (doc: any) => {
          doc.activity = [];
          doc.activity_count = [];
          doc.activity_time = [];
          return doc;
        });
      });

      if (this.day() == this.lastDay()) {
        this.reports().forEach((element) => {
          this.mainService.changeData('reports', element._id!, (doc: any) => {
            doc.weekly = [0, 0, 0, 0, 0, 0, 0];
            doc.weekly_count = [0, 0, 0, 0, 0, 0, 0];
            return doc;
          });
        });
      }
    });
  }

  stepLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.progress.set('Kayıtlar Yedekleniyor...');
      this.logs.set(res.docs as any);
      const logsBackup = new BackupData('logs', this.logs());
      const newBackupData = [...this.backupData()];
      newBackupData.push(logsBackup);
      this.backupData.set(newBackupData);
      this.mainService.removeAll('prints', {}).then(() => {
        this.mainService.removeAll('logs', {}).then(() => {
          this.mainService.removeAll('allData', { db_name: 'logs' }).then(() => {
            this.progress.set('Kayıtlar Temizlendi...');
            this.stepOrders();
          });
        });
      });
    }).catch(err => {
      console.log('Logs Clearing Error:', err)
    })
  }

  stepOrders() {
    this.mainService.getAllBy('orders', {}).then(res => {
      this.progress.set('Siparişler Yedekleniyor...');
      this.logs.set(res.docs as any);
      const logsBackup = new BackupData('orders', this.logs());
      const newBackupData = [...this.backupData()];
      newBackupData.push(logsBackup);
      this.backupData.set(newBackupData);
      this.mainService.removeAll('orders', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'orders' }).then(() => {
          this.progress.set('Siparişler Temizlendi...');
          this.stepReceipts();
        });
      });
    }).catch(err => {
      console.log('Orders Clearing Error:', err)
    })
  }

  stepReceipts() {
    this.mainService.getAllBy('receipts', {}).then(res => {
      this.progress.set('Ödemeler Yedekleniyor...');
      this.logs.set(res.docs as any);
      const logsBackup = new BackupData('receipts', this.logs());
      const newBackupData = [...this.backupData()];
      newBackupData.push(logsBackup);
      this.backupData.set(newBackupData);
      this.mainService.removeAll('receipts', {}).then(() => {
        this.mainService.removeAll('allData', { db_name: 'receipts' }).then(() => {
          this.progress.set('Ödemeler Temizlendi...');
          this.stepFinal();
        });
      });
    }).catch(err => {
      console.log('Receipts Clearing Error:', err)
    })
  }

  stepFinal() {
    const finalDate = Date.now();
    const updatedReport = this.endDayReport();
    updatedReport.data_file = finalDate.toString();
    this.endDayReport.set(updatedReport);
    this.progress.set('Yerel Süreç Tamamlanıyor...');
    this.mainService.addData('endday', this.endDayReport() as any).then(() => {
      this.electronService.backupData(this.backupData(), String(finalDate));
      this.printerService.printEndDay(this.printers()[0], this.endDayReport());
      const dateData = { started: false, day: this.day(), time: Date.now() };
      this.settingsService.setAppSettings('DateSettings', dateData).then((res) => {
        if (res.ok) {
          this.fillData();
          this.isStarted.set(false);
          setTimeout(() => {
            this.mainService.syncToRemote().cancel();
            if (this.appType()?.type == 0) {
              if (this.appType()?.status == 1) {
                this.electronService.ipcRenderer.send('closeServer');
                this.mainService.syncToServer().cancel();
              }
            }
            this.progress.set('Veritabanı Yedekleniyor!');
            this.uploadBackup(this.backupData(), finalDate);
          }, 5000);
        }
      });
    }).catch(err => {
      console.log('Final Step Error: Document Post Error', err);
    })
  }


  uploadBackup(data: Array<BackupData>, timestamp: number) {
    this.httpService.post('/store/backup', { data: data, timestamp: timestamp }, this.token()).subscribe(res => {
      if (res.ok) {
        this.coverData();
      }
    }, err => {
      console.log(err);
      this.messageService.sendAlert('Hata!', 'Veritabanı Yedeği İletilemedi', 'error');
      this.coverData();
    });
  }

  coverData() {
    this.mainService.getAllBy('allData', {}).then(res => {
      return res.docs.map((obj: any) => {
        delete obj._rev;
        return obj;
      })
    }).then((cleanDocs: Array<any>) => {
      this.electronService.writeFile(this.electronService.appRealPath + '/data/db.dat', JSON.stringify(cleanDocs)).then(() => {
        this.progress.set('Veritabanı Yedeği Alındı!');
        this.refreshToken();
      });
    }).catch(err => {
      console.log(err);
    })
  }

  refreshToken() {
    this.httpService.post('/store/refresh', null, this.token()).subscribe(res => {
      if (res.ok) {
        let data = res; // Angular 21 returns parsed JSON by default
        if (typeof (res).json === 'function') {
          data = (res).json();
        }
        const token = (data).token;
        localStorage.setItem('AccessToken', token);
        this.token.set(token);
        this.purgeData(token);
      }
    }, err => {
      console.log(err);
      this.zone.run(() => {
        (window as any).$('#endDayModal').modal('hide');
      });
      this.messageService.sendAlert('Hata!', 'Sunucudan İzin Alınamadı', 'error');
      setTimeout(() => {
        this.electronService.relaunchProgram();
      }, 5000);
    });
  }

  purgeData(token: any) {
    this.mainService.getAllBy('allData', {}).then(res => {
      this.httpService.post(`/store/endday`, { docs: res.docs }, token).subscribe(res => {
        if (res.ok) {
          this.progress.set('Uzak Sunucu İsteği Onaylandı!');
          const databasesArray = Object.keys(this.mainService.LocalDB).filter(obj => obj !== 'settings')
          this.mainService.destroyDB(databasesArray).then(res => {
            if (res.ok) {
              setTimeout(() => {
                this.mainService.initDatabases();
                setTimeout(() => {
                  this.mainService.replicateFrom()
                    .on('active', () => {
                      this.progress.set('Veriler Sıfırlanıyor...');
                    })
                    .on('complete', (info: any) => {
                      this.progress.set('Gün Sonu Tamamlanıyor..');
                      this.zone.run(() => {
                        (window as any).$('#endDayModal').modal('hide');
                      });
                      this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program Yeniden Başlatılacak', 'success');
                      setTimeout(() => {
                        this.electronService.relaunchProgram();
                      }, 5000);
                    });
                  // this.mainService.syncToLocal().then(res => {
                  //   if (res) {
                  //     delete this.serverSet()._rev;
                  //     this.mainService.putDoc('settings', this.serverSet()).then(res => {
                  //       if (res.ok) {
                  //         $('#endDayModal').modal('hide');
                  //         this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
                  //         setTimeout(() => {
                  //           this.electronService.relaunchProgram();
                  //         }, 5000);
                  //       }
                  //     })
                  //   }
                  // })
                }, 3000)
              }, 2000)
            }
          });
        }
      }, err => {
        console.log(err);
        this.zone.run(() => {
          (window as any).$('#endDayModal').modal('hide');
        });
        this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program Yeniden Başlatılacak', 'success');
        setTimeout(() => {
          this.electronService.relaunchProgram();
        }, 5000);
        // const serverSelectedRevs = res.json();
        // this.electronService.fileSystem.readFile(this.electronService.appRealPath + '/data/db.dat', 'utf-8', (err, data) => {
        //   if (!err) {
        //     let appData = JSON.parse(data);
        //     appData.map(obj => {
        //       obj._rev = serverSelectedRevs.find(serverRes => serverRes[1] == obj._id)[2];
        //     });
        //     this.mainService.putAll('allData', appData).then(res => {
        //       this.progress.set('Gün Sonu Tamamlanıyor..');
        //       this.loadAppData().then(res => {
        //         if (res) {
        //           $('#endDayModal').modal('hide');
        //           this.messageService.sendAlert('Gün Sonu Tamamlandı!', 'Program 5sn içinde kapatılacak.', 'success');
        //           setTimeout(() => {
        //             this.electronService.relaunchProgram();
        //           }, 5000);
        //         }
        //       })
        //     });
        //   }
        // });
      });
    })
  }

  fillData() {
    this.mainService.getAllBy('endday', {}).then((result) => {
      const sortedData = (result.docs as any).sort((a: any, b: any) => b.timestamp - a.timestamp).filter((obj: any) => obj.total_income !== 0);
      this.endDayData.set(sortedData);
    });
  }
}