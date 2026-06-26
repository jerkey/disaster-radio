import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './src/test/e2e',
  timeout: 15000,
  use: {
    baseURL: 'http://localhost:5173',
  },
  webServer: [
    {
      // WebSocket simulator — must start before Vite so the proxy is ready
      command: 'node bin/server.js --settings ../settings.js.example',
      url: 'http://localhost:8000',
      reuseExistingServer: !process.env.CI,
      timeout: 10000,
    },
    {
      command: 'npx vite',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
      timeout: 15000,
    },
  ],
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
})
