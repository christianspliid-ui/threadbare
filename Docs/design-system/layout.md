# Layout System

**Read this when:** positioning panels, sizing rails, building the top bar, handling breakpoints, or deciding where a new UI zone lives.

**The 1440p layout contract (THR-1819).** 2560×1440 is the primary screen, 1920×1080 the supported floor. Every width, padding and type step below is a token in `src/index.css`; JS reads the same numbers from `src/components/shared/layoutContract.ts`, and `layoutContract.test.ts` fails the build if the two disagree. Plan: `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`.

---

## Breakpoints

| Tier (`LayoutTier`) | Applies at | Designed? | Notes |
|------|-------|-------|-------|
| `base` | width < 1920 | No | Earlier behaviour; the 1280×720 minimum must not break. Pre-existing tokens keep their old defaults, new ones take their 1920 value |
| `fhd` | width ≥ 1920 | **Yes — the supported floor (1920×1080)** | Frame widths at their 1080p values; root 16px |
| `qhd` | width ≥ 2560 | **Yes — the primary screen (2560×1440)** | Frame widths at their 1440p values; root 18px |
| `uwqhd` | width ≥ 3440 | Width only | Same type and panels as `qhd`; the extra width goes to the map and the Stage window |

**Breakpoints live in TS, not in CSS variables.** CSS custom properties cannot drive media queries, so there are no `--bp-*` tokens. The edges are `LAYOUT_BREAKPOINTS_PX` in `layoutContract.ts` (`{ fhd: 1920, qhd: 2560, uwqhd: 3440 }`), and `index.css` restates every frame token in one `@media (min-width: …)` block per tier.

**The root step-up.** `@media (min-width: 2560px) and (min-height: 1200px) { html { font-size: 112.5% } }` — everything in rem scales ×1.125 at 1440p. The height guard keeps a 2560×1080 ultrawide at 1080p type. Tiers read CSS pixels, so OS scaling and browser zoom move a player between tiers; that is their own enlargement and the game honours it.

---

## Layout Zones

The game screen is the top bar over three columns: the god rail, the map, and the Ledger rail.

```
┌─────────────────────────────────────────────────────────────┐
│  TOP BAR  (full width, --topbar-height)                     │  Zone A
├───────────────┬──────────────────────────┬──────────────────┤
│               │                          │                  │
│  GOD RAIL     │   MAP AREA  (fluid)      │  LEDGER RAIL     │  Zone B
│ --rail-left-w │                          │ --rail-right-w   │
│               │                          │                  │
└───────────────┴──────────────────────────┴──────────────────┘
```

The god rail is always on the left (THR-1828); there is no ultrawide-only left panel any more. The Ledger rail folds to a `--rail-strip-w` strip, and the Inspector docks beside the god rail at `--inspector-w` (THR-1827).

---

## Zone A — Top Bar

| Property | base (<1920) | fhd (1920) | qhd / uwqhd (2560+) |
|----------|------------|--------------|----------------|
| Height (`--topbar-height`) | 44px | 48px | 56px |
| Padding x (`--topbar-padding-x`) | 12px | 16px | 20px |
| Gap between groups (`--topbar-gap`) | 12px | 16px | 20px |

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
- Text in top bar uses `--text-sm` (18px at 1080p) — never smaller

---

## Zone B — Map Area

The map area is `flex-1` and fills all remaining width after the rails. Its share of the screen is a tested budget (THR-1828): **≥ 0.60** with both rails open (`FRAME_MAP_SHARE_MIN`) and **≥ 0.45** with the Inspector docked (`FRAME_MAP_SHARE_MIN_INSPECTOR`), checked by `layoutContract.test.ts` at 1920×1080, 2560×1440 and 3440×1440.

| Screen | God rail | Ledger rail | Map rect | Share |
|---------|-------------|-----------|-----------|-----------|
| 1920×1080 | 320px | 340px | 1260 × 1032 | 0.627 |
| 2560×1440 | 400px | 420px | 1740 × 1384 | 0.653 |
| 3440×1440 | 400px | 420px | 2620 × 1384 | 0.732 |

### Map initial zoom
- At 1920px: `initialScale: 2.5` — shows the full world with context
- At 1280px: `initialScale: 3.0` — zoomed in slightly (current value, acceptable)
- Do not hardcode scale — it should be a named constant in `src/engine/constants.ts`

