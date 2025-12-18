/**
 * Backup Utilities for Admin
 * Provides complete data backup functionality:
 * - Manual backup (download .zip)
 * - Daily auto-backup with File System Access API (where supported)
 */
import JSZip from 'jszip';
import { dataStore, STORES } from '@/repositories/DataStore';

// Storage keys
const BACKUP_SETTINGS_KEY = 'backup_settings';
const LAST_BACKUP_KEY = 'last_daily_backup';
const FS_HANDLE_KEY = 'backup_directory_handle';

// Types
interface BackupSettings {
    dailyBackupEnabled: boolean;
    lastBackup: string | null;
}

interface BackupMeta {
    version: string;
    createdAt: string;
    appName: string;
    stores: string[];
}

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
    return 'showDirectoryPicker' in window;
}

/**
 * Get backup settings from localStorage
 */
export function getBackupSettings(): BackupSettings {
    const stored = localStorage.getItem(BACKUP_SETTINGS_KEY);
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            // Invalid JSON, return defaults
        }
    }
    return {
        dailyBackupEnabled: false,
        lastBackup: null
    };
}

/**
 * Save backup settings to localStorage
 */
export function saveBackupSettings(settings: BackupSettings): void {
    localStorage.setItem(BACKUP_SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Get last daily backup timestamp
 */
export function getLastDailyBackup(): Date | null {
    const timestamp = localStorage.getItem(LAST_BACKUP_KEY);
    return timestamp ? new Date(timestamp) : null;
}

/**
 * Set last daily backup timestamp
 */
function setLastDailyBackup(): void {
    localStorage.setItem(LAST_BACKUP_KEY, new Date().toISOString());
}

/**
 * Collect all application data from IndexedDB
 */
async function collectAppData(): Promise<Record<string, unknown[]>> {
    const data: Record<string, unknown[]> = {};

    const storesToBackup = [
        STORES.EMPLOYEES,
        STORES.LEAVES,
        STORES.HOLIDAYS,
        STORES.EVENTS,
    ];

    for (const storeName of storesToBackup) {
        try {
            const items = await dataStore.getAll(storeName);
            data[storeName] = items;
        } catch (error) {
            console.error(`Error backing up store ${storeName}:`, error);
            data[storeName] = [];
        }
    }

    return data;
}

/**
 * Get SQLite database as base64 string
 */
function getSqliteData(): string | null {
    try {
        const savedDb = localStorage.getItem('sqlite_db_dump');
        return savedDb;
    } catch (error) {
        console.error('Error getting SQLite data:', error);
        return null;
    }
}

/**
 * Generate a backup ZIP file containing all app data
 */
export async function generateBackupZip(): Promise<Blob> {
    const zip = new JSZip();

    // 1. Collect and add app data (IndexedDB)
    const appData = await collectAppData();
    zip.file('app-data.json', JSON.stringify(appData, null, 2));

    // 2. Add SQLite users database
    const sqliteData = getSqliteData();
    if (sqliteData) {
        zip.file('users-db.json', sqliteData);
    }

    // 3. Add metadata
    const meta: BackupMeta = {
        version: '1.0.0',
        createdAt: new Date().toISOString(),
        appName: 'Project_Ausencias',
        stores: Object.keys(appData)
    };
    zip.file('meta.json', JSON.stringify(meta, null, 2));

    // Generate the ZIP file
    const blob = await zip.generateAsync({
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 }
    });

    return blob;
}

/**
 * Download backup ZIP file manually
 */
export async function downloadBackup(): Promise<void> {
    const blob = await generateBackupZip();

    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().split('T')[0];

    link.href = url;
    link.download = `Project_Ausencias_backup_${dateStr}.zip`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Update last backup time
    const settings = getBackupSettings();
    settings.lastBackup = new Date().toISOString();
    saveBackupSettings(settings);
}

/**
 * Store directory handle in IndexedDB for File System Access API
 */
async function storeDirectoryHandle(handle: FileSystemDirectoryHandle): Promise<void> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BackupHandles', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };

        request.onsuccess = () => {
            const dbInstance = request.result;
            const tx = dbInstance.transaction('handles', 'readwrite');
            const store = tx.objectStore('handles');
            store.put(handle, FS_HANDLE_KEY);
            tx.oncomplete = () => resolve();
            tx.onerror = () => reject(tx.error);
        };

        request.onerror = () => reject(request.error);
    });
}

/**
 * Get stored directory handle from IndexedDB
 */
async function getStoredDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    return new Promise((resolve) => {
        const request = indexedDB.open('BackupHandles', 1);

        request.onupgradeneeded = (event) => {
            const db = (event.target as IDBOpenDBRequest).result;
            if (!db.objectStoreNames.contains('handles')) {
                db.createObjectStore('handles');
            }
        };

        request.onsuccess = () => {
            const dbInstance = request.result;
            const tx = dbInstance.transaction('handles', 'readonly');
            const store = tx.objectStore('handles');
            const getReq = store.get(FS_HANDLE_KEY);
            getReq.onsuccess = () => resolve(getReq.result || null);
            getReq.onerror = () => resolve(null);
        };

        request.onerror = () => resolve(null);
    });
}

