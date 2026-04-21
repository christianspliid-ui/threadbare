---
name: frontend-ui
description: >
  Use when building UI components, styling, accessibility work, debug panel features,
  or any code that lives in src/ui/ or src/components/. Triggers on "component",
  "UI", "frontend", "panel", "layout", "accessibility", "style tile", "CSS",
  "responsive", "interaction", or when the task involves visual presentation.
  Also load when designing the **UI pillar** of any feature.
---

# Frontend & UI — Domain Context

This skill is the **single-load context** for designing and building UI in Threadbearer. It inlines the critical decision-making content so you can design the UI pillar of any feature without reading additional files. Deep-dive references are linked for specialized work.

---

## 1. Dark Tapestry Design Language

The visual identity is called **Threadbare** — dark world, hidden magic, threads that break through.

**Core principles:**
- Always dark. No light mode. Background never brighter than `--bg-surface`.
- Gold means "important" or "active" — use sparingly.
- Mechanics communicated through narrative prose, never numbers. Use verbal word scales from `domain-words.ts`.
- Progressive disclosure: hover → click → deep-dive. Don't frontload information.

**Source of truth:** `STYLE.md` (repo root) for colors, sphere form language, art direction. `Design/style-tile.html` for visual reference and hex asset registry. These two files are coupled — update both in the same session when either changes.

---

## 2. Token Quick Reference

Ground truth: `src/index.css` `:root` block. Deep dive: `Docs/design-system/tokens.md`.

### Backgrounds (dark → light, never skip layers)

| Token | Hex | Use |
|-------|-----|-----|
| `--bg-abyss` | `#0a0a0e` | Page background, fullscreen overlays |
| `--bg-deep` | `#111114` | Top bar, sidebar backgrounds |
| `--bg-surface` | `#1a1a1f` | Cards, panels |
| `--bg-raised` | `#222228` | Rows, chips, interactive elements at rest |
| `--bg-hover` | `#2a2a32` | Hover state |

### Text (bright → dim)

| Token | Use |
|-------|-----|
| `--text-primary` | Main content, names, values |
| `--text-secondary` | Supporting info, subtitles |
| `--text-tertiary` | Labels, metadata, section headers |
| `--text-muted` | Hints, placeholders, disabled |

### Accent — Gold (use sparingly)

| Token | Use |
|-------|-----|
| `--accent-gold` | Active states, selected items |
| `--accent-gold-dim` | Subtle gold — borders, icons at rest |
| `--accent-gold-glow` | Background tint for active elements |

### Layout scaling

| Property | Default | 1920px+ | 2560px+ | 3440px+ |
|----------|---------|---------|---------|---------|
| `--topbar-height` | 44px | 48px | 52px | 52px |
| `--sidebar-width` | 280px | 360px | 400px | 420px |
| `--panel-padding` | 1rem | 1.25rem | 1.5rem | 1.75rem |
| `--topbar-padding-x` | 12px | 16px | 20px | 24px |

---

## 3. Component Selection — "Which component do I use?"

Full decision tree: `Docs/design-system/component-selection.md`. Here are the most common decisions:

### Show entity details

| Need | Component | Trigger |
|------|-----------|---------|
| Quick agent summary | `AgentInfoCard` | Inline embed |
| Agent detail with traits/activity | `AgentDetailPanel` | Click agent |
| Full agent deep-dive (6 tabs) | `AgentProfileModal` | Button from detail panel |
| Location contents | `HexDetailView` | Click hex |
| Faction/army/artifact sheet | `FactionSheet` / `ArmySheet` / `ArtifactSheet` | Click entity |
| Inline entity reference | `IdentityChip` | Always visible |

### Show a list

| Need | Component |
|------|-----------|
| Interactive row with title/subtitle | `ListRow` (shared primitive) — compound: Title, Subtitle, Leading |
| Narrative threads | `ThreadsPanel` |
| Agents in retinue | `RetinuePanel` |

### Show a card or panel

| Need | Component |
|------|-----------|
| Generic content wrapper | `Card` (shared primitive) — Header, Body, Footer. Variants: surface, raised, glass |
| Entity card for sidebar | `EntityCard` — structured blocks: member_list, keyword_cloud, trait_grid, etc. |
| Rarity-accented wrapper | `RarityBorderBox` — wraps any content with left-border accent by tier |

### Show a modal

**Default:** Use `Modal` (shared primitive) with custom body content. Max-height 75vh, default max-width 600px. Escape to close.

**Only create custom modals** for fundamentally different interaction patterns (encounter branching, full-screen vignettes).

### Show a notification

