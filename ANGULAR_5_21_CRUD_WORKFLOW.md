# Angular 5 → 21 Migrasyonu: CRUD Operasyonları Kontrol & Düzeltme Workflow'u

## FASE 0: İlk Hazırlık (YAPTIKLARIMIz)

✅ SettingsService: Subject → ReplaySubject(1) (timing fix)
✅ ApplicationSettingsComponent: fillData() implementasyonu
✅ Form validators: Type safety (.trim() checks)
✅ Logo path: Double slash fix
✅ Component recreation: [key] input signal pattern

---

## FASE 1: BLUEPRINT EXTRACTION (Angular 5 Referans)

### Hedef
Angular 5 kaynak kodundan tüm CRUD operasyonlarının blueprintini çıkarmak

### Adımlar

#### 1.1 - CRUD Pattern Identification
```bash
1. Angular 5 projesinde (quickly-desktop-master) grep'le:
   - addData() çağrıları
   - updateData() çağrıları
   - removeData() çağrıları
   - getAllBy() çağrıları
   - getAllData() çağrıları

2. Her pattern için:
   - Hangi component?
   - Hangi veritabanı?
   - Hangi dokümant type?
   - Validation kuralları?
   - Error handling?
   - UI feedback (toast/modal)?
   - State update sequence?
```

#### 1.2 - Veri Tbanı Şemaları Doğrulama
```
_all_docs.json'den extract et:
  - check dokümantı örneği
  - product dokümantı örneği
  - order dokümantı örneği
  - table dokümantı örneği
  - user dokümantı örneği
  - settings dokümantı örneği
  - (tüm document types)

Her dokümant için:
  - _id format'ı
  - _rev field'ı
  - Zorunlu alanlar
  - Opsiyonel alanlar
  - db_name field'ı
  - timestamp convention
```

#### 1.3 - Akış Diyagramları (Per Feature)

**Örnek: Check Create Flow (Angular 5)**
```
User "Masa 1" seçer
  ↓
table_id signal set
  ↓
createCheck() çağrısı
  ↓
new Check() instance oluştur {
  table_id: "table_1",
  status: CheckStatus.OCCUPIED,
  owner: currentUser,
  products: [],
  timestamp: Date.now()
}
  ↓
mainService.addData('checks', checkObj)
  ↓
LocalDB['checks'].post(checkObj)
  ↓
Başarısı → checks signal update
  ↓
UI refresh (masa masa açık hale gelir)
  ↓
allData'ya auto-sync via replication
  ↓
RemoteDB'ye (CouchDB) sync
```

---

## FASE 2: ANGULAR 21 MAPPING & VALIDATION

### Hedef
Her Angular 5 CRUD pattern'ının Angular 21'de equivalenti kontrol etmek

### Kritik Kontrol Noktaları

#### 2.1 - Veritabanı Operasyonları Seviyeleri

| Operation | Angular 5 | Angular 21 | Status |
|-----------|-----------|-----------|--------|
| addData() | mainService.addData() | mainService.addData() | ✅ Same |
| updateData() | mainService.updateData() | mainService.updateData() | ✅ Same |
| removeData() | mainService.removeData() | mainService.removeData() | ✅ Same |
| getAllBy() | Promise-based | Promise-based | ✅ Same |
| Signal update | Zone.run() manual | Zone.run() manual | ✅ Same |
| Replication | PouchDB live | PouchDB live | ✅ Same |
| allData routing | db_name field | db_name field | ✅ Same |

#### 2.2 - Signal State Management (Angular 21'de Yeni)

```typescript
// Angular 5: TS property
checks: any[] = [];

// Angular 21: Signal
readonly checks = signal<CheckDocument[]>([]);

// Angular 21: Computed
readonly openChecks = computed(() =>
  this.checks().filter(c => c.status === CheckStatus.OCCUPIED)
);

// Angular 21: Effects
effect(() => {
  const checkId = this.selectedCheck();
  if (checkId) {
    this.loadCheckDetails(checkId);  // Otomatik reactive
  }
});
```

**Kontrol:** Tüm state mutations signal'lar üzerinden mi yapılıyor?

#### 2.3 - Zone.run() Wrapper'lar

```typescript
// Angular 21'de YAZILMALIDIR
this.zone.run(() => {
  this.checks.set([...newChecks]);
});

// mainService.addData() sonrasında
mainService.addData('checks', newCheck).then(res => {
  this.zone.run(() => {
    this.checks.set([...this.checks(), res]);
  });
});
```

