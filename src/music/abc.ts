// Write a tune as ABC notation for abcjs: soprano and alto on the treble
// stave, tenor and bass on the bass stave, one line of music for each line of
// the psalm, and the words of one verse under the soprano.
//
// The tune data has notes in ticks, with no bar lines. bars() finds the
// upbeat (anacrusis): long notes and the last note of each line fall on the
// first beat of a bar.
import type { SettingStanza, TuneNote, TuneRecord } from '../engine/types.ts'

export interface AbcScore {
  abc: string
  /** The tune note id of each soprano note head, in order. A tied note has more than one head. */
  sopranoHeads: string[]
}

type Voice = 'S' | 'A' | 'T' | 'B'

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

/** The offset of the first bar line, in ticks. 0: the tune starts on the first beat. */
export function upbeat(tune: TuneRecord): number {
  const [num, den] = tune.time_signature
  const beat = (tune.ppq * 4) / den
  const bar = beat * num
  const finals = new Set(tune.phrases.map((p) => p.note_ids[p.note_ids.length - 1]))
  let best = 0
  let bestScore = -1
  for (let o = 0; o < bar; o += beat) {
    let score = 0
    for (const n of tune.notes) {
      const pos = (((n.start_tick - o) % bar) + bar) % bar
      if (pos === 0) score += 2 * n.duration_ticks + (finals.has(n.id) ? 4 * tune.ppq : 0)
      else if (num % 2 === 0 && pos === bar / 2) score += n.duration_ticks
    }
    if (score > bestScore) {
      best = o
      bestScore = score
    }
  }
  return best
}

// ---------- Keys and spelling ----------

const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const
type Letter = (typeof LETTERS)[number]
const NATURAL: Record<Letter, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
const MAJOR_FIFTHS: Record<string, number> = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, 'F-sharp': 6, 'C-sharp': 7, F: -1, 'B-flat': -2, 'E-flat': -3, 'A-flat': -4, 'D-flat': -5, 'G-flat': -6 }
const MAJOR_NAME: Record<number, string> = { [-6]: 'Gb', [-5]: 'Db', [-4]: 'Ab', [-3]: 'Eb', [-2]: 'Bb', [-1]: 'F', 0: 'C', 1: 'G', 2: 'D', 3: 'A', 4: 'E', 5: 'B', 6: 'F#' }
const MINOR_NAME: Record<number, string> = { [-6]: 'Ebm', [-5]: 'Bbm', [-4]: 'Fm', [-3]: 'Cm', [-2]: 'Gm', [-1]: 'Dm', 0: 'Am', 1: 'Em', 2: 'Bm', 3: 'F#m', 4: 'C#m', 5: 'G#m', 6: 'D#m' }

/** "E-flat major" → { fifths: -3, abc: "Eb" }. */
export function keySignature(key: string): { fifths: number; abc: string } {
  const m = /^([A-G](?:-sharp|-flat)?) (major|minor)$/.exec(key)
  if (!m) return { fifths: 0, abc: 'C' }
  let fifths = MAJOR_FIFTHS[m[1]] ?? 0
  if (m[2] === 'minor') fifths -= 3
  if (fifths < -6) fifths += 12
  if (fifths > 6) fifths -= 12
  return { fifths, abc: (m[2] === 'minor' ? MINOR_NAME : MAJOR_NAME)[fifths] }
}

function keyAccidentals(fifths: number): Record<Letter, number> {
  const acc: Record<Letter, number> = { C: 0, D: 0, E: 0, F: 0, G: 0, A: 0, B: 0 }
  const sharps: Letter[] = ['F', 'C', 'G', 'D', 'A', 'E', 'B']
  const flats: Letter[] = ['B', 'E', 'A', 'D', 'G', 'C', 'F']
  if (fifths > 0) for (const l of sharps.slice(0, fifths)) acc[l] = 1
  if (fifths < 0) for (const l of flats.slice(0, -fifths)) acc[l] = -1
  return acc
}

interface Spelled {
  letter: Letter
  acc: number
  octave: number
}

