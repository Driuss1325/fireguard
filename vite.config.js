import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,            // escucha en 0.0.0.0 para conexiones externas
    port: 5173,
    // Lista de hostnames que pueden acceder al dev server
    allowedHosts: [
      'ec2-54-209-192-44.compute-1.amazonaws.com',
      // agrega aquí otros que uses, por ejemplo:
      // 'mi-dominio.com',
      // 'mi-ip-publica' (si accedes por IP)
    ],
  },
});
