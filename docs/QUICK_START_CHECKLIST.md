# Angular 5→21 CRUD Migration: Hızlı Başlangıç Kontrol Listesi

## STEP 1: Angular 5 Kaynak Kodunu Analiz Et (1-2 saat)

### 1.1 Ana CRUD Operasyonlarını Listele

Quickly-desktop-master'da grep yap:
```bash
# Tüm addData çağrılarını bul
grep -r "addData(" --include="*.ts" | grep -v node_modules

# Tüm updateData çağrılarını bul
grep -r "updateData(" --include="*.ts" | grep -v node_modules

# Tüm removeData çağrılarını bul
grep -r "removeData(" --include="*.ts" | grep -v node_modules

# MainService.ts'den getAllBy patterns
grep -r "getAllBy(" --include="*.ts" | grep -v node_modules
```

### 1.2 Component-Database Mapping Tablosu Oluştur

Örnek:
```markdown
| Component | Database | CRUD Operations |
|-----------|----------|-----------------|
| selling-screen | checks, products, orders | Create check, Add product, Close check |
| tables-screen | tables, floors | Create/Update/Delete table |
| settings/products | products, categories | Create/Update/Delete product |
| ... | ... | ... |
```

### 1.3 Zorunlu Dosyaları Çıkar

Kaynak dosyalarda bu dosyaları öğren:
- [ ] Tüm model files (check.model.ts, product.model.ts, etc.)
- [ ] MainService CRUD method signatures
- [ ] DatabaseService (varsa)
- [ ] Her component'in onInit() → ngOnDestroy() lifecycle

---

## STEP 2: _all_docs.json'den Şemaları Doğrula (1-2 saat)

### 2.1 _all_docs.json Açılıştır

Her document type'ından 1-2 örnek al:
```json
// check dokümantı örneği
{
  "_id": "check_...",
  "db_name": "checks",
  "table_id": "...",
  "products": [...],
  "payment_flow": [...],
  "status": 1,
  "timestamp": 123456789
}

// product dokümantı örneği
{
  "_id": "product_...",
  "db_name": "products",
  "cat_id": "...",
  "price": 450,
  "tax_value": 8
}

// ... her tip için
```

### 2.2 database.types.ts ile Eşleştir

```bash
# Her interface'in _all_docs.json'deki dokümantla match ediyor mu?
# Kontrol listesi:
- [ ] CheckDocument matches check_... dokümantı
- [ ] ProductDocument matches product_... dokümantı
- [ ] TableDocument matches table_... dokümantı
- [ ] OrderDocument matches order_... dokümantı
- [ ] CustomerDocument matches customer_... dokümantı
- [ ] SettingsDocument matches settings_... dokümantı
- [ ] Enum values (_all_docs.json'deki 0,1,2 vs TypeScript enums)
```

### 2.3 Discrepancy Logla

Bulduğun her mismatch'ı `SCHEMA_MISMATCHES.md` dosyasına yaz:
```markdown
### Issue: Check Document Missing occupation Field

**_all_docs.json:**
```json
{
  "_id": "check_123",
  "occupation": {"male": 2, "female": 1}
}
```

**database.types.ts:**
```typescript
interface CheckDocument {
  // occupation field MISSING!
}
```

**Fix:** Occupation field ekle
```

---

## STEP 3: Critical CRUD Paths'ı Seç (1 saat)

### Top 5 Priority

Şu sequence'leri test etmeyi prioritize et (bunlar en sık kullanılan):

#### Path 1: Check Lifecycle (Masada Sipariş)
```
1. Create Check (new masa açılırken)
2. Add Product (ürün eklerken)
3. Add Payment (para alındığında)
4. Close Check (hesap kapandığında)
```

#### Path 2: Product Management
```
1. Create Product
2. Update Price
3. Query by Category
4. Reference in Recipe
5. Delete (cascade to recipes)
```

#### Path 3: Daily Report
```
1. Calculate totals from checks
2. Create report document
3. Store in reports DB
4. Filter by date
5. Delete old reports
```

#### Path 4: Settings Persistence
```
1. Load AuthInfo
2. Load AppSettings
3. Update Settings
4. Trigger replication
5. Verify RemoteDB sync
```

#### Path 5: User Management
```
1. Create user
2. Assign role/permissions
3. Update user settings
4. Delete user
5. Cascade cleanup
```

