# PHASE 4 - TASK 4.2: Migrate Component State to Signals
## Implementation Plan

**Task Duration:** ~4 hours
**Status:** PENDING
**Last Updated:** 2025-12-27

---

## Overview

Task 4.2 focuses on converting local component state variables and RxJS observables to Angular Signal patterns using `signal()`, `computed()`, and `effect()` APIs.

### Goals
- Convert remaining state management patterns to Signal-based API
- Replace RxJS subscriptions with effect() where appropriate
- Add computed() properties for derived/filtered state
- Improve component reactivity and change detection

### Key Patterns
1. **signal() → state management** - Replace boolean flags, selections, form data
2. **computed() → derived state** - Filter, map, aggregate operations
3. **effect() → side effects** - RxJS replacements, auto-load, persistence

---

## Implementation Order

### PHASE 4.2.1: Customer Settings Component
**File:** `src/app/components/settings/customer-settings/customer-settings.component.ts`
**Priority:** HIGH - Has RxJS subscriptions to replace
**Duration:** 45 minutes

#### Changes
1. Replace RxJS subscriptions with effect()
   - DateSettings subscription → effect()
   - getPrinters subscription → effect()
2. Add computed() properties:
   - customerCredits (Map of customer → total credit)
   - sortedCreditsView (pre-sorted credits)
   - selectedCustomerObj (reactive lookup)
   - selectedCustomerCredits (filtered credits)
3. Add side effect with effect():
   - Auto-filter credits when customer selected

#### Implementation Steps
- [ ] Convert DateSettings subscription to effect()
- [ ] Convert getPrinters subscription to effect()
- [ ] Add customerCredits computed()
- [ ] Add sortedCreditsView computed()
- [ ] Add selectedCustomerObj computed()
- [ ] Add selectedCustomerCredits computed()
- [ ] Add effect() for filterChecks auto-trigger
- [ ] Update ngOnInit to remove subscriptions
- [ ] Build and test
- [ ] Commit

---

### PHASE 4.2.2: Application Settings Component
**File:** `src/app/components/settings/application-settings/application-settings.component.ts`
**Priority:** HIGH - Multiple RxJS subscriptions
**Duration:** 60 minutes

#### Changes
1. Replace RxJS subscriptions with effect()
   - AppSettings subscription → effect()
   - RestaurantInfo subscription → effect()
   - ServerSettings subscription → effect()
   - getPrinters subscription → effect()
2. Add computed() properties:
   - isPrinterSelected
   - isAnyPrinterFound
   - hasChosenPrinter
   - currentSectionLabel
   - canAddPrinter

#### Implementation Steps
- [ ] Convert AppSettings subscription to effect()
- [ ] Convert RestaurantInfo subscription to effect()
- [ ] Convert ServerSettings subscription to effect()
- [ ] Convert getPrinters subscription to effect()
- [ ] Add isPrinterSelected computed()
- [ ] Add isAnyPrinterFound computed()
- [ ] Add hasChosenPrinter computed()
- [ ] Add currentSectionLabel computed()
- [ ] Add canAddPrinter computed()
- [ ] Update ngOnInit to remove subscriptions
- [ ] Build and test
- [ ] Commit

---

### PHASE 4.2.3: Menu Settings Component
**File:** `src/app/components/settings/menu-settings/menu-settings.component.ts`
**Priority:** MEDIUM - Complex state but mostly signals
**Duration:** 75 minutes

#### Changes
1. Add computed() properties:
   - productsByCategory
   - subCategoriesBySelected
   - totalRecipeItems
   - canAddRecipe
   - productTypeLabel
2. Add effect() for side effects:
   - Reset recipe when product type changes
   - Clear product specs when type changes
   - Sync recipe validation state

#### Implementation Steps
- [ ] Add productsByCategory computed()
- [ ] Add subCategoriesBySelected computed()
- [ ] Add totalRecipeItems computed()
- [ ] Add canAddRecipe computed()
- [ ] Add productTypeLabel computed()
- [ ] Add effect() for type change → recipe reset
- [ ] Add effect() for type change → specs clear
- [ ] Add effect() for recipe validation sync
- [ ] Update methods to use computed properties
- [ ] Build and test
- [ ] Commit

---

### PHASE 4.2.4: Stock Settings Component
**File:** `src/app/components/settings/stock-settings/stock-settings.component.ts`
**Priority:** MEDIUM - Good signal usage, needs computed()
**Duration:** 45 minutes

#### Changes
1. Add computed() properties:
   - stocksByCategory
   - lowStockItems
   - totalStockValue
   - selectedStockDetails
2. Add effect() for side effects:
   - Load stock details when selected
   - Validate quantity changes

#### Implementation Steps
- [ ] Add stocksByCategory computed()
- [ ] Add lowStockItems computed()
- [ ] Add totalStockValue computed()
- [ ] Add selectedStockDetails computed()
- [ ] Add effect() for load on selection
- [ ] Add effect() for quantity validation
- [ ] Update methods to use computed properties
- [ ] Build and test
- [ ] Commit

