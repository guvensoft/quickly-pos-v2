# Technical Notes: Angular 5 to 21 Migration

## Core Patterns & Best Practices

---

## 1. Dependency Injection with `inject()`

**Pattern:**
```typescript
// Before (Angular 5)
constructor(
  private authService: AuthService,
  private dateService: DateService
) {}

// After (Angular 17+)
private readonly authService = inject(AuthService);
private readonly dateService = inject(DateService);
```

**Benefits:**
- No constructor parameter declaration needed
- Cleaner, more readable code
- Tree-shakeable dependencies
- Works with standalone components

**Applied to:** All 16 migrated components

---

## 2. Signal API Fundamentals

### Creating Signals
```typescript
// Basic writable signal
readonly count = signal<number>(0);

// Signal with complex type
readonly user = signal<User | null>(null);

// Signal with initial undefined
readonly data = signal<string[]>([]);
```

### Reading Signals (Function Call Operator)
```typescript
// TypeScript
const value = this.count();  // Required: () operator
const user = this.user()?.name;

// Template
{{ count() }}
{{ user()?.email }}
```

**Critical Rule:** Signals must be called with `()` in both TypeScript and templates. This was the most common error during migration.

### Updating Signals
```typescript
// Direct value
this.count.set(5);

// Function-based update
this.count.update(prev => prev + 1);

// Computed based on current value
const newArray = [...this.items(), newItem];
this.items.set(newArray);
```

---

## 3. Computed Properties

**Pattern:**
```typescript
readonly filteredItems = computed(() => {
  const searchTerm = this.searchText();
  return this.items().filter(item =>
    item.name.includes(searchTerm)
  );
});

readonly total = computed(() => {
  return this.items().reduce((sum, item) => sum + item.price, 0);
});
```

**Key Characteristics:**
- Automatically memoized (recalculates only when dependencies change)
- Pure function (no side effects)
- Reactive to signal changes
- Used for derived/calculated state

**Applied Count:** 25+ computed properties across 16 components

---

## 4. Effects: RxJS Subscription Wrapper

**Pattern for Subscriptions:**
```typescript
effect(() => {
  this.dateService.DateSettings.subscribe(settings => {
    this.day.set(settings.value.day);
    this.dateToReport.set(settings.value.dateToReport);
  });
}, { allowSignalWrites: true });
```

**Pattern for Multiple Updates:**
```typescript
effect(() => {
  const subscription = this.service.getData().subscribe(data => {
    this.state1.set(data.prop1);
    this.state2.set(data.prop2);
    this.state3.set(data.prop3);
  });

  return () => subscription.unsubscribe();
}, { allowSignalWrites: true });
```

**Key Rules:**
- Use `allowSignalWrites: true` flag to allow signal mutations
- Return unsubscribe function for cleanup (optional but recommended)
- Place all effects in constructor body
- Each major subscription gets its own effect

**Applied Count:** 50+ effects across 16 components

---

## 5. Signal-based ViewChild

**Standard Pattern:**
```typescript
// Declare viewChild as signal
editArea = viewChild<ElementRef>('editArea');

// Access in method
getValue(): string {
  const element = this.editArea();
  return element?.nativeElement?.value || '';
}

// In template
<textarea #editArea></textarea>
```

**Important Notes:**
- ViewChild signal returns the typed reference (ElementRef, NgForm, etc.)
- Always check for null before accessing nested properties
- Create helper methods for repeated access patterns
- Use computed() if derived value needs reactivity

**Applied to:**
- admin.component.ts: viewChild<ElementRef>
- cashbox.component.ts: viewChild<NgForm>

---

## 6. Input Signals

**Required Input:**
```typescript
readonly config = input.required<ConfigType>();

// Usage in component logic
const currentConfig = this.config();
```

**Optional Input:**
```typescript
readonly printers = input<any>();

// Check if provided
if (this.printers()) {
  // Use printers
}
```

**Key Points:**
- `input.required<T>()` - TypeScript enforces provider passes value
- `input<T>()` - Optional, defaults to undefined
- Read with `()` operator like regular signals
- More semantic than @Input decorator

