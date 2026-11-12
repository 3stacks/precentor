// Precentor: the audio backend on the web is the browser's Web Audio API.
// createAudioBackend.native.ts is the backend on iOS and Android.
import { createWebAudioBackend, type AudioBackend } from "./webAudioBackend";

export const createAudioBackend = (): AudioBackend => createWebAudioBackend();

/** False when the app cannot make a sound and only keeps time. */
export const hasSound = (): boolean => true;