**Kontrol:** MainService promise resolve'unda zone.run() var mı?

#### 2.4 - Async Pipe & Observable Conversion

```typescript
// Angular 5: Direkt Promise
.subscribe(res => this.checks = res.docs);

// Angular 21: Observable wrapper
getAllByObservable<T>(...): Observable<T[]>

// Component'te
this.checks.set(
  await lastValueFrom(
    this.mainService.getAllByObservable('checks', {})
  )
);
```

**Kontrol:** Observable pattern'lar consistently uygulanmış mı?

---

## FASE 3: CRUD CHECKPOINT MATRIX

### Masalar Ekranı (Tables Screen)

| CRUD Op | Operation | Angular 5 | Angular 21 | Issue? |
|---------|-----------|-----------|-----------|--------|
| **Create** | Yeni masa ekle | addData('tables', Table) | addData('tables', Table) | ✓ |
| | DOM update | Zone.run() | Zone.run() | ✓ |
| | Replication | Auto (allData) | Auto (allData) | ✓ |
| **Read** | Tüm masaları yükle | getAllData('tables') | getAllData('tables') | ✓ |
| | Signal assign | tables.set(docs) | tables.set(docs) | ✓ |
| | Computed filter | N/A | computed(() => ...) | ✓ |
| **Update** | Masa bilgisi değiş | updateData('tables', id, obj) | updateData('tables', id, obj) | ⚠️ **CHECK:** Signal update sequence |
| | Status değişi | floor_id → table.floor_id | floor_id → table.floor_id | ✓ |
| **Delete** | Masa sil | removeData('tables', id) | removeData('tables', id) | ⚠️ **CHECK:** Signal filtering logic |
| | UI cleanup | Manual filter | computed ile otomatik | ✓ |

### Hesaplar Ekranı (Checks Screen)

| CRUD Op | Operation | Angular 5 | Angular 21 | Issue? |
|---------|-----------|-----------|-----------|--------|
| **Create** | Yeni hesap aç | addData('checks', Check) | addData('checks', Check) | ✓ |
| | Masa status'u değiş | table.status = 1 | Signal update | ✓ |
| | Payment_flow init | [] | [] | ✓ |
| **Read** | Açık hesaplar | getAllBy('checks', {status: OCCUPIED}) | getAllBy('checks', {status: OCCUPIED}) | ✓ |
| | Filtreleme | Computed property | computed() signal | ✓ |
| **Update** | Ürün ekle | updateData('checks', checkId, updatedCheck) | updateData('checks', checkId, updatedCheck) | ⚠️ **CHECK:** Array mutation immutability |
| | Discount uygula | check.discount = amount | signal update | ⚠️ **CHECK:** Formula consistency |
| | Payment flow | addPayment() → push | PaymentStatus append | ⚠️ **CHECK:** Type safety |
| **Delete** | Hesap kapat | updateData → ClosedCheck | removeData('checks', id) | ⚠️ **CHECK:** Cascade rules |
| | allData cleanup | Auto | Auto | ✓ |

### Ürünler Ekranı (Products Screen)

| CRUD Op | Operation | Angular 5 | Angular 21 | Issue? |
|---------|-----------|-----------|-----------|--------|
| **Create** | Yeni ürün | addData('products', Product) | addData('products', Product) | ✓ |
| | Category validation | cat_id exists? | cat_id exists? | ⚠️ **CHECK:** Foreign key validation |
| | Tax calculation | tax_value apply | tax_value apply | ✓ |
| **Read** | Kategoriye göre | getAllBy('products', {cat_id: ...}) | getAllBy('products', {cat_id: ...}) | ✓ |
| | Sub-category filter | Nested query | Nested query | ⚠️ **CHECK:** Query performance |
| **Update** | Fiyat değiş | updateData('products', id, {price: new}) | updateData('products', id, {price: new}) | ⚠️ **CHECK:** Open checks impact |
| | Tax update | tax_value field | tax_value field | ✓ |
| **Delete** | Ürün kaldır | removeData('products', id) | removeData('products', id) | ⚠️ **CHECK:** Recipe cascade |
| | Recipes cleanup | Manual? | Manual? | ⚠️ **CRITICAL** |

### Raporlar Ekranı (Reports Screen)

