// Settings storage on iOS and Android. The player reads its settings
// synchronously, so the app loads every "precentor:" key from AsyncStorage into
// memory before the first screen (see src/app/_layout.tsx). A write goes to
// memory at once and to AsyncStorage in the background.
import AsyncStorage from '@react-native-async-storage/async-storage'

const memory = new Map<string, string>()
let loading: Promise<void> | undefined

export function storageReady(): Promise<void> {
  loading ??= (async () => {
    try {
      const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith('precentor:'))
      for (const [key, value] of await AsyncStorage.multiGet(keys)) if (value !== null) memory.set(key, value)
    } catch {
      // Start with no saved settings.
    }
  })()
  return loading
}

export const getItem = (key: string): string | null => memory.get(key) ?? null

export function setItem(key: string, value: string): void {
  memory.set(key, value)
  AsyncStorage.setItem(key, value).catch(() => {})
}
