// The web app fetches the corpus from the server, next to the app. The service
// worker keeps a copy for offline use (scripts/web-postbuild.mjs).
export async function readCorpusFile(path: string): Promise<unknown> {
  const r = await fetch(`/corpus/${path}`)
  if (!r.ok) throw new Error(`${path}: ${r.status}`)
  return r.json()
}
