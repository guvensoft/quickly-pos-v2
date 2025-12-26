import { Injectable } from '@angular/core';
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import PouchDBUpsert from 'pouchdb-upsert';
// @ts-ignore
import * as PouchDBResolve from 'pouch-resolve-conflicts';
// Note: PouchDB-adapter-memory ve replication-stream ihtiyaç durumuna göre eklenebilir

// Type Safety: Database type definitions
import {
  DatabaseName,
  DatabaseModelMap,
  PouchDBDocument,
  PouchDBResponse,
  PouchDBFindResult,
  PouchDBAllDocsResult
} from '../models/database.types';

// PouchDB plugin'lerini yükle
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
PouchDB.plugin(PouchDBResolve);
// PouchDB.plugin(PouchDBInMemory); // Gerekirse ekle
// PouchDB.plugin(PouchDBReplicationStream.plugin); // Gerekirse ekle

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

  constructor() {
    const db_opts: PouchDB.Configuration.DatabaseConfiguration = {
      revs_limit: 1,
      auto_compaction: true,
      adapter: 'idb' // Angular 21'de 'memory' yerine 'idb' (IndexedDB) kullanıyoruz
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
    this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
      if (res && res.docs && res.docs.length > 0) {
        this.authInfo = res.docs[0].value;
        this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;

        // Modern PouchDB (v7+) with fetch adapter prefers 'auth' option
        // This ensures Authorization header is generated correctly for both fetch and XHR
        const authOptions = {
          auth: {
            username: this.authInfo.app_id,
            password: this.authInfo.app_token
          }
        };

        console.log('MainService: Auth Info Loaded', {
          app_id: this.authInfo.app_id,
          hasToken: !!this.authInfo.app_token
        });

        this.db_prefix = this.authInfo.app_db;
        this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, authOptions);
      }
    }).catch(err => {
      console.error('MainService: Error loading auth info:', err);
    });

    // Server bilgilerini yükle
    this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
      if (res && res.docs && res.docs.length > 0) {
        const appType = localStorage.getItem('AppType');
        switch (appType) {
          case 'Primary':
            this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 0)?.value;
            break;
          case 'Secondary':
            this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 1)?.value;
            break;
          default:
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
    }).catch(err => {
      console.error('MainService: Error loading server settings:', err);
    });
  }

  // ============================================
  // CRUD İşlemleri - İş mantığı AYNEN KORUNDU
  // ============================================

  /**
   * Tüm dokümanları getir (Tip güvenli)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  getAllData<K extends DatabaseName>(db: K): Promise<PouchDBAllDocsResult<DatabaseModelMap[K]>> {
    return this.LocalDB[db].allDocs({ include_docs: true }) as Promise<PouchDBAllDocsResult<DatabaseModelMap[K]>>;
  }

  /**
   * Filtreye göre dokümanları getir (Tip güvenli)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  getAllBy<K extends DatabaseName>(
    db: K,
    $schema: any // Şimdilik any, sonra Partial<DatabaseModelMap[K]> yapılabilir
  ): Promise<PouchDBFindResult<DatabaseModelMap[K]>> {
    if (!this.LocalDB[db]) return Promise.reject(`Database ${db} not found`);

    // Performance optimization: use allDocs for empty queries
    if (Object.keys($schema || {}).length === 0) {
      return this.LocalDB[db].allDocs({ include_docs: true }).then((res: any) => {
        return { docs: res.rows.map((row: any) => row.doc).filter((doc: any) => doc !== null) };
      }) as Promise<PouchDBFindResult<DatabaseModelMap[K]>>;
    }

    return this.LocalDB[db].find({
      selector: $schema,
      limit: 10000
    }) as Promise<PouchDBFindResult<DatabaseModelMap[K]>>;
  }

  /**
   * ID ile tek doküman getir (Tip güvenli)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  getData<K extends DatabaseName>(db: K, id: string): Promise<DatabaseModelMap[K]> {
    return this.LocalDB[db].get(id) as Promise<DatabaseModelMap[K]>;
  }

  getBulk(db: string, docs: Array<string>): Promise<any> {
    return this.LocalDB[db].bulkGet(docs as any);
  }

  /**
   * Yeni doküman ekle (Tip güvenli)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  addData<K extends DatabaseName>(
    db: K,
    schema: Omit<DatabaseModelMap[K], '_id' | '_rev'>
  ): Promise<PouchDBResponse> {
    const doc = { ...schema } as any;
    delete doc._rev; // Ensure _rev is removed before post

    return this.LocalDB[db].post(doc).then(res => {
      // PouchDB post returns { ok: true, id: '...', rev: '...' }
      // We need to fetch the document or construct it to put into 'allData'
      const docWithMeta = Object.assign({}, schema, { _id: res.id, db_name: db, db_seq: 0 });
      // DO NOT include _rev from the schema (it shouldn't be there anyway from post)
      // BUT we should respect the new rev if we were updating, but here we are adding.
      // For 'allData', this is a new insert/upsert.

      // Use upsert instead of put to handle potential conflicts in 'allData'
      return (this.LocalDB['allData'] as any).upsert(res.id, (existingDoc: any) => {
        return docWithMeta;
      }).catch((err: any) => {
        // Silently handle conflict if it still happens
        if (err.status !== 409) console.log('addData-All', err);
        return { ok: true, id: res.id, rev: res.rev };
      });
    }).catch(err => {
      console.log('addData-Local', err);
      throw err; // Propagate error
    });
  }

  changeData(db: string, id: string, schema: any): Promise<any> {
    (this.LocalDB['allData'] as any).upsert(id, (doc: any) => {
      return Object.assign(doc || {}, schema);
    }).catch((err: any) => {
      if (err.status !== 409) console.log('changeData-All', err);
    });
    return (this.LocalDB[db] as any).upsert(id, (doc: any) => {
      return Object.assign(doc || {}, schema);
    }).catch((err: any) => {
      if (err.status !== 409) console.log('changeData-Local', err);
    });
  }

  /**
   * Doküman güncelle (Tip güvenli - Partial)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  updateData<K extends DatabaseName>(
    db: K,
    id: string,
    schema: Partial<DatabaseModelMap[K]>
  ): Promise<PouchDBResponse> {
    (this.LocalDB['allData'] as any).upsert(id, (doc: any) => {
      return Object.assign(doc || {}, schema);
    }).catch((err: any) => {
      if (err.status !== 409) console.log('updateData-All', err);
    });
    return (this.LocalDB[db] as any).upsert(id, (doc: any) => {
      return Object.assign(doc || {}, schema);
    }).catch((err: any) => {
      if (err.status !== 409) console.log('updateData-Local', err);
    });
  }

  /**
   * Doküman sil (Tip güvenli)
   * İÇ MANTIK: AYNEN KORUNDU
   */
  removeData<K extends DatabaseName>(db: K, id: string): Promise<PouchDBResponse> {
    this.LocalDB['allData'].get(id).then((doc) => {
      this.LocalDB['allData'].remove(doc).catch(err => {
        console.log('removeData-All', err);
      });
    });
    return this.LocalDB[db].get(id).then((doc) => {
      return this.LocalDB[db].remove(doc) as Promise<PouchDBResponse>;
    }).catch(err => {
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

  removeAll(db: string, $schema: any): Promise<any> {
    return this.getAllBy(db as any, $schema).then(res => {
      if (!res || !res.docs || res.docs.length === 0) {
        return [];
      }
      return res.docs.map((obj: any) => {
        return { _id: obj._id, _rev: obj._rev, _deleted: true };
      });
    }).then(deleteDocs => {
      if (deleteDocs.length === 0) {
        return { ok: true };
      }
      return this.LocalDB[db].bulkDocs(deleteDocs);
    });
  }

  createIndex(db: string, fields: Array<string>): Promise<any> {
    return this.LocalDB[db].createIndex({
      index: {
        fields: fields
      }
    });
  }

  destroyDB(db: string | Array<string>): Promise<any> {
    if (Array.isArray(db)) {
      return new Promise((resolve, reject) => {
        db.forEach((db_name, index) => {
          this.LocalDB[db_name].destroy().then(res => {
            if ((res as any).ok) {
              console.log(db_name, 'DB destroyed.');
              if (db.length == index + 1) {
                resolve({ ok: true });
              }
            } else {
              console.error(db_name, 'DB not destroyed!');
              reject({ ok: false });
            }
          });
        });
      });
    } else {
      return this.LocalDB[db].destroy();
    }
  }

  compactDB(db: string): Promise<any> {
    return this.LocalDB[db].compact();
  }

  initDatabases(): void {
    const db_opts: PouchDB.Configuration.DatabaseConfiguration = {
      revs_limit: 1,
      auto_compaction: true,
      adapter: 'idb'
    };

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
  }

  localSyncBeforeRemote(local_db: string): any {
    return this.LocalDB[local_db].changes({ since: 'now', include_docs: true }).on('change', (change) => {
      if (change.deleted) {
        this.LocalDB['allData'].get(change.id).then((doc) => {
          this.LocalDB['allData'].remove(doc);
        });
      } else {
        const cData = Object.assign({ db_name: local_db, db_seq: (change as any).seq }, change.doc);
        (this.LocalDB['allData'] as any).upsert(change.id, (doc: any) => {
          return Object.assign(doc || {}, cData);
        }).catch((err: any) => {
          if (err.status !== 409) console.log('syncToAllData-Err', err);
        });
      }
    });
  }

  handleChanges(sync: any): void {
    if (!sync || !sync.change || !sync.change.docs) return;
    const changes = sync.change.docs;
    if (sync.direction === 'pull') {
      changes.forEach((element: any) => {
        if (!element._deleted) {
          const db = element.db_name;
          if (element.key !== 'ServerSettings' && element.key !== 'ActivationStatus') {
            delete element._rev;
            delete element._revisions;
            delete element.db_seq;
            delete element.db_name;
            if (db && this.LocalDB[db]) {
              (this.LocalDB[db] as any).upsert(element._id, (doc: any) => {
                return Object.assign(doc || {}, element);
              }).catch((err: any) => {
                console.log('MainService: upsert error in handleChanges', err);
              });
            }
          }
        } else {
          for (const db in this.LocalDB) {
            if (db !== 'allData') {
              this.LocalDB[db].get(element._id).then((doc) => {
                if (doc) return this.LocalDB[db].remove(doc);
              }).catch(err => { });
            }
          }
        }
      });
    }
  }

  loadAppData(): Promise<any> {
    return this.getAllBy('allData', {}).then(res => {
      if (!res || !res.docs || res.docs.length === 0) {
        console.log('MainService: No data to load from allData');
        return true;
      }

      const docs = res.docs;
      const groups: { [key: string]: any[] } = {};

      docs.forEach((doc: any) => {
        // Skip settings and ensure db exists
        if (doc.db_name && doc.db_name !== 'settings' && this.LocalDB[doc.db_name]) {
          const dbName = doc.db_name;
          const cleanDoc = { ...doc };
          delete cleanDoc.db_name;
          delete cleanDoc.db_seq;
          delete cleanDoc._rev;

          if (!groups[dbName]) groups[dbName] = [];
          groups[dbName].push(cleanDoc);
        }
      });

      const dbPromises = Object.keys(groups).map(dbName => {
        // Try to fetch existing docs to avoid conflicts if possible,
        // but bulkDocs without _rev will just result in conflict items in the result array anyway.
        // To truly overwrite, we would need current revs.
        // However, loadAppData is typically for initial load.
        return this.LocalDB[dbName].bulkDocs(groups[dbName]).catch((err: any) => {
          console.warn(`Bulk update failed for ${dbName}:`, err);
          return [];
        });
      });

      return Promise.all(dbPromises).then(() => {
        console.log('MainService: App Data Successfully Initialized');
        return true;
      });
    }).catch(err => {
      console.error('MainService: Error in loadAppData:', err);
      return true; // Still return true to let the UI proceed
    });
  }

  syncToLocal(database?: string): Promise<any> {
    const selector = database ? { db_name: database } : {};
    return this.getAllBy('allData', selector).then(res => {
      if (!res || !res.docs || res.docs.length === 0) {
        return true;
      }

      const docs = res.docs;
      const groups: { [key: string]: any[] } = {};

      docs.forEach((doc: any) => {
        const dbName = doc.db_name;
        if (dbName && dbName !== 'settings' && this.LocalDB[dbName]) {
          const cleanDoc = { ...doc };
          delete cleanDoc.db_name;
          delete cleanDoc.db_seq;
          delete cleanDoc._rev;

          if (!groups[dbName]) groups[dbName] = [];
          groups[dbName].push(cleanDoc);
        }
      });

      const dbPromises = Object.keys(groups).map(dbName => {
        return this.LocalDB[dbName].bulkDocs(groups[dbName]).catch(() => []);
      });

      return Promise.all(dbPromises).then(() => true);
    }).catch(err => {
      console.error('MainService: syncToLocal Error:', err);
      return false;
    });
  }

  replicateDB(db_configrations: any): any {
    const db = new PouchDB(`http://${db_configrations.ip_address}:${db_configrations.ip_port}/${db_configrations.key}/appServer`);
    return db.replicate.to(this.LocalDB['allData'], { batch_size: 500, batches_limit: 50, timeout: 60000, filter: (doc: any) => !doc._deleted });
  }

  replicateFrom(): any {
    return this.RemoteDB.replicate.to(this.LocalDB['allData'], { filter: (doc: any) => !doc._deleted });
  }

  syncToServer(): any {
    return PouchDB.sync(this.LocalDB['allData'], this.ServerDB, {
      live: true,
      retry: true,
      heartbeat: 2500,
      pull: { filter: (doc: any) => !doc._deleted },
      back_off_function: (delay: number) => {
        delay = 1000;
        return delay;
      }
    }).on('change', (sync: any) => { this.handleChanges(sync); });
  }

  syncToRemote(): any {
    let rOpts: any = { live: true, retry: true, pull: { filter: (doc: any) => !doc._deleted } };
    if (this.serverInfo && this.serverInfo.type == 1) {
      rOpts = {
        live: true,
        retry: true,
        heartbeat: 2500,
        pull: { filter: (doc: any) => !doc._deleted },
        back_off_function: (delay: number) => {
          delay = 1000;
          return delay;
        }
      };
    }
    return PouchDB.sync(this.LocalDB['allData'], this.RemoteDB, rOpts)
      .on('change', (sync: any) => { this.handleChanges(sync); })
      .on('error', (err: any) => { console.log('Sync Error:', err); });
  }
}
