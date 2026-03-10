# FE Polish Sprint #1 — Design Doc

**Date:** 2026-03-10
**Scope:** Micro-animations, empty states, ARIA live regions, spacing audit, error boundary
**Approach:** Minimal React wrapper (AnimateMount) + pure CSS animations. Zero new dependencies.
**Prerequisite audit:** `Docs/plans/2026-03-10-frontend-audit-and-backlog.md`

---

## 1. AnimateMount Utility Component

### Problem
React removes components from the page instantly when their `show` condition becomes false. There's no window to play an exit animation — the element is just gone. This makes every overlay, panel, and modal feel like a light switch instead of a door.

### Solution
A small (~30 line) wrapper component: `<AnimateMount>`. It delays the actual removal from the page long enough for a CSS exit animation to play.

### Behavior
1. **Mount (show becomes true):** Renders the child immediately. After one animation frame, applies the `-enter` CSS class. The enter animation plays.
2. **Unmount (show becomes false):** Applies the `-exit` CSS class. Waits for `animationend` event (with a safety timeout). Then removes from DOM.
3. **Quick toggle:** If `show` flips back to true during exit, cancels the exit and re-enters.

### API
```tsx
<AnimateMount
  show={boolean}         // controls visibility
  animation="fade-in"    // CSS class prefix (looks for .fade-in-enter, .fade-in-exit)
  duration={200}         // safety timeout in ms (fallback if animationend doesn't fire)
>
  {children}
</AnimateMount>
```

### File location
`src/components/shared/AnimateMount.tsx`

### Test coverage
- Renders children when show=true
- Does not render when show=false (after exit completes)
- Applies enter class on mount
- Applies exit class before unmount
- Handles rapid show toggle without breaking
- Calls animationend cleanup

---

## 2. Animation CSS Classes

Added to `src/index.css` alongside existing `@keyframes`. Each animation has an `-enter` and `-exit` variant.

### Animation inventory

| Class prefix | Enter effect | Exit effect | Duration | Use case |
|---|---|---|---|---|
| `anim-fade` | Opacity 0→1 | Opacity 1→0 | 200ms | Generic overlays, backdrops |
| `anim-fade-up` | Opacity 0→1 + translateY(8px→0) | Reverse | 200ms | Modals, panels rising into view |
| `anim-fade-down` | Opacity 0→1 + translateY(-8px→0) | Reverse | 200ms | Popovers dropping from triggers |
| `anim-slide-up` | translateY(100%→0) | Reverse | 200ms | ActionDrawer (already has this, standardize) |
| `pulse-gold` | Single gold box-shadow flare | N/A (one-shot) | 600ms | Essence change, new narrative entry |
| `pulse-doom` | Single red box-shadow flare | N/A (one-shot) | 600ms | Doom increase |

### Naming convention
- `anim-*` prefix for mount/unmount animations (used with AnimateMount)
- `pulse-*` prefix for one-shot highlight effects (applied via temporary class)
- All durations as CSS custom properties: `--anim-fast: 150ms`, `--anim-normal: 200ms`, `--anim-slow: 400ms`

### Easing
`ease-out` for enters (fast start, gentle landing — feels responsive).
`ease-in` for exits (gentle start, fast departure — gets out of the way).

---

## 3. Component Animation Mapping

### Overlays wrapped in AnimateMount

| Component | Animation | Notes |
|---|---|---|
| NarrativeLog panel | `anim-fade-up` | The toggle pill keeps its existing `transition-all duration-200` |
| ScryOverlay | `anim-fade` | Full-screen, backdrop + content fade together |
| AgentProfileModal | `anim-fade-up` | Slides up like a character sheet being presented |
| StrandView | `anim-fade` | Full-screen overlay |
| AgendaPicker | `anim-fade` | Center overlay |
| HarvestScreen | `anim-fade` | Full-screen overlay |
| MandateTracker popover | `anim-fade-down` | Drops from the bar above it |

### In-place value feedback

| Component | Trigger | Effect | Implementation |
|---|---|---|---|
| EssencePanel bars | Essence value changes between ticks | `pulse-gold` class added to the bar for 600ms, then removed | useEffect watching essence values, temporary className |
| DoomBar | Doom value increases | `pulse-doom` class added to the progress bar for 600ms | useEffect watching doom value |
| NarrativeLog entries | New entry added | New entries get `anim-fade-up-enter` class on first render | Key-based class assignment, entry tracks `isNew` for one render cycle |
| RetinuePanel rows | Mouse hover | Replace manual `onMouseEnter/Leave` style mutation with CSS `transition: background-color 150ms ease` | Remove inline event handlers, add Tailwind `transition-colors duration-150` |
| LocationView agent buttons | Mouse hover | Same as RetinuePanel | Same approach |

