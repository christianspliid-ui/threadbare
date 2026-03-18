# UI Design Audit — The Fantasy World Simulator

**Date:** 2026-03-18
**Resolution tested:** 1920x1080
**Design system:** Dark Tapestry (Threadbare aesthetic)
**Fonts:** Cinzel (display), Alegreya Sans (body)
**Stack:** React + TypeScript + Tailwind + CSS Custom Properties

---

## Executive Summary

The UI has a strong foundation: a well-defined color palette (Dark Tapestry), correct viewport-locked layout (48px topbar + 1032px main area), good shared primitive adoption (Modal, Button, AnimateMount, IconButton), and thoughtful interaction patterns (progressive disclosure tiers, overlay mutual exclusion, AnimateMount for mount/unmount).

However, three systemic issues undermine the design system's integrity and create visual entropy:

1. **Three competing styling systems** — CSS variables, Tailwind classes, and hardcoded inline styles coexist without clear rules about when to use which
2. **Hardcoded color values scattered across components** — 6+ color lookup tables define hex values at the component level instead of the design system level
3. **Typography scale not enforced** — some components use `var(--text-*)`, others use Tailwind `text-*`, others use raw `fontSize: '11px'`

The audit below is organized into three implementation phases. Phase 1 fixes things that actively hurt usability. Phase 2 elevates the experience. Phase 3 adds polish.

---

## Phase 1 — Critical (Hierarchy, Usability, Consistency)

### 1.1 Worldgen Screen Uses Wrong Design System

**Problem:** The worldgen screen (`App.tsx` phase=worldgen) uses `bg-amber-50 text-amber-950` — a light amber theme that has zero relationship to the Dark Tapestry system. The sidebar uses `bg-stone-800` but the main area is bright amber. This is the first screen a player sees and it sets the wrong aesthetic expectation.

**Fix:** Restyle the worldgen screen to use Dark Tapestry tokens:
- Background: `var(--bg-abyss)` / `var(--bg-deep)`
- Text: `var(--text-primary)` / `var(--text-secondary)`
- Sidebar: `panel-glass` utility class
- Button: gold gradient already present, keep it
- CosmologyPanel and InfoPanel: restyle to match game panels

**Files:** `src/App.tsx` (lines 80-120), `src/components/Cosmology/CosmologyPanel.tsx`, `src/components/UI/InfoPanel.tsx`

### 1.2 Ascendant Selection Screen Typography Mismatch

**Problem:** The selection screen uses Tailwind color classes (`text-amber-100`, `text-amber-600/60`, `text-stone-400`) instead of CSS variables. ArchetypeCard uses `text-amber-200`, `text-amber-100/70`, `bg-stone-800/60` — all bypassing the design system.

**Fix:** Migrate to CSS variable usage:
- `text-amber-100` → `style={{ color: 'var(--text-primary)' }}`
- `text-stone-400` → `style={{ color: 'var(--text-secondary)' }}`
- `bg-stone-800/60` → `panel-glass` or `panel-glass-raised`

**Files:** `src/components/Ascendant/AscendantSelection.tsx`, `src/components/Ascendant/ArchetypeCard.tsx`

### 1.3 Color Lookup Tables Not Centralized

**Problem:** At least 6 components define their own hardcoded color records:

| Component | Record | Colors (hex) |
|-----------|--------|-------------|
| RetinuePanel | `TIER_COLORS` | #6b7280, #a78bfa, #eab308, #ef4444 |
| RivalPanel | `BEHAVIOR_COLORS` | #dc2626, #7c3aed, #ea580c, #059669 |
| NarrativeLog | `TYPE_COLORS` | #d4a574, #dc2626, #7c3aed, #ea580c |
| HexZoomView | `COLORS` | #0a0a0e, #d4a574, #f0f0f0 |
| SimulationControls | `SEASON_ICONS` | Inline colors |
| Button.tsx | `VARIANT_STYLES` | Hardcoded variant colors |

This means changing a tier color requires finding every component that defines it. A single source of truth doesn't exist.

**Fix:** Create `src/data/uiColorPalette.ts` exporting all semantic color records. Define matching CSS variables in `index.css` for the most-used ones:
```css
--color-tier-1: #6b7280;
--color-tier-2: #a78bfa;
--color-tier-3: #eab308;
--color-tier-4: #ef4444;
--color-behavior-aggressive: #dc2626;
/* etc. */
```

Then import from the central palette file. Components that need dynamic access (SVG, inline styles) use the TS exports; components that can use CSS use the variables.

