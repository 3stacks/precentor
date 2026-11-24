// Draws the bold set of iPad store screenshots from a config file. The cards make one panorama.
//
//   NODE_PATH=<playwright and sharp> node compose-bold-ipad.cjs <config.json> <outDir> [--portrait <file>]
//
// Config: { raw: <dir>, landscape: bool,
//           palette: { loud, loudInk, mid, dark, pop },
//           cards: [{ shot, lines: [{ t, size, key }], tilt, dx,
//                     pops: [{ crop: [x, y, w, h], w, x, y, rot }],
//                     pills: [{ t, x, y, rot, dot, kind }] }],
//           chat: { card, x, y, t } }
// A crop is in px of the raw screen. x is in design px from the left of the card.
// y is in design px from the top of the iPad. A pill with `abs` has y from the top of the card.
// A portrait card is 1760 × 2347 design px. A landscape card is 2347 × 1760 design px.
const { chromium } = require('playwright')
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { pathToFileURL } = require('url')

const [cfgPath, outArg] = process.argv.slice(2)
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const outDir = path.resolve(outArg)
const rawDir = path.resolve(path.dirname(cfgPath), cfg.raw)
const fontUrl = (f) => pathToFileURL(path.join(__dirname, 'fonts', f)).href
// The script draws copies of the raw screens that have no EXIF data, because a browser turns
// an image that has an EXIF orientation.
const tmpDir = path.join(outDir, '.tmp')
const rawUrl = (f) => pathToFileURL(path.join(tmpDir, f)).href

const L = cfg.landscape
  ? { card: 2347, h: 1760, outW: 2752, outH: 2064, rawW: 2752, dev: 1720, devH: 1290, top: 730, left: 520, head: 1.1 }
  : { card: 1760, h: 2347, outW: 2064, outH: 2752, rawW: 2064, dev: 1340, devH: 1787, top: 850, left: 210, head: 1.2 }
const SCALE = L.outW / L.card
const P = cfg.palette
const n = cfg.cards.length
// The first card and the last card are loud. One card in the middle is dark.
const scheme = (i) => {
  if (i === 0 || i === n - 1) return { bg: P.loud, ink: P.loudInk, key: P.loudInk, light: true }
  if (i === Math.floor(n / 2)) return { bg: P.dark, ink: '#ffffff', key: P.pop }
  return { bg: P.mid, ink: '#ffffff', key: P.pop }
}
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')
const check = (size) =>
  `<svg width="${size}" height="${size}" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`

function html() {
  const x0 = (i) => i * L.card
  const tops = [0.36, 0.5, 0.62, 0.74, 0.86]
  let out = ''
  cfg.cards.forEach((c, i) => {
    const s = scheme(i)
    out += `<div class="bg" style="left:${x0(i)}px;background:${s.bg}"></div>`
    out += `<div class="bar" style="left:${x0(i) + 70}px;top:${tops[i] * L.h}px;width:${L.card - 140}px;height:${L.h}px;background:${s.light ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)'}"></div>`
  })
  cfg.cards.forEach((c, i) => {
    out += `<div class="ipad" style="left:${x0(i) + L.left + (c.dx || 0)}px;top:${L.top}px;width:${L.dev}px;height:${L.devH}px;transform:rotate(${c.tilt}deg)"><img src="${rawUrl(c.shot)}"></div>`
  })
  cfg.cards.forEach((c, i) => {
    const s = scheme(i)
    const lines = c.lines
      .map((l) =>
        l.key
          ? `<em style="font-size:${l.size * L.head}px">${esc(l.t)}</em>`
          : `<span class="s" style="font-size:${(l.size || 150) * L.head}px">${esc(l.t)}</span>`,
      )
      .join('')
    out += `<h1 style="left:${x0(i) + 110}px;color:${s.ink};--key:${s.key}">${lines}</h1>`
    for (const p of c.pops || []) {
      const [cx, cy, cw, ch] = p.crop
      const k = p.w / cw
      out += `<div class="pop crop" style="left:${x0(i) + p.x}px;top:${L.top + p.y}px;width:${p.w}px;height:${ch * k + 16}px;transform:rotate(${p.rot || 0}deg);background-image:url(${rawUrl(c.shot)});background-size:${L.rawW * k}px auto;background-position:${-cx * k}px ${-cy * k}px"></div>`
    }
    for (const p of c.pills || []) {
      const kind = p.kind || 'white'
      const style =
        kind === 'pop'
          ? `background:${P.pop};color:${P.dark}`
          : kind === 'dark'
            ? `background:${P.dark};color:${P.pop}`
            : kind === 'loud'
              ? `background:${P.loud};color:${P.loudInk}`
              : kind === 'green'
                ? 'background:#16a34a;color:#fff'
                : `background:#fff;color:${P.dark}`
      out += `<div class="pop pill${p.italic ? ' it' : ''}" style="left:${x0(i) + p.x}px;top:${p.abs ? p.y : L.top + p.y}px;transform:rotate(${p.rot || 0}deg);font-size:${p.size || 62}px;${style}">${p.dot ? `<i style="background:${p.dot}"></i>` : ''}${p.check ? check(70) : ''}${esc(p.t)}</div>`
    }
  })
  if (cfg.chat) {
    const c = cfg.chat
    const at = process.argv.indexOf('--portrait')
    const portrait = at === -1 ? '' : pathToFileURL(path.resolve(process.argv[at + 1])).href
    out += `<div class="chat" style="left:${x0(c.card) + c.x}px;top:${L.top + c.y}px">${portrait ? `<img class="avatar" src="${portrait}">` : ''}<div class="bubble"><p>${esc(c.t)}</p></div></div>`
  }

  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; font-style: normal; font-weight: 100 900; src: url(${fontUrl('Inter.ttf')}); }
