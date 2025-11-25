import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run tests sequentially to avoid database file locking issues on Windows
    pool: 'forks',
    // Run test files sequentially
    fileParallelism: false,
  },
})
