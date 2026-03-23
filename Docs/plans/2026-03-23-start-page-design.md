# Start Page Design

> Created 2026-03-23 (Cowork). Full main menu with narrative-mysterious tone, static visuals, dark ambient theme music.

## Design Intent

The current game drops players straight into the cosmology setup screen — no introduction, no atmosphere, no context. The frontend audit (FE-15/16) flagged onboarding as Grade D. This start page is the first step toward fixing that.

The start page should feel like **opening an ancient book** — a moment of stillness and mystery before the game begins. The title-screen.png (World-Soul hovering over ruins, sphere threads converging) provides the visual anchor. Text carries the atmosphere: a lore fragment that hints at the cycle of creation and unmaking without explaining it.

**Tone:** Dark, quiet, reverent. The player should feel like they've stumbled onto something vast and old. Not bombastic — intimate, as if overhearing a whisper.

---

## Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ title-screen.png (full bleed) ▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│  ▓▓                                                         ▓▓  │
│  ▓▓                    T H R E A D B A R E                  ▓▓  │
│  ▓▓                                                         ▓▓  │
│  ▓▓      Worlds are woven. Worlds are worn through.         ▓▓  │
│  ▓▓      The loom turns. The threads remember.              ▓▓  │
│  ▓▓                                                         ▓▓  │
│  ▓▓                                                         ▓▓  │
│  ▓▓                     New World                           ▓▓  │
│  ▓▓                     Continue                            ▓▓  │
│  ▓▓                     Settings                            ▓▓  │
│  ▓▓                     Credits                             ▓▓  │
│  ▓▓                                                         ▓▓  │
│  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │
│                                                  v0.x.x · seed  │
└─────────────────────────────────────────────────────────────────┘
```

### Composition Rules

**Background:** `title-screen.png` fills the viewport (`object-fit: cover; object-position: center top`). The World-Soul and upper ruins are the visual focus — the bottom half is darker and naturally recedes, which is where our text lives.

**Gradient overlay:** A CSS gradient sits on top of the image to darken the lower portion and create a legible text bed:
```css
background: linear-gradient(
  to bottom,
  transparent 0%,
  transparent 35%,
  rgba(10, 10, 14, 0.4) 50%,
  rgba(10, 10, 14, 0.85) 75%,
  rgba(10, 10, 14, 0.95) 100%
);
```
This preserves the World-Soul and thread details in the upper frame while creating a dark ground for text in the lower third.

**Content positioning:** Everything (title, lore, menu) is vertically centered-to-low within the viewport. The content block sits roughly at 55–85% vertical position — below the World-Soul, in the gradient's dark zone. Horizontally centered.

**Version stamp:** Tiny `--text-xs` version string in `--text-muted`, bottom-right corner. Unobtrusive.

---

## Typography & Content

### Title: "THREADBARE"

- Font: `--font-display` (Cinzel), `--text-2xl` or larger (custom size ~40px for this one screen)
- Color: `--accent-gold` with subtle `text-shadow: 0 0 40px rgba(212, 160, 64, 0.3)` for warmth
- Letter-spacing: `0.25em` — wide, stately, breathing room
- All caps
- No subtitle

### Lore Fragment

Two lines of evocative text, hinting at the cycle without explaining it. Italic, narrative voice — as if reading an inscription.

**Primary option:**
> *Worlds are woven. Worlds are worn through.*
> *The loom turns. The threads remember.*

**Alternates (pick based on feel):**
> *What was unmade stirs again in the dark.*
> *The threads are thin. The weave holds — for now.*

or:

> *Between the silence of one world and the first breath of another,*
> *something watches. Something chooses.*

- Font: `--font-body` (Alegreya Sans), italic, `--text-base`
- Color: `--text-secondary`
- Line-height: `1.7`
- Max-width: ~500px, centered
- Margin: `--space-6` below title, `--space-8` above menu

### Menu Items

Simple text, no buttons, no boxes, no icons. Each item is a line of text that responds to hover.

| Item | Label | State |
|------|-------|-------|
| New World | Always visible | Transitions to cosmology setup (current worldgen phase) |
| Continue | Visible only if save exists; otherwise hidden entirely (not greyed) | Loads saved game state |
| Settings | Always visible | Opens settings overlay/modal |
| Credits | Always visible | Opens credits overlay/modal |

- Font: `--font-display` (Cinzel), `--text-lg`
- Color at rest: `--text-tertiary`
- Color on hover: `--text-primary` with transition (`0.3s ease`)
- Color when focused (keyboard): `--text-primary` + `--accent-gold` underline
- Letter-spacing: `0.08em`
- Vertical gap between items: `--space-4`
- Centered alignment
- Cursor: `pointer`
- No underlines at rest, no borders, no backgrounds

**"Continue" conditional visibility:** The game doesn't have a save system yet. For the initial implementation, this item is simply hidden. When save/load ships, it appears conditionally. This avoids showing a greyed-out option that implies a missing feature.

---

## Interaction Flow

```
[Start Page]
    │
    ├── "New World" → transition to cosmology setup (existing worldgen phase)
    │                  Fade-out start page → fade-in cosmology screen
    │
    ├── "Continue"  → (future) load saved state → transition to game view
    │
    ├── "Settings"  → open settings modal (overlay on start page)
    │                  Same modal component used in-game, dark backdrop
    │
    └── "Credits"   → open credits modal (overlay on start page)
                       Scrollable list of credits, same modal primitive
