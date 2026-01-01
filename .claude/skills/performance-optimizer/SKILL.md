---
name: performance-optimizer
description: Uygulama performansını analiz eder, bottleneck'leri bulur ve optimizasyon önerileri sunar. Build size, runtime performance ve bundle optimization üzerine odaklanır.
---

# Performance Optimizer

Bu skill, POS sisteminin performansını iyileştirirken:
- Build size analizi
- Runtime performance profiling
- Bundle optimization
- Change detection optimization
- Memory leak detection
- API call optimization
- Caching stratejileri
- Lazy loading stratejileri

## Analiz Alanları

### Build Size
```bash
npm run build -- --stats-json
# Bundle size raporu
```

### Runtime Performance
- Initial load time
- Change detection cycles
- Component render time
- Memory usage

### Network
- API call count
- Response times
- Caching opportunities

## Optimizasyon Stratejileri

### 1. Change Detection
```typescript
// Default stratejisi yerine OnPush kullan
@Component({
  selector: 'app-item',
  changeDetection: ChangeDetectionStrategy.OnPush
})
```

### 2. Lazy Loading
```typescript
// Modülleri lazy load et
const routes: Routes = [{
  path: 'reports',
  loadChildren: () => import('./reports/reports.module')
    .then(m => m.ReportsModule)
}];
```

### 3. Signal Optimization
```typescript
// Derived signals memoize eder
computed(() => this.list().filter(...))
```

### 4. Unsubscribe Pattern
```typescript
// Subscription leak'larını önle
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(...);
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

## Performans KPI'ları

| Metrik | Hedef | Mevcut |
|--------|-------|--------|
| Initial Load | < 2s | ? |
| Build Size | < 500KB | ? |
| TTI (Time to Interactive) | < 3s | ? |
| Memory (Idle) | < 50MB | ? |

## Profiling Araçları

- Chrome DevTools → Network, Performance, Memory tabs
- Angular DevTools → Change detection, route transitions
- Lighthouse → Accessibility, Performance scores
- Bundle Analyzer → webpack-bundle-analyzer

"Uygulama yavaş" veya "bundle çok büyük" gibi şikayetlerde tam tarama yaparım.
