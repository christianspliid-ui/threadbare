# Action Proposal — THR-1878 map lenses and map chrome

Plan doc: `Docs/plans/2026-10-14-thr-1878-map-lenses-and-chrome.md`

---

## intent_quote

The ticket (Christian, created 2026-10-14, carve-up of the closed wayfinder map THR-1823):

> Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used. Load `hexmap-core` / `hexmap-layers` and `Docs/canon/hex-map.md`.
>
> **Draws on:** Lenses on the map (THR-1830) — four lenses, one at a time, none by default; one grammar (dim what is not in focus, one ink per lens); Spheres folded into the Dominion hover line; what moves off the plain map into lenses. · What can each map lens show today? (THR-1824) — data behind each lens. · Map chrome and markers (THR-1831) — control cluster, minimap, opening zoom, marker bands, border ink, uncharted parchment, label weights (corrected by THR-1833). · The icon family (THR-1834) — lens and control icons.
>
> **Must not fork:** the Dominion overlay owed by THR-1750's plan doc is lens one; this doc hosts it.
>
> **Foundation it builds on:** THR-1822 (lens view models), THR-1821 (primitives). Graduated bug THR-1846 (sieges draw as field battles) stays its own ticket.
>
> **Done when:** plan doc merged, issue in Ready for Dev with a coordination block.
>
> **Added 2026-10-14 (Christian, chat):** place icons on the map switch to carved shapes (capital `tower-flag`, city `medieval-gate`, town `village`, hamlet `wood-cabin`, castle `white-tower`, temple `greek-temple`, shrine `fire-shrine`, ruins `ancient-ruins`, mine `mine-wagon`, camp `camping-tent`, lair `cave-entrance`). They keep the map's ink, outline pass, size classes and lair tints. See call 2b of `Docs/audits/2026-10-14-thr-1834-icon-family-decision.md`.
>
> **Binding (UI Law 58, Christian 2026-10-14):** the UI grows by adding entries, not by writing screens. Lenses grow `MAP_LENSES` (`src/data/map-lenses.ts`); map markers and place shapes are one list each. A new lens or marker kind is one entry, and a missing one fails a named test. Each list gets a row in `Docs/design-system/extending.md`.

The parent session's brief (attended, 2026-10-14) adds: specify the four lenses as `MAP_LENSES` entries with list-driven dispatch and a named coverage test; each lens's view model from THR-1822; what moves off the plain map; the control cluster, minimap, opening zoom, marker bands, border ink and uncharted parchment; the label weights as corrected by THR-1833; the carved place icons on the map (texture path through `locationIconTextures.ts`, size classes, lair tints); a lit-hex click routing to THR-1876's land page; the keys; which GameView host from THR-1881 it builds into; the Law 58 lists and their `extending.md` rows; check whether THR-1846 shipped; slice into buildable tickets with coordination blocks; name the WebGL capture tool. Christian's chat request waived the design lane's veto window on the decisions this builds on (they stay vetoable in chat).

## scope (what this plan does)

Specifies, for the map in the map-first game screen: the four lenses as rows of one list with list-driven view-model and layer dispatch and a named coverage test; Dominion reused unchanged plus its pressure clause; Threads, Trouble and Trade view models on the THR-1822 seam with exact hover, legend and empty words; one generic hex-lens layer; what leaves the plain map; one list of map markers with per-zoom-band sizes; the control cluster and one list of map commands (keys and buttons); one centring zoom; the opening view; the minimap; agent label obstacles and label sizes, weights and faces; border ink and the parchment token; carved place icons through one map icon texture builder; the Law 58 lists and their `extending.md` rows; seven build slices with blockers, mutexes and Done-whens; four-part browser evidence with named tools.

## scope (what this plan does NOT do — explicit non-goals)

- Does not build the land page or route hex clicks to it (THR-1876); it only guarantees lens layers leave the click untouched.
- Does not vendor icon shapes, write the concept → shape table or the credits line (THR-1879); it names the concepts it needs.
- Does not extract GameView or create `GameMap.tsx` / `GameScreenState` (THR-1881); it builds into them.
- Does not change the Dominion lens, its projection or its view model beyond one additive field.
- Does not fix sieges (THR-1846 already shipped) and does not re-decide anything THR-1830, THR-1831, THR-1833 or THR-1834 decided, with two disclosed departures, each recorded in the plan's "Decisions this plan makes (veto invited)": (1) the key collision between THR-1831 and THR-1828 (zoom moves to PageUp/PageDown, no WASD); (2) THR-1830 § 6's "each kind gets one red mark" — battles and sieges get no Trouble badge, because the plain map already draws them (one fact, one mark); they still light their hexes and appear in the Trouble legend. The plan's other "veto invited" items are hows inside settled decisions (structured hover line, avatar size kept, minimap default rule, the suppression flag, the pressure-clause rule, texture size).
- Does not add a Spheres lens (THR-1830 § 5), stackable lenses, or a lens by default.
- Does not touch the Stage, the frame's top bar, Needs you or the Inspector; it gives the Stage and arming one flag to set.
- Adds no graph node, edge, tick phase, GameState field or rule of play.
- Does not retire `LiveLocationBar` (the Inspector build does).

## impact_class

Reversible — every slice adds UI, data lists and read-only selectors; two meshes are deleted only after their last caller moves into a lens. No CI, gate, ruleset, canon-rule or CLAUDE.md change. (The plan doc itself is docs-only.)

