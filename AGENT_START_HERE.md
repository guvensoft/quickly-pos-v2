# 🎬 AGENT: START HERE - Angular 5 → 21 Migration

**Dear Agent,**

You have been given a critical task: **Complete the Angular 5 → Angular 21 migration for the Quickly POS desktop application.**

This migration has **ONE SOURCE OF TRUTH:**

## ✅ YOUR MISSION

Transform the legacy Angular 5 codebase into a modern Angular 21 application while maintaining **100% UI/UX parity** and **zero data loss**.

---

## 📖 REQUIRED READING (In This Order)

1. **[MIGRATION_SUPERVISION.md](./MIGRATION_SUPERVISION.md)** ← **READ THIS FIRST**
   - This is your detailed execution plan
   - Contains all tasks, timelines, and verification steps
   - 52 specific tasks across 5 phases

2. **[PHASE_CHECKLIST.md](./PHASE_CHECKLIST.md)** ← **Quick reference**
   - Use this for daily task tracking
   - Checkbox format for clarity
   - Troubleshooting section included

3. **User-Provided Architecture Docs** (referenced in MIGRATION_SUPERVISION.md)
   - Angular 21 Modernizasyon ve Migrasyon Yol Haritası
   - Angular 21, TypeScript 5.9 ve RxJS 7.8.2 Geliştirici Kılavuzu

---

## 🚨 CRITICAL RULES (NON-NEGOTIABLE)

### Rule #1: No Type Safety Sweeps
❌ **DO NOT** do this:
```
"I'll add null-checks and error handling to Promise-based code"
```

✅ **DO THIS** instead:
```
"I'll convert Promise-based methods to Signal + Observable pattern"
```

**Why:** The previous 15 commits were type safety fixes, not true migration. This is a different activity.

### Rule #2: Every Commit Must Reference a PHASE
❌ **BAD:** `git commit -m "Fixed some bugs"`
✅ **GOOD:** `git commit -m "PHASE-2: feat - Convert getAllBy to Observable pattern"`

### Rule #3: Build Must NEVER Fail
```
If npm run build fails:
  1. STOP immediately
  2. Debug the issue
  3. If > 30 min, revert and report
  4. NEVER commit broken code
```

### Rule #4: Strict Execution Order
Follow the WEEK 1 → WEEK 4 breakdown in MIGRATION_SUPERVISION.md EXACTLY.
Do NOT jump ahead or change order.

---

## 📅 WEEK 1 TASKS (START HERE)

You are starting with **PHASE 1: Infrastructure**

### TASK 1.1: Enable Zoneless Mode (2 hours)

**File:** `src/main.ts`

**Action:**
```bash
# Line 41: Change this:
provideZoneChangeDetection()

# To this:
provideExperimentalZonelessChangeDetection()

# Then:
# 1. Open package.json
# 2. Find and DELETE: "zone.js": "0.16.0" line
# 3. Run: npm install
# 4. Run: npm run build (must pass ✅)

# Commit:
git commit -m "PHASE-1: fix - Enable Zoneless Change Detection for Angular 21"
```

### TASK 1.2: Create Database Type Definitions (3 hours)

**File:** Create new file `src/app/core/models/database.types.ts`

**Content template:**
```typescript
export type DatabaseName =
  | 'users' | 'orders' | 'checks' | ... ; // All DB names

export interface PouchDBDocument {
  _id: string;
  _rev: string;
  [key: string]: any;
}

export interface PouchDBFindResult<T> {
  docs: T[];
  warning?: string;
}

// Add remaining interfaces (see MIGRATION_SUPERVISION.md for details)
```

**Commit:**
```bash
git commit -m "PHASE-1: feat - Add type-safe database definitions"
```

### TASK 1.3: Add Signal Wrapper to MainService (4-5 hours)

**File:** `src/app/core/services/main.service.ts`

**Actions:**
1. Import: `signal`, `effect` from '@angular/core'
2. Import: `toObservable` from '@angular/core/rxjs-interop'
3. Add Signals:
   ```typescript
   private dataLoaded = signal(false);
   private syncInProgress = signal(false);
   private lastSyncError = signal<Error | null>(null);
   ```
4. Convert `getAllBy()` method to return `Observable<T[]>` (not Promise)
5. Add new method: `getAllBySignal<T>(): Signal<T[]>` using `toSignal()`

**Commit:**
```bash
git commit -m "PHASE-1: feat - Add Signal wrapper to MainService"
```

### TASK 1.4: Verify Everything Works

```bash
# Must succeed:
npm run build
npm run ng:serve

# Browser: No TypeScript errors in console ✅
```

---

## ⏰ IF YOU GET STUCK

**BEFORE GIVING UP, CHECK:**

1. Did you read MIGRATION_SUPERVISION.md? → **YES** ✅
2. Does the build error match a known issue in PHASE_CHECKLIST.md? → **Check troubleshooting section**
3. Is your commit message using the PHASE-X format? → **Check examples**
4. Did you verify with `npm run build`? → **Run it again**

**IF STILL STUCK** (after 30 min of debugging):
- Create an issue with:
  - Error message
  - What task you were on (PHASE-X, TASK X.Y)
  - Commit hash
  - Steps you tried
- DO NOT continue without guidance

---

## 📊 DAILY REPORTING

At the end of each day, provide this report:

```
=== DAILY MIGRATION REPORT ===
Date: YYYY-MM-DD
Tasks Completed: TASK 1.1, TASK 1.2
Commits Made: 2
Build Status: ✅ Passing
Blockers: None
Next Task: TASK 1.3
```

---

## 🎯 WEEK 1 SUCCESS CRITERIA

By end of week, these must be true:
- ✅ Zoneless mode enabled (no Zone.js in package.json)
- ✅ Database types defined in database.types.ts
- ✅ MainService has Signal wrapper
- ✅ getAllBy() returns Observable<T[]>
- ✅ getAllBySignal() exists and works
- ✅ npm run build passes ✅
- ✅ npm run ng:serve works ✅

---

## 🔗 Key Files

- **[MIGRATION_SUPERVISION.md](./MIGRATION_SUPERVISION.md)** - Your detailed plan
- **[PHASE_CHECKLIST.md](./PHASE_CHECKLIST.md)** - Your checklist
- **[README.md](./README.md)** - Migration status tracker

---

## 💪 YOU'VE GOT THIS

The previous work identified the gaps. Now YOU fix them systematically.

**Remember:**
- ✅ One task at a time
- ✅ Build after every commit
- ✅ Reference the PHASE in every commit
- ✅ Ask before deviating
- ✅ Read MIGRATION_SUPERVISION.md thoroughly

---

**Go forth and modernize! 🚀**

*Branch: `claude/migrate-angular-5-to-21-fCbW8`*
*Started: 2025-12-27*
*Target: 4 Weeks*
