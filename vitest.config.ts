import { defineConfig } from 'vitest/config'

// The tests cover the engine, the music, the routes and the analytics. They do not load React Native.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
})