| CRUD Op | Operation | Angular 5 | Angular 21 | Issue? |
|---------|-----------|-----------|-----------|--------|
| **Create** | Report generate | Manual calc | computed() calc | ⚠️ **CHECK:** Formula parity |
| | DB store | addData('reports', Report) | addData('reports', Report) | ✓ |
| **Read** | Daily reports | getAllBy('reports', {timestamp: range}) | getAllBy('reports', {timestamp: range}) | ⚠️ **CHECK:** Date range logic |
| | User reports | filter by connection_id | filter by connection_id | ✓ |
| **Update** | Report adjust | updateData('reports', id, {amount: new}) | updateData('reports', id, {amount: new}) | ⚠️ **CHECK:** Audit trail |
| **Delete** | Report sil | removeData('reports', id) | removeData('reports', id) | ⚠️ **CHECK:** Data consistency |

---

## FASE 4: SCHEMA VALIDATION (_all_docs.json ile)

### Adım 4.1: Document Type Extraction

```bash
_all_docs.json'den:

1. Check dokümantı örneği
   {
     "_id": "check_...",
     "db_name": "checks",
     "table_id": "...",
     "status": 0,  # Enum: 0=PASSIVE, 1=OCCUPIED, ...
     "products": [...],
     "payment_flow": [],
     "occupation": {male: 0, female: 0},
     ...
   }

2. Product dokümantı örneği
   {
     "_id": "product_...",
     "db_name": "products",
     "cat_id": "category_...",
     "price": 450,
     "tax_value": 8,
     ...
   }

3. Table dokümantı örneği
   {
     "_id": "table_...",
     "db_name": "tables",
     "floor_id": "floor_...",
     "status": 0,  # 0=FREE, 1=OCCUPIED
     "capacity": 4,
     ...
   }
```

### Adım 4.2: Type Definition Kontrol

Angular 21 `database.types.ts` ile _all_docs.json karşılaştır:

```typescript
// database.types.ts'de
export interface CheckDocument extends PouchDBDocument {
    table_id: string;
    total_price: number;
    discount: number;
    owner: string;
    status: CheckStatus;
    products: CheckProduct[];
    payment_flow?: PaymentStatus[];
    occupation: Occupation;
    // ...
}

// _all_docs.json'de real document'i kontrol et:
// - Tüm required fields var mı?
// - Optional fields doğru mu?
// - Enum values match ediyor mu?
// - Array structure doğru mu?
```

### Adım 4.3: Enum Value Consistency

```typescript
// Angular 5 enums vs Angular 21 enums

enum CheckStatus {
  PASSIVE = 0,
  READY = 1,
  OCCUPIED = 2,
  PROCESSING = 3
}

// _all_docs.json'de values:
// "status": 1 → READY mi?
// "status": 2 → OCCUPIED mi?
// Tutarlı mı?
```

---

## FASE 5: REGRESSION TEST MATRIX

### 5.1 - Unit Test Coverage

Tüm CRUD operasyonları için:

```typescript
describe('ChecksService CRUD', () => {

  it('should create check with correct structure', async () => {
    const newCheck = new Check(
      'table_1', 0, 0, 'user_123', '',
      CheckStatus.OCCUPIED, [], Date.now(), CheckType.NORMAL, 1
    );

    const result = await mainService.addData('checks', newCheck);

    // Assert
    expect(result.ok).toBe(true);
    expect(result.id).toMatch(/^check_/);

    // Verify in allData
    const allDocs = await mainService.getAllBy('allData', {});
    const savedCheck = allDocs.docs.find(d => d._id === result.id);
    expect(savedCheck).toBeDefined();
    expect(savedCheck.db_name).toBe('checks');
  });

  it('should update check products with immutability', async () => {
    const checkId = 'check_123';
    const originalCheck = await mainService.getData('checks', checkId);

    const updatedCheck = {
      ...originalCheck,
      products: [...originalCheck.products, newProduct]
    };

    const result = await mainService.updateData('checks', checkId, updatedCheck);

    // Verify immutability
    expect(originalCheck.products.length).toBe(1);
    expect(updatedCheck.products.length).toBe(2);
  });

  it('should handle concurrent updates (CouchDB conflict)', async () => {
    // Simulate conflict
    // ...
  });
});
```

### 5.2 - Integration Test Coverage

Ekran-level CRUD test'leri:

