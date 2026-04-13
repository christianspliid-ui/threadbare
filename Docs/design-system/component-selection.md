# Component Selection Guide

> **Purpose:** Help agents choose the right component when designing new UI. Load this when designing the UI pillar of any feature.
>
> **Last updated:** 2026-04-13

---

## Decision Tree: "I need to..."

### Show entity details

| Need | Component | Zone | Trigger |
|------|-----------|------|---------|
| Quick agent summary (name, tier, status) | `AgentInfoCard` | Embed in any list | Inline |
| Agent detail with traits, attachments, activity | `AgentDetailPanel` | Right panel | Click agent on map/list |
| Full agent deep-dive (6 tabs) | `AgentProfileModal` | Modal overlay | Button from AgentDetailPanel |
| Location contents (agents, sublocations) | `HexDetailView` | Right panel | Click hex |
| Full location tree | `LocationProfileModal` | Modal overlay | Click location name |
| Faction network and members | `FactionSheet` | Modal overlay | Click faction |
| Army composition and siege | `ArmySheet` | Modal overlay | Click army |
| Artifact properties and bearer | `ArtifactSheet` | Modal overlay | Click artifact |
| Ascendant sphere attunement | `AscendantSheet` | Modal overlay | Click ascendant |
| NPC (lightweight agent variant) | `NpcDetailView` | Right panel | Click NPC |
| Inline entity reference | `IdentityChip` | Inline in text | Always visible |

### Show a list of things

| Need | Component | Notes |
|------|-----------|-------|
| Interactive row with title/subtitle/accent | `ListRow` (shared primitive) | Compound: Title, Subtitle, Leading. Use for any selectable list. |
| Narrative threads grouped by category | `ThreadsPanel` | Left sidebar or modal. Groups by agent/location/faction/army/artifact. |
| Agents in player's retinue | `RetinuePanel` | Left sidebar. Grouped by tier. |
| Active encounters/events log | `EncounterLog` / `EventLog` | Right panel section. Scrollable history. |
| Recent agent actions | `RecentActivityLog` | Embedded in AgentDetailPanel. |
| Agent attachments | `AttachmentRow` → `AttachmentDetailView` | Row is list item, detail opens on click. |

### Show a card or panel

| Need | Component | Notes |
|------|-----------|-------|
| Generic content wrapper with header/body/footer | `Card` (shared primitive) | Compound: Card.Header, Card.Body, Card.Footer. Variants: surface, raised, glass. |
| Entity card for sidebar (agents, factions, etc.) | `EntityCard` (shared primitive) | Renders structured blocks: member_list, keyword_cloud, trait_grid, bond_list, domain_grid, timeline. |
| Domain reach tier display | `DomainCard` | Shows reach art thumbnail + tier prose. |
| Rarity-accented wrapper | `RarityBorderBox` | Left-border accent by rarity tier. Wraps any content — use around EntityCard or ListRow for rarity emphasis. |
| Agent compact card | `AgentInfoCard` | Name, tier, activity status. For hover popups or list embeds. |

### Show a modal or overlay

| Need | Component | Notes |
|------|-----------|-------|
| Generic dialog (confirm, settings, detail) | `Modal` (shared primitive) | Compound: Modal.Header, Modal.Body, Modal.Footer. max-height 85vh. Escape to close. |
| Encounter dialogue with branching | `MeetingEncounterModal` | Auto-triggered on encounter. Full encounter UI. |
| Journey flavor text | `JourneyVignetteModal` | Full-screen during movement. |
| Obscured challenge preview | `EncounterVeil` | Unknown opponent. |
| Premonition/divine revelation | `PremonitionModal` | Consequence preview with sphere tinting. |
| Full-screen profile (6 tabs) | `AgentProfileModal` | Deep entity inspection. |

**Rule:** For new modal features, use `Modal` (shared) and compose content inside it. Only create a custom modal component if the interaction pattern is fundamentally different from standard dialog behavior.

### Show a notification or indicator

| Need | Component | Notes |
|------|-----------|-------|
| Transient alert/warning | `AlertBar` | Top bar, auto-triggered. |
| Event result popup (item gained, status change) | `EventPopup` | Toast-style, event system triggered. |
| Progress toward goal | `ProgressBar` (shared primitive) | Horizontal bar with glow. Used by MandateTracker, DoomBar. |
| Multi-step progress | `StepDots` (shared primitive) | Dot indicators. Used in RetinuePanel, EncounterVignetteModal. |
| Rarity tier label | `RarityBadge` (shared primitive) | Inline colored tag. |
| Doom countdown | `DoomBar` → `DoomClockDetail` | Bar always visible, detail on click. |

### Show something on the hex map

| Need | Component | Notes |
|------|-----------|-------|
| Hex terrain/atmosphere | `HexMapV2` render layers | Three.js InstancedMesh. See `hexmap-core` skill. |
| Agent positions | Agent dot layer | Part of HexMapV2 render pipeline. |
| Location labels | `LocationLabelOverlay` / `RegionLabels` | Text labels at zoom-dependent visibility. |
| Hex hover info | `HexTooltip` | Floating overlay on hover. |
| Movement paths | `MovementTrails` | Animated paths on map. |
| Sidebar stats for selected hex | `HexSidebar` | Left panel, 220px expanded. |

