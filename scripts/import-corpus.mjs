// Copy the psalter data from open-1650 into public/corpus/.
//
//   node scripts/import-corpus.mjs            # fetch the pinned commit into .cache/
//   node scripts/import-corpus.mjs <checkout> # use a local open-1650 checkout
//
// open-1650 (https://github.com/kadencartwright/open-1650) holds the 1650 text,
// the tunes and the syllable underlay. Its text and tunes are public domain
// (PDM-1.0). Its own data is CC0-1.0. We credit it on the About page.
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const REPO = 'https://github.com/kadencartwright/open-1650'
export const COMMIT = '19d8190f9216e9d0f24d77f7909cf90cadac28ee'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const OUT = path.join(ROOT, 'public', 'corpus')

function checkout() {
  if (process.argv[2]) return path.resolve(process.argv[2])
  const dir = path.join(ROOT, '.cache', 'open-1650')
  if (!fs.existsSync(path.join(dir, '.git'))) {
    fs.mkdirSync(dir, { recursive: true })
    execFileSync('git', ['init', '-q', dir])
    execFileSync('git', ['-C', dir, 'remote', 'add', 'origin', REPO])
  }
  execFileSync('git', ['-C', dir, 'fetch', '-q', '--depth', '1', 'origin', COMMIT])
  execFileSync('git', ['-C', dir, 'checkout', '-q', COMMIT])
  return dir
}

const src = checkout()
const head = execFileSync('git', ['-C', src, 'rev-parse', 'HEAD']).toString().trim()
if (head !== COMMIT) console.warn(`warning: ${src} is at ${head}, not the pinned ${COMMIT}`)

const read = (...p) => JSON.parse(fs.readFileSync(path.join(src, 'corpus', ...p), 'utf8'))
const write = (rel, data) => {
  const file = path.join(OUT, rel)
  fs.mkdirSync(path.dirname(file), { recursive: true })
  fs.writeFileSync(file, JSON.stringify(data))
}

fs.rmSync(OUT, { recursive: true, force: true })

// Tunes: one file per tune, by slug.
const slug = (tuneId) => tuneId.replace(/^ps1650\.tune\./, '')
const tunes = fs
  .readdirSync(path.join(src, 'corpus/music/tunes'))
  .map((f) => read('music/tunes', f))
  .sort((a, b) => a.title.localeCompare(b.title))
for (const t of tunes) write(`tunes/${slug(t.id)}.json`, t)

// Settings: open-1650 has one underlay per psalm version. Another tune of the
// same metre reuses it (src/engine/retargetSetting.ts).
const settingByPsalm = new Map()
for (const f of fs.readdirSync(path.join(src, 'corpus/music/settings'))) {
  const s = read('music/settings', f)
  if (settingByPsalm.has(s.psalm_id)) continue
  settingByPsalm.set(s.psalm_id, s)
}

// Psalms.
const psalms = []
for (const f of fs.readdirSync(path.join(src, 'corpus/text')).sort()) {
  const p = read('text', f)
  const setting = settingByPsalm.get(p.id)
  if (!setting) throw new Error(`no setting for ${p.id}`)
  const key = `${String(p.psalm_number).padStart(3, '0')}${p.version === 'alternate' ? 'b' : ''}`
  write(`psalms/${key}.json`, p)
  write(`settings/${key}.json`, setting)
  psalms.push({
    key,
    id: p.id,
    number: p.psalm_number,
    version: p.version,
    title: p.title,
    opening: p.opening_line,
    meter: p.meter.pattern,
    meterName: p.meter.name,
    tune: slug(setting.tune_id),
    stanzas: p.stanzas.length,
    verses: [...new Set(p.stanzas.flatMap((s) => s.biblical_verses))].length,
  })
}

psalms.sort((a, b) => a.number - b.number || (a.version === 'primary' ? -1 : 1))

const index = {
  source: { repo: REPO, commit: head },
  psalms,
  tunes: tunes.map((t) => ({
    slug: slug(t.id),
    id: t.id,
    title: t.title,
    alternateTitle: t.alternate_title,
    meter: t.meter,
    phrases: t.phrases.length,
    key: t.key,
    attribution: t.source.attribution,
    record: t.source.record_url,
  })),
}
write('index.json', index)

// Tempo references go in the bundle: the engine imports them.
const tempo = read('sources', 'tempo-references.json')
fs.writeFileSync(
  path.join(ROOT, 'src/data/tempo-references.json'),
  JSON.stringify({ profiles: tempo.profiles, psalm_profiles: tempo.psalm_profiles ?? {} }, null, 1) + '\n',
)

const bytes = (dir) =>
  fs.readdirSync(dir, { recursive: true }).reduce((n, f) => {
    const p = path.join(dir, f)
    return fs.statSync(p).isFile() ? n + fs.statSync(p).size : n
  }, 0)
console.log(`${psalms.length} psalm versions, ${tunes.length} tunes, ${(bytes(OUT) / 1e6).toFixed(1)} MB in public/corpus`)
