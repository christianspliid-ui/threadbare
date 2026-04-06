import { describe, it, expect, vi, beforeEach } from 'vitest';

const createdAudios: Array<{ src: string; volume: number; ended: boolean; paused: boolean; play: ReturnType<typeof vi.fn>; currentTime: number }> = [];

vi.stubGlobal('Audio', vi.fn().mockImplementation(function (src: string) {
  const a = { src, volume: 0.6, ended: false, paused: true, currentTime: 0, play: vi.fn().mockResolvedValue(undefined) };
  createdAudios.push(a);
  return a;
}));

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
});

import { playUi, setUiVolume, getUiVolume, muteUi, unmuteUi, isUiMuted, __resetUiChannel } from '../UiChannel';

describe('UiChannel', () => {
  beforeEach(() => {
    createdAudios.length = 0;
    Object.keys(store).forEach(k => delete store[k]);
    __resetUiChannel();
  });

  it('playUi("click") creates an HTMLAudioElement and plays it', () => {
    playUi('click');
    expect(createdAudios.length).toBe(1);
    expect(createdAudios[0]?.play).toHaveBeenCalled();
  });

  it('playUi reuses pooled element if paused', () => {
    playUi('click');
    const first = createdAudios[0]!;
    first.paused = true;
    playUi('click');
    expect(createdAudios.length).toBe(1); // reused
  });

  it('playUi creates new element if pool element is playing', () => {
    playUi('click');
    const first = createdAudios[0]!;
    first.paused = false; // simulating active playback
    playUi('click');
    expect(createdAudios.length).toBe(2);
  });

  it('playUi for unknown key does nothing', () => {
    playUi('unknown_sfx');
    expect(createdAudios.length).toBe(0);
  });

  it('setUiVolume clamps to 0–1', () => {
    setUiVolume(5);
    expect(getUiVolume()).toBeLessThanOrEqual(1);
    setUiVolume(-3);
    expect(getUiVolume()).toBeGreaterThanOrEqual(0);
  });

  it('muteUi sets muted and persists', () => {
    muteUi();
    expect(isUiMuted()).toBe(true);
    expect(store['fws_ui_muted']).toBe('true');
  });

  it('unmuteUi clears muted', () => {
    muteUi();
    unmuteUi();
    expect(isUiMuted()).toBe(false);
  });
});
