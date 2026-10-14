> **title:** `The Inspector — one docked panel for every place, person and power, the land page, and Find anything — THR-1876`
> **linear_issue:** THR-1876
> **author:** `Claude Code`
> **created:** 2026-10-14
> **three_pillars:** Engine `done — subject pages, Connections, In this land, armed-target and Find view models on the THR-1822 seam; no tick change` · Content `done — the page-layout table's rows for every subject, the land prose moved unchanged, the Inspector's own words in one data home` · UI `done — the Inspector at three sizes, the land page, three ways to play a card, Find, the Inspector lab, the retirements`

# The Inspector — THR-1876

*Nine ways of showing a thing become one panel beside the map, every page is built from one page-layout table that an agent edits and sees in a lab on save, and every link, card and search in the game opens there.*

## Settled input (not re-opened)

| Source | What it fixes for this plan |
|---|---|
| [THR-1827 the Inspector](../audits/2026-10-11-thr-1827-inspector-decision.md) — Christian, chat 2026-10-11, **"yes" to all 18 calls** on the [mock](https://claude.ai/artifact/LGQ9NxzMQfG8tXoaNUxphQ) | Calls 1–18, cited inline below as *call N*: cards under the name (1); docked ≈ 28vw and wide ≈ 50vw, no drag handle (2); the trail is history, containment is a "where" line (3); pin (4); the god's own sheet opens here (5); the Ledger rail folds while open (6); the `location` and `hex-zoom` views retire (7); Connections in a fixed order (8), sorted then folded (9); Full on request only (10), time paused, top bar and god rail visible (11); factions, cultures and past events open wide (12); card counts with an inline tray (13); the hand in the god rail, card-first, lighting targets on the map and in the Inspector (14); the land page (15–18). Router: `card` → docked, `sheet` → wide, `hover` stays HoverCard. Escape order: armed card → top dialog → full → wide → docked → closed. **Knowledge gating deferred** ("we can build the gating functionality later"). |
| [THR-1832 Find anything](../audits/2026-10-12-thr-1832-find-anything-decision.md) | Ctrl+K or `/`; finds only what the god has seen (the interim seen floor); world results fly the camera and open here, a card result arms, a Codex result opens the Codex; Recent and Your people on an empty box; "Nothing you know of by that name."; never pauses. |
| [THR-1833 type](../audits/2026-10-13-thr-1833-type-system-decision.md), [THR-1834 icons](../audits/2026-10-14-thr-1834-icon-family-decision.md) | Cinzel names ≥ 22 px; Alegreya for story prose (the land prose); labels bold sentence case, 16 px floor, no tracking; one carved icon family (places carved too); sizes 14/18/24/34. |
| Foundation plans, merged 2026-10-14: [THR-1819](2026-10-14-thr-1819-1440p-layout-contract.md), [THR-1820](2026-10-14-thr-1820-dialog-size-tiers.md), [THR-1821](2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md), [THR-1822](2026-10-14-thr-1822-view-model-seam.md) | Tokens `--inspector-w` 560/717, `--inspector-wide-w` 960/1280, `--inspector-full-trail-w` 240/300, `--inspector-full-aside-w` 360/440, `--measure-prose`; Law 57 and `SheetColumns`; `Panel`, `Tabs`, `Chip`, `Icon`, `Overlay`, `useEscapeLayer` bands, the `check:ui-debt` ratchet; the view-model seam (`readView`, `useView`, `hexContents`, `selectSubjectPage`, `buildConnections`, `buildLandIndex`, `buildFindIndex`, `knowledgeFilterFor`) and the GameView split ([THR-1881](https://linear.app/threadbare/issue/THR-1881)). THR-1822 § D7 hands this plan the per-width visibility field, the new page kinds' rows and `?view=inspector-lab`. |
| UI Laws 57 and 58 (`Docs/design-system/laws.md` § XV, § XVI), ratified 2026-10-14 | A panel grows to its size limit before it scrolls or truncates; the Inspector's limit is the size the player chose. The UI grows by adding entries: one list per kind, a missing entry fails a named test, an unknown kind shows a plain fallback, fields render through shared section shapes, each list gets a row in `Docs/design-system/extending.md`. |
| THR-1876's own description, additions of 2026-10-14 (Christian asked whether the Inspector has a system for iterating each page's layout) | One page-layout table for every subject (extend `DETAIL_PAGE_REGISTRY` to army, the land page, the god's sheet and content cards, with per-width visibility); the Inspector lab `?view=inspector-lab`, one real example per kind plus a stress case, at docked / wide / Full and 1080p / 1440p; it replaces the style guide's hard-coded sample page. |
| Attended session 2026-10-14 (shared brief for the five carve-up plans) | **Christian asked in chat for the five carve-up plan docs to be written now, in parallel.** That waives the design lane's one-day veto window on the lane-made decisions they build on (THR-1828, THR-1829, THR-1830, THR-1831, THR-1832, THR-1833). Those decisions are settled input here; their veto stays open in chat but does not block this plan. Ownership: this plan owns the arming flow and target lighting, the land page, Find; THR-1875 owns the hand's place and size in the god rail, the Needs-you UI and the top bar's Find slot; THR-1878 owns the map's lens layers, place icons on the map and the camera's one centring jump; THR-1879 owns the icon registry and its shapes; THR-1877 owns what the Stage does to the Inspector while a moment plays. |
| Coordination comments on THR-1876, 2026-10-14, from the parallel plan sessions | **THR-1875 (frame):** the Ledger rail auto-folds from a `GameScreenState` boolean (this plan names it `inspector.open`); while the Inspector is open a strip press opens the Ledger as a **flyout** over the Inspector's edge, and the escape order becomes armed card → flyout → top dialog → full → wide → docked; each hand card calls `useHandPress()(cardId)` from a `HandPressContext` whose default provider opens the card's Codex entry — the arming flow replaces that provider, and the rail reads the armed card's id to draw it selected; Find mounts as a `find` entry in `TOP_BAR_ITEMS` / `TOP_BAR_COMPONENTS` (`src/data/frame-registry.ts`) in a reserved centre slot (≥ 15rem), and the Inspector's and Find's keys join the frame's duplicate-key test; the god's name in the rail calls `onOpenSheet`; whichever build lands first moves `ascendant-bar/selectors.ts`. **THR-1878 (lenses and chrome):** lens layers add no pick targets, so a lit hex's click reaches this plan's land-page route with no route of their own (THR-1830 § 7); one camera jump, `CAMERA_CONSTANTS.FOCUS_ZOOM` (10) and a `focusOn(hex)` method on the map handle, which the Inspector's "Show on map" calls; arming sets one flag, `lensSuppressed`, in `GameScreenState`, the lens layer hides while it is set and the lens bar keeps its pressed state, so two dims never stack (THR-1830 § 2). |

## Why this is load-bearing

Today a thing in the world has nine homes: a 280 px column, six centred sheets, a stack of cards, and two whole-screen views that hide the map. The same router arm opens four different behaviours (an agent opens the card drawer, a location swaps the screen, a hex only moves the camera, a faction opens a modal), the chain city → temple → priest → faction breaks in four places, and two of the game's card kinds (places within a city, artifacts) have no surface to be cast from at all. Every new field so far meant editing one of nine components. The Inspector replaces all of them with one panel that every link, card, search and map click opens, built from **one page-layout table** — so adding a field, moving a section or deciding which width shows it is one table row, visible in the lab the moment the file is saved (Law 58). It is also the largest single deletion in the overhaul (the retiring files are about 11,000 lines), and the surface the screen frame, the lenses, Find and the Stage all hand off to.

## Substrate inventory

Step 0.6 greps (`main` @ `0afcfc2b`): `inspector` in `src/` — 0 hits outside comments; `src/engine/views/` — not yet on `main` (THR-1822 slice 1 creates it); `inspector-lab` — 0 hits. This plan **extends** the subsystems below; it builds nothing green-field except the Inspector's own components.

| Existing subsystem (inventory name / module) | Status | This plan |
|---|---|---|
| Detail pages — `DETAIL_PAGE_REGISTRY` (`src/data/detailPageTemplates.ts`), `generateDetailPage` (`engine/detailPageGenerator.ts:92`), resolvers (`engine/detailPageResolvers.ts`, 1,156 lines), `generateContentPage` (`engine/contentPageGenerator.ts:117`), `Section.tsx` (the section dispatcher) | 🟢 ACTIVE | **extends**: the registry becomes the one page-layout table for every subject — three page kinds join (`land`, `god`, `record`), `content` gets rows, entries gain `visibleAt` and `tab`; two section shapes join (`links`, `cards`) and `panel` rows gain optional refs and a meter; labels move to sentence case at the source (§ D6, § D7) |
| Ref router — `useRefRouter` (`hooks/useRefRouter.ts`, THR-1482 / THR-1490), `SURFACE_BY_WORLD_REF` (`data/surface-registry.ts`) | 🟢 ACTIVE | **extends, never replaces**: `card` opens the Inspector docked, `sheet` opens it wide (content refs still open the Codex); the registry gains an `opensAt` column (§ D4) |
| View-model seam (THR-1822) — `readView`, `hexContents`, `views/subjects/*`, `connections.ts`, `landIndex.ts`, `findIndex.ts`, `knowledge.ts` | 🟠 PLANNED (slice 1 Ready for Dev) | **builds** the step-4 families THR-1822 typed (subjects, Connections, *In this land*, Find, the seen floor) and adds one: `armedTargets.ts` (§ D9) |
| Targeting — `getTargetActionSlots` (`engine/targetActions.ts:308`), `targetContextBuilders.ts`, `preparePlayerCast` / `commitPlayerCast` (`engine/playerCastDispatch.ts:113`, `:210`) | 🟢 ACTIVE (two builders 🟠 dormant: sublocation, artifact — no callers) | **extends**: the Act row, the row tray and card-first arming all read `getTargetActionSlots`; the dormant sublocation and artifact builders get their first callers; one inverse helper (card → its targets) is added beside it |
| Hex chronicle prose (`HexChronicle.tsx`, 1,329 lines — inline memos) | 🟢 ACTIVE (as a view) | **moved, output unchanged**: The land / Its soul / What came before become `land` registry resolvers in the engine (golden test) |
| God's sheet data — `ascendant-bar/selectors.ts` (531 lines), `AscendantSheet.tsx` (610) | 🟢 ACTIVE | **moved** (`views/subjects/godSheet.ts`, re-exported from the old path) and read by the `god` rows |
| Dominion sheet rows — `dominionSheetVM` (`engine/dominionViewModels.ts:122`) | 🟢 ACTIVE | **reused, not forked**: one facts row on every page that has a band |
| Interrupt registry (`components/Game/interruptRegistry.ts`) and clock holder (`resolveClockHolder`, `data/nudge-stage-content.ts:292`) | 🟢 ACTIVE | **extends**: Full joins as a clock-holding surface named "the full view" (§ D2) |
| Escape stack (`shared/useEscapeLayer.ts`; THR-1821 adds bands) | 🟢 ACTIVE | **extends**: the armed card and the Inspector sizes register their layers |
| Gift hold surfaces (`GIFT_HOLD_SURFACES`, `data/ascendant-beat-content.ts:68`) | 🟢 ACTIVE | **extends**: the retired surfaces leave, `InspectorFull` and `ArmedCard` join |

Population consumed (seed 42, medium, tick 30 — THR-1822's measurement): 254 Locations, 830 Places, 12 Areas, 548 individuals, 52 factions, 8 groups, 235 artifacts, 768 hex tiles. Every one of them is a subject the Inspector can open; the lab picks one real example per page kind from the same world.

## What exists today (measured, `main` @ `0afcfc2b`)

| Fact | Evidence |
|---|---|
| **Nine homes for a thing.** Detail column (`ThreadDetailView` 1,182 lines, `HexDetailView` 432) at `GameView.tsx:6103-6161`; sheets `AgentProfileModal` 358 + seven tabs (Overview 955, Prowess 219, Attachments 399, Bonds 348, Journey 248, Chronicle 240, Chapters via `ChapterLedger`), `LocationProfileModal` 357, `FactionSheet` 981, `ArmySheet` 146, `ArtifactSheet` 274, `AscendantSheet` 610, `AttachmentDetailView` 338; the `DetailModal` stack 392 (+ context 119, breadcrumb 108); the `location` view (`LocationView` 1,769) and `hex-zoom` view (`HexBreadcrumb` 182, `HexSidebar` 664, `HexChronicle` 1,329, `useHexZoomData` 146) | Explore survey of `GameView.tsx` (6,882 lines) |
| **The router's `sheet` arm is four behaviours.** agent → `handleAgentSelect` (`useAgentInteraction.ts:295`, opens the card drawer, not the profile); location / sublocation → `viewLevel = 'location'` (`useViewNavigation.ts:118`); hex → camera only (`GameView.tsx:1408`); faction / army / artifact → `setStubModalState` | `useSheetOpeners` `GameView.tsx:4568-4580` |
| `LocationProfileModal` is unreachable from the router; `generateDetailPage` cannot build a hex (no node — `unknownStub`) | `GameView.tsx:6473`, `detailPageGenerator.ts:119-122` |
| **Map clicks.** Agent sprite → `handleThreadNodeSelect` (select + drawer); army → `handleOpenProfileModal` (sheet); any hex → `handleHexSelect` → the detail column plus an auto-opened card drawer targeting the bare hex even when a city stands on it; place labels are not clickable (`pointer-events: none`) | `HexMapV2.tsx:1891-1937`; `GameView.tsx:735, 2097-2103`; `LocationLabelOverlay.tsx:12,112,344` |
| **Casting today.** Two `ActionDrawer` mounts, both subject hands (agent `GameView.tsx:6032-6046`, non-agent `:6048-6061`); arm → Cast (Law 48, `ActionDrawer.tsx:239-249`); fire paths `handleWheelSlotClick` (`useAgentInteraction.ts:301-461`) and `handleNonAgentSlotClick` (`GameView.tsx:4869-4939`), both `preparePlayerCast` → `commitPlayerCast` | Explore survey |
| **No card → targets function exists**; every surface goes target → `getTargetActionSlots` → cards. `buildSublocationTargetContext` and `buildArtifactTargetContext` have no callers, and the sublocation builder sets `subtype` to the category while the gate expects `'sublocation'` (`targetActions.ts:365`), so it would not match as written | `targetContextBuilders.ts:81, 167` |
| **Range applies only to bare-land cards.** `buildActorTargetContext` and `buildLocationTargetContext` set `position: null`, so person and place cards read `rangeStatus: 'unlimited'`; only hex targets check `DEFAULT_LOCAL_RANGE` (3). The card face words an out-of-range reason as "Too far from here." | `targetActions.ts:151, 500-510`; `action-card-display.ts:186-195` |
| The god rail's Self / Rare rows render with no `onFire` (dead buttons, Law 25) | `AscendantBar.tsx:254-260` |
| **No drag and drop anywhere**; no multi-hex highlight prop on the map (the Dominion lens's dim plates are the reusable layer); **no `FOCUS_ZOOM` constant** — the eye uses `RETINUE_EYE_ZOOM_SCALE = 20` (`GameView.tsx:2311`) while THR-1831 decided one centring zoom k = 10 | Explore survey |
| Escape bands in use: 10 detail panels, 40 drawer, 50 veil, 60 modal | `useEscapeLayer.ts:22`; `ActionDrawer.tsx:65`; `Modal.tsx:19` |
| **Facts told two ways today (PC-6):** danger has two word ladders (`dangerLabel` vs `POSITIONAL_DANGER_WORDS`); place prose has three sources (`generateEntityProse`, `archetypeProseFlavor`, `flavorText`); place conditions have two substrates (`has_trait` edges vs `properties.conditions`, which nothing writes on places); "who is here" has two rules; the essence balance is numerals in the rail and words on the sheet | place / person / power field inventories (Explore, this session) |
| **Raw numbers and keys on the sheets today (Law 13/14):** "N TURNS AGO", "at tick N", "On tick N" (registry `recent_actions`, `memory`, `what_happened` fallback), FactionSheet stat grid and Reach scores, "(N slots)", raw `status`/`actionType`/`outcome`/`subtype`; "Wilderness (18, 11)" and "(col, row)" in hex headers and the covenant fallback; raw `locationSubtype`, sphere keys, resource keys; "(n/max)" and "active · step N" on the person sheet; `mechanicalSummary` magnitudes on the attachment sheet | inventories |
| **Dead rows and wrong fields:** `notable_capabilities` reads `properties.reaches` (no actor writer); `place_painting` reads `paintingUrl` (never written); `what_they_are_doing` reads `objective.targetId` but the army type declares `targetNodeId` (`detailPageResolvers.ts:988`, `types/army.ts:73`) | inventories |
| `HexChronicle`'s "Discovered sites" and "Release" never render: GameView passes neither `hexRevelation` nor `onReleaseEffect` | `GameView.tsx:5973-5997` |
| `styleguideSync.test.ts:182-253` (`ROUTED_SHEETS`) fails unless production code imports the seven sheets | Explore survey |

UI Laws that bind: 1, 3, 4, 8, 12, 13, 14, 17, 20, 21, 22, 23, 24, 25, 33, 36, 47, 48, 50, 51, 52, 53, 57, 58.

## Decisions

### D1 — Where the Inspector lives

- **Host.** `src/components/Game/inspector/InspectorHost.tsx`, mounted by GameView's composition root (after [THR-1881](https://linear.app/threadbare/issue/THR-1881)) in the layout grid **between `map/GameMap.tsx` and `frame/LedgerRail.tsx`**: god rail | map | Inspector | Ledger strip, the order THR-1828's mock draws. THR-1881 names no Inspector host; this plan adds it, which is what THR-1822 § D16 means by "each new build edits its own file (`inspector/`)".
- **Shared state.** The Inspector's subject, history, size and pin, and the armed card, live in THR-1881's `GameScreenState` context (a reducer), because the map, the god rail, Find and the Inspector all read them. Slice (§ D16 S3) adds two reducer slices:

```ts
type InspectorSize = 'docked' | 'wide' | 'full';
type InspectorSubject = AnyRef | { kind: 'event-node'; nodeRef: NodeRef };   // graph events have no WorldRef (fromGraphNode returns undefined)
interface InspectorEntry { subject: InspectorSubject; key: string; name: string; tab: InspectorTabId }
interface InspectorState {
  history: InspectorEntry[];      // ≤ INSPECTOR_HISTORY_MAX; index -1 = closed (call: "nothing open, no panel")
  index: number;
  size: InspectorSize;
  sizeBeforeFull: 'docked' | 'wide' | null;
  pinned: boolean;
  expandedGroups: Record<string, true>;   // `${entryKey}:${groupId}` — "Show all" pressed; ephemeral (Law 51 lets view state reset)
}
type ArmOrigin = 'hand' | 'act_row' | 'tray' | 'find' | 'drag';
interface ArmedCardState { actionId: string; origin: ArmOrigin; target: WorldRef | null }   // null = card-first, target not chosen yet
// GameScreenState also carries, for the other hosts to read:
//   inspector.open: boolean      — THR-1875's Ledger rail folds from it
//   armed: ArmedCardState | null — THR-1875's hand draws the armed row selected from armed.actionId
//   lensSuppressed: boolean      — true while a card is armed; THR-1878's lens layer hides, its bar keeps its pressed state
```

- **The god's own sheet** is the subject `{ kind: 'agent', id: ascendantId }` — the dispatcher sees the ascendant and builds the `god` page (THR-1822 § D7). No new WorldRef kind.
- **The Ledger rail folds while the Inspector is open** (call 6). The Inspector publishes `inspector.open` in `GameScreenState`; THR-1875's frame build folds the rail to its 56 px strip from it, and a strip press then opens the Ledger as a flyout over the Inspector's edge (THR-1875's — the rails plus a docked Inspector would leave the map 35 % at 1080p). If S3 lands before THR-1875's strip, the composition root hides the right rail while the Inspector is open, and THR-1875 replaces that one condition with the strip.
- **The map canvas shrinks** as a flex item. Opening a map-located subject eases the camera **only if** the subject's hex would sit outside the visible map rect after the resize (`HexMapV2.centerOn`, its 500 ms ease; cut under reduced motion, Law 44). The subject's hex carries the existing single-hex selection ring ("his hex stays lit", mock).

### D2 — Sizes

| Size | Width | Columns | Opens when | Time |
|---|---|---|---|---|
| **Docked** | `--inspector-w` (560 / 717) | one: header → Act → body tabs → Connections | `card` (default) | unchanged |
| **Wide** | `--inspector-wide-w` (960 / 1280) | two through `SheetColumns` (`SheetLayoutContext = 'two'`): aside = header, Act, facts (*In this land* on the land page); main = tabs, body, Connections | `sheet`; and `card` for kinds whose `opensAt` is `wide` (factions, past events — call 12) | unchanged |
| **Full** | fills the map region right of the god rail (no width token, THR-1819) | three: trail column `--inspector-full-trail-w` · the page (two columns, `flex: 1`, prose capped at `--measure-prose`) · Connections aside `--inspector-full-aside-w` with the locator | **only on request** (call 10): the widen button or `W` | **paused** (call 11) |

- **Cycling.** `W` and the widen button step docked → wide → full → docked. **Esc** steps one down: full → `sizeBeforeFull`, wide → docked, docked → closed. The Inspector never widens itself (Law 57); the only size it picks is the opening size from `opensAt`, and opening a new subject never narrows a wider current size.
- **Full holds the clock.** `InspectorFull` joins `INTERRUPT_SURFACES` (`isOpen: s => s.inspectorFull`) and `INTERRUPT_HOLDER_NAMES` (`InspectorFull: 'the full view'`), so the TIME readout reads "held by the full view · runs on when it closes" (or "· stays paused") through the existing `clockHeldStatus` — Law 52 names the cause, and leaving Full restores whatever the clock was doing (the mock's "starts again when you leave").
- **A pause-tier interrupt closes Full** (call 10). When `resolveInterrupts(...).open` holds any id other than `InspectorFull` while Full is open, the host steps to **docked** on the same subject (the mock: "leaving puts you back on the map, docked on the last thing you read"). What the Stage then does to the docked Inspector while its moment plays is THR-1877's rule.
- **The top bar and the god rail stay visible in Full** (call 11). The god rail's hand stays live, so a card can be armed while reading.
- **The locator** in Full's aside is THR-1878's minimap component centred on the subject's hex with a ring; clicking it drops to docked and flies there. Until the minimap exists, Full renders no locator (Law 25).
- **Panel shell.** `Panel level="panel"` docked and wide, `level="page"` in Full (THR-1821's hierarchy table).

### D3 — Moving through it

- **History, not containment** (call 3). Back / forward buttons and Alt+← / Alt+→ walk `history`. Opening a subject while not at the end of history drops the forward entries (browser rule). `INSPECTOR_HISTORY_MAX` entries; the oldest falls off.
- **The trail** in the toolbar shows the last `INSPECTOR_TRAIL_CRUMBS` steps as links; when there are more, a leading "…" opens the whole history as a list (Law 57: the one-line trail is at its limit; the rest is one click away). In Full the trail is the left column, every step listed.
- **The "where" line** under the name carries containment, innermost first, each a link: "At Temple Quarter, in The Bone Coast" (`SubjectHeaderVM.whereLine`).
- **Pin** (call 4). While pinned, a map click does not replace the subject: it highlights the clicked thing and shows its hover card. Links inside the Inspector still navigate. **Find replaces a pinned subject** (THR-1832 § 3: a search is a deliberate ask). **While a card is armed, map clicks choose a target instead** (§ D9).
- **Show on map** (the eye, Law 22) calls the map handle's `focusOn(hex)`, which flies to `CAMERA_CONSTANTS.FOCUS_ZOOM` (10 — THR-1831's one centring zoom; THR-1878's camera slice adds both, and if S3 lands first it adds them in the same place under the same names). The Inspector never uses `RETINUE_EYE_ZOOM_SCALE`. Moving subjects (people, armies) also get **Follow**, the profile's existing camera follow (`followState`), as a toggle beside the eye.
- **Escape order** (THR-1827, with THR-1875's flyout): armed card → Ledger flyout → top dialog → Find box → full → wide → docked → closed. Bands through THR-1821's `useEscapeLayer(active, onEscape, band, label)`: the armed card registers **above the modal band** (THR-1821 adds one `armedCard` entry to `Z_BAND`); the flyout is THR-1875's; the Find box at the popover band; the Inspector's three steps at the panel band.
- **Focus** (Law 50, non-modal): opening moves focus to the page heading; closing returns it to the invoker (the element `open` was called from, kept in the reducer entry). Tab order stays in the document; the Inspector does not trap focus.
- **Hotkeys**, skipped while an input has focus (the `isInputActive()` guard of `useTopBarHotkeys.ts:23`): `W`, Alt+←/→, Esc; Find's Ctrl+K and `/` (§ D11). Handled in `inspector/useInspectorHotkeys.ts`; each key is also declared as an entry in THR-1875's frame key list so the frame's duplicate-key test sees it (THR-1875 coordination comment).

### D4 — The router: build on `useRefRouter`, never replace it

`useRefRouter` stays the only thing that opens anything (Law 21). Its arms change target, not shape:

| Mode | Today | After |
|---|---|---|
| `card`, world ref | `generateDetailPage` → `stack.push` (DetailModal) | `cfg.openInspector(ref, row.opensAt ?? 'docked')` — the Inspector builds the page itself through `useView('subjectPage', subject)` |
| `card`, content ref | `generateContentPage` → `stack.push` | `cfg.openInspector(ref, 'docked')` — the short content card |
| `sheet`, world ref | `cfg.openSheet(toNavigationTarget(ref))` — four behaviours | `cfg.openInspector(ref, 'wide')`; **except** `encounter`, which first asks `openSheet` (a *live* encounter opens on the Stage, THR-1829) and falls back to the Inspector record page when it is not live |
| `sheet`, content ref | `cfg.openCodexEntry(id)` | unchanged — the Codex keeps its own home |
| `hover` | HoverCard, suppressed while the stack is open | HoverCard, suppressed while a dialog is open (the escape stack's top band ≥ modal) |

- `RefRouterConfig` gains `openInspector?: (subject: InspectorSubject, size: 'docked' | 'wide') => void`. Absent (style guide, tests) keeps today's stack push, so the router's tests keep passing until S4 deletes the stack.
- **The surface registry gains one column**, `opensAt?: 'docked' | 'wide'` (absent = docked): `faction`, `encounter`, `journey`, `receipt` read `'wide'` (call 12 — "past events"). **Cultures** open wide by the same row: a culture has no WorldRef and resolves to its Realm faction (`resolveCultureRealm`, `useDetailNodeRefOpener.ts:41`), whose row is `wide`. `SheetTarget` gains `'inspector'`, and every world row except `encounter` moves its `sheet` to `'inspector'`; `companion`'s withholding note is updated (the Inspector shows the companion's own page, so neither wrong opener is involved any more). `canOpen(ref, 'sheet')` is then true for every world kind.
- **A graph event node** (an `event-card` section's `NodeRef`, which `fromGraphNode` cannot name) opens as `{ kind: 'event-node', nodeRef }` through the same `openInspector` (S3 changes `useDetailNodeRefOpener` to call it).
- **Callers keep their call**; what they reach changes. The full re-route table is § D13.

### D5 — Page anatomy (one order for every kind)

1. **Toolbar:** back · forward · trail · pin · eye (and Follow for moving subjects) · widen · close.
2. **Header** (`SubjectHeaderVM`, THR-1822, extended here): `EntityVisual` (portrait 3:4 for people, gated by Law 8; hero 16:9 for places, land and records; heraldry for powers) · kind word · **name** (Cinzel, `--text-2xl`) · epithet when known · "where" line · **standing chips** (`Chip role="state"`: court position, knowledge word, attunement, the Dominion band word, rarity) · **doing line** (what the subject is doing now, one sentence).
3. **Act on <name>** (call 1): the subject's cards, sphere-tinted (§ D9).
4. **Body**: the registry sections visible at this size, grouped into **tabs** (`Tabs kind="tabs"`) when they span more than one tab; a page whose visible sections sit in one tab draws no tab bar (Law 25).
5. **More when widened** — one line listing the tabs or sections that are hidden at this size but visible at a wider one, as a button that widens: "More when widened: Chronicle · Chapters". Never shown when nothing is hidden.
6. **Connections** (call 8), always last.

**The land page differs only in its fixed order** (call 16): toolbar → header (name, lede, facts chips) → **In this land** → **Act on this land** → description (the land rows) → **Around it** (its Connections block, titled so).

**Section labels** render bold, sentence case, `--text-xs`, no tracking (THR-1833). Today they are ALLCAPS strings in the resolvers ("DISPOSITION TOWARD HER") plus `text-transform: uppercase` in `SectionLabel` (`Section.tsx:20-40`); both change **at the source** in S1 — the strings to sentence case, `SectionLabel` to the label rule. `Section.tsx` is a kept shared primitive, so this is the Inspector's "when touched" migration, not THR-1879's sweep (named in Mutex).

### D6 — The page-layout table

`DETAIL_PAGE_REGISTRY` is the **one list** for what a page shows (Law 58). Additive changes (S1):

```ts
// src/types/detailPage.ts
export type PageSurface = 'hover' | 'docked' | 'wide' | 'full';     // the hover card is the fourth width
export type PageLayoutKind = GraphPageKind | 'content' | 'land' | 'god' | 'record';
export type SectionKind = 'prose' | 'chips' | 'event-card' | 'panel' | 'portrait' | 'triggers' | 'links' | 'cards';

// src/data/detailPageTemplates.ts
export interface SectionSchemaEntry {
  typeId: string; order: number; mandatory: boolean;
  defaultResolver: SectionResolver; showcaseOverridable: boolean; fallbackResolver?: SectionResolver;
  /** Where this section shows. Absent = every surface (today's behaviour, hover card included). */
  visibleAt?: readonly PageSurface[];
  /** Which Inspector tab it sits in. Absent = 'overview'. */
  tab?: InspectorTabId;
}
export type DetailPageRegistry = Record<PageLayoutKind, SectionSchemaEntry[]>;   // a kind without rows is a type error
export const INSPECTOR_TAB_LABELS: Record<InspectorTabId, string>;                 // closed union, total by type
```

- **The dispatcher filters, the producer never drops.** `generateDetailPage` (and the new `generateLandPage`, `generateGodPage`, `generateRecordPage`, all sharing one extracted `composeSections(kind, ctx)` loop) carries `visibleAt` and `tab` onto each `Section` unchanged; the Inspector filters by its current size, the HoverCard by `'hover'` (still capped at `HOVER_CARD_MAX_SECTIONS`). THR-1822 § D7's contract.
- **Resolver context grows additively**: `SectionResolverContext` gains `subject: InspectorSubject` and an optional `state: GameState` (the land, god and record rows need GameState stores; a resolver that needs `state` and lacks it returns `null`, so the hover card and tests stay fail-soft).
- **The shared section shapes** (Law 58: "fields render through a few shapes"). Each is one renderer arm in `Section.tsx`, a styleguide entry and a `component-selection.md` row (Law 29):

| Shape (`kind`) | Law 58 name | Carries | Renders through |
|---|---|---|---|
| `prose` | prose | finished prose, `termRefs` for linked words; optional `variant: 'body' \| 'quote' \| 'lede'` (additive) | Alegreya at `--text-base` (THR-1833) |
| `panel` | facts | rows `{ left, right, sentiment? }` + **additive** `ref?: WorldRef`, `tooltipId?`, `meter?: number` (0–1, drawn as a bar beside the word — the word always present, Law 13's unitless-proportion ruling) | label/value rows |
| `links` (new) | links | `rows: RefRow[]` (THR-1822's row), optional `groups: { label, rows, total }[]`, `foldAfter` | `Chip role="identity"` + fact + eye |
| `chips` | chips | `ChipDescriptor[]` | `Chip`: identity when `clickRef`, keyword for tags, state otherwise |
| `cards` (new) | cards | `tiles: { ref?, visual?, title, kindWord, lines: string[], meter?, durationWord? }[]` | `Card` + `EntityVisual` at the card's 16:9 band (Law 5) |
| `event-card` | story | `whenLabel` (words — `elapsedLabel`, never "N turns ago"), prose, `eventRef` | story row |
| `triggers` | — | `TriggerRow[]` with odds pips (Law 15) | unchanged |
| `portrait` | — | portrait + prose | **in the Inspector, its prose only** — the header owns the subject's one image; the hover card keeps both |

- **Tabs.** `InspectorTabId = 'overview' | 'prowess' | 'attachments' | 'bonds' | 'journey' | 'chronicle' | 'chapters' | 'here_now' | 'story' | 'reaches'`; labels "Overview", "Prowess", "Attachments", "Bonds", "Journey", "Chronicle", "Chapters", "Here now", "Story", "Reaches". A tab renders when at least one of its sections is visible at the current size; tab order is the lowest `order` among its sections. **No tab row may overflow its width** (THR-1821: tabs never scroll sideways) — the lab measures it, and per-width visibility is how a long tab set fits docked (the person's Chronicle and Chapters are wide-and-full, so docked shows five tabs and the "More when widened" line — the mock's "More ▾").
- **Law 57 inside a size: fit, then fold.** In wide and Full every group shows whole (call 9; THR-1820 § 2 row for the Inspector). Docked shows every group whole **unless** the page would overflow the docked column's height; then it folds groups longer than `CONNECTIONS_DOCKED_FOLD_AFTER` to that many rows plus "Show all N", **largest group first, one at a time, until the page fits** or every long group is folded; only then does the column scroll inside itself (Law 33). The fold plan is a pure function `planFolds(groupHeights, available, foldAfter)` (Node-tested); the host measures with `ResizeObserver`. A fold the player opens ("Show all N") stays open for that entry (`expandedGroups`). *In this land* is never folded by count (THR-1820).
- **A relation lives in one place.** Body sections describe the subject (its own facts, prose, conditions, works, story); **links to other world things live in Connections**. A section never lists what a Connections group lists. This is what keeps "who is here" one fact told one way (PC-6) and is why several sheet lists below map to Connections rows rather than tabs. Where a sheet showed a relation with extra facts (a bond's trust word, a member's rank, a place's occupants), the extra fact becomes that Connections row's one plain `fact`.

### D7 — The rows: every subject page

Columns: **order · `typeId` · tab · shape · visible at · source**. "all" = hover, docked, wide, full; "D·W·F" = the three Inspector sizes; "W·F" = wide and Full. *existing* = a row on `main` today; *moved* = data that a retiring sheet computes today, now a resolver in `src/engine/detailPageResolvers.ts` (or a `views/subjects/` helper it calls) — no surface reads the graph (THR-1822). Every row also passes THR-1822's shared no-numbers check. **S1 builds the rows marked S1; S2a and S2b port the rest** (§ D16). The field-by-field parity rule that S2 must clear is § D7.11.

**D7.1 Person** (`actor`; class Person) — tabs Overview · Prowess · Attachments · Bonds · Journey · Chronicle · Chapters (the profile's seven).

| ord | typeId | tab | shape | at | source | slice |
|---|---|---|---|---|---|---|
| 10 | `portrait_with_disposition` | overview | portrait | all | *existing* (its `dispositionPhrase` has no writer, so the fallback template speaks; kept) | S1 |
| 15 | `fate` | overview | prose | D·W·F | *moved* `getAgentInfoCard` death cause / by / past line (`agentDetail.ts:1615-1625`) — dead people only | S2a |
| 20 | `story_so_far` | overview | prose | D·W·F | *moved* `useThreadStorySoFar` (threaded people only) | S2a |
| 25 | `revealed_notices` | overview | prose | D·W·F | *moved* `revealedNotices` (ThreadDetailView) | S2a |
| 30 | `under_your_hand` | overview | chips | D·W·F | *moved* `activeEffects` + court position (`agentDetail.ts:1902-1954`) | S2a |
| 35 | `intention` | overview | prose | D·W·F | *moved* "Set on …" — **one gate**, `canReadIntention` (the column showed it ungated, the profile gated; PC-6) | S2a |
| 40 | `who_they_are` | overview | panel | D·W·F | *moved* archetype word, calling, means word, god mark, rite line (R+) | S2a |
| 42 | `dominion` | overview | panel | D·W·F | `dominionSheetVM`, row variant (the profile's Dominion line) | S1 |
| 45 | `allegiance` | overview | panel (+meter) | D·W·F | *moved* hold line and grip word, faction standing word + bar (K+). The faction itself and its rank word are the Connections *belongs to* row | S2a |
| 50 | `company` | overview | prose | W·F | *moved* company / army / network cohesion and rivals sentences | S2a |
| 55 | `nature` | overview | panel | D·W·F | *moved* top values words | S2a |
| 60 | `core` | overview | panel (+meter) | W·F | *moved* the five core tracks, each a word and a bar (I+) | S2a |
| 65 | `personality` | overview | panel + chips | W·F | *moved* axes and traits (I+) | S2a |
| 70 | `reputation` | overview | panel | D·W·F | *moved* reputation word and notable standings (link + band word) | S2a |
| 75 | `words` | overview | prose (quote) | W·F | *moved* `generateQuotes` (K one, I+ all) | S2a |
| 80 | `origin` | overview | prose | W·F | *moved* `backstoryParagraph1` (I+) | S2a |
| 100 | `domains` | prowess | cards | D·W·F | *moved* `card.domains` — rank word per Reach; **the magnitude dots go** (Law 10: pips mean odds only) | S2a |
| 110 | `conditions` | prowess | cards | D·W·F | *moved* condition vignettes, duration word + bar | S2a |
| 120 | `bestowed_powers` | prowess | cards | D·W·F | *moved* `giftsAndBurdens` | S2a |
| 200 | `slots` | attachments | cards | D·W·F | *moved* slot groups (sealed line, sign line, counterparty link, spells); "(n/cap)" becomes the group header count | S2a |
| 210 | `knows` | attachments | panel | D·W·F | *moved* spells known (name, tradition, provenance) | S2a |
| 220 | `inactive` | attachments | cards | W·F | *moved* inactive attachments | S2a |
| 300 | `what_she_is_to_him` | bonds | prose | all | *existing* — raw `basis` worded at source | S1 |
| 310 | `threads_between_them` | bonds | chips | D·W·F | *existing* — raw `basis` flavour worded at source | S1 |
| 320 | `disposition` | bonds | panel | D·W·F | *moved* strategy + reputation (I+ or revealed) | S2a |
| 400 | `the_work` | journey | cards | D·W·F | *moved* `summarizeActiveUndertakings` | S2a |
| 410 | `designs` | journey | panel | D·W·F | *moved* strategic projects and controls with progress words (`strategicPresentation.ts:200, 317`) | S2a |
| 420 | `ambitions` | journey | cards | D·W·F | *moved* `intents` — raw priority key worded | S2a |
| 430 | `arc_so_far` | journey | event-card | D·W·F | *moved* `getAgentArc` | S2a |
| 500 | `their_story` | chronicle | prose | W·F | *moved* `generateTieredBackstory` with its locked placeholders | S2a |
| 510 | `timeline` | chronicle | event-card | W·F | *moved* (T) — raw move keys worded at source | S2a |
| 520 | `full_account` | chronicle | prose | W·F | *moved* (T) | S2a |
| 530 | `interaction_record` | chronicle | event-card | W·F | *moved* (T) | S2a |
| 540 | `completed_ambitions` | chronicle | event-card | W·F | *moved* | S2a |
| 550 | `intelligence` | chronicle | cards | W·F | *moved* intelligence records (`intelligence.ts:281`); "(targetKind)" worded, "+N more" becomes a fold | S2a |
| 600 | `chapters` | chapters | event-card | W·F | *moved* this person's chapter rows (`ChapterLedger.tsx:151-195`); a row opens the Chapter Ledger dialog at that chapter (its home, THR-1828); "active · step N" becomes the step's word | S2a |
| — | `recent_encounters` | — | event-card | hover | *existing*, hover only (Chapters supersede it in the Inspector); "N turns ago" → `elapsedLabel` | S1 |
| — | `faction_allegiances` | — | chips | hover | *existing*, hover only; rank printed as the rank word (THR-1822 § D7 fix) | S1 |
| — | `notable_capabilities` | — | — | — | **retired**: reads `properties.reaches`, which no actor writes; `domains` replaces it | S2a |

Header (not rows): portrait (Law 8), role word from `npcRole` (fixes "wanderer"), archetype epithet (I+), where line, standing chips (court position, knowledge word, "Attuned to Veil", Dominion band word, rarity), doing line (activity). **Connections** (THR-1822 recipe): where; who (kin, friends, mentors, companions — the profile's Companions list moves here); belongs to (factions + rank word, company/army, culture → its Realm, the thread from the god); friends and foes (relations by sentiment, grudges — the Bonds tab's Relationships and Blood); holds and knows (possessions, bonded artifacts, secrets, favours owed — the Bonds tab's Agreements); story (events, ambitions pursued).

**D7.2 Location, Place and Area** (`place`; class Location) — tabs Overview · Here now · Story.

| ord | typeId | tab | shape | at | source | slice |
|---|---|---|---|---|---|---|
| 5 | `place_painting` | — | portrait | hover | *existing*, hover only (the header owns the image; `paintingUrl` has no writer) | S1 |
| 10 | `place_prose` | overview | prose | D·W·F | *moved* `generateEntityProse(id, 'full')` — **the one place prose** (LocationView, the city view, the sublocation drill-down) | S2b |
| 12 | `what_this_place_wants` | — | prose | hover | *existing*, hover only; raw sphere key worded at source | S1 |
| 15 | `past_line` | overview | prose | D·W·F | *moved* `buildPlacePastLine` | S2b |
| 20 | `livelihood` | overview | prose | D·W·F | *moved* resource tiers + sustenance voice (`LocationView.tsx:959-1027`) | S2b |
| 25 | `dominion` | overview | panel | D·W·F | `dominionSheetVM` (with the tend line) — the one Dominion row, also on faction, artifact and person pages | S1 |
| 30 | `contested` | overview | prose | D·W·F | *moved* essence-source contest / desecration (when present) | S2b |
| 35 | `walls` | overview | prose | D·W·F | *moved* fortification (when present) | S2b |
| 40 | `conditions_here` | overview | cards | D·W·F | *existing row, source replaced*: `readActiveConditions` (`has_trait` edges, the modal's source) instead of `properties.conditions`, which nothing writes on places | S2b |
| 45 | `standing` | overview | panel | D·W·F | *moved* "Your reputation here" (`getReputationWith`), hidden when default | S2b |
| 50 | `place_of_power` | overview | panel + chips | D·W·F | *moved* `PlaceOfPowerInspector` (subtype `place_of_power` only) | S2b |
| 55 | `area_facts` | overview | panel (+meter) | D·W·F | *moved* for an Area: size word, feature word, positional danger, its sphere strengths (words + bars) | S2b |
| 100 | `guild_postings` | here_now | cards | D·W·F | *moved* `GuildQuestPanel` | S2b |
| 110 | `encounters_here` | here_now | event-card | D·W·F | *moved* active and available encounters here ("step N" → step word; raw `crudType`/`reach` worded) | S2b |
| 200 | `memory` | story | prose | D·W·F | *existing* — "at tick N" → `elapsedLabel` | S1 |

Header: hero (`resolveEntityVisual`), kind word ("Temple quarter"), name, where line (its Location, Area), standing chips (rarity, held by, Dominion band word), doing line ("Two people keep the quarter."). **Connections**: where (parent chain → Area → its land page); who (people here, by role — the city view's Inhabitants and Agents Present); belongs to (holder, culture → Realm, pilgrim ways through here); friends and foes (powers with a hall or members here); holds and knows (its Places by occupancy, each with the fact the city view's card showed — "a priest, a healer", "4 people" — artifacts here, resources); story (events here). The sublocation drill-down retires: a Place is its own page.

**D7.3 The land page** (`land`, new kind; class Land) — no tabs (one fixed order, call 16).

| ord | typeId | shape | at | source | slice |
|---|---|---|---|---|---|
| 10 | `the_land` | prose | D·W·F | *moved* HexChronicle *The Land* (two biome paragraphs, the geographic-region prose, the resource prose; the survey prose and "surveyed … ago" when the land has been surveyed) | S1 |
| 20 | `its_soul` | prose | D·W·F | *moved* HexChronicle *The Soul* (dominant and secondary sphere prose, soul affinity); the three sphere pills become words in the prose | S1 |
| 30 | `what_came_before` | prose | D·W·F | *moved* HexChronicle *The Ruins* (history, etymology, legacy quote, exploration hook) — only where a historical culture is recorded | S1 |

- **Header**: name by the naming rule (call 18, `LandPageVM.header.name`: "The plateau at Oreblack Deep", else the Area's name); **lede** — one line (the first sentence of the land's biome prose); hero art (`resolveEntityVisual` by terrain); **facts chips**, each with its tooltip (Law 17): danger word ("Settled country" · "Uneasy country" · "Dangerous country" · "Deadly country" — one ladder: `POSITIONAL_DANGER_WORDS` moves from `HexSidebar.tsx:83-95` to `src/data/view-content.ts`, and `HexDetailView`'s `dangerLabel` retires with it; new tooltip `ui.land.danger`); holder ("Held by no one" with new tooltip `ui.land.holder`, or the holder's identity chip with its own `faction.*` tooltip); sight (the existing words and tooltips: "Clear sight" / "Dim sight" from `ui.sight_level_clear` / `_dim` for a hex in view, "Remembered" from `ui.fog_remembered` otherwise — not new words); soul ("Matter runs faint" — the sphere's existing `sphere.matter` tooltip).
- **In this land** (call 17; `LandIndexVM`, THR-1822 § D9): People and Holder always, with "No one lives here" / "No one holds this land"; Lair, Ruins, Halls, Resources, Covenants only when present. **Discovered sites** (`hexRevelation`, never passed today) are Places and join the Ruins / places rows — their first production read. **Covenants** list the god's covenants on this land with their upkeep words (`selectCovenantRows`; its "(col, row)" fallback text is replaced by the naming rule); there is **no Release control** here — releasing stays in the god rail's Covenants row, the one home that manages covenants (HexChronicle's Release was never wired).
- **Around it** — the land's Connections block: *where* → its Area and the notable places on the six neighbouring hexes, each named by the naming rule ("Sacred Grove — a shrine; your First is there"); the other groups are empty by recipe (In this land holds the hex's own contents).
- **The culture's customs prose** (HexChronicle *The People*) moves to the Realm's page as `customs` (§ D7.4): it describes the people, not the land, and cultures open through their Realm.
- **The prose moves byte-for-byte.** HexChronicle's prose is inline `useMemo`s today; S1 lifts each into a pure function in `src/engine/views/subjects/landProse.ts` with HexChronicle's own seeded picks (`hashString` → `pickFromArray`, kept as they are — the two different `hashString`s in `HexChronicle` and `detailPageResolvers.ts:83-99` are **not** unified, because unifying would change every land's text). Keyword markup comes out as `termRefs` (the `prose` shape's linked words), not React nodes (`renderProseWithIPK` stays a component concern). A golden test pins three hexes' text before and after.

**D7.4 Faction** (`faction`; class Faction; opens wide) — tabs Overview · Story.

| ord | typeId | tab | shape | at | source | slice |
|---|---|---|---|---|---|---|
| 10 | `how_they_hold_her` | overview | prose | all | *existing* | S1 |
| 15 | `description` | overview | prose | D·W·F | *moved* definition description and motto | S2b |
| 20 | `venerates` | overview | prose | D·W·F | *moved* venerated sphere line | S2b |
| 25 | `dominion` | overview | panel | D·W·F | `dominionSheetVM` | S1 |
| 30 | `agenda` | overview | prose + panel | D·W·F | *moved* current agenda (`pursues`); raw `status` worded | S2b |
| 35 | `conclave` | overview | prose | D·W·F | *moved* active conclave (when present) | S2b |
| 40 | `means` | overview | panel | D·W·F | *moved* wealth tier word | S2b |
| 45 | `strongest_reaches` | overview | panel (+meter) | D·W·F | *moved* top five Reaches; the score numeral goes | S2b |
| 50 | `reputations_they_hold` | overview | panel | D·W·F | *existing* | S1 |
| 55 | `customs` | overview | prose | W·F | *moved* `cultureMores` for a Realm (from HexChronicle *The People*) | S2b |
| 60 | `ranks` | overview | panel | W·F | *moved* rank tiers; "(N slots)" goes | S2b |
| 100 | `recent_actions` | story | event-card | D·W·F | *existing row, source replaced*: `factionActionHistory` (the sheet's five) instead of one encounter; raw `actionType`/`outcome` worded; "N turns ago" → `elapsedLabel` | S2b |
| — | `allied_with`, `opposed` | — | — | — | **retired**: superseded by Connections *friends and foes* | S2b |

Header: heraldry (`CoatOfArms`, with the doctrine and dissent states it draws today), kind word, name, where line (the seat — "Court at The Shattered Sanctum"), standing chips (kind, means, Dominion band word). **Retired with no row**: the network diagram (its nodes — leader, members, halls, controls, armies — are the Connections groups) and the stat grid (the group headers carry counts: "Who · 15"); the `ui.faction_core / _leader / _hall / _control / _army` tooltips lose their only consumer and are deleted (`ui.faction_member` stays — encounter content uses it). **Connections**: where (seat, halls); who (leader, officers, members — by rank, the woven successor's row reads "heir"); belongs to (culture); friends and foes (relations); holds and knows (controls — "Seats they govern", possessions); story.

**D7.5 Army** (`group`) — no tabs. `who_they_are` (all, *existing*); `what_they_are_doing` (D·W·F, *existing* — **fix**: read `objective.targetNodeId`, the army type's field, not `targetId`, so the target is named). `who_leads_them` **retires** to Connections (who: commander; belongs to: the raising power). Connections: where (here, heading to); who; belongs to; friends and foes (battle opponents); story (battles). S1 (the fix in S2b).

**D7.6 Artifact** (`item`) — tabs Overview · Story. `icon_with_meaning` (all, *existing*); `made_by` (D·W·F, *moved* "Made by X at Y", the links as `termRefs`); `what_it_does` (D·W·F, *moved* `describeItem` — "What it does" / "The catch"); `traits` (chips, *moved* `readArtifactTraits`); `tags` (chips keyword, *moved* `contentTagChips`); `dominion` (panel); `previous_uses` (story, event-card, *existing*); `how_it_tilts_this_scene` (hover only, *existing*, encounter context). `who_gave_it` **retires** to Connections (who: the holder). Header: hero, rarity chip, kind word (`POSSESSION_SUBCATEGORY_NAMES`). S1 for the *existing* rows, S2b for the moved ones.

**D7.7 Content card** (`content`; covers content refs **and** `attachment` refs — an attachment ref names a template, which is committed content; THR-1822 § D7) — no tabs; S1 for the first three, S2b for the attachment rows.

| ord | typeId | shape | at | source |
|---|---|---|---|---|
| 10 | `what_it_is` | prose | all | *existing* content resolver (description) |
| 20 | `its_voice` | prose | D·W·F | *existing* (flavour) |
| 30 | `marks` | chips (keyword) | D·W·F | *existing* (tags) |
| 40 | `effect` | panel | D·W·F | *moved* attachment effect line, loss, granted by, type (raw `agreementType` worded); **`mechanicalSummary` is not shown** (Law 13 — the reason `ArtifactSheet` withholds it) |
| 50 | `duration` | panel | D·W·F | *moved* `durationLabel` |
| 60 | `triggers` | triggers | D·W·F | *moved* `actionTriggers`; raw `payload.kind` worded, "(Nx)" goes |
| 70 | `source` | prose | W·F | *moved* |

Footer: **"Read in the Codex"** (replacing "open in codex ↗"), rendered only when `codexHasEntry` (Law 25; THR-1822 `ContentCardVM.codexEntryId`). It calls `router.open(ref, 'sheet')`, which opens the Codex.

**D7.8 Record** (`record`, new kind — `encounter`, `journey`, `receipt` refs and graph `event` nodes; opens wide). Rows: `what_happened` (all; for an event node the *existing* resolver, for a store record the receipt / journey / chapter store — "On tick N" becomes `elapsedLabel`); `outcome` (D·W·F; `RecordPageVM.outcomeLine` — the band word sentence the aftermath already uses, e.g. "It went well, at a cost."); `what_it_became` (D·W·F, *existing*); `how_it_invokes_now` (D·W·F, *existing*); `chapter` (D·W·F; "Read this chapter" → the Chapter Ledger dialog at that chapter, when one exists). `who_was_there` **retires** to Connections (who). A **live** encounter never reaches this page (the router sends it to the Stage, § D4). S1.

**D7.9 God's own sheet** (`god`, new kind; class God) — tabs Overview · Reaches. S1 (the selectors move with it).

| ord | typeId | tab | shape | at | source |
|---|---|---|---|---|---|
| 10 | `divine_nature` | overview | prose | D·W·F | *moved* `DIVINE_NATURE_PHRASES` |
| 20 | `essence` | overview | panel (+meter) | D·W·F | *moved* `selectEssenceRows` — words + bars (the sheet's reading; the rail keeps its numerals under Law 13's persistent-chrome exception — two renderings of one balance, read from one selector, so they cannot disagree) |
| 30 | `mandate` | overview | panel (+meter) | D·W·F | *moved* `selectMandateRow`, with a link "Open the Mandate" to its dialog (Doom, Mandate and Omen keep their dialogs, call 5) |
| 40 | `signatures` | overview | panel | D·W·F | *moved* `selectSignaturePaths` |
| 50 | `hooks` | overview | chips | D·W·F | *moved* conditions, clues, vows (`HooksBlock`) |
| 100 | `reaches` | reaches | panel | D·W·F | *moved* `selectReachRows` — rank, tier word, rung word, echo line; the path-Codex link |

Header: portrait (`composePortrait`), divine name, archetype title, cycle-and-age line ("Cycle N" past ten worded), quintessence word chip, primary / secondary sphere chips, seat (`selectHomeSeat`) as the where line. **Act on <god>**: the self-targeted cards (today's Self / Rare tray — which gives those rows a working cast, closing the `onFire` gap). **Connections**: where (avatar); who (threaded mortals, the First, companions); friends and foes (rivals); holds and knows (covenants, bonded artifacts); story (Chapter Ledger entries).

**D7.10 Missing** — any subject whose node is gone or mismatched renders `MissingPageVM` with `unknownStub`'s words ("Unknown" — "this entity is no longer in the world"); the section label moves to sentence case ("What we know"). A page kind with no rows cannot compile (Law 58's "missing entry fails the build"), and an unknown subject still answers the click (Law 58's plain fallback).

**D7.11 Parity — every field a retiring surface shows has a home.** S2a and S2b each own a parity test (`src/engine/views/__tests__/sheetParity.test.ts`) that lists every field from the field inventories in this plan's brainstorm companion (§ Field inventories) with its new home — a row `typeId`, a header field, a Connections group, or `retired: <reason>` — and fails when a listed home does not exist in the registry or the VM types. The retired reasons allowed are only: a raw number or key (Law 13/14), a duplicate of a kept row (PC-6), a relation that Connections now lists (§ D6), or a dead source (no writer). S4 cannot delete a sheet until its parity rows are green.

### D8 — The Connections block

The VM is THR-1822's (`buildConnections`, `CONNECTION_GROUP_ORDER`, `CONNECTION_RECIPES`); the recipes listed with each class in § D7 are the input S1 completes against `src/types/graph.ts` (a step whose edge does not exist is dropped, never invented). The Inspector renders it:

- **Group**: label + count when it holds more than one row ("Who · 15"); rows sorted per THR-1822 (people by role, places by occupancy, powers by relation word, story newest first).
- **Row**: `Chip role="identity"` (image, name, tooltip, link — Laws 1, 17, 21) · one plain fact ("Priest · Congregation of the Spheres") · **card count** (`Chip role="count"`, "2 cards", from `actOnCounts` for rendered rows only — § D9) · the eye when map-located (Law 22). A remembered place's fact is its `staleFact` ("last seen in Autumn, year 1").
- **Fold**: the D6 fit-then-fold rule, with "Show all N".
- **Placement**: last on the page docked and wide; Full puts it in the right aside under the locator.
- **Knowledge**: rows pass `knowledgeFilterFor(ctx, 'connections')` — `OPEN` until gating lands (THR-1822 § D5). The block's title is "Connections" except on the land page ("Around it"); the titles are one record, `CONNECTIONS_BLOCK_TITLE`, in `view-content.ts`.

### D9 — Cards, three ways (calls 1, 13, 14)

All three end in **arm, then cast** (Law 48), through one casting path.

**One cast path.** `useCastOnTarget()` (`inspector/useCastOnTarget.ts`) replaces the body of `handleWheelSlotClick` and `handleNonAgentSlotClick`: given `(actionId, target: WorldRef)` it builds the target context through **`TARGET_CONTEXT_BUILDERS: Record<TargetCategory, TargetContextBuilder>`** (a missing category is a type error — Law 58), re-reads the slot with `getTargetActionSlots({ templates: [template], target })`, and if available runs `preparePlayerCast` → feedback toast → `commitPlayerCast` exactly as today (the Meet-The-First special case and the agenda-picker intervention branch move into the hook unchanged). The sublocation and artifact builders get their first callers; the sublocation builder's `subtype` is set to `'sublocation'` so the gate at `targetActions.ts:365` matches (its category moves to its own field).

**Way 1 — the Act row** (call 1). `ActOnVM` (THR-1822) from `views/subjects/actOn.ts`: one `getTargetActionSlots` call for the open subject with **the same template set the drawer used for that kind** (agents: `AGENT_INTERVENTION_TEMPLATES`; everything else: `UNIFIED_ACTION_TEMPLATES` — a golden test pins each subject's slot ids before and after). Cards render through `CardFace` (sphere tint kept), in rows of at most `CARDS_PER_ROW` (Law 33). Click arms the card **with this subject as its target**; the armed card shows "Cast on Shutash" in place; click casts. A locked card arms nothing and shakes with its reason (Law 47). Every kind has an Act row, sublocations and artifacts included. Empty: "No card in your hand works on Shutash." (`ActOnVM.emptyLine`, owed here by THR-1822.)

**Way 2 — card counts and the inline tray** (call 13). Every rendered row that is a world ref (Connections, *In this land*, a `links` section) carries a count chip when `actOnCounts(ctx, refs) > 0` (zero renders nothing, Law 25). Clicking the count opens a tray under the row with those cards (one tray open at a time; Esc or a second click closes it); a card in the tray arms with that row's target, then "Cast on Temple Quarter" casts. The page never navigates.

**Way 3 — card-first from the hand** (call 14). Each hand card in THR-1875's god rail calls `useHandPress()(cardId)`; S6 supplies the `HandPressContext` provider (replacing the frame's default, which opens the card's Codex entry), and its press is `arm({ actionId: cardId, origin: 'hand', target: null })`. The rail reads `armed.actionId` to draw that card selected; the rail never sets the armed state. While armed:

- **Banner** at the top of the Inspector (when it is open): "Illuminating Whisper: choose a person. You can keep following links." with the Esc key cap. The target words come from the card's target category (`ARMED_TARGET_WORDS: Record<TargetCategory, string>` — "a person", "a place", "a place within", "open land", "a faction", "an artifact").
- **Lighting in the Inspector**: every rendered world-ref row is *castable* (a "Cast here" button replaces its count chip), *locked* (lit dimmer, its reason in words: "Too far from here.", "Not enough Veil essence") or *not a target* (dimmed). The header gets the same treatment, and the Act row's copy of the armed card shows it armed.
- **Lighting on the map**: the hexes holding castable targets are lit; hexes holding only locked targets are lit at `ARMED_LOCKED_LIT` with a hover line naming the reason; everything else dims. GameMap mounts an `ArmedTargetsLayer` (`HexMapV2/scene/`) from a `MapHighlightVM { lit: HexKey[]; litLocked: HexKey[]; hover: Record<HexKey, string> }`, built on **the same dim-and-lit plate builder the lens layers use** (THR-1878's lens build generalises `DominionLensLayer`'s plates; S6 imports that builder and never forks it), at the lens dim strength. **Two dims never stack:** arming sets `lensSuppressed` in `GameScreenState`, the active lens hides while it is set and its bar stays pressed, and the lens returns on disarm (THR-1878 coordination comment; THR-1830 § 2).
- **Navigation stays live**: links, back / forward, Find and widening all work while armed.
- **Choosing**: "Cast here" on an Inspector row **casts** (the second click). A **map click** on a lit target, or a **drop** of the dragged card on a row or on the map, **chooses** it: the banner (or, with the Inspector closed, the armed card in the hand) turns into the commit line — the card, the target, and the card face's own effects line — "Illuminating Whisper on Shutash. Sends a whisper into the mortal's inner world." with **"Cast on Shutash"**. A map click on a hex that holds several lit targets opens that hex's land page with them lit, so the god picks by name. A click on a locked target answers with its reason; on a non-target, "Illuminating Whisper cannot touch that." (Law 47).
- **Ending**: Esc disarms first (the escape order); casting, a second click on the armed hand card, or arming another card ends it. An arm whose card leaves the hand clears itself (the drawer's live check, `ActionDrawer.tsx:228-231`), and the banner says so for `ARMED_CLEARED_LINE_MS` before it goes: "Illuminating Whisper left your hand. Nothing was spent." (with the Inspector closed, the same line shows as a toast).
- **After the cast**: the existing cast receipt toast (`buildCastReceipt`, `castReceipt.ts:47`) names the same card and target the commit line named — "Illuminating Whisper. You set it upon Shutash: it sends a whisper into the mortal mind, touching what they truly value." — and the arm clears.
- **Drag is a shortcut; click always works.** Native HTML drag from a hand card; drop on an Inspector row or on the map canvas (`pickAgentAtScreen`, `screenToHex`) chooses, never casts.

**The inverse helper** (`src/engine/views/armedTargets.ts`, S6):

```ts
export function evaluateCardOnTarget(ctx: ViewContext, actionId: string, target: WorldRef):
  { state: 'castable' | 'locked' | 'not_a_target'; reason: string | null };     // one template, one target, through getTargetActionSlots
export interface ArmedTargetsVM {
  actionId: string; targetWords: string;
  lit: Record<string, { state: 'castable' | 'locked'; reason: string | null }>;   // key = refKey(ref)
  map: MapHighlightVM;
  emptyLine: string | null;           // "Nothing you can see is something Illuminating Whisper can touch."
}
export function buildArmedTargets(ctx: ViewContext, actionId: string): ArmedTargetsVM;   // world-keyed per actionId
```

Candidates are the card's target category drawn from `hexContents` on hexes the seen floor's **hex rule** allows (a new `KnowledgeSurface`, `'armedTargets'`, beside `'lensMarks'` — lighting in fog would leak what fog hides). Rows on screen that are not candidates (Connections are `OPEN`) are evaluated on demand with `evaluateCardOnTarget`. **One target per card; range unchanged** (THR-1827's resolution comment: "One target per card; range is unchanged."): the helper applies exactly the gates `getTargetActionSlots` applies. The decision record's measurement says range is "a flat 3 hexes from the avatar", but the engine applies it only to cards cast on bare land (§ What exists), so a person or place card is never "too far" today. The plan keeps the engine's rule; whether people and places should need the god to be near is an open question for Christian (brainstorm § Open question), and the helper needs no change either way.

**Retires with this**: both `ActionDrawer` mounts (S3) and the component (S4); `ui.action_locked` and `ACTION_CARD_GLYPH_LEGEND`'s drawer wording move to the hand (THR-1875) or go.

### D10 — The land page, opened

- **A map click on open land opens the land page** (call 15): `GameMap`'s hex click → `router.open({ kind: 'hex', id: 'c,r' }, 'card')`. A click on a hex where a city stands also opens the **land** page (the city is the first row of *In this land*). **Agents and armies open themselves** (`router.open` with their refs — not `handleAgentSelect`). **Place labels become clickable** and open the place: `LocationLabelOverlay` labels get `pointer-events: auto` and a click handler (keyboard reachable is not required on the canvas; the same places are reachable through *In this land*, Connections and Find).
- **With a lens on**, a hex click reaches the same handler: lens layers add no pick targets, so a lit hex opens the same land page, unfiltered, through this route — THR-1878 adds no route of its own (THR-1830 § 7; THR-1878 coordination comment).
- **Hero art**: `resolveEntityVisual` by terrain. The plateau resolves to the green-hills image and a lair to the camp image today because no plateau or lair art exists (`public/concept-art/` has twelve terrains, no plateau). The resolver gives each the designed fallback (Law 4) instead of a wrong picture; new art is filed as its own ticket (§ D16).

### D11 — Find anything (THR-1832, built on THR-1822 § D10)

- **Opening**: Ctrl+K / Cmd+K, `/` when no input has focus, or a click in the labelled Find field — which S7 mounts as a `find` entry in THR-1875's `TOP_BAR_ITEMS` and `TOP_BAR_COMPONENTS` (`src/data/frame-registry.ts`), in the centre slot the top bar reserves (≥ 15rem). The box drops from the field, centred under the top bar, width `--find-box-w` (35rem: 560 px at 1080p, 630 px at 1440p — a text-container token, rem, THR-1819's family), capped at `FIND_BOX_MAX_VH` (60vh). It does not dim the map, and it never pauses time.
- **Groups and order** (`FIND_GROUPS`, the one list of result kinds; `FIND_KIND_GROUP: Record<WorldRefKind | 'card' | 'codex', FindGroup | null>`, total by type): Places (Location, Place, Area) · People (agent, companion) · Powers (faction, army) · Things (artifact) · Your cards (the hand's cards — THR-1875's hand list) · Codex (entries the Codex shows this run). Out: hexes (no names), records, attachments as world refs (THR-1832 § 1). Groups ordered by their best match; `FIND_RESULTS_PER_GROUP` rows each, then "Show all N".
- **A row**: carved kind icon (THR-1879 concept names, legend on first contact — Law 12) · name · one plain fact · the eye when map-located. A remembered place shows its stale fact.
- **Picking** (Enter or click): a world result flies the camera there (the map handle's `focusOn(hex)`, at `CAMERA_CONSTANTS.FOCUS_ZOOM`) and opens in the Inspector (faction wide), **replacing a pinned subject**; focus moves to the page heading; a card result **arms** (`origin: 'find'`); a Codex result opens the Codex at that entry. The eye flies without opening.
- **Empty box**: hint "A place, a person, a power, a card…", then *Recent* (the last `FIND_RECENT_COUNT` Inspector subjects, from history) and *Your people* (the First and threaded mortals). **Miss**: "Nothing you know of by that name." — identical for unseen and non-existent names.
- **Engine**: `buildFindIndex` (world-keyed, built when the box opens) and `matchFind` (pure) exactly as THR-1822 § D10; the seen floor in `knowledge.ts` (§ D5 there) — built here unless the lens build lands it first. **The leak test is a Done-when** (THR-1822).

### D12 — The Inspector lab, `?view=inspector-lab`

The place an agent looks to see a page layout change on save (Law 58's "where to see it").

- **Route**: a lazy dev view in `App.tsx` beside `?view=styleguide`; component `src/components/Game/inspector/lab/InspectorLab.tsx`. It is a dev surface (`UI_DEBT_EXCLUDED`'s lab pattern), not a player screen, and may scroll the page.
- **World**: built in the browser exactly as `?view=game&seeded&size=medium` builds it (`initializeGameStateFromIdentity` with `DEV_ASCENDANT_IDENTITY`, seed 42, medium, the First bonded), then `INSPECTOR_LAB_WARM_TICKS` ticks headlessly — no GameView. While it builds, the sanctioned placeholder (Law 54).
- **Subjects**: `INSPECTOR_LAB_SUBJECTS: Record<PageLayoutKind | 'missing', LabPick>` — one predicate per page kind that picks a real example (the First; the First's city; a Place there with people in it; the First's Area; the First's hex for the land page; the First's faction; an army, else the labelled fallback "No army in this world yet"; the legendary artifact, else any; an action template for content; a held attachment; the latest receipt or chapter record; the god; a bogus id for missing). **A page kind without a pick fails a named test.** The chain city → Place → person → faction is the first four picks, so it is walkable in the lab.
- **Grid**: one row per kind; columns docked · wide · Full, each drawn at the tier's real pixel width and the Inspector's real height (viewport minus top bar), with internal scroll, so Law 57's fit-then-fold shows as it will in play. A **screen** toggle (1080p / 1440p) sets the root font size (16 / 18 px) and the tier's frame-token values on `:root` for the lab, so both tiers are visible on one monitor. Deep links: `?view=inspector-lab&kind=faction&size=wide&tier=1440`.
- **Stress case**: one extra row from a fixture (`lab/stressFixture.ts`): a name of more than 60 characters, every Connections group empty except one with 30 rows, *In this land* with only its two always-rows, and a body of 15 sections — Law 57 at docked (folds, then scrolls) and wide (all shown).
- **Live**: the lab reads the same registry, view models and renderer as the game, through `readView(null, state, …)` (no runtime → no cache), so an edit to `detailPageTemplates.ts` or a resolver shows on Vite's hot reload.
- **Checks it surfaces** (also asserted by its Playwright spec): no cell's tab row or toolbar overflows sideways; no cell shows a raw id or numeral (THR-1822's string check over the rendered text); every kind renders a page (no blank cell).
- **Debug**: the lab installs `window.__DEBUG.getInspectorLab()` (dev only, documented in `debug-bridge.d.ts`) → `{ tier, cells: { kind, size, subjectKey, sectionsShown: string[], foldedGroups: string[], hiddenForWidth: string[], overflowX: boolean }[] }`.
- **It replaces the style guide's hard-coded sample page** (`StyleGuide.tsx:165-249`, `SAMPLE_DETAIL_PAGE` and the DetailModal launcher): the style guide keeps one sample of each section shape (Law 29 for `Section.tsx`) and links to the lab for whole pages.

### D13 — Retirements, and how every caller re-routes

Order: S3 makes the Inspector the destination of every caller (the old surfaces become unreachable); S4 deletes them once S2's parity tests are green. Nothing about to be deleted is migrated onto the seam (THR-1822 § D16).

| Retires | Callers today (`GameView.tsx` @ `0afcfc2b` unless noted) | After |
|---|---|---|
| Detail column: `ThreadDetailView`, `HexDetailView` (`:6103-6161`) | `handleThreadNodeSelect` (`useAgentInteraction.ts:701`) from the map, HexSidebar, HexChronicle, HexDetailView, ThreadsPanel (`:6178`), LocationProfileModal, the notice badge (`:1909`), `attendThreadTug`; `handleHexSelect` from the map | every caller → `router.open(ref, 'card')`; the map → § D10; `selectedThreadNode` and `selectedHexCoord` stop driving any panel (they keep driving map highlights) |
| `AgentProfileModal` + tabs (`:6338`) | `openAgentSheetForId` (`:6202, 6360, 6397, 6589, 6658, 6791`), `handleViewProfile`, debug | `router.open({ kind: 'agent', id }, 'sheet')` (wide) |
| `LocationProfileModal`, `FactionSheet`, `ArmySheet`, `ArtifactSheet` (stub switch `:6461-6525`) | `setStubModalState` from HexSidebar (`:5967`), HexDetailView (`:6156`), AgentProfileModal, the router's `useSheetOpeners`, debug (`useDebugOpenModal.ts:64`) | `router.open(ref, 'sheet')`; FactionSheet's `onOpenTargetActions` → the faction page's Act row |
| `AscendantSheet` (`:6797`) | AscendantBar `onOpenSheet` (`:5698`) | `router.open({ kind: 'agent', id: ascendantId }, 'sheet')` — the god page |
| `AttachmentDetailView` (modal `:6533-6546`; overlay `AgentProfileModal.tsx:344-355`) | router `attachment` arm (`:4579`), HooksBlock (`:5706`), Prowess / Attachments tabs | `router.open({ kind: 'attachment', id }, 'card')` — the content card |
| `DetailModal`, `DetailModalStackContext`, `DetailBreadcrumb`, `useDetailModal` (unused), `DETAIL_*_W/_H` | `useRefRouter` card arm (the only pusher), `EntityLink` (11 files), `useDetailNodeRefOpener`, EncounterVeil `onSelectEntity` (`:6604-6620`, incl. a `power_template` content ref), notifications, AscendantBeatModal "Attend" (`AscendantBeatModal.tsx:546`), the DetailModal CTA | all through the router, which opens the Inspector (§ D4); breadcrumb → the Inspector trail; the HoverCard stays |
| `location` view: `LocationView` (`:6004-6027`) | `handleLocationClick` (`useViewNavigation.ts:118`) from the router, `handleZoomToLocation` (DebugPanel, ThreadsPanel, ThreadDetailView, LocationView), HexChronicle, AgentProfileModal | `router.open({ kind: 'location' \| 'sublocation', id }, 'card')`; ThreadsPanel's place eye → camera only (Law 22) |
| `hex-zoom` view: `HexBreadcrumb`, `HexSidebar`, `HexChronicle` as a view (`:5933-6001`), `useHexZoomData` | `handleHexClick` (`useViewNavigation.ts:88`) from the router's area arm and HexDetailView | `router.open({ kind: 'hex' \| 'area', id }, 'card')`; `viewLevel` keeps only `'world'` and the type narrows to it in S4; `useHexZoomData`'s `focusedLocation` feed to Meet The First (`:4851`) moves to `hexContents` |
| `ActionDrawer`, both mounts (`:6032-6061`) | `handleAgentSelect` (router agent arm, ToastStack, LocationView, Scry, debug), the auto-open on hex select (`:2097-2103`), FactionSheet | the Act row, the tray and card-first (§ D9); Scry and ToastStack open the person through the router |
| `LiveLocationBar` (`:5792-5800`) | — | its job moves to the Threads and Trouble lenses and the Needs-you queue (THR-1827); `locationActivitySummaries` stays for the map |
| `HexZoomView`, `HexFlavorPanel`, `HexPoiPanel` (unmounted) | tests only | deleted; their comment mentions in `polygonLayout.ts`, `sphereIcons.ts`, `uiColorPalette.ts`, `hexZoom.ts` updated |
| `AgentInfoCard.tsx` ×2 (unmounted; `Game/` and `components/AgentInfoCard/`) | an import only (`GameView.tsx:103`) | deleted in S4 (dead code the person page supersedes) |

**Lists that change with the retirements** (S3/S4): `GIFT_HOLD_SURFACES` and `openPlayerSurfaces()` — the seven retired ids leave, `InspectorFull` and `ArmedCard` join (a docked Inspector is a passive panel and does **not** hold a gift; an armed card and Full are deliberate acts and do); `styleguideSync.test.ts`'s `ROUTED_SHEETS` → the Inspector's page renderer; `ia-manifest.ts` rows (§ D14); the `check:ui-debt` baseline drops by the retired files' counts (THR-1821 § The UI-debt ratchet estimated a fifth of several rows); `Docs/design-system/layout-zones.md`, `component-selection.md`, `Docs/ui-patterns.md` and the Action Drawer and detail-surface sections of `public/interface-reference.html` (the frame build rewrites its frame sections, THR-1875) are rewritten for the Inspector (S4). Needs-you News rows already route through `useNotificationNavigation` → the router's `sheet` mode, so they open the Inspector wide with no change of their own.

### D14 — Onboarding, tutorial and first-run copy that points at retired surfaces

The game has no tutorial or coach-mark system; the copy below is every player-facing line that points at a retired surface or interaction (survey of `src/data`, `src/components`, the IA manifest and the docs). Each changes in the slice that retires its surface.

| File:line | Today | After | Slice |
|---|---|---|---|
| `data/ui-content.ts:209` `ui.ascendant_name` | "Open the sheet for the whole of it." | "Open your page for the whole of it." | S3 |
| `data/ui-content.ts:223` `ui.avatar_wheel` (chained from `ui.essence_panel` `:194`) | "Open the wheel of divine interventions for the selected agent." | "Your cards: arm one, then choose what it touches." — the id renamed `ui.your_hand` and the chain updated | S6 |
| `data/ui-content.ts:809` `ui.moment_set_in_motion` | "Follow the link to see the drive it became." (lands in the detail column) | unchanged words; the chip's `selectAgentId` becomes a router open | S3 |
| `data/opening-reveal-table.ts:72` + `OPENING_REVEAL_TOAST` (`ui-content.ts:36`) | the spine beat "A Path Opens" announces "New beside the map: World Pulse" | World Pulse retires with THR-1828: **THR-1875's** row (named here so it is not missed) | THR-1875 |
| `data/ascendant-beat-content.ts:98` `SETTLED_OPENING_CHRONICLE_LINE` | "You can bind and watch other mortals now." | unchanged — still true; the cards now sit on each person's page | — |
| `data/moment-card-content.ts:85`; `data/fight-screen-content.ts:317`; `engine/itemGenerator/describeItem.ts:74, 109` | "Their sheet says …", "the sheet remembers …", "big enough to show on their sheet" | "sheet" → "page" in each ("Their page says what it is …") | S4 |
| `components/Game/ToastStack.tsx:29-39` `NAV_TOOLTIPS` | "Click to view agent / hex / location / …" | "Open {name}" for every kind; hex → "Open this land" | S3 |
| `components/Game/AlertBar.tsx:87-88` | "click to navigate" | "Open" | S3 |
| `components/shared/EntityLink.tsx:106` aria | "{name} — open profile" | "{name} — open page" | S3 |
| `components/Game/ThreadsPanel.tsx:711` aria | "— open agent profile" | "— open their page" | S3 |
| `components/Game/PremonitionModal.tsx:316` aria | "Open the character sheet for {name}" | "Open {name}'s page" | S3 |
| `components/Game/ascendant-bar/IdentityStrip.tsx:104` aria | "Open ascendant sheet" | "Open your page" | S3 |
| `components/Game/entityNoticeBadgeModel.ts:86-87` | "open their thread", "open the faction's thread" | "open their page", "open the faction's page" | S3 |
| `data/action-card-display.ts:142-152` `ACTION_CARD_GLYPH_LEGEND` | "a player meeting the drawer" (no consumer found) | the hand's legend (THR-1875) or deleted if it stays unconsumed | S6 |
| `data/ui-content.ts` ids whose only consumers retire: `ui.action_locked`; `ui.faction_core`, `_leader`, `_hall`, `_control`, `_army`; `ui.world_pulse_*` (no consumer; THR-1875); `ui.reputation_with`, `ui.intention.*`, `ui.arc_strip`, `ui.pilgrim_way`, `ui.hold`, `ui.reputation` | — | each is either **re-consumed by the row that now shows its field** (the person and place rows take `ui.reputation_with`, `ui.intention.*`, `ui.arc_strip`, `ui.pilgrim_way`, `ui.hold`, `ui.reputation`) or deleted with its last consumer (`ui.action_locked`, the faction diagram ids). `conceptTooltipIds.test.ts` catches a dangling id | S2a / S2b / S4 |
| Copy inside the retired surfaces ("View Full Profile →", "Go to Hex Chronicle →", "Click to enter", "Enter {sublocation}", "This place lies quiet — for now.", "The stillness here is unbroken.", "Choose a card.", "open the full sheet ↗", "Active Locations") | — | goes with its component; the two place empty lines become the place page's `doingLine` fallbacks ("This place lies quiet — for now.") so the words survive | S2b / S4 |
| `data/ia-manifest.ts` rows `:281, :284-306, :335-353, :452-465, :480-549, :561-585, :615-657, :692, :707-750, :862-879` (and `:433-451` World Pulse — THR-1875) | name the retired surfaces | replaced by one `game.inspector` row (with `game.inspector.land-page`, `game.inspector.find`, `game.inspector-lab`), reads from the view models | S4 |
| `GIFT_HOLD_SURFACES` (`ascendant-beat-content.ts:68-86`) | names seven retired surfaces | § D13 | S3 |

### D15 — The Law 58 lists, and their `extending.md` rows

Every list this plan introduces or extends. **Each slice adds or updates its rows in `Docs/design-system/extending.md` in the same PR** (the exact row text below), so five parallel plan PRs do not collide on that table today.

| You are adding | The one place | What catches a missing entry | Where to see it | Slice |
|---|---|---|---|---|
| A section on a page (a field the player should see), or moving it to another tab or width | One `SectionSchemaEntry` row for that kind in `DETAIL_PAGE_REGISTRY` (`src/data/detailPageTemplates.ts`): `typeId`, `order`, `tab`, `visibleAt`, a resolver returning one of the shared shapes | `DetailPageRegistry` is `Record<PageLayoutKind, …>`; a resolver returning nothing skips its section; the sheet-parity test (§ D7.11) | `?view=inspector-lab` (on save) | S1 (updates today's row) |
| A new kind of thing with a page | `PageLayoutKind` (`src/types/detailPage.ts`) + its rows + `KIND_LABELS` + an `INSPECTOR_LAB_SUBJECTS` pick + its `SURFACE_BY_WORLD_REF` row | type errors until all exist; the lab-pick test; an unknown subject renders `MissingPageVM` | the lab | S1 (updates today's row) |
| A new section **shape** | `SectionKind` + one arm in `Section.tsx` + a style guide sample + a `component-selection.md` row (Law 29) | `styleguideSync.test.ts`; the exhaustive switch in `Section.tsx` | `?view=styleguide` | S1 |
| An Inspector tab | `InspectorTabId` + `INSPECTOR_TAB_LABELS` | `Record<InspectorTabId, string>` is total | the lab | S1 |
| What a kind opens and how wide | One `SURFACE_BY_WORLD_REF` row: `card`, `sheet`, `opensAt` | `Record<WorldRefKind, SurfaceRow>` | open it in the game | S3 |
| A Connections group or a link a kind lists | `CONNECTION_RECIPES` (`src/engine/views/connections.ts`); the order is `CONNECTION_GROUP_ORDER` | the recipe record is total over subject classes; the chain test | the lab | S1 |
| A row kind in *In this land* | `LAND_INDEX_ALWAYS_ROWS` / `LAND_INDEX_WHEN_PRESENT_ROWS` + its label in `view-content.ts` | a typed tuple; the land-index test | the lab's land row | S1 |
| A card on the Act row, the tray or the hand | The action template in `src/data/unified-action-templates.ts` (one place once [THR-1886](https://linear.app/threadbare/issue/THR-1886) lands); it appears wherever its target category is open | `getTargetActionSlots`' gates; the Act-row golden test | the subject's page | S3 |
| A new kind of target a card can be cast on | `TARGET_CONTEXT_BUILDERS` + `ARMED_TARGET_WORDS` (both `Record<TargetCategory, …>`) | type errors until both exist | arm a card | S3 (builders), S6 (words) |
| A Find result kind | `FIND_GROUPS` + `FIND_KIND_GROUP` (`src/engine/views/findIndex.ts`) | `Record<…>` total by type; the leak test | Ctrl+K | S7 |
| A surface that holds a gift | `GIFT_HOLD_SURFACES` (and `openPlayerSurfaces()`, which must agree — a Law 58 debt this plan does not create and names here) | `giftDelivery` tests | — | S3 (entries only) |
| An icon the Inspector draws | THR-1879's concept → shape table; this plan names the concepts: back, forward, pin, show on map, follow, widen, narrow, close, cards (count), cast, find, and one per Find group and per subject kind (place shapes per THR-1834) | THR-1879's missing-concept test | `?view=styleguide` | consumed |

### D16 — Build slices

THR-1876 builds **S1**. The rest are filed as tickets in the same project (*UI Visual Overhaul — Design System v1*), each with its coordination block.

| Slice | Ticket | What it builds | Blocked by |
|---|---|---|---|
| **S1** | **THR-1876** (this plan) | The page-layout table (§ D6: `PageLayoutKind`, `visibleAt`, `tab`, `links` and `cards` shapes, `panel` additions, sentence-case labels, `composeSections`); `views/subjects/*` (every class's VM, header extensions, `actOn.ts`), `connections.ts` with every recipe, `landIndex.ts`, `hexContents` filled for the remaining kinds; the rows marked S1 (land prose moved with its golden test, the god rows with `ascendant-bar/selectors.ts` moved and re-exported, the record and content rows, the existing rows' fixes: rank word, `elapsedLabel`s, worded keys); the page renderer (`inspector/InspectorPage.tsx` and its parts, at three sizes, fit-then-fold, More when widened); `?view=inspector-lab` with every pick and the stress case; the style guide's sample page replaced | THR-1822 slice 1; THR-1884 and THR-1885 (THR-1821's Panel, Tabs, Chip, Icon); THR-1820 slice 1 (`SheetColumns`) |
| **S2a** | filed at handoff | Person rows (§ D7.1, every row marked S2a) and the person parity test | S1 |
| **S2b** | filed at handoff | Location / Place / Area, faction, army (the `targetNodeId` fix), artifact and attachment rows (§ D7.2, D7.4–D7.7, marked S2b) and their parity tests | S1 |
| **S3** | filed at handoff | The Inspector in the game: `InspectorHost`, the `GameScreenState` slices, sizes and Full (clock hold, interrupt close), history / trail / pin / eye / Follow / Esc / focus / hotkeys, the router change (§ D4) and the registry's `opensAt` column, the map-click routing and clickable labels (§ D10), the Act row with `useCastOnTarget` and `TARGET_CONTEXT_BUILDERS` (sublocation and artifact casting live), the `ActionDrawer` mounts removed, the Ledger fold signal, every caller re-routed (§ D13), the S3 copy rows (§ D14), `GIFT_HOLD_SURFACES` | S1; THR-1881; THR-1819 |
| **S4** | filed at handoff | Delete the retired surfaces and their tests, the DetailModal stack, `viewLevel`'s other levels, the dead `AgentInfoCard`s; `ROUTED_SHEETS`, `ia-manifest.ts`, `layout-zones.md`, `component-selection.md`, `ui-patterns.md`; the S4 copy rows; the UI-debt baseline lowered | S2a; S2b; S3 |
| **S5** | filed at handoff | Card counts on every row and the inline tray (§ D9 way 2), `actOnCounts` | S3 |
| **S6** | filed at handoff | Card-first arming from the hand: `armedTargets.ts` (`evaluateCardOnTarget`, `buildArmedTargets`, the `'armedTargets'` knowledge surface), the `HandPressContext` provider, the banner and commit line, lighting in the Inspector and on the map (`ArmedTargetsLayer` on the lens plate builder), `lensSuppressed` set while armed, drag and drop, the S6 copy rows | S3; THR-1875's god-rail hand build (`HandPressContext`); THR-1878's lens build (the plate builder and the `lensSuppressed` read) |
| **S7** | filed at handoff | Find anything (§ D11): the box, keys, `buildFindIndex` / `matchFind`, the seen floor (unless the lens build landed it), the leak test, the `knowledge-floor-gates-find` interface row | S3; S6 (the card group arms); THR-1875's top-bar Find field |
| deferral | filed at handoff | Land-page hero art: plateau and lair have no art of their own (they show hills and camp today); generate pre-baked art (Law 6) and map it in `concept-art-assets.ts` | — |

**Why this order.** S1 touches no GameView code, so it runs in parallel with THR-1881's split; it also gives S2's porters the lab to see their rows in. S2a and S2b are content ports against one table and can be split between two executors (mutex on the two registry files, so they queue). S3 is the switch: the game starts opening everything in the Inspector, with the Act row so no cast surface is lost on the day the drawer goes. S4 deletes only after parity is proven. S5–S7 add the two newer ways to play a card and search, after their frame and map dependencies exist.

## Engine pillar

### Systems design

- **E1 — the page-layout table** (S1): `src/types/detailPage.ts` (`PageSurface`, `PageLayoutKind`, `SectionKind` + `links` / `cards`, `panel` row additions, `prose.variant`), `src/data/detailPageTemplates.ts` (`visibleAt`, `tab`, rows for `land`, `god`, `record`, `content`; `INSPECTOR_TAB_LABELS`), `src/engine/detailPageGenerator.ts` (`composeSections` extracted; `generateLandPage`, `generateGodPage`, `generateRecordPage`; `visibleAt`/`tab` carried through; `generateDetailPage`'s signature unchanged), `src/engine/contentPageGenerator.ts` (adopts the `content` rows).
- **E2 — subject view models** (S1): `src/engine/views/subjects/{subjectPage,landPage,locationPage,personPage,factionPage,armyPage,artifactPage,godSheet,contentCard,recordPage,actOn,landProse}.ts` to THR-1822 § D7's types, extended additively with `SubjectHeaderVM.standing: StateChipVM[]`, `doingLine: string | null`, `lede: string | null` (land), `follow: boolean`; `opensWide` read from `SURFACE_BY_WORLD_REF[kind].opensAt`. `connections.ts`, `landIndex.ts` to § D8 / § D9 there. `hexContents` filled for armies, artifacts, lair, ruins (incl. `hexRevelation` sites), halls, resources and covenants.
- **E3 — the inverse helper** (S6): `src/engine/views/armedTargets.ts` (§ D9), plus the `'armedTargets'` row in `knowledge.ts`.
- **E4 — Find** (S7): `findIndex.ts`, `knowledge.ts` seen floor, exactly THR-1822 § D5 / § D10.
- **E5 — the one cast path** (S3): `TARGET_CONTEXT_BUILDERS` in `targetContextBuilders.ts`; the sublocation builder's `subtype` fix; `useCastOnTarget` calls `preparePlayerCast` / `commitPlayerCast` unchanged.

### Graph nodes / edges

None added. The land page is a page kind, not a node (a hex keeps its coordinate identity, `worldRef.ts`). Reads only, through existing edges (THR-1822 § Graph nodes / edges) plus `will_succeed`, `leads`, `has_trait`, `used_in`, `crafted_by` provenance where the moved rows already read them.

### Tick phases

None. Nothing here runs in `runTick`. Casting goes through `preparePlayerCast` / `commitPlayerCast` as today (out of tick, on a player act); Full's clock hold uses the existing interrupt auto-pause.

### Resolution logic

None new. Card availability, price, range and locks are exactly `getTargetActionSlots`' (§ D9); the inverse helper calls it with one template. Sort orders (Connections, Find) are THR-1822's.

### PRNG callouts

None new. The moved land prose keeps HexChronicle's seeded picks (`hashString(hexKey)` → `pickFromArray`), so a land reads the same every time; the person and place prose keep their generators' seeds. No `Math.random` (NFP #3).

## Content pillar

### Encounter templates

N/A — no encounter is added or changed. Encounters listed on a place's *Here now* tab are read, not authored.

### Prose tables

No new prose tables. The land prose moves unchanged (golden test). The words this plan introduces are UI lines, listed in § Player-facing text, and live in one home (C1).

### Attachment content

N/A — no attachment template changes; the attachment page reads existing templates.

### Data tables

- **C1 — `src/data/view-content.ts`** (created by THR-1822's first family or by S1, whichever lands first): the Inspector's words — tab labels, `CONNECTIONS_BLOCK_TITLE`, the "More when widened" line, `ActOnVM.emptyLine`, `ARMED_TARGET_WORDS`, the banner and commit lines, the not-a-target line, the land facts' sight words, `POSITIONAL_DANGER_WORDS` (moved from `HexSidebar.tsx:83-95`, the one danger ladder), the record outcome sentence template, the Find lines (THR-1822 already lists them). Existing words are imported, never copied (THR-1822 C1).
- **C2 — the page-layout table rows** (§ D7) are content: section order, tab and width per kind are data an author edits.
- **C3 — `INTERRUPT_HOLDER_NAMES.InspectorFull = 'the full view'`** (`src/data/nudge-stage-content.ts`).
- **C4 — tooltip registry**: new `ui.inspector.pin`, `ui.inspector.widen`, `ui.inspector.follow`, `ui.inspector.cards` (the count chip), `ui.inspector.more_when_widened`, `ui.land.danger`, `ui.land.holder` (texts quoted in § Player-facing text); every other chip reuses an existing id (`knowledge.*`, `sphere.*`, `ui.dominion.*`, `ui.sight_level_*`, `ui.fog_remembered`, `faction.*`, the Threads panel's court labels); the re-consumed and deleted ids in § D14. Each ≤ 200 characters (`tooltipValidation.test.ts`).

## UI pillar

*Screenshot tool: both. Playwright for the Inspector, the lab, Find and every DOM assertion; Claude-in-Chrome for the map (WebGL) — lit targets, the land-page click, clickable labels. Real 1920×1080 and 2560×1440 captures; Claude-in-Chrome's `resize_window` is inert, so a map capture states the measured `innerWidth`/`innerHeight`.*

### Player-facing display

- **The Inspector** (§ D1–D5): docked beside the map with the Ledger folded to its strip; wide for factions and past events or on `sheet`; Full on request with the TIME readout naming the hold. Toolbar, header, Act row, tabs, Connections — on every kind.
- **The land page** (§ D7.3, § D10): a click on open land opens it.
- **Cards three ways** (§ D9): the Act row now (S3), counts and trays (S5), card-first lighting on the map and in the Inspector (S6).
- **Find** (§ D11) under the top bar.
- **The lab** (§ D12) for developers.

UI Laws engaged: **1** (identity chips carry image, tooltip, link), **3** (one resolver per class — `resolveEntityVisual`, one cast path), **4** (designed fallbacks: art, missing page, no-army lab cell), **8** (person portrait gated, fail-open), **12** (new icons get legends), **13 / 14** (every number and key in § What exists is banded at its source; counts are counts), **17** (tooltips from the registry), **20** (hover → docked → wide → Full is the ladder), **21** (every name through the one router), **22** (the eye on every map-located row), **23** (Esc order; `:focus-visible`), **24** (the trail and "where" line orient depth), **25** (empty groups, zero counts, Codex CTA without an entry, the locator without a minimap: none render), **33** (one viewport; the Inspector scrolls inside itself), **36** (groups sorted, counted, folded), **47** (every click answers within `--anim-fast`: arm state, shake with reason, not-a-target line), **48** (arm, then cast — all three ways), **50** (focus to the heading, back to the invoker), **51** (view state resets; the Ledger rail's player fold choice survives, THR-1875), **52** (Full names its clock hold), **53** (no new persistent HUD — the Inspector is a panel, not chrome), **57** (fit, then fold; wide and Full show everything; the Inspector never widens itself), **58** (§ D15).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Toolbar tooltips (`ui.inspector.*`) | "Back" · "Forward" · "Pin: map clicks stop replacing this page" · "Show on map" · "Follow on the map" · widen, docked: "Widen" · widen, wide: "Full view: time holds while you read" · widen, Full: "Back to the side of the map" · "Close" | PC-1, PC-4 | each control names what it does on hover (Law 17); the step into Full warns that time will hold before it does |
| Where line | "At Temple Quarter, in The Bone Coast" | PC-6 | the same containment the Connections *where* group lists |
| Person kind word | "Priest" (from `npcRole`) — never "wanderer" | PC-6, PC-3 | the role the Connections row and the place's *who* row say too |
| Act row | heading "Act on Shutash"; armed card "Cast on Shutash"; empty "No card in your hand works on Shutash."; locked card reason on a person, "Not enough Veil essence"; on land out of range ("Act on this land", The plateau at Oreblack Deep), "Survey Territory — Too far from here." (the card face's existing `actionBlockedReason` words) | PC-1, PC-8 | the card names its target before it spends (Law 48); a locked card says why, in the words the card face already uses |
| Header standing chips | person: "Your First" (the Threads panel's own court label and tooltip, one fact one way), "Known" (`knowledge.known`), "Attuned to Veil" (`sphere.veil`), the Dominion band word, e.g. "Held" (`ui.dominion.held`); land: "Uneasy country" (`ui.land.danger`: "How dangerous this land is to cross and to live on, from settled country to deadly country."), "Held by no one" (`ui.land.holder`: "Who holds this land. Held land answers to its holder's court; unheld land answers to no one."), "Dim sight" (`ui.sight_level_dim`), "Matter runs faint" (`sphere.matter`) | PC-1 | every chip explains itself on hover; only the two `ui.land.*` texts are new, quoted here |
| More when widened | "More when widened: Chronicle · Chapters" | PC-7 | a button; pressing it widens and shows those tabs |
| Connections | groups "Where", "Who", "Belongs to", "Friends and foes", "Holds and knows", "Story" (THR-1822); header "Who · 15"; fold "Show all 15"; row "Shutash — Priest · Congregation of the Spheres"; remembered "Temple Quarter — last seen in Autumn, year 1" | PC-1, PC-6 | six headings in one order on every page; a rank or role word, never "0.16" |
| Count chip and tray | "2 cards" (tooltip "2 of your cards work on Temple Quarter"); tray card "Sacred Ground"; armed "Cast on Temple Quarter" | PC-8 | the tray opens under the row; the page stays |
| Armed banner | "Illuminating Whisper: choose a person. You can keep following links." + `Esc` | PC-4, PC-7 | the game says what it is waiting for and how to stop |
| Commit line (before) and cast receipt (after) | before: "Illuminating Whisper on Shutash. Sends a whisper into the mortal's inner world." + "Cast on Shutash"; after, the existing receipt toast: "Illuminating Whisper. You set it upon Shutash: it sends a whisper into the mortal mind, touching what they truly value." | PC-2, PC-8 | the same card and the same target in both lines; the after line is the before line done |
| Armed card cleared | "Illuminating Whisper left your hand. Nothing was spent." (banner, or a toast with the Inspector closed) | PC-8, PC-4 | the arm ending is announced, and the god knows no essence moved |
| Lit rows and map | "Cast here"; locked row on a person card, "Not enough Veil essence"; armed "Survey Territory" on the map, hover on a lit-but-locked hex: "The plateau at Oreblack Deep — too far from here." | PC-1 | a dim row or hex says why it cannot be cast on (range binds only cards cast on bare land, so the "too far" sample is land) |
| Not a target | "Illuminating Whisper cannot touch that." | PC-8 | the click is answered, nothing is spent |
| Armed with no targets in sight | "Nothing you can see is something Illuminating Whisper can touch." | PC-7 | the empty map is explained |
| Full | TIME "held by the full view · runs on when it closes" (or "· stays paused"); trail heading "Your trail"; "Click any step to go back to it." | PC-4 | the clock says who holds it (Law 52) |
| Land page | name "The plateau at Oreblack Deep"; lede "A flat-topped expanse that rises abruptly from lower lands."; chips "Uneasy country" · "Held by no one" · "Dim sight" · "Matter runs faint"; *In this land* "People — No one lives here." · "Holder — No one holds this land." · "Lair — Oreblack Deep · something dangerous keeps it"; "Act on this land"; "Around it" with "Sacred Grove — a shrine; your First is there" | PC-1, PC-6 | the land's name is word for word the same everywhere a land is named — the land page, a neighbour's *Around it* row and the god rail's Covenants row (`selectCovenantRows`, moved onto the naming rule from its "(col, row)" fallback) — because all three call the one naming function over `hexContents` (Find lists no hexes, THR-1832 § 1; the Stage's tag names the Location, not the land); absence stated, not blank |
| Faction page | "Court at The Shattered Sanctum"; Connections "Who · 15", a successor row "Wulfram — heir"; "a dozen or so members" | PC-1 | counts as group headers, sizes as words |
| Content card | "Read in the Codex" (only when the Codex has the entry) | PC-8 | the button always opens something |
| Record page | outcome "It went well, at a cost."; "Read this chapter" | PC-2 | the result line the aftermath used, in words |
| Missing page | "Unknown" — "this entity is no longer in the world" | PC-8 | a gone subject still answers |
| Find | field hint "Find a place, a person, a power, a card…" (THR-1828); empty "A place, a person, a power, a card…"; groups "Places", "People", "Powers", "Things", "Your cards", "Codex", "Recent", "Your people"; miss "Nothing you know of by that name."; "Show all 8" | PC-7, PC-1 | an invitation; a miss never says whether the thing exists |
| Copy re-pointed (§ D14) | "Open your page for the whole of it."; "Open {name}'s page"; "Their page says what it is …" | PC-6 | one word, "page", for the one place things open |

### Playtest signal

A tester who clicks a city, then a place within it, then a person there, then that person's faction reaches each page in one click from the one before and returns with Back; and a tester who arms a card from the hand can say which things on the map it can touch before casting.

### Event notifications

None new. Casting keeps its existing feedback toast and particle burst (`useCastOnTarget` moves them unchanged). The Inspector emits no toast.

### Debug inspection (DebugPanel)

- `await window.__DEBUG.getInspectorState()` → `{ open, size, subjectKey, subjectKind, history: { key, name }[], index, pinned, armed: { actionId, origin, targetKey } | null, foldedGroups: string[], hiddenForWidth: string[] }`.
- `await window.__DEBUG.openInInspector(kind, id, size?)` — opens through the router, so a lever exercises the real path.
- `await window.__DEBUG.getArmedTargets()` → the current `ArmedTargetsVM` (S6).
- `await window.__DEBUG.getView('subjectPage', subject)` (THR-1822's accessor; this plan registers the selectors).
- `await window.__DEBUG.getInspectorLab()` in the lab (§ D12).
- `await window.__DEBUG.getEscapeLayers()` (THR-1821) shows the armed card above the dialog band and the Inspector's steps below.
- All declared with JSDoc in `src/debug-bridge.d.ts`.

### Visual presence (HexMapV2)

- The subject's hex carries the existing selection ring.
- Place labels become clickable (`LocationLabelOverlay`).
- Armed lighting renders through THR-1878's lit/dim layer from `MapHighlightVM` (S6); no new mesh in this plan.

## Interface impact

| Contract | Change | Where |
|---|---|---|
| Dominion band → sheets (THR-1750 row) | **extend**: new consumer, the Inspector's `dominion` rows (place, faction, artifact, person); the old sheets retire (S4) | `dominionSheetVM` → `views/subjects/*` |
| `dominion-band-prices-god-casts` (Essence & Divine Economy) | **preserve**: the Act row, the tray and armed lighting read `getTargetActionSlots`, so a card costs the same on every surface | `targetActions.ts` |
| Player cast dispatch → essence spend (Essence & Divine Economy, audit-on-touch) | **preserve**: one `useCastOnTarget` calls `preparePlayerCast` / `commitPlayerCast` unchanged; two UI callers become one | `playerCastDispatch.ts` |
| Target context builders → cast surfaces | **extend / activate**: the dormant sublocation and artifact builders get production callers; `TARGET_CONTEXT_BUILDERS` record | `targetContextBuilders.ts` |
| Knowledge stores → what a surface may name (Intelligence & Knowledge, ⚪ UNAUDITED) | **add** in S7: `knowledge-floor-gates-find` (THR-1822's row) registered in `scripts/interface-contracts.ts` when Find ships; **extend** in S6: the `'armedTargets'` surface reads the floor's hex rule | `views/knowledge.ts` |
| Interrupt registry → clock (Attention & Chronicle, ⚪ UNAUDITED) | **extend**: new surface `InspectorFull` (holds the clock, named); new consumer: Full steps to docked when another surface opens | `interruptRegistry.ts`, `InspectorHost` |
| Gift hold surfaces → gift delivery (THR-1809) | **extend / retire**: retired ids leave; `InspectorFull`, `ArmedCard` join | `ascendant-beat-content.ts`, `giftDelivery.ts` |
| `hexRevelation` → discovered sites | **extend**: first production read (never passed today) | `hexContents` → `LandIndexVM` |
| Covenant rows → the god (`selectCovenantRows`) | **extend**: new consumer, *In this land* covenants; the raw-coordinate fallback replaced by the naming rule | `godSheet.ts` |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Page-layout table (`detailPageTemplates.ts`, generator, resolvers) | none (read on render) | `InspectorPage`, `HoverCard`, the lab | reads graph + stores | `view_fallback` (THR-1822) | `getView('subjectPage')`, the lab |
| `views/subjects/*`, `connections.ts`, `landIndex.ts` | none | `InspectorPage` | reads | `view_fallback` | `getView(...)` |
| `InspectorHost` + `GameScreenState` slices | none | composition root (between `GameMap` and `LedgerRail`) | none (React state) | `ui_ref_opened` (+ `inspectorSize`) | `getInspectorState()` |
| Full's clock hold | none (interrupt auto-pause) | TIME readout | — | existing auto-pause traces | `getClockHold()`, `getInterruptState()` |
| `useRefRouter` (changed arms) | none | every link | — | `ui_ref_opened`, `ui_ref_unroutable` | trace viewer |
| `useCastOnTarget` + `TARGET_CONTEXT_BUILDERS` | none (player act; `commitPlayerCast` writes) | Act row, tray, commit line | `essencePool`, `unifiedActions` (as today) | `ui_card_arm` (cast), existing cast traces | `getInspectorState().armed` |
| `armedTargets.ts` | none | Inspector rows, map lit layer | reads | `ui_card_arm` | `getArmedTargets()` |
| Find (`findIndex.ts`, box) | none | `FindBox` under the top bar | reads | `ui_ref_opened` (`via: 'find'`) | `getView('findIndex')` |
| The lab | none | `?view=inspector-lab` | its own state | — | `getInspectorLab()` |

Prose pipeline: no `enrichProse()` call is added; moved prose keeps its own assembly. Player controls: `W`, Alt+←/→, Esc, Ctrl+K, `/`; the toolbar; the hand's arm; drag.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `INSPECTOR_HISTORY_MAX` | 50 | History entries kept; the oldest falls off |
| `INSPECTOR_TRAIL_CRUMBS` | `{ docked: 3, wide: 5 }` | Trail steps shown in the toolbar before "…" (Full lists all) |
| `CONNECTIONS_DOCKED_FOLD_AFTER` | 6 (THR-1822) | Rows a long group keeps when docked folding is needed |
| `INSPECTOR_OPEN_EASE_MS` | 500 (the existing `centerOn` ease) | Camera ease when the subject would be hidden |
| `CAMERA_CONSTANTS.FOCUS_ZOOM` (+ the map handle's `focusOn(hex)`) | 10 (THR-1831; THR-1878's camera slice adds both — if S3 lands first it adds them under these names) | The eye and Find's fly-to zoom — one camera jump game-wide |
| `ARMED_CLEARED_LINE_MS` | 2500 | How long the "left your hand" line stays in the banner before it clears |
| `ARMED_LOCKED_LIT` | 0.5 | Lit strength of a hex holding only locked targets, as a fraction of a castable hex's |
| `INSPECTOR_LAB_WARM_TICKS` | 30 | Ticks the lab runs before rendering (THR-1822's measurement tick) |
| `INSPECTOR_LAB_STRESS_NAME_CHARS` | 64 | The stress case's long name |
| `INSPECTOR_LAB_STRESS_ROWS` | 30 | The stress case's Connections rows |
| `INSPECTOR_LAB_STRESS_SECTIONS` | 15 | The stress case's body sections |
| `--find-box-w` (`src/index.css`, text family) | 35rem | Find box width (560 / 630 px) |
| `FIND_RESULTS_PER_GROUP`, `FIND_RECENT_COUNT`, `FIND_MIN_QUERY_CHARS`, `FIND_BOX_MAX_VH` | 6, 5, 1, 60 (THR-1832) | Find |
| `HOVER_CARD_MAX_SECTIONS` | 1 (existing) | Sections the hover card shows (those visible at `'hover'`) |

## Tracing

One new category; the existing `ui_ref_opened` gains a field.

- **Registration (the THR-928 trio):** `UiCardArmTrace` joins `src/types/traces/ui-traces.ts` (in `UiTrace` and `UI_TRACE_CATEGORIES`), and `'ui_card_arm'` joins the `TraceCategory` union and `TRACE_CATEGORIES` in `src/types/trace.ts`, so the vocabulary test and the DebugPanel filter see it.
- **Sink:** `emitTrace` from `traceBuffer.ts`, as `useRefRouter` does.

```ts
// UiCardArmTrace — emitted when a card is armed, given a target, cast, refused or disarmed
interface UiCardArmTrace {
  category: 'ui_card_arm';
  tick: number;
  actionId: string;
  event: 'armed' | 'staged' | 'cast' | 'refused' | 'disarmed';
  origin: 'hand' | 'act_row' | 'tray' | 'find' | 'drag';
  targetKind?: string;
  targetId?: string;
  reason?: string;            // the locked reason, or 'not_a_target', or 'card_left_hand'
  summary: string;            // "ui_card_arm: action.illuminating_whisper cast on agent npc_98 (hand)"
}
// UiRefOpenedTrace gains: inspectorSize?: 'docked' | 'wide' | 'full'
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A subject's node is gone or mismatched | `MissingPageVM` ("Unknown" — "this entity is no longer in the world"); the history entry stays so Back still works |
| A resolver throws | THR-1822's `readView` returns the selector's fallback and traces `view_fallback` once; the section is skipped; a mandatory row synthesises its "…" stub as today |
| A resolver needs `state` and has none (hover card, tests) | returns `null`; the section is skipped |
| A page kind's lab pick finds nothing in the seeded world | the lab cell shows the kind's labelled fallback ("No army in this world yet"), never a blank |
| A hex with no terrain art | the designed fallback tile (Law 4) |
| The land has no Area and no notable place | name falls back to the terrain word ("Open plateau"); *Around it* omits empty groups |
| `openInspector` not wired (style guide, tests, before S3) | the router pushes the legacy card as today |
| A pause-tier interrupt opens while Full is open | Full steps to docked; the clock hold transfers to the interrupt |
| The armed card leaves the hand (cast elsewhere, essence spent) | the arm clears itself; trace `refused` with `card_left_hand` |
| The armed card's target becomes invalid between choosing and casting | the cast re-reads the slot; if unavailable, the commit line shows the reason and nothing is spent |
| A drop lands on nothing | the arm stays, unchanged; no stage |
| A target category without a builder | impossible by type (`Record<TargetCategory, …>`); at runtime an unknown category renders the card locked with "This card has nowhere to land yet." and warns once |
| Measuring for fit-then-fold fails (no `ResizeObserver`) | show every group whole and let the column scroll (Law 33 still holds) |
| The minimap is not built | Full renders no locator |
| A remembered place has no snapshot | the row shows its kind word alone |
| Find index build exceeds a frame | THR-1822's switch: the selector keys on `structuralCacheVersion` |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 119 importers | One `TraceCategory` member and one `TRACE_CATEGORIES` entry (`ui_card_arm`). No `Record<TraceCategory, …>` exists in `src/`; the trace-vocabulary test is the only knock-on, and the registration satisfies it |

Every other file is below 100 importers (`types/detailPage.ts` 26, `data/surface-registry.ts` 12, `types/worldRef.ts` 17, `data/ui-content.ts` 24, `data/nudge-stage-content.ts` 24). `GameView.tsx` (1 importer) is large; its risk is merge conflict, handled by building after THR-1881 and by the coordination block. `src/types/gameState.ts` is **not** edited — Inspector state is React state, not game state.

## Three-pillar check

- [x] Engine pillar present — the page-layout table's engine half, subject view models, Connections, *In this land*, the inverse helper, Find, one cast path; no tick change
- [x] Content pillar present — the rows for every subject (the table is content), the moved land prose, one data home for the Inspector's words; encounter, prose-table and attachment content N/A with reasons
- [x] UI pillar present — the Inspector, the land page, three ways to play a card, Find, the lab, the retirements, the copy changes; laws engaged; text quoted
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise (files under `TheFantasyWorldSimulator/Vision/`). `02-non-negotiables.md` #3 (*mechanics through prose, never numbers*) is strengthened: § What exists lists every number and key the retiring sheets print, and each is banded at its source or dropped; #4 (*everything is a graph node*) and #6 (*additive*) hold — the land page is a page kind, not a node, and every type change is additive. `01-core-loop.md`'s "one story at a time" is kept: Full yields to any moment that needs the god, and a docked Inspector never holds a gift. `03-design-tensions.md` *legibility vs. mystery* is held where Christian left it: gating is deferred, Find keeps the seen floor, armed lighting respects fog. The taste profile's prose-first UI and "sphere-tinted cards are loved" hold (the tint is kept on every card surface).
- [x] No Vision edit is needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Card targets, prices, range and the one-target rule are unchanged (§ D9) — it changes where a card is cast from, not what casting is.
- [x] No `Docs/canon/rulebook.md` edit.

> Brainstorm companion: `Docs/plans/2026-10-14-thr-1876-the-inspector-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every geometry number is a THR-1819 token; every count and strength above is a named constant; section order, tab and width are table rows, not code |
| 2. Inspectability | PASS | `getInspectorState`, `openInInspector`, `getArmedTargets`, `getView`, `getInspectorLab`, `getEscapeLayers`; `ui_card_arm` traces every arm, stage, cast, refusal and disarm; the lab shows every page at every size |
| 3. Determinism | PASS | No randomness; the moved prose keeps its seeded picks (golden test); sorts are THR-1822's (ties by name then id) |
| 4. Fail-soft | PASS | Fail-soft table above; nothing here runs in the tick; a gone subject, a throwing resolver, a missing builder or a missing measurement each has a designed state |
| 5. Narrative over mechanical perfection | PASS | Pages lead with prose and words; numbers on the sheets are banded or dropped; the land page keeps the chronicle's prose |
| 6. Additive over destructive | PASS with note | All type and table changes are additive; the destructive part — deleting ~11,000 lines of retired surfaces — is Christian's approved decision (THR-1827 § Retires) and waits (S4) until parity tests prove nothing is lost |
| 7. Performance budget | PASS | Pages are world-keyed VMs: rebuilt at most once per tick and only when open; zero cost while paused; card counts only for rendered rows; armed lighting enumerates one target category over visible hexes; Find's index measured at 0.59 ms on a 2.8k-node world (THR-1822) |

## Done when

THR-1876's own build is **S1** (§ D16). Predicates (THR-688 rule A):

- [ ] `PageLayoutKind` includes `land`, `god`, `record`, `content`; `DETAIL_PAGE_REGISTRY` is total over it (a missing kind is a type error); `SectionSchemaEntry` carries `visibleAt` and `tab`; `INSPECTOR_TAB_LABELS` is total over `InspectorTabId`
- [ ] `Section.tsx` renders `links` and `cards` and the `panel` additions; each shape has a style guide sample and a `component-selection.md` row (`styleguideSync.test.ts` green); section labels are sentence case at the source (a test fails on an all-caps label in any registry resolver)
- [ ] `selectSubjectPage` dispatches every `WorldRefKind` and an event node through an exhaustive switch; every class's `body` comes from the table and keeps each row's `visibleAt` and `tab` (THR-1822 § D17 subject-page predicates, all of them)
- [ ] Connections: groups in `CONNECTION_GROUP_ORDER`, empty groups omitted, sort rules hold, every row present with `foldAfter`; the chain The Bone Coast → Temple Quarter → Shutash → the Congregation walks link by link on a fixture shaped like it
- [ ] *In this land*: People and Holder present with their empty lines on an empty hex; the when-present rows absent when empty; discovered sites appear when `hexRevelation` holds them
- [ ] The land rows reproduce HexChronicle's text byte for byte for three golden hexes; the naming rule holds with a Location and with only an Area
- [ ] The god rows read the moved selectors; `ascendant-bar/selectors.ts` re-exports them and the god rail renders unchanged
- [ ] The S1 fixes: the Faction Allegiances chip shows the rank word; "N turns ago", "at tick N", "On tick N" read through `elapsedLabel`; the worded keys in § D7 rows marked S1
- [ ] `planFolds` is a pure function with Node tests (fits → nothing folded; overflows → largest group first; all folded → scroll)
- [ ] `?view=inspector-lab` renders one real example of every page kind plus the stress case at docked, wide and Full, on both tier settings; a page kind without an `INSPECTOR_LAB_SUBJECTS` pick fails a named test; an edit to a registry row shows on hot reload; the style guide's sample page is replaced by the shape samples and a link
- [ ] Browser evidence (Playwright): lab captures at **1920×1080 and 2560×1440** (whole grid and the stress row); console clean; `await window.__DEBUG.getInspectorLab()` shows `overflowX: false` for every cell, a docked person cell with `hiddenForWidth` holding Chronicle and Chapters, and the stress cell docked with folded groups and wide with none; UI-Laws judgment line naming Laws 1, 13/14, 17, 21, 33, 37 (N/A — no encounter), **57** and **58**
- [ ] `Docs/design-system/extending.md` rows for the lists S1 introduces or extends (§ D15 rows marked S1)
- [ ] `npm test` and `npx vite build` pass; `npm run check:typecheck` ratchet clean; `npm run check:ui-debt` does not go up; engine paths touched → 30-tick CLI smoke and `npm run test:heavy`
- [ ] Closing commit body includes `Fixes THR-1876` on its own line

## Coordination block

**Suggested model:** opus — a wide, mostly additive build across the engine table, nine view-model classes and a new renderer, where byte-for-byte prose moves and exhaustive type-total lists need care.

**Parallel-safe with:** THR-1881 (the GameView split — S1 does not edit `GameView.tsx`); THR-1877's Stage build and THR-1879's type and icon rollout, except the files named under Mutex; THR-1886 (action categories — different files).

**Mutex with:**
- THR-1822 slice 1 — S1 builds on `src/engine/views/` and fills `hexContents`; **blocked by** it, not run beside it.
- THR-1875's frame build — both touch `ascendant-bar/selectors.ts` (whichever lands first moves it into `views/subjects/godSheet.ts` with a one-line re-export; the other imports from there) and, from S3 on, the composition root's layout grid, `GameScreenState`, `useTopBarHotkeys.ts` / the frame key list, `src/data/frame-registry.ts` (S7's `find` entry), `src/data/ia-manifest.ts` and `public/interface-reference.html` (this plan rewrites the Action Drawer and detail sections, the frame its own); S6 replaces the frame's `HandPressContext` provider.
- THR-1878's lens and map-chrome build — S3 edits `GameMap`'s click routing and `LocationLabelOverlay` (clickable labels) and calls `focusOn(hex)`; S6 imports the lens plate builder and sets `lensSuppressed`; `CAMERA_CONSTANTS.FOCUS_ZOOM` is shared (THR-1878 adds it; S3 adds it under the same name only if it lands first).
- THR-1879's rollout — S1 converts `Section.tsx`'s `SectionLabel` to the label rule; THR-1879's sweep skips that file's labels.
- Any ticket editing `src/data/detailPageTemplates.ts` or `src/engine/detailPageResolvers.ts` (S2a and S2b queue on these two files).

**Files to touch:** (S1; each slice ticket lists its own)
- Create: `src/engine/views/subjects/{subjectPage,landPage,locationPage,personPage,factionPage,armyPage,artifactPage,godSheet,contentCard,recordPage,actOn,landProse}.ts`, `src/engine/views/{connections,landIndex}.ts`, their `__tests__`, `src/components/Game/inspector/{InspectorPage,InspectorToolbar,SubjectHeader,ActOnRow,ConnectionsBlock,InThisLand,MoreWhenWidened,planFolds}.tsx|ts`, `src/components/Game/inspector/lab/{InspectorLab.tsx,labSubjects.ts,stressFixture.ts}`, `src/data/view-content.ts` (if not yet created), a Playwright spec for the lab
- Edit: `src/types/detailPage.ts`, `src/data/detailPageTemplates.ts`, `src/engine/detailPageGenerator.ts`, `src/engine/detailPageResolvers.ts`, `src/engine/contentPageGenerator.ts`, `src/engine/views/hexContents.ts`, `src/engine/views/types.ts` (header additions), `src/engine/views/selectors.ts` (register selectors), `src/components/Game/ascendant-bar/selectors.ts` (re-export), `src/components/shared/Section.tsx`, `src/components/StyleGuide/StyleGuide.tsx`, `src/App.tsx` (the lab route), `src/debug-bridge.d.ts`, `Docs/design-system/extending.md`, `Docs/design-system/component-selection.md`

## Notes for the executor

- **Build on `useRefRouter`; never route around it.** Every open in the game goes `router.open(ref, mode)`. A surface that calls `openInspector` directly is a review failure (S3 onward).
- **No body section lists a relation** (§ D6). If a field is a list of other world things, it is a Connections recipe step, and its extra fact is the row's `fact`.
- **The land prose moves byte-for-byte.** Capture the three golden hexes' text from `HexChronicle` *before* lifting the memos. Keep its own `hashString`; do not "fix" the second hash in `detailPageResolvers.ts`.
- **Do not migrate the retiring components onto view models.** S2 ports their *fields* into rows; S4 deletes the components.
- **Surface nouns** (Inspector, land page, Connections, *In this land*, Find, seen floor) are proposed for the UL in [THR-1882](https://linear.app/threadbare/issue/THR-1882); use them as the decision records do. Every Location / Place read goes through `sublocationShape.ts` (THR-1822's seam does this; a new resolver that reads places directly must too).
- **Words come from one home** (`view-content.ts`, `ui-content.ts`); import existing ladders (`elapsedLabel`, `durationLabel`, `HEADCOUNT_WORDS`, `NETWORK_SIZE_WORDS`, rank tiers) — never a local copy (`selectQuintessenceView`'s private ladder, `ascendant-bar/selectors.ts:108-112`, is one to fold in when the god rows move).
- **Range is unchanged.** Do not add a position to person or place target contexts; that would be a rule change (see the brainstorm's open question).
- **The lab is a dev view.** It may scroll; it is excluded from the UI-debt ratchet by the lab pattern; it never ships a player path.
- **Kill criteria — stop and report rather than push through:**
  1. A moved land-prose block cannot reproduce HexChronicle's text exactly → keep that block's memo logic as a pure function in its old file and import it; report on the ticket.
  2. A docked page cannot fit its tab row at 1080p even with per-width visibility → raise it as a Tabs API question on THR-1885 before writing a local overflow menu.
  3. The parity test finds a sheet field with no lawful home → stop S4 for that sheet and file it; never delete a field silently.
  4. Fit-then-fold measurement causes visible layout thrash (folds flipping on resize) → fold once per subject open and per size change only, and report.
  5. The lab shows a docked page that is unreadable even with per-width visibility and Connections (a person page that is mostly "More when widened") → revise this plan to give that kind a wider opening size through its `opensAt` row; never let the Inspector widen itself (Law 57).

## Intent-judge verdicts

*(appended after the gate runs)*

## Forked-audit verdicts

*(appended after the gate runs)*