/**
 * Request user to choose a backup directory
 */
export async function chooseBackupDirectory(): Promise<boolean> {
    if (!isFileSystemAccessSupported()) {
        return false;
    }

    try {
        // @ts-expect-error - showDirectoryPicker may not be in TS types
        const handle = await window.showDirectoryPicker({
            mode: 'readwrite',
            startIn: 'downloads'
        });

        await storeDirectoryHandle(handle);
        return true;
    } catch (error) {
        // User cancelled or error
        console.error('Error choosing directory:', error);
        return false;
    }
}

/**
 * Check if we have a valid stored directory handle
 */
export async function hasBackupDirectory(): Promise<boolean> {
    const handle = await getStoredDirectoryHandle();
    if (!handle) return false;

    try {
        // Verify permission (using type assertion for older TS)
        const permission = await (handle as unknown as { queryPermission: (options: { mode: string }) => Promise<string> }).queryPermission({ mode: 'readwrite' });
        return permission === 'granted';
    } catch {
        return false;
    }
}

/**
 * Save backup to the chosen directory (replaces existing file)
 */
async function saveToDirectory(): Promise<boolean> {
    const handle = await getStoredDirectoryHandle();
    if (!handle) return false;

    try {
        // Check/request permission
        // @ts-expect-error - requestPermission may not be in TS types
        const permission = await handle.requestPermission({ mode: 'readwrite' });
        if (permission !== 'granted') {
            return false;
        }

        // Generate backup
        const blob = await generateBackupZip();

        // Create/overwrite file
        const fileHandle = await handle.getFileHandle('Project_Ausencias_backup.zip', { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();

        setLastDailyBackup();
        return true;
    } catch (error) {
        console.error('Error saving to directory:', error);
        return false;
    }
}

/**
 * Check if daily backup is due (24h since last backup)
 */
function isDailyBackupDue(): boolean {
    const lastBackup = getLastDailyBackup();
    if (!lastBackup) return true;

    const hoursSinceBackup = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60);
    return hoursSinceBackup >= 24;
}

/**
 * Run daily backup if enabled and due
 * Should be called on app startup
 */
export async function checkAndRunDailyBackup(): Promise<{ ran: boolean; success: boolean; message: string }> {
    const settings = getBackupSettings();

    if (!settings.dailyBackupEnabled) {
        return { ran: false, success: false, message: 'Backup diário desativado' };
    }

    if (!isDailyBackupDue()) {
        return { ran: false, success: false, message: 'Backup ainda não é necessário' };
    }

    if (!isFileSystemAccessSupported()) {
        return { ran: false, success: false, message: 'API de acesso a arquivos não suportada' };
    }

    const hasDir = await hasBackupDirectory();
    if (!hasDir) {
        return { ran: false, success: false, message: 'Pasta de backup não configurada' };
    }

    const success = await saveToDirectory();
    if (success) {
        const newSettings = { ...settings, lastBackup: new Date().toISOString() };
        saveBackupSettings(newSettings);
        return { ran: true, success: true, message: 'Backup diário realizado com sucesso!' };
    }

    return { ran: true, success: false, message: 'Falha ao realizar backup automático' };
}

/**
 * Toggle daily backup setting
 */
export function toggleDailyBackup(enabled: boolean): void {
    const settings = getBackupSettings();
    settings.dailyBackupEnabled = enabled;
    saveBackupSettings(settings);
}

/**
 * Format date for display
 */
export function formatBackupDate(dateStr: string | null): string {
    if (!dateStr) return 'Nunca';
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

// ============================================
// RESTORE / IMPORT FUNCTIONS
// ============================================

export interface RestoreResult {
    success: boolean;
    message: string;
    details: {
        meta?: BackupMeta;
        employeesCount?: number;
        leavesCount?: number;
        holidaysCount?: number;
        eventsCount?: number;
        usersRestored?: boolean;
    };
}

/**
 * Validate backup ZIP file structure
 */
async function validateBackupZip(zip: JSZip): Promise<{ valid: boolean; error?: string; meta?: BackupMeta }> {
    // Check for required files
    const requiredFiles = ['app-data.json', 'meta.json'];

    for (const file of requiredFiles) {
        if (!zip.file(file)) {
            return { valid: false, error: `Arquivo obrigatório não encontrado: ${file}` };
        }
    }

    // Parse and validate meta.json
    try {
        const metaContent = await zip.file('meta.json')!.async('string');
        const meta = JSON.parse(metaContent) as BackupMeta;

        if (!meta.appName || meta.appName !== 'Project_Ausencias') {
            return { valid: false, error: 'Arquivo de backup não é do sistema Project_Ausencias' };
        }

        if (!meta.version || !meta.createdAt) {
            return { valid: false, error: 'Metadados do backup inválidos' };
        }

        return { valid: true, meta };
    } catch {
        return { valid: false, error: 'Erro ao ler metadados do backup' };
    }
}

/**
 * Restore app data from backup to IndexedDB
 */
async function restoreAppData(appDataJson: string): Promise<{
    success: boolean;
    counts: Record<string, number>;
    error?: string;
}> {
    try {
        const appData = JSON.parse(appDataJson) as Record<string, unknown[]>;
        const counts: Record<string, number> = {};

        const storeMapping: Record<string, string> = {
            employees: STORES.EMPLOYEES,
            leaves: STORES.LEAVES,
            holidays: STORES.HOLIDAYS,
            events: STORES.EVENTS,
        };

        for (const [key, items] of Object.entries(appData)) {
            const storeName = storeMapping[key] || key;

            if (Array.isArray(items) && items.length > 0) {
                // Clear existing data in this store
                await dataStore.clear(storeName as typeof STORES.EMPLOYEES);

                // Restore items
                await dataStore.setAll(storeName as typeof STORES.EMPLOYEES, items);
                counts[key] = items.length;
            } else {
                counts[key] = 0;
            }
        }

        return { success: true, counts };
    } catch (error) {
        console.error('Error restoring app data:', error);
        return {
            success: false,
            counts: {},
            error: error instanceof Error ? error.message : 'Erro ao restaurar dados'
        };
    }
}

/**
 * Restore SQLite users database from backup
 */
function restoreSqliteData(usersDbJson: string): boolean {
    try {
        // Validate that it's valid JSON (array of numbers = Uint8Array serialized)
        const parsed = JSON.parse(usersDbJson);

        if (!Array.isArray(parsed)) {
            console.error('Invalid SQLite data format: not an array');
            return false;
        }

        // Save to localStorage (will be loaded on next page refresh)
        localStorage.setItem('sqlite_db_dump', usersDbJson);

        return true;
    } catch (error) {
        console.error('Error restoring SQLite data:', error);
        return false;
    }
}

/**
 * Open file picker dialog for selecting backup file
 */
export async function selectBackupFile(): Promise<File | null> {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';

        input.onchange = (event) => {
            const files = (event.target as HTMLInputElement).files;
            if (files && files.length > 0) {
                resolve(files[0]);
            } else {
                resolve(null);
            }
        };

        input.oncancel = () => resolve(null);

        input.click();
    });
}

