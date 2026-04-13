# Layout Zone Architecture

> **Purpose:** Definitive reference for viewport zones, z-index stacking, responsive scaling, and insertion points. Load this when placing new UI elements.
>
> **Last updated:** 2026-04-13

---

## Viewport Layout (1920x1080 reference)

```
+------------------------------------------------------------------+
|                        Top Bar (48px)                        z:30 |
+------+-------------------------------------------+---------------+
| Hex  |                                           |               |
| Side |                                           |   Right       |
| bar  |           Hex Map Canvas                  |   Sidebar     |
| 60-  |           (Three.js / flex-1)             |  (--sidebar-  |
| 220  |                                           |   width)      |
| px   |                                           |               |
|      |      +--HexTooltip (z:10)---+             |               |
|      |      | hover overlay        |             |               |
|      |      +----------------------+             |               |
|      |                                           |               |
+------+-------------------------------------------+---------------+
|                   Action Drawer (~142px)                    z:40 |
|          [ card ] [ card ] [ card ] [ card ]                     |
+------------------------------------------------------------------+

Overlay layers (centered, above everything):
  - EncounterVeil / Full-screen modals           z:50–60
  - Modal (shared primitive)                     z:60
  - Tooltips                                     z:70+
  - Portaled dropdowns                           z:9999
  - Toast / AlertBar                             z:10000 (conceptual top)
```

---

## Zone Specifications

### Top Bar

| Property | Value | Source |
|----------|-------|--------|
| Height | `var(--topbar-height)`: 44px default, 48px at 1920px+, 52px at 2560px+ | `index.css` |
| Position | Full width, `relative z-30 flex-shrink-0` | `GameView.tsx` |
| Contents | `SimulationControls`, `MandateTracker`, `DoomBar`, `EssencePanel`, `AvatarHUD` | `GameView.tsx` |
| Behavior | Always visible. Padding and gap scale with breakpoints. | |

### Left Sidebar (HexSidebar)

| Property | Value | Source |
|----------|-------|--------|
| Expanded width | `220px` | `HexSidebar.tsx:96` |
| Collapsed width | `60px` | `HexSidebar.tsx:96` |
| Position | Left edge, inside main flex row | `GameView.tsx` |
| Contents | Hex stats, location info, toggle button | `HexSidebar.tsx` |
| Behavior | User-toggled expand/collapse. Overlays the map — does not push it. | |

### Hex Map Canvas (center)

| Property | Value | Source |
|----------|-------|--------|
| Size | `flex-1` — fills remaining space after sidebar and right panel | `GameView.tsx` |
| Renderer | Three.js `<canvas>` via `HexMapV2` | `HexMapV2.tsx` |
| Overlays | `HexTooltip` (hover, z:10), `LocationLabelOverlay`, `RegionLabels`, `MovementTrails` | HTML positioned over canvas |
| Interaction | d3-zoom for pan/zoom. Click → dispatches to right sidebar. | |

### Right Sidebar

| Property | Value | Source |
|----------|-------|--------|
| Width | `var(--sidebar-width)`: 280px default, 360px at 1920px+, 400px at 2560px+, 420px at 3440px+ | `index.css`, `GameView.tsx:2829` |
| Position | Right edge, `flex-shrink-0 overflow-y-auto` | `GameView.tsx:2827` |
| Border | `1px solid var(--border-gold)` left edge | `GameView.tsx:2831` |
| Contents | `ThreadsPanel`, `WorldPulse`, `HexDetailView`, `AgentDetailPanel`, entity detail views | `GameView.tsx` |
| Behavior | Always rendered. Content swaps based on selection state. Internal vertical scroll. | |

### Bottom Drawer (ActionDrawer)

