import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Log, logType } from '../../../core/models/log.model';
import { Report } from '../../../core/models/report.model';
import { Printer } from '../../../core/models/settings.model';
import { MainService } from '../../../core/services/main.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Category } from '../../../core/models/product.model';
import { PrinterService } from '../../../core/services/printer.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { PricePipe } from '../../../shared/pipes/price.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
@Component({
  standalone: true,
  imports: [CommonModule, BaseChartDirective, GeneralPipe, PricePipe],
  selector: 'app-product-reports',
  templateUrl: './product-reports.component.html',
  styleUrls: ['./product-reports.component.scss'],
})
export class ProductReportsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly settingsService = inject(SettingsService);
  private readonly printerService = inject(PrinterService);

  readonly categoriesList = signal<Category[]>([]);
  readonly selectedCat = signal<string | undefined>(undefined);
  readonly generalList = signal<Report[]>([]);
  readonly productList = signal<Report[]>([]);
  readonly productLogs = signal<Log[]>([]);
  readonly chartList = signal<Report[]>([]);
  readonly toDay = signal<number>(Date.now());
  readonly printers = signal<Printer[]>([]);

  readonly ChartData = signal<any[]>([]);
  readonly ChartLabels = signal<string[]>(['Pzt', 'Sa', 'Ça', 'Pe', 'Cu', 'Cmt', 'Pa']);

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
  ChartLegend: boolean = true;
  ChartType: ChartType = 'bar';
  readonly ItemReport = signal<Report | null>(null);
  readonly DetailData = signal<any[]>([]);
  readonly DetailLoaded = signal<boolean>(false);
  readonly ChartLoaded = signal<boolean>(false);

  constructor() {
  }

  ngOnInit() {
    this.fillData(false);
    this.toDay.set(Date.now());
    this.settingsService.getPrinters().subscribe(res => {
      this.printers.set(res.value);
    })
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
      case 'Adet':
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
      this.DetailData.set([{ data: res.weekly, label: 'Satış Tutarı' }]);
      this.DetailLoaded.set(true);
      (window as any).$('#reportDetail').modal('show');
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
          obj.count = obj.weekly_count.reduce((a: any, b: any) => a + b);
          obj.amount = obj.weekly.reduce((a: any, b: any) => a + b);
        });
        break;
      default:
        break;
    }
    newArray = newArray.sort((a, b) => b.count - a.count) as any;
    this.productList.set(newArray);
    const selected = this.selectedCat();
    if (selected) {
      this.mainService.getAllBy('products', { cat_id: selected }).then(res => {
        const products_ids = res.docs.map((obj: any) => obj._id);
        this.productList.set(this.productList().filter(obj => products_ids.includes(obj.connection_id)));
      })
    }
  }

  getReportsByCategory(cat_id: string) {
    this.selectedCat.set(cat_id);
    this.mainService.getAllBy('products', { cat_id: cat_id }).then(res => {
      const products_ids = res.docs.map((obj: any) => obj._id);
      this.productList.set(this.generalList().filter((obj: any) => products_ids.includes(obj.connection_id)));
    })
  }

  printReport() {
    const selected = this.selectedCat();
    const printers = this.printers();
    if (printers.length === 0) return;

    if (selected) {
      this.mainService.getAllBy('products', { cat_id: selected }).then(res => {
        const list = this.productList();
        res.docs.forEach((element: any) => {
          const found = list.find((obj: any) => obj.connection_id == element._id);
          if (found) found.description = element.name;
        });
        this.printerService.printReport(printers[0], 'Ürünler', list);
      });
    } else {
      this.mainService.getAllBy('products', {}).then(res => {
        const list = this.productList();
        res.docs.forEach((element: any) => {
          const found = list.find((obj: any) => obj.connection_id == element._id);
          if (found) found.description = element.name;
        });
        this.printerService.printReport(printers[0], 'Ürünler', list);
      });
    }
  }

  fillData(daily: boolean) {
    this.selectedCat.set(undefined);
    this.ChartData.set([]);
    this.ChartLoaded.set(false);
    this.mainService.getAllBy('reports', { type: 'Product' }).then(res => {
      const general = (res.docs.sort((a: any, b: any) => b.count - a.count)) as Report[];
      this.generalList.set(general);
      const productL = JSON.parse(JSON.stringify(general)) as Report[];
      this.productList.set(productL);
      const chartL = productL.slice(0, 5);
      this.chartList.set(chartL);

      chartL.forEach((obj, index) => {
        this.mainService.getData('products', obj.connection_id).then(res => {
          obj.weekly = this.normalWeekOrder(obj.weekly);
          if (daily) {
            obj.weekly = this.normalWeekOrder(obj.weekly_count);
          }
          const schema: any = { data: obj.weekly, label: res.name };
          this.ChartData.update(data => [...data, schema]);
          if (chartL.length - 1 == index) {
            this.ChartLoaded.set(true);
          };
        });
      });
    });
    this.mainService.getAllBy('categories', {}).then(res => {
      const categories = res.docs as Category[];
      categories.sort((a: any, b: any) => b.order - a.order);
      this.categoriesList.set(categories);
    })
    this.mainService.getAllBy('logs', {}).then(res => {
      const logs = (res.docs.filter((obj: any) => obj.type >= logType.PRODUCT_CREATED && obj.type <= logType.PRODUCT_CHECKPOINT).sort((a: any, b: any) => b.timestamp - a.timestamp)) as Log[];
      this.productLogs.set(logs);
    });
  }
}