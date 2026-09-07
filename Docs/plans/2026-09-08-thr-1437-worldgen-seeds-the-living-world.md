> **title:** `Worldgen seeds what the systems need — THR-1437`
> **linear_issue:** THR-1437
> **author:** `Claude Code`
> **created:** 2026-09-08
> **three_pillars:** Engine `done` · Content `done — no prose; the generated catalogue and the worldgen wiki page regenerate` · UI `N/A — no surface changes; the roster and map simply hold more`

# Worldgen seeds what the systems need — THR-1437

*The starting world has fourteen people who can act and nothing that is held, traded, owed or known; this plan seeds the objects and relationships the systems read on tick 1, as named constants at conservative values, so the simulation starts as a living world rather than one waiting for its first undertaking to make something to act on.*

## Why this is load-bearing

[THR-1435](https://linear.app/threadbare/issue/THR-1435) measured the seeded world on seeds 42 · 99 (`Docs/audits/2026-09-08-thr-1435-seeded-world-vs-systems.md`): of 476 · 620 mortals, **14** carry capabilities, an ambition and the spotlight tier — every undertaking in the census came from them and two mercenary commanders, and NPC graduation promoted nobody in 150 ticks; **15 of 50 edge types** exist at tick 0, and none of `owns`, `trades_with`, `knows_secret_of`, `owes_favor`, `hostile_to`, `knows_of`; territory is `factionIds[i % n]`. So the trade phases, the toll and the tithe, the motive gate and the leverage cells have no object until an undertaking makes one — and the undertakings that make them are held by fourteen people.

Christian's larger goal (driver brief, 2026-09-07): *"get the seeding/world generation to a place where we can generate a great starting world with all systems in play, and a mature and balanced set of starting objects and relationships spawned and connected of all the types available in a way that lets the simulation start at a place where it actually looks like a living world of places, people, events."* His delegation for the counts: *"propose them as named, tunable constants with a one-line rationale each, implement conservative values, and list every constant in the digest for veto. Determinism holds: same seed, same world. Never seed a kind whose band has not shipped its shape."* This plan is the first, conservative step: eight seeded things behind thirteen named constants, each a number a later session raises without a code change once the tick cost is measured.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| World Generation, Terrain & Places — `worldSeed.ts` (`seedWorld`, the individuals loop `:1400–1500`, the round-robin `controls` loop `:1372–1394`, `ensureFactionControlAtHomeLocations`, `locationCultureMap`), `AGENT_COUNT_BY_MAP_SIZE` (`agent-behavior-constants.ts:562`) | 🟢 ACTIVE | **extends** — a new tail pass `seedLivingWorld` after `assignFactionsToExistingNpcs`; one constant's values raised |
| Mortal Economy & Prosperity — `createTradeRoute` (`strategicGraphOps.ts:73`), `selectTradePartner` / `TRADE_PARTNER_MAX_HEX_RANGE` (`tradeRouteOps.ts:112`), `mintRouteIdentity` (THR-1436) | 🟢 ACTIVE | **connects** — seeded lanes are minted by the same op and helper the cell uses |
| Attachments, Items & Possessions — `grantHolding` (`holdings.ts:230`, `via: 'creation'`), `instantiateReward` (`rewardPool.ts:596`), `REWARD_POSSESSIONS` | 🟢 ACTIVE | **connects** — freeholds and possessions through the writers that exist |
| Reputation & Influence — `writeGrudge` (`grievance/grudgeEdge.ts:49`), `GrudgeCause`, `GRUDGE_PROVENANCE` (`undertakingMotive.ts:40`) | 🟢 ACTIVE | **connects** — seeded quarrels through `writeGrudge` with a cause the gate reads as `rivalry`, never `grudge` |
| Secrets & Favors — `mintLeverageMark` (`strategicGraphOps.ts:655`) | 🟢 ACTIVE | **connects** — seeded marks |
| War, Armies & Battles — `spawnArmy` (`armySpawning.ts:185`), the mercenary post-seeding block (`worldSeed.ts:1672–1782`) | 🟢 ACTIVE | **connects** — one garrison per culture capital through the merc pattern |
| Agent Lifecycle — `npcGraduation.ts` | 🟢 ACTIVE | **preserves** — the aperture rule is [THR-1348](https://linear.app/threadbare/issue/THR-1348)'s; only the seed count moves |

**Grep evidence (measured 2026-09-07).** `AGENT_COUNT_BY_MAP_SIZE.medium = { min: 10, max: 16 }`; spotlight mortals at tick 0: 14 · 14. `type: 'owns'` has one writer (`holdings.ts:266`); `type: 'trades_with'` one (`strategicGraphOps.ts:110`); `type: 'knows_secret_of'` three (`secretGeneration.ts:428`, `strategicGraphOps.ts:689`, `graphOpExecutor.ts:775`); `type: 'hostile_to'` four (`grudgeEdge.ts:69,134`, `mentorshipOutcomes.ts:389`, `phaseFactionActions.ts:520`) — none at worldgen. `provinces[]` carries `cultureId` and `capitalHex` (`worldgen/types.ts:26`), and `seedWorld` already builds `locationCultureMap` (Location → culture, role). The culture promotion pass makes exactly one `capital` per culture (`CULTURE_SETTLEMENT_QUOTA`). Population: 6 · 5 cultures, 47 · 67 settlements, 739 · 923 Places of which commerce 242 · 319 and authority 147 · 169, 56 · 59 `relates_to`, of which 25 are mortal↔mortal on seed 42 (seed 99 not broken out).

## Engine pillar

### Systems design

**One new module, `src/engine/seedLivingWorld.ts`**, exporting `seedLivingWorld(graph, ctx)` with `ctx = { seed, tiles, locationIds, individualIds, factionIds (generic), factionDefIds, cultureIds, locationCultureMap, provinces }`, called at the tail of `seedWorld` after `assignFactionsToExistingNpcs` (the first point where every input exists — the THR-1344 lesson). Seven passes, each with its own `mulberry32(seed + PRIME)` stream (reserved even where the pass draws nothing), each guarded by its constant so a `0` disables it, each fail-soft per Location / mortal (a throw skips the one item and traces). One `[WorldGen] Living world: …` console line reports what each pass minted, the way the genome top-up does.

**W1 — protagonists (the count constant).** `AGENT_COUNT_BY_MAP_SIZE` keeps its name (it is already the named, tunable constant; renaming forces importer edits for nothing) and its values move: small 8–12, **medium 18–24**, large 24–32, epic 32–44. Rationale: fourteen deciders on 214 Locations, and graduation adds none. The individuals loop is unchanged. Tick cost is measured, not assumed (§ Done when).

**W2 — territory by province (provisional).** After `ensureFactionControlAtHomeLocations`, for every Location that is controlled by a *generic* faction (`faction_i`) and belongs to a culture (`locationCultureMap`): the controller becomes the definition faction whose `homeLocationId` lies in the same culture and is nearest by hex distance within `WORLDGEN_TERRITORY_MAX_HEXES`; else the generic faction assigned to that culture (cultures → generic factions, round-robin over *cultures*, which is stable). Uncultured Locations keep the original assignment. The existing `controls` edge is retargeted (`updateEdge` on `source`), never duplicated; monster-lair and definition-home control edges are untouched. `WORLDGEN_TERRITORY_MODE = 'province' | 'round_robin'` selects the pass; `'round_robin'` is the exact pre-plan behaviour (the kill switch).

**W3 — trade routes.** Per culture: the capital (else the first city or town by id) and its `WORLDGEN_TRADE_ROUTES_PER_CULTURE` nearest settlement-class Locations by hex distance within `WORLDGEN_TRADE_ROUTE_MAX_HEXES`, id tie-break. Each pair: `createTradeRoute(graph, capital, partner, 'worldgen', 0)` then `mintRouteIdentity(...)` (THR-1436). Unowned — a lane nobody holds is what `claim × Route` is for. `lastTraded: 0` is what `createTradeRoute` stamps, and the decay phase's staleness clock starts at birth exactly as for a founded lane.

**W4 — freeholds.** For every spotlight mortal whose leading Reach (highest `domainCapabilities`, `REACH_DOMAINS` order tie-break) is gold, stone or heart: the first unowned commerce- or authority-class Place (`placeClassOf`) by id in their home Location (`properties.locationId`); `grantHolding(graph, mortalId, placeId, { tick: 0 }, 'creation')`. `WORLDGEN_FREEHOLDS_PER_SPOTLIGHT` Places each (1). The face artifact `grantHolding` mints is the sheet's, as for a claimed freehold.

**W5 — possessions.** For every spotlight mortal holding fewer than `WORLDGEN_POSSESSIONS_PER_SPOTLIGHT` possessions: the first tier-1 `REWARD_POSSESSIONS` template by id whose `tags` include `#<leading reach>`, else the first tier-1 template by id; `instantiateReward(graph, templateId, mortalId, 0)`. The seven hand-seeded starters count toward the quota, so `ind_0`…`ind_6` are untouched.

**W6 — quarrels (provisional).** For every seeded `relates_to` between two individuals with `sentiment ≤ WORLDGEN_QUARREL_SENTIMENT_MAX`: `writeGrudge(graph, a, b, 0, 'old_quarrel')`. `GrudgeCause` gains `'old_quarrel'` (additive); it is deliberately **not** added to `GRUDGE_PROVENANCE`, so the motive gate reads it as `rivalry` — it licenses lower, seize and destroy on things, never the plot (`PLOT_MOTIVES = ['grudge', 'faction_war']`, THR-1430). A starting quarrel is the world's history, not an unseen harm; THR-1383's seen-harm rule is untouched.

**W7 — marks (provisional).** Per culture, among the spotlight mortals belonging to it: the holder is the one with the highest shadow capability, the subject the highest eye capability among the rest (id tie-breaks); `mintLeverageMark(graph, holder, subject, UNDERTAKING_DEFAULT_MARK_SECRET_TYPE, UNDERTAKING_DEFAULT_MARK_MAGNITUDE, 0)`, `WORLDGEN_SEEDED_MARKS_PER_CULTURE` times (1). Fewer than two spotlight mortals in the culture → nothing.

**W8 — garrisons.** Per culture capital: the controlling faction (after W2); a captain minted on the mercenary-commander pattern (`agent_garrison_${cultureId}`, `actorType: 'individual'`, `spotlightTier: 'spotlight'`, capabilities iron `WORLDGEN_GARRISON_CAPTAIN_IRON` 60 / gold 40 / the rest 10–20 as the merc block, a culture-aware name, `located_at` the capital, `member_of` the faction with `role: 'commander'`, `rank: 0.8`), a faction ambition node `amb_${factionId}_garrison` (`ambitionType: 'territory_defense'` if the union has it, else `resource_acquisition` — the executor checks `AMBITION_KIND_FACTION` types), then `spawnArmy(seedTimeState, factionId, captainId, ambitionId)`. `WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE` (1). The captain is a protagonist by construction (a garrison's captain is somebody) and is counted in the closeout beside the W1 count.

**Order and determinism.** W2 → W3 → W4 → W5 → W6 → W7 → W8, all after the existing tail; W1 is a constant. Every pass sorts its candidates by id and takes the first; the reserved streams (`seed + 60013 … 60083`) are for a later pass that needs a draw. Same seed, same world — the test builds the world twice and compares every edge id.

### Graph nodes / edges

No new node or edge type; one new `GrudgeCause` member. Written: `controls` (retargeted), `trades_with` + the `trade_route` identity `location` node, `owns` + holding face artifacts, `artifact` instances + `possesses`, `hostile_to` (both ways, cause `old_quarrel`), `knows_secret_of`, one captain `actor` + `located_at` + `member_of`, one `ambition` + `pursues`, one army `actor` + `commanded_by` + `member_of` + `located_at` per culture.

### Tick phases

None. Worldgen only (`seedWorld`, before tick 1).

### Resolution logic

Sorted-first everywhere: nearest by `hexDistance` with id tie-break (W2, W3), lowest id (W4, W5), the two highest capabilities (W7), sentiment threshold (W6).

### PRNG callouts

Seven reserved `mulberry32(seed + prime)` streams, none drawn by this plan's passes (every choice is a sort). Reserved so a future draw does not perturb the existing streams (the THR-1344 hygiene).

## Content pillar

### Encounter templates

Content: N/A — no encounter or prose. Two generated pages regenerate because their census changes: `Docs/canon/world-objects.generated.md` (the LIVE/DORMANT badges and counts; `npm run generate-world-objects`) and `Docs/canon/systems-inventory.md` (Companies & Group Travel may leave DORMANT; `generate-systems-inventory`), both under `check:generated-freshness`. The worldgen wiki page whose `sources` match `worldSeed.ts` is updated in the same PR (or exempt with a reason).

### Prose tables

N/A.

### Attachment content

N/A — possessions are instantiated from the existing catalog; no entry changes.

### Data tables

- `src/data/agent-behavior-constants.ts` — `AGENT_COUNT_BY_MAP_SIZE` values.
- `src/data/worldgen-living-constants.ts` (new) — the constants below, beside the primes.
- `src/engine/grievance/grudgeEdge.ts` — `GrudgeCause` + `'old_quarrel'`.

## UI pillar

UI: N/A — no component changes. The roster (`ThreadsPanel`), the map and the sheets render more of what they already render. Headless evidence only (THR-688 rule C): `Browser-verify exempt: worldgen counts only, no component touched`. The CLI `objects` readout (with THR-1436's owned column) is the inspection surface, plus the `[WorldGen] Living world` line.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `src/engine/seedLivingWorld.ts` (new) | worldgen (`seedWorld` tail) | — | graph | none (worldgen); one console summary line | CLI `objects`, `census:ownership`, `census:seeded-world` |
| `src/engine/worldSeed.ts` (call site) | worldgen | — | — | — | — |
| `scripts/census-seeded-world.ts` (ported from the proto reader) | — | — | — | — | `npm run census:seeded-world` |

Player controls: N/A by design.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `AGENT_COUNT_BY_MAP_SIZE` (values) | small 8–12 · medium 18–24 · large 24–32 · epic 32–44 | protagonists seeded with capabilities, an ambition and the spotlight tier |
| `WORLDGEN_TERRITORY_MODE` | `'province'` | `'province'` retargets generic-faction control by culture and distance; `'round_robin'` is the pre-plan behaviour |
| `WORLDGEN_TERRITORY_MAX_HEXES` | `10` | how far a definition faction's home reaches for territory |
| `WORLDGEN_TRADE_ROUTES_PER_CULTURE` | `2` | lanes from each capital to its nearest settlements |
| `WORLDGEN_TRADE_ROUTE_MAX_HEXES` | `8` | the farthest a seeded lane reaches (`TRADE_PARTNER_MAX_HEX_RANGE` is the in-run analogue) |
| `WORLDGEN_FREEHOLDS_PER_SPOTLIGHT` | `1` | Places a gold-, stone- or heart-leaning protagonist holds at home |
| `WORLDGEN_FREEHOLD_PLACE_CLASSES` | `['commerce', 'authority']` | which Place classes a freehold may be |
| `WORLDGEN_POSSESSIONS_PER_SPOTLIGHT` | `1` | possessions per protagonist, counting the hand-seeded starters |
| `WORLDGEN_QUARREL_SENTIMENT_MAX` | `-0.6` | a seeded rivalry at or below this sentiment is a standing quarrel |
| `WORLDGEN_SEEDED_MARKS_PER_CULTURE` | `1` | marks between protagonists of one culture |
| `WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE` | `1` | armies at each culture's capital |
| `WORLDGEN_GARRISON_CAPTAIN_IRON` / `_GOLD` | `60` / `40` | the captain's leading capabilities (the mercenary commander's values) |
| `WORLDGEN_LIVING_PRIMES` | `[60013, 60017, 60029, 60037, 60041, 60077, 60083]` | one reserved PRNG stream per pass |

## Tracing

None new — worldgen runs before the trace buffer is read. The `[WorldGen] Living world:` console line reports `territory retargeted N · routes N · freeholds N · possessions N · quarrels N · marks N · garrisons N`, and `census:seeded-world` prints the same counts from the graph (so the line can be checked, never trusted).

```ts
// No TraceEntry. The census script's row shape:
interface SeededWorldRow { seed: number; kind: string; objects: number; owned: number; ownedByDeciding: number }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| A culture has no capital (promotion pass found no promotable Location) | W3 uses the first city or town by id; W8 skips the culture |
| No settlement within `WORLDGEN_TRADE_ROUTE_MAX_HEXES` | fewer lanes for that culture; no reach-out beyond the constant |
| `createTradeRoute` refuses (`route_already_exists`) | skip the pair |
| `mintRouteIdentity` fails | the edge stands; counted as a lane, not as a Route object |
| No unowned commerce/authority Place at home | no freehold for that mortal |
| No tier-1 template with the reach tag | the first tier-1 template by id |
| `instantiateReward` returns null | skip |
| Sentiment absent or non-numeric on a `relates_to` | no quarrel |
| Fewer than two protagonists in a culture | no mark |
| Controlling faction of a capital absent | W8 skips the culture |
| `spawnArmy` returns null | the captain stays (a commander without a host is a mortal like any other) |
| A pass throws | caught per pass; the summary line reports `<pass> failed`; the world is still valid |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/worldSeed.ts` | moderate (gameInit and the census scripts) | one call at the tail; nothing before it changes, so every existing seed step and its PRNG stream produce what they did |
| `src/data/agent-behavior-constants.ts` | high (behaviour constants) | one constant's values; no shape change |

## Interface impact

| Contract | Status today | Action |
|---|---|---|
| `t1-undertaking-objects-feed-existing-economies` | 🟢 LIVE | **extend** — the economies have seeded objects to read on tick 1 |
| `freehold-income-pays-mortal-holders` (THR-1428) | 🟢 | **extend** — seeded freeholds are paid from the first interval |
| `economy-provisions-armies` | 🟢 LIVE | **extend** — garrisons and lanes give `armySupply` relief lines to read |
| `destroy-candidates-gated-on-motive` | 🟢 LIVE | **extend** — seeded quarrels are `rivalry`-provenance licences; the plot's `grudge` set is untouched |
| `world-object-registry` | 🟢 LIVE | **preserve** — no kind changes; the generated census moves |
| `worldgen-seeds-the-living-world` | — | **add** — producer `seedLivingWorld`; consumers the trade phases, `holdingIncome`, the motive gate, `socialLeverage`, `armySupply`, the decision loop. Register in `scripts/interface-contracts.ts` |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (generated pages regenerate; templates and prose N/A with rationale)
- [x] UI pillar N/A with rationale
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves the living world (`00-north-star.md`: a world with things to have opinions about from the first hour) and keeps mortal sovereignty (nothing here is the god's; every seeded thing is a mortal's or a faction's). The provisional passes (territory, quarrels, marks) are each behind a constant that turns them off.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes: the starting world holds more of the objects the rules already govern.
- [x] `Docs/canon/rulebook.md` § the world gains one pointer line to the constants (what a starting world holds), in the executor's PR.

> Brainstorm companion: `Docs/plans/2026-09-08-thr-1437-worldgen-seeds-the-living-world-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | thirteen named constants; every pass is a number, and `0` disables it |
| 2. Inspectability | PASS | the summary line, `census:seeded-world`, the CLI `objects` owned column |
| 3. Determinism | PASS | sorted-first everywhere; reserved streams; the double-build test |
| 4. Fail-soft | PASS | twelve rows; a pass failure never invalidates the world |
| 5. Narrative over mechanical perfection | PASS with note | a starting quarrel and a starting secret are history the world begins with, not harms nobody saw |
| 6. Additive over destructive | PASS with note | one retarget (territory) behind a mode constant whose other value is the old behaviour; everything else adds |
| 7. Performance budget | PASS with note | more protagonists means more decision-loop work per tick — measured on the closeout with `measure:tick-cost` on both seeds at medium; the kill criterion below bounds it |

## Done when

- [ ] Headless, seeds 42 · 99 medium, tick 0 (`census:seeded-world`): spotlight mortals ≥ 18 (+ one captain per culture); route identity nodes ≥ 2 × cultures − skipped; `owns` ≥ the count of gold/stone/heart protagonists with an eligible Place; possessed items ≥ protagonists; `hostile_to` ≥ 1 (both seeds have rivalry `relates_to` below −0.6 — the executor reports the count, and if it is 0 on a seed the constant is reported, not moved); marks ≥ cultures − 1; armies = 2 + cultures with a capital; for every cultured Location the controller's culture equals the Location's (`'province'` mode), and `'round_robin'` reproduces the pre-plan edges exactly
- [ ] Same seed twice → identical node and edge id sets (test)
- [ ] The census re-run on both seeds — `npm run census:cells` once THR-1403 ports it, else the script on [proto/thr-1402-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1402-census) (`scripts/proto-census-1402.ts`, cherry-picked onto the ticket's worktree, never merged) — shows `no_object_exists` for `route`, `agreement`, `standing` gone; `no_motive` refusals fall; cells started ≥ 21 → reported before/after on this ticket
- [ ] `measure:tick-cost` on both seeds at medium before/after, recorded on the ticket; tick cost within `+25%` (kill criterion: above it, `AGENT_COUNT_BY_MAP_SIZE.medium` steps down to 14–20 and the number is recorded)
- [ ] `generate-world-objects`, `generate-systems-inventory`, the interface map and the worldgen wiki page regenerated; `check:generated-freshness` and `check:wiki-freshness:blocking` green
- [ ] 30-tick CLI engine smoke and `npm run test:heavy` locally
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass
- [ ] Closing commit body includes `Fixes THR-1437`
- [ ] `Browser-verify exempt: worldgen counts only, no component touched` in the commit body

## Kill criteria

- Tick cost rises above +25% at medium → the protagonist constant steps down (14–20) and the rest of the passes stay; recorded.
- A seeded pass makes a heavy-lane test (`test:heavy`) red for a fixture reason (a test that assumed 14 mortals or 0 routes) → the test's assumption is corrected against a generated world, never by lowering the constant to fit the test.
- Province territory leaves a culture's capital controlled by another culture's faction → the pass has a bug; `'round_robin'` is the fallback while it is fixed.
- The roster stops reading as *a handful of people* at the raised count (the Vision auditor's note on design tension 5): the roster's doing-line (THR-1434) is the legibility check; if 24 protagonists read as a list rather than a cast, `AGENT_COUNT_BY_MAP_SIZE.medium` steps down before the tick-cost criterion is even reached.

## Coordination block

**Suggested model:** opus — seven passes over a seeder with twelve PRNG streams and a promotion pass whose order matters; the executor must read `seedWorld` end to end before placing the call.
**Parallel-safe with:** THR-1432, THR-1433, THR-1434 (no worldgen or registry files).
**Mutex with:** THR-1436 (this plan calls `mintRouteIdentity` from it — **land THR-1436 first**); THR-1403 (both edit `src/data/strategic-action-constants.ts` and both re-run the cells census as evidence — sequence, do not race); any ticket editing `src/engine/worldSeed.ts` or `src/data/agent-behavior-constants.ts`.
**Files to touch:** `src/engine/seedLivingWorld.ts` (new), `src/engine/worldSeed.ts` (tail call), `src/data/worldgen-living-constants.ts` (new), `src/data/agent-behavior-constants.ts`, `src/engine/grievance/grudgeEdge.ts` (`GrudgeCause`), `scripts/census-seeded-world.ts` (new) + `package.json`, `scripts/interface-contracts.ts`, `Docs/canon/world-objects.generated.md` + `systems-inventory.md` (regenerated), `Docs/canon/rulebook.md` (one line), the worldgen wiki page, tests: `src/engine/__tests__/seedLivingWorld.test.ts` (new; counts on a generated small world, determinism, round-robin equivalence), `src/engine/__tests__/worldSeed*.test.ts` (existing assumptions).

## Notes for the executor

- **Place the call after `assignFactionsToExistingNpcs`** — the same reasoning THR-1344 recorded for the second genome pass: earlier, the inputs do not exist yet.
- **W2 retargets, never adds.** One `controls` edge per generic-controlled Location; keep the edge id (readers key on `[0]?.source`, THR-1297's warning). Definition-home and lair edges are not touched.
- **W3 uses the capital the promotion pass made** (subtype `capital` in the culture's `locationCultureMap` set). `mintRouteIdentity` is THR-1436's; if this ticket is picked up first, the lifecycle arm's code at `strategicActionLifecycle.ts:1300–1330` is the body to extract.
- **W5's template pick** reads `tags` on `REWARD_POSSESSIONS` entries (`#iron`, `#gold`…); leading reach from `domainCapabilities` in `REACH_DOMAINS` order on ties.
- **W6's cause is not injury provenance** — do not add `old_quarrel` to `GRUDGE_PROVENANCE`; the test asserts `holdsMotive(a, b, 'rivalry')` true and `'grudge'` false for a seeded pair.
- **W8's captain is a protagonist**: `spotlightTier: 'spotlight'`, capabilities, no ambition of their own (the army pursues the faction ambition; `assignInitialAmbitions` may be run for them too if the executor prefers a captain with a want — either is fine; say which).
- **The count constant is a value change, not a rename.** The audit named it `WORLDGEN_SPOTLIGHT_AGENTS_BY_MAP_SIZE`; keep `AGENT_COUNT_BY_MAP_SIZE`, and say so in the closeout so the digest's veto handle points at the right name.
- **Measure tick cost first** on the pre-plan tree, then after, both seeds, and put the two numbers on the ticket beside the constant. That number is what Christian vetoes against.
- **Every provisional pass** (W2, W6, W7) is listed in the digest with its veto handle: *"say 'round-robin territory' / 'no starting quarrels' / 'no starting secrets' and the constant goes to its off value."*

## Intent-judge verdict

**Run 1 (fable, cold, 2026-09-08): Allow** — impact class Reversible confirmed; ten dimensions PASS, one GAP on wiring: the Done-when's cells census depended on a script not on `main` with no stated provenance. Applied in this revision: the Done-when names where the executor runs it from (`census:cells` once THR-1403 ports it, else the proto-branch script cherry-picked onto the worktree), and "eight constants" in § Why was reconciled with the thirteen-row table. The judge verified every writer the passes reuse at source (`AGENT_COUNT_BY_MAP_SIZE`, the round-robin loop, `createTradeRoute`, `mintLeverageMark`, `grantHolding`, `instantiateReward`, `writeGrudge` and `GRUDGE_PROVENANCE`, `spawnArmy`, the mercenary block, `placeClassOf`, the catalog tags) and all five interface-contract ids; `'territory_defense'` is absent from the faction ambition union and the plan already hedges to `resource_acquisition`.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-08 (sonnet, three auditors spawned in one message).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 13 named constants tabled; "every pass is a number, and `0` disables it" |
| 2. Inspectability | PASS | the `[WorldGen] Living world` summary line, `census:seeded-world` cross-checking graph counts ("checked, never trusted"), the CLI `objects` owned column; wiring table in the checklist's format |
| 3. Determinism | PASS | sorted-first selection in every pass; seven reserved `mulberry32(seed + PRIME)` streams kept unused so existing streams are not perturbed; a double-build-and-diff test in the Done-when |
| 4. Fail-soft | PASS | 12-row table; each pass independently caught, "a pass failure never invalidates the world" |
| 5. Narrative over mechanical | PASS-with-note | a seeded quarrel or secret is "history the world begins with, not harms nobody saw" — a reasoned trade-off, not silent |
| 6. Additive over destructive | PASS-with-note | W2 retargets `controls` by default — a default-behaviour change — gated behind a constant whose other value reproduces the prior behaviour exactly; W5 counts the hand-seeded starters so nothing is double-issued |
| 7. Performance budget | PASS-with-note | `measure:tick-cost` before/after on both seeds is required, with a stated kill criterion (+25% → step the count down); the measurement is committed but not yet taken |

**NFP AUDIT: PASS-with-notes.**

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | seven passes W1–W8 with graph, tick-phase, resolution and PRNG detail |
| Content | present-and-substantive | Encounter / Prose / Attachment N/A with rationale; Data tables names three real files |
| UI | N/A-with-rationale | no component changes; a named `Browser-verify exempt` string |

No missing required sections. Wiring connects `seedLivingWorld.ts` and the `worldSeed.ts` call site to the worldgen phase, the graph and the debug surfaces. Substrate check: PASS — all seven subsystems match the inventory verbatim, all 🟢 ACTIVE, every pass reuses an existing writer, nothing rebuilt.

**PILLAR AUDIT: PASS.**

### Vision audit

`00-north-star.md` → "the mortal has to feel like a person … a favor fulfilled, a grudge carried, a bond formed — before the crisis arrived" — **extended**: seeded quarrels, marks, holdings and routes give protagonists that history before tick 1. `01-core-loop.md` → not referenced (worldgen only). `02-non-negotiables.md` → graph — confirmed; three pillars — confirmed. `03-design-tensions.md` → tension 5 (one perfect story vs. portfolio breadth) — **extended** by the protagonist count; the plan gates tick cost but not scan legibility at the new count — a note, not a block (folded into the kill criteria above). `taste-profile.md` → narrative over mechanical — confirmed. No contradictions. North star yes; core loop preserved; non-negotiables clear; tension 5 leaned on and noted; taste profile clean (dev-facing evidence only).

**VISION AUDIT: PASS-with-notes.**
