import { expect, test as base } from '@playwright/test'

// Analytics exists only on Cloudflare. The test server sends 404 for /a/boot.js.
const EXPECTED = ['/a/boot.js']

/** Each test fails on a console error or a page error, except the expected 404. */
export const test = base.extend<{ consoleErrors: string[] }>({
  consoleErrors: [
    async ({ page }, use) => {
      const errors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() !== 'error') return
        const where = msg.location().url ?? ''
        if (EXPECTED.some((p) => where.includes(p) || msg.text().includes(p))) return
        errors.push(`${msg.text()} (${where})`)
      })
      page.on('pageerror', (err) => errors.push(`Page error: ${err.message}`))
      await use(errors)
      expect(errors, 'console errors').toEqual([])
    },
    { auto: true },
  ],
})

export { expect }
