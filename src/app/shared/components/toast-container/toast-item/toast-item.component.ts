import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Toast } from '../../../../core/services/toast.service';

/**
 * ToastItemComponent - Individual toast notification item
 * Displays a single toast with animation and close button
 */
@Component({
  selector: 'app-toast-item',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast" [ngClass]="'toast-' + toast().type">
      <div class="toast-content">
        <div class="toast-message">{{ toast().message }}</div>
      </div>
      <button class="toast-close" type="button" (click)="onClose()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `,
  styles: [`
    .toast {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      animation: slideIn 0.3s ease-in-out;
      pointer-events: auto;
      min-width: 300px;
    }

    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }

    .toast-success {
      background-color: #d4edda;
      color: #155724;
      border: 1px solid #c3e6cb;
    }

    .toast-error {
      background-color: #f8d7da;
      color: #721c24;
      border: 1px solid #f5c6cb;
    }

    .toast-warning {
      background-color: #fff3cd;
      color: #856404;
      border: 1px solid #ffeaa7;
    }

    .toast-info {
      background-color: #d1ecf1;
      color: #0c5460;
      border: 1px solid #bee5eb;
    }

    .toast-content {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .toast-message {
      font-size: 14px;
      line-height: 1.5;
      word-break: break-word;
    }

    .toast-close {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: inherit;
      opacity: 0.7;
      transition: opacity 0.2s;
      margin-left: 12px;
      flex-shrink: 0;
    }

    .toast-close:hover {
      opacity: 1;
    }

    @media (max-width: 640px) {
      .toast {
        min-width: auto;
        width: 100%;
      }
    }
  `]
})
export class ToastItemComponent {
  readonly toast = input.required<Toast>();
  readonly dismissed = output<string>();

  onClose(): void {
    this.dismissed.emit(this.toast().id);
  }
}
