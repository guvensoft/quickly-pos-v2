import { Component, OnInit } from '@angular/core';
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
  imports: [CommonModule, BaseChartDirective, GeneralPipe, PricePipe, StoreReportsComponent, ProductReportsComponent, TableReportsComponent, StockReportsComponent, UserReportsComponent, CashboxReportsComponent, ActivityReportsComponent, NotificationsReportsComponent],
  selector: 'app-reports',
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss'],
})
export class ReportsComponent implements OnInit {
  day!: number;

  selected!: number;
  freeTotal!: number;
  closedTotal!: number;
  canceledTotal!: number;
  activeTotal!: number;
  generalTotal!: number;
  sellingActivity!: Activity;

  ChartOptions: any;
  ChartLegend: boolean = true;
  ChartType: ChartType = 'bar';
  ChartData!: Array<any>;
  ChartColors!: Array<any>;
  ChartLoaded!: boolean;
  ChartLabels!: Array<string>;

  monthlyData!: Array<any>;
  monthlyLabels!: Array<string>;
  monthlyLegends: boolean = true;
  monthlyLoaded: boolean = false;

  activityData!: Array<any>;
  activityLabels!: Array<string>;
  activityLegend: boolean = true;

  salesReport: any = { cash: 0, card: 0, coupon: 0, free: 0, discount: 0, partial: null };

  pieData!: Array<any>;
  pieLabels!: Array<any>;
  pieColors!: Array<any>;
  pieOptions: any;

  constructor(private mainService: MainService, private settingsService: SettingsService) {
    this.settingsService.DateSettings.subscribe((res: any) => {
      this.day = res.value.day;
    })
    this.closedTotal = 0;
    this.activeTotal = 0;
    this.generalTotal = 0;
    this.freeTotal = 0;
    this.canceledTotal = 0;
    this.selected = undefined!;
    this.monthlyLabels = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];
    this.ChartLabels = ['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa'];
    this.ChartOptions = {
      responsive: false,
      legend: {
        labels: {
          fontColor: 'rgb(255, 255, 255)',
          fontStyle: 'bolder'
        }
      },
      tooltips: {
        callbacks: {
          label: function (value: any) {
            return ' ' + Number(value.yLabel).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
          }
        }
      },
      elements: {
        line: {
          tension: 0.5,
        }
      },
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
            fontColor: 'rgba(255,255,255)',
            callback: function (value: any, index: number, values: any) {
              return value.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            }
          },

