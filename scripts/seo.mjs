// Pages for search engines and AI answer engines, after "expo export --platform web".
//
//   node scripts/seo.mjs [dist]
//
// The web app is one page: JavaScript draws each psalm. A crawler that does not
// run JavaScript sees an empty page. This script writes:
//
// 1. psalm/NNN.html for each psalm. Cloudflare Pages serves it for /psalm/NNN.
//    It has the title, the description, a canonical link, Open Graph tags and
//    JSON-LD of that psalm, and the words of the psalm as plain HTML inside
//    #root. The app replaces that HTML when it starts.
// 2. index.html: the same for the home page, with a link to each psalm.
// 3. about.html and privacy.html: a title and a canonical link.
// 4. sitemap.xml, robots.txt and llms.txt.
//
// SITE_URL sets the domain of the links. It is https://precentor.app by default.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export const SITE = (process.env.SITE_URL ?? 'https://precentor.app').replace(/\/+$/, '')
const NAME = 'Precentor'
const BOOK = 'The Psalms of David in Metre'
const SOURCE = 'https://github.com/kadencartwright/open-1650'
const HADDINGTON = 'https://haddingtonbible.org'
const HEARERS = 'https://hearers.app/app/'
const PDM = 'https://creativecommons.org/publicdomain/mark/1.0/'
const DESCRIPTION = 'Sing the 1650 Scottish Psalter. Every psalm, a choice of tunes, and a player that shows each syllable as you sing.'
const STYLE = 'overflow:auto;height:100%;width:100%;box-sizing:border-box;padding:16px;max-width:760px;margin:0 auto;font:17px/1.6 system-ui,sans-serif'

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** "Common Meter" → "common metre". The app spells it the British way. */
export const metreName = (name) => name.replace(/Meter/g, 'Metre').replace(/^(Common|Long|Short) Metre$/, (m) => m.toLowerCase())

/** "Psalm 6 · second version" → "Psalm 6, second version". */
const plainTitle = (title) => title.replace(' · ', ', ')

const tuneLabel = (t) => (t.alternateTitle ? `${t.title} (${t.alternateTitle})` : t.title)

/**
 * The page: the template with this head and this body.
 * @param {string} template
 * @param {{ path: string, title: string, description: string, image?: string, jsonld?: object, body?: string }} p
 */
export function page(template, { path, title, description, image, jsonld, body }) {
  const url = SITE + path
  const head = [
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${NAME}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(SITE + (image ?? '/og.png'))}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, '\\u003c')}</script>` : '',
  ]
    .filter(Boolean)
    .join('\n    ')
  let html = template
    .replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${esc(description)}" />`)
    .replace('</head>', `    ${head}\n  </head>`)
  if (body) html = html.replace('<div id="root"></div>', `<div id="root"><main id="seo" style="${STYLE}">${body}</main></div>`)
  return html
}

const link = (href, text) => `<a href="${esc(href)}">${esc(text)}</a>`

