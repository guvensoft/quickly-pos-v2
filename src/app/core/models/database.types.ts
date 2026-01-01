/**
 * Database Type Definitions
 * 
 * Bu dosya PouchDB veritabanı işlemleri için tip güvenliği sağlar.
 * İş mantığına DOKUNULMADI - Sadece tip tanımları eklendi.
 */

import { CheckProduct, CheckStatus, CheckType, Occupation, PaymentStatus } from './check.model';
import { ProductSpecs } from './product.model';
import { OrderItem, OrderStatus, OrderType, User } from './order.model';

// ============================================
// BASE POUCHDB TYPES
// ============================================

/** PouchDB Document Base - Tüm dokümanlar bu interface'i extend eder */
export interface PouchDBDocument {
    _id?: string;
    _rev?: string;
    _deleted?: boolean;
}

/** PouchDB Standart Yanıt */
export interface PouchDBResponse {
    ok: boolean;
    id: string;
    rev: string;
}

/** PouchDB Bulk İşlem Yanıtı */
export interface PouchDBBulkResponse {
    ok: boolean;
    id: string;
    rev?: string;
    error?: string;
    reason?: string;
}

/** PouchDB Find Yanıtı - Generic */
export interface PouchDBFindResult<T extends PouchDBDocument> {
    docs: T[];
    warning?: string;
    bookmark?: string;
}

/** PouchDB AllDocs Yanıtı - Generic */
export interface PouchDBAllDocsResult<T extends PouchDBDocument> {
    total_rows: number;
    offset: number;
    rows: Array<{
        id: string;
        key: string;
        value: { rev: string };
        doc?: T;
    }>;
}

/** Delete Operation Result */
export interface DeleteResult {
    ok: boolean;
}

// ============================================
// DATABASE NAMES (String Literal Union)
// ============================================

export type DatabaseName =
    | 'users'
    | 'users_group'
    | 'checks'
    | 'closed_checks'
    | 'credits'
    | 'customers'
    | 'orders'
    | 'receipts'
    | 'calls'
    | 'cashbox'
    | 'categories'
    | 'sub_categories'
    | 'occations'
    | 'products'
    | 'recipes'
    | 'floors'
    | 'tables'
    | 'stocks'
    | 'stocks_cat'
    | 'endday'
    | 'reports'
    | 'logs'
    | 'commands'
    | 'comments'
    | 'prints'
    | 'settings'
    | 'allData';

// ============================================
// DOCUMENT INTERFACES
// ============================================

/** Check Document - Veritabanında saklanan yapı */
export interface CheckDocument extends PouchDBDocument {
    table_id: string;
    total_price: number;
    discount: number;
    owner: string;
    note: string;
    status: CheckStatus;
    products: CheckProduct[];
    timestamp: number;
    type: CheckType;
    check_no: number;
    occupation: Occupation;
    payment_flow?: PaymentStatus[];
    discountPercent?: number;
}

/** Closed Check Document */
export interface ClosedCheckDocument extends PouchDBDocument {
    table_id: string;
    total_price: number;
    discount: number;
    owner: string;
    note: string;
    status: CheckStatus;
    products: CheckProduct[];
    timestamp: number;
    type: CheckType;
    payment_method: string;
    payment_flow?: PaymentStatus[];
    description?: string;
    occupation?: Occupation;
}

/** Product Document */
export interface ProductDocument extends PouchDBDocument {
    cat_id: string;
    type: number;
    description: string;
    name: string;
    price: number;
    status: number;
    tax_value: number;
    barcode: number;
    notes: string;
    subcat_id?: string;
    specifies?: ProductSpecs[];
}

/** Category Document */
export interface CategoryDocument extends PouchDBDocument {
    name: string;
    description: string;
    status: number;
    printer: string;
    order: number;
    tags: string;
}

/** SubCategory Document */
export interface SubCategoryDocument extends PouchDBDocument {
    cat_id: string;
    name: string;
    description: string;
    status: number;
}

/** Order Document */
export interface OrderDocument extends PouchDBDocument {
    check: any; // Şimdilik any, sonra string | CheckDocument yapılabilir
    user: User;
    items: OrderItem[];
    status: OrderStatus;
    type: OrderType;
    timestamp: number;
}

