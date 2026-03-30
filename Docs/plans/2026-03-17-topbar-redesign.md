# Top Bar Redesign — Stellaris-Style Resource Bar

**Date:** 2026-03-17
**Status:** Ready for implementation
**Scope:** UI-only — no engine changes, no new game mechanics

---

## Problem

The current top bar is cluttered, text-heavy, and visually flat. Specific issues:

1. **Identity split** — Ascendant title is in the top bar, avatar name is in a floating HUD over the map. Two separate UI elements for one concept.
2. **Essence display uses bars** — Takes too much horizontal space, hard to read at a glance. Bars are the wrong metaphor for a resource you spend; you need to see the number and the flow rate.
3. **Time controls are bulky** — A slider for speed, separate play/pause and step buttons, all taking ~140px.
4. **No keyboard shortcuts** — No space-to-pause, no speed hotkeys. Basic expected interaction missing.
5. **Too much text, not enough icons** — "ESSENCE", "BREACH", "3 Rivals", "Debug" are all text labels where icons would be more compact and more recognizable.
6. **Visual monotony** — Everything is the same small monochrome text at the same weight. No visual hierarchy.

## Design — The New Top Bar

### Layout (left to right)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ [⚡ Identity]  │  [⏵ Time]  │  [✦ ✦ ✦ ... Essence Resources]  ║  [◈ Doom] [⬡ Mandate] [alerts] [⚔ Rivals] [⚙]  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

Two groups separated by a stronger visual divider (║): **left = player state** (identity + time + resources), **right = world state** (threats + events + tools).

---

### 1. Identity Section (leftmost)

**Current:** `THE STORM MARSHAL  Cycle 1` in top bar + floating AvatarHUD with avatar name
**New:** Merged into one compact top-bar element.

```
┌──────────────────┐
│  ☼  Kael'thos     │   ← avatar name, sphere-colored icon
│     The Storm Marshal │   ← archetype title, muted
└──────────────────┘
```

- **Line 1:** Sphere glyph (from SphereIcon) + avatar name — `font-display`, `--text-sm`, `--text-primary`
- **Line 2:** Archetype title — `font-body`, `--text-xs`, `--text-muted`
- Cycle number moves into a tooltip on the identity block (hover to see "Cycle 1")
- Left accent bar (3px, sphere-colored) runs the full height — like current AvatarHUD accent

**AvatarHUD changes:** Remove the name and accent bar from the floating AvatarHUD. It keeps only the action buttons (Move, Actions, Investiture, Eye). This makes the map overlay smaller and less intrusive.

The identity block is clickable — clicking it centers on the avatar (same as current AvatarHUD center behavior).

---

### 2. Time Section

**Current:** Season icon + "Spring" + "Yr 1" + "· T0" + ▶/⏸ buttons + ⏭ button + speed slider (1-20x) + "3×"
**New:** Dramatically more compact.

```
┌──────────────────────┐
│  ∿  Spring Yr1   ⏵  ◀ 3× ▶  │
└──────────────────────┘
```

- **Season icon** — already exists, keep it
- **Season + Year** — compact, same as now but tighter spacing
- **Play/Pause** — single icon button: `⏵` when paused (gold outline), `⏸` when playing (filled gold)
- **Speed: ◀ 3× ▶** — minus/plus buttons flanking the speed multiplier. Tap to change speed in steps: 1×, 2×, 3×, 5×, 10×, 20×. No slider.
- **Remove the Step (⏭) button** from the bar — it becomes a keyboard-only action (`.` key). Power users who want single-step don't need a button.
- Tick number (`T42`) moves to a tooltip on the time section

**Speed steps:** `[1, 2, 3, 5, 10, 20]` — these are the meaningful increments. The old 1-20 slider had 20 stops but most were useless (nobody needs 7× vs 8×).

**Visual:** The play button gets a subtle glow when running. The speed display uses `--accent-gold` when speed > 1×.

---

### 3. Essence Resources (Stellaris model)

**Current:** "ESSENCE" label + per-sphere colored bars + value + total
**New:** Row of colored resource chips, one per active sphere.

```
┌─────────────────────────────────────────┐
│  🔴 12.4 +1.2  │  🟢 8.1 +0.5  │  🔵 3.0 +0.1  │  🟡 0.0   │
└─────────────────────────────────────────┘
```

Each resource chip:
```
┌─────────────────┐
│  ● 12.4  +1.2   │   ← sphere icon (colored), value (white), income (green/red)
└─────────────────┘
```

