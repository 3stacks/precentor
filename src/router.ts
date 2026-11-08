import { useEffect, useState } from 'react'

// Hash routes, so the app works from any static host and offline:
//   #/               the psalms
//   #/psalm/023      a psalm (023b: the second version)
//   #/psalm/023?tune=dundee
//   #/about
//   #/about/metre   the About page, at the section on metre

export type Route = { view: 'library' } | { view: 'psalm'; key: string; tune?: string } | { view: 'about'; section?: string }

export function parseRoute(hash = location.hash): Route {
  const [path, query = ''] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  if (parts[0] === 'psalm' && /^\d{3}b?$/.test(parts[1] ?? '')) {
    const tune = new URLSearchParams(query).get('tune') ?? undefined
    return { view: 'psalm', key: parts[1], tune }
  }
  if (parts[0] === 'about') return { view: 'about', section: parts[1] }
  return { view: 'library' }
}

export const psalmHref = (key: string, tune?: string) => `#/psalm/${key}${tune ? `?tune=${tune}` : ''}`

export function useRoute(): Route {
  const [route, setRoute] = useState(parseRoute)
  useEffect(() => {
    const on = () => setRoute(parseRoute())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  return route
}

/** The key for a psalm number: 23 → "023". */
export const psalmKey = (n: number, second = false) => `${String(n).padStart(3, '0')}${second ? 'b' : ''}`
