# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Quickly POS v2** is a Point-of-Sale (POS) system built as an Electron desktop application with Angular 21. It manages restaurant operations including orders, tables, payments, inventory, and reporting. The application supports both primary (main terminal) and secondary (satellite) screen configurations with real-time synchronization.

**Stack:**
- Angular 21.0.3 (Standalone Components, Signal API, Zoneless Change Detection)
- Electron 39.2.5
- TypeScript 5.9.3
- PouchDB (local) + CouchDB (remote sync)
- Bootstrap 4.1.3 + Font Awesome + SCSS
- Testing: Vitest + Playwright

## Common Commands

### Development
```bash
npm start                    # Start both Electron and Angular dev server
npm run ng:serve            # Angular dev server only (http://localhost:4200)
npm run electron:serve      # Electron with hot reload (waits for ng:serve)
```

### Build & Production
```bash
npm run build               # Build for development (outputs to dist/)
npm run web:prod            # Production build
npm run electron:build      # Build desktop app executable
npm run electron:local      # Build and run Electron locally
```

### Testing & Quality
```bash
npm test                    # Run Vitest unit tests (no watch)
npm run test:watch          # Run tests in watch mode
npm run e2e                 # Run Playwright E2E tests
npm run lint                # ESLint (Angular + TypeScript)
```

### Specialized Commands (AI Live Log Bridge)
Use the `ai` wrapper for terminal commands when debugging with AI assistance:
```bash
ai npm test                 # Run tests with logging
ai view_logs               # View recent terminal output
ai get_crash_context       # View only errors and crashes
ai auto_fix_errors         # Automatically detect and fix errors
```

## Architecture

### Dual Electron Package Structure

This project follows Electron Builder's [two package.json structure](https://www.electron.build/tutorials/two-package-structure):

1. **Root `package.json`**: Angular dependencies, build tools, dev dependencies
2. **`app/package.json`**: Electron main process runtime dependencies

**Why?** Optimizes final bundle size and enables Angular CLI features like `ng add`.

### Process Architecture

**Electron Main Process** (`app/main.ts`):
- Window management, IPC handlers
- File system operations, logging
- Single instance lock enforcement
- Hooks process logging to `quickly-pos.log`

**Angular Renderer Process** (`src/app/`):
- All UI components and business logic
- Runs at `http://localhost:4200` in development
- Uses zoneless change detection for performance

### Database Architecture

**Local-First with Sync:**
- **PouchDB (IndexedDB)**: Local storage in browser/Electron
- **CouchDB**: Remote server for multi-terminal sync
- **Replication**: Continuous bidirectional sync between local and remote

**25+ Local Databases** (created in `MainService`):
- `users`, `users_group`, `checks`, `closed_checks`, `credits`
- `customers`, `orders`, `receipts`, `calls`, `cashbox`
- `categories`, `sub_categories`, `occations`, `products`, `recipes`
- `floors`, `tables`, `stocks`, `stocks_cat`, `endday`
- `reports`, `logs`, `backups`, `prints`, `commands`

**Access Pattern:**
```typescript
// Via MainService (generic CRUD)
this.mainService.getAllBy('checks', {})
this.mainService.getData('tables', tableId)
this.mainService.updateData('orders', orderId, updates)

// Via DatabaseService (signal-based, reactive)
readonly tables = signal<TableDocument[]>([])
readonly occupiedTables = computed(() => this.tables().filter(t => t.status === 1))
```

### Service Layer

**Core Services** (`src/app/core/services/`):

- **MainService**: Database CRUD operations, sync coordination, app data loading
- **DatabaseService**: Signal-based reactive collections with PouchDB change listeners
- **AuthService**: User authentication, session management
- **SettingsService**: Application settings, printers, day status
- **ApplicationService**: Connectivity status, screen lock, app-wide state
- **ElectronService**: IPC bridge to Electron main process (conditional import)
- **PrinterService**: Print job management (checks, orders, reports)
- **OrderService**: Order creation, status updates, kitchen integration
- **CallerIDService**, **ScalerService**: Hardware integration
- **ConflictService**: PouchDB conflict resolution
- **MessageService**, **ToastService**: User notifications

**Dependency Injection Pattern:**
```typescript
// Modern inject() pattern (Angular 17+)
private readonly authService = inject(AuthService);
private readonly mainService = inject(MainService);
```

### Component Architecture

**Component Categories:**

1. **Core Screens** (`components/`):
   - `login`, `home`, `activation`, `setup`
   - `store` → `selling-screen`, `payment-screen`
   - `cashbox`, `endoftheday`, `admin`
   - `reports`, `settings`

2. **Helpers** (`components/helpers/`):
   - `keyboard`, `message`, `caller`

