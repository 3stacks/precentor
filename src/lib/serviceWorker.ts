// The web app registers the service worker that scripts/web-postbuild.mjs
// writes into dist/. The worker keeps the app and the psalms for offline use.
// The development server has no worker.
export function registerServiceWorker(): void {
  if (process.env.NODE_ENV !== 'production') return
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return
  // When a new version takes control, load the page again: the files of the old version are gone from the server.
  const updating = Boolean(navigator.serviceWorker.controller)
  let reloaded = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!updating || reloaded) return
    reloaded = true
    window.location.reload()
  })
  navigator.serviceWorker.register('/sw.js').catch(() => {
    // The app works without the worker. It is then not available offline.
  })
}
