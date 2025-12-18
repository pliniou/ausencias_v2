import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Plugin to copy sql-wasm.wasm to dist automatically
const copySqlWasm = () => ({
    name: 'copy-sql-wasm',
    writeBundle() {
        const src = path.resolve(__dirname, 'node_modules/sql.js/dist/sql-wasm.wasm');
        const dest = path.resolve(__dirname, 'dist/sql-wasm.wasm');
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log('✅ Copied sql-wasm.wasm to dist/');
        }
    }
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
    base: '/ausencias_v2/',
    server: {
        host: "::",
        port: 8080,
    },
    plugins: [react(), copySqlWasm()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    build: {
        rollupOptions: {
            input: {
                main: path.resolve(__dirname, 'index.html'),
            },
        },
    },
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: './src/test/setup.ts',
    }
}));
