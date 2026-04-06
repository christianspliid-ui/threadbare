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

Source: `selectedHex ?? cameraCenter` — see **cameraCenter data path** below. Terrain type read from tile lookup on `tiles[]`. Grouped into 9 exhaustive sound keys covering all 38 `TerrainType` values:

| Sound key | Terrain types |
|-----------|--------------|
| `water` | ocean, deep_ocean, tropical_ocean, coastal_shallows, coast, lake, river, reef |
| `grassland` | grassland, farmland, savanna, steppe, floodplain, oasis |
| `forest` | light_forest, temperate_forest, dense_forest, boreal_forest, tropical_forest, jungle, evergreen_forest, great_home_trees |
| `swamp` | marsh, swamp, moor_bog |
| `mountains` | hills, forested_hills, mountains, high_mountains, plateau, mountain_pass |
| `desert` | desert, rocky_desert, sand_dunes, badlands |
| `tundra` | tundra, snow_fields, glacier, arctic |
| `volcanic` | volcano |
| `wasteland` | broken_lands, dead_forest |

Every `TerrainType` value maps to exactly one key. If a new terrain type is ever added without a mapping entry, the lookup function falls back to `grassland` and logs a warning (not silent — missing terrain coverage is a content bug, not a runtime error).

#### cameraCenter data path

HexMapV2 currently exposes no camera-center callback. A new optional prop is added:

```ts
onCameraCenterHex?: (hex: HexCoord) => void
```

Called from the d3-zoom `on('zoom')` handler inside HexMapV2, debounced at `AMBIENT_CONTEXT_DEBOUNCE_MS`. World-space center is computed from the d3 transform (`cx = -transform.x / transform.k`, `cy = transform.y / transform.k`) then inverse-mapped to hex coordinates using existing `worldToHex`. `GameView` stores the result as `useState<HexCoord>` and passes it to `useAmbientContext`.

### Hex Chronicles Context (priority 1)

Source: the **dominant location** for the focused hex. If multiple locations exist on the hex, highest-priority type wins using this order: city/capital → castle/fort → temple/shrine/sacred → dungeon/cavern/ruins → settlement → all others fall back to terrain. Maps `locationSubtype` to a sound key covering all 50+ `LocationSubtype` values:

| Sound key | Location subtypes |
|-----------|------------------|
| `city` | city, capital |
| `settlement` | hamlet, town |
| `fortress` | castle, fort, tower |
| `sacred` | temple, shrine, healing_spring, standing_stones, ley_nexus, fey_crossing, living_archive |
| `dungeon` | cavern, ruins, ruined_tower, ruined_city, ruined_village, crystal_cavern, ancient_vault, shadow_hollow |
| `danger` | sacrifice_site, haunted_ground, corruption_zone, nest, lair, cleared_lair, battleground |

All remaining subtypes (`mining`, `farmland`, `camp`, `oasis`, `unexplored_poi`, `grove`, `hot_spring`, `shipwreck`, `ancient_road`, `monument`, `gem_deposit`, `golden_grove`, `iron_seep`, `pearl_shoal`, `sunken_treasury`, `herb_garden`, `fossil_bed`, `glowcap_hollow`, `master_forge`, `convergence`, `time_scar`, `wilderness`, `lair`, `cleared_lair`) fall back to the terrain key — no location sound override for these. This is explicit, not silent omission.

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

**Intervention SFX migration path:** The existing `useInterventionAudio` Web Audio synthesis hook (`src/components/Game/hooks/useInterventionAudio.ts`) is called by `useAgentInteraction` at three sites. It is **not touched in this implementation** — `UiChannel` ships without an `intervention` key to avoid double-play. The `intervention.mp3` slot is reserved in the file layout as a placeholder. Migration is a separate future task: when audio assets exist, remove `useInterventionAudio`, replace the three `playCastSound()` calls in `useAgentInteraction` with `UiChannel.play('intervention')`, and delete the hook.

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
| Unknown terrain type in mapping | Falls back to `grassland` sound key, logs a console warning |
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

**Volume controls:** Three sliders (Music / Ambient / UI) added to `SettingsPanel`. Current `SettingsPanelProps` covers fog/debug/notification only — audio props are additive:

```ts
// New props added to SettingsPanelProps:
musicVolume: number;        onMusicVolume: (v: number) => void;
bgVolume: number;           onBgVolume: (v: number) => void;
uiVolume: number;           onUiVolume: (v: number) => void;
audioMuted: boolean;        onToggleAudioMute: () => void;
```

**State ownership:** Volume and mute state lives in the audio singletons (localStorage-backed). `GameView` reads initial values from each channel on mount into local `useState`, and on slider/toggle change updates both React state and the singleton. The panel is a controlled component — it does not own audio state.

**No in-HexMap UI** — ambient sound changes are inaudible transitions, no visual indicator needed.

---

## Wiring

| Surface | Detail |
|---------|--------|
| `GameView.tsx` | Mount `useAmbientContext`. Add `useState<HexCoord>` for `cameraCenter`, initialized to `CAMERA_CONSTANTS.INITIAL_CENTER_{COL,ROW}`. Pass `selectedHex`, `cameraCenter`, and open panel state to `useAmbientContext`. Pass audio volume/mute state + handlers to `SettingsPanel`. |
| `HexMapV2.tsx` | Add `onCameraCenterHex?: (hex: HexCoord) => void` prop. Wire into the d3-zoom `on('zoom')` handler: compute world center from transform, inverse-map to hex via `worldToHex`, debounce, call prop. |
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