**Files:** New `src/data/uiColorPalette.ts`, then update RetinuePanel, RivalPanel, NarrativeLog, HexZoomView, SimulationControls, Button.tsx

### 1.4 RivalPanel Accessibility Gap

**Problem:** RivalPanel agent rows have no `role`, no `aria-label`, and no keyboard support. This is the only major sidebar component that's completely inaccessible. The dynamic hostility color bar uses raw RGB calculation (`Math.round(255 * hostility)`) with no color scale semantics.

**Fix:**
- Add `role="list"` to container, `role="listitem"` to rows
- Add `tabIndex={0}` and `onKeyDown` for Enter/Space
- Add `aria-label` with rival name and hostility level
- Replace RGB calculation with a semantic color scale (e.g., 3-stop gradient: green → amber → red)

**Files:** `src/components/Game/RivalPanel.tsx`

### 1.5 TopBar Information Density

**Problem:** The top bar at 48px height packs: identity chip + time controls + essence panel + doom bar + mandate tracker + alerts + rivals button + debug toggle. The text content reads:

> ✦ Kaelith The Storm Marshal ∿ Spring Yr 1 ⏵ ◀ 3× ▶ ✦ 0.0 −1.0 ◉ 0.0 +0.3 ◈ Strange Whispers 0% THREADS OF FATE NEW ⚔ 3 ⚙

This is a lot of information at the same visual weight. The eye has no clear primary focus. Essence values with decimal precision (0.0, −1.0, +0.3) compete with the identity chip and time controls.

**Fix:**
- **Visual weight hierarchy:** Identity chip should be most prominent (larger font, gold accent). Time controls next. Essence values should use a more compact representation.
- **Essence panel:** Show sphere icon + integer value only in compact mode; decimals visible on hover/tooltip
- **Group separators:** The gold divider between left and right groups is good — add subtle background tinting to distinguish the two groups
- **Mandate tracker:** "THREADS OF FATE" label is competing for attention at the same size as other labels. Use `var(--text-tertiary)` for the label, `var(--text-primary)` for the progress

**Files:** `src/components/Game/GameView.tsx` (topbar section), `src/components/Game/EssencePanel.tsx`, `src/components/Game/IdentityChip.tsx`, `src/components/Game/MandateTracker.tsx`

---

## Phase 2 — Refinement (Spacing, Typography, Color, Alignment)

### 2.1 Spacing System Consolidation

**Problem:** Three competing spacing approaches:

| Approach | Used In | Example |
|----------|---------|---------|
| CSS Variables | EssencePanel, DoomBar, NarrativeLog | `var(--panel-padding)`, `var(--space-2)` |
| Tailwind | RetinuePanel, MandateTracker, ActionCard | `px-4 py-2`, `gap-2`, `mb-3` |
| Inline px | HexZoomView, ScryOverlay, AvatarHUD | `padding: '8px'`, `gap: '12px'` |

**Fix:** Establish a rule:
- **CSS variables** for component-level spacing (padding, gaps between sections)
- **Tailwind** for internal element spacing (within a row, between icons and text)
- **Never raw pixel values in inline styles** — migrate all `padding: '8px'` to `var(--space-2)` or Tailwind `p-2`

Priority refactors:
1. HexZoomView SVG constants — convert inline px to CSS variable equivalents
2. AvatarHUD — convert inline spacing to CSS variables
3. ScryOverlay — convert inline spacing to CSS variables

**Files:** HexZoomView.tsx, AvatarHUD.tsx, ScryOverlay.tsx, plus any component with inline `padding`/`margin`/`gap` pixel values

### 2.2 Typography Scale Enforcement

**Problem:** Font sizes are declared three ways:

| Method | Example | Components |
|--------|---------|------------|
| CSS vars | `var(--text-xs)`, `var(--text-sm)` | DoomBar, NarrativeLog, MandateTracker |
| Tailwind | `text-xs`, `text-sm` | ActionCard, RetinuePanel |
| Inline px | `fontSize: '11px'`, `fontSize: '13px'` | HexZoomView, ScryOverlay, SimulationControls |

Tailwind `text-xs` is 12px. CSS `var(--text-xs)` is 16px. They are NOT the same. This creates real inconsistency.

**Fix:**
- Audit every `text-xs` / `text-sm` Tailwind usage and replace with the matching CSS variable
- Audit every inline `fontSize` and replace with `var(--text-*)` scale
- Document the mapping clearly:

