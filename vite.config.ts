import { resolve } from "node:path";
import { copyFileSync } from "node:fs";
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src/background/index.ts"),
        options: resolve(__dirname, "public/options.html"),
        popup: resolve(__dirname, "public/popup.html")
      },
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]"
      }
    }
  },
  plugins: [
    {
      name: "copy-extension-pages-to-root",
      closeBundle() {
        copyFileSync(resolve(__dirname, "dist/public/options.html"), resolve(__dirname, "dist/options.html"));
        copyFileSync(resolve(__dirname, "dist/public/popup.html"), resolve(__dirname, "dist/popup.html"));
      }
    }
  ],
  publicDir: "public"
});