/** Table Document */
export interface TableDocument extends PouchDBDocument {
    name: string;
    floor_id: string;
    status: number;
    timestamp: number;
    capacity: number;
    description: string;
    customers: string[];
    position?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

/** Floor Document */
export interface FloorDocument extends PouchDBDocument {
    name: string;
    description: string;
    status: number;
    order: number;
}

/** Settings Document */
export interface SettingsDocument extends PouchDBDocument {
    key: string;
    value: any; // Settings value'lar farklı tiplerde olabilir
    description: string;
    timestamp: number;
}

/** User Document */
export interface UserDocument extends PouchDBDocument {
    name: string;
    role: string;
    role_id: string;
    password: number;
    pincode: number;
    status: number;
    timestamp: number;
}

/** User Group Document */
export interface UserGroupDocument extends PouchDBDocument {
    name: string;
    description: string;
    auth: any; // Auth yapısı karmaşık, şimdilik any
    status: number;
    timestamp: number;
}

/** Report Document */
export interface ReportDocument extends PouchDBDocument {
    type: string;
    connection_id: string;
    count?: number;
    amount?: number;
    discount?: number;
    weekly?: number[];
    weekly_count?: number[];
    monthly?: number[];
    monthly_count?: number[];
    month?: number;
    year?: number;
    name?: string;
    timestamp: number;
    // Activity report için ek alanlar
    activity?: number[];
    activity_count?: number[];
    activity_time?: string[];
}

/** Log Document */
export interface LogDocument extends PouchDBDocument {
    type: string | number; // logType enum veya string
    connection_id: string;
    description: string;
    timestamp: number;
}

/** Cashbox Document */
export interface CashboxDocument extends PouchDBDocument {
    type: string;
    amount: number;
    description: string;
    timestamp: number;
    owner: string;
}

/** Customer Document */
export interface CustomerDocument extends PouchDBDocument {
    name: string;
    surname: string;
    phone: string;
    phone_number: number;
    address: string;
    picture: string;
    type: number;
    timestamp: number;
}

/** Credit Document */
export interface CreditDocument extends PouchDBDocument {
    customer_id: string;
    amount: number;
    description: string;
    timestamp: number;
    status: number;
}

/** Recipe Document */
export interface RecipeDocument extends PouchDBDocument {
    product_id: string;
    recipe: Array<{
        stock_id: string;
        amount: number;
    }>;
}

/** Stock Document */
export interface StockDocument extends PouchDBDocument {
    name: string;
    cat_id: string;
    unit: string;
    amount: number;
    min_amount: number;
    price: number;
    status: number;
    timestamp: number;
}

/** EndDay Document */
export interface EndDayDocument extends PouchDBDocument {
    date: string;
    total_sales: number;
    total_discount: number;
    cash_amount: number;
    card_amount: number;
    timestamp: number;
    reports: any; // Rapor yapısı karmaşık
}

// ============================================
// DATABASE MODEL MAPPING
// ============================================

/**
 * Veritabanı isimlerini document tiplerine map eder
 * Bu sayede MainService generic fonksiyonları tip güvenli olur
 */
// Eksik Doküman Tipleri (Placeholder for stricter types later)
export interface ReceiptDocument extends PouchDBDocument { [key: string]: any; }
export interface CallDocument extends PouchDBDocument { [key: string]: any; }
export interface OccationDocument extends PouchDBDocument { [key: string]: any; }
export interface StockCategoryDocument extends PouchDBDocument { [key: string]: any; }
export interface CommandDocument extends PouchDBDocument { [key: string]: any; }
export interface CommentDocument extends PouchDBDocument { [key: string]: any; }
export interface PrintDocument extends PouchDBDocument { [key: string]: any; }

// ============================================
// DATABASE MODEL MAPPING
// ============================================

/**
 * Veritabanı isimlerini document tiplerine map eder
 * Bu sayede MainService generic fonksiyonları tip güvenli olur
 */
export interface DatabaseModelMap {
    users: UserDocument;
    users_group: UserGroupDocument;
    checks: CheckDocument;
    closed_checks: ClosedCheckDocument;
    credits: CreditDocument;
    customers: CustomerDocument;
    orders: OrderDocument;
    receipts: ReceiptDocument;
    calls: CallDocument;
    cashbox: CashboxDocument;
    categories: CategoryDocument;
    sub_categories: SubCategoryDocument;
    occations: OccationDocument;
    products: ProductDocument;
    recipes: RecipeDocument;
    floors: FloorDocument;
    tables: TableDocument;
    stocks: StockDocument;
    stocks_cat: StockCategoryDocument;
    endday: EndDayDocument;
    reports: ReportDocument;
    logs: LogDocument;
    commands: CommandDocument;
    comments: CommentDocument;
    prints: PrintDocument;
    settings: SettingsDocument;
    allData: PouchDBDocument; // Genel tip
}

// Global declaration for PouchDB plugin
declare global {
    namespace PouchDB {
        interface Database {
            upsert(docId: string, diffFun: (doc: any) => any): Promise<any>;
            resolveConflicts(doc: any, resolveFun: (a: any, b: any) => any): Promise<any>;
        }
    }
}
