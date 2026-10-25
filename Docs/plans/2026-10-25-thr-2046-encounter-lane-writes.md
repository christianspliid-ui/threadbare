> **title:** A road's encounters write to that road — the ambush, the toll dispute and the embargo know their lane, a lost caravan threatens it, and a struck toll goes to a banner — THR-2046
> **linear_issue:** THR-2046
> **author:** Claude Code (design lane, run 2026-10-25h, unattended)
> **created:** 2026-10-25
> **three_pillars:** Engine done · Content done · UI done (one new receipt row on the existing aftermath economy change; the trade lens and the red road already read both writes — § UI pillar)

# A road's encounters write to that road — THR-2046

*When bandits are beaten off a road, that road clears. When a caravan is lost, its road turns red. When a mortal strikes a toll, a banner collects it.*

## Why this is load-bearing

[Money encounters, later rows](https://linear.app/threadbare/issue/THR-1954) holds the rows the [mortal wealth plan](2026-10-15-thr-1936-mortal-wealth.md) could not build cheaply. This plan takes three of them: *writes bound to one lane* (research defect 8), *toll writes* and *threatened lanes* (both left unbuilt by S3, [THR-1953](https://linear.app/threadbare/issue/THR-1953) comment of 2026-10-24). The rows come from the [outcome research table](https://linear.app/threadbare/issue/THR-1872) § Lane events and its toll bridge, pirate raid, overdue caravan and caravan escort rows.

Measured on main @ 1d578d8f:

- **The lane events forget their lane.** `routeEventsPhase` plants a seed per lane (`src/engine/phases/routeEvents.ts:211-221`). The seed has no lane field: `routeEdgeId` reaches only the trace (`:233`). The three templates have empty step ops and no `outcomeEffects` (`src/data/route-event-encounter-content.ts`, research defect 7).
- **`lane_volume` guesses.** `shiftLaneVolume` writes `busiestRouteAt(graph, settlement)` (`src/engine/economyShift.ts:126`).
- **No encounter can threaten or clear a road, or set a toll.** `economy-shift-constants.ts:107-111` defers both. Yet `threatened` already has readers: prosperity's active-route count (`phaseProsperity.ts:301,318`), purse tolls and holding tolls pay nothing on a threatened lane (`factionPurse/income.ts:258`, `holdingIncome.ts:117`), army supply (`armySupply.ts:262`), lane traffic (`tradeRoute.ts:481`), the trade lens and the red road (`tradeLens.ts:161`, `TradeRouteMesh.ts:97`), and the aftermath's *Roads threatened* / *Roads clear* rows (`castEconomyReceipt.ts:354-371`). A toll is `controlledBy` on the lane, paid to a faction (`factionPurse/income.ts:373-380`) or a mortal holder (`holdingIncome.ts:112-125`).
- **The lane events never reach a hamlet.** They gate on `'village'`, which is not a `LocationSubtype` (`src/types/index.ts:65`; research defect 6).

Census (`scripts/lane-event-census.ts`, unmerged branch [`proto/thr-2046-lane-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2046-lane-census)). It used a medium map and 360 ticks (30 days), with one seed per process:

| seed | lane seeds (ambush / embargo / toll) | busiest-lane write would hit the seeded lane / miss | ambush resolved (won / F / CF) | embargo resolved | toll bridge S+ | caravan escort F/CF | overdue caravan CF | pirate raid CF | lanes tolled at day 30 |
|---|---|---|---|---|---|---|---|---|---|
| 42 | 8 / 5 / 0 | 8 / 5 | 9 (2 / 7 / 0) | 10 | 3 | 0 | 0 | 0 | 1 of 51 |
| 99 | 24 / 6 / 0 | 14 / 16 | 44 (3 / 36 / 5) | 14 | 7 | 5 | 1 | 0 | 1 of 64 |
| 7 | 17 / 2 / 0 | 4 / 15 | 75 (1 / 57 / 17) | 6 | 2 | 7 | 1 | 0 | 1 of 52 |

So **5 of 13, 16 of 30 and 15 of 19 seeded events would write the wrong road** today. Ambushes and embargoes resolve more often than they are seeded, because organic draws add to the seeds, and those draws have no lane. **The toll dispute was never seeded on any of the three seeds**: no lane had hostile controllers at both ends. Its rows are authored for when it does fire, but the toll this plan delivers in practice is the toll bridge's.

## Decisions

Decided by the design lane under delegation, 2026-10-25 (process.md rule 4). The record is on [THR-2046](https://linear.app/threadbare/issue/THR-2046). Veto in chat.

1. **A seeded lane event writes its own lane.** The seed carries the lane, the encounter it spawns carries it, and every lane write in its outcome table uses it. Without a lane (an organic draw, or a lane removed since), the write falls back as today: the busiest lane at the town. Clearing a road falls back to the lowest-id threatened lane at the town instead. *Veto:* "an encounter should always pick the town's busiest road".
2. **Encounters can threaten a road and clear one.** A threat lasts as long as an ambush's (`ROUTE_THREATENED_CLEAR_TICKS`, 24 ticks), so it clears itself. A road under a blockade (`blockadedBy` set) is never cleared by an encounter, because only the blockade verb lifts a blockade. *Veto:* "a lost caravan should not turn its road red".
3. **A struck toll goes to the town's banner.** A toll write sets `controlledBy` to the faction that controls the scene's town. If no faction holds the town, the acting mortal holds it, through the holding-income toll that already exists. An encounter never takes a toll from a mortal who holds one. *Veto:* "the mortal who strikes a toll should keep it".
4. **Bounded failure.** An ambush failure thins the road by one run. Only a critical failure also costs the town prosperity (`W_PROSPERITY.small`), because ambushes fail 36–57 times a month on two seeds. *Veto:* "every failed ambush should hurt the town".

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Route events (`phases/routeEvents.ts`, THR-669) | 🟢 ACTIVE writer; the seed's lane 🟠 dropped | **extends**: the seed carries the lane |
| Encounter seeding (`encounterSeeding.ts`) | 🟢 ACTIVE | **extends**: one field passes through, re-validated (the `opposingGroupId` path) |
| World economy shift (`economyShift.ts`, THR-1953) | 🟢 ACTIVE | **extends**: two quantities and a lane anchor |
| Trade lanes: `threatened`, `controlledBy` (`tradeRoute.ts`) | 🟢 ACTIVE, about 15 readers | **writes** existing properties; no reader changes |
| Faction purse tolls / holding tolls | 🟢 ACTIVE | **reads** unchanged: a toll set here is paid by them |
| Cast economy receipt (`castEconomyReceipt.ts`) | 🟢 ACTIVE | **extends**: one toll row |

Population: 13–30 seeded lane events and 6–75 organic-plus-seeded lane-event resolutions per 30 days per seed (census above).

## Engine pillar

### Systems design

**The lane binding** (precedent: `opposingGroupId`, seed → action, `encounterSeeding.ts:516-524,827-829`):

- `PendingEncounterSeed` gains `readonly laneEdgeId?: string`. `routeEventsPhase` writes `laneEdgeId: route.id` on every seed it plants.
- `encounterSeeding.ts` gains `resolveSeedLane(seed, graph)`: the id if `graph.getEdge(id)` is a live `trades_with` edge, else `undefined`. The spawned action gets `laneEdgeId` beside `opposingGroupId`.
- `UnifiedAction` gains `readonly laneEdgeId?: string`.
- `encounterAftermath.ts` (`case 'economy_shift'`, `:1880`) passes `laneEdgeId: action?.laneEdgeId` to `applyWorldEconomyShift`.

**The lane anchor.** A new `resolveLaneAnchor(graph, laneEdgeId, settlementId)` in `economyShift.ts` returns `{ lane?: GraphEdge; settlementId?: string; source: 'seed' | 'fallback' }`. A live bound lane wins. If the actor's town is not one of its ends (the mortal moved), the lane's `source` end becomes the settlement, so the receipt reads the town the road touches. `outcomeTableSettlements` (`unifiedActionResolution.ts:3369`) calls the same helper for lane quantities, so the write and the receipt agree.

**Two new world quantities** on the existing `economy_shift` (Law 41: one vocabulary of effects, no new effect kind):

- `lane_threat`: `amount > 0` sets `threatened: true, threatenedSinceTick: tick` on the anchored lane. `amount < 0` clears both, unless `blockadedBy` is set. With no bound lane, a mark goes on the busiest lane and a clear goes on the lowest-id threatened lane at the town. A lane already in the wanted state returns null (Law 56).
- `lane_toll`: `amount > 0` sets `controlledBy` to the toll holder (decision 3): the source of the town's incoming `controls` edge if it passes `isPurseFaction`, else the acting mortal if it passes `isMortalHolder` (`holdingIncome.ts:88`, exported by this plan). It returns null when the lane is already held by that holder, or held by a mortal, or when there is no holder. `taxRate` is left as it is. A negative amount is a content error (invariant below).
- `shiftLaneVolume` uses the anchor and keeps `ENCOUNTER_LANE_VOLUME_FLOOR`.

`applyWorldEconomyShift` takes `laneEdgeId?` and `actorId?` (for `lane_toll`'s fallback). `WorldShiftResult` gains `laneSource?: 'seed' | 'fallback'` and, for a toll, `holderId`.

`WorldEconomyQuantity` and the two quantity unions (`types/unifiedAction.ts:594`, `types/trace.ts:2090`) gain `'lane_threat' | 'lane_toll'`. `ECONOMY_SHIFT_STEPS` gains `{ small: 1, step: 1, big: 1 }` for both, because a mark is a mark.

### Graph nodes / edges

No new node or edge type. The writes are properties on the existing `trades_with` edge: `threatened`, `threatenedSinceTick` and `controlledBy`, all three with existing writers (`routeEvents.ts:224`, `strategicGraphOps.ts:1211`, the seize verb).

### Tick phases · Resolution · PRNG

Writes happen in outcome-table resolution, as for every S3 row. The route-event phase only adds a field to its seeds. There is no PRNG anywhere: anchors fall back by id order.

## Content pillar

Outcome rows, authored as `outcomeEffects` (`§` = `economy_shift` with that quantity; staple rows use `harvestStockAmount(band)` as S3 does):

| Template | CS | S | SaC | F | CF |
|---|---|---|---|---|---|
| `encounter_route_ambush` | threat −1, Means +`MEANS_STEP` | threat −1, Means +`MEANS_STEP` | threat −1 | lane −`W_LANE.small` | lane −`W_LANE.step`, prosperity −`W_PROSPERITY.small` |
| `encounter_toll_dispute` | toll +1 | toll +1 | toll +1 | lane −`W_LANE.small` | lane −`W_LANE.step` |
| `encounter_route_embargo` | lane +`W_LANE.step`, staple + | lane +`W_LANE.step`, staple + | staple + | staple −, unrest +`W_UNREST.small` | staple −, unrest +`W_UNREST.step` |
| `encounter.toll_bridge` | toll +1 (added) | toll +1 (added) | — | unchanged | unchanged |
| `encounter.pirate_raid` | — | — | — | unchanged | + threat +1 |
| `encounter.town.overdue_caravan` | unchanged | unchanged | — | unchanged | + threat +1 |
| `encounter.trade_caravan_escort` | unchanged | unchanged | — | + threat +1 | threat +1, lane −`W_LANE.small` |

The three lane events' `locationSubtypes` change from `['village','town','city','capital']` to `['hamlet','town','city','capital']`.

The prose already says each of these things: the ambush's *"the road breathes easier. Trade remembers who cleared it"* and *"The road stays dangerous"*, the toll dispute's *"a rate is struck"*, the escort's *"lost half the goods … to the ambush"*. So no new line is owed (Law 45: the prose's promise is now kept). The embargo's grain-only prose (research defect 5) stays as it is: `staple` moves every staple, which includes grain.

## UI pillar

UI Laws engaged: 56 (a row only for a move that happened), 13 (words, not numbers), 21 (the holder is a linked name), 43 (the existing road words).

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Before: the encounter's own stakes (unchanged) | ambush *"broke the ambushers and brought cargo home"* / *"pulled back and left the road to the ambushers"*; toll dispute *"strike a toll rate both banners will take"*; escort *"lose the lead wagon and two guards to the ambush"* | PC-2 (the before-line already names the road and its danger; no new line owed) | What is at stake on this road |
| Aftermath `economy` change, threat (existing *lane* rows, `economy-receipt-content.ts:88-97`) | "Roads threatened" — "The road from Ashford is threatened." · "Roads clear" — "The road from Ashford is no longer threatened." | PC-2 (cause named where it lands) | The road they just fought on |
| Aftermath `economy` change, toll (**new** `lane.toll` row) | "A toll is set" — "The road from Ashford is tolled by the Iron Compact." | PC-6: the lens says *"Tolled by {holder}."* (`regional-monopoly-words.ts:17`); the row uses the same verb and holder, and adds the town because an aftermath row has no road in view | Who collects now |
| Trade lens (existing, `tradeLens.ts:161-206`) | red road; *"Tolled by the Iron Compact."* | — | The same facts, read later on the map |

### Playtest signal

A tester who wins a road ambush on a red road sees a *Roads clear* row in the aftermath, and that road is gold again on the trade lens. A tester who loses a caravan escort sees *Roads threatened*, and the road is red on the lens until about two days later. A tester whose mortal wins a toll bridge sees *A toll is set*, and the lens shows *Tolled by* with the same holder.

Wiring for the toll row: `EconomyLaneSnapshot` (`castEconomyReceipt.ts:74`) gains `controlledBy?: string`, and `laneChanges` emits one `toll` crossed row when a lane's holder changed. The holder is a linked segment through the receipt's existing `placeChange`, with a `{holder}` token added beside `{town}`. Nothing is drawn on the plain map beyond the red road that already exists (THR-1830).

- **Debug:** the existing trade-route accessor (`debug-bridge.d.ts:1400`) gains `controlledBy` and `threatenedSinceTick`. A new `window.__DEBUG.getActionLane(actionId)` returns the action's `laneEdgeId ?? null`.
- **Browser-verify:** ≤400 non-test UI lines, so one 1920×1080 screenshot of a lane-event aftermath carrying the row (Playwright DOM, `?view=game&seeded&size=medium&spawn=encounter_route_ambush`), plus `getActionLane`.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Phase | UI component | GameState | Trace | Debug |
|---|---|---|---|---|---|
| `routeEvents.ts` seed `laneEdgeId` | `route_events` | — | `pendingEncounterSeeds` | `route_event_seeded` (existing) | seed list |
| `encounterSeeding.ts` `resolveSeedLane` | seed evaluation | — | `unifiedActions[].laneEdgeId` | `encounter_seed_triggered` gains `laneEdgeId` | `getActionLane` |
| `economyShift.ts` `lane_threat` / `lane_toll` / anchor | outcome table | aftermath `economy` change | `trades_with` props | `economy.world.shift` gains `laneSource`, `holderId` | trade-route accessor |
| `castEconomyReceipt.ts` toll row | outcome table | aftermath | — | — | — |

Wiki: `public/settlements-economy-reference.html` sources `economyShift.ts`. Add one sentence (the wiki-freshness gate names the page).

## Interface impact

| Contract | Change | Note |
|---|---|---|
| Encounters → Economy: an outcome row moves a lane (`encounter-shifts-lane`, S3) | **extend** | writes the bound lane; adds `threatened` and `controlledBy`. Production reads: prosperity, purse and holding tolls, army supply, lane traffic, the trade lens |
| Route events → Seeding: a seed carries its lane | **add** | read by `resolveSeedLane` |
| `faction-purse-pays-faction-holders` | preserve | a toll set here is paid by the existing toll line |

Update `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `ECONOMY_SHIFT_STEPS.lane_threat` / `.lane_toll` | `{1,1,1}` | a mark is a mark |
| `ENCOUNTER_THREAT_CLEAR_TICKS` | `ROUTE_THREATENED_CLEAR_TICKS` (24) | how long an encounter-set threat lasts: written as `threatenedSinceTick = tick − (ROUTE_THREATENED_CLEAR_TICKS − ENCOUNTER_THREAT_CLEAR_TICKS)`, so the route-event sweep clears it; the kill criteria's lever |
| `ENCOUNTER_LANE_WRITES_ENABLED` | `true` | rollback: `false` makes `lane_threat` / `lane_toll` no-ops and ignores `laneEdgeId` |

The doc comment on `ENCOUNTER_LANE_VOLUME_FLOOR` drops "deferred". The floor itself stays: an encounter still never severs a lane.

## Tracing

Additive fields on existing trace members (no new category):

```ts
// economy.world.shift (types/trace.ts:2090)
quantity: 'prosperity' | 'unrest' | 'stock' | 'lane_volume' | 'purse' | 'lane_threat' | 'lane_toll';
laneSource?: 'seed' | 'fallback';   // lane quantities only
holderId?: string;                  // lane_toll only: the faction or mortal now holding the toll

// aftermath_target_invalid: reason gains 'blockaded' | 'no_holder'
// encounter_seed_triggered: laneEdgeId?: string
```

## Fail-soft table

| Failure | Fallback |
|---|---|
| bound lane deleted before the encounter fires | `resolveSeedLane` drops it; fallback anchor |
| bound lane does not touch the actor's town | anchor on the lane's source end |
| no lane at the town | null, `no_move` trace |
| lane blockaded, clear asked | null, `blockaded` |
| no faction and no mortal holder | null, `no_holder` |
| lane already held by a mortal | null, `no_move` (a holding is never stripped) |
| switch off | today's behaviour exactly |

## Blast Radius

| File | Importers | Note |
|---|---|---|
| `src/types/trace.ts` | 129 (grep, main @ 01cd21b6) | optional fields only |
| `src/types/unifiedAction.ts` | ≥100 (wide-blast list) | two optional fields and two union members; `Record<WorldEconomyQuantity, …>` is the one exhaustive consumer, and this plan fills it |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (seven outcome tables, one gate fix)
- [x] UI pillar present (receipt toll row; existing threat rows and trade lens)
- [x] Wiring section connects them

## Game Design Laws

Conforms to 22 (a lost caravan leaves a red road the world acts on), 41 (two quantities on the one effect), 42 (no per-template case: the binding rides every seed), 45 (*"who cleared it"* and *"a rate is struck"* now happen) and 56. Breaks none.

## Vision audit

- [x] Does not contradict a Vision premise. Checked: `Vision/02-non-negotiables.md` (prose, not numbers; the graph is the substrate), `Vision/01-core-loop.md` (aftermath consequences compound: a red road starves a town's prosperity and its tolls).
- [x] No Vision edit needed.

## Rulebook impact

- [x] A rule of play changes: an encounter on a road writes that road.
- [x] The `Docs/canon/rulebook.md` edit is owed in the build PR, not as a follow-up. In the build PR, after *"Money encounters move the town too"* in `Docs/canon/rulebook.md`, and in the quick reference's road paragraph: *"An encounter on a road writes to that road: beating off bandits clears it, a lost caravan threatens it, and a struck toll goes to the faction that holds the town, or to the mortal if no faction holds it."* (`[IMPL — THR-2046]`).

> Brainstorm companion: `Docs/plans/2026-10-25-thr-2046-encounter-lane-writes-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | named steps, a switch; durations reuse the ambush's |
| 2. Inspectability | PASS | `laneSource` and `holderId` on the trace, `getActionLane` |
| 3. Determinism | PASS | no PRNG; id-order fallbacks |
| 4. Fail-soft | PASS | table above |
| 5. Narrative | PASS | the prose's own promises come true |
| 6. Additive | PASS | optional fields, two union members |
| 7. Performance | PASS | one edge lookup per write; no per-tick work added |

## Done when

- [ ] `economyShift.test.ts`: a bound lane is written over the busiest one; a moved actor anchors on the lane's source end; `lane_threat` marks and clears; a blockaded lane is never cleared; `lane_toll` gives the town's faction the toll, falls back to a mortal actor, and never strips a mortal holder; the switch off restores today's behaviour.
- [ ] `encounterSeeding` test: a route-event seed's action carries `laneEdgeId`; a deleted lane drops it.
- [ ] Content invariant: every `lane_toll` amount is positive; no template uses `'village'`.
- [ ] `census:lanes` (the proto script, landed under `scripts/`) on seeds 42/99/7 × 360 ticks: on every seed, **every** seeded lane event that wrote a lane wrote its own (`laneSource: 'seed'`); on at least two seeds, at least one encounter-set toll and one encounter-set threat appear.
- [ ] Rulebook and quick reference lines, interface map and contracts, wiki sentence; `npm run gate` green; one 1920×1080 aftermath screenshot and the `getActionLane` assertion.

## Kill criteria

- An encounter-set threat starves a town: `phaseProsperity` reports a town dropping a whole tier in the census that main does not show. Halve an encounter threat's life (`ENCOUNTER_THREAT_CLEAR_TICKS`, Constants table, 24 → 12) and re-measure; still there → ship with `lane_threat` marks off.

## Coordination block

**Suggested model:** sonnet — field plumbing on a precedent path, two cases in one switch, content rows, one receipt row.

**Parallel-safe with:** [the sequel-place bug](https://linear.app/threadbare/issue/THR-1929) (seed firing place only — but see Mutex), [famine and glut draws](https://linear.app/threadbare/issue/THR-2040) (scoring).

**Mutex with:** [the faction commission pay](https://linear.app/threadbare/issue/THR-2042) and [the debts plan](https://linear.app/threadbare/issue/THR-2023), because all three edit `unifiedActionResolution.ts` near the outcome table. [The sequel-place bug](https://linear.app/threadbare/issue/THR-1929) edits `encounterSeeding.ts` seed spawning. Rebase onto whichever merges first.

**Files to touch:** `src/engine/economyShift.ts`, `src/engine/encounterAftermath.ts`, `src/engine/encounterSeeding.ts`, `src/engine/phases/routeEvents.ts`, `src/engine/unifiedActionResolution.ts`, `src/engine/castEconomyReceipt.ts`, `src/engine/holdingIncome.ts` (export `isMortalHolder`), `src/data/economy-shift-constants.ts`, `src/data/economy-receipt-content.ts`, `src/data/route-event-encounter-content.ts`, `src/data/encounter-content.ts`, `src/data/encounters/overdue-caravan.ts`, `src/types/unifiedAction.ts`, `src/types/trace.ts`, `src/testing/contentInvariants.ts`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, tests; `scripts/lane-event-census.ts` + `census:lanes`; the rulebook pair, interface map and contracts, the wiki page.

## Notes for the executor

Do not sever a lane, and do not lower `ENCOUNTER_LANE_VOLUME_FLOOR`. Do not clear a blockaded lane. Do not re-tune lane-event difficulty here, even though ambushes fail most of the time: that is a separate balance question. The toll dispute will not fire on the census seeds, so test its rows with a fixture. An ambush seed already marks its lane threatened when it is planted (`routeEvents.ts:223-227`), so add one test that an ambush win yields a *Roads clear* receipt row.

## Intent-judge verdicts

| Run | Verdict | Findings | Fixed by |
|---|---|---|---|
| 1 | Revise | dim 11: no `## Substrate inventory`; dim 12: no Player-facing text / Playtest signal headings, the toll row worded differently from the lens's *"Tolled by {holder}."*, no before-line; dim 4: trace fields in prose, kill-criteria constant unnamed | All sections added; trace fields as a `ts` block; the row reuses "tolled by"; stakes quoted as the before-line; `ENCOUNTER_THREAT_CLEAR_TICKS` in Constants |
| 2 | **Allow** | dim 6 GAP: "banner" in the owed rulebook line is not a UL term; advisory: test that an ambush win yields *Roads clear* | The rulebook line says "faction"; test added to Notes for the executor |

## Forked-audit verdicts

### NFP audit
PASS-with-notes. All seven pass. Note on 7: "one edge lookup per write; no per-tick work added" is plausible but unmeasured. The census only counted events. The build's census run covers it (tick cost is printed per seed).

### Three-pillar audit
PASS. Engine, Content and UI are all present and substantive. The Wiring table ties each module to its phase, UI surface, state, trace and debug. The substrate inventory extends six existing systems and rebuilds none.

### Vision audit
PASS-with-notes. No contradiction with the north star, core loop, non-negotiables, design tensions or taste profile. Note: the toll holder lives as `controlledBy`, an id in a property bag on the `trades_with` edge, which sits near non-negotiable #4. That shape predates this plan: the seize verb, the purse toll line and holding income all read and write it. This plan adds no new id-valued property, so moving tolls to an edge is out of scope.
