---
name: ui-analyzer
description: UI/UX sorunlarını analiz eder, kullanıcı deneyimini değerlendirir, accessibility önerisi sunar ve iyileştirme raporu hazırlar.
---

# UI Analyzer

Bu skill, POS sisteminin arayüzünü analiz ederken:
- Responsivness kontrol (mobile, tablet, desktop)
- Accessibility audit (WCAG 2.1 AA uyumluluğu)
- Usability heuristics evaluation
- Color contrast ve readability
- Component consistency
- Layout issues
- Navigation clarity
- Error message clarity

## Analiz Çerçevesi

### 1. Responsivness
```
✓ Desktop (1920x1080)
✓ Tablet (768x1024)
✓ Mobile (375x667)
✓ Touch interactions
```

### 2. Accessibility (WCAG 2.1 AA)
```
✓ Keyboard navigation (Tab, Enter, Escape)
✓ Screen reader support (ARIA labels)
✓ Color contrast (4.5:1 normal, 3:1 large)
✓ Focus indicators (visible outline)
✓ Form labels (associated with inputs)
✓ Alt text (images)
```

### 3. Usability Heuristics (Nielsen)
1. **Visibility of System Status** - User feedback (loading, success, error)
2. **Match System and Real World** - Kullanıcı dili ve terminoloji
3. **User Control and Freedom** - Undo/Cancel seçenekleri
4. **Error Prevention** - Confirmation dialogs
5. **Error Recovery** - Clear error messages
6. **Flexibility and Efficiency** - Shortcuts, quick actions
7. **Aesthetic and Minimalist** - Clutter'dan kaçın
8. **Help and Documentation** - Tooltips, help sections

## Komponente Özgü Kontrol Listesi

### Modal Components
- [ ] Escape ile kapatılabiliyor mu?
- [ ] Focus trap (keyboard tuzağı) var mı?
- [ ] Accessible title var mı?
- [ ] Backdrop tıklaması ile kapatılabiliyor mu?
- [ ] Z-index correct mi?

### Forms
- [ ] Tüm input'larda label var mı?
- [ ] Validation mesajları clear mi?
- [ ] Required alanlar işaretli mi?
- [ ] Error states görünür mü?
- [ ] Success states görünür mü?

### Tables
- [ ] Responsive horizontal scroll?
- [ ] Sortable columns accessible?
- [ ] Pagination clear mi?
- [ ] Sticky header var mı?

## Rapor Şablonu

```markdown
# UI Audit Raporu - [Date]

## Özet
- Critical Issues: X
- High Issues: X
- Medium Issues: X
- Low Issues: X

## Critical Issues (Immediate Fix)
1. [Issue]
   - Impact: [Impact]
   - Fix: [Solution]

## Öneriler
1. [Recommendation]
   - Priority: [High/Medium/Low]
   - Effort: [Small/Medium/Large]
```

"Satış ekranı kalabalık görünüyor" veya "Mobilde sayfalar kötü oluyor" gibi feedback'i detaylandıracağım.
