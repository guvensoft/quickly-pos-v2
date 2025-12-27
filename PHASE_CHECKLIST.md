# ✅ PHASE-BY-PHASE CHECKLIST

Quick reference for each migration phase. Use this alongside MIGRATION_SUPERVISION.md

---

## PHASE 1: Infrastructure & Zoneless Setup

### 🎯 Goal
Enable Angular 21 modern architecture (Zoneless) and prepare foundation for Reactive migration.

### 📋 Tasks

- [ ] **TASK 1.1: Enable Zoneless Mode**
  - [ ] Open: `src/main.ts`
  - [ ] Line 41: Change `provideZoneChangeDetection()` → `provideExperimentalZonelessChangeDetection()`
  - [ ] Open: `package.json`
  - [ ] Find and REMOVE: `"zone.js": "0.16.0"` line
  - [ ] Run: `npm install`
  - [ ] Test: `npm run build` ✅ (must pass)
  - [ ] Commit: `PHASE-1: fix - Enable Zoneless Change Detection`

- [ ] **TASK 1.2: Create Database Type Definitions**
  - [ ] Create file: `src/app/core/models/database.types.ts`
  - [ ] Define: `type DatabaseName`
  - [ ] Define: `interface PouchDBDocument`
  - [ ] Define: `interface PouchDBFindResult<T>`
  - [ ] Define: `interface BulkDocsResponse`
  - [ ] Test: `npm run build` ✅ (must pass)
  - [ ] Commit: `PHASE-1: feat - Add database type definitions`

- [ ] **TASK 1.3: Add Signal Wrapper to MainService**
  - [ ] Open: `src/app/core/services/main.service.ts`
  - [ ] Import: `signal`, `effect` from '@angular/core'
  - [ ] Import: `toObservable` from '@angular/core/rxjs-interop'
  - [ ] Add Signal properties:
    - [ ] `dataLoaded = signal(false)`
    - [ ] `syncInProgress = signal(false)`
    - [ ] `lastSyncError = signal<Error | null>(null)`
  - [ ] Convert `getAllBy()` method:
    - [ ] Return type: `Observable<T[]>` (not Promise)
    - [ ] Add error handling with Signal
    - [ ] Add try-catch with proper error logging
  - [ ] Add new method: `getAllBySignal<T>(): Signal<T[]>`
  - [ ] Test: `npm run build` ✅ (must pass)
  - [ ] Commit: `PHASE-1: feat - Add Signal wrapper to MainService`

- [ ] **TASK 1.4: Weekly Verification**
  - [ ] `npm run build` → ✅ PASS
  - [ ] `npm run ng:serve` → ✅ START without errors
  - [ ] Browser console → ✅ No TypeScript errors
  - [ ] Check: No `any` type regressions (run grep before/after)

### ✅ Phase 1 Complete When:
- ✅ Zoneless enabled (no Zone.js in package.json)
- ✅ Build passes without errors
- ✅ Database types defined
- ✅ MainService has Signal properties
- ✅ getAllBy returns Observable<T[]>

---

## PHASE 2: Reactive Data Layer (CRITICAL)

### 🎯 Goal
Transform PouchDB database layer from Promise-based to Reactive (Signals + Observables) pattern.

### ⚠️ Critical Note
**This is NOT Type Safety Sweeping.** This is true architectural migration.
- ❌ Adding null-checks to Promise chains = NOT this phase
- ✅ Converting to Observable + Signal wrapper = THIS phase

### 📋 Tasks

- [ ] **TASK 2.1: Convert getAllBy() to Observable Pattern**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] Update method signature:
    ```typescript
    getAllBy<T = PouchDBDocument>(
      db: DatabaseName,
      $schema?: Record<string, any>
    ): Observable<T[]>
    ```
  - [ ] Implementation uses Promise internally but wraps in Observable
  - [ ] Error handling: Catch errors and set Signal state
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: feat - Convert getAllBy to Observable pattern`

- [ ] **TASK 2.2: Implement getAllBySignal() Method**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] New method: `getAllBySignal<T>(db, $schema): Signal<T[]>`
  - [ ] Uses: `toSignal()` with `initialValue: []`
  - [ ] Purpose: Direct Signal return for components
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: feat - Add getAllBySignal for Signal-based components`

- [ ] **TASK 2.3: Convert removeAll() Method**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] Update to Reactive pattern (Observable return)
  - [ ] Proper type: `Promise<DeleteResult>` or `Observable<DeleteResult>`
  - [ ] Error handling with Signal
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: refactor - Convert removeAll to Reactive pattern`

- [ ] **TASK 2.4: Convert loadAppData() Method**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] Similar pattern: Promise → Observable with Signal error handling
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: refactor - Convert loadAppData to Reactive pattern`

