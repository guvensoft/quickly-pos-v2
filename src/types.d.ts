declare module 'pouch-resolve-conflicts' {
    const plugin: any;
    export = plugin;
}
declare module 'pouchdb-upsert' {
    const plugin: any;
    export = plugin;
}
declare module 'pouchdb-replication-stream' {
    const plugin: any;
    export = plugin;
}

declare namespace PouchDB {
  interface Database<Content extends {}> {
    resolveConflicts(doc: any, resolver: (a: any, b: any) => any): Promise<any>;
  }
}