**Applied to:** day-detail.component.ts

---

## 7. Array Mutations in Signals

**❌ INCORRECT (Does NOT trigger reactivity):**
```typescript
this.items().push(newItem);  // Mutates array in place
```

**✅ CORRECT (Triggers reactivity):**
```typescript
const newItems = [...this.items(), newItem];
this.items.set(newItems);
```

**Pattern for Complex Updates:**
```typescript
// 1. Get current value
const updatedData = this.data();

// 2. Mutate local reference
updatedData.property = newValue;
updatedData.nested.field = anotherValue;

// 3. Set entire signal
this.data.set(updatedData);
```

**Example from endoftheday.component:**
```typescript
const newBackupData = [...this.backupData()];
newBackupData.push(checksBackup);
this.backupData.set(newBackupData);
```

**Applied to:** endoftheday, selling-screen, day-detail components

---

## 8. Template Control Flow Syntax (Angular 17+)

### @if Block
```html
<!-- Before -->
<div *ngIf="condition">...</div>

<!-- After -->
@if (condition) {
  <div>...</div>
}
```

### @if with @else
```html
@if (items().length > 0) {
  <list [items]="items()"></list>
} @else {
  <p>No items found</p>
}
```

### @for Loop
```html
<!-- Before -->
<div *ngFor="let item of items">{{ item.name }}</div>

<!-- After (track is MANDATORY) -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

**Track Expression Rules:**
- Mandatory in Angular 17+
- Use unique identifier: `track item.id` or `track item._id`
- Use `$index` only if items have no unique property: `track $index`
- Use composite: `track item.id + item.status` if needed

### @for with let
```html
@for (item of items(); track item.id; let idx = $index; let first = $first; let last = $last) {
  <div [class.first]="first" [class.last]="last">
    {{ idx }}: {{ item.name }}
  </div>
}
```

**Applied to:** All 16 components

---

## 9. Lifecycle Hook Migration

### ngOnInit → Constructor Effects

**Before:**
```typescript
export class MyComponent implements OnInit {
  ngOnInit(): void {
    this.service.subscribe(value => {
      this.data = value;
    });
  }
}
```

**After:**
```typescript
export class MyComponent {
  constructor() {
    effect(() => {
      this.service.subscribe(value => {
        this.data.set(value);
      });
    }, { allowSignalWrites: true });
  }
}
```

**Important:**
- Remove `implements OnInit` interface
- Move all initialization to constructor
- Use `effect()` for subscriptions
- Signals initialized in property declarations

### OnDestroy Retention

**Keep OnDestroy when:**
- Component holds resource listeners (DB change listeners, WebSocket connections)
- Component creates DOM listeners (jQuery modals, event listeners)
- Complex cleanup is needed

```typescript
export class ComplexComponent implements OnDestroy {
  private scalerListener: any;

  constructor() {
    effect(() => {
      this.scalerListener = this.setupScaler();
    }, { allowSignalWrites: true });
  }

  ngOnDestroy(): void {
    if (this.scalerListener) {
      this.scalerListener.cancel();
    }
    ($('.modal') as any).modal('hide');
  }
}
```

**Retained in:** payment-screen.component, selling-screen.component

---

## 10. Database Listeners with Effects

**Real-time Data Sync Pattern:**
```typescript
effect(() => {
  // Clear previous listener
  if (this.changes()) {
    this.changes()?.cancel();
  }

  // Setup new listener
  const ch = this.localDB['checks']
    .changes({
      live: true,
      include_docs: true
    })
    .on('change', (change) => {
      this.check.set(change.doc);
    })
    .on('error', (error) => {
      console.error('Change listener error:', error);
    });

  this.changes.set(ch);
}, { allowSignalWrites: true });
```

**Key Points:**
- Use `live: true` for real-time updates
- Include `include_docs: true` to get full document
- Store listener reference for cleanup
- Cancel in OnDestroy
- Handle errors appropriately

**Applied to:** selling-screen.component

---

## 11. Standalone Components Configuration

**Standard Pattern:**
```typescript
@Component({
  selector: 'app-my-component',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    // Other imports...
  ],
  templateUrl: './my.component.html',
  styleUrls: ['./my.component.scss']
})
export class MyComponent {
  // Component logic
}
```

**Key Rules:**
- Always set `standalone: true`
- Import all needed modules in `imports` array
- CommonModule required for @if, @for, @switch
- Import specific services via `inject()`

**Applied to:** All 16 migrated components

---

## 12. Error Handling Patterns

### Type Assertions for Non-Null Values
```typescript
// Template with non-null assertion
{{ customer()!.name }}

