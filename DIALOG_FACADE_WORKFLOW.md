# 🎯 **DialogFacade Pattern - Complete Implementation Workflow**

**Status:** Starting Week 2
**Timeline:** 5-6 gün (Day 1-6)
**Goal:** jQuery kaldırıp CDK Dialog + DialogFacade'ye geçmek

---

## **Week 2 Overview**

```
Day 1-2: DialogFacade Architecture (2 gün)
├─ dialog.facade.ts oluştur
├─ base-modal.component.ts oluştur
├─ 5 modal component oluştur
│  ├─ ProductModalComponent
│  ├─ CategoryModalComponent
│  ├─ CustomerModalComponent
│  ├─ TableModalComponent
│  └─ ConfirmModalComponent
└─ test & validate

Day 3-4: Component Refactoring (2 gün)
├─ ProductSettingsComponent refactor
├─ CategorySettingsComponent refactor
├─ CustomerSettingsComponent refactor
├─ TableSettingsComponent refactor
└─ test & validate

Day 5: Additional Features (1 gün)
├─ Datepicker (Flatpickr)
├─ Select (ng-select)
├─ Toast Notifications (custom)
└─ Global CSS styling

Day 6: Testing & Polish (1 gün)
├─ Modal interactions test
├─ CSS/UX polish
├─ Browser compatibility
└─ Production ready check

Result: jQuery completely removed ✅
```

---

## **Architecture**

```
src/app/
├─ core/
│  ├─ services/
│  │  └─ dialog.facade.ts ← Single entry point
│  │
│  └─ models/
│      └─ dialog.models.ts (types)
│
├─ shared/
│  ├─ modals/
│  │  ├─ base-modal.component.ts
│  │  ├─ product-modal/
│  │  │  └─ product-modal.component.ts
│  │  ├─ category-modal/
│  │  │  └─ category-modal.component.ts
│  │  ├─ customer-modal/
│  │  │  └─ customer-modal.component.ts
│  │  ├─ table-modal/
│  │  │  └─ table-modal.component.ts
│  │  └─ confirm-modal/
│  │     └─ confirm-modal.component.ts
│  │
│  └─ services/
│      └─ notification.service.ts (custom toast)
│
└─ components/
    └─ settings/
        ├─ product-settings/
        │  └─ product-settings.component.ts (refactored)
        ├─ category-settings/
        ├─ customer-settings/
        └─ table-settings/
```

---

## **Day 1 - Part 1: DialogFacade Service**

### **File: src/core/services/dialog.facade.ts**

```typescript
import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';

@Injectable({ providedIn: 'root' })
export class DialogFacade {
  private dialog = inject(Dialog);

  // Generic open method
  open<T, R = any>(
    component: any,
    config?: {
      title?: string;
      width?: string;
      data?: T;
      panelClass?: string;
    }
  ): DialogRef<R> {
    return this.dialog.open(component, {
      width: config?.width || '500px',
      panelClass: ['cdk-dialog', config?.panelClass || ''].filter(Boolean),
      data: config?.data || {}
    });
  }

  // Specific modals
  openProductModal(product?: any): DialogRef<any> {
    return this.open(ProductModalComponent, {
      title: 'Ürün Ekle',
      width: '600px',
      data: product
    });
  }

  openCategoryModal(category?: any): DialogRef<any> {
    return this.open(CategoryModalComponent, {
      title: 'Kategori Ekle',
      width: '500px',
      data: category
    });
  }

  openCustomerModal(customer?: any): DialogRef<any> {
    return this.open(CustomerModalComponent, {
      title: 'Müşteri Ekle',
      width: '500px',
      data: customer
    });
  }

  openTableModal(table?: any): DialogRef<any> {
    return this.open(TableModalComponent, {
      title: 'Masa Ekle',
      width: '400px',
      data: table
    });
  }

  openConfirmDialog(message: string, title = 'Onay'): DialogRef<boolean> {
    return this.open(ConfirmModalComponent, {
      title,
      width: '400px',
      data: { message, title }
    });
  }
}
```

---

## **Day 1 - Part 2: BaseModalComponent**

### **File: src/shared/modals/base-modal.component.ts**

```typescript
import { Component, Inject, Input } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

@Component({ template: '' })
export abstract class BaseModalComponent<T = any> {
  @Input() data: T;

  constructor(
    protected dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: T
  ) {
    this.data = data;
  }

  close(result?: any) {
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
```

---

## **Day 1 - Part 3: ProductModalComponent**

### **File: src/shared/modals/product-modal/product-modal.component.ts**

```typescript
import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { BaseModalComponent } from '../base-modal.component';
import { MainService } from '../../../core/services/main.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-product-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="modal-header">
      <h5 class="modal-title">
        {{ data?.name ? 'Ürün Düzenle' : 'Ürün Ekle' }}
      </h5>
      <button class="btn-close" (click)="cancel()"></button>
    </div>

    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <div class="modal-body">
        <div class="mb-3">
          <label class="form-label">Ürün Adı *</label>
          <input
            type="text"
            class="form-control"
            formControlName="name"
            [class.is-invalid]="isFieldInvalid('name')"
          />
          @if (isFieldInvalid('name')) {
            <div class="invalid-feedback">Ürün adı gerekli</div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Fiyat *</label>
          <input
            type="number"
            class="form-control"
            formControlName="price"
            [class.is-invalid]="isFieldInvalid('price')"
          />
          @if (isFieldInvalid('price')) {
            <div class="invalid-feedback">Geçerli fiyat giriniz</div>
          }
        </div>

        <div class="mb-3">
          <label class="form-label">Kategori *</label>
          <select
            class="form-select"
            formControlName="cat_id"
            [class.is-invalid]="isFieldInvalid('cat_id')"
          >
            <option value="">Seçiniz</option>
            @for (cat of categories; track cat._id) {
              <option [value]="cat._id">{{ cat.name }}</option>
            }
          </select>
          @if (isFieldInvalid('cat_id')) {
            <div class="invalid-feedback">Kategori seçiniz</div>
          }
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="cancel()">
          İptal
        </button>
        <button
          type="submit"
          class="btn btn-primary"
          [disabled]="!form.valid || loading"
        >
          @if (loading) {
            <span class="spinner-border spinner-border-sm me-2"></span>
          }
          Kaydet
        </button>
      </div>
    </form>
  `,
  styles: [`
    :host { display: block; }
    .modal-header, .modal-body, .modal-footer { padding: 1rem; }
  `]
})
export class ProductModalComponent extends BaseModalComponent {
  form: FormGroup;
  categories: any[] = [];
  loading = false;

