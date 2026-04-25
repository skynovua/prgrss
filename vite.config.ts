import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      registerType: "autoUpdate",
      includeAssets: ["icons/*.png", "splash/*.png"],
      srcDir: "src",
      filename: "sw.ts",
      manifest: {
        name: "PRGRSS — Трекер тренувань",
        short_name: "PRGRSS",
        description: "Офлайн-трекер тренувань у залі",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#0a0a0a",
        theme_color: "#0a0a0a",
        orientation: "portrait",
        categories: ["fitness", "health"],
        icons: [
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "/icons/icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      injectManifest: {
        rollupFormat: "es",
      },
      devOptions: {
        enabled: true,
        type: "module",
        navigateFallback: "/index.html",
      },
    }),
  ],
  server: {
    port: 3000,
  },
});