- **Sphere icon** — SphereIcon glyph, already exists, sphere-colored
- **Value** — `font-mono`, `--text-xs`, `--text-primary`. Rounded to 1 decimal.
- **Income** — `font-mono`, `--text-xs`, green if positive, red if negative (maintenance > income), hidden if zero. Prefixed with `+` or `−`.
- **No bars.** Just the number and the flow.
- **No "ESSENCE" label.** The icons speak for themselves. Add a tooltip on each chip: "Life Essence: 12.4 / 50.0 (+1.2/tick from 4 worshippers, −0.5/tick maintenance)"
- **Ordering:** Primary sphere first, secondary second, then by value descending. Spheres with 0 value and 0 income are hidden (same threshold as current).
- Total essence shown only in tooltip (hover over any chip).

**New prop needed:** The EssencePanel needs income data. This requires computing per-sphere income in GameView (or a hook) from the existing engine data — worshipper counts, places of power, maintenance costs.

### Computing Essence Income

Create a new utility function `computeEssenceIncome(gameState): Record<SphereName, number>` that calculates net income per sphere per tick:
- `+BASE_ESSENCE_PER_TICK` split across primary/secondary spheres
- `+ESSENCE_PER_WORSHIPPER × worshipper count per sphere`
- `+ESSENCE_PER_PLACE_OF_POWER × controlled places per sphere`
- `−TIER_MAINTENANCE × influenced agents per tier per sphere`

This is purely a view-layer computation from existing state — no engine changes needed.

---

### 4. Doom Section (right group)

**Current:** "BREACH" label + "Stage 1: Strange Whispers" + "0%" + progress bar
**New:** More compact, icon-driven.

```
┌──────────────────────┐
│  ◈  Strange Whispers   12%  │
│  ████░░░░░░░░░░░░░░░░░░░░░  │
└──────────────────────────────┘
```

