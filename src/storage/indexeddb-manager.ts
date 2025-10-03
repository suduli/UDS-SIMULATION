// IndexedDB manager with schema migrations and TTL hooks
// Provides centralized database access for all stores

export interface SchemaDefinition {
  version: number;
  stores: StoreDefinition[];
}

export interface StoreDefinition {
  name: string;
  keyPath: string;
  autoIncrement?: boolean;
  indexes?: IndexDefinition[];
}

export interface IndexDefinition {
  name: string;
  keyPath: string | string[];
  unique?: boolean;
}

export interface TTLConfig {
  enabled: boolean;
  fieldName: string;
  maxAgeMs: number;
}

export class IndexedDBManager {
  private db: IDBDatabase | null = null;

  private readonly dbName: string;

  private readonly currentVersion: number;

  private readonly schema: SchemaDefinition;

  constructor(dbName: string, schema: SchemaDefinition) {
    this.dbName = dbName;
    this.schema = schema;
    this.currentVersion = schema.version;
  }

  /**
   * Open database connection with schema migration
   */
  async open(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.currentVersion);

      request.onerror = () => {
        reject(new Error(`Failed to open database: ${request.error?.message}`));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        this.migrateSchema(db, event.oldVersion);
      };
    });
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Add a new record to a store
   */
  async add<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.add(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing record
   */
  async put<T>(storeName: string, data: T): Promise<IDBValidKey> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(data);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a record by key
   */
  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get all records from a store
   */
  async getAll<T>(storeName: string): Promise<T[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete a record by key
   */
  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all records from a store
   */
  async clear(storeName: string): Promise<void> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Query records using an index
   */
  async queryByIndex<T>(
    storeName: string,
    indexName: string,
    query: IDBValidKey | IDBKeyRange,
  ): Promise<T[]> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const index = store.index(indexName);
      const request = index.getAll(query);

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clean up expired records based on TTL
   */
  async cleanupExpired(storeName: string, ttlConfig: TTLConfig): Promise<number> {
    if (!ttlConfig.enabled) {
      return 0;
    }

    const db = this.getDB();
    const expiryThreshold = Date.now() - ttlConfig.maxAgeMs;
    let deletedCount = 0;

    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.openCursor();

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const record = cursor.value;
          const timestamp = new Date(record[ttlConfig.fieldName]).getTime();

          if (timestamp < expiryThreshold) {
            cursor.delete();
            deletedCount += 1;
          }

          cursor.continue();
        } else {
          resolve(deletedCount);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Count records in a store
   */
  async count(storeName: string): Promise<number> {
    const db = this.getDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Migrate database schema
   */
  private migrateSchema(db: IDBDatabase, _oldVersion: number): void {
    this.schema.stores.forEach((storeDef) => {
      // Create store if it doesn't exist
      if (!db.objectStoreNames.contains(storeDef.name)) {
        const store = db.createObjectStore(storeDef.name, {
          keyPath: storeDef.keyPath,
          autoIncrement: storeDef.autoIncrement ?? false,
        });

        // Create indexes
        storeDef.indexes?.forEach((indexDef) => {
          store.createIndex(indexDef.name, indexDef.keyPath, {
            unique: indexDef.unique ?? false,
          });
        });
      }
    });
  }

  /**
   * Get database instance or throw if not open
   */
  private getDB(): IDBDatabase {
    if (!this.db) {
      throw new Error('Database not open. Call open() first.');
    }
    return this.db;
  }
}

/**
 * Default schema for UDS Simulation app
 */
export const DEFAULT_SCHEMA: SchemaDefinition = {
  version: 1,
  stores: [
    {
      name: 'templates',
      keyPath: 'id',
      indexes: [
        { name: 'by_name', keyPath: 'name', unique: false },
        { name: 'by_created', keyPath: 'createdAt', unique: false },
      ],
    },
    {
      name: 'audit_entries',
      keyPath: 'id',
      indexes: [
        { name: 'by_timestamp', keyPath: 'timestamp', unique: false },
        { name: 'by_persona', keyPath: 'userPersona', unique: false },
        { name: 'by_ecu', keyPath: 'ecuId', unique: false },
      ],
    },
    {
      name: 'automation_runs',
      keyPath: 'id',
      indexes: [
        { name: 'by_status', keyPath: 'status', unique: false },
        { name: 'by_scenario', keyPath: 'scenarioId', unique: false },
      ],
    },
    {
      name: 'metrics_events',
      keyPath: 'id',
      indexes: [{ name: 'by_occurred', keyPath: 'occurredAt', unique: false }],
    },
    {
      name: 'security_sessions',
      keyPath: 'sessionId',
      indexes: [
        { name: 'by_ecu', keyPath: 'ecuId', unique: false },
        { name: 'by_expires', keyPath: 'expiresAt', unique: false },
      ],
    },
  ],
};
