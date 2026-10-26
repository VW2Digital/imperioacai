import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { devMockPlugin } from "./src/devMockPlugin";

const USE_REAL_BACKEND = Boolean(process.env.PHP_URL);
const PHP_URL = process.env.PHP_URL ?? "http://localhost:8090";

// O build e gerado dentro de /public (que vira o public_html na Hostinger).
// Em dev local, o devMockPlugin responde as rotas /data sem depender do Docker/PHP.
export default defineConfig({
  plugins: [react(), ...(!USE_REAL_BACKEND ? [devMockPlugin()] : [])],
  build: {
    outDir: "public",
    emptyOutDir: false,
    assetsDir: "assets",
  },
  server: {
    port: 5173,
    ...(USE_REAL_BACKEND
      ? {
          proxy: {
            "/data": { target: PHP_URL, changeOrigin: false },
            "/uploads": { target: PHP_URL, changeOrigin: false },
          },
        }
      : {}),
  },
});
