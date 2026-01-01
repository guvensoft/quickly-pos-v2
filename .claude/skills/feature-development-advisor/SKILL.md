---
name: feature-development-advisor
description: Yeni özellikler geliştirirken mimari uyum, performans etkileri ve best practices önerileri sunar. İstekte bulunduğunuzda özellikleri implement eder ve testlerini yazar.
---

# Feature Development Advisor

Bu skill, Angular 21 tabanlı POS sistemine yeni özellikler eklerken:
- Proje mimarisine uygun tasarım önerileri
- Asenkron işlemler ve state management yaklaşımları
- Database şeması ve model tasarımı
- UI/UX implementasyonu
- Test stratejileri
- Performans dikkat noktaları

## Kullanım Zamanları

- "Yeni X özelliğini eklemek istiyorum"
- "X özelliği nasıl implement edilmeli?"
- "Y modülüne Z özelliği ekle"

## Süreci

1. **Analiz** - Mevcut mimaride özelliğin yeri
2. **Tasarım** - Teknik yaklaşım ve komponentler
3. **Uygulama** - Kod yazma ve entegrasyon
4. **Test** - Unit ve integration testler
5. **Dokümentasyon** - API ve usage dokümanı

## Best Practices Kuralları

- ✅ Angular signals ile modern state management
- ✅ Reactive forms for input validation
- ✅ CDK Dialog için modals
- ✅ Type-safe TypeScript kullanımı
- ✅ Lazy loading modules
- ✅ Error handling ve user feedback
- ❌ jQuery kullanımı (deprecated)
- ❌ Promise chains (async/await tercih et)
- ❌ Inline styles (SCSS kullan)

## Proje Yapısı

```
src/
├── app/
│   ├── components/          # Smart components
│   ├── shared/modals/      # Reusable modals
│   ├── core/
│   │   ├── models/         # Data models
│   │   ├── services/       # Business logic
│   │   └── guards/         # Route guards
│   └── styles/
├── assets/
└── environments/
```

## Dialog Facade Örneği

```typescript
// Dialog açma
this.dialogFacade.openConfirmModal({
  title: 'Onay',
  message: 'İşlemi onayla?'
}).subscribe(result => {
  if (result) { /* işlem */ }
});
```

Yeni özellik isteyebilirsiniz - "Müşteri not sistemi ekle" gibi.
