import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: { global: 'globalThis' },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      util: 'util',
      crypto: path.resolve(__dirname, 'src/crypto-shim.ts'),
      stream: 'stream-browserify',
      events: 'events',
    },
  },
  plugins: [
    react(),
    wasm(),
    // ZK assets (prover/verifier keys + ZKIR) are served from /contract/cft-demo.
    viteStaticCopy({
      targets: [
        { src: path.resolve(__dirname, '..', 'contract', 'src', 'managed', 'cft-demo') + '/*', dest: 'contract/cft-demo' },
        { src: path.resolve(__dirname, '..', 'contract', 'src', 'managed', 'cft-note') + '/*', dest: 'contract/cft-note' },
      ],
    }),
  ],
  optimizeDeps: {
    include: ['level', 'browser-level', 'abstract-level', 'level-supports', 'level-transcoder'],
    esbuildOptions: { target: 'esnext' },
  },
  build: { target: 'esnext' },
  worker: { format: 'es' },
  assetsInclude: ['**/*.wasm'],
  server: {
    port: 5174,
    fs: { allow: ['..'] },
    proxy: {
      // Standalone network only (public networks are called directly).
      '/prove': { target: 'http://127.0.0.1:6300', changeOrigin: true },
      '/check': { target: 'http://127.0.0.1:6300', changeOrigin: true },
      '/version': { target: 'http://127.0.0.1:6300', changeOrigin: true },
      '/api/v4': { target: 'http://127.0.0.1:8088', changeOrigin: true },
    },
  },
});
