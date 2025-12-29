import { Component, OnInit, inject, signal, viewChild, computed, effect, NgZone, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Stock, StockCategory } from '../../../core/models/stocks.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SignalValidatorService } from '../../../core/services/signal-validator.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';
import { DialogFacade } from '../../../../core/services/dialog.facade';

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
  private readonly dialogFacade = inject(DialogFacade);

  readonly categories = signal<Array<StockCategory>>([]);
  readonly stocks = signal<Array<Stock>>([]);
  readonly selectedStock = signal<Stock | undefined>(undefined);
  readonly selectedCat = signal<StockCategory | undefined>(undefined);
  readonly onUpdate = signal<boolean>(false);
  readonly units = signal<Array<string>>(['Gram', 'Mililitre', 'Adet']);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);

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
      if (!name || (typeof name === 'string' && !name.trim())) {
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
      this.zone.run(() => {
        if (result && result.docs) {
          this.stocks.set(result.docs as any);
        } else {
          this.stocks.set([]);
        }
      });
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
          this.selectedStock.set(undefined);
          this.messageService.sendMessage('Stok Silindi!');
        });
      }
    })
  }

  getStockDetail(stock: Stock) {
    this.onUpdate.set(true);
    if (!stock._id) return;
    this.mainService.getData('stocks', stock._id).then(result => {
      this.selectedStock.set(result as any);
      this.dialogFacade.openStockModal(result).closed.subscribe((formData: any) => {
        if (formData && stock._id) {
          this.submitStockForm(formData, stock._id);
        }
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

    this.selectedStock.set(updatedStock as any);
  }

  setDefaultStock() {
    this.onUpdate.set(false);
    if (this.stockForm()) this.stockForm()!.reset();
    // Clear validation signals
    this.stockName.set('');
    this.stockQuantity.set(0);
    this.stockWarningLimit.set(0);
    this.stockPrice.set(0);
    this.nameError.set(null);
    this.quantityError.set(null);
    this.warningError.set(null);
    this.priceError.set(null);

    this.dialogFacade.openStockModal().closed.subscribe((formData: any) => {
      if (formData) {
        this.submitStockForm(formData, null);
      }
    });
  }

  private submitStockForm(formData: any, stockId: string | null) {
    // Update validation signals from form
    this.stockName.set(formData.name || '');
    this.stockQuantity.set(formData.quantity || 0);
    this.stockWarningLimit.set(formData.warning_limit || 0);
    this.stockPrice.set(formData.price || 0);

    // Check if form is valid
    if (!this.isStockFormValid()) {
      this.messageService.sendMessage('Lütfen tüm zorunlu alanları kontrol ediniz.');
      return;
    }

    if (stockId === null) {
      // Add new stock - logic was commented out in original
      this.messageService.sendMessage('Stok ekleme özelliği şu anda aktif değildir.');
    } else {
      // Update existing stock
      formData.warning_limit = (formData.total * formData.quantity) * (formData.warning_value || 25) / 100;
      this.mainService.updateData('stocks', stockId, formData).then(() => {
        this.fillData();
        this.logService.createLog(logType.STOCK_UPDATED, stockId, `${formData.name} adlı Stok Güncellendi.`);
        this.messageService.sendMessage('Stok Düzenlendi');
        this.selectedStock.set(undefined);
      });
    }
  }

  setDefaultCategory() {
    if (this.stockCatForm()) this.stockCatForm()!.reset();

    this.dialogFacade.openStockCategoryModal().closed.subscribe((formData: any) => {
      if (formData) {
        this.submitCategoryForm(formData, null);
      }
    });
  }

  private submitCategoryForm(formData: any, categoryId: string | null) {
    if (!formData.name) {
      this.messageService.sendMessage('Kategori İsmi Belirtmelisiniz!');
      return;
    }

    if (categoryId === null) {
      // Add new category
      const schema = new StockCategory(formData.name, formData.description);
      this.mainService.addData('stocks_cat', schema).then(() => {
        this.fillData();
        this.messageService.sendMessage('Stok Kategorisi Oluşturuldu.');
      });
    }
  }

  // Template compatibility methods - delegate to modal-based approach
  addCategory(stockCatForm: NgForm) {
    this.setDefaultCategory();
    return true;
  }

  addStock(stockForm: NgForm) {
    this.setDefaultStock();
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
      this.zone.run(() => {
        if (res && res.docs) {
          const sorted = (res.docs as any).sort((a: any, b: any) => a.left_total - b.left_total);
          this.stocks.set(sorted);
        } else {
          this.stocks.set([]);
        }
      });
    });
  }

  fillData() {
    this.mainService.getAllBy('stocks_cat', {}).then(result => {
      this.zone.run(() => {
        if (result && result.docs) {
          this.categories.set(result.docs as any);
        } else {
          this.categories.set([]);
        }
      });
    });
    this.mainService.getAllBy('stocks', {}).then(result => {
      this.zone.run(() => {
        if (result && result.docs) {
          const sorted = (result.docs as any).sort((a: any, b: any) => b.timestamp - a.timestamp);
          this.stocks.set(sorted);
        } else {
          this.stocks.set([]);
        }
      });
    })
  }
}
