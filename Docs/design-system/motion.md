# Motion & Animation

**Read this when:** adding transitions, animations, loading states, or any time-based visual change.

---

## Principles

1. **Motion serves meaning.** Every animation should communicate something: an element appearing, a state changing, an action completing. Animation for decoration slows the game down.
2. **Fast by default.** Game UI responds at `--anim-fast` (150ms). Only narrative moments use `--anim-slow`.
3. **Respect the simulation.** During simulation running, minimize idle animations — the world's activity should feel like the only thing moving.
4. **Spatial consistency.** Elements that enter from below exit below. Elements that come from the right exit right. Don't mix entry/exit directions.
5. **No bounce or spring.** The Dark Tapestry aesthetic is measured and ancient, not bouncy. Use `ease-out` for entrances, `ease-in` for exits. Never `spring` or `bounce` easing.

---

## Timing Tokens

| Token | Value | Use |
|-------|-------|-----|
| `--anim-fast` | 150ms | Hover states, micro-interactions, tooltip appear |
| `--anim-normal` | 200ms | Panel mount/unmount, overlay transitions |
| `--anim-slow` | 400ms | Full-screen overlays, narrative reveals |

**Rule:** Do not use durations outside these three. If something feels too slow at 200ms, use 150ms. Don't invent 300ms or 250ms.

---

## Easing

| Use | Easing |
|-----|--------|
| Element entering | `ease-out` |
| Element exiting | `ease-in` |
| State transition (hover, active) | `ease` |
| Pulse / breathe loops | `ease-in-out` |

---

## Animation Classes (from `src/index.css`)

Use `AnimateMount` wrapper with these animation names:

| Class pair | Entry | Exit | Use |
|-----------|-------|------|-----|
| `anim-fade` | `anim-fade-enter` | `anim-fade-exit` | Generic overlays, tooltips |
| `anim-fade-up` | `anim-fade-up-enter` | `anim-fade-up-exit` | Modals, bottom drawers |
| `anim-fade-down` | `anim-fade-down-enter` | `anim-fade-down-exit` | Dropdowns from top bar |

Usage:
```tsx
<AnimateMount show={isOpen} animation="anim-fade-up">
  <MyPanel />
</AnimateMount>
```

---

## Keyframe Inventory

| Keyframe | Use |
|----------|-----|
| `fadeIn` | Generic fade + 4px upward drift on enter |
| `fadeInOnly` | Pure opacity (no movement) |
| `fadeOutOnly` | Pure opacity exit |
| `fadeSlideUpIn/Out` | 8px upward movement + fade |
| `fadeSlideDownIn/Out` | 8px downward movement + fade |
| `breathe` | Opacity 0.4→0.8 loop — empty states, waiting indicators |
| `slideUp` | Full translateY(100%) entrance — used for bottom drawers |
| `pulseGlow` | Box shadow pulse with `--sphere-color` |
| `pulseGoldFlare` | One-shot gold box shadow pulse |
| `pulseDoomFlare` | One-shot red box shadow pulse |
| `shakeNo` | Left-right shake — rejection / cannot afford feedback |

---

## One-Shot Feedback Pulses

Applied as a class, removed after animation completes:

| Class | When to use |
|-------|-------------|
| `.pulse-gold` | Positive event: essence gained, intervention succeeded |
| `.pulse-doom` | Negative event: doom advanced, intervention failed |
| `.anim-shake-no` | Action blocked: not enough essence, out of range |

---

## Persistent Animations

These run continuously but must be lightweight:

| Class | Use | Performance note |
|-------|-----|-----------------|
| `.animate-breathe` | Empty state placeholder, waiting for data | Low CPU — opacity only |
| `animate-pulse` (Tailwind) | Alert dot, hostile indicator | Only use on tiny elements |
| Agent marker breathing | `breathe`-family pulse on the HexMapV2 agent layer | Runs per-agent — cap visible agents in spotlight tier |

**Rule:** Never run `pulseGlow` or `pulseGoldFlare` continuously — one-shot only. Continuous glow creates visual noise that competes with the map.

---

## Hover Transitions

All interactive elements use CSS transitions, not animations:

```css
transition: background-color var(--anim-fast) ease,
            border-color var(--anim-fast) ease,
            color var(--anim-fast) ease;
```

**Rule:** Only transition `background-color`, `border-color`, `color`, `opacity`, and `transform`. Never transition `width`, `height`, `padding`, or layout properties — they trigger reflow.

---

## Scroll Behavior

- Panel scrolling: instant (no `scroll-behavior: smooth` inside game UI)
- Page-level navigation: not applicable (single-page game)

---

## Do Not

- ❌ Use `transition: all` — always be explicit about what transitions
- ❌ Spring/bounce easing
- ❌ Durations longer than `--anim-slow` (400ms) for any UI element
- ❌ Animate `width`, `height`, `padding`, or `margin`
- ❌ Run glow animations continuously on elements larger than 8px
- ❌ Add idle animations to more than 3 elements simultaneously

---

## Ceremonial tier (UI Law 41, amended 2026-08-06)

The duration caps above govern **game-UI chrome**. The **ceremonial tier** — encounter-veil entrance staggers (0.2–1.8s), long art zooms (up to 8s), 1.2s informational fades — is a named exception whose spec is the veil's own constants (`ENTRANCE_DELAYS`, `watchedEntrance`). It exists for arrival ceremony only; it is not a license for `transition: all` (banned everywhere) and it collapses to plain `--anim-fast` fades under `prefers-reduced-motion` (UI Law 44).

### How it is implemented (THR-1010)

The tier lives in `src/components/Game/EncounterVeil.tsx` as **inline** styles, and that one fact decides the shape of everything below.

**Reduced motion is read in JS, not CSS.** An `@media (prefers-reduced-motion: reduce)` block cannot reach an inline `style={{ transition: … }}` — inline wins on specificity — so the veil calls `usePrefersReducedMotion()` (`src/hooks/usePrefersReducedMotion.ts`, a `useSyncExternalStore` over `matchMedia`) and folds the answer into the style objects through two helpers:

| Helper | Full motion | Reduced |
|---|---|---|
| `ceremonialDelay(d)` | `d` | `0` |
| `ceremonialDuration(d)` | `d` | `REDUCED_MOTION_FADE_S` (0.15s, mirroring `--anim-fast`) |

The three entrance helpers (`aftermathEntrance`, `watchedEntrance`, `entranceStyle`) and the three art layers additionally **drop their `transform`** under reduced motion, which is what removes the 8s zoom and the translate-up.

**Every ceremonial fade routes through a helper.** Two gold dividers once wrote `transition: opacity 1s ease 0.9s` inline and so survived the collapse at a ~1s delay — measured in the browser under real `page.emulateMedia({ reducedMotion: 'reduce' })`, not in jsdom. A new ceremonial fade uses `ceremonialDuration`/`ceremonialDelay`; a literal duration in an entrance style is the bug.

**What reduced motion does *not* do:** remove a beat. Law 44's second clause forbids carrying information by motion alone, so every element still appears — as one `--anim-fast` fade instead of a stagger. The regression lock is in `EncounterVeil.test.tsx` § *reduced motion (Law 44)*, which asserts the same beat count in both arms.

**Hover and interaction transitions are not ceremonial** and keep their normal property-scoped durations in both arms.