```typescript
describe('Sales Screen Integration', () => {

  it('should create check + add products + close check (full flow)', async () => {
    // 1. Create check
    const check = await sellingScreen.createCheck('table_1');
    expect(check._id).toBeDefined();
    expect(sellingScreen.checks()).toContain(check);

    // 2. Add product
    const product = await sellingScreen.addProductToCheck(check._id, productId);
    const updatedCheck = await mainService.getData('checks', check._id);
    expect(updatedCheck.products.length).toBe(1);
    expect(updatedCheck.total_price).toBe(product.price + tax);

    // 3. Close check
    const closedCheck = await sellingScreen.closeCheck(check._id, 'cash');
    expect(closedCheck.payment_method).toBe('cash');

    // 4. Verify state
    expect(sellingScreen.checks()).not.toContain(check);
    expect(sellingScreen.closedChecks()).toContain(closedCheck);

    // 5. Verify sync
    const allDocs = await mainService.getAllBy('allData', {});
    expect(allDocs.docs.find(d => d._id === check._id)).toBeUndefined();
  });
});
```

### 5.3 - Data Integrity Tests

```typescript
describe('Data Integrity & Constraints', () => {

  it('should maintain referential integrity (product exists)', async () => {
    const invalidProduct = {
      ...newProduct,
      cat_id: 'nonexistent_category'
    };

    // Should either:
    // A) Reject with validation error
    // B) Accept but cascade to validation layer
    const result = await mainService.addData('products', invalidProduct);

    // Verify behavior matches Angular 5
  });

  it('should handle cascade delete (delete product → delete recipes)', async () => {
    const product = await createProduct('test_product');
    const recipe = await createRecipe(product._id);

    // Delete product
    await mainService.removeData('products', product._id);

    // Verify recipes cleanup
    const recipes = await mainService.getAllBy('recipes', {product_id: product._id});
    expect(recipes.docs.length).toBe(0);
  });

  it('should calculate totals consistently', async () => {
    const items = [
      {price: 100, tax: 8, quantity: 2},
      {price: 50, tax: 8, quantity: 1}
    ];

    // Angular 5 formula
    const expectedTotal = (100 * 2 + 100 * 2 * 0.08) + (50 + 50 * 0.08);

    // Angular 21 formula
    const actualTotal = calculateCheckTotal(items);

    expect(actualTotal).toBe(expectedTotal);
  });
});
```

---

## FASE 6: SYNC VERIFICATION

### 6.1 - Replication Flow Test

```typescript
describe('PouchDB Replication', () => {

  it('should replicate localDB → allData', async () => {
    // Add to specific DB
    const check = await mainService.addData('checks', newCheck);

    // Wait for replication
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Verify in allData
    const allDocs = await mainService.getAllBy('allData', {});
    const replicated = allDocs.docs.find(d => d._id === check.id);

    expect(replicated).toBeDefined();
    expect(replicated.db_name).toBe('checks');
  });

  it('should handle sync conflict (differential merge)', async () => {
    // Create same check in two places
    // Resolve conflict
    // Verify differential calculation
  });
});
```

### 6.2 - Offline Capability Test

```typescript
describe('Offline Mode', () => {

  it('should continue CRUD operations offline', async () => {
    // Disconnect network
    mockNetworkOffline();

    // Perform CRUD
    const check = await mainService.addData('checks', newCheck);
    expect(check._id).toBeDefined();

    // Verify in local DB
    const local = await mainService.getAllBy('checks', {});
    expect(local.docs).toContain(check);

    // Reconnect
    mockNetworkOnline();

    // Wait for sync
    await waitForReplication();

    // Verify in RemoteDB
    const remoteCheck = await mainService.getData('checks', check._id);
    expect(remoteCheck._id).toBe(check._id);
  });
});
```

---

## FASE 7: ISSUE TRACKING & FIX LOG

### Template: Bulunan Her Sorunu Logla

```markdown
### Issue #[N]: [Title]

**Component:** [App Screen Name]
**CRUD Operation:** [Create/Read/Update/Delete]
**Angular 5 Behavior:** [Describe]
**Angular 21 Behavior:** [Describe]
**Root Cause:** [Analysis]
**Fix Applied:** [Code change]
**Test Result:** [Pass/Fail]
**Commit:** [SHA]

### Example:

### Issue #1: Product Price Update Not Reflected in Open Checks

**Component:** Selling Screen
**CRUD Operation:** Update Product Price
**Angular 5 Behavior:**
  - Existing checks still show old price
  - New checks show new price
**Angular 21 Behavior:**
  - ERROR: Price updates in real-time to all checks
**Root Cause:**
  - Signal reactivity too aggressive
  - getCheckTotal() computed'de product price lookup
**Fix Applied:**
  - Cache product price in CheckProduct.price_snapshot
  - Only use current product for future items
**Test Result:** ✅ Pass
**Commit:** abc1234
```

