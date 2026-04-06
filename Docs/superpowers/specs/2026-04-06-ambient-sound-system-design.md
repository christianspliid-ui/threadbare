# Ambient Sound System — Design Spec
**Date:** 2026-04-06
**Status:** Approved

---

## Overview

Three independent audio channels provide layered sound across the game. A priority stack drives context-sensitive ambient audio based on what the player is looking at. Encounter templates can push override tracks to either the music or background channel.

---

## Channel Architecture

Three module-level singletons, matching the existing `themeAudio.ts` pattern:

| Channel | File | Role |
|---------|------|------|
| `MusicChannel` | `src/audio/MusicChannel.ts` | Looping music track. Normally plays `theme-drone.mp3`. Encounters can swap in a named track. |
| `BackgroundChannel` | `src/audio/BackgroundChannel.ts` | Context-driven looping ambient. Priority stack selects which track plays. Crossfades on context change. |
| `UiChannel` | `src/audio/UiChannel.ts` | Fire-and-forget one-shots. Small pool of `HTMLAudioElement` instances loaded on demand. |

`themeAudio.ts` is replaced by `MusicChannel.ts` — same fade/mute/play/pause API, extended with `swapTrack(key)` / `restoreDefault()` for encounter overrides.

All constants live in `src/audio/audioConstants.ts`. Every tunable number is named.

### Per-Channel API

Each channel exposes:
```ts
setVolume(v: number): void       // 0–1, clamped
mute(): void
unmute(): void
isMuted(): boolean
```
Mute state for all three channels persisted independently to `localStorage`.

An `AudioMaster` utility (`src/audio/AudioMaster.ts`) provides global mute/unmute across all three channels for a single UI toggle.

---

## Constants Table

All in `src/audio/audioConstants.ts`:

| Constant | Default | Purpose |
|----------|---------|---------|
| `MUSIC_VOLUME_DEFAULT` | `0.4` | Default music channel volume |
| `BACKGROUND_VOLUME_DEFAULT` | `0.35` | Default background ambient volume |
| `UI_VOLUME_DEFAULT` | `0.6` | Default UI SFX volume |
| `MUSIC_FADE_IN_MS` | `3000` | Music fade-in duration |
| `MUSIC_FADE_OUT_MS` | `1500` | Music fade-out duration |
| `AMBIENT_CROSSFADE_MS` | `2000` | Background channel crossfade on context switch |
| `AMBIENT_CONTEXT_DEBOUNCE_MS` | `300` | Debounce delay before context change fires |
| `MUSIC_MUTE_KEY` | `'fws_music_muted'` | localStorage key |
| `BACKGROUND_MUTE_KEY` | `'fws_bg_muted'` | localStorage key |
| `UI_MUTE_KEY` | `'fws_ui_muted'` | localStorage key |

---

## Background Channel — Priority Stack

`BackgroundChannel` maintains a priority stack. The highest active entry plays. When an entry is popped, the next lower resumes with a crossfade. Pushing a new key at an already-occupied priority replaces the existing entry at that priority (no stack growth — each priority level holds exactly one entry).

| Priority | Context | Trigger |
|----------|---------|---------|
| 0 (base) | Hex map terrain | Always active in GameView |
| 1 | Hex chronicles key location | Chronicle panel open |
| 2 | Location detail | Location detail panel open |
| 3 (highest) | Encounter override | Encounter open with `backgroundTrack` set |

When no file is found for a key, the channel stays silent — no error thrown.

### Crossfade Behaviour

On context switch:
1. Current track fades out over `AMBIENT_CROSSFADE_MS / 2`
2. New track starts and fades in over `AMBIENT_CROSSFADE_MS / 2`

Tracks loop (same file repeats) until context changes.

---

## Context Driver — `useAmbientContext`

A single hook mounted once in `GameView`. Watches four context sources and calls `BackgroundChannel.push(priority, key)` / `BackgroundChannel.pop(priority)`.

### Terrain Context (priority 0)

Source: `selectedHex ?? cameraCenter` from HexMapV2 props. Terrain type read from tile data. Grouped into 8 sound keys:

| Sound key | Terrain types |
|-----------|--------------|
| `forest` | light_forest, woodland, temperate_forest, dense_forest, boreal_forest, tropical_forest |
| `grassland` | grassland, savanna, steppe, floodplain |
| `swamp` | marsh, swamp, moor_bog |
| `mountains` | hills, forested_hills, mountains, high_mountains, plateau, mountain_pass |
| `desert` | sand_desert, sand_dunes, rocky_desert, hardened_clay, badlands |
| `tundra` | tundra, snow_fields, glacier |
| `volcanic` | volcanic, volcano, lava |
| `wasteland` | broken_lands, dead_forest |

### Hex Chronicles Context (priority 1)

Source: the **dominant location** for the focused hex. Dominant location is resolved by priority order: city/capital → dungeon/cave/crypt → temple/shrine → town/village/hamlet → camp/ruin. If multiple locations exist on the hex, the highest-priority type wins. Maps `locationSubtype` to a sound key. Initial mapping:

| Sound key | Location subtypes |
|-----------|------------------|
| `city` | city, capital |
| `settlement` | town, village, hamlet |
| `wilderness` | (no location, or camp, ruin) |
| `temple` | temple, shrine |
| `dungeon` | dungeon, cave, crypt |

