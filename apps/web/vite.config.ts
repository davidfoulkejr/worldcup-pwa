import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Base path for GitHub Pages project site: https://<user>.github.io/worldcup-pwa/
const BASE = process.env.PUBLIC_BASE_PATH ?? "/worldcup-pwa/";

export default defineConfig({
  base: BASE,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.svg",
        "icons/apple-touch-icon.png",
        "icons/icon-192.png",
        "icons/icon-512.png",
        "icons/maskable-512.png",
      ],
      manifest: {
        name: "World Cup 2026",
        short_name: "WC26",
        description:
          "Fast, offline-friendly World Cup 2026 fixtures viewer — sort and filter by city, group, nation, or date.",
        theme_color: "#0f6c3a",
        background_color: "#0a2540",
        display: "standalone",
        orientation: "portrait",
        start_url: BASE,
        scope: BASE,
        icons: [
          {
            src: "icons/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "icons/maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,ico,woff2}"],
        navigateFallback: `${BASE}index.html`,
        runtimeCaching: [
          {
            // Cache the upstream fixtures JSON: serve cached version first,
            // refresh in the background, swap in next visit.
            urlPattern:
              /^https:\/\/raw\.githubusercontent\.com\/openfootball\/worldcup\.json\/.*\.json$/,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "openfootball-json",
              expiration: {
                maxEntries: 4,
                maxAgeSeconds: 60 * 60 * 24 * 30,
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
});
