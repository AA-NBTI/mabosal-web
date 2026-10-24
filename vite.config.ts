import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    target: 'es2022',
    minify: false,
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        fortuneToday: resolve(__dirname, 'fortune/today/index.html'),
        fortuneZodiac: resolve(__dirname, 'fortune/zodiac/index.html'),
        fortuneSonFree: resolve(__dirname, 'fortune/son-free/index.html'),
        today: resolve(__dirname, 'today.html'),
        ddi: resolve(__dirname, 'ddi.html'),
        sonFree: resolve(__dirname, 'son-free.html'),
      },
    },
  },
});
