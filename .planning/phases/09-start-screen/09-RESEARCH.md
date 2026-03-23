# Phase 9: Start Screen — Research

**Researched:** 2026-03-23
**Domain:** React UI — atmospheric main menu, CSS layout, HTMLAudioElement, phase state integration
**Confidence:** HIGH

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Title screen art**
- Generate 3 concept art variants using image generation, pick the best
- Style: Endless Legend / Humankind aesthetic — ancient world, mystery over epic high-fantasy
- Landscape: Salt flats with shallow water shoals, misty mountains in far distance
- Ruin: Semi-submerged ancient structure with faint glowing energy veins/cracks (sphere energy in ruin, NOT sky)
- Wanderer: Tiny cloaked silhouette with walking staff, back to camera, walking into the vast landscape
- Wildlife: A few seagulls
- Lighting variants: 3 versions (cool dawn / golden hour / overcast twilight), user picks best
- Aspect: 16:9 landscape, full-bleed viewport background
- Composition: Wanderer and ruin mid-frame or upper-third; bottom third naturally dark for text overlay
- Output as `public/screens/title-screen.png`

**Layout and typography**
- Full-bleed title-screen.png with CSS gradient darkening the lower third
- "THREADBARE" in Cinzel, gold, wide letter-spacing
- Two-line lore fragment in italic Alegreya Sans
- Plain text menu items (no buttons/boxes/icons): New World, Continue (hidden until save system), Settings, Credits
- Version stamp bottom-right, mute toggle bottom-left

**Audio behavior**
- `public/audio/theme-drone.mp3` already exists in the repo
- HTMLAudioElement with `useThemeMusic` hook
- Play on first user interaction, fade in over 3s
- Fade out on "New World" over 1.5s, then transition
- Mute persists to localStorage

**App.tsx integration**
- Add `'start'` to GamePhase union type as new default phase
- `?view=game` and `?view=hexv2` continue to skip start screen
- "New World" sets phase to `worldgen` with 600ms fade-out transition

**Settings and Credits modals**
- Use existing `Modal` primitive (`src/components/shared/Modal.tsx`)
- Settings stub: volume slider, fog default toggle, version/seed display
- Credits: game title, author, technology credits, closing lore line

### Claude's Discretion

- Transition choreography details (loading state between start and worldgen, or simple fade)
- Exact gradient opacity curve tuning
- Settings modal layout
- Credits modal scroll behavior and content ordering
- Loading skeleton or spinner during worldgen mount
- Test coverage approach (unit vs snapshot vs integration)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

---

## Summary

Phase 9 adds an atmospheric title/main-menu screen that players see first when opening the game (no URL params). The work is primarily React UI with no new engine dependencies: a new `StartPage` component, a custom audio hook, two stub modals, a small constants file, and a one-line integration point in `App.tsx`. All infrastructure the phase depends on is already in place — the audio file exists, the title art exists, fonts are loaded, design tokens are in `index.css`, and the Modal primitive is fully working.

The phase divides cleanly into four areas of concern: (1) the static layout and CSS composition with full-bleed background and gradient overlay; (2) the `useThemeMusic` audio hook, which is the only technically nuanced piece (browser autoplay policy, volume ramp, promise-based fade, localStorage mute persistence); (3) the Settings and Credits modals, which are low-complexity wrappers around the existing Modal primitive; and (4) the App.tsx phase integration, which requires adding a `'start'` variant to the `GamePhase` union and changing the default.

Everything needed is already defined in `09-CONTEXT.md`, `09-UI-SPEC.md`, and the canonical design doc at `Docs/plans/2026-03-23-start-page-design.md`. The constants file has already been created (`src/components/StartPage/startPageConstants.ts`). The planner should treat this as a well-specified, low-ambiguity implementation phase.

