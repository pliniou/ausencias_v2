/* eslint-disable @typescript-eslint/no-explicit-any */
declare module 'sql.js' {
    export interface Database {
        run(sql: string, params?: any[]): void;
        prepare(sql: string, params?: any[]): Statement;
        export(): Uint8Array;
        close(): void;
    }

    export interface Statement {
        bind(params?: any[]): boolean;
        step(): boolean;
        get(params?: any[]): any[];
        getColumnNames(): string[];
        getAsObject(params?: any[]): { [key: string]: any };
        run(params?: any[]): void;
        free(): boolean;
    }

    export interface SqlJsStatic {
        Database: {
            new(data?: Uint8Array): Database;
        };
    }

    export interface SqlJsConfig {
        locateFile?: (file: string) => string;
        wasmBinary?: ArrayBuffer;
    }

    export default function initSqlJs(config?: SqlJsConfig): Promise<SqlJsStatic>;
}