/**
 * Restore data from a backup ZIP file
 * @param file - The backup ZIP file
 * @returns RestoreResult with details of the restoration
 */
export async function restoreFromBackup(file: File): Promise<RestoreResult> {
    try {
        // Read and parse ZIP file
        const zip = await JSZip.loadAsync(file);

        // Validate backup structure
        const validation = await validateBackupZip(zip);
        if (!validation.valid) {
            return {
                success: false,
                message: validation.error || 'Backup inválido',
                details: {}
            };
        }

        const details: RestoreResult['details'] = {
            meta: validation.meta
        };

        // 1. Restore app data (IndexedDB)
        const appDataFile = zip.file('app-data.json');
        if (appDataFile) {
            const appDataJson = await appDataFile.async('string');
            const appResult = await restoreAppData(appDataJson);

            if (!appResult.success) {
                return {
                    success: false,
                    message: appResult.error || 'Erro ao restaurar dados do aplicativo',
                    details
                };
            }

            details.employeesCount = appResult.counts.employees || 0;
            details.leavesCount = appResult.counts.leaves || 0;
            details.holidaysCount = appResult.counts.holidays || 0;
            details.eventsCount = appResult.counts.events || 0;
        }

        // 2. Restore SQLite users database (if present)
        const usersDbFile = zip.file('users-db.json');
        if (usersDbFile) {
            const usersDbJson = await usersDbFile.async('string');
            details.usersRestored = restoreSqliteData(usersDbJson);
        } else {
            details.usersRestored = false;
        }

        return {
            success: true,
            message: 'Backup restaurado com sucesso! Recarregando página...',
            details
        };
    } catch (error) {
        console.error('Error restoring backup:', error);
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erro desconhecido ao restaurar backup',
            details: {}
        };
    }
}

/**
 * Full restore process: select file + restore + reload
 */
export async function importBackup(): Promise<RestoreResult> {
    const file = await selectBackupFile();

    if (!file) {
        return {
            success: false,
            message: 'Nenhum arquivo selecionado',
            details: {}
        };
    }

    if (!file.name.endsWith('.zip')) {
        return {
            success: false,
            message: 'Por favor, selecione um arquivo .zip válido',
            details: {}
        };
    }

    const result = await restoreFromBackup(file);

    if (result.success) {
        // The page needs to reload for SQLite changes to take effect
        // We'll return success and let the UI handle the reload after showing a message
    }

    return result;
}