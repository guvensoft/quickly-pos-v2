# Modal Components - Styling and CSS Guide

This document provides comprehensive styling guidelines for all modal components to ensure consistency across the application.

## Base Modal Styling

All modals follow a standardized Bootstrap 5 dialog structure with custom enhancements.

### Modal Structure

```html
<div class="modal-header">
  <h5 class="modal-title">Dialog Title</h5>
  <button type="button" class="btn-close" (click)="cancel()"></button>
</div>

<form [formGroup]="form" (ngSubmit)="onSubmit()">
  <div class="modal-body">
    <!-- Form content -->
  </div>

  <div class="modal-footer">
    <button type="button" class="btn btn-secondary" (click)="cancel()">Cancel</button>
    <button type="submit" class="btn btn-primary" [disabled]="!form.valid">Save</button>
  </div>
</form>
```

### Standard CSS Classes

#### Modal Container
```css
.modal-header {
  padding: 1rem;
  border-bottom: 1px solid #dee2e6;
  background-color: #f8f9fa;
}

.modal-body {
  padding: 1.5rem;
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.modal-footer {
  padding: 1rem;
  border-top: 1px solid #dee2e6;
  background-color: #f8f9fa;
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
```

#### Modal Title
```css
.modal-title {
  font-size: 1.25rem;
  font-weight: 500;
  color: #212529;
  margin: 0;
}
```

#### Close Button
```css
.btn-close {
  width: 1.5rem;
  height: 1.5rem;
  padding: 0;
  background: transparent;
  border: 0;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease-in-out;
}

.btn-close:hover {
  opacity: 1;
}

.btn-close:active {
  opacity: 1;
}
```

## Form Styling

### Form Group
```css
.mb-3 {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #212529;
  font-size: 0.9375rem;
}

.form-label .text-danger {
  color: #dc3545;
  margin-left: 0.25rem;
}
```

### Input Fields
```css
.form-control {
  display: block;
  width: 100%;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-control:focus {
  color: #212529;
  background-color: #fff;
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-control:disabled,
.form-control[readonly] {
  background-color: #e9ecef;
  opacity: 1;
  cursor: not-allowed;
}

.form-control.is-invalid {
  border-color: #dc3545;
}

.form-control.is-invalid:focus {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.25rem rgba(220, 53, 69, 0.25);
}
```

### Select Fields
```css
.form-select {
  display: block;
  width: 100%;
  padding: 0.375rem 2.25rem 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  color: #212529;
  background-color: #fff;
  background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M2 5l6 6 6-6'/%3e%3c/svg%3e");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  background-size: 16px 12px;
  border: 1px solid #dee2e6;
  border-radius: 0.25rem;
  appearance: none;
  cursor: pointer;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.form-select:focus {
  border-color: #86b7fe;
  outline: 0;
  box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
}

.form-select:disabled {
  background-color: #e9ecef;
  cursor: not-allowed;
}
```

### Textarea Fields
```css
textarea.form-control {
  min-height: calc(1.5em + 0.75rem + 2px);
  resize: vertical;
}

textarea.form-control:focus {
  min-height: calc(1.5em + 0.75rem + 2px);
}
```

### Invalid Feedback
```css
.invalid-feedback {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.875rem;
  color: #dc3545;
}

.is-invalid ~ .invalid-feedback {
  display: block;
}
```

## Button Styling

### Primary Button
```css
.btn.btn-primary {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
}

.btn.btn-primary:hover {
  color: #fff;
  background-color: #0056b3;
  border-color: #004085;
}

.btn.btn-primary:focus {
  color: #fff;
  background-color: #0056b3;
  border-color: #004085;
  box-shadow: 0 0 0 0.2rem rgba(0, 123, 255, 0.5);
}

.btn.btn-primary:disabled {
  color: #fff;
  background-color: #007bff;
  border-color: #007bff;
  opacity: 0.65;
  cursor: not-allowed;
}
```

### Secondary Button
```css
.btn.btn-secondary {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
}

.btn.btn-secondary:hover {
  color: #fff;
  background-color: #5a6268;
  border-color: #545b62;
}

.btn.btn-secondary:focus {
  color: #fff;
  background-color: #5a6268;
  border-color: #545b62;
  box-shadow: 0 0 0 0.2rem rgba(108, 117, 125, 0.5);
}

.btn.btn-secondary:disabled {
  color: #fff;
  background-color: #6c757d;
  border-color: #6c757d;
  opacity: 0.65;
  cursor: not-allowed;
}
```

### Danger Button
```css
.btn.btn-danger {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
}

.btn.btn-danger:hover {
  color: #fff;
  background-color: #c82333;
  border-color: #bd2130;
}

.btn.btn-danger:focus {
  color: #fff;
  background-color: #c82333;
  border-color: #bd2130;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.5);
}

.btn.btn-danger:disabled {
  color: #fff;
  background-color: #dc3545;
  border-color: #dc3545;
  opacity: 0.65;
  cursor: not-allowed;
}
```

### Button Base
```css
.btn {
  display: inline-block;
  font-weight: 400;
  line-height: 1.5;
  text-align: center;
  text-decoration: none;
  white-space: nowrap;
  vertical-align: middle;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out,
              border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.btn:disabled {
  opacity: 0.65;
}
```

