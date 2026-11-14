import { defineConfig } from 'vitest/config'

// Unit tests for the frontend's pure logic (such as the Board's geometry,
// edits and animation). Kept apart from vite.config.ts, whose Ruby plugin
// expects a Rails app around it. Tests import by relative path.
export default defineConfig({
  test: {
    include: ['app/frontend/**/*.test.ts'],
    environment: 'node',
  },
})
