import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/",
  server: {
    fs: {
      strict: false,
    },
    watch: {
      usePolling: true,
    },
  },
  // 👇 This is the key: Vite will handle SPA routing automatically
  build: {
    rollupOptions: {
      output: {},
    },
  },
});