| Need | Component |
|------|-----------|
| Transient alert | `AlertBar` |
| Event result popup | `EventPopup` (toast-style) |
| Progress toward goal | `ProgressBar` / `StepDots` |
| Rarity tier label | `RarityBadge` |

---

## 4. Layout Zones — "Where does new UI go?"

Full reference: `Docs/design-system/layout-zones.md`. Viewport is 1920×1080, nothing scrolls, nothing renders below the fold.

```
+------------------------------------------------------------------+
|                        Top Bar (48px)                        z:30 |
+------+-------------------------------------------+---------------+
| Left |                                           |   Right       |
| Side |           Hex Map Canvas                  |   Sidebar     |
| bar  |           (Three.js / flex-1)             |  (360px @FHD) |
| 60-  |                                           |               |
| 220  |                                           |               |
+------+-------------------------------------------+---------------+
|                   Action Drawer (~142px)                    z:40 |
+------------------------------------------------------------------+
```

### Z-index stacking (bottom to top)

| Z | Layer | Component(s) |
|---|-------|-------------|
| 0 | Map canvas | `HexMapV2` |
| 10 | Map overlays | `HexTooltip`, `LocationLabelOverlay` |
| 20 | HUD elements | `AvatarHUD` |
| 30 | Top bar | Top bar container |
| 40 | Action card hand | `ActionDrawer` |
| 45 | Debug panel | `DebugPanel` |
| 50 | Focused overlays | ActionDrawer backdrop, `SettingsPanel`, `EncounterVeil` |
| 60 | Modals | `Modal` (shared) |
| 70+ | Tooltips | `Tooltip` (70 + nesting depth) |
| 9999 | Portaled menus | `Dropdown` |

### Insertion point quick reference

| "I need to add..." | Place it | Z-index |
|--------------------|----------|---------|
| Top-bar indicator | Inside top bar flex row | Inherits 30 |
| Sidebar section | Inside right sidebar scroll area | None needed |
| Map overlay (HTML) | Sibling of HexTooltip | 10–20 |
| Modal dialog | Use `Modal` primitive in GameView | 60 (auto) |
| Toast/alert | `AlertBar` / `EventPopup` | Highest |
| Full-screen overlay | Sibling of modals in GameView | 50–60 |
| Bottom-area control | Inside/alongside ActionDrawer | 40–51 |

---

## 5. Shared Primitives — "Use these, don't reinvent"

All live in `src/components/shared/`. Full spec: `Docs/design-system/primitives.md`.

| Primitive | Purpose |
|-----------|---------|
| `Button` | 4 variants (primary, secondary, ghost, danger), 3 sizes |
| `IconButton` | Icon-only compact button. Has badge slot. |
| `Card` | Content wrapper. Compound: Header, Body, Footer |
| `Modal` | Dialog overlay. Escape/backdrop close. max-height 75vh |
| `Tooltip` | Smart-positioned hover info. Viewport-aware, nested hover support |
| `Dropdown` | Portal-based menu. Escape/outside-click close |
| `ListRow` | Interactive list item. Compound: Title, Subtitle, Leading |
| `ProgressBar` | Horizontal 0–1 progress with glow |
| `StepDots` | Discrete step indicators |
| `EntityCard` | Structured entity display with flexible block sections |
| `RarityBorderBox` | Left-border accent wrapper by rarity tier |
| `RarityBadge` | Inline colored tag for rarity tier |
| `SphereIcon` | Sphere symbol. SVG primary, PNG fallback |
| `SectionHeading` | Heading with optional count and ornamental rules |
| `AnimateMount` | Mount/unmount animation wrapper |
| `GameErrorBoundary` | Error fallback — wrap any subtree that might crash |

**Rule:** Do not write one-off button, card, modal, or list implementations. Use the primitives. If a primitive doesn't fit, extend it — don't bypass it.

---

## 6. Interaction Patterns

Full reference: `Docs/design-system/interactions.md` and `Docs/ui-patterns.md`.

### State definitions (all must be implemented for interactive elements)

| State | Visual treatment |
|-------|-----------------|
| Rest | `--bg-raised` or transparent |
| Hover | `--bg-hover` + `--border-subtle` |
| Active | `--bg-hover` + `scale(0.98)` |
| Selected | `--accent-gold-glow` bg + `--border-accent` + gold text |
| Focus-visible | `outline: 2px solid var(--accent-gold-dim)`, offset -2px |
| Disabled | `opacity: 0.4`, `cursor: not-allowed`, no hover |

**Never suppress `:focus-visible`.** Use `focus-visible` not `focus`.

### Established patterns

