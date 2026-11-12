// iOS mutes Web Audio while the Ring/Silent switch is on silent, because the page
// uses the "ambient" audio session. Music apps use the "playback" session, which
// ignores the switch.
//
// Safari 17 and later: navigator.audioSession.type = "playback".
// Earlier iOS: a playing <audio> element moves the page to the playback session,
// so a silent, looping one plays while the Psalm plays.

type AudioSessionNavigator = Navigator & { audioSession?: { type: string } };

let silentElement: HTMLAudioElement | undefined;

/** A WAV file with 0.1 s of silence, as a data URL. */
function silentWav(): string {
  const sampleRate = 8_000;
  const samples = sampleRate / 10;
  const bytes = new Uint8Array(44 + samples);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) bytes[offset + i] = value.charCodeAt(i);
  };
  text(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  text(8, "WAVE");
  text(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true); // 8-bit, where 128 is silence
  text(36, "data");
  view.setUint32(40, samples, true);
  bytes.fill(128, 44);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

/**
 * Let the audio play when the iPhone is on silent. Call it from the tap that
 * starts the audio: an <audio> element plays only after a user gesture.
 */
export function playThroughSilentSwitch(): void {
  const nav = globalThis.navigator as AudioSessionNavigator | undefined;
  if (nav?.audioSession) {
    if (nav.audioSession.type !== "playback") nav.audioSession.type = "playback";
    return;
  }
  if (!/iPad|iPhone|iPod/.test(nav?.userAgent ?? "") && !(nav?.platform === "MacIntel" && nav.maxTouchPoints > 1)) return;
  if (typeof Audio === "undefined") return;
  if (!silentElement) {
    silentElement = new Audio(silentWav());
    silentElement.loop = true;
    silentElement.setAttribute("x-webkit-airplay", "deny");
    // Stop it when the page is hidden, so the lock screen does not show a player.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) silentElement?.pause();
    });
  }
  silentElement.play().catch(() => {
    // Without it the audio still plays, but the silent switch mutes it.
  });
}
