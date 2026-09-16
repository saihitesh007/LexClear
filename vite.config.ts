import { defineConfig } from "vitest/config";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
  server: { port: 5173 },
  test: {
    environment: "happy-dom",
    exclude: ["e2e/**", "node_modules/**", "dist/**"],
  },
});