---

## STEP 4: Kod Taraması - Angular 21'de (2-3 saat)

### 4.1 Selling Screen için Tarama (Priority 1)

```bash
# Angular 21 version'da selling-screen.component.ts aç
# Şu pattern'ları ara:

1. createCheck() method - Angular 5'teki addData() çağrısı ile eşleş miyor?
2. addProductToCheck() - products array'e push mi? immutable mi?
3. closeCheck() - payment_flow update sequence?
4. Signal updates - zone.run() wrapper var mı?
5. Effect'ler - detailData watch ediyor mu?
```

### 4.2 Check her Critical Path için

```bash
# Path 1: Check Lifecycle
grep -n "createCheck\|addProduct\|addPayment\|closeCheck" src/app/components/store/selling-screen/selling-screen.component.ts

# Path 2: Product Management
grep -n "addProduct\|updateProduct\|deleteProduct" src/app/components/settings/menu-settings/menu-settings.component.ts

# ... vs
```

### 4.3 Findings Logla

Bulduğun her pattern'ı şu template'te logla:
```markdown
### Path 1: createCheck()

**Location:** selling-screen.component.ts:123

**Angular 5 Expected:**
```typescript
const newCheck = new Check(...);
mainService.addData('checks', newCheck).then(res => {
  this.checks = [...this.checks, res];
  this.zone.run(() => {
    this.selectedCheck.set(res);
  });
});
```

**Angular 21 Actual:**
```typescript
[PASTE ACTUAL CODE]
```

**Match:** ✅ YES / ⚠️ PARTIAL / ❌ NO
**Issues:** [List any differences]
```

---

## STEP 5: Hızlı Integration Tests Yaz (3-4 saat)

### 5.1 Jasmine Test File Oluştur

```bash
# selling-screen.crud.spec.ts
ng generate spec src/app/components/store/selling-screen/selling-screen.crud
```

### 5.2 Temel Test'ler Yaz

```typescript
describe('Selling Screen - CRUD Operations', () => {

  // Test 1: Check Create
  it('should create check with all required fields', (done) => {
    sellingScreenComponent.createCheck('table_1');

    setTimeout(() => {
      expect(sellingScreenComponent.checks().length).toBeGreaterThan(0);
      const newCheck = sellingScreenComponent.checks()[0];
      expect(newCheck.table_id).toBe('table_1');
      expect(newCheck.status).toBe(CheckStatus.OCCUPIED);
      done();
    }, 1000);
  });

  // Test 2: Add Product
  it('should add product to check with correct total', (done) => {
    const checkId = 'check_123';
    const productId = 'product_456';
    const expectedPrice = 450;

    sellingScreenComponent.addProductToCheck(checkId, productId);

    setTimeout(() => {
      const check = mainService.LocalDB['checks'].get(checkId);
      expect(check.products.length).toBe(1);
      expect(check.total_price).toBe(expectedPrice + (expectedPrice * 0.08));
      done();
    }, 500);
  });

  // Test 3: Close Check
  it('should close check and move to closed_checks', (done) => {
    const checkId = 'check_123';
    sellingScreenComponent.closeCheck(checkId, 'cash');

    setTimeout(() => {
      expect(sellingScreenComponent.checks().find(c => c._id === checkId)).toBeUndefined();
      mainService.LocalDB['closed_checks'].get(checkId).then(doc => {
        expect(doc.payment_method).toBe('cash');
        done();
      });
    }, 500);
  });
});
```

### 5.3 Tüm Paths için Tekrarla

- [ ] Path 1: Check Lifecycle
- [ ] Path 2: Product Management
- [ ] Path 3: Daily Report
- [ ] Path 4: Settings Persistence
- [ ] Path 5: User Management

---

## STEP 6: Kurşun Proof Kontroller (1-2 saat)

### 6.1 Zone.run() Taraması

```bash
# Tüm promise resolve'larda zone.run() var mı?
grep -r "addData\|updateData\|removeData" src/app/components --include="*.ts" -A 3 | grep -B 3 "zone.run"
```

Eğer bulamadıysan, şu pattern'ları ekle:
```typescript
// BEFORE
mainService.addData('checks', newCheck).then(res => {
  this.checks.set([...this.checks(), res]);
});

// AFTER
mainService.addData('checks', newCheck).then(res => {
  this.zone.run(() => {
    this.checks.set([...this.checks(), res]);
  });
});
```

