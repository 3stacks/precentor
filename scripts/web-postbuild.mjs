// Finish the web build after "expo export --platform web".
//
//   node scripts/web-postbuild.mjs [dist]
//
// 1. Copy the app icon to apple-touch-icon.png, for the home screen of iOS.
// 2. Write sw.js, the service worker. It keeps the app, the psalm list and the
//    tunes for offline use when it installs. It keeps each psalm when the
//    psalm is first opened, so the install stays small. This is the same rule
//    as the service worker of the Vite app.
import { createHash } from 'node:crypto'
import { copyFileSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'

const root = join(new URL('.', import.meta.url).pathname, '..')
const dist = process.argv[2] ?? join(root, 'dist')

copyFileSync(join(root, 'assets/icon.png'), join(dist, 'apple-touch-icon.png'))

const files = []
const walk = (dir) => {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) walk(path)
    else files.push('/' + relative(dist, path).split('\\').join('/'))
  }
}
walk(dist)

const skip = (f) =>
  f.startsWith('/corpus/psalms/') ||
  f.startsWith('/corpus/settings/') ||
  // The pages for crawlers (scripts/seo.mjs). The app is index.html.
  f.startsWith('/psalm/') ||
  ['/_headers', '/_redirects', '/metadata.json', '/sw.js', '/about.html', '/privacy.html', '/sitemap.xml', '/robots.txt', '/llms.txt'].includes(f) ||
  f.endsWith('.map')
const precache = files.filter((f) => !skip(f)).sort()

// The version changes when any file in the list changes.
const hash = createHash('sha256')
for (const f of precache) hash.update(f).update(readFileSync(join(dist, f)))
const version = hash.digest('hex').slice(0, 12)

const sw = `// Precentor service worker, written by scripts/web-postbuild.mjs.
const VERSION = ${JSON.stringify(version)}
const PRECACHE = ${JSON.stringify(precache, null, 1)}
const APP = 'precentor-app-' + VERSION
const PSALMS = 'precentor-psalms'
const FONTS = 'precentor-fonts'

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(APP).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()))
})

// Remove the caches of older versions, and the caches of the Vite app.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => ![APP, PSALMS, FONTS].includes(key)).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  )
})

const cacheFirst = async (request, name) => {
  const hit = await caches.match(request)
  if (hit) return hit
  const response = await fetch(request)
  if (response.ok || response.type === 'opaque') {
    const cache = await caches.open(name)
    await cache.put(request, response.clone())
  }
  return response
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin === 'https://api.fontshare.com' || url.origin === 'https://cdn.fontshare.com') {
    event.respondWith(cacheFirst(request, FONTS))
    return
  }
  if (url.origin !== self.location.origin || url.pathname.startsWith('/a/')) return
  // Every path of the app is the same page: /psalm/023 is index.html.
  if (request.mode === 'navigate') {
    event.respondWith(caches.match('/index.html').then((hit) => hit || fetch(request)))
    return
  }
  if (url.pathname.startsWith('/corpus/psalms/') || url.pathname.startsWith('/corpus/settings/')) {
    event.respondWith(cacheFirst(request, PSALMS))
    return
  }
  event.respondWith(caches.match(request, { ignoreSearch: true }).then((hit) => hit || fetch(request)))
})
`
writeFileSync(join(dist, 'sw.js'), sw)
console.log(`web-postbuild: sw.js ${version}, ${precache.length} files to keep offline`)
