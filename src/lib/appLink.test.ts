import { describe, expect, it } from 'vitest'
import { APPS, appLink, siblingOf } from './appLink.ts'

describe('appLink', () => {
  it('opens a passage or a unit in Hearers', () => {
    expect(appLink('https://hearers.app/app/#/add/Ps.23', 'x')).toBe('hearers://add/Ps.23')
    expect(appLink('https://hearers.app/app/#/add/Ps.119.17-24', 'x')).toBe('hearers://add/Ps.119.17-24')
    expect(appLink('https://hearers.app/app/#/unit/wlc/wlc-149', 'x')).toBe('hearers://unit/wlc/wlc-149')
    expect(appLink('https://hearers.app', 'x')).toBe('hearers://')
    expect(appLink('https://hearers.app/app/', 'x')).toBe('hearers://')
  })

  it('opens a psalm in Precentor, with the tune, from a path or a hash route', () => {
    expect(appLink('https://precentor.app/psalm/023', 'x')).toBe('precentor://psalm/023')
    expect(appLink('https://precentor.app/psalm/023?tune=dundee', 'x')).toBe('precentor://psalm/023?tune=dundee')
    expect(appLink('https://precentor.app/#/psalm/023b', 'x')).toBe('precentor://psalm/023b')
    expect(appLink('https://precentor.app/#/psalm/023?tune=dundee', 'x')).toBe('precentor://psalm/023?tune=dundee')
  })

  it('opens a chapter in Haddington Bible, at the verse', () => {
    expect(appLink('https://haddingtonbible.org/psalms-23#v23-1', 'x')).toBe('haddingtonbible://psalms-23#v23-1')
    expect(appLink('https://haddingtonbible.org/1-samuel-3', 'x')).toBe('haddingtonbible://1-samuel-3')
    expect(appLink('https://haddingtonbible.org', 'x')).toBe('haddingtonbible://')
  })

  it('opens Covenant Household at the start', () => {
    expect(appLink('https://covenanthousehold.app', 'x')).toBe('covenanthousehold://')
    expect(appLink('https://covenanthousehold.app/', 'x')).toBe('covenanthousehold://')
  })

  it('keeps other pages, other sites and the app itself on the web', () => {
    expect(appLink('https://hearers.app/privacy/', 'x')).toBeUndefined()
    expect(appLink('https://precentor.app/about', 'x')).toBeUndefined()
    expect(appLink('https://haddingtonbible.org/privacy/', 'x')).toBeUndefined()
    expect(appLink('https://covenanthousehold.app/readings/', 'x')).toBeUndefined()
    expect(appLink('https://ko-fi.com/lukeboyle', 'x')).toBeUndefined()
    expect(appLink('https://precentor.app/psalm/023', 'precentor')).toBeUndefined()
    expect(appLink('http://hearers.app', 'x')).toBeUndefined()
  })
})

describe('siblingOf', () => {
  it('gives the scheme of the sibling app that a link opens', () => {
    expect(siblingOf('https://hearers.app/app/#/add/Ps.23', 'precentor')).toBe('hearers')
    expect(siblingOf('https://haddingtonbible.org/psalms-23#v23-1', 'precentor')).toBe('haddingtonbible')
    expect(siblingOf('https://covenanthousehold.app', 'precentor')).toBe('covenanthousehold')
    expect(siblingOf('https://methodforprayer.app/pray', 'precentor')).toBe('methodforprayer')
    expect(siblingOf('https://precentor.app/psalm/023?tune=dundee', 'hearers')).toBe('precentor')
  })

  it('gives undefined when appLink keeps the link on the web', () => {
    expect(siblingOf('https://hearers.app/privacy/', 'precentor')).toBeUndefined()
    expect(siblingOf('https://precentor.app/psalm/023', 'precentor')).toBeUndefined()
    expect(siblingOf('https://ko-fi.com/lukeboyle', 'precentor')).toBeUndefined()
  })
})

describe('APPS', () => {
  it('has a name for each scheme that appLink opens', () => {
    for (const url of ['https://hearers.app', 'https://precentor.app', 'https://haddingtonbible.org', 'https://covenanthousehold.app', 'https://methodforprayer.app']) {
      const scheme = siblingOf(url, 'x')
      expect(scheme && APPS[scheme]?.name).toBeTruthy()
    }
  })

  it('links only the apps that are on the App Store', () => {
    expect(APPS.precentor.appStore).toBe('https://apps.apple.com/app/id6834265380')
    expect(APPS.hearers.appStore).toBe('https://apps.apple.com/app/id6834307677')
    expect(APPS.covenanthousehold.appStore).toBe('https://apps.apple.com/app/id6834362234')
    expect(APPS.haddingtonbible.appStore).toBeUndefined()
    expect(APPS.methodforprayer.appStore).toBeUndefined()
  })
})
