declare module 'sql.js' {
    export interface Database {
        run(sql: string, params?: any[]): void;
        exec(sql: string, params?: any[]): QueryExecResult[];
        export(): Uint8Array;
        close(): void;
    }

    export interface QueryExecResult {
        columns: string[];
        values: any[][];
    }

    export interface SqlJsStatic {
        Database: new (data?: ArrayLike<number> | Buffer | null) => Database;
    }

    function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
    export default initSqlJs;
    export { Database as SqlJsDatabase };
}