**Primary recommendation:** Implement in three waves — Wave 0 (test infrastructure), Wave 1 (layout + constants + App.tsx integration), Wave 2 (audio hook + modals + verification).

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | 18.x (already in project) | Component system | Project stack |
| TypeScript | 5.x (already in project) | Type safety | Project stack |
| Lucide React | already in project | Volume2 / VolumeX icons for mute toggle | Already used across project |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `HTMLAudioElement` | Web API (no install) | Theme music playback | Single looping track — no library needed |
| `localStorage` | Web API (no install) | Mute state persistence | Simple boolean persistence |
| CSS custom properties | (project tokens in `src/index.css`) | All styling | Project convention |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| HTMLAudioElement + hook | Howler.js | Howler adds ~70KB; overkill for one looping track. Project design doc specifies HTMLAudioElement |
| CSS opacity transition | Framer Motion fade | Framer Motion is not in this project; CSS is simpler and sufficient |
| Manual `useState` fade | AnimateMount primitive | AnimateMount exists in project; either approach works — executor discretion per CONTEXT.md |

**Installation:** No new packages required. All dependencies are already in the project.

---

## Architecture Patterns

### Recommended Project Structure

```
src/components/StartPage/
├── StartPage.tsx           # main component — layout, state, event wiring
├── StartPage.css           # component styles (OR inline style props per project convention)
├── startPageConstants.ts   # ALREADY EXISTS — all tunable constants
├── useThemeMusic.ts        # audio hook — HTMLAudioElement, fade in/out, mute
├── SettingsModal.tsx       # stub settings modal (volume + fog toggle)
└── CreditsModal.tsx        # credits modal (scrollable list)
```

### Pattern 1: App.tsx Phase Integration

**What:** `GamePhase` is a discriminated union. Add `'start'` as initial phase. Dev view shortcuts already return early (before `useState`) and must remain unchanged.

**When to use:** Any time a new top-level screen is added to the app.

**Current shape (from `src/App.tsx` lines 24–27 and 64–65):**
```typescript
// Current
type GamePhase =
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string };

const [gamePhase, setGamePhase] = useState<GamePhase>(() =>
  viewParam === 'game' ? quickStartPhase(42) : { phase: 'worldgen' }
);
```

**Target shape:**
```typescript
type GamePhase =
  | { phase: 'start' }
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string };

const [gamePhase, setGamePhase] = useState<GamePhase>(() =>
  viewParam === 'game' ? quickStartPhase(42) : { phase: 'start' }
);
```

The dev view shortcuts (`if (viewParam === 'hexv2')` etc.) appear on lines 47–62, before any `useState` calls — they are unaffected by this change.

### Pattern 2: useThemeMusic Hook

**What:** Encapsulates HTMLAudioElement lifecycle — creation, fade-in on first interaction, fade-out on "New World", mute toggle with localStorage persistence.

**When to use:** Owned by `StartPage.tsx`. Called once, exposes `{ play, fadeOut, muted, toggleMute, setVolume }`.

**Key implementation notes:**
- `audio.play()` returns a Promise. Browser may reject it before user interaction. Wrap in `.catch(() => {})`.
- Volume ramp (fade in/out) requires `setInterval` or `requestAnimationFrame` stepping, NOT CSS — `HTMLAudioElement.volume` is a JS property.
- Cleanup in `useEffect` return: `audio.pause(); audio.src = ''` to release media resource.
- `localStorage.getItem(THEME_MUTE_STORAGE_KEY)` on mount sets initial mute state.
- `audio.loop = true` for seamless looping.

```typescript
// Source: Docs/plans/2026-03-23-start-page-design.md (audio system sketch)
function useThemeMusic(src: string, volume: number, muted: boolean) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // Expose: play(), fadeIn(), fadeOut() => Promise<void>, setVolume(), muted, toggleMute()
}
```

**fadeOut must return a Promise** so `StartPage.tsx` can `await fadeOut()` before calling `setGamePhase({ phase: 'worldgen' })`.

### Pattern 3: Full-Bleed Layout with Gradient Overlay

**What:** CSS absolute-positioning stack — background image covers viewport, gradient div sits on top, content div is positioned in the lower third.

