> **title:** `The owed readers — every live undertaking cell's write gets its reader — THR-1428`
> **linear_issue:** THR-1428
> **author:** `Claude Code`
> **created:** 2026-09-07
> **three_pillars:** Engine `done` · Content `done` · UI `done`

# The owed readers — every live undertaking cell's write gets its reader — THR-1428

*Nine live undertaking cells write into systems that nothing reads; this plan wires the readers they were decided to have, and in doing so puts a mortal's work into three subsystems it has never reached.*

## Why this is load-bearing

The verb × object model (THR-1392) made every undertaking a verb on a kind the world already has, and the grid (`Docs/canon/undertaking-grid.generated.md`) shows 42 live cells. Nine of them record, in the grid's own "Owes" notes, a reader they still lack: the five observe cells write a `strategicIntelligence` record on the actor that no engine module reads; a seized route's `taxRate` is written and collected by nobody; a ruined settlement writes a `ruins` subtype the delve layer never keys on; a controlled Location pays no tithe; a cast spell charges its soul-price to the `doom` health meter instead of the quintessence meter where the game's threshold gates bite, and stamps an `exhaustedUntilTick` nobody checks. Every one of those readers was decided in [THR-1397](https://linear.app/threadbare/issue/THR-1397) with the operation named, and the operations already exist (`seedKnowsOf`, `spawnClue`, `mintTreasureMap`, the `WEALTH_*_INCOME` constants, `pendingQuintessenceEvents`).

