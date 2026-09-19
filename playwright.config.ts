import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:4175" },
  webServer: {
    command: "npm run build && npm run preview -- --port 4175 --host 127.0.0.1",
    port: 4175,
    reuseExistingServer: !process.env.CI,
  },

});
