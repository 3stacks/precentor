// A small static server for the web build in dist/. The release tests use it.
// It sends index.html for each path of the app, as Cloudflare Pages and docker/nginx.conf do.
// It sends 404 for a file that does not exist, for example /a/boot.js. Analytics exists only on Cloudflare.
// Usage: node e2e/web/serve.mjs [port]. The default port is 18180.
import { createReadStream, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve(process.env.DIST_DIR ?? 'dist')
const port = Number(process.argv[2] ?? process.env.PORT ?? 18180)

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const isFile = (path) => {
  try {
    return statSync(path).isFile()
  } catch {
    return false
  }
}

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const path = normalize(decodeURIComponent(url.pathname))
  let file = join(root, path)
  if (!file.startsWith(root)) {
    res.writeHead(403).end()
    return
  }
  if (!isFile(file)) {
    // A path with an extension is a file. A path with no extension is a screen of the app.
    if (extname(path) !== '') {
      res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found')
      return
    }
    file = join(root, 'index.html')
  }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-cache' })
  createReadStream(file).pipe(res)
}).listen(port, '127.0.0.1', () => console.log(`Serving ${root} on http://127.0.0.1:${port}`))
