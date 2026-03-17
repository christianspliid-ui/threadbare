# Layout System

**Read this when:** positioning panels, sizing sidebars, building the top bar, handling breakpoints, or deciding where a new UI zone lives.

---

## Breakpoints

| Name | Width | Height | Notes |
|------|-------|--------|-------|
| `hd` | 1280px | 720px | Minimum supported. Graceful degradation only. |
| `fhd` | 1920px | 1080px | **Primary target. All QA done here.** |
| `qhd` | 2560px | 1440px | Intermediate wide. Panels expand. |
| `uwqhd` | 3440px | 1440px | Ultrawide. Two-panel layout unlocks. |

CSS breakpoint variables (add to `:root` when needed):
```css
/* Use as: @media (min-width: 1920px) { } */
--bp-hd:    1280px;
--bp-fhd:   1920px;
--bp-qhd:   2560px;
--bp-uwqhd: 3440px;
```

---

## Layout Zones

The game screen is divided into three horizontal zones, stacked vertically:

```
┌─────────────────────────────────────────────────────┐
│  TOP BAR  (full width, fixed height)                │  Zone A
├──────────────────────────────┬──────────────────────┤
│                              │                      │
│   MAP AREA  (fluid center)   │  RIGHT PANEL (fixed) │  Zone B
│                              │                      │
└──────────────────────────────┴──────────────────────┘
```

At ultrawide (3440px+), a **left panel** unlocks:

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR  (full width, fixed height)                        │
├───────────────┬──────────────────────────┬──────────────────┤
│               │                          │                  │
│  LEFT PANEL   │   MAP AREA  (fluid)      │  RIGHT PANEL     │
│  (context)    │                          │  (retinue/info)  │
│               │                          │                  │
└───────────────┴──────────────────────────┴──────────────────┘
```

---

## Zone A — Top Bar

| Property | 1280px (hd) | 1920px (fhd) | 2560px+ (qhd+) |
|----------|------------|--------------|----------------|
| Height | 44px | 48px | 52px |
| Padding (x) | 12px | 16px | 20px |
| Gap between groups | 12px | 16px | 20px |

### Top Bar Sections (left → right)

```
[IdentityChip] | [SimControls] | [EssencePanel]     ···gold divider···     [DoomBar] [Mandate] [Alerts] [⚔] [⚙]
◄── LEFT GROUP (flex-shrink-0) ──────────────────►  ◄── RIGHT GROUP (flex-shrink-0) ───────────────────────────►
                                                     ↑ ml-auto pushes this right
```

**Problem at 1920px:** ~1070px of dead space in the center. See `components.md §Top Bar Fill` for the resolution.

### Top Bar Rules
- Never use `overflow-x-auto` — if content doesn't fit at 1920px the top bar is too full
- Left group: identity, time, resources — things the player always needs
- Right group: threats, alerts, system — things that demand attention
- Gold divider (`ml-auto`) separates signal from status
- All buttons minimum 32×32px tap target
- Text in top bar uses `--text-sm` (17px) — never smaller

---

## Zone B — Map Area

The map area is `flex-1` and fills all remaining width after panels.

| Viewport | Right panel | Left panel | Map width |
|---------|-------------|-----------|-----------|
| 1280px | 280px | — | ~1000px |
| 1920px | 360px | — | ~1560px |
| 2560px | 400px | — | ~2160px |
| 3440px | 420px | 380px | ~2640px |

### Map initial zoom
- At 1920px: `initialScale: 2.5` — shows the full world with context
- At 1280px: `initialScale: 3.0` — zoomed in slightly (current value, acceptable)
- Do not hardcode scale — it should be a named constant in `src/engine/constants.ts`

---

## Zone B — Right Panel

Fixed width. Contains: RetinuePanel, WorldPulse, AgentInfoCard (rotating based on state).

| Viewport | Width | Token |
|---------|-------|-------|
| 1280px | 280px | `--sidebar-width` |
| 1920px | 360px | `--sidebar-width` |
| 2560px | 400px | `--sidebar-width` |
| 3440px | 420px | `--sidebar-width` |

**Implementation:** `--sidebar-width` should be set via a `@media` block in `src/index.css`, not hardcoded in components. Components always use `width: var(--sidebar-width)`.

```css
:root { --sidebar-width: 280px; }
@media (min-width: 1920px) { :root { --sidebar-width: 360px; } }
@media (min-width: 2560px) { :root { --sidebar-width: 400px; } }
@media (min-width: 3440px) { :root { --sidebar-width: 420px; } }
```

---

## Zone B — Left Panel (Ultrawide Only)

Unlocks at 3440px+. Used for HexChronicle / contextual narrative when in hex-zoom view. Collapsed (0px) at narrower widths — **do not add a collapsed state to the left panel at 1920px**, that complexity is not needed.

| Property | Value |
|----------|-------|
| Width at 3440px | 380px |
| Content | HexChronicle narrative, region context |
| Trigger | `@media (min-width: 3440px)` |

---

## Overlay Z-Index Stack

From lowest to highest:

| Level | z-index | Used for |
|-------|---------|---------|
| Map | 0 | SVG hex map |
| Map overlays | 10 | Agent dots, route lines, fog |
| HUD | 20 | AvatarHUD, NarrativeLog pill |
| Top bar | 30 | Always above map |
| Backdrop | 40 | Invisible click-catcher for popovers |
| Popover / drawer | 50 | ActionDrawer, InterventionConfirm |
| Full-screen overlay | 60 | ScryOverlay, StrandView, HarvestScreen |
| Modal | 70 | AgentProfileModal, EventPopup |
| Portal dropdown | 9999 | Portaled dropdowns (RivalsButton etc.) — must portal to body |
| Toast | 10000 | ToastStack — always on top |

**Rule:** Any element that needs to appear above the top bar (z-30) **must** use `createPortal(el, document.body)` with `position: fixed`. Never try to out-z-index a parent stacking context.

---

## Panel Padding & Radius

| Token | Value | Use |
|-------|-------|-----|
| `--panel-padding` | 1rem (16px) | Inner padding for all panels |
| `--panel-radius` | 0.5rem (8px) | Border radius for panels and cards |
| `--space-1..8` | 4–32px | Spacing grid (4px base) |

At 1920px+ increase `--panel-padding` to `1.25rem` via media query.

---

## HexChronicle Prose Width

At 1920px the chronicle fills ~1560px. Long text lines become unreadable beyond ~800px. Apply `max-width: 860px` to the prose content container (not the outer wrapper) so the column stays readable while the background fills the full width.
