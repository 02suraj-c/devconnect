import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Standard Vite + React setup. VITE_API_URL / VITE_SOCKET_URL are read
// from a local .env file (see .env.example) and from Vercel's project
// environment variables in production.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