          gridLines: {
            color: 'rgba(255,255,255)',
            lineWidth: 0.4
          }
        }]
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
      legend: {
        labels: { fontColor: 'rgb(255, 255, 255)', fontStyle: 'bolder' }
      },
      tooltips: {
        callbacks: {
          label: function (tooltipItem: any, data: any) {
            const dataLabel = data.labels[tooltipItem.index];
            const value = ': ' + Number(data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index]).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' ₺';
            return dataLabel + value;
          }
        }
      },
    }
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
    this.monthlyLoaded = false;
    if (!year) {
      year = new Date(Date.now()).getFullYear();
    }
    const Days: any[] = [];
    const Months: any[] = [];
    this.mainService.getAllBy('endday', {}).then((res: any) => {
      let endDayData = res.docs;
      endDayData = endDayData.filter((obj: any) => new Date(obj.timestamp).getFullYear() == year);
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
            this.monthlyLabels.forEach((monthName: string, index2: number) => {
              const monthWillProcess = Days.filter((obj: any) => obj.month == index2);
              if (monthWillProcess.length > 1) {
                cash.data[index2] = monthWillProcess.map((obj: any) => obj.cash).reduce((a: number, b: number) => a + b, 0);
                card.data[index2] = monthWillProcess.map((obj: any) => obj.card).reduce((a: number, b: number) => a + b);
                coupon.data[index2] = monthWillProcess.map((obj: any) => obj.coupon).reduce((a: number, b: number) => a + b);
                free.data[index2] = monthWillProcess.map((obj: any) => obj.free).reduce((a: number, b: number) => a + b);
                total.data[index2] = monthWillProcess.map((obj: any) => obj.total).reduce((a: number, b: number) => a + b);
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
              if (index2 == this.monthlyLabels.length - 1) {
                Months.push(cash, coupon, card, free, total);
                this.monthlyData = Months;
                this.monthlyLoaded = true;
              }
            });
          }
        });
      }
    })
  }


  fillData() {
    this.getMonthlyReport();
    this.ChartData = [];
    this.pieData = [];
    this.pieLabels = [];
    this.ChartLoaded = false;
    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
      this.sellingActivity = res.docs[0];
      this.activityData = [{ data: this.sellingActivity.activity, label: 'Gelir Endeksi' }, { data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
      this.activityLabels = this.sellingActivity.activity_time;
    });
    this.mainService.getAllBy('reports', { type: 'Store' }).then((res: any) => {
      let report: Array<Report> = res.docs;
      report = report.filter(obj => obj.connection_id !== 'Genel').sort((a, b) => b.connection_id.localeCompare(a.connection_id));
      report.forEach((element: any, index: number) => {
        element.weekly = this.normalWeekOrder(element.weekly);
        const chartObj = { data: element.weekly, label: element.connection_id };
        this.ChartData.push(chartObj);
        if (report.length - 1 == index) {
          this.ChartLoaded = true;
        };
      });
    });
    this.mainService.getAllBy('closed_checks', { type: 3 }).then((res: any) => {
      if (res.docs.length > 0) {
        this.canceledTotal = res.docs.map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b);
      }
    });
  }

  dailySalesActivity() {
    this.mainService.getAllBy('reports', { type: 'Activity' }).then((res: any) => {
      this.sellingActivity = res.docs[0];
      this.activityData = [{ data: this.sellingActivity.activity, label: 'Gelir Endeksi' }, { data: this.sellingActivity.activity_count, label: 'Doluluk Oranı ( % )' }];
      this.activityLabels = this.sellingActivity.activity_time;
    });
  }

  dailySalesReport() {
    this.mainService.getAllBy('checks', {}).then((res: any) => {
      this.activeTotal = res.docs.map((obj: any) => obj.total_price + obj.discount).reduce((a: number, b: number) => a + b, 0);
    });

    this.mainService.getAllBy('closed_checks', {}).then((res: any) => {

      const checks = (res.docs as any[]).filter(({ type }) => type !== 3);

      this.salesReport.cash = checks.filter((obj: any) => obj.payment_method == 'Nakit').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
      this.salesReport.card = checks.filter((obj: any) => obj.payment_method == 'Kart').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
      this.salesReport.coupon = checks.filter((obj: any) => obj.payment_method == 'Kupon').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
      this.salesReport.free = checks.filter((obj: any) => obj.payment_method == 'İkram').map((obj: any) => obj.total_price).reduce((a: number, b: number) => a + b, 0);
      this.salesReport.discount = checks.filter((obj: any) => obj.hasOwnProperty('discount')).map((obj: any) => obj.discount).reduce((a: number, b: number) => a + b, 0);

      this.salesReport.partial = checks.filter(obj => obj.payment_method == 'Parçalı')

      this.salesReport.partial.forEach((element: any) => {
        element.payment_flow.forEach((payment: any) => {
          if (payment.method == 'Nakit') {
            this.salesReport.cash += payment.amount;
          }
          if (payment.method == 'Kart') {
            this.salesReport.card += payment.amount;
          }
          if (payment.method == 'Kupon') {
            this.salesReport.coupon += payment.amount;
          }
          if (payment.method == 'İkram') {
            this.salesReport.free += payment.amount;
          }
        })
      });

      this.closedTotal = this.salesReport.cash + this.salesReport.card + this.salesReport.coupon;
      this.generalTotal = this.closedTotal + this.activeTotal;

      this.pieData.push(this.salesReport.cash);
      this.pieData.push(this.salesReport.card);
      this.pieData.push(this.salesReport.coupon);
      this.pieData.push(this.salesReport.free);

      this.pieLabels.push('Nakit');
      this.pieLabels.push('Kart');
      this.pieLabels.push('Kupon');
      this.pieLabels.push('İkram');

    })
  }
}