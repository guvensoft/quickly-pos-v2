# Angular 21, TypeScript 5.9 ve RxJS 7.8.2 Geliştirici Kılavuzu

Bu belge, projemizdeki temel teknolojilerin en güncel sürümlerine (Angular 21, TypeScript 5.9, RxJS 7.8.2) dair resmi dökümantasyon özetlerini, kuralları ve kullanım örneklerini içermektedir.

---

## 1. Angular 21: Modern ve Fonksiyonel Yaklaşım

Angular 21, performansı optimize eden ve geliştirici deneyimini (DX) artıran radikal değişikliklerle gelmektedir.

### 🚀 Temel Yenilikler
- **Varsayılan Zoneless:** Artık yeni projeler `Zone.js` bağımlılığı olmadan (Zoneless) başlatılmaktadır. Bu, daha küçük paket boyutları ve daha hızlı çalışma zamanı performansı sağlar.
- **Signal Forms (Deneysel):** Signals üzerine kurulu yeni bir Form API'si. Tam tip güvenliği ve senkronizasyon sunar.
- **Vitest Desteği:** Test koşucusu olarak Karma/Jasmine yerine Vitest varsayılan hale gelmiştir.
- **MCP (Model Context Protocol) Entegrasyonu:** AI araçlarının projeyi, dökümantasyonu ve en iyi uygulamaları anlamasını sağlayan yerleşik bir sunucu desteği.
- **Dahili HttpClient:** `provideHttpClient()` artık yeni projelerde otomatik olarak yapılandırılmaktadır.

### 💡 Kullanım Örnekleri

#### Component Yapısı (Signals & Zoneless)
```typescript
import { Component, signal, computed, effect } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>Sayaç: {{ count() }}</div>
    <div>Çift mi?: {{ isEven() }}</div>
    <button (click)="increment()">Artır</button>
  `
})
export class CounterComponent {
  count = signal(0); // Reactive state
  isEven = computed(() => this.count() % 2 === 0); // Derived state

  constructor() {
    effect(() => {
      console.log('Sayaç değişti:', this.count());
    });
  }

  increment() {
    this.count.update(v => v + 1);
  }
}
```

#### Signal Forms (Experimental)
```typescript
import { signalForm, signalControl } from '@angular/forms';

// Yeni Signal-tabanlı form kontrolü
const name = signalControl('Ahmet');
console.log(name.value()); // 'Ahmet'
```

---

## 2. TypeScript 5.9: Tip Güvenliği ve Performans

TypeScript 5.9, derleme hızını artıran ve modül yükleme stratejilerini modernize eden özellikler sunar.

### 🚀 Temel Yenilikler
- **`import defer` Desteği:** Modüllerin sadece bir özelliği erişildiğinde yüklenmesini sağlar (Lazy Loading Modülleri).
- **Yalın `tsc --init`:** Artık çok daha temiz ve modern (`module: nodenext`, `target: esnext`) bir `tsconfig.json` oluşturur.
- **`--module node20` Desteği:** Node.js v20 çalışma zamanı kurallarıyla tam uyumluluk.
- **Gelişmiş Hover (İpucu) Detayları:** IDE üzerinde type detaylarını "+" ve "-" butonlarıyla genişletip daraltabilirsiniz.
- **DOM API Açıklamaları:** MDN'e gitmeye gerek kalmadan doğrudan editör içinde API açıklamaları.

### 💡 Kullanım Örnekleri

#### Deferred Imports (Gecikmeli Yükleme)
```typescript
// Bu modül, 'HeavyComponent' nesnesine erişilene kadar yüklenmez.
import defer * as HeavyStuff from "./heavy-module";

function loadOnDemand() {
    // Modül burada yüklenir ve çalıştırılır.
    const component = new HeavyStuff.HeavyComponent();
}
```

#### Generic SimpleChanges (Angular ile Kullanım)
Angular 21'de `SimpleChanges` artık jenerik desteklemektedir:
```typescript
ngOnChanges(changes: SimpleChanges<MyComponent>) {
  if (changes.myData) {
    console.log(changes.myData.currentValue); // Tam tip güvenliği
  }
}
```

---

## 3. RxJS 7.8.2: Akış Yönetimi ve Signal Uyumluluğu

Signals'ın yükselişiyle birlikte RxJS, hala kompleks asenkron operasyonlar (HTTP, WebSocket, Event Streams) için vazgeçilmezdir.

### 🚀 En İyi Uygulamalar (Best Practices)
- **Signals vs RxJS:**
  - **Signals:** Senkron state, UI durumu, türetilmiş değerler (`computed`).
  - **RxJS:** Asenkron veri akışları, debouncing, throttling, retry mekanizmaları.
- **Subscription Yönetimi:** `async` pipe kullanımına devam edin veya `takeUntilDestroyed()` (Angular Core) operative'ini kullanın.
- **Interop (Geçiş):** `toSignal()` ve `toObservable()` fonksiyonlarını kullanarak iki dünya arasında köprü kurun.

### 💡 Kullanım Örnekleri

#### RxJS Observable'ı Signal'e Dönüştürme
```typescript
import { toSignal } from '@angular/core/rxjs-interop';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export class DataService {
  private http = inject(HttpClient);
  
  // Observable'ı başlangıç değeriyle bir Signal'e çeviriyoruz
  users = toSignal(this.http.get<User[]>('/api/users'), { initialValue: [] });
}
```

#### Karmaşık Operatörler
```typescript
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { FormControl } from '@angular/forms';

// Input araması için hala RxJS en iyisidir
searchControl = new FormControl('');
results$ = this.searchControl.valueChanges.pipe(
  debounceTime(300),
  distinctUntilChanged(),
  switchMap(query => this.api.search(query))
);
```

---

## 🛠 Proje Kuralları (Cheat Sheet)

1. **Standalone İlkem:** Tüm yeni component, pipe ve directive'ler `standalone: true` olmalıdır.
2. **Signal Önceliği:** UI state yönetimi için `BehaviorSubject` yerine `signal()` tercih edilmelidir.
3. **Tip Güvenliği:** `any` kullanımından kaçının. TypeScript 5.9'un getirdiği `node20` ve `nodenext` modül çözünürlüklerini kullanın.
4. **Hafif Modüller:** Büyük kütüphaneler için `import defer` kullanarak başlangıç yükleme süresini (FCP) iyileştirin.
5. **Testler:** Yeni testler Vitest standartlarına göre yazılmalıdır.

---
*Bu kılavuz Angular 21 resmi dökümantasyonu baz alınarak oluşturulmuştur.*
