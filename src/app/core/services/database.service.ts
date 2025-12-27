import { Injectable, signal, computed, effect, inject } from '@angular/core';
import { MainService } from './main.service';
import {
    DatabaseName,
    DatabaseModelMap,
    TableDocument,
    OrderDocument,
    CheckDocument,
    CategoryDocument,
    ProductDocument,
    FloorDocument
} from '../models/database.types';

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    private mainService = inject(MainService);

    // Core collections as signals
    readonly tables = signal<TableDocument[]>([]);
    readonly orders = signal<OrderDocument[]>([]);
    readonly checks = signal<CheckDocument[]>([]);
    readonly categories = signal<CategoryDocument[]>([]);
    readonly products = signal<ProductDocument[]>([]);
    readonly floors = signal<FloorDocument[]>([]);
    readonly receipts = signal<any[]>([]);
    readonly customers = signal<any[]>([]);
    readonly reports = signal<any[]>([]);

    // Computed signals
    readonly occupiedTables = computed(() => this.tables().filter(t => t.status === 1));
    readonly pendingOrders = computed(() => this.orders().filter(o => o.status === 0));

    constructor() {
        this.initDatabaseListeners();
    }

    /**
     * Initializes listeners for PouchDB changes to keep signals in sync
     */
    private initDatabaseListeners() {
        // Basic initialization: Load initial data
        this.refreshAll();

        // Listen to changes for each critical database
        this.watchDatabase('tables', this.tables);
        this.watchDatabase('orders', this.orders);
        this.watchDatabase('checks', this.checks);
        this.watchDatabase('categories', this.categories);
        this.watchDatabase('products', this.products);
        this.watchDatabase('floors', this.floors);
        this.watchDatabase('receipts', this.receipts);
        this.watchDatabase('customers', this.customers);
        this.watchDatabase('reports', this.reports);
    }

    /**
     * Refreshes all core signals by fetching from PouchDB
     */
    async refreshAll() {
        const [tables, orders, checks, categories, products, floors, receipts, customers, reports] = await Promise.all([
            this.mainService.getAllBy('tables', {}),
            this.mainService.getAllBy('orders', {}),
            this.mainService.getAllBy('checks', {}),
            this.mainService.getAllBy('categories', {}),
            this.mainService.getAllBy('products', {}),
            this.mainService.getAllBy('floors', {}),
            this.mainService.getAllBy('receipts', {}),
            this.mainService.getAllBy('customers', {}),
            this.mainService.getAllBy('reports', {})
        ]);

        this.tables.set(tables.docs || []);
        this.orders.set(orders.docs || []);
        this.checks.set(checks.docs || []);
        this.categories.set(categories.docs || []);
        this.products.set(products.docs || []);
        this.floors.set(floors.docs || []);
        this.receipts.set(receipts.docs || []);
        this.customers.set(customers.docs || []);
        this.reports.set(reports.docs || []);
    }

    /**
     * Watches a specific PouchDB database and updates the corresponding signal
     */
    private watchDatabase(dbName: DatabaseName, targetSignal: any) {
        const db = this.mainService.LocalDB[dbName];
        if (!db) return;

        db.changes({
            since: 'now',
            live: true,
            include_docs: true
        }).on('change', (change) => {
            this.handleDatabaseChange(dbName, change, targetSignal);
        });
    }

    /**
     * Local change handler to update signals without a full refresh
     */
    private handleDatabaseChange(dbName: string, change: any, targetSignal: any) {
        const currentData = targetSignal();

        if (change.deleted) {
            targetSignal.set(currentData.filter((doc: any) => doc._id !== change.id));
        } else {
            const index = currentData.findIndex((doc: any) => doc._id === change.id);
            if (index > -1) {
                const newData = [...currentData];
                newData[index] = change.doc;
                targetSignal.set(newData);
            } else {
                targetSignal.set([...currentData, change.doc]);
            }
        }
    }

    // Wrapper methods for CRUD that ensure signal-agnostic calls still work
    // while keeping our local re-active state updated via change listeners.

    async addData<K extends DatabaseName>(db: K, doc: any) {
        return this.mainService.addData(db, doc);
    }

    async updateData<K extends DatabaseName>(db: K, id: string, doc: any) {
        return this.mainService.updateData(db, id, doc);
    }

    async removeData<K extends DatabaseName>(db: K, id: string) {
        return this.mainService.removeData(db, id);
    }
}
