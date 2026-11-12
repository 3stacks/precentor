// The paths of the app. They are the same on the web, on iOS and on Android:
//   /                    the psalms
//   /psalm/023           a psalm (023b: the second version)
//   /psalm/023?tune=dundee
//   /about
//   /about/metre         the About page, at the section on metre
//
// The Vite app used hash routes (#/psalm/023). Other apps link to those
// addresses, so hashToPath() turns an old hash route into a path.
// precentor://psalm/023 opens the same screen in the native app.

/** The key for a psalm number: 23 → "023". */
export const psalmKey = (n: number, second = false) => `${String(n).padStart(3, '0')}${second ? 'b' : ''}`

export const isPsalmKey = (key: string | undefined): key is string => /^\d{3}b?$/.test(key ?? '')

export const psalmHref = (key: string, tune?: string) => (tune ? `/psalm/${key}?tune=${encodeURIComponent(tune)}` : `/psalm/${key}`)

/**
 * The path for an old hash route, or null when the hash is not a route.
 * "#/psalm/023?tune=dundee" → "/psalm/023?tune=dundee".
 */
export function hashToPath(hash: string): string | null {
  if (!hash.startsWith('#/') && hash !== '#') return null
  const [path, query] = hash.replace(/^#\/?/, '').split('?')
  const parts = path.split('/').filter(Boolean)
  const search = query ? `?${query}` : ''
  if (parts[0] === 'psalm' && isPsalmKey(parts[1])) return `/psalm/${parts[1]}${search}`
  if (parts[0] === 'about') return parts[1] ? `/about/${parts[1]}` : '/about'
  return '/'
}