```

### Transitions

- **Start page → worldgen:** Fade-out the entire start page (opacity 0 over ~600ms), then mount the cosmology screen. Simple CSS transition, no complex choreography.
- **Modal open/close:** Standard modal behavior — dark backdrop, content slides or fades in. Use the existing Modal primitive.

### App.tsx Integration

The start page becomes a new phase in App.tsx's phase state:

```
Current:  worldgen → selection → playing
Proposed: start → worldgen → selection → playing
```

- Default phase changes from `worldgen` to `start`
- `?view=game` and `?view=hexv2` skip the start page (dev shortcuts remain fast)
- "New World" sets phase to `worldgen`

---

## Theme Music — Audio System

### Concept

A dark ambient drone plays on the start page — low, slow, atmospheric, tension without melody. The music begins when the player first interacts with the page (browser autoplay policy requires a user gesture). It loops seamlessly for as long as the player stays on the start page.

### Audio File

- **Path:** `public/audio/theme-drone.mp3` (user-provided)
- **Format:** MP3, ~128–192kbps, stereo
- **Duration:** ~5 minutes (user-provided), designed for seamless loop (fade tail matches fade head)
- **Fallback:** If the file is missing or fails to load, the start page functions identically without sound. No error shown to the player.

### Playback Behavior

| Behavior | Detail |
|----------|--------|
| **Trigger** | First user interaction (click or keypress anywhere on the start page) |
| **Fade in** | Volume ramps from 0 to `THEME_VOLUME_DEFAULT` over `THEME_FADE_IN_MS` |
| **Loop** | `<audio loop>` — browser-native seamless loop |
| **Fade out** | When player clicks "New World", music fades to 0 over `THEME_FADE_OUT_MS`, then the page transition begins |
| **Settings volume** | Master volume slider in Settings modal controls `THEME_VOLUME_DEFAULT` in real-time via `HTMLAudioElement.volume` |
| **Mute** | Clicking a mute/unmute icon (small, bottom-left corner, `--text-muted` color) toggles audio instantly |
| **Page leave** | If the user navigates away or closes the tab, audio stops naturally (no cleanup needed) |

### Mute Toggle

A small speaker icon in the bottom-left corner (opposite the version stamp). Toggleable.

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│                         (art + content)                         │
│                                                                 │
│  🔊                                                   v0.x.x   │
└─────────────────────────────────────────────────────────────────┘
```

- Icon: simple speaker glyph from Lucide (`Volume2` / `VolumeX`)
- Color: `--text-muted` at rest, `--text-secondary` on hover
- Size: `--text-sm`
- Persists mute state to `localStorage` so returning players stay muted if they chose that

### Implementation Approach

Use a plain `HTMLAudioElement` — no audio library needed for a single looping track. A small React hook (`useThemeMusic`) encapsulates:

```typescript
// Sketch — not production code, just intent
function useThemeMusic(src: string, volume: number, muted: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, [src]);

  // Expose: play(), fadeIn(), fadeOut(), setVolume()
}
```

The hook is owned by `StartPage.tsx`. When the player clicks "New World", the component calls `fadeOut()`, waits for the fade to complete, then triggers the phase transition.

### Browser Autoplay Policy

Modern browsers block `audio.play()` until the user has interacted with the page. Two approaches, in order of preference:

1. **Preferred:** Don't auto-play. Wait for the player's first click/keypress on the start page (any menu item, anywhere on the page). On that first interaction, call `audio.play()` and begin the fade-in. The music starts as a response to engagement, not on load.
2. **Fallback:** If the play() promise rejects (browser blocked it), catch silently. The page works fine without music. Try again on next user interaction.

This means a player who immediately clicks "New World" might hear only a brief swell of music as it fades in and immediately fades out — that's fine, even evocative.

---

## Settings Modal (Stub)

For the initial implementation, the settings modal can be minimal:

- **Audio:** Master volume slider (controls theme music in real-time). Mute toggle.
- **Display:** Fog of war default toggle (maps to the existing `?fog` param)
- **About:** Version, seed display

This is a stub that gives the menu item something to open. Full settings can be designed later.

---

## Credits Modal

Scrollable list within the existing Modal primitive:

- Game title and version
- "Created by [author]"
- Tool/technology credits (React, Three.js, Vite, etc.)
- Art credits if applicable
- A closing lore line: *"The threads continue."*

---

## Design Token Usage

| Element | Token(s) |
|---------|----------|
| Page background (behind image) | `--bg-abyss` |
| Title color | `--accent-gold` |
| Lore text | `--text-secondary`, italic |
| Menu items (rest) | `--text-tertiary` |
| Menu items (hover) | `--text-primary` |
| Menu items (focus) | `--text-primary` + `--accent-gold` underline |
| Version stamp | `--text-muted`, `--text-xs` |
| Gradient overlay base | `rgba(10, 10, 14, …)` (matches `--bg-abyss: #0a0a0e`) |
| Modal backdrop | Existing modal system |

