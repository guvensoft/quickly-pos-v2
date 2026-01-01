# Quickly POS Veritabanı Mimarisi - Detaylı Analiz

## 1. CORE TEKNOLOJİ STACKİ

### Local Storage (Desktop)
- **PouchDB 9.0.0** - Offline-first local database
- **26 veritabanı instance'ı** - Bölümlenmiş veri yapıları
- **Adapter'lar:**
  - Memory (geçici veri)
  - IndexedDB (persistent ayarlar ve allData)
  - revs_limit: 1, auto_compaction: true

### Remote Sync (Server)
- **CouchDB** - HTTP REST API üzerinden
- **Nano 9.0.5** - Admin işlemleri
- **Basic Auth** - app_id:app_token credentials

---

## 2. VERITABANI TOPOLOJISI (Angular 5'ten Beri)

```
┌─────────────────────────────────────────────────────────────┐
│                    REMOTE COUCHDB                           │
│          (IP: 31.210.89.218, Port: 5984)                    │
└──────────────┬────────────────────────────┬──────────────────┘
               │ Bidirectional Sync        │
        ┌──────▼────────┐           ┌──────▼────────┐
        │  PRIMARY POS  │           │SECONDARY POS  │
        │  (Express on  │           │  (HTTP Client)│
        │  :3000)       │           │               │
        └──────┬────────┘           └──────┬────────┘
               │                           │
               │ LocalDB (26 instances)    │ LocalDB (26 instances)
               │ + IndexedDB persistent    │ + Memory transient
               │                           │
        ┌──────▼─────────────────────────▼────────┐
        │  allData (Sync Hub)                     │
        │  - Central repository                   │
        │  - db_name field routes to correct DB   │
        │  - Handles bidirectional replication    │
        └─────────────────────────────────────────┘
```

---

## 3. 26 POUCHDB INSTANCE'I (Angular 21'de)

### Transient (Memory)
- local_users
- local_users_group
- local_checks
- local_closed_checks
- local_credits
- local_customers
- local_orders
- local_receipts
- local_calls
- local_cashbox
- local_categories
- local_sub_cats
- local_occations
- local_products
- local_recipes
- local_floors
- local_tables
- local_stocks
- local_stocks_cat
- local_endday
- local_reports
- local_logs
- local_commands
- local_comments
- local_prints

### Persistent (IndexedDB)
- local_settings (revs_limit: 3)
- local_alldata (revs_limit: 3, auto_compaction: false)

---

## 4. AUTHENTICATION FLOW

```typescript
// settings.ts'de AuthInfo

AuthInfo {
  app_remote: "31.210.89.218"
  app_port: "5984"
  app_db: "store_id_prefix"  // Veritabanı namespace
  app_id: "username"
  app_token: "password"
}

// MainService'de HTTP Header
Authorization: Basic Base64(app_id:app_token)
```

---

## 5. DOCUMENT ROUTING (db_name Field)

Her dokümanda `db_name` field var:
```javascript
{
  "_id": "check_123",
  "_rev": "1-abc",
  "db_name": "checks",      // ← Router kullanır
  "table_id": "table_1",
  "total_price": 450,
  "status": 1,
  "timestamp": 1234567890
}
```

Replication'da:
1. allData'dan dokümantasyon gelir
2. db_name'e bakılır
3. Uygun local database'e yazılır

---

## 6. SYNC STRATEGY

### Bidirectional Live Replication
```
LocalDB ←→ RemoteDB (CouchDB)
    ↓
allData Hub (Central Sync Manager)
    ↓
26 Specific Databases
```

### Conflict Resolution (60s interval)
- Report documents: Differential calculation
- Others: Timestamp comparison
- Revision ordering as fallback

---

## 7. ANGULAR 21'DÜ KOD HARITASI

### MainService (src/core/services/main.service.ts)
- **Sorumlu:** LocalDB initialization + CRUD
- **26 PouchDB örneği başlatır**
- **RemoteDB + ServerDB bağlantıları**
- **AuthInfo ve ServerSettings'ten config yükler**

```typescript
constructor() {
  // 26 veritabanı oluştur
  this.LocalDB = {
    users: new PouchDB('local_users', db_opts),
    checks: new PouchDB('local_checks', db_opts),
    // ... tüm 26
  };

  // Auth'tan RemoteDB bağla
  this.getAllBy('settings', { key: 'AuthInfo' })
    .then(res => {
      this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, authOptions);
    });
}
```

