---
name: architecture-advisor
description: Proje mimarisini analiz eder, teknik borç(technical debt) bulur, refactoring önerileri sunar ve yapısal iyileştirmeleri tasarlar.
---

# Architecture Advisor

Bu skill, POS sisteminin mimarisini iyileştirirken:
- Module organization (feature modules, shared, core)
- Service layer design (facades, repositories)
- State management (signals, subjects)
- Data flow optimization
- Dependency injection patterns
- Code reusability
- Technical debt analysis
- SOLID principles uygulaması
- Design patterns (factory, observer, facade)
- Testing architecture

## Mevcut Mimari

```
src/app/
├── components/
│   ├── admin/              # Feature module
│   ├── store/
│   │   └── selling-screen/
│   ├── settings/           # Feature module
│   ├── reports/            # Feature module
│   └── ...
├── shared/
│   ├── modals/             # Reusable modal components
│   └── pipes/              # Custom pipes
├── core/
│   ├── models/             # Data models
│   ├── services/           # Business logic
│   │   ├── dialog.facade.ts   # Dialog management
│   │   ├── main.service.ts    # Main operations
│   │   └── ...
│   └── guards/             # Route guards
└── styles/
    ├── _variables.scss
    └── _global.scss
```

## Architecture Patterns

### 1. Facade Pattern (Dialog System)
```typescript
// ✅ İYİ - Kompleks dialog operations'ı facade arkasına kapat
@Injectable({ providedIn: 'root' })
export class DialogFacade {
  openConfirmModal(data: ConfirmModalData) { ... }
  openPromptModal(data: PromptModalData) { ... }
  // Diğer modallar...
}

// Kullanım - basit ve temiz
this.dialogFacade.openConfirmModal({...});
```

### 2. Service Layer
```typescript
// ✅ İYİ - Business logic'i service'e koy
@Injectable({ providedIn: 'root' })
export class SalesService {
  addItemToCheck(checkId: string, item: OrderItem) { ... }
  applyDiscount(checkId: string, discount: number) { ... }
  completeCheck(checkId: string, payment: Payment) { ... }
}

// Component basit kalır
constructor(private sales: SalesService) {}
addItem() {
  this.sales.addItemToCheck(this.checkId, this.item);
}
```

### 3. Signal State Management
```typescript
// ✅ İYİ - Signals ile reactive state
export class CheckComponent {
  private checkService = inject(CheckService);

  items = this.checkService.items;  // Signal
  total = computed(() =>
    this.items().reduce((sum, i) => sum + i.price, 0)
  );

  addItem(item: OrderItem) {
    this.checkService.addItem(item);
    // UI otomatik güncellenecek
  }
}
```

### 4. Dependency Injection
```typescript
// ❌ KÖTÜ - Hard dependency
export class ReportComponent {
  private http = new HttpClient();
}

// ✅ İYİ - Injected dependency (testable)
export class ReportComponent {
  constructor(
    private http: HttpClient,
    private cache: CacheService
  ) {}
}
```

## Technical Debt Analysis

### Kontrol Listesi

#### Code Quality
- [ ] Unused imports/variables yok mu?
- [ ] Magic numbers constant'a çevrildi mi?
- [ ] Comments açıklayıcı mı (ne değil, neden)?
- [ ] Function boyutları uygun mu (< 30 lines)?
- [ ] Class sorumluluğu tek mi (SRP)?

#### Type Safety
- [ ] `any` tipi kullanımı minimale indirgendi mi?
- [ ] Nullable types doğru handle edildi mi?
- [ ] Generics kullanılıyor mu?
- [ ] Type guards var mı?

#### Testing
- [ ] Unit tests % coverage > 80%?
- [ ] Integration tests var mı?
- [ ] e2e tests critical paths'ı kapsar mı?
- [ ] Mock/stub services doğru mu?

#### Performance
- [ ] Change detection optimized (OnPush)?
- [ ] Unnecessary subscriptions var mı?
- [ ] Images optimized (lazy load)?
- [ ] Bundle size monitored mu?

#### Security
- [ ] SQL injection koruması?
- [ ] XSS koruması (DomSanitizer)?
- [ ] CSRF tokens var mı?
- [ ] Secrets expose edilmiş mi?

#### Documentation
- [ ] README güncel mi?
- [ ] API documentation var mı?
- [ ] Architecture diagram var mı?
- [ ] Setup instructions clear mi?

## Refactoring Önerileri

### 1. Service Consolidation
```
Şu an: PaymentService, OrderService, CheckService, SalesService
Öneri: Tüm sales operations'ı SalesService'e konsolidize et
Etki: Code reuse %40 artacak, testing easier
```

### 2. Modal Type Safety
```
Şu an: DialogData = any
Öneri: Tüm modallar typed interfaces kullansın
Etki: Type errors erken catch edilir, refactoring safer
```

### 3. Error Handling Standardization
```
Şu an: Inconsistent error handling patterns
Öneri: Global error handler + error service
Etki: User experience consistent, debugging easier
```

### 4. State Management Centralization
```
Şu an: Component-level signals scattered
Öneri: Feature-level stores (CheckStore, ReportStore)
Etki: State predictable, time-travel debugging possible
```

## SOLID Principles

### S - Single Responsibility
```typescript
// ❌ KÖTÜ
class DataComponent {
  loadData() { ... }
  saveData() { ... }
  deleteData() { ... }
  renderUI() { ... }
  handleErrors() { ... }
}

// ✅ İYİ
class DataService { loadData() { ... } }
class DataComponent { constructor(service: DataService) { ... } }
```

### O - Open/Closed
```typescript
// ✅ İYİ - Yeni payment tipi eklemek basit
abstract class PaymentStrategy {
  abstract process(amount: number): Promise<void>;
}
class CashPayment extends PaymentStrategy { ... }
class CardPayment extends PaymentStrategy { ... }
// Yeni payment tipi ekle, mevcut kodda değişiklik yok
```

### L - Liskov Substitution
```typescript
// ✅ İYİ - Derived class base class'ın contract'ını implement eder
class ReportService implements IReportGenerator {
  generate(data: any): Report { ... }
}
```

### I - Interface Segregation
```typescript
// ❌ KÖTÜ - Fat interface
interface IDataService {
  load() { }
  save() { }
  delete() { }
  validate() { }
  format() { }
}

// ✅ İYİ - Segregated interfaces
interface ILoader { load(): Promise<Data>; }
interface ISaver { save(data: Data): Promise<void>; }
interface IValidator { validate(data: Data): boolean; }
```

### D - Dependency Inversion
```typescript
// ✅ İYİ - Abstraction'a depend et
class ReportComponent {
  constructor(private reporter: IReporter) { }
}
// IReporter implement'i değişirse component etkilenmez
```

## Architecture Decision Records (ADR)

```markdown
# ADR-001: Use Signals for State Management

## Status: Accepted
## Date: 2024-01-15

### Problem
Components between shared state'i manage etmeye ihtiyaç.

### Decision
Angular 16+ Signals kullan.

### Consequences
✅ Fine-grained reactivity
✅ Less boilerplate than RxJS
❌ Requires Angular 16+
❌ Learning curve for team

### Alternative Considered
- RxJS: Too much boilerplate
- NgRx: Overkill for this complexity
```

Mimari iyileştirmeler, yeni modüller ve refactoring'ler hakkında danışabilirsiniz.
