> **title:** `The view-model seam — screens read prepared view data, never the raw world graph — THR-1822`
> **linear_issue:** THR-1822
> **author:** `Claude Code`
> **created:** 2026-10-14
> **three_pillars:** Engine `done` · Content `done — one data-table home for the seam's words; no new prose (the land prose moves, unchanged)` · UI `done`

# The view-model seam — THR-1822

*Every screen of the map-first overhaul reads one prepared, testable, serialisable answer from the engine instead of re-deriving game meaning from the raw graph inside React — so one fact is told one way, knowledge gating has one place to land, and GameView can finally be cut apart.*

## Settled input (not re-opened)

| Source | What it fixes for the seam |
|---|---|
| Groundwork brief, attended session 2026-10-14 (Christian present; decisions made under process.md rule 4, veto invited) | View models are plain, serialisable objects from pure engine selectors in `src/engine/views/`, no React; caches per session on `SimulationRuntime`, keyed on `worldVersion` / `structuralCacheVersion`, never module singletons, never graph identity; place selectors go through `sublocationShape.ts`; Node tests per view model. **One ratchet script for all UI debt, owned by THR-1821's plan doc**; THR-1822 names its pattern and today's baseline. Build order: new surfaces are built on view models from day one; legacy surfaces migrate when touched or retire with the Inspector — no big-bang migration. THR-1821 and THR-1822 are mutex at execution; 1821 lands the script first. |
| [THR-1827 Inspector](../audits/2026-10-11-thr-1827-inspector-decision.md) (Christian, "yes" to all 18 calls) | Subject classes: every `WorldRefKind`, the god's own sheet, content refs as a short card. One **Connections** block in a fixed order (where · who · belongs to · friends and foes · holds/knows · story), sorted then folded. Land page order: name + lede → *In this land* → Act on this land → description (HexChronicle prose) → Around it. *In this land* always shows People and Holder; lair, ruins, halls, resources and covenants only when present. Hex naming: terrain plus most notable place, else region. Router: `card` → docked, `sheet` → wide, `hover` → HoverCard. **Knowledge gating deferred** ("we can build the gating functionality later"); the seam is the one source Connections, *In this land* and Find are built from. |
| [THR-1832 Find anything](../audits/2026-10-12-thr-1832-find-anything-decision.md) | A `findIndex` view model `{ ref, name, kindLabel, fact, mapLocated, hexKey?, yours }`, built lazily, rebuilt only when `worldVersion` moved, never per tick, read-only. The interim **"seen" floor** lives in this seam; gating later replaces it here, once. Matching and ranking rules; "Nothing you know of by that name." |
| [THR-1830 lenses](../audits/2026-10-14-thr-1830-map-lenses-decision.md) | Four lenses, one at a time: Dominion (as THR-1750 built it — **reuse, never fork**), Threads, Trouble, Trade. Fog covers every lens mark. A lit hex opens the same land page, unfiltered. New engine data: none. |
| [THR-1829 Stage](../audits/2026-10-14-thr-1829-encounter-stage-decision.md) | A `stageView`: the moment, its palette, its lit hex(es) and its tag, resolved once. Lit hex = the beat's own hex, else the subject's place via `resolveToParentLocation`, else the ruin's place, else nothing lit and the camera stays. The Stage is one module wrapping the veil's step shells. |
| [THR-1828 frame](../audits/2026-10-12-thr-1828-screen-frame-decision.md) + THR-1825 research | A `needsYou` view model built from the interrupt registry, the beat offer, unacked receipts and the alert channel; three groups (Waiting for you · Held behind this chapter · News); count = rows; `NEEDS_YOU_NEWS_KEEP_DAYS = 3`, `NEEDS_YOU_NEWS_MAX = 12`. The frame is three modules: TopBar, GodRail, LedgerRail. |
| THR-1823 map, *Not yet specified* | "GameView split and migration order" waits on this ticket. This plan's § D16 is the answer, so that item can graduate. |
| THR-1822 comments (Christian, 2026-10-11) | A Unity port is exploration only. This ticket stands on its **web-game merits**: testable view logic, inspectability, a smaller GameView. Nothing here is sized as port preparation. |

## Why this is load-bearing

Game meaning is computed inside React today. 42 player-facing UI files make 197 direct world-graph queries; GameView.tsx alone is 6,862 lines with 62 of them, 73 `useMemo`s and 46 `useEffect`s. Two surfaces that answer the same question answer it differently: `HexDetailView` scans the graph itself while hex-zoom uses `useHexZoomData`, so "who is here" has two rules (THR-1827 measurement) — a live instance of complaint class PC-6, *one fact told two ways*. The overhaul is about to add six new surface families (Inspector pages with Connections, the land page, Find, four lenses, the Stage, the Needs-you queue). Built the old way, each would re-derive meaning again, Christian's deferred knowledge gating would have to be threaded into every one of them, and none of that logic could be tested without a DOM. Built on this seam, each surface reads one prepared answer, gating lands in one function, every view model is a Node test, and the debug bridge can print exactly what a screen was told. The seam is also the precondition for cutting GameView apart: its derivations leave first, then its JSX can move into hosts.

## Substrate inventory

Step 0.6 greps: `src/engine/views/` 0 hits; `src/engine/selectors*` 0 hits; `scripts/check-ui-debt.ts` 0 hits. The seam is **not** green-field — it extends the builders below.

| Existing subsystem (inventory name / module) | Status | This plan |
|---|---|---|
| `simulation` — `simulationRuntime.ts` (`SimulationRuntime`, `worldVersion` :66, `structuralCacheVersion` :68, `touchWorld` :439, `touchStructure` :448, `ensure*` caches, `resetRuntimeCaches` :811) | 🟢 ACTIVE | **extends**: one additive field `viewCache`, cleared by `resetRuntimeCaches`; the seam's cache follows the `ensureDominionProjection` pattern (:717) |
| `dominion` — `dominionViewModels.ts` (header :4 already names itself "the view-model seam (THR-1822)"; `dominionSheetVM` :122, `dominionLensVM` :173, `dominionHexLineVM` :214), `dominionProjection.ts` | 🟢 ACTIVE | **extends, never forks**: the Dominion lens and sheet rows are read through the seam's cache unchanged; the THR-1830 pressure clause extends `dominionHexLineVM` in place |
| `detailPageGenerator.ts` (`generateDetailPage` :91, `DETAIL_PAGE_REGISTRY` sections per `GraphPageKind`, `unknownStub` :258, per-tick cache `runtime.detailPageCache`) and `contentPageGenerator.ts` (`generateContentPage`) | 🟢 ACTIVE | **extends**: every Inspector subject page embeds the existing `DetailPage` sections as its body, and `DETAIL_PAGE_REGISTRY` becomes the one page-layout table for every subject (kinds it lacks get rows, D7); the hover card keeps calling `generateDetailPage` unchanged; the missing-page words reuse `unknownStub`'s |
| `hex` — `hexActorIndex.ts` (`buildHexActorIndex` :34, living individuals per hex via `resolveToParentLocation`), `hexZoom.ts` (`getLocationsInHex`, `getHexCultures`, `getHexFactions`, `getHexSphereInfluence`; returns raw `GraphNode[]`) | 🟢 ACTIVE | **extends**: the hex contents index is built on `buildHexActorIndex`'s rule for people and adds the other kinds; `hexZoom.ts` readers are reused as inputs, wrapped into plain rows |
| `viewLevel.ts` (`getVisibleSubLocations` :54 — hides `hidden` sublocations) | 🟢 ACTIVE | **reused** for every sublocation list |
| `area` / `realm` — `ensureAreaProjection` :617, `ensureRealmProjection` :656 | 🟢 ACTIVE | **reused**: region for hex naming and the land page's *where*; realm holder for *Holder* |
| `agentDetail.ts` (`getAgentInfoCard` :1476, knowledge-gated; `getAgentFullProfile` :1969) | 🟢 ACTIVE | **extends**: the person page is built on `getAgentInfoCard` |
| `familiarity` / `visibility` / Intelligence & Knowledge — `familiarityMap` (`types/familiarity.ts` tiers :16), `visibilityMap` + `StaleSnapshot` (`types/visibility.ts:3-20`), `hexRevelation`, `agentKnowledge` (`types/agentKnowledge.ts:26`), sublocation `hidden` | 🟢 ACTIVE | **read-only**: the knowledge filter's seen floor reads them; no new state |
| `targetActions.ts` (`getTargetActionSlots` :308) + `targetContextBuilders.ts` | 🟢 ACTIVE | **reused** for the Act row and row card counts |
| `graphQueries.ts` (`getThreadsFrom`, `getFactionMembershipEdges`, `getAvatarsOf`, …) and `groupShape.ts` | 🟢 ACTIVE | **reused** by the Connections recipes and the army page instead of re-walking edges |
| Map overlay producers: `tradeRouteMarkers.ts` :50/:75, `rivalInfluenceMarkers.ts` :74/:97, `reachSignatureMarkers.ts` :63, `roadNetwork.ts` :366, `strategicPresentation.ts` (`getHexStrategicOverlays` :340) | 🟢 ACTIVE | **reused** by the map and lens selectors |
| Model builders that live in `src/components/` but are pure and Node-tested: `ascendant-bar/selectors.ts` (531 lines), `encounter-stage/adapters/build*.ts` + `chipCollaborators.ts` + `narrativeLinker.ts`, `momentCardModel.ts`, `lair/buildLairMonsterCardModel.ts`, `*BadgeModel.ts`, `worldPulseCount.ts`, `interruptRegistry.ts` (178 lines, no React) | 🟢 ACTIVE | **moved, not rewritten**, into `src/engine/views/` by the slice that builds their surface's new home (§ D16); old paths keep a one-line re-export until their last importer moves (NFP #6) |
| `useRefRouter` (`src/hooks/useRefRouter.ts`, THR-1482 one card, one router) | 🟢 ACTIVE | **preserved**: the Inspector builds on it (`card` → docked, `sheet` → wide); the seam supplies the page, the router still decides where it opens |

Population consumed (seed 42, medium, tick 30, headless CLI): 2,838 nodes / 7,522 edges; 254 Locations (outer tier), 830 Places (the sublocation tier), 12 Areas (`region` nodes), 548 individuals, 52 factions, 8 groups, 235 artifacts (1 legendary), 768 hex tiles. A Find-shaped single pass over Locations, Places, people and artifacts (1,934 entries, one `located_at` and one `member_of` read each) took **0.59 ms** in Node. The seam's full-world builds are small; caching is for render stability and per-tick cost, not because a build is slow.

## What exists today (measured, `main` @ `3cf81086`)

