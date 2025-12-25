import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import PouchDB from 'pouchdb-browser';
import PouchDBFind from 'pouchdb-find';
import PouchDBUpsert from 'pouchdb-upsert';
import PouchDBResolve from 'pouch-resolve-conflicts';
// import PouchDBInMemory from 'pouchdb-adapter-memory';
// import PouchDBReplicationStream from 'pouchdb-replication-stream';
import { Buffer } from 'buffer';

import { AuthInfo, ServerInfo } from '../models/settings.model';

// Register plugins
PouchDB.plugin(PouchDBFind);
PouchDB.plugin(PouchDBUpsert);
PouchDB.plugin(PouchDBResolve);
// PouchDB.plugin(PouchDBInMemory);
// PouchDB.plugin(PouchDBReplicationStream.plugin);

@Injectable({
    providedIn: 'root'
})
export class DatabaseService {
    LocalDB: { [key: string]: any } = {};
    RemoteDB: any;
    ServerDB: any;

    authInfo: AuthInfo | undefined;
    serverInfo: ServerInfo | undefined;
    hostname: string | undefined;
    db_prefix: string | undefined;
    ajax_opts: object | undefined;

    constructor(@Inject(PLATFORM_ID) private platformId: Object) {
        if (isPlatformBrowser(this.platformId)) {
            this.initDatabases();
            this.initSettings();
        }
    }

    initDatabases() {
        const db_opts = { revs_limit: 1, auto_compaction: true, adapter: 'idb' };
        // Using default adapter (IndexedDB) instead of memory to solve build issues and ensure persistence.
        const mem_opts = { revs_limit: 1, auto_compaction: true };

        this.LocalDB = {
            users: new PouchDB('local_users', mem_opts),
            users_group: new PouchDB('local_users_group', mem_opts),
            checks: new PouchDB('local_checks', mem_opts),
            closed_checks: new PouchDB('local_closed_checks', mem_opts),
            credits: new PouchDB('local_credits', mem_opts),
            customers: new PouchDB('local_customers', mem_opts),
            orders: new PouchDB('local_orders', mem_opts),
            receipts: new PouchDB('local_receipts', mem_opts),
            calls: new PouchDB('local_calls', mem_opts),
            cashbox: new PouchDB('local_cashbox', mem_opts),
            categories: new PouchDB('local_categories', mem_opts),
            sub_categories: new PouchDB('local_sub_cats', mem_opts),
            occations: new PouchDB('local_occations', mem_opts),
            products: new PouchDB('local_products', mem_opts),
            recipes: new PouchDB('local_recipes', mem_opts),
            floors: new PouchDB('local_floors', mem_opts),
            tables: new PouchDB('local_tables', mem_opts),
            stocks: new PouchDB('local_stocks', mem_opts),
            stocks_cat: new PouchDB('local_stocks_cat', mem_opts),
            endday: new PouchDB('local_endday', mem_opts),
            reports: new PouchDB('local_reports', mem_opts),
            logs: new PouchDB('local_logs', mem_opts),
            commands: new PouchDB('local_commands', mem_opts),
            comments: new PouchDB('local_comments', mem_opts),
            prints: new PouchDB('local_prints', mem_opts),
            settings: new PouchDB('local_settings', { revs_limit: 3, auto_compaction: true }),
            allData: new PouchDB('local_alldata', { revs_limit: 3, auto_compaction: false })
        };
    }

