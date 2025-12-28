import { Component, OnInit, inject, signal, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Log, logType } from '../../../core/models/log.model';
import { Report } from '../../../core/models/report.model';
import { MainService } from '../../../core/services/main.service';
import { Floor } from '../../../core/models/table.model';
import { ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, BaseChartDirective, GeneralPipe, PricePipe, TimeAgoPipe],
  selector: 'app-table-reports',
  templateUrl: './table-reports.component.html',
  styleUrls: ['./table-reports.component.scss']
})
export class TableReportsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly zone = inject(NgZone);

  readonly tablesList = signal<Report[]>([]);
  readonly generalList = signal<Report[]>([]);
  readonly selectedCat = signal<string | undefined>(undefined);
  readonly floorsList = signal<Floor[]>([]);
  readonly tableLogs = signal<Log[]>([]);


  ChartOptions: any = {
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
          callback: function (value: any, index: any, values: any) {
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
  readonly ChartData = signal<any[]>([]);
  readonly ChartLabels = signal<string[]>(['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa']);
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

  dailyCount(arr: Array<number>, price: number) {
    const newArray = [];
    for (let item of arr) {
      item = item / price;
      newArray.push(item);
    }
    return newArray;
  }

  changeFilter(value: string) {
    switch (value) {
      case 'Hesap Adedi':
        this.fillData(true);
        break;
      case 'Tutar':
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
      res.weekly = this.normalWeekOrder(res.weekly || []);
      res.weekly_count = this.normalWeekOrder(res.weekly_count || []);
      this.DetailData.set([{ data: res.weekly, label: 'Hesap Tutarı' }]);
      this.DetailLoaded.set(true);
      this.zone.run(() => {
        (window as any).$('#reportDetail').modal('show');
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
    newArray = newArray.sort((a: any, b: any) => b.count - a.count) as any;
    this.tablesList.set(newArray);
    const selected = this.selectedCat();
    if (selected) {
      this.mainService.getAllBy('tables', { floor_id: selected }).then(res => {
        const floors_ids = res.docs.map((obj: any) => obj._id);
        this.tablesList.set(this.tablesList().filter((obj: any) => floors_ids.includes(obj.connection_id)));
      })
    }
  }

  getReportsByCategory(cat_id: string) {
    this.selectedCat.set(cat_id);
    this.mainService.getAllBy('tables', { floor_id: cat_id }).then(res => {
      const floors_ids = res.docs.map((obj: any) => obj._id);
      this.tablesList.set(this.generalList().filter((obj: any) => floors_ids.includes(obj.connection_id)));
    })
  }

  getLogs() {
    this.mainService.getAllBy('logs', {}).then(res => {
      this.tableLogs.set((res.docs.filter((obj: any) => obj.type >= logType.TABLE_CREATED && obj.type <= logType.TABLE_CHECKPOINT).sort((a: any, b: any) => b.timestamp - a.timestamp)) as any);
    });
  }

  fillData(daily: boolean) {
    this.selectedCat.set(undefined);
    this.ChartData.set([]);
    this.ChartLoaded.set(false);
    this.mainService.getAllBy('reports', { type: 'Table' }).then(res => {
      const general = (res.docs.sort((a: any, b: any) => b.count - a.count)) as Report[];
      this.generalList.set(general);
      const tablesL = JSON.parse(JSON.stringify(general)) as Report[];
      this.tablesList.set(tablesL);
      const chartTable = tablesL.slice(0, 5);
      chartTable.forEach((obj, index) => {
        this.mainService.getData('tables', obj.connection_id).then(res => {
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
          };
        });
      });
    });
    this.mainService.getAllBy('floors', {}).then(res => {
      this.floorsList.set(res.docs as unknown as Floor[]);
    })
  }

}
