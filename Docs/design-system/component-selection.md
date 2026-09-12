# Component Selection Guide

> **Purpose:** Help agents choose the right component when designing new UI. Load this when designing the UI pillar of any feature.
>
> **Last updated:** 2026-08-08 (THR-1011 — nudge-era primitives added; catalog now gated against `src/components/shared/` by `styleguideSync.test.ts`)
>
> **This file is machine-checked.** UI Law 29 requires a new primitive to land with its
> `component-selection.md` row in the same PR. `src/components/StyleGuide/__tests__/styleguideSync.test.ts`
> fails when any `.tsx` in `src/components/shared/` has no row here — so the catalog below cannot
> silently fall behind the library again the way it did between 2026-04-13 and 2026-08-06.

---

## Decision Tree: "I need to..."

### Show entity details

**One row (THR-1490).** This table used to list eleven components and left every caller to
pick one by the kind of thing it held — which is how an artifact chip ended up as plain
text on a surface where a faction chip was a link. Routing is now data, not judgment:

| Need | How |
|------|-----|
| Open **any** world object or content reference | `useRefRouterContext()?.open(ref)` — `ref` is a `WorldRef`; the kind decides the surface |

`src/data/surface-registry.ts` is the table that decides: it maps every `WorldRefKind` to
its card kind and its sheet, is total by type, and is the only place that answers "what
does this open". `open(ref, 'card')` (the default) stacks a `DetailModal`; `open(ref,
'sheet')` reaches the bespoke sheet below, falling back to the card when a kind has none;
`EntityLink` hovers into a `HoverCard` after a dwell without the caller doing anything.

The sheets are still the Tier-3 surfaces, reached *through* the router rather than
selected by hand — `AgentProfileModal`, `LocationProfileModal`, `FactionSheet`,
`ArmySheet`, `ArtifactSheet`, `AttachmentDetailView`, `AscendantSheet`. `AgentInfoCard`
(inline summary), `HexDetailView` (a hex's contents in the right panel) and `IdentityChip`
(inline reference) are not detail surfaces and are unaffected.

`AgentDetailPanel` and `NpcDetailView` have no production mount and are deleted in slice 3
(THR-1492); do not build on either.

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
| Generic dialog (confirm, settings, detail) | `Modal` (shared primitive) | Compound: Modal.Header, Modal.Body, Modal.Footer. max-height 75vh (stricter than Law 33's 85vh cap). Escape to close. |
| Encounter dialogue with branching | `MeetingEncounterModal` | Auto-triggered on encounter. Full encounter UI. |
| Journey flavor text | `JourneyVignetteModal` | Full-screen during movement. |
| Obscured challenge preview | `EncounterVeil` | Unknown opponent. |
| Premonition/divine revelation | `PremonitionModal` | Consequence preview with sphere tinting. |
| Full-screen profile (6 tabs) | `AgentProfileModal` | Deep entity inspection. |

**Rule:** For new modal features, use `Modal` (shared) and compose content inside it. Only create a custom modal component if the interaction pattern is fundamentally different from standard dialog behavior.

#### RevealCard vs Modal vs EventPopup (THR-799)

These three are the same family at three fidelities. Pick by *what the player has to do*, not by how important the content feels:

| The moment is… | Component | Why |
|---|---|---|
| The player must **decide** something (confirm, choose, spend) | `Modal` | Competing actions need a footer with real buttons. RevealCard's single quiet dismiss would bury the choice. |
| The player has **gained** a minor element and needs only to see it | `RevealCard` | Ceremonial zones, hero medallion, flavor well. One dismiss, no decision. |
| A plain informational notification with nothing to look at | `EventPopup` compact path | Flat accent strip + title + body. Cheap, fast, unceremonious. |
| A sphere-carrying informational event | `EventPopup` ceremonial path | Routes into RevealCard automatically — see `isCeremonialPopup`. |

`EventPopup` decides its own tier: **sphere present AND no choices** → ceremonial; anything else → compact. The sphere requirement is not decoration — it is the event's only canonical visual identity (there is no per-event art registry), so without it the medallion has nothing to hold. The no-choices requirement is the decision rule above.

Inside a surface that is **already** a `Modal`, embed `RevealCard.Frame` (the zone stack) rather than `<RevealCard>` (which portals its own Modal). Nesting produces two backdrops.

### Show a notification or indicator

| Need | Component | Notes |
|------|-----------|-------|
| Transient alert/warning | `AlertBar` | Top bar, auto-triggered. |
| Event result popup (item gained, status change) | `EventPopup` | Toast-style, event system triggered. |
| Progress toward goal | `ProgressBar` (shared primitive) | Horizontal bar with glow. Used by MandateTracker, DoomBar. |
| Multi-step progress | `StepDots` (shared primitive) | Dot indicators. Used in RetinuePanel, EncounterVignetteModal. |
| Rarity tier label | `RarityBadge` (shared primitive) | Inline colored tag. |
| Doom countdown | `DoomBar` → `DoomClockDetail` | Bar always visible, detail on click. |

**`ProgressBar` vs `ProgressBand` vs `StepDots`** — three different questions:

| The quantity is… | Component |
|---|---|
| A continuous 0–1 fraction the player watches fill | `ProgressBar` |
| A named tier the player reads as a word ("cooling", "taut") | `ProgressBand` — banding it here is what keeps Law 13 off the surface |
| A discrete count of steps, some already taken | `StepDots` |

### Show a magnitude (Laws 10, 13, 15)

Magnitudes never render as raw numbers on a player-facing surface. Two vocabularies, and they are
not interchangeable:

| Need | Component | Notes |
|------|-----------|-------|
| Effect on the odds | `OddsPips` | Pips mean *only* this, everywhere. Twenty ~5% steps in four tiers of five, shape changing per tier. |
| A price the player pays | `CostPips` | Framed badge — deliberately unlike `OddsPips`, because at 13px the director could not tell the two apart when they shared a look (THR-972 §5). |
| The forecast itself | The word | `doomed/perilous/uncertain/favorable/fated`. Pips *annotate* the word; they never stand in for it. |
| Any card in the game | `CardFace` | One face, both card kinds. Never build a second card layout — a card that needs a field the model lacks adds the field (THR-1002). |
| A card's type | `CardKeywordChip` | Glyph keyed on the live type union. |

Every glyph row carries an `aria-label` stating its reading in words ("Strong, 3 of 5") — shape is
the accessibility channel, colour is secondary (Law 11).

### Show an entity's picture (Laws 1, 3, 5, 8)

| Need | Component | Notes |
|------|-----------|-------|
| Any entity's art, anywhere | `EntityVisual` | The single resolver path. Pick `hero` (16:9 — places, scenes, banners), `portrait` (3:4 — people), or `chip` (40px — secondary entities inline). A fourth size is a design decision, not an implementation choice. |
| A ringed icon disc around an already-resolved visual | `Medallion` | Frames what `EntityVisual` resolved — never a second art path. |

Person imagery is knowledge-gated (Law 8): below `recognised` a person renders the silhouette
fallback even when art exists. Places, items, and encounters are never gated. The gate fails open
when unwired.

### Group a long list (Law 36)

Long lists are progressive, not exhaustive. Reach for `Section` + `ListRow` with counts on the group
header and detail on demand — a panel that needs its own scrollbar within the first screenful should
be collapsing groups instead. **Note** `Section` currently belongs to the unmounted detail-page
cluster (see the catalog note below); a live collapse group today composes `SectionHeading` +
`ListRow` inside a `Card`.

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
| `RevealCard` | Ceremonial reveal surface | A minor element the player just gained, with nothing to decide. Composed on Modal. Use `RevealCard.Frame` inside an existing modal. |
| `Medallion` | Circular icon frame | Ringed, clipping icon disc. sm 40 / md 64 / lg 96. Frames an already-resolved visual — never a second art path. |
| `FlavorQuote` | Inset quote well | Flavor prose above mechanical text. Renders nothing when empty. |
| `Tooltip` | Hover information | Progressive disclosure Tier 1. Smart-positioned, viewport-aware, supports nested hover. |
| `Dropdown` | Menu picker | Portal-based, escape/outside-click to close. Compound: Dropdown.Item. |
| `ListRow` | Interactive list item | Any selectable row. Compound: Title, Subtitle, Leading. |
| `ProgressBar` | Horizontal progress | Any 0-1 progress display. |
| `StepDots` | Step indicator | Multi-step flows (encounters, wizards). |
| `EntityCard` | Structured entity display | Sidebar entity details with flexible block sections. |
| `EntityLink` | A named entity inside a sentence | Prose that names an agent, faction or artifact and should click through to it. Renders plain text when the surface passes no `onOpenEntity`, so a caller that forgets the handler loses the click and never the name. |
| `HeldByLine` | A place's allegiance | The one row that says who holds a town — a Realm, a guild with a hall there, or nobody. Use it wherever a place is described; never hand-roll a "controlled by" line, or the sheet and the map's border will drift apart. |
| `DomainCard` | Reach tier card | Domain/reach display with art. |
| `RarityBorderBox` | Rarity accent wrapper | Wrap anything that should show rarity visually. |
| `RarityBadge` | Rarity tier label | Inline tag showing rarity. |
| `SphereIcon` | Sphere symbol | Any sphere reference. SVG primary, PNG fallback. |
| `RivalIcon` | Rival affinity circles | Overlapping colored circles for rival sphere display. |
| `SectionHeading` | Section label | Heading with optional count and ornamental rules. |
| `AnimateMount` | Mount/unmount animation | Wrap anything that appears/disappears with animation. |
| `GameErrorBoundary` | Error fallback | Wrap any subtree that might crash. |
| `EntityVisual` | Entity art at three sizes | **The one art path** (Law 3). `hero` 16:9 places/scenes · `portrait` 3:4 people · `chip` 40px inline. Never resolve entity art any other way; missing art falls back to an authored glyph on an id-hashed gradient, which is a designed state, not a hole (Law 4). |
| `OddsPips` / `CostPips` | Magnitude glyph row | The only sanctioned magnitude glyph language (Law 15). `OddsPips` = effect on the odds; `CostPips` = price, which wears a framed badge so the two never read alike (Law 10). They annotate words, never replace them. |
| `DeltaCluster` | Realised state change | THR-1082 — how much a state actually moved, on an aftermath consequence chip. Triangles in the encounter hand's own family; a gold `◆` when a way opens rather than a quantity moving. Never `OddsPips`: that row means *effect on the odds* everywhere, and one glyph row in two jobs is the THR-972 §5 confusion (Law 10). |
| `CardFace` | Every card face (nudge hand, action drawer) | Extracted from the nudge card, not invented (Laws 26/27). Pips mean *effect on the odds* — a cast reads its forecast as a word instead (Law 10). |
| `CardKeywordChip` | Nudge card type glyph | Keyed on the live card-type union — a new type without an icon is a **build failure**, not a blank chip (Law 9). |
| `ProgressBand` | Banded progress readout | Progress shown as a named band rather than a bar. Use when the reading is a tier ("cooling", "taut"), not a fraction; `ProgressBar` when it genuinely is 0–1. |
| `Divider` | Rule between content groups | Plain separator. Reach for this before inventing a bordered wrapper. |
| `ActivityIcon` | What an agent is doing | Fixed glyph vocabulary (`boot`, `swords`, `coin`, `hammer`, `bandage`, `hourglass`). One vocabulary per element class (Law 9) — do not add ad-hoc activity emoji beside it. |
| `Section` | Detail-page section renderer | Dispatches on `SectionKind` (`prose`, `chips`, `event-card`, `panel`, `portrait`). Part of the detail-page cluster — see the note below. |
| `DetailBreadcrumb` | Depth orientation trail | Law 24: any surface deeper than two levels shows where you are. Collapses to an ellipsis past `DETAIL_BREADCRUMB_COLLAPSE_AT`. Detail-page cluster. |
| `HoverCard` | The glance before the card | Law 20 Tier 1½ (THR-1490): header + first section, anchored beside an `EntityLink` after a dwell. Never stacks on a modal; never interactive. |
| `DetailModal` | Stacked detail-page overlay | Renders the `DetailModalStackContext` stack; draws nothing while empty. Detail-page cluster. |

> **The detail-page cluster is mounted (THR-1490, resolving THR-966 as *mount*).**
> `Section`, `DetailBreadcrumb` and `DetailModal` are live in `GameView`, and `HoverCard`
> joins them. THR-966 held the mount-versus-prune decision from 2026-08-02 and is closed by
> the mount commit. **Build on them through `useRefRouter` and nothing else** — the router
> is the only thing that may push onto `DetailModalStackContext`, which is what keeps "every
> link routes by kind" (Law 21) a property of the system rather than of each caller.

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
| Modal layer | Centered overlay | max-width varies, max-height ≤85vh (Law 33 cap; the shared `Modal` ships 75vh) | `Modal` and custom modals |
| Toast/alert layer | Top center | Auto-width | `AlertBar` / `EventPopup` |

See `Docs/design-system/layout-zones.md` for the full zone architecture with z-index stacking and insertion points.
