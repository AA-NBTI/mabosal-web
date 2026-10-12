import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-client',
    emptyOutDir: true,
    target: 'es2022',
    minify: false,
    sourcemap: false,
  },
});
