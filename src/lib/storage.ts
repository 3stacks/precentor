// Settings storage on the web: localStorage, as in the Vite app. The keys are
// the same, so a visitor keeps the tune, key and speed choices.

export const storageReady = (): Promise<void> => Promise.resolve()

export function getItem(key: string): string | null {
  try {
    return globalThis.localStorage?.getItem(key) ?? null
  } catch {
    return null
  }
}

export function setItem(key: string, value: string): void {
  try {
    globalThis.localStorage?.setItem(key, value)
  } catch {
    // The app works without storage.
  }
}
