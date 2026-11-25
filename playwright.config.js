import { defineConfig } from '@playwright/test';

const PORT = 4179;

export default defineConfig({
  testDir: 'test/e2e',
  use: { baseURL: `http://localhost:${PORT}/` },
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
  },
});
