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
does this open". `open(ref, 'card')` (the default) opens the subject in the **Inspector** at
the row's `opensAt` size; `open(ref, 'sheet')` opens it wide (a live encounter plays on the
Stage; a content kind opens its Codex entry); `EntityLink` hovers into a `HoverCard` after a
dwell without the caller doing anything.

The Inspector (`inspector/InspectorHost.tsx` + `InspectorPage`) is the one detail surface
(THR-1876). The per-kind sheets it replaced — `AgentProfileModal` and its tabs,
`LocationProfileModal`, `FactionSheet`, `ArmySheet`, `ArtifactSheet`,
`AttachmentDetailView`, `AscendantSheet` — the detail column (`ThreadDetailView`,
`HexDetailView`), the hex-zoom and location views, the `DetailModal` stack and the
`ActionDrawer` were deleted in THR-1912. A subject's page is a row in the page-layout table
(`DETAIL_PAGE_REGISTRY`), never a new panel. `IdentityChip` (inline reference) is not a
detail surface and is unaffected.

`AgentDetailPanel` and `NpcDetailView` were deleted in THR-1492 — they had no production
mount, and a doc row for a component nothing renders reads as an instruction to use it.

### Show a list of things

| Need | Component | Notes |
|------|-----------|-------|
| Interactive row with title/subtitle/accent | `ListRow` (shared primitive) | Compound: Title, Subtitle, Leading. Use for any selectable list. |
| Narrative threads grouped by category | `ThreadsPanel` | Left sidebar or modal. Groups by agent/location/faction/army/artifact. |
| Agents in player's retinue | `RetinuePanel` | Left sidebar. Grouped by tier. |
| Active encounters/events log | `EncounterLog` / `EventLog` | Right panel section. Scrollable history. |
| Recent agent actions | `RecentActivityLog` | Embedded in the agent sheet. |
| Agent attachments | `AttachmentRow` | Row is a list item; a click opens the attachment's content card in the Inspector. |

### Show a card or panel