3. **Reports** (`components/reports/`):
   - Store, product, table, user, stock, activity reports

4. **Settings** (`components/settings/`):
   - Restaurant, menu, user, customer, stock, printer, recipe, application settings

**Migration Status:**
- ✅ **16 components migrated** to Signal API (Phases 5.1 & 6)
- See `MIGRATION.md` and `TECHNICAL-NOTES.md` for detailed patterns

### Routing

Routes defined in `src/main.ts` with functional guards:
- `AnonymousCanActivate`: Requires setup completion
- `CanActivateViaAuthGuard`: Requires login
- `DayStarted`: Requires day initialization

Key routes:
- `/` → Login
- `/home` → Main dashboard
- `/store` → Table management
- `/selling-screen/:type/:id` → Order entry
- `/payment/:id` → Payment processing
- `/cashbox` → Cash management
- `/endoftheday` → Day closure
- `/reports`, `/settings`, `/admin`

## Angular 21 Migration (Signal API)

**IMPORTANT:** This codebase is in active migration from Angular 5 to Angular 21. All new code and modifications MUST follow these patterns:

### Required Patterns

**1. Dependency Injection:**
```typescript
// ✅ Use inject()
private readonly service = inject(MyService);

// ❌ Avoid constructor injection
constructor(private service: MyService) {}
```

**2. Reactive State with Signals:**
```typescript
// Writable signal
readonly count = signal<number>(0);

// Computed (derived state)
readonly total = computed(() => this.items().reduce((sum, i) => sum + i.price, 0));

// Reading signals (MUST use () operator)
const value = this.count();  // TypeScript
{{ count() }}                // Template
```

**3. RxJS Subscriptions in Effects:**
```typescript
effect(() => {
  this.dateService.DateSettings.subscribe(settings => {
    this.day.set(settings.value.day);
  });
}, { allowSignalWrites: true });
```

**4. Template Control Flow (Angular 17+):**
```html
<!-- ✅ New syntax -->
@if (isLoading()) {
  <spinner></spinner>
} @else {
  <content></content>
}

@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}

<!-- ❌ Old syntax (being phased out) -->
<div *ngIf="isLoading">...</div>
<div *ngFor="let item of items">...</div>
```

**5. Array Mutations:**
```typescript
// ✅ Correct (triggers reactivity)
this.items.set([...this.items(), newItem]);

// ❌ Incorrect (does NOT trigger reactivity)
this.items().push(newItem);
```

**Critical Rules:**
- Always call signals with `()` in TypeScript and templates
- Use `track` expression in all `@for` loops (mandatory)
- Use `allowSignalWrites: true` in effects that update signals
- Create helper methods for complex ViewChild signal access

See `TECHNICAL-NOTES.md` for comprehensive patterns and gotchas.

## Key Business Flows

### Primary Terminal (Type 0) Initialization
1. Load settings from PouchDB (`ActivationStatus`, `ServerSettings`, `DateSettings`)
2. Connect to CouchDB server (if enabled)
3. Start bidirectional sync
4. Load all app data into memory
5. Initialize change listeners (orders, settings, end-of-day)
6. Navigate to login screen

### Secondary Terminal (Type 1) Initialization
1. Replicate entire database from primary terminal's server
2. Load app data from local PouchDB
3. Initialize listeners (settings, end-of-day)
4. Navigate to login screen

### Order Flow
1. User selects table → creates/loads check
2. `selling-screen` component: Add products to check
3. Order submitted → Status: `OrderStatus.APPROVED`
4. `orderListener()` in AppComponent:
   - Detects new approved order via PouchDB change feed
   - Splits order by category printer configuration
   - Sends to `PrinterService` for kitchen printing
5. Payment screen finalizes check
6. Check moved to `closed_checks` database

### End-of-Day Flow
1. User initiates via `endoftheday` component
2. Generates day-end report (sales, payments, discounts)
3. Creates backup of all data
4. Writes to `endday` database (triggers listener)
5. `endDayListener()` in AppComponent:
   - Cancels remote sync
   - Destroys all local databases
   - Relaunches application

## Environment Configuration

**Environments** (`src/environments/`):
- `environment.ts` (default)
- `environment.dev.ts` (development)
- `environment.prod.ts` (production)

**Build Configurations** (`angular.json`):
- `dev`: No optimization, source maps enabled
- `production`: AOT compilation, optimized, minified

**File Replacements:**
```json
"fileReplacements": [
  {
    "replace": "src/environments/environment.ts",
    "with": "src/environments/environment.prod.ts"
  }
]
```

## Type Safety

**Database Types** (`src/app/core/models/database.types.ts`):
- `DatabaseName`: Union type of all database names
- `DatabaseModelMap`: Maps database names to document types
- `TableDocument`, `OrderDocument`, `CheckDocument`, etc.

