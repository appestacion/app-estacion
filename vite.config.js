import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true
  },
  // Le decimos a Vite que la raíz del proyecto es 'public'
  root: 'public',
  // Le decimos a Vite que la carpeta de salida 'dist' debe estar un nivel por encima de la raíz
  build: {
    outDir: '../dist'
  }
});