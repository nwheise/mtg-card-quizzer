import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Static SPA, no backend. `base: "./"` keeps asset paths relative so the built
// site can be dropped on any static host (GitHub Pages, Netlify, etc.).
export default defineConfig({
  base: "./",
  plugins: [react()],
});
