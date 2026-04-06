# Ambient Sound System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three independent audio channels (Music, Background, UI) with context-sensitive ambient sound driven by terrain, location, and encounter state.

**Architecture:** Module-level singletons for each channel (matching existing `themeAudio.ts` pattern). A `useAmbientContext` hook mounted in `GameView` drives a priority stack in `BackgroundChannel`. `MusicChannel` replaces `themeAudio.ts` with the same API plus encounter track swapping.

**Tech Stack:** Browser `HTMLAudioElement`, `setInterval`-based fades, React hooks, Vitest with `vi.useFakeTimers()` for timing tests.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/audio/audioConstants.ts` | Create | All tunable constants + AMBIENT_TRACKS registry |
| `src/audio/terrainSoundKey.ts` | Create | Exhaustive terrain → sound key mapping |
| `src/audio/locationSoundKey.ts` | Create | Location subtype → sound key mapping |
| `src/audio/MusicChannel.ts` | Create | Replaces themeAudio.ts; looping music + encounter track swap |
| `src/audio/BackgroundChannel.ts` | Create | Priority stack ambient with crossfade |
| `src/audio/UiChannel.ts` | Create | Fire-and-forget SFX pool |
| `src/audio/AudioMaster.ts` | Create | Global mute/unmute across all three channels |
| `src/audio/__tests__/terrainSoundKey.test.ts` | Create | Exhaustive terrain coverage test |
| `src/audio/__tests__/locationSoundKey.test.ts` | Create | Location coverage test |
| `src/audio/__tests__/MusicChannel.test.ts` | Create | MusicChannel unit tests |
| `src/audio/__tests__/BackgroundChannel.test.ts` | Create | Priority stack + crossfade tests |
| `src/audio/__tests__/UiChannel.test.ts` | Create | Pool and play tests |
| `src/audio/themeAudio.ts` | Delete | Replaced by MusicChannel |
| `src/components/StartPage/useThemeMusic.ts` | Modify | Update imports from themeAudio → MusicChannel |
| `src/components/Game/GameView.tsx` | Modify | Add cameraCenter state, mount useAmbientContext, wire settings |
| `src/components/HexMapV2/HexMapV2.tsx` | Modify | Add onCameraCenterHex prop + zoom.ambient handler |
| `src/components/Game/SettingsPanel.tsx` | Modify | Add audio volume sliders + master mute toggle |
| `src/components/Game/hooks/useAmbientContext.ts` | Create | Wires all four context sources to BackgroundChannel |
| `src/types/encounter.ts` | Modify | Add backgroundTrack?, musicTrack? to EncounterTemplate |
| `src/components/StartPage/startPageConstants.ts` | Modify | Remove audio constants (moved to audioConstants.ts) |
| `public/audio/music/theme-drone.mp3` | Move | From `public/audio/theme-drone.mp3` |
| Test files (3 GameView tests) | Modify | Update vi.mock path from themeAudio → MusicChannel |

---

## Task 1: audioConstants.ts

**Files:**
- Create: `src/audio/audioConstants.ts`

- [ ] **Step 1: Create the constants file**

```typescript
// src/audio/audioConstants.ts

export const MUSIC_VOLUME_DEFAULT = 0.4;
export const BACKGROUND_VOLUME_DEFAULT = 0.35;
export const UI_VOLUME_DEFAULT = 0.6;
export const MUSIC_FADE_IN_MS = 3000;
export const MUSIC_FADE_OUT_MS = 1500;
export const AMBIENT_CROSSFADE_MS = 2000;
export const AMBIENT_CONTEXT_DEBOUNCE_MS = 300;
export const MUSIC_MUTE_KEY = 'fws_music_muted';
export const BACKGROUND_MUTE_KEY = 'fws_bg_muted';
export const UI_MUTE_KEY = 'fws_ui_muted';
/** Legacy key from themeAudio.ts — read during migration to preserve user setting. */
export const LEGACY_MUSIC_MUTE_KEY = 'threadbearer_muted';

export const MUSIC_SRC_DEFAULT = '/audio/music/theme-drone.mp3';

/**
 * Maps each ambient sound key to an ordered list of audio file URLs.
 * BackgroundChannel picks randomly from this list on context switch.
 * Empty arrays = channel stays silent (graceful degradation until assets ship).
 * Add file paths here when audio assets are dropped into public/audio/ambient/.
 */
export const AMBIENT_TRACKS: Record<string, string[]> = {
  water:      [],
  grassland:  [],
  forest:     [],
  swamp:      [],
  mountains:  [],
  desert:     [],
  tundra:     [],
  volcanic:   [],
  wasteland:  [],
  city:       [],
  settlement: [],
  fortress:   [],
  sacred:     [],
  dungeon:    [],
  danger:     [],
};
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/audioConstants.ts
git commit -m "feat(audio): add audioConstants.ts with channel volumes, fades, and AMBIENT_TRACKS registry"
```

---

## Task 2: terrainSoundKey.ts + tests

**Files:**
- Create: `src/audio/terrainSoundKey.ts`
- Create: `src/audio/__tests__/terrainSoundKey.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/audio/__tests__/terrainSoundKey.test.ts
import { describe, it, expect } from 'vitest';
import { terrainToSoundKey } from '../terrainSoundKey';
import type { TerrainType } from '../../types';

const ALL_TERRAIN_TYPES: TerrainType[] = [
  'ocean', 'deep_ocean', 'tropical_ocean', 'coastal_shallows', 'coast', 'lake', 'river', 'reef',
  'grassland', 'farmland', 'savanna', 'steppe', 'floodplain',
  'temperate_forest', 'dense_forest', 'boreal_forest', 'jungle',
  'tropical_forest', 'evergreen_forest', 'light_forest', 'dead_forest',
  'swamp', 'marsh', 'moor_bog',
  'hills', 'mountains', 'high_mountains', 'plateau', 'badlands', 'mountain_pass',
  'forested_hills',
  'great_home_trees', 'broken_lands', 'oasis',
  'desert', 'rocky_desert', 'sand_dunes', 'tundra', 'glacier', 'volcano',
  'arctic', 'snow_fields',
];

const VALID_SOUND_KEYS = new Set([
  'water', 'grassland', 'forest', 'swamp', 'mountains',
  'desert', 'tundra', 'volcanic', 'wasteland',
]);

