# Component Inventory

**Read this when:** building a new component, resizing an existing one, or assessing a component's behavior across breakpoints.

This is an inventory of all major UI components, their current state, and their target state at 1920×1080 and 3440×1440.

---

## Top Bar

**File:** `src/components/Game/GameView.tsx` (inline), `IdentityChip`, `SimulationControls`, `EssencePanel`, `DoomBar`, `MandateTracker`, `AlertBar`, `RivalsButton`

| Property | Current (1280px target) | Target 1920px | Target 3440px |
|----------|------------------------|---------------|---------------|
| Height | 44px | 48px | 52px |
| Left group width | ~470px | ~520px | ~520px |
| Right group width | ~350px | ~350px | ~350px |
| Dead zone | 0px at 1280px | **~1050px ← PROBLEM** | ~2500px |
| Overflow behavior | `overflow-x-auto` | No overflow needed | No overflow needed |

### Top Bar Fill — Filling the Dead Zone at 1920px

The center of the top bar is empty at 1920px. Options (pick one, agreed with designer):

**Option A — World Stats Bar** (recommended): A set of read-only world stats in the center: total agents, active encounters, current season name, world age. Mimics Stellaris "empire summary" chips. Low implementation cost, high information value.

**Option B — Favor/Standing chips**: Show the top 2–3 factions and their standing toward the player as icon+bar chips. Fills space with meaningful diplomatic context.

**Option C — Intentional space**: Keep the gold divider centered and the space empty. Embraces the austere aesthetic. Only valid if the top bar is otherwise rich enough.

Currently: **unresolved — needs design decision before implementation.**

### IdentityChip
- Width: auto (shrinks to content, ~200px)
- Click: centers map on avatar
- Contains: avatar name (display font), archetype title (body, muted), cycle number
- At 1920px: no changes needed

### SimulationControls (compact mode)
- Layout: ◀ [N×] ▶ with season+year label
- Width: ~120px
- Compact prop must always be true in top bar
- At 1920px: consider showing tick count alongside season

### EssencePanel (compact mode)
- Layout: sphere icon + value + income chips side by side
- Width: ~160px
- Issue: income values use `0.65rem` — must change to `--text-xs`
- At 1920px: no layout changes, fix font size only

### DoomBar
- Compact: archetype glyph + doom stage indicator + thin progress bar
- Width: ~120px
- At 1920px: no changes needed

### RivalsButton
- Compact: ⚔ icon + badge count
- Opens portal dropdown positioned below button
- At 1920px: no changes needed

---

## Right Sidebar

**File:** `src/components/Game/GameView.tsx` (container), `RetinuePanel`, `WorldPulse`, `AgentInfoCard`

| Property | Current | Target 1920px | Target 3440px |
|----------|---------|---------------|---------------|
| Width | 280px | 360px | 420px |
| Token | `--sidebar-width` | `--sidebar-width` | `--sidebar-width` |
| Padding | `--panel-padding` (1rem) | `--panel-padding` (1.25rem) | same |

### RetinuePanel
- Agent rows: full sidebar width
- At 360px: more room for agent name, status text can be less truncated
- `max-w` on agent name should be removed — let flex truncation handle it

### WorldPulse
- Fills sidebar width — no changes needed
- Content should use full 360px at 1920px without horizontal scroll

### AgentInfoCard (Tier 2)
- Fills sidebar width
- Domain grid currently 2 columns — at 360px consider 3 columns
- Agent portrait art slot: 360px wide at 1920px — use this space

---

## HexChronicle

**File:** `src/components/Game/HexChronicle.tsx`

| Property | Current | Target 1920px | Target 3440px |
|----------|---------|---------------|---------------|
| Width | `flex-1` (fills map area) | `flex-1` | Left panel at 3440px |
| Prose max-width | none | **860px on prose column** | 860px |
| Section layout | stacked | stacked | stacked |

**Action needed:** Add `maxWidth: '860px', margin: '0 auto'` to the prose content wrapper so text lines stay readable at 1920px.

---

## HexSidebar

**File:** `src/components/Game/HexSidebar.tsx`

- Left panel of hex-zoom view (stats/terrain sidebar)
- Current width: unknown — check component
- At 1920px: should stay narrow (~240px) — the chronicle is the main content
- At 3440px: becomes the left panel (380px) — most content moves here

---

## AvatarHUD

**File:** `src/components/Game/AvatarHUD.tsx`

- Positioned as absolute overlay on the map
- At 1920px: the map is 1560px wide — the HUD should be positioned relative to avatar pixel position, not corner-anchored
- Check: is it currently corner-anchored or avatar-relative?

---

## ActionDrawer

**File:** `src/components/Game/ActionDrawer.tsx`

- Floating centered card hand
- At 1920px: centered in the map area (1560px wide) — correct behavior
- Max width should cap at ~900px so cards don't spread too wide
- At 3440px: same, centered, same max width

---

## AgentProfileModal

**File:** `src/components/Game/AgentProfileModal.tsx`

- Full-screen modal (portaled)
- At 1920px: should be a centered card, not full screen. Max width: 900px, max height: 80vh
- Currently: check if it respects a max-width constraint or fills the viewport

---

## ScryOverlay / StrandView / HarvestScreen

Full-screen overlays:
- At 1920px: content panel should cap at `max-width: 1100px`, centered, not full-bleed
- Background overlay: always full-screen with `--bg-abyss` at 85% opacity

---

## Badges and Labels

Current problem: `.subloc-badge`, `.agent-pip` use `font-size: 0.65rem` (~10px).

**Target:** All badges minimum `--text-xs` (16px). If the badge content doesn't fit at 16px, redesign the badge (use a dot/icon instead of text, abbreviate, or remove).

Specific changes needed:
- `.subloc-badge`: `font-size: var(--text-xs)`
- `.agent-pip`: `font-size: var(--text-xs)`
- `.avail-threat`: `font-size: var(--text-xs)`
- EssencePanel income delta: `font-size: var(--text-xs)`

---

## Tooltip

**File:** `src/components/shared/Tooltip.tsx` (check if exists, or `src/engine/attachmentTooltip.ts`)

- Portal-positioned, appears above other elements
- Max width: 220px
- Delay: 600ms hover
- At 1920px: no changes needed — portals handle z-index correctly

---

## EventPopup

**File:** `src/components/Game/EventPopup.tsx`

- Centered modal overlay
- At 1920px: max-width 600px, centered — check current implementation

---

## Toast Stack

**File:** `src/components/Game/ToastStack.tsx`

- Fixed position, bottom-right (or top-right?)
- At 1920px: stays in corner — correct
- At 3440px: stays in corner — correct (don't center it, corner is fine)

---

## Component Scaling Summary

| Component | 1920px action | 3440px action |
|-----------|--------------|---------------|
| Top bar | Fill dead zone (TBD) | Same + wider gaps |
| Right sidebar | 280→360px via CSS var | 360→420px |
| HexChronicle prose | Add max-width 860px | Move to left panel |
| AgentProfileModal | Add max-width 900px | Same |
| Full-screen overlays | Add max-width 1100px | Same |
| Badge font sizes | Fix 0.65rem → --text-xs | Same |
| Map initial scale | 3.0→2.5 | 2.0 |
| Top bar height | 44→48px | 48→52px |