// When you know value exists but TypeScript doesn't
const name = this.customer()!.name;
```

### Optional Chaining
```typescript
// Safe navigation
{{ user()?.email }}

// In component logic
const email = this.user()?.email || 'N/A';
```

### Type Guards in Computed
```typescript
readonly validItems = computed(() => {
  return this.items().filter(item => item && item.id);
});
```

---

## 13. Common Gotchas & Solutions

### Gotcha 1: Forgetting `()` on Signal Access
```typescript
// ❌ WRONG - Accessing signal reference, not value
if (this.isLoading) { }  // Always truthy
const value = this.count;  // Gets function reference

// ✅ CORRECT
if (this.isLoading()) { }  // Proper boolean
const value = this.count();  // Gets actual value
```

### Gotcha 2: Missing Track in @for
```typescript
// ❌ WRONG - Will error in Angular 17+
@for (item of items()) {
  {{ item.name }}
}

// ✅ CORRECT
@for (item of items(); track item.id) {
  {{ item.name }}
}
```

### Gotcha 3: Modifying Signal Arrays In-Place
```typescript
// ❌ WRONG - Array mutation not detected
this.items().push(newItem);

// ✅ CORRECT - Signal reactivity triggered
this.items.set([...this.items(), newItem]);
```

### Gotcha 4: Not Using AllowSignalWrites in Effects
```typescript
// ❌ WRONG - Will error: Cannot write to signals in effect
effect(() => {
  this.service.subscribe(value => {
    this.signal.set(value);  // ERROR!
  });
});

// ✅ CORRECT
effect(() => {
  this.service.subscribe(value => {
    this.signal.set(value);
  });
}, { allowSignalWrites: true });
```

---

## 14. Performance Considerations

### Signal Recomputation
- Computed properties are memoized (recompute only on dependency change)
- Effects run whenever any of their signal dependencies change
- Avoid expensive calculations in computed if not used frequently

### Template Optimization
```html
<!-- Create computed property instead of complex logic -->
readonly filtered = computed(() => this.items().filter(...));

<!-- Use in template -->
@for (item of filtered(); track item.id) {
  {{ item.name }}
}
```

### ViewChild Signal Access
```typescript
// ✅ Compute once if accessed multiple times
readonly formValid = computed(() => this.form()?.valid);

// Avoid in loops:
// ❌ @for (item of items(); track item.id) {
//     [disabled]="form().valid"  // Called n times
//   }

// ✅ @for (item of items(); track item.id) {
//     [disabled]="formValid()"   // Called once
//   }
```

---

## 15. Testing Considerations

### Signal Testing
```typescript
it('should update signal', () => {
  component.count.set(5);
  expect(component.count()).toBe(5);
});

it('should trigger computed', () => {
  component.items.set([{ id: 1, name: 'Test' }]);
  expect(component.filteredItems().length).toBe(1);
});
```

### Effect Testing
```typescript
it('should subscribe on init', fakeAsync(() => {
  component.ngOnInit?.();
  tick();
  expect(component.data()).toEqual(expectedData);
}));
```

---

## Summary

The migration follows Angular 17+ best practices with Signal API providing a modern, reactive foundation. Key principles:
- Always call signals with `()`
- Use `computed()` for derived state
- Wrap subscriptions in `effect()` with `allowSignalWrites`
- Create helper methods for complex signal access
- Retain OnDestroy only when necessary
- Use proper immutability patterns for array mutations
