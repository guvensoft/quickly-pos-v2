# Angular 5→21 Migration: Kapsamlı Kod Audit Framework

## AMAÇ

Angular 5→21 migrasyonunda karşılaştığınız **13 temel sorun kategorisinin** tüm kod tabanında taranması, doğrulanması ve otomatik-manuel fix'lerin uygulanması.

---

## AUDIT KATEGORILERI (13)

### 1. ZONE.RUN() WRAPPER AUDIT

**Sorun Tanısı:**
- Promise resolve'unda signal state mutations zone context'i dışında
- NG0600: "Zone Unaware" hataları
- Change detection kaçırılan updates

**Scan Pattern:**
```bash
# Tüm mainService CRUD çağrılarını bul
grep -rn "mainService\.\(addData\|updateData\|removeData\|getAllBy\)" \
  src/app/components --include="*.ts" | grep "\.then\|\.catch"

# Zone.run() wrapper olmayan çağrılar
grep -rn "\.then(" src/app/components --include="*.ts" -A 3 | \
  grep -B 3 "\.set(" | grep -v "zone.run" | head -50
```

**Fix Template:**
```typescript
// ❌ BEFORE
mainService.addData('checks', newCheck).then(res => {
  this.checks.set([...this.checks(), res]);
});

// ✅ AFTER
mainService.addData('checks', newCheck).then(res => {
  this.zone.run(() => {
    this.checks.set([...this.checks(), res]);
  });
});
```

**Audit Checklist:**
- [ ] addData() tüm çağrılarında zone.run() var mı?
- [ ] updateData() tüm çağrılarında zone.run() var mı?
- [ ] removeData() tüm çağrılarında zone.run() var mı?
- [ ] getAllBy() subsequent operations'da zone.run() var mı?
- [ ] setTimeout/Promise chain'lerde zone.run() var mı?

**Automated Scan Script:**
```bash
#!/bin/bash
# audit-zone-run.sh

echo "=== Zone.run() Wrapper Audit ==="
echo ""

# Promise.then() without zone.run() bulma
echo "Scanning for unprotected .then() calls..."
grep -rn "\.then(" src/app/components --include="*.ts" -A 2 | \
  awk '/\.then\(/{p=1} p{print; if(/^--$/) p=0}' | \
  grep -B 2 "\.set(" | grep -v "zone.run" > /tmp/zone_issues.txt

if [ -s /tmp/zone_issues.txt ]; then
  echo "❌ Found unprotected .then() calls:"
  cat /tmp/zone_issues.txt
  wc -l /tmp/zone_issues.txt
else
  echo "✅ No unprotected .then() calls found"
fi

echo ""
echo "Total addData() calls:"
grep -r "addData(" src/app/components --include="*.ts" | wc -l

echo "addData() calls with zone.run():"
grep -r "addData(" src/app/components --include="*.ts" -A 5 | grep -c "zone.run"
```

---

### 2. SIGNAL STATE MANAGEMENT AUDIT

**Sorun Tanısı:**
- Array mutation (.push()) Signal'de
- Direct property assignment (❌ checks = [])
- Immutability ihlali
- Change detection miss'ler

**Scan Pattern:**
```bash
# Signal'de push/direct assignment bulma
grep -rn "\.push(" src/app/components --include="*.ts" | \
  grep -E "checks|products|orders|tables|customers"

# Direct property assignment bulma (TS class pattern)
grep -rn "this\.\(checks\|products\|orders\) =" src/app/components --include="*.ts" | \
  grep -v "signal(" | grep -v "\.set("
```

**Fix Template:**
```typescript
// ❌ WRONG
this.checks.push(newCheck);  // Direct mutation

// ✅ CORRECT
this.checks.set([...this.checks(), newCheck]);  // Immutable update
```

**Audit Checklist:**
- [ ] checks signal'de .push() var mı?
- [ ] products signal'de .push() var mı?
- [ ] orders signal'de .push() var mı?
- [ ] Tüm array updates spread operator kullanıyor mu?
- [ ] Object updates deep clone var mı?

