import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock HTMLAudioElement before importing module
vi.stubGlobal('Audio', vi.fn().mockImplementation(function () {
  return {
    loop: false, volume: 0, muted: false, paused: true, src: '',
    play: vi.fn().mockResolvedValue(undefined),
    pause: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
}));

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import {
  isMusicMuted,
  toggleMusicMute,
  setMusicVolume,
  getMusicVolume,
} from '../MusicChannel';
import { MUSIC_VOLUME_DEFAULT, MUSIC_SRC_DEFAULT } from '../audioConstants';

describe('MusicChannel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(store).forEach(k => delete store[k]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isMusicMuted() returns false when nothing in localStorage', () => {
    expect(isMusicMuted()).toBe(false);
  });

  it('isMusicMuted() returns true when MUSIC_MUTE_KEY is true', () => {
    store['fws_music_muted'] = 'true';
    expect(isMusicMuted()).toBe(true);
  });

  it('isMusicMuted() migrates legacy key when new key absent', () => {
    store['threadbearer_muted'] = 'true';
    expect(isMusicMuted()).toBe(true);
  });

  it('toggleMusicMute flips muted state and persists', () => {
    const first = toggleMusicMute();
    expect(first).toBe(true);
    expect(store['fws_music_muted']).toBe('true');
    const second = toggleMusicMute();
    expect(second).toBe(false);
    expect(store['fws_music_muted']).toBe('false');
  });

  it('setMusicVolume clamps to 0–1', () => {
    setMusicVolume(2);
    expect(getMusicVolume()).toBeLessThanOrEqual(1);
    setMusicVolume(-1);
    expect(getMusicVolume()).toBeGreaterThanOrEqual(0);
  });

  it('MUSIC_VOLUME_DEFAULT is the expected value', () => {
    expect(MUSIC_VOLUME_DEFAULT).toBe(0.4);
  });

  it('MUSIC_SRC_DEFAULT is the expected path', () => {
    expect(MUSIC_SRC_DEFAULT).toBe('/audio/music/theme-drone.mp3');
  });
});
