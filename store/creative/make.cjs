// App Store creative assets: the product page header and the search results image.
// The App Store shows them on iOS 27 and iPadOS 27, and later.
//
//   node make.cjs <config.json> <outDir>
//
// The config is the config of the store screenshots (../screenshots/config.json).
// It gives the colours, the motif and the screens. An optional "creative" key
// changes the phrase or the screens: { phrase: "Line 1\nLine 2", shots: [4 files] }.
// With no "creative" key, the phrase is the title of the first panel, and the
// screens are the first four panels.
//
// Apple crops each image to fit the device. Only the art safe area is always
// in view, so the phrase is in the safe area, and the phones stand at its sides.
const sharp = require('sharp')
const fs = require('fs')
const path = require('path')
const { Buffer } = require('node:buffer')

const [cfgPath, OUT] = process.argv.slice(2)
if (!cfgPath || !OUT) throw new Error('Use: node make.cjs <config.json> <outDir>')
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'))
const base = path.dirname(cfgPath)
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;')

const creative = cfg.creative || {}
const phrase = creative.phrase || cfg.panels[0].title
const shots = creative.shots || cfg.panels.slice(0, 4).map((p) => p.shot)
if (shots.length < 4) throw new Error('The creative assets need four screens.')

// The sizes and the art safe areas are from "Creative assets specifications"
// in App Store Connect Help. The safe area of the search image is for the
// largest size, which is the size that this script makes.
const SLOTS = {
  header: {
    file: 'header.png',
    W: 3840,
    H: 1646,
    safe: { x: 1097, y: 493, w: 1646, h: 661 },
    textW: 1250,
    title: 150,
    phoneW: 540,
    gap: 60,
    innerTop: 250,
    outerTop: 520,
  },
  search: {
    file: 'search-results.jpg',
    W: 3840,
    H: 2560,
    safe: { x: 836, y: 765, w: 2168, h: 1030 },
    textW: 1340,
    title: 176,
    phoneW: 700,
    gap: 80,
    innerTop: 520,
    outerTop: 860,
  },
}

function background(s) {
  const { W, H } = s
  const [c1, c2] = cfg.bg
  const stroke = Math.max(3, W / 900)
  let motif = ''
  // Five lines of a music staff, in a slow wave.
  if (cfg.motif === 'staff') {
    const gap = H * 0.018
    for (let k = 0; k < 5; k++) {
      const pts = []
      for (let x = 0; x <= W; x += W / 48) {
        const y = H * 0.72 + Math.sin((x / W) * Math.PI * 2) * H * 0.1 + k * gap
        pts.push(`${x.toFixed(0)},${y.toFixed(1)}`)
      }
      motif += `<polyline points="${pts.join(' ')}" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="${stroke}"/>`
    }
  }
  // Ruled lines, as on the page of a copy book.
  if (cfg.motif === 'rule') {
    for (let y = H * 0.5; y < H; y += H * 0.05) {
      motif += `<line x1="0" x2="${W}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#ffffff" stroke-opacity="0.06" stroke-width="${stroke}"/>`
    }
  }
  // A row of empty blocks.
  if (cfg.motif === 'boxes') {
    const size = H * 0.07
    for (let x = size * 0.5; x < W; x += size * 1.5) {
      const y = H * 0.86 + Math.sin((x / W) * Math.PI * 2) * H * 0.03
      motif += `<rect x="${x.toFixed(0)}" y="${y.toFixed(0)}" width="${size.toFixed(0)}" height="${size.toFixed(0)}" rx="${(size * 0.18).toFixed(0)}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="${stroke * 1.4}"/>`
    }
  }
  // Steps that fall from the left to the right, as a debt falls.
  if (cfg.motif === 'fall') {
    const pts = []
    const steps = 12
    for (let k = 0; k <= steps; k++) {
      const x = (k / steps) * W
      const y = H * 0.3 + (k / steps) * H * 0.6
      pts.push(`${x.toFixed(0)},${y.toFixed(1)}`, `${(x + W / steps).toFixed(0)},${y.toFixed(1)}`)
    }
    motif = `<polyline points="${pts.join(' ')}" fill="none" stroke="#ffffff" stroke-opacity="0.12" stroke-width="${stroke * 1.4}"/>`
  }
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/>
      </linearGradient>
      <radialGradient id="glow">
        <stop offset="0" stop-color="${cfg.accent}" stop-opacity="0.24"/>
        <stop offset="1" stop-color="${cfg.accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="${W}" height="${H}" fill="url(#bg)"/>
    <circle cx="${W / 2}" cy="${H * 0.45}" r="${W * 0.34}" fill="url(#glow)"/>
    <circle cx="${W * 0.08}" cy="${H * 0.9}" r="${W * 0.22}" fill="url(#glow)"/>
    <circle cx="${W * 0.92}" cy="${H * 0.1}" r="${W * 0.22}" fill="url(#glow)"/>
    ${motif}
  </svg>`)
}

/** The phrase, in the middle of the art safe area. */
function text(s) {
  const lines = phrase.split('\n')
  const longest = Math.max(...lines.map((l) => l.length))
  const serif = !cfg.titleFont
  const size = Math.min(s.title, Math.floor(s.textW / (longest * (serif ? 0.5 : 0.56))))
  const lh = size * 1.12
  const cx = s.safe.x + s.safe.w / 2
  const cy = s.safe.y + s.safe.h / 2
  // The baseline of the first line, so that the block of lines is in the centre.
  const y0 = cy - ((lines.length - 1) * lh) / 2 + size * 0.35
  const tspans = lines.map((l, k) => `<tspan x="${cx}" dy="${k ? lh : 0}">${esc(l)}</tspan>`).join('')
  // librsvg reads the "4" in "Source Serif 4" as a font size, and then uses a
  // different serif font. The name with no spaces finds the correct font.
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${s.W}" height="${s.H}">
    <text x="${cx}" y="${y0}" text-anchor="middle" font-family="${cfg.titleFont || 'SourceSerif4'}" font-size="${size}" font-weight="${serif ? 700 : 800}" fill="${cfg.ink}">${tspans}</text>
  </svg>`)
}

