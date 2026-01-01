---
name: ui-enhancement-specialist
description: UI/UX iyileştirmelerini tasarlar, komponentleri refactor eder, animation ekler ve kullanıcı deneyimini geliştirmek için kod güncellemesi yapar.
---

# UI Enhancement Specialist

Bu skill, POS sisteminin arayüzünü iyileştirirken:
- Component modernization (Bootstrap → Tailwind/modern CSS)
- Animation ve transitions (smooth UX)
- Loading states (skeleton loaders)
- Empty states (helpful messaging)
- Error states (clear recovery paths)
- Success feedback (visual confirmation)
- Theme customization (dark mode, branding)
- Responsive improvements
- Touch interaction optimization

## UI/UX Iyileştirme Alanları

### 1. Loading States
```typescript
// ❌ KÖTÜ - Kullanıcı ne olup bittiğini anlamıyor
<div *ngIf="isLoading">Yükleniyor...</div>

// ✅ İYİ - Skeleton loader
<div *ngIf="isLoading" class="skeleton-list">
  <div class="skeleton-item" *ngFor="let i of [1,2,3]"></div>
</div>
<div *ngIf="!isLoading" class="item-list">
  <div *ngFor="let item of items">{{ item.name }}</div>
</div>
```

### 2. Empty States
```html
<!-- ❌ KÖTÜ - Boş liste -->
<div *ngIf="items.length === 0">
  No items found
</div>

<!-- ✅ İYİ - Helpful empty state -->
<div *ngIf="items.length === 0" class="empty-state">
  <i class="fa fa-inbox fa-3x text-muted"></i>
  <h4>Henüz ürün yok</h4>
  <p>Yeni ürün eklemek için "Ürün Ekle" düğmesine tıklayın.</p>
  <button class="btn btn-primary">Ürün Ekle</button>
</div>
```

### 3. Error States
```typescript
// ❌ KÖTÜ - Sadece hata mesajı
<div *ngIf="error">{{ error }}</div>

// ✅ İYİ - Actionable error state
<div *ngIf="error" class="alert alert-danger" role="alert">
  <strong>Hata:</strong> {{ error }}
  <p class="mt-2">
    <button (click)="retry()" class="btn btn-sm btn-outline-danger">
      Tekrar Dene
    </button>
    <button (click)="goBack()" class="btn btn-sm btn-outline-secondary">
      Geri Git
    </button>
  </p>
</div>
```

### 4. Animations
```typescript
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-modal',
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class ModalComponent {}
```

### 5. Success Feedback
```typescript
// ❌ KÖTÜ - Silent success
this.api.save(data).subscribe(() => {
  this.close();
});

// ✅ İYİ - Visual feedback
this.api.save(data).subscribe(() => {
  this.showSuccessMessage('Değişiklikler kaydedildi');
  setTimeout(() => this.close(), 1500);
});
```

### 6. Dark Mode Support
```scss
// SCSS variables
$light-bg: #ffffff;
$dark-bg: #1a1a1a;
$light-text: #333333;
$dark-text: #ffffff;

@media (prefers-color-scheme: dark) {
  body {
    background-color: $dark-bg;
    color: $dark-text;
  }
}

// CSS Variables (runtime switch)
:root {
  --bg-color: white;
  --text-color: #333;
}

:root[data-theme="dark"] {
  --bg-color: #1a1a1a;
  --text-color: #fff;
}
```

## Component İyileştirme Checklist

### Modal
- [ ] Smooth entrance/exit animation?
- [ ] Loading state gösterilyor mu?
- [ ] Error handling var mı?
- [ ] Success feedback var mı?
- [ ] Cancel/close işlemi onay soruyor mu?
- [ ] Keyboard shortcuts (Escape) çalışıyor mu?

### Form
- [ ] Real-time validation?
- [ ] Field-level error messages?
- [ ] Dirty/pristine state'i gösteriliyor mu?
- [ ] Submit button disabled state'i var mı?
- [ ] Success message gösteriliyor mu?
- [ ] Auto-focus first input?
- [ ] Tab order doğru mu?

### List/Table
- [ ] Skeleton loader while loading?
- [ ] Empty state message?
- [ ] Pagination clear mi?
- [ ] Row hover effects?
- [ ] Column sort indicators?
- [ ] Selection feedback (checkbox)?
- [ ] Bulk action buttons?

### Page
- [ ] Loading spinner at transition?
- [ ] Breadcrumb navigation?
- [ ] Page title consistent?
- [ ] Help/info tooltips?
- [ ] Back button/navigation?

## CSS Utilities (SCSS Mixins)

```scss
// Responsive helper
@mixin respond-to($breakpoint) {
  @if $breakpoint == 'mobile' {
    @media (max-width: 768px) { @content; }
  } @else if $breakpoint == 'tablet' {
    @media (max-width: 1024px) { @content; }
  }
}

// Flexbox helper
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// Truncate text
@mixin truncate {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

"Satış ekranında ürün seçimi daha hızlı olabilir" veya "Loading göstergesi eksik" gibi UI önerileri yapabilirsiniz.