/** The HTML and the JSON-LD of one psalm. */
export function psalmPage(entry, psalm, tunes, prev, next) {
  const path = `/psalm/${entry.key}`
  const title = `${plainTitle(entry.title)}: ${entry.opening.replace(/[;:,.]+$/, '')} · ${NAME}`
  const metre = metreName(entry.meterName)
  const recommended = tunes.find((t) => t.slug === entry.tune)
  const others = tunes.filter((t) => t.meter === entry.meter && t.slug !== entry.tune)
  const description =
    `${plainTitle(entry.title)} from the Scottish Psalter of 1650, in ${metre} (${entry.meter}). ` +
    (recommended ? `Sing it to ${recommended.title}, or to another tune of the same metre. ` : '') +
    `Read the words, and sing along with the player.`
  const stanzas = psalm.stanzas
    .map((st) => {
      const verses = st.biblical_verses?.length ? `<small>v. ${st.biblical_verses.join('–')}</small><br />` : ''
      const lines = st.lines.map((l) => esc(l.text.reading ?? l.text.normalized ?? l.text.diplomatic)).join('<br />')
      return `<li>${verses}${lines}</li>`
    })
    .join('\n')
  const tuneItem = (t, note = '') => `<li><strong>${esc(tuneLabel(t))}</strong>${note}. ${esc(t.attribution ?? '')}</li>`
  const body = [
    `<nav>${link('/', NAME)} › ${esc(BOOK)}</nav>`,
    `<h1>${esc(plainTitle(entry.title))}</h1>`,
    `<p><em>${esc(entry.opening)}</em></p>`,
    `<p>${esc(BOOK)}, the Scottish Psalter of 1650. ${esc(metre[0].toUpperCase() + metre.slice(1))} (${esc(entry.meter)}). ${entry.stanzas} verses.</p>`,
    `<p>${NAME} plays the tune and shows each syllable as you sing. It also shows the music.</p>`,
    `<h2>The words</h2>`,
    `<ol>\n${stanzas}\n</ol>`,
    `<h2>Tunes</h2>`,
    `<ul>${recommended ? tuneItem(recommended, ' (the usual tune)') : ''}${others.map((t) => tuneItem(t)).join('')}</ul>`,
    `<h2>Read more</h2>`,
    `<ul><li>${link(`${HADDINGTON}/psalms-${entry.number}`, `The notes of John Brown of Haddington on Psalm ${entry.number}`)}</li>`,
    `<li>${link(`${HEARERS}#/add/Ps.${entry.number}`, `Memorise Psalm ${entry.number} (KJV) in Hearers`)}</li></ul>`,
    `<p>${prev ? link(`/psalm/${prev.key}`, `‹ ${plainTitle(prev.title)}`) : ''}${prev && next ? ' · ' : ''}${next ? link(`/psalm/${next.key}`, `${plainTitle(next.title)} ›`) : ''}</p>`,
    `<p><small>The text is in the public domain. The transcription is CC0, from ${link(SOURCE, 'Open 1650')}.</small></p>`,
  ].join('\n')
  const words = psalm.stanzas.map((st) => st.lines.map((l) => l.text.reading ?? l.text.normalized).join('\n')).join('\n\n')
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CreativeWork',
        '@id': `${SITE}${path}#psalm`,
        name: plainTitle(entry.title),
        alternativeHeadline: entry.opening,
        url: SITE + path,
        inLanguage: 'en',
        genre: 'Metrical psalm',
        isPartOf: { '@type': 'Book', name: BOOK, datePublished: '1650' },
        license: PDM,
        text: words,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: NAME, item: `${SITE}/` },
          { '@type': 'ListItem', position: 2, name: plainTitle(entry.title), item: SITE + path },
        ],
      },
    ],
  }
  return { path, title, description, jsonld, body }
}

/** The HTML and the JSON-LD of the home page. */
export function homePage(index) {
  const list = index.psalms
    .map((p) => `<li>${link(`/psalm/${p.key}`, plainTitle(p.title))}: ${esc(p.opening)} <small>(${esc(metreName(p.meterName))})</small></li>`)
    .join('\n')
  const body = [
    `<h1>${NAME}: sing the 1650 Scottish Psalter</h1>`,
    `<p>${esc(DESCRIPTION)}</p>`,
    `<p>${NAME} has each psalm of ${esc(BOOK)}, with ${index.tunes.length} tunes in harmony. Choose a psalm, choose a tune, and sing along. The player plays the tune and shows each syllable as you sing. The music view shows the score, verse by verse. ${NAME} is free, with no account and no advertisements. It works on the web, and there is an app for iPhone and Android.</p>`,
    `<p>${link('/about', `About ${NAME}`)} · ${link('/privacy', 'Privacy')}</p>`,
    `<h2>The psalms</h2>`,
    `<ul>\n${list}\n</ul>`,
  ].join('\n')
  const jsonld = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE}/#website`, name: NAME, url: `${SITE}/`, description: DESCRIPTION, inLanguage: 'en' },
      {
        '@type': 'WebApplication',
        name: NAME,
        url: `${SITE}/`,
        description: DESCRIPTION,
        applicationCategory: 'MultimediaApplication',
        operatingSystem: 'Web, iOS, Android',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'AUD' },
      },
      { '@type': 'Book', name: BOOK, datePublished: '1650', inLanguage: 'en', license: PDM },
    ],
  }
  return { path: '/', title: `${NAME}: sing the 1650 Scottish Psalter`, description: DESCRIPTION, jsonld, body }
}