## UI Component Styling

### DatepickerComponent
```css
.datepicker-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.datepicker-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.datepicker-input {
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
}

.datepicker-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.datepicker-error {
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
}
```

### SelectComponent
```css
.select-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.select-label {
  font-size: 14px;
  font-weight: 500;
  color: #333;
  display: flex;
  align-items: center;
  gap: 4px;
}

.select-input {
  padding: 8px 32px 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: inherit;
  background-color: white;
  cursor: pointer;
  appearance: none;
}

.select-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.select-error {
  font-size: 12px;
  color: #dc3545;
  margin-top: 4px;
}
```

## Modal Dialog Sizing

### Small Dialog (350px)
For simple confirmations
```typescript
dialogFacade.open(MyComponent, {
  width: '350px'
});
```

### Default Dialog (500px)
For standard forms
```typescript
dialogFacade.open(MyComponent, {
  width: '500px' // default
});
```

### Large Dialog (600px)
For complex forms
```typescript
dialogFacade.open(MyComponent, {
  width: '600px'
});
```

### Extra Large Dialog (700px)
For multi-section forms
```typescript
dialogFacade.open(MyComponent, {
  width: '700px'
});
```

## Responsive Design

### Mobile Breakpoint
For screens smaller than 640px, dialogs should expand to fit the viewport:

```css
@media (max-width: 640px) {
  .cdk-dialog-container {
    width: 100% !important;
    height: 100% !important;
    max-height: 100vh;
    margin: 0;
  }

  .modal-body {
    max-height: calc(100vh - 150px);
  }
}
```

## Scrolling Behavior

### Long Forms
When form content exceeds available space:

```css
.modal-body {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
  overflow-x: hidden;
}
```

### Smooth Scroll
```css
.modal-body {
  scroll-behavior: smooth;
}
```

## Animation and Transitions

### Dialog Appearance
```css
.cdk-overlay-pane {
  animation: fadeIn 0.2s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

### Backdrop
```css
.cdk-overlay-backdrop {
  background: rgba(0, 0, 0, 0.5);
  animation: fadeIn 0.2s ease-in-out;
}
```

## Accessibility Features

### Focus Management
```css
.btn:focus,
.form-control:focus,
.form-select:focus {
  outline: 2px solid #007bff;
  outline-offset: 2px;
}
```

### High Contrast Mode
```css
@media (prefers-contrast: more) {
  .btn {
    border-width: 2px;
  }

  .form-control {
    border-width: 2px;
  }
}
```

### Reduced Motion
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## Color Scheme

### Primary Colors
- Primary: `#007bff` (Blue)
- Secondary: `#6c757d` (Gray)
- Success: `#28a745` (Green)
- Danger: `#dc3545` (Red)
- Warning: `#ffc107` (Yellow)
- Info: `#17a2b8` (Cyan)

### Neutral Colors
- Light: `#f8f9fa`
- Dark: `#212529`
- Muted: `#6c757d`
- Border: `#dee2e6`
- Background: `#ffffff`

### Status Colors
- Error: `#dc3545`
- Warning: `#ffc107`
- Success: `#28a745`
- Info: `#17a2b8`

## Best Practices

### 1. Consistent Spacing
- Use `margin-bottom: 1rem` for form groups
- Use `padding: 1rem` for modal sections
- Use `gap: 0.5rem` for button groups

### 2. Label Associations
```html
<label class="form-label" for="inputId">Label Text</label>
<input class="form-control" id="inputId" type="text" />
```

### 3. Error Handling
Always show validation errors below the field:
```html
<input class="form-control" [class.is-invalid]="isFieldInvalid('name')" />
@if (isFieldInvalid('name')) {
  <div class="invalid-feedback">Error message</div>
}
```

### 4. Disabled States
```html
<button class="btn btn-primary" [disabled]="!form.valid">
  Save
</button>
```

### 5. Loading States (for async operations)
```html
<button class="btn btn-primary" [disabled]="isLoading">
  @if (!isLoading) {
    Save
  } @else {
    <span class="spinner-border spinner-border-sm me-2"></span>
    Saving...
  }
</button>
```

## Testing Styling

### Visual Regression Testing
Test all modal states:
- Empty form
- Filled form
- Error states
- Disabled states
- Loading states
- Mobile viewport
- Dark mode (if applicable)

### CSS Coverage
Ensure all CSS is used and minimal unused styles exist:
```bash
# Run CSS coverage analysis
npm run css:analyze
```

## Migration from Bootstrap 4 to Bootstrap 5

Key changes applied:
- `col-*` → `col-*` (no breaking changes)
- `.container` → `.container-fluid` where needed
- `input-group-text` styling updated
- Button styling simplified

## Common Issues and Solutions

### Issue: Modal doesn't center properly
**Solution**: Ensure DialogFacade passes proper width configuration

### Issue: Form inputs overflow on mobile
**Solution**: Use responsive width in DialogFacade config

### Issue: Long labels break layout
**Solution**: Use `word-break: break-word` on labels

### Issue: Button focus states not visible
**Solution**: Add explicit focus styles with box-shadow

## References

- [Bootstrap 5 Documentation](https://getbootstrap.com/docs/5.0/)
- [CDK Dialog API](https://material.angular.io/cdk/dialog/api)
- [Web Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
