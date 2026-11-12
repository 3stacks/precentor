// On iOS and Android the native backend sets the audio session itself
// (createAudioBackend.native.ts), so this web fix has no work to do.
export function playThroughSilentSwitch(): void {}