| Token | Value | Tailwind equivalent | Use for |
|-------|-------|---------------------|---------|
| `--text-xs` | 16px | (none — Tailwind text-xs is 12px!) | Smallest readable labels |
| `--text-sm` | 17px | ~text-[17px] | Secondary text |
| `--text-base` | 18px | text-lg (close) | Body text |
| `--text-lg` | 21px | text-xl (close) | Section headings |

**Warning:** Tailwind's scale and the custom scale are misaligned. This must be addressed — either override Tailwind's scale in `tailwind.config` or document that Tailwind size classes should never be used for text.

**Files:** All components using `text-xs`, `text-sm`, or inline `fontSize`

### 2.3 Font Family Consistency

**Problem:** Some components explicitly set `fontFamily: 'var(--font-display)'` or `fontFamily: 'Cinzel, serif'` for headings. Others rely on the global `h1-h6` rule. Components that use `<div>` or `<span>` for heading-like text (section labels, panel titles) don't get Cinzel automatically.

**Fix:**
- The `.section-heading` utility class already exists and uses `--font-display`. Audit all panel title elements and ensure they either:
  - Use an actual `<h2>`/`<h3>` element (gets Cinzel via global rule), OR
  - Apply `section-heading` class, OR
  - Have explicit `fontFamily: 'var(--font-display)'`
- Never use `fontFamily: 'Cinzel, serif'` directly — always use `var(--font-display)`

**Files:** RetinuePanel, RivalPanel, WorldPulse, EssencePanel headers

### 2.4 Panel Glass Consistency

**Problem:** The `panel-glass` and `panel-glass-raised` utility classes exist but aren't used universally. Some panels use inline gradients:
- TopBar: `background: 'linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95))'`
- Sidebar: `background: 'linear-gradient(180deg, var(--bg-deep), var(--bg-abyss))'`

These are similar but subtly different from `panel-glass`.

**Fix:**
- Define a `panel-glass-topbar` variant if the topbar needs a distinct gradient
- Migrate the sidebar background to a utility class
- Ensure all floating panels (NarrativeLog pill, AvatarHUD buttons) use `panel-glass`

**Files:** `src/index.css` (add topbar variant), GameView.tsx (topbar + sidebar sections)

### 2.5 Border System Cleanup

**Problem:** Three border approaches:
- CSS vars: `var(--border-subtle)`, `var(--border-medium)`
- Tailwind: `border-stone-700`, `border-stone-600`
- Inline: `border: '1px solid rgba(212,175,55,0.3)'`

**Fix:** Use only CSS variable borders. Tailwind border colors should be replaced with `style={{ borderColor: 'var(--border-subtle)' }}`. Inline rgba gold borders should use `var(--border-accent)`.

**Files:** All components using Tailwind `border-stone-*` or inline border colors

---

## Phase 3 — Polish (Micro-interactions, Transitions, States, Details)

### 3.1 ActionCard Inline Keyframes

**Problem:** ActionCard injects `@keyframes card-pulse` via an inline `<style>` tag conditionally rendered when `playing={true}`. This is non-standard and creates style tags in the DOM on every play action.

**Fix:** Pre-define `card-pulse` and `glyph-pulse` keyframes in `index.css` alongside the other animation keyframes. Remove the inline `<style>` tag from ActionCard.

**Files:** `src/index.css`, `src/components/Game/ActionCard.tsx`

### 3.2 Empty State Animation Consistency

**Problem:** Empty states use `animate-breathe` class correctly, but some empty state messages are plain `<p>` tags without the animation. The WorldPulse component (shown when no retinue agents exist) may not follow the same empty state pattern.

**Fix:** Audit all empty/no-data states and ensure they follow the pattern in UI Patterns doc section 14: italic + `var(--text-tertiary)` + `animate-breathe` + thematic copy.

**Files:** WorldPulse.tsx, LocationView.tsx, any component with a no-data path

### 3.3 Progress Bar Accessibility