The wayfinder map [THR-1396](https://linear.app/threadbare/issue/THR-1396) measured what the gap costs on 2026-09-07 ([THR-1399](https://linear.app/threadbare/issue/THR-1399), the callings × cells prototype): a mortal's built work reaches the items-and-holdings system for 21 of 23 callings and the settlement economy for 20, while intelligence, ruins & delves and quintessence are reached by none. A Seeker under a discovery ambition reaches exactly one system through built work — its six observe cells go nowhere. Christian's ruling that day: *"we need to ensure that we spread out undertakings to interface with all the different systems, and not overcrowd certain parts of the game where we already have a lot of complexity"*, and on the systems reading, *"the dynamism of a living organic world is hyperconnectivity"*. This band was ordered first because it opens three subsystems for 22 callings without adding a single cell to the crowded settlement column — a wire with one end loose becomes a connection.

What it unblocks: the fourth per-calling gate the map adopted (built cells reach ≥ 3 subsystems) passes for every calling only once these readers exist; the dormant-kinds band (next) inherits the "every new cell names its reader in the same commit" rule this plan establishes in canon. That rule is the agent's extrapolation of the hyperconnectivity ruling, not itself a recorded map decision — decided here, veto invited.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Strategic Projects & Control | 🟢 ACTIVE | **extends** — `resolveUndertakingCompletion` unchanged; the object registry's `observe`, `destroy × Location`, `use × Power` semantics gain their readers; `ObjectVerbContext` gains an optional `outcome` band |
| Intelligence, Knowledge & Familiarity | 🟢 ACTIVE | **activates as a reader of mortal work** — `knows_of` familiarity (`seedKnowsOf`, already written by clue convergence in `ruins/clueLifecycle.ts:470`) becomes the product of observe; `strategicIntelligence` stays as-is (additive) |
| Ruins, Clues & Delves | 🟢 ACTIVE | **extends** — `spawnClue` gets its first cell caller (observe × Location on the ruin / wonder classes); delve admission (`ruins/delveVariant.ts:306-334`) admits a mortal-ruined settlement after a decay window |
| Mortal Economy & Prosperity | 🟢 ACTIVE | **extends** — a `holding_income` pass pays two of the three unpaid `WEALTH_*_INCOME` constants (`WEALTH_ROUTE_CONTROL_INCOME`, `WEALTH_SUBLOCATION_INCOME`; `src/engine/wealth.ts:21-24`) plus a new Location tithe, through `applyWealthDelta` and the existing `wealth_delta` trace; `WEALTH_PROSPEROUS_HOME_INCOME` stays unpaid on purpose (R3 says why) |
| Attachments, Items & Possessions | 🟢 ACTIVE | **extends** — `mintTreasureMap` gets its first cell caller (observe × Area, strong result); nothing new minted otherwise |
| Spheres & Quintessence | 🟠 DORMANT (inventory badge; `phaseQuintessence` runs every tick) | **activates as a consumer of the spell price** — the `doom_increase` spell cost becomes a `QuintessenceEvent` on `pendingQuintessenceEvents`, consumed by `phaseQuintessence` where the threshold states already bite |
| War, Armies & Battles | 🟢 ACTIVE | **bug fix only** — `armySupply.ts:204 hasReliefLine` reads the first incoming `controls` source as a faction; a mortal claimant is misread. Filtered to faction-typed sources. Recorded on the map as "a fix, not a decision" |
| Effects & Conditions | 🟢 ACTIVE | **preserves** — `activateSpell`'s condition writes unchanged; exhaustion gains its reader in the use × Power cell |
| Attention, Chronicle & Narrative | 🟢 ACTIVE | **extends** — the observe completion sentence names what was learned; holding income gets a rate-limited economic chronicle line |

Grep evidence: `seedKnowsOf`, `spawnClue`, `mintTreasureMap` are exported from `src/engine/strategicGraphOps.ts:451-600` and called from no cell (`grep -rn "seedKnowsOf\|spawnClue\|mintTreasureMap" src/data/undertaking-objects.ts` → 0 hits); `WEALTH_ROUTE_CONTROL_INCOME`, `WEALTH_SUBLOCATION_INCOME`, `WEALTH_PROSPEROUS_HOME_INCOME` are defined in `src/engine/wealth.ts` and used by no phase (`grep -rn` across `src/engine` → definitions only); `exhaustedUntilTick` is written at `spellActivation.ts:277` and read nowhere. Runtime population consumed: on seed 42 medium at tick 30 the five observe cells are walked by every eye-, veil- and stone-bearing calling (14 of 23 callings reach an observe cell under the division rule, THR-1399 prototype); the census ticket measures the actual start counts.

## Engine pillar

### Systems design

Six readers, each a small addition at the seam the grid already names. **No new cell, no new kind, no new verb.** The rule this plan writes into canon: *a cell's write and its reader ship in the same commit* — a wanted cell that cannot name its production reader is not built.

**R1 — Watching writes familiarity (observe × Area / Location / Place / Route / Faction).** The shared `observe` semantic in `src/data/undertaking-objects.ts:241` keeps its `recordIntelligence` write (additive) and gains, per kind:

| Kind | Familiarity written (`seedKnowsOf`) | Extra on the ruin / wonder classes | Strong result (`ctx.outcome === 'critical_success'`) |
|---|---|---|---|
| Area | every Location in the area the actor is not yet familiar with, up to `OBSERVE_AREA_FAMILIARITY_CAP` | — | one treasure map (`mintTreasureMap`) to one unfamiliar ruin- or wonder-class Location in the area, if any |
| Location | the Location | `spawnClue` on it, precision by band (`OBSERVE_CLUE_PRECISION_BY_BAND`), magnitude `OBSERVE_CLUE_MAGNITUDE` | a `knows_secret_of` mark (`mintLeverageMark`) about one mortal located there |
| Place | the Place and its parent Location (`resolveToParentLocation`) | — | as Location, about a mortal at the Place |
| Route | both endpoint Locations (`routeSourceId`, `routeTargetId` on the identity node) | — | — |
| Faction | the faction's seat Location (the Location it `controls` nearest the actor; none → skip) | — | a mark about the faction's leader (`getFactionLeaderId`) |

`seedKnowsOf` and `spawnClue` are idempotent per pair and refuse duplicates with a named error; the semantic treats `already_known` / `clue_already_held` / `map_already_held` as success-with-nothing-new and records that on the trace. Precision by band means a ruin observed on a plain success yields a `narrowed` clue; it takes a critical success to `locate` it, which is what the delve admission scan (`delveVariant.ts:320`) requires — so observe → clue → delve is a two-step climb, not a free door.

**R2 — A ruin joins the delve layer (destroy × Location).** The `ruin_settlement` semantic (`undertaking-objects.ts:419-428`) already writes `locationSubtype: 'ruins'` and `ruinedTick`; it additionally writes `ruinMagnitude`, banded from the settlement's pre-ruin subtype (`RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE`), and `ruinSphereAlignment` from the location's dominant sphere when present. The delve admission scan widens its ruin filter from `locationType === 'elder_ruin'` to *elder ruins, or any `ruins`-subtype Location whose `ruinedTick + RUINED_SETTLEMENT_DELVE_DECAY_TICKS <= tick`*. Nothing else in the delve pipeline changes — the same located-clue requirement, the same admission counts, the same `scaleFromMagnitude`. A warlord's ruin therefore feeds a wanderer's delve three days later, through a clue the wanderer earned by observing the ruin (R1).

**R3 — A freehold pays (seize × Route, claim × Place / Route, claim × Location).** A new pure function `payHoldingIncome(state): Partial<GameState>` in `src/engine/holdingIncome.ts`, run as inline phase `holding_income` immediately after `trade_route_decay` and before `prosperity`. Every `HOLDING_INCOME_INTERVAL_TICKS` ticks it pays, per holder:

| Source | Holder read | Amount | Guard |
|---|---|---|---|
| a seized route | `trades_with` edge `controlledBy` (`readTradeRouteProps`) | `WEALTH_ROUTE_CONTROL_INCOME` × `max(1, round(volume × taxRate))` | route not `threatened`; volume > 0 |
| a held Place or route freehold | `owns` edge from an actor to a Place / route identity node (`grantHolding`'s shape) | `WEALTH_SUBLOCATION_INCOME` | the holding node still exists |
| a controlled Location | `controls` edge with `controlType: 'strategic'` from an **actor** node (never a faction) | `WEALTH_CONTROLLED_LOCATION_TITHE` × prosperity band multiplier (`HOLDING_TITHE_PROSPERITY_MULTIPLIER`) | Location not `ruins`; prosperity above `RUINED_SETTLEMENT_PROSPERITY_FLOOR` |

Each payment goes through `applyWealthDelta` (0–100 clamp) and emits the existing `wealth_delta` trace with `reason: 'route_control' | 'sublocation_income' | 'location_tithe'` (`'location_tithe'` is the one new union member). Faction treasuries are untouched: this pass pays mortals for what mortals hold; faction income stays with `phaseFactionActions`.

`WEALTH_PROSPEROUS_HOME_INCOME` is deliberately left unpaid. It keys on a mortal's *home* settlement, and residence is observed rather than stamped today (THR-822) — there is no durable edge to pay against, and a home is not a freehold. It is not this plan's; it is recorded here so the constant is not mistaken for forgotten.

**Words.** The UL says *freehold* on every player surface and in canon for what a mortal holds, and keeps the engine literal `holding` untouched (UL § Freehold). So: `holdingIncome.ts`, the `holding_income` phase and `getHoldingIncome` keep the engine word; the rulebook line, the chronicle line and the interface contract say *freehold*. The executor renames neither.

**R4 — The spell's price lands on quintessence (use × Power).** `payCosts` in `src/engine/spellActivation.ts` stops writing `agentNode.properties.doom` for the `doom_increase` cost type and instead returns the capped amount as `soulPrice` on the activation outcome (the `health_sacrifice` cost keeps writing `doom` — that one *is* health). The use × Power semantic (`undertaking-objects.ts:707-728`) pushes `{ targetId: ctx.actorId, delta: -soulPrice × SPELL_SOUL_PRICE_QUINTESSENCE_SCALE, source: 'spell_price', tick }` onto `ctx.state.pendingQuintessenceEvents`, which `phaseQuintessence` (`phaseQuintessence.ts:106`) already accumulates, clamps and thresholds. The same semantic refuses with `spell_exhausted` while `exhaustedUntilTick > ctx.tick`, which is the exhaustion reader. Casting through the non-cell path (`activateSpell` from the templates model) keeps its behaviour until the flip; the shared `payCosts` change means both paths stop charging doom, and the cell path is the one that routes the price — the templates model's caller is noted in *Notes for the executor*.

**R5 — Army supply reads a faction, not the first holder (bug).** `hasReliefLine` (`armySupply.ts:204`) picks `getIncomingEdges(settlementId, 'controls')[0]?.source`; with a mortal claimant that source is an actor and the supply-line walk resolves a faction that does not exist. Filter to sources whose node `type === 'faction'`. `isSupplyHost` (`:115`) already compares against a known faction id and is unaffected.

**R6 — The canon rule.** `Docs/canon/undertakings.md` § The verb × object model gains one sentence: *a cell ships with its reader; a wanted cell whose product no phase or surface reads is not built until one does.* `scripts/undertaking-grid-dispositions.ts` gains a `reader` field on every `wanted` disposition, and the generator prints it in the wanted-cells list (a wanted cell with an empty `reader` fails the generator by name, the same way an unnoted cell does). The nine "Owes" notes are edited to say what now reads them.

### Graph nodes / edges

No new node type, no new edge type (the load-bearing rule stands). Written by this plan, all pre-existing in `src/types/graph.ts` and `src/types/edgeSchema.ts`:

- `knows_of` actor → location (`fromSurvey: true`, `convergedTick`) — the shape `clueLifecycle.ts:470` writes.
- `knows_clue_of` actor → location (`magnitude`, `precision`, `source: 'undertaking_survey'`, `discoveredTick`, `consumed: false`).
- `knows_secret_of` actor → actor via `mintLeverageMark` (the five required properties it already stamps).
- `possesses` actor → artifact for the chart (`mintTreasureMap`'s shape, `mapsToLocationId`).
- Location node properties (additive): `ruinMagnitude: number`, `ruinSphereAlignment?: string`.
- Actor node property (existing): `wealth` via `applyWealthDelta`; `quintessence` via the quintessence phase only — this plan never writes `quintessence` directly.
- `wealth_delta` trace `reason` union gains `'location_tithe'`.

### Tick phases

| Reader | Phase | Why there |
|---|---|---|
| R1 familiarity / clue / chart / mark | inside undertaking completion — `strategic_projects` (2a.55), synchronous with the cell semantic | the product is the work's result; it must exist the tick the moment card says the work is done |
| R2 ruin properties | `strategic_projects` (the destroy semantic); the widened scan runs in `delve_admission` (2.3575 cluster, unchanged position) | the decay window is read, not scheduled |
| R3 holding income | new inline phase `holding_income`, after `trade_route_decay`, before `prosperity` | income should see the route freshness the decay phase just settled and precede the prosperity pulse that reads wealth tiers (`phaseEconomicTraits`) |
| R4 spell price | pushed in `strategic_projects`; consumed in `quintessence` (6.6395) the same tick | `phaseQuintessence` already clears `pendingQuintessenceEvents` after applying |
| R5 supply read | wherever `hasReliefLine` runs today (`armySupply` phases) | pure read fix |

`Docs/plans/wiring-checklist.md` gains the `holding_income` phase row.

### Resolution logic

- **Band → clue precision** (`OBSERVE_CLUE_PRECISION_BY_BAND`): `critical_success → 'located'`, `success → 'narrowed'`, `success_at_cost → 'vague'`, everything else → no clue. `ctx.outcome` is the final checkpoint band the lifecycle already resolved through the shared band ladder (`shared-step-resolution-two-callers`); it is plumbed into `ObjectVerbContext` as an optional field and read only here. Absent → the plain-success row.
- **Which mortal gets the mark on a strong result:** the co-located mortals at the observed node, sorted by id, index chosen by `mulberry32(ctx.tick × 104729 + actorId.length)` — the same seeding the use × Power semantic uses (`undertaking-objects.ts:721`). Nobody there → no mark.
- **Which ruin gets the chart:** ruin- and wonder-class Locations in the area not already `knows_of` to the actor, sorted by id, first one — deterministic, no draw.
- **Tithe multiplier:** prosperity band read through the location's existing `prosperity` (0–1) → `HOLDING_TITHE_PROSPERITY_MULTIPLIER` steps `[0.5, 1, 2]` at `[0.25, 0.5, 0.75]`; all named constants.
- **Interval:** payments fire when `tick % HOLDING_INCOME_INTERVAL_TICKS === 0`; a holding taken mid-interval waits for the next boundary (no pro-rating — tunable, not clever).

### PRNG callouts

One seeded call: the mark recipient index in R1 (`mulberry32`, seeded from tick and actor as above). Every other choice is sorted-first or banded. No `Math.random()`.

## Content pillar

### Encounter templates

Content: N/A for new templates — no encounter is authored by this plan. The clue R1 writes is the input the existing ruin quest-hook and delve encounters already consume (`ruin_quest_hooks`, `delve_*` phases); the mark R1 writes is leverage the encounter side already reads (`socialLeverage.ts`).

### Prose tables

- `src/data/undertaking-verb-prose.ts` — the `observe` line-set's completion lines gain a `{learned}` token, resolved from the reader's product: *"now knows the way to {object}"*, *"has a lead on what {object} hides"* (narrowed / vague), *"has found where {object} lies"* (located), *"has charted {object} for anyone who can read a map"* (chart), *"has learned something about {owner} that {owner} would rather keep"* (mark). An observe that learned nothing new keeps the existing completion line. GM narration register (`Docs/canon/prose.md`), magnitudes as words.
- `src/data/economic-chronicle-content.ts` — one holding-income line family, rate-limited to one line per holder per `HOLDING_INCOME_CHRONICLE_INTERVAL_TICKS`: *"The tolls of {object} fill {actor}'s purse"* / *"{Place} pays its tithe to {actor}"*. Numbers never appear; the wealth tier word does when it changes (`getWealthTier`).

### Attachment content

N/A — the treasure map already exists as content (`mintTreasureMap`'s node: `tomes_scrolls`, `grantsTraitWhileHeld: 'ruin_seeker'`, `consumeOnEvent: 'hidden_site_discovered'`); this plan gives it its first mortal author.

### Data tables

- `src/data/strategic-action-constants.ts` — the constants below (tunability, NFP #1).
- `scripts/undertaking-grid-dispositions.ts` — `reader` on every wanted disposition (R6); the nine live "Owes" notes rewritten as "Read by".
- `Docs/canon/undertakings.md` — the one-sentence rule (R6); `Docs/canon/rulebook.md` § resources — passive holding income as a rule of play (see Rulebook impact).

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — the agent sheet and the faction sheet). No WebGL surface changes.*

### Player-facing display

- **Wealth on the sheet, as a word** — the standing rider from THR-1397 (*"an aftermath may only move what the player can inspect"*) binds this plan the moment R3 moves wealth. `AgentDetailPanel` (overview) and `FactionSheet` each gain a **Wealth** line rendering `getWealthTier(readWealth(props))` as the tier word (*Magnate · Wealthy · Comfortable · Getting by · Struggling* — the fifth word for below `WEALTH_TIER_GETTING_BY` is added to `getWealthTier`'s return, never a numeral), with a tooltip naming what fed it last (the most recent `wealth_delta` reason, in words: *tolls on the Saltway*). UI Laws engaged: IV (words, never numerals), V (tooltips), 13/14 (a label a player reads on a row), 56 (chips are state-backed — the tier word reads the node property, never a cached copy).
- **What a mortal knows** — the agent sheet's existing attachments / secrets strand lists the chart as a possession already; the `knows_of` familiarity and held clues render as a **Knows the way to** row (locations by name, links where a profile exists) in the same strand. Law 1 (every concept carries its image / tooltip / link).

### Event notifications

- The undertaking completion moment (`undertaking_checkpoint` → `resolveMomentPresentation`, unchanged machinery) carries the `{learned}` sentence, so a followed mortal's survey reads *"Old Maerin now knows the way to the Sunken Treasury"* rather than *"has finished watching"*.
- Chronicle: the rate-limited holding-income line (Content pillar).
- No toast, no interrupt: passive income and familiarity are chronicle-tier by design (the attention pool cannot watch everything).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getHoldingIncome(actorId?)` → the last interval's payments (holder, source, object, delta), read from the `wealth_delta` traces of the current interval. JSDoc in `src/debug-bridge.d.ts`.
- CLI `agent <name>` prints the familiarity count and held clues beside the existing secrets line (`src/cli` agent inspector).
- Trace viewer: `undertaking_reader` and `wealth_delta` entries are filterable by category as every category is.

### Visual presence (HexMapV2)

N/A — a ruined settlement already renders through the `ruins` subtype's signifier; the delve layer's markers are the existing ones. No new layer, no signifier change.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/data/undertaking-objects.ts` (observe, ruin, use × Power semantics) | `strategic_projects` | moment card via `resolveMomentPresentation` | graph edges/properties only | `undertaking_reader` | `__DEBUG.getTraces`, CLI `agent` |
| `src/engine/holdingIncome.ts` (new) | `holding_income` (new inline, after `trade_route_decay`) | `AgentDetailPanel` / `FactionSheet` wealth line | actor `wealth` | `wealth_delta` (`location_tithe` added) | `__DEBUG.getHoldingIncome` |
| `src/engine/ruins/delveVariant.ts` (widened admission filter) | `delve_admission` | existing delve surfaces | `delveAdmissionQueue`, `activeDelves` | existing delve traces | existing |
| `src/engine/spellActivation.ts` (`payCosts` returns `soulPrice`) | `strategic_projects` → `quintessence` | none new | `pendingQuintessenceEvents` | `undertaking_reader` (reader `spell_price`) + existing quintessence traces | `__DEBUG.getTraces` |
| `src/engine/armySupply.ts` (faction-typed `controls` read) | army supply phases | none | none | none | `war` readout unchanged |
| `src/engine/orchestrator.ts` | registers `holding_income` | — | — | phase timing as every inline phase | profiler |
| `scripts/undertaking-grid-dispositions.ts` + `scripts/generate-undertaking-grid.ts` | build-time | served *Undertaking Grid* wiki page | — | — | generator fails by name on an empty `reader` |
| `src/types/trace.ts` | — | — | — | `undertaking_reader` category registered at every site `undertaking_tier_defaulted` is (grep; four sites) | trace viewer |

Prose pipeline: the `{learned}` token is resolved in the verb-prose resolver that already resolves `{object}` / `{owner}`, from the `undertaking_reader` result carried on the completion event; no `enrichProse()` change.

Player controls: **N/A by design** — every reader is autonomous world behaviour with no player verb; the god's existing nudge and intervention verbs are untouched (the pattern at `Docs/plans/wiring-checklist.md` § Player Controls for Engine Features).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `OBSERVE_CLUE_PRECISION_BY_BAND` | `{ critical_success: 'located', success: 'narrowed', success_at_cost: 'vague' }` | how good a lead a survey yields on a ruin / wonder, by outcome band |
| `OBSERVE_CLUE_MAGNITUDE` | `0.5` | clue magnitude written by a survey (the delve scale reads the ruin's own magnitude) |
| `OBSERVE_AREA_FAMILIARITY_CAP` | `3` | Locations an area survey makes familiar per completion |
| `OBSERVE_MARK_BAND` | `'critical_success'` | the band at which a survey doubles into a secret about someone there |
| `OBSERVE_CHART_BAND` | `'critical_success'` | the band at which an area survey mints a chart |
| `RUINED_SETTLEMENT_MAGNITUDE_BY_SUBTYPE` | `{ hamlet: 0.3, camp: 0.3, farmland: 0.3, town: 0.5, city: 0.7, capital: 0.8, castle: 0.6, fort: 0.5, tower: 0.4 }` | the delve scale a mortal-ruined settlement carries |
| `RUINED_SETTLEMENT_DELVE_DECAY_TICKS` | `36` (three days) | how long a fresh ruin waits before the delve layer admits it |
| `HOLDING_INCOME_INTERVAL_TICKS` | `12` (one day) | how often holdings pay |
| `WEALTH_ROUTE_CONTROL_INCOME` | `1` (exists) | per route per interval, before the volume × tax scaling |
| `WEALTH_SUBLOCATION_INCOME` | `1` (exists) | per held Place or route freehold per interval |
| `WEALTH_CONTROLLED_LOCATION_TITHE` | `1` (new) | per controlled Location per interval, before the prosperity multiplier |
| `HOLDING_TITHE_PROSPERITY_MULTIPLIER` | `[0.5, 1, 2]` at prosperity `[0.25, 0.5, 0.75]` | a rich town tithes more |
| `HOLDING_INCOME_CHRONICLE_INTERVAL_TICKS` | `72` (six days) | rate limit on the chronicle line per holder |
| `HOLDING_INCOME_TRACE_AGGREGATE_ABOVE` | `5` | above this many freeholds, one holder's payments write one aggregated `wealth_delta` trace instead of one per freehold |
| `SPELL_SOUL_PRICE_QUINTESSENCE_SCALE` | `0.005` | doom points → quintessence fraction (the 30-point cap per cast becomes at most 0.15 of a 0–1 meter) |
| `DOOM_COST_CAP_PER_CAST` | `30` (exists) | unchanged; now caps the soul-price before scaling |

## Tracing

```ts
// UndertakingReaderTrace — emitted once per reader applied at a cell completion (R1, R2, R4)
interface UndertakingReaderTrace extends TraceBase {
  category: 'undertaking_reader';
  actorId: string;
  cellId: string;                       // 'cell.observe.location', 'cell.destroy.location', 'cell.use.power'
  reader: 'familiarity' | 'clue' | 'chart' | 'mark' | 'ruin_delve_stamp' | 'spell_price' | 'spell_exhausted';
  objectId: string;                     // the observed / ruined node, or the power
  productId?: string;                   // the edge or node written, when one was
  outcome?: string;                     // the band read from ctx.outcome, when present
  refused?: 'already_known' | 'clue_already_held' | 'map_already_held' | 'nobody_there' | 'schema_violation' | 'exhausted';
}
// WealthDeltaTrace (existing) — reason union gains 'location_tithe'; R3 emits one per payment.
```

Volume: `undertaking_reader` fires only at cell completions (a handful per tick at most); `wealth_delta` from R3 fires once per holding per interval (every 12 ticks), aggregated per holder when a holder has more than `HOLDING_INCOME_TRACE_AGGREGATE_ABOVE = 5` holdings, so a magnate with twenty routes writes one trace, not twenty.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `seedKnowsOf` / `spawnClue` / `mintTreasureMap` refuses (`already_known`, `clue_already_held`, `map_already_held`) | success with nothing new; `refused` on the trace; the plain completion line |
| `knows_of` schema refuses the endpoint (e.g. a faction node) | skip that reader; trace `schema_violation`; never throw |
| `ctx.outcome` absent | treated as `success` (narrowed clue, no mark, no chart) |
| Nobody co-located for the mark | skip; trace `nobody_there` |
| Area holds no ruin / wonder Location | no chart; familiarity still written |
| Route identity node missing an endpoint id | familiarity on whichever endpoint resolves; none → skip |
| Holder node of a `controls` / `owns` edge missing | skip that payment |
| Route `threatened` or volume 0 | no toll this interval |
| Location `ruins` or below the prosperity floor | no tithe |
| `pendingQuintessenceEvents` undefined on state | initialise to `[]` before push (the quintessence phase already tolerates absence) |
| `exhaustedUntilTick` non-numeric | treated as 0 (not exhausted) |
| `ruinedTick` missing on a `ruins` Location (worldgen ruins, elder ruins) | not admitted by the widened branch; elder ruins keep their own branch |
| No faction-typed `controls` source on a settlement | `hasReliefLine` → false (same as no controller today) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | in the hundreds (a `src/types/` sibling of the named high-impact set; read `.codesight/graph.md` for the live number) | additive only — one union member on `TraceCategory`, one interface, one array entry, one `reason` member on `WealthDeltaTrace`; no existing member changes |
| `src/engine/orchestrator.ts` | high (the tick loop) | one inline phase registration between two existing phases; no reordering of anything else |

## Interface impact

| Contract (`Docs/canon/interface-map.generated.md`) | Status today | Action |
|---|---|---|
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — the observe cells now write `knows_of` / `knows_clue_of` / `possesses` (chart) into economies with consumers (`clueLifecycle`, `delveVariant`, `treasureMapConsumption`); row note updated |
| `attachment-grants-trait-while-held` | 🟢 LIVE | **preserve** — the chart grants `ruin_seeker` as before; now minted by a mortal |
| `undertaking-object-types` | 🔵 UNVERIFIED-OK | **extend** — `ObjectVerbContext.outcome` (optional); registry semantics gain readers; resolver unchanged |
| `economy-provisions-armies` | 🟢 LIVE | **preserve** (R5 is a read fix inside the consumer; `threatened` also now gates the toll) |
| `authored-quintessence-shift` | 🔵 UNVERIFIED-OK | **extend** — a second producer of `QuintessenceEvent` (`source: 'spell_price'`); the consumer is `phaseQuintessence`, live |
| `quintessence-threshold-gates-candidacy-and-movement` | 🟠 PARTIAL | **preserve** — now bitten by the spell price, which is the point |
| `undertaking-checkpoint-events` | 🟢 LIVE | **extend** — the completion moment carries the `{learned}` sentence |
| `freehold-income-pays-mortal-holders` | — | **add** — producer `payHoldingIncome` (phase `holding_income`), consumers `phaseEconomicTraits` (wealth tiers → traits), the agent / faction sheets (wealth word). Register in `scripts/interface-contracts.ts` in the same change |
| `ruined-settlement-joins-delve-layer` | — | **add** — producer `ruin_settlement` (`ruinedTick`, `ruinMagnitude`), consumer `delveVariant` admission scan. Register in the same change |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (prose tokens, chronicle line, dispositions, canon rule; templates N/A with rationale)
- [x] UI pillar present (wealth word on two sheets, the knows-the-way row, the moment sentence; HexMap N/A with rationale)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves two: the living world (mortal work now reaches three more systems, and the hyperconnectivity ruling of 2026-09-07 is written into canon as the same-commit reader rule) and mortal sovereignty (no reader acts on the player's behalf; the god's detection pressure is untouched — mortal surveillance does not feed it, per THR-1397).
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes a rule of play: **what a mortal holds yields passively** — a freehold (a seized route tolls, a held Place pays) and a controlled Location (it tithes), each once a day; *freehold* is kept to the `owns`-edge sources per the UL, and the `controls`-edge Location is named as *controlled*, never as a freehold and **casting costs spirit** (the soul-price erodes quintessence, not health). Both are `[DESIGN]` today in `Docs/canon/rulebook.md` § resources; the executor moves them to `[IMPL]` in the same PR and re-verdicts the section.
- [x] `Docs/canon/rulebook.md` is updated in the same PR by the executor (§ resources: holding income; § encounters and casting: the spell's price on quintessence) and the affected sections re-verdicted `[IMPL]`

> Brainstorm companion: `Docs/plans/2026-09-07-thr-1428-owed-readers-brainstorm.md` (written alongside).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | every number is a named constant in `strategic-action-constants.ts` / `wealth.ts`; the band tables are data |
| 2. Inspectability | PASS | `undertaking_reader` names reader, product and refusal; `wealth_delta` names source and reason; `__DEBUG.getHoldingIncome` |
| 3. Determinism | PASS | one seeded `mulberry32` call; every other choice sorted-first or banded |
| 4. Fail-soft | PASS | see table — every reader degrades to "nothing new" with a named refusal |
| 5. Narrative over mechanical perfection | PASS with note | no pro-rated income, no partial familiarity: the story reads *the tolls came in* and *she knows the way now*; precision-by-band makes the delve a climb the chronicle can tell |
| 6. Additive over destructive | PASS with note | one write moves rather than adds: the `doom_increase` spell cost stops writing `doom` (THR-1397, verbatim: "the spell's soul-price moves from the `doom` health meter to quintessence"); `health_sacrifice` keeps `doom`. Everything else is additive |
| 7. Performance budget | PASS | R3 walks `trades_with`, `owns` and `controls` edges once per 12 ticks; R1 is per completion; the widened delve filter adds one property read per location per scan |

## Done when

- [ ] Headless (engine pillar; CLI/headless evidence accepted, no browser Done-when): on seed 42 medium, `spawn undertaking <agent> cell.observe.location` on a ruin-class Location with `--band critical_success` leaves a `knows_of` edge, a `located` `knows_clue_of` edge and one `undertaking_reader` trace per reader; the same on `--band success` leaves a `narrowed` clue and no mark
- [ ] `spawn undertaking <agent> cell.observe.area --band critical_success` on an area holding an unfamiliar ruin mints one chart (`mapsToLocationId` set) and `--band success` mints none
- [ ] `spawn undertaking <agent> cell.destroy.location` on a town, then `tick 36`: the location carries `ruinMagnitude` and appears in the delve admission scan's candidate set for an agent holding a located clue (test in `src/engine/__tests__/ruins/`)
- [ ] A world with one seized route, one held Place and one controlled Location: after `tick 12` the holders' `wealth` rose by the constants' amounts, three `wealth_delta` traces (or one aggregated) exist, and a faction that controls a settlement received nothing from this pass
- [ ] `cell.use.power` with a `doom_increase` cost: the caster's `doom` is unchanged, `pendingQuintessenceEvents` carried a `spell_price` event, and after the `quintessence` phase the caster's `quintessence` fell by `amount × SPELL_SOUL_PRICE_QUINTESSENCE_SCALE`; a second cast while `exhaustedUntilTick > tick` is refused `spell_exhausted`
- [ ] `hasReliefLine` on a settlement whose only `controls` source is a mortal returns false and does not resolve a supply line for an actor id (`armySupply.test.ts`)
- [ ] `npm run generate-undertaking-grid` fails by name on a `wanted` disposition with an empty `reader`, and the nine "Owes" notes read "Read by"
- [ ] The callings × cells systems gate would pass for every calling on the prototype's join (Seeker/discovery reaches ≥ 3 systems through built cells) — asserted by re-running the THR-1399 script's `CELL_SYSTEMS` with the readers marked live, or by the generated view once THR-1403 ships it
- [ ] 30-tick CLI engine smoke and `npm run test:heavy` locally (engine files touched)
- [ ] UI (pillar surfaces only): Playwright screenshot at 1920×1080 of `AgentDetailPanel` showing the **Wealth** word with its tooltip and the **Knows the way to** row on a mortal who completed a survey; `FactionSheet` showing the wealth word; console clean; `window.__DEBUG.getHoldingIncome()` non-empty after `tick(12)`; UI-Laws judgment line citing Laws 1, 4, 5, 13/14, 17, 21, 33, 37, 56
- [ ] `Docs/canon/undertakings.md` carries the same-commit reader rule; `Docs/canon/rulebook.md` § resources moved to `[IMPL]` for holding income and the spell price; `Docs/plans/wiring-checklist.md` lists `holding_income`; wiki pages `undertaking-grid`, `armies-battles-reference`, `settlements-economy-reference` and `essence-control-reference` updated (their `sources` globs match the touched files) or carry a `Wiki-freshness-exempt:` line with a reason
- [ ] `npm test` and `npx vite build` pass; types verified via `tsc -b --force` net-new diff (not `tsc --noEmit` — no-op here, THR-686)
- [ ] Closing commit body includes `Fixes THR-1428`
- [ ] Browser-verify screenshot at 1920×1080 included for the sheet surfaces

## Kill criteria

- If the census (THR-1402) shows no `narrowed` clue ever maturing to a delve and no freehold income crossing a wealth tier within 150 ticks on two seeds, the constants are decorative and the band tables are re-tuned — not the design.
- If `ctx.outcome` cannot be plumbed from the lifecycle without a second resolution, the by-band readers collapse to the plain-success row and the plan still ships; the gap is recorded on the map's Not-yet-specified.
- If the fourth gate (built cells reach ≥ 3 systems) still fails for the Seeker after this ships, the readers were pointed at the wrong systems and the map reopens the coverage question — that is the measurable failure of the whole premise.

## Coordination block

**Suggested model:** opus — six seams across engine, content and two sheets; the delve and quintessence integrations need the surrounding code read, not pattern-matched.
**Parallel-safe with:** THR-1401, THR-1402, THR-1404 (map decision tickets, no code); any encounter-content ticket; any HexMapV2 ticket.
**Files to touch:** `src/data/undertaking-objects.ts`, `src/engine/holdingIncome.ts` (new), `src/engine/orchestrator.ts`, `src/engine/ruins/delveVariant.ts`, `src/engine/spellActivation.ts`, `src/engine/armySupply.ts`, `src/engine/wealth.ts`, `src/data/strategic-action-constants.ts`, `src/data/undertaking-verb-prose.ts`, `src/data/economic-chronicle-content.ts`, `src/types/trace.ts`, `src/debug-bridge.ts` + `.d.ts`, `src/components/Game/AgentDetailPanel.tsx`, `src/components/Game/FactionSheet.tsx`, `scripts/undertaking-grid-dispositions.ts`, `scripts/generate-undertaking-grid.ts`, `scripts/interface-contracts.ts`, `Docs/canon/undertakings.md`, `Docs/canon/rulebook.md`, `Docs/plans/wiring-checklist.md`, four wiki pages, tests named above.
**Mutex with:** THR-1403 (both edit `src/data/undertaking-objects.ts`, `scripts/undertaking-grid-dispositions.ts` and `Docs/canon/undertakings.md`); any ticket editing `src/engine/spellActivation.ts` or `src/engine/armySupply.ts`; any ticket registering an inline phase in `src/engine/orchestrator.ts` near the economy cluster.

## Notes for the executor

- **Where the band comes from.** `resolveUndertakingCompletion` is called from `strategicActionLifecycle.ts:1187`; the final checkpoint's band is resolved a few lines above through `resolveStepCore` / `mapResolverOutcomeToStep`. Plumb it into the input as `outcome` and onto `ObjectVerbContext`; if the lifecycle genuinely does not hold the band at that point, record why in the closeout and let every reader take the absent-band row — do not add a second resolution.
- **The templates-model caller of `activateSpell`.** `payCosts` is shared. Until `UNDERTAKING_MODEL` flips, the templates path also calls it; after this change that path stops charging doom and has no cell semantic to route the price. Acceptable for the flag's remaining life (the census gates the flip), but say so in the closeout and leave a `// TODO(THR-1403)` at the templates call site.
- **Faction seat for observe × Faction.** Use the faction's `controls` targets and pick the Location nearest the actor by hex distance (`hexDistance`, already imported in the registry); if the faction controls nothing, skip — do not invent a home.
- **`knows_of` endpoints.** `src/types/edgeSchema.ts:530` — confirm the allowed target types before writing familiarity to a Place (a `location` node with `parentLocationId`, so it should pass) and never to a faction node.
- **The chart's target.** `mintTreasureMap` refuses a duplicate per (actor, site); the ruin / wonder classes are `LOCATION_CLASSES.ruin` and `.wonder` (`src/data/world-objects.ts:122-130`), read through `locationClassOf`.
- **Aggregation of `wealth_delta`.** Aggregate only above `HOLDING_INCOME_TRACE_AGGREGATE_ABOVE`; below it, one trace per payment keeps the CLI `traces` view legible.
- **Tests to add or extend:** `src/data/__tests__/undertaking-objects.test.ts` (each reader, each refusal), `src/engine/__tests__/holdingIncome.test.ts` (new; the three sources, the interval, the faction exclusion), `src/engine/__tests__/spellActivation.test.ts` (doom untouched, `soulPrice` returned, exhaustion refusal), `src/engine/__tests__/armySupply.test.ts` (mortal claimant), a delve admission test for the widened filter. Falsify each guard at its owning layer (a test that passes on an empty population proves nothing).
- **Cite the decisions inline** in code comments where each reader lands: THR-1397 for the reader, THR-1399 for the band order and the systems gate.
- **Not this plan's: the capability-growth rider.** THR-1397's first standing rider (*a completed undertaking grows capability in the Reach it leaned on*) is a property of *completion*, not of a reader, and binds every cell equally. Check whether it is live at the completion seam; if it is not, it belongs on the flip's ticket (THR-1403), and this closeout says so rather than slipping it in.
- **Words on the surfaces:** *freehold* only for what an `owns` edge holds (a Place, a route freehold); a `controls`-edge Location is *controlled* in the rulebook, the chronicle line and the tooltip.

## Forked-audit verdicts

Three independent auditors, spawned in one message on 2026-09-07 (design-audit-pipeline; sonnet). Verdicts recorded verbatim in substance, trimmed to the finding.

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Full constants table — every number named in `strategic-action-constants.ts` / `wealth.ts` |
| 2. Inspectability | PASS | `undertaking_reader` names reader/product/refusal; `wealth_delta` gains `location_tithe`; `__DEBUG.getHoldingIncome`; wiring table maps module → phase → trace → debug; `wiring-checklist.md` gains the `holding_income` row |
| 3. Determinism | PASS | One seeded `mulberry32` call; every other choice sorted-first or banded; no `Math.random()` |
| 4. Fail-soft | PASS | Thirteen-row table; every refusal degrades to "nothing new" with a named trace reason |
| 5. Narrative over mechanical | PASS-with-note | No pro-rated income, no partial familiarity — the trade is named, not hidden |
| 6. Additive over destructive | PASS-with-note | One genuine move (`doom_increase` → quintessence), sourced to the map's decision; `health_sacrifice` untouched; all else additive |
| 7. Performance budget | PASS | R3 once per 12 ticks with aggregation above 5 holdings; R1 per completion; one property read per location per delve scan |

**NFP AUDIT: PASS-with-notes.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Six readers each spec systems design, graph, phases, resolution, PRNG, with line references and named constants |
| Content | present-and-substantive | Templates and attachments N/A with rationale; prose and data tables concrete |
| UI | present-and-substantive | Components named, UI Laws cited, debug-bridge additions; HexMapV2 N/A with rationale |

Missing sections: the Coordination block lacked **Files to touch** — added before the PR opened (this revision). Wiring check: the table connects each active pillar to phase, component, GameState field, trace and debug surface. Substrate check: PASS — the `## Substrate inventory` names nine subsystems by inventory name with a disposition each; Spheres & Quintessence correctly flagged DORMANT and *activated as a consumer*, not green-fielded.

**PILLAR AUDIT: PASS-with-notes** (the one note resolved in this revision).

### Vision audit

Premises touched: non-negotiable #1 god-not-protagonist — confirmed ("no reader acts on the player's behalf"); #3 mechanics surface through prose, never numbers — extended (wealth as a tier word); #4 everything is a graph node/edge — confirmed; #6 additive — confirmed with a disclosed, sourced exception. Design tension 2 (systemic emergence vs authored moments) — extended toward emergence per the 2026-09-07 hyperconnectivity ruling. Taste profile "numbers in UI" anti-pattern — confirmed avoided. No contradictions found. North star and core loop: silent (systems plumbing, no session-shape claim).

**VISION AUDIT: PASS.**

### Intent-judge verdict

**Run 1 (fable, cold, 2026-09-07): Revise** — intent fidelity PASS (every reader traces to THR-1397's recorded text; the R6 same-commit rule is the author's extrapolation of the hyperconnectivity ruling, now marked agent-decided with a veto invited); three-pillar PASS; Vision PASS; rejected approaches PASS; load-bearing PASS; blast radius PASS; substrate PASS. Four GAPs, all author-fixable, all applied in this revision: player controls line in Wiring (N/A by design); `WEALTH_PROSPEROUS_HOME_INCOME` reconciled (deliberately unpaid — residence is observed, not stamped) and `HOLDING_INCOME_TRACE_AGGREGATE_ABOVE` added to the constants table; *freehold* in canon-facing wording with the engine literal `holding` kept per UL § Freehold; a `## Kill criteria` section carried from the action proposal. Impact class confirmed Reversible.

**Run 2 (fable, cold, revised copy): Allow** — all eleven dimensions PASS except one advisory GAP on UL terminology (keep *freehold* to `owns`-edge sources; name the `controls`-edge Location as *controlled*), applied in this revision to the Rulebook impact line and the executor notes. Non-scoring note carried into the executor notes: the capability-growth rider is not this plan's. Impact class Reversible, confirmed. Every run-1 action verified against its primary source by the judge (THR-1397's comment text, the UL § Freehold entry).