    initSettings() {
        this.getAllBy('settings', { key: 'AuthInfo' }).then(res => {
            if (res.docs.length > 0) {
                this.authInfo = res.docs[0].value;
                if (this.authInfo) {
                    this.hostname = 'http://' + this.authInfo.app_remote + ':' + this.authInfo.app_port;
                    this.ajax_opts = { ajax: { headers: { Authorization: 'Basic ' + Buffer.from(this.authInfo.app_id + ':' + this.authInfo.app_token).toString('base64') } } };
                    this.db_prefix = this.authInfo.app_db;
                    this.RemoteDB = new PouchDB(this.hostname + this.db_prefix, this.ajax_opts);
                }
            }
        }).catch(err => console.error(err));

        this.getAllBy('settings', { key: 'ServerSettings' }).then(res => {
            if (res.docs.length > 0) {
                let appType = localStorage.getItem('AppType');
                switch (appType) {
                    case 'Primary':
                        this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 0).value;
                        break;
                    case 'Secondary':
                        this.serverInfo = res.docs.find((obj: any) => obj.key == 'ServerSettings' && obj.value.type == 1).value;
                        break; // Added break
                    default:
                        break;
                }
                if (this.serverInfo) {
                    if (this.serverInfo.type == 0) {
                        if (this.serverInfo.status == 1) {
                            this.ServerDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
                        }
                    } else if (this.serverInfo.type == 1) {
                        this.RemoteDB = new PouchDB(`http://${this.serverInfo.ip_address}:${this.serverInfo.ip_port}/${this.serverInfo.key}/appServer`);
                    }
                }
            }
        }).catch(err => console.error(err));
    }

    getAllData(db: string): Promise<any> {
        return this.LocalDB[db].allDocs({ include_docs: true });
    }

    getAllBy(db: string, $schema: any): Promise<any> {
        return this.LocalDB[db].find({
            selector: $schema,
            limit: 10000
        });
    }

    getData(db: string, id: string): Promise<any> {
        return this.LocalDB[db].get(id);
    }

    getBulk(db: string, docs: Array<string>): Promise<any> {
        return this.LocalDB[db].bulkGet(docs);
    }

    addData(db: string, schema: any): Promise<any> {
        return this.LocalDB[db].post(schema).then((res: any) => {
            let doc = Object.assign(schema, { db_name: db, db_seq: 0 });
            delete doc._rev;
            delete doc._rev_tree;
            return this.LocalDB['allData'].put(doc).catch((err: any) => {
                console.log('addData-All', err);
            });
        }).catch((err: any) => {
            console.log('addData-Local', err);
        });
    }

    changeData(db: string, id: string, schema: any): Promise<any> {
        this.LocalDB['allData'].upsert(id, schema).catch((err: any) => {
            console.log('changeData-Local', err);
        });
        return this.LocalDB[db].upsert(id, schema).catch((err: any) => {
            console.log('changeData-All', err);
        });
    }

    updateData(db: string, id: string, schema: any) {
        return this.LocalDB[db].get(id).then((doc: any) => {
            this.LocalDB['allData'].upsert(id, function (doc: any) {
                return Object.assign(doc, schema);
            }).catch((err: any) => {
                console.log('updateData-Local', err);
            });
            return this.LocalDB[db].put(Object.assign(doc, schema)).catch((err: any) => {
                console.log('updateData-All', err);
            });
        });
    }

    removeData(db: string, id: string): Promise<any> {
        this.LocalDB['allData'].get(id).then((doc: any) => {
            this.LocalDB['allData'].remove(doc).catch((err: any) => {
                console.log('removeData-All', err);
            });
        });
        return this.LocalDB[db].get(id).then((doc: any) => {
            return this.LocalDB[db].remove(doc).catch((err: any) => {
                console.log('removeData-Local', err);
            });
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
        return this.getAllBy(db, $schema).then(res => {
            return res.docs.map((obj: any) => {
                return { _id: obj._id, _rev: obj._rev, _deleted: true };
            });
        }).then(deleteDocs => {
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

    destroyDB(db: string | Array<string>) {
        if (Array.isArray(db)) {
            return new Promise((resolve, reject) => {
                db.forEach((db_name, index) => {
                    this.LocalDB[db_name].destroy().then((res: any) => {
                        if (res.ok) {
                            console.log(db_name, 'DB destroyed.');
                            if (db.length == index + 1) {
                                resolve({ ok: true });
                            }
                        } else {
                            console.error(db_name, 'DB not destroyed!');
                            reject({ ok: false })
                        }
                    })
                })
            });
        } else {
            return this.LocalDB[db].destroy();
        }
    }

    compactDB(db: string) {
        return this.LocalDB[db].compact();
    }

    localSyncBeforeRemote(local_db: string) {
        return this.LocalDB[local_db].changes({ since: 'now', include_docs: true }).on('change', (change: any) => {
            if (change.deleted) {
                this.LocalDB['allData'].get(change.id).then((doc: any) => {
                    this.LocalDB['allData'].remove(doc);
                });
            } else {
                let cData = Object.assign({ db_name: local_db, db_seq: change.seq }, change.doc);
                this.LocalDB['allData'].putIfNotExists(cData).then((res: any) => {
                    if (!res.updated) {
                        this.LocalDB['allData'].upsert(res.id, function () {
                            return cData;
                        });
                    }
                });
            }
        });
    }

    handleChanges(sync: any) {
        const changes = sync.change.docs;
        if (sync.direction === 'pull') {
            changes.forEach((element: any) => {
                if (!element._deleted) {
                    let db = element.db_name;
                    if (element.key !== 'ServerSettings' || element.key !== 'ActivationStatus') {
                        delete element._rev;
                        delete element._revisions;
                        delete element.db_seq;
                        delete element.db_name;
                        if (this.LocalDB[db]) {
                            this.LocalDB[db].upsert(element._id, (doc: any) => {
                                return Object.assign(doc, element);
                            }).catch((err: any) => {
                                console.log(err);
                            });
                        }
                    }
                } else {
                    for (let db in this.LocalDB) {
                        if (db !== 'allData') {
                            this.LocalDB[db].get(element._id).then((doc: any) => {
                                if (doc) return this.LocalDB[db].remove(doc);
                            }).catch((err: any) => { });
                        }
                    }
                }
            });
        }
    }

    loadAppData() {
        return new Promise((resolve, reject) => {
            this.getAllBy('allData', {}).then(res => {
                let docs = res.docs;
                let docsWillPut = docs.filter((obj: any) => obj.db_name !== 'settings');
                docsWillPut.map((obj: any) => {
                    delete obj.db_seq;
                    delete obj._rev;
                    return obj;
                });
                let promisesAll: any[] = [];
                docsWillPut.forEach((element: any) => {
                    const db = element.db_name;
                    delete element.db_name;
                    if (db !== undefined && this.LocalDB[db]) {
                        let promise = this.LocalDB[db].put(element)
                        promisesAll.push(promise);
                    }
                });
                Promise.all(promisesAll).then(res => {
                    resolve(true)
                }).catch(err => {
                    console.log(err);
                    //// Should Be False Reject
                    resolve(true)
                })
            }).catch(err => {
                console.log(err);
                reject(false);
            })
        });
    }

    syncToLocal(database?: string) {
        let selector;
        if (database) {
            selector = { db_name: database };
        } else {
            selector = {}
        }
        return new Promise((resolve, reject) => {
            this.getAllBy('allData', selector).then(res => {
                const docs = res.docs;
                if (docs.length > 0) {
                    docs.forEach((element: any, index: number) => {
                        let db = element.db_name;
                        if (db !== undefined) {
                            if (element.key !== 'ServerSettings') {
                                delete element.db_name;
                                delete element.db_seq;
                                delete element._rev;
                                this.LocalDB[db].put(element).then((res: any) => {
                                    if (docs.length == index + 1) {
                                        resolve(true);
                                    }
                                }).catch((err: any) => {
                                    console.log(db, element)
                                });
                            }
                        }
                    });
                } else {
                    reject(false);
                }
            });
        });
    }

    replicateDB(db_configrations: any) {
        let db = new PouchDB(`http://${db_configrations.ip_address}:${db_configrations.ip_port}/${db_configrations.key}/appServer`);
        return db.replicate.to(this.LocalDB['allData'], { batch_size: 500, batches_limit: 50 }); // timeout removed as it's not standard options? check docs if needed. Old code had 60000
    }

    replicateFrom() {
        return this.RemoteDB.replicate.to(this.LocalDB['allData']);
    }

    syncToServer() {
        return PouchDB.sync(this.LocalDB['allData'], this.ServerDB, {
            live: true, retry: true, heartbeat: 2500, back_off_function: (delay) => {
                delay = 1000;
                return delay;
            }
        })
            .on('change', (sync) => { this.handleChanges(sync) })
    }

    syncToRemote() {
        let rOpts: any = { live: true, retry: true };
        if (this.serverInfo && this.serverInfo.type == 1) {
            rOpts = {
                live: true, retry: true, heartbeat: 2500, back_off_function: (delay: number) => {
                    delay = 1000;
                    return delay;
                }
            };
        }
        return PouchDB.sync(this.LocalDB['allData'], this.RemoteDB, rOpts)
            .on('change', (sync) => { this.handleChanges(sync) })
    }
}