describe('terrainToSoundKey', () => {
  it('maps every TerrainType to a valid sound key', () => {
    for (const terrain of ALL_TERRAIN_TYPES) {
      const key = terrainToSoundKey(terrain);
      expect(VALID_SOUND_KEYS.has(key), `${terrain} → "${key}" is not a valid sound key`).toBe(true);
    }
  });

  it('maps water terrains to water', () => {
    expect(terrainToSoundKey('ocean')).toBe('water');
    expect(terrainToSoundKey('lake')).toBe('water');
    expect(terrainToSoundKey('reef')).toBe('water');
  });

  it('maps forest terrains to forest', () => {
    expect(terrainToSoundKey('jungle')).toBe('forest');
    expect(terrainToSoundKey('boreal_forest')).toBe('forest');
    expect(terrainToSoundKey('great_home_trees')).toBe('forest');
  });

  it('maps desert terrains to desert', () => {
    expect(terrainToSoundKey('sand_dunes')).toBe('desert');
    expect(terrainToSoundKey('badlands')).toBe('desert');
  });

  it('maps cold terrains to tundra', () => {
    expect(terrainToSoundKey('arctic')).toBe('tundra');
    expect(terrainToSoundKey('glacier')).toBe('tundra');
  });

  it('maps volcano to volcanic', () => {
    expect(terrainToSoundKey('volcano')).toBe('volcanic');
  });

  it('falls back to grassland with a warning for unknown terrain', () => {
    const warned: string[] = [];
    const orig = console.warn;
    console.warn = (...args: unknown[]) => warned.push(String(args[0]));
    const result = terrainToSoundKey('unknown_terrain' as TerrainType);
    console.warn = orig;
    expect(result).toBe('grassland');
    expect(warned.length).toBeGreaterThan(0);
    expect(warned[0]).toContain('unknown_terrain');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/audio/__tests__/terrainSoundKey.test.ts
```
Expected: FAIL — `terrainSoundKey` not found.

- [ ] **Step 3: Implement terrainSoundKey.ts**

```typescript
// src/audio/terrainSoundKey.ts
import type { TerrainType } from '../types';

const TERRAIN_TO_SOUND_KEY: Record<TerrainType, string> = {
  ocean: 'water', deep_ocean: 'water', tropical_ocean: 'water',
  coastal_shallows: 'water', coast: 'water', lake: 'water', river: 'water', reef: 'water',
  grassland: 'grassland', farmland: 'grassland', savanna: 'grassland',
  steppe: 'grassland', floodplain: 'grassland', oasis: 'grassland',
  light_forest: 'forest', temperate_forest: 'forest', dense_forest: 'forest',
  boreal_forest: 'forest', tropical_forest: 'forest', jungle: 'forest',
  evergreen_forest: 'forest', great_home_trees: 'forest', dead_forest: 'wasteland',
  marsh: 'swamp', swamp: 'swamp', moor_bog: 'swamp',
  hills: 'mountains', forested_hills: 'mountains', mountains: 'mountains',
  high_mountains: 'mountains', plateau: 'mountains', mountain_pass: 'mountains',
  desert: 'desert', rocky_desert: 'desert', sand_dunes: 'desert', badlands: 'desert',
  tundra: 'tundra', snow_fields: 'tundra', glacier: 'tundra', arctic: 'tundra',
  volcano: 'volcanic',
  broken_lands: 'wasteland',
};

export function terrainToSoundKey(terrain: TerrainType): string {
  const key = TERRAIN_TO_SOUND_KEY[terrain];
  if (!key) {
    console.warn(`[audio] No sound key for terrain type: ${terrain}. Falling back to grassland.`);
    return 'grassland';
  }
  return key;
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/audio/__tests__/terrainSoundKey.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/terrainSoundKey.ts src/audio/__tests__/terrainSoundKey.test.ts
git commit -m "feat(audio): add terrain → sound key mapping with exhaustive coverage"
```

---

## Task 3: locationSoundKey.ts + tests

**Files:**
- Create: `src/audio/locationSoundKey.ts`
- Create: `src/audio/__tests__/locationSoundKey.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/audio/__tests__/locationSoundKey.test.ts
import { describe, it, expect } from 'vitest';
import { locationToSoundKey } from '../locationSoundKey';
import type { LocationSubtype } from '../../types';

const MAPPED_SUBTYPES: Array<[LocationSubtype, string]> = [
  ['city', 'city'], ['capital', 'city'],
  ['hamlet', 'settlement'], ['town', 'settlement'],
  ['castle', 'fortress'], ['fort', 'fortress'], ['tower', 'fortress'],
  ['temple', 'sacred'], ['shrine', 'sacred'], ['healing_spring', 'sacred'],
  ['standing_stones', 'sacred'], ['ley_nexus', 'sacred'],
  ['fey_crossing', 'sacred'], ['living_archive', 'sacred'],
  ['cavern', 'dungeon'], ['ruins', 'dungeon'], ['ruined_tower', 'dungeon'],
  ['ruined_city', 'dungeon'], ['ruined_village', 'dungeon'],
  ['crystal_cavern', 'dungeon'], ['ancient_vault', 'dungeon'], ['shadow_hollow', 'dungeon'],
  ['sacrifice_site', 'danger'], ['haunted_ground', 'danger'],
  ['corruption_zone', 'danger'], ['nest', 'danger'],
  ['lair', 'danger'], ['cleared_lair', 'danger'], ['battleground', 'danger'],
];

const FALLBACK_SUBTYPES: LocationSubtype[] = [
  'mining', 'farmland', 'camp', 'oasis', 'unexplored_poi', 'grove',
  'hot_spring', 'shipwreck', 'ancient_road', 'monument',
  'gem_deposit', 'golden_grove', 'iron_seep', 'pearl_shoal',
  'sunken_treasury', 'herb_garden', 'fossil_bed', 'glowcap_hollow',
  'master_forge', 'convergence', 'time_scar', 'wilderness',
];

describe('locationToSoundKey', () => {
  it.each(MAPPED_SUBTYPES)('maps %s to %s', (subtype, expected) => {
    expect(locationToSoundKey(subtype)).toBe(expected);
  });

  it.each(FALLBACK_SUBTYPES)('returns null for fallback subtype %s', (subtype) => {
    expect(locationToSoundKey(subtype)).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/audio/__tests__/locationSoundKey.test.ts
```
Expected: FAIL — `locationSoundKey` not found.

- [ ] **Step 3: Implement locationSoundKey.ts**

```typescript
// src/audio/locationSoundKey.ts
import type { LocationSubtype } from '../types';

const LOCATION_TO_SOUND_KEY: Partial<Record<LocationSubtype, string>> = {
  city: 'city', capital: 'city',
  hamlet: 'settlement', town: 'settlement',
  castle: 'fortress', fort: 'fortress', tower: 'fortress',
  temple: 'sacred', shrine: 'sacred', healing_spring: 'sacred',
  standing_stones: 'sacred', ley_nexus: 'sacred',
  fey_crossing: 'sacred', living_archive: 'sacred',
  cavern: 'dungeon', ruins: 'dungeon', ruined_tower: 'dungeon',
  ruined_city: 'dungeon', ruined_village: 'dungeon',
  crystal_cavern: 'dungeon', ancient_vault: 'dungeon', shadow_hollow: 'dungeon',
  sacrifice_site: 'danger', haunted_ground: 'danger',
  corruption_zone: 'danger', nest: 'danger',
  lair: 'danger', cleared_lair: 'danger', battleground: 'danger',
};

/**
 * Returns a sound key for the given location subtype,
 * or null if it should fall back to the terrain ambient.
 */
export function locationToSoundKey(subtype: LocationSubtype): string | null {
  return LOCATION_TO_SOUND_KEY[subtype] ?? null;
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/audio/__tests__/locationSoundKey.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/locationSoundKey.ts src/audio/__tests__/locationSoundKey.test.ts
git commit -m "feat(audio): add location subtype → sound key mapping"
```

---

## Task 4: MusicChannel.ts + tests

**Files:**
- Create: `src/audio/MusicChannel.ts`
- Create: `src/audio/__tests__/MusicChannel.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/audio/__tests__/MusicChannel.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock HTMLAudioElement before importing module
const mockAudio = {
  loop: false, volume: 0, muted: false, paused: true,
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
};
vi.stubGlobal('Audio', vi.fn(() => ({ ...mockAudio, play: vi.fn().mockResolvedValue(undefined), pause: vi.fn() })));

// Mock localStorage
const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
});

import {
  playMusic, resumeMusic, isMusicPlaying, isMusicMuted,
  toggleMusicMute, setMusicVolume, getMusicVolume,
  swapMusicTrack, restoreMusicDefault,
} from '../MusicChannel';
import { MUSIC_VOLUME_DEFAULT, MUSIC_SRC_DEFAULT } from '../audioConstants';

describe('MusicChannel', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.keys(store).forEach(k => delete store[k]);
    // Reset module state between tests by re-importing (vitest module isolation)
    vi.resetModules();
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/audio/__tests__/MusicChannel.test.ts
```
Expected: FAIL — `MusicChannel` not found.

- [ ] **Step 3: Implement MusicChannel.ts**

```typescript
// src/audio/MusicChannel.ts
/**
 * Module-level music channel singleton.
 * Replaces themeAudio.ts — same fade/mute/play/pause API plus track swapping for encounters.
 * Lives outside React so it survives component mounts/unmounts.
 */
import {
  MUSIC_VOLUME_DEFAULT, MUSIC_FADE_IN_MS, MUSIC_FADE_OUT_MS,
  MUSIC_MUTE_KEY, LEGACY_MUSIC_MUTE_KEY, MUSIC_SRC_DEFAULT,
} from './audioConstants';

let audio: HTMLAudioElement | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let currentSrc = MUSIC_SRC_DEFAULT;

function clearFade(): void {
  if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
}

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio(currentSrc);
    audio.loop = true;
    audio.volume = 0;
    audio.muted = isMusicMuted();
  }
  return audio;
}

export function playMusic(): void {
  const a = getAudio();
  if (!a.paused) return;
  a.volume = 0;
  a.play().catch(() => {});
  clearFade();
  const stepInterval = 50;
  const steps = MUSIC_FADE_IN_MS / stepInterval;
  const increment = MUSIC_VOLUME_DEFAULT / steps;
  fadeInterval = setInterval(() => {
    if (!audio) { clearFade(); return; }
    if (audio.volume >= MUSIC_VOLUME_DEFAULT - increment) {
      audio.volume = MUSIC_VOLUME_DEFAULT;
      clearFade();
    } else {
      audio.volume = Math.min(audio.volume + increment, MUSIC_VOLUME_DEFAULT);
    }
  }, stepInterval);
}

export function resumeMusic(): void {
  const a = getAudio();
  if (!a.paused) return;
  if (a.volume <= 0.01) a.volume = MUSIC_VOLUME_DEFAULT;
  a.play().catch(() => {});
}

export function fadeOutMusic(): Promise<void> {
  const a = audio;
  if (!a || a.paused) return Promise.resolve();
  const startVolume = a.volume;
  if (startVolume <= 0) { a.pause(); return Promise.resolve(); }
  clearFade();
  return new Promise<void>((resolve) => {
    const stepInterval = 50;
    const steps = MUSIC_FADE_OUT_MS / stepInterval;
    const decrement = startVolume / steps;
    fadeInterval = setInterval(() => {
      if (!audio) { clearFade(); resolve(); return; }
      if (audio.volume <= decrement + 0.01) {
        audio.volume = 0; audio.pause(); clearFade(); resolve();
      } else {
        audio.volume = Math.max(0, audio.volume - decrement);
      }
    }, stepInterval);
  });
}

export function isMusicPlaying(): boolean {
  return audio !== null && !audio.paused;
}

export function isMusicMuted(): boolean {
  const explicit = localStorage.getItem(MUSIC_MUTE_KEY);
  if (explicit !== null) return explicit === 'true';
  return localStorage.getItem(LEGACY_MUSIC_MUTE_KEY) === 'true';
}

export function toggleMusicMute(): boolean {
  const next = !isMusicMuted();
  localStorage.setItem(MUSIC_MUTE_KEY, String(next));
  const a = getAudio();
  a.muted = next;
  if (!next && a.paused) {
    a.volume = MUSIC_VOLUME_DEFAULT;
    a.play().catch(() => {});
  }
  return next;
}

export function setMusicVolume(v: number): void {
  const clamped = Math.max(0, Math.min(1, v));
  if (audio && !audio.muted) audio.volume = clamped;
}

export function getMusicVolume(): number {
  return audio?.volume ?? MUSIC_VOLUME_DEFAULT;
}

export function swapMusicTrack(src: string): void {
  currentSrc = src;
  if (!audio) return;
  const wasPlaying = !audio.paused;
  const vol = audio.volume;
  audio.pause();
  audio = new Audio(src);
  audio.loop = true;
  audio.volume = vol;
  audio.muted = isMusicMuted();
  if (wasPlaying) audio.play().catch(() => {});
}

export function restoreMusicDefault(): void {
  swapMusicTrack(MUSIC_SRC_DEFAULT);
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/audio/__tests__/MusicChannel.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/MusicChannel.ts src/audio/__tests__/MusicChannel.test.ts
git commit -m "feat(audio): add MusicChannel singleton with fade, mute, volume, and track swap"
```

---

## Task 5: BackgroundChannel.ts + tests

**Files:**
- Create: `src/audio/BackgroundChannel.ts`
- Create: `src/audio/__tests__/BackgroundChannel.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/audio/__tests__/BackgroundChannel.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockAudios: Array<{ volume: number; muted: boolean; paused: boolean; loop: boolean; play: ReturnType<typeof vi.fn>; pause: ReturnType<typeof vi.fn> }> = [];

vi.stubGlobal('Audio', vi.fn((src: string) => {
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
    vi.resetModules();
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
    pushAmbient(0, 'forest');
    vi.runAllTimers();
    // forest should be the active key
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
    // grassland audio should have been started (index 0)
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/audio/__tests__/BackgroundChannel.test.ts
```
Expected: FAIL — `BackgroundChannel` not found.

- [ ] **Step 3: Implement BackgroundChannel.ts**

```typescript
// src/audio/BackgroundChannel.ts
/**
 * Context-driven ambient channel with priority stack and crossfade.
 * Priority 0 = terrain (always active), 1 = chronicle, 2 = location detail, 3 = encounter.
 * Higher priority wins. When popped, lower priority resumes with crossfade.
 */
import {
  BACKGROUND_VOLUME_DEFAULT, AMBIENT_CROSSFADE_MS,
  BACKGROUND_MUTE_KEY, AMBIENT_TRACKS,
} from './audioConstants';

/** priority → sound key */
const stack = new Map<number, string>();
let currentAudio: HTMLAudioElement | null = null;
let currentKey: string | null = null;
let fadeInterval: ReturnType<typeof setInterval> | null = null;
let _volume: number = BACKGROUND_VOLUME_DEFAULT;
let _muted: boolean = localStorage.getItem(BACKGROUND_MUTE_KEY) === 'true';

function clearFade(): void {
  if (fadeInterval !== null) { clearInterval(fadeInterval); fadeInterval = null; }
}

function pickFile(key: string): string | null {
  const tracks = AMBIENT_TRACKS[key];
  if (!tracks || tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)]!;
}

function startInTrack(key: string, src: string, fadeDurationMs: number): void {
  const stepInterval = 50;
  const inAudio = new Audio(src);
  inAudio.loop = true;
  inAudio.volume = 0;
  inAudio.muted = _muted;
  inAudio.play().catch(() => {});
  currentAudio = inAudio;
  const steps = fadeDurationMs / stepInterval;
  const increment = steps > 0 ? _volume / steps : _volume;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    if (!inAudio || key !== currentKey) { clearFade(); return; }
    inAudio.volume = Math.min(_volume, increment * step);
    if (step >= steps) { inAudio.volume = _volume; clearFade(); }
  }, stepInterval);
}

function crossfadeTo(key: string): void {
  if (key === currentKey) return;
  const halfMs = AMBIENT_CROSSFADE_MS / 2;
  const stepInterval = 50;
  const src = pickFile(key);
  currentKey = key;

  const outAudio = currentAudio;
  clearFade();

  if (!outAudio || outAudio.paused || outAudio.volume <= 0) {
    if (src) startInTrack(key, src, halfMs);
    else { currentAudio = null; }
    return;
  }

  // Fade out current, then fade in new
  const startVol = outAudio.volume;
  const steps = halfMs / stepInterval;
  const decrement = steps > 0 ? startVol / steps : startVol;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    outAudio.volume = Math.max(0, startVol - decrement * step);
    if (step >= steps) {
      outAudio.pause();
      clearFade();
      if (src && key === currentKey) startInTrack(key, src, halfMs);
      else currentAudio = null;
    }
  }, stepInterval);
}

function resolveTop(): string | null {
  if (stack.size === 0) return null;
  return stack.get(Math.max(...stack.keys())) ?? null;
}

export function pushAmbient(priority: number, key: string): void {
  stack.set(priority, key);
  const top = resolveTop();
  if (top) crossfadeTo(top);
}

export function popAmbient(priority: number): void {
  stack.delete(priority);
  const top = resolveTop();
  if (top) {
    crossfadeTo(top);
    return;
  }
  // No entries left — fade out and stop
  const out = currentAudio;
  currentKey = null;
  clearFade();
  if (!out || out.paused) { currentAudio = null; return; }
  const stepInterval = 50;
  const halfMs = AMBIENT_CROSSFADE_MS / 2;
  const steps = halfMs / stepInterval;
  const startVol = out.volume;
  const decrement = steps > 0 ? startVol / steps : startVol;
  let step = 0;
  fadeInterval = setInterval(() => {
    step++;
    out.volume = Math.max(0, startVol - decrement * step);
    if (step >= steps) { out.pause(); currentAudio = null; clearFade(); }
  }, stepInterval);
}

export function setBackgroundVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  if (currentAudio && !_muted) currentAudio.volume = _volume;
}

export function getBackgroundVolume(): number { return _volume; }

export function muteBackground(): void {
  _muted = true;
  localStorage.setItem(BACKGROUND_MUTE_KEY, 'true');
  if (currentAudio) currentAudio.muted = true;
}

export function unmuteBackground(): void {
  _muted = false;
  localStorage.setItem(BACKGROUND_MUTE_KEY, 'false');
  if (currentAudio) currentAudio.muted = false;
}

export function isBackgroundMuted(): boolean { return _muted; }
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/audio/__tests__/BackgroundChannel.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/BackgroundChannel.ts src/audio/__tests__/BackgroundChannel.test.ts
git commit -m "feat(audio): add BackgroundChannel with priority stack and crossfade"
```

---

## Task 6: UiChannel.ts + tests

**Files:**
- Create: `src/audio/UiChannel.ts`
- Create: `src/audio/__tests__/UiChannel.test.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// src/audio/__tests__/UiChannel.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

const createdAudios: Array<{ src: string; volume: number; ended: boolean; paused: boolean; play: ReturnType<typeof vi.fn>; currentTime: number }> = [];

vi.stubGlobal('Audio', vi.fn((src: string) => {
  const a = { src, volume: 0.6, ended: false, paused: true, currentTime: 0, play: vi.fn().mockResolvedValue(undefined) };
  createdAudios.push(a);
  return a;
}));

const store: Record<string, string> = {};
vi.stubGlobal('localStorage', {
  getItem: (k: string) => store[k] ?? null,
  setItem: (k: string, v: string) => { store[k] = v; },
});

import { playUi, setUiVolume, getUiVolume, muteUi, unmuteUi, isUiMuted } from '../UiChannel';

describe('UiChannel', () => {
  beforeEach(() => {
    createdAudios.length = 0;
    Object.keys(store).forEach(k => delete store[k]);
    vi.resetModules();
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
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx vitest run src/audio/__tests__/UiChannel.test.ts
```
Expected: FAIL — `UiChannel` not found.

- [ ] **Step 3: Implement UiChannel.ts**

```typescript
// src/audio/UiChannel.ts
/**
 * Fire-and-forget UI sound effects channel.
 * Maintains a small pool of HTMLAudioElement instances per key.
 * play(key) fires immediately and returns — no await needed.
 */
import { UI_VOLUME_DEFAULT, UI_MUTE_KEY } from './audioConstants';

const SRC_MAP: Record<string, string> = {
  click:   '/audio/ui/click.mp3',
  confirm: '/audio/ui/confirm.mp3',
  cancel:  '/audio/ui/cancel.mp3',
};

const pools = new Map<string, HTMLAudioElement[]>();
let _volume: number = UI_VOLUME_DEFAULT;
let _muted: boolean = localStorage.getItem(UI_MUTE_KEY) === 'true';

function getOrCreate(key: string): HTMLAudioElement | null {
  const src = SRC_MAP[key];
  if (!src) return null;
  const pool = pools.get(key) ?? [];
  const free = pool.find(a => a.ended || a.paused);
  if (free) { free.currentTime = 0; return free; }
  const el = new Audio(src);
  el.volume = _muted ? 0 : _volume;
  pool.push(el);
  pools.set(key, pool);
  return el;
}

export function playUi(key: string): void {
  const el = getOrCreate(key);
  if (!el) return;
  el.volume = _muted ? 0 : _volume;
  el.play().catch(() => {});
}

export function setUiVolume(v: number): void {
  _volume = Math.max(0, Math.min(1, v));
  for (const pool of pools.values())
    for (const el of pool) if (!_muted) el.volume = _volume;
}

export function getUiVolume(): number { return _volume; }

export function muteUi(): void {
  _muted = true;
  localStorage.setItem(UI_MUTE_KEY, 'true');
  for (const pool of pools.values())
    for (const el of pool) el.volume = 0;
}

export function unmuteUi(): void {
  _muted = false;
  localStorage.setItem(UI_MUTE_KEY, 'false');
  for (const pool of pools.values())
    for (const el of pool) el.volume = _volume;
}

export function isUiMuted(): boolean { return _muted; }
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npx vitest run src/audio/__tests__/UiChannel.test.ts
```
Expected: all PASS.

- [ ] **Step 5: Commit**

```bash
git add src/audio/UiChannel.ts src/audio/__tests__/UiChannel.test.ts
git commit -m "feat(audio): add UiChannel fire-and-forget SFX pool"
```

---

## Task 7: AudioMaster.ts

**Files:**
- Create: `src/audio/AudioMaster.ts`

- [ ] **Step 1: Create AudioMaster.ts**

```typescript
// src/audio/AudioMaster.ts
/**
 * Global mute/unmute across all three audio channels.
 * Used by the settings panel master mute toggle.
 */
import { toggleMusicMute, isMusicMuted } from './MusicChannel';
import { muteBackground, unmuteBackground, isBackgroundMuted } from './BackgroundChannel';
import { muteUi, unmuteUi, isUiMuted } from './UiChannel';

export function muteAll(): void {
  if (!isMusicMuted()) toggleMusicMute();
  muteBackground();
  muteUi();
}

export function unmuteAll(): void {
  if (isMusicMuted()) toggleMusicMute();
  unmuteBackground();
  unmuteUi();
}

export function isAllMuted(): boolean {
  return isMusicMuted() && isBackgroundMuted() && isUiMuted();
}
```

- [ ] **Step 2: Commit**

```bash
git add src/audio/AudioMaster.ts
git commit -m "feat(audio): add AudioMaster global mute/unmute utility"
```

---

## Task 8: Migrate themeAudio.ts → MusicChannel.ts

**Files:**
- Modify: `src/components/StartPage/useThemeMusic.ts`
- Modify: `src/components/Game/GameView.tsx`
- Modify: `src/components/StartPage/startPageConstants.ts`
- Modify: `src/components/Game/__tests__/GameView-debug.test.tsx`
- Modify: `src/components/Game/__tests__/GameView-interaction.test.tsx`
- Modify: `src/components/Game/__tests__/GameView-progressive.test.tsx`
- Delete: `src/audio/themeAudio.ts`
- Move: `public/audio/theme-drone.mp3` → `public/audio/music/theme-drone.mp3`

- [ ] **Step 1: Update useThemeMusic.ts imports**

Open `src/components/StartPage/useThemeMusic.ts`. Replace this import block:

```typescript
import {
  playTheme,
  fadeOutTheme,
  isThemeMuted,
  toggleThemeMute,
  setThemeVolume,
} from '../../audio/themeAudio';
```

With:

```typescript
import {
  playMusic as playTheme,
  fadeOutMusic as fadeOutTheme,
  isMusicMuted as isThemeMuted,
  toggleMusicMute as toggleThemeMute,
  setMusicVolume as setThemeVolume,
} from '../../audio/MusicChannel';
```

(The alias approach keeps the rest of useThemeMusic.ts unchanged.)

- [ ] **Step 2: Update GameView.tsx import**

Open `src/components/Game/GameView.tsx`. Find the import:
```typescript
import { resumeTheme } from '../../audio/themeAudio';
```
Replace with:
```typescript
import { resumeMusic as resumeTheme } from '../../audio/MusicChannel';
```

- [ ] **Step 3: Update the three test mocks**

In each of these three files, find:
```typescript
vi.mock('../../../audio/themeAudio', () => ({
  resumeTheme: vi.fn(),
  fadeOutTheme: vi.fn().mockResolvedValue(undefined),
  playTheme: vi.fn(),
}));
```
Replace with:
```typescript
vi.mock('../../../audio/MusicChannel', () => ({
  resumeMusic: vi.fn(),
  fadeOutMusic: vi.fn().mockResolvedValue(undefined),
  playMusic: vi.fn(),
}));
```
Files to update:
- `src/components/Game/__tests__/GameView-debug.test.tsx`
- `src/components/Game/__tests__/GameView-interaction.test.tsx`
- `src/components/Game/__tests__/GameView-progressive.test.tsx`

Also update the import in `GameView.tsx` call site: the alias `resumeTheme` is now `resumeMusic` aliased. The call at line 164 (`resumeTheme()`) stays as-is because of the alias.

- [ ] **Step 4: Remove audio constants from startPageConstants.ts**

Open `src/components/StartPage/startPageConstants.ts`. Remove these five lines:
```typescript
export const THEME_MUSIC_SRC = '/audio/theme-drone.mp3';
export const THEME_VOLUME_DEFAULT = 0.4;
export const THEME_FADE_IN_MS = 3000;
export const THEME_FADE_OUT_MS = 1500;
export const THEME_MUTE_STORAGE_KEY = 'threadbearer_muted';
```
These constants are now in `audioConstants.ts`.

- [ ] **Step 5: Delete themeAudio.ts**

```bash
rm src/audio/themeAudio.ts
```

- [ ] **Step 6: Move the audio file**

```bash
mkdir -p public/audio/music
mv public/audio/theme-drone.mp3 public/audio/music/theme-drone.mp3
```

- [ ] **Step 7: Run all tests**

```bash
npm test
```
Expected: all tests pass. If `startPageConstants.ts` removals cause errors, check which files imported those constants and update them to import from `audioConstants.ts`.

- [ ] **Step 8: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "refactor(audio): replace themeAudio.ts with MusicChannel, move theme-drone.mp3 to /audio/music/"
```

---

## Task 9: Add onCameraCenterHex to HexMapV2

**Files:**
- Modify: `src/components/HexMapV2/HexMapV2.tsx`

- [ ] **Step 1: Add the prop to HexMapV2Props**

In `src/components/HexMapV2/HexMapV2.tsx`, find `HexMapV2Props` interface (line ~239). Add after `moveDestinationHex`:

```typescript
/** Called with the hex at the camera center on zoom/pan. Debounced at AMBIENT_CONTEXT_DEBOUNCE_MS. */
onCameraCenterHex?: (hex: HexCoord) => void;
```

- [ ] **Step 2: Add the prop ref inside the component**

After the existing ref declarations (around line 476), add:

```typescript
const onCameraCenterHexRef = useRef<((hex: HexCoord) => void) | undefined>(undefined);
```

- [ ] **Step 3: Keep the ref in sync with the prop**

After the block that keeps other refs in sync (around line 480), add:

```typescript
onCameraCenterHexRef.current = onCameraCenterHex;
```

- [ ] **Step 4: Destructure the new prop**

In the `forwardRef` props destructuring (line ~411), add `onCameraCenterHex` alongside `overlayOpen`:

```typescript
{ tiles, cols, rows, seed = 42, selectedHex, onHexClick, onHexHover, onAgentClick, onArmyClick, riverPaths, lakeIds, regionData, locations, anomalies, roadPaths, agents, armies, battles, threadLines, activityIcons, activeTugs, attentionRatio = 1.0, visibilityMap, fogEnabled = false, showOrganicShore = true, overlayOpen = false, moveDestinationHex, onCameraCenterHex },
```

- [ ] **Step 5: Add the zoom.ambient handler**

In the zoom setup block (around line 888, after `zoom.on('zoom.follow', ...)`), add:

```typescript
// Fire camera-center hex callback for ambient audio context (debounced)
let cameraCenterDebounce: ReturnType<typeof setTimeout> | null = null;
zoom.on('zoom.ambient', (event: d3.D3ZoomEvent<HTMLCanvasElement, unknown>) => {
  if (!onCameraCenterHexRef.current) return;
  if (cameraCenterDebounce) clearTimeout(cameraCenterDebounce);
  cameraCenterDebounce = setTimeout(() => {
    const t = event.transform;
    const cx = -t.x / t.k;
    const cy = t.y / t.k;
    const hex = worldToHex(cx, cy, HEX_CONSTANTS.HEX_SIZE);
    onCameraCenterHexRef.current?.(hex);
  }, AMBIENT_CONTEXT_DEBOUNCE_MS);
});
```

- [ ] **Step 6: Add the cleanup for the debounce timer**

In the existing destroy/cleanup block (around line 1024, where `zoom.on('zoom.labels', null)` etc. are cleared), add:

```typescript
zoom.on('zoom.ambient', null);
if (cameraCenterDebounce) clearTimeout(cameraCenterDebounce);
```

- [ ] **Step 7: Add missing imports**

At the top of `HexMapV2.tsx`, ensure `worldToHex` and `AMBIENT_CONTEXT_DEBOUNCE_MS` are imported:

```typescript
import { worldToHex } from '../../lib/worldPosition';
import { AMBIENT_CONTEXT_DEBOUNCE_MS } from '../../audio/audioConstants';
```

- [ ] **Step 8: Run tests and type-check**

```bash
npm test && npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 9: Commit**

```bash
git add src/components/HexMapV2/HexMapV2.tsx
git commit -m "feat(hexmap): add onCameraCenterHex callback prop for ambient audio context"
```

---

## Task 10: Add encounter audio fields to EncounterTemplate

**Files:**
- Modify: `src/types/encounter.ts`

- [ ] **Step 1: Add optional fields to EncounterTemplate**

In `src/types/encounter.ts`, find `EncounterTemplate` (line 126). Add after the last existing field (before the closing `}`):

```typescript
/**
 * Optional audio override when this encounter is active.
 * backgroundTrack: pushes named key to BackgroundChannel at priority 3.
 * musicTrack: swaps MusicChannel to /audio/music/<key>.mp3.
 * If both are set, musicTrack takes precedence.
 */
backgroundTrack?: string;
musicTrack?: string;
```

- [ ] **Step 2: Run tests and type-check**

```bash
npm test && npx tsc --noEmit
```
Expected: clean. (Adding optional fields is backward compatible — no existing code breaks.)

- [ ] **Step 3: Commit**

```bash
git add src/types/encounter.ts
git commit -m "feat(encounter): add optional backgroundTrack and musicTrack fields to EncounterTemplate"
```

---

## Task 11: useAmbientContext hook

**Files:**
- Create: `src/components/Game/hooks/useAmbientContext.ts`

No separate test file is written for this hook — it coordinates modules that are each individually tested. Integration is verified by running the dev server (see Task 13).

- [ ] **Step 1: Create the hook**

```typescript
// src/components/Game/hooks/useAmbientContext.ts
import { useEffect, useRef } from 'react';
import type { HexCoord, HexTile, LocationSubtype } from '../../../types';
import type { EncounterTemplate } from '../../../types/encounter';
import { terrainToSoundKey } from '../../../audio/terrainSoundKey';
import { locationToSoundKey } from '../../../audio/locationSoundKey';
import { pushAmbient, popAmbient } from '../../../audio/BackgroundChannel';
import { swapMusicTrack, restoreMusicDefault } from '../../../audio/MusicChannel';
import { AMBIENT_CONTEXT_DEBOUNCE_MS } from '../../../audio/audioConstants';

export interface AmbientContextInput {
  /** The hex to read terrain from: selectedHex ?? cameraCenter */
  terrainHex: HexCoord;
  tiles: HexTile[];
  /** Dominant location subtype at focusedHex when hex chronicle panel is open, else null */
  hexChronicleSubtype: LocationSubtype | null;
  /** Location subtype of the currently open location detail panel, else null */
  locationDetailSubtype: LocationSubtype | null;
  /** The active encounter template if one is in progress, else null */
  activeEncounterTemplate: EncounterTemplate | null;
}

export function useAmbientContext({
  terrainHex, tiles,
  hexChronicleSubtype, locationDetailSubtype,
  activeEncounterTemplate,
}: AmbientContextInput): void {
  const terrainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTerrainKeyRef = useRef<string | null>(null);
  const encounterOverrideRef = useRef<{ channel: 'music' | 'background' } | null>(null);

  // ── Priority 0: terrain (debounced, always active) ──────────────────────────
  useEffect(() => {
    if (terrainDebounceRef.current) clearTimeout(terrainDebounceRef.current);
    terrainDebounceRef.current = setTimeout(() => {
      const tile = tiles.find(
        t => t.coord.col === terrainHex.col && t.coord.row === terrainHex.row
      );
      const key = tile ? terrainToSoundKey(tile.terrain) : 'grassland';
      if (key !== lastTerrainKeyRef.current) {
        lastTerrainKeyRef.current = key;
        pushAmbient(0, key);
      }
    }, AMBIENT_CONTEXT_DEBOUNCE_MS);
    return () => {
      if (terrainDebounceRef.current) clearTimeout(terrainDebounceRef.current);
    };
  }, [terrainHex, tiles]);

  // ── Priority 1: hex chronicle (location at focused hex) ─────────────────────
  useEffect(() => {
    if (hexChronicleSubtype !== null) {
      const key = locationToSoundKey(hexChronicleSubtype);
      if (key) { pushAmbient(1, key); return; }
    }
    popAmbient(1);
  }, [hexChronicleSubtype]);

  // ── Priority 2: location detail panel ───────────────────────────────────────
  useEffect(() => {
    if (locationDetailSubtype !== null) {
      const key = locationToSoundKey(locationDetailSubtype);
      if (key) { pushAmbient(2, key); return; }
    }
    popAmbient(2);
  }, [locationDetailSubtype]);

  // ── Priority 3: encounter override ──────────────────────────────────────────
  useEffect(() => {
    if (activeEncounterTemplate) {
      const { musicTrack, backgroundTrack } = activeEncounterTemplate;
      if (musicTrack) {
        encounterOverrideRef.current = { channel: 'music' };
        swapMusicTrack(`/audio/music/${musicTrack}.mp3`);
      } else if (backgroundTrack) {
        encounterOverrideRef.current = { channel: 'background' };
        pushAmbient(3, backgroundTrack);
      }
    } else if (encounterOverrideRef.current) {
      const { channel } = encounterOverrideRef.current;
      encounterOverrideRef.current = null;
      if (channel === 'music') restoreMusicDefault();
      else popAmbient(3);
    }
  }, [activeEncounterTemplate]);
}
```

- [ ] **Step 2: Run type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add src/components/Game/hooks/useAmbientContext.ts
git commit -m "feat(audio): add useAmbientContext hook — wires terrain/chronicle/location/encounter to BackgroundChannel"
```

---

## Task 12: Wire GameView

**Files:**
- Modify: `src/components/Game/GameView.tsx`

- [ ] **Step 1: Add imports to GameView.tsx**

Find the imports section at the top of `src/components/Game/GameView.tsx`. Add:

```typescript
import { useAmbientContext } from './hooks/useAmbientContext';
import { CAMERA_CONSTANTS } from '../HexMapV2/camera/D3ZoomCamera';
import { resolveEncounterTemplate } from '../../data/unified-action-templates';
```

- [ ] **Step 2: Add cameraCenter state**

Near the other `useState` declarations (around line 221), add:

```typescript
const [cameraCenter, setCameraCenter] = useState<HexCoord>({
  col: CAMERA_CONSTANTS.INITIAL_CENTER_COL,
  row: CAMERA_CONSTANTS.INITIAL_CENTER_ROW,
});
```

- [ ] **Step 3: Compute hexChronicleSubtype**

After the `locationNodes` useMemo (around line 632), add:

```typescript
/** Dominant location sound subtype for the hex chronicle panel (priority 1). */
const hexChronicleSubtype = useMemo<import('../../types').LocationSubtype | null>(() => {
  if (viewLevel !== 'hex-zoom' || !focusedHex) return null;
  const locs = locationNodes.filter(
    l => l.hexCol === focusedHex.col && l.hexRow === focusedHex.row
  );
  if (locs.length === 0) return null;
  const PRIORITY = [
    'city', 'capital', 'castle', 'fort', 'temple', 'shrine', 'healing_spring',
    'standing_stones', 'ley_nexus', 'fey_crossing', 'living_archive',
    'cavern', 'ruins', 'ruined_city', 'crystal_cavern', 'ancient_vault', 'shadow_hollow',
    'sacrifice_site', 'haunted_ground', 'corruption_zone', 'nest', 'lair', 'battleground',
    'hamlet', 'town',
  ] as const;
  for (const s of PRIORITY) {
    if (locs.some(l => l.locationType === s)) return s;
  }
  return (locs[0]!.locationType as import('../../types').LocationSubtype) ?? null;
}, [viewLevel, focusedHex, locationNodes]);
```

- [ ] **Step 4: Compute locationDetailSubtype**

Immediately after, add:

```typescript
/** Location subtype for the open location detail panel (priority 2). */
const locationDetailSubtype = useMemo<import('../../types').LocationSubtype | null>(() => {
  if (viewLevel !== 'location') return null;
  const subtype = focusedLocation?.properties?.locationSubtype as string | undefined;
  return (subtype as import('../../types').LocationSubtype) ?? null;
}, [viewLevel, focusedLocation]);
```

- [ ] **Step 5: Compute activeEncounterTemplate**

Immediately after, add:

```typescript
/** Active encounter template for audio override (priority 3). */
const activeEncounterTemplate = useMemo(() => {
  const active = gameState.encounterProgress.find(ep => ep.status === 'active');
  if (!active) return null;
  return resolveEncounterTemplate(active.encounterId) ?? null;
}, [gameState.encounterProgress]);
```

- [ ] **Step 6: Mount useAmbientContext**

Find where other hooks are called (after all the useMemos, before the JSX return). Add:

```typescript
useAmbientContext({
  terrainHex: selectedHex ?? cameraCenter,
  tiles,
  hexChronicleSubtype,
  locationDetailSubtype,
  activeEncounterTemplate,
});
```

- [ ] **Step 7: Pass onCameraCenterHex to HexMapV2**

Find the `<HexMapV2 ...>` JSX (around line 2261). Add the prop:

```typescript
onCameraCenterHex={setCameraCenter}
```

- [ ] **Step 8: Add audio state for SettingsPanel**

Near the other `useState` declarations, add:

```typescript
import { getMusicVolume, setMusicVolume, isMusicMuted, toggleMusicMute } from '../../audio/MusicChannel';
import { getBackgroundVolume, setBackgroundVolume, isBackgroundMuted, muteBackground, unmuteBackground } from '../../audio/BackgroundChannel';
import { getUiVolume, setUiVolume, isUiMuted, muteUi, unmuteUi } from '../../audio/UiChannel';
import { muteAll, unmuteAll, isAllMuted } from '../../audio/AudioMaster';

// Audio state (initialized from singletons; singletons are source of truth)
const [musicVolume, setMusicVolumeState] = useState(() => getMusicVolume());
const [bgVolume, setBgVolumeState] = useState(() => getBackgroundVolume());
const [uiVolume, setUiVolumeState] = useState(() => getUiVolume());
const [audioMuted, setAudioMuted] = useState(() => isAllMuted());
```

Then add handler functions:

```typescript
const handleMusicVolume = useCallback((v: number) => {
  setMusicVolume(v);
  setMusicVolumeState(v);
}, []);

const handleBgVolume = useCallback((v: number) => {
  setBackgroundVolume(v);
  setBgVolumeState(v);
}, []);

const handleUiVolume = useCallback((v: number) => {
  setUiVolume(v);
  setUiVolumeState(v);
}, []);

const handleToggleAudioMute = useCallback(() => {
  if (audioMuted) { unmuteAll(); setAudioMuted(false); }
  else { muteAll(); setAudioMuted(true); }
}, [audioMuted]);
```

- [ ] **Step 9: Pass audio props to SettingsPanel**

Find `<SettingsPanel` in the JSX and add the new props:

```typescript
musicVolume={musicVolume}
onMusicVolume={handleMusicVolume}
bgVolume={bgVolume}
onBgVolume={handleBgVolume}
uiVolume={uiVolume}
onUiVolume={handleUiVolume}
audioMuted={audioMuted}
onToggleAudioMute={handleToggleAudioMute}
```

- [ ] **Step 10: Run type-check**

```bash
npx tsc --noEmit
```
Fix any type errors before continuing.

- [ ] **Step 11: Run tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 12: Commit**

```bash
git add src/components/Game/GameView.tsx
git commit -m "feat(audio): wire useAmbientContext and audio settings state into GameView"
```

---

## Task 13: SettingsPanel audio controls

**Files:**
- Modify: `src/components/Game/SettingsPanel.tsx`

- [ ] **Step 1: Add new props to SettingsPanelProps**

Open `src/components/Game/SettingsPanel.tsx`. Find `interface SettingsPanelProps` and add:

```typescript
// Audio settings
musicVolume: number;
onMusicVolume: (v: number) => void;
bgVolume: number;
onBgVolume: (v: number) => void;
uiVolume: number;
onUiVolume: (v: number) => void;
audioMuted: boolean;
onToggleAudioMute: () => void;
```

- [ ] **Step 2: Destructure new props in the component function**

Add to the destructure at the top of `SettingsPanel`:

```typescript
musicVolume, onMusicVolume,
bgVolume, onBgVolume,
uiVolume, onUiVolume,
audioMuted, onToggleAudioMute,
```

- [ ] **Step 3: Add the audio controls section to the JSX**

Before the closing `</div>` of the settings panel content area, add an Audio section. Find the existing structure and add after the notification preferences section (around where the debug panel toggle is):

```tsx
{/* ── Audio ───────────────────────────────────── */}
<div style={{ marginBottom: 16 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
    <span style={{ color: '#d4b896', fontWeight: 600, fontSize: 13 }}>Audio</span>
    <button
      onClick={onToggleAudioMute}
      style={toggleStyle(!audioMuted)}
      aria-label={audioMuted ? 'Unmute all audio' : 'Mute all audio'}
      title={audioMuted ? 'All audio muted' : 'All audio on'}
    >
      <div style={toggleDotStyle(!audioMuted)} />
    </button>
  </div>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <label style={{ color: '#a89070', fontSize: 12 }}>
      Music
      <input
        type="range" min={0} max={1} step={0.01}
        value={musicVolume}
        onChange={e => onMusicVolume(parseFloat(e.target.value))}
        style={{ marginLeft: 8, width: 100 }}
        aria-label="Music volume"
      />
    </label>
    <label style={{ color: '#a89070', fontSize: 12 }}>
      Ambient
      <input
        type="range" min={0} max={1} step={0.01}
        value={bgVolume}
        onChange={e => onBgVolume(parseFloat(e.target.value))}
        style={{ marginLeft: 8, width: 100 }}
        aria-label="Ambient volume"
      />
    </label>
    <label style={{ color: '#a89070', fontSize: 12 }}>
      UI
      <input
        type="range" min={0} max={1} step={0.01}
        value={uiVolume}
        onChange={e => onUiVolume(parseFloat(e.target.value))}
        style={{ marginLeft: 8, width: 100 }}
        aria-label="UI effects volume"
      />
    </label>
  </div>
</div>
```

Note: `toggleStyle` and `toggleDotStyle` are already defined in this file — reuse them.

- [ ] **Step 4: Update SettingsPanel test stubs (if any)**

```bash
grep -r "SettingsPanel" src --include="*.test.tsx" -l
```

For each test file that renders `<SettingsPanel>`, add the new required props. Use placeholder values:

```typescript
musicVolume={0.4}
onMusicVolume={vi.fn()}
bgVolume={0.35}
onBgVolume={vi.fn()}
uiVolume={0.6}
onUiVolume={vi.fn()}
audioMuted={false}
onToggleAudioMute={vi.fn()}
```

- [ ] **Step 5: Run all tests**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 6: Type-check and build**

```bash
npx tsc --noEmit && npx vite build
```
Expected: clean.

- [ ] **Step 7: Commit**

```bash
git add src/components/Game/SettingsPanel.tsx
git commit -m "feat(audio): add Music/Ambient/UI volume sliders and master mute to SettingsPanel"
```

---

## Task 14: Final validation and push

- [ ] **Step 1: Run full test suite**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```
Expected: clean.

- [ ] **Step 3: Production build**

```bash
npx vite build
```
Expected: succeeds with no errors.

- [ ] **Step 4: Push to main**

```bash
git push
```

---

## Self-Review Checklist

- [x] **audioConstants.ts** — all 10 constants from spec, AMBIENT_TRACKS registry for all 15 sound keys
- [x] **terrainSoundKey** — all 38 TerrainType values covered exhaustively, warning on unknown
- [x] **locationSoundKey** — all 50+ LocationSubtype values accounted for (mapped or explicit fallback)
- [x] **MusicChannel** — replaces themeAudio.ts; legacy key migration; swapMusicTrack/restoreMusicDefault
- [x] **BackgroundChannel** — 4-level priority stack, crossfade, push/pop, volume/mute
- [x] **UiChannel** — pool per key, play/setVolume/mute/unmute
- [x] **AudioMaster** — muteAll/unmuteAll/isAllMuted
- [x] **HexMapV2** — onCameraCenterHex prop + zoom.ambient handler + cleanup
- [x] **EncounterTemplate** — backgroundTrack/musicTrack optional fields
- [x] **useAmbientContext** — 4 priorities, debounced terrain, location/encounter override lifecycle
- [x] **GameView** — cameraCenter state, hexChronicleSubtype, locationDetailSubtype, activeEncounterTemplate, hook mount, settings state + handlers
- [x] **SettingsPanel** — 3 sliders + master mute toggle, correct prop types
- [x] **Migration** — themeAudio.ts deleted, 3 test mocks updated, startPageConstants.ts audio lines removed, audio file moved
- [x] **Intervention SFX** — NOT migrated (per spec); useInterventionAudio unchanged