  private fb = inject(FormBuilder);
  private mainService = inject(MainService);
  private notification = inject(NotificationService);

  constructor(
    dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: any
  ) {
    super(dialogRef, data);

    this.form = this.fb.group({
      name: [data?.name || '', Validators.required],
      price: [data?.price || 0, [Validators.required, Validators.min(0)]],
      cat_id: [data?.cat_id || '', Validators.required]
    });

    this.loadCategories();
  }

  private loadCategories() {
    this.mainService.getAllBy('categories', {}).then(res => {
      this.categories = res.docs;
    });
  }

  isFieldInvalid(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    const formValue = this.form.value;

    const promise = this.data?._id
      ? this.mainService.updateData('products', this.data._id, formValue)
      : this.mainService.addData('products', formValue);

    promise
      .then(result => {
        this.loading = false;
        this.notification.success(
          this.data?._id ? 'Ürün güncellendi' : 'Ürün eklendi'
        );
        this.close(result);
      })
      .catch(error => {
        this.loading = false;
        this.notification.error('Kayıt başarısız: ' + error.message);
      });
  }
}
```

---

## **Day 1 - Part 4: Diğer Modal Components**

Aynı pattern ile oluştur:
- CategoryModalComponent (category form)
- CustomerModalComponent (customer form)
- TableModalComponent (table form)
- ConfirmModalComponent (delete confirmation)

---

## **Day 2: Global Styles ve Notification Service**

### **File: src/shared/services/notification.service.ts**

```typescript
import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications = signal<Toast[]>([]);

  notifications$ = this.notifications.asReadonly();

  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  private show(message: string, type: Toast['type'], duration: number) {
    const notification: Toast = {
      id: Math.random(),
      message,
      type
    };

    this.notifications.update(prev => [...prev, notification]);

    setTimeout(() => {
      this.notifications.update(prev =>
        prev.filter(n => n.id !== notification.id)
      );
    }, duration);
  }
}
```

### **File: src/styles/dialog.styles.css**

```css
::ng-deep {
  .cdk-overlay-pane {
    z-index: 1050;
  }

  .cdk-dialog-container {
    background: white;
    border-radius: 0.25rem;
    box-shadow: 0 0.5rem 1rem rgba(0,0,0,.15);
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cdk-overlay-backdrop {
    background: rgba(0,0,0,.5);
  }

  .modal-header {
    border-bottom: 1px solid #dee2e6;
  }

  .modal-footer {
    border-top: 1px solid #dee2e6;
  }

  .notification-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    width: 300px;
  }

  .notification-item {
    margin-bottom: 10px;
    animation: slideInRight 0.3s ease-out;
  }

  @keyframes slideInRight {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
}
```

---

## **Day 3-4: Component Refactoring**

### **Örnek: ProductSettingsComponent Refactored**

```typescript
export class ProductSettingsComponent implements OnInit {
  products = signal<any[]>([]);

  constructor(
    private dialogFacade: DialogFacade,
    private mainService: MainService,
    private notification: NotificationService
  ) {}

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.mainService.getAllBy('products', {}).then(res => {
      this.products.set(res.docs);
    });
  }

  openProductModal() {
    const dialogRef = this.dialogFacade.openProductModal();

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  editProduct(product: any) {
    const dialogRef = this.dialogFacade.openProductModal(product);

    dialogRef.closed.subscribe(result => {
      if (result) {
        this.loadProducts();
      }
    });
  }

  deleteProduct(id: string) {
    const dialogRef = this.dialogFacade.openConfirmDialog(
      'Bu ürünü silmek istiyor musunuz?'
    );

    dialogRef.closed.subscribe(confirmed => {
      if (confirmed) {
        this.mainService.removeData('products', id).then(() => {
          this.notification.success('Ürün silindi');
          this.loadProducts();
        });
      }
    });
  }
}
```

---

## **Day 5: Additional Features**

### **Datepicker (Flatpickr)**

```bash
npm install flatpickr @types/flatpickr
```

### **Select (ng-select)**

```bash
npm install @ng-select/ng-select
```

### **Toast Container Component**

Notification service'i app.component'de display et

---

## **Success Criteria**

✅ DialogFacade working
✅ All 5 modal components created
✅ ProductSettings refactored
✅ CategorySettings refactored
✅ CustomerSettings refactored
✅ TableSettings refactored
✅ Toast notifications working
✅ CSS styling applied
✅ No jQuery references
✅ Production ready

---

## **Deployment Checklist**

- [ ] npm run build (no errors)
- [ ] npm run test (all passing)
- [ ] Modal interactions tested
- [ ] Forms validation tested
- [ ] Toast notifications tested
- [ ] Datepicker working
- [ ] Select dropdown working
- [ ] Mobile responsive
- [ ] Browser compatibility (Chrome, Safari, Firefox)
- [ ] Performance metrics good

---

**Status:** Ready to start ✅
