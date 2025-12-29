import { Injectable, inject } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';

// Import modal components
import { ProductModalComponent } from '../../shared/modals/product-modal/product-modal.component';
import { CategoryModalComponent } from '../../shared/modals/category-modal/category-modal.component';
import { CustomerModalComponent } from '../../shared/modals/customer-modal/customer-modal.component';
import { TableModalComponent } from '../../shared/modals/table-modal/table-modal.component';
import { ConfirmModalComponent } from '../../shared/modals/confirm-modal/confirm-modal.component';
import { SubcategoryModalComponent } from '../../shared/modals/subcategory-modal/subcategory-modal.component';
import { StockCategoryModalComponent } from '../../shared/modals/stock-category-modal/stock-category-modal.component';
import { StockModalComponent } from '../../shared/modals/stock-modal/stock-modal.component';
import { UserGroupModalComponent } from '../../shared/modals/user-group-modal/user-group-modal.component';
import { UserModalComponent } from '../../shared/modals/user-modal/user-modal.component';
import { PrinterModalComponent } from '../../shared/modals/printer-modal/printer-modal.component';
import { AdminModalComponent } from '../../shared/modals/admin-modal/admin-modal.component';
import { FloorModalComponent } from '../../shared/modals/floor-modal/floor-modal.component';
import { CheckDetailModalComponent } from '../../shared/modals/check-detail-modal/check-detail-modal.component';
import { JsonEditorModalComponent } from '../../shared/modals/json-editor-modal/json-editor-modal.component';
import { CashboxModalComponent } from '../../shared/modals/cashbox-modal/cashbox-modal.component';
import { PasswordModalComponent } from '../../shared/modals/password-modal/password-modal.component';
import { PrinterAddModalComponent } from '../../shared/modals/printer-add-modal/printer-add-modal.component';
import { PromptModalComponent } from '../../shared/modals/prompt-modal/prompt-modal.component';
import { CheckEditModalComponent } from '../../shared/modals/check-edit-modal/check-edit-modal.component';
import { PaymentEditModalComponent } from '../../shared/modals/payment-edit-modal/payment-edit-modal.component';
import { NoteModalComponent } from '../../shared/modals/note-modal/note-modal.component';
import { SelectionModalComponent, SelectionItem } from '../../shared/modals/selection-modal/selection-modal.component';
import { PaymentMethodModalComponent } from '../../shared/modals/payment-method-modal/payment-method-modal.component';
import { TableSelectionModalComponent } from '../../shared/modals/table-selection-modal/table-selection-modal.component';
import { NumpadModalComponent } from '../../shared/modals/numpad-modal/numpad-modal.component';
import { OccupancyModalComponent } from '../../shared/modals/occupancy-modal/occupancy-modal.component';
import { CheckOptionsModalComponent } from '../../shared/modals/check-options-modal/check-options-modal.component';
import { DiscountModalComponent } from '../../shared/modals/discount-modal/discount-modal.component';
import { DivisionModalComponent } from '../../shared/modals/division-modal/division-modal.component';
import { CreditModalComponent } from '../../shared/modals/credit-modal/credit-modal.component';
import { ChartModalComponent } from '../../shared/modals/chart-modal/chart-modal.component';
import { CashDetailModalComponent } from '../../shared/modals/cash-detail-modal/cash-detail-modal.component';
import { ProcessingModalComponent } from '../../shared/modals/processing-modal/processing-modal.component';
import { CallerModalComponent } from '../../shared/modals/caller-modal/caller-modal.component';

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
   * Open Floor Modal
   * @param floor Optional floor data for editing
   * @returns DialogRef with result
   */
  openFloorModal(floor?: any): DialogRef<any> {
    return this.open(FloorModalComponent, {
      title: floor ? 'Bölge Düzenle' : 'Bölge Ekle',
      width: '600px',
      data: floor,
      panelClass: 'floor-dialog',
    });
  }

  /**
   * Open Check Detail Modal
   * @param check Check data
   * @returns DialogRef with action result
   */
  openCheckDetailModal(check: any): DialogRef<any> {
    return this.open(CheckDetailModalComponent, {
      title: 'Hesap Detayı',
      width: '700px',
      data: check,
      panelClass: 'check-detail-dialog',
    });
  }

  /**
   * Open Json Editor Modal
   * @param data { document: any, onCreate: boolean }
   * @returns DialogRef with result
   */
  openJsonEditorModal(data: { document: any, onCreate: boolean }): DialogRef<any> {
    return this.open(JsonEditorModalComponent, {
      title: data.onCreate ? 'Döküman Oluştur' : 'Döküman Düzenle',
      width: '800px',
      data,
      panelClass: 'json-editor-dialog',
    });
  }

  /**
   * Open Cashbox Modal
   * @param data { cashbox?: any, type: string, onUpdate: boolean }
   * @returns DialogRef with result
   */
  openCashboxModal(data: { cashbox?: any, type: string, onUpdate: boolean }): DialogRef<any> {
    return this.open(CashboxModalComponent, {
      title: `${data.type} ${data.onUpdate ? 'Düzenle' : 'Ekle'}`,
      width: '600px',
      data,
      panelClass: 'cashbox-dialog',
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
   * Open Password Modal
   * @param data { title: string, message: string }
   * @returns DialogRef with result string (password)
   */
  openPasswordModal(data: { title: string, message: string }): DialogRef<string> {
    return this.open(PasswordModalComponent, {
      title: data.title,
      width: '400px',
      data,
      panelClass: 'password-dialog',
    });
  }

  /**
   * Open Printer Add Modal (Scan and Add)
   * @returns DialogRef with new Printer object
   */
  openPrinterAddModal(): DialogRef<any> {
    return this.open(PrinterAddModalComponent, {
      title: 'Yazıcı Ekle',
      width: '600px',
      panelClass: 'printer-add-dialog',
    });
  }

  /**
   * Open Prompt Modal
   * @param data { title: string, message: string, placeholder?: string, value?: string, required?: boolean }
   * @returns DialogRef with result string
   */
  openPromptModal(data: { title: string, message: string, placeholder?: string, value?: string, required?: boolean }): DialogRef<string> {
    return this.open(PromptModalComponent, {
      title: data.title,
      width: '450px',
      data,
      panelClass: 'prompt-dialog',
    });
  }

  /**
   * Open Check Edit Modal
   * @param data check object
   * @returns DialogRef with action and value
   */
  openCheckEditModal(data: any): DialogRef<any> {
    return this.open(CheckEditModalComponent, {
      title: 'Hesap Düzenle',
      width: '500px',
      data,
      panelClass: 'check-edit-dialog',
    });
  }

  /**
   * Open Payment Edit Modal
   * @param data payment object
   * @returns DialogRef with new payment values
   */
  openPaymentEditModal(data: any): DialogRef<any> {
    return this.open(PaymentEditModalComponent, {
      title: 'Ödeme Düzenle',
      width: '450px',
      data,
      panelClass: 'payment-edit-dialog',
    });
  }

  /**
   * Open Note Modal for products
   * @param data product details
   */
  openNoteModal(data: any): DialogRef<any> {
    return this.open(NoteModalComponent, {
      title: 'Not Ekle',
      width: '600px',
      data,
      panelClass: 'note-dialog',
    });
  }

  /**
   * Open Selection Modal Generic
   * @param data { title: string, items: SelectionItem[] }
   */
  openSelectionModal(data: { title: string, items: SelectionItem[] }): DialogRef<SelectionItem> {
    return this.open(SelectionModalComponent, {
      title: data.title,
      width: '550px',
      data,
      panelClass: 'selection-dialog',
    });
  }

  /**
   * Open Payment Method Modal
   * @param data { methods: any[] }
   */
  openPaymentMethodModal(data: { methods: any[] }): DialogRef<string> {
    return this.open(PaymentMethodModalComponent, {
      title: 'Ödeme Yöntemi',
      width: '800px',
      data,
      panelClass: 'payment-method-dialog',
    });
  }

  /**
   * Open Table Selection Modal
   * @param data { title: string, tables: any[], floors: any[], currentTableId: string, actionText: string }
   */
  openTableSelectionModal(data: any): DialogRef<string> {
    return this.open(TableSelectionModalComponent, {
      title: data.title,
      width: '90vw',
      data,
      panelClass: 'table-selection-dialog',
    });
  }

  /**
   * Open Numpad Modal
   * @param data { productName: string, productPrice: number, stockAmount: number, unit: string }
   */
  openNumpadModal(data: any): DialogRef<number> {
    return this.open(NumpadModalComponent, {
      title: data.productName,
      width: '500px',
      data,
      panelClass: 'numpad-dialog',
    });
  }

  /**
   * Open Occupancy Modal
   * @param data { occupation: any }
   */
  openOccupancyModal(data: any): DialogRef<{ male: number, female: number }> {
    return this.open(OccupancyModalComponent, {
      title: 'Kişi Sayısı',
      width: '700px',
      data,
      panelClass: 'occupancy-dialog',
    });
  }

  /**
   * Open Check Options Modal
   * @param data { permissions: any }
   */
  openCheckOptionsModal(data: { permissions: any }): DialogRef<string> {
    return this.open(CheckOptionsModalComponent, {
      title: 'Hesap İşlemleri',
      width: '600px',
      data,
      panelClass: 'check-options-dialog',
    });
  }

  /**
   * Open Discount Modal for payments
   * @param data { currentAmount: number, discounts: number[] }
   */
  openDiscountModal(data: { currentAmount: number, discounts: number[] }): DialogRef<{ type: 'amount' | 'percent', value: number }> {
    return this.open(DiscountModalComponent, {
      title: 'İndirim Yap',
      width: '600px',
      data,
      panelClass: 'discount-dialog',
    });
  }

  /**
   * Open Division Modal for splitting payments
   * @param data { totalAmount: number }
   */
  openDivisionModal(data: { totalAmount: number }): DialogRef<number> {
    return this.open(DivisionModalComponent, {
      title: 'Ödeme Bölme',
      width: '500px',
      data,
      panelClass: 'division-dialog',
    });
  }

  /**
   * Open Credit Modal for cari closure
   * @param data { customers: any[] }
   */
  openCreditModal(data: { customers: any[] }): DialogRef<{ customer_id: string, note: string }> {
    return this.open(CreditModalComponent, {
      title: 'Alacaklı Kapat',
      width: '600px',
      data,
      panelClass: 'credit-dialog',
    });
  }

  openChartModal(data: { title: string, datasets: any[], labels: string[], options: any, legend: boolean, type: any }): DialogRef<void> {
    return this.open(ChartModalComponent, {
      title: data.title,
      width: '850px',
      data,
      panelClass: 'chart-dialog',
    });
  }

  openCashDetailModal(data: any): DialogRef<void> {
    return this.open(CashDetailModalComponent, {
      title: 'Kasa Hareketi',
      width: '500px',
      data,
      panelClass: 'cash-detail-dialog',
    });
  }

  openProcessingModal(data: { title: string, message: string }): DialogRef<void> {
    return this.open(ProcessingModalComponent, {
      title: data.title,
      width: '400px',
      data,
      panelClass: 'processing-dialog',
    });
  }

  openCallerModal(data: { call: any, customer: any }): DialogRef<{ action: 'open' | 'save', formValue?: any }> {
    return this.open(CallerModalComponent, {
      title: 'Gelen Çağrı',
      width: '500px',
      data,
      panelClass: 'caller-dialog',
    });
  }

  /**
   * Close all open dialogs
   */
  closeAll() {
    this.dialog.closeAll();
  }
}