**From `09-UI-SPEC.md` layout contract (verbatim):**
```
<div class="start-page">         /* position: relative; width: 100vw; height: 100dvh; overflow: hidden */
  <img class="start-page__bg" /> /* object-fit: cover; object-position: center top; position: absolute; inset: 0 */
  <div class="start-page__gradient" /> /* position: absolute; inset: 0 */
  <div class="start-page__content">   /* position: absolute; bottom: 12%; left: 50%; transform: translateX(-50%) */
    <h1 /><p /><nav />
  </div>
  <button class="start-page__mute" /> /* position: absolute; bottom: 16px; left: 16px */
  <span class="start-page__version" /> /* position: absolute; bottom: 16px; right: 16px */
</div>
```

**Gradient (verbatim from design spec):**
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

### Pattern 4: Modal Usage

**What:** Settings and Credits modals wrap existing `Modal` primitive — `Modal.Header`, `Modal.Body`, `Modal.Footer`.

**From `src/components/shared/Modal.tsx`:**
- `Modal` takes `open: boolean`, `onClose: () => void`, `maxWidth?: number` (default 600), `animation?` (default `'anim-fade-up'`)
- Portals to `document.body` via `createPortal`
- Handles Escape key and backdrop click internally
- `max-height: 75vh`, scrollable body via `Modal.Body`
- Gold border (`--border-gold`), dark gradient background

```typescript
// Source: src/components/shared/Modal.tsx
<Modal open={settingsOpen} onClose={() => setSettingsOpen(false)}>
  <Modal.Header onClose={() => setSettingsOpen(false)}>Settings</Modal.Header>
  <Modal.Body>
    {/* volume slider, fog toggle, version display */}
  </Modal.Body>
</Modal>
```

### Anti-Patterns to Avoid

- **`<div onClick>` for menu items:** Menu items MUST be `<button>` elements for keyboard accessibility. The design explicitly specifies this (buttons styled as plain text).
- **`audio.play()` without catch:** Autoplay policy means this Promise can reject. Always wrap in `.catch(() => {})` or handle the rejection.
- **`setGamePhase` before fadeOut completes:** Must await the audio fade-out before transitioning. Calling transition immediately causes the audio to cut off, not fade.
- **Importing `startPageConstants.ts` from App.tsx:** App.tsx should only know about `'start'` as a phase string. Constants stay in the StartPage module.
- **CSS `display: none` vs `visibility: hidden` for Continue:** Use `display: none` to avoid stale tab stop — `visibility: hidden` still participates in tab order.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal with backdrop, Escape, portal | Custom modal | `Modal` primitive (`src/components/shared/Modal.tsx`) | Already handles portal, keyboard, animation, accessibility |
| Volume/mute icons | Custom SVG | `Volume2` / `VolumeX` from Lucide React | Already in project; consistent with other icon usage |
| Audio for single looping track | Howler.js or Web Audio API | `HTMLAudioElement` directly | Design spec specifies HTMLAudioElement; no library needed for one looping file |
| Design tokens | Hardcoded hex values | CSS custom properties from `index.css` | All tokens already defined: `--bg-abyss`, `--accent-gold`, `--text-secondary`, etc. |
| Text constants | Inline string literals | `startPageConstants.ts` | File ALREADY EXISTS with all constants — import from there |

**Key insight:** This phase has a remarkably complete pre-existing foundation. The constants file exists, the audio file exists, the title art exists, the fonts are loaded, and the Modal primitive is tested and working. The implementation is wiring these together, not building infrastructure.

---

## Common Pitfalls

### Pitfall 1: Browser Autoplay Policy

**What goes wrong:** `audio.play()` is called on component mount. Browser throws `NotAllowedError: play() failed because the user didn't interact with the document first`.

**Why it happens:** All modern browsers block autoplay of unmuted audio until a user gesture has occurred on the page.

**How to avoid:** Do NOT call `play()` in `useEffect` on mount. Instead, register a one-time interaction listener (click, keydown) on the start page. On first interaction, call `play()` and begin fade-in. Remove the listener after it fires.

**Warning signs:** Console error `Uncaught (in promise) DOMException: play() failed`. Audio hook's `play()` invoked without user gesture.

