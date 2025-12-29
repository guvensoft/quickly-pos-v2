import { Component, ElementRef, OnInit, inject, signal, viewChild, computed, effect, NgZone, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Printer } from '../../../core/models/settings.model';
import { Category, Ingredient, Product, ProductSpecs, Recipe, SubCategory } from '../../../core/models/product.model';
import { Report } from '../../../core/models/report.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { SignalValidatorService } from '../../../core/services/signal-validator.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-menu-settings',
  templateUrl: './menu-settings.component.html',
  styleUrls: ['./menu-settings.component.scss']
})
export class MenuSettingsComponent implements OnInit {
  private readonly mainService = inject(MainService);
  private readonly messageService = inject(MessageService);
  private readonly logService = inject(LogService);
  private readonly validatorService = inject(SignalValidatorService);
  private readonly zone = inject(NgZone);

  readonly categories = signal<Array<Category>>([]);
  readonly sub_categories = signal<Array<SubCategory>>([]);
  readonly products = signal<Array<Product>>([]);
  readonly stocks = signal<Array<any>>([]);
  readonly onUpdate = signal<boolean>(false);
  readonly hasRecipe = signal<boolean>(false);
  readonly selectedId = signal<string | undefined>(undefined);
  readonly recipe = signal<Array<Ingredient>>([]);
  readonly recipeId = signal<string | undefined>(undefined);
  readonly stockUnit = signal<string>('Birim');
  readonly stockName = signal<string>('');
  readonly productType = signal<number>(1);
  readonly productRecipe = signal<Array<Ingredient>>([]);

  // Input to trigger component recreation when parent selection changes
  readonly key = input<number | undefined>(undefined);
  readonly recipesTable = signal<Array<any>>([]);
  readonly oldRecipes = signal<Array<any>>([]);
  readonly selectedProduct = signal<Product | undefined>(undefined);
  readonly selectedCat = signal<Category | undefined>(undefined);
  readonly selectedSubCat = signal<SubCategory | undefined>(undefined);
  readonly subCats = signal<Array<SubCategory>>([]);
  readonly printers = signal<Array<Printer>>([]);
  readonly productSpecs = signal<Array<ProductSpecs>>([]);

  // Product validation signals
  readonly productName = signal<string>('');
  readonly productCategory = signal<string>('');
  readonly productPrice = signal<number>(0);
  readonly productTaxValue = signal<number>(0);

  // Product validation error signals
  readonly productNameError = signal<string | null>(null);
  readonly productCategoryError = signal<string | null>(null);
  readonly productPriceError = signal<string | null>(null);
  readonly productTaxError = signal<string | null>(null);

  catDetails = viewChild<NgForm>('catDetails');
  subCatForm = viewChild<NgForm>('subCatForm');
  productForm = viewChild<NgForm>('productForm');
  categoryForm = viewChild<NgForm>('categoryForm');
  recipesForm = viewChild<NgForm>('recipesForm');
  productTypeSelect = viewChild<ElementRef>('productTypeSelect');

  // Computed properties for reactive filtering and derived state
  readonly productsByCategory = computed(() => {
    const catId = this.selectedCat()?._id;
    if (!catId) return this.products();
    return this.products().filter(p => p.cat_id === catId);
  });

  readonly subCategoriesBySelected = computed(() => {
    const catId = this.selectedCat()?._id;
    if (!catId) return [];
    return this.sub_categories().filter(s => s.cat_id === catId);
  });

  readonly totalRecipeItems = computed(() => {
    return this.productRecipe().length + this.oldRecipes().length;
  });

  readonly canAddRecipe = computed(() => {
    return this.productType() === 1;
  });

  readonly productTypeLabel = computed(() => {
    const type = this.productType();
    return type === 1 ? 'Hazırlanmış' : 'Manuel';
  });

  // Product form validation computed property
  readonly isProductFormValid = computed(() => {
    return !this.productNameError() && !this.productCategoryError() &&
           !this.productPriceError() && !this.productTaxError();
  });