Falls back to the terrain key if no location is present.

### Location Detail Context (priority 2)

Source: the `locationSubtype` of the currently open location detail panel. Uses the same location → sound key mapping as priority 1.

### Encounter Override Context (priority 3)

Driven by encounter template fields (see Encounter Integration section).

Context changes are debounced by `AMBIENT_CONTEXT_DEBOUNCE_MS` (300ms) to prevent thrashing while panning.

---

## Encounter Integration

Two optional fields added to encounter templates:

```ts
backgroundTrack?: string   // pushes named key to BackgroundChannel at priority 3
musicTrack?: string        // swaps MusicChannel to named track
```

If both are present, `musicTrack` takes precedence — `backgroundTrack` is ignored.

**Lifecycle:**
- Encounter opens → push override to specified channel, crossfade in
- Encounter closes → pop override, previous context resumes

---

## UI Channel

`UiChannel` maintains a small pool of `HTMLAudioElement` instances per sound key, loaded on first use. `play(key)` picks a free instance from the pool (or creates one), plays it, and returns immediately.

Initial sound keys:

| Key | Used for |
|-----|---------|
| `click` | General UI button press |
| `confirm` | Action confirmation |
| `cancel` | Dismiss / cancel |
| `intervention` | Intervention cast (replaces Web Audio synthesis) |

The existing `useInterventionAudio` Web Audio synthesis can be migrated to file-based UI sounds once assets are available. Until then, both can coexist.

---

## File Layout & Asset Conventions

```
public/audio/
  music/
    theme-drone.mp3          ← existing, moved from /audio/
    [encounter-track].mp3    ← future
  ambient/
    forest/
      forest-1.mp3
      forest-2.mp3
      ...
    grassland/
      grassland-1.mp3
    swamp/
      swamp-1.mp3
    mountains/
      mountains-1.mp3
    desert/
      desert-1.mp3
    tundra/
      tundra-1.mp3
    volcanic/
      volcanic-1.mp3
    wasteland/
      wasteland-1.mp3
    city/
      city-1.mp3
    settlement/
      settlement-1.mp3
    dungeon/
      dungeon-1.mp3
    temple/
      temple-1.mp3
    wilderness/
      wilderness-1.mp3
  ui/
    click.mp3
    confirm.mp3
    cancel.mp3
    intervention.mp3
```

Each folder is the sound key. Multiple files in a folder = random selection on context switch. Missing files degrade silently.

---

## Fail-Soft Table

| Failure | Fallback |
|---------|---------|
| Audio file missing | Channel stays silent, no error thrown |
| `AudioContext` unavailable | UI channel skips playback silently |
| Autoplay policy blocked | Swallow rejection, retry on next user interaction |
| Encounter specifies unknown track key | No override pushed, lower priority resumes |
| Both `backgroundTrack` and `musicTrack` set | `musicTrack` wins, `backgroundTrack` ignored |

---

## Tracing

No engine traces — this is pure presentation. Debug visibility via `window.__DEBUG` (future extension):
```ts
window.__DEBUG.getAudioState()  // returns { music, background, ui } channel states
```

---

## UI / Visibility Phase

**Volume controls:** Three sliders (Music / Ambient / UI) in the existing settings/options panel, one per channel. Global mute toggle calls `AudioMaster.muteAll()` / `AudioMaster.unmuteAll()`.

**No in-HexMap UI** — ambient sound changes are inaudible transitions, no visual indicator needed.

---

## Wiring

| Surface | Detail |
|---------|--------|
| `GameView.tsx` | Mount `useAmbientContext`, pass `selectedHex` + `cameraCenter` + open panel state |
| `HexMapV2.tsx` | Expose `cameraCenter: HexCoord` as a prop or callback (may need adding) |
| `MusicChannel.ts` | Replace `themeAudio.ts`. Update all import sites (`StartPage`, `GameView`, etc.). Move `theme-drone.mp3` from `public/audio/` to `public/audio/music/` and update `MUSIC_SRC` constant. |
| `BackgroundChannel.ts` | New. Called by `useAmbientContext`. |
| `UiChannel.ts` | New. Called at UI interaction sites (buttons, intervention confirm). |
| `AudioMaster.ts` | New. Called by global mute toggle in settings UI. |
| Encounter template type | Add optional `backgroundTrack?: string` and `musicTrack?: string` fields. |
| `audioConstants.ts` | New. All volume/fade/debounce constants. Replaces `startPageConstants.ts` audio section. |

---

## NFP Compliance

| Priority | Status |
|----------|--------|
| 1. Tunability | PASS — every volume, fade, and debounce value is a named constant in `audioConstants.ts` |
| 2. Inspectability | PASS with note — no engine traces (presentation only); `__DEBUG.getAudioState()` planned for future |
| 3. Determinism | PASS — random file selection is presentation-only, seeded PRNG not required |
| 4. Fail-soft | PASS — missing files, unavailable AudioContext, and autoplay rejection all handled silently |
| 5. Narrative over mechanical | PASS — encounter override gives narrative moments full audio control |
| 6. Additive | PASS — `themeAudio.ts` replaced cleanly, no other existing code broken |
| 7. Performance | PASS — small HTMLAudioElement pool, debounced context changes, no per-tick work |