### Provide player controls

| Need | Component | Notes |
|------|-----------|-------|
| Available narrative actions | `ActionDrawer` | Bottom drawer with cards. Context-filtered by NarrativeLayer. |
| Individual action choice | `ActionCard` | Card in hand within ActionDrawer. |
| Simulation play/pause/speed | `SimulationControls` | Top bar. |
| Mandate tracking | `MandateTracker` → `MandateDetail` | Top bar indicator, detail on click. |
| Essence/mana resource | `EssencePanel` | Top/side bar. |

---

## Shared Primitives Catalog

These live in `src/components/shared/` and are the building blocks. **Always check here before creating something new.**

| Primitive | Purpose | When to use |
|-----------|---------|-------------|
| `Button` | Themable action button | Any clickable action. 4 variants: primary, secondary, ghost, danger. 3 sizes. |
| `IconButton` | Icon-only compact button | Toolbar actions, close buttons, toggle controls. Has badge slot. |
| `Card` | Content wrapper | Any bounded content area. Use Header/Body/Footer compounds. |
| `Modal` | Dialog overlay | Any centered overlay dialog. Escape to close, backdrop click. |
| `Tooltip` | Hover information | Progressive disclosure Tier 1. Smart-positioned, viewport-aware, supports nested hover. |
| `Dropdown` | Menu picker | Portal-based, escape/outside-click to close. Compound: Dropdown.Item. |
| `ListRow` | Interactive list item | Any selectable row. Compound: Title, Subtitle, Leading. |
| `ProgressBar` | Horizontal progress | Any 0-1 progress display. |
| `StepDots` | Step indicator | Multi-step flows (encounters, wizards). |
| `EntityCard` | Structured entity display | Sidebar entity details with flexible block sections. |
| `DomainCard` | Reach tier card | Domain/reach display with art. |
| `RarityBorderBox` | Rarity accent wrapper | Wrap anything that should show rarity visually. |
| `RarityBadge` | Rarity tier label | Inline tag showing rarity. |
| `SphereIcon` | Sphere symbol | Any sphere reference. SVG primary, PNG fallback. |
| `RivalIcon` | Rival affinity circles | Overlapping colored circles for rival sphere display. |
| `SectionHeading` | Section label | Heading with optional count and ornamental rules. |
| `AnimateMount` | Mount/unmount animation | Wrap anything that appears/disappears with animation. |
| `GameErrorBoundary` | Error fallback | Wrap any subtree that might crash. |

---

## Component Composition Patterns

**Entity display chain:** `RarityBorderBox` → `EntityCard` → (contains `DomainCard`, `RarityBadge`, `SphereIcon`)

**Modal content:** `Modal` → `Modal.Header` + `Modal.Body` (your content) + `Modal.Footer` (actions)

**List patterns:** `Card` → `Card.Body` → multiple `ListRow` components

**Progressive disclosure:** `Tooltip` (Tier 1 hover) → `AgentInfoCard` (Tier 2 click) → `AgentProfileModal` (Tier 3 deep dive)

**HexMap interaction:** Click hex → `HexDetailView` (right panel) → click entity → `AgentDetailPanel` / `LocationProfileModal`

---

## Anti-Patterns

- **Don't use `EntityCard` for simple text display** — it's a structured block renderer. Use `Card` for generic content.
- **Don't create a new modal component** when `Modal` (shared) with custom body content would work. Custom modals are only for fundamentally different interaction patterns (encounter branching, full-screen vignettes).
- **Don't put content directly in the hex map zone** — everything on the map goes through HexMapV2's render pipeline (Three.js). HTML overlays above the canvas use `HexTooltip`, `LocationLabelOverlay`, etc.
- **Don't nest `Card` inside `Card`** — use `SectionHeading` to divide content within a single Card instead.
- **Don't use `ProgressBar` for discrete steps** — use `StepDots` for step-based progress (encounters, multi-phase flows).

---

## Viewport Zones Quick Reference

| Zone | Position | Width | Component Owner |
|------|----------|-------|----------------|
| Top bar | Top edge | Full width | `TopBar` / `SimulationControls` |
| Left sidebar | Left edge | 60-220px (collapsed/expanded) | `HexSidebar` / `ThreadsPanel` / `RetinuePanel` |
| Hex map canvas | Center | Fills remaining space | `HexMapV2` (Three.js) |
| Right panel | Right edge | ~380px | `HexDetailView` / `AgentDetailPanel` / `ThreadDetailView` |
| Bottom drawer | Bottom edge | Full width, slides up | `ActionDrawer` |
| Modal layer | Centered overlay | max-width varies, max-height 85vh | `Modal` and custom modals |
| Toast/alert layer | Top center | Auto-width | `AlertBar` / `EventPopup` |

See `Docs/design-system/layout-zones.md` for the full zone architecture with z-index stacking and insertion points.
