import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("playThroughSilentSwitch", () => {
  it("puts the page in the playback audio session when the browser has one", async () => {
    const audioSession = { type: "auto" };
    vi.stubGlobal("navigator", { audioSession, userAgent: "iPhone" });
    const { playThroughSilentSwitch } = await import("../src/engine/audioSession");
    playThroughSilentSwitch();
    expect(audioSession.type).toBe("playback");
  });

  it("plays a silent, looping audio element on iOS without an audio session", async () => {
    const play = vi.fn(() => Promise.resolve());
    const made: { src: string; loop: boolean }[] = [];
    class FakeAudio {
      loop = false;
      constructor(public src: string) {
        made.push(this);
      }
      play = play;
      pause() {}
      setAttribute() {}
    }
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_7 like Mac OS X)" });
    vi.stubGlobal("Audio", FakeAudio);
    vi.stubGlobal("document", { addEventListener: () => {}, hidden: false });
    const { playThroughSilentSwitch } = await import("../src/engine/audioSession");
    playThroughSilentSwitch();
    playThroughSilentSwitch();
    expect(made).toHaveLength(1);
    expect(made[0].loop).toBe(true);
    expect(made[0].src).toMatch(/^data:audio\/wav;base64,UklGR/);
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("does nothing on other browsers without an audio session", async () => {
    const Audio = vi.fn();
    vi.stubGlobal("navigator", { userAgent: "Mozilla/5.0 (X11; Linux x86_64)", platform: "Linux" });
    vi.stubGlobal("Audio", Audio);
    const { playThroughSilentSwitch } = await import("../src/engine/audioSession");
    playThroughSilentSwitch();
    expect(Audio).not.toHaveBeenCalled();
  });
});
