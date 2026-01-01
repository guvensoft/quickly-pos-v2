import { Injectable, signal, Signal, computed } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, from, of, lastValueFrom } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import PouchDBUpsert from 'pouchdb-upsert';
// @ts-ignore
import * as PouchDBResolve from 'pouch-resolve-conflicts';

// Type Safety: Database type definitions
import {
  DatabaseName,
  DatabaseModelMap,
  PouchDBDocument,
  PouchDBResponse,
  PouchDBFindResult,
  PouchDBAllDocsResult,
  DeleteResult
} from '../models/database.types';

// PouchDB plugin'lerini yükle
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
PouchDB.plugin(PouchDBResolve);

// Type definitions
interface AuthInfo {
  app_remote: string;
  app_port: string;
  app_id: string;
  app_token: string;
  app_db: string;
}

interface ServerInfo {
  type: number;
  status: number;
  ip_address: string;
  ip_port: string;
  key: string;
}

@Injectable({
  providedIn: 'root'
})
export class MainService {
  LocalDB: { [key: string]: PouchDB.Database } = {};
  RemoteDB: PouchDB.Database | any;
  ServerDB: PouchDB.Database | any;

  authInfo!: AuthInfo;
  serverInfo!: ServerInfo;
  hostname!: string;
  db_prefix!: string;
  ajax_opts!: object;

  // PHASE 1 - SIGNAL-BASED STATE MANAGEMENT
  private dataLoaded = signal(false);
  private syncInProgress = signal(false);
  private lastSyncError = signal<Error | null>(null);
  readonly remoteDBReady = signal(false);
  private remoteSync: any = null;
  private remoteSyncRequested = false;

  // Computed signals for derived state
  readonly isDataReady = computed(() => this.dataLoaded() && !this.syncInProgress());
  readonly hasSyncError = computed(() => this.lastSyncError() !== null);

