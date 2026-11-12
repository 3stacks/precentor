import { describe, expect, it } from 'vitest'
import { hashToPath, isPsalmKey, psalmHref, psalmKey } from '../src/lib/routes.ts'

describe('hashToPath', () => {
  it('moves the old hash links of other apps to paths', () => {
    expect(hashToPath('#/psalm/023')).toBe('/psalm/023')
    expect(hashToPath('#/psalm/023?tune=dundee')).toBe('/psalm/023?tune=dundee')
    expect(hashToPath('#/psalm/045b')).toBe('/psalm/045b')
    expect(hashToPath('#/about')).toBe('/about')
    expect(hashToPath('#/about/metre')).toBe('/about/metre')
    expect(hashToPath('#/')).toBe('/')
    expect(hashToPath('#')).toBe('/')
  })

  it('sends an unknown route to the psalms, and leaves other hashes alone', () => {
    expect(hashToPath('#/psalm/23')).toBe('/')
    expect(hashToPath('#/nothing')).toBe('/')
    expect(hashToPath('')).toBeNull()
    expect(hashToPath('#metre')).toBeNull()
  })
})

describe('psalm paths', () => {
  it('makes the key and the path of a psalm', () => {
    expect(psalmKey(23)).toBe('023')
    expect(psalmKey(45, true)).toBe('045b')
    expect(isPsalmKey('023b')).toBe(true)
    expect(isPsalmKey('23')).toBe(false)
    expect(psalmHref('023')).toBe('/psalm/023')
    expect(psalmHref('023', 'dundee')).toBe('/psalm/023?tune=dundee')
  })
})
