# Action Card Redesign — Design Document

**Date:** 2026-03-08
**Status:** Approved
**Replaces:** AgentWheel radial SVG menu

---

## Problem Statement

The current AgentWheel is a basic SVG radial menu (9 slots in a circle with Unicode glyphs). It has three problems:

1. **Visual mismatch** — flat amber circles on a dark backdrop don't match the Threadbare aesthetic (dark world, concentrated magic threads, painterly sphere colors).
2. **No information density** — each slot shows only a glyph and a one-word label. Cost, risk, effect, and range are invisible until you click. Locked slots just dim without explanation.
3. **Wrong interaction pattern** — a radial menu optimizes for speed (Fitts's law radial targets) but the god-game fantasy is about deliberation, not reflex. Players should inspect, weigh costs, and choose — not twitch-click.

The narrative feed (fixed bar at the bottom of the center column) also needs to move: it pushes the map layout around when events scroll in, and the bottom space is needed for the new action system.

---

## Decision 1: Card-Based Action System (replaces radial wheel)

**Replace the SVG radial menu with styled HTML action cards displayed in a bottom drawer.**

Each action (Scry, Dream, Persuade, Deceive, Intimidate, Inspire, Coincidence, Omen, Afflict/Bless) becomes a card with visible information. Players can read what each action does, see its cost, and make informed choices.

### Why cards over radial menu

| | Radial Menu | Cards |
|--|-------------|-------|
| Info density | Glyph + label only | Icon, name, effect, cost, risk, range |
| Scalability | Cramped at 9 slots | Scrollable, can add more |
| Learning curve | Must memorize glyphs | Self-documenting |
| Aesthetic fit | SVG circles = placeholder feel | Dark chrome + sphere accents = Threadbare |
| Feel | Quick/reflex | Deliberate/tactical |

### Rejected alternatives

- **Radial menu with richer tooltips** — polishes the wrong pattern; the issue is radial layout, not tooltip depth.
- **Side panel card list** — uses the right sidebar, conflicts with agent detail panel which is needed alongside actions.
- **Floating panel near target** — coordinate math on pannable/zoomable SVG map is complex and fragile; cards would overlap map content.

---

## Decision 2: Bottom Drawer Container

**Cards live in a drawer that slides up from the bottom of the center column, covering ~35-40% of the viewport height.**

### Trigger & lifecycle

1. **Open:** Player selects an agent (clicks in retinue panel, or clicks agent on hex map / location view). Drawer slides up (200ms ease-out).
2. **Close:** Player clicks the drawer's close button, presses Escape, or deselects the agent. Drawer slides down (150ms ease-in).
3. **Update:** If the player selects a different agent while the drawer is open, cards update in-place (no close/reopen animation).

### Layout

```
┌─────────────────────────────────────────────────────────┐
│  [Agent Name]  ·  Tier 2 Zealot  ·  [close ×]          │  ← header bar
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌────────┐  ...  │  ← scrollable
│  │ Scry   │  │ Dream  │  │Persuade│  │Deceive │       │     card row
│  │ (obs)  │  │  ♦ 3   │  │  ♦ 2   │  │ 🔒 T2  │       │
│  │  free   │  │ detect │  │ detect │  │        │       │
│  └────────┘  └────────┘  └────────┘  └────────┘       │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

- **Header bar:** Dark chrome (`bg-stone-800/95`), shows agent name + tier + close button. Optional: agent's primary sphere color as left accent.
- **Card area:** Horizontal scrollable row. Cards grouped: observations first (Scry), then interventions sorted by availability (available → tier-locked → cost-locked → out-of-range).
- **Backdrop:** Subtle dark overlay (~15-20% opacity) dims the map above to draw focus to the drawer.

### Responsiveness

- Drawer width = 100% of center column (between left and right sidebars).
- Card count per visible row depends on viewport width. At typical 1920px with 80px+72px sidebars, ~5-6 cards visible, rest scrollable.
- If debug panel is open (replaces right sidebar), drawer adjusts.

---

## Decision 3: Action Card Design

Each card is a compact rectangle (~140px wide × 200px tall) with four zones:

### Card anatomy

```
┌──────────────────┐
│   ◉  [sphere]    │  ← icon zone: sphere-colored glyph
│                  │
│   Dream          │  ← name zone: Cinzel serif
│   Send visions   │  ← effect: 1-line description
│                  │
│  ♦ 3  ·  ◉ 0.2  │  ← cost zone: essence + detection
│  ∞ range         │  ← range badge (if relevant)
└──────────────────┘
```

**Top (icon zone):** Sphere-colored Unicode glyph from `WHEEL_SLOT_GLYPHS`, sized large (~32px). Background: subtle sphere-colored gradient at very low opacity.

**Middle (name + effect):**
- Action name in Cinzel serif, 14px, sphere-colored text.
- 1-line effect description in 11px amber-muted text.

**Bottom (cost zone):**
- Essence cost: sphere-colored dot + number (e.g., "♦ 3").
- Detection risk: eye icon with value (e.g., "◉ 0.2" or "low/med/high").
- Range: "∞" for unlimited, hex distance for ranged, "local" for local.

### Card states

| State | Visual Treatment |
|-------|-----------------|
| **Available** | Full brightness. Sphere-colored left border (2px). Hover: lift 4px, brighten border. Click: execute. |
| **Locked (tier)** | 30% opacity. Padlock icon in top-right corner. "Requires Tier N" text replaces effect line. No hover lift. |
| **Locked (cost)** | 50% opacity. Cost badge turns red. "Not enough essence" tooltip on hover. |
| **Out of range** | 50% opacity. Range badge turns amber with distance. "Too far (N hexes)" text. |

### Click behavior

- **Available card click:** Opens the InterventionConfirm popover (already exists) centered above the drawer, showing full details + confirm/cancel.
- **Scry card click:** Opens ScryOverlay (existing behavior).
- **Locked card hover:** Shows tooltip explaining why locked and what's needed.

---

## Decision 4: Floating Narrative Log (replaces fixed bottom feed)

**Remove the fixed `NarrativeFeed` bar. Replace with a togglable floating overlay.**

### Default state (collapsed)

A small pill button anchored to the bottom-left corner of the map area:
- Icon: scroll/book glyph or "📜" equivalent.
- Badge: unread event count (sphere-colored dot with number).
- Position: `absolute bottom-4 left-4` within the center column.
- Style: dark chrome, amber text, matches Threadbare UI.

### Expanded state

Click the pill → floating panel appears:
- **Size:** ~320px wide, ~50-60% viewport height.
- **Position:** Anchored bottom-left, overlaying the map.
- **Content:** Scrollable list of narrative events (same content as current NarrativeFeed).
- **Scroll behavior:** Latest events at top. Auto-scrolls to top on new event only if already at top.
- **Dismiss:** Click pill again (toggle), press Escape, or click outside the panel.
- **Unread count resets** when panel is opened.

### Why this over the fixed bar

- Map gets full vertical space. No layout shifts.
- Events don't push content around when they arrive.
- Player checks the log when they want, not when the game pushes it.
- The log overlay can be open at the same time as the action drawer — they don't compete for the same space (log = left side, drawer = bottom).

---

## Decision 5: Threadbare Visual Treatment

All new components follow the established Threadbare palette:

- **Card background:** `#2a2a2e` (dark stone) with subtle `#1a1a1e` border
- **Available accent:** Sphere-colored left border from `SPHERE_ICONS[sphere].color`
- **Text:** `#e8dcc4` (amber-warm) for names, `#a89968` for secondary text
- **Chrome/headers:** `bg-stone-800/95` consistent with existing HUD panels
- **Locked state:** `#57534e` desaturated stone
- **Hover glow:** Narrow sphere-colored box-shadow (the "thread breaking through" aesthetic)
- **Font:** Cinzel for names/headers (consistent with existing UI)

No magic thread illustrations on the cards themselves — keep it clean and functional. The sphere color accents are the "thread breaking through."

---

## Scope Boundary

This redesign covers:
- ✅ New `ActionCard` component (replaces `AgentWheel.tsx`)
- ✅ New `ActionDrawer` component (bottom drawer container)
- ✅ New `NarrativeLog` component (floating toggle log, replaces fixed `NarrativeFeed` placement)
- ✅ Modified `GameView.tsx` — remove wheel overlay, add drawer + log
- ✅ Modified `useAgentInteraction.ts` — drawer open/close state instead of wheel visibility
- ✅ Modified `wheel.ts` engine — may need `description` field added to `WheelSlot`

This redesign does NOT cover:
- ❌ Changes to the intervention confirmation flow (InterventionConfirm stays as-is)
- ❌ Changes to Scry overlay or Strand view
- ❌ New art assets for cards (using existing Unicode glyphs; art is a future enhancement)
- ❌ Changes to wheel.ts slot definitions or game balance

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/Game/ActionCard.tsx` | **New** — individual action card component |
| `src/components/Game/ActionDrawer.tsx` | **New** — bottom drawer container with header + card row |
| `src/components/Game/NarrativeLog.tsx` | **New** — floating toggle log (pill button + overlay panel) |
| `src/components/Game/AgentWheel.tsx` | **Delete** — replaced by ActionDrawer + ActionCard |
| `src/components/Game/GameView.tsx` | **Modify** — remove wheel overlay, add ActionDrawer + NarrativeLog, remove fixed NarrativeFeed bar |
| `src/components/Game/hooks/useAgentInteraction.ts` | **Modify** — replace wheelVisible with drawerOpen, simplify state |
| `src/engine/wheel.ts` | **Modify** — add `description` field to WheelSlot interface |
| `src/data/dream-content.ts` or `ui-content.ts` | **Modify** — add short effect descriptions for each intervention type |
| Tests | New test files for ActionCard, ActionDrawer, NarrativeLog; update GameView tests |
