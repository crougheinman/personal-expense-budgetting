import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    global: 'globalThis',
    __dirname: 'undefined',
    __filename: 'undefined',
  },
  optimizeDeps: {
    exclude: ['tesseract.js'],
    include: ['tesseract.js > tesseract.js-core'],
  },
  ssr: {
    noExternal: ['tesseract.js']
  }
});
