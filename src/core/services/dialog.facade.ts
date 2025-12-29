import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';

// Import modal components
import { ProductModalComponent } from '../../app/shared/modals/product-modal/product-modal.component';
import { CategoryModalComponent } from '../../app/shared/modals/category-modal/category-modal.component';
import { CustomerModalComponent } from '../../app/shared/modals/customer-modal/customer-modal.component';
import { TableModalComponent } from '../../app/shared/modals/table-modal/table-modal.component';
import { ConfirmModalComponent } from '../../app/shared/modals/confirm-modal/confirm-modal.component';
import { SubcategoryModalComponent } from '../../app/shared/modals/subcategory-modal/subcategory-modal.component';
import { StockCategoryModalComponent } from '../../app/shared/modals/stock-category-modal/stock-category-modal.component';
import { StockModalComponent } from '../../app/shared/modals/stock-modal/stock-modal.component';
import { UserGroupModalComponent } from '../../app/shared/modals/user-group-modal/user-group-modal.component';
import { UserModalComponent } from '../../app/shared/modals/user-modal/user-modal.component';
import { PrinterModalComponent } from '../../app/shared/modals/printer-modal/printer-modal.component';
import { AdminModalComponent } from '../../app/shared/modals/admin-modal/admin-modal.component';

/**
 * DialogFacade - Single entry point for all modal dialogs
 * Centralizes all dialog/modal logic
 *
 * Usage:
 * constructor(private dialogFacade: DialogFacade) {}
 *
 * openProductModal() {
 *   const dialogRef = this.dialogFacade.openProductModal();
 *   dialogRef.closed.subscribe(result => {
 *     // handle result
 *   });
 * }
 */
@Injectable({ providedIn: 'root' })
export class DialogFacade {
  private dialog = inject(Dialog);

  /**
   * Generic open method for any dialog component
   */
  open<T, R = any>(
    component: any,
    config?: {
      title?: string;
      width?: string;
      data?: T;
      panelClass?: string;
    }
  ): DialogRef<R> {
    return this.dialog.open(component, {
      width: config?.width || '500px',
      panelClass: ['cdk-dialog', config?.panelClass || ''].filter(Boolean),
      data: config?.data || {},
      backdropClass: 'cdk-dialog-backdrop',
      disableClose: false,
    });
  }

  /**
   * Open Product Modal
   * @param product Optional product data for editing
   * @returns DialogRef with result
   */
  openProductModal(product?: any): DialogRef<any> {
    return this.open(ProductModalComponent, {
      title: product ? 'Ürün Düzenle' : 'Ürün Ekle',
      width: '600px',
      data: product,
      panelClass: 'product-dialog',
    });
  }

  /**
   * Open Category Modal
   * @param category Optional category data for editing
   * @returns DialogRef with result
   */
  openCategoryModal(category?: any): DialogRef<any> {
    return this.open(CategoryModalComponent, {
      title: category ? 'Kategori Düzenle' : 'Kategori Ekle',
      width: '500px',
      data: category,
      panelClass: 'category-dialog',
    });
  }

  /**
   * Open Customer Modal
   * @param customer Optional customer data for editing
   * @returns DialogRef with result
   */
  openCustomerModal(customer?: any): DialogRef<any> {
    return this.open(CustomerModalComponent, {
      title: customer ? 'Müşteri Düzenle' : 'Müşteri Ekle',
      width: '500px',
      data: customer,
      panelClass: 'customer-dialog',
    });
  }

  /**
   * Open Table Modal
   * @param table Optional table data for editing
   * @param floors Optional floors array for selection
   * @returns DialogRef with result
   */
  openTableModal(table?: any, floors?: any[]): DialogRef<any> {
    return this.open(TableModalComponent, {
      title: table ? 'Masa Düzenle' : 'Masa Ekle',
      width: '400px',
      data: { ...table, floors: floors || [] },
      panelClass: 'table-dialog',
    });
  }

  /**
   * Open Subcategory Modal
   * @param subcategory Optional subcategory data for editing
   * @returns DialogRef with result
   */
  openSubcategoryModal(subcategory?: any): DialogRef<any> {
    return this.open(SubcategoryModalComponent, {
      title: subcategory ? 'Alt Kategori Düzenle' : 'Alt Kategori Ekle',
      width: '500px',
      data: subcategory,
      panelClass: 'subcategory-dialog',
    });
  }

  /**
   * Open Stock Category Modal
   * @param stockCategory Optional stock category data for editing
   * @returns DialogRef with result
   */
  openStockCategoryModal(stockCategory?: any): DialogRef<any> {
    return this.open(StockCategoryModalComponent, {
      title: stockCategory ? 'Stok Kategorisi Düzenle' : 'Stok Kategorisi Ekle',
      width: '500px',
      data: stockCategory,
      panelClass: 'stock-category-dialog',
    });
  }

  /**
   * Open Stock Modal
   * @param stock Optional stock data for editing
   * @returns DialogRef with result
   */
  openStockModal(stock?: any): DialogRef<any> {
    return this.open(StockModalComponent, {
      title: stock ? 'Stok Düzenle' : 'Stok Ekle',
      width: '500px',
      data: stock,
      panelClass: 'stock-dialog',
    });
  }

  /**
   * Open User Group Modal
   * @param userGroup Optional user group data for editing
   * @returns DialogRef with result
   */
  openUserGroupModal(userGroup?: any): DialogRef<any> {
    return this.open(UserGroupModalComponent, {
      title: userGroup ? 'Kullanıcı Grubu Düzenle' : 'Kullanıcı Grubu Ekle',
      width: '500px',
      data: userGroup,
      panelClass: 'user-group-dialog',
    });
  }

  /**
   * Open User Modal
   * @param user Optional user data for editing
   * @param groups Optional user groups array for selection
   * @returns DialogRef with result
   */
  openUserModal(user?: any, groups?: any[]): DialogRef<any> {
    return this.open(UserModalComponent, {
      title: user ? 'Kullanıcı Düzenle' : 'Kullanıcı Ekle',
      width: '500px',
      data: { ...user, groups: groups || [] },
      panelClass: 'user-dialog',
    });
  }

  /**
   * Open Printer Modal
   * @param printer Optional printer data for editing
   * @returns DialogRef with result
   */
  openPrinterModal(printer?: any): DialogRef<any> {
    return this.open(PrinterModalComponent, {
      title: printer ? 'Yazıcı Düzenle' : 'Yazıcı Ekle',
      width: '500px',
      data: printer,
      panelClass: 'printer-dialog',
    });
  }

  /**
   * Open Admin Modal
   * @param adminSettings Optional admin settings data for editing
   * @returns DialogRef with result
   */
  openAdminModal(adminSettings?: any): DialogRef<any> {
    return this.open(AdminModalComponent, {
      title: 'Uygulama Ayarları',
      width: '600px',
      data: adminSettings,
      panelClass: 'admin-dialog',
    });
  }

  /**
   * Open Confirm Dialog
   * @param message Message to display
   * @param title Dialog title (default: 'Onay')
   * @returns DialogRef with boolean result
   */
  openConfirmDialog(message: string, title = 'Onay'): DialogRef<boolean> {
    return this.open(ConfirmModalComponent, {
      title,
      width: '400px',
      data: { message, title },
      panelClass: 'confirm-dialog',
    });
  }

  /**
   * Close all open dialogs
   */
  closeAll() {
    this.dialog.closeAll();
  }
}
