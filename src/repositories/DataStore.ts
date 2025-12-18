/**
 * DataStore - Camada unificada de persistência usando IndexedDB
 * Substitui o uso direto de localStorage para melhor performance e suporte a dados binários
 */

const DB_NAME = 'AusenciasDB';
const DB_VERSION = 1;

// Definição dos stores
export const STORES = {
    EMPLOYEES: 'employees',
    LEAVES: 'leaves',
    HOLIDAYS: 'holidays',
    EVENTS: 'events',
    USERS: 'users',
    SESSION: 'session',
    ROLES: 'roles',
    DEPARTMENTS: 'departments',
} as const;

type StoreName = typeof STORES[keyof typeof STORES];

class DataStore {
    private db: IDBDatabase | null;
    private initPromise: Promise<IDBDatabase> | null;

    constructor() {
        this.db = null;
        this.initPromise = null;
    }

    /**
     * Inicializa o IndexedDB
     * @returns {Promise<IDBDatabase>}
     */
    async init(): Promise<IDBDatabase> {
        if (this.db) return this.db;
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Erro ao abrir IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado com sucesso');
                resolve(this.db);
            };

            request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Criar object stores se não existirem
                Object.values(STORES).forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const objectStore = db.createObjectStore(storeName, { keyPath: 'id' });
                        objectStore.createIndex('id', 'id', { unique: true });
                        console.log(`Created object store: ${storeName}`);
                    }
                });
            };
        });

        return this.initPromise;
    }

    /**
     * Obtém um item por ID
     * @param {string} storeName - Nome do store
     * @param {string} key - Chave do item
     * @returns {Promise<any>}
     */
    async get(storeName: StoreName, key: string): Promise<unknown> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);

            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Obtém todos os itens de um store
     * @param {string} storeName - Nome do store
     * @returns {Promise<Array>}
     */
    async getAll(storeName: StoreName): Promise<unknown[]> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Salva um item (adiciona ou atualiza)
     * @param {string} storeName - Nome do store
     * @param {unknown} data - Dados a salvar (deve ter propriedade 'id')
     * @returns {Promise<void>}
     */
    async set(storeName: StoreName, data: unknown): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Salva múltiplos itens de uma vez
     * @param {string} storeName - Nome do store
     * @param {Array} items - Array de itens a salvar
     * @returns {Promise<void>}
     */
    async setAll(storeName: StoreName, items: unknown[]): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            items.forEach(item => {
                store.put(item);
            });

            transaction.oncomplete = () => resolve();
            transaction.onerror = (event) => reject(transaction.error || (event.target as IDBRequest).error);
        });
    }

    /**
     * Deleta um item
     * @param {string} storeName - Nome do store
     * @param {string} key - Chave do item
     * @returns {Promise<void>}
     */
    async delete(storeName: StoreName, key: string | number): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Limpa todos os itens de um store
     * @param {string} storeName - Nome do store
     * @returns {Promise<void>}
     */
    async clear(storeName: StoreName): Promise<void> {
        await this.init();
        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }

    /**
     * Migra dados antigos do localStorage para IndexedDB
     * Executa apenas uma vez
     * @returns {Promise<void>}
     */
    async migrate(): Promise<void> {
        const migrationFlag = 'data_migrated_to_indexeddb';

        // Verificar se já foi migrado
        if (localStorage.getItem(migrationFlag) === 'true') {
            console.log('✅ Dados já foram migrados anteriormente');
            return;
        }

        console.log('🔄 Iniciando migração de localStorage para IndexedDB...');
        await this.init();

        const migrations = [
            { key: 'employees', store: STORES.EMPLOYEES },
            { key: 'leaves', store: STORES.LEAVES },
            { key: 'holidays', store: STORES.HOLIDAYS },
            { key: 'companyEvents', store: STORES.EVENTS },
        ];

        let migratedCount = 0;

        for (const { key, store } of migrations) {
            const data = localStorage.getItem(key);
            if (data) {
                try {
                    const items = JSON.parse(data);
                    if (Array.isArray(items) && items.length > 0) {
                        await this.setAll(store as StoreName, items);
                        migratedCount += items.length;
                        console.log(`✅ Migrados ${items.length} itens de '${key}' para '${store}'`);

                        // Opcional: remover do localStorage após migração
                        // localStorage.removeItem(key);
                    }
                } catch (error) {
                    console.error(`Erro ao migrar ${key}:`, error);
                }
            }
        }

        // Marcar migração como completa
        localStorage.setItem(migrationFlag, 'true');
        console.log(`✅ Migração concluída! Total de ${migratedCount} itens migrados.`);
    }
}

// Exportar instância singleton
export const dataStore = new DataStore();