### Pitfall 2: Race Condition on "New World" Click

**What goes wrong:** Player clicks "New World" while audio is still fading in. `fadeOut()` is called, then `setGamePhase` is called synchronously, unmounting `StartPage` and killing the fade-out interval before completion.

**Why it happens:** If fade-out is implemented with `setInterval` inside the hook, unmounting the component clears the interval via cleanup — the audio never finishes fading.

**How to avoid:** The `fadeOut()` function should control its own interval cleanup outside the component lifecycle. One approach: run the interval directly on the audio element reference, not inside a React effect. Alternatively, delay `setGamePhase` until the fade Promise resolves.

**Warning signs:** Audio cuts abruptly instead of fading when clicking "New World".

### Pitfall 3: GamePhase Union TypeScript Error

**What goes wrong:** After adding `{ phase: 'start' }` to `GamePhase`, existing exhaustiveness checks or switch statements in `App.tsx` or other files fail TypeScript compilation.

**Why it happens:** The `GamePhase` union is used in a conditional chain (lines 105–120 in App.tsx). TypeScript may warn if the `'start'` case is not handled.

**How to avoid:** Add the `StartPage` render branch to App.tsx's phase conditionals. The `'start'` branch should come first (before worldgen check) and render `<StartPage onNewWorld={...} />`.

**Warning signs:** `npm run build` TypeScript errors about unhandled discriminated union members.

### Pitfall 4: Viewport Height on Mobile/Unusual Displays

**What goes wrong:** Using `height: 100vh` causes the start page to be cut off on mobile browsers because `100vh` includes the browser chrome in some environments.

**Why it happens:** `100vh` is the visual viewport height (including hidden chrome). On some mobile browsers this causes overflow.

**How to avoid:** Use `height: 100dvh` (dynamic viewport height) for the start page container. This matches the project's existing viewport contract (`html, body, #root { height: 100dvh }`).

**Warning signs:** Start page content cut off or scrollable at non-desktop viewports.

### Pitfall 5: title-screen.png Path Mismatch

**What goes wrong:** `startPageConstants.ts` references `/screens/title-screen.png` but the file loads with 404.

**Why it happens:** The constant already exists as `START_PAGE_BG_IMAGE = '/screens/title-screen.png'`. The file exists at `public/screens/title-screen.png`. These must match exactly.

**How to avoid:** Verified: `public/screens/title-screen.png` exists. The constant is correct. Do not change the path.

**Warning signs:** Background falls back to solid `--bg-abyss` dark color (expected fail-soft behavior) even when art should be present.

---

## Code Examples

Verified patterns from official sources and existing project code:

### App.tsx Phase Integration

```typescript
// Source: src/App.tsx (existing shape, modified for 'start' phase)
import { StartPage } from './components/StartPage/StartPage';

type GamePhase =
  | { phase: 'start' }
  | { phase: 'worldgen' }
  | { phase: 'selection' }
  | { phase: 'playing'; archetype: AscendantArchetype; avatarName: string };

// In component body — change default from 'worldgen' to 'start':
const [gamePhase, setGamePhase] = useState<GamePhase>(() =>
  viewParam === 'game' ? quickStartPhase(42) : { phase: 'start' }
);

// Add branch before the worldgen render (around line 104):
if (gamePhase.phase === 'start') {
  return <StartPage onNewWorld={() => setGamePhase({ phase: 'worldgen' })} />;
}
```

### useThemeMusic Hook Sketch

```typescript
// Source: Docs/plans/2026-03-23-start-page-design.md
// Handles: autoplay policy, fade in/out, mute persistence
export function useThemeMusic(src: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(
    () => localStorage.getItem(THEME_MUTE_STORAGE_KEY) === 'true'
  );

  useEffect(() => {
    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = 0;
    audio.muted = muted;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, [src]); // muted handled separately via audio.muted

  const play = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.play().catch(() => {}); // swallow autoplay rejection
  };

  const fadeOut = (): Promise<void> => {
    return new Promise((resolve) => {
      // ramp volume to 0 over THEME_FADE_OUT_MS, then resolve
    });
  };

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    localStorage.setItem(THEME_MUTE_STORAGE_KEY, String(next));
    if (audioRef.current) audioRef.current.muted = next;
  };

  return { play, fadeOut, muted, toggleMute };
}
```

