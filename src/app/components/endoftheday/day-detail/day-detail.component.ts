import { Component, input, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Cashbox } from '../../../core/models/cashbox.model';
import { ClosedCheck } from '../../../core/models/check.model';
import { BackupData, EndDay } from '../../../core/models/endoftheday.model';
import { Report } from '../../../core/models/report.model';
import { ElectronService } from '../../../core/services/electron/electron.service';
import { Log, logType } from '../../../core/models/log.model';
import { PrinterService } from '../../../core/services/printer.service';
import { SettingsService } from '../../../core/services/settings.service';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
import { BaseChartDirective } from 'ng2-charts';

@Component({
  standalone: true,
  imports: [CommonModule, PricePipe, BaseChartDirective, GeneralPipe],
  selector: 'app-day-detail',
  templateUrl: './day-detail.component.html',
  styleUrls: ['./day-detail.component.scss']
})
export class DayDetailComponent {
  private readonly electronService = inject(ElectronService);
  private readonly printerService = inject(PrinterService);
  private readonly settingsService = inject(SettingsService);

  // Input signals (already modern)
  detailData = input.required<EndDay>({ alias: 'data' });
  printers = input<any>();

  // Backup data signals (5)
  readonly oldBackupData = signal<Array<BackupData>>([]);
  readonly oldChecks = signal<any>(undefined);
  readonly oldCashbox = signal<any>(undefined);
  readonly oldReports = signal<any>(undefined);
  readonly oldLogs = signal<any>(undefined);

  // Selection signals (2)
  readonly selectedCat = signal<string>("");
  readonly currentSection = signal<string | undefined>(undefined);

  // Table data signals (7)
  readonly checksTable = signal<Array<ClosedCheck>>([]);
  readonly cashboxTable = signal<Array<Cashbox>>([]);
  readonly reportsTable = signal<Array<Report>>([]);
  readonly productsTable = signal<Array<Report>>([]);
  readonly usersTable = signal<Array<Report>>([]);
  readonly tablesTable = signal<Array<Report>>([]);
  readonly logsTable = signal<Array<Log>>([]);

  // Detail record signals (2)
  readonly checkDetail = signal<ClosedCheck | undefined>(undefined);
  readonly cashDetail = signal<Cashbox | undefined>(undefined);

  // Activity signals (3)
  readonly activityData = signal<any>(undefined);
  readonly activityLabels = signal<any>(undefined);
  readonly activityOptions = signal<any>({
    responsive: false,
    elements: {
      line: {
        tension: 0.5,
      }
    },
    plugins: {
      legend: { labels: { fontColor: 'rgb(255, 255, 255)' } }
    },
    scales: {
      x: {
        ticks: {
          beginAtZero: true,
          color: 'rgba(255,255,255)'
        },
        grid: {
          color: 'rgba(255,255,255)',
          lineWidth: 0.4
        }
      },
      y: {
        ticks: {
          color: 'rgba(255,255,255)'
        },
        grid: {
          color: 'rgba(255,255,255)',
          lineWidth: 0.4
        }
      }
    },
  });

  // Sync status signal (1)
  readonly syncStatus = signal<boolean>(false);

  // Pie chart signals (4)
  readonly pieData = signal<Array<any>>([]);
  readonly pieLabels = signal<Array<any>>([]);
  readonly pieOptions = signal<any>({ responsive: false, legend: { labels: { fontColor: 'rgb(255, 255, 255)' } } });
  readonly pieColors = signal<Array<any>>([]);

  // Detail metadata signals (2)
  readonly detailTitle = signal<string>('Genel Detaylar & Grafik');
  readonly detailDay = signal<number>(0);

  // Selected item signals (2)
  readonly selectedCHECK = signal<ClosedCheck | undefined>(undefined);
  readonly selectedCASH = signal<Cashbox | undefined>(undefined);

  // Generic selected signal (1)
  readonly selected = signal<any>(undefined);

  constructor() {
    this.detailTitle.set('Genel Detaylar & Grafik');
    this.pieColors.set([]);
    this.pieData.set([]);
    this.pieLabels.set([]);
    this.cashboxTable.set([]);
    this.checksTable.set([]);

    // Load data after inputs are initialized
    effect(() => {
      // Access detailData to trigger effect when it changes
      if (this.detailData()) {
        this.fillData();
      }
    });
  }

