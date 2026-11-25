import { defineConfig } from '@playwright/test';

const port = 4179;

export default defineConfig({
  testDir: 'test/e2e',
  use: { baseURL: `http://localhost:${port}/` },
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}/`,
    reuseExistingServer: false,
  },
});