- **◈ glyph** in archetype color (already used in alerts) replaces "BREACH" text label
- Stage name stays (it's meaningful flavor text)
- Progress bar stays but is thinner (h-1 instead of h-1.5)
- Archetype name ("Breach") moves to tooltip
- Remove "Stage 1:" prefix — just the stage name. Stage number goes to tooltip.

---

### 5. Mandate Section

Keep as-is — the compact pip display is already decent. Just ensure consistent height with the new bar.

---

### 6. Alerts Section

Keep as-is — the glyph-based system is already icon-driven and compact.

---

### 7. Rivals Section

**Current:** `⚔ 3 Rivals` text button
**New:** Just the icon with a badge.

```
┌─────┐
│  ⚔³  │   ← sword icon with superscript count
└─────┘
```

- Hostility color on the icon (already exists)
- Count as superscript badge
- Pulsing dot when high hostility (already exists)
- "Rivals" text removed — icon + count is enough. Tooltip: "3 Rival Gods (highest hostility: 72%)"

---

### 8. Debug Toggle

**Current:** `Debug` text button
**New:** `⚙` gear icon, same toggle behavior.

- Active state: gold glow + filled
- Inactive: muted
- Tooltip: "Debug Panel (`)"

---

### 9. Keyboard Shortcuts

New `useTopBarHotkeys` hook registered in GameView:

| Key | Action | Notes |
|-----|--------|-------|
| `Space` | Toggle play/pause | Most critical. Must not fire when typing in an input field. |
| `+` or `=` | Speed up | Next step in `[1, 2, 3, 5, 10, 20]` |
| `-` | Speed down | Previous step |
| `.` | Single step (when paused) | Replaces the removed ⏭ button |
| `` ` `` | Toggle debug panel | Already exists, keep |
| `Escape` | Cancel move mode | Already exists, keep |

**Input guard:** All hotkeys check `document.activeElement` — if it's an `<input>`, `<textarea>`, or `[contenteditable]`, the hotkey is suppressed.

---

## Visual Polish

### Top bar background
Keep the current gradient but add a 1px gold bottom border (very dim, `--accent-gold-dim` at 30% opacity) to give it more presence. The current `--border-subtle` is too invisible.

### Section dividers
- Within a group: thin 1px `--border-subtle` vertical lines (current)
- Between left and right groups: slightly stronger divider — 1px `--accent-gold-dim` at 40% opacity

### Typography hierarchy
- Identity avatar name: `--font-display`, `--text-sm`, weight 700
- Identity archetype: `--font-body`, `--text-xs`, `--text-muted`
- Resource values: `--font-mono`, `--text-xs`, `--text-primary`
- Resource income: `--font-mono`, `--text-xs`, green/red
- Time season: `--font-body`, `--text-xs`, weight 600
- Time year: `--font-body`, `--text-xs`, `--text-tertiary`

### Hover states
All interactive elements get a subtle background highlight on hover (`--bg-raised` or sphere-tinted), consistent 200ms transition.

### Height
Target: 44px (current is 48px min-height). Tighter vertical padding (py-1.5 instead of py-2).

---

## Implementation Plan

### Phase 1: Hotkeys (standalone, no visual changes)

**Files:** New `src/components/Game/hooks/useTopBarHotkeys.ts`, modify `GameView.tsx`

1. Create `useTopBarHotkeys` hook:
   - Accepts `{ running, onToggle, speed, onSpeedChange, onStep }`
   - Registers `keydown` listener
   - Space → `onToggle()` (with input guard)
   - `+`/`=` → speed up, `-` → speed down (using step array `[1, 2, 3, 5, 10, 20]`)
   - `.` → `onStep()` when not running (with input guard)
   - Input guard: skip if `activeElement` is input/textarea/contenteditable
2. Call hook in GameView, passing existing handlers
3. Add `SPEED_STEPS` constant to SimulationControls or a shared constants file
4. **Tests:** Unit test the hook with synthetic keyboard events. Test input guard.

### Phase 2: Time Controls Redesign

**Files:** `SimulationControls.tsx`

1. Replace slider with `◀ {speed}× ▶` buttons
2. Use `SPEED_STEPS` array for increment/decrement
3. Remove Step button from compact mode (keyboard-only via `.`)
4. Move tick number to tooltip
5. Tighten spacing
6. **Tests:** Update SimulationControls tests for new button structure

### Phase 3: Essence Panel → Resource Chips

**Files:** `EssencePanel.tsx`, new `src/engine/essenceIncome.ts` (or `src/components/Game/hooks/useEssenceIncome.ts`), `GameView.tsx`

1. Create `computeEssenceIncome` utility that derives per-sphere net income from game state
2. Pass income data as new prop to EssencePanel
3. Rewrite compact EssencePanel: remove bars, show `icon value +income` chips
4. Keep full-panel (non-compact) mode for now, update later
5. **Tests:** Unit test income computation. Snapshot/render tests for new chip layout.

### Phase 4: Identity Merge

**Files:** `GameView.tsx`, `AvatarHUD.tsx`, possibly new `IdentityChip.tsx`

1. Create `IdentityChip` component: two-line display with sphere accent bar
2. Wire up click-to-center behavior
3. Strip name and accent bar from AvatarHUD (keep action buttons only)
4. **Tests:** Verify AvatarHUD still works for actions. Verify center-on-click.

### Phase 5: Icon-ify Right Group

**Files:** `DoomBar.tsx`, `RivalsButton.tsx`, debug button in `GameView.tsx`

1. DoomBar: archetype glyph instead of text, remove "Stage N:" prefix, thinner bar
2. RivalsButton: icon + superscript badge, remove "Rivals" text
3. Debug button: gear icon, remove "Debug" text
4. Add/enhance tooltips on all three
5. **Tests:** Update snapshot tests, verify tooltips render.

### Phase 6: Visual Polish

**Files:** `GameView.tsx` (top bar container), `index.css`

1. Gold bottom border on top bar
2. Stronger group divider between left/right
3. Reduce bar height to 44px
4. Consistent hover states
5. **Tests:** Visual regression check (manual or screenshot).

---

## Files Touched (Summary)

| File | Changes |
|------|---------|
| `src/components/Game/hooks/useTopBarHotkeys.ts` | **NEW** — keyboard shortcut hook |
| `src/engine/essenceIncome.ts` | **NEW** — per-sphere income computation |
| `src/components/Game/IdentityChip.tsx` | **NEW** — merged identity display |
| `src/components/Game/GameView.tsx` | Wire new hook, new components, layout changes |
| `src/components/Game/SimulationControls.tsx` | Replace slider with +/− buttons, remove step |
| `src/components/Game/EssencePanel.tsx` | Rewrite compact mode as resource chips |
| `src/components/Game/AvatarHUD.tsx` | Remove name/accent (keep action buttons only) |
| `src/components/Game/DoomBar.tsx` | Icon-ify, simplify |
| `src/components/Game/RivalsButton.tsx` | Icon + badge, remove text |
| `src/index.css` | Minor tweaks for gold border, bar height |
| Various `__tests__/` files | Update for changed component structure |

---

## What This Does NOT Change

- No engine/tick-loop changes
- No new game mechanics
- No changes to the non-compact (panel) versions of these components
- No changes to AlertBar (already good)
- No changes to MandateTracker (already good)
- No changes to AvatarHUD action buttons (Move, Actions, Investiture)
- HexBreadcrumb, WorldPulse, and sidebar are untouched

---

## Risk Notes

- **Essence income computation** is the only piece that touches engine data — keep it as a pure function, no side effects, well-tested
- **Hotkey conflicts** — Space is used by MandateTracker's keyboard handler (`onKeyDown` on the button). The input guard should handle this since Space on a focused button already triggers its `onClick`, but test this explicitly
- **Small screens** — With all the resource chips, the bar might overflow on narrow windows. Add `overflow-x: auto` as a safety valve, but the chip design should be compact enough for 1280px+ screens
