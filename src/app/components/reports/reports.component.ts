import { Component, OnInit, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Activity, Report } from '../../core/models/report.model';
import { MainService } from '../../core/services/main.service';
import { SettingsService } from '../../core/services/settings.service';
import { ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GeneralPipe } from '../../shared/pipes/general.pipe';
import { PricePipe } from '../../shared/pipes/price.pipe';
import { StoreReportsComponent } from './store-reports/store-reports.component';
import { ProductReportsComponent } from './product-reports/product-reports.component';
import { TableReportsComponent } from './table-reports/table-reports.component';
import { StockReportsComponent } from './stock-reports/stock-reports.component';
import { UserReportsComponent } from './user-reports/user-reports.component';
import { CashboxReportsComponent } from './cashbox-reports/cashbox-reports.component';
import { ActivityReportsComponent } from './activity-reports/activity-reports.component';
import { NotificationsReportsComponent } from './notifications-reports/notifications-reports.component';

@Component({
  standalone: true,
  imports: [CommonModule, BaseChartDirective, PricePipe, StoreReportsComponent, ProductReportsComponent, TableReportsComponent, StockReportsComponent, UserReportsComponent, CashboxReportsComponent, ActivityReportsComponent, NotificationsReportsComponent],
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);
  private readonly zone = inject(NgZone);

  readonly day = signal<number>(0);
  readonly selected = signal<number>(0);
  readonly freeTotal = signal<number>(0);
  readonly closedTotal = signal<number>(0);
  readonly canceledTotal = signal<number>(0);
  readonly activeTotal = signal<number>(0);
  readonly generalTotal = signal<number>(0);
  readonly sellingActivity = signal<Activity | undefined>(undefined);

  readonly ChartOptions: any;
  readonly ChartLegend = signal(true);
  readonly ChartType: ChartType = 'bar';
  readonly ChartData = signal<any[]>([]);
  readonly ChartColors: any[];
  readonly ChartLoaded = signal(false);
  readonly ChartLabels = signal<string[]>(['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa']);

  readonly monthlyData = signal<any[]>([]);
  readonly monthlyLabels = signal<string[]>(["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"]);
  readonly monthlyLegends = signal(true);
  readonly monthlyLoaded = signal(false);

  readonly activityData = signal<any[]>([]);
  readonly activityLabels = signal<string[]>([]);
  readonly activityLegend = signal(true);

  readonly salesReport = signal<any>({ cash: 0, card: 0, coupon: 0, free: 0, discount: 0, partial: null });

  readonly pieData = signal<number[]>([]);
  readonly pieLabels = signal<string[]>([]);
  readonly pieColors: any[];
  readonly pieOptions: any;

  constructor() {
    this.settingsService.DateSettings.subscribe((res: any) => {
      this.day.set(res.value.day);
    });

    this.ChartOptions = {
      responsive: false,
      plugins: {
        legend: {
          labels: {
            color: 'rgb(255, 255, 255)',
            font: { weight: 'bold' }
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return ' ' + Number(context.parsed.y).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.5,
        }
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
            color: 'rgba(255,255,255)',
            callback: (value: any) => {
              return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            }
          },
          grid: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }
      },
    };
    this.ChartColors = [
      { backgroundColor: '#5cb85c' },
      { backgroundColor: '#5bc0de' },
      { backgroundColor: '#f0ad4e' },
      { backgroundColor: '#d9534f' },
      { backgroundColor: '#DF691A' },
      { backgroundColor: '#FFFFFF' },
    ];
    this.pieColors = [{ backgroundColor: ['#5cb85c', '#f0ad4e', '#5bc0de', '#d9534f'] }];
    this.pieOptions = {
      responsive: false,
      plugins: {
        legend: {
          labels: { color: 'rgb(255, 255, 255)', font: { weight: 'bold' } }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const dataLabel = context.label;
              const value = ': ' + Number(context.parsed).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
              return dataLabel + value;
            }
          }
        }
      },
    };
  }

  ngOnInit() {
    this.fillData();
    this.dailySalesReport();
  }

  normalWeekOrder(array: Array<any>) {
    const arrayLength = array.length
    for (let i = 0; i < arrayLength - 1; i++) {
      const temp = array[i];
      array[i] = array[i + 1];
      array[i + 1] = temp;
    }
    return array;
  }


  getMonthlyReport(year?: number) {
    this.monthlyLoaded.set(false);
    const finalYear = year || new Date().getFullYear();
    const Days: any[] = [];
    const Months: any[] = [];

    this.mainService.getAllBy('endday', {}).then((res: any) => {
      this.zone.run(() => {
        let endDayData = res.docs;
        endDayData = endDayData.filter((obj: any) => new Date(obj.timestamp).getFullYear() == finalYear);

        if (endDayData.length > 0) {
          endDayData.forEach((obj: any, index: number) => {
            const Schema = { cash: obj.cash_total, card: obj.card_total, coupon: obj.coupon_total, free: obj.free_total, total: obj.total_income, checks: obj.check_count, outcome: obj.outcomes, income: obj.incomes, month: new Date(obj.timestamp).getMonth(), year: new Date(obj.timestamp).getFullYear() };
            Days.push(Schema);

            if (index == endDayData.length - 1) {
              const cash: any = { label: 'Nakit', data: [] };
              const coupon: any = { label: 'Kupon', data: [] };
              const card: any = { label: 'Kart', data: [] };
              const free: any = { label: 'İkram', data: [] };
              const total: any = { label: 'Toplam', data: [] };

              this.monthlyLabels().forEach((monthName: string, index2: number) => {
                const monthWillProcess = Days.filter((obj: any) => obj.month == index2);
                if (monthWillProcess.length > 1) {
                  cash.data[index2] = monthWillProcess.map((obj: any) => obj.cash).reduce((a: number, b: number) => a + b, 0);
                  card.data[index2] = monthWillProcess.map((obj: any) => obj.card).reduce((a: number, b: number) => a + b, 0);
                  coupon.data[index2] = monthWillProcess.map((obj: any) => obj.coupon).reduce((a: number, b: number) => a + b, 0);
                  free.data[index2] = monthWillProcess.map((obj: any) => obj.free).reduce((a: number, b: number) => a + b, 0);
                  total.data[index2] = monthWillProcess.map((obj: any) => obj.total).reduce((a: number, b: number) => a + b, 0);
                } else if (monthWillProcess.length == 1) {
                  cash.data[index2] = monthWillProcess[0].cash;
                  card.data[index2] = monthWillProcess[0].card;
                  coupon.data[index2] = monthWillProcess[0].coupon;
                  free.data[index2] = monthWillProcess[0].free;
                  total.data[index2] = monthWillProcess[0].total;
                } else {
                  cash.data[index2] = 0;
                  card.data[index2] = 0;
                  coupon.data[index2] = 0;
                  free.data[index2] = 0;
                  total.data[index2] = 0;
                }

                if (index2 == this.monthlyLabels().length - 1) {
                  Months.push(cash, coupon, card, free, total);
                  this.monthlyData.set(Months);
                  this.monthlyLoaded.set(true);
                }
              });
            }
          });
        }
      });
    });
  }


  fillData() {
    this.getMonthlyReport();
    this.ChartData.set([]);
    this.pieData.set([]);
    this.pieLabels.set([]);
    this.ChartLoaded.set(false);

    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
      this.zone.run(() => {
        if (res && res.docs && res.docs.length > 0) {
          this.sellingActivity.set(res.docs[0]);
          const act = res.docs[0];
          this.activityData.set([
            { data: act.activity, label: 'Gelir Endeksi' },
            { data: act.activity_count, label: 'Doluluk Oranı ( % )' }
          ]);
          this.activityLabels.set(act.activity_time);
        }
      });
    });

    this.mainService.getAllBy('reports', { type: 'Store' }).then((res: any) => {
      this.zone.run(() => {
        if (res && res.docs) {
          let report: Array<Report> = res.docs;
          report = report.filter(obj => obj.connection_id !== 'Genel').sort((a, b) => b.connection_id.localeCompare(a.connection_id));
          const newChartData: any[] = [];
          report.forEach((element: any, index: number) => {
            element.weekly = this.normalWeekOrder(element.weekly);
            const chartObj = { data: element.weekly, label: element.connection_id };
            newChartData.push(chartObj);
            if (report.length - 1 == index) {
              this.ChartData.set(newChartData);
              this.ChartLoaded.set(true);
            }
          });
        }
      });
    });

    this.mainService.getAllBy('closed_checks', { type: 3 }).then((res: any) => {
      this.zone.run(() => {
        if (res && res.docs && res.docs.length > 0) {
          this.canceledTotal.set(res.docs.map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0));
        } else {
          this.canceledTotal.set(0);
        }
      });
    });
  }

  dailySalesActivity() {
    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
      this.zone.run(() => {
        if (res && res.docs && res.docs.length > 0) {
          const act = res.docs[0];
          this.sellingActivity.set(act);
          this.activityData.set([
            { data: act.activity, label: 'Gelir Endeksi' },
            { data: act.activity_count, label: 'Doluluk Oranı ( % )' }
          ]);
          this.activityLabels.set(act.activity_time);
        }
      });
    });
  }

  dailySalesReport() {
    this.mainService.getAllBy('checks', {}).then((res: any) => {
      this.zone.run(() => {
        this.activeTotal.set(res.docs.map((obj: any) => obj.total_price + obj.discount).reduce((a: number, b: number) => a + b, 0));
      });
    });

    this.mainService.getAllBy('closed_checks', {}).then((res: any) => {
      this.zone.run(() => {
        const checks = (res.docs as any[]).filter(({ type }) => type !== 3);
        const report = { cash: 0, card: 0, coupon: 0, free: 0, discount: 0, partial: [] as any[] };

        report.cash = checks.filter((obj: any) => obj.payment_method == 'Nakit').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
        report.card = checks.filter((obj: any) => obj.payment_method == 'Kart').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
        report.coupon = checks.filter((obj: any) => obj.payment_method == 'Kupon').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
        report.free = checks.filter((obj: any) => obj.payment_method == 'İkram').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
        report.discount = checks.filter((obj: any) => obj.hasOwnProperty('discount')).map((obj: any) => obj.discount).reduce((a: number, b: number) => a + b, 0);

        const partialChecks = checks.filter(obj => obj.payment_method == 'Parçalı');
        partialChecks.forEach((element: any) => {
          element.payment_flow.forEach((payment: any) => {
            if (payment.method == 'Nakit') {
              report.cash += payment.amount;
            }
            if (payment.method == 'Kart') {
              report.card += payment.amount;
            }
            if (payment.method == 'Kupon') {
              report.coupon += payment.amount;
            }
            if (payment.method == 'İkram') {
              report.free += payment.amount;
            }
          });
        });

        this.salesReport.set(report);
        this.closedTotal.set(report.cash + report.card + report.coupon);
        this.generalTotal.set(this.closedTotal() + this.activeTotal());

        const newPieData = [report.cash, report.card, report.coupon, report.free];
        const newPieLabels = ['Nakit', 'Kart', 'Kupon', 'İkram'];

        this.pieData.set(newPieData);
        this.pieLabels.set(newPieLabels);
      });
    });
  }
}