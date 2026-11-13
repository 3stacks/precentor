import type { Page } from '@playwright/test'
import { expect, test } from './fixtures.ts'

const PSALM_23 = 'The LORD’s my shepherd, I’ll not want.'

/** Record each AudioContext that the app makes. A test can then read its state. */
async function watchAudio(page: Page) {
  await page.addInitScript(() => {
    const w = window as unknown as { __audio: AudioContext[]; AudioContext: typeof AudioContext; webkitAudioContext?: typeof AudioContext }
    w.__audio = []
    const Base = w.AudioContext ?? w.webkitAudioContext
    if (!Base) return
    class Watched extends Base {
      constructor(options?: AudioContextOptions) {
        super(options)
        w.__audio.push(this)
      }
    }
    w.AudioContext = Watched
    if (w.webkitAudioContext) w.webkitAudioContext = Watched
  })
}

const audioStates = (page: Page) => page.evaluate(() => (window as unknown as { __audio: AudioContext[] }).__audio.map((a) => a.state))

const tuneButton = (page: Page) => page.getByRole('button', { name: /^Tune: / })

test('the psalm list shows Psalm 23 and opens it', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'The Psalms of David in Metre' })).toBeVisible()
  const row = page.getByText(PSALM_23)
  await expect(row).toBeVisible()
  await row.click()
  await expect(page).toHaveURL(/\/psalm\/023$/)
  await expect(page.getByRole('heading', { name: 'Psalm 23', level: 1 })).toBeVisible()
  await expect(tuneButton(page)).toContainText('Crimond')
})

test('Play starts the audio and lights a syllable', async ({ page }) => {
  await watchAudio(page)
  await page.goto('/psalm/023')
  const play = page.getByRole('button', { name: 'Play', exact: true })
  await expect(play).toBeVisible()
  await play.click()
  await expect(page.getByRole('button', { name: 'Pause', exact: true })).toBeVisible()
  await expect.poll(() => audioStates(page), { message: 'an AudioContext runs' }).toContain('running')
  // The tune plays once through before the first verse. Skip that part.
  await expect(page.getByText('The tune, once through')).toBeVisible()
  await page.getByText('Skip to verse 1').click()
  await expect(page.getByTestId('syllable-now')).toBeVisible({ timeout: 15_000 })
  await expect(page.getByText('Verse 1 of 5')).toBeVisible()
  await page.getByRole('button', { name: 'Pause', exact: true }).click()
})

test('the tune list changes the tune', async ({ page }) => {
  await page.goto('/psalm/023')
  await expect(tuneButton(page)).toContainText('Crimond')
  await tuneButton(page).click()
  await expect(page.getByText('Choose a tune')).toBeVisible()
  await page.getByRole('button', { name: /^Dundee/ }).click()
  await expect(page).toHaveURL(/\/psalm\/023\?tune=dundee$/)
  await expect(tuneButton(page)).toContainText('Dundee')
  await expect(page.getByRole('button', { name: 'Play', exact: true })).toBeVisible()
})

test('the Music view draws the score', async ({ page }) => {
  await page.goto('/psalm/023')
  await page.getByRole('button', { name: 'Music', exact: true }).click()
  await expect(page.locator('.score-svg svg').first()).toBeVisible()
})

test('an old hash link opens the same psalm and tune', async ({ page }) => {
  await page.goto('/#/psalm/023?tune=dundee')
  await expect(page).toHaveURL(/\/psalm\/023\?tune=dundee$/)
  await expect(page.getByRole('heading', { name: 'Psalm 23', level: 1 })).toBeVisible()
  await expect(tuneButton(page)).toContainText('Dundee')
})

test('the About page shows its heading', async ({ page }) => {
  await page.goto('/about')
  await expect(page.getByRole('heading', { name: 'About Precentor', level: 1 })).toBeVisible()
})

test('the Privacy page shows its heading', async ({ page }) => {
  await page.goto('/privacy')
  await expect(page.getByRole('heading', { name: 'Privacy', level: 1 })).toBeVisible()
})