| Fact | Evidence |
|---|---|
| **Graph-query baseline (the ratchet's pattern): 197 direct calls in 42 player-facing UI files** — `getNode` 129, `getOutgoingEdges` 33, `getNodesByType` 19, `getIncomingEdges` 11, `getEdgesByType` 3, `getAllEdgesForNode` 2 | scope and method in § D14 |
| The debug tree adds 80 calls in 14 files (`src/components/Game/debug/**` + `Game/useDebugOpenModal.ts`); excluded from the ratchet, reported beside it | § D14 |
| **3 direct graph writes from UI code**: `GameView.tsx:5493` (`handleJourneyChoice`, `updateEdge`, **no `touchWorld`**), `hooks/useAgentInteraction.ts:662` (`updateEdge`, bumps `touchWorld` :666), `StyleGuide/StyleGuide.tsx:96` (a fixture graph). `handleStoryBeatDismiss` (`GameView.tsx:~5087`) also writes node properties in place | grep |
| The ticket's 2026-10-11 figure (~210 calls / 53 files) counted the debug tree differently; today's total including debug is 277 / 56 files | grep |
| 159 player-facing UI files import from `src/engine` (190 distinct modules); `WorldGraph` is named 125 times in 46 of them (props and params that carry the raw graph) | grep, informational |
| GameView.tsx: **6,862 lines**; 251 imports; 39 `useState`, 29 `useRef`, ~73 `useMemo`, ~88 `useCallback`, ~46 `useEffect`; 62 graph calls — map 23, camera 3, Inspector-bound 8, frame 1, Stage/beats 14, debug levers 13 | structural survey |
| GameView's **map derivations are inline memos**: agentRenderData L898–966, threadLineData L970–1021, companyRenderData L1027–1059, activityIconData L1077–1190, locationNodes L1249–1268, armyRenderData + battleRenderData (sieges) L1319–1375, activity-by-hex L2174–2202, the Dominion lens L2455–2493 | structural survey |
| **The debug levers alone are ~1,400 lines of GameView** (L2340–3310, L4041–4088, L5295–5407, L5523–5599) | structural survey |
| The interrupt snapshot `resolveInterrupts` (L5108–5128), `playerSurfacesOpen`, `giftPillRaised` and `clockHolder` are recomputed on every render | structural survey |
| **Version hazard:** `GameView.tsx:2584` and `:5092` write an undeclared `worldVersion` onto GameState (no such field, `types/gameState.ts:221`); `AscendantSheet.tsx:226`, `GameView.tsx:5063` and `ascendant-bar/selectors.ts:4` key on it. The real counters live on the runtime | survey |
| `worldVersion` bumps at the end of every `runTick` (`orchestrator.ts:4043`, TB-086), so while paused it holds still | grep |
| Map render-data interfaces live in HexMapV2 scene files (`ThreadLineMesh.ts:65`, `CompanyClusterMesh.ts:66`, `ArmyLayer.ts:55`, `ActivityIconMesh.ts:84`, `agents/agentSpriteTypes.ts:22`); `battleIndicatorForNode` lives in `HexMapV2/scene/BattleIndicatorLayer.ts:215` | grep |

## Decisions

### D1 — What a view model is

A view model (VM) is the complete answer one surface needs, prepared by the engine.

1. **Plain and serialisable.** Only strings, finite numbers, booleans, `null`, arrays and plain objects. No `Map`, `Set`, class instance, function, `GraphNode`, `GraphEdge` or `WorldGraph`. Every VM passes `assertSerialisable(vm)`: `structuredClone(vm)` and `JSON.parse(JSON.stringify(vm))` both deep-equal `vm`.
2. **Words, not numbers** (Laws 13 and 14, banded at the source — the governance UI-law clause (a)). Display fields are finished words: band words, rank words, tier words, `wordedKey` subtitles. A number appears only as a **count** the surface lays out ("Show all 14"), never as a magnitude.
3. **References, not ids.** Every named thing is a `WorldRef` (`types/worldRef.ts`) with its display `name` and `tooltipId` when one exists, so the surface can give it its image, tooltip and link (Laws 1, 17, 21) without parsing English — the producer declares its concepts (governance UI-law clause (b)).
4. **Semantic keys, not CSS.** New VMs carry `sphere: SphereName`, `tone: 'threat' | 'trouble' | 'caravan' | …` and let the component map keys to tokens. (`DominionSheetVM.sphereColorVar` is kept as built; it is not forked.)
5. **Only written state** (Law 56). A row, mark or line exists only when the state it reports exists. Empty states are explicit fields (`emptyLine`), never fabricated rows.
6. **Read-only.** A selector never writes the graph, GameState or the runtime, apart from its own cache entry.

**Not graph nodes.** View models are transient derived data in the runtime cache. No node type, edge type or GameState field is added (CLAUDE.md load-bearing decision).

### D2 — Module layout

```
src/engine/views/
  types.ts            shared VM primitives (RefRow, FactLine, SubjectHeaderVM, ConnectionsVM, …) and the VM unions
  viewConstants.ts    the seam's tunables (§ Constants)
  readView.ts         ViewSelector contract, readView(), the per-session cache, the fallback trace
  viewContext.ts      ViewContext (state, ascendantId, tick, seed, versions) built once per read
  selectors.ts        VIEW_SELECTORS — the registry useView() and __DEBUG.getView() both read
  knowledge.ts        the one knowledge-filter seam: OPEN, seenFloor(), knowledgeFilterFor(surface)
  hexContents.ts      one hex → contents index (people, places by tier, armies, artifacts, lair, ruins, halls, resources, covenants)
  connections.ts      buildConnections(ctx, ref) + CONNECTION_RECIPES (the one Connections builder)
  landIndex.ts        "In this land"
  findIndex.ts        buildFindIndex(ctx) + matchFind(index, query, recent)
  needsYou.ts         the Needs-you queue
  subjects/
    subjectPage.ts    selectSubjectPage(ctx, ref) — dispatcher → SubjectPageVM
    landPage.ts  locationPage.ts  personPage.ts  factionPage.ts  armyPage.ts
    artifactPage.ts  godSheet.ts  contentCard.ts  recordPage.ts  actOn.ts
  map/                the map's always-on data (slice 1, moved out of GameView)
    agents.ts  threadLines.ts  companies.ts  activityIcons.ts  places.ts  armiesAndBattles.ts  mapTypes.ts
  lenses/
    lensView.ts       selectLensView(ctx, lensId) → MapLensView union
    threadsLens.ts  troubleLens.ts  tradeLens.ts          (Dominion: dominionViewModels.ts, unforked)
  stage/
    stageView.ts      StageVM + resolveMomentHexes()
    (the moved encounter-stage adapters, narrativeLinker, momentCardModel, lair card model — § D16 step 5)
  interruptRegistry.ts  moved from components at § D16 step 4 (needsYou reads its InterruptResolution)
  __tests__/
```

UI glue, outside the engine:
- `src/contexts/ViewSourceContext.tsx` — provides `{ runtime, state }` once, at GameView's root.
- `src/hooks/useView.ts` — `useView(selector, args)`; the one place a component touches the runtime for view data.

Layering rule: `src/engine/views/**` imports only from `src/engine/**`, `src/types/**`, `src/data/**` and `src/lib/**` — never from `src/components/**`. Types flow engine → components. Where a HexMapV2 render-data interface today is the shape a selector must return, the selector returns its own `map/mapTypes.ts` type and the scene interface becomes an alias of it (`export type ThreadLineData = MapThreadLineVM`) or is adapted in one line at the map host; the executor picks per type, additive either way. A pure helper the seam needs that lives in a component module today (`battleIndicatorForNode`) moves to the seam and is re-exported from its old path.

### D3 — One read path: `ViewSelector` + `readView`, cached per session

```ts
// readView.ts
export type ViewInvalidation = 'world' | 'structure';
export interface ViewSelector<A, VM> {
  readonly id: ViewSelectorId;                 // 'subjectPage' | 'landIndex' | 'findIndex' | 'connections' | 'lens' | 'stage' | 'needsYou' | 'map.agents' | …
  readonly invalidation: ViewInvalidation;     // which counter keys the entry
  key(args: A): string;                        // stable, primitive cache key for these args
  build(ctx: ViewContext, args: A): VM;        // pure
  fallback(args: A, reason: ViewFallbackReason): VM;  // what to show when build throws or its subject is gone
}
export function readView<A, VM>(runtime: SimulationRuntime | null, state: GameState, sel: ViewSelector<A, VM>, args: A): VM;
```

- **Keyed on the runtime's counters, never on graph identity.** A `'world'` entry is valid while `runtime.worldVersion` equals the version it was built at; a `'structure'` entry while `runtime.structuralCacheVersion` does. A valid entry returns **the same object** (identity-stable, so React memo and `useSyncExternalStore`-style consumers re-render only on change).
- **Cost model.** `worldVersion` moves once per tick (`orchestrator.ts:4043`), so a world-keyed VM is rebuilt at most once per tick, and only if something reads it. While paused, every read is a cache hit — opening, closing and navigating the Inspector costs nothing.
- **Where it lives.** `SimulationRuntime.viewCache: ViewCache` (additive field; created in `createSimulationRuntime`, cleared in `resetRuntimeCaches`). Bounded to `VIEW_CACHE_MAX_ENTRIES`; the oldest-read entry is evicted. Never a module singleton (load-bearing decision).
- **No runtime** (tests, the style guide): `readView` builds fresh and caches nothing — the same rule `generateDetailPage` already follows.
- **Fail-soft.** `readView` wraps `build` in `try/catch`; a throw returns `sel.fallback(args, 'resolver_threw')` and emits one `view_fallback` trace per `(selector, reason, key)` per session (§ Tracing). A tick never reads a VM, so a VM can never take the tick loop down.
- **Existing caches keep their owners.** `generateDetailPage` keeps its per-tick `detailPageCache`; `ensureDominionProjection` keeps its rebuild rules. The seam calls them; it does not re-cache their internals.

### D4 — UI glue and inspectability

- `useView(selector, args)` reads `{ runtime, state }` from `ViewSourceContext`, subscribes to the runtime's counters through the props React already re-renders on, and returns `readView(...)`. Components below GameView stop receiving `graph` props for migrated surfaces.
- **Debug bridge** (dev only): `await window.__DEBUG.getView(selectorId, args)` returns exactly the VM the screen was given; `await window.__DEBUG.listViews()` returns the registry ids with their invalidation class; `await window.__DEBUG.getViewCacheStats()` returns entries, hits, misses, rebuilds per selector. JSDoc in `src/debug-bridge.d.ts`. This is the Inspectability payoff (NFP #2): "why does the land page say no one lives here?" is answered by reading the VM, then the VM's Node test.

### D5 — The one knowledge-filter seam

```ts
// knowledge.ts
export type KnowledgeSurface = 'connections' | 'landIndex' | 'find' | 'lensMarks';
export interface KnowledgeFilter {
  readonly id: 'open' | 'seen-floor';            // gating adds 'gated' later
  canName(ref: AnyRef): boolean;                 // AnyRef = WorldRef | ContentRef (cards and Codex entries are content refs)
  staleFact(ref: AnyRef): string | null;         // "last seen …" for a remembered place, from its hex's StaleSnapshot
}
export function knowledgeFilterFor(ctx: ViewContext, surface: KnowledgeSurface): KnowledgeFilter;
```

| Surface | Filter today | Why |
|---|---|---|
| Connections | `OPEN` (a no-op) | Gating is deferred (Christian, 2026-10-11). Connections list only what hangs off a page already opened (THR-1832 § 2). |
| *In this land* | `OPEN` | Same. |
| Find | **seen floor** (THR-1832 table, below) | Search is the one surface that can name something from nowhere. |
| Lens marks | the seen floor's **hex rule** only | A mark on an `unexplored` hex is not emitted, so a hover line cannot leak what fog hides (THR-1830: fog covers every lens mark). |

**The seen floor** (THR-1832 § 2, implemented exactly):

| Kind | Nameable when |
|---|---|
| Location, Area (THR-1832's "place", "region") | its hex is `visible` or `remembered` (an Area: any of its hexes) |
| Place (sublocation) | its parent Location is nameable **and** it is not `hidden` |
| Person (agent, companion) | `getKnowledgeLevel` ≥ `SEEN_FLOOR_PERSON_MIN_LEVEL` (`recognised`), **or** threaded to the god, **or** standing on a `visible` hex now |
| Faction | a nameable member, or a nameable place it controls |
| Army | on a `visible` hex now |
| Artifact | held by the god's own people, **or** in a holder's revealed possessions (`agentKnowledge`), **or** at a nameable, non-hidden place |
| Card / Codex entry | in hand / shown by the Codex's existing run-state filter |

- **Fail-open** (Law 8): no `visibilityMap` at all (fog-off debug views) → everything is nameable.
- **When gating lands**, `knowledgeFilterFor` is the only function that changes: every surface row returns the gating filter. No surface edits.
- The `hidden` flag on sublocations is game state, not knowledge, and is honoured on every surface through `getVisibleSubLocations`.

### D6 — One hex contents index

`hexContents.ts` builds, per world version, one `HexContentsIndex` for the whole map, and every surface that asks "what is on this hex" reads it: the map's agent positions (slice 1), *In this land*, the land page, the Stage's place tag, the lens hover lines and Find's `hexKey`. This retires the two-rules defect (HexDetailView vs `useHexZoomData`) by construction.

- **People:** exactly `buildHexActorIndex`'s rule (living individuals, `locationId` resolved to its Location via `resolveToParentLocation`). Extended, not rewritten.
- **Locations and Places:** Locations via `getLocationNodes`, Places via `getPlaceNodes` + `getVisibleSubLocations` — never a bare `getNodesByType('location')`, which returns both tiers.
- **Armies, artifacts, lair, ruins, halls, resources, covenants:** read through their existing helpers (`groupShape.ts`, the ruins layer, `controls` / `owns`, `GameState.controlEffects`).
- Internal storage may use a `Map`; what leaves the selector is a plain `Record<HexKey, HexContentsVM>` or a per-hex VM (D1).
- Structure-keyed sub-index (hex → place assignment, region) + world-keyed overlay (who stands where), so a tick of movement rebuilds only the cheap half.

### D7 — Subject pages: one dispatcher, one VM per class

`selectSubjectPage(ctx, ref): SubjectPageVM` is what the Inspector renders for any ref the router opens. Every page shares a header and ends in Connections (THR-1827 call 8), and every page's body **is the existing `DetailPage` sections** from `generateDetailPage` for its `GraphPageKind` — the card the DetailModal shows today becomes the Inspector page's body, so nothing a sheet says today is lost and nothing is re-authored. **One producer fix rides with it (step 4):** the actor body's Faction Allegiances chip prints `member_of.rank` raw as its flavour (`detailPageResolvers.ts:327-330` — the "0.16" THR-1827 found). `factionAllegiancesResolver` changes at the source to the same rank word the person page uses (below), so the hover card, the old card and the Inspector body all say "Sergeant", never "0.16".

```ts
// types.ts — shared primitives
export interface RefRow {                 // one row in a list or Connections group
  ref: WorldRef;                          // name + tooltipId inside
  fact: string;                           // one plain fact: "Priest · Congregation of the Spheres"
  mapLocated: boolean;                    // Law 22: draws the eye
  hexKey: HexKey | null;
  staleFact: string | null;               // "last seen …" (remembered place), else null
}
export interface FactLine { label: string; value: string; ref?: WorldRef; tooltipId?: string }
export interface SubjectHeaderVM {
  ref: WorldRef;
  name: string;
  kindLabel: string;                      // worded: "Temple quarter", "Priest", "Congregation"
  whereLine: WorldRef[];                  // containment, innermost first: Temple Quarter → The Bone Coast
  visual: { kind: WorldRefKind; id: string; portraitGate: 'shown' | 'silhouette' };   // Law 8 for persons
  mapLocated: boolean;
  hexKey: HexKey | null;
  opensWide: boolean;                     // factions, cultures, past events (THR-1827 call 12)
}
export interface ActOnVM { slots: WheelSlot[]; emptyLine: string | null }   // getTargetActionSlots output as-is: WheelSlot is plain data, and CardFace already turns its costs into pips
interface SubjectPageBase {
  header: SubjectHeaderVM;
  actOn: ActOnVM;                         // cards under the name (call 1)
  facts: FactLine[];
  body: DetailPageSection[];              // from DETAIL_PAGE_REGISTRY via generateDetailPage — every class, incl. land / god / content rows; carries any per-width visibility the registry declares
  connections: ConnectionsVM;             // D8
}
```

| Class | `WorldRefKind`(s) | VM | Built from (existing) | Class-specific fields |
|---|---|---|---|---|
| Land (hex) | `hex` | `LandPageVM` | registry rows for a new `land` page kind whose resolvers are HexChronicle's prose functions (moved, output unchanged), `ensureAreaProjection`, `hexContents` | `lede: string`; `inThisLand: LandIndexVM` (D9); the description (The land / Its soul / What came before) is `body`, from the `land` registry rows; `around: ConnectionsVM` (where → its Area; the six neighbours, each named by the naming rule). Name: terrain + most notable Location ("The plateau at Oreblack Deep"), else the Area's name (call 18) |
| Location, Place and Area (UL: Location = outer tier, Place = inner tier) | `location`, `sublocation`, `area` | `LocationPageVM` | `generateDetailPage('place')`, `getVisibleSubLocations`, realm projection, `dominionSheetVM` | `tier: 'location' \| 'place' \| 'area'` (tier asked through `sublocationShape.ts`: `isLocationNode` / `isPlaceNode`); `within: RefRow[]` (a Location's non-hidden Places, by occupancy); `here: RefRow[]` (people, by role); `holder: RefRow \| null`; `dominion: DominionSheetVM \| null` |
| Person | `agent`, `companion` | `PersonPageVM` | `getAgentInfoCard` (knowledge-gated), `generateDetailPage('actor')`, `agentKnowledge`, `dominionSheetVM` | `roleWord` (from `npcRole` — fixes "wanderer"); `court: 'first' \| 'retinue' \| 'watched' \| 'dormant' \| null`; `memberships: { faction: WorldRef; rankWord: string \| null }[]` — **one source for the rank word**: exactly what `getAgentInfoCard` sets as `factionRank` today (`agentDetail.ts:1692-1694`), i.e. `computeRankFromReputation(member_of.reputation, factionDefinition).name` (`types/faction.ts:262`) — the same reputation-based tier the mechanics read (`factionRankBonus.ts`, `factionQuestGeneration.ts`). Not `member_of.rank`, which is the separate promotion number (`agent-behavior-constants.ts:409-410`). A faction with no definition gets `null` and the row names the faction alone, as the card does today; `bonds` read from `revealedBonds` **by id** (fixes the name/id mismatch THR-1827 found in `BondsTab`) |
| Faction | `faction` | `FactionPageVM` | `generateDetailPage('faction')` | `kindWord`; `reveres: SphereName \| null`; `sizeLine` ("a dozen or so members", from `HEADCOUNT_WORDS` — never a numeral); `seat: RefRow \| null`; `halls: RefRow[]`; `leader: RefRow \| null` (often null — no `leads` edge exists); `header.opensWide = true` |
| Army | `army` | `ArmyPageVM` | `generateDetailPage('group')`, `groupShape.ts`, battle records | `commander: RefRow \| null`; `sizeWord` (its members through `HEADCOUNT_WORDS`); `headingTo: RefRow \| null`; `war: RefRow \| null` |
| Artifact | `artifact` | `ArtifactPageVM` | `generateDetailPage('item')`, `dominionSheetVM` | `holder: RefRow \| null`; `at: RefRow \| null`; `legendary: boolean`; `categoryWord` (the card's existing subtitle from `subtitleForNode(node, 'item')`, unchanged) |
| The god's own sheet | the ascendant (`agent` ref whose actor is the ascendant) | `GodSheetVM` | registry rows for a new `god` page kind over `ascendant-bar/selectors.ts` (moved, § D16 step 4) | identity (name, state word, the First); essence by sphere (words); Attention word; Reaches + rung; Mandate line; covenants, signatures, hooks |
| Content card | `attachment` (a template — committed content) and content refs (lore, cards) | `ContentCardVM` | `generateContentPage`, adopting registry rows for the content kinds | `body` (its sections); `codexEntryId: string \| null` — "Read in the Codex" renders only when the Codex holds the entry (Law 25) |
| Record | `encounter`, `journey`, `receipt` (and graph `event`s) | `RecordPageVM` | `generateDetailPage('event')` where an event node exists; the receipt / journey stores otherwise | `when` (season words), `where`, `who`, `outcomeLine`. A *live* encounter is not a record: the router sends it to the Stage |
| Missing | any ref whose node is gone or mismatched | `MissingPageVM` | `unknownStub`'s words | "Unknown" / "this entity is no longer in the world" — the existing text |

`SubjectPageVM` is the discriminated union of these on `pageKind`. `actOn` slots are computed only for the open subject (one `getTargetActionSlots` call), world-keyed.

**One page-layout table for every body (the Inspector's iteration lever).** Every subject's `body` comes from `DETAIL_PAGE_REGISTRY` (`src/data/detailPageTemplates.ts`) through `generateDetailPage` — never a body hand-built in a selector or a component — so iterating a page's layout is editing one table row. Kinds the registry lacks today get **schema rows**, not bespoke bodies: the land page (HexChronicle's three prose blocks — The land, Its soul, What came before — become section resolvers in the engine), the god's own sheet (resolvers over the moved `ascendant-bar/selectors.ts`), and content cards (`generateContentPage` adopts registry rows for its kinds); the army already has the `group` row. The registry key widens additively to cover them (`GraphPageKind` → a page-kind union with `land`, `god` and `content` arms). The entry type must be able to grow a **per-width visibility field** — e.g. `SectionSchemaEntry.visibleAt?: readonly ('docked' \| 'wide' \| 'full')[]`, absent = every width — and the seam carries it onto each section of `body` unchanged; the selector never drops a section by width, the Inspector filters by its current size. Adding that field, the new kinds' rows and the `?view=inspector-lab` dev view for iterating them belong to the Inspector plan doc, THR-1876; this seam's contract is only that `body` is registry-built and carries whatever visibility the registry declares. The class-specific fields in the table above are the structured parts the Inspector lays out around the body (header, facts, *In this land*, Connections) — they are not a second body.

### D8 — The one Connections builder

```ts
export const CONNECTION_GROUP_ORDER = ['where', 'who', 'belongsTo', 'friendsAndFoes', 'holdsKnows', 'story'] as const;
export interface ConnectionsGroupVM { id: typeof CONNECTION_GROUP_ORDER[number]; label: string; rows: RefRow[]; total: number; foldAfter: number }
export interface ConnectionsVM { groups: ConnectionsGroupVM[] }    // always in CONNECTION_GROUP_ORDER; empty groups omitted
export function buildConnections(ctx: ViewContext, ref: WorldRef): ConnectionsVM;
```

- **One builder for every page.** Per-kind behaviour is data: `CONNECTION_RECIPES: Record<SubjectClass, Record<GroupId, RecipeStep[]>>`, where a step names an edge type and direction (from `src/types/graph.ts`) or an existing helper. No surface builds its own Connections.
- **Order is fixed** (call 8) and enforced by the type and a test. **Empty groups are omitted** (Law 25: a heading with nothing under it is a dead control).
- **Sort, then fold** (call 9): people by role (`CONNECTIONS_ROLE_ORDER`, then name); Locations and Places by occupancy, then name; powers by relation word, then name; story newest first. The VM always carries **every** row plus `foldAfter = CONNECTIONS_DOCKED_FOLD_AFTER`; docked folds there with "Show all N", wide and full ignore it (THR-1820's grow-before-truncate law).
- **Filtered once:** rows pass `knowledgeFilterFor(ctx, 'connections')` — `OPEN` today.
- **Card counts are not in Connections.** They depend on the hand, essence and range, so they come from a separate world-keyed selector, `actOnCounts(ctx, refs)`, called only for the rows on screen (the docked fold), and the row renders its count from that. Connections stays cheap and cacheable.

Recipes (the executor completes each from `graph.ts`; a step whose edge does not exist is dropped, never invented):

| Class | where | who | belongs to | friends and foes | holds / knows | story |
|---|---|---|---|---|---|---|
| Person | `located_at` chain → Place → Location → land | `relates_to` kin/friend, `mentors`, `accompanies` | `member_of` (+ rank word), `belongs_to` culture, `thread` from the god | `relates_to` by sentiment sign, `hostile_to` | `possesses`, `bonded_to`, `owns`, `knows_secret_of`, `owes_favor`, revealed possessions | `participated_in` events, `pursues` ambitions |
| Location / Place | `contains` parent chain → Area → land | people `located_at` here | holder (`owns` / `controls` in), culture, realm | powers with a hall or member here | its Places (`contains`), artifacts here, resources (`controls` out) | `occurred_at` events |
| Area | — | Locations it `contains` | — | — | — | events in its Locations |
| Faction | seat, halls | members (`member_of` in), by rank | culture | `relates_to` / `hostile_to` factions | `controls`, `possesses` | events |
| Army | `located_at` + heading | `commanded_by` | `member_of` power / realm | battle opponents (`participates_in`) | — | battles |
| Artifact | `located_at`, or the holder's Location | holder (`possesses` / `bonded_to` in) | maker (`constructed_by`), if any | — | — | `participated_in` / previous uses |
| God | avatar (`avatar_of`) | threaded mortals (`thread`), the First | — | rivals | covenants (`controls`), bonded artifacts | Chapter Ledger entries |

### D9 — *In this land*

```ts
export interface LandIndexRowVM { id: 'people' | 'holder' | 'lair' | 'ruins' | 'halls' | 'resources' | 'covenants'; label: string; rows: RefRow[]; emptyLine: string | null }
export interface LandIndexVM { hexKey: HexKey; rows: LandIndexRowVM[] }
export function buildLandIndex(ctx: ViewContext, hexKey: HexKey): LandIndexVM;
```

- Built from `hexContents` (D6) and filtered by `knowledgeFilterFor(ctx, 'landIndex')` (`OPEN` today).
- `LAND_INDEX_ALWAYS_ROWS = ['people', 'holder']` always render, with their empty lines ("No one lives here", "No one holds this land"); `LAND_INDEX_WHEN_PRESENT_ROWS = ['lair', 'ruins', 'halls', 'resources', 'covenants']` render only when non-empty (call 17).
- Each row is a link (`RefRow`); its card count comes from `actOnCounts` like any row (call 13).

### D10 — The Find index

```ts
export type FindGroup = 'places' | 'people' | 'powers' | 'things' | 'cards' | 'codex';
export interface FindEntryVM { ref: AnyRef; name: string; kindLabel: string; fact: string; mapLocated: boolean; hexKey: HexKey | null; yours: boolean; group: FindGroup; searchKey: string }
export interface FindIndexVM { entries: FindEntryVM[] }
export function buildFindIndex(ctx: ViewContext): FindIndexVM;                          // world-keyed; built when the box opens
export function matchFind(index: FindIndexVM, query: string, recent: readonly string[]): FindResultsVM;   // pure, uncached
```

- Exactly THR-1832's entry shape, plus `group` and a folded `searchKey`.
- **Filtered by the seen floor** (`knowledgeFilterFor(ctx, 'find')`). A remembered place's `fact` is its `staleFact`.
- **Matching** through one helper, `foldForSearch(s)` (lower case, accents stripped): whole name > word start > inside a word; then `yours`; then `recent` (Inspector history, passed in — it is UI state); then name. Groups ordered by their best match; `FIND_RESULTS_PER_GROUP` rows each, then "Show all N".
- **Leak test is a Done-when of the Find build:** no result ever carries an unseen entity's ref, and a query that matches only unseen names returns the same empty `FindResultsVM` as a nonsense string, so the miss reads "Nothing you know of by that name." either way.
- Fallback per THR-1832: if a measured build ever exceeds a frame on a large world, the selector's `invalidation` flips to `'structure'` — one field.

### D11 — Lens view models

```ts
export type LensId = 'dominion' | 'threads' | 'trouble' | 'trade';     // MapLensId in data/map-lenses.ts grows to these
export type MapLensView =
  | { lensId: 'dominion'; vm: DominionLensVM }                           // dominionLensVM() as built — never forked
  | HexLensVM;
export interface HexLensVM {
  lensId: 'threads' | 'trouble' | 'trade';
  lit: HexKey[];                                  // focus: stays lit; the rest dims at the one lens strength
  marks: LensMark[];                              // one ink per lens
  hover: Record<HexKey, string>;                  // the hover line, finished words
  legend: { head: string; lines: string[] };
  emptyLine: string | null;                       // "No trade road you know of yet."
}
export interface LensMark { kind: 'medallion' | 'destination' | 'unrest' | 'battle' | 'siege' | 'scheme' | 'drain' | 'lair' | 'omenRing' | 'road' | 'roadThreat'; hexKey: HexKey; toHexKey?: HexKey; ref?: WorldRef; tone: 'first' | 'retinue' | 'watched' | 'dormant' | 'trouble' | 'caravan' | 'threat' }
export function selectLensView(ctx: ViewContext, lensId: LensId): MapLensView;
```

| Lens | Sources (all existing) | Notes |
|---|---|---|
| Dominion | `ensureDominionProjection` → `dominionLensVM` | Read through `readView` with the projection's own refresh rule. The THR-1830 pressure clause extends `dominionHexLineVM` in place |
| Threads | `thread` edges from the god (court position), each mortal's hex via `hexContents`, `movementState.destinationId` → its Location → hex | the `map/threadLines.ts` slice-1 selector is its base |
| Trouble | unrest state (`phaseUnrest.ts`), battles and sieges (`map/armiesAndBattles.ts`, `isSiege` carried), `rivalInfluenceMarkers` (`rivalId`, `reason`), lairs, local omens (`kind: 'local'`, hex, radius), the doom stage word for the legend head | a siege is a `siege` mark, never a `battle` |
| Trade | `trades_with` / `tradeRouteMarkers` (threatened flag), `getProsperityTier` and `stockTier` at each end | sparse early; `emptyLine` covers it |

The issue's lens list ("Holdings / Threads / Spheres / Trouble / Trade") predates THR-1830: *Holdings* is **Dominion** (the UL word, THR-1746), and **Spheres is not a lens** (THR-1830 § 5) — its honest part is the pressure clause on the Dominion hover line, so it has no VM of its own. Every `HexLensVM` mark and hover line passes the seen floor's hex rule (D5). Lens VMs are world-keyed; the map host reads only the one lens that is on.

### D12 — The Stage view model and the lit-hex resolver

```ts
export type StageMomentKind = 'encounter' | 'aftermath' | 'storyBeat' | 'vignette' | 'undertakingMoment' | 'premonition' | 'emergence';
export interface StageMomentInput {
  kind: StageMomentKind;
  hex?: { col: number; row: number };          // the beat's own hex when its data carries one
  subjectAgentId?: string;                     // vignette, undertaking moment, premonition
  ruinId?: string;                             // emergence
  optionLocationIds?: readonly string[];       // premonition compulsion options
  hasArt: boolean; hasCast: boolean;
}
export interface StageVM {
  kind: StageMomentKind;
  palette: 'veil' | 'premonition' | 'story' | 'elder' | 'gain';    // Law 30 families, unchanged
  litHex: HexKey | null;
  litSource: 'beat' | 'agent_location' | 'ruin_location' | null;
  options: { ref: WorldRef; hexKey: HexKey; ringOnly: boolean }[];  // ringOnly: the option's hex is in fog
  frame: HexKey[];                                                   // what the camera tries to fit in the window
  placeTag: string | null;                                           // "Millbrook · where it is happening"
  layout: 'full' | 'compact';                                        // compact when no art and no cast
}
export function resolveMomentHexes(ctx: ViewContext, input: StageMomentInput): Pick<StageVM, 'litHex' | 'litSource' | 'options' | 'frame'>;
```

Resolution order, exactly THR-1829 § 4: the beat's own hex (the encounter header's `hexCol`/`hexRow`, `QueuedStoryBeat.hexCol/hexRow`) → the subject agent's Location (`located_at`, then `resolveToParentLocation` from a Place up to its Location, then that Location's hex) → the ruin's Location → **null: nothing lit, the whole map dims, the camera stays**. The camera move itself is UI (`centerOn`); the VM only says what to frame.

### D13 — The Needs-you view model

```ts
export interface NeedsYouRowVM { id: string; group: 'waiting' | 'held' | 'news'; line: string; ref: AnyRef | null; opens: 'beatOffer' | 'receipt' | 'subject' | 'none'; after: boolean }
export interface NeedsYouVM { count: number; waiting: NeedsYouRowVM[]; held: NeedsYouRowVM[]; news: NeedsYouRowVM[]; newsOverflowLine: string | null }
export interface NeedsYouSources {
  interrupts: InterruptResolution;     // resolveInterrupts(snapshot) — which surface is open, which are held
  alerts: readonly AlertItem[];        // the alert channel (types/notification.ts:127; React state today, passed in as plain data)
  namedPause: { line: string; ref: AnyRef | null } | null;   // e.g. the avatar arriving
}
export function needsYouView(ctx: ViewContext, sources: NeedsYouSources): NeedsYouVM;
```

- Groups and order from THR-1828 § 4. **Waiting for you**: the pending ascendant-beat offer, unacknowledged toast-tier receipts (both read from GameState), the named pause. **Held behind this chapter**: every interrupt surface the resolution holds behind the open one, named from its queued item ("A premonition about Kael Thorne"), `after: true`. **News**: alerts within `NEEDS_YOU_NEWS_KEEP_DAYS`, newest first, at most `NEEDS_YOU_NEWS_MAX`, then `newsOverflowLine` ("and 3 earlier, in the Chronicle") — no silent drop (Law 49).
- `count` = the number of rows (THR-1828). Opening the list never clears it; that is the UI's rule, not the VM's.
- Sources that live in React state today (alerts, the interrupt snapshot) are passed in as plain data. Moving notification state into GameState (THR-1825's Law 55 gap) is **not** this ticket.

### D14 — The ratchet patterns and today's baseline

THR-1821's plan doc owns the script — merged as `Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md` § The UI-debt ratchet: `scripts/check-ui-debt.ts` (`npm run check:ui-debt`, on the gate's code track and in CI), rows as data in `scripts/ui-debt-rows.ts` (`UI_DEBT_ROWS`), the baseline in `ui-debt-baseline.json`, comments removed with the TypeScript compiler before counting, one shared exclusion list `UI_DEBT_EXCLUDED`. Its § rows already lists these two as THR-1822's, with the same reference counts. THR-1822 registers them as two `UiDebtRow` entries (owner `THR-1822`; law: "NFP #2 — the view-model seam"; sanctioned: "read a view model through `useView` (`src/engine/views/`)"; no homes) and runs `npm run check:ui-debt -- --update`:

| Pattern id | Counts | Baseline @ `3cf81086` |
|---|---|---|
| `graph-query-in-ui` | calls matching `/\.(getNode\|getNodesByType\|getAllNodes\|getEdge\|getOutgoingEdges\|getIncomingEdges\|getAllEdgesForNode\|getEdgesByType\|getAllEdges\|getNeighborIds\|getByTag)\(/g` — every read method of `WorldGraph` (`src/engine/graph.ts`) | **197** (42 files) |
| `graph-write-in-ui` | calls matching `/\.(addNode\|removeNode\|updateNode\|addEdge\|removeEdge\|updateEdge\|applyMutations\|retargetEdgeSource)\(/g` — every write method | **3** (3 files) with my exclusions; **2** under THR-1821's shared exclusions, which drop `components/StyleGuide/` (its fixture graph) |

- **Scope:** `src/components/**`, `src/hooks/**`, `src/contexts/**`, `*.ts` and `*.tsx` — THR-1821's player UI tree. The rows use its `UI_DEBT_EXCLUDED` list unchanged (tests, CMS, StyleGuide, UL, TaxonomyViewer, `Game/debug/`, `HexMapV2/lab/`, any file named `*debug*` / `*Debug*`); none of those holds a graph read today outside the debug tooling below, so the read baseline is 197 either way.
- **Excluded:** `**/__tests__/**`, `*.test.*`, `*.spec.*`; lines whose first non-blank characters are `//`, `/*` or `*` (one such hit today, `HooksBlock.tsx:8`); and the **debug tooling** — `src/components/Game/debug/**` and `src/components/Game/useDebugOpenModal.ts` (80 calls in 14 files). Debug panels exist to show raw state (NFP #2); forcing them through view models has no player value. The script prints the debug count as an unratcheted information line so it stays visible.
- **Informational, not ratcheted:** `WorldGraph` named in player-facing UI files (125 in 46 files). It counts import lines and pass-through props, so it is noisy; it is reported so a reviewer can see graph handles disappearing as surfaces move.
- The executor re-measures with the landed script and commits the then-current numbers as the baseline (counts only go down from whatever `main` holds).

### D15 — An out-of-tick graph write bumps the world version

The cache in D3 is only correct if every write the UI causes outside `runTick` bumps `worldVersion`. Two do not today: `handleJourneyChoice` (`GameView.tsx:5493`, `updateEdge` on the thread edge after `applyBeatChoice`) and `handleStoryBeatDismiss` (`GameView.tsx:5085–5094`, in-place writes of the ascendant's `pacingActiveStoryBeat` / `pacingLastCompletedTick`, bumping only the undeclared GameState `worldVersion`). Slice 1 moves both writes into engine functions that end with `touchWorld(runtime)`: `recordJourneyChoice(state, runtime, vignetteId, choiceId)` in `journeyEngine.ts` beside `applyBeatChoice`, and `recordStoryBeatDismissed(state, runtime)` beside the story-beat pacing governor in `phaseAttention.ts`, which owns those two properties; `useAgentInteraction`'s `readBackstoryTier` write already bumps and moves when its surface does. `graph-write-in-ui` drops to 0 under the shared exclusions (the style guide's fixture graph is outside the scanned tree).

### D16 — Build order and the GameView split

The brief's rule governs: new surfaces are built on view models from day one; legacy surfaces migrate when touched or retire with the Inspector; nothing about to be deleted is migrated. A VM family is built **with, or immediately before, the surface that consumes it** — never as a module that only tests read (`wiring-checklist.md`).

| Step | Ticket | What moves | GameView after |
|---|---|---|---|
| 1 | **THR-1822 (this plan, slice 1)** | The seam core (`readView`, cache, `ViewSourceContext`, `useView`, `__DEBUG.getView`); `hexContents.ts`; the map's always-on derivations (agents, thread lines, companies, activity icons, places, armies + battles/sieges, activity-by-hex) into `views/map/`; the Dominion lens memos through `readView`; D15's two writes; the two ratchet patterns | The map memos (L870–1375, L2174–2202, L2455–2493) are gone; the map region's 23 graph calls are gone |
| 2 | **GameView split** — THR-1881 (filed with this plan, blocked by THR-1822; moves only, no behaviour change) | Extraction order, smallest risk first: (a) the debug levers (~1,400 lines) into `Game/hooks/useGameDebugLevers.ts`; (b) `Game/hosts/DialogHost.tsx` (Codex, Doom, Mandate, EventPopup, Chapter Ledger, Read the Threads, receipts, gifts/offerings, effect choice sets, Scry, StrandView, Harvest, delve progress, agenda picker, intervention confirm) and `Game/hosts/CeremonyHost.tsx` (Meet the First, Threading Rite, Warm Start); (c) `Game/hosts/StageHost.tsx` (EncounterVeil, MomentCard, journey vignette, story beat, premonition, emergence dilemma); (d) `Game/map/GameMap.tsx` (the `world` view block: HexMapV2, the lens switch, map overlays); (e) `Game/frame/GodRail.tsx` and `Game/frame/LedgerRail.tsx` beside the existing `GameView/GameViewTopBar.tsx` | A composition root: session hooks, the layout grid, host mounts — plus the legacy detail code, untouched |
| 3 | Map lenses + chrome build (the map's lens plan doc) | `views/lenses/` Threads, Trouble, Trade (D11) on step 1's map sources; `knowledge.ts` if it has not landed yet; the lens bar in `GameMap` | unchanged |
| 4 | Inspector + screen frame build (the map's Inspector-and-frame plan doc) | `views/subjects/*`, `connections.ts`, `landIndex.ts`, `findIndex.ts`, `knowledge.ts`, `needsYou.ts`; `ascendant-bar/selectors.ts` moves into `views/subjects/godSheet.ts` and stops keying on the undeclared `state.worldVersion`; `interruptRegistry.ts` moves into `src/engine/views/interruptRegistry.ts` (pure, no React — the engine may not import its type from `src/components/`), re-exported from its old path; HexChronicle's prose functions move into the engine as the resolvers of the new `land` registry rows (D7); `factionAllegiancesResolver` words its rank at the source (D7). **The legacy detail code is deleted, not migrated**: the detail column, `HexDetailView`, `ThreadDetailView`, the `location` and `hex-zoom` view levels (`LocationView`, `HexBreadcrumb`, `HexSidebar`), `LocationProfileModal`, `AgentProfileModal`, the Faction/Army/Artifact/Ascendant sheets, the attachment modal, `DetailModal` for world refs, the ActionDrawer subject hand, `LiveLocationBar` | The composition root alone |
| 5 | Encounter Stage build (the map's Stage plan doc) | `views/stage/stageView.ts` (D12); the pure builders move into `views/stage/`: `encounter-stage/adapters/*`, `chipCollaborators.ts`, `narrativeLinker.ts`, `momentCardModel.ts`, `lair/buildLairMonsterCardModel.ts`, with their tests | unchanged |
| — | Any later ticket touching a legacy surface | migrates that surface's reads when it touches them; the ratchet holds the line | — |

**Why this order.** Step 1 first because every later step reads its cache and its map sources, and because removing the derivations is what makes GameView's JSX movable. Step 2 before any new surface because each new build then edits its own file (`GameMap`, `inspector/`, `frame/`, `StageHost`) instead of the same 6,862-line one — that is what lets the lens build and the Inspector + frame build run in parallel lanes instead of queueing on one mutex. Lenses are listed first because they are the smallest and ride entirely on step 1; they need nothing from step 4. The Stage goes last because it folds the Inspector while open and lists its waiting moments in the frame's Needs-you queue (THR-1829 § 2–3), so both must exist first.

### D17 — Node tests per view model

Every VM family ships with Node tests (default node project, no DOM; a test that builds a generated world goes to the heavy project per `scripts/vitest-test-partition.ts`). Four checks apply to **every** family through one shared helper file, `src/engine/views/__tests__/viewContract.ts`: `assertSerialisable(vm)`; determinism (two builds at the same versions deep-equal); no raw ids or numbers in display strings (no `snake_case` token, no `/\d+\.\d+/`, no node-id shape — Laws 13/14); and the fallback (a missing subject returns the typed fallback, never throws). Family-specific predicates:

| Family | Owning step | Tests (predicates) |
|---|---|---|
| `readView` + cache | 1 | a valid entry returns the same object; a `worldVersion` bump rebuilds a world-keyed entry and keeps a structure-keyed one; a throwing build returns the fallback and traces once per key; eviction past `VIEW_CACHE_MAX_ENTRIES` keeps reads correct |
| `hexContents` | 1 | people per hex equal `buildHexActorIndex`'s on a fixture and on a generated world; a Place resolves to its Location's hex; a hidden Place is absent |
| `map/*` | 1 | each selector reproduces the GameView memo's output captured before the move (golden); a siege stays a siege |
| D15 writes | 1 | `recordJourneyChoice` / `recordStoryBeatDismissed` bump `worldVersion`, and a VM reading the written state changes after each |
| `knowledge` | 3 or 4 | one test per seen-floor row (each kind nameable and not); fail-open with no `visibilityMap`; `OPEN` names everything; a remembered Location's `staleFact` comes from its hex's snapshot |
| Subject pages | 4 | every `WorldRefKind` dispatches to its class (an exhaustive switch the compiler checks); every class's `body` comes from `DETAIL_PAGE_REGISTRY` (no selector constructs a section itself) and keeps any per-width visibility its rows declare; both tiers resolve through `sublocationShape.ts`; the body equals `generateDetailPage(...).sections` and passes the shared no-numbers check (which holds only once the Faction Allegiances chip carries the rank word — that fix is part of this step); the person's role word comes from `npcRole`; the rank word equals `getAgentInfoCard(...).factionRank` for the same member, and the Faction Allegiances chip shows that word; `revealedBonds` read by id; a gone node → `MissingPageVM` |
| Connections | 4 | groups always in `CONNECTION_GROUP_ORDER`; empty groups omitted; sort rules hold; all rows present with `foldAfter`; the city → temple → priest → faction chain from THR-1827 (Bone Coast → Temple Quarter → Shutash → the Congregation) walks link by link on a fixture shaped like it |
| *In this land* | 4 | People and Holder present with their empty lines on an empty hex; the when-present rows absent when empty; "who is here" equals `hexContents` |
| Land page | 4 | naming rule (Location present / only an Area); HexChronicle prose identical before and after the move for three golden hexes |
| Find | 4 | the leak test (D10); ranking order (whole > word start > inside; yours; recent; name); accent-insensitive match; the miss state |
| Needs-you | 4 | `count` equals the number of rows; held rows are named and `after: true`; News keeps `NEEDS_YOU_NEWS_KEEP_DAYS` and caps at `NEEDS_YOU_NEWS_MAX` with the overflow line |
| Lenses | 3 | Threads lights each threaded mortal's hex and arrows to a set destination; Trouble draws a siege as `siege`; Trade's `emptyLine` with no known road; no mark or hover line on an `unexplored` hex; Dominion arm deep-equals `dominionLensVM`'s output |
| Stage | 5 | each resolution branch (beat hex → agent's Location → ruin's Location → null); a fogged premonition option is `ringOnly`; `layout: 'compact'` with no art and no cast |

**Shared screen state during the split.** State read by one host moves into that host. State read by more than one host (the open dialog, the Inspector subject and history, the active lens, the Stage moment, the clock holder) moves into one `GameScreenState` context with a reducer, not into props threaded through GameView. The executor decides per slice; the default is "into the host".

## Engine pillar

### Systems design

**Slice 1 (THR-1822's own build), engine half:**

- **E1 — `src/engine/views/readView.ts`, `viewContext.ts`, `selectors.ts`, `types.ts`, `viewConstants.ts`** (new, pure). The contract in D3. `ViewContext` = `{ state, ascendantId, tick, seed, worldVersion, structuralCacheVersion }`, built once per `readView` call from GameState and the runtime.
- **E2 — `SimulationRuntime.viewCache`** (additive field in `simulationRuntime.ts`): `{ entries: Map<string, { builtAt: number; value: unknown; lastRead: number }>; hits; misses; rebuilds; fallbacksSeen: Set<string> }`. Created in `createSimulationRuntime`, cleared in `resetRuntimeCaches`. The `Map` is internal; no VM exposes it.
- **E3 — `src/engine/views/hexContents.ts`** (new, pure). D6. Built on `buildHexActorIndex` (people) plus `getLocationNodes` / `getPlaceNodes` / `getVisibleSubLocations` (places). Slice 1 fills people and places — what the map reads; the other kinds join with the land page (step 4) against the same type.
- **E4 — `src/engine/views/map/*`** (new, moved). The GameView memos named in D16 step 1 become selectors returning `map/mapTypes.ts` types. Each keeps its current output exactly. A UI-state input that only toggles a flag per row (the hovered hex, the selected agent's highlight) is applied by the map host after the read, so pointer movement never churns the cache; one that changes the derivation itself becomes an explicit argument in the cache key. `battleIndicatorForNode` moves here and is re-exported from `BattleIndicatorLayer.ts`.
- **E5 — Dominion through the cache.** The lens memos (`GameView.tsx:2455–2493`) become a `lens` selector whose Dominion arm calls `ensureDominionProjection` + `dominionLensVM` exactly as they are called today. No Dominion function changes.
- **E6 — `recordJourneyChoice`, `recordStoryBeatDismissed`** (D15) in the engine modules that already own those stores (`journeyEngine.ts`, `phaseAttention.ts`), each ending in `touchWorld`.

**Later families** (steps 3–5) are built by their surface tickets to the types in D5–D13; this plan fixes their shapes, sources, filters and tests.

### Graph nodes / edges

None added. View models are not graph nodes (D1). Reads only, through existing edges and helpers (`located_at`, `contains`, `thread`, `member_of`, `relates_to`, `hostile_to`, `possesses`, `bonded_to`, `owns`, `controls`, `belongs_to`, `participated_in`, `occurred_at`, `commanded_by`, `participates_in`, `trades_with`, `avatar_of`). The two D15 functions write what the UI writes today (the thread edge's beat-choice properties; the story beat's dismissed state), unchanged in shape.

### Tick phases

None. No phase is added, removed or edited. Selectors run on read, from the React side or the debug bridge, never inside `runTick`.

### Resolution logic

None. The seam only reads. Ranking rules (Find, Connections sort) are presentation order, specified in D8 and D10.

### PRNG callouts

None new. Selectors are deterministic: same state + same versions + same args → deep-equal VM (a test). Sort ties break by name, then id — never iteration order. The land page's prose keeps HexChronicle's existing seeded choice (`hashString` of the hex key into `pickFromArray`), so a hex reads the same every time; no `Math.random` anywhere in the seam.

## Content pillar

### Encounter templates

N/A — the seam presents existing state; no encounter is added or changed.

### Prose tables

N/A — no new prose. The land page's description is HexChronicle's existing prose, moved into `landPage.ts` with its output unchanged (a golden test pins three hexes' text before and after the move, step 4).

### Attachment content

N/A — no attachment is added or changed.

### Data tables

**C1 — `src/data/view-content.ts` (new, created by the first family that needs a word — not by slice 1, which shows no new text).** The one home for the seam's player words, so a word is told one way (PC-6): Connections group labels, *In this land* row labels and empty lines, the Find miss line and group names, the stale-fact template, the Stage place-tag template, the Needs-you group names and overflow line, the lens legend heads and empty lines, `CONNECTIONS_ROLE_ORDER` and `HEADCOUNT_WORDS`. Existing words are **imported**, never copied: Dominion words from `dominion-content.ts` / `dominion-ui-content.ts`, subtitles through `wordedKey` / `subtitleForNode`, kind labels from `KIND_LABELS`, a faction's rank names from its own `rankTiers` in `faction-definitions.ts`, small counts from `NETWORK_SIZE_WORDS`, and the season and year in the top bar's "Autumn, year 1" form (`deriveSeasonAndYear` — the season words move from `useWarmStart.ts` into this file and are re-exported there, so the engine and the top bar share them).

**C2 — `HEADCOUNT_WORDS` (new here).** Law 13 forbids a numeral for a headcount (the precedent is `networkSizeWord` in `agentDetail.ts`: "A god does not count a ring's members"), and `NETWORK_SIZE_WORDS` stops at 8. One table extends it for factions and armies: 1–2 "a few", 3–4 "a handful" (both as in `NETWORK_SIZE_WORDS`), 5–15 "a dozen or so", 16–60 "scores", 61 and more "a multitude".

## UI pillar

*Screenshot tool: both. Claude-in-Chrome for the map (WebGL; Playwright cannot see it) — slice 1's evidence is that the map draws the same; Playwright for DOM checks and the debug-bridge assertions. Real 1920×1080 per the viewport contract; Claude-in-Chrome's `resize_window` is inert, so the capture states the measured `innerWidth`/`innerHeight`.*

### Player-facing display

**Slice 1 changes nothing the player sees.** Agents, thread lines, companies, activity icons, places, armies, battles and sieges, and the Dominion lens draw exactly as today, now from view models. That is the acceptance test: a before/after screenshot pair on `?view=game&seeded&size=medium` at the same tick and camera, and `__DEBUG.getView` returning the VMs the map drew.

The later families render on the surfaces their decision records specified (Inspector pages, Connections, the land page, Find, the four lenses, the Stage, Needs you). This plan fixes what those surfaces are *given*; their layouts are their own plan docs'.

UI Laws this seam engages (they bind every consuming surface's Done-when): **8** (person imagery gated — `portraitGate`; fail-open), **13 / 14** (no raw numbers or keys — banded at the source, D1), **17 / 18** (tooltips — `tooltipId` on every ref), **21** (every name routes — every name is a `WorldRef`), **22** (the eye — `mapLocated` + `hexKey`), **25** (no dead controls — empty groups omitted; "Read in the Codex" only when the entry exists), **36** (progressive lists — `foldAfter` + full rows), **49** (no silent drop — Needs-you overflow line), **56** (only written state — D1.5). Law 33 (one viewport) is the surfaces' to meet.

### Player-facing text

Slice 1 shows no new text. The words below are the ones the later families carry. Each is quoted from its settled decision record, so the surface ticket inherits it rather than inventing it — except those marked *new here*, which this plan proposes and the surface ticket may refine.

| Surface (VM) | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Land page name (`LandPageVM.header.name`) | "The plateau at Oreblack Deep" (terrain + most notable place); else the region's name | PC-6 | the same name on the land page, in Find and in the Stage tag, because all three read `hexContents` and one naming function |
| *In this land* (`LandIndexVM`) | "People" — "No one lives here"; "Holder" — "No one holds this land" (*new here*); "Lair", "Ruins", "Halls", "Resources", "Covenants" only when present | PC-6, PC-1 | the rows always present say so when empty, so absence is a fact, not a blank |
| Connections group labels (`ConnectionsGroupVM.label`) | "Where", "Who", "Belongs to", "Friends and foes", "Holds and knows" (*new here*: the decision's "holds/knows" as words), "Story" | PC-1 | the same six headings in the same order on every page, so a player learns them once |
| Connections row fact (`RefRow.fact`) | "Temple Quarter · in The Bone Coast"; "Priest · Congregation of the Spheres" | PC-3, PC-1 | a role word and a place name, never "0.16" or `npc_98`; the name carries its tooltip |
| Person page role / rank (`PersonPageVM.roleWord`, `memberships[].rankWord`) | role from `npcRole`: "Priest", not "wanderer". Rank: the faction's own tier name from the member's reputation with it — for a faction defined with `rankTiers` Journeyman (0.0) and Sergeant (0.3), reputation 0.16 reads "Journeyman" and 0.45 reads "Sergeant"; rendered row: "Sergeant · The Hesk Crossing Wardens". No faction definition: no rank word, the row names the faction alone | PC-1, PC-3, PC-6 | the rank is a title the faction itself uses, never "0.16". **It matches word for word** the surfaces that show rank today — `getAgentInfoCard.factionRank` (rendered by `OverviewTab.tsx:504-506` and `BondsTab.tsx:218`) — because it is the same call; and the DetailPage Faction Allegiances chip, which prints the raw number today, is fixed at its source to the same word (step 4) |
| Remembered Location (`RefRow.staleFact`) | "Temple Quarter · last seen in Autumn, year 1" — the season of the hex snapshot's `lastSeenTick`. With no snapshot the clause is dropped and the row shows its kind word alone ("Temple quarter") | PC-1, PC-3 | the row says it is old news instead of showing live occupants it cannot know; no empty slot ever renders |
| Find miss (`FindResultsVM`) | "Nothing you know of by that name." | PC-1 | identical for unseen and non-existent names — the miss leaks nothing |
| Find empty box | "A place, a person, a power, a card…"; groups "Recent", "Your people" | PC-7 | an invitation, not a void |
| Stage tag (`StageVM.placeTag`) | "Millbrook · where it is happening" | PC-6 | the lit hex is named in words over the map window |
| Needs-you groups and rows (`NeedsYouVM`) | groups "Waiting for you", "Held behind this chapter", "News" (THR-1828); a held row "A premonition about Kael Thorne" with "after this"; overflow "and 3 earlier, in the Chronicle" | PC-4, PC-5 | the god sees what is waiting and in what order; nothing vanishes silently; News inherits the alert channel's existing merge per (icon, tick) (`notificationRouter.ts:194`), so one event never lists twice |
| Subject kind word (`SubjectHeaderVM.kindLabel`) | the existing card subtitle from `subtitleForNode`, unchanged: e.g. "Priest", "Trade guild", "Temple quarter"; "figure of the world" / "faction" / "place" when the stored key is empty | PC-3 | the same kind word the hover card shows today |
| Faction size (`FactionPageVM.sizeLine`), army size (`ArmyPageVM.sizeWord`) | "a dozen or so members"; "scores" (`HEADCOUNT_WORDS`, *new here*) | PC-1 | a sense of scale in words, never a count |
| Threads lens hover | "Maren Ashfold, your First, is on her way here from Hesk Crossing." | PC-1 | the hover names who and where, from the same `hexContents` as the land page |
| Trouble lens hover | "A scheme of The Salt Spire: it is turning the hamlet's shrine away from you." | PC-2 | the rival is named, so the mark is not a mystery |
| Trade lens empty | "No trade road you know of yet." | PC-7 | an empty lens says why it is empty |
| Lens legends (`HexLensVM.legend`) | Threads: "Your people keep their light; the rest is dimmed." · "A dashed arrow shows where each is going." · "The First", "Retinue", "Watched". Trouble head: "Trouble · Doom: Signs". (THR-1830; the lens plan doc owns any further legend words) | PC-1 | every mark on the map has a legend line in words (Law 12) |
| Missing page | "Unknown" — "this entity is no longer in the world" (existing `unknownStub`) | PC-8 | a gone subject still answers the click |

### Playtest signal

A tester who reads who is at a place in two different ways (the land page and a Connections row, or a lens hover and the land page) finds the same people named in both.

### Event notifications

None. The seam emits no toast, alert or chronicle line. The Needs-you VM *presents* the existing alert channel; producing alerts is unchanged.

### Debug inspection (DebugPanel)

`window.__DEBUG.getView(selectorId, args)`, `listViews()`, `getViewCacheStats()` (D4), each `async`, documented in `src/debug-bridge.d.ts`. The `view_fallback` trace shows in the trace viewer like every other category (with tracing enabled).

### Visual presence (HexMapV2)

None new in slice 1 — the map draws what it draws today, from VMs. Lens marks are the lens build's (step 3).

## Interface impact

The seam reads across subsystems and writes nothing cross-system (the D15 functions write what the UI already writes, in the engine module that owns the store). Rows:

| Contract | Change | Where |
|---|---|---|
| Dominion band → hex map (THR-1750 row) | **preserve** — same producer, now read through `readView` | `dominionProjection.ts` / `dominionViewModels.ts` → `views/selectors.ts` → map host |
| Dominion band → sheets (THR-1750 row) | **preserve** in slice 1; **extend** at step 4 (new consumer: the Inspector pages; old sheets retire) | `dominionSheetVM` |
| Knowledge stores → what a surface may name (Intelligence & Knowledge, ⚪ UNAUDITED) | **add** at step 3/4: `knowledge-floor-gates-find` — producers `familiarityMap` (orchestrator familiarity phase), `visibilityMap` (`recalcVisibility`), `agentKnowledge` (revelation hooks), sublocation `hidden` (`sublocation.ts`, `revelationResolver.ts`) → consumer `views/knowledge.ts` (`seenFloor`) → Find and lens marks. The executor registers the row in `scripts/interface-contracts.ts` when the floor ships; the rest of Intelligence & Knowledge stays audit-on-touch | `knowledge.ts` |
| Interrupt registry → the god's attention (Attention & Chronicle, ⚪ UNAUDITED) | **extend** at step 4: new consumer `needsYouView` (held group) beside `useInterruptAutoPause` | `interruptRegistry.ts` → `needsYou.ts` |
| Alert channel → the player (produced, never rendered today: `{/* AlertBar disabled */}`, THR-1825 row 18) | **extend** at step 4: `needsYouView` News group is its first production read site (closes the leak THR-1825 found) | `notificationRouter.ts` alerts → `needsYou.ts` → top bar |
| Encounter header hex / queued story beat hex → camera (Encounters core, ⚪ UNAUDITED) | **extend** at step 5: new consumer `resolveMomentHexes` | `encounter-stage/types.ts:88-90`, `types/attention.ts:123-125` → `stage/stageView.ts` |

Slice 1 registers no row (it adds no cross-system contract). Each **add** row lands in the PR that ships its consumer.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `views/readView.ts` + `SimulationRuntime.viewCache` | none (read on render) | every `useView` caller | reads all; writes none | `view_fallback` | `__DEBUG.getViewCacheStats()` |
| `src/contexts/ViewSourceContext.tsx` + `src/hooks/useView.ts` | — | provided at GameView's root | — | — | — |
| `views/hexContents.ts` | none | map agents + places (slice 1); land page, *In this land*, Find, lenses, Stage (later) | `graph`, `visibilityMap` | `view_fallback` | `__DEBUG.getView('hexContents', hexKey)` |
| `views/map/*` | none | `HexMapV2` via GameView (→ `GameMap` after step 2) | `graph`, `controlEffects` | `view_fallback` | `__DEBUG.getView('map.*')` |
| `views/lenses/lensView.ts` (Dominion arm) | none (projection refresh as built) | `MapLensSwitch`, `DominionLensLayer`, `DominionDropBadge` | via `ensureDominionProjection` | existing `dominion.*` | `__DEBUG.getView('lens', 'dominion')` |
| `view_fallback` trace (`src/types/traces/ui-traces.ts`, `src/types/trace.ts`) | none | trace viewer | — | `view_fallback` | DebugPanel trace filter |
| `recordJourneyChoice` / `recordStoryBeatDismissed` | none (player action, out of tick) | `JourneyVignetteModal`, `StoryBeatModal` handlers | thread edge properties; story beat state | existing | `__DEBUG.getView` reflects the change at once (version bumped) |
| Later families (D5, D7–D13) | none | their surfaces, per § D16 | as listed per family | `view_fallback` | `__DEBUG.getView(<id>)` |

Prose pipeline: no `enrichProse()` call is added; land prose keeps HexChronicle's assembly. Player controls: none added by the seam.

## Constants table

All in `src/engine/views/viewConstants.ts` unless noted.

| Constant | Default | Purpose |
|----------|---------|---------|
| `VIEW_CACHE_MAX_ENTRIES` | 128 | Upper bound on cached VMs per session; oldest-read evicted. Sized for a long Inspector history plus the map, lens, Find and Needs-you entries |
| `CONNECTIONS_DOCKED_FOLD_AFTER` | 6 | Rows a Connections group shows in the docked Inspector before "Show all N"; wide and full show all |
| `CONNECTION_GROUP_ORDER` | `['where','who','belongsTo','friendsAndFoes','holdsKnows','story']` | The fixed order (THR-1827 call 8); a typed tuple |
| `LAND_INDEX_ALWAYS_ROWS` | `['people','holder']` | Rows *In this land* always renders (call 17) |
| `LAND_INDEX_WHEN_PRESENT_ROWS` | `['lair','ruins','halls','resources','covenants']` | Rows rendered only when present |
| `SEEN_FLOOR_PERSON_MIN_LEVEL` | `'recognised'` | Familiarity tier at which a person becomes findable; read through `FAMILIARITY_THRESHOLDS`, never a literal 0.2 |
| `FIND_RESULTS_PER_GROUP` | 6 | THR-1832 |
| `FIND_RECENT_COUNT` | 5 | THR-1832 |
| `FIND_MIN_QUERY_CHARS` | 1 | THR-1832 |
| `NEEDS_YOU_NEWS_KEEP_DAYS` | 3 | THR-1828: in-game days a News row stays |
| `NEEDS_YOU_NEWS_MAX` | 12 | THR-1828: News rows before the overflow line |
| `CONNECTIONS_ROLE_ORDER` (`src/data/view-content.ts`) | role keys, leaders and keepers first | People sort in Connections and *In this land* |

`FIND_BOX_MAX_VH` (THR-1832) and every geometry number (Stage, Inspector, rails) belong to their surfaces and THR-1819's tokens, not the seam.

## Tracing

One new category. Selectors are read-only and run on render, so tracing every read would flood the buffer; only a fallback is traced, once per `(selector, reason, key)` per session (the dedupe set is `viewCache.fallbacksSeen`).

- **Registration (slice 1, the THR-928 trio):** `ViewFallbackTrace` joins `src/types/traces/ui-traces.ts` beside `UiRefOpenedTrace` (added to `UiTrace` and to `UI_TRACE_CATEGORIES`), and `'view_fallback'` joins the `TraceCategory` union and `TRACE_CATEGORIES` in `src/types/trace.ts`, so the vocabulary gate (`types/__tests__/trace-vocabulary.test.ts`) and the DebugPanel filter see it.
- **Sink:** `readView` calls the engine's `emitTrace` from `traceBuffer.ts` — the same module-level trace path `useRefRouter` already uses for `ui_ref_opened` — with `tick` from the `ViewContext`. No buffer is threaded through the context. With tracing disabled, nothing is recorded (as for every category).

```ts
// ViewFallbackTrace — emitted when a selector cannot build its VM and returns its fallback
interface ViewFallbackTrace {
  category: 'view_fallback';
  tick: number;
  selector: ViewSelectorId;           // 'subjectPage' | 'hexContents' | 'map.agents' | …
  key: string;                        // the selector's cache key for these args
  reason: 'missing_node' | 'kind_mismatch' | 'no_hex' | 'resolver_threw';
  detail?: string;                    // the error message for resolver_threw
  summary: string;                    // "view_fallback: subjectPage agent:npc_98 — missing_node"
}
```

The existing `ui_ref_opened` / `ui_ref_unroutable` traces (`useRefRouter`) keep recording what was opened and how.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A selector's `build` throws | `readView` returns `sel.fallback(args, 'resolver_threw')`, traces once; the surface renders the fallback (an empty list with its `emptyLine`, or `MissingPageVM`) |
| The subject node is gone or its kind mismatches | `MissingPageVM` with the existing `unknownStub` words; trace `missing_node` / `kind_mismatch` |
| No runtime (tests, style guide) | Build fresh, cache nothing |
| No `visibilityMap` (fog off) | The seen floor fails open (Law 8): everything nameable |
| No ascendant (pre-bond, `?firstunmet`) | God-specific fields are `null` / empty; `yours` is false everywhere; Dominion reads "no god" as it does today |
| A moment carries no hex and no resolvable subject | `litHex: null`, nothing lit, the whole map dims, the camera stays (THR-1829 § 4) |
| A place has no `hexCol`/`hexRow` | `mapLocated: false`, `hexKey: null`; no eye drawn; trace `no_hex` once |
| An out-of-tick write forgets `touchWorld` | Stale until the next `worldVersion` bump — **indefinitely while paused**, which is exactly when the player acts. That is why D15 is in slice 1: both known writes bump, a test asserts a VM changes after each, and the executor notes forbid new UI writes that do not go through an engine function ending in `touchWorld` |
| A recipe step names an edge with no data | The step yields no rows; an empty group is omitted |
| The cache is full | Evict the oldest-read entry; correctness never depends on a hit |
| A selector's `fallback()` itself throws | Fallbacks are total constant constructors from their args — no graph read, no lookup — and a contract test builds every registered selector's fallback from bare args; `readView` still catches a throw there and returns an empty `{ unavailable: true }` marker the host renders as nothing |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/simulationRuntime.ts` | 228 importers | One additive field (`viewCache`) created in `createSimulationRuntime` and cleared in `resetRuntimeCaches`. Code that builds a `SimulationRuntime` by hand (test fixtures) needs the field or must use `createSimulationRuntime` — the executor greps for object-literal runtimes and makes the field optional on the interface if any exist |
| `src/engine/sublocationShape.ts` | 105 importers | **Read only** — called, not edited |
| `src/types/trace.ts` | 119 importers | One `TraceCategory` union member and one `TRACE_CATEGORIES` entry (`view_fallback`). No `Record<TraceCategory, …>` exists in `src/`, so no exhaustive map breaks; the only knock-on is `types/__tests__/trace-vocabulary.test.ts`, which the registration satisfies |
| `src/types/gameState.ts` | 724 importers | **Not edited.** No GameState field is added; the undeclared `worldVersion` writes are left for step 4 to remove with their readers |

`GameView.tsx` (1 importer) is large but not high-fan-in; its risk is merge conflicts with in-flight work, handled in the coordination block.

## Three-pillar check

- [x] Engine pillar present — the seam core, the hex contents index, the map selectors, D15's writes; later families' types and sources
- [x] Content pillar present — one data-table home for the seam's words; encounter, prose and attachment content N/A with rationale
- [x] UI pillar present — no visible change in slice 1, verified by identical screenshots; Laws engaged; text quoted for the later families
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. Non-negotiable #3 (*mechanics through prose, never numbers*) and the taste profile's prose-first UI are strengthened: words are banded at the source once instead of per component (D1.2, `HEADCOUNT_WORDS`, the rank word replacing "0.16"). Non-negotiables #4 (everything is a graph node — view models are not nodes) and #6 (additive) are respected. The design-tension *legibility vs. mystery* is held where Christian left it: gating is deferred, Find keeps the seen floor, lens marks respect fog. (Direction B's "the map is the table" is the UI review's direction, not a Vision file premise; the plan serves it through one hex index.)
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. It changes how state reaches the screen, not what the state is or how it changes.
- [x] No `Docs/canon/rulebook.md` edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1822-view-model-seam-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number the seam owns is named in `viewConstants.ts`; recipes, row sets and role order are data tables; Find and Needs-you constants keep the names their decisions gave them |
| 2. Inspectability | PASS | `__DEBUG.getView` prints exactly what a screen was told; every VM has a Node test; `view_fallback` traces each fallback once; cache stats are readable |
| 3. Determinism | PASS | No randomness; same state + versions + args → deep-equal VM (tested); ties break by name then id; land prose keeps its seeded hash choice |
| 4. Fail-soft | PASS | `readView` catches; every selector has a typed fallback; missing data → `emptyLine` / `MissingPageVM`; the tick loop never reads a VM |
| 5. Narrative over mechanical perfection | PASS | VMs carry finished words and named references; the land page keeps HexChronicle's prose; numbers stay on the trace |
| 6. Additive over destructive | PASS | New module tree, one optional runtime field; moved builders keep a re-export at their old path; Dominion and `generateDetailPage` are called, not changed; legacy surfaces are deleted only by the Inspector build that replaces them |
| 7. Performance budget | PASS | A full Find-shaped pass is 0.59 ms on a 2.8k-node world; world-keyed VMs rebuild at most once per tick and only when read; zero cost while paused; card counts only for visible rows |

## Done when

THR-1822's own build is **slice 1** (§ D16 step 1). Predicates (THR-688 rule A):

- [ ] `src/engine/views/` exists with `readView.ts`, `viewContext.ts`, `selectors.ts`, `types.ts`, `viewConstants.ts`, `hexContents.ts` and `map/*`; nothing under it imports from `src/components/` (a test greps the imports)
- [ ] `SimulationRuntime` carries `viewCache`, created by `createSimulationRuntime` and emptied by `resetRuntimeCaches`
- [ ] `view_fallback` is registered in `ui-traces.ts` and `trace.ts`, the trace-vocabulary test passes, and a forced fallback shows in the DebugPanel trace viewer with tracing on
- [ ] GameView's map derivations named in D16 step 1 read from `useView` / `readView`, and no direct graph call remains in those memos
- [ ] Node tests (default node project; a generated-world test goes to the heavy project per `scripts/vitest-test-partition.ts`): every slice-1 VM passes `assertSerialisable`; two builds at the same versions are deep-equal; a valid entry returns the same object; a `worldVersion` bump rebuilds a world-keyed entry and leaves a structure-keyed one; a throwing build returns the fallback and traces once; `hexContents` people for a hex equal `buildHexActorIndex`'s for that hex on a fixture and on a generated world; each moved map selector returns exactly what the GameView memo returned on the same state (golden comparison captured before the move)
- [ ] `recordJourneyChoice` and `recordStoryBeatDismissed` bump `worldVersion` (tested); the two GameView sites call them
- [ ] `scripts/ui-debt-rows.ts` carries `graph-query-in-ui` and `graph-write-in-ui`; `ui-debt-baseline.json` holds the post-slice counts (`graph-query-in-ui` below 197 by at least the map region's 23; `graph-write-in-ui` 0), and `npm run check:ui-debt` passes
- [ ] `__DEBUG.getView`, `listViews`, `getViewCacheStats` exist, are documented in `src/debug-bridge.d.ts`, and return the VMs the map drew (browser assertion)
- [ ] Browser evidence at 1920×1080 on `?view=game&seeded&size=medium`: before/after Claude-in-Chrome screenshots of the same tick and camera show the same map (agents, threads, companies, armies, battles/sieges, Dominion lens on), console clean, a `__DEBUG.getView('map.agents')` assertion, a UI-Laws line (Laws 1, 13/14, 17, 21, 33, 37 unchanged — no visible change)
- [ ] `npm test` and `npx vite build` pass; `npm run check:typecheck` ratchet clean; 30-tick CLI smoke and `npm run test:heavy` (engine paths touched)
- [ ] `Docs/canon/engine.md` and `Docs/canon/systems-inventory.md` name `src/engine/views/` as the seam; `Docs/ui-patterns.md`'s derived-data guidance (the `useMemo` rules, :267–269 and :424) points UI work at `useView`; the `frontend-ui` skill's UI checklist line "Which GameState fields? Which graph traversals?" names the seam (if the `.claude/skills/` edit is refused in the executor's session, file a small follow-up issue rather than skipping it); the Design Reference Wiki page whose `sources` match is updated
- [ ] Closing commit body includes `Fixes THR-1822` on its own line

## Coordination block

**Suggested model:** opus — a cross-cutting engine/UI refactor whose correctness rests on cache-invalidation semantics and exact golden equivalence of moved derivations.

**Parallel-safe with:** THR-1819 and THR-1820 — they edit `src/index.css` tokens and `src/components/shared/Modal.tsx`; this slice edits `src/engine/views/**`, `simulationRuntime.ts`, GameView's map memos, `debug-bridge.ts`, a new context and hook. The only shared file is the ratchet baseline JSON, and each ticket adds only its own patterns' rows.

**Mutex with:** THR-1821 — both touch the UI-debt ratchet (its S1 creates `scripts/check-ui-debt.ts`, `scripts/ui-debt-rows.ts`, `ui-debt-baseline.json` and the gate wiring; this adds two rows to the latter two); **1821's S1 lands first** (brief; THR-1821 plan § Coordination), so this is also *blocked by* THR-1821's S1 merge. Any in-flight ticket editing `GameView.tsx`'s map memos (L870–1375, L2174–2202, L2455–2493) or `simulationRuntime.ts`'s runtime shape — check `In Dev` before claiming.

**Files to touch:**
- Create: `src/engine/views/{readView,viewContext,selectors,types,viewConstants,hexContents}.ts`, `src/engine/views/map/{agents,threadLines,companies,activityIcons,places,armiesAndBattles,mapTypes}.ts`, `src/engine/views/__tests__/*.test.ts` (with the shared `viewContract.ts` helper), `src/contexts/ViewSourceContext.tsx`, `src/hooks/useView.ts`
- Edit: `src/types/traces/ui-traces.ts` + `src/types/trace.ts` (register `view_fallback`), `src/engine/simulationRuntime.ts` (additive `viewCache`), `src/components/Game/GameView.tsx` (map memos → `useView`; D15 call sites; provider at the root), `src/components/HexMapV2/scene/BattleIndicatorLayer.ts` (re-export the moved helper), the HexMapV2 render-data interfaces (alias or adapt, D2), `src/engine/journeyEngine.ts` and `src/engine/phaseAttention.ts` (D15 functions), `src/debug-bridge.ts` + `src/debug-bridge.d.ts` (three accessors), `scripts/ui-debt-rows.ts` + `ui-debt-baseline.json` (two rows, THR-1821's script), `Docs/canon/engine.md`, `Docs/canon/systems-inventory.md`, `Docs/ui-patterns.md`, `.claude/skills/frontend-ui/SKILL.md`

## Notes for the executor

- **Golden first, then move.** Before moving a GameView memo, capture its output on a fixture state into the test as the expected value; the moved selector must reproduce it exactly. A behaviour change in slice 1 is a bug, not an improvement.
- **Do not build families ahead of their surfaces.** Subject pages, Connections, *In this land*, Find, the knowledge filter, Needs-you, the Stage VM and the Threads/Trouble/Trade lenses are typed here and built by steps 3–5. Building them in this ticket would ship modules only tests read.
- **Do not migrate legacy surfaces.** `HexDetailView`, `ThreadDetailView`, `LocationView`, the sheets and modals the Inspector retires are deleted by step 4, not moved onto the seam.
- **Never key on graph identity or `state.worldVersion`.** The counters are on the runtime. The undeclared GameState `worldVersion` (GameView :2584, :5092) stays until step 4 removes it with its readers; do not add new readers of it.
- **`readView` returns the same object while valid.** Do not clone on read; React's change detection depends on identity.
- **The debug tree is outside the ratchet on purpose.** Do not move debug panels onto view models.
- **The ratchet is THR-1821's** (`scripts/check-ui-debt.ts`, landed by its slice S1); this plan owns only its two rows. Register them as data in `scripts/ui-debt-rows.ts`; do not edit the script.
- **The GameView split is a separate ticket** (THR-1881, blocked by this one). Do not start moving JSX into hosts here.
- **No new UI graph writes.** A write the UI causes outside `runTick` goes through an engine function that ends in `touchWorld`; otherwise every cached view model is stale while paused.
- **Words:** the surface nouns (Inspector, land page, Connections, *In this land*, Find, seen floor, map lens, the Stage, Needs you, view model) are proposed for the UL in THR-1882; use them as the decision records do. The UL's **Location** (outer tier) and **Place** (inner tier, code word sublocation) govern every type and comment.

**Kill criteria — stop and report rather than push through:**
1. A moved map selector cannot reproduce GameView's memo output exactly on a fixture → keep that memo in GameView, record why on the ticket, move the rest.
2. Cached view models show stale data in play that is not an un-bumped out-of-tick write → the invalidation model is wrong for that selector; build it uncached until fixed and say so on the ticket.
3. A measured world-keyed rebuild costs more than a frame on a large map → flip that selector to `'structure'` or split it; if neither works, lazy pull is wrong for it — report it.
4. A later surface ticket finds a type here unusable and starts reading the graph instead → revise this plan; never let a surface bypass the seam.


## Intent-judge verdicts

- Pass 1 (2026-10-14): **Revise** — 3 GAPs (wiring: `view_fallback` unregistered and a slice-1 data file nothing read; UL: surface nouns had no entries; player legibility: rank, "last seen", Needs-you, kind and size words unquoted). Impact class corrected Reversible → External. All fixed; UL-proposal THR-1882 filed.
- Pass 2: **Revise** — 2 GAPs (player legibility: rank word from `member_of.rank` disagreed with `getAgentInfoCard`'s reputation-based rank, and the reused body still printed "0.16"; blast radius: `src/types/trace.ts` missing). Both fixed.
- Pass 3: **Allow** — 12/12 PASS, impact class External confirmed. *Post-Allow refinement (parent session, 2026-10-14, recorded on THR-1876):* D7 now states that every subject body is built from `DETAIL_PAGE_REGISTRY`, that kinds the registry lacks (land, god, content) get schema rows, and that the entry type can grow a per-width visibility field carried through unchanged — additive to what the judge allowed (it already had the body as `generateDetailPage` sections), so it was not re-judged. Non-scoring notes carried to the surface plans: `ActOnVM.emptyLine` and `RecordPageVM.outcomeLine` words belong to the Inspector plan doc; a second season table in `threading-rite-prose.ts` should point at `view-content.ts` when that file is created; the Spheres omission rests on THR-1830, which is inside its veto window.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-14*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | The `viewConstants.ts` table names `VIEW_CACHE_MAX_ENTRIES` 128, fold 6 and news keep 3 / max 12. `HEADCOUNT_WORDS`, the Connections recipes and the row sets are data tables. |
| 2. Inspectability | PASS | `__DEBUG.getView`, `listViews` and `getViewCacheStats` are specified. `view_fallback` is registered in the trace files. The Wiring table is complete, and every VM family gets Node tests. |
| 3. Determinism | PASS | "no `Math.random` anywhere in the seam". Ties break by name, then id. A deep-equal test is specified, and the land prose keeps its seeded `hashString` choice. |
| 4. Fail-soft | PASS-with-note | `readView` wraps `build` in try/catch and every selector has a typed fallback. The 9-row fail-soft table covers the missing-data cases. Note: the stale-while-paused risk is closed only for the "both known" UI writes. A throwing `fallback()` is not addressed. |
| 5. Narrative over mechanical | PASS | D1.2 is "Words, not numbers". The plan adds `HEADCOUNT_WORDS` and moves HexChronicle prose unchanged. |
| 6. Additive over destructive | PASS-with-note | Slice 1 adds one runtime field, moved builders keep re-exports at their old paths, and Dominion and `generateDetailPage` are called, not changed. Note: step 4 deletes the legacy detail surfaces and changes the Faction Allegiances chip output. |
| 7. Performance budget | PASS-with-note | A Find-shaped pass took 0.59 ms. World-keyed entries rebuild at most once per tick and only when read, and kill criterion 3 covers a slow rebuild. Note: slice 1 has no timing predicate for the map selectors. Hover and selection args in cache keys could churn the 128-entry cache. |

NFP AUDIT: PASS-with-notes (see rows above)

*Author response:* the throwing-fallback case now has its own fail-soft row (total constant constructors, a contract test, and an `{ unavailable: true }` marker); E4 now applies per-row UI flags (hover, selection highlight) after the read so pointer movement never churns the cache. Step 4's deletions are the Inspector decision Christian approved (THR-1827 § Retires), and the chip change is a Law 13 fix at the source.

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | D1–D16, E1–E6 and the D3 contract. It covers the `viewCache` runtime field, `hexContents`, the map selectors and the D15 write fixes. Graph nodes/edges, tick phases, resolution logic and PRNG are each stated as none, with reasons. |
| Content | present-and-substantive | Encounter templates, prose tables and attachment content are N/A with reasons. The data tables are real: C1 `view-content.ts` (the seam's words) and C2 `HEADCOUNT_WORDS`. |
| UI | present-and-substantive | Display, Player-facing text (13 quoted rows with complaint classes), Playtest signal, Event notifications, Debug inspection and Visual presence are all present. The Laws engaged are listed. |

**Missing required sections:** No missing required sections. The Blast Radius section is present (CONDITIONAL, applicable), and the plan adds an Interface impact section.

**Wiring check:** The Wiring table gives each module its orchestrator phase (none, with the reason that selectors run on read), UI component, GameState field, trace (`view_fallback`) and debug accessor. The later families share one aggregate row.

**Substrate check:** The plan has a `## Substrate inventory` section with extends/reuses/moves dispositions, a runtime population count and Step 0.6 greps showing 0 hits for `src/engine/views/`. Cross-checked against `systems-inventory.md`, there is no green-field duplication; it builds on `dominion`, `detail`, `hex`, `view`, `simulation`, `sublocation`, `notification` and Intelligence, Knowledge & Familiarity (read-only).

Notes: Content has no slice-1 deliverable (`view-content.ts` is created by the first consuming family); UI text for the later families is quoted from the decision records, with some rows marked "new here".

PILLAR AUDIT: PASS-with-notes

### Vision audit

**Vision premises touched**
- 00-north-star.md → "the mortal is a person, not a unit; weight of threads" — confirmed (Connections, role and rank words, Threads lens).
- 01-core-loop.md → "one story at a time, not a dashboard" and "time stops for every moment" — confirmed (Needs-you "Held behind this chapter" and the Stage's dimmed map, D12/D13; caches stay valid while paused, D3).
- 02-non-negotiables.md → #3 "mechanics through prose, never numbers" — extended (D1.2, `HEADCOUNT_WORDS` C2, rank word replacing "0.16", D7); #2, #4, #6, #7 — confirmed.
- 03-design-tensions.md → #4 "legibility vs. mystery" — silent (not named).
- taste-profile.md → "Prose-first UI", the "Numbers in UI" anti-pattern and the plain-register voice — confirmed.

**Vision contradictions:** No contradictions found.

**Five qualitative checks:** North star — supports it. Core loop — preserves it; "Held behind this chapter" and the Stage dimming keep one chapter in front. Non-negotiables — stays inside them; it only reads state. Design tensions — leans toward legibility over mystery (gating deferred, Connections open), with counter-pulls present (seen floor on Find, fog over lens marks, stale facts, hidden Places, one function to gate later). Taste profile — respects it; "Show all N" and the Needs-you count are item counts, not magnitudes.

Further notes: the plan's own Vision audit invoked "The map is the table", which is not in the six Vision files, and cited no Vision file by path.

VISION AUDIT: PASS-with-notes

*Author response:* the Vision audit section now cites non-negotiables #3, #4, #6, the taste profile's prose-first UI and the legibility-vs-mystery tension, and names "the map is the table" as the UI review's direction rather than a Vision premise.