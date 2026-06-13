import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: null,
      filename: "sw.js",
      devOptions: { enabled: false },
      includeAssets: [
        "icon.png",
        "apple-touch-icon.png",
        "favicon.ico",
        "robots.txt",
      ],
      manifest: {
        name: "Stackd Finance",
        short_name: "Stackd",
        description: "Don't just track, grow your finances",
        theme_color: "#C89B2A",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          { src: "/icon.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
          { src: "/icon.png", sizes: "384x384", type: "image/png", purpose: "any maskable" },
          { src: "/icon.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "/apple-touch-icon.png", sizes: "180x180", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/~oauth/, /^\/api\//],
        globPatterns: ["**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}"],
        runtimeCaching: [
          {
            // HTML navigations: always try network first, fall back to cached shell when offline
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: {
              cacheName: "html-pages",
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:js|css|woff2?)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "static-assets",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/.test(url.pathname),
            handler: "CacheFirst",
            options: {
              cacheName: "images",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