- **Eye-icon zoom:** Sidebar items with map-located entities get `&#x1F441;` eye button → `onZoomToLocation(locationId)`. Color: `--accent-gold-dim`, size: `--text-xs`. Always `e.stopPropagation()`.
- **Progressive disclosure:** Tooltip (Tier 1 hover) → AgentInfoCard (Tier 2 click) → AgentProfileModal (Tier 3 deep dive).
- **Overlay mutual exclusion:** Only one panel-level overlay open at a time. Backdrop click closes. Escape key closes topmost.
- **Hover via JS:** Dynamic base colors (sphere, tier) → use `onMouseEnter`/`onMouseLeave` style mutation, not CSS classes. Simple buttons with static colors may use Tailwind hover.

### Keyboard shortcuts (global, registered in `useTopBarHotkeys`)

| Key | Action |
|-----|--------|
| `Space` | Toggle pause/run |
| `+`/`=` | Speed up |
| `-` | Slow down |
| `.` | Step one tick (paused) |
| `` ` `` | Toggle debug panel |
| `F1` | Open debug panel → CLI tab |

---

## 7. UI Design Checklist

**Use this when designing the UI pillar of any feature.** Answer each question or mark N/A with rationale.

- [ ] **What does the player see?** — Which viewport zone(s)? Sidebar panel, modal, map overlay, top-bar indicator, toast?
- [ ] **Which existing component(s)?** — Check the component selection tree (§3). Never create a new component when a primitive or existing component works.
- [ ] **Where in the z-stack?** — Which z-index layer? Does it conflict with existing overlays?
- [ ] **What triggers visibility?** — Always visible, user-toggled, selection-triggered, or event-triggered?
- [ ] **How does the player dismiss it?** — Escape key? Backdrop click? Close button? Auto-timeout?
- [ ] **What data does it display?** — Which GameState fields? Which graph traversals? Which aggregator functions?
- [ ] **How does it handle missing data?** — Placeholder states, loading indicators, graceful fallbacks (NFP #4).
- [ ] **What interaction states?** — Rest, hover, active, selected, disabled, focus-visible (see §6).
- [ ] **Does it emit events?** — Does clicking/interacting dispatch to other systems (map navigation, encounter trigger, action fire)?
- [ ] **Responsive behavior?** — How does it adapt at 1280px, 2560px, 3440px?
- [ ] **Debug visibility?** — Can the debug panel inspect the relevant state/traces?
- [ ] **HexMap presence?** — If spatial, does it need a map signifier, overlay, or label?
- [ ] **Notification surface?** — Does the system produce events the player should see? AlertBar toast? EventPopup? Chronicle entry?

---

## 8. Anti-Patterns

- **Don't use `EntityCard` for simple text** — use `Card` for generic content.
- **Don't create a new modal component** when `Modal` with custom body works.
- **Don't put HTML directly in the Three.js canvas** — use the HTML overlay layer.
- **Don't nest `Card` inside `Card`** — use `SectionHeading` to divide.
- **Don't use `ProgressBar` for discrete steps** — use `StepDots`.
- **Don't hardcode pixel widths** that duplicate CSS custom properties — use `var(--sidebar-width)` etc.
- **Don't show numeric stats to the player** — use verbal word scales from `domain-words.ts`.
- **Don't suppress `:focus-visible`** — keyboard players need it.
- **Don't skip the UI pillar** in design plans — an engine system without player-facing display is invisible.

---

## 9. Deep-Dive References

Load these only when doing specialized work in that domain:

| Domain | File |
|--------|------|
| Design system index | `Docs/design-system/INDEX.md` |
| Full component selection tree | `Docs/design-system/component-selection.md` |
| Full layout zone architecture | `Docs/design-system/layout-zones.md` |
| All CSS tokens | `Docs/design-system/tokens.md` |
| Typography scale | `Docs/design-system/typography.md` |
| Animation/motion | `Docs/design-system/motion.md` |
| Full component inventory | `Docs/design-system/components.md` |
| Full interaction patterns | `Docs/design-system/interactions.md` |
| React UI patterns | `Docs/ui-patterns.md` |
| Primitives spec | `Docs/design-system/primitives.md` |
| Art direction | `STYLE.md` |
| Style tile (visual) | `Design/style-tile.html` |
| CSS source of truth | `src/index.css` |
| Component source | `src/components/` |
| Codesight component catalog | `.codesight/components.md` |

---

## 10. Verification

After implementing, verify at 1920×1080:
```
preview_start('dev')
preview_resize({ width: 1920, height: 1080 })
```

For WebGL/Three.js content (HexMap), use Claude in Chrome tools — Playwright cannot see WebGL canvas content.

Check: nothing scrolls, nothing renders below the fold, all interaction states work, keyboard navigation functional, debug panel shows relevant traces.
