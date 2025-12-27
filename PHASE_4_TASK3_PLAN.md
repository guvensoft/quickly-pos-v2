# PHASE 4 - TASK 4.3: Implement Signal-Based Form Validation
## Implementation Plan

**Task Duration:** ~2 hours
**Status:** PENDING
**Last Updated:** 2025-12-27

---

## Overview

Task 4.3 focuses on replacing RxJS form observable patterns and implementing Signal-based form validation patterns. This includes creating reusable validation utilities and migrating form state management to pure Signal API.

### Goals
- Create Signal-based form validation utility functions
- Replace form observable patterns (valueChanges, statusChanges) with signals
- Implement reactive validation state (dirty, touched, errors)
- Improve form state reactivity and error handling

---

## Signal-Based Form Validation Patterns

### Pattern 1: Form State Signals
```typescript
// Instead of relying on form.valid, form.dirty, etc.
readonly formValue = signal<FormData | null>(null);
readonly formErrors = signal<Record<string, string | null>>({});
readonly isFormDirty = signal<boolean>(false);
readonly isFormTouched = signal<boolean>(false);

readonly isFormValid = computed(() => {
  const errors = this.formErrors();
  return Object.values(errors).every(e => !e);
});
```

### Pattern 2: Field-Level Validators
```typescript
// Reusable validator functions that return signals
function createFieldValidator(
  value: Signal<string>,
  validators: ValidatorFn[]
): Signal<string | null> {
  return computed(() => {
    const val = value();
    for (const validator of validators) {
      const error = validator(new FormControl(val));
      if (error) return Object.keys(error)[0];
    }
    return null;
  });
}
```

### Pattern 3: Form-Level Validators
```typescript
readonly emailError = signal<string | null>(null);
readonly passwordError = signal<string | null>(null);
readonly passwordConfirmError = signal<string | null>(null);

readonly allErrors = computed(() => ({
  email: this.emailError(),
  password: this.passwordError(),
  passwordConfirm: this.passwordConfirmError()
}));

readonly isValid = computed(() => {
  const errors = this.allErrors();
  return Object.values(errors).every(e => !e);
});
```

### Pattern 4: Auto-Validation with effect()
```typescript
// Validate email field when value changes
effect(() => {
  const email = this.email();
  if (!email) {
    this.emailError.set(null);
    return;
  }

  if (!email.includes('@')) {
    this.emailError.set('Invalid email format');
  } else {
    this.emailError.set(null);
  }
});

// Validate password match
effect(() => {
  const pwd = this.password();
  const confirm = this.passwordConfirm();

  if (pwd && confirm && pwd !== confirm) {
    this.passwordConfirmError.set('Passwords do not match');
  } else {
    this.passwordConfirmError.set(null);
  }
});
```

---

## Implementation Steps

### Step 1: Create Validation Utility Service
**File:** `src/app/core/services/signal-validator.service.ts`

```typescript
import { computed, signal, Signal } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class SignalValidatorService {
  /**
   * Create a field validator that returns signal of error message
   */
  createFieldValidator(
    valueSignal: Signal<any>,
    validators: ValidatorFn[]
  ): Signal<string | null> {
    return computed(() => {
      const value = valueSignal();
      for (const validator of validators) {
        const control = new FormControl(value);
        const errors = validator(control);
        if (errors) {
          return Object.keys(errors)[0] || 'Invalid';
        }
      }
      return null;
    });
  }

  /**
   * Email validator function
   */
  emailValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const email = control.value;
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(email) ? null : { invalidEmail: true };
    };
  }

  /**
   * Required field validator
   */
  requiredValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return value && String(value).trim() ? null : { required: true };
    };
  }

  /**
   * Min length validator
   */
  minLengthValidator(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return value && String(value).length >= length ? null : { minLength: length };
    };
  }

  /**
   * Pattern validator
   */
  patternValidator(pattern: RegExp | string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
      return regex.test(String(value)) ? null : { pattern: true };
    };
  }
}
```

### Step 2: Update Customer Settings with Field-Level Validation
**File:** `src/app/components/settings/customer-settings/customer-settings.component.ts`

