---
name: async-operations-analyzer
description: Asenkron işlemleri analiz eder, race conditions bulur, error handling problemlerini tespit eder ve async/await patterns'ı optimize eder.
---

# Async Operations Analyzer

Bu skill, POS sistemindeki asenkron işlemleri analiz ederken:
- Race conditions detection
- Promise chain vs async/await optimization
- Unhandled rejection detection
- Timeout management
- Concurrent operation conflicts
- Error propagation
- Retry strategies
- Loading states management

## Yaygın Async Problemleri

### 1. Race Condition
```typescript
// ❌ KÖTÜ - Race condition riski
async loadData() {
  const data1 = await this.api.fetch1();
  const data2 = await this.api.fetch2();
  // data1 ve data2 arasında state değişebilir
}

// ✅ İYİ - Paralel istek
async loadData() {
  const [data1, data2] = await Promise.all([
    this.api.fetch1(),
    this.api.fetch2()
  ]);
}
```

### 2. Unhandled Rejection
```typescript
// ❌ KÖTÜ - Error handling yok
this.apiService.saveData(data);

// ✅ İYİ - Error handling var
this.apiService.saveData(data)
  .catch(error => {
    console.error('Save failed:', error);
    this.showErrorMessage('Veri kaydedilemedi');
  });
```

### 3. Memory Leak - Subscription
```typescript
// ❌ KÖTÜ - Component destroy'da unsubscribe yok
this.service.data$.subscribe(data => {
  this.items.set(data);
});

// ✅ İYİ - takeUntil pattern
private destroy$ = new Subject<void>();

ngOnInit() {
  this.service.data$
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => this.items.set(data));
}

ngOnDestroy() {
  this.destroy$.next();
  this.destroy$.complete();
}
```

### 4. Promise Chain Hell
```typescript
// ❌ KÖTÜ - Callback hell
this.save().then(r1 => {
  return this.validate(r1).then(r2 => {
    return this.notify(r2).then(r3 => {
      return this.log(r3);
    });
  });
});

// ✅ İYİ - Async/await
async process() {
  const r1 = await this.save();
  const r2 = await this.validate(r1);
  const r3 = await this.notify(r2);
  return await this.log(r3);
}
```

## Kontrol Listesi

### API Calls
- [ ] Error handling var mı?
- [ ] Loading state var mı?
- [ ] Timeout ayarı var mı?
- [ ] Retry logic var mı?
- [ ] Race condition riski var mı?

### Event Handlers
- [ ] Async click handler'lar debounce/throttle'landı mı?
- [ ] Double-submit protection var mı?
- [ ] Loading state gösterilip update block'landı mı?

### Subscriptions
- [ ] Component destroy'da unsubscribe var mı?
- [ ] takeUntil veya async pipe kullanılmış mı?
- [ ] Memory leak riski var mı?

## Timeout Stratejisi

```typescript
// API çağrıları için timeout
this.http.get('/api/data')
  .pipe(
    timeout(5000), // 5 saniye
    catchError(error => {
      if (error.name === 'TimeoutError') {
        return throwError('İşlem zaman aşımına uğradı');
      }
      return throwError(error);
    })
  );
```

## Retry Strategy

```typescript
// Failed istek'leri retry et
this.http.get('/api/data')
  .pipe(
    retry({ count: 3, delay: 1000 }),
    catchError(error => throwError('Tekrar deneme başarısız'))
  );
```

"API çağrıları karışık görünüyor" veya "Veri kaydetme işlemi yavaş" gibi şikayetleri analiz edeceğim.
