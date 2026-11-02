import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "prompt",
      injectRegister: null,
      workbox: { clientsClaim: true },
      includeAssets: ["icons/*.png"],
      manifest: {
        name: "PRGRSS — Трекер тренувань",
        short_name: "PRGRSS",
        description: "Трекер тренувань і прогресу",
        start_url: "/",
        scope: "/",
        lang: "uk",
        display: "standalone",
        background_color: "#fafafa",
        theme_color: "#fafafa",
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
    }),
  ],
  server: {
    port: 3000,
  },
});