  constructor() {
    const db_opts: PouchDB.Configuration.DatabaseConfiguration = {
      revs_limit: 1,
      auto_compaction: true,
      adapter: 'idb'
    };

    // Tüm local veritabanlarını oluştur
    this.LocalDB = {
      users: new PouchDB('local_users', db_opts),
      users_group: new PouchDB('local_users_group', db_opts),
      checks: new PouchDB('local_checks', db_opts),
      closed_checks: new PouchDB('local_closed_checks', db_opts),
      credits: new PouchDB('local_credits', db_opts),
      customers: new PouchDB('local_customers', db_opts),
      orders: new PouchDB('local_orders', db_opts),
      receipts: new PouchDB('local_receipts', db_opts),
      calls: new PouchDB('local_calls', db_opts),
      cashbox: new PouchDB('local_cashbox', db_opts),
      categories: new PouchDB('local_categories', db_opts),
      sub_categories: new PouchDB('local_sub_cats', db_opts),
      occations: new PouchDB('local_occations', db_opts),
      products: new PouchDB('local_products', db_opts),
      recipes: new PouchDB('local_recipes', db_opts),
      floors: new PouchDB('local_floors', db_opts),
      tables: new PouchDB('local_tables', db_opts),
      stocks: new PouchDB('local_stocks', db_opts),
      stocks_cat: new PouchDB('local_stocks_cat', db_opts),
      endday: new PouchDB('local_endday', db_opts),
      reports: new PouchDB('local_reports', db_opts),
      logs: new PouchDB('local_logs', db_opts),
      commands: new PouchDB('local_commands', db_opts),
      comments: new PouchDB('local_comments', db_opts),
      prints: new PouchDB('local_prints', db_opts),
      settings: new PouchDB('local_settings', { revs_limit: 3, auto_compaction: true, adapter: 'idb' }),
      allData: new PouchDB('local_alldata', { revs_limit: 3, auto_compaction: false, adapter: 'idb' })
    };

    // Auth bilgilerini yükle
    const authPromise = this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
      if (res && res.docs && res.docs.length > 0) {
        this.authInfo = res.docs[0].value;
        this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;
        const authOptions = {
          auth: {
            username: this.authInfo.app_id,
            password: this.authInfo.app_token
          }
        };
        this.db_prefix = this.authInfo.app_db;
        this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, authOptions);
      }
    }).catch(err => console.error('MainService: Error loading auth info:', err));

    // Server bilgilerini yükle
    const serverPromise = this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
      if (res && res.docs && res.docs.length > 0) {
        const appType = localStorage.getItem('AppType');
        switch (appType) {
          case 'Primary':
            this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 0)?.value;
            break;
          case 'Secondary':
            this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 1)?.value;
            break;
        }
        if (this.serverInfo && this.serverInfo.type == 0) {
          if (this.serverInfo.status == 1) {
            this.ServerDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
          }
        } else if (this.serverInfo && this.serverInfo.type == 1) {
          this.RemoteDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
        }
      }
    }).catch(err => console.error('MainService: Error loading server settings:', err));

    Promise.all([authPromise, serverPromise]).then(() => {
      if (this.RemoteDB) {
        this.remoteDBReady.set(true);
        if (this.remoteSyncRequested && !this.remoteSync) {
          this.syncToRemote();
        }
      }
    }).catch(err => console.error('MainService: Failed to initialize RemoteDB:', err));
  }

  // CRUD İşlemleri
  getAllData<K extends DatabaseName>(db: K): Promise<PouchDBAllDocsResult<DatabaseModelMap[K]>> {
    return this.LocalDB[db].allDocs({ include_docs: true }) as Promise<PouchDBAllDocsResult<DatabaseModelMap[K]>>;
  }

  getAllBy<K extends DatabaseName>(db: K, $schema: any): Promise<PouchDBFindResult<DatabaseModelMap[K]>> {
    if (!this.LocalDB[db]) return Promise.reject(`Database ${db} not found`);
    if (Object.keys($schema || {}).length === 0) {
      return this.LocalDB[db].allDocs({ include_docs: true }).then((res: any) => {
        return { docs: res.rows.map((row: any) => row.doc).filter((doc: any) => doc !== null) };
      }) as Promise<PouchDBFindResult<DatabaseModelMap[K]>>;
    }
    return this.LocalDB[db].find({ selector: $schema, limit: 10000 }) as Promise<PouchDBFindResult<DatabaseModelMap[K]>>;
  }

  getAllByObservable<T = PouchDBDocument>(db: DatabaseName, $schema?: Record<string, any>): Observable<T[]> {
    if (!this.LocalDB[db]) { this.lastSyncError.set(new Error(`Database ${db} not found`)); return of([]); }
    if (!$schema || Object.keys($schema).length === 0) {
      return from(this.LocalDB[db].allDocs({ include_docs: true })).pipe(
        map((res: any) => res.rows.map((row: any) => row.doc).filter((doc: any) => doc !== null) as T[]),
        catchError(err => { this.lastSyncError.set(err); return of([]); })
      );
    }
    return from(this.LocalDB[db].find({ selector: $schema, limit: 10000 })).pipe(
      map((res: PouchDBFindResult<any>) => (res.docs || []) as T[]),
      catchError(err => { this.lastSyncError.set(err); return of([]); })
    );
  }

  getAllBySignal<T = PouchDBDocument>(db: DatabaseName, $schema?: Record<string, any>): Signal<T[]> {
    return toSignal(this.getAllByObservable<T>(db, $schema), { initialValue: [] });
  }

  getData<K extends DatabaseName>(db: K, id: string): Promise<DatabaseModelMap[K]> {
    if (!this.LocalDB[db]) return Promise.reject(`Database ${db} not found`);
    return this.LocalDB[db].get(id).then((doc: any) => doc as DatabaseModelMap[K]).catch(err => {
      this.lastSyncError.set(err);
      throw err;
    });
  }

  getBulk(db: string, docs: Array<string>): Promise<any> {
    return this.LocalDB[db].bulkGet(docs as any);
  }

  addData<K extends DatabaseName>(db: K, schema: Omit<DatabaseModelMap[K], '_id' | '_rev'>): Promise<PouchDBResponse> {
    const doc = { ...schema } as any;
    delete doc._rev;
    return this.LocalDB[db].post(doc).then(res => {
      const docWithMeta = Object.assign({}, schema, { _id: res.id, db_name: db, db_seq: 0 });
      return (this.LocalDB['allData'] as any).upsert(res.id, (existingDoc: any) => docWithMeta).catch((err: any) => {
        if (err.status !== 409) console.log('addData-All', err);
        return { ok: true, id: res.id, rev: res.rev };
      });
    }).catch(err => { console.log('addData-Local', err); throw err; });
  }

  changeData(db: string, id: string, schema: any): Promise<any> {
    (this.LocalDB['allData'] as any).upsert(id, (doc: any) => Object.assign(doc || {}, schema)).catch((err: any) => {
      if (err.status !== 409) console.log('changeData-All', err);
    });
    return (this.LocalDB[db] as any).upsert(id, (doc: any) => Object.assign(doc || {}, schema)).catch((err: any) => {
      if (err.status !== 409) console.log('changeData-Local', err);
    });
  }

  updateData<K extends DatabaseName>(db: K, id: string, schema: Partial<DatabaseModelMap[K]>): Promise<PouchDBResponse> {
    (this.LocalDB['allData'] as any).upsert(id, (doc: any) => Object.assign(doc || {}, schema)).catch((err: any) => {
      if (err.status !== 409) console.log('updateData-All', err);
    });
    return (this.LocalDB[db] as any).upsert(id, (doc: any) => Object.assign(doc || {}, schema)).catch((err: any) => {
      if (err.status !== 409) console.log('updateData-Local', err);
    });
  }

  removeData<K extends DatabaseName>(db: K, id: string): Promise<PouchDBResponse> {
    this.LocalDB['allData'].get(id).then((doc) => this.LocalDB['allData'].remove(doc)).catch(err => console.log('removeData-All', err));
    return this.LocalDB[db].get(id).then((doc) => this.LocalDB[db].remove(doc) as Promise<PouchDBResponse>).catch(err => {
      console.log('removeData-Local', err);
      throw err;
    });
  }

  putDoc(db: string, doc: any): Promise<any> {
    return this.LocalDB[db].put(doc);
  }

  removeDoc(db: string, doc: any): Promise<any> {
    return this.LocalDB[db].remove(doc);
  }

  putAll(db: string, docs: Array<any>): Promise<any> {
    return this.LocalDB[db].bulkDocs(docs);
  }

  removeAllObservable<T = PouchDBDocument>(db: DatabaseName, $schema?: Record<string, any>): Observable<DeleteResult> {
    return from(new Promise<DeleteResult>((resolve) => {
      this.getAllBy(db as any, $schema || {}).then(res => {
        if (!res || !res.docs || res.docs.length === 0) { resolve({ ok: true }); return; }
        const toDelete = res.docs.map((doc: any) => ({ _id: doc._id, _rev: doc._rev, _deleted: true }));
        return this.LocalDB[db].bulkDocs(toDelete);
      }).then(() => resolve({ ok: true })).catch(err => { this.lastSyncError.set(err); resolve({ ok: false }); });
    }));
  }

  removeAll(db: string, $schema?: any): Promise<DeleteResult> {
    return lastValueFrom(this.removeAllObservable(db as DatabaseName, $schema));
  }

  createIndex(db: string, fields: Array<string>): Promise<any> {
    return this.LocalDB[db].createIndex({ index: { fields: fields } });
  }

  destroyDB(db: string | Array<string>): Promise<any> {
    if (Array.isArray(db)) {
      return Promise.all(db.map(db_name => this.LocalDB[db_name].destroy())).then(() => ({ ok: true }));
    } else {
      return this.LocalDB[db].destroy();
    }
  }

  compactDB(db: string): Promise<any> {
    return this.LocalDB[db].compact();
  }

  initDatabases(): void {
    // Redundant as constructor does this, but keeping for compatibility
  }

  localSyncBeforeRemote(local_db: string): any {
    return this.LocalDB[local_db].changes({ since: 'now', include_docs: true }).on('change', (change) => {
      if (change.deleted) {
        this.LocalDB['allData'].get(change.id).then((doc) => this.LocalDB['allData'].remove(doc));
      } else {
        const cData = Object.assign({ db_name: local_db, db_seq: (change as any).seq }, change.doc);
        (this.LocalDB['allData'] as any).upsert(change.id, (doc: any) => Object.assign(doc || {}, cData));
      }
    });
  }

  handleChanges(sync: any): void {
    if (!sync || !sync.change || !sync.change.docs) return;
    sync.change.docs.forEach((element: any) => {
      if (!element._deleted) {
        const db = element.db_name;
        if (db && this.LocalDB[db]) {
          delete element._rev; delete element.db_seq; delete element.db_name;
          (this.LocalDB[db] as any).upsert(element._id, (doc: any) => Object.assign(doc || {}, element));
        }
      } else {
        for (const db in this.LocalDB) {
          if (db !== 'allData') {
            this.LocalDB[db].get(element._id).then(doc => this.LocalDB[db].remove(doc)).catch(() => { });
          }
        }
      }
    });
  }

  loadAppDataObservable(): Observable<boolean> {
    return from(this.getAllBy('allData', {}).then(res => {
      if (!res?.docs?.length) { this.dataLoaded.set(true); return true; }
      const groups: { [key: string]: any[] } = {};
      res.docs.forEach((doc: any) => {
        if (doc.db_name && doc.db_name !== 'settings' && this.LocalDB[doc.db_name]) {
          const cleanDoc = { ...doc }; delete cleanDoc.db_name; delete cleanDoc.db_seq; delete cleanDoc._rev;
          if (!groups[doc.db_name]) groups[doc.db_name] = [];
          groups[doc.db_name].push(cleanDoc);
        }
      });
      return Promise.all(Object.keys(groups).map(db => this.LocalDB[db].bulkDocs(groups[db]))).then(() => {
        this.dataLoaded.set(true);
        return true;
      });
    }).catch(err => { this.lastSyncError.set(err); this.dataLoaded.set(true); return false; }));
  }

  loadAppData(): Promise<boolean> {
    return lastValueFrom(this.loadAppDataObservable());
  }

  syncToLocalObservable(database?: string): Observable<boolean> {
    const selector = database ? { db_name: database } : {};
    return from(this.getAllBy('allData', selector).then(res => {
      if (!res?.docs?.length) return true;
      const groups: { [key: string]: any[] } = {};
      res.docs.forEach((doc: any) => {
        if (doc.db_name && doc.db_name !== 'settings' && this.LocalDB[doc.db_name]) {
          const cleanDoc = { ...doc }; delete cleanDoc.db_name; delete cleanDoc.db_seq; delete cleanDoc._rev;
          if (!groups[doc.db_name]) groups[doc.db_name] = [];
          groups[doc.db_name].push(cleanDoc);
        }
      });
      return Promise.all(Object.keys(groups).map(db => this.LocalDB[db].bulkDocs(groups[db]))).then(() => true);
    }));
  }

  syncToLocal(database?: string): Promise<boolean> {
    return lastValueFrom(this.syncToLocalObservable(database));
  }

  replicateDB(db_conf: any): any {
    const db = new PouchDB(`http://${db_conf.ip_address}:${db_conf.ip_port}/${db_conf.key}/appServer`);
    return db.replicate.to(this.LocalDB['allData'], { batch_size: 500, filter: (doc: any) => !doc._deleted });
  }

  replicateFrom(): any {
    if (!this.RemoteDB || !this.RemoteDB.replicate) {
      console.warn('MainService: RemoteDB not ready, skipping replicateFrom');
      return { on: () => ({ on: () => ({ on: () => ({}) }) }), cancel: () => { } };
    }
    return this.RemoteDB.replicate.to(this.LocalDB['allData'], { filter: (doc: any) => !doc._deleted });
  }

  syncToServer(): any {
    if (!this.ServerDB || typeof this.ServerDB.sync !== 'function') {
      console.warn('MainService: ServerDB is not ready or invalid, skipping syncToServer');
      return { on: () => ({ on: () => ({ on: () => ({}) }) }), cancel: () => { } }; // Return a dummy with on/cancel to prevent crashes
    }
    console.log('MainService: Starting syncToServer');
    return PouchDB.sync(this.LocalDB['allData'], this.ServerDB, { live: true, retry: true, pull: { filter: (doc: any) => !doc._deleted } })
      .on('change', (sync: any) => this.handleChanges(sync))
      .on('error', (err: any) => {
        console.error('MainService: syncToServer error:', err);
        this.lastSyncError.set(err);
      });
  }

  syncToRemote(): any {
    this.remoteSyncRequested = true;
    if (this.remoteSync) return this.remoteSync;
    if (!this.RemoteDB) {
      console.warn('MainService: RemoteDB not ready, deferred syncToRemote');
      return;
    }
    this.syncInProgress.set(true);
    this.remoteSync = PouchDB.sync(this.LocalDB['allData'], this.RemoteDB, { live: true, retry: true, pull: { filter: (doc: any) => !doc._deleted } })
      .on('change', (sync: any) => this.handleChanges(sync))
      .on('error', (err: any) => {
        console.error('MainService: syncToRemote error:', err);
        this.lastSyncError.set(err);
        this.syncInProgress.set(false);
      })
      .on('paused', (info: any) => {
        this.syncInProgress.set(false);
        if (info) console.log('MainService: syncToRemote paused', info);
      })
      .on('active', () => {
        this.syncInProgress.set(true);
        console.log('MainService: syncToRemote active');
      });
    return this.remoteSync;
  }

  cancelRemoteSync(): void {
    try {
      this.remoteSync?.cancel?.();
    } finally {
      this.remoteSync = null;
      this.remoteSyncRequested = false;
      this.syncInProgress.set(false);
    }
  }

  formatPrice(value: any): string {
    if (!value) value = 0;
    return '₺ ' + Number(value).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
  }
}