### Modal Usage Pattern

```typescript
// Source: src/components/shared/Modal.tsx (existing API)
const [settingsOpen, setSettingsOpen] = useState(false);

<Modal open={settingsOpen} onClose={() => setSettingsOpen(false)}>
  <Modal.Header onClose={() => setSettingsOpen(false)}>Settings</Modal.Header>
  <Modal.Body>
    {/* stub content */}
  </Modal.Body>
</Modal>
```

### Image Fail-Soft Pattern

```typescript
// Background image with fail-soft to solid color
<img
  src={START_PAGE_BG_IMAGE}
  alt=""
  role="presentation"
  className="start-page__bg"
  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
/>
// The CSS background-color on the parent handles the fallback:
// background-color: var(--bg-abyss)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Drop straight into worldgen | Start screen as default phase | Phase 9 | Player gets atmospheric introduction before any game state loads |
| `{ phase: 'worldgen' }` default | `{ phase: 'start' }` default | Phase 9 | One-line change in App.tsx `useState` initializer |
| No audio on start screen | HTMLAudioElement drone | Phase 9 | Ambient music adds atmosphere; browser autoplay handled via first-interaction trigger |

**Deprecated/outdated:**
- Default `worldgen` phase in App.tsx: replaced by `start` phase default in this phase. The worldgen flow is unchanged; it is now reached by clicking "New World" from the start screen or via `?view=game` dev shortcut.

---

## Open Questions

1. **Concept art generation tooling**
   - What we know: The design doc calls for generating 3 variants with different lighting. `public/screens/title-screen.png` already exists (may be placeholder or an existing generate). The `image-manipulation` skill covers hex tile processing but not full-scene concept art generation.
   - What's unclear: Whether the existing `title-screen.png` is the final art, a placeholder, or one of the variants to choose from. The planner should include a task for the art generation step.
   - Recommendation: Include a Wave 0 task that verifies/generates the title screen art before implementing the component. If the existing PNG is a placeholder, the generation task uses the prompt spec from CONTEXT.md.

2. **Continue item visibility condition**
   - What we know: The design spec says Continue is hidden when no save exists. No save system exists yet.
   - What's unclear: How to detect "save exists" — localStorage key? Future engine method?
   - Recommendation: Hardcode `display: none` for Continue in this phase. Add a `// TODO: show when save system ships` comment. No save detection logic needed now.