export function sitemap(paths, date) {
  const urls = paths.map((p) => `  <url><loc>${esc(SITE + p)}</loc><lastmod>${date}</lastmod></url>`).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`
}

export const robots = () => `# Every crawler may read the site, AI answer engines too.
User-agent: *
Allow: /
Disallow: /a/

Sitemap: ${SITE}/sitemap.xml
`

/** llms.txt (https://llmstxt.org): what the site is, and a link to each psalm. */
export function llms(index) {
  const psalms = index.psalms.map((p) => `- [${plainTitle(p.title)}: ${p.opening}](${SITE}/psalm/${p.key}): ${metreName(p.meterName)} (${p.meter}).`).join('\n')
  return `# ${NAME}

> ${NAME} is a free app to sing the Scottish Psalter of 1650, ${BOOK}. It has each psalm, a choice of tunes in harmony, a player that shows each syllable as you sing, and the music of each tune. It works on the web, on iPhone and on Android.

- The words come from Open 1650 (${SOURCE}). The text is in the public domain, and the transcription is CC0.
- A psalm page shows the words of the psalm, its metre and the tunes of that metre.
- The metre of a psalm gives the number of syllables in each line. Any tune of the same metre fits the words.
- ${NAME} is one of four free Reformed apps. Hearers (${HEARERS}) helps you learn the catechisms and Scripture by heart.
- Haddington Bible (${HADDINGTON}) has the notes of John Brown of Haddington. Covenant Household (https://covenanthousehold.app) is for family worship.

## Pages

- [Home](${SITE}/): each psalm, with a link.
- [About](${SITE}/about): how to use ${NAME}, the metres, the tunes and the sources.
- [Privacy](${SITE}/privacy): ${NAME} collects no personal data.

## Psalms

${psalms}
`
}

function main() {
  const root = join(new URL('.', import.meta.url).pathname, '..')
  const dist = process.argv[2] ?? join(root, 'dist')
  const corpus = join(dist, 'corpus')
  const template = readFileSync(join(dist, 'index.html'), 'utf8')
  if (!template.includes('<div id="root"></div>')) throw new Error('seo: index.html has no empty <div id="root">')
  const index = JSON.parse(readFileSync(join(corpus, 'index.json'), 'utf8'))

  mkdirSync(join(dist, 'psalm'), { recursive: true })
  index.psalms.forEach((entry, i) => {
    const psalm = JSON.parse(readFileSync(join(corpus, 'psalms', `${entry.key}.json`), 'utf8'))
    const p = psalmPage(entry, psalm, index.tunes, index.psalms[i - 1], index.psalms[i + 1])
    writeFileSync(join(dist, 'psalm', `${entry.key}.html`), page(template, p))
  })
  writeFileSync(
    join(dist, 'about.html'),
    page(template, { path: '/about', title: `About · ${NAME}`, description: `How to use ${NAME}, the metres of the psalms, the tunes and the sources.` }),
  )
  writeFileSync(
    join(dist, 'privacy.html'),
    page(template, { path: '/privacy', title: `Privacy · ${NAME}`, description: `${NAME} collects no personal data. The apps have no account, no advertisements and no tracking.` }),
  )
  writeFileSync(join(dist, 'index.html'), page(template, homePage(index)))

  const date = new Date().toISOString().slice(0, 10)
  const paths = ['/', '/about', '/privacy', ...index.psalms.map((p) => `/psalm/${p.key}`)]
  writeFileSync(join(dist, 'sitemap.xml'), sitemap(paths, date))
  writeFileSync(join(dist, 'robots.txt'), robots())
  writeFileSync(join(dist, 'llms.txt'), llms(index))
  console.log(`seo: ${index.psalms.length} psalm pages, sitemap.xml with ${paths.length} pages, for ${SITE}`)
}

if (import.meta.url === `file://${process.argv[1]}`) main()
