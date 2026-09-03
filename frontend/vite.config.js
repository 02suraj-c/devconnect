/**
 * Vite Config
 *
 * - React plugin for JSX/Fast Refresh.
 * - Dev server proxy forwards /api and /socket.io requests to the
 *   backend so we avoid CORS issues during local development.
 *   In production, the frontend hits the backend directly via
 *   VITE_API_URL / VITE_SOCKET_URL env vars.
 */

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true, // proxy WebSocket upgrades too
      },
    },
  },
});