3. **Transition choreography (Claude's Discretion)**
   - What we know: The design spec says fade-out the start page over 600ms, then mount worldgen. The `AnimateMount` primitive exists in the project (`src/components/shared/`).
   - Recommendation: Use a simple `useState(opacity)` approach: set opacity to 0 in a 600ms CSS transition on the wrapper div, then call `setGamePhase`. This is the least infrastructure approach and matches the fail-soft philosophy.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set in `.planning/config.json` — treated as enabled.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + @testing-library/react |
| Config file | `vitest.config.ts` (project root) |
| Quick run command | `npx vitest run src/components/StartPage` |
| Full suite command | `npm test` |

Component tests require the `// @vitest-environment jsdom` directive at the top of each test file (see existing pattern in `src/components/shared/__tests__/Modal.test.tsx`).

### Phase Requirements to Test Map

Phase 9 has no formal requirement IDs (new capability). The success criteria map to tests as follows:

| Success Criterion | Behavior | Test Type | Automated Command |
|-------------------|----------|-----------|-------------------|
| Start screen shows on no params | StartPage renders title, lore, menu | unit | `npx vitest run src/components/StartPage/__tests__/StartPage.test.tsx` — Wave 0 gap |
| "New World" transitions to worldgen | onNewWorld callback called on click | unit | same file |
| Dev shortcuts skip start screen | `?view=game` mounts GameView, not StartPage | unit (App.tsx test) | `npx vitest run src/components/__tests__/App.test.tsx` — Wave 0 gap |
| Dark ambient music loops on interaction | fadeIn called after first user gesture | unit (hook test) | `npx vitest run src/components/StartPage/__tests__/useThemeMusic.test.ts` — Wave 0 gap |
| Mute state persists to localStorage | toggleMute writes to localStorage key | unit (hook test) | same file |
| Audio failure degrades gracefully | play() rejection caught silently | unit (hook test) | same file |
| Continue hidden (no save) | Continue item not in DOM | unit | StartPage.test.tsx |
| Settings modal opens | Settings button click → modal visible | unit | StartPage.test.tsx |
| Credits modal opens | Credits button click → modal visible | unit | StartPage.test.tsx |
| Image failure degrades gracefully | img onError hides image, bg-abyss shows | unit | StartPage.test.tsx |

### Sampling Rate

- **Per task commit:** `npx vitest run src/components/StartPage`
- **Per wave merge:** `npm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `src/components/StartPage/__tests__/StartPage.test.tsx` — covers render, menu items, modal open/close, Continue hidden, image fail-soft
- [ ] `src/components/StartPage/__tests__/useThemeMusic.test.ts` — covers fade-in on interaction, fade-out Promise, mute toggle, localStorage persistence, play() rejection handling
- [ ] `src/components/__tests__/App.test.tsx` — covers dev shortcut bypasses start screen (if not already present)

---

## Pre-Existing Assets (No Action Required)

Verified through filesystem inspection:

| Asset | Path | Status |
|-------|------|--------|
| Title screen art | `public/screens/title-screen.png` | EXISTS |
| Theme music | `public/audio/theme-drone.mp3` | EXISTS |
| Constants file | `src/components/StartPage/startPageConstants.ts` | EXISTS — fully populated |
| Modal primitive | `src/components/shared/Modal.tsx` | EXISTS — tested, working |
| Lucide icons | npm package (project dep) | IN PROJECT |
| Cinzel font | `--font-display` CSS token | LOADED |
| Alegreya Sans font | `--font-body` CSS token | LOADED |
| All design tokens | `src/index.css` | IN PROJECT |

The `StartPage/` directory exists with only the constants file. All other files (`StartPage.tsx`, `useThemeMusic.ts`, `SettingsModal.tsx`, `CreditsModal.tsx`) are new.

---

## Sources

### Primary (HIGH confidence)

- `Docs/plans/2026-03-23-start-page-design.md` — authoritative design spec: layout, audio system, constants, NFP compliance, fail-soft, accessibility, implementation notes
- `.planning/phases/09-start-screen/09-CONTEXT.md` — locked user decisions and integration points
- `.planning/phases/09-start-screen/09-UI-SPEC.md` — layout contract, color/typography spec, interaction contract, component inventory
- `src/App.tsx` — actual current code for GamePhase type and dev view shortcuts (lines 24–65 verified)
- `src/components/shared/Modal.tsx` — Modal API verified: `open`, `onClose`, `maxWidth`, portal behavior, Header/Body/Footer composition
- `src/components/StartPage/startPageConstants.ts` — constants file already exists with all values
- `vitest.config.ts` — test framework config, jsdom environment requires per-file directive
- `src/components/shared/__tests__/Modal.test.tsx` — established test pattern for component tests

### Secondary (MEDIUM confidence)

- `STYLE.md` — design tokens, typography, Threadbare aesthetic (cross-confirmed with `09-UI-SPEC.md`)
- `Docs/ui-patterns.md` — modal and accessibility conventions (confirmed Modal usage pattern)

### Tertiary (LOW confidence)

None.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new dependencies; all tools verified in codebase
- Architecture: HIGH — based on verified existing code (App.tsx, Modal.tsx, constants file)
- Pitfalls: HIGH — browser autoplay policy is well-documented; others verified against actual code
- Test approach: HIGH — existing test patterns verified in `Modal.test.tsx`

**Research date:** 2026-03-23
**Valid until:** 2026-05-23 (stable domain — React, HTMLAudioElement API are stable)
