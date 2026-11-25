import { defineConfig } from "vite";
import { resolve } from "node:path";

// Two pages: the landing page (index.html) and the standalone 3D turntable demo (turntable.html).
export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "index.html"),
        turntable: resolve(__dirname, "turntable.html"),
        v2: resolve(__dirname, "v2.html"),
        v3: resolve(__dirname, "v3.html"),
        industries: resolve(__dirname, "industries.html"),
      },
    },
  },
});
