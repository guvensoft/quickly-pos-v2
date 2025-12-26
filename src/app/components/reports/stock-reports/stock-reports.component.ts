import { Component, OnInit } from '@angular/core';
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
  stocksView!: Array<Stock>;
  allStocks!: Array<Stock>;
  allCats!: Array<StockCategory>;
  stockLogs!: Array<Log>;
  selectedCat!: string | undefined;

  constructor(private mainService: MainService) { }

  ngOnInit() {
    this.fillData();
  }

  getStocksByCategory(cat_id: any) {
    this.stocksView = this.allStocks.filter((obj: any) => obj.sub_category == cat_id);
    this.selectedCat = cat_id;
  }

  fillData() {
    this.selectedCat = undefined;
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.allStocks = result.docs as any;
      this.allStocks = this.allStocks.sort((b: any, a: any) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
      this.stocksView = this.allStocks.sort((b: any, a: any) => (b.left_total / (b.total * b.first_quantity)) * 100 - (a.left_total / (a.total * a.first_quantity)) * 100);
    });
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.allCats = result.docs as any;
    });
    this.mainService.getAllBy('logs', {}).then(res => {
      this.stockLogs = res.docs.filter((obj: any) => obj.type >= logType.STOCK_CREATED && obj.type <= logType.STOCK_CHECKPOINT).sort((a: any, b: any) => b.timestamp - a.timestamp);
    });
  }
}
