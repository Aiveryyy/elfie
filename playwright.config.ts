import path from "node:path";

import { defineConfig } from "@playwright/test";

const isWindows = process.platform === "win32";
const webServerCommand = isWindows
  ? '"C:\\Program Files\\nodejs\\node.exe" .\\node_modules\\next\\dist\\bin\\next dev'
  : "npm run dev";
const outputDir = isWindows
  ? path.join(process.env.TEMP ?? "C:\\Windows\\Temp", "elfie-playwright-artifacts")
  : ".playwright-artifacts";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir,
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  webServer: {
    command: webServerCommand,
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