### 6.2 Signal Immutability Taraması

```bash
# Array push kullanımı var mı? (❌ WRONG)
grep -r "\.push(" src/app/components --include="*.ts" | grep -E "checks|products|orders"

# Set method kullanımı var mı? (✅ CORRECT)
grep -r "\.set(" src/app/components --include="*.ts" | grep -E "checks|products|orders"
```

Fix pattern:
```typescript
// BEFORE (❌ WRONG)
this.checks.push(newCheck);

// AFTER (✅ CORRECT)
this.checks.set([...this.checks(), newCheck]);
```

### 6.3 ReplaySubject Check

```bash
# SettingsService'de tüm Subject'ler ReplaySubject(1) mi?
grep -r "AppSettings\|RestaurantInfo\|ServerSettings\|DateSettings\|Printers" src/app/core/services/settings.service.ts
```

---

## STEP 7: Veritabanı Sinkron Test (2 saat)

### 7.1 LocalDB → allData Replication Test

```typescript
it('should replicate from specific DB to allData', async () => {
  // Step 1: Add to specific DB
  const newCheck = new Check(...);
  const res = await mainService.addData('checks', newCheck);

  // Step 2: Wait for replication
  await new Promise(r => setTimeout(r, 2000));

  // Step 3: Check allData
  const allDocs = await mainService.LocalDB['allData'].allDocs({include_docs: true});
  const replicated = allDocs.rows.find(r => r.doc._id === res.id);

  // Step 4: Verify db_name
  expect(replicated.doc.db_name).toBe('checks');
  expect(replicated.doc.table_id).toBeDefined();
});
```

### 7.2 Offline Mode Test

```typescript
it('should work offline and sync when back online', async () => {
  // Disconnect
  // (mock network)

  // Create check offline
  const check = await mainService.addData('checks', newCheck);
  expect(check._id).toBeDefined();

  // Reconnect
  // (restore network mock)

  // Wait for sync
  await mainService.remoteDBReady;  // Wait for signal

  // Verify in RemoteDB
  const remoteCheck = await mainService.RemoteDB.get(check.id);
  expect(remoteCheck._id).toBe(check.id);
});
```

---

## STEP 8: Full Run-Through Test (2-3 saat)

### Manual End-to-End Test

Canlı uygulamada bu sequence'i testet:

```
1. Login as Garçon
2. Open table (Masa 1)
3. Add 2 products (Çay, Kahve)
4. Apply 10% discount
5. Take payment (Cash)
6. Verify closed check in reports
7. Login as Admin
8. View daily report
9. Add new product (Kola)
10. Go to settings
11. Update product prices
12. Restart app
13. Verify all data persisted
14. Unplug network
15. Add offline check
16. Plug network back
17. Verify sync completed
```

Каждый step için screenshot al ve log et.

---

## FINAL CHECKLIST

Before calling it "migration complete":

- [ ] Tüm 5 Critical Paths test edildi
- [ ] Zone.run() wrapper'ları audit edildi
- [ ] Signal immutability kontrol edildi
- [ ] ReplaySubject consistency confirmed
- [ ] _all_docs.json schema match doğrulandı
- [ ] Offline mode çalışıyor
- [ ] Sync bidirectional çalışıyor
- [ ] Conflict resolution 60s interval'de çalışıyor
- [ ] All unit tests pass ✅
- [ ] All integration tests pass ✅
- [ ] Manual E2E test sequence pass ✅
- [ ] Zero console errors
- [ ] Zero data corruption

---

## Başlamak İçin Immediate Actions

### Today (next 30 minutes):

1. ✅ `CRUD_PATTERNS.md` oluştur (Angular 5 grep'le)
2. ✅ `_all_docs.json` açılıştır
3. ✅ `SCHEMA_VALIDATION.md` başla

### Tomorrow (full day):

4. ✅ 5 Critical Path'lar seç
5. ✅ Angular 21 kod taraması yap
6. ✅ Findings logla

### Day 3-4:

7. ✅ Test'ler yaz
8. ✅ Zone.run() fixes
9. ✅ Sync verification

### Day 5:

10. ✅ Full E2E test
11. ✅ Final sign-off
