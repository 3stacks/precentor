import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { homePage, llms, metreName, page, psalmPage, robots, SITE, sitemap } from '../scripts/seo.mjs'

const corpus = (path: string) => JSON.parse(readFileSync(new URL(`../public/corpus/${path}`, import.meta.url), 'utf8'))
const index = corpus('index.json')
const template = readFileSync(new URL('../public/index.html', import.meta.url), 'utf8')
const entry = (key: string) => index.psalms.find((p: { key: string }) => p.key === key)

describe('the pages for crawlers', () => {
  it('uses the domain of the site', () => {
    expect(SITE).toBe('https://precentor.app')
  })

  it('writes a psalm page with its words, tunes and canonical link', () => {
    const i = index.psalms.findIndex((p: { key: string }) => p.key === '023')
    const p = psalmPage(entry('023'), corpus('psalms/023.json'), index.tunes, index.psalms[i - 1], index.psalms[i + 1])
    const html = page(template, p)
    expect(html).toContain('<title>Psalm 23: The LORD’s my shepherd, I’ll not want · Precentor</title>')
    expect(html).toContain('<link rel="canonical" href="https://precentor.app/psalm/023" />')
    expect(html).toContain('<meta property="og:image" content="https://precentor.app/og.png" />')
    expect(html).toContain('He makes me down to lie')
    expect(html).toContain('<strong>Crimond</strong> (the usual tune)')
    expect(html).toContain('href="/psalm/022"')
    expect(html).toContain('href="/psalm/024"')
    expect(html).toContain('"@type":"CreativeWork"')
    expect(html).not.toContain('<div id="root"></div>')
    expect(html.match(/<meta name="description"/g)).toHaveLength(1)
  })

  it('names a second version and keeps its metre', () => {
    const p = psalmPage(entry('006b'), corpus('psalms/006b.json'), index.tunes)
    expect(p.title).toMatch(/^Psalm 6, second version: In thy great indignätion · Precentor$/)
    expect(p.description).toContain('common metre (8.6.8.6)')
  })

  it('lists each psalm on the home page', () => {
    const html = page(template, homePage(index))
    expect(html).toContain('<link rel="canonical" href="https://precentor.app/" />')
    expect(html.match(/href="\/psalm\/\d{3}b?"/g)).toHaveLength(index.psalms.length)
  })

  it('writes the sitemap, robots.txt and llms.txt for the domain', () => {
    const xml = sitemap(['/', '/psalm/023'], '2026-11-13')
    expect(xml).toContain('<loc>https://precentor.app/psalm/023</loc><lastmod>2026-11-13</lastmod>')
    expect(robots()).toContain('Sitemap: https://precentor.app/sitemap.xml')
    expect(llms(index)).toContain('(https://precentor.app/psalm/023)')
  })

  it('spells metre the British way', () => {
    expect(metreName('Common Meter')).toBe('common metre')
    expect(metreName('6.6.6.6 Double')).toBe('6.6.6.6 Double')
  })
})