| Need | Component | Notes |
|------|-----------|-------|
| A small pill that names a thing, says how it is, counts what is waiting, or tags what kind it is | `Chip` (shared primitive) | THR-1885. One component, four roles: `identity` (image + name + router link, Law 21; a dead ref reads as text), `state` (the word always, optional icon and a `DeltaCluster` / `OddsPips` magnitude, tints neutral · positive · negative · sphere), `count` (a whole number; zero renders nothing; opening never clears it, Law 40; `form="badge"` on an `IconButton`, `form="inline"` after a tab's word), `keyword` (the vocabulary word, optional `pressed`/`onToggle`). **Name clash:** in the ubiquitous language "chip" alone means a **Consequence Chip** — that is `Chip role="state"` with a kind tag, not a different component. Never write a local pill. |
| A row of tabs, or a row of one-at-a-time toggles (the lens bar) | `Tabs` (shared primitive) | THR-1885. `kind="tabs"` is WAI-ARIA tabs (arrows and Home/End move focus and selection; `Tabs.Panel` children); `kind="toggle"` is a toolbar of pressed buttons, `allowNone` lets the pressed one turn off. One look for both: sentence-case label, 2 px underline in `--text-primary` when on, **never gold**. `count` draws an inline count chip; `keyCap` draws the owner's hotkey. |
| A one-line explanation under a panel that shows until the player first uses the word (hover its tooltip, press inside, or "got it") | `FirstUseCaption` + `FirstUseCaptionZone` (shared primitive) | THR-1986. Captions live in `src/data/first-use-captions.ts`, one per surface (Law 58); at most `FIRST_USE_CAPTIONS_MAX_VISIBLE` (2) show, the rest queue in table order; dismissal is remembered (Law 51). `floating` for a top-bar item whose row has no room. Never a tutorial overlay or a modal. Debug: `__DEBUG.getFirstUseCaptions()`. |
| An icon | `Icon` (shared primitive) | THR-1885. `name` is an `IconName` from `src/data/icons/iconRegistry.ts`, drawn through the one resolver `iconShape.ts` (Law 3); sizes `floor` / `chip` / `list` / `alone`; fills `currentColor`. Pass `decorative` when a word sits beside it, `label` when it carries meaning alone — an unlabelled meaning-bearing icon does not compile. `tooltipId` adds the first-contact tooltip (Law 12). Never draw an emoji or a symbol glyph as an icon. |
| A bounded surface — a rail, a popover, a legend, an inset inside a panel | `Panel` (shared primitive) | THR-1884. `level` says what it **is**: `page` (a dialog, the Stage, the Inspector in Full) ⊃ `panel` (rails, cards, popovers) ⊃ `inset` (rows inside a panel). `floating` adds the level's shadow; `material="glass"` for small panels over the map. Radius and shadow come from the level tokens — never write a shell by hand. |
| A bounded surface with a title row (header/body/footer) | `Card` (shared primitive) | **The titled panel** (THR-1884): `Panel level="panel"` plus Card.Header, Card.Body, Card.Footer. Variants: surface, raised (floating), glass. **A bounded surface is a `Panel`; a bounded surface with a title row is a `Card`; a playing card is `CardFace`** — "card" means the god's cards everywhere else in this game. |
| Domain reach tier display | `DomainCard` | Shows reach art thumbnail + tier prose. |
| A mortal's standing in one reach, as a compact readout ("STONE · Skilled ●●●○○") | `ReachStanding` (shared primitive) | THR-1724. The sheet's name · rank word · magnitude dots; `layout="stacked"` inside `DomainCard`, `layout="inline"` in the encounter title row. Not for odds (use pips) or progress (use `StepDots` directly). |
| Rarity-accented wrapper | `RarityBorderBox` | Left-border accent by rarity tier. Wraps any content — use around a sheet or ListRow for rarity emphasis. |

### Show a modal or overlay

| Need | Component | Notes |
|------|-----------|-------|
| Generic dialog (confirm, settings, detail) | `Modal` (shared primitive) | Compound: Modal.Header, Modal.Body, Modal.Footer. Built on `Overlay` + a floating `page` `Panel` (THR-1884). Pass a size tier — `size="s|m|l|xl"` (THR-1820, `tokens.md` § Dialog sizes), never a free `maxWidth`; max-height `var(--modal-max-h)` = 85vh (Law 33). Escape closes it when it is the topmost surface. Optional `context` (`story` · `elder` · `gain`) picks the dialogue palette — a *moment* passes one, a reference surface passes none (THR-1586, `tokens.md` § Dialogue contexts). |
| Anything full-screen or over the map that is not a sized dialog — a ceremony, the Stage, a click-catcher | `Overlay` (shared primitive) | THR-1884. The one backdrop, z-band and Escape implementation: `band` by name (`zBands.ts`, Law 35), `backdrop` dim / heavy / void / none, `label` names it to screen readers and to `__DEBUG.getEscapeLayers()`. A homed surface spreads `surfaceHomeProps(kind)` (the ceremony home: Meet the First, the Threading Rite, the cycle harvest). Never hand-build `fixed inset-0` or hang a `document` Escape listener — the ratchet counts both. |
| A mortal's moment at a place — a story beat (S2), the encounter (THR-1895), a journey, undertaking, premonition or emergence moment (THR-1897) | `Stage` (`src/components/Game/stage/Stage.tsx`) | THR-1892. The panel over the dimmed map with the place lit in a window at the right. `left` / `right` slots in the full layout, `right` alone in compact (`StageVM.layout`, from `stageView.ts`); a moment renders into the slots and never positions itself. Mounted only by `StageHost`, for the kinds in `STAGE_FRAME_KINDS`. Geometry is tokens only (`STAGE_PANEL_WIDTH`). The map side is `GameMap` (`useStageCamera`); the Stage holds no map handle. Sample at `?view=styleguide` → *Stage frame*. |
| The face of the mortal a Stage moment is about | `StageSubjectPortrait` (`src/components/Game/stage/StageSubjectPortrait.tsx`) | THR-2100. Draws `StageVM.subjectVisual` — resolved once in `buildStageView` with the knowledge gate — at `--stage-subject-portrait-w`, 3:4, and opens the mortal's page through the Stage's router. Never pass it a graph and never draw a second face of the same mortal on the panel (the encounter's header chip stands down). A Stage label's shape is `StageLabelIcon`, read from `STAGE_LABEL_ICONS` (`stage-content.ts`), never a literal. Sample at `?view=styleguide` → *Stage frame*. |
| Encounter dialogue with branching | `MeetingEncounterModal` | Auto-triggered on encounter. Full encounter UI. |
| Journey flavor text | `JourneyVignetteModal` | Full-screen during movement. |
| Obscured challenge preview | `EncounterVeil` | Unknown opponent. |
| Premonition/divine revelation | `PremonitionModal` | Consequence preview with sphere tinting. |

| A subject beside its record (an index and its reader, identity and facts) at L / XL | `SheetColumns` (THR-1820) | Two columns when the container provides `'two'` (`Modal` at L / XL); stacks otherwise. Takes the place of `Modal.Body`. Each column scrolls only at the panel's cap (Law 57). |

**Rule:** For new modal features, use `Modal` (shared) and compose content inside it. For a surface that is not a sized dialog, use `Overlay`; something that is not an Overlay but must answer Escape (a tooltip, a menu, a map mode) registers through `useEscapeLayer` with a named band. Only create a custom modal component if the interaction pattern is fundamentally different from standard dialog behavior.

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
| A tie between two parties, drawn (face, bond mark, face, sentence) | `BondStrip` | THR-2097 rule R4. Only while the engine holds the tie. Faces come resolved from the VM (`ascendantPortraitSrc`, `resolveEntityVisual`) — never a second art path. |

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
| A hex's contents | The land page in the Inspector | A click on open land opens it (THR-1876 § D10); its *In this land* index lists people, holder and sites. |

### Provide player controls

| Need | Component | Notes |
|------|-----------|-------|
| Acting on a subject | The Inspector page's Act row | The cards that can touch the open subject, context-filtered; a press casts (THR-1876 § D9). |
| The god's hand | The god rail's hand (`frame/GodRail.tsx`) | Every revealed card at its par price (THR-1875). |
| Simulation play/pause/speed | `SimulationControls` | Top bar. |
| Mandate tracking | `MandateTracker` → `MandateDetail` | Top bar indicator, detail on click. |
| Essence/mana resource | `EssencePanel` | Top/side bar. |

---

## Shared Primitives Catalog

These live in `src/components/shared/` and are the building blocks. **Always check here before creating something new.**

| Primitive | Purpose | When to use |
|-----------|---------|-------------|
| `Button` | Themable action button | Any clickable action. 4 variants: primary, secondary, ghost, danger. 3 sizes. |
| `IconButton` | Icon-only compact button | Toolbar actions, close buttons, toggle controls. Has badge slot. A numeric `badge` (with `badgeOf`) renders the count chip's badge form (THR-1885). |
| `Card` | Content wrapper | Any bounded content area. Use Header/Body/Footer compounds. |
| `Modal` | Dialog overlay | Any centered overlay dialog. Escape to close, backdrop click. |
| `RevealCard` | Ceremonial reveal surface | A minor element the player just gained, with nothing to decide. Composed on Modal. Use `RevealCard.Frame` inside an existing modal. |
| `Medallion` | Circular icon frame | Ringed, clipping icon disc. sm 40 / md 64 / lg 96. Frames an already-resolved visual — never a second art path. |
| `BondStrip` | A drawn tie | Two `Medallion` faces and the `bond` icon over a sentence (THR-2097, rule R4). Drawn only for a tie the engine holds. |
| `QuietSlot` | Quiet empty state | One quiet line in a dashed `--border-subtle` frame (THR-2097, rule R8). Replaces a heading over nothing; no gold. |
| `Modal.Header` `icon` | A dialog heading that names a game idea | The heading's carved shape (THR-2101, rule R2), read from `DIALOG_HEADING_ICONS` (`view-content.ts`), never a literal. `chip` size, decorative, in the title's colour. `null` = no idea yet: draw nothing (THR-2104 picks). Reference surfaces such as settings draw it on the title only (Law 30). |
| `FlavorQuote` | Inset quote well | Flavor prose above mechanical text. Renders nothing when empty. |
| `Tooltip` | Hover information | Progressive disclosure Tier 1. Smart-positioned, viewport-aware, supports nested hover. |
| `Dropdown` | Menu picker | Portal-based, escape/outside-click to close. Compound: Dropdown.Item. |
| `ListRow` | Interactive list item | Any selectable row. Compound: Title, Subtitle, Leading. |
| `ProgressBar` | Horizontal progress | Any 0-1 progress display. |
| `StepDots` | Step indicator | Multi-step flows (encounters, wizards). |
| `EntityLink` | A named entity inside a sentence | Prose that names an agent, faction or artifact and should click through to it. Renders plain text when the surface passes no `onOpenEntity`, so a caller that forgets the handler loses the click and never the name. |
| `HeldByLine` | A place's allegiance | The one row that says who holds a town — a Realm, a guild with a hall there, or nobody. Use it wherever a place is described; never hand-roll a "controlled by" line, or the sheet and the map's border will drift apart. |
| `DomainCard` | Reach tier card | Domain/reach display with art. |
| `ReachStanding` | Reach readout | Reach name · rank word · five magnitude dots (THR-1724). |
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
| `CardFace` | Every card face (nudge hand, the god rail's hand) | Extracted from the nudge card, not invented (Laws 26/27). Pips mean *effect on the odds* — a cast reads its forecast as a word instead (Law 10). |
| `CardKeywordChip` | Nudge card type glyph | Keyed on the live card-type union — a new type without an icon is a **build failure**, not a blank chip (Law 9). |
| `ProgressBand` | Banded progress readout | Progress shown as a named band rather than a bar. Use when the reading is a tier ("cooling", "taut"), not a fraction; `ProgressBar` when it genuinely is 0–1. |
| `Divider` | Rule between content groups | Plain separator. Reach for this before inventing a bordered wrapper. |
| `ActivityIcon` | What an agent is doing | Fixed glyph vocabulary (`boot`, `swords`, `coin`, `hammer`, `bandage`, `hourglass`). One vocabulary per element class (Law 9) — do not add ad-hoc activity emoji beside it. |
| `Section` | Detail-page section renderer | Dispatches on `SectionKind` (`prose`, `chips`, `event-card`, `panel`, `portrait`, `triggers`, `links`, `cards`). Part of the detail-page cluster — see the note below. THR-1876: `links` is the shape for named world things (identity chip + one fact — what Connections and *In this land* render through; `LinkRows` is exported for them); `cards` is the shape for small tiles (conditions, works, powers); a `panel` row may carry a `ref` (its value becomes an identity chip), a `tooltipId`, and a `meter` (a bar beside the word, only where a retiring surface draws that bar today); `prose` splits paragraphs on a blank line. |
| `InspectorPage` | One subject's page at one Inspector size (THR-1876) | `src/components/Game/inspector/InspectorPage.tsx` renders a `SubjectPageVM` (`useView('subjectPage', …)`) at `docked`, `wide` or `full`: header, Act row, the registry's sections filtered by size into tabs, "More when widened", Connections last. Never hand-build a page body — add a registry row. See every kind at `?view=inspector-lab`. |
| `HoverCard` | The glance before the page | Law 20 Tier 1½ (THR-1490): header + first section, anchored beside an `EntityLink` after a dwell. Never interactive. |

> **The detail-page cluster is the Inspector (THR-1876, THR-1912).** `Section` renders every
> page's sections inside `InspectorPage`, and `HoverCard` is the glance before it. The
> `DetailModal` stack and `DetailBreadcrumb` retired with THR-1912 — the Inspector keeps its
> own trail. **Build on them through `useRefRouter` and nothing else** — the router is the
> only thing that opens a subject, which is what keeps "every link routes by kind" (Law 21) a
> property of the system rather than of each caller.

---

## Component Composition Patterns

**Entity display chain:** `InspectorPage` → `Section` stack → (contains `DomainCard`, `RarityBadge`, `SphereIcon`)

**Modal content:** `Modal` → `Modal.Header` + `Modal.Body` (your content) + `Modal.Footer` (actions)

**List patterns:** `Card` → `Card.Body` → multiple `ListRow` components

**Progressive disclosure:** `Tooltip` (Tier 1 hover) → `HoverCard` (Tier 1½ dwell) → the Inspector, docked (Tier 2 click) → wide or Full (Tier 3)

**HexMap interaction:** Click hex → the land page in the Inspector → click an entity → `useRefRouterContext()?.open(ref)`

---

## Anti-Patterns

- **Don't build a second section model** — `shared/Section` renders every detail page's sections (prose, chips, panel, portrait, event-card, triggers). `EntityCard`, the older rival model, retired in THR-1492. Use `Card` for generic content that is not a detail page.
- **Don't create a new modal component** when `Modal` (shared) with custom body content would work. Custom modals are only for fundamentally different interaction patterns (encounter branching, full-screen vignettes).
- **Don't put content directly in the hex map zone** — everything on the map goes through HexMapV2's render pipeline (Three.js). HTML overlays above the canvas use `HexTooltip`, `LocationLabelOverlay`, etc.
- **Don't nest `Card` inside `Card`** — use `SectionHeading` to divide content within a single Card instead.
- **Don't use `ProgressBar` for discrete steps** — use `StepDots` for step-based progress (encounters, multi-phase flows).

---

## Viewport Zones Quick Reference

| Zone | Position | Width | Component Owner |
|------|----------|-------|----------------|
| Top bar | Top edge | Full width | `TopBar` / `SimulationControls` |
| God rail | Left edge | `var(--rail-left-w)` | `frame/GodRail.tsx` |
| Hex map canvas | Center | Fills remaining space | `HexMapV2` (Three.js) |
| Inspector | Between the map and the Ledger rail | `var(--inspector-w)` docked, `var(--inspector-wide-w)` wide, Full over the map | `inspector/InspectorHost.tsx` |
| Ledger rail | Right edge | `var(--rail-right-w)` | `frame/LedgerRail.tsx` (`ThreadsPanel`, `ChroniclePanel`) |
| Modal layer | Centered overlay | max-width varies, max-height `var(--modal-max-h)` = 85vh (Law 33 — one rule, the shared `Modal` included) | `Modal` and custom modals |
| Toast/alert layer | Top center | Auto-width | `AlertBar` / `EventPopup` |

See `Docs/design-system/layout-zones.md` for the full zone architecture with z-index stacking and insertion points.
