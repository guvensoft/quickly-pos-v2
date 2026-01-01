import { Component, input, output, forwardRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

/**
 * DatepickerComponent - Reusable date picker component
 * Implements ControlValueAccessor for use with reactive forms
 *
 * Usage in form:
 * <app-datepicker
 *   formControlName="birthDate"
 *   [label]="'Birth Date'"
 *   [required]="true"
 * ></app-datepicker>
 */
@Component({
  selector: 'app-datepicker',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatepickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="datepicker-wrapper">
      @if (label()) {
        <label class="datepicker-label">
          {{ label() }}
          @if (required()) {
            <span class="text-danger">*</span>
          }
        </label>
      }
      <div class="datepicker-input-group">
        <input
          type="date"
          class="datepicker-input"
          [value]="value"
          [disabled]="isDisabled()"
          [min]="minDate()"
          [max]="maxDate()"
          [required]="required()"
          (change)="onDateChange($event)"
          (blur)="onTouched()"
        />
        @if (value && clearable()) {
          <button
            type="button"
            class="datepicker-clear-btn"
            (click)="clearDate()"
            [disabled]="isDisabled()"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        }
      </div>
      @if (error()) {
        <div class="datepicker-error">{{ error() }}</div>
      }
    </div>
  `,
  styles: [`
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

    .datepicker-input-group {
      position: relative;
      display: flex;
      align-items: center;
    }

    .datepicker-input {
      flex: 1;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
      font-family: inherit;
      transition: border-color 0.2s;
    }

    .datepicker-input:focus {
      outline: none;
      border-color: #007bff;
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .datepicker-input:disabled {
      background-color: #f5f5f5;
      cursor: not-allowed;
    }

    .datepicker-input:invalid {
      border-color: #dc3545;
    }

    .datepicker-clear-btn {
      position: absolute;
      right: 8px;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      color: #666;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color 0.2s;
    }

    .datepicker-clear-btn:hover:not(:disabled) {
      color: #333;
    }

    .datepicker-clear-btn:disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }

    .datepicker-error {
      font-size: 12px;
      color: #dc3545;
      margin-top: 4px;
    }

    .text-danger {
      color: #dc3545;
    }
  `]
})
export class DatepickerComponent implements ControlValueAccessor {
  readonly label = input<string | null>(null);
  readonly required = input(false);
  readonly clearable = input(true);
  readonly minDate = input<string | null>(null);
  readonly maxDate = input<string | null>(null);
  readonly error = input<string | null>(null);

  // Handle disabled state from both input and form control
  readonly disabledInput = input(false, { alias: 'disabled' });
  private readonly formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabledInput() || this.formDisabled());

  readonly dateChange = output<string | null>();

  value: string = '';
  onChange: (value: string | null) => void = () => { };
  onTouched: () => void = () => { };

  writeValue(value: any): void {
    if (value) {
      // Convert ISO string to date format for input
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        this.value = date.toISOString().split('T')[0];
      } else {
        this.value = '';
      }
    } else {
      this.value = '';
    }
  }

  registerOnChange(fn: (value: string | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.formDisabled.set(isDisabled);
  }

  onDateChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.value = input.value;
    const dateValue = input.value ? input.value : null;
    this.onChange(dateValue);
    this.dateChange.emit(dateValue);
  }

  clearDate(): void {
    this.value = '';
    this.onChange(null);
    this.dateChange.emit(null);
  }
}