  constructor() {
    this.fillData();

    // Reset recipe when product type changes to 2 (manual mode)
    effect(() => {
      const type = this.productType();
      if (type === 2) {
        this.productSpecs.set([]);
      }
    }, { allowSignalWrites: true });

    // Sync recipe validation when recipe items change
    effect(() => {
      const recipeItems = this.productRecipe();
      const oldItems = this.oldRecipes();
      const totalItems = recipeItems.length + oldItems.length;
      if (totalItems === 0) {
        this.hasRecipe.set(false);
      } else {
        this.hasRecipe.set(true);
      }
    }, { allowSignalWrites: true });

    // Validate product name
    effect(() => {
      const name = this.productName();
      if (!name || (typeof name === 'string' && !name.trim())) {
        this.productNameError.set('Ürün Adı Belirtmelisiniz');
      } else {
        this.productNameError.set(null);
      }
    });

    // Validate product category
    effect(() => {
      const catId = this.productCategory();
      if (!catId) {
        this.productCategoryError.set('Kategori Seçmelisiniz');
      } else {
        this.productCategoryError.set(null);
      }
    });

    // Validate product price (must be greater than 0)
    effect(() => {
      const price = this.productPrice();
      if (price <= 0) {
        this.productPriceError.set('Fiyat 0 dan büyük olmalıdır');
      } else {
        this.productPriceError.set(null);
      }
    });

    // Validate tax value (must be between 0 and 100)
    effect(() => {
      const tax = this.productTaxValue();
      if (tax < 0 || tax > 100) {
        this.productTaxError.set('KDV Değeri 0 ile 100 arasında olmalıdır');
      } else {
        this.productTaxError.set(null);
      }
    });
  }

  ngOnInit() {
    this.stockUnit.set('Birim');
    this.productRecipe.set([]);
    this.productSpecs.set([]);
    this.recipesTable.set([]);
    this.oldRecipes.set([]);
    this.recipe.set([]);
    this.onUpdate.set(false);
    this.hasRecipe.set(false);
  }

  getCategory(category: any) {
    this.selectedCat.set(category);
    if (this.catDetails()) {
      this.catDetails()!.form.patchValue(category);
    }
    this.mainService.getAllBy('sub_categories', { cat_id: category._id }).then((res: any) => {
      this.zone.run(() => {
        this.subCats.set(res.docs);
      });
    });
  }

