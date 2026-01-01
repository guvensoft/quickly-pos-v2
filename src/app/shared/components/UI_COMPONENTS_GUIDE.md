# UI Component Library Guide

This document describes the reusable UI components available in the Quickly POS application. All components are signal-based, standalone, and compatible with Angular 21+ and reactive forms.

## Components Overview

### 1. Toast Notification Component

A signal-based toast notification system that displays temporary messages to users.

#### Files
- `toast.service.ts` - Service managing toast notifications
- `toast-container/toast-container.component.ts` - Container component (root level)
- `toast-container/toast-item/toast-item.component.ts` - Individual toast item

#### Integration
The Toast Container is already integrated into `app.component.ts` and displays notifications in the top-right corner of the application.

#### Usage

```typescript
import { ToastService } from '@core/services/toast.service';

export class MyComponent {
  constructor(private toastService: ToastService) {}

  showSuccess() {
    this.toastService.success('Operation successful!');
  }

  showError() {
    this.toastService.error('An error occurred', 5000);
  }

  showWarning() {
    this.toastService.warning('Please be careful!', 4000);
  }

  showInfo() {
    this.toastService.info('Here is some information', 3000);
  }

  // Manual dismissal
  dismiss(toastId: string) {
    this.toastService.dismiss(toastId);
  }

  dismissAll() {
    this.toastService.dismissAll();
  }
}
```

#### API Reference

```typescript
// Show different types of toasts
success(message: string, duration?: number): string
error(message: string, duration?: number): string
warning(message: string, duration?: number): string
info(message: string, duration?: number): string

// Manual control
dismiss(id: string): void
dismissAll(): void

// Read-only signal
toasts$(): Toast[]
```

#### Defaults
- Success: 3000ms auto-dismiss
- Error: 5000ms auto-dismiss
- Warning: 4000ms auto-dismiss
- Info: 3000ms auto-dismiss

### 2. Datepicker Component

A reusable date picker component that implements `ControlValueAccessor` for use with reactive forms.

#### Files
- `datepicker/datepicker.component.ts`

#### Usage in Reactive Forms

```typescript
import { DatepickerComponent } from '@shared/components/ui-components';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DatepickerComponent],
  template: `
    <form [formGroup]="form">
      <app-datepicker
        formControlName="birthDate"
        label="Birth Date"
        [required]="true"
        [clearable]="true"
        [minDate]="minDate"
        [maxDate]="maxDate"
        [error]="form.get('birthDate')?.getError('required') ? 'Date is required' : null"
      ></app-datepicker>
    </form>
  `
})
export class MyModalComponent {
  form = this.fb.group({
    birthDate: ['', Validators.required]
  });

  minDate = '1980-01-01';
  maxDate = new Date().toISOString().split('T')[0];

  constructor(private fb: FormBuilder) {}
}
```

#### Component API

```typescript
@Input() label: string | null = null;              // Label text
@Input() required: boolean = false;                // Show required indicator
@Input() clearable: boolean = true;                // Show clear button
@Input() minDate: string | null = null;            // Minimum selectable date (YYYY-MM-DD)
@Input() maxDate: string | null = null;            // Maximum selectable date (YYYY-MM-DD)
@Input() error: string | null = null;              // Error message
@Input() disabled: boolean = false;                // Disable input

@Output() dateChange: EventEmitter<string | null> // Emitted when date changes
```

#### Features
- ControlValueAccessor compatible for reactive forms
- Native HTML5 date input with fallback for older browsers
- Clear button for easy date removal
- Min/Max date constraints
- Responsive design
- Turkish language support ready

### 3. Select Dropdown Component

A reusable select/dropdown component that implements `ControlValueAccessor` for reactive forms.

#### Files
- `select/select.component.ts`

#### Usage in Reactive Forms

