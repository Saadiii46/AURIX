import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import electron from "vite-plugin-electron";
import renderer from "vite-plugin-electron-renderer";

// https://vite.dev/config/
export default defineConfig({
  base: "./", // Required for Electron file:// loading; absolute paths break
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: "electron/main.ts", // path to your main.ts
        vite: {
          build: {
            outDir: "dist-electron",
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
      {
        // Preload script
        entry: "electron/preload.ts", // path to your preload.ts
        vite: {
          build: {
            outDir: "dist-electron",
            lib: {
              entry: "electron/preload.ts",
              formats: ["cjs"],
            },
            rollupOptions: {
              external: ["electron"],
            },
          },
        },
      },
    ]),

    renderer(),
  ],
});