  getSubCategories(id: string) {
    this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
      this.zone.run(() => {
        this.subCats.set(res.docs);
      });
    });
  }

  getProductsByCategory(id: string | null) {
    if (!id) {
      this.mainService.getAllBy('products', {}).then((res: any) => {
        this.zone.run(() => {
          this.setDefault();
          const sorted = [...res.docs].sort((a: any, b: any) => a.price - b.price);
          this.products.set(sorted);
        });
      });
    } else {
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
        this.zone.run(() => {
          this.sub_categories.set(res.docs);
        });
      });
      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
        this.zone.run(() => {
          const sorted = [...result.docs].sort((a: any, b: any) => a.price - b.price);
          this.products.set(sorted);
        });
      });
    }
  }

  getProductsBySubCat(id: string) {
    this.mainService.getAllBy('products', { subcat_id: id }).then((result: any) => {
      this.zone.run(() => {
        const sorted = [...result.docs].sort((a: any, b: any) => a.price - b.price);
        this.products.set(sorted);
      });
    });
  }

  addCategory(categoryForm: NgForm) {
    const form = categoryForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori Adı Belirtmelisiniz');
      return false;
    }
    const schema = new Category(form.name, form.description || '', 1, form.printer || '', 0, form.tags || []);
    this.mainService.addData('categories', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Oluşturuldu');
    })
    categoryForm.reset();
    this.zone.run(() => {
      (window as any).$('#categoryModal').modal('hide');
    });
    return true;
  }

  updateCategory(catDetails: NgForm) {
    const form = catDetails.value;
    this.mainService.updateData('categories', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Düzenlendi');
      this.selectedCat.set(undefined);
    });
  }

  removeCategory(id: string) {
    const isOk = confirm('Kategoriyi Silmek Üzerisiniz. Kategoriye Dahil Olan Ürünlerde Silinecektir.');
    if (isOk) {
      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
        const data = result.docs
        if (data.length > 0) {
          for (const item of data) {
            this.mainService.removeData('products', item._id);
            this.mainService.getAllBy('reports', { connection_id: item._id }).then((res: any) => {
              if (res.docs.length > 0)
                this.mainService.removeData('reports', res.docs[0]._id);
            });
            this.mainService.getAllBy('recipes', { product_id: item._id }).then((res: any) => {
              if (res.docs.length > 0)
                this.mainService.removeData('recipes', res.docs[0]._id);
            });
          }
        }
      });
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
        const data = res.docs;
        if (data.length > 0) {
          for (const item of data) {
            this.mainService.removeData('sub_categories', item._id);
          }
        }
      });
      this.mainService.removeData('categories', id).then(() => {
        this.selectedCat.set(undefined);
        this.messageService.sendMessage('Kategori ve Ürünler Silindi');
        this.fillData();
      });
    }
  }

  addSubCategory(subCatForm: NgForm) {
    const form = subCatForm.value;
    const cat = this.selectedCat();
    if (!cat) return false;

    if (!form._id) {
      const schema = new SubCategory(cat._id!, form.name, form.description || '', 1);
      this.mainService.addData('sub_categories', schema).then(res => {
        this.getCategory(cat);
      });
    } else {
      this.mainService.updateData('sub_categories', form._id, form).then(res => {
        this.getCategory(cat);
      });
    }
    this.selectedSubCat.set(undefined);
    this.onUpdate.set(false);
    subCatForm.reset();
    this.zone.run(() => {
      (window as any).$('#subCatModal').modal('hide');
    });
    return true;
  }

  updateSubCategory(subCat: SubCategory) {
    this.selectedSubCat.set(subCat);
    this.onUpdate.set(true);
    if (this.subCatForm()) {
      this.subCatForm()!.form.patchValue(subCat);
    }
    this.zone.run(() => {
      (window as any).$('#subCatModal').modal('show');
    });
  }

  removeSubCategory(id: string) {
    this.mainService.removeData('sub_categories', id).then(res => {
      const cat = this.selectedCat();
      if (cat) this.getCategory(cat);
      this.onUpdate.set(false);
    });
    if (this.subCatForm()) this.subCatForm()!.reset();
    this.zone.run(() => {
      (window as any).$('#subCatModal').modal('hide');
    });
  }

  addProduct(productForm: NgForm) {
    const form = productForm.value;

    // Update validation signals from form
    this.productName.set(form.name || '');
    this.productCategory.set(form.cat_id || '');
    this.productPrice.set(form.price || 0);
    this.productTaxValue.set(form.tax_value || 0);

    // Check if form is valid
    if (!this.isProductFormValid()) {
      this.messageService.sendMessage('Gerekli Alanları Doldurmalısınız');
      return false;
    }

    if (form.type == 2 && this.oldRecipes().length == 0) {
      if (form.type == 2 && this.productRecipe().length == 0) {
        this.messageService.sendMessage('Stok Girişi Yapmalısınız!');
        return false;
      }
    }
    const specs = this.productSpecs();
    const recipeItems = this.productRecipe();
    const schema = new Product(form.cat_id, form.type, form.description || '', form.name, form.price, 1, form.tax_value, form.barcode || '', form.notes || '', form.subcat_id || '', specs, form._id, form._rev);
    if (form._id == undefined) {
      this.mainService.addData('products', schema).then((response: any) => {
        this.mainService.addData('reports', new Report('Product', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), schema.name, Date.now())).then((res: any) => {
          this.logService.createLog(logType.PRODUCT_CREATED, res.id, `${form.name} adlı Ürün Oluşturuldu`)
        });
        if (recipeItems.length > 0) {
          const recipeSchema = new Recipe(response.id, recipeItems);
          this.mainService.addData('recipes', recipeSchema);
        }
        this.messageService.sendMessage('Ürün Oluşturuldu');
      });
    } else {
      this.mainService.updateData('products', form._id, schema).then((res: any) => {
        if (res.ok) {
          this.logService.createLog(logType.PRODUCT_UPDATED, res.id, `${form.name} adlı Ürün Güncellendi`);
          if (recipeItems.length > 0) {
            const currentRecipeId = this.recipeId();
            if (this.recipe().length == 0) {
              const recipeSchema = new Recipe(form._id, recipeItems);
              this.mainService.addData('recipes', recipeSchema);
            } else if (currentRecipeId) {
              const combined = this.recipe().concat(recipeItems);
              this.mainService.updateData('recipes', currentRecipeId, { recipe: combined });
            }
          }
          this.messageService.sendMessage('Ürün Düzenlendi');
        }
      });
    }
    if (this.recipesForm()) this.recipesForm()!.reset();
    if (this.productForm()) this.productForm()!.reset();
    this.zone.run(() => {
      (window as any).$('#productModal').modal('hide');
    });
    return true;
  }

  updateProduct(id: string) {
    this.selectedId.set(id);
    this.productRecipe.set([]);
    this.recipesTable.set([]);
    this.oldRecipes.set([]);
    this.recipe.set([]);
    this.productSpecs.set([]);
    this.onUpdate.set(true);

    this.mainService.getData('products', id).then((result: any) => {
      this.selectedProduct.set(result);
      this.mainService.getAllBy('sub_categories', { cat_id: result.cat_id }).then((res: any) => {
        this.subCats.set(res.docs);
      });
      result.note = "";
      if (result.specifies == undefined || result.specifies == '') {
        result.specifies = [];
      }
      this.productSpecs.set(result.specifies);
      if (result.subcat_id == undefined) {
        result.subcat_id = "";
      }
      if (!result.notes) {
        result.notes = '';
      }
      this.productType.set(result.type);
      if (this.productForm()) {
        this.productForm()!.form.patchValue(result);
      }
      this.zone.run(() => {
        (window as any).$('#productModal').modal('show');
      });
    });

    this.mainService.getAllBy('recipes', { product_id: id }).then((result: any) => {
      if (result.docs.length > 0) {
        this.hasRecipe.set(true);
        this.recipeId.set(result.docs[0]._id);
        const recipes = result.docs[0].recipe;
        this.recipe.set(recipes);
        for (const item of recipes) {
          this.mainService.getData('stocks', item.stock_id).then((res: any) => {
            this.zone.run(() => {
              this.oldRecipes.update(prev => [...prev, { id: item.stock_id, name: res.name, amount: item.amount, unit: res.unit }]);
            });
          });
        }
      } else {
        this.hasRecipe.set(false);
      }
    });
  }

  removeProduct() {
    const isOk = confirm('Ürünü Silmek Üzerisiniz..');
    const id = this.selectedId();
    if (isOk && id) {
      this.mainService.removeData('products', id).then((result) => {
        const productName = this.productForm() ? this.productForm()!.value.name : 'Ürün';
        this.logService.createLog(logType.PRODUCT_DELETED, result.id, `${productName} adlı Ürün Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then((res: any) => {
          if (res.docs.length > 0)
            this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.mainService.getAllBy('recipes', { product_id: result.id }).then((res: any) => {
          if (res.docs.length > 0)
            this.mainService.removeData('recipes', res.docs[0]._id);
        });
        this.messageService.sendMessage('Ürün Silindi!');
      });
    }
  }

  setProductType(value: any) {
    this.productType.set(value);
    if (value == 2) {
      const currentOld = this.oldRecipes();
      if (currentOld.length > 1) {
        const isOK = confirm('Manuel Stok tipi için tek bir Stok kaydı girebilirsiniz. 2. Stok ve Ürün Durumları silinecektir.');
        if (isOK) {
          const recipeWillLost = currentOld[currentOld.length - 1];
          this.removeRecipe('old', recipeWillLost.id);
        } else {
          this.productType.set(1);
          if (this.productTypeSelect()) this.productTypeSelect()!.nativeElement.value = 1;
        }
      }
      this.productRecipe.update(prev => prev.slice(0, -1));
      this.recipesTable.update(prev => prev.slice(0, -1));
      this.productSpecs.set([]);
    }
  }

  addSpecies(speciesForm: NgForm) {
    const form = speciesForm.value;
    if (form.spec_name == '' || form.spec_name == null || form.spec_price < 0 || form.spec_price == undefined) {
      this.messageService.sendMessage('Durum Notu ve Fiyatı Boş Bırakılamaz');
      return false;
    }
    const spec = new ProductSpecs(form.spec_name, form.spec_price);
    this.productSpecs.update(prev => [...prev, spec]);
    speciesForm.reset();
    return true;
  }

  removeSpecies(index: number) {
    this.productSpecs.update(prev => {
      const copy = [...prev];
      copy.splice(index, 1);
      return copy;
    });
  }

  addRecipe(recipesForm: NgForm) {
    const form = recipesForm.value;
    if (!form.stock_id) {
      this.messageService.sendMessage('Stok Seçimi Yapmalısınız!');
      return false;
    }
    if (!form.amount || form.amount == 0) {
      this.messageService.sendMessage('Birim Miktarı Girmelisiniz!');
      return false;
    }
    const item = new Ingredient(form.stock_id, form.amount);
    this.mainService.getData('stocks', form.stock_id).then((result: any) => {
      if (this.productRecipe().find((r: any) => r.stock_id == form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else if (this.oldRecipes().find((r: any) => r.id == form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else {
        this.productRecipe.update(prev => [...prev, item]);
        this.recipesTable.update(prev => [...prev, { id: form.stock_id, name: this.stockName(), amount: form.amount, unit: this.stockUnit() }]);
        this.hasRecipe.set(true);
      }
      recipesForm.reset();
    });
    return true;
  }

  removeRecipe(type: string, id: string) {
    switch (type) {
      case 'new':
        this.productRecipe.update(prev => prev.filter(item => item.stock_id != id));
        this.recipesTable.update(prev => prev.filter(item => item.id != id));
        if (this.recipesTable().length == 0 && this.oldRecipes().length == 0) {
          this.hasRecipe.set(false);
        }
        break;
      case 'old':
        this.recipe.update(prev => prev.filter(item => item.stock_id != id));
        this.productRecipe.update(prev => prev.filter(item => item.stock_id != id));
        this.oldRecipes.update(prev => prev.filter(item => item.id != id));
        const currentRecipeId = this.recipeId();
        if (this.oldRecipes().length == 0) {
          if (this.recipesTable().length == 0) {
            this.hasRecipe.set(false);
          }
          if (currentRecipeId) this.mainService.removeData('recipes', currentRecipeId);
        } else if (currentRecipeId) {
          this.mainService.updateData('recipes', currentRecipeId, { recipe: this.recipe() });
        }
        break;
    }
  }

  onStockChange(value: any) {
    this.mainService.getData('stocks', value).then((result: any) => {
      this.stockUnit.set(result.unit);
      this.stockName.set(result.name);
    });
  }

  filterProducts(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then((res: any) => {
      this.zone.run(() => {
        const sorted = [...res.docs].sort((a: any, b: any) => a.price - b.price);
        this.products.set(sorted);
      });
    });
  }

  setDefault() {
    this.productRecipe.set([]);
    this.productSpecs.set([])
    this.recipesTable.set([]);
    this.oldRecipes.set([]);
    this.recipe.set([]);
    this.subCats.set([]);
    this.sub_categories.set([]);
    this.selectedProduct.set(undefined);
    this.selectedCat.set(undefined);
    this.selectedSubCat.set(undefined);
    this.selectedId.set(undefined);
    this.onUpdate.set(false);
    this.hasRecipe.set(false);
    // Clear validation signals
    this.productName.set('');
    this.productCategory.set('');
    this.productPrice.set(0);
    this.productTaxValue.set(0);
    this.productNameError.set(null);
    this.productCategoryError.set(null);
    this.productPriceError.set(null);
    this.productTaxError.set(null);

    if (this.productForm()) this.productForm()!.reset();
    if (this.catDetails()) this.catDetails()!.reset();
    if (this.categoryForm()) this.categoryForm()!.reset();
    if (this.subCatForm()) this.subCatForm()!.reset();
  }

  fillData() {
    this.mainService.getAllBy('categories', {}).then((result: any) => {
      this.zone.run(() => this.categories.set(result.docs));
    });
    this.mainService.getAllBy('products', {}).then((result: any) => {
      this.zone.run(() => {
        const sorted = [...result.docs].sort((a: any, b: any) => a.price - b.price);
        this.products.set(sorted);
      });
    });
    this.mainService.getAllBy('stocks', {}).then((result: any) => {
      this.zone.run(() => this.stocks.set(result.docs));
    });
    this.mainService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
      this.zone.run(() => {
        if (res.docs && res.docs.length > 0) {
          this.printers.set(res.docs[0].value);
        } else {
          this.printers.set([]);
        }
      });
    });
  }
}
