import { Injectable } from '@angular/core';
import { signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

/**
 * Notification Service - Toast messages
 * Provides success, error, info, warning notifications
 */
@Injectable({ providedIn: 'root' })
export class NotificationService {
  private notifications = signal<Toast[]>([]);

  // Public read-only signal for template binding
  notifications$ = this.notifications.asReadonly();

  /**
   * Show success notification
   */
  success(message: string, duration = 3000) {
    this.show(message, 'success', duration);
  }

  /**
   * Show error notification
   */
  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  /**
   * Show info notification
   */
  info(message: string, duration = 3000) {
    this.show(message, 'info', duration);
  }

  /**
   * Show warning notification
   */
  warning(message: string, duration = 4000) {
    this.show(message, 'warning', duration);
  }

  /**
   * Internal: show notification
   */
  private show(
    message: string,
    type: Toast['type'],
    duration: number
  ) {
    const notification: Toast = {
      id: Math.random(),
      message,
      type,
    };

    // Add notification
    this.notifications.update((prev) => [...prev, notification]);

    // Auto-remove after duration
    setTimeout(() => {
      this.notifications.update((prev) =>
        prev.filter((n) => n.id !== notification.id)
      );
    }, duration);
  }
}
