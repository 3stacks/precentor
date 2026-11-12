// Before the router starts, move an old hash route to its path:
// https://precentor.app/#/psalm/023 becomes https://precentor.app/psalm/023.
// index.ts imports this file first. The native app has no hash routes.
import { hashToPath } from './routes.ts'

if (typeof window !== 'undefined' && window.location && window.history) {
  const path = hashToPath(window.location.hash)
  if (path !== null) window.history.replaceState(null, '', path)
}