| Property | Value | Source |
|----------|-------|--------|
| Card hand height | `130px` container | `ActionDrawer.tsx:342` |
| Filter tabs | `6px` bottom margin | `ActionDrawer.tsx:288` |
| Total height | ~142px (tabs + cards + padding) | Computed |
| Position | Bottom edge, full width | `GameView.tsx` |
| Z-index | Card hand: `40`, Backdrop (focused): `50`, Focused card: `51` | `ActionDrawer.tsx` |
| Card width | `160px` (`CARD_WIDTH_PX`) | `ActionDrawer.tsx:23` |
| Max hand width | `1200px` (`MAX_HAND_WIDTH_PX`) | `ActionDrawer.tsx` |
| Behavior | Cards fan out horizontally. Click to focus/expand. Context-filtered by NarrativeLayer. | |

### Modal Layer

| Property | Value | Source |
|----------|-------|--------|
| Z-index | `60` (backdrop + dialog) | `Modal.tsx:68` |
| Max width | `600px` default (configurable via `maxWidth` prop) | `Modal.tsx:23,80` |
| Max height | `75vh` | `Modal.tsx:82` |
| Animation | `anim-fade-up` default | `Modal.tsx:23` |
| Behavior | Centered overlay. Escape to close. Backdrop click to close. | |

### Avatar HUD

| Property | Value | Source |
|----------|-------|--------|
| Z-index | `20` | `AvatarHUD.tsx:26` |
| Position | Top-left area, inside top bar | `GameView.tsx` |

### Debug Panel

