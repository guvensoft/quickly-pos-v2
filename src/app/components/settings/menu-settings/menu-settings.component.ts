import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgForm } from '@angular/forms';
import { Printer } from 'app/core/models/settings.model';
import { Category, Ingredient, Product, ProductSpecs, Recipe, SubCategory } from '../../../core/models/product.model';
import { Report } from '../../../core/models/report.model';
import { MessageService } from '../../../core/services/message.service';
import { LogService, logType } from '../../../core/services/log.service';
import { MainService } from '../../../core/services/main.service';
import { GeneralPipe } from '../../../shared/pipes/general.pipe';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, GeneralPipe],
  selector: 'app-menu-settings',
  templateUrl: './menu-settings.component.html',
  styleUrls: ['./menu-settings.component.scss']
})

export class MenuSettingsComponent implements OnInit {
  categories!: Array<Category>;
  sub_categories!: Array<SubCategory>;
  products!: Array<Product>;
  stocks!: Array<any>;
  onUpdate!: boolean;
  hasRecipe!: boolean;
  selectedId!: string;
  recipe!: Array<Ingredient>;
  recipeId!: string;
  stockUnit!: string;
  stockName!: string;
  productType!: number;
  productRecipe!: Array<Ingredient>;
  recipesTable!: Array<any>;
  oldRecipes!: Array<any>;
  selectedProduct!: Product;
  selectedCat!: Category;
  selectedSubCat!: SubCategory;
  subCats: Array<SubCategory> = [];
  printers!: Array<Printer>;
  productSpecs!: Array<ProductSpecs>;

  @ViewChild('catDetails') catDetails!: NgForm;
  @ViewChild('subCatForm') subCatForm!: NgForm;
  @ViewChild('productForm') productForm!: NgForm;
  @ViewChild('categoryForm') categoryForm!: NgForm;
  @ViewChild('recipesForm') recipesForm!: NgForm;
  @ViewChild('productTypeSelect') productTypeSelect!: ElementRef;

  constructor(private mainService: MainService, private messageService: MessageService, private logService: LogService) {
    this.fillData();
  }

  ngOnInit() {
    this.stockUnit = 'Birim';
    this.productRecipe = [];
    this.productSpecs = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.onUpdate = false;
    this.hasRecipe = false;
  }

  getCategory(category: any) {
    this.selectedCat = category;
    if (this.catDetails) {
      this.catDetails.setValue(category);
    }
    this.mainService.getAllBy('sub_categories', { cat_id: category._id }).then((res: any) => {
      this.subCats = res.docs;
    });
  }

  getSubCategories(id: string) {
    this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
      this.subCats = res.docs;
    });
  }

  getProductsByCategory(id: string | null) {
    if (!id) {
      this.mainService.getAllBy('products', {}).then((res: any) => {
        this.setDefault();
        this.products = res.docs;
        this.products = this.products.sort((a: any, b: any) => a.price - b.price);
      });
    } else {
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
        this.sub_categories = res.docs;
      });
      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
        this.products = result.docs;
        this.products = this.products.sort((a: any, b: any) => a.price - b.price);
      });
    }
  }

  getProductsBySubCat(id: string) {
    this.mainService.getAllBy('products', { subcat_id: id }).then((result: any) => {
      this.products = result.docs;
      this.products = this.products.sort((a: any, b: any) => a.price - b.price);
    });
  }

  addCategory(categoryForm: NgForm) {
    const form = categoryForm.value;
    if (!form.name) {
      this.messageService.sendMessage('Kategori Adı Belirtmelisiniz');
      return false;
    }
    if (!form.printer) {
      form.printer = '';
    }
    const schema = new Category(form.name, form.description, 1, form.printer, 0, form.tags);
    this.mainService.addData('categories', schema).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Oluşturuldu');
    })
    categoryForm.reset();
    (window as any).$('#categoryModal').modal('hide');
  }

  updateCategory(catDetails: NgForm) {
    const form = catDetails.value;
    this.mainService.updateData('categories', form._id, form).then(() => {
      this.fillData();
      this.messageService.sendMessage('Kategori Düzenlendi');
      this.selectedCat = undefined!;
    });
  }

  removeCategory(id: string) {
    const isOk = confirm('Kategoriyi Silmek Üzeresiniz. Kategoriye Dahil Olan Ürünlerde Silinecektir.');
    if (isOk) {
      this.mainService.getAllBy('products', { cat_id: id }).then((result: any) => {
        const data = result.docs
        if (data.length > 0) {
          for (const prop in data) {
            this.mainService.removeData('products', data[prop]._id);
            this.mainService.getAllBy('reports', { connection_id: data[prop]._id }).then((res: any) => {
              if (res.docs.length > 0)
                this.mainService.removeData('reports', res.docs[0]._id);
            });
            this.mainService.getAllBy('recipes', { product_id: data[prop]._id }).then((res: any) => {
              if (res.docs.length > 0)
                this.mainService.removeData('recipes', res.docs[0]._id);
            });
          }
        }
      });
      this.mainService.getAllBy('sub_categories', { cat_id: id }).then((res: any) => {
        const data = res.docs;
        if (data.length > 0) {
          for (const prop in data) {
            this.mainService.removeData('sub_categories', data[prop]._id);
          }
        }
      });
      this.mainService.removeData('categories', id).then(() => {
        this.selectedCat = undefined!;
        this.messageService.sendMessage('Kategori ve Ürünler Silindi');
        this.fillData();
      });
    }
  }

  addSubCategory(subCatForm: NgForm) {
    const form = subCatForm.value;
    if (form._id == '' || form._id == undefined || form._id == null) {
      const schema = new SubCategory(this.selectedCat._id!, form.name, form.description, 1);
      this.mainService.addData('sub_categories', schema).then(res => {
        this.getCategory(this.selectedCat);
      });
    } else {
      this.mainService.updateData('sub_categories', form._id, form).then(res => {
        this.getCategory(this.selectedCat);
      });
    }
    this.selectedSubCat = undefined!;
    this.onUpdate = false;
    subCatForm.reset();
    (window as any).$('#subCatModal').modal('hide');
  }

  updateSubCategory(subCat: SubCategory) {
    this.selectedSubCat = subCat;
    this.onUpdate = true;
    if (this.subCatForm) {
      this.subCatForm.setValue(subCat);
    }
    (window as any).$('#subCatModal').modal('show');
  }

  removeSubCategory(id: string) {
    this.mainService.removeData('sub_categories', id).then(res => {
      this.getCategory(this.selectedCat);
      this.onUpdate = false;
    });
    this.subCatForm.reset();
    (window as any).$('#subCatModal').modal('hide');
  }

  addProduct(productForm: NgForm) {
    const form = productForm.value;
    if (!form.name || !form.cat_id || !form.price || !form.tax_value) {
      this.messageService.sendMessage('Gerekli Alanları Doldurmalısınız');
      return false;
    }
    if (form.type == 2 && this.oldRecipes.length == 0) {
      if (form.type == 2 && this.productRecipe.length == 0) {
        this.messageService.sendMessage('Stok Girişi Yapmalısınız!');
        return false;
      }
    }
    const schema = new Product(form.cat_id, form.type, form.description, form.name, form.price, 1, form.tax_value, form.barcode, form.notes, form.subcat_id, this.productSpecs, form._id, form._rev);
    if (form._id == undefined) {
      this.mainService.addData('products', schema).then((response: any) => {
        this.mainService.addData('reports', new Report('Product', response.id, 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], new Date().getMonth(), new Date().getFullYear(), schema.name, Date.now())).then((res: any) => {
          this.logService.createLog(logType.PRODUCT_CREATED, res.id, `${form.name} adlı Ürün Oluşturuldu`)
        });
        if (this.productRecipe.length > 0) {
          const schema = new Recipe(response.id, this.productRecipe);
          this.mainService.addData('recipes', schema);
        }
        // this.fillData();
        this.messageService.sendMessage('Ürün Oluşturuldu');
      });
    } else {
      this.mainService.updateData('products', form._id, schema).then((res: any) => {
        if (res.ok) {
          this.logService.createLog(logType.PRODUCT_UPDATED, res.id, `${form.name} adlı Ürün Güncellendi`);
          if (this.productRecipe.length > 0) {
            if (this.recipe.length == 0) {
              const schema = new Recipe(form._id, this.productRecipe);
              this.mainService.addData('recipes', schema);
            } else {
              this.productRecipe = this.productRecipe.concat(this.recipe);
              this.mainService.updateData('recipes', this.recipeId, { recipe: this.productRecipe });
            }
          }
          // this.fillData();
          this.messageService.sendMessage('Ürün Düzenlendi');
        }
      });
    }
    this.recipesForm.reset();
    this.productForm.reset();
    (window as any).$('#productModal').modal('hide');
    return true;
  }

  updateProduct(id: string) {
    this.selectedId = id;
    this.productRecipe = [];
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.productSpecs = [];
    this.onUpdate = true;
    this.mainService.getData('products', id).then((result: any) => {
      this.selectedProduct = result;
      this.mainService.getAllBy('sub_categories', { cat_id: result.cat_id }).then((res: any) => {
        this.subCats = res.docs;
      });
      result.note = "";
      if (result.specifies == undefined || result.specifies == '') {
        result.specifies = [];
      }
      this.productSpecs = result.specifies;
      if (result.subcat_id == undefined) {
        result.subcat_id = "";
      }
      if (!result.notes) {
        result.notes = '';
      }
      this.productType = result.type;
      if (this.productForm) {
        this.productForm.setValue(result);
      }
      (window as any).$('#productModal').modal('show');
    });
    this.mainService.getAllBy('recipes', { product_id: id }).then((result: any) => {
      if (result.docs.length > 0) {
        this.hasRecipe = true;
        this.recipeId = result.docs[0]._id;
        const recipes = result.docs[0].recipe;
        this.recipe = result.docs[0].recipe;
        for (const prop in recipes) {
          this.mainService.getData('stocks', recipes[prop].stock_id).then((result: any) => {
            this.oldRecipes.push({ id: recipes[prop].stock_id, name: result.name, amount: recipes[prop].amount, unit: result.unit });
          });
        }
      } else {
        this.hasRecipe = false;
      }
    });
  }

  removeProduct() {
    const isOk = confirm('Ürünü Silmek Üzerisiniz..');
    if (isOk) {
      this.mainService.removeData('products', this.selectedId).then((result) => {
        this.logService.createLog(logType.PRODUCT_DELETED, result.id, `${this.productForm.value.name} adlı Ürün Silindi`);
        this.mainService.getAllBy('reports', { connection_id: result.id }).then((res: any) => {
          if (res.docs.length > 0)
            this.mainService.removeData('reports', res.docs[0]._id);
        });
        this.mainService.getAllBy('recipes', { product_id: result.id }).then((res: any) => {
          if (res.docs.length > 0)
            this.mainService.removeData('recipes', res.docs[0]._id);
        });
        this.messageService.sendMessage('Ürün Silindi!');
        // this.fillData();
      });
    }
  }

  setProductType(value: any) {
    this.productType = value;
    if (value == 2) {
      if (this.oldRecipes.length > 1) {
        const isOK = confirm('Manuel Stok tipi için tek bir Stok kaydı girebilirsiniz. 2. Stok ve Ürün Durumları silinecektir.');
        if (isOK) {
          const recipeWillLost = this.oldRecipes.pop();
          this.removeRecipe('old', recipeWillLost.id);
        } else {
          this.productType = 1;
          this.productTypeSelect.nativeElement.value = 1;
        }
      }
      if (this.productRecipe.length > 0) {
        this.productRecipe.pop();
        this.recipesTable.pop();
      }
      this.productSpecs = [];
    }
  }

  addSpecies(speciesForm: NgForm) {
    const form = speciesForm.value;
    if (form.spec_name == '' || form.spec_name == null || form.spec_price <= 0 || form.spec_price == undefined) {
      this.messageService.sendMessage('Durum Notu ve Fiyatı Boş Bırakılamaz');
      return false;
    }
    const spec = new ProductSpecs(form.spec_name, form.spec_price);
    this.productSpecs.push(spec);
    speciesForm.reset();
  }

  removeSpecies(index: number) {
    this.productSpecs.splice(index, 1);
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
      // if (form.amount < result.left_total) {
      if (this.productRecipe.find((item: any) => item.stock_id == form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else if (this.oldRecipes.find((item: any) => item.id == form.stock_id)) {
        this.messageService.sendMessage('İçerik daha önce tanımlanmış!');
      } else {
        this.productRecipe.push(item);
        this.recipesTable.push({ id: form.stock_id, name: this.stockName, amount: form.amount, unit: this.stockUnit });
        this.hasRecipe = true;
      }
      // } else {
      //   this.messageService.sendMessage('Elinizdeki  kalan stok miktarından fazla giremezsiniz.')
      // }
      recipesForm.reset();
    });
    return true;
  }

  removeRecipe(type: string, id: string) {
    switch (type) {
      case 'new':
        this.productRecipe = this.productRecipe.filter((item: any) => item.stock_id != id);
        this.recipesTable = this.recipesTable.filter((item: any) => item.id != id);
        if (this.recipesTable.length == 0) {
          if (this.oldRecipes.length == 0) {
            this.hasRecipe = false;
          }
        }
        break;
      case 'old':
        this.recipe = this.recipe.filter((item: any) => item.stock_id != id);
        this.productRecipe = this.productRecipe.filter((item: any) => item.stock_id != id);
        this.oldRecipes = this.oldRecipes.filter((item: any) => item.id != id);
        if (this.oldRecipes.length == 0) {
          if (this.recipesTable.length == 0) {
            this.hasRecipe = false;
          }
          this.mainService.removeData('recipes', this.recipeId);
        } else {
          this.mainService.updateData('recipes', this.recipeId, { recipe: this.recipe });
        }
        break;
      default:
        break;
    }
  }

  onStockChange(value: any) {
    this.mainService.getData('stocks', value).then((result: any) => {
      this.stockUnit = result.unit;
      this.stockName = result.name;
    });
  }

  filterProducts(value: string) {
    const regexp = new RegExp(value, 'i');
    this.mainService.getAllBy('products', { name: { $regex: regexp } }).then((res: any) => {
      this.products = res.docs;
      this.products = this.products.sort((a: any, b: any) => a.price - b.price);
    });
  }

  setDefault() {
    this.productRecipe = [];
    this.productSpecs = []
    this.recipesTable = [];
    this.oldRecipes = [];
    this.recipe = [];
    this.subCats = [];
    this.sub_categories = [];
    this.selectedProduct = undefined!;
    this.selectedCat = undefined!;
    this.selectedSubCat = undefined!;
    this.selectedId = undefined!;
    this.onUpdate = false;
    this.hasRecipe = false;

    if (this.productForm) {
      this.productForm.reset();
    }
    if (this.catDetails) {
      this.catDetails.reset();
    }
    if (this.categoryForm) {
      this.categoryForm.reset();
    }
    if (this.subCatForm) {
      this.subCatForm.reset();
    }
  }

  fillData() {
    this.mainService.getAllBy('categories', {}).then((result: any) => this.categories = result.docs);
    this.mainService.getAllBy('products', {}).then((result: any) => {
      this.products = result.docs;
      this.products = this.products.sort((a: any, b: any) => a.price - b.price);
    });
    this.mainService.getAllBy('stocks', {}).then((result: any) => this.stocks = result.docs);
    this.mainService.getAllBy('settings', { key: 'Printers' }).then((res: any) => {
      if (res.docs && res.docs.length > 0) {
        this.printers = res.docs[0].value;
      } else {
        this.printers = [];
      }
    });
  }
}
