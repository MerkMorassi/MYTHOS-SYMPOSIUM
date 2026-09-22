/**
 * js/mythos-db.js adapted for TypeScript
 */

const DB_NAME = 'mythos_vault';
const DB_VERSION = 5;

export class SimpleDB {
  private db: IDBDatabase | null = null;
  public ready: Promise<void>;

  constructor() {
    this.ready = this.init();
  }

  private init(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB not supported'));
        return;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('agents')) {
          db.createObjectStore('agents', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('vectors')) {
          const store = db.createObjectStore('vectors', { keyPath: 'id' });
          store.createIndex('agentId', 'agentId', { unique: false });
        }

        if (!db.objectStoreNames.contains('manifest')) {
          db.createObjectStore('manifest', { keyPath: 'id' }); 
        }
      };

      request.onsuccess = (event: any) => {
        this.db = event.target.result;
        resolve();
      };

      request.onerror = (event: any) => {
        console.error("Database error:", event.target.error);
        reject(event.target.error);
      };
    });
  }
  
  async getAll(storeName: string) {
    await this.ready;
    return new Promise<any[]>((resolve, reject) => {
      if (!this.db) return reject('DB not init');
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  
  async put(storeName: string, data: any) {
    await this.ready;
    return new Promise((resolve, reject) => {
      if (!this.db) return reject('DB not init');
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.put(data);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async clear(storeName: string) {
    await this.ready;
    return new Promise<void>((resolve, reject) => {
      if (!this.db) return reject('DB not init');
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
  
  async getByIndex(storeName: string, indexName: string, value: any) {
      await this.ready;
      return new Promise<any[]>((resolve, reject) => {
          if (!this.db) return reject('DB not init');
          const tx = this.db.transaction(storeName, 'readonly');
          const store = tx.objectStore(storeName);
          const index = store.index(indexName);
          const req = index.getAll(value);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
      });
  }
  
  async get(storeName: string, id: string) {
    await this.ready;
    return new Promise<any>((resolve, reject) => {
      if (!this.db) return reject('DB not init');
      const tx = this.db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(id);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }
  
  async delete(storeName: string, id: string) {
    await this.ready;
    return new Promise<void>((resolve, reject) => {
      if (!this.db) return reject('DB not init');
      const tx = this.db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }
}