function spell(midi: number, keyAcc: Record<Letter, number>, preferFlats: boolean): Spelled {
  const pc = ((midi % 12) + 12) % 12
  // A note of the scale takes its letter from the key.
  let letter = LETTERS.find((l) => (NATURAL[l] + keyAcc[l] + 12) % 12 === pc)
  let acc = letter ? keyAcc[letter] : 0
  if (!letter) {
    letter = LETTERS.find((l) => NATURAL[l] === pc)
    acc = 0
    if (!letter) {
      letter = preferFlats ? LETTERS.find((l) => NATURAL[l] === (pc + 1) % 12)! : LETTERS.find((l) => NATURAL[l] === (pc + 11) % 12)!
      acc = preferFlats ? -1 : 1
    }
  }
  const octave = Math.floor((midi - acc - NATURAL[letter]) / 12) - 1
  return { letter, acc, octave }
}

function pitchText({ letter, octave }: Spelled): string {
  if (octave >= 5) return letter.toLowerCase() + "'".repeat(octave - 5)
  return letter + ','.repeat(Math.max(0, 4 - octave))
}

// ---------- Durations ----------

const LENGTHS = [32, 24, 16, 12, 8, 6, 4, 3, 2, 1]

/** Split a length in units into lengths that one note can show. */
function pieces(units: number): number[] {
  const out: number[] = []
  let left = units
  while (left > 0) {
    const n = LENGTHS.find((l) => l <= left) ?? 1
    out.push(n)
    left -= n
  }
  return out
}

const lenText = (n: number) => (n === 1 ? '' : String(n))

// ---------- Lyrics ----------

interface Sung {
  text: string
  /** The word goes on after this syllable. */
  more: boolean
  /** Notes after the first that hold the syllable. */
  hold: number
}

/** The syllable that starts on each soprano note of one verse. */
function lyricByNote(stanza: SettingStanza | undefined): Map<string, Sung> {
  const out = new Map<string, Sung>()
  if (!stanza) return out
  for (const line of stanza.lines)
    for (const tok of line.tokens)
      tok.syllable_map.forEach((sy, i) => {
        if (!sy.note_ids.length) return
        out.set(sy.note_ids[0], { text: sy.text, more: i < tok.syllable_map.length - 1, hold: sy.note_ids.length - 1 })
      })
  return out
}

const lyricText = (s: string) => s.replace(/[-_*~|\\]/g, (c) => `\\${c}`).replace(/\s+/g, '~')

// ---------- The score ----------

/**
 * `split`: on a narrow screen, break each line of the psalm into two lines of
 * music, at the bar line nearest the middle.
 */
