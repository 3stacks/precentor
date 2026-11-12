import type { PsalmRecord, PsalmSetting, TuneRecord } from '../engine/types.ts'
import { readCorpusFile } from './corpusSource'

/** public/corpus/index.json, written by scripts/import-corpus.mjs. */
export interface PsalmEntry {
  key: string // "023", or "023b" for the second version
  id: string
  number: number
  version: 'primary' | 'alternate'
  title: string
  opening: string
  meter: string
  meterName: string
  tune: string // slug of the tune that open-1650 recommends
  stanzas: number
  verses: number
}

export interface TuneEntry {
  slug: string
  id: string
  title: string
  alternateTitle: string | null
  meter: string
  phrases: number
  key: string
  attribution: string
  record: string
}

export interface CorpusIndex {
  source: { repo: string; commit: string }
  psalms: PsalmEntry[]
  tunes: TuneEntry[]
}

const cache = new Map<string, Promise<unknown>>()

function getJson<T>(path: string): Promise<T> {
  let p = cache.get(path)
  if (!p) {
    p = readCorpusFile(path)
    p.catch(() => cache.delete(path))
    cache.set(path, p)
  }
  return p as Promise<T>
}

export const loadIndex = () => getJson<CorpusIndex>('index.json')
export const loadPsalm = (key: string) => getJson<PsalmRecord>(`psalms/${key}.json`)
export const loadSetting = (key: string) => getJson<PsalmSetting>(`settings/${key}.json`)
export const loadTune = (slug: string) => getJson<TuneRecord>(`tunes/${slug}.json`)

/** Tunes that fit the psalm: the same metre and the same number of lines. The recommended tune is first. */
export function tunesFor(index: CorpusIndex, psalm: PsalmEntry): TuneEntry[] {
  const home = index.tunes.find((t) => t.slug === psalm.tune)
  if (!home) return []
  const others = index.tunes.filter((t) => t.slug !== home.slug && t.meter === home.meter && t.phrases === home.phrases)
  return [home, ...others]
}

export const psalmLabel = (p: Pick<PsalmEntry, 'number' | 'version'>) => `Psalm ${p.number}${p.version === 'alternate' ? ' (second version)' : ''}`

export const tuneLabel = (t: Pick<TuneEntry, 'title' | 'alternateTitle'>) => (t.alternateTitle ? `${t.title} (${t.alternateTitle})` : t.title)

/** Show "Common Metre" style names in British spelling. */
export const meterLabel = (name: string, pattern: string) => `${name.replace(/Meter\b/, 'Metre')} (${pattern})`