### Why replace the manual hover handlers?
Currently, hovering sets `element.style.backgroundColor` directly via JavaScript. This works but:
- Bypasses CSS, so it can't be themed or overridden
- No transition — snaps instantly
- More code than needed

Replacing with a CSS class (`transition-colors duration-150` + `hover:bg-[var(--bg-hover)]`) gives smooth fades and is one line instead of six.

---

## 4. Empty States

### Design principles
- Stay in the fiction. The game world is always speaking, even when nothing is happening.
- Use the existing `breathe` keyframe animation (slow opacity pulse) on empty-state text.
- Muted color: `var(--text-tertiary)` — present but not demanding attention.
- Italic text to distinguish from active content.

### Empty state copy

| Component | Condition | Current text | New text |
|---|---|---|---|
| RetinuePanel | `agents.length === 0` | "No agents under your influence yet." | "The threads of fate lie still. No souls yet attend your court." |
| LocationView | No location selected | (blank) | "Select a hex to peer into the world below." |
| LocationView agents | No agents at location | "No agents present" | "This place lies quiet — for now." |
| LocationView encounters | No encounters | "No encounters at this location" | "The stillness here is unbroken." |
| NarrativeLog | No events | "Awaiting the first whispers of fate..." | Keep as-is (already good). Add `breathe` animation. |

### Empty state component pattern
```tsx
<p
  className="text-center italic animate-breathe"
  style={{ color: 'var(--text-tertiary)', padding: 'var(--panel-padding)' }}
>
  {message}
</p>
```

Where `animate-breathe` maps to the existing `breathe` keyframe in index.css.

---

## 5. ARIA Live Regions

### What this does
Tells screen readers to announce content changes automatically, so blind players can follow the game.

### Implementation

| Component | Attribute | Why this level |
|---|---|---|
| NarrativeLog event list container | `aria-live="polite"` | Events are important but not urgent — wait for a pause |
| DoomBar wrapper | `aria-live="assertive"` + only announces on stage transitions | Doom stage changes are critical — interrupt immediately |
| MandateTracker wrapper | `aria-live="polite"` | Mandate progress is informational |
| EventLog container | `aria-live="polite"` | Background event stream |

### DoomBar stage announcements
Add a visually-hidden `<span>` inside DoomBar that only updates text when the doom *stage* changes (not every tick). This prevents the screen reader from constantly announcing minor doom percentage changes.

```tsx
<span className="sr-only" aria-live="assertive">
  {stageChanged ? `Doom has reached ${stageName}` : ''}
</span>
```

`sr-only` is a Tailwind utility that hides the element visually but keeps it available to screen readers.

---

## 6. Spacing Audit

### Grid system
All spacing values snap to a 4px grid: 4, 8, 12, 16, 20, 24, 32px.

### CSS custom properties (add to :root)
```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
```

### Audit targets

| What | Current state | Standardize to |
|---|---|---|
| Panel internal padding | Varies (12px, 16px, 1rem) | `var(--panel-padding)` = 16px (already defined, enforce usage) |
| Gap between sidebar sections | Varies (8px, 12px, gap-2, gap-3) | `var(--space-3)` = 12px |
| Border radius on glass panels | Mostly 8px but some use rounded-lg (also 8px) | `var(--panel-radius)` = 0.5rem (already defined, enforce usage) |
| Icon sizes in lists | Varies (12px, 14px, 16px) | 16px for sidebar list icons |
| Section header bottom margin | Varies | `var(--space-2)` = 8px |

### Approach
Grep for inconsistencies, replace with CSS variable references. No visual redesign — just alignment.

---

## 7. GameErrorBoundary

### Problem
Zero error boundaries exist. Any component crash kills the entire game — white screen.

### Solution
A single `GameErrorBoundary` class component wrapping the main game content in `GameView`. (Error boundaries must be class components — React doesn't support them as function components yet.)

### Fallback UI
Themed to match Dark Tapestry aesthetic:
- Background: `var(--bg-surface)`
- Text: "The threads of reality fray here. The world endures." in `var(--text-secondary)`, italic
- "Restore" button that calls `this.setState({ hasError: false })` to retry rendering
- "Copy error details" button for bug reports (copies error message + component stack to clipboard)

### File location
`src/components/shared/GameErrorBoundary.tsx`

### Placement
Wraps the main game area in GameView. Does NOT wrap the entire app (we want the shell/nav to survive if the game area crashes).

---

## Non-goals (explicitly out of scope)

- No responsive/mobile layout work
- No new component library or design system tooling
- No framer-motion or other animation dependencies
- No changes to game mechanics or engine
- No new overlays or panels — only polishing existing ones
- No keyboard shortcut system (FE-07, future sprint)
