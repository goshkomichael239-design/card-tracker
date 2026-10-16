import { defineConfig } from 'vitest/config'

// Tests of the pure logic (dates, repeats, quick entry, coupon edge, backups,
// the dictionary). They run in plain Node: nothing here needs a browser.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})