```typescript
import { SelectComponent, SelectOption } from '@shared/components/ui-components';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SelectComponent],
  template: `
    <form [formGroup]="form">
      <app-select
        formControlName="category"
        label="Select Category"
        placeholder="Choose a category..."
        [options]="categoryOptions"
        [required]="true"
        [error]="form.get('category')?.getError('required') ? 'Category is required' : null"
      ></app-select>
    </form>
  `
})
export class MyModalComponent {
  form = this.fb.group({
    category: ['', Validators.required]
  });

  categoryOptions: SelectOption[] = [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing', disabled: false },
    { label: 'Food', value: 'food' }
  ];

  constructor(private fb: FormBuilder) {}
}
```

#### Component API

```typescript
@Input() label: string | null = null;              // Label text
@Input() placeholder: string | null = null;        // Placeholder text
@Input() options: SelectOption[] = [];              // Array of options
@Input() required: boolean = false;                // Show required indicator
@Input() error: string | null = null;              // Error message
@Input() disabled: boolean = false;                // Disable select

@Output() selectionChange: EventEmitter<string | number | null> // Emitted when selection changes
```

#### SelectOption Interface

```typescript
interface SelectOption {
  label: string;          // Display text
  value: string | number; // Value to be stored
  disabled?: boolean;     // Optional: disable this option
}
```

#### Features
- ControlValueAccessor compatible for reactive forms
- Support for string and numeric values
- Custom styling with dropdown icon
- Optional clear state support
- Responsive design
- Turkish language support ready

## Shared Components Export

Import multiple components easily from the central export file:

```typescript
import {
  ToastContainerComponent,
  ToastItemComponent,
  DatepickerComponent,
  SelectComponent,
  type SelectOption
} from '@shared/components/ui-components';
```

## Usage Examples in Modal Components

### Example: Stock Modal with Date and Select

```typescript
import { BaseModalComponent } from '../base-modal.component';
import { DatepickerComponent, SelectComponent } from '@shared/components/ui-components';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-stock-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatepickerComponent,
    SelectComponent
  ],
  template: `
    <form [formGroup]="form">
      <app-select
        formControlName="category"
        label="Category"
        [options]="categories"
        [required]="true"
      ></app-select>

      <app-datepicker
        formControlName="purchaseDate"
        label="Purchase Date"
        [required]="true"
        [maxDate]="today"
      ></app-datepicker>

      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" (click)="cancel()">
          Cancel
        </button>
        <button
          type="button"
          class="btn btn-primary"
          (click)="submit()"
          [disabled]="!form.valid"
        >
          Save
        </button>
      </div>
    </form>
  `
})
export class StockModalComponent extends BaseModalComponent {
  form = this.fb.group({
    category: ['', Validators.required],
    purchaseDate: ['', Validators.required]
  });

  categories: SelectOption[] = [
    { label: 'Electronics', value: 'electronics' },
    { label: 'Supplies', value: 'supplies' }
  ];

  today = new Date().toISOString().split('T')[0];

  constructor(
    @Inject(DIALOG_DATA) data: any,
    private fb: FormBuilder
  ) {
    super(data);
  }

  submit() {
    if (this.form.valid) {
      this.close(this.form.value);
    }
  }

  cancel() {
    this.close(null);
  }
}
```

## Styling and Customization

All UI components use standard Bootstrap classes and CSS variables for consistency:

- Primary color: `#007bff`
- Error color: `#dc3545`
- Border color: `#ddd`
- Text color: `#333`

Override these by updating the component's styles or by adding CSS to your global stylesheet.

## Accessibility

All components include:
- Proper label associations
- ARIA attributes where applicable
- Keyboard navigation support
- Focus management
- Error announcements

## Performance Notes

- Components use OnPush change detection strategy where applicable
- Toast notifications use `NgZone` to avoid unnecessary change detection
- Date and Select components implement `ControlValueAccessor` efficiently
- Minimal DOM operations and CSS animations

## Future Enhancements

Potential additions to the UI Component Library:
- Time picker component
- Multi-select dropdown with search
- Date range picker
- Rich text editor
- File upload component
- Modal confirmation dialog
- Tooltip component
- Progress bar component
