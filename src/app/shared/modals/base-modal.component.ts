import { Component, Inject, Input } from '@angular/core';
import { DialogRef, DIALOG_DATA } from '@angular/cdk/dialog';

/**
 * Base class for all modal components
 * Provides common dialog functionality
 */
@Component({ template: '' })
export abstract class BaseModalComponent<T = any> {
  @Input() data: T;

  constructor(
    protected dialogRef: DialogRef<any>,
    @Inject(DIALOG_DATA) data: T
  ) {
    this.data = data;
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
}