- [ ] **TASK 2.5: Convert syncToLocal() and syncToRemote() Methods**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] Both methods: Reactive pattern
  - [ ] Add sync progress Signal tracking
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: refactor - Convert sync methods to Reactive pattern`

- [ ] **TASK 2.6: Update getData() Method**
  - [ ] File: `src/app/core/services/main.service.ts`
  - [ ] Signature: `getData<T>(id: string, db?: DatabaseName): Promise<T>`
  - [ ] Add proper generic type support
  - [ ] Error handling with Signal
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: fix - Make getData fully type-safe`

- [ ] **TASK 2.7: Reactive ConflictService Updates**
  - [ ] File: `src/app/core/services/conflict.service.ts`
  - [ ] Ensure RxJS 7.8 modern operators used
  - [ ] No deprecated operators (`.do()`, `.catch()` → use `.pipe(tap(), catchError())`)
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-2: refactor - Update ConflictService to RxJS 7.8 patterns`

- [ ] **TASK 2.8: Weekly Verification**
  - [ ] `npm run build` → ✅ PASS
  - [ ] `npm run ng:serve` → ✅ WORKS
  - [ ] Grep: No Promise-based database methods remaining (verify)
  - [ ] All Signal state properly initialized
  - [ ] Error handling: Signals capture errors instead of console.error only

### ✅ Phase 2 Complete When:
- ✅ ALL MainService methods return Observable or Signal
- ✅ Signal state properties track sync, load, error status
- ✅ No more `.then().catch()` chains in database methods
- ✅ toSignal()/toObservable() interop patterns used
- ✅ Build passes
- ✅ ConflictService uses modern RxJS operators

---

## PHASE 3: UI Component Fidelity

### 🎯 Goal
Convert all components to modern Angular 21 patterns while maintaining 100% UI/UX fidelity.

### 📋 Tasks

- [ ] **TASK 3.1: Find All *ngIf Instances**
  - [ ] Run: `grep -r "\*ngIf" src/app/components/ --include="*.html" > /tmp/ngif.txt`
  - [ ] Count total: Note the number
  - [ ] Priority order: Largest/most-used components first
  - [ ] Components to prioritize:
    - [ ] `app.component.html`
    - [ ] `selling-screen.component.html`
    - [ ] `payment-screen.component.html`

- [ ] **TASK 3.2: Convert AppComponent Templates**
  - [ ] File: `src/app/app.component.html`
  - [ ] Convert ALL `*ngIf` → `@if`
  - [ ] Convert ALL `*ngFor` → `@for`
  - [ ] Each @for must have: `track item.id` (or appropriate identifier)
  - [ ] Visual check: Component looks identical before/after
  - [ ] Test: `npm run ng:serve` - Component renders correctly ✅
  - [ ] Commit: `PHASE-3: refactor - Convert *ngIf/*ngFor to @if/@for in AppComponent`

- [ ] **TASK 3.3: Convert Selling Screen Templates**
  - [ ] File: `src/app/components/store/selling-screen/selling-screen.component.html`
  - [ ] This is CRITICAL component - visual check extra careful
  - [ ] Convert all control flow
  - [ ] Test visually: Order creation flow works ✅
  - [ ] Commit: `PHASE-3: refactor - Convert control flow in SellingScreenComponent`

- [ ] **TASK 3.4: Convert Remaining Major Components**
  - [ ] `payment-screen.component.html`
  - [ ] `reports.component.html`
  - [ ] `admin.component.html`
  - [ ] `settings.component.html`
  - [ ] For each: Convert → Test → Commit

- [ ] **TASK 3.5: Convert Smaller Components Batch**
  - [ ] Remaining component templates
  - [ ] Can do in batches of 3-5 components per commit

- [ ] **TASK 3.6: Convert AppComponent @Input/@Output to Signals**
  - [ ] File: `src/app/app.component.ts`
  - [ ] Find all `@Input` properties
  - [ ] Convert to: `propertyName = input.required<Type>()`
  - [ ] Find all `@Output` properties
  - [ ] Convert to: `eventName = output<Type>()`
  - [ ] Update all usages: `this.property` → `this.property()`
  - [ ] Test: `npm run ng:serve` ✅
  - [ ] Commit: `PHASE-3: refactor - Convert @Input/@Output to signals in AppComponent`

- [ ] **TASK 3.7: Convert LoginComponent Input/Output**
  - [ ] File: `src/app/components/login/login.component.ts`
  - [ ] Same pattern as AppComponent
  - [ ] Test login flow works ✅

- [ ] **TASK 3.8: Convert Store/Payment Components**
  - [ ] `src/app/components/store/store.component.ts`
  - [ ] `src/app/components/store/payment-screen/payment-screen.component.ts`
  - [ ] Same pattern

- [ ] **TASK 3.9: Convert Reports Components**
  - [ ] All components in `src/app/components/reports/`
  - [ ] Batch conversion safe here

- [ ] **TASK 3.10: Weekly Verification**
  - [ ] Verify zero `*ngIf` remaining: `grep -r "\*ngIf" src/app/` → NO MATCHES
  - [ ] Verify zero `*ngFor` remaining: `grep -r "\*ngFor" src/app/` → NO MATCHES
  - [ ] Verify `@Input` converted: `grep -r "@Input" src/app/components/` → NONE (all input())
  - [ ] Verify `@Output` converted: `grep -r "@Output" src/app/components/` → NONE (all output())
  - [ ] `npm run build` → ✅ PASS
  - [ ] `npm run ng:serve` → ✅ WORKS
  - [ ] Visual spot check: 5 key screens render correctly

### ✅ Phase 3 Complete When:
- ✅ Zero `*ngIf` or `*ngFor` in any template
- ✅ All @Input/@Output converted to input()/output()
- ✅ All components use @if/@for
- ✅ Build passes
- ✅ Dev server works
- ✅ UI looks identical to before (100% fidelity)

---

## PHASE 4: Business Logic & Service Modernization

### 🎯 Goal
Convert service layer to fully Reactive architecture with complete type safety.

### 📋 Tasks

- [ ] **TASK 4.1: Audit Any Types in Services**
  - [ ] Run: `grep -r ": any" src/app/core/services/ --include="*.ts" > /tmp/any_types.txt`
  - [ ] Files to prioritize:
    - [ ] `auth.service.ts`
    - [ ] `order.service.ts`
    - [ ] `application.service.ts`

- [ ] **TASK 4.2: Convert AuthService to Reactive**
  - [ ] File: `src/app/core/services/auth.service.ts`
  - [ ] Add Signals:
    - [ ] `currentUser = signal<User | null>(null)`
    - [ ] `isAuthenticated = computed(() => !!this.currentUser())`
    - [ ] `userPermissions = signal<Permission[]>([])`
  - [ ] Convert methods:
    - [ ] `login()` → Updates signal + returns Observable
    - [ ] `logout()` → Updates signal
    - [ ] `setPermissions()` → Uses signal setter
  - [ ] Eliminate all `any` types
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-4: refactor - Make AuthService fully Reactive with Signals`

- [ ] **TASK 4.3: Convert OrderService to Reactive**
  - [ ] File: `src/app/core/services/order.service.ts`
  - [ ] Add Signals:
    - [ ] `cartItems = signal<Order[]>([])`
    - [ ] `totalAmount = computed(() => ...)`
    - [ ] `taxAmount = computed(() => ...)`
  - [ ] Convert all calculation methods to use Signals
  - [ ] Test: Order calculations work ✅
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-4: refactor - Make OrderService reactive with Signals`

- [ ] **TASK 4.4: Convert SettingsService**
  - [ ] File: `src/app/core/services/settings.service.ts`
  - [ ] Signal for current settings: `settings = signal<Settings | null>(null)`
  - [ ] Eliminate `any` types
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-4: refactor - Convert SettingsService to Signals`

- [ ] **TASK 4.5: Update PrinterService with Reactive Pattern**
  - [ ] File: `src/app/core/services/printer.service.ts`
  - [ ] Ensure proper error handling with Signals
  - [ ] Test print operations ✅
  - [ ] Test: `npm run build` ✅
  - [ ] Commit: `PHASE-4: refactor - Update PrinterService to Reactive pattern`

- [ ] **TASK 4.6: Complete Type Safety Audit**
  - [ ] Run: `npm run build` and capture any TypeScript errors
  - [ ] For each `any` type found:
    - [ ] Define proper type
    - [ ] Update method signature
    - [ ] Test affected functionality
  - [ ] Goal: Zero TypeScript strict mode errors
  - [ ] Commit: `PHASE-4: fix - Eliminate final 'any' types from services`

- [ ] **TASK 4.7: Verify Electron IPC**
  - [ ] File: `app/preload.ts`
  - [ ] Verify: Uses `contextBridge.exposeInMainWorld()`
  - [ ] File: `app/main.ts`
  - [ ] Verify: Proper IPC handlers setup
  - [ ] Not using deprecated `remote` module ✅
  - [ ] Test: `npm run electron:serve-tsc` ✅
  - [ ] Commit: `PHASE-4: fix - Ensure Electron IPC uses modern contextBridge`

- [ ] **TASK 4.8: Weekly Verification**
  - [ ] `npm run build` → ✅ PASS
  - [ ] `npm run ng:serve` → ✅ WORKS
  - [ ] Zero `any` types: `grep -r ": any" src/app/core/services/` → NO MATCHES
  - [ ] All services use Signals for state
  - [ ] TypeScript strict mode: 0 errors

### ✅ Phase 4 Complete When:
- ✅ All services reactive (Signals + Observables)
- ✅ Zero `any` types in core services
- ✅ AuthService, OrderService, SettingsService fully Reactive
- ✅ Electron IPC using contextBridge
- ✅ Build passes
- ✅ Dev server works
- ✅ All service functionality tested

---

## PHASE 5: Verification & Testing

### 🎯 Goal
Ensure 100% UX parity with legacy application and data integrity.

### 📋 Tasks

- [ ] **TASK 5.1: Visual Regression Testing**
  - [ ] Test screens:
    - [ ] Login screen
    - [ ] Selling screen (most critical)
    - [ ] Order management
    - [ ] Payment screen
    - [ ] Reports
  - [ ] Compare side-by-side with original (if available)
  - [ ] Verify no layout shifts, color changes, missing elements
  - [ ] Document any visual discrepancies
  - [ ] Fix any regressions immediately

- [ ] **TASK 5.2: Data Consistency Validation**
  - [ ] Test PouchDB operations:
    - [ ] Create order → Read order → Verify data intact
    - [ ] Update order → Verify changes persisted
    - [ ] Delete order → Verify gone from DB
  - [ ] Test sync:
    - [ ] Data syncs to remote correctly
    - [ ] Conflict resolution works
    - [ ] No data loss on sync
  - [ ] Document test results

- [ ] **TASK 5.3: Performance Benchmarking**
  - [ ] Load testing (open 50+ tables/orders)
  - [ ] Monitor memory usage (DevTools)
  - [ ] Check for memory leaks
  - [ ] Verify Zoneless performance benefit
  - [ ] Document baseline metrics

- [ ] **TASK 5.4: Final Build Test**
  - [ ] Run: `npm run electron:build`
  - [ ] Verify build succeeds ✅
  - [ ] Check output: Executable created
  - [ ] Test Electron app start ✅
  - [ ] Test critical workflows ✅

- [ ] **TASK 5.5: Browser Compatibility**
  - [ ] Test on Chrome (latest)
  - [ ] Note: Electron uses Chrome, so primary target
  - [ ] Verify all features work ✅

- [ ] **TASK 5.6: Documentation & Cleanup**
  - [ ] Update MIGRATION_SUPERVISION.md with completion status
  - [ ] Create MIGRATION_COMPLETE.md with summary
  - [ ] Document any issues encountered and solutions
  - [ ] Clean up any temporary files/branches

### ✅ Phase 5 Complete When:
- ✅ Visual regression testing: PASSED
- ✅ Data consistency: VERIFIED
- ✅ Performance benchmarking: ACCEPTABLE
- ✅ Final build: SUCCESSFUL
- ✅ Electron app: RUNS CORRECTLY
- ✅ All documented issues: RESOLVED

---

## 🏁 OVERALL MIGRATION COMPLETE WHEN:

- ✅ **Phase 1:** Zoneless + Type Definitions
- ✅ **Phase 2:** MainService fully Reactive with Signals
- ✅ **Phase 3:** Templates @if/@for, Components input()/output()
- ✅ **Phase 4:** Services Reactive, Zero `any` types
- ✅ **Phase 5:** Verification complete
- ✅ **Build:** npm run electron:build succeeds
- ✅ **Tests:** All critical workflows pass
- ✅ **Documentation:** MIGRATION_COMPLETE.md created

---

## 📞 Quick Troubleshooting

### Build Fails
- [ ] Check error message carefully
- [ ] Run: `npm run build` again
- [ ] If persists > 30 min: Revert last commit and report

### Component Doesn't Render
- [ ] Check browser console for errors
- [ ] Verify Signals called with `()`: `this.property()` not `this.property`
- [ ] Verify template uses correct Signal names

### Signal Not Updating UI
- [ ] Ensure Signal is actually being modified
- [ ] Check if component is OnPush change detection
- [ ] Verify proper Signal setter being called

### TypeScript Errors
- [ ] Check type definitions in database.types.ts
- [ ] Ensure method signatures match implementations
- [ ] Run: `npm run build` to see all errors

---

**Last Updated:** 2025-12-27
**Current Phase:** PHASE 1 - Infrastructure
**Status:** Ready for Implementation