@font-face { font-family: Inter; font-style: italic; font-weight: 100 900; src: url(${fontUrl('Inter-Italic.woff2')}); }
* { box-sizing: border-box; margin: 0; }
body { width: ${L.card * n}px; height: ${L.h}px; position: relative; overflow: hidden; font-family: Inter, sans-serif; }
.bg { position: absolute; top: 0; width: ${L.card}px; height: ${L.h}px; }
.bar { position: absolute; border-radius: 90px 90px 0 0; }
h1 { position: absolute; top: 130px; font-weight: 800; letter-spacing: -0.035em; line-height: 0.98; }
h1 .s { display: block; white-space: nowrap; }
h1 em { display: block; font-weight: 900; font-style: italic; letter-spacing: -0.055em; line-height: 0.95; color: var(--key); margin-left: -8px; white-space: nowrap; }
.ipad { position: absolute; border-radius: 74px; background: #05070f; padding: 30px; box-shadow: 0 0 0 4px rgba(255,255,255,0.18), 0 70px 140px rgba(5,7,15,0.45); }
.ipad img { width: 100%; height: 100%; display: block; border-radius: 46px; object-fit: cover; object-position: top; }
.pop { position: absolute; box-shadow: 0 40px 90px rgba(5,7,15,0.38); }
.crop { border-radius: 40px; border: 8px solid #fff; background-color: #fff; background-repeat: no-repeat; }
.pill { display: flex; align-items: center; gap: 28px; border-radius: 200px; padding: 32px 58px; font-weight: 800; white-space: nowrap; letter-spacing: -0.02em; }
.pill.it { font-style: italic; font-weight: 900; letter-spacing: -0.03em; }
.pill i { width: 52px; height: 52px; border-radius: 14px; display: block; }
.chat { position: absolute; display: flex; align-items: flex-end; gap: 30px; transform: rotate(-4deg); }
.avatar { width: 290px; height: 290px; border-radius: 50%; object-fit: cover; object-position: 50% 22%; border: 12px solid #fff; box-shadow: 0 24px 60px rgba(5,7,15,0.35); flex: none; }
.bubble { background: #fff; border-radius: 70px 70px 70px 18px; padding: 44px 54px; max-width: 700px; box-shadow: 0 40px 90px rgba(5,7,15,0.38); font-size: 56px; font-weight: 600; color: ${P.dark}; line-height: 1.25; }
</style></head><body>${out}</body></html>`
}

async function main() {
  fs.mkdirSync(tmpDir, { recursive: true })
  for (const c of cfg.cards) await sharp(path.join(rawDir, c.shot)).png().toFile(path.join(tmpDir, c.shot))
  const browser = await chromium.launch()
  const tmp = path.join(tmpDir, 'panorama.html')
  const page = await browser.newPage({ viewport: { width: L.card * n, height: L.h }, deviceScaleFactor: SCALE })
  fs.writeFileSync(tmp, html())
  await page.goto(pathToFileURL(tmp).href)
  await page.evaluate(() => document.fonts.ready)
  const shot = await page.screenshot({ type: 'png' })
  await browser.close()
  fs.rmSync(tmpDir, { recursive: true })
  const pano = await sharp(shot).resize(L.outW * n, L.outH, { fit: 'fill' }).flatten({ background: P.dark }).png().toBuffer()
  await sharp(pano).toFile(path.join(outDir, 'panorama.png'))
  for (let i = 0; i < n; i++) {
    await sharp(pano).extract({ left: i * L.outW, top: 0, width: L.outW, height: L.outH }).toFile(path.join(outDir, `screenshot-${i + 1}.png`))
  }
  console.log(`ipad: ${n} × ${L.outW} × ${L.outH}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
