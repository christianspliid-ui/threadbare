> **title:** `Sphere scores land where Dominion reads them — the god, every mortal, every faction and every place carries a sphere bag — THR-1768`
> **linear_issue:** THR-1768
> **author:** `Claude Code (design lane, unattended run 2026-10-06d)`
> **created:** 2026-10-06
> **three_pillars:** Engine `done — two pure seeding helpers, one backfill sweep at the head of the existing sphere-pressure phase, a derived faction aggregate in the existing aggregation phase, two bookkeeping fixes; no new node, edge or phase` · Content `N/A — no template, prose or table is added or changed; seeds read data the world already carries (culture venerated spheres, terrain, LOCATION_SPHERE_TABLE, declared lair/ruin spheres)` · UI `N/A for the player — sphere scores never reach the player (Law 13); one debug-bridge census accessor`

# Sphere scores land where Dominion reads them — THR-1768

*The Dominion read multiplies an object's sphere scores by the god's. Today the god has no scores, every mortal is all-zero, no faction is ever aggregated and half the places minted after worldgen have nothing. This plan makes every one of them carry a sphere bag, so the formula ticket has something to measure.*

## Why this is load-bearing

Christian ruled on [THR-1745](https://linear.app/threadbare/issue/THR-1745) (2026-10-05, chat) that the god's power loop is organised by **Dominion**: *"you score based on your affinity to all spheres summed up and factored by your sphere score."* UL `Docs/ubiquitous-language/Cosmology.md` § Dominion seats it as the graded match between an object's sphere scores (*"a hex, place, mortal, faction, artifact or army"*) and the god's.

The research ticket on the Dominion map, [THR-1759](https://linear.app/threadbare/issue/THR-1759) (audit `Docs/audits/2026-10-06-thr-1759-dominion-writers-and-read-research.md`), measured seed 42 headless and found that the read is **zero for every object at tick 0 and tick 240**:

- the ascendant node has **no** `sphereAffinity` (created after the seeding loop; its alignment strings are filtered out by `seedAgentSphereAffinity`);
- **509 / 509** seeded individuals are all-zero, and 255 of 752 individuals at tick 240 carry `null`;
- **52 / 52** seeded factions are all-zero at tick 240 (no per-faction aggregation exists);
- **117 / 235** place-tier nodes at tick 0 and **162 / 315** at tick 240 carry no bag (lairs, elder ruins, waypoints, cleared lairs, the shrine), and `LOCATION_TYPE_BONUS` is imported and never used.

The whole Dominion map frontier — the formula ([THR-1760](https://linear.app/threadbare/issue/THR-1760)) and the five tickets it blocks — waits on this. It is a seeding and bookkeeping fix; the one real choice the ticket delegated (where a mortal's seed comes from) is decided below.

**Settled inputs.** THR-1759 is a research ticket (facts, no decision). Christian's ruling on THR-1745. UL § Dominion, which already states the god's fallback: *"Until the point-buy ticket lands, it falls back to today's `sphereAlignment` primary/secondary pair."* No design-lane decision younger than 24 h is an input: this plan does **not** depend on [THR-1749](https://linear.app/threadbare/issue/THR-1749) (buy your spheres) shipping or surviving its veto window — see D6.

## Decided by delegation (design lane, 2026-10-06, process.md rule 4 — veto in chat)

| # | Decision | Why | Options weighed |
|---|---|---|---|
| D1 | **A mortal's seed comes from their culture.** The strongest `belongs_to` culture's `cultureIdentity.veneratedSpheres[0]` gets `ARCHETYPE_SPHERE_BONUS_PRIMARY` (2), `[1]` gets `ARCHETYPE_SPHERE_BONUS_SECONDARY` (1). A culture node seeds itself the same way. No culture → zero bag (as today), counted in the census. | Every mint path already resolves a culture (`npcSeeding.ts:228`, `mintInhabitant.ts:263`, `agentLifecycle.ts:455`), and `veneratedSpheres` is the culture's sphere identity, already read by naming, prose, flags and mores. It gives the Dominion read a signal of its own: a foreign people living on your ground is a real thing to see, not a restatement of the ground. | **Calling** — rejected: callings are Reaches, and Reaches and Spheres are orthogonal (load-bearing decision); seeding one from the other fuses the axes. **Home place's top sphere** — rejected: a mortal would only echo the place's terrain, so Dominion over a person would double-count the hex. |
| D2 | **Late-minted nodes are caught by one backfill sweep**, not by edits at each mint site. `backfillSphereAffinity(graph, tiles)` seeds every location and actor node whose `sphereAffinity` is missing, `null` or malformed; it runs at the end of world init and at the **head** of `phaseSpherePressure`, before any pressure is consumed. | There are ~20 location mint sites and 4+ actor mint sites today (`grep "type: 'location'" src/engine`), and the THR-1759 gap is exactly a mint path nobody remembered. A sweep covers every future path and cannot ship dead. It must run *before* pressure, because the pressure phase's fail-soft default would otherwise write a zero bag that the sweep then treats as seeded. | **One helper called at every mint site** (the ticket's wording) — rejected as the primary route: it leaves the next new mint path unseeded. The sweep *is* that one helper, called from one place. |
| D3 | **A faction's aggregate is a separate derived field.** `sphereAggregate.scores` = the rounded mean of its individual members' scores, recomputed by `phaseSphereAggregation`; the faction's own `sphereAffinity` (monster-faction birth seed, pressure target) is kept. Readers use `getFactionSphereScores(node)` = own + aggregate, capped at `MAX_SPHERE_SCORE`. | Overwriting `sphereAffinity` every tick would erase the monster factions' birth seed and any pressure that lands on a faction. A mean (not a sum) keeps a faction of 40 on the same 0–10 scale as a person. | **Sum of members** — rejected: off-scale. **Weights of the global World-Soul aggregate** (location 1.0 / agent 0.2 …) — they weigh kinds against each other; inside a faction every member is the same kind. |
| D4 | **A place with its own declared sphere** (a lair's `dominantSphere`, an elder ruin's `sphereAlignment` string) gets `LOCATION_TYPE_BONUS` (2) in that sphere on top of terrain and table. | Revives the dead constant for the job its name describes; lairs and ruins are the places whose sphere is part of what they are. | Retire the constant — rejected: additive over destructive, and lairs/ruins would read as plain terrain. |
| D5 | **Erosion removes whole points only** (`Math.floor` of the excess). | `types/sphereAffinity.ts:20` documents scores as permanent integers; a sub-point excess has nothing whole to remove. | Round-half — rejected: 0.6 notable pressure would erode a point on contact. |
| D6 | **The god seeds from `sphereAlignment` primary/secondary (2 / 1).** | UL's stated fallback. THR-1749's plan keeps `sphereAlignment` as a derived field (its two largest buys), so if it ships the seed follows automatically; if it is vetoed nothing here changes. How the god's own score grows over a run is [THR-1765](https://linear.app/threadbare/issue/THR-1765)'s question, not this one. | Seed from the full bought vector — not possible until THR-1749 ships, and would make this plan depend on a decision inside its veto window. |

**Would change the call:** Christian saying a mortal's sphere should come from where they live (D1 → home place) or from what they do (D1 → calling, which would need a Vision edit since it fuses Reaches and Spheres); or THR-1760's prototype showing culture-seeded mortals swamp the band distribution (then lower the mortal bonus, a constant).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Spheres & Quintessence (`sphereAffinity.ts`, `phaseSpherePressure`, `phaseSphereAggregation`) | 🟠 DORMANT | **activates** — seeds the bags its writers and the Dominion read need; no rebuild |
| Cultures (`cultureIdentity.veneratedSpheres`, `belongs_to` edges) | 🟢 ACTIVE | read only (D1 seed source) |
| Factions (`member_of`, `getFactionMembers`) | 🟢 ACTIVE | read only (D3 members) |
| Lairs (`lairSeeding`, `lairEscalation`) / Elder ruins (`elderRuinSeeding`) | 🟢 ACTIVE | read only (D4 declared sphere) |
| Battle aftermath (`battleAftermath.ts:236-246`) | 🟢 ACTIVE | **extends** — reads `getFactionSphereScores`; no pressure when the faction has no sphere (today an all-zero faction silently presses `chaos`) |
| Trace buffer (`traceBuffer.emitTrace`, `TraceCategory`) | 🟢 ACTIVE | **extends** — `sphere_pressure` and `sphere_seeded` categories |

Runtime population (seed 42, medium, from THR-1759): 509 individuals + 52 factions + cultures + 1 ascendant at tick 0; 235 place-tier + 770 sublocation nodes at tick 0, 315 + 828 at tick 240.

## Engine pillar

### Systems design

All new code lives in `src/engine/sphereAffinity.ts` (pure helpers) plus small edits at three call sites.

1. **`seedFromRankedSpheres(spheres: readonly string[]): SphereAffinity`** — `[0]` → `ARCHETYPE_SPHERE_BONUS_PRIMARY`, `[1]` → `ARCHETYPE_SPHERE_BONUS_SECONDARY`; ignores names not in `SPHERE_NAMES`; duplicates collapse to the primary. The existing `seedAgentSphereAffinity(Record<string, number>)` becomes a thin adapter onto it (additive; its tests stay green).
2. **`seedActorSphereAffinity(graph, node): { affinity, route }`** by `actorType`:
   - `ascendant` / `god` → `[sphereAlignment.primary, sphereAlignment.secondary]` (D6), route `alignment`;
   - `individual` → the strongest culture from `getActorCultures` (ties: first by edge order, which is deterministic) → its `veneratedSpheres` (D1), route `culture`; none → zero bag, route `none`;
   - `culture` → its own `cultureIdentity.veneratedSpheres`, route `culture`;
   - faction, group, company, army → zero bag, route `none` (factions are read through D3).
3. **`seedPlaceSphereAffinity(node, tiles): { affinity, route }`** — terrain from `tiles` at `(hexCol, hexRow)`, else `node.properties.terrain`, else the parent's bag (`parentLocationId`) for a sublocation, else zero → `seedHexSphereAffinity`; plus `LOCATION_SPHERE_TABLE[locationType ?? locationSubtype]`; plus `LOCATION_TYPE_BONUS` in `dominantSphere ?? sphereAlignment` when that is a sphere-name string (D4). Capped at `MAX_SPHERE_SCORE`. Reproduces today's init values for every node init already seeds, except where `locationType` was absent and `locationSubtype` present (now read) and lairs/ruins (now seeded at all).
4. **`backfillSphereAffinity(graph, tiles, tick): SphereSeedCensus`** — walks `getNodesByType('location')` and `getNodesByType('actor')`; for each node whose `sphereAffinity` fails `isValidSphereAffinity`, writes the seed. Returns counts by kind and route; emits one `sphere_seeded` trace per seeded node when `tick > 0`, and one summary trace at init. Writes nothing to a node that already has a valid bag — pressure history is never overwritten.
5. **`computeFactionSphereAggregates(graph)`** — for each faction node (`actorType === 'faction'`), the members from `getFactionMembers` filtered to `actorType === 'individual'` with a valid bag; per sphere `Math.round(mean)`; writes `sphereAggregate: { scores, memberCount, computedTick }` only when `scores` differs from the stored value. Zero members → aggregate of zeros.
6. **`getFactionSphereScores(node): Record<SphereName, number>`** — own `sphereAffinity.scores` + `sphereAggregate.scores`, capped; either missing reads as zero.

**Call sites:**
- `gameInit.ts`: the actor loop's `individual` / `ascendant` / `god` branch calls `seedActorSphereAffinity` (so culture seeding lands in the same pass that today writes zeros); after `createAscendant` (`:304`) and the lair / ruin / `loc.start` mints, call `backfillSphereAffinity` once. The location loop at `:199-214` is left in place (reading order unchanged for anything between it and the backfill).
- `phaseSpherePressure.ts`: first statement calls `backfillSphereAffinity(state.graph, state.tiles, state.tick)`.
- `phaseSphereAggregation.ts`: calls `computeFactionSphereAggregates` before `computeSphereAggregate`.
- `battleAftermath.ts:236-246`: reads `getFactionSphereScores`; if the top score is `0`, emits no pressure (fail-soft, no invented sphere).

**Bookkeeping fixes (same files):**
- `phaseSpherePressure.ts:258` erosion → `Math.floor(absPressure - threshold)`; if that is `0`, the outcome is `absorbed` (D5).
- `allTraces` is emitted through `emitTrace` (category `sphere_pressure`); `SpherePressureTrace` gains `sources: PressureSource[]` and `sourceIds: string[]` (all events netted into that sphere), keeping the existing single `source` field (additive).

**Property-edit rule.** Every node write goes through `graph.updateNode`; the phase that writes calls `touchWorld(runtime)` when it changed anything, per the load-bearing "never key change detection on graph identity" decision. At init no runtime exists yet; the first tick's version bump covers it.

### Graph nodes / edges

No new node type or edge type. One new **property** on faction nodes: `sphereAggregate: { scores: Record<SphereName, number>; memberCount: number; computedTick: number }` (derived, recomputed, never a pressure target). Edges read: `belongs_to` (actor → culture), `member_of` (actor → faction), `contains` / `parentLocationId` (sublocation → place).

### Tick phases

No new phase. Backfill runs inside Phase 6.639 (`sphere_pressure`) before consumption; faction aggregation inside Phase 6.6395 (`sphere_aggregation`), both already every tick (`orchestrator.ts:3742-3767`).

### Resolution logic

Deterministic table reads; no scoring, ranking or chance.

### PRNG callouts

None. Every seed is a pure function of node properties, edges and tiles. Culture ties break by edge order, which the graph stores deterministically.

## Content pillar

Content: N/A — no encounter template, prose table, attachment or data table is added or changed. The seeds read data the world already authors: `cultureIdentity.veneratedSpheres` (cultureGenerator), `TERRAIN_SPHERE_TABLE`, `LOCATION_SPHERE_TABLE`, lair `dominantSphere`, ruin `sphereAlignment`. The one content-facing effect is indirect: the `place-sphere-reaches-encounter-opening` contract (THR-1635) reads place bags, and more places now carry one (see Interface impact).

## UI pillar

UI: N/A for the player — sphere scores are numbers and never reach the player (UI Law 13, a word never a number); the player-facing Dominion surface is [THR-1750](https://linear.app/threadbare/issue/THR-1750), after the formula. **No browser verification is owed** (no change under `src/components/`, `src/hooks/`, `src/contexts/`, `src/index.css`).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getSphereSeedCensus(): Promise<SphereSeedCensus>` — per kind (`ascendant`, `individual`, `culture`, `faction`, `place`, `sublocation`): `total`, `seeded`, `unseeded`, `nonInteger`, `byRoute`. Declared in `src/debug-bridge.d.ts`. Lets THR-1760's browser prototype and the doom-writer check the research could not do headless run against a bonded world.
- `debug-bridge.ts:1030/1087` already read `ascendant.sphereAffinity.scores`; they return the 2 / 1 seed instead of `undefined` (no code change there).
- `sphere_pressure` and `sphere_seeded` appear in the trace viewer's category filter once added to `TraceCategory`.

## Interface impact

| Contract | Change | Note |
|---|---|---|
| `place-sphere-reaches-encounter-opening` (Spheres & Quintessence → Encounters, THR-1635) | **preserve** | Same producer field, more places seeded (lairs, ruins, waypoints). Its tests (seeds 42 / 99, ≥1 sphere line per seed) must stay green; a changed opening line on a newly-seeded ruin is expected, not a regression. |
| Faction sphere aggregate → battle aftermath | **add** | New cross-system read: `phaseSphereAggregation` writes `sphereAggregate`; production reader `battleAftermath.ts` via `getFactionSphereScores`. Add a row in `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`. Second reader is the Dominion core (THR-1748, not built). |
| Ascendant `sphereAffinity` → debug bridge (`debug-bridge.ts:1030/1087`) | **preserve** | Reader existed and read `undefined`; now reads a bag. |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `seedFromRankedSpheres`, `seedActorSphereAffinity`, `seedPlaceSphereAffinity` (`sphereAffinity.ts`) | init + 6.639 (via backfill) | none | node `sphereAffinity` | `sphere_seeded` | `getSphereSeedCensus` |
| `backfillSphereAffinity` | init (`gameInit.ts`) + head of 6.639 | none | node `sphereAffinity` | `sphere_seeded` | `getSphereSeedCensus` |
| `computeFactionSphereAggregates`, `getFactionSphereScores` | 6.6395 | none | faction `sphereAggregate` | none (derived; census shows it) | `getSphereSeedCensus` (faction row) |
| `phaseSpherePressure` trace emission + integer erosion | 6.639 | none | node `sphereAffinity` | `sphere_pressure` | trace viewer |
| `battleAftermath` faction sphere read | battle aftermath (existing) | none | `pendingSpherePressures` | existing | existing |

Prose pipeline: none. Player controls: none.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `ARCHETYPE_SPHERE_BONUS_PRIMARY` | `2` (existing) | Seed in the first ranked sphere — the god's primary, a culture's / mortal's first venerated sphere |
| `ARCHETYPE_SPHERE_BONUS_SECONDARY` | `1` (existing) | Seed in the second ranked sphere |
| `LOCATION_TYPE_BONUS` | `2` (existing, revived) | Seed in a place's own declared sphere (lair `dominantSphere`, ruin `sphereAlignment`) |
| `MAX_SPHERE_SCORE` | `10` (existing) | Cap for every seed and for own + aggregate |
| `FACTION_SPHERE_AGGREGATE_MIN_MEMBERS` | `1` | Fewer valid individual members than this → aggregate of zeros |
| `SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT` | `true` | Init emits one summary `sphere_seeded` trace instead of ~1,500 per-node ones (ring-buffer budget) |

## Tracing

```ts
// SpherePressureTrace — now emitted (was built and dropped); additive fields
interface SpherePressureTrace {
  category: 'sphere_pressure';
  tick: number;
  entityId: string;
  sphere: SphereName;
  outcome: 'absorbed' | 'eroded' | 'progress' | 'level_up';
  incomingPressure: number;
  threshold: number;
  previousScore: number;
  newScore: number;
  progressFilled: number;
  progressRequired: number;
  source: PressureSource;          // existing — first source netted
  sources: PressureSource[];       // NEW — every writer netted into this sphere
  sourceIds: string[];             // NEW — their sourceIds, same order
}

// SphereSeededTrace — emitted per node seeded mid-run, once as a summary at init
interface SphereSeededTrace {
  category: 'sphere_seeded';
  tick: number;
  entityId: string | null;         // null on the init summary
  kind: 'ascendant' | 'individual' | 'culture' | 'faction' | 'place' | 'sublocation' | 'other';
  route: 'alignment' | 'culture' | 'terrain' | 'parent' | 'declared' | 'none';
  scores?: Partial<Record<SphereName, number>>;  // non-zero entries only; absent on the summary
  counts?: Record<string, number>;               // init summary only: kind:route → n
}
```

Both categories are added to `TraceCategory` (`src/types/trace.ts`) and to whatever the trace-vocabulary test (`src/types/__tests__/trace-vocabulary.test.ts`) requires.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Node has no `hexCol`/`hexRow` and no `terrain` | Sublocation → parent's bag; else zero terrain part; table and declared bonus still apply |
| `tiles` absent (old save, test fixture) | `node.properties.terrain`, then parent, then zero |
| Individual has no `belongs_to` culture, or culture lacks `cultureIdentity` | Zero bag, route `none`, counted in the census |
| `veneratedSpheres` names a non-sphere string | Ignored by `seedFromRankedSpheres` |
| Ascendant `sphereAlignment` missing or malformed | Zero bag, route `none` |
| Faction with no individual members | Aggregate of zeros |
| `sphereAggregate` or own bag malformed on read | Read as zeros in `getFactionSphereScores` |
| Victor faction's combined scores all zero | Battle aftermath emits no sphere pressure (today: silently `chaos`) |
| Any exception inside backfill / aggregation | Caught per node; node skipped; phase continues (tick loop never throws) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | ~120 importers | Two union members added to `TraceCategory`; additive. Exhaustive `switch`es over the union (if any) and the trace-vocabulary test must accept the new members. |

`gameInit.ts` (19 importers), `types/sphereAffinity.ts` (32) and the phase files are below the threshold.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (N/A with rationale)
- [x] UI pillar present (N/A for the player with rationale; debug accessor named)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It keeps Reaches and Spheres orthogonal (D1 rejects calling-based seeds for that reason), adds no player-facing number, and does not pre-empt the parked sphere-governance pivot ([THR-870](https://linear.app/threadbare/issue/THR-870)): no reach gate, signature or identity rule is re-keyed.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. Sphere scores are internal state; no verb, cost, clock or win/loss condition changes. Battle aftermath still presses the victor's dominant sphere; it now has one to press.
- [x] No rulebook edit.

> Brainstorm companion: `Docs/plans/2026-10-06-thr-1768-sphere-score-seeding-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every seed magnitude is an existing named constant; two new constants named above |
| 2. Inspectability | PASS | `sphere_pressure` finally emitted with every writer's source; `sphere_seeded` names the route of every seed; census accessor |
| 3. Determinism | PASS | No randomness; ties break by stored edge order |
| 4. Fail-soft | PASS | See table; no throw on any missing field |
| 5. Narrative over mechanical perfection | PASS with note | Culture seeding (D1) gives "a foreign people on your ground" a mechanical reality the Dominion read can show later |
| 6. Additive over destructive | PASS | New helpers and fields; `seedAgentSphereAffinity` kept as adapter; faction own bag kept; trace fields added, none removed |
| 7. Performance budget | PASS with note | Backfill is one property check per location/actor node per tick (~2,000 nodes; `computeSphereAggregate` already walks the same set every tick); faction aggregation walks `member_of` once per faction. Executor confirms with the tick-cost probe (115 ms/tick baseline, 2026-10-06) — no more than +2 ms |

## Kill criteria

How we will know this plan was wrong, and what happens then:

- **The re-run THR-1759 read shows culture-seeded mortals or declared-sphere lairs dominating every band** (e.g. >80 % of individuals in one sphere on seed 42) → give mortals their own seed constants below the archetype pair, or drop D4. Raise it on [THR-1760](https://linear.app/threadbare/issue/THR-1760), not here.
- **Tick cost rises more than 2 ms over the 115 ms baseline** → move the backfill from every tick to a structure-version check (`structuralCacheVersion`) or a cadence constant.
- **The THR-1635 place-sphere encounter-opening tests fail because newly seeded ruins pick unwanted openings** → exclude `elder_ruin` from that consumer, never from seeding.

## Done when

- [ ] On seed 42 headless, `state.graph.getNode(state.ascendantId).properties.sphereAffinity.scores` carries 2 in the god's `sphereAlignment.primary` and 1 in its secondary at tick 0.
- [ ] Every individual with a `belongs_to` culture carries that culture's first venerated sphere at 2 at tick 0; the census `individual.byRoute.none` equals the count of individuals with no culture edge (expected 0 on seed 42; state it in the closeout).
- [ ] Every location node, both tiers, including lairs, elder ruins and wilderness waypoints, carries a valid bag at tick 0 and after 240 ticks (`census.place.unseeded === 0 && census.sublocation.unseeded === 0` at both ticks).
- [ ] Every faction carries `sphereAggregate`, and a test shows it changes when one member's score changes.
- [ ] A `sphere_pressure` trace appears per writer with its source: on a 240-tick seed-42 headless run with tracing on, every writer that fires there (`divine_action`, `environmental`, `notable` — the three THR-1759 measured) appears in some trace's `sources`; and a unit test feeds one event of **each** `PressureSource` value into `phaseSpherePressure` and finds each in the emitted traces. The other writers (control effects, legacy encounter, doom, rival, mandate, overchannel) cannot fire headless before the First is bonded (THR-1759 § Open facts), which is why the unit test covers them.
- [ ] No sphere score on any node is non-integer after 240 ticks (`census.*.nonInteger === 0`).
- [ ] The THR-1759 read is re-run on the fixed world (seed 42, ticks 0 and 240, both presets) and its tables are attached to the closeout comment — the input THR-1760 needs.
- [ ] `place-sphere-reaches-encounter-opening` tests stay green; the interface-map row for the faction aggregate exists.
- [ ] `npm run gate` verdict (engine files → includes the 30-tick CLI smoke and `npm run test:heavy`).
- [ ] `Browser-verify exempt: no UI files touched; debug-bridge accessor verified by a unit test` stated in the commit body.

## Coordination block

**Suggested model:** opus — five seeding routes, two phases, a trace category and an interface-map row; small per file, wide in reach.

**Parallel-safe with:** [THR-1747](https://linear.app/threadbare/issue/THR-1747) (essence and thread-upkeep files; no sphere-affinity code); [THR-1744](https://linear.app/threadbare/issue/THR-1744) (playtest harness); [THR-1644](https://linear.app/threadbare/issue/THR-1644) (threading rite UI and Meet The First).

**Mutex with:** [THR-1749](https://linear.app/threadbare/issue/THR-1749) — both edit `gameInit.ts` around `createAscendant` and both touch the ascendant's alignment; whichever lands second merges main first and re-runs the ascendant seed test. Anything else editing `gameInit.ts` seeding, `phaseSpherePressure.ts`, `phaseSphereAggregation.ts` or `battleAftermath.ts`.

**Files to touch:**
- Edit: `src/engine/sphereAffinity.ts` (four helpers + census type)
- Edit: `src/types/sphereAffinity.ts` (`FACTION_SPHERE_AGGREGATE_MIN_MEMBERS`, `SPHERE_SEED_TRACE_SUMMARY_ONLY_AT_INIT`, `SphereAggregate` type)
- Edit: `src/engine/gameInit.ts` (actor-loop branch; one backfill call after the late mints)
- Edit: `src/engine/phaseSpherePressure.ts` (backfill at head; integer erosion; emit traces; `sources`/`sourceIds`)
- Edit: `src/engine/phaseSphereAggregation.ts` (faction aggregates)
- Edit: `src/engine/battleAftermath.ts` (read `getFactionSphereScores`; skip on zero)
- Edit: `src/types/trace.ts` (`sphere_pressure`, `sphere_seeded`)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (`getSphereSeedCensus`)
- Edit: `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts` (faction-aggregate row)
- Create: `src/engine/__tests__/sphereSeeding.test.ts` (generated medium world, seeds 42 and 99 — never a fixture for the census assertions)

## Notes for the executor

- **Do not overwrite a valid bag.** The backfill seeds only missing / `null` / malformed bags. A lair at score 9 from escalation must stay 9.
- **Backfill before pressure, not after.** `phaseSpherePressure`'s fail-soft writes a zero default for a target with no bag; if the backfill ran later it would see that zero bag as seeded.
- **Mint paths that write `sphereAffinity: null`** (`npcSeeding.ts:254`, `binding/mintInhabitant.ts:323`, `debugWorldSpawnTools.ts:535`) can stay as they are — the sweep catches them the same tick. Changing them to seed at mint is allowed but not required.
- **Hexes stay unstored.** Hex tiles are not graph nodes; the hex read for THR-1760 is the existing pure `seedHexSphereAffinity(terrain)`. Adding hex storage is out of scope.
- **The god's full bought vector is not this ticket.** If THR-1749 has landed first, the god still seeds from `sphereAlignment` (its two largest buys). Whether the god's power should read the whole vector is [THR-1765](https://linear.app/threadbare/issue/THR-1765).
- **Measure the census on a generated world.** Fixture worlds hide the very mint paths this ticket is about (memory: assert headroom on a generated world, never a fixture).
- **Tracing is off by default** — the trace assertion needs `enableTracing` in the test.

## Intent-judge verdict

**Allow** (opus, cold context, 2026-10-06, ~90 s). Impact class confirmed Reversible. Two GAPs, both fixed in this revision before commit: dimension 3 (the trace Done-when was weaker than the ticket's "per writer" — now every headless writer live plus a unit test per `PressureSource`) and dimension 10 (kill criteria lived only in the action proposal — now a `## Kill criteria` section). Dimension 1 PASS: the D2 sweep, the D3 mean and the D6 alignment fallback were judged named, reasoned deviations inside the delegation.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, Inspectability, Determinism, Fail-soft PASS. Narrative PASS-with-note (D1 follows the narrative signal, explicitly labelled). Additive PASS-with-note (D5 integer erosion and the battle-aftermath zero-skip are behavior changes, named and justified). Performance PASS-with-note (estimated, not measured; executor confirms against the 115 ms baseline, cap +2 ms). The auditor could not read `Docs/plans/wiring-checklist.md` (507 KB, over its read limit) and relied on the plan's Wiring section.

### Three-pillar audit

PASS. Engine present-and-substantive; Content and UI N/A-with-rationale; no missing required sections; Wiring maps every module to phase, field, trace and debug surface; Substrate inventory present and marks Spheres & Quintessence (🟠 DORMANT) as activated, not rebuilt.

### Vision audit

PASS-with-notes. No contradictions. Confirms "all mechanics surface through prose, never numbers" and the taste profile's "prose-first UI, no numbers"; D1 keeps Reaches and Spheres orthogonal. North-star check neutral (plumbing for THR-1760). Soft note: premises cited by name rather than by Vision file path.
