> **title:** `One card, one router — every world object and content kind opens the same way — THR-1482`
> **linear_issue:** THR-1482
> **author:** `Claude Code (design session)`
> **created:** 2026-09-12
> **three_pillars:** Engine `done` · Content `done (no authored content; the registry rows and tooltip copy are the content)` · UI `done`

# One card, one router — every world object and content kind opens the same way — THR-1482

*Anything the game names can be hovered for a card and clicked for its page, from any surface, through one router, with no kind left out by construction.*

## Why this is load-bearing

Christian, attended chat 2026-09-12: *"I would also like that all content by default has a UI - a card or detail page - that can be shown easily from any UI that references it, via a link/tooltip. Again one solution for all content."*

The assessment measured what stands in the way. A complete detail-page stack exists ([THR-301](https://linear.app/threadbare/issue/THR-301) Phase E: `src/types/detailPage.ts`, `detailPageGenerator.ts`, `detailPageResolvers.ts`, fallback prose, `DetailModal`, the stack context, breadcrumbs, snapshot tests) and is imported by nothing but the style guide; its opener context documents a hook that does not exist; [THR-966](https://linear.app/threadbare/issue/THR-966) has held the mount-versus-prune decision since 2026-08-02 and `component-selection.md` warns nobody to build on the cluster until it is resolved. A second, older section model (`EntityCard`, `src/types/entityDetail.ts`) has one production consumer. Three routers open things in production and cover 5, 8 and 7 kinds respectively; none dispatches on `WorldRefKind`, the vocabulary [THR-1212](https://linear.app/threadbare/issue/THR-1212) made canonical, and `toNavigationTarget` returns `undefined` for artifact, attachment, companion and army although sheets exist for three of them. Nine world-object kinds have no page at all. The agent has six card components, two of them unmounted.

The cost is exactly the one Law 21 names: *a wrong-kind link that opens the wrong drawer is a dead link that looks live*, and the anchor catalog's `linked` / `named` split is hand-curated because nothing in the code says which kinds route. This plan is program-epic distinction 4 ([THR-1156](https://linear.app/threadbare/issue/THR-1156): rendering reads projections of canonical state, never private pipelines) applied to navigation: one router reads the registry; the registry says what each kind opens; a kind without a row is a build failure.

**Rulings this plan absorbs, stated so they are not re-derived:**

1. **THR-966 resolves as (a) mount.** The cluster is the most complete card renderer in the tree and was designed as the canonical pattern (`Docs/plans/2026-05-04-encounter-ui-canonical.md` §5). Mounting it under a router that every surface calls gives it the consumers it never had. TTS on the detail body (THR-966's own Done-when) rides slice 1.
2. **THR-1315 stands, and content routes to the codex overlay anyway.** THR-1315 removed `codex` from `WorldRefKind` because *world* references must never route to a reference page; that is still right, and `codex` does not return. What the assessment found is that the premise "no mid-game overlay exists" was false: `GameView.tsx` mounts the codex as an overlay (THR-613). So **content** references (a template, a definition) get their own reference type, `ContentRef`, whose sheet *is* that overlay. World objects never route there; content never routes to a world sheet. Invite veto: if Christian wants content to open a card only and never the codex, slice 2's sheet arm is dropped and nothing else changes.
3. **Companion stays withheld.** `openEntity` returns `undefined` for companions by ruling; the registry records `sheet: null` for the kind and the card still opens (a companion is a face with a name and a bearer; that is a card).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Detail-page cluster (`detail`: `detailPageGenerator.ts`, `detailPageResolvers.ts`; `src/types/detailPage.ts`; `shared/DetailModal.tsx`, `shared/Section.tsx`, `DetailBreadcrumb`; `contexts/DetailModalStackContext.tsx`, `DetailPageOpenerContext.tsx`; `hooks/useDetailModal.ts`; `Game/Encounter/DetailPage/openDetailPage.ts`) | 🟠 DORMANT (built, tested, unmounted — THR-966) | **activates** — mounted once in `GameView`, opened only through the router; `DetailPageKind` redrawn as a projection of `WorldRefKind` + `ContentObjectKindId` |
| `WorldRef` / `WorldRefKind` (`src/types/worldRef.ts`), adapters (`worldRefAdapters.ts`: `toNavigationTarget`, `toEntityVisualRef`), resolver (`engine/worldRefResolver.ts`) | 🟢 ACTIVE | **extends** — the router dispatches on it; `toNavigationTarget` gains the arms whose sheets exist (artifact, attachment, army); the `undefined` for companion becomes a registry `sheet: null` |
| Anchor catalog (`scripts/anchor-catalog-sources.ts`: curated `AnchorStatus` `linked` / `named` per member) | 🟢 ACTIVE | **extends** — the `linked`/`named` status is *derived* from the surface registry instead of hand-curated; the generator fails on a member whose derived status contradicts a curated note |
| `NavigationTarget` + `useNotificationNavigation` (8 arms) | 🟢 ACTIVE | **adapts** — becomes an adapter over the router; no arm removed |
| `handleThreadNodeSelect` / `setStubModalState` (`useAgentInteraction.ts`, `GameView.tsx`; 5 `ThreadCategory` kinds) | 🟢 ACTIVE | **adapts** — calls the router; the sheet openers it reaches stay where they are |
| `openEntity` in `EncounterVeil.tsx` (7 `visualKind`s) + `onSelectEntity` in `GameView` | 🟢 ACTIVE | **adapts** — calls the router with a `WorldRef`; the veil stops switching on kind |
| `EntityLink` (`shared/EntityLink.tsx`: text-only, `onOpenEntity(id)`, every caller resolves to an agent) | 🟢 ACTIVE | **extends** — gains `ref: WorldRef | ContentRef`; hover opens the card, click opens the card (or sheet with modifier); `onOpenEntity` deprecated one release |
| Tooltip resolver (Law 17, 13 prefixes) | 🟢 ACTIVE | **reuses** — stays Tier 1 of Law 20's ladder; the card is Tier 2; the sheet Tier 3 |
| Entity visual resolver (`shared/entityVisualResolver.ts`, `entity-visual-fallbacks.ts`) | 🟢 ACTIVE | **reuses** — the card header image; the deliberate `attachment` absence (THR-1120) is preserved and the card falls back to the glyph tile |
| `EntityCard` (`shared/EntityCard.tsx`, `src/types/entityDetail.ts`; one consumer: `AttachmentDetailView`) | 🟢 ACTIVE (one consumer) | **retires in slice 3** — `AttachmentDetailView` moves onto the `item` page kind; `EntityCard`, `cultureDetail.ts` (zero importers) and the two unmounted agent components (`NpcDetailView`, `AgentDetailPanel`) are deleted under the sunset rule; `component-selection.md` and the styleguide sync test updated in the same PR |
| Codex overlay (`GameView.tsx` `openCodex` / `openCodexEntry`, `Codex/codexRegistry.ts`) | 🟢 ACTIVE | **extends** — the sheet for content kinds; categories it lacks (encounter templates, companions, ambitions, omens) get a card only until a codex category is chartered (deferral filed by the slice) |
| Bespoke sheets (`AgentProfileModal`, `FactionSheet`, `LocationProfileModal`, `ArtifactSheet`, `ArmySheet`, `AttachmentDetailView`, `AscendantSheet`) | 🟢 ACTIVE | **preserve** — Tier 3; reached from the card footer CTA and directly by the router in `sheet` mode; `FactionSheet`'s local `Section` replaced by the shared one (slice 3) |
| IA manifest (`src/data/ia-manifest.ts`) | 🟢 ACTIVE | **extends** — `game.detail-card` and `game.hover-card` surfaces with their readers |
| Content-object registry (THR-1481 slice 1) | planned | **consumes** — fills the `surface` column; slice 2 is blocked by it |

## Interface impact

| Contract | Action | Detail |
|---|---|---|
| `attachment-character-sheet-display` (🟢) | preserve | `AttachmentDetailView` keeps rendering `getAgentAttachments`; only its section renderer changes (slice 3) |
| `undertakings-reach-the-player` (🟢) | preserve | the codex undertakings page is unchanged; it becomes the sheet a `ContentRef{kind:'undertaking_template'}` opens |
| `world-ref-opens-one-card` | **add** | producer: `src/data/surface-registry.ts` + `src/hooks/useRefRouter.ts`; consumers: `EntityLink`, `EncounterVeil`, `useNotificationNavigation`, `useAgentInteraction`, `HooksBlock`, `ChapterView`; 🟢 on slice 1 |
| `content-ref-opens-codex-overlay` | **add, LEAKED-with-ticket at filing** | producer: `ContentRef` + the router's content arm; reader: `openCodexEntry`; ticket: the slice-2 execution issue |
| `anchor-status-derived-from-surface-registry` | **add** | producer: `surface-registry.ts`; consumer: `anchor-catalog-sources.ts` / `generate-anchor-catalog.ts`; 🟢 on slice 2 |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/worldRef.ts` | import-free by design; parsed by the anchor generator | Adds nothing to `WorldRefKind`. `ContentRef` lives in its own module (`src/types/contentRef.ts`) so the generator's union parse is untouched. |
| `src/components/Game/GameView.tsx` | 1 importer, ~5,400 lines | One provider mount, one adapter rewrite of `onSelectEntity`; the three routers become three-line adapters. The risk is regression on the sheet openers, covered by the adapter tests below. |
| `src/types/unifiedAction.ts` | 476 | **Not touched.** Chips keep `EncounterAftermathConceptRef`; the veil adapts the ref, the type does not move. |

## Engine pillar

### Systems design

**1. The surface registry — `src/data/surface-registry.ts`.** Two total records, so a missing kind is a compile error rather than a runtime `undefined`:

```ts
export type CardKind = 'actor' | 'faction' | 'place' | 'item' | 'event' | 'group' | 'content';

export interface SurfaceRow {
  /** The detail-page kind that renders this thing's card. Never null: every kind has a card. */
  readonly card: CardKind;
  /** The Tier-3 destination, or null when the card is the deepest surface (companion, area, hex). */
  readonly sheet: NavigationTarget['kind'] | 'codex' | null;
  /** Why the sheet is null, when it is — the ruling, quotable. */
  readonly note?: string;
}

export const SURFACE_BY_WORLD_REF: Readonly<Record<WorldRefKind, SurfaceRow>> = {
  agent:       { card: 'actor',   sheet: 'agent' },
  faction:     { card: 'faction', sheet: 'faction' },
  location:    { card: 'place',   sheet: 'location' },
  sublocation: { card: 'place',   sheet: 'location' },   // the parent's sheet, as today
  area:        { card: 'place',   sheet: 'area' },       // centre hex + chronicle, as today
  hex:         { card: 'place',   sheet: 'hex' },
  artifact:    { card: 'item',    sheet: 'artifact' },   // new NavigationTarget arm; ArtifactSheet exists
  attachment:  { card: 'item',    sheet: 'attachment' }, // new arm; AttachmentDetailView exists
  companion:   { card: 'actor',   sheet: null, note: 'withheld by ruling — openEntity returned undefined on purpose' },
  army:        { card: 'group',   sheet: 'army' },       // new arm; ArmySheet exists
  encounter:   { card: 'event',   sheet: 'encounter' },
  journey:     { card: 'event',   sheet: 'journey' },
  receipt:     { card: 'event',   sheet: 'receipt' },
};

export const SURFACE_BY_CONTENT_KIND: Readonly<Record<ContentObjectKindId, SurfaceRow>> = {
  /* every row card: 'content'; sheet: 'codex' where a codex category exists, else null with a deferral note */
};
```

World-object kinds that are not `WorldRefKind`s (culture, route, network, battle, trait, standing, ambition, holding, event) are reached **through their bearer**: the registry's `worldRef: null` rows carry a `via` column naming the kind whose card shows them as a section (a Standing is a chips section on the two parties' cards; a Holding is the owned place's card; a Trait definition is a `ContentRef`). The contract test asserts every `WORLD_OBJECT_KINDS` row has either a `worldRef` or a `via`.

**2. The reference type for content — `src/types/contentRef.ts`.**

```ts
export interface ContentRef { readonly kind: ContentObjectKindId; readonly id: string; readonly name?: string; }
export type AnyRef = WorldRef | ContentRef;
export function isContentRef(ref: AnyRef): ref is ContentRef;
```

Import-free like `worldRef.ts`; `ContentObjectKindId` is re-declared as a string-literal union and pinned to the registry by test, the same trick `WORLD_REF_KINDS` uses.

**3. The router — `src/hooks/useRefRouter.ts` + `contexts/RefRouterContext.tsx`.**

```ts
export type OpenMode = 'hover' | 'card' | 'sheet';
export interface RefRouter {
  open(ref: AnyRef, mode?: OpenMode, anchorEl?: HTMLElement): void;   // default 'card'
  canOpen(ref: AnyRef, mode: OpenMode): boolean;                       // false ⇒ Law 21 fail-open: plain text
}
```

`open` resolves the row (world or content), builds the page through `generateDetailPage({ nodeId, pageKind: row.card, graph, tick, seed })` for `card` / `hover`, and for `sheet` calls the existing opener behind the `NavigationTarget` arm (or `openCodexEntry` for `'codex'`). `hover` pushes a `DetailModal` in `variant: 'hover'` (header + first section, anchored to `anchorEl`, dismissed on leave, never stacked) after `HOVER_CARD_DELAY_MS`. The three existing routers become adapters: `useNotificationNavigation` maps its `NavigationTarget` to a `WorldRef` and calls `open(ref, 'sheet')`; `handleThreadNodeSelect(id, category)` maps `ThreadCategory` → `WorldRefKind` and calls `open(ref, 'card')`; `EncounterVeil.openEntity(id, visualKind)` becomes `open(toWorldRef(kind, id))`. Each adapter carries a test that every member of its source union maps to a row (the coverage-lint shape from THR-1212).

**4. `DetailPageKind` redrawn.** `'actor' | 'item' | 'faction' | 'place' | 'event'` gains `'group'` (army, company, network: members, commander, stance) and `'content'` (a template: name, kind word, description/flavour prose, effective tags as chips, "where it appears" chips resolved from the query index once THR-1481 slice 3 lands). `DETAIL_PAGE_REGISTRY` gains the two schemas; `detailPageResolvers.ts` gains `GROUP_RESOLVERS` and `CONTENT_RESOLVERS`. The `unknownStub` stays the terminal fallback.

### Graph nodes / edges

None. The router reads nodes; it never writes.

### Tick phases

None. Pure UI; the generator runs on open, not per tick. The stack context already pauses beat indicators and ducks ambient audio while open (`DETAIL_*` constants).

### Resolution logic

`open(ref)`: registry row → page kind → `generateDetailPage` → push. Unknown id → the generator's `unknownStub` (existing). Unknown kind cannot occur: both records are total.

### PRNG callouts

None new. `generateDetailPage` takes the session seed for its fallback prose pools (existing, deterministic per node).

## Content pillar

No authored *game* content changes. The content this plan carries is registry rows, tooltip copy and fallback prose; each template subsection below says what it owes.

### Encounter templates

N/A — no encounter template is added or edited. Chips keep their `EncounterAftermathConceptRef` shape; the veil adapts the ref, the templates do not move.

### Prose tables

- **Fallback prose** for the two new page kinds (`group`, `content`) in `src/data/detail-page-fallback-templates.ts`, in game register (Law 42), resolved through `enrichProse()` like the existing pools.
- **Tooltip copy:** `ui.card`, `ui.sheet` for the card footer ("open her sheet ↗") and the hover affordance; ≤200 characters, Law 18 validation applies.

### Attachment content

N/A — no attachment template is added or edited. The `item` card renders existing catalog entries; `AttachmentDetailView` migrates its renderer in slice 3 without touching its data.

### Data tables

- **Registry rows** for every `WorldRefKind` and `ContentObjectKindId` in `src/data/surface-registry.ts`, with the three `sheet: null` rulings quoted in `note`.
- **`via` column** on the `worldRef: null` rows of `src/data/world-objects.ts`.
- **IA manifest rows** `game.detail-card`, `game.hover-card` in `src/data/ia-manifest.ts`.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces) at 1920×1080 — the card and hover card are DOM; the hex map is not touched.*

### Player-facing display

- **The card (Tier 2, Laws 1, 3, 4, 8, 20, 21, 23, 24, 26, 27, 28, 33, 35, 50):** `DetailModal` mounted in `GameView` inside `DetailModalStackProvider`, at the z-band the layout table assigns modals; header image through `resolveEntityVisual` (person imagery knowledge-gated, Law 8); breadcrumb past two levels (Law 24); Escape closes the top (Law 23); focus moves in and returns (Law 50); footer CTA "open its sheet ↗" only when the row has a sheet (Law 25: a control that does nothing does not render).
- **The hover card (Tier 1½):** `EntityLink` hover after `HOVER_CARD_DELAY_MS` shows header + first section, anchored, one at a time, never stacked, dismissed on leave or Escape. Tooltips (Law 17) stay for *concept* words; the hover card is for *things*. `EntityLink` decides which by ref type: a `tooltipId` alone → tooltip; a `WorldRef`/`ContentRef` → hover card.
- **Every link routes by kind (Law 21)**, and `canOpen` is what "where a page exists" means now: a kind with a row always has a card, so the fail-open plain-text branch fires only for an unresolvable id, never for a kind.
- **The sheets are unchanged** except `FactionSheet`'s local `Section` → shared (slice 3) and `AttachmentDetailView` onto the `item` page kind (slice 3).
- **Content cards** (slice 2): a template opened from a chip, a codex cross-link, or a batch-report link renders name, kind word, prose, tag chips (THR-1481's `tag.*` tooltips), and "open in codex ↗" when a category exists.

### Event notifications

None new. Notification click-through keeps its behaviour (sheet mode) through the adapter.

### Debug inspection (DebugPanel)

- `window.__DEBUG.openRef(ref, mode)` — drives the router headlessly for verification; returns the resolved row and the page kind rendered.
- `window.__DEBUG.getSurfaceRegistry()` — both records, for the four-part browser-verify evidence's state assertion.
- Trace `ui.ref_opened` (below) visible in the trace viewer.

### Visual presence (HexMapV2)

N/A — no map layer changes; hex clicks keep opening `HexDetailView`, which now also calls the router for the entities it lists.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `src/data/surface-registry.ts` | — (data) | router | — | — | `__DEBUG.getSurfaceRegistry` |
| `src/types/contentRef.ts` | — | `EntityLink`, veil chips | — | — | — |
| `src/hooks/useRefRouter.ts` + `RefRouterContext` | — (UI) | `DetailModal`, sheets, codex overlay | `DetailModalStackContext` (existing) | `ui.ref_opened`, `ui.ref_unroutable` | `__DEBUG.openRef` |
| `DetailModal` mount in `GameView` | — | `DetailModal`, `DetailBreadcrumb`, `Section`, `ProseTtsButton` | stack context | — | IA manifest `game.detail-card` |
| adapters (`useNotificationNavigation`, `useAgentInteraction`, `EncounterVeil`) | — | unchanged callers | — | `ui.ref_opened` (via router) | adapter coverage tests |
| `scripts/anchor-catalog-sources.ts` (derived status) | — (build) | authoring catalog | — | — | `generate-anchor-catalog:check` |

**Harness wiring — each a Done-when of the slice that makes it true:**

| Hook | What changes | Why it binds |
|---|---|---|
| Anchor catalog (`anchor-catalog-sources.ts`, `generate-anchor-catalog.ts`) | `AnchorStatus` `linked`/`named` derived from `SURFACE_BY_WORLD_REF` (a row with any card is `linked`); a curated `named` that the registry says is `linked` fails the generator by name; the "Surface" column renders the registry's sheet | The catalog is what authors read; a hand-kept routing claim is the drift this plan removes |
| Encounter pipeline `agents/systems-prompt.md` + `package-prompt.md` | "Every anchor kind is clickable; the chip's referent must be a `WorldRef` or `ContentRef`, never free text" — replaces the `linked` vs `named` guidance | Authors stop folding chips because a kind "has no route" |
| `Docs/design-system/laws.md` § VI | Law 21 amended: *"…and the link routes by kind **through the one router**; a kind without a surface-registry row is a build failure"* — a joint amendment; the plan states it and invites veto | Laws bind every UI Done-when by default |
| `Docs/design-system/component-selection.md` + `primitives.md` | The dead-cluster warning replaced by the router entry; stale `AgentDetailPanel` / `NpcDetailView` rows deleted; `EntityCard` row retired (slice 3); the "Show entity details" table becomes *one row*: "any world object or content → `useRefRouter().open(ref)`" | Law 29: the styleguide and the docs are the living contract |
| Styleguide (`?view=styleguide`) | Card, hover card and a router demo with sample refs of every kind; `styleguideSync.test.ts` extended to `src/components/Game/` sheet components so an unmounted component fails the test rather than surviving as a stale doc row | The assessment found two unmounted components the sync test could not see |
| IA manifest (`src/data/ia-manifest.ts`) | `game.detail-card`, `game.hover-card` with readers; `interface-audit` sees them | The manifest is the commitment document of what the player should see |
| World-objects canon + registry (`Docs/canon/world-objects.md` § Reading it from the game, `world-objects.ts`) | "Chips" paragraph rewritten: every kind routes; `worldRef: null` rows carry `via` | The canon page is Step 0 for chip anchors |
| Content-objects registry (THR-1481) | `surface` column filled by slice 2 | One registry, one column, contract-tested |
| Interface map (`scripts/interface-contracts.ts`) | the three `add` rows above | LEAKED-without-ticket fails the build |
| THR-966 | Closed by slice 1 with the mount commit; `ProseTtsButton` rendered on the card body | The sanctioned decision point is honoured, not bypassed |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `HOVER_CARD_DELAY_MS` | 350 | Hover dwell before the hover card opens (below it, only the tooltip) |
| `HOVER_CARD_MAX_SECTIONS` | 1 | Sections shown in hover variant beyond the header |
| `HOVER_CARD_W` | 420 | Hover card width, px |
| `MAX_DETAIL_STACK_DEPTH` (existing) | 4 | Stack depth before breadcrumb collapse |
| `DETAIL_DEFAULT_W` / `_H`, `DETAIL_PLACE_*`, `DETAIL_EVENT_*` (existing) | as shipped | Card sizes per page kind; `group` reuses default, `content` reuses default |
| `DETAIL_GROUP_W` / `_H` | 720 / 620 | Named even though equal to default, so a later change is a number |

## Tracing

```ts
// ui.ref_opened — emitted by the router on every open
interface UiRefOpenedTrace {
  type: 'ui.ref_opened';
  refKind: WorldRefKind | ContentObjectKindId;
  refId: string;
  mode: 'hover' | 'card' | 'sheet';
  cardKind: CardKind;
  viaAdapter?: 'notification' | 'thread' | 'veil' | 'entity-link' | 'debug';
  stackDepth: number;
}

// ui.ref_unroutable — the id did not resolve (kind always does); the surface fell open to plain text
interface UiRefUnroutableTrace {
  type: 'ui.ref_unroutable';
  refKind: WorldRefKind | ContentObjectKindId;
  refId: string;
  reason: 'unknown_id' | 'sheet_null';
}
```

Registered under a `ui` category at the four registration sites.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Id resolves to no node / no catalog entry | `unknownStub` page (existing), `ui.ref_unroutable{unknown_id}`; the link renders as plain styled text (Law 21 fail-open) |
| Row has `sheet: null` and a caller asks for `sheet` | opens the card instead, traces `sheet_null`; never a no-op click (Law 25) |
| `generateDetailPage` throws on a malformed node | caught at the router; stub page; trace; the app never unmounts |
| Hover card requested while a stacked card is open | ignored (hover never stacks on a modal) |
| Codex overlay unavailable (lazy chunk failed) | content card only; the CTA hides (Law 25) |
| A `ThreadCategory` / `visualKind` / `NavigationTarget` member with no mapping | impossible at runtime — the adapter coverage tests fail the build on an unmapped member |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (rows, tooltip copy, fallback prose; no authored game content, rationale stated)
- [x] UI pillar present
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise contradicted. The three-tier ladder (tooltip → card → sheet) is Law 20 as written; this plan makes Tier 2 exist for every kind.
- [x] No Vision edit required. Law 21 amendment is a UI-law amendment, stated above, joint decision.

## Rulebook impact

- [x] No rule of play changes.
- [x] No `Docs/canon/rulebook.md` update is owed; the Law 21 amendment lives in `Docs/design-system/laws.md`, which is a UI law, not a rule of play.

> Brainstorm companion: `Docs/plans/2026-09-12-thr-1482-one-card-one-router-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | hover delay, widths, section count named; existing detail constants reused |
| 2. Inspectability | PASS | two traces, `__DEBUG.openRef`, `getSurfaceRegistry`, IA manifest rows |
| 3. Determinism | PASS | no PRNG; page generation deterministic per node and seed |
| 4. Fail-soft | PASS | table above; adapters total by test; stub page terminal |
| 5. Narrative over mechanical perfection | PASS | fallback prose in game register; person imagery knowledge-gated |
| 6. Additive over destructive | PASS with note | sheets, routers and openers preserved as adapters; deletions are confined to slice 3 and are the two unmounted components, `EntityCard` after its one consumer migrates, and `cultureDetail.ts` (zero importers) — all under the sunset rule |
| 7. Performance budget | PASS | one generator call per open; hover gated by dwell; no per-tick work |

## Kill criteria

How we know this plan was wrong, and what happens then:

- **The mount breaks the viewport contract.** If mounting the stack in `GameView` breaks the 1920×1080 contract (Law 33) or the modal z-band table in a way the Playwright evidence cannot clear, slice 1 stops and THR-966 is revisited as prune, with the evidence attached.
- **The vocabularies are not total.** If an adapter coverage test cannot be made total (a `ThreadCategory` or `visualKind` member with no `WorldRefKind`), the fix belongs in THR-1212's coverage lint, not in this router; slice 1 pauses until that member has a kind.
- **The codex-sheet arm is vetoed.** Slice 2 sets every content row's `sheet` to `null`; nothing else changes and nothing is deleted.

## Done when

- [ ] `DetailModal` mounted in `GameView`; THR-966 closed citing the mount commit; `ProseTtsButton` on the card body
- [ ] `SURFACE_BY_WORLD_REF` and `SURFACE_BY_CONTENT_KIND` total by type and pinned by `surfaceRegistry.test.ts`; every `WORLD_OBJECT_KINDS` row has `worldRef` or `via`
- [ ] the three adapters route through `useRefRouter`; coverage tests fail on an unmapped `ThreadCategory` / `visualKind` / `NavigationTarget` member (falsified both ways)
- [ ] `toNavigationTarget` returns an arm for artifact, attachment, army; companion returns the card
- [ ] `EntityLink` opens a hover card on dwell and a card on click for every `WorldRefKind`; Playwright evidence at 1920×1080 for one kind per card kind (actor, faction, place, item, event, group, content) with the four-part evidence (Laws 1, 3, 4, 8, 13/14, 17, 20, 21, 23, 24, 25, 33, 35, 37, 50)
- [ ] anchor catalog regenerates with `linked` derived; `generate-anchor-catalog:check` green; zero curated `named` rows survive for kinds with a card
- [ ] IA manifest rows; styleguide entries; `styleguideSync.test.ts` extended to `src/components/Game/` sheets
- [ ] slice 3: `NpcDetailView`, `AgentDetailPanel`, `EntityCard`, `cultureDetail.ts` deleted; `FactionSheet` on shared `Section`; `AttachmentDetailView` on the `item` page kind; `component-selection.md` and `primitives.md` updated
- [ ] `npm test`, `npm run check:typecheck` (ratchet unchanged), `npx vite build`; `Fixes THR-<slice>` per slice

## Coordination block

**Suggested model:** opus — router refactor across `GameView` and three hooks; UI-law conformance judgment.

**Parallel-safe with:** THR-1481 slices 1–5 for slice 1 (disjoint files). Slice 2 is **blocked by THR-1481 slice 1** (needs `ContentObjectKindId` and the registry's `surface` column).

**Mutex with:** anything editing `src/components/Game/GameView.tsx`'s modal region, `src/components/Game/EncounterVeil.tsx`'s `openEntity`, `src/hooks/useNotificationNavigation.ts`, `src/components/shared/EntityLink.tsx`, or `scripts/anchor-catalog-sources.ts` while a slice is In Dev.

**Slices (each filed as a child execution ticket with its own coordination block):**

1. **Router + registry + mount + world-ref cards** — `surface-registry.ts`, `useRefRouter`, `RefRouterContext`, `DetailModal` mount, `group` page kind, the three adapters + coverage tests, `toNavigationTarget` arms, `EntityLink ref`, hover variant, IA manifest, styleguide, laws § VI amendment, THR-966 closed, TTS button. 
2. **Content cards + codex sheet + derived anchor status** — `contentRef.ts`, `content` page kind + resolvers + fallback prose, `SURFACE_BY_CONTENT_KIND`, codex-overlay sheet arm, anchor-catalog derivation, systems/package prompt edits, deferral for codex categories that do not exist. Blocked by 1 and THR-1481 slice 1.
3. **Sunset** — delete `NpcDetailView`, `AgentDetailPanel`, `EntityCard` (after `AttachmentDetailView` migrates), `cultureDetail.ts`; `FactionSheet` onto shared `Section`; docs + sync test. Blocked by 1.

**Files to touch:** (union across slices)
- Create: `src/data/surface-registry.ts`, `src/types/contentRef.ts`, `src/hooks/useRefRouter.ts`, `src/contexts/RefRouterContext.tsx`, tests beside each
- Edit: `src/components/Game/GameView.tsx` (mount + adapter), `src/components/Game/EncounterVeil.tsx`, `src/components/Game/HexDetailView.tsx` (its entity list calls the router), `src/components/Game/Encounter/DetailPage/openDetailPage.ts` (absorbed into the router or deleted), `src/components/Game/hooks/useNotificationNavigation.ts`, `src/components/Game/hooks/useAgentInteraction.ts`, `src/components/shared/EntityLink.tsx`, `src/components/shared/DetailModal.tsx` (hover variant), `src/types/detailPage.ts`, `src/data/detailPageTemplates.ts`, `src/engine/detailPageGenerator.ts`, `src/engine/detailPageResolvers.ts`, `src/data/detail-page-fallback-templates.ts`, `src/types/worldRefAdapters.ts`, `src/types/notification.ts` (three arms), `src/contexts/DetailPageOpenerContext.tsx` (real opener), `src/data/ia-manifest.ts`, `src/components/StyleGuide/StyleGuide.tsx`, `src/components/StyleGuide/__tests__/styleguideSync.test.ts`, `src/debug-bridge.ts` + `.d.ts`, `scripts/anchor-catalog-sources.ts`, `scripts/generate-anchor-catalog.ts`, `scripts/interface-contracts.ts`, `Docs/design-system/laws.md`, `Docs/design-system/component-selection.md`, `Docs/design-system/primitives.md`, `Docs/canon/world-objects.md`, `src/data/world-objects.ts` (`via`), `.claude/skills/encounter-pipeline/agents/systems-prompt.md`, `package-prompt.md`; slice 3 deletions listed above

## Notes for the executor

- **Mount once, route always.** Nothing else in the tree may push onto the detail stack except through `useRefRouter`; `openDetailPage.ts`'s hooks become the router's internals or are deleted.
- **Adapters, not rewrites.** `useNotificationNavigation`, `handleThreadNodeSelect` and `openEntity` keep their signatures one release; they map and call. Their coverage tests are the proof, and each must be falsified by removing a mapping.
- **`WorldRefKind` does not grow.** Content is `ContentRef`; `codex` does not return (THR-1315 stands). If Christian vetoes the codex sheet, set every content row's `sheet` to `null` and delete nothing.
- **Do not build a third section model.** The `content` and `group` page kinds are `Section` stacks in `DETAIL_PAGE_REGISTRY`; `EntityCard` is retired, not extended.
- **Person imagery stays knowledge-gated on the card** (Law 8). The hover card for an unrecognised agent shows the silhouette, not the portrait.
- **Sheets are not touched in slice 1.** The temptation is to "tidy" `AgentProfileModal`; the ticket is the router.
- **Law 21 amendment is a joint decision.** It is stated in this plan and in the handoff; if Christian vetoes it, the router still ships and the law keeps its current wording.

## Intent-judge verdict

*2026-09-12 — cold-context judge (fable), proposal `Docs/plans/.intent-proposals/thr-1482-one-card-one-router.md`.*

**Verdict: Allow.** Impact class corrected upward from Reversible to **External** (skill-prompt edits change other agents' behaviour; the Law 21 amendment binds every UI Done-when). Scores: PASS on dimensions 1, 2, 4–9 and 11; GAP on dimension 3 (two behaviourally-touched files absent from Files to touch) and on dimension 10 (kill criteria only in the proposal) — both resolved above (`HexDetailView.tsx` and `openDetailPage.ts` added; `## Kill criteria` section added). Judge note recorded, not scored: the pre-existing `DetailPageKind` value `'place'` overloads the UL game word *Place* (inner tier); this plan does not originate that value.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-12*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: `HOVER_CARD_DELAY_MS`, `_MAX_SECTIONS`, `_W`; `DETAIL_GROUP_W/_H` named even though equal to default "so a later change is a number" |
| 2. Inspectability | PASS | Two registered traces (`ui.ref_opened`, `ui.ref_unroutable`), `__DEBUG.openRef`/`getSurfaceRegistry`, IA manifest rows, wiring table maps every module to phase/UI/trace/debug per checklist convention |
| 3. Determinism | PASS | "None new. `generateDetailPage` takes the session seed for its fallback prose pools (existing, deterministic per node)" |
| 4. Fail-soft | PASS | Fail-soft table: unresolved id → `unknownStub`+trace; `sheet:null` → opens card not no-op; generator throw caught at router; unmapped union member caught by build-time coverage tests rather than a runtime crash |
| 5. Narrative over mechanical | PASS | Fallback prose for `group`/`content` kinds "in game register (Law 42)"; person imagery stays knowledge-gated on the card (Law 8) |
| 6. Additive over destructive | PASS-with-note | Three routers become adapters, signatures kept one release; but slice 3 deletes `NpcDetailView`, `AgentDetailPanel`, `EntityCard`, `cultureDetail.ts` — justified as zero/single-consumer sunset, not central-logic destruction, but still a real deletion, not purely additive |
| 7. Performance budget | PASS | "one generator call per open; hover gated by dwell; no per-tick work" — no orchestrator/tick-phase change anywhere in the plan |

NFP AUDIT: PASS-with-notes (see row 6)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design gives full types/code for the registry, `ContentRef`, and router; Graph/Tick/Resolution/PRNG subsections all explicitly filled (mostly "None," correctly, since this is pure UI routing) |
| Content | present-but-thin | Narrative content is substantive (registry rows, tooltip copy, fallback prose) but the four required subsections (Encounter templates, Prose tables, Attachment content, Data tables) are not present as headers — addressed only as prose bullets, none N/A-stated per-subsection |
| UI | present-and-substantive | All four required subsections filled: Player-facing display (card/hover card/law citations), Event notifications ("None new"), Debug inspection (`__DEBUG.openRef`, `getSurfaceRegistry`), Visual presence correctly marked N/A with reason |

**Missing-required-sections list:** Content pillar's `### Encounter templates`, `### Prose tables`, `### Attachment content`, `### Data tables` subsection headers are absent (content is covered narratively instead — "No authored game content," "No encounter, attachment or undertaking content changes" — but not organized under the template's required per-subsection structure).

**Wiring section check:** Yes — the Wiring table maps each new module (surface-registry, contentRef, useRefRouter/RefRouterContext, DetailModal mount, adapters, anchor-catalog derivation) to orchestrator phase (correctly "—" for pure-UI modules), UI component, GameState field, trace, and debug visibility; a second "Harness wiring" table extends this to docs/laws/styleguide/IA manifest. Satisfies the checklist's intent.

**Substrate-existence check:** `## Substrate inventory` section is present, immediately after "Why this is load-bearing," with 13 rows each marked extends/activates/reuses/retires and status badges. Cross-checked against `Docs/canon/systems-inventory.md`: none of the named subsystems (detail-page cluster, WorldRef, anchor catalog, EntityCard, codex overlay) appear there — the inventory catalogs tick-loop gameplay subsystems, not UI/navigation plumbing, so there is no green-field-duplication collision. Section present, no collision.

PILLAR AUDIT: PASS-with-notes

*Author response (same pass, before the PR):* the Content pillar was restructured under the four template headers, each with its N/A rationale or its rows; the note is resolved.

### Vision audit

**Method note:** `npm run vision-audit -- Docs/plans/2026-09-12-thr-1482-one-card-one-router.md` ran successfully (no fallback needed); its mechanical scan found no Vision-file citations and one premise named without citation. I supplemented with a direct read of the five Vision files for the qualitative checks. `Docs/design-brief.md` was not consulted (not required once the six-file set is available) — no `[design-brief-stale]` tag needed.

**1. Vision premises touched:**
- `00-north-star.md` → not referenced.
- `01-core-loop.md` → not referenced.
- `02-non-negotiables.md` → "Narrative over mechanical perfection" (item 2) — [confirmed, cited in NFP table row 5 without file path]; "All mechanics surface through prose" (item 3) — [confirmed: fallback prose, tooltip copy ≤200 chars, no raw numbers].
- `03-design-tensions.md` → not referenced.
- `taste-profile.md` → "Prose-first UI" — [confirmed]; "Austere, Malazan-adjacent voice" — [confirmed, implicit via tooltip/prose conventions]; "Graph edges, not property-bag relationships" — [confirmed: router reads, never writes; no new edges].

**2. Vision contradictions:** No contradictions found.

**3. Five qualitative checks:**
- North star: Neutral — this is navigation/detail-surface plumbing, not a lever on the mortal-attachment moment; no risk to the target experience.
- Core loop: Preserved — no change to scan → encounter → aftermath; router opens cards/sheets outside that rhythm.
- Non-negotiables: Clean — no direct-control surface added; god/protagonist separation untouched; graph read-only.
- Design tensions: None leaned on — infrastructure, not emergence/authorship or remove/attachment content.
- Taste profile: Respects prose-first and austere-voice conventions (tooltip copy, fallback prose in game register); no numbers, no emoji introduced.

**VISION AUDIT: PASS** — infrastructure/UI-router ticket with trivial Vision touchpoints; no premise at risk.