---

## Constants Table (NFP #1 — Tunability)

| Constant | Default | Purpose |
|----------|---------|---------|
| `START_PAGE_TITLE` | `"THREADBARE"` | Title text |
| `START_PAGE_LORE_LINE_1` | `"Worlds are woven. Worlds are worn through."` | First lore line |
| `START_PAGE_LORE_LINE_2` | `"The loom turns. The threads remember."` | Second lore line |
| `START_PAGE_TITLE_SIZE` | `2.5rem` (~40px) | Title font size |
| `START_PAGE_TITLE_SPACING` | `0.25em` | Title letter-spacing |
| `START_PAGE_FADE_DURATION_MS` | `600` | Transition duration to worldgen |
| `START_PAGE_GRADIENT_OPACITY_MID` | `0.4` | Gradient opacity at 50% |
| `START_PAGE_GRADIENT_OPACITY_LOW` | `0.95` | Gradient opacity at bottom |
| `THEME_MUSIC_SRC` | `"/audio/theme-drone.mp3"` | Path to theme music file |
| `THEME_VOLUME_DEFAULT` | `0.4` | Default volume (0–1). Drone should sit under, not dominate. |
| `THEME_FADE_IN_MS` | `3000` | Slow fade-in — the drone emerges from silence |
| `THEME_FADE_OUT_MS` | `1500` | Fade-out on "New World" click, before page transition |
| `THEME_MUTE_STORAGE_KEY` | `"threadbare_muted"` | localStorage key for mute persistence |

---

## Tracing (NFP #2 — Inspectability)

```typescript
interface StartPageTrace {
  type: 'start_page_action';
  action: 'new_world' | 'continue' | 'settings' | 'credits';
  timestamp: number;
}
```

Emitted when the player clicks any menu item. Minimal — this is a menu, not a simulation tick.

---

## Fail-Soft (NFP #4)

| Failure | Fallback |
|---------|----------|
| `title-screen.png` fails to load | Solid `--bg-abyss` background. Menu still fully functional. |
| `theme-drone.mp3` fails to load | Silent start page. No error shown. Menu fully functional. |
| `audio.play()` blocked by browser | Catch silently, retry on next user interaction. |
| Save data corrupted (future) | "Continue" item hidden, same as no-save state. |
| Phase state invalid | Default to `start` phase. |

---

## PRNG (NFP #3)

No seeded randomness needed. The start page is static and deterministic.

---

## Accessibility

- All menu items are focusable (`<button>` elements styled as text, not `<div>` with onClick)
- Keyboard navigation: Tab through items, Enter to select
- Focus ring uses `--accent-gold` underline (visible against dark background)
- Background image is decorative (`role="presentation"` or empty `alt`)
- Lore text has sufficient contrast against gradient (`--text-secondary` on near-black)

---

## NFP Compliance Summary

| # | Priority | Verdict |
|---|----------|---------|
| 1 | Tunability | PASS — all text, sizes, timing in constants table |
| 2 | Inspectability | PASS — trace emitted on menu action |
| 3 | Determinism | PASS — no randomness |
| 4 | Fail-soft | PASS — image failure degrades gracefully |
| 5 | Narrative over mechanical | PASS — lore-first design, mystery tone |
| 6 | Additive over destructive | PASS — new phase prepended, existing flow untouched |
| 7 | Performance budget | PASS — single image, CSS gradient, one audio element, no animation |

---

## Implementation Notes for Claude Code

### New files
- `src/components/StartPage/StartPage.tsx` — the component
- `src/components/StartPage/StartPage.css` — styles (or inline Tailwind, per project convention)
- `src/components/StartPage/startPageConstants.ts` — tunable constants
- `src/components/StartPage/useThemeMusic.ts` — audio hook (HTMLAudioElement, fade-in/out, mute persistence)
- `src/components/StartPage/SettingsModal.tsx` — stub settings modal (volume slider wired to audio hook)
- `src/components/StartPage/CreditsModal.tsx` — credits modal
- `public/audio/theme-drone.mp3` — **user-provided** (placeholder silence file if not yet available)

### Modified files
- `src/App.tsx` — add `start` phase, default to it, skip on dev views

### Audio file placeholder
If the user hasn't provided the MP3 yet, create a 1-second silent MP3 at `public/audio/theme-drone.mp3` so the audio system can be tested end-to-end. The real file drops in as a replacement with zero code changes.

### Test coverage
- Unit test: renders title, lore, menu items
- Unit test: "Continue" hidden when no save
- Unit test: "New World" calls phase transition
- Unit test: dev view params skip start page
- Unit test: `useThemeMusic` hook — fade-in called on interaction, fade-out returns promise, mute toggle persists to localStorage
- Unit test: audio failure gracefully caught (mock `play()` rejection)
- Snapshot or visual test at 1920×1080
