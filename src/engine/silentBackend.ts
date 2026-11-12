// Precentor: a backend with a clock and no sound. Expo Go has no
// react-native-audio-api, so the native app uses this backend there. The
// words and the notes still follow the beat.
import type { AudioBackend, RuntimeAudioState, VoiceHandle } from "./webAudioBackend";

export function createSilentBackend(): AudioBackend {
  let state: RuntimeAudioState = "suspended";
  const listeners = new Set<(state: RuntimeAudioState) => void>();
  const setState = (next: RuntimeAudioState) => {
    state = next;
    for (const listener of [...listeners]) listener(next);
  };
  const clock = () => globalThis.performance.now() / 1_000;
  const none: VoiceHandle = { cancel: () => {} };
  return {
    get state() {
      return state;
    },
    now: clock,
    outputNow: clock,
    outputTimeAt: (ms) => ms / 1_000,
    resume: async () => {
      if (state !== "running") setState("running");
    },
    scheduleNote: () => none,
    startAll: () => {},
    stopAll: () => {},
    setVolume: () => {},
    onStateChange: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: async () => setState("closed"),
  };
}
