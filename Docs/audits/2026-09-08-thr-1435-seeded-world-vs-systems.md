# The seeded world against what the systems need (wayfinder research, THR-1435)

**Question** (Christian, 2026-09-07, after the THR-1402 census): *"we need to look at our current world generation algorithm and see if we are generating the needed amount of objects … an assessment of all systems, and the objects they use or manipulate, compared to what we seed as the starting world."*

**Method.** Everything below is measured on `main` @ `67a13f4f` (THR-1428/1429 in; THR-1430's PR #1844 armed but not merged), seeds **42 · 99**, medium map. Three throwaway readers ran in the driver session's worktree (never merged; the two that keep earning their place are ported by the tickets this audit files):

- `proto-audit-1435.ts` — boots each seed to **tick 0** and counts every catalogue kind (through `WORLD_OBJECT_KINDS`' own discriminators), every undertaking object type (through `UNDERTAKING_OBJECT_TYPES` + `resolveObjectOwners`), every edge type, and who holds what; and scans every module under `src/engine/**` with the inventory's own `domainOf` / `subsystemForModule` for the edge and node types it reads and writes.
- `proto-worldgen-census-1402.ts` and `proto-ownedvia-1402.ts` from [proto/thr-1402-census](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1402-census) — the same counts at tick 150.
- `proto-census-1402.ts` (extended with a board-refusal tally) — the cells census that resolved [THR-1402](https://linear.app/threadbare/issue/THR-1402).

Numbers are written **seed 42 · seed 99**. "Deciding" means `isAutonomousDecisionActor`: an individual whose `spotlightTier` is spotlight or unset.

## 1. The starting world in one table

| Kind (catalogue) | tick 0 | owned at 0 (registry's read) | who holds it | tick 150 |
|---|---|---|---|---|
| Area | 21 · 20 | — | — | same |
| Location | 214 · 234 — settlement 47 · 67, stronghold 4 · 5, holy place 3 · 11, ruin **95 · 100**, wild 43 · 27, wonder 8 · 10, deposit 14 · 14 | 112 · 129 via `controls` | **factions only** (125 · 142 `controls`, every one faction → location; individuals 0) | 309 · 334; individuals 4 · 13 |
| Place | 739 · 923 — commerce 242 · 319, authority 147 · 169, cultural 105 · 141, military 84 · 104, religious 76 · 71, underworld 34, scholarly 22 · 24, arcane 19 · 41, nature 10 · 20 | **0** via `owns` | nobody, ever (2 · 0 at tick 150, both by claim × Place) | 773 · 966 |
| Route | **0** identity nodes; `road` edges 12 · 21; `trades_with` **0**; `sacred_route` 0 | — | — | 0 identity nodes (`create × route` began 5 times, finished 0) |
| Mortal | 476 · 620 — **spotlight 14 · 14**, ambient 459 · 603, unset 3 (the avatar, two mercenary commanders); with `domainCapabilities` **16**; pursuing an ambition **14**; deciding **17** | — | — | 566 · 760; deciding 40 · 37 of which **23 · 20 are lair elites** (no ambition, no capabilities); ambient → spotlight graduations in 150 ticks: **0** |
| Faction | 49 · 57 — untyped 36 · 44 (3 generic `faction_i` + one per monster lair), guild 6, military 3, criminal 2, religious 1, political 1 | **0** via `leads` / `commanded_by` | leadership is derived from `member_of.rank` (`getFactionLeaderId`); `leads` is written only by the succession phase (0 · 1 at tick 150) | 69 · 75 |
| Company | **0** | — | — | 13 · 17 (organic formation) |
| Army | 2 (the two mercenary companies) | 2 via `commanded_by` | the two placeholder commanders (unset tier → deciding) | 2 · 1 |
| Network | 0 | — | — | 0 (THR-1430 mints them) |
| Companion | 0 | — | registry declares no owner; the writer's edge is `accompanies` | 0 · 0 |
| Item | 129 · 130 `artifact` nodes — **~120 are catalog template nodes** (`reward_*`, `anomaly_*`), 7 starter possessions, 1–2 world artifacts (`artifact_i`, on a Location, unheld) | 7 via `possesses` | 7 seeded spotlight mortals | 246 · 253; possessed 110 · 108 |
| Legendary artifact | 1 | 1 via `bonded_to` | — | 1 |
| Power | 25 (bestowal catalog + 5 spell definitions) | 0 via `has_trait` | definitions; nobody wields one at start | 45 · 49; borne 20 · 26 |
| Condition | 59 definitions | 0 (registry declares no owner) | 4 `has_trait` borne (starter wounds) | 233 · 221; borne 38 · 29 |
| Agreement | **0** (`knows_secret_of` 0, `owes_favor` 0) | — | — | 19 · 20 |
| Standing | `reputation_with` **0** (sparse by design — minted on first write, pruned at neutral); `relates_to` 56 · 59 (25 mortal↔mortal, 31 faction↔faction on 42); `hostile_to` **0** | — | — | `reputation_with` **still 0 at 150**; `hostile_to` 83 · 86 |
| Trait | 22 · 30 definitions; `has_trait` 816 · 2129 (cultural 450, innate 362, condition 4) | — | — | — |
| Ambition | 11 · 10 nodes; `pursues` 32 (28 mortal, 2 faction, 2 army) | — | — | — |
| Event | 0 | — | — | 741+ `occurred_at` |

**Edge types present at tick 0: 15** of the union's 50 — `adjacent`, `avatar_of`, `belongs_to`, `bonded_to`, `commanded_by`, `constructed_by`, `contains`, `controls`, `has_trait`, `located_at`, `member_of`, `possesses`, `pursues`, `relates_to`, `road`. Absent, and read by a subsystem on tick 1: `owns`, `trades_with`, `leads`, `accompanies`, `hostile_to`, `reputation_with`, `knows_secret_of`, `owes_favor`, `knows_of`, `knows_clue_of`, `holds_place_of_power`, `mentors`, `participates_in`, `sacred_route`, `knows_spell`.

**Three things the table says before any subsystem is read.**

1. **The living world's people are fourteen.** Of 476–620 mortals, 14 are seeded with capabilities, an ambition and the spotlight tier (`AGENT_COUNT_BY_MAP_SIZE.medium = { min: 10, max: 16 }`, `src/data/agent-behavior-constants.ts:564`); the other 459–603 are ambient role NPCs with neither. Every undertaking, every calling, every board decision in the census came from those 14 plus 2 mercenary commanders. NPC graduation (`npcGraduation.ts`) promoted **nobody** to spotlight in 150 ticks; the deciding population grew only by lair elites that decide nothing. [THR-1348](https://linear.app/threadbare/issue/THR-1348) already holds the *aperture* fork (should notables carry work); the *seed count* is a constant and is proposed below.
2. **Nothing is held, traded, owed or known at tick 0.** Zero freeholds, zero trade routes, zero agreements, zero quarrels, zero familiarity. The whole "living" half of the object catalogue — the edges the yield, leverage, counter-play and intelligence cells act on — is minted only in-run, by the very undertakings that need it to exist first. The economy phases (`phaseTradeRouteDecay`, `routeEvents`, `economicPower`, `holdingIncome`, `armySupply`'s relief lines) have nothing to read until a mortal or a god makes a route.
3. **Territory is round-robin.** `worldSeed.ts:1372` hands Location *i* to `factionIds[i % factionIds.length]` — the three generic factions control the map in rotation with no regard to province, culture or distance; definition factions add one home-control edge each. 125 · 142 `controls` edges, all faction → Location, none by a mortal.

## 2. Subsystem by subsystem — what it uses, what the world holds, verdict, proposal

Reads and writes are the module scan's (edge types the subsystem's modules read or `addEdge`; node types it reads or `addNode`), trimmed to the kinds that matter. Verdicts: **enough** · **starved** (exists, too few to matter on tick 1) · **empty by construction** (nothing mints it before play) · **registry ≠ writer** (the undertaking registry reads ownership through an edge the world never writes, or ignores the one it does). Proposal buckets: **seed** · **register** · **band** (leave to the band that owns the kind) · **leave**.

| # | Subsystem | Kinds read / written / owned / handed over (edges) | tick 0 (42 · 99) | Verdict | Proposal |
|---|---|---|---|---|---|
| 1 | War, Armies & Battles | reads Army (`commanded_by`, `member_of`, `participates_in`), Location (`controls`), Route (`trades_with`, `road`) for supply; writes Army, Battle, `commanded_by`, `participates_in` | armies 2 (mercenary), battles 0, `trades_with` 0 → every relief line empty | **starved** | **seed** one garrison army per culture capital (`WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE`), faction-owned, commanded by a spotlight member — the war layer and claim / seize / observe × Army get objects |
| 2 | Factions & Succession | reads Faction, `member_of` (rank), `leads`, `relates_to` (faction↔faction), `controls`; writes `leads` (succession only), `relates_to`, `member_of` | factions 49 · 57 (36 · 44 are lair factions); `leads` 0; `relates_to` faction pairs 31 | **registry ≠ writer** — the undertaking registry owns a Faction through `leads` / `commanded_by`; the world derives its leader from `member_of.rank` | **register** — Faction ownership resolves through `getFactionLeaderId` (derived), `leads` when present; drop `commanded_by` (a faction is never commanded) |
| 3 | Rival Gods & Schemes | reads `controls`, `sponsors_scheme`, `thread` | rivals seeded at init; god-side | enough | leave (untouched by design, THR-1401) |
| 4 | Doom Clock & Journey | reads the First's `controls` | — | enough | leave |
| 5 | Mandate | reads Location `sphere_influence`, `thread` | every Location carries `sphereInfluence` | enough | leave |
| 6 | Essence & Divine Economy | reads the ascendant's `controls`, `aspect_of`; latent essence sources seeded | sources latent by design | enough | leave |
| 7 | Encounters & Dilemmas | reads everything: Mortal, Location, Place, `has_trait`, `member_of`, `relates_to`, `possesses`, `sacred_route`; writes Event, `participated_in`, `occurred_at`, `has_trait` | 476 mortals, 214 Locations, 739 Places; `sacred_route` 0 | enough | leave |
| 8 | Culture | reads/writes `belongs_to`, `has_trait` (cultural) | 6 · 5 cultures, `belongs_to` 336 · 472 | enough | leave |
| 9 | Personality & Emergent Traits | reads/writes `has_trait` | innate 362, cultural 450 | enough | leave |
| 10 | Mortal Economy & Prosperity | reads Location stocks (`properties.resources`), `controls`, **`owns`**, **`trades_with`**; writes none at seed | stocks on every Location; `trades_with` **0**; `owns` **0** | **empty by construction** — the trade phases, the toll and the tithe have no object until a mortal makes a route or claims a Place | **seed** trade routes (`WORLDGEN_TRADE_ROUTES_PER_CULTURE`) with their identity nodes, and freeholds (`WORLDGEN_FREEHOLDS_PER_SPOTLIGHT`); **register** — `create × route` must mint the identity node (it mints the edge only today; the templates-model lifecycle mints the node at `strategicActionLifecycle.ts:1300–1330` and the cell does not) |
| 11 | Ambitions & Undertakings | reads `pursues`, `hostile_to` (motive gate), `owns`, `possesses`, `commanded_by`, `knows_*`, `relates_to`; writes `pursues`, `hostile_to` (grievance) | `pursues` 32 (14 mortals); `hostile_to` **0** — the motive gate has no licence on tick 1; the counter-play cells refused `no_motive` 51–237 times per seed (THR-1402) | **starved** twice: fourteen holders, zero quarrels | **seed** — spotlight count up (`WORLDGEN_SPOTLIGHT_AGENTS_BY_MAP_SIZE`) and starting quarrels from the rivalries worldgen already writes (`WORLDGEN_QUARREL_SENTIMENT_MAX`); the elites stamped ambient (THR-1403) |
| 12 | Attachments, Items & Possessions | reads Item (`possesses`), Companion (`accompanies`), Holding (`owns`), Power / Condition (`has_trait`), `bonded_to`; writes all of them | items possessed 7; ~120 catalog templates read as Items; companions 0; `owns` 0 | **registry ≠ writer** (three ways): Companion declares no owner while `accompanies` is the writer's edge; Condition declares no owner while `has_trait` is (so `destroy × Condition` — the cure — found no owner on either seed); catalog template nodes pass `isItemObject` (claim × Item would pick up a template) | **register** — `accompanies` on Companion, `has_trait` on Condition (with the cure un-gated for self and allies, the blessing's own sign test), templates excluded from Item; **seed** one to two possessions per spotlight mortal from the catalog (`WORLDGEN_POSSESSIONS_PER_SPOTLIGHT`) so seize / destroy × Item have targets beyond seven |
| 13 | Ruins, Clues & Delves | reads ruin / wonder Locations, lairs, `knows_clue_of`, `holds_place_of_power`; writes clues, `knows_of` | ruins 95 · 100, wonders 8 · 10, lairs seeded; clues 0 (earned) | enough — sites are plentiful; the clue economy is earned by design | leave (observe × Location / Area feed it since THR-1428) |
| 14 | Stealth, Detection & Hidden Marks | god-side state only | — | enough | leave |
| 15 | Attention, Chronicle & Narrative | reads Event; writes nothing at seed | events 0 (earned) | enough | leave |
| 16 | Omens & Atmospheric Pressure | reads `pursues` (motive receipts) | — | enough | leave (THR-1432 adds the outcome reader) |
| 17 | Strategic Projects & Control | reads `controls`, `owns`, `commanded_by`, `knows_*`, `trades_with`; writes all the cell ops | `strategicState.projects` 0, `controls` records 0 (the 125 `controls` edges are faction jurisdiction, not stances) | enough — it is the actor of change, not a consumer of seed | leave |
| 18 | Ascendant Beats & Progression | reads `thread`, `controls` | god-side | enough | leave |
| 19 | Companies & Group Travel | reads/writes Company, Network (`commanded_by`, `member_of`) | companies **0**, networks 0 | **empty by construction**, fills organically (13 · 17 by tick 150) | leave (band: THR-1430 mints networks; claim / seize × Company is the people-things band) |
| 20 | Movement & Colocation | reads `located_at`, `road`, Place (`sublocationTypeId`) | `located_at` 565 · 713; roads **12 · 21** for 214 · 234 Locations | enough for movement (hex pathfinding does not need roads); the road web is thin | leave — roads are `roadNetwork`'s; noted for the map's Not-yet-specified |
| 21 | Reputation & Influence | reads/writes `reputation_with`, `relates_to`, `hostile_to`, `member_of.reputation` | `reputation_with` 0 (still 0 at 150); `relates_to` 56 · 59 | **registry ≠ writer** — the undertaking registry's Standing object is the `reputation_with` edge alone, so raise / lower / destroy × Standing enumerate nothing (`no_object_in_range` 39 · 93 refusals); the catalogue's Standing kind is `reputation_with` ∪ `relates_to` ∪ `hostile_to` | **register** — Standing objects = `relates_to` ∪ `reputation_with` per ordered pair; the ops already mint `reputation_with` on write |
| 22 | Secrets & Favors | reads/writes `knows_secret_of`, `owes_favor` | **0 · 0** | **empty by construction**, minted in-run (19 · 20 by 150) | **seed** one mark per culture between spotlight mortals (`WORLDGEN_SEEDED_MARKS_PER_CULTURE`) so a Spider has something to press on day one |
| 23 | Effects & Conditions | reads/writes `has_trait` (condition), `possesses`, `owns`, `bonded_to` | 59 definitions, 4 borne | enough (conditions are earned) | leave; the ownership fix is row 12 |
| 24 | Agent Lifecycle | reads Mortal, `member_of`, `located_at`, `pursues`; writes Mortal (birth, graduation), `pursues` | 476 · 620 mortals, 14 spotlight, graduations to spotlight in 150 ticks **0**; 23 · 20 lair elites in the deciding tier by 150 | **starved** at the deciding tier | **seed** (row 11's constant); elites ambient at mint (THR-1403); the graduation aperture stays THR-1348's fork |
| 25 | Intelligence, Knowledge & Familiarity | reads `knows_secret_of`, `knows_of` | both **0** | **empty by construction** — familiarity is earned (observe cells, clue convergence) | leave |
| 26 | Spheres & Quintessence | reads `has_trait`, `controls`, sphere affinity on hexes / Locations / actors | affinity seeded on every node at init | enough | leave |
| 27 | World Generation, Terrain & Places | **the writer**: Area, Location, Place, Mortal, Faction, Army (2), Item (templates + 7 + 2), `controls`, `constructed_by`, `member_of`, `relates_to`, `road`, resources, ambitions | — | — | the seeding ticket's home |

**One write with no reader, found on the way:** `constructed_by` — 166 · 192 edges, Location → a *random* faction (`worldSeed.ts:1381–1394`, "1–2 structures per location"), read by **no** engine module (the scan finds zero readers; `strategicGraphOps` writes it for founded Places). It is not ownership and cannot be made into it without changing what it means; recorded here, not proposed.

## 3. The mismatch list

**(a) Kinds the systems need that worldgen never mints.**

| Kind / edge | Needed by | Proposal |
|---|---|---|
| Route — `trades_with` edges and the `trade_route` identity node | Mortal Economy (trade decay, route events, economic power), War (relief lines), Chronicle (route markers), 7 Route cells | **seed** `WORLDGEN_TRADE_ROUTES_PER_CULTURE` |
| Holding — `owns` (freeholds) | `holding_income`, `resolutionModifiers`, `notableAgendas`, seize / destroy × Place, seize × Route | **seed** `WORLDGEN_FREEHOLDS_PER_SPOTLIGHT` |
| Quarrel — `hostile_to` | the motive gate (every lower / seize / destroy cell), grievance, route events | **seed** `WORLDGEN_QUARREL_SENTIMENT_MAX` (provisional, veto invited — THR-1383 treats grudges as earned by seen harm; a *starting* quarrel is the world's history, not an unseen harm) |
| Agreement — `knows_secret_of` / `owes_favor` | Secrets & Favors, `socialLeverage`, use / destroy / seize × Agreement | **seed** `WORLDGEN_SEEDED_MARKS_PER_CULTURE` (provisional) |
| Army beyond the two mercenary companies | War, claim / seize / observe × Army | **seed** `WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE` |
| Company, Network, Companion | Companies & Group Travel, the people-things band, THR-1430 | **band** — organic formation fills companies (13–17 by 150); networks are THR-1430's; companions are story-minted |
| Familiarity — `knows_of`, `knows_clue_of` | Intelligence, Ruins | **leave** — earned by observe (THR-1428) |
| Deciding mortals | everything downstream of the decision loop | **seed** `WORLDGEN_SPOTLIGHT_AGENTS_BY_MAP_SIZE` (the aperture rule itself stays THR-1348's) |

**(b) Kinds worldgen mints that nothing touches.**

| What | Count | Reading |
|---|---|---|
| `constructed_by` edges | 166 · 192 | zero engine readers (§ 2) — a dead write |
| catalog template `artifact` / `trait` nodes | ~120 items, 20 bestowals, 59 conditions | not world objects; read by `instantiateReward` as templates — correct, but the Item registry counts them as objects (row 12) |
| ruin-class Locations | 95 · 100 of 214 · 234 (45%) | read by the delve layer and observe × Location; not untouched, but the ratio is worth a look — nearly half the map's named places are ruins, and settlements are 47 · 67. Not proposed here (`elderRuinSeeding` density is its own tuning) |
| lair factions | 33 · 41 untyped factions | read by the war and lair phases; they inflate every "faction" count and are enumerated as objects by observe × Faction and destroy × Faction — a lair's monster faction can be schismed. Not proposed; noted for the people-things band |

**(c) Ownership edges the registry reads that no writer writes — and writers whose edge the registry ignores.**

| Kind | Registry reads | World writes | Fix |
|---|---|---|---|
| Faction | `commanded_by`, `leads` | `member_of.rank` (derived leader); `leads` by succession only | **register** the derived reader |
| Place | `owns` | nothing at seed; `grantHolding` in-run | **seed** freeholds; the edge is right |
| Route | `owns` on an identity node that is never minted by the cell | `trades_with` edge only (the cell); the node only on the templates path | **register** — the cell mints the node; then **seed** |
| Companion | — | `accompanies` (bearer → companion) | **register** |
| Condition | — | `has_trait` (bearer → definition) | **register** (and sign the cure like the blessing) |
| Standing | `reputation_with` | `relates_to` at seed; `reputation_with` on first change | **register** the union |
| Item | `possesses` — and every `artifact` node | `possesses` on 7; ~120 template nodes with no possessor | **register** — exclude templates |
| Power | `has_trait` (THR-1429) | `has_trait` | agreed |
| Location | `controls`, `owns` | `controls` (factions), `owns` (claim) | agreed; `ownedByDeciding` is 0 at seed because no mortal controls anything — a consequence of round-robin territory, not a registry gap |

## 4. Proposals, sorted

**Register the edge the writer already uses — engineering facts, the agent's ([THR-1436](https://linear.app/threadbare/issue/THR-1436), lands before THR-1403 so the flip's census reads owned objects):**

1. Faction: owners = `getFactionLeaderId` (+ `leads` when present); `commanded_by` dropped.
2. Companion: `ownedVia: ['accompanies']` (holder → object).
3. Condition: `ownedVia: ['has_trait']`; `destroy × Condition` exempt from the motive gate when the bearer is self or an ally (`isAlly`, the blessing's test) — provisional, veto invited.
4. Standing: objects = `relates_to` ∪ `reputation_with` (one per ordered pair); tier from the score when a `reputation_with` exists, else from `relates_to` sentiment distance.
5. Item: catalog template nodes excluded (`catalogTemplate: true` stamped at `seedAttachments`, additive; `isItemObject` reads it).
6. Route: `ROUTE.create` mints the identity node through one helper shared with the lifecycle's `trade_route` arm.

**Seed it in worldgen — counts as named constants, conservative values, every one listed in the digest for veto ([THR-1437](https://linear.app/threadbare/issue/THR-1437), mutex with THR-1403 on `undertaking-objects.ts` and `strategic-action-constants.ts`):**

| Constant | Default | Owner of the seeded thing | Rationale |
|---|---|---|---|
| `WORLDGEN_SPOTLIGHT_AGENTS_BY_MAP_SIZE` (replaces `AGENT_COUNT_BY_MAP_SIZE`'s values) | small 8–12 · medium **18–24** · large 24–32 · epic 32–44 | — | 14 deciders on 214 Locations; graduation adds none in 150 ticks. Tick cost measured on the closeout (the decision loop scales with deciders) |
| `WORLDGEN_TRADE_ROUTES_PER_CULTURE` | 2 | unowned (claimable) | capital ↔ the two nearest settlements within `WORLDGEN_TRADE_ROUTE_MAX_HEXES` (8), by `createTradeRoute` + the identity node; the economy phases have a route on tick 1 |
| `WORLDGEN_FREEHOLDS_PER_SPOTLIGHT` | 1 | the mortal (`owns`, `via: 'creation'`) | a spotlight mortal whose leading Reach is gold, stone or heart holds one commerce or authority Place in their home Location; `holding_income` pays, seize × Place has a target |
| `WORLDGEN_POSSESSIONS_PER_SPOTLIGHT` | 1 | the mortal (`possesses`) | one catalog possession per spotlight mortal beyond the seven hand-seeded starters, instantiated (not the template) |
| `WORLDGEN_QUARREL_SENTIMENT_MAX` | −0.6 | — | a seeded `relates_to` at or below this sentiment also gets a `hostile_to` edge (cause `old_quarrel`, grudge provenance) — the motive gate has licences on tick 1. **Provisional** |
| `WORLDGEN_SEEDED_MARKS_PER_CULTURE` | 1 | the holder (`knows_secret_of` source) | one spotlight mortal holds a mark on another of the same culture. **Provisional** |
| `WORLDGEN_CAPITAL_GARRISONS_PER_CULTURE` | 1 | the capital's controlling faction; commander a spotlight member of it | one army per culture capital through `spawnArmy` |
| `WORLDGEN_TERRITORY_MODE` | `'province'` | — | a Location is controlled by the definition faction whose home is nearest inside the same province, else the culture's generic faction — replaces `factionIds[i % n]`. **Provisional**: a quality fix rather than a count |

Determinism holds: every seed step draws from its own `mulberry32(seed + prime)` stream, as the existing passes do. Never seeded: Network (until THR-1430 lands), Standing as `reputation_with` (its shape is settled above as the union; nothing to mint), Company, Companion.

**Leave to the band that owns the kind:** claim / seize × Company / Army / Faction (people-things); use × Location, use × Standing, raise × Route, seize × Agreement (yield); Network cells (THR-1430); Power and Condition create cells (THR-1429, shipped).

## 5. What this changes on the map

- The census's 24 never-started cells re-read: 10 `no_object_exists` are rows (a), 6 `no_owned_object` are rows (c), 5 `no_motive` are the quarrel constant plus THR-1383's supply, 2 never-walked are THR-1403's cap removal. None is a table row.
- The four per-calling gates are measured against a world of 14 protagonists; the seed constant is what makes "no calling idles on the census seeds" a statement about the game rather than about fourteen people.
- The "seed it" ticket is where Christian's larger goal starts — *"a great starting world with all systems in play … a mature and balanced set of starting objects and relationships"* — and it is deliberately conservative: every constant above can be raised without a code change once the tick cost is measured.

**Picture:** [Seeded World Against the Systems](https://claude.ai/code/artifact/4f436fbf-6070-4bfc-aba3-840a3d93e7b7).