**Type-Safe Database Access:**
```typescript
// Generic methods with TypeScript inference
this.mainService.getData<CheckDocument>('checks', checkId)
this.mainService.getAllBy<ProductDocument>('products', { category: 'drinks' })
```

## PouchDB Patterns

### Change Listeners
```typescript
db.changes({
  since: 'now',      // Only new changes
  live: true,        // Keep connection open
  include_docs: true // Include full document
})
.on('change', (change) => {
  this.signal.set(change.doc);
})
```

### Conflict Resolution
Handled by `ConflictService` using `pouch-resolve-conflicts` plugin. Automatic resolution strategies based on timestamps.

### Indexing
```typescript
// Create index for queries
db.createIndex({
  index: { fields: ['type', 'status'] }
});

// Query with selector
db.find({
  selector: { type: 'order', status: 0 },
  sort: ['timestamp']
});
```

## Electron IPC Bridge

**ElectronService** conditionally imports Electron APIs:
```typescript
if (this.isElectron) {
  this.ipcRenderer.send('channel', data);
  this.ipcRenderer.on('reply', (event, args) => {});
}
```

**Common IPC Channels:**
- `appServer`: Configure server connection
- `fullScreen`: Toggle fullscreen mode
- `reloadProgram`: Reload renderer
- `relaunchProgram`: Restart app
- `exitProgram`: Quit application

## Hardware Integration

**Printers** (via `PrinterService`):
- Thermal receipt printers (ESC/POS commands)
- Kitchen printers (category-specific routing)

**Caller ID** (via `CallerIDService`):
- Serial port communication for incoming call detection
- Automatic customer lookup on call

**Scale** (via `ScalerService`):
- Weight-based product pricing
- Real-time weight updates

## Testing

**Unit Tests** (Vitest):
- Located alongside source files (`*.spec.ts`)
- Run with `npm test`
- Coverage reports in `test-results/`

**E2E Tests** (Playwright):
- Located in `e2e/` directory
- Run with `npm run e2e`
- Requires production build first

**Test Configuration:**
- `vitest.config.ts` (if exists, or configured in `angular.json`)
- `e2e/playwright.config.ts`

## Development Notes

### Working with Signals
- 16 components already migrated (see `MIGRATION.md`)
- Follow patterns in `TECHNICAL-NOTES.md`
- Common gotcha: forgetting `()` operator on signal access
- Use `computed()` for derived state, `effect()` for side effects

### Database Operations
- Always use `MainService` or `DatabaseService` for CRUD
- Never directly mutate PouchDB instances
- Use signals for reactive UI updates
- Handle conflicts with `ConflictService`

### Multi-Terminal Sync
- Primary terminal (Type 0): Master data source
- Secondary terminal (Type 1): Replica, read-mostly
- Changes replicate bidirectionally when online
- Offline-first: All operations work offline, sync when reconnected

### Debugging
- Electron DevTools: Automatically opened in development
- PouchDB debugging: `localStorage.debug = 'pouchdb:*'`
- Use `ai` wrapper commands for live log monitoring
- Check `quickly-pos.log` for main process logs

### Performance
- Zoneless change detection enabled (no Zone.js overhead)
- Signals provide fine-grained reactivity
- PouchDB uses IndexedDB adapter for speed
- Lazy-loaded routes for faster initial load (if implemented)

## Migration Documentation

**Primary References:**
- `MIGRATION.md` - Overall migration summary and metrics
- `TECHNICAL-NOTES.md` - Detailed patterns, gotchas, best practices
- `PHASE-5.1.md` - Core components migration (11 components)
- `PHASE-6.md` - Complex screens migration (5 components)
- `ANGULAR_21_GUIDE.md` - Angular 21, TypeScript 5.9, RxJS guide (Turkish)

**Status:**
- ✅ 16 components fully migrated to Signal API
- ✅ 180+ signals, 50+ effects, 25+ computed properties
- ✅ 0 TypeScript errors
- Build time: 19.8-20.7 seconds

## Important Constraints

1. **Package Manager:** MUST use `npm` (not `yarn`) due to Electron Builder compatibility
2. **Node Version:** Requires Node.js >= 22.12.0 or >= 24.0.0
3. **TypeScript Version:** 5.8.0 to < 5.9.0 (strict enforcement)
4. **Browser Target:** Chrome 140 (Electron's Chromium version)
5. **Two Package Structure:** Never add runtime dependencies to root `package.json` that belong in `app/package.json`

## Code Style

- ESLint configuration in `eslint.config.js`
- SCSS for styling (component-scoped)
- Strict TypeScript mode enabled
- PascalCase for classes/components, camelCase for variables/functions
- Signal naming: descriptive, readonly keyword for immutability signals
