import { Component, OnInit, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Log, logType } from '../../../core/models/log.model';
import { Report } from '../../../core/models/report.model';
import { MainService } from '../../../core/services/main.service';
import { BaseChartDirective } from 'ng2-charts';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { ChartType } from 'chart.js';
@Component({
  standalone: true,
  imports: [CommonModule, BaseChartDirective, GeneralPipe],
  selector: 'app-user-reports',
  templateUrl: './user-reports.component.html',
  styleUrls: ['./user-reports.component.scss']
})
export class UserReportsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly zone = inject(NgZone);

  readonly usersList = signal<Report[]>([]);
  readonly userLogs = signal<Log[]>([]);
  readonly generalList = signal<Report[]>([]);


  ChartOptions: any = {
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
          label: function (context: any) {
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
          callback: function (value: any, index: any, values: any) {
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
  readonly ChartData = signal<any[]>([]);
  readonly ChartLabels = signal<any[]>(['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa']);
  readonly ChartLegend = signal<boolean>(true);
  readonly ChartType: ChartType = 'bar';
  readonly ChartLoaded = signal<boolean>(false);

  readonly ItemReport = signal<Report | null>(null);
  readonly DetailData = signal<any[]>([]);
  readonly DetailLoaded = signal<boolean>(false);

  constructor() {
  }

  ngOnInit() {
    this.fillData(false);
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

  changeFilter(value: string) {
    switch (value) {
      case 'Sipariş Adedi':
        this.fillData(true);
        break;
      case 'Satış Tutarı':
        this.fillData(false);
        break;
      default:
        break;
    }
  }

  getItemReport(report: Report) {
    this.DetailLoaded.set(false);
    this.ItemReport.set(report);
    this.mainService.getData('reports', report._id!).then(res => {
      this.zone.run(() => {
        res.weekly = this.normalWeekOrder(res.weekly || []);
        res.weekly_count = this.normalWeekOrder(res.weekly_count || []);
        this.DetailData.set([{ data: res.weekly, label: 'Sipariş Tutarı' }, { data: res.weekly_count, label: 'Sipariş Adedi' }]);
        this.DetailLoaded.set(true);
        this.zone.run(() => {
          (window as any).$('#reportDetail').modal('show');
        });
      });
    });
  }

  changeListFilter(value: string) {
    let newArray: Array<Report> = [];
    const general = this.generalList();
    switch (value) {
      case 'Genel':
        newArray = JSON.parse(JSON.stringify(general));
        break;
      case 'Günlük':
        newArray = JSON.parse(JSON.stringify(general));
        newArray.filter((obj) => {
          obj.count = obj.weekly_count[new Date().getDay()];
          obj.amount = obj.weekly[new Date().getDay()];
        });
        break;
      case 'Haftalık':
        newArray = JSON.parse(JSON.stringify(general));
        newArray.filter((obj) => {
          obj.count = obj.weekly_count.reduce((a: number, b: number) => a + b, 0);
          obj.amount = obj.weekly.reduce((a: number, b: number) => a + b, 0);
        });
        break;
      default:
        break;
    }
    newArray = newArray.sort((a: any, b: any) => b.count - a.count);
    this.usersList.set(newArray);
  }

  getLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.zone.run(() => {
        this.userLogs.set((res.docs.filter((obj: any) => obj.type >= logType.USER_CREATED && obj.type <= logType.USER_CHECKPOINT || obj.type == logType.ORDER_CREATED).sort((a: any, b: any) => b.timestamp - a.timestamp)) as Log[]);
      });
    });
  }

  fillData(daily: boolean) {
    this.ChartData.set([]);
    this.ChartLoaded.set(false);
    this.mainService.getAllBy('reports', { type: 'User' }).then(res => {
      this.zone.run(() => {
        const general = (res.docs.sort((a: any, b: any) => b.count - a.count)) as Report[];
        this.generalList.set(general);
        const userL = JSON.parse(JSON.stringify(general)) as Report[];
        this.usersList.set(userL);
        const chartTable = userL.slice(0, 5);
        chartTable.forEach((obj, index) => {
          this.mainService.getData('users', obj.connection_id).then(res => {
            this.zone.run(() => {
              obj.weekly = this.normalWeekOrder(obj.weekly);
              obj.weekly_count = this.normalWeekOrder(obj.weekly_count);
              let schema;
              if (daily) {
                schema = { data: obj.weekly_count, label: res.name };
              } else {
                schema = { data: obj.weekly, label: res.name };
              }
              this.ChartData.update(data => [...data, schema]);
              if (chartTable.length - 1 == index) {
                this.ChartLoaded.set(true);
              }
            });
          });
        });
      });
    });
  }
}
