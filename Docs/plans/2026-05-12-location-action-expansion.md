# Location Action Expansion — Six Settlement-Scale Verbs

**Date:** 2026-05-12
**Linear:** [THR-401](https://linear.app/threadbare/issue/THR-401)
**Parent audit:** [THR-390](https://linear.app/threadbare/issue/THR-390)
**Project:** Content Architecture
**Authoring agent:** Cowork (autonomous, scheduled)
**Status:** Implementation Planning → Ready for Dev

## Summary

Add six new `UnifiedActionTemplate` entries with `targetCategories: ['location']`, lifting the location verb count from 4 → 10. Six verbs span four shapes of location influence — economic (Bless the Harvest, Open the Markets), social (Sanctify the Square, Awaken the Spirit of the Place), mystical-cruel (Sicken the Wells), and destructive-edge (Curse the Roads). Tier curve fits the THR-397 recurve target (2× tier-1, 3× tier-2, 1× tier-3). Every effect resolves through existing `GraphOp` paths (`update_node` for node properties, `add_edge` for trade catalysts, `set_property` for time-bounded flags); no new effect resolvers required. The Awaken/Curse open verdicts in the parent issue are resolved here in favour of the minimum-viable implementation that still produces the dramatic beat — both verbs ship without new graph schema.

## Three-Pillar Coverage

- **Engine** (§5–§7) — six template additions, three new tunable property fields with countdown semantics, one new edge subtype consumer, four traces, fail-soft table, constants table.
- **Content** (§8) — Threadbearer-voiced prose per verb (initiation/success/failure), enrichment placeholders, conditional blocks, motivations, sphere-affinity reasoning.
- **UI** (§9) — verbs surface automatically through ActionDrawer (already wired); chronicle and toast notifications wire through existing `narrative_generation` and `unified_action_resolve` traces; debug inspection through DebugPanel Actions tab (already exists). New: rarity-tier badge confirmation on three new tier-2 cards; settlement-detail panel population/prosperity readouts re-bound to read new properties; HexMapV2 `routesCursed` overlay signifier on affected locations.

## Why Six Verbs (Audit Justification)

The location target type sits second-most-underserved in the audit (4 verbs, vs. ~52 for hex and ~22 for agent). Locations are the *named places* the player thinks about — keeps, cathedrals, trade hubs, cursed manors. Players reach for *places* more than for raw map coordinates because places have stories attached. Four verbs (one of which is gated to fortifications) cannot carry that load.

**Distribution rationale.** The four shapes of location influence are: economic (the place's relationship to wealth), social (the place's relationship to mood/loyalty/order), mystical (the place's relationship to the magical substrate), destructive (the place's relationship to its own continuity). Existing 4 verbs cover mystical (`ward`, `place_of_power`) and destructive-social (`incite_unrest`, `fortify` — both narrow). Six new verbs rebalance toward economic and social.

| Existing | New | Total per shape |
|----------|-----|-----------------|
| Economic | 0 → 2 | (bless harvest, open markets) |
| Social | 1 → 3 | (incite_unrest, sanctify_square, awaken_spirit) |
| Mystical | 2 → 3 | (ward, place_of_power, sicken_wells*) |
| Destructive | 1 → 2 | (incite_unrest, curse_roads) |
| Defense (sub-shape) | 1 → 1 | (fortify) |

*Sicken-the-wells is positioned in mystical because the harm flows through magical contamination, not direct violence. It is also a counter-verb to Bless the Harvest, making the pair narratively legible.

## §1 — Cowork Resolutions to Open Verdicts

Three open verdicts in THR-401 issue body. Resolved here per the scheduled-task autonomy rule (no clarifying questions; document choices).

### Resolution 1: Awaken the Founder → "Awaken the Spirit of the Place"

The full "founder" version requires a `founder` identity node per settlement, which doesn't exist in the current graph schema. Per CLAUDE.md "No inventing node types without verification" — defer the founder-identity content-architecture pass. Ship the *simpler* version that uses procedural identity at action time:

- Action spawns an `actor` node of subtype `place_spirit` parented to the location via a new `embodies_spirit_of` edge.
- The place_spirit's name is generated from the settlement name + cultural naming hooks already present in `cultureRules.ts`.
- The place_spirit's traits seed from the settlement's `culture` and dominant biome (`Resolute` + biome-flavour trait).
- The place_spirit is a normal actor; it can be encountered, conversed with, dispatched, refused. It participates in the existing encounter, awareness, and Maslow pipelines unmodified.

This delivers the dramatic beat (a settlement *remembers* itself) without inventing graph schema. The full founder-identity-with-mythic-arc treatment can be filed as a deferral once the spirit version proves the player-experience value. **If the spirit verb feels thin in playtest, we know the upgrade target.**

### Resolution 2: Plague the Wells → "Sicken the Wells" (reversible)

Keep the verb, soften the framing to reversible disease. Mechanically: `populationHealth` property declines `−25` on success; decays back toward baseline `+1/tick`; Bless the Harvest restores `+15` on success (so the pair is *not* perfectly symmetric — sickening is faster than healing). This preserves the cruel feel while keeping the verb a *story turn* rather than a population-extermination loss state. Aligns with NFP #5 (narrative over mechanical perfection) and the Cool Failure principle: even the people of a sickened settlement are still around to *remember* the god who poisoned them.

### Resolution 3: Curse the Roads → property countdown, not edge mutation

Edge-weight mutation of `adjacent`/`trades_with` edges would require new effect resolver wiring and a new `set_edge_property` GraphOp variant. Per NFP #6 (additive over destructive) and §5.1 of the systemic wiring guide, the simpler path is a new property on the location node: `routesCursedUntilTick: number | null`. `phaseProsperity` (which already reads `trades_with` for trade-route prosperity bonuses) checks the source and target of each trade route — if either endpoint has `routesCursedUntilTick > currentTick`, the route contributes zero this tick. No new resolver, no schema change to edges, fail-soft naturally (cleared properties just stop applying), `routesCursedUntilTick` decays past `currentTick` automatically.

## §2 — Six New Templates (the verb sheet)

### 2.1 Bless the Harvest — `loc.bless_harvest`

| Field | Value |
|-------|-------|
| Reach | `gold` (industry, abundance) |
| Sphere | `life` (growth, regeneration) |
| Rarity | 1 (Mundane) |
| Intrinsic tier | `background` |
| AP cost | 1 |
| Essence cost | 4 |
| Scale | `local` |
| Duration | 2–3 ticks |
| Difficulty | 0.25 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital']` |
| Motivations | `preservation_transformation`, `mercy_ruthlessness` |
| Counter-verb | `loc.sicken_wells` |

**Effect on success:** `update_node` on `$target` → `prosperity: +12`, `populationHealth: +15`. Both clamp at 100. Adds a `seeds[]` `migrationPullUntilTick: currentTick + LOC_BLESS_HARVEST_DURATION_TICKS` property (so future settlement-promotion phase can read it; v1 ships the property, full migration system is downstream of THR-390's roadmap).

**On failure:** No state change. Emits a `narrative_event` with the failure prose.

**Why this verb.** Two-thirds of settlements in a generated world spend most of the play session at "default prosperity" — the player has no way to *signal* divine favour to a place without invoking a high-tier verb. Bless the Harvest is the cheap mundane verb that lets the player say "I love this place" with mechanical consequence. It pairs with `hex.cultivate` (sustained, hex-wide) and `loc.sicken_wells` (the counter).

**Prose (initiation/success/failure):**

- *initiation:* "{name} kneels into the loam at the field's edge, pressing palms to soil that has fed {their} people for generations."
- *success:* "Grain swells in the husk before harvest is due. The miller's wife will say {they} prayed too hard. The miller will say it doesn't matter why."
- *failure:* "The wind shifts wrong. Whatever {they} reached for slips between {their} hands, and the field is only a field."

### 2.2 Open the Markets — `loc.open_markets`

| Field | Value |
|-------|-------|
| Reach | `gold` |
| Sphere | `order` (organised exchange, contracts) |
| Rarity | 1 (Mundane) |
| Intrinsic tier | `background` |
| AP cost | 1 |
| Essence cost | 3 |
| Scale | `local` |
| Duration | 1–2 ticks |
| Difficulty | 0.20 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital', 'tradehub']` |
| Motivations | `loyalty_ambition`, `tradition_novelty` |
| Risk band | `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` (encounter-seeding) |

**Effect on success:** `update_node` on `$target` → `prosperity: +6`, `unrest: −10`. Spawns (probabilistically) a `trades_with` edge to the nearest non-bonded settlement within range — bias toward existing partial-trade-route locations. If location's `unrest` was ≥ `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` (75) at action time, plant an `encounter_seed` with `templateId: 'thieves_guild_offer'` and `delayTicks: LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS` (8). Risk-band is the player tax for activating a high-unrest market.

**Why this verb.** Most low-prosperity settlements in our generator have no `trades_with` edges. The player needs a way to *kickstart* a market, not just buff one. Sphere choice (order vs. gold) emphasizes that this is the verb of *institutional* trade — contracts, weights and measures, marketplace law — rather than raw wealth.

**Prose:**

- *initiation:* "{name} reaches into the empty square and unfolds it like a market awning, inviting commerce in."
- *success:* "By third bell, two new stalls. By dusk, six. {?has_faction}The {faction} will want their cut.{/has_faction}{?no_faction}For now, no one is collecting taxes. That will change.{/no_faction}"
- *failure:* "The square stays empty. {The|the} merchants {name} called on this morning have not yet learned to listen."

### 2.3 Sanctify the Square — `loc.sanctify_square`

| Field | Value |
|-------|-------|
| Reach | `star` (faith, devotion) |
| Sphere | `spirit` (consciousness, belief) |
| Rarity | 2 (Storied) |
| Intrinsic tier | `shaping` |
| AP cost | 1 |
| Essence cost | 5 |
| Scale | `local` |
| Duration | 2–3 ticks |
| Difficulty | 0.30 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital', 'shrine']` |
| Motivations | `tradition_novelty`, `loyalty_ambition` |
| Threading boost | `LOC_SANCTIFY_DIVINE_PRESENCE_DELTA` |

**Effect on success:** `update_node` on `$target` → `magicalSaturation: +0.15`, `divinePresence: +0.20` (new property — defaults 0, clamps 0–1). If the action's *actor* has a `thread` edge to any agent located at this location, that thread's `devotion` increments by `LOC_SANCTIFY_THREAD_DEVOTION_DELTA` (2). Plants an `encounter_seed` with `encounterFamily: 'pilgrimage'` and `delayTicks: 12`.

**Why this verb.** `loc.place_of_power` covers the magical substrate, but a *consecrated* square is what makes ordinary mortals show up at dawn to pray and meddle in each other's lives. This is the social-religious counterpart to the mystical `place_of_power`. The thread-devotion boost is the through-line to THR-402 (Agent Feedback System) — sanctified spaces make threads richer, which is the kind of synergy the action audit was looking for.

**Prose:**

- *initiation:* "{name} steps to the centre of the square and breathes out. The breath does not return."
- *success:* "{?has_ally}{ally:strongest} would say {they} could feel it from three streets away. {/has_ally}The square is no longer just a place where people meet. It is a place where they remember to *mean* what they say."
- *failure:* "Children keep playing. Carts keep rolling. Whatever {name} pressed into the stones has not yet taken root."

### 2.4 Awaken the Spirit of the Place — `loc.awaken_spirit`

| Field | Value |
|-------|-------|
| Reach | `heart` (bonds, memory) |
| Sphere | `spirit` |
| Rarity | 3 (Mythic) |
| Intrinsic tier | `transcendent` |
| AP cost | 2 |
| Essence cost | 12 |
| Scale | `regional` |
| Duration | 3–5 ticks |
| Difficulty | 0.40 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital', 'ruin']` |
| Motivations | `tradition_novelty`, `preservation_transformation`, `sacrifice_survival` |

**Effect on success:**
- `add_node` actor of subtype `place_spirit`, located at `$target`. Name procedurally generated from `$target.name` + cultural rule (`Spirit of {name}`, `The {name}-Walker`, etc.).
- Traits seeded: `Resolute` (always), one biome-themed reputation trait, one culture-themed innate trait.
- `add_edge` `embodies_spirit_of` from new actor → `$target`.
- `update_node` on `$target` → `divinePresence: +0.25`.
- Plants an `encounter_seed` `encounterFamily: 'founders_return'` on the highest-influence agent at the location, `delayTicks: 6`.

**Why this verb.** A settlement remembering itself is the biggest story beat a single location can produce. The place_spirit is a normal actor — it can disagree with the player, take sides in factional politics, fall in love, die. The "old laws and forgotten customs resurface" feel is delivered by the spirit's behaviour (an actor with `Resolute` + culture trait will push the settlement toward its named values) rather than by simulation-wide rule changes. Tier 3 because it permanently changes the actor density at a location.

**Prose:**

- *initiation:* "{name} traces the oldest stone in the foundation, finds the name carved beneath the moss, and speaks it aloud."
- *success:* "Someone answers. {They} have always been here. Now {they} are also here in a way that {name} can see."
- *failure:* "The name is spoken into a stone that does not yet know how to listen."

### 2.5 Sicken the Wells — `loc.sicken_wells`

| Field | Value |
|-------|-------|
| Reach | `veil` (rituals, channeling) |
| Sphere | `entropy` (dissolution, decay) |
| Rarity | 2 (Storied) |
| Intrinsic tier | `shaping` |
| AP cost | 1 |
| Essence cost | 6 |
| Scale | `local` |
| Duration | 2–3 ticks |
| Difficulty | 0.35 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital']` |
| Motivations | `mercy_ruthlessness`, `preservation_transformation` |
| Counter-verb | `loc.bless_harvest` |

**Effect on success:** `update_node` on `$target` → `populationHealth: −25`, `unrest: +15`, `magicalSaturation: −0.10`. Sets `wellsSickenedUntilTick: currentTick + LOC_SICKEN_WELLS_DURATION_TICKS` (default 10). While active, settlement promotion phase reads it as a population-growth suppressor. Plants `encounter_seed` `encounterFamily: 'plague_investigation'` on highest-Eye-capability agent at location, `delayTicks: 4`.

**Why this verb.** The pair `bless_harvest`/`sicken_wells` is the player's most legible "this place gets my favour vs. my wrath" choice at low essence cost. Sphere choice (entropy via veil) keeps it a *ritual* act — it requires the player to step into the role of a god who *channels* harm, not a god who simply destroys. Reversible per Resolution 2.

**Prose:**

- *initiation:* "{name} folds something soft into the water — a name, a refusal, a fragment of grief. The well drinks it."
- *success:* "By the third morning, children will not drink. By the fifth, neither will mothers. The healers will call it the well-fever and not yet think to ask who taught the well to be hungry."
- *failure:* "The water remains water. Whatever {name} fed it has slid away."

### 2.6 Curse the Roads — `loc.curse_roads`

| Field | Value |
|-------|-------|
| Reach | `shadow` (intrigue, hidden influence) |
| Sphere | `chaos` (disorder, dissolution-of-pattern) |
| Rarity | 2 (Storied) |
| Intrinsic tier | `shaping` |
| AP cost | 1 |
| Essence cost | 5 |
| Scale | `regional` |
| Duration | 2–3 ticks |
| Difficulty | 0.35 |
| Target categories | `['location']` |
| Target subtypes | `['settlement', 'hamlet', 'town', 'city', 'capital', 'tradehub']` |
| Motivations | `mercy_ruthlessness`, `preservation_transformation` |

**Effect on success:** `update_node` on `$target` → `routesCursedUntilTick: currentTick + LOC_CURSE_ROADS_DURATION_TICKS` (default 12). `phaseProsperity` consumes this property: any `trades_with` edge with `$target` as source or target contributes 0 to either endpoint's prosperity while the curse is active. Also: `update_node` `unrest: +10` (isolation breeds discontent). Plants `encounter_seed` `encounterFamily: 'bandit_emergence'` keyed to the cursed location, `delayTicks: 6`.

**Why this verb.** Targets the settlement's *connectedness* rather than its internal state. Per Resolution 3, this is implemented as a node-property countdown read by the existing trade-route consumer phase — no new effect resolver. Sphere choice (chaos via shadow) emphasizes that this is the verb of *unraveling pattern*, not direct destruction.

**Prose:**

- *initiation:* "{name} steps into the dust at the town gate and draws a line. The line is not visible. The line is the road forgetting where it goes."
- *success:* "By the third week, three caravans have turned back. By the fourth, no one will travel after dark. The roads still exist. They are simply no longer to be trusted."
- *failure:* "The dust settles. The road remembers itself. The next traveller arrives on schedule."

## §3 — Tier Curve & THR-397 Alignment

THR-397 (Recurve rarity tagging) targets a 30/35/25/10 distribution. These six verbs ship: 2× tier-1 (Bless, Markets), 3× tier-2 (Sanctify, Sicken, Curse), 1× tier-3 (Awaken Spirit). Distribution per tier-share contribution: 33% / 50% / 17% / 0%. Slight overweight on tier-2; intentional, because location verbs are mid-game-defining for most playthroughs and the player needs decision density at that tier. Tier-4 (Legendary) intentionally omitted at this scope; a future "Re-found the City" verb would fit there.

## §4 — Pairing & Synergy Map

| Verb | Pairs with (existing) | Pairs with (new) | Counter |
|------|----------------------|------------------|---------|
| Bless the Harvest | `hex.cultivate` (sustained vs. one-shot) | — | `loc.sicken_wells` |
| Open the Markets | `loc.fortify` (defensible market) | `loc.curse_roads` (kill the rival's market) | `loc.curse_roads` |
| Sanctify the Square | `loc.place_of_power` (mystical-vs-social) | `loc.awaken_spirit` (consecrated ground hosts the spirit) | `loc.incite_unrest` |
| Awaken the Spirit | `action.anoint-champion` (present vs. past) | `loc.sanctify_square` | — (no direct counter; spirit can be killed by normal agent-targeting verbs) |
| Sicken the Wells | `loc.incite_unrest` (cruelty stacking) | `loc.curse_roads` (isolation + sickness combo) | `loc.bless_harvest` |
| Curse the Roads | `loc.incite_unrest` (squeeze from inside and outside) | `loc.sicken_wells` | `loc.open_markets` (re-establish trade) |

This ensures each verb has both a player-favoured and player-cruel use case, and that the verbs form a small lattice of decisions rather than six independent buttons.

## §5 — Engine Pillar

### 5.1 Schema Additions

Three new optional location-node properties. All default to `0` or `null`. All consumed by existing phases — no new phase needed.

| Property | Type | Default | Consumer | Decay |
|----------|------|---------|----------|-------|
| `populationHealth` | `number` (0–100) | 80 | `phaseProsperity` (low health dampens prosperity), `phaseUnrest` (sick population is restless), settlement promotion (sick settlements don't grow) | `+1/tick` natural recovery toward 80 baseline |
| `divinePresence` | `number` (0–1) | 0 | `phaseProsperity` (small bonus), threading visibility | `−0.01/tick` natural decay |
| `routesCursedUntilTick` | `number \| null` | `null` | `phaseProsperity` (sets trade contribution to 0 while active) | Tick-based; cleared when `currentTick > routesCursedUntilTick` |
| `wellsSickenedUntilTick` | `number \| null` | `null` | `phaseSettlementPromotion` (suppresses population growth) | Tick-based |
| `migrationPullUntilTick` | `number \| null` | `null` | Future migration phase (THR-390 roadmap); v1 sets the property as a forward hook | Tick-based |

Schema lives in `src/types/graph.ts` under `LocationNodeProperties`. Additive only — no existing fields renamed or removed (NFP #6).

### 5.2 New Node Subtype

`place_spirit` — new `actor` subtype emitted by `loc.awaken_spirit`. Subtype string registered in `src/types/graph.ts` `ActorSubtype` union. Maslow integration: place_spirits share the existing actor decision pipeline; no new agent-AI surface needed. The spirit's behaviour will read naturally from its `Resolute` + culture-trait composition.

### 5.3 New Edge Subtype

`embodies_spirit_of` — new edge type, `place_spirit` → `location`. Properties: `{ awakenedAtTick: number, awakenedByActorId: string }`. One-to-one (a place_spirit embodies exactly one location; a location can have at most one active place_spirit at a time — duplicate-awaken is fail-soft, see §6).

### 5.4 Tick Phase Hooks

No new tick phases. Five existing phases gain new reads:

| Phase | New read | Behaviour |
|-------|----------|-----------|
| `phaseProsperity` | `divinePresence`, `populationHealth`, `routesCursedUntilTick`, `wellsSickenedUntilTick` | Health < 50 dampens prosperity by `LOC_HEALTH_PROSPERITY_DAMPENER`; presence > 0 contributes `LOC_PRESENCE_PROSPERITY_BONUS`; cursed routes contribute 0; sickened settlements lose prosperity faster |
| `phaseUnrest` | `populationHealth` | Health < 50 increments unrest by `LOC_HEALTH_UNREST_BLEED` per tick |
| `phaseSettlementPromotion` | `wellsSickenedUntilTick`, `populationHealth` | Promotion checks suppressed while sickened or health < threshold |
| `phaseAgents` / Maslow | (no change for v1; place_spirit uses existing actor decision) | — |
| `phaseDecay` / property decay | `divinePresence`, `populationHealth` | Tick-rate decay toward defaults |

### 5.5 Resolution Path

All six verbs use the standard unified-action resolution path: `unifiedActionExecutor` → step resolution → `graphOpExecutor`. No bespoke executors. The handful of new operations (encounter seeding, edge insertion for `trades_with`, node insertion for `place_spirit`) all use existing `GraphOp` variants (`add_node`, `add_edge`, `update_node`, `encounter_seed`).

### 5.6 Constants Table (NFP #1)

Every magic number is a named constant in `src/data/constants/locationActionConstants.ts` (new file). All tunable.

| Constant | Default | Purpose |
|----------|---------|---------|
| `LOC_BLESS_HARVEST_PROSPERITY_DELTA` | 12 | Prosperity gain on success |
| `LOC_BLESS_HARVEST_HEALTH_DELTA` | 15 | Population health gain on success |
| `LOC_BLESS_HARVEST_DURATION_TICKS` | 8 | Migration-pull window |
| `LOC_OPEN_MARKETS_PROSPERITY_DELTA` | 6 | Prosperity gain on success |
| `LOC_OPEN_MARKETS_UNREST_DELTA` | -10 | Unrest reduction on success |
| `LOC_OPEN_MARKETS_THIEVES_GUILD_THRESHOLD` | 75 | Unrest threshold above which thieves' guild encounter seed fires |
| `LOC_OPEN_MARKETS_THIEVES_DELAY_TICKS` | 8 | Delay before thieves' guild encounter eligible |
| `LOC_OPEN_MARKETS_TRADE_RANGE_HEXES` | 4 | Max hex distance for the auto-spawned `trades_with` partner |
| `LOC_SANCTIFY_MAGSAT_DELTA` | 0.15 | Magical saturation gain |
| `LOC_SANCTIFY_DIVINE_PRESENCE_DELTA` | 0.20 | Divine presence gain |
| `LOC_SANCTIFY_THREAD_DEVOTION_DELTA` | 2 | Thread devotion bonus to threaded agents at this location |
| `LOC_AWAKEN_SPIRIT_PRESENCE_DELTA` | 0.25 | Divine presence gain |
| `LOC_AWAKEN_SPIRIT_DELAY_TICKS` | 6 | Founders-return encounter delay |
| `LOC_SICKEN_WELLS_HEALTH_DELTA` | -25 | Population health loss on success |
| `LOC_SICKEN_WELLS_UNREST_DELTA` | 15 | Unrest gain |
| `LOC_SICKEN_WELLS_DURATION_TICKS` | 10 | Wells-sickened countdown |
| `LOC_SICKEN_WELLS_INVESTIGATION_DELAY_TICKS` | 4 | Plague-investigation encounter delay |
| `LOC_CURSE_ROADS_DURATION_TICKS` | 12 | Routes-cursed countdown |
| `LOC_CURSE_ROADS_UNREST_DELTA` | 10 | Unrest from isolation |
| `LOC_CURSE_ROADS_BANDIT_DELAY_TICKS` | 6 | Bandit-emergence encounter delay |
| `LOC_HEALTH_DEFAULT_BASELINE` | 80 | populationHealth equilibrium |
| `LOC_HEALTH_RECOVERY_RATE` | 1 | Natural per-tick recovery toward baseline |
| `LOC_HEALTH_PROSPERITY_DAMPENER` | 0.7 | Prosperity multiplier when health < 50 |
| `LOC_HEALTH_UNREST_BLEED` | 1 | Per-tick unrest increment when health < 50 |
| `LOC_PRESENCE_DECAY_RATE` | 0.01 | divinePresence decay/tick toward 0 |
| `LOC_PRESENCE_PROSPERITY_BONUS` | 2 | Flat prosperity bonus when presence ≥ 0.5 |

### 5.7 Trace Emission (NFP #2)

Each verb's resolution emits one or more traces through the existing `traceBuffer`. New trace kinds:

```typescript
// src/types/traces.ts — additive
interface TraceLocationActionResolved {
  kind: 'location_action_resolved';
  templateId: string;             // 'loc.bless_harvest' etc.
  actorId: string;                // who cast the verb
  locationId: string;
  success: boolean;
  effectsApplied: string[];       // ['prosperity:+12', 'populationHealth:+15']
  encounterSeedId?: string;       // if a seed was planted
  spawnedActorId?: string;        // if a place_spirit was awakened
  tick: number;
}

interface TraceLocationPropertyDecay {
  kind: 'location_property_decay';
  locationId: string;
  property: 'populationHealth' | 'divinePresence';
  previousValue: number;
  newValue: number;
  reason: 'natural_decay' | 'natural_recovery';
  tick: number;
}

interface TraceLocationCountdownExpired {
  kind: 'location_countdown_expired';
  locationId: string;
  property: 'routesCursedUntilTick' | 'wellsSickenedUntilTick' | 'migrationPullUntilTick';
  setAtTick: number;
  expiredAtTick: number;
}

interface TraceLocationFlagConsumed {
  kind: 'location_flag_consumed';
  locationId: string;
  property: 'routesCursedUntilTick' | 'wellsSickenedUntilTick';
  consumingPhase: 'phaseProsperity' | 'phaseSettlementPromotion';
  effect: string;                  // e.g. 'trade_route_zeroed:edge-id-123'
  tick: number;
}
```

All four traces filterable via DebugPanel Trace tab and TSV export.

### 5.8 PRNG Determinism (NFP #3)

Three randomized decisions:
1. **Open the Markets trade-partner selection** — seeded `pickRandom` over eligible nearest settlements within range, salt: `'loc.open_markets:' + locationId + ':' + currentTick`.
2. **Awaken the Spirit name generation** — seeded selection from culture-name templates, salt: `'loc.awaken_spirit:' + locationId`.
3. **Trait roll for place_spirit** — seeded biome-trait pick, salt: `'loc.awaken_spirit:traits:' + locationId`.

All other effects are deterministic (constant deltas, threshold-based seed firing). Same seed + same world + same action = same outcome.

## §6 — Fail-Soft Table (NFP #4)

| Failure Case | Fallback Behaviour |
|--------------|---------------------|
| Target location node missing or wrong subtype | Action validation fails *before* essence is debited; UI shows "invalid target" toast |
| `populationHealth` field absent on legacy locations | Treated as `LOC_HEALTH_DEFAULT_BASELINE` (80); `update_node` sets the field |
| `divinePresence` field absent | Treated as 0; `update_node` sets the field |
| `routesCursedUntilTick > currentTick` but no `trades_with` edges to read | No-op; trace `location_flag_consumed` with `effect: 'no_trade_routes_to_zero'` |
| `loc.awaken_spirit` on a location that already has a `place_spirit` (duplicate awaken) | Action *succeeds at resolution time*; existing spirit refreshed (`awakenedAtTick` updated, `divinePresence` boosted); no second spirit spawned. Player gets a prose acknowledgement variant. |
| `encounter_seed` template missing | Existing seed system handles — emits "withered" narrative event, no crash |
| `trades_with` edge spawn failure (no eligible partner in range) | No-op; trace logs "no_partner_in_range"; verb still grants prosperity/unrest deltas |
| Negative clamping (e.g., `populationHealth` would go below 0) | Clamps at 0; trace logs `clamped_to_floor: 'populationHealth'` |
| Place_spirit dies (killed in combat, etc.) | `embodies_spirit_of` edge auto-removed by graph integrity pass; location keeps its `divinePresence` value |

## §7 — Wiring Section (per `Docs/plans/wiring-checklist.md`)

| Surface | Hook | Status |
|---------|------|--------|
| Orchestrator | No new phases. Five existing phases gain new reads (§5.4) | New |
| ActionDrawer | Verbs surface automatically via `targetCategories: ['location']` filter — no new component code | Existing |
| Settlement detail panel | Reads `populationHealth`, `divinePresence` from location-node properties | Existing component; bind new fields |
| HexMapV2 | New optional signifier overlay on locations with `routesCursedUntilTick > currentTick` (thin red rim, see §9) | New |
| GameState | No new top-level fields. All state on location-node properties (graph) | — |
| Traces | Four new trace kinds (§5.7) wired through existing `traceBuffer` | New |
| DebugPanel | Existing Actions tab lists templates; existing Trace tab filters new traces; **new** Location-Inspector mini-tab shows `populationHealth/divinePresence/wellsSickenedUntilTick/routesCursedUntilTick` for the selected location | One new tab |
| Player controls | Action drawer at any settlement now displays 10 verbs (4 existing + 6 new). Click → step resolution → resolve. | Existing |
| ChroniclePanel | Reads `narrative_event` entries (already wired). New verbs produce `narrative_event` on success. | Existing |
| Toast / alert | Verb resolution emits the standard `unified_action_resolve` event; existing toast layer picks it up | Existing |
| Codex | New entries auto-populated from template metadata via existing `?view=codex` route | Existing |
| Style guide | Verb cards display via existing ActionCard primitive | Existing |

## §8 — Content Pillar

### 8.1 Prose Authoring Constraints

All six verbs ship with prose meeting the Threadbearer voice (per `Docs/canon/prose.md`):

- Second-person-implicit framing — "you, the god" is the unstated subject; the actor's name is invoked through `{name}`.
- Concrete sensory anchors (loam, husk, dust, well-water, foundation stone).
- Consequence implied, not stated as mechanics. "By the third morning, children will not drink" — *not* "populationHealth: −25 applied".
- Gendered pronouns via `{they}/{their}` placeholders so the prose is character-stable.
- Conditional blocks for `{?has_faction}`, `{?has_ally}` where they add story weight (Open Markets, Sanctify Square).

### 8.2 Enrichment Placeholders Used

Per the systemic wiring guide Capability 1:

| Placeholder | Verbs using |
|-------------|-------------|
| `{name}` | All six |
| `{they}/{their}` | All six |
| `{?has_faction}/{/has_faction}` | Open the Markets |
| `{?has_ally}{ally:strongest}{/has_ally}` | Sanctify the Square |

### 8.3 Future Prose Expansion (out of scope, noted)

Each verb ships with one prose variant per step (initiation/success/failure). Future content sweeps can add:
- Stance-conditional success variants (depends on THR-402 shipping)
- Sphere-of-Affinity-mismatch variants (e.g., what does Bless the Harvest read like for a Chaos-aligned ascendant?)
- Failure-with-witness variants (when the action failed in front of a high-Eye agent)

Tracked in §13.

## §9 — UI Pillar

### 9.1 ActionDrawer

No code changes. The new templates inherit the existing ActionDrawer rendering. Six new cards appear when the player focuses a settlement-subtype location. Total drawer count for settlements: 10 location cards plus any agent/hex cards in context.

### 9.2 Action Card Visual

Use existing ActionCard primitive. Three tier-2 verbs (Sanctify, Sicken, Curse) display the existing storied-tier border treatment. The tier-3 Awaken Spirit verb displays the existing mythic-tier border treatment.

### 9.3 Settlement Detail Panel — Read Bindings

Existing `SettlementDetailPanel.tsx` displays prosperity/unrest. Add two new read bindings:

- `populationHealth` → display as a 5-tier readout (Thriving / Well / Steady / Failing / Wasting) using thresholds at 90 / 70 / 50 / 30. Tier text in the existing readout style; no new design tokens.
- `divinePresence` → display only when value ≥ 0.1. Text: "Touched by the divine" at 0.1–0.4, "A presence here" at 0.4–0.7, "Sacred ground" at ≥ 0.7. No numerical surface.

### 9.4 Countdown Surfacing — Settlement Detail Panel

Time-bounded properties (`wellsSickenedUntilTick`, `routesCursedUntilTick`) surface as narrative phrases, not raw tick counts:

- `wellsSickenedUntilTick` active → "The wells run wrong" (no countdown shown).
- `routesCursedUntilTick` active → "Roads here are not to be trusted" (no countdown shown).

NFP #5: narrative over mechanical perfection. The player does not need to see "8 ticks remaining". They need to feel that *the place is wrong right now*.

### 9.5 HexMapV2 Signifier — Cursed Roads

When any location on a hex has `routesCursedUntilTick > currentTick`, the hex receives a thin red outline overlay on the hex rim (existing `signifierLayer` API; new signifier registered with id `cursed_roads`). Tooltips on hover already exist; no new tooltip component.

No new signifier for sickened wells or low population health — those are settlement-detail-only beats. Curse-the-roads gets a hex signifier because its effect is spatial (it kills trade *across* the hex network) and the player needs the map-level read.

### 9.6 ChroniclePanel

The four new traces (§5.7) need ChroniclePanel translation. Three are mechanical and stay out of the chronicle (only DebugPanel sees them). The `location_action_resolved` trace already feeds the existing chronicle pipeline via `narrative_event`.

### 9.7 DebugPanel — Location Inspector Mini-Tab

New mini-tab in the existing Inspector tab: "Location". Selected via the existing location-focus state. Renders:
- All location-node properties (existing readout, extended)
- Active countdowns with raw tick math (for debug purposes)
- Last 5 traces filtered to `locationId === selectedLocationId`
- Manual "fire action on this location" dropdown wired to `window.__DEBUG.fireAction()`

### 9.8 `window.__DEBUG` Extension

```typescript
// src/debug-bridge.ts — additive
window.__DEBUG.inspectLocation(idOrName: string): LocationProperties | null
window.__DEBUG.forceLocationCountdownExpire(idOrName: string, property: 'routesCursedUntilTick' | 'wellsSickenedUntilTick'): boolean
```

For browser-verify and CLI smoke.

### 9.9 Browser-Verify Plan (Definition of Done)

Per CLAUDE.md §Browser-verify UI changes:
- Screenshot 1: action drawer on a settlement at 1920×1080, showing 10 verbs (4 existing + 6 new).
- Screenshot 2: settlement detail panel with `populationHealth` readout visible (e.g., "Failing") and `divinePresence` text visible (e.g., "Touched by the divine").
- Screenshot 3: HexMapV2 with the cursed-roads signifier visible on a tested hex.
- Console output: `mcp__playwright__browser_console_messages` filtered to errors+warnings, pasted as fenced block.
- `__DEBUG` assertions:
  - `window.__DEBUG.inspectLocation('Thornhaven')` returns `{ populationHealth: 95, divinePresence: 0.2, ... }`
  - `window.__DEBUG.fireAction('Thornhaven', 'loc.bless_harvest')` returns `{ success: true, templateName: 'Bless the Harvest' }`
  - After firing Curse the Roads: `inspectLocation` returns `routesCursedUntilTick: 24` (or current+12)

## §10 — NFP Compliance Table

| NFP | Status | Note |
|-----|--------|------|
| 1. Tunability | PASS | 26 named constants in `locationActionConstants.ts` |
| 2. Inspectability | PASS | 4 new trace kinds; DebugPanel Location-Inspector tab; `__DEBUG.inspectLocation` |
| 3. Determinism | PASS | All three RNG calls salted with templateId + locationId + tick |
| 4. Fail-soft | PASS | 9-row fallback table in §6 |
| 5. Narrative over mechanical perfection | PASS | All countdowns surface as narrative phrases, not tick counts; no numerical pop-health exposed |
| 6. Additive over destructive | PASS | All schema additions optional; no existing fields renamed or removed |
| 7. Performance budget | PASS with note | New properties read per-tick per-location in 5 phases. Per-tick cost ≈ O(locations) × 5 constant-time reads. Negligible. |

## §11 — Blast Radius (Codesight)

Files touched (estimated importer counts via codesight static analysis):

| File | Importer count | Cascade risk |
|------|----------------|--------------|
| `src/data/unified-action-templates.ts` | ~40 | Append-only; no symbol renames. New templates picked up by every consumer automatically. |
| `src/types/graph.ts` | 370 | Adding 5 optional properties to `LocationNodeProperties` and 1 actor subtype to `ActorSubtype` and 1 edge type to `EdgeKind`. **Optional fields and union additions are widening operations; should not break any existing reader.** Watch for exhaustive switch statements on `EdgeKind` / `ActorSubtype` — at least these locations are known to switch exhaustively: `graphOpExecutor.ts`, `edgeRegistry.ts`. Lint will flag missing branches if present. |
| `src/types/traces.ts` | ~106 | Add 4 trace kinds to the union. Exhaustive switches in `traceBuffer.ts` and DebugPanel trace renderer must add cases. |
| `src/engine/phaseProsperity.ts` | ~5 | New reads only; output type unchanged |
| `src/engine/phaseUnrest.ts` | ~3 | New read only |
| `src/engine/phaseSettlementPromotion.ts` | ~3 | New read only |
| `src/engine/graphOpExecutor.ts` | ~30 | No new GraphOp variants. Sanity-check existing variants handle new property names. |
| `src/components/SettlementDetailPanel.tsx` | ~6 | New read bindings + 5-tier readout |
| `src/components/hex/HexMapV2Layers.tsx` (or signifier layer file) | ~4 | New signifier `cursed_roads` |
| `src/debug-bridge.ts` | ~3 | 2 new methods |
| `src/data/constants/locationActionConstants.ts` | (new) | New file |

**Cascade risk summary:** Two high-impact files (`graph.ts`, `traces.ts`). Both touched additively — new optional fields and new union members only. The traces-union addition will trip exhaustive switches in the DebugPanel trace renderer; flagged for CC.

## §12 — Definition of Done

- [ ] 6 new templates in `src/data/unified-action-templates.ts` matching §2 verb sheets exactly
- [ ] 26 constants in `src/data/constants/locationActionConstants.ts` matching §5.6
- [ ] 5 optional properties added to `LocationNodeProperties` in `src/types/graph.ts`
- [ ] `place_spirit` actor subtype + `embodies_spirit_of` edge type added
- [ ] 4 new trace kinds added to `src/types/traces.ts`; DebugPanel trace renderer updated
- [ ] 5 existing phases gain new reads per §5.4
- [ ] SettlementDetailPanel reads `populationHealth` (5-tier text) and `divinePresence` (3-tier text)
- [ ] HexMapV2 `cursed_roads` signifier registered and rendering
- [ ] `__DEBUG.inspectLocation` and `__DEBUG.forceLocationCountdownExpire` exported
- [ ] Per-template effect tests for all 6 verbs (success, failure, fail-soft cases from §6)
- [ ] Integration test: Bless the Harvest → Sicken the Wells → recovery via natural decay
- [ ] Integration test: Curse the Roads zeroes `trades_with` prosperity contribution
- [ ] `npm test` green
- [ ] `npx tsc --noEmit` clean
- [ ] `npx vite build` succeeds
- [ ] Engine smoke: 30-tick CLI run with seed 42 medium map reaches tick 30 with non-zero agents
- [ ] Browser-verify: 3 screenshots + console + `__DEBUG` assertions per §9.9 attached to closing comment
- [ ] `Fixes THR-401` in closing commit body

## §13 — Phasing & Deferrals

**Phase 1 (this issue):** All six verbs, all schema, all UI bindings, browser-verify.

**Deferred to future tickets** (tracked here, file when relevant):

1. **Stance-conditional prose variants** — wait for THR-402 (Agent Feedback System) to ship; then sweep `success` variants per stance for at least Sanctify, Sicken, Awaken.
2. **Sphere-mismatch prose variants** — Chaos-ascendant Bless the Harvest reads differently from Order-ascendant. File after Vision audit on cross-sphere narrative honesty.
3. **The full "Founder Identity" upgrade to Awaken Spirit** — if the spirit verb plays thin, file content-architecture pass for a `founder` node type per-settlement that the verb anchors to.
4. **Re-found the City (tier-4 Legendary verb)** — for end-game divine intervention; not in scope.
5. **Migration phase consumer for `migrationPullUntilTick`** — v1 sets the property; downstream migration system reads it. File when migration system enters design.

## §14 — Vision Audit

Cross-referenced against `Vision/00-north-star`, `Vision/01-core-loop`, `Vision/02-non-negotiables`, `Vision/03-design-tensions`, `Vision/taste-profile` (via the project working copy; Obsidian MCP not invoked this session).

| Vision principle | Verdict |
|------------------|---------|
| Player is a god, not a protagonist | ✓ All six verbs are indirect — the god acts on the *place*, the people respond |
| Weight of threads | ✓ Sanctify the Square increments thread devotion at the location; reinforces THR-402 |
| Cool failure | ✓ Each verb's failure prose is *texture*, not a dead end. The well that fails to be sickened doesn't taste any different; the dust on the road settles. |
| One complex story vs. portfolio breadth | ✓ Encounter seeds (thieves' guild, plague investigation, bandit emergence, founders return) produce future story moments — but a player playing fast can ignore them. The verb itself is also satisfying as a one-shot. |
| Sovereignty (mortals exercise it) | ✓ Sicken the Wells produces an investigation encounter for the *settlement's* highest-Eye-capability agent — the mortals investigate the god's cruelty. The god does not retain narrative control. |
| Prose carries narrative, UI carries status | ✓ Countdowns surface as narrative phrases. The settlement detail panel shows "Failing" not "47/100 health". |
| Content is design | ✓ Every verb has authored prose with three step variants. No mechanical surface without a story. |

No Vision edit required.

## §15 — Brainstorm Companion (decisions considered & rejected)

### Alternative 1: Eight verbs instead of six

Considered. Would have added a "Burn the Records" (delete location history) and a "Found a Cathedral" (spawn new sublocation). Rejected for v1 because:
- Burn the Records implies a history-record system the location node doesn't currently expose.
- Found a Cathedral overlaps with `loc.place_of_power` enough to risk redundancy.

Both retained as future-verb candidates if location verb count needs to grow again.

### Alternative 2: Implementing Curse the Roads as edge-mutation

Considered. Rejected per Resolution 3 (§1) — would require a new `set_edge_property` GraphOp variant and an edge-iteration pass in `phaseProsperity`. The countdown-property approach uses existing infrastructure and is fail-soft by default (property expires automatically).

### Alternative 3: Place_spirit as a non-actor entity

Considered modeling place_spirit as a unique node category (not actor) to make its "this is the soul of a place" framing crisper. Rejected per the graph-architecture decision in CLAUDE.md: "Ascendants use the same systems as agents." A place_spirit is conceptually similar — a former-something-now-a-spirit. The actor pipeline already supports the behaviour we need (Maslow decisions, awareness, encounter participation). Inventing a non-actor entity would have required N pipeline duplications.

### Alternative 4: Splitting Sanctify the Square into "Sanctify" (mood) + "Consecrate" (mystical)

Considered. Rejected because `loc.place_of_power` already does the mystical-substrate work. Sanctify the Square's job is the *social-religious* layer — gatherings, devotion, the thread-devotion boost. One verb, one job. The split would have produced two thinner verbs.

### Tensions surfaced

- **Symmetric vs. asymmetric pairing.** Bless/Sicken are nearly symmetric (one buffs health, one debuffs it); Markets/Curse-Roads are *not* symmetric (one creates a trade edge, the other zeros out trade contributions). The asymmetry was deliberate — symmetric pairs read as system, asymmetric pairs read as *story* (it's harder to fix a curse than it is to cast one). Sanctify/Incite-Unrest is also asymmetric, in the existing verb set.
- **Place_spirit as a permanent population.** A place_spirit doesn't die of natural causes. Over a long game, this could accumulate. If playtest shows >5 place_spirits in a single playthrough degrades performance or narrative clarity, file a "spirits go dormant after N ticks of low divine attention" follow-up.
- **Sicken the Wells as a *thread-friendly* cruelty.** The reversible-disease framing was chosen because a god who genuinely wants to harm a settlement *also* wants the settlement to remember they did it. A wasteland forgets you. A scarred village does not.

## §16 — Coordination Block (for handoff comment)

- **Suggested model:** `model:opus-4-6` — prose-heavy authoring for six verbs at Threadbearer voice quality, plus six new constant tables and 5-tier text rendering. The trace + DebugPanel + phase-read wiring is mechanically modest; the prose authoring is the load.
- **Parallel-safe with:** anything not touching `src/data/unified-action-templates.ts`, `src/types/graph.ts`, or `src/types/traces.ts`. Specifically safe with `THR-409` (worktree cleanup), `THR-405` (rulebook cadence — docs only), `THR-412` (intent-judge calibration — eval set only).
- **Mutex with:** `THR-397`, `THR-398`, `THR-399`, `THR-400` — all touch `unified-action-templates.ts`. Per THR-401 issue body, order: after THR-397/398/400 land on main. THR-399 can interleave if its templates are written into a different file region (advise sequential to avoid merge conflicts in the template file).
- **Codex review:** yes — the schema touches `graph.ts` (370 importers) and `traces.ts` (106 importers). Codex review surface checks for exhaustive-switch regressions.

## §17 — Files to Touch

- `src/data/unified-action-templates.ts` — append 6 templates
- `src/data/constants/locationActionConstants.ts` — new file
- `src/types/graph.ts` — 5 optional properties on `LocationNodeProperties`; `place_spirit` actor subtype; `embodies_spirit_of` edge kind
- `src/types/traces.ts` — 4 new trace kinds
- `src/engine/phaseProsperity.ts` — new reads
- `src/engine/phaseUnrest.ts` — new read
- `src/engine/phaseSettlementPromotion.ts` — new read
- `src/engine/phases/index.ts` — register a `phaseLocationPropertyDecay` if natural decay isn't already in an existing decay phase
- `src/components/SettlementDetailPanel.tsx` (or current settlement panel file) — read bindings
- `src/components/hex/HexMapV2Layers.tsx` (or signifier registry file) — `cursed_roads` signifier
- `src/components/DebugPanel/InspectorTab.tsx` (or location inspector file) — Location mini-tab
- `src/debug-bridge.ts` — `inspectLocation`, `forceLocationCountdownExpire`
- `src/engine/__tests__/locationActions.test.ts` — new file, 6 verbs × success/failure + integration tests
- `src/styles/` — may need a 5-tier health readout token if the existing prosperity readout doesn't have one (check before adding)

## §18 — References

- Audit parent: [THR-390](https://linear.app/threadbare/issue/THR-390) — Action System Curation & Unlock Roadmap
- Sibling verbs (Ready for Dev): [THR-397](https://linear.app/threadbare/issue/THR-397) (Rarity recurve), [THR-398](https://linear.app/threadbare/issue/THR-398) (Survey collapse), [THR-400](https://linear.app/threadbare/issue/THR-400) (Faction actions)
- Sibling verb (In Design): [THR-399](https://linear.app/threadbare/issue/THR-399) (Self-actions)
- Systemic wiring guide: `Docs/plans/2026-04-16-systemic-wiring-guide.md` — Capability 1 (Enrichment), Capability 2 (Encounter Seeding), Capability 6 (Graph ops)
- Threadbearer voice reference: `Docs/canon/prose.md`
- Cosmology reference: `Docs/canon/cosmology.md` (Reach × Sphere axes)
- Existing location templates: `src/data/unified-action-templates.ts` lines 1053–1180

---

*Authored by Cowork (scheduled keep-work-flowing task), 2026-05-12.*
