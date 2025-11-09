import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    host: true
  },
  // Le decimos a Vite dónde están nuestros archivos públicos
  publicDir: 'public' 
});