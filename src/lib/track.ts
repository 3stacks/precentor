// Send an analytics event. The loader in public/index.html queues it until the
// tracker loads. On a preview, on localhost and on a self-hosted copy, the
// tracker never loads, so nothing leaves the browser. The native app has no
// loader, so it sends nothing.
declare global {
  interface Window {
    plausible?: (event: string, options?: { props?: Record<string, string | number> }) => void
  }
}

export function track(event: string, props?: Record<string, string | number>) {
  try {
    globalThis.window?.plausible?.(event, props ? { props } : undefined)
  } catch {
    // Analytics must never break the app.
  }
}