**Detailed Check List:**
```bash
#!/bin/bash
# audit-signal-immutability.sh

echo "=== Signal Immutability Audit ==="
echo ""

# Push kullanımları
echo "Scanning for .push() on collections..."
grep -rn "\.push(" src/app/components --include="*.ts" | tee /tmp/push_usage.txt
echo "Total .push() usages: $(wc -l < /tmp/push_usage.txt)"

# Direct assignment
echo ""
echo "Scanning for direct property assignment..."
grep -rn "this\.checks\s*=" src/app/components --include="*.ts" | grep -v "set(" | tee /tmp/direct_assign.txt
grep -rn "this\.products\s*=" src/app/components --include="*.ts" | grep -v "set(" >> /tmp/direct_assign.txt
echo "Total direct assignments: $(wc -l < /tmp/direct_assign.txt)"

# Spread operator check
echo ""
echo "Verifying spread operator usage..."
grep -rn "\[...this\." src/app/components --include="*.ts" | grep "\.set(" | wc -l
echo "✅ Spread operator usages found"
```

---

### 3. COMPONENT LIFECYCLE AUDIT

**Sorun Tanısı:**
- NG0203: Effect() ngOnInit() içinde
- DI Injector error (effect constructor'da olmalı)
- fillData() çağrısının timing'i yanlış
- Component recreation [key] input işletmiş mi?

**Scan Pattern:**
```bash
# ngOnInit() içindeki effect bulma
grep -rn "ngOnInit()" src/app/components --include="*.ts" -A 10 | \
  grep -B 5 "effect("

# constructor'da effect var mı kontrol
grep -rn "constructor()" src/app/components --include="*.ts" -A 5 | \
  grep "effect("
```

**Fix Template:**
```typescript
// ❌ WRONG
ngOnInit() {
  effect(() => {
    this.loadData();  // NG0203: Injector error
  });
}

// ✅ CORRECT
constructor() {
  effect(() => {
    this.loadData();  // Proper lifecycle
  });
}

ngOnInit() {
  this.fillData();  // Explicit data loading
}
```

**Audit Checklist:**
- [ ] constructor() 'de effect()? (✅ doğru)
- [ ] ngOnInit() 'de effect()? (❌ yanlış - move to constructor)
- [ ] fillData() ngOnInit() 'de çağrılıyor mu?
- [ ] Component [key] input'ı var mı? (recreation için)
- [ ] viewChild işletiliyor mu? (form reference için)

**Automation:**
```bash
#!/bin/bash
# audit-lifecycle.sh

echo "=== Component Lifecycle Audit ==="
echo ""

# Components with effects in ngOnInit
echo "Looking for effects in ngOnInit()..."
grep -rn "ngOnInit()" src/app/components --include="*.ts" -A 20 | \
  grep -B 15 "effect(" | grep "ngOnInit\|effect" | \
  awk 'NR%2{printf "%s -> ",$0;next}1' > /tmp/lifecycle_issues.txt

if [ -s /tmp/lifecycle_issues.txt ]; then
  echo "❌ Effects in ngOnInit found:"
  cat /tmp/lifecycle_issues.txt
else
  echo "✅ No effects in ngOnInit()"
fi

# Check if components have [key] input
echo ""
echo "Checking for [key] input signal in settings components..."
grep -l "readonly key = input" src/app/components/settings/**/*.ts | wc -l
echo "Settings components with [key] input:"
grep -l "readonly key = input" src/app/components/settings/**/*.ts
```

---

### 4. TEMPLATE DIRECTIVE AUDIT

**Sorun Tanısı:**
- @if (@if conditional'in input check'ı yanlış)
- @for (@for items() yerine statik array)
- async pipe zone wrapper'ı yok
- Form binding'leri reactive değil

**Scan Pattern:**
```bash
# Template file'lardaki @if kullanımı
grep -rn "@if" src/app/components --include="*.html" | head -30

# @for loops
grep -rn "@for" src/app/components --include="*.html" | head -30

# Async pipe
grep -rn "| async" src/app/components --include="*.html" | head -20
```

**Fix Template:**
```html
<!-- ❌ WRONG -->
@if (selected === 1) { }  <!-- Comparing number to undefined? -->
@for (item of items; let i = $index) { }  <!-- Static array? -->
{{ data | async }}  <!-- No zone wrapper? -->

<!-- ✅ CORRECT -->
@if (selected() === 1) { }  <!-- Signal function call -->
@for (item of items(); let i = $index) { }  <!-- Signal function -->
{{ (data$ | async) }}  <!-- Observable with async pipe -->
```

**Audit Checklist:**
- [ ] @if directives signal function call var mı? selected()
- [ ] @for directives array() signal function var mı?
- [ ] selected() === undefined check var mı? (initial state)
- [ ] Form [ngModel]/(ngModelChange) reactive mi?
- [ ] ViewChild form reference pattern doğru mu?

---

### 5. DATABASE OPERATION AUDIT

**Sorun Tanısı:**
- 404 errors silent değil
- getAllBy() response type check yok
- Cascade delete kuralları yok
- db_name field'ı populate edilmiyor

**Scan Pattern:**
```bash
# Tüm getData/getAllBy çağrıları
grep -rn "getAllBy\|getData" src/app/components --include="*.ts" | head -30

# Error handling check
grep -rn "\.then(" src/app/components --include="*.ts" | grep -v "catch\|error" | head -20

# db_name field kullanımı
grep -rn "db_name" src/app --include="*.ts"
```

**Fix Template:**
```typescript
// ❌ WRONG
mainService.getAllBy('products', {}).then(res => {
  this.products.set(res.docs);  // No error handling
});

// ✅ CORRECT
mainService.getAllBy('products', {}).then(res => {
  if (res && res.docs) {
    this.products.set(res.docs);
  } else {
    console.error('No products found');
    this.products.set([]);
  }
}).catch(err => {
  const is404 = err.status === 404 || err.name === 'not_found';
  if (!is404) {
    console.error('Error loading products:', err);
  }
});
```

**Audit Checklist:**
- [ ] getAllBy() calls'da response validation var mı?
- [ ] .catch() error handler'ı var mı?
- [ ] 404 errors loglanması suppress ediliyor mu?
- [ ] db_name field'ı otomatik set ediliyor mu?
- [ ] Cascade delete rules implement edilmiş mi?
- [ ] allData replication routing doğru mu?

---

### 6. MODAL & DOM MANIPULATION AUDIT

**Sorun Tanısı:**
- jQuery modal('hide') backdrop'ı silinmiyor
- Aria-hidden warnings
- Focus aktif element'te kalıyor
- Multiple backdrop'lar

**Scan Pattern:**
```bash
# jQuery modal çağrıları
grep -rn "\$('#" src/app/components --include="*.ts" | \
  grep "modal\|show\|hide"

# Backdrop cleanup pattern
grep -rn "modal-backdrop" src/app/components --include="*.ts"

# Focus/blur işlemleri
grep -rn "focus\|blur" src/app/components --include="*.ts"
```

**Fix Template:**
```typescript
// ❌ WRONG
const $ = (window as any).$;
$('#myModal').modal('hide');
// Backdrop kalıyor, focus aktif

// ✅ CORRECT
this.zone.run(() => {
  const $ = (window as any).$;
  const activeElement = document.activeElement as HTMLElement;
  if (activeElement && activeElement.blur) {
    activeElement.blur();  // Remove focus
  }
  $('#myModal').modal('hide');
  $('.modal-backdrop').remove();  // Clean backdrop
  $('body').removeClass('modal-open');  // Remove scroll lock
});
```

**Audit Checklist:**
- [ ] Tüm modal('hide') çağrılarında backdrop cleanup var mı?
- [ ] .blur() aktif element'te var mı?
- [ ] modal-backdrop.remove() var mı?
- [ ] modal-open class'ı remove ediliyor mu?
- [ ] Tüm modal'lar zone.run() içinde mi?

---

### 7. OBSERVABLE & SUBJECT AUDIT

**Sorun Tanısı:**
- Subject timing issue (Cold Observable)
- Component subscribe'ı data miss ediyor
- ReplaySubject(1) değiştirilmedi
- Memory leak (unsubscribe yok)

**Scan Pattern:**
```bash
# Subject kullanımı
grep -rn "Subject<" src/app/core/services --include="*.ts" | grep -v ReplaySubject

# ReplaySubject kullanımı
grep -rn "ReplaySubject" src/app/core/services --include="*.ts"

# Subscribe without unsubscribe
grep -rn "\.subscribe(" src/app/components --include="*.ts" | wc -l
```

**Verification:**
```bash
#!/bin/bash
# audit-observables.sh

echo "=== Observable/Subject Audit ==="
echo ""

# Check SettingsService subjects
echo "Checking SettingsService subjects..."
grep -n "Subject\|ReplaySubject" src/app/core/services/settings.service.ts

echo ""
echo "Checking for Subject (should be ReplaySubject):"
grep "Subject<" src/app/core/services/settings.service.ts | grep -v "ReplaySubject" | wc -l

echo ""
echo "Checking for ReplaySubject(1):"
grep "ReplaySubject<" src/app/core/services/settings.service.ts | wc -l
```

**Fix Template:**
```typescript
// ❌ BEFORE (Angular 5)
AppSettings: Subject<Settings> = new Subject<Settings>();

// ✅ AFTER (Angular 21)
AppSettings: ReplaySubject<Settings> = new ReplaySubject<Settings>(1);
```

**Audit Checklist:**
- [ ] SettingsService'de tüm Subject'ler ReplaySubject(1) mi?
- [ ] Subscribe çağrıları unsubscribe pattern'ı kullanıyor mu?
- [ ] Memory leak test edildi mi?

---

### 8. ERROR HANDLING AUDIT

**Sorun Tanısı:**
- Console.error spam (404'ler)
- Try-catch blokları eksik
- Beklenmeyen hatalar silent geçiliyor
- User feedback yok

**Scan Pattern:**
```bash
# console.error çağrıları
grep -rn "console.error" src/app/components --include="*.ts" | head -20

# Try-catch blokları
grep -rn "try\|catch" src/app/components --include="*.ts" | head -20

# Unhandled rejections
grep -rn "\.then(" src/app/components --include="*.ts" | \
  grep -v "catch\|error" | head -20
```

**Fix Pattern:**
```typescript
// ❌ WRONG
mainService.getData('checks', id).then(res => {
  this.check.set(res);
});
// If error, silent fail

// ✅ CORRECT
mainService.getData('checks', id)
  .then(res => {
    this.check.set(res);
  })
  .catch(err => {
    const is404 = err.status === 404 || err.name === 'not_found';
    if (!is404) {
      console.error('Error loading check:', err);
      this.message.sendMessage('Hesap yüklenemedi');
    }
  });
```

**Audit Checklist:**
- [ ] Tüm promise'ler .catch() handler'ı var mı?
- [ ] Expected errors (404) suppress ediliyor mu?
- [ ] User-facing error message var mı?
- [ ] Try-catch ENOENT gibi file errors için var mı?

---

### 9. TYPE SAFETY AUDIT

**Sorun Tanısı:**
- .trim() on null/undefined
- Type guard eksikliği
- Any typing (❌ kötü)
- Union type handling yok

**Scan Pattern:**
```bash
# .trim() kullanımı
grep -rn "\.trim()" src/app/components --include="*.ts"

# Null check eksikliği
grep -rn "!value\|!data" src/app/components --include="*.ts" | head -20

# Type casting (as any)
grep -rn " as any" src/app/components --include="*.ts" | wc -l
```

**Fix Template:**
```typescript
// ❌ WRONG
if (!name || !name.trim()) {  // name undefined ise error
  // ...
}

// ✅ CORRECT
if (!name || (typeof name === 'string' && !name.trim())) {
  // name is undefined or empty string
}

// Or with non-null assertion
if (name && typeof name === 'string' && !name.trim()) {
  // ...
}
```

**Audit Checklist:**
- [ ] .trim() calls'dan önce typeof check var mı?
- [ ] Null/undefined checks consistent mi?
- [ ] Optional chaining (?.) kullanılıyor mu?
- [ ] as any casting minimize edilmiş mi?

---

### 10. PERFORMANCE AUDIT

**Sorun Tanısı:**
- Unnecessary change detection runs
- Large array mutations
- Computed'ler excessive'ye çalışıyor
- Memory leak'ler

**Scan Pattern:**
```bash
# Computed property sayısı (fazla computed = sorun)
grep -rn "readonly.*computed(" src/app/components --include="*.ts" | wc -l

# Effect sayısı
grep -rn "effect(" src/app/components --include="*.ts" | wc -l

# Component refresh'ler
grep -rn "refreshAll\|refresh()" src/app/components --include="*.ts" | wc -l
```

**Audit Checklist:**
- [ ] Component'lerde excessive computed'ler var mı?
- [ ] Effect'ler optimal mi? (cascade updates?)
- [ ] DatabaseService changes() listeners memory leak var mı?
- [ ] Large array operations inefficient mi?

---

### 11. REPLICATION & SYNC AUDIT

**Sorun Tanısı:**
- allData replication başlamıyor
- db_name field'ı eksik
- Offline conflicts çözülmüyor
- RemoteDB initialization gecikmeli

**Scan Pattern:**
```bash
# allData references
grep -rn "allData" src/app --include="*.ts"

# db_name field assignments
grep -rn "db_name\|replicate\|sync" src/app --include="*.ts"

# RemoteDB initialization
grep -rn "remoteDBReady" src/app --include="*.ts"
```

**Audit Checklist:**
- [ ] mainService remoteDBReady signal'ı bekleniyor mu?
- [ ] allData replication live mi?
- [ ] db_name field'ı otomatik set ediliyor mu?
- [ ] Conflict resolver 60s interval'de çalışıyor mu?
- [ ] Offline mode'de buffer'a alıyor mu?

---

### 12. UI/UX AUDIT

**Sorun Tanısı:**
- Form validation feedback yok
- Loading states eksik
- Toast/message delay'ler yok
- Disabled buttons hala clickable

**Scan Pattern:**
```bash
# Message.send çağrıları
grep -rn "messageService.send" src/app/components --include="*.ts" | wc -l

# isLoading signals
grep -rn "isLoading\|loading" src/app/components --include="*.ts" | wc -l

# disabled [attr.disabled]
grep -rn "\[disabled\]" src/app/components --include="*.html" | wc -l
```

**Audit Checklist:**
- [ ] Form submit'te loading state var mı?
- [ ] Success/error messages gösteriliyor mu?
- [ ] Validation error messages user-friendly mi?
- [ ] Buttons disabled state'de clickable değil mi?
- [ ] Form reset after submit var mı?

---

### 13. COMPATIBILITY AUDIT

**Sorun Tanısı:**
- Chart.js xAxes/yAxes deprecation
- jQuery version incompatibility
- Bootstrap modal API change
- PouchDB adapter version mismatch

**Scan Pattern:**
```bash
# Chart.js configuration
grep -rn "xAxes\|yAxes\|legend:" src/app/components --include="*.ts"

# Bootstrap modal
grep -rn "modal(" src/app/components --include="*.ts" | wc -l

# PouchDB configuration
grep -rn "adapter:\|revs_limit\|auto_compaction" src/app/core --include="*.ts"
```

**Fix Patterns:**
```typescript
// ❌ WRONG (Chart.js v2)
scales: {
  xAxes: [{ ... }],
  yAxes: [{ ... }],
  legend: { labels: { fontColor: ... } }
}

// ✅ CORRECT (Chart.js v3)
scales: {
  x: { ... },
  y: { ... }
},
plugins: {
  legend: { labels: { color: ... } }
}
```

**Audit Checklist:**
- [ ] Chart.js configs v3 syntax mı?
- [ ] Bootstrap 5 modal API mı?
- [ ] PouchDB 9.0.0 configuration doğru mu?
- [ ] jQuery version compatibility?

---

## MASTER AUDIT CHECKLIST

### Ön Koşullar
- [ ] Angular 21 gereklilikler (Node, npm, versions) doğru
- [ ] Tüm dependencies npm install'ed
- [ ] TypeScript strict mode aktif
- [ ] ESLint rules doğru ayarlanmış

### Audit Sequence

#### Gün 1: Foundation Audits
- [ ] Zone.run() wrapper audit
- [ ] Signal immutability audit
- [ ] Component lifecycle audit

#### Gün 2: Integration Audits
- [ ] Template directive audit
- [ ] Database operation audit
- [ ] Modal & DOM audit

#### Gün 3: Quality Audits
- [ ] Observable/Subject audit
- [ ] Error handling audit
- [ ] Type safety audit

#### Gün 4: Performance & Sync
- [ ] Performance audit
- [ ] Replication & sync audit
- [ ] Compatibility audit

#### Gün 5: Final QA
- [ ] UI/UX audit
- [ ] Manual testing
- [ ] Sign-off

---

## AUTOMATED AUDIT SUITE

```bash
#!/bin/bash
# run-all-audits.sh

echo "╔════════════════════════════════════════════════════╗"
echo "║   Angular 5→21 COMPREHENSIVE CODE AUDIT SUITE     ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

AUDIT_DIR="/tmp/audits"
mkdir -p $AUDIT_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT="$AUDIT_DIR/AUDIT_REPORT_$TIMESTAMP.md"

echo "# Audit Report - $TIMESTAMP" > $REPORT
echo "" >> $REPORT

# 1. Zone.run() Audit
echo "Running Zone.run() Audit..."
bash ./scripts/audit-zone-run.sh >> $REPORT 2>&1

# 2. Signal Immutability Audit
echo "Running Signal Immutability Audit..."
bash ./scripts/audit-signal-immutability.sh >> $REPORT 2>&1

# 3. Component Lifecycle Audit
echo "Running Component Lifecycle Audit..."
bash ./scripts/audit-lifecycle.sh >> $REPORT 2>&1

# 4-12: Diğer audits...
# (her audit script'i çalıştır)

# Summary
echo "" >> $REPORT
echo "## SUMMARY" >> $REPORT
echo "" >> $REPORT
echo "Total issues found: $(grep -c "❌" $REPORT)" >> $REPORT
echo "Warnings: $(grep -c "⚠️" $REPORT)" >> $REPORT
echo "Passed checks: $(grep -c "✅" $REPORT)" >> $REPORT

echo ""
echo "Audit complete! Report: $REPORT"
cat $REPORT
```

---

## ISSUE LOGGING TEMPLATE

Bulduğun her sorun için:

```markdown
## Issue #[N]: [Title]

**Category:** [Zone.run / Signals / Lifecycle / etc]
**Component:** [src/app/.../.ts]
**Line:** [Line number]
**Severity:** 🔴 CRITICAL / 🟠 HIGH / 🟡 MEDIUM / 🟢 LOW

### Current Code
\`\`\`typescript
[PASTE PROBLEMATIC CODE]
\`\`\`

### Problem Description
[What's wrong and why]

### Expected Behavior
[How it should work]

### Fix Applied
\`\`\`typescript
[PASTE FIXED CODE]
\`\`\`

### Test Result
- [ ] Unit test pass
- [ ] Integration test pass
- [ ] E2E test pass
- [ ] No console errors
- [ ] No data corruption

### Commit
[SHA] - [Message]
```

---

## SUCCESS METRICS

After running all audits:

- [ ] 0 Zone.run() violations
- [ ] 0 Signal immutability violations
- [ ] 0 ngOnInit effect() calls
- [ ] 0 unprotected .then() calls
- [ ] 0 unhandled promise rejections
- [ ] 0 .trim() type errors
- [ ] 0 jQuery modal backdrop issues
- [ ] 0 Subject vs ReplaySubject mismatches
- [ ] 0 404 console spam
- [ ] 0 memory leaks
- [ ] 100% Type safety
- [ ] 100% error handling coverage
- [ ] All tests passing

---

## NEXT STEPS

1. Create audit scripts directory: `scripts/audit-*.sh`
2. Run full audit suite
3. Generate report
4. Fix issues by severity (CRITICAL → LOW)
5. Re-run audits after fixes
6. Sign-off when metrics = 100%