## evidence cited

- **Linear issue:** THR-1878 (and THR-1823, THR-1824, THR-1830, THR-1831, THR-1833, THR-1834, THR-1750, THR-1846, THR-1822, THR-1881, THR-1884, THR-1885, THR-1876, THR-1877, THR-1875, THR-1879, THR-1828, THR-1827)
- **Vision premises invoked:** `TheFantasyWorldSimulator/Vision/01-core-loop.md` (one story front-of-stage), `02-non-negotiables.md` § 3 (prose, never numbers), `03-design-tensions.md` § 4 (legibility vs. mystery)
- **UL terms touched:** map lens, the Inspector, land page (proposed in UL-proposal THR-1882); Location / Place tiers (through `sublocationShape.ts`). Player words "known land" and "minimap" are control labels, not game terms.
- **Canon pages consulted:** `Docs/canon/hex-map.md`, `Docs/design-system/laws.md` (Laws 1, 9–14, 17, 21–23, 25, 31–33, 35, 46, 47, 53, 56, 57, 58), `Docs/design-system/extending.md`, `Docs/canon/verification-gates.md` (WebGL capture), `Docs/ops/player-complaint-classes.md`
- **Prior plan docs / decision records this builds on:** the four decision records above; `Docs/plans/2026-10-12-thr-1750-dominion-on-screen.md`; `Docs/plans/2026-10-14-thr-1822-view-model-seam.md`; `Docs/plans/2026-10-14-thr-1821-component-library-and-ui-debt-ratchet.md`; `Docs/plans/2026-10-14-thr-1819-1440p-layout-contract.md`; `Docs/audits/2026-10-11-thr-1827-inspector-decision.md`; `Docs/audits/2026-10-12-thr-1828-screen-frame-decision.md`
- **Rejected approaches considered and dismissed:** one layer component per lens; rebuilding Dominion on the generic layer; symbol-glyph marks; badges on battle and siege hexes; rebinding speed; numpad-only zoom; minimap by screen tier; a second WebGL renderer for the minimap; string hover lines (all in the brainstorm companion). R3F stays rejected; the plan uses raw Three.js meshes.

## load-bearing decisions touched

- **Engine caches owned per session, never module singletons** — lens and minimap VMs go through THR-1822's `readView` cache on the runtime.
- **Never key change detection on graph identity** — selectors are keyed on `worldVersion` / `structuralCacheVersion`.
- **Agent position is three-tier; ask through `sublocationShape.ts`** — Threads destinations resolve through `resolveToParentLocation`; hex contents come from THR-1822's index.
- **Encounter awareness is hex-granular** — untouched; lenses use hex distance only for the omen reach.
- **Everything is a graph node / no new node types** — no node or edge is added; view models are not nodes.
- **Raw Three.js, d3-zoom owns camera state** — new camera methods (`focusOn`, `zoomBy`, `fitKnownLand`) set the d3 transform; no camera write outside `syncCameraToZoom`.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` (119 importers) — two trace categories registered.
- `src/engine/sublocationShape.ts` (105 importers) — read only.
The plan doc carries a Blast Radius section for both.

## kill criteria

1. A new hex lens cannot be added without editing the generic layer or the host → the list design is wrong; revise D1/D3 before Lenses II.
2. A playtest where testers miss a threat to their own things after rival marks leave the plain map → those marks return to the plain map from the Trouble VM (THR-1830's own trigger).
3. One label pass with marker obstacles costs more than 2 ms on medium at 2560×1440 → limit obstacles to threaded markers and report.
4. The carved places fail the glance test at regional zoom in the map's ink → stop before deleting the drawings and show Christian the capture.

## explicit user sign-off

Not High-risk. The settled decisions this builds on carry their own gates: THR-1834's carved places were chosen by Christian in chat (human gate satisfied via chat review 2026-10-14); THR-1830/1831/1833 were lane decisions whose veto window Christian waived in chat on 2026-10-14 for this authoring pass.

## author notes for the judge

- **The key move is the one place this plan departs from a decision record.** THR-1831 (2026-10-11) bound `+`/`−` to zoom and WASD to pan; THR-1828 (2026-10-12) kept `+`/`=`/`-` for speed and gave `W` to widen. Both are lane decisions; the later one wins the collision, so zoom moves to `PageUp`/`PageDown` and WASD is dropped. Recorded as "decided, veto invited".
- **THR-1822 D11 typed the hover line as a string.** This plan refines it to segments with refs so names can route (Law 21). THR-1822's slice 1 builds no lens VM, so nothing built changes.
- **THR-1846 shipped** (Done 2026-10-14 02:05 UTC); re-measured in code. The Trouble lens builds on the fix.
- **Population:** the CLI world has no thread edges, few routes and no local omens early; the plan's tests run on fixtures that carry them, and the empty states have words.
- **Dependencies are deep by design** (THR-1822 → THR-1881 → the lens slices; THR-1885 and THR-1879 for icons). Two slices (markers and labels; border ink) need only THR-1822 and can start first.
- I resolved where icons for marks come from (THR-1879's table) and where the place-type → shape table lives (THR-1879's, total over the map's union) by coordination comments on THR-1879, THR-1876, THR-1877 and THR-1875 (2026-10-14).
