import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../../core/services/toast.service';
import { ToastItemComponent } from './toast-item/toast-item.component';

/**
 * ToastContainerComponent - Displays all active toast notifications
 * Should be placed once at the root level of the application
 *
 * Usage in app.component.html:
 * <app-toast-container></app-toast-container>
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ToastItemComponent],
  template: `
    <div class="toast-container">
      @for (toast of toastService.toasts$(); track toast.id) {
        <app-toast-item
          [toast]="toast"
          (dismissed)="onDismiss($event)"
        ></app-toast-item>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 400px;
      pointer-events: none;

      @media (max-width: 640px) {
        left: 10px;
        right: 10px;
        max-width: none;
      }
    }
  `]
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);

  onDismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
