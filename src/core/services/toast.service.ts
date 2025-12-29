import { Injectable, inject, signal } from '@angular/core';
import { NgZone } from '@angular/core';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number; // in milliseconds, 0 = no auto-dismiss
}

/**
 * ToastService - Signal-based toast notification service
 * Provides a centralized way to display toast notifications throughout the application
 *
 * Usage:
 * constructor(private toastService: ToastService) {}
 *
 * showSuccess(message: string) {
 *   this.toastService.success(message);
 * }
 *
 * showError(message: string) {
 *   this.toastService.error(message);
 * }
 */
@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly zone = inject(NgZone);
  private readonly toasts = signal<Toast[]>([]);
  private idCounter = 0;

  readonly toasts$ = this.toasts.asReadonly();

  /**
   * Show success toast
   * @param message Toast message
   * @param duration Auto-dismiss duration in ms (default: 3000)
   */
  success(message: string, duration = 3000): string {
    return this.show(message, 'success', duration);
  }

  /**
   * Show error toast
   * @param message Toast message
   * @param duration Auto-dismiss duration in ms (default: 5000)
   */
  error(message: string, duration = 5000): string {
    return this.show(message, 'error', duration);
  }

  /**
   * Show warning toast
   * @param message Toast message
   * @param duration Auto-dismiss duration in ms (default: 4000)
   */
  warning(message: string, duration = 4000): string {
    return this.show(message, 'warning', duration);
  }

  /**
   * Show info toast
   * @param message Toast message
   * @param duration Auto-dismiss duration in ms (default: 3000)
   */
  info(message: string, duration = 3000): string {
    return this.show(message, 'info', duration);
  }

  /**
   * Generic show method
   * @param message Toast message
   * @param type Toast type
   * @param duration Auto-dismiss duration in ms
   * @returns Toast ID for manual dismissal
   */
  private show(message: string, type: ToastType, duration: number): string {
    const id = `toast-${this.idCounter++}`;
    const toast: Toast = { id, message, type, duration };

    this.zone.run(() => {
      this.toasts.update(current => [...current, toast]);
    });

    // Auto-dismiss if duration is set
    if (duration > 0) {
      this.zone.runOutsideAngular(() => {
        setTimeout(() => {
          this.dismiss(id);
        }, duration);
      });
    }

    return id;
  }

  /**
   * Dismiss a specific toast by ID
   */
  dismiss(id: string): void {
    this.zone.run(() => {
      this.toasts.update(current => current.filter(t => t.id !== id));
    });
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    this.zone.run(() => {
      this.toasts.set([]);
    });
  }
}
