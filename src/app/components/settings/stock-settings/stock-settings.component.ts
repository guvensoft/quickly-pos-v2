import { Component, OnInit, inject, signal, viewChild, computed, effect, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Stock, StockCategory } from '../../../core/models/stocks.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SignalValidatorService } from '../../../core/services/signal-validator.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-stock-settings',
  templateUrl: './stock-settings.component.html',
  styleUrls: ['./stock-settings.component.scss']
})
export class StockSettingsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly validatorService = inject(SignalValidatorService);
  private readonly zone = inject(NgZone);

  readonly categories = signal<Array<StockCategory>>([]);
  readonly stocks = signal<Array<Stock>>([]);
  readonly selectedStock = signal<Stock | undefined>(undefined);
  readonly selectedCat = signal<StockCategory | undefined>(undefined);
  readonly onUpdate = signal<boolean>(false);
  readonly units = signal<Array<string>>(['Gram', 'Mililitre', 'Adet']);

  // Stock validation signals
  readonly stockName = signal<string>('');
  readonly stockQuantity = signal<number>(0);
  readonly stockWarningLimit = signal<number>(0);
  readonly stockPrice = signal<number>(0);

  // Validation error signals
  readonly nameError = signal<string | null>(null);
  readonly quantityError = signal<string | null>(null);
  readonly warningError = signal<string | null>(null);
  readonly priceError = signal<string | null>(null);

  stockCatForm = viewChild<NgForm>('stockCatForm');
  stockCatDetailForm = viewChild<NgForm>('stockCatDetailForm');
  stockForm = viewChild<NgForm>('stockForm');
  stockDetailForm = viewChild<NgForm>('stockDetailForm');

  // Computed properties for reactive filtering and derived state
  readonly stocksByCategory = computed(() => {
    const catId = this.selectedCat()?._id;
    if (!catId) return this.stocks();
    return this.stocks().filter(s => s.sub_category === catId);
  });

  readonly lowStockItems = computed(() => {
    return this.stocks().filter(s =>
      s.left_total < (s.warning_limit || s.total * 0.25)
    );
  });

  readonly totalStockValue = computed(() => {
    return this.stocks().reduce((sum, s) => sum + (s.left_total || 0), 0);
  });

  readonly selectedStockDetails = computed(() => {
    const stock = this.selectedStock();
    if (!stock) return null;
    return {
      quantity: stock.left_total / stock.total,
      percentageLeft: (stock.left_total / stock.total) * 100,
      needsRefill: stock.left_total < (stock.warning_limit || stock.total * 0.25)
    };
  });

  // Stock form validation computed property
  readonly isStockFormValid = computed(() => {
    return !this.nameError() && !this.quantityError() && !this.warningError() && !this.priceError();
  });

  constructor() {
    this.fillData();

    // Load stock details when selected
    effect(() => {
      const stock = this.selectedStock();
      if (stock && stock._id) {
        this.getStockDetail(stock);
      }
    });

    // Validate quantity changes and recalculate warning limit
    effect(() => {
      const stock = this.selectedStock();
      if (stock && stock.quantity) {
        if (!stock.warning_limit || stock.warning_limit === 0) {
          stock.warning_limit = (stock.total * stock.quantity) * 0.25;
        }
      }
    }, { allowSignalWrites: true });

    // Validate stock name
    effect(() => {
      const name = this.stockName();
      if (!name || !name.trim()) {
        this.nameError.set('Stok Adı Belirtmelisiniz');
      } else {
        this.nameError.set(null);
      }
    });

    // Validate stock quantity (must be greater than 0)
    effect(() => {
      const qty = this.stockQuantity();
      if (qty <= 0) {
        this.quantityError.set('Stok Miktarı 0 dan büyük olmalıdır');
      } else {
        this.quantityError.set(null);
      }
    });

    // Validate warning limit (must be between 0 and quantity)
    effect(() => {
      const warning = this.stockWarningLimit();
      const qty = this.stockQuantity();
      if (warning < 0 || warning > qty) {
        this.warningError.set('Uyarı Sınırı 0 ile miktar arasında olmalıdır');
      } else {
        this.warningError.set(null);
      }
    });

    // Validate price (must be greater than or equal to 0)
    effect(() => {
      const price = this.stockPrice();
      if (price < 0) {
        this.priceError.set('Fiyat negatif olamaz');
      } else {
        this.priceError.set(null);
      }
    });
  }

  ngOnInit() {
    this.onUpdate.set(false);
  }

  setDefault() {
    if (this.stockCatForm()) this.stockCatForm()!.reset();
    if (this.stockForm()) this.stockForm()!.reset();
    this.onUpdate.set(false);
    // Clear validation signals
    this.stockName.set('');
    this.stockQuantity.set(0);
    this.stockWarningLimit.set(0);
    this.stockPrice.set(0);
    this.nameError.set(null);
    this.quantityError.set(null);
    this.warningError.set(null);
    this.priceError.set(null);
  }

  getStockCatDetail(category: StockCategory) {
    this.selectedCat.set(category);
    if (this.stockCatDetailForm()) {
      this.stockCatDetailForm()!.form.patchValue(category);
    }
  }

  getStocks(id: string | undefined) {
    this.mainService.getAllBy('stocks', { sub_category: id }).then((result) => {
      if (result && result.docs) {
        this.stocks.set(result.docs as any);
      } else {
        this.stocks.set([]);
      }
    });
  }

  removeStock(id: string | undefined) {
    if (!id) return;
    this.messageService.sendConfirm('Kaydı Silmek Üzeresiniz. Bu İşlem Geri Alınamaz').then(isOk => {
      if (isOk) {
        this.mainService.removeData('stocks', id).then(res => {
          const currentStock = this.selectedStock();
          if (currentStock) {
            this.logService.createLog(logType.STOCK_DELETED, res.id, `${currentStock.name} adlı Stok silindi.`);
          }
          this.fillData();
          this.zone.run(() => {
            (window as any).$('#stock').modal('hide');
          });
          this.messageService.sendMessage('Stok Silindi!');
        });
      }
    })
  }

  getStockDetail(stock: Stock) {
    this.onUpdate.set(true);
    if (!stock._id) return;
    this.mainService.getData('stocks', stock._id).then(result => {
      if (this.stockForm()) {
        this.stockForm()!.form.patchValue(result);
      }
      this.selectedStock.set(stock);
      this.zone.run(() => {
        (window as any).$('#stock').modal('show');
      });
    });
  }

  addQuantity(value: any) {
    const currentStock = this.selectedStock();
    if (!currentStock) return;

    const parsedValue = parseFloat(value);
    const old_quantity = currentStock.left_total / currentStock.total;
    const new_quantity = (old_quantity + parsedValue);

    const updatedStock = {
      ...currentStock,
      quantity: new_quantity,
      left_total: currentStock.left_total + (currentStock.total * parsedValue),
      first_quantity: new_quantity,
      warning_limit: (currentStock.total * new_quantity) * 25 / 100
    };

    if (this.stockForm()) {
      this.stockForm()!.form.patchValue(updatedStock);
    }

    this.zone.run(() => {
      (window as any).$('#quantityModal').modal('hide');
    });
    this.zone.run(() => {
      (window as any).$('#stock').modal('show');
    });
  }

  addStock(stockForm: NgForm) {
    const form = stockForm.value;

    // Update validation signals from form
    this.stockName.set(form.name || '');
    this.stockQuantity.set(form.quantity || 0);
    this.stockWarningLimit.set(form.warning_limit || 0);
    this.stockPrice.set(form.price || 0);

    // Check if form is valid
    if (!this.isStockFormValid()) {
      this.messageService.sendMessage('Lütfen tüm zorunlu alanları kontrol ediniz.');
      return false;
    }

    if (form._id == undefined) {
      // Logic for adding new stock was commented out in original component
      // const left_total = form.total * form.quantity;
      // ...
    } else {
      form.warning_limit = (form.total * form.quantity) * form.warning_value / 100;
      this.mainService.updateData('stocks', form._id, form).then(() => {
        this.fillData();
        stockForm.reset();
        this.logService.createLog(logType.STOCK_UPDATED, form._id, `${form.name} adlı Stok Güncellendi.`);
        this.messageService.sendMessage('Stok Düzenlendi');
      });
    }
    this.zone.run(() => {
      (window as any).$('#stock').modal('hide');
    });
    return true;
  }

  addCategory(stockCatForm: NgForm) {
    const form = stockCatForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori İsmi Belirtmelisiniz!');
      return false;
    }
    const schema = new StockCategory(form.name, form.description);
    this.mainService.addData('stocks_cat', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Oluşturuldu.');
      stockCatForm.reset();
    });
    this.zone.run(() => {
      (window as any).$('#stockCat').modal('hide');
    });
    return true;
  }

  updateCategory(formElement: NgForm) {
    const form = formElement.value;
    this.mainService.updateData('stocks_cat', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Stok Kategorisi Güncellendi.');
      this.selectedCat.set(undefined);
    });
  }

  removeCategory(id: string) {
    const isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Stoklarda Silinecektir.');
    if (isOk) {
      this.mainService.removeData('stocks_cat', id).then(() => {
        this.mainService.getAllBy('stocks', { cat_id: id }).then(result => {
          if (result && result.docs) {
            const data = result.docs;
            if (data.length > 0) {
              data.forEach((element: any) => {
                if (element._id) {
                  this.mainService.removeData('stocks', element._id);
                }
              });
            }
          }
          this.messageService.sendMessage('Stok Kategorisi ve Bağlı Stoklar Silindi.');
          this.selectedCat.set(undefined);
          this.fillData();
        });
      });
    }
  }

  filterStocks(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('stocks', { name: { $regex: regexp } }).then(res => {
      if (res && res.docs) {
        const sorted = (res.docs as any).sort((a: any, b: any) => a.left_total - b.left_total);
        this.stocks.set(sorted);
      } else {
        this.stocks.set([]);
      }
    });
  }

  fillData() {
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      if (result && result.docs) {
        this.categories.set(result.docs as any);
      } else {
        this.categories.set([]);
      }
    });
    this.mainService.getAllBy('stocks', {}).then(result => {
      if (result && result.docs) {
        const sorted = (result.docs as any).sort((a: any, b: any) => b.timestamp - a.timestamp);
        this.stocks.set(sorted);
      } else {
        this.stocks.set([]);
      }
    })
  }
}