---

## Zone B — The rails, the Inspector and the Stage (frame tokens)

Frame geometry is px and restated in every tier block of `src/index.css`. Components always read the token (`width: var(--rail-right-w)`), never a literal.

| Token | base | fhd ≥1920 | qhd ≥2560 | uwqhd ≥3440 | Source |
|---|---|---|---|---|---|
| `--rail-left-w` (god rail) | 320 | 320 | 400 | 400 | THR-1828 |
| `--rail-right-w` (Ledger rail) | 280 | 340 | 420 | 420 | THR-1828 |
| `--rail-strip-w` (folded rail) | 56 | 56 | 56 | 56 | THR-1828 |
| `--inspector-w` (docked) | 560 | 560 | 717 | 717 | THR-1827 |
| `--inspector-wide-w` | 960 | 960 | 1280 | 1280 | THR-1827 |
| `--inspector-full-trail-w` | 240 | 240 | 300 | 300 | THR-1827 |
| `--inspector-full-aside-w` | 360 | 360 | 440 | 440 | THR-1827 |
| `--stage-gutter` | 24 | 24 | 24 | 24 | THR-1829 |
| `--stage-window-w` | 280 | 280 | 520 | 1400 | THR-1829 |
| `--stage-left-col-w` | 340 | 340 | 560 | 560 | THR-1829 |

The Stage panel width is derived, not a token: `calc(100vw - var(--rail-left-w) - var(--stage-window-w) - 2 * var(--stage-gutter))` — 1272px at 1920, 1592px at 2560 and at 3440, where the window takes the extra width.

---

## Overlay Z-Index Stack

From lowest to highest:

| Level | z-index | Used for |
|-------|---------|---------|
| Map | 0 | HexMapV2 (Three.js canvas) |
| Map overlays | 10 | HexTooltip, LocationLabelOverlay, fog |
| HUD | 20 | AvatarHUD, NarrativeLog pill |
| Top bar | 30 | Always above map |
| Action drawer | 40 | ActionDrawer (card hand) |
| Debug panel | 45 | DebugPanel |
| Focused overlays | 50 | ActionDrawer backdrop, SettingsPanel, EncounterVeil, ScryOverlay, StrandView, HarvestScreen |
| Modals | 60 | `Modal` (shared) — AgentProfileModal, EventPopup |
| Tooltips | 70+ | `Tooltip` (70 + nesting depth) |
| Portal dropdown | 9999 | Portaled dropdowns (RivalsButton etc.) — must portal to body |
| Toast | 10000 | ToastStack — always on top |

*(Table re-synced 2026-08-29 with `Docs/design-system/layout-zones.md`, which is the definitive stacking reference.)*

**Rule:** Any element that needs to appear above the top bar (z-30) **must** use `createPortal(el, document.body)` with `position: fixed`. Never try to out-z-index a parent stacking context.

---

## Panel Padding, Radius and Text Containers

Text containers are rem and declared once, so they follow the root step-up: their 1080p width is today's pixel width, and at 1440p they grow ×1.125.

| Token | Value | 1080p | 1440p | Use |
|-------|-------|-------|-------|-----|
| `--panel-padding` | 1rem; 1.25rem at ≥1920 | 20px | 22.5px | Inner padding for all panels |
| `--panel-radius` | 0.5rem | 8px | 9px | Border radius for panels and cards |
| `--tooltip-max-w` | 17.5rem | 280px | 315px | `Tooltip` |
| `--hovercard-w` | 26.25rem | 420px | 472.5px | `HoverCard` |
| `--toast-w` | 20rem | 320px | 360px | `ToastStack` |
| `--stage-compact-w` | 53.75rem | 860px | 967.5px | The Stage's compact tier (THR-1829) |
| `--measure-prose` | 34em | 680px | 765px | Story-column reading measure |
| `--modal-max-h` | 85vh | 918px | 1224px | Every dialog's height cap (Law 33) |
| `--space-1..8` | 4–32px | | | Spacing grid (4px base) |

---

## HexChronicle Prose Width

Long text lines become unreadable beyond ~800px. Cap the prose content container (not the outer wrapper) at `--measure-prose` so the column stays readable while the background fills the full width.
