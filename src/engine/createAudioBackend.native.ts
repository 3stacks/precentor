// Precentor: the audio backend on iOS and Android.
//
// react-native-audio-api follows the Web Audio API, so the same WebAudioBackend
// plays the organ: PeriodicWave stops, a low-pass BiquadFilter, a Convolver
// reverb and GainNode envelopes. The library has no getOutputTimestamp(), so
// the backend uses the outputLatency fallback to light each syllable.
//
// Expo Go does not contain the native module of the library. There the
// import throws, and the app uses a silent backend that only keeps time.
import type * as AudioApi from "react-native-audio-api";
import { createSilentBackend } from "./silentBackend";
import { WebAudioBackend, type AudioBackend } from "./webAudioBackend";

let api: typeof AudioApi | null | undefined;
let context: AudioApi.AudioContext | undefined;

function loadApi(): typeof AudioApi | null {
  if (api === undefined) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      api = require("react-native-audio-api") as typeof AudioApi;
    } catch {
      api = null;
    }
  }
  return api;
}

export const hasSound = (): boolean => loadApi() !== null;

export function createAudioBackend(): AudioBackend {
  const audio = loadApi();
  if (!audio) return createSilentBackend();
  if (!context || context.state === "closed") {
    // The "playback" category plays when the iPhone is on silent, as a music app does.
    audio.AudioManager.setSystemOptions({ ios: { category: "playback", mode: "default" } });
    context = new audio.AudioContext({ latencyHint: "interactive" });
  }
  return new WebAudioBackend(context as unknown as AudioContext);
}
