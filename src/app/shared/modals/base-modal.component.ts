import { Component, Inject, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';
import { FocusTrap, FocusTrapFactory } from '@angular/cdk/a11y';

/**
 * Base class for all modal components
 * Provides common dialog functionality and accessibility features
 *
 * Features:
 * - Automatic focus management (focuses first form input)
 * - Keyboard support (Escape to close)
 * - Accessibility best practices (ARIA, semantic HTML)
 * - Dialog role and labeling
 */
@Component({ template: '' })
export abstract class BaseModalComponent<T = any> implements AfterViewInit, OnDestroy {
  @Input() data: T;
  @ViewChild('modalContent', { static: false }) modalContent?: ElementRef;

  private focusTrap?: FocusTrap;

  constructor(
    protected dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: T,
    private focusTrapFactory?: FocusTrapFactory,
    private elementRef?: ElementRef
  ) {
    this.data = data;
  }

  ngAfterViewInit() {
    // Set up focus trap for accessibility
    if (this.focusTrapFactory && this.elementRef) {
      this.focusTrap = this.focusTrapFactory.create(this.elementRef.nativeElement);
      this.focusTrap.focusInitialElement();
    } else {
      // Fallback: Focus first input field
      this.focusFirstInput();
    }

    // Add role and ARIA attributes to modal container
    const modalContainer = this.elementRef?.nativeElement?.closest('.cdk-overlay-pane');
    if (modalContainer) {
      modalContainer.setAttribute('role', 'dialog');
      modalContainer.setAttribute('aria-modal', 'true');
    }
  }

  ngOnDestroy() {
    // Clean up focus trap
    if (this.focusTrap) {
      this.focusTrap.destroy();
    }
  }

  /**
   * Focus first form input for better UX
   */
  private focusFirstInput() {
    const firstInput = this.elementRef?.nativeElement?.querySelector(
      'input:not([type="hidden"]), textarea, select'
    );
    if (firstInput) {
      // Use setTimeout to ensure element is rendered
      setTimeout(() => firstInput.focus(), 100);
    }
  }

  /**
   * Close dialog with result
   */
  close(result?: any) {
    this.dialogRef.close(result);
  }

  /**
   * Cancel dialog (close without result)
   */
  cancel() {
    this.dialogRef.close(null);
  }

  /**
   * Handle keyboard events
   * Escape key closes dialog
   */
  protected onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancel();
    }
  }
}