export function tuneToAbc(tune: TuneRecord, transpose: number, keyName: string, stanza?: SettingStanza, split = false): AbcScore {
  const voices: Record<Voice, TuneNote[]> = {
    S: tune.notes,
    A: tune.harmony.voices.alto,
    T: tune.harmony.voices.tenor,
    B: tune.harmony.voices.bass,
  }
  const [num, den] = tune.time_signature
  const bar = (tune.ppq * 4 * num) / den
  // The unit length L: the largest note value that divides every start and length.
  let unit = tune.ppq * 4
  for (const v of Object.values(voices)) for (const n of v) unit = gcd(gcd(unit, n.start_tick), n.duration_ticks)
  unit = gcd(unit, tune.ppq)
  const unitDen = (tune.ppq * 4) / unit

  const offset = upbeat(tune)
  const end = Math.max(tune.length_ticks, ...Object.values(voices).flatMap((v) => v.map((n) => n.start_tick + n.duration_ticks)))
  const barLines: number[] = []
  for (let t = offset || bar; t < end; t += bar) barLines.push(t)

  // A new line of music at the first bar line at or after the end of each phrase.
  const breaks = new Set<number>()
  let lineStart = 0
  tune.phrases.forEach((p, i) => {
    const b = i < tune.phrases.length - 1 ? barLines.find((t) => t >= p.end_tick) : end
    if (b === undefined) return
    if (split) {
      const inner = barLines.filter((t) => t > lineStart && t < b)
      if (inner.length >= 2) {
        const mid = (lineStart + b) / 2
        breaks.add(inner.reduce((x, y) => (Math.abs(y - mid) < Math.abs(x - mid) ? y : x)))
      }
    }
    if (b < end) breaks.add(b)
    lineStart = b
  })
  const { fifths, abc: keyAbc } = keySignature(keyName)
  const keyAcc = keyAccidentals(fifths)
  const sopranoHeads: string[] = []
  const words = lyricByNote(stanza)

  // Each voice as lines of music; each line ends at a break.
  const write = (voice: Voice): { music: string[]; lyrics: string[] } => {
    const notes = [...voices[voice]].sort((a, b) => a.start_tick - b.start_tick)
    const music: string[] = []
    const lyrics: string[] = []
    let line = ''
    let words_ = ''
    let state: Record<string, number> = {}
    let t = 0
    let i = 0
    let hold = 0
    const closeLine = () => {
      music.push(line.trim())
      lyrics.push(words_.trim())
      line = ''
      words_ = ''
    }
    const boundary = (at: number) => {
      if (barLines.includes(at)) {
        line += ' |'
        state = {}
        if (breaks.has(at)) closeLine()
      }
    }
    // The next bar line after `at`, or the end.
    const nextBar = (at: number) => barLines.find((b) => b > at) ?? end
    const emit = (from: number, to: number, body: (len: number, first: boolean, last: boolean) => string) => {
      let at = from
      let first = true
      while (at < to) {
        const stop = Math.min(to, nextBar(at))
        const parts = pieces((stop - at) / unit)
        parts.forEach((len, k) => {
          const last = stop === to && k === parts.length - 1
          line += ' ' + body(len, first, last)
          first = false
        })
        at = stop
        if (at < to) boundary(at)
      }
    }
    while (t < end) {
      const n = notes[i]
      if (!n || n.start_tick > t) {
        const to = n ? n.start_tick : end
        emit(t, to, (len) => `z${lenText(len)}`)
        t = to
      } else {
        const sp = spell(n.midi + transpose, keyAcc, fifths < 0)
        const slot = `${sp.letter}${sp.octave}`
        const want = sp.acc
        const have = state[slot] ?? keyAcc[sp.letter]
        const sung = voice === 'S' ? words.get(n.id) : undefined
        // A note after the first note of a syllable holds that syllable.
        let held = false
        if (voice === 'S') {
          if (sung) hold = sung.hold
          else if (hold > 0) {
            held = true
            hold--
          }
        }
        emit(n.start_tick, n.start_tick + n.duration_ticks, (len, first, last) => {
          let head = ''
          if (first && want !== have) head = want === 1 ? '^' : want === -1 ? '_' : '='
          if (voice === 'S') {
            sopranoHeads.push(n.id)
            // A tied note takes no syllable after its first head.
            if (first) words_ += sung ? `${lyricText(sung.text)}${sung.more ? '-' : ' '}` : !stanza ? '' : held ? '_ ' : '* '
          }
          return `${head}${pitchText(sp)}${lenText(len)}${last ? '' : '-'}`
        })
        state[slot] = want
        t = n.start_tick + n.duration_ticks
        i++
      }
      boundary(t)
    }
    if (line.trim()) closeLine()
    if (music.length && !music[music.length - 1].endsWith('|]')) music[music.length - 1] = music[music.length - 1].replace(/\|?$/, ' |]')
    return { music, lyrics }
  }

  const parts = (['S', 'A', 'T', 'B'] as Voice[]).map((v) => [v, write(v)] as const)
  const lines = Math.max(...parts.map(([, p]) => p.music.length))
  const body: string[] = []
  for (let l = 0; l < lines; l++) {
    for (const [v, p] of parts) {
      body.push(`[V:${v}] ${p.music[l] ?? ''}`)
      if (v === 'S' && stanza && p.lyrics[l]) body.push(`w: ${p.lyrics[l]}`)
    }
  }
  const abc = [
    'X:1',
    `M:${num}/${den}`,
    `L:1/${unitDen}`,
    '%%score (S A) (T B)',
    `%%vocalfont Helvetica ${split ? 12 : 13}`,
    `K:${keyAbc}`,
    'V:S clef=treble stem=up',
    'V:A clef=treble stem=down',
    'V:T clef=bass stem=up',
    'V:B clef=bass stem=down',
    ...body,
  ].join('\n')
  return { abc, sopranoHeads }
}
