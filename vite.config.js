import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: "autoUpdate",

      includeAssets: [
        "favicon.ico",
        "pwa-192x192.png",
        "pwa-512x512.png",
      ],

      manifest: {
        name: "Draft Weekend",
        short_name: "Draft Weekend",
        description:
          "Live standings, games, players, and statistics for Draft Weekend.",

        theme_color: "#0d1117",
        background_color: "#0d1117",

        display: "standalone",

        start_url: "/",
        scope: "/",

        orientation: "portrait",

        icons: [
          {
            src: "/pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "/pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },

      workbox: {
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});