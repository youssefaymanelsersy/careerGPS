import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: {
    allowedHosts: true,
    host: true
  },
  resolve: {
    alias: {
      "react-dom/server": "react-dom/server.node",
      "react-dom/server.bun.js": "react-dom/server.node",
    }
  }
});