Add Signal-based field validation:
```typescript
// Form field signals
readonly customerName = signal<string>('');
readonly customerPhone = signal<string>('');
readonly customerAddress = signal<string>('');

// Validation state signals
readonly nameError = signal<string | null>(null);
readonly phoneError = signal<string | null>(null);
readonly addressError = signal<string | null>(null);

// Auto-validate name field
effect(() => {
  const name = this.customerName();
  if (!name || !name.trim()) {
    this.nameError.set('Name is required');
  } else if (name.length < 2) {
    this.nameError.set('Name must be at least 2 characters');
  } else {
    this.nameError.set(null);
  }
});

// Auto-validate phone field
effect(() => {
  const phone = this.customerPhone();
  if (!phone || !phone.trim()) {
    this.phoneError.set('Phone is required');
  } else if (!/^\d{10,}$/.test(phone.replace(/\D/g, ''))) {
    this.phoneError.set('Phone must have at least 10 digits');
  } else {
    this.phoneError.set(null);
  }
});

// Auto-validate address field
effect(() => {
  const address = this.customerAddress();
  if (!address || !address.trim()) {
    this.addressError.set('Address is required');
  } else {
    this.addressError.set(null);
  }
});

// Computed valid state
readonly isCustomerFormValid = computed(() => {
  return !this.nameError() && !this.phoneError() && !this.addressError();
});
```

### Step 3: Add Form State Management to Application Settings
**File:** `src/app/components/settings/application-settings/application-settings.component.ts`

Add server URL validation:
```typescript
readonly serverUrl = signal<string>('');
readonly serverPort = signal<number>(3000);

readonly urlError = signal<string | null>(null);
readonly portError = signal<string | null>(null);

effect(() => {
  const url = this.serverUrl();
  if (!url) {
    this.urlError.set('Server URL is required');
  } else if (!this.isValidUrl(url)) {
    this.urlError.set('Invalid URL format');
  } else {
    this.urlError.set(null);
  }
});

effect(() => {
  const port = this.serverPort();
  if (port < 1 || port > 65535) {
    this.portError.set('Port must be between 1 and 65535');
  } else {
    this.portError.set(null);
  }
});

readonly isServerSettingsValid = computed(() => {
  return !this.urlError() && !this.portError();
});

private isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
```

### Step 4: Add Form Submission State
**File:** Multiple components

```typescript
readonly isSubmitting = signal<boolean>(false);
readonly submitError = signal<string | null>(null);
readonly submitSuccess = signal<boolean>(false);

async submitForm(): Promise<void> {
  if (!this.isFormValid()) {
    this.submitError.set('Please fix validation errors');
    return;
  }

  this.isSubmitting.set(true);
  this.submitError.set(null);

  try {
    await this.saveData();
    this.submitSuccess.set(true);
    setTimeout(() => this.submitSuccess.set(false), 3000);
  } catch (error) {
    this.submitError.set(error instanceof Error ? error.message : 'Submit failed');
  } finally {
    this.isSubmitting.set(false);
  }
}
```

---

## Components to Update

### Priority 1: Customer Settings
- ✅ Already has computed properties
- Add field-level validation signals (name, phone, address)
- Add form-level validation state

### Priority 2: Application Settings
- ✅ Already has computed properties
- Add server settings validation (URL, port)
- Add form submission state management

### Priority 3: Stock Settings
- ✅ Already has computed properties
- Add stock quantity validation
- Add price validation

### Priority 4: Menu Settings
- ✅ Already has computed properties
- Add product name validation
- Add price validation
- Add category selection validation

---

## Testing Strategy

### Field Validation Tests
- [ ] Required field validation works
- [ ] Email validation works
- [ ] Phone validation works
- [ ] Min/max length validation works
- [ ] Pattern validation works

### Form State Tests
- [ ] isFormValid signal updates correctly
- [ ] Error messages display correctly
- [ ] Computed valid state reflects field states
- [ ] Auto-validation triggers on signal changes

### Form Submission Tests
- [ ] Submit disabled when form invalid
- [ ] Loading state during submission
- [ ] Success message after submit
- [ ] Error message on submit failure

---

## Build Verification

After each component update:
- Run `npm run build`
- Verify no compilation errors
- Check bundle size is stable (target: 20-22 seconds)

---

## Success Criteria

✅ All form validations implemented using Signal API
✅ No RxJS form observable usage
✅ Computed valid states for all forms
✅ Error messages reactive and auto-update
✅ Form submission state managed with signals
✅ All components build successfully
✅ Zero validation errors at compile time

---

## Next Phase: 4.4

After 4.3 completion, Task 4.4 will focus on:
- Final build verification
- Integration testing across all components
- Performance metrics validation
- Documentation updates

---

## Implementation Notes

- Create reusable validator functions in a service
- Use `computed()` for derived validation state
- Use `effect()` only for side effects (API calls, logging)
- Keep validation logic pure and testable
- Always provide clear error messages for users
- Avoid nested signals when possible (prefer computed)
