import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const PHP_URL = process.env.PHP_URL ?? "http://localhost:8090";

// O build e gerado dentro de /public (que vira o public_html na Hostinger).
// Em dev, o Vite faz proxy das rotas internas (/data, /uploads) para o PHP.
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "public",
    emptyOutDir: false,
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    proxy: {
      "/data": { target: PHP_URL, changeOrigin: false },
      "/uploads": { target: PHP_URL, changeOrigin: false },
    },
  },
});
