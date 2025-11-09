import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true
  },
  // Le decimos a Vite que la carpeta 'public' es ahora la raíz del proyecto
  root: 'public' 
});