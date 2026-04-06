import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAudios: Array<{ src: string; volume: number; muted: boolean; paused: boolean; loop: boolean; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }> = [];

vi.stubGlobal('Audio', vi.fn().mockImplementation(function (src: string) {
  const a = { src, volume: 0, muted: false, paused: true, loop: false, play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() };
  mockAudios.push(a);
  return a;
}));

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
});

// Patch AMBIENT_TRACKS so keys resolve to real file paths in tests
vi.mock('../audioConstants', async (importOriginal) => {
  const orig = await importOriginal() as Record<string, unknown>;
  return {
    ...orig,
    AMBIENT_TRACKS: {
      grassland: ['/audio/ambient/grassland/grassland-1.mp3'],
      forest: ['/audio/ambient/forest/forest-1.mp3'],
      city: ['/audio/ambient/city/city-1.mp3'],
      dungeon: ['/audio/ambient/dungeon/dungeon-1.mp3'],
    },
  };
});

import { pushAmbient, popAmbient, setBackgroundVolume, getBackgroundVolume, muteBackground, unmuteBackground, isBackgroundMuted } from '../BackgroundChannel';

describe('BackgroundChannel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAudios.length = 0;
    Object.keys(store).forEach(k => delete store[k]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('pushAmbient starts a new audio element for the key', () => {
    pushAmbient(0, 'grassland');
    vi.runAllTimers();
    expect(mockAudios.length).toBeGreaterThan(0);
  });

  it('pushing same priority key replaces existing entry', () => {
    pushAmbient(0, 'grassland');
    vi.runAllTimers();
    pushAmbient(0, 'forest');
    vi.runAllTimers();
    // forest should be the most recently created audio
    const lastAudio = mockAudios[mockAudios.length - 1];
    expect(lastAudio?.src).toContain('forest');
  });

  it('popAmbient at highest priority resumes lower priority', () => {
    pushAmbient(0, 'grassland');
    vi.runAllTimers();
    pushAmbient(1, 'city');
    vi.runAllTimers();
    popAmbient(1);
    vi.runAllTimers();
    // grassland audio should have been created (index 0)
    expect(mockAudios[0]?.src).toContain('grassland');
  });

  it('setBackgroundVolume clamps to 0–1', () => {
    setBackgroundVolume(2);
    expect(getBackgroundVolume()).toBeLessThanOrEqual(1);
    setBackgroundVolume(-1);
    expect(getBackgroundVolume()).toBeGreaterThanOrEqual(0);
  });

  it('muteBackground sets muted and persists', () => {
    muteBackground();
    expect(isBackgroundMuted()).toBe(true);
    expect(store['fws_bg_muted']).toBe('true');
  });

  it('unmuteBackground clears muted and persists', () => {
    muteBackground();
    unmuteBackground();
    expect(isBackgroundMuted()).toBe(false);
    expect(store['fws_bg_muted']).toBe('false');
  });

  it('pushAmbient for key with empty AMBIENT_TRACKS stays silent', () => {
    const initialCount = mockAudios.length;
    pushAmbient(0, 'wasteland'); // not in mock AMBIENT_TRACKS
    vi.runAllTimers();
    expect(mockAudios.length).toBe(initialCount); // no new audio created
  });
});
