import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn, FormControl } from '@angular/forms';
import { computed, signal, Signal } from '@angular/core';

/**
 * Service providing Signal-based validators and validation utilities
 * for reactive form validation without RxJS observables
 */
@Injectable({
  providedIn: 'root'
})
export class SignalValidatorService {

  /**
   * Create a field validator that returns a signal of error message
   * @param valueSignal - The value signal to validate
   * @param validators - Array of ValidatorFn to apply
   * @returns Signal<string | null> - Error message or null if valid
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
   * Max length validator
   */
  maxLengthValidator(length: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      return !value || String(value).length <= length ? null : { maxLength: length };
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

  /**
   * Number range validator
   */
  rangeValidator(min: number, max: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const num = Number(value);
      if (isNaN(num)) return { invalidNumber: true };
      if (num < min || num > max) return { range: { min, max } };
      return null;
    };
  }

  /**
   * Phone number validator (at least 10 digits)
   */
  phoneValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const phone = control.value;
      const digitsOnly = phone.replace(/\D/g, '');
      return digitsOnly.length >= 10 ? null : { invalidPhone: true };
    };
  }

  /**
   * URL validator
   */
  urlValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      try {
        new URL(control.value);
        return null;
      } catch {
        return { invalidUrl: true };
      }
    };
  }

  /**
   * Password match validator (for use with form-level validation)
   */
  passwordMatchValidator(passwordField: string, confirmField: string) {
    return (group: AbstractControl): ValidationErrors | null => {
      const password = group.get(passwordField);
      const confirm = group.get(confirmField);
      if (password && confirm && password.value !== confirm.value) {
        return { passwordMismatch: true };
      }
      return null;
    };
  }

  /**
   * Get human-readable error message from validation error key
   */
  getErrorMessage(errorKey: string, errorValue?: any): string {
    const messages: Record<string, string> = {
      required: 'Bu alan gerekli',
      invalidEmail: 'Geçersiz e-posta adresi',
      invalidPhone: 'Telefon numarası en az 10 rakam olmalıdır',
      invalidUrl: 'Geçersiz URL formatı',
      invalidNumber: 'Geçerli bir sayı giriniz',
      minLength: `Minimum ${errorValue?.length || 0} karakter olmalıdır`,
      maxLength: `Maksimum ${errorValue?.length || 0} karakter olmalıdır`,
      range: `${errorValue?.min || 0} - ${errorValue?.max || 100} arasında olmalıdır`,
      pattern: 'Geçersiz format',
      passwordMismatch: 'Şifreler eşleşmiyor'
    };
    return messages[errorKey] || 'Geçersiz değer';
  }
}