  filterOldData(section: any, filter: any) {
    if (this.syncStatus()) {
      this.currentSection.set(section);
      switch (section) {
        case 'Checks':
          this.detailTitle.set('Kapatılan Hesap Detayları');
          if (this.oldChecks() && this.oldChecks().docs) {
            if (filter == 'All') {
              this.checksTable.set(this.oldChecks().docs.sort((a: any, b: any) => a.timestamp - b.timestamp));
            } else if (filter == 'İptal') {
              this.checksTable.set(this.oldChecks().docs.filter((obj: any) => obj.type == 3).sort((a: any, b: any) => a.timestamp - b.timestamp));
            } else {
              this.checksTable.set(this.oldChecks().docs.filter((obj: any) => obj.type !== 3).sort((a: any, b: any) => a.timestamp - b.timestamp));
              this.checksTable.set(this.oldChecks().docs.filter((obj: any) => obj.payment_method == filter).sort((a: any, b: any) => a.timestamp - b.timestamp));
            }
          } else {
            this.checksTable.set([]);
          }
          break;
        case 'Cashbox':
          this.detailTitle.set('Kasa Gelir-Gider Detayları');
          if (this.oldCashbox() && this.oldCashbox().docs) {
            if (filter == 'All') {
              this.cashboxTable.set(this.oldCashbox().docs);
            }
            else if (filter == 'Gelir') {
              this.cashboxTable.set(this.oldCashbox().docs.filter((obj: any) => obj.type == 'Gelir').sort((a: any, b: any) => a.timestamp - b.timestamp));
            } else if (filter == 'Gider') {
              this.cashboxTable.set(this.oldCashbox().docs.filter((obj: any) => obj.type == 'Gider').sort((a: any, b: any) => a.timestamp - b.timestamp));
            }
          } else {
            this.cashboxTable.set([]);
          }
          break;
        case 'Products':
          this.detailTitle.set('Güne Ait Ürün Satış Detayları');
          if (this.oldReports() && this.oldReports().docs) {
            this.productsTable.set(this.oldReports().docs.filter((obj: any) => obj.type == 'Product').sort((a: any, b: any) => b.weekly[this.detailDay()] - a.weekly[this.detailDay()]));
            this.productsTable.set(this.productsTable().filter((obj: any) => obj.weekly[this.detailDay()] !== 0));
          } else {
            this.productsTable.set([]);
          }
          break;
        case 'Users':
          this.detailTitle.set('Güne Ait Kullanıcı Satış Detayları');
          if (this.oldReports() && this.oldReports().docs) {
            this.usersTable.set(this.oldReports().docs.filter((obj: any) => obj.type == 'User').sort((a: any, b: any) => b.weekly[this.detailDay()] - a.weekly[this.detailDay()]));
            this.usersTable.set(this.usersTable().filter((obj: any) => obj.weekly[this.detailDay()] !== 0));
          } else {
            this.usersTable.set([]);
          }
          break;
        case 'Tables':
          this.detailTitle.set('Güne Ait Masa Satış Detayları');
          if (this.oldReports() && this.oldReports().docs) {
            this.tablesTable.set(this.oldReports().docs.filter((obj: any) => obj.type == 'Table').sort((a: any, b: any) => b.weekly[this.detailDay()] - a.weekly[this.detailDay()]));
            this.tablesTable.set(this.tablesTable().filter((obj: any) => obj.weekly[this.detailDay()] !== 0));
          } else {
            this.tablesTable.set([]);
          }
          break;
        case 'Logs':
          this.detailTitle.set('Güne Ait Sistem Kayıtları');
          if (this.oldLogs() && this.oldLogs().docs) {
            this.logsTable.set(this.oldLogs().docs.sort((a: any, b: any) => b.timestamp - a.timestamp));
          } else {
            this.logsTable.set([]);
          }
          break;
        case 'Activity':
          this.detailTitle.set('Güne Ait Aktivite Grafiği');
          if (this.oldReports() && this.oldReports().docs) {
            const sellingActivity = this.oldReports().docs.find((obj: any) => obj.type == 'Activity');
            if (sellingActivity) {
              this.activityData.set([{ data: sellingActivity.activity, label: 'Gelir Endeksi' }, { data: sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }]);
              this.activityLabels.set(sellingActivity.activity_time);
            }
          }
          break;

        default:
          break;
      }
    } else {
      alert('Senkorinizasyon işleminin bitmesini bekleyin.')
    }
  }

  printEndday() {
    const printerList = this.printers();
    if (printerList && printerList.length > 0) {
      this.printerService.printEndDay(printerList[0], this.detailData());
    } else {
      console.warn('No printers available');
    }
  }

  showCheckDetail(check: any) {
    this.checkDetail.set(check);
    // jQuery modal operations don't need zone.run() wrapper
    (window as any).$('#checkDetail').modal('show');
  }

  showCashDetail(cash: any) {
    this.cashDetail.set(cash);
    // jQuery modal operations don't need zone.run() wrapper
    (window as any).$('#cashDetail').modal('show');
  }

  fillData() {
    const data = this.detailData();
    this.pieColors.set([{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }]);
    const newLabels = ['Nakit', 'Kart', 'Kupon', 'İkram'];
    this.pieLabels.set(newLabels);
    this.pieData.set([{ data: [data.cash_total, data.card_total, data.coupon_total, data.free_total], label: 'Ödeme Yöntemleri' }]);
    this.detailDay.set(new Date(data.timestamp).getDay());

    // Silent fail for missing backup files
    try {
      this.electronService.readBackupData(data.data_file).then((result: Array<BackupData>) => {
        if (result && Array.isArray(result) && result.length >= 4) {
          this.oldBackupData.set(result);
          this.oldChecks.set(this.oldBackupData()[0]);
          this.oldCashbox.set(this.oldBackupData()[1]);
          this.oldReports.set(this.oldBackupData()[2]);
          this.oldLogs.set(this.oldBackupData()[3]);
          this.syncStatus.set(true);
        } else {
          this.oldBackupData.set([]);
          this.syncStatus.set(false);
        }
      }).catch(() => {
        // Silently fail for missing backup files - ENOENT errors are expected
        // for archived or deleted backups from old end-of-day records
        this.oldBackupData.set([]);
        this.syncStatus.set(false);
      });
    } catch (err) {
      // Fallback for synchronous errors
      this.oldBackupData.set([]);
      this.syncStatus.set(false);
    }
  }

  chartClicked(e: any): void {
    console.log(e);
  }

  chartHovered(e: any): void {
    console.log(e);
  }

}
