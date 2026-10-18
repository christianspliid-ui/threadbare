# Layout Zone Architecture

> **Purpose:** Definitive reference for viewport zones, z-index stacking, responsive scaling, and insertion points. Load this when placing new UI elements.
>
> **Last updated:** 2026-10-18 (THR-1912: the Inspector is the one detail surface — the hex sidebar, the detail column and the Action Drawer are gone)

---

## Viewport Layout (1920×1080, the supported floor; 2560×1440 is the primary screen)

```
+------------------------------------------------------------------------------+
|                    Top Bar (--topbar-height, 48px)                      z:30 |
+------+-----------------------------------+---------------------+-------------+
| God  |                                   |  Inspector          |   Ledger    |
| rail |        Hex Map Canvas             |  (docked            |   rail      |
| (--  |        (Three.js / flex-1)        |   --inspector-w,    |  (--rail-   |
| rail-|                                   |   wide              |   right-w,  |
| left-|   +--HexTooltip (z:15)---+        |   --inspector-      |   340px)    |
| w)   |   | hover overlay        |        |   wide-w; only      |             |
|      |   +----------------------+        |   while a subject   |             |
|      |                                   |   is open)          |             |
+------+-----------------------------------+---------------------+-------------+

Inspector at Full: covers the map region right of the god rail      z:40 (Z_BAND.drawer)

Overlay layers (centered, above everything):
  - EncounterVeil / Full-screen modals           z:50–60
  - Modal (shared primitive)                     z:60
  - Dialog opened over an interrupt              z:65
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

### Hex Map Canvas (center)

| Property | Value | Source |
|----------|-------|--------|
| Size | `flex-1` — fills remaining space between the god rail, the Inspector and the Ledger rail | `GameView.tsx` |
| Renderer | Three.js `<canvas>` via `HexMapV2` | `HexMapV2.tsx` |
| Overlays | `HexTooltip` (hover, z:10), `LocationLabelOverlay`, `RegionLabels`, `MovementTrails` | HTML positioned over canvas |
| Interaction | d3-zoom for pan/zoom. A click on land or a place opens its page in the Inspector (plan THR-1876 § D10). | |

### Right Sidebar

| Property | Value | Source |
|----------|-------|--------|
| Width | `var(--rail-right-w)` (the Ledger rail, THR-1828): 280px below 1920, 340px at 1920px+, 420px at 2560px+ and 3440px+ | `index.css`, `GameView.tsx` |
| Position | Right edge, `flex-shrink-0 overflow-y-auto` | `GameView.tsx:2827` |
| Border | `1px solid var(--border-gold)` left edge | `GameView.tsx:2831` |
| Contents | `ThreadsPanel`, `ChroniclePanel` (World-Soul line; Now · Years · Ledger), `LedgerStrip` when folded | `frame/LedgerRail.tsx` |
| Behavior | Always rendered. Internal vertical scroll. A subject opens in the Inspector, never in this rail. | |

### Inspector

| Property | Value | Source |
|----------|-------|--------|
| Width | Docked `var(--inspector-w)` (560px at 1920, 717px at 2560); wide `var(--inspector-wide-w)` (960px / 1280px); Full covers the map region right of the god rail | `index.css`, `inspector/InspectorHost.tsx` |
| Position | Between the map and the Ledger rail, `flex-shrink-0`; renders nothing while no subject is open | `GameView.tsx` |
| Z-index | In flow at docked and wide; Full sits at `Z_BAND.drawer` (40) and holds the clock | `InspectorHost.tsx` |
| Contents | One subject's page (`InspectorPage`): header, Act row, the page-layout table's sections as tabs, Connections | `inspector/InspectorPage.tsx` |
| Behavior | Every open goes through `useRefRouter` (card → the registry row's `opensAt`, sheet → wide). History, trail, pin, Follow; Escape steps Full down, then closes. The page's Act row casts (the Action Drawer retired, THR-1912). | plan THR-1876 § D1–D4, D9 |

### Modal Layer

| Property | Value | Source |
|----------|-------|--------|
| Z-index | `60` default (`MODAL_Z_DEFAULT` = `Z_BAND.modal`), `65` raised (`MODAL_Z_ABOVE_INTERRUPT` = `Z_BAND.modalAboveInterrupt`) — via the `zIndex` prop | `Modal.tsx`, `zBands.ts` |
| Width | Size tier via `size` — S 600 / M 960 / L 1280 / XL 1760 px at 1920×1080, S 675 / M 1080 / L 1600 / XL 2240 px at 2560×1440, clamped to the viewport less two `--dialog-gutter`s (THR-1820). Default S. `maxWidth` is deprecated (ratchet row `modal-maxwidth`) | `Modal.tsx`, `dialogSize.ts`, `index.css` |
| Max height | `var(--modal-max-h)` = 85vh — the one dialog cap (Law 33) | `Modal.tsx`, `index.css` |
| Animation | `anim-fade-up` default | `Modal.tsx:23` |
| Behavior | An `Overlay` (backdrop, band, Escape stack, focus) with a floating `page` `Panel` (THR-1884). Escape closes it when it is the topmost surface. Backdrop click to close. | `Overlay.tsx` |

**Two modals at equal z resolve by DOM order** — which the JSX author never sees, and which changes whenever the render order in `GameView` is edited. `MODAL_Z_ABOVE_INTERRUPT` (65) is the one sanctioned step up, for a dialog opened *from* a modal-tier interrupt that renders later in `GameView` (THR-1139 introduced it for the character sheet over `PremonitionModal`; the sheet retired in THR-1912 and the band stays for the next such dialog). It deliberately stops below 70 — a dialog contains tooltips, and `Tooltip` sits at `70 + depth`, so raising a sheet into that band would bury its own hovers. A third band is a design decision against this table, not an implementation choice (Law 35).

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

**The table is code:** `Z_BAND` in [`src/components/shared/zBands.ts`](../../src/components/shared/zBands.ts) (THR-1884) states the bands below as named constants — `mapOverlay 10 · hud 20 · topBar 30 · drawer 40 · debug 45 · focused 50 · stage 50 · modal 60 · modalAboveInterrupt 65 · tooltip 70 (+ depth) · menu 9999`. `MODAL_Z_DEFAULT`, `MODAL_Z_ABOVE_INTERRUPT`, `ESCAPE_LAYER_Z_PANEL` and `ENCOUNTER_VEIL_Z` are re-exports of it. A surface names a band (`<Overlay band="modal">`, `Z_BAND.tooltip + depth`); a z-index typed anywhere else is Law 35 debt. The same band is the surface's rank in the escape registry, so Escape closes the topmost band first (`await window.__DEBUG.getEscapeLayers()`).

From bottom to top — every layer that participates in the stacking context:

| Z-Index | Layer | Component(s) | Notes |
|---------|-------|--------------|-------|
| 0 | Map canvas | `HexMapV2` | Three.js WebGL canvas, base layer |
| 10–19 | Map overlays | `AgentPulseOverlay` (11), `RegionLabelOverlay` (12), `LocationLabelOverlay` (13), `HexTooltip` (15) | HTML positioned over canvas. Values are `MAP_OVERLAY_Z` in `src/components/HexMapV2/overlay/mapOverlayZ.ts` — never a literal. The HexMapV2 container sets `isolation: isolate`, so the band cannot outrank the HUD; the tooltip is on top so no label paints over it (THR-1665) |
| 20 | HUD elements | `AvatarHUD`, encounter veil decorations | Always-on-top of map |
| 30 | Top bar | Top bar container | `relative z-30` in GameView |
| 40 | Inspector at Full | `InspectorHost` (`Z_BAND.drawer`) | Covers the map region right of the god rail; docked and wide sit in flow (THR-1876) |
| 45 | Debug panel | `DebugPanel` | Dev-only, above the Inspector |
| 50 | Focused overlays · the Stage | `SettingsPanel`, `EncounterVeil` (`Z_BAND.stage`), the full-screen ceremonies — `MeetTheFirstFlow`, `ThreadingRite`, `HarvestScreen` on `<Overlay band="focused" backdrop="void">` | Settings, ceremony (THR-1884) |
| 60 | Modals | `Modal` (shared primitive) | Standard dialogs — `MODAL_Z_DEFAULT` |
| 62 | Held-gift pill | `AscendantBeatOfferBanner` carrying a waiting opening gift | `GIFT_PILL_Z` — above the player surfaces that hold the gift (Modal 60) so the pill stays visible over them. It rises only while nothing but the player's own surfaces or recent input holds the gift; under an interrupt or a vignette it stays at 40, below the backdrop, as does the pool-beat pill (THR-1809). Both pills sit at `PILL_TOP`, one spacing step below the top bar's rendered height (`--topbar-live-height`), never over the bar's controls (THR-1853) |
| 65 | Dialog over interrupt | (none today — the character sheet that used it retired in THR-1912) | `MODAL_Z_ABOVE_INTERRUPT`, via `Modal`'s `zIndex` prop (THR-1139) |
| 70+ | Tooltips | `Tooltip` (shared primitive) | `70 + depth` for nested tooltips |
| 9999 | Portaled menus | `Dropdown` | Portal-based, always on top |

**Rule:** New UI elements must slot into this table. If you need a new layer, it must fit between existing values. Document it here.

---

## Responsive Scaling

The 1440p layout contract (THR-1819). Frame tokens are px, restated in each `@media (min-width: …)` block of `index.css`; text containers are rem and follow the root step-up (`html { font-size: 112.5% }` at ≥2560 wide and ≥1200 tall). JS reads the same table from `src/components/shared/layoutContract.ts`; `layoutContract.test.ts` locks parity and the map-share budget.

| Token | base (<1920) | 1920px+ | 2560px+ | 3440px+ |
|----------|---------|---------|---------|---------|
| `--topbar-height` | 44px | 48px | 56px | 56px |
| `--topbar-padding-x` | 12px | 16px | 20px | 20px |
| `--topbar-gap` | 12px | 16px | 20px | 20px |
| `--rail-left-w` (god rail) | 320px | 320px | 400px | 400px |
| `--rail-right-w` (Ledger rail) | 280px | 340px | 420px | 420px |
| `--rail-strip-w` | 56px | 56px | 56px | 56px |
| `--inspector-w` | 560px | 560px | 717px | 717px |
| `--inspector-wide-w` | 960px | 960px | 1280px | 1280px |
| `--inspector-full-trail-w` / `-aside-w` | 240 / 360px | 240 / 360px | 300 / 440px | 300 / 440px |
| `--stage-gutter` | 24px | 24px | 24px | 24px |
| `--stage-window-w` | 280px | 280px | 520px | 1400px |
| `--stage-left-col-w` | 340px | 340px | 560px | 560px |
| `--panel-radius` | 0.5rem | — | — | — |
| `--panel-padding` | 1rem | 1.25rem | (1.25rem — rem already steps) | — |
| `--tooltip-max-w` / `--hovercard-w` / `--toast-w` | 17.5 / 26.25 / 20rem | 280 / 420 / 320px | 315 / 472.5 / 360px | same |
| `--modal-max-h` | 85vh | — | — | — |

Below 1600px: `.topbar-compact-hide` elements are hidden to save horizontal space.

---

## Always Visible vs. Toggleable vs. Triggered

| Visibility | Components |
|-----------|------------|
| **Always visible** | Top bar (`SimulationControls`, `MandateTracker`, `DoomBar`, `EssencePanel`), Right sidebar (`ThreadsPanel`, `ChroniclePanel`; folds to `LedgerStrip`), Hex map canvas, god rail (the hand) |
| **User-toggled** | `DebugPanel` (backtick/F1), `SettingsPanel` |
| **Selection-triggered** | The Inspector (any link, card, map click or notification opens a subject's page) |
| **Event-triggered** | `AlertBar`, `EventPopup`, `MeetingEncounterModal`, `JourneyVignetteModal`, `EncounterVeil`, `PremonitionModal` |
| **Action-triggered** | `Modal` dialogs (confirm, detail readouts), the Inspector at Full |

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
| Something a subject's page shows | A row in the page-layout table (`DETAIL_PAGE_REGISTRY`) — never a new panel | `src/data/detailPageTemplates.ts` | In the Inspector |
| A debug-only tool | Inside DebugPanel | `DebugPanel.tsx` | 45 (inherited) |

**Anti-patterns:**
- Do not render HTML directly inside the Three.js canvas — use the HTML overlay layer above it.
- Do not create new stacking contexts (`position: relative/absolute` with z-index) inside the right sidebar — it scrolls and z-fighting causes visual bugs.
- Do not use z-index values above 9999 unless you have a compelling reason and document it here.
- Do not hardcode pixel widths that duplicate CSS custom properties — use `var(--rail-right-w)`, `var(--rail-left-w)` etc.

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
  │     ├── God rail — AscendantBar (var(--rail-left-w), left)
  │     ├── Center Area (flex-1 flex-col relative)
  │     │     ├── HexMapV2 (Three.js canvas, fills space)
  │     │     ├── HexTooltip (absolute, z:10)
  │     │     ├── LocationLabelOverlay (absolute)
  │     │     └── RegionLabels (absolute)
  │     ├── InspectorHost (var(--inspector-w) docked / var(--inspector-wide-w) wide; Full at z:40)
  │     │     └── InspectorPage (header, Act row, tabs, Connections)
  │     └── Ledger rail (var(--rail-right-w), flex-shrink-0)
  │           ├── ThreadsPanel
  │           └── ChroniclePanel (World-Soul line · Now · Years · Ledger) — or LedgerStrip (56 px) when folded
  │
  ├── Modal Layer (z:60)
  │     ├── MeetingEncounterModal
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
