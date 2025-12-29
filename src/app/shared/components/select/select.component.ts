import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, FormsModule } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

/**
 * SelectComponent - Reusable dropdown component
 * Implements ControlValueAccessor for use with reactive forms
 *
 * Usage in form:
 * <app-select
 *   formControlName="category"
 *   [label]="'Category'"
 *   [options]="categories$ | async"
 *   [required]="true"
 * ></app-select>
 */
@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true
    }
  ],
  template: `
    <div class="select-wrapper">
      @if (label) {
        <label class="select-label">
          {{ label }}
          @if (required) {
            <span class="text-danger">*</span>
          }
        </label>
      }
      <div class="select-input-group">
        <select
          class="select-input"
          [value]="value"
          [disabled]="disabled"
          [required]="required"
          (change)="onSelectionChange($event)"
          (blur)="onTouched()"
        >
          @if (placeholder) {
            <option value="" disabled selected>{{ placeholder }}</option>
          }
          @for (option of options; track option.value) {
            <option [value]="option.value" [disabled]="option.disabled">
              {{ option.label }}
            </option>
          }
        </select>
        <svg class="select-icon" viewBox="0 0 24 24" width="20" height="20">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>
      @if (error) {
        <div class="select-error">{{ error }}</div>
      }
    </div>
  `,
  styles: [`
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

    .select-input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .select-input {
      flex: 1;
      padding: 8px 32px 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      background-color: white;
      cursor: pointer;
      appearance: none;
      transition: border-color 0.2s;
    }

    .select-input:hover:not(:disabled) {
      border-color: #999;
    }

    .select-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .select-input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
      color: #999;
    }

    .select-icon {
      position: absolute;
      right: 10px;
      pointer-events: none;
      fill: none;
      stroke: currentColor;
      stroke-width: 2;
      stroke-linecap: round;
      stroke-linejoin: round;
      color: #666;
    }

    .select-input:disabled ~ .select-icon {
      color: #999;
    }

    .select-error {
      font-size: 12px;
      color: #dc3545;
      margin-top: 4px;
    }

    .text-danger {
      color: #dc3545;
    }
  `]
})
export class SelectComponent implements ControlValueAccessor {
  @Input() label: string | null = null;
  @Input() placeholder: string | null = null;
  @Input() options: SelectOption[] = [];
  @Input() required = false;
  @Input() error: string | null = null;
  @Input() disabled = false;

  @Output() selectionChange = new EventEmitter<string | number | null>();

  value: string | number = '';
  onChange: (value: string | number | null) => void = () => {};
  onTouched: () => void = () => {};

  writeValue(value: any): void {
    this.value = value ?? '';
  }

  registerOnChange(fn: (value: string | number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onSelectionChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const selectedValue = select.value ? select.value : null;
    this.value = selectedValue ?? '';

    // Try to convert to number if possible
    let finalValue: string | number | null = selectedValue;
    if (selectedValue && !isNaN(Number(selectedValue))) {
      finalValue = Number(selectedValue);
    }

    this.onChange(finalValue);
    this.selectionChange.emit(finalValue);
  }
}