**Problem:** EssencePanel progress bars lack `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes. Screen readers can't communicate essence levels.

**Fix:** Add ARIA value attributes to all ProgressBar instances. The shared ProgressBar primitive should accept these as props.

**Files:** `src/components/shared/ProgressBar.tsx`, `src/components/Game/EssencePanel.tsx`

### 3.4 Focus Management on Modal Open/Close

**Problem:** When overlays open (ScryOverlay, AgentProfileModal, StrandView), focus should move to the overlay. When they close, focus should return to the trigger element. Modal.tsx likely handles this, but AnimateMount-wrapped overlays may not.

**Fix:** Audit focus trap in Modal.tsx. For AnimateMount-wrapped overlays that aren't using Modal, add `autoFocus` on the first focusable element and `onClose` focus restoration.

**Files:** `src/components/shared/AnimateMount.tsx`, ScryOverlay, StrandView

### 3.5 Hover States on Touch Devices

**Problem:** The hover pattern (UI Patterns section 5) uses `onMouseEnter`/`onMouseLeave` for dynamic hover colors. These don't fire correctly on touch devices, potentially leaving elements in a stuck hover state.

**Fix:** Add `onPointerLeave` as a fallback or use CSS `@media (hover: hover)` to gate hover effects to devices that actually support hover.

**Files:** RetinuePanel, InterventionConfirm, AgendaPicker, MandateTracker

### 3.6 Scrollbar Visibility in Sidebar

**Problem:** The right sidebar (`overflow-y-auto`) shows a thin 6px scrollbar that may be hard to notice against the dark background when content overflows (many retinue agents, long agent info card).

**Fix:** Consider adding a subtle fade gradient at the bottom of the sidebar when content is scrollable, as a visual cue. The scrollbar styling is already dark-themed — this is a minor enhancement.

**Files:** GameView.tsx (sidebar container)

---

## Design System Updates Required

### New CSS Variables
```css
/* Tier colors */
--color-tier-1: #6b7280;
--color-tier-2: #a78bfa;
--color-tier-3: #eab308;
--color-tier-4: #ef4444;

/* Behavior/intent colors */
--color-behavior-aggressive: #dc2626;
--color-behavior-schemer: #7c3aed;
--color-behavior-expansionist: #ea580c;
--color-behavior-defensive: #059669;

/* Event type colors */
--color-event-narrative: #d4a574;
--color-event-combat: #dc2626;
--color-event-magic: #7c3aed;
--color-event-trade: #ea580c;
```

### New File
- `src/data/uiColorPalette.ts` — Single source of truth for all semantic UI colors

### Utility Class Additions
```css
.panel-glass-topbar {
  background: linear-gradient(180deg, rgba(17,17,20,0.98), rgba(10,10,14,0.95));
  border-bottom: 1px solid var(--border-accent);
}
```

### Tailwind Config Consideration
Either override Tailwind's `fontSize` scale to match `--text-*` variables, or add a lint rule preventing `text-xs`/`text-sm` usage in favor of explicit CSS variable references.

---

## Implementation Priority

| # | Item | Impact | Effort | Phase |
|---|------|--------|--------|-------|
| 1 | Centralize color palette (1.3) | High — blocks all other theming work | Medium | 1 |
| 2 | Restyle worldgen screen (1.1) | High — first impression | Medium | 1 |
| 3 | TopBar hierarchy fix (1.5) | High — most-seen UI element | Medium | 1 |
| 4 | Ascendant selection theming (1.2) | Medium — second screen players see | Low | 1 |
| 5 | RivalPanel accessibility (1.4) | Medium — a11y gap | Low | 1 |
| 6 | Typography scale enforcement (2.2) | High — systemic consistency | High | 2 |
| 7 | Spacing consolidation (2.1) | Medium — developer ergonomics | High | 2 |
| 8 | Panel glass consistency (2.4) | Medium — visual consistency | Low | 2 |
| 9 | Font family consistency (2.3) | Medium — visual consistency | Low | 2 |
| 10 | Border cleanup (2.5) | Low — subtle visual noise | Medium | 2 |
| 11 | ActionCard keyframes (3.1) | Low — code quality | Low | 3 |
| 12 | Empty state consistency (3.2) | Low — edge case polish | Low | 3 |
| 13 | ProgressBar a11y (3.3) | Medium — accessibility | Low | 3 |
| 14 | Focus management (3.4) | Medium — accessibility | Medium | 3 |
| 15 | Touch hover fix (3.5) | Low — mobile edge case | Low | 3 |
| 16 | Scrollbar cue (3.6) | Low — minor polish | Low | 3 |

---

## Scope Flags

The following observations are **outside this audit's scope** (design only, no functionality changes) but worth noting:

> **Flag 1:** `useMemo` misuse in GameView line 206 — `useMemo` used as a side-effect trigger (calls `setNonAgentDrawerOpen`). This is a `useEffect`, not a memo. Functional bug risk.

> **Flag 2:** The worldgen screen (`App.tsx`) has no error boundary. If CosmologyPanel or HexMap throws during generation, the whole app white-screens.

> **Flag 3:** AscendantSelection doesn't use the `GameErrorBoundary` wrapper.

---

*Audit compiled from: code review of 85+ component files, live CSS inspection at 1920x1080, design system analysis of index.css (555 lines), STYLE.md (495 lines), and ui-patterns.md (640 lines).*