/** The screen in a plain phone frame. */
async function phone(file, w) {
  const bezel = Math.round(w * 0.028)
  const sw = w - bezel * 2
  const meta = await sharp(file).metadata()
  const sh = Math.round((meta.height / meta.width) * sw)
  // A screen from the web export has no status bar. Add a strip in the colour of the app header.
  const status = cfg.screenHasStatusBar ? 0 : Math.round(sw * 0.12)
  const [r, g, b] = await sharp(file).extract({ left: 2, top: 2, width: 1, height: 1 }).raw().toBuffer()
  const shot = await sharp(file).resize({ width: sw }).toBuffer()
  const screenH = status + sh
  const h = screenH + bezel * 2
  const rOuter = Math.round(w * 0.13)
  const rInner = rOuter - bezel
  const over = cfg.screenHasStatusBar
    ? ''
    : `<rect x="${w / 2 - sw * 0.15}" y="${bezel + status * 0.28}" width="${sw * 0.3}" height="${status * 0.42}" rx="${status * 0.21}" fill="#000"/>
       <text x="${bezel + sw * 0.13}" y="${bezel + status * 0.62}" text-anchor="middle" font-family="Inter" font-weight="600" font-size="${status * 0.3}" fill="${r + g + b > 380 ? '#000' : '#fff'}">9:41</text>`
  const screen = await sharp({ create: { width: sw, height: screenH, channels: 4, background: { r, g, b, alpha: 1 } } })
    .composite([{ input: shot, top: status, left: 0 }])
    .png()
    .toBuffer()
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${sw}" height="${screenH}"><rect width="${sw}" height="${screenH}" rx="${rInner}" fill="#fff"/></svg>`)
  const rounded = await sharp(screen).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  const frame = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <rect width="${w}" height="${h}" rx="${rOuter}" fill="#111"/>
    <rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" rx="${rOuter - 1}" fill="none" stroke="#fff" stroke-opacity="0.25" stroke-width="3"/>
  </svg>`)
  const top = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${over}</svg>`)
  return sharp(frame).composite([{ input: rounded, top: bezel, left: bezel }, { input: top }]).png().toBuffer()
}

async function shadow(img) {
  const m = await sharp(img).metadata()
  const pad = Math.round(m.width * 0.08)
  const blurred = await sharp(img)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .ensureAlpha()
    .modulate({ brightness: 0 })
    .blur(pad / 2.5)
    .linear(0.45, 0)
    .png()
    .toBuffer()
  return { img: await sharp(blurred).composite([{ input: img, top: pad - Math.round(pad * 0.3), left: pad }]).png().toBuffer(), pad }
}

/** Cut the part of a layer that is outside the canvas. sharp does not accept it. */
async function place(img, left, top, s) {
  const m = await sharp(img).metadata()
  const x0 = Math.max(0, -left)
  const y0 = Math.max(0, -top)
  const width = Math.min(m.width - x0, s.W - Math.max(0, left))
  const height = Math.min(m.height - y0, s.H - Math.max(0, top))
  if (width <= 0 || height <= 0) return null
  const input = await sharp(img).extract({ left: x0, top: y0, width, height }).toBuffer()
  return { input, left: Math.max(0, left), top: Math.max(0, top) }
}

;(async () => {
  fs.mkdirSync(OUT, { recursive: true })
  for (const [name, s] of Object.entries(SLOTS)) {
    const cx = s.safe.x + s.safe.w / 2
    const innerL = Math.round(cx - s.textW / 2 - s.gap - s.phoneW)
    const innerR = Math.round(cx + s.textW / 2 + s.gap)
    // The order is back to front: the outer phones, then the inner phones.
    const spots = [
      { shot: shots[2], left: innerL - s.gap - s.phoneW, top: s.outerTop },
      { shot: shots[3], left: innerR + s.phoneW + s.gap, top: s.outerTop },
      { shot: shots[0], left: innerL, top: s.innerTop },
      { shot: shots[1], left: innerR, top: s.innerTop },
    ]
    const layers = []
    for (const spot of spots) {
      const { img, pad } = await shadow(await phone(path.resolve(base, spot.shot), s.phoneW))
      const layer = await place(img, spot.left - pad, spot.top - pad, s)
      if (layer) layers.push(layer)
    }
    layers.push({ input: text(s), top: 0, left: 0 })
    const out = sharp(background(s)).composite(layers).flatten({ background: cfg.bg[1] }).removeAlpha()
    const file = path.join(OUT, s.file)
    if (s.file.endsWith('.jpg')) await out.jpeg({ quality: 92, chromaSubsampling: '4:4:4' }).toFile(file)
    else await out.png().toFile(file)
    console.log(name, `${s.W}×${s.H}`, s.file)
  }
})().catch((e) => {
  console.error(e)
  process.exit(1)
})