| Property | Value | Source |
|----------|-------|--------|
| Z-index | `45` | `debugPanelStyles.ts:12` |
| Trigger | Backtick (`` ` ``) toggle, `F1` direct to CLI tab | Keyboard shortcuts |

### Settings Panel

| Property | Value | Source |
|----------|-------|--------|
| Z-index | `50` | `SettingsPanel.tsx:121` |

---

## Z-Index Stacking Order

From bottom to top — every layer that participates in the stacking context:

| Z-Index | Layer | Component(s) | Notes |
|---------|-------|--------------|-------|
| 0 | Map canvas | `HexMapV2` | Three.js WebGL canvas, base layer |
| 10 | Map overlays | `HexTooltip`, `LocationLabelOverlay` | HTML positioned over canvas |
| 20 | HUD elements | `AvatarHUD`, encounter veil decorations | Always-on-top of map |
| 30 | Top bar | Top bar container | `relative z-30` in GameView |
| 40 | Action card hand | `ActionDrawer` card tray | Bottom drawer cards |
| 45 | Debug panel | `DebugPanel` | Dev-only, above cards |
| 50 | Focused overlays | ActionDrawer backdrop, `SettingsPanel`, `EncounterVeil` | Focused card interaction, settings |
| 51 | Focused card | ActionDrawer focused card detail | Above backdrop |
| 60 | Modals | `Modal` (shared primitive) | Standard dialogs |
| 70+ | Tooltips | `Tooltip` (shared primitive) | `70 + depth` for nested tooltips |
| 9999 | Portaled menus | `Dropdown` | Portal-based, always on top |

**Rule:** New UI elements must slot into this table. If you need a new layer, it must fit between existing values. Document it here.

---

## Responsive Scaling

CSS custom properties scale at four breakpoints defined in `index.css`:

| Property | Default | 1920px+ | 2560px+ | 3440px+ |
|----------|---------|---------|---------|---------|
| `--topbar-height` | 44px | 48px | 52px | 52px |
| `--sidebar-width` | 280px | 360px | 400px | 420px |
| `--topbar-padding-x` | 12px | 16px | 20px | 24px |
| `--topbar-gap` | 12px | 16px | 20px | 24px |
| `--panel-radius` | 0.5rem | — | — | — |
| `--panel-padding` | 1rem | 1.25rem | 1.5rem | 1.75rem |

Below 1600px: `.topbar-compact-hide` elements are hidden to save horizontal space.

---

## Always Visible vs. Toggleable vs. Triggered

| Visibility | Components |
|-----------|------------|
| **Always visible** | Top bar (`SimulationControls`, `MandateTracker`, `DoomBar`, `EssencePanel`), Right sidebar (`ThreadsPanel`, `WorldPulse`), Hex map canvas, Action drawer (card hand) |
| **User-toggled** | `HexSidebar` (expand/collapse), `DebugPanel` (backtick/F1), `SettingsPanel` |
| **Selection-triggered** | `HexDetailView` (click hex), `AgentDetailPanel` (click agent), entity detail views |
| **Event-triggered** | `AlertBar`, `EventPopup`, `MeetingEncounterModal`, `JourneyVignetteModal`, `EncounterVeil`, `PremonitionModal` |
| **Action-triggered** | `Modal` dialogs (confirm, profile deep-dive), `AgentProfileModal` (button from detail panel) |

---

## Insertion Points for New UI

When adding a new UI element, place it in the appropriate zone:

| "I need to add..." | Insert at | Parent component | Z-index range |
|--------------------|-----------|-----------------|---------------|
| A new top-bar indicator | Inside top bar flex row | `GameView.tsx` top bar section | Inherits z:30 |
| A new sidebar section | Inside right sidebar scroll area | `GameView.tsx` right sidebar `<div>` | No explicit z needed |
| A map overlay (HTML) | As sibling of HexTooltip | `GameView.tsx` map overlay container | 10–20 |
| A new modal dialog | Use `Modal` primitive, render in GameView | `GameView.tsx` modal section | 60 (automatic) |
| A toast/alert | Use `AlertBar` or `EventPopup` | GameView alert layer | Highest practical |
| A full-screen overlay | Render as sibling of modals | `GameView.tsx` overlay section | 50–60 |
| A bottom-area control | Inside or alongside ActionDrawer | `GameView.tsx` bottom section | 40–51 |
| A debug-only tool | Inside DebugPanel | `DebugPanel.tsx` | 45 (inherited) |

**Anti-patterns:**
- Do not render HTML directly inside the Three.js canvas — use the HTML overlay layer above it.
- Do not create new stacking contexts (`position: relative/absolute` with z-index) inside the right sidebar — it scrolls and z-fighting causes visual bugs.
- Do not use z-index values above 9999 unless you have a compelling reason and document it here.
- Do not hardcode pixel widths that duplicate CSS custom properties — use `var(--sidebar-width)` etc.

---

## GameView Layout Structure (JSX skeleton)

```
GameView (h-screen flex flex-col overflow-hidden)
  ├── Top Bar (relative z-30 flex-shrink-0, height: var(--topbar-height))
  │     ├── SimulationControls
  │     ├── MandateTracker
  │     ├── DoomBar
  │     ├── EssencePanel
  │     └── AvatarHUD (z:20)
  │
  ├── Main Content (flex flex-1 overflow-hidden)
  │     ├── HexSidebar (60–220px, left)
  │     ├── Center Area (flex-1 flex-col relative)
  │     │     ├── HexMapV2 (Three.js canvas, fills space)
  │     │     ├── HexTooltip (absolute, z:10)
  │     │     ├── LocationLabelOverlay (absolute)
  │     │     └── RegionLabels (absolute)
  │     └── Right Sidebar (var(--sidebar-width), flex-shrink-0)
  │           ├── ThreadsPanel
  │           ├── WorldPulse
  │           └── [Selection-dependent detail views]
  │
  ├── Action Drawer (bottom, z:40–51)
  │     ├── Filter Tabs
  │     └── Card Hand (130px)
  │
  ├── Modal Layer (z:60)
  │     ├── MeetingEncounterModal
  │     ├── AgentProfileModal
  │     ├── JourneyVignetteModal
  │     └── [Other modals via Modal primitive]
  │
  ├── Overlay Layer (z:50–60)
  │     ├── EncounterVeil
  │     ├── SettingsPanel (z:50)
  │     └── PremonitionModal
  │
  └── Alert Layer (top, highest z)
        ├── AlertBar
        └── EventPopup
```
