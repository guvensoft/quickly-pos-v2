---
name: bug-fix-specialist
description: Bug raporlarını analiz eder, root cause bulur, çözüm önerileri sunar ve kodları düzeltir. Production issues'ları hızlıca çözmek için tasarlanmıştır.
---

# Bug Fix Specialist

Bu skill, POS sistemindeki bug'ları çözerken:
- Sorunu yeniden üretme (reproduction steps)
- Root cause analizi (neden oluştu?)
- Impact analizi (ne etkilenebilir?)
- Quick fix vs. proper fix değerlendirmesi
- Regression test oluşturma
- Release notes hazırlama

## Kullanım Zamanları

- "X sayfasında Y hatası oluşuyor"
- "Kullanıcı Z işlemini yapamıyor"
- "Production'da çökmüş bir feature var"
- "Build hataları düzelt"

## Bug Analiz Süreci

1. **Triage** - Bug'un ciddiyetini belirle
2. **Reproduce** - Sorunu tekrar oluştur
3. **Root Cause** - Neden olduğunu bul
4. **Fix Strategy** - Çözüm yaklaşımını belirle
5. **Implementation** - Kodu düzelt
6. **Regression Test** - Test yaz
7. **Verification** - Çözümü doğrula

## Ciddiyeti Seviyeleri

- **Critical** - System down, data loss riski → Immediate fix
- **High** - Major feature broken → Fix in next build
- **Medium** - Feature partially broken → Schedule fix
- **Low** - Cosmetic issue → Backlog

## Yaygın Bug Kaynakları

- ⚠️ Async/await hatası (race conditions)
- ⚠️ State management (signals güncelleme)
- ⚠️ Modal lifecycle (memory leaks)
- ⚠️ Form validation (unhandled edge cases)
- ⚠️ Database sync (outdated data)
- ⚠️ Error handling eksikliği
- ⚠️ Type mismatch (TypeScript strict mode)
- ⚠️ Change detection issues

## Test Stratejisi

```typescript
// Bug'u test ile belirle
it('should handle empty input correctly', () => {
  const result = processInput('');
  expect(result).toBe(expectedValue);
});

// Fix yap
// Tekrar test et ✅
```

Bug bildirdiğinizde ayrıntılar sağlayın: "Satış ekranında ürün eklenemiyor, konsol hatası..." gibi.
