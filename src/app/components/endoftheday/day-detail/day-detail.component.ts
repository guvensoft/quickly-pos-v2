import { Component, Input, OnInit } from '@angular/core';
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
export class DayDetailComponent implements OnInit {
  @Input('data') detailData!: EndDay;
  @Input() printers: any;
  oldBackupData!: Array<BackupData>;
  oldChecks: any;
  oldCashbox: any;
  oldReports: any;
  oldLogs: any;
  selectedCat!: string;
  currentSection!: string | undefined;
  checksTable!: Array<ClosedCheck>;
  cashboxTable!: Array<Cashbox>;
  reportsTable!: Array<Report>;
  productsTable!: Array<Report>;
  usersTable!: Array<Report>;
  tablesTable!: Array<Report>;
  logsTable!: Array<Log>;
  checkDetail!: ClosedCheck;
  activityData: any;
  activityLabels: any;
  activityOptions: any;
  cashDetail!: Cashbox;
  syncStatus!: boolean;
  pieData!: Array<any>;
  pieLabels!: Array<any>;
  pieOptions: any;
  pieColors!: Array<any>;
  detailTitle!: string;
  detailDay!: number;
  selectedCHECK!: ClosedCheck;
  selectedCASH!: Cashbox;
  selected: any;
  constructor(private electronService: ElectronService, private printerService: PrinterService, private settingsService: SettingsService) {

    this.pieOptions = { responsive: false, legend: { labels: { fontColor: 'rgb(255, 255, 255)' } } };
    this.activityOptions = {
      responsive: false,
      elements: {
        line: {
          tension: 0.5,
        }
      },
      legend: { labels: { fontColor: 'rgb(255, 255, 255)' } },
      scales: {
        xAxes: [{
          ticks: {
            beginAtZero: true,
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }],
        yAxes: [{
          ticks: {
            fontColor: 'rgba(255,255,255)'
          },
          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
      },
    };
  }

  ngOnInit() {
    // this.settingsService.getPrinters().subscribe(res => this.printers = res.value);
    console.log(this.detailData, this.printers);

    this.detailTitle = 'Genel Detaylar & Grafik';
    this.pieColors = [];
    this.pieData = [];
    this.pieLabels = [];
    this.cashboxTable = [];
    this.checksTable = [];
    this.fillData();
  }

  filterOldData(section: any, filter: any) {
    if (this.syncStatus) {
      this.currentSection = section;
      switch (section) {
        case 'Checks':
          this.detailTitle = 'Kapatılan Hesap Detayları';
          if (this.oldChecks && this.oldChecks.docs) {
            if (filter == 'All') {
              this.checksTable = this.oldChecks.docs.sort((a: any, b: any) => a.timestamp - b.timestamp);
            } else if (filter == 'İptal') {
              this.checksTable = this.oldChecks.docs.filter((obj: any) => obj.type == 3).sort((a: any, b: any) => a.timestamp - b.timestamp);
            } else {
              this.checksTable = this.oldChecks.docs.filter((obj: any) => obj.type !== 3).sort((a: any, b: any) => a.timestamp - b.timestamp);
              this.checksTable = this.oldChecks.docs.filter((obj: any) => obj.payment_method == filter).sort((a: any, b: any) => a.timestamp - b.timestamp);
            }
          } else {
            this.checksTable = [];
          }
          break;
        case 'Cashbox':
          this.detailTitle = 'Kasa Gelir-Gider Detayları';
          if (this.oldCashbox && this.oldCashbox.docs) {
            if (filter == 'All') {
              this.cashboxTable = this.oldCashbox.docs;
            }
            else if (filter == 'Gelir') {
              this.cashboxTable = this.oldCashbox.docs.filter((obj: any) => obj.type == 'Gelir').sort((a: any, b: any) => a.timestamp - b.timestamp);
            } else if (filter == 'Gider') {
              this.cashboxTable = this.oldCashbox.docs.filter((obj: any) => obj.type == 'Gider').sort((a: any, b: any) => a.timestamp - b.timestamp);
            }
          } else {
            this.cashboxTable = [];
          }
          break;
        case 'Products':
          this.detailTitle = 'Güne Ait Ürün Satış Detayları';
          if (this.oldReports && this.oldReports.docs) {
            this.productsTable = this.oldReports.docs.filter((obj: any) => obj.type == 'Product').sort((a: any, b: any) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
            this.productsTable = this.productsTable.filter((obj: any) => obj.weekly[this.detailDay] !== 0);
          } else {
            this.productsTable = [];
          }
          break;
        case 'Users':
          this.detailTitle = 'Güne Ait Kullanıcı Satış Detayları';
          if (this.oldReports && this.oldReports.docs) {
            this.usersTable = this.oldReports.docs.filter((obj: any) => obj.type == 'User').sort((a: any, b: any) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
            this.usersTable = this.usersTable.filter((obj: any) => obj.weekly[this.detailDay] !== 0);
          } else {
            this.usersTable = [];
          }
          break;
        case 'Tables':
          this.detailTitle = 'Güne Ait Masa Satış Detayları';
          if (this.oldReports && this.oldReports.docs) {
            this.tablesTable = this.oldReports.docs.filter((obj: any) => obj.type == 'Table').sort((a: any, b: any) => b.weekly[this.detailDay] - a.weekly[this.detailDay]);
            this.tablesTable = this.tablesTable.filter((obj: any) => obj.weekly[this.detailDay] !== 0);
          } else {
            this.tablesTable = [];
          }
          break;
        case 'Logs':
          this.detailTitle = 'Güne Ait Sistem Kayıtları';
          if (this.oldLogs && this.oldLogs.docs) {
            this.logsTable = this.oldLogs.docs.sort((a: any, b: any) => b.timestamp - a.timestamp);
          } else {
            this.logsTable = [];
          }
          break;
        case 'Activity':
          this.detailTitle = 'Güne Ait Aktivite Grafiği';
          if (this.oldReports && this.oldReports.docs) {
            const sellingActivity = this.oldReports.docs.find((obj: any) => obj.type == 'Activity');
            if (sellingActivity) {
              this.activityData = [{ data: sellingActivity.activity, label: 'Gelir Endeksi' }, { data: sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
              this.activityLabels = sellingActivity.activity_time;
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
    if (this.printers && this.printers.length > 0) {
      this.printerService.printEndDay(this.printers[0], this.detailData);
    } else {
      console.warn('No printers available');
    }
  }

  showCheckDetail(check: any) {
    this.checkDetail = check;
    (window as any).$('#checkDetail').modal('show');
  }

  showCashDetail(cash: any) {
    this.cashDetail = cash;
    (window as any).$('#cashDetail').modal('show');
  }

  fillData() {
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }];
    this.pieLabels.push('Nakit', 'Kart', 'Kupon', 'İkram');
    this.pieData.push(this.detailData.cash_total, this.detailData.card_total, this.detailData.coupon_total, this.detailData.free_total);
    this.detailDay = new Date(this.detailData.timestamp).getDay();
    this.electronService.readBackupData(this.detailData.data_file).then((result: Array<BackupData>) => {
      if (result && Array.isArray(result) && result.length >= 4) {
        this.oldBackupData = result;
        this.oldChecks = this.oldBackupData[0];
        this.oldCashbox = this.oldBackupData[1];
        this.oldReports = this.oldBackupData[2];
        this.oldLogs = this.oldBackupData[3];
        this.syncStatus = true;
      } else {
        console.warn('Invalid backup data structure');
        this.oldBackupData = [];
        this.syncStatus = false;
      }
    }).catch(err => {
      console.error('Error reading backup data:', err);
      this.oldBackupData = [];
      this.syncStatus = false;
    });
  }

  chartClicked(e: any): void {
    console.log(e);
  }

  chartHovered(e: any): void {
    console.log(e);
  }

}
