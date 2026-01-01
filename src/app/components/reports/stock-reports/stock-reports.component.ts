import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Log, logType } from '../../../core/models/log.model';
import { Stock, StockCategory } from '../../../core/models/stocks.model';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';

@Component({
  standalone: true,
  imports: [CommonModule],
  selector: 'app-stock-reports',
  templateUrl: './stock-reports.component.html',
  styleUrls: ['./stock-reports.component.scss']
})
export class StockReportsComponent implements OnInit {
  private readonly mainService = inject(MainService);

  readonly stocksView = signal<Stock[]>([]);
  readonly allStocks = signal<Stock[]>([]);
  readonly allCats = signal<StockCategory[]>([]);
  readonly stockLogs = signal<Log[]>([]);
  readonly selectedCat = signal<string | undefined>(undefined);

  constructor() { }

  ngOnInit() {
    this.fillData();
  }

  getStocksByCategory(cat_id: any) {
    this.stocksView.set(this.allStocks().filter((obj: any) => obj.sub_category == cat_id));
    this.selectedCat.set(cat_id);
  }

  fillData() {
    this.selectedCat.set(undefined);
    this.mainService.getAllBy('stocks', {}).then(result => {
      if (result && result.docs) {
        let allS = result.docs as unknown as Stock[];
        allS = allS.sort((b: any, a: any) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
        this.allStocks.set(allS);
        this.stocksView.set([...allS].sort((b: any, a: any) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100));
      } else {
        this.allStocks.set([]);
        this.stocksView.set([]);
      }
    });
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      if (result && result.docs) {
        this.allCats.set(result.docs as StockCategory[]);
      } else {
        this.allCats.set([]);
      }
    });
    this.mainService.getAllBy('logs', {}).then(res => {
      if (res && res.docs) {
        this.stockLogs.set((res.docs.filter((obj: any) => obj.type >= logType.STOCK_CREATED && obj.type <= logType.STOCK_CHECKPOINT).sort((a: any, b: any) => b.timestamp - a.timestamp)) as Log[]);
      } else {
        this.stockLogs.set([]);
      }
    });
  }
}