---

### PHASE 4.2.5: User Settings Component
**File:** `src/app/components/settings/user-settings/user-settings.component.ts`
**Priority:** MEDIUM - Already good, needs computed()
**Duration:** 30 minutes

#### Changes
1. Add computed() properties:
   - selectedGroupObj
   - usersByGroup
   - hasSelectedGroup
   - isInUpdateMode
2. Add effect() for side effects:
   - Load group details when selected
   - Load users when group selected
   - Clear form when switching to create mode

#### Implementation Steps
- [ ] Add selectedGroupObj computed()
- [ ] Add usersByGroup computed()
- [ ] Add hasSelectedGroup computed()
- [ ] Add isInUpdateMode computed()
- [ ] Add effect() for group load on selection
- [ ] Add effect() for users load on group change
- [ ] Add effect() for form clear on mode switch
- [ ] Update methods to use computed properties
- [ ] Build and test
- [ ] Commit

---

### PHASE 4.2.6: Restaurant Settings Component
**File:** `src/app/components/settings/restaurant-settings/restaurant-settings.component.ts`
**Priority:** MEDIUM - Good signal usage, needs computed()
**Duration:** 30 minutes

#### Changes
1. Add computed() properties:
   - tablesByFloor (filtered & sorted)
   - selectedFloorObj
   - selectedTableObj
   - floorStats
   - isUpdatingFloor
   - isUpdatingTable

#### Implementation Steps
- [ ] Add tablesByFloor computed()
- [ ] Add selectedFloorObj computed()
- [ ] Add selectedTableObj computed()
- [ ] Add floorStats computed()
- [ ] Add isUpdatingFloor computed()
- [ ] Add isUpdatingTable computed()
- [ ] Update methods to use computed properties
- [ ] Build and test
- [ ] Commit

---

## Summary of Changes by Type

### Signal() Usage (Already Good - Maintain)
- Store component: ~6 signals
- Menu settings: ~18 signals
- User settings: ~5 signals
- Other settings: 5-11 signals each

### computed() to Add (Estimated 20+ new)
- Filter/derived properties: 12-15
- Validation states: 3-5
- Display labels: 2-3
- Statistics: 2-3

### effect() to Add (Estimated 10+ new)
- RxJS subscription replacements: 4 effects
- Auto-load patterns: 3 effects
- Auto-clear/reset patterns: 2 effects
- Validation/sync patterns: 2+ effects

### RxJS Subscriptions to Replace
- Customer Settings: 2 subscriptions
- Application Settings: 3+ subscriptions
- Store: 0 (already clean)
- Others: minimal

---

## Build Verification Strategy

After each component conversion:
1. Run `npm run build` to verify TypeScript compilation
2. Check for:
   - All computed() and effect() dependencies satisfied
   - No "signal accessed outside effect" warnings
   - No type mismatches in computed return types
3. Commit if build passes

Target build time: 19-21 seconds (consistent with Phase 4.1)

---

## Testing Validation Points

### Functional Tests
- [ ] Form visibility toggles work (computed onUpdate + selected)
- [ ] Filters apply correctly (computed filtered arrays)
- [ ] Auto-load triggers (effect() subscriptions)
- [ ] Derived data updates reactively

### State Management Tests
- [ ] No signal write side effects outside effect()
- [ ] computed() dependencies change correctly
- [ ] effect() runs only when dependencies change
- [ ] No memory leaks from effects

---

## Timeline

| Phase | Component | Time | Status |
|-------|-----------|------|--------|
| 4.2.1 | Customer Settings | 45m | PENDING |
| 4.2.2 | Application Settings | 60m | PENDING |
| 4.2.3 | Menu Settings | 75m | PENDING |
| 4.2.4 | Stock Settings | 45m | PENDING |
| 4.2.5 | User Settings | 30m | PENDING |
| 4.2.6 | Restaurant Settings | 30m | PENDING |
| TEST | Build + Verification | 30m | PENDING |
| FINAL | Testing & Documentation | 30m | PENDING |

**Total Duration:** ~4 hours (285 minutes)

---

## Success Criteria

✅ All components build successfully
✅ No compilation errors
✅ All RxJS subscriptions removed from components
✅ computed() properties used for filtered/derived state
✅ effect() used for side effects and subscriptions
✅ Zero "allowSignalWrites" usage needed (clean patterns)
✅ 100% of planned components converted
✅ All commits pushed to remote branch

---

## Next Phase: 4.3

After 4.2 completion, Task 4.3 will focus on:
- Signal-based form validation patterns
- Replace form observable value changes with signals
- Implement reactive form state management
- Add computed() validators

---

## Notes

- Use `inject(DestroyRef).onDestroy()` with `takeUntilDestroyed()` for effect cleanup if needed
- Prefer `computed()` over `effect()` for derived state (safer, more performant)
- Keep `effect()` for side effects only (async, persistence, UI updates)
- Document any complex computed() properties with comments
- Maintain TypeScript strict mode compliance
