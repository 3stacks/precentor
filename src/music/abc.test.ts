import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import type { PsalmSetting, TuneRecord } from '../engine/types.ts'
import { keySignature, tuneToAbc, upbeat } from './abc.ts'

const tune = (slug: string) => JSON.parse(readFileSync(`public/corpus/tunes/${slug}.json`, 'utf8')) as TuneRecord
const setting = (key: string) => JSON.parse(readFileSync(`public/corpus/settings/${key}.json`, 'utf8')) as PsalmSetting

describe('upbeat', () => {
  it('finds the one-beat upbeat of Crimond and Martyrdom', () => {
    expect(upbeat(tune('crimond'))).toBe(480)
    expect(upbeat(tune('martyrdom'))).toBe(480)
  })
})

describe('keySignature', () => {
  it('names keys for ABC', () => {
    expect(keySignature('E-flat major')).toEqual({ fifths: -3, abc: 'Eb' })
    expect(keySignature('F-sharp major').abc).toBe('F#')
    expect(keySignature('A minor').abc).toBe('Am')
    expect(keySignature('D-flat minor').abc).toBe('C#m')
  })
})

describe('tuneToAbc', () => {
  it('writes Psalm 23 on Crimond with the words of verse 1', () => {
    const t = tune('crimond')
    const s = setting('023')
    const { abc, sopranoHeads } = tuneToAbc(t, 0, t.key, s.stanzas[0])
    expect(abc).toContain('K:F')
    expect(abc).toContain('%%score (S A) (T B)')
    expect(abc).toContain('w: The LORD’s my _ shep-herd, _ I’ll not want.')
    expect(sopranoHeads.length).toBeGreaterThanOrEqual(t.notes.length)
    // Each line of the psalm is one line of music.
    expect(abc.match(/^\[V:S\]/gm)).toHaveLength(4)
  })

  it('writes every tune in every key without an error', () => {
    for (const slug of ['crimond', 'dundee', 'old-hundredth', 'old-hundred-twenty-fourth', 'st-cecilia', 'crofts-hundred-thirty-sixth'])
      for (const k of [-5, 0, 6]) expect(() => tuneToAbc(tune(slug), k, 'C major')).not.toThrow()
  })
})

describe('tuneToAbc on a narrow screen', () => {
  it('breaks each line of the psalm into two lines of music', () => {
    const t = tune('crimond')
    const { abc } = tuneToAbc(t, 0, t.key, undefined, true)
    expect(abc.match(/^\[V:S\]/gm)).toHaveLength(8)
  })
})