### DatabaseService (src/core/services/database.service.ts)
- **Signal-based reactive layer**
- **PouchDB changes() listener**
- **Signal'leri veritabanı değişiklikleriyle sync tutar**

```typescript
// 10 critical collection
readonly tables = signal<TableDocument[]>([]);
readonly checks = signal<CheckDocument[]>([]);
// ... etc

private watchDatabase(dbName: DatabaseName, targetSignal: any) {
  this.mainService.LocalDB[dbName].changes({
    since: 'now',
    live: true,
    include_docs: true
  }).on('change', (change) => {
    // Signal güncelle
  });
}
```

### Models (src/core/models/)
- **database.types.ts** - PouchDB tip güvenliği
- **26+ Document interfaces** - Veri şemaları
- **DatabaseModelMap** - DB name → Document type mapping

---

## 8. ANGULAR 5 → 21 MIGRATION'DA KORUNAN

✅ **Veritabanı mimarisi değişmedi**
- PouchDB versioning aynı (9.0.0)
- Replication stratejisi aynı
- AuthInfo/ServerSettings flow aynı
- db_name routing aynı

⚠️ **Değişen (Angular 21 zoneless)**
- Signal-based reactive state (DatabaseService)
- RxJS integration (toSignal, from)
- Change detection manual (zone.run())
- ReplaySubject timing fixes (SettingsService)

---

## 9. KRITIK YAPILI DOKÜMANTLAR

### Check Document
```typescript
{
  table_id: "table_1",
  total_price: 450,
  discount: 10,
  owner: "user_123",
  note: "Masayla ilgili not",
  status: CheckStatus.OCCUPIED,
  products: [CheckProduct[]],  // Items on bill
  payment_flow: [PaymentStatus[]],  // Payment history
  occupation: { male: 2, female: 1 },
  type: CheckType.NORMAL,
  timestamp: Date.now()
}
```

### Product Document
```typescript
{
  cat_id: "category_1",
  type: ProductType.AUTOMATIC,
  name: "Çay",
  price: 50,
  tax_value: 8,
  barcode: 123456,
  specifies: [ProductSpecs[]],  // Size/color variants
  status: ProductStatus.ACTIVE
}
```

### Settings Document
```typescript
{
  key: "AppSettings" | "RestaurantInfo" | "ServerSettings" | "Printers" | "AuthInfo",
  value: any,  // Flexible ayar değeri
  description: string,
  timestamp: number
}
```

---

## 10. SYNC HATA SENARYOLARI

### Scenario 1: Offline → Online
1. Lokal değişiklikler allData'da birikir
2. Network gelince RemoteDB'ye replicate
3. Conflict algılandı → merge logic çalışır
4. Başarı → allData'dan ilgili DB'ye dağıt

### Scenario 2: Primary/Secondary Divergence
1. Secondary'de local değişiklik
2. Primary via appServer replicate et
3. Primary'de çakışma varsa resolver çalışır
4. RemoteDB'ye synchronized push

### Scenario 3: CouchDB Bağlantı Kesintisi
1. LocalDB'ler çalışmaya devam (offline-first)
2. Değişiklikler allData'da buffer'a alınır
3. Bağlantı gelince otomatik sync başlar
4. conflict resolution 60s interval'de çalışır

---

## 11. İSTATİSTİKLER

- **26 Local Databases** (transient + persistent)
- **40+ Remote Databases** (HQ API namespaces)
- **3-5 Sync Paths** (LocalDB ↔ allData ↔ RemoteDB)
- **1 Conflict Resolver** (60s interval)
- **22 Document Types** (Type-safe interfaces)
- **100% Offline Capable** (Memory adapter işlev görür)

---

## 12. CURRENT STATE (Angular 21)

### ✅ Çalışan
- PouchDB initialization
- Local CRUD operations
- RemoteDB connection setup
- AuthInfo loading
- ServerSettings routing
- Signal-based DatabaseService

### ⚠️ Fixed (Bu session'da)
- Subject → ReplaySubject(1) (timing issues)
- Component recreation with [key] input (form data loading)
- ApplicationSettingsComponent fillData()
- Form validators type safety (.trim())
- Logo path double slash

### 🔍 Devam Eden
- Veritabanı sync operational mu diye test etmek gerekir
- Offline capability doğrulanmalı
- Conflict resolution scenario'ları test edilmeli