---

## FASE 8: MASTER TEST PLAN (Tüm Ekranlar)

### Kontrol Listesi (Complete CRUD for Each Screen)

- [ ] **Login Screen**
  - [ ] User credential validation
  - [ ] Session creation
  - [ ] Permission role loading

- [ ] **Home/Dashboard**
  - [ ] Settings panel CRUD
  - [ ] User profile update

- [ ] **Selling Screen (Satış)**
  - [ ] Create check
  - [ ] Read tables
  - [ ] Add products to check
  - [ ] Remove product
  - [ ] Apply discount
  - [ ] Close check
  - [ ] Payment flow recording

- [ ] **Tables Screen (Masalar)**
  - [ ] Create table
  - [ ] Read all tables
  - [ ] Update table capacity
  - [ ] Delete table
  - [ ] Floor association

- [ ] **Products Screen (Ürünler)**
  - [ ] Create product
  - [ ] Read categories
  - [ ] Update price
  - [ ] Update tax
  - [ ] Delete product
  - [ ] Recipe association

- [ ] **Customers Screen**
  - [ ] Create customer
  - [ ] Read customers
  - [ ] Update contact
  - [ ] Delete customer
  - [ ] Credit tracking

- [ ] **Reports Screen**
  - [ ] Generate daily report
  - [ ] Calculate totals
  - [ ] Filter by date range
  - [ ] User activity report
  - [ ] Delete report

- [ ] **Settings Screen**
  - [ ] Load all settings
  - [ ] Update AppSettings
  - [ ] Update RestaurantInfo
  - [ ] Manage users
  - [ ] Manage products
  - [ ] Manage tables

- [ ] **End of Day (Gün Sonu)**
  - [ ] Create daily summary
  - [ ] Calculate totals
  - [ ] Record cashbox
  - [ ] Generate report
  - [ ] Start new day

---

## OUTPUTS

### Aşama Sonrası Çıktılar

#### Fase 1 Output
- `CRUD_PATTERNS.md` - Angular 5'ten extracted tüm pattern'lar
- `DATA_FLOW_DIAGRAMS.md` - Her feature'in veri akış diyagramı
- `SCHEMA_MAPPING.xlsx` - _all_docs.json to database.types.ts mapping

#### Fase 2 Output
- `ANGULAR_21_MAPPING_REPORT.md` - Angular 5 vs 21 comparison
- `REGRESSION_ISSUES.md` - Bulunan tüm sorunlar
- `ZONE_RUN_AUDIT.md` - Zone wrapper'ların durumu

#### Fase 3-4 Output
- `CRUD_CHECKPOINT_RESULTS.md` - Matrix completion report
- `SCHEMA_VALIDATION_REPORT.md` - Type consistency check

#### Fase 5 Output
- `TEST_RESULTS.md` - Tüm test'lerin sonuçları
- `COVERAGE_REPORT.html` - Code coverage

#### Fase 6 Output
- `SYNC_VERIFICATION.md` - Replication test'leri

#### Fase 7 Output
- `ISSUES_AND_FIXES.md` - Tüm bulunan issues ve fix'leri

#### Fase 8 Output
- `MASTER_TEST_CHECKLIST.md` - Tüm ekranlar verify edildi

---

## TIMELINE & MILESTONES

```
Week 1:
  - Fase 1: CRUD Pattern Extraction
  - Fase 2: Angular 21 Mapping

Week 2:
  - Fase 3-4: Checkpoint Matrix + Schema Validation
  - Fase 5: Unit & Integration Tests

Week 3:
  - Fase 6: Sync Verification
  - Fase 7: Issue Tracking & Fixes

Week 4:
  - Fase 8: Master Test Plan
  - Final regression testing
  - Go/No-Go decision
```

---

## SUCCESS CRITERIA

✅ Tüm CRUD operasyonları Angular 5'te sade Ayrıntılı aynı çalışıyor
✅ Veritabanı şemaları _all_docs.json ile match ediyor
✅ Replication live ve bidirectional çalışıyor
✅ Offline mode testleri pass ediyor
✅ Conflict resolution 60s interval'de çalışıyor
✅ Signal state management consistent
✅ Zone.run() wrapper'lar tüm promise resolve'larında
✅ All enum values consistent
✅ Cascade operations (delete, update) çalışıyor
✅ 100+ test cases pass ediyor
✅ Zero data corruption scenarios
✅ 0 regressions Angular 5'e kıyasla
