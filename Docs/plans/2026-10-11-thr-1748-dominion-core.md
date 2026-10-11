> **title:** `Dominion core — one graded read of how much a world object is the god's, and the consumers that make home turf cheaper, surer and paying — THR-1748`
> **linear_issue:** THR-1748
> **author:** `Claude Code (design lane, unattended run 2026-10-11d)`
> **created:** 2026-10-11
> **three_pillars:** Engine `done — one pure read module, one writer phase, five consumers re-keyed, two existing writers re-aimed; no new node, edge or tick-loop subsystem` · Content `done — band words and lines as data, Claim / Shift / Bestow / Anoint card text, three chronicle line families` · UI `done — debug bridge + DebugPanel readout and chronicle lines only; the map overlay, sheet box and card chip are THR-1750`

# Dominion core — THR-1748

*Christian ruled that the player's power loop is Dominion: ground that is the god's is cheaper and surer to work, threads and powers spread it, and the opposing dominion pushes back. Nine decision tickets settled every number. This plan builds the read and wires it into the five places the game already prices, rolls and pays.*

## Why this is load-bearing

Christian's ruling on [Player power progression over a run](https://linear.app/threadbare/issue/THR-1745) (chat, 2026-10-05), recorded on the [Dominion map](https://linear.app/threadbare/issue/THR-1758): *same-dominion objects are cheaper and more powerful to influence; threads spread dominion through secondary actors; powers make those actors fight the opposing dominion; spending through a sphere builds infrastructure that pays back. Graded. Opposition per the cosmology.*

Today none of that exists. The resolution `sphereFactor` is hard-coded 0, a card costs the same everywhere, a thread yields a flat 0.1 whoever it binds, Claim Dominion writes a hex number nothing reads, Shift Dominion boosts a key that is not a sphere, and rival pressure aims at an id that is not a graph node, so it has never landed. The god's economy has no reason to care *where* it acts.

Three other plan docs wait on this one (the map's carve-up, Christian's closing comment 2026-10-11): [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750) renders the band this plan computes; [God cards carry their progression as data](https://linear.app/threadbare/issue/THR-1811) opens its rungs on the attunement marks this plan writes; [The world remembers](https://linear.app/threadbare/issue/THR-1813) seeds Monuments that read the band. The band is the one read every consumer uses (2026-10-05 ruling), so it is built once, here.

## Settled inputs

Every design decision this plan builds on was taken on the map and is past its veto window. None is re-opened here; each is cited inline where it is used.

| Ticket | Who decided, when | What it settled |
|---|---|---|
| [Player power progression](https://linear.app/threadbare/issue/THR-1745) | Christian, chat, 2026-10-05 | the Dominion loop; band words Hostile · Foreign · Touched · Held · Sovereign; Creation spheres only at the buy |
| [Divine economy shared prerequisites](https://linear.app/threadbare/issue/THR-1747) | shipped 2026-10-08 | thread upkeep 0 / 0.1 / 0.2 / 0.35 / 0.5; source upkeep 0.15; the Held Ground milestone grants Claim Dominion |
| [Buy your spheres](https://linear.app/threadbare/issue/THR-1749) | shipped 2026-10-09 | `spherePoints` on the god, read through `getSpherePoints` |
| [Sphere score seeding](https://linear.app/threadbare/issue/THR-1768) | shipped 2026-10-08 | the god's scores seed primary 2 / secondary 1; every place, mortal and culture is seeded |
| [The god's seat](https://linear.app/threadbare/issue/THR-1792) | shipped 2026-10-10 | `homeSeatLocationId` on the ascendant |
| [Who writes sphere scores](https://linear.app/threadbare/issue/THR-1759) | research, 2026-10-06 | the writer table; rival probe drops; factions blank at tick 0 |
| [The formula settled](https://linear.app/threadbare/issue/THR-1760) | design lane, 2026-10-09 | match, power, opposition weight, band cuts |
| [What the band buys](https://linear.app/threadbare/issue/THR-1761) | design lane, 2026-10-09 | the band table (cost, odds, yield, income); magnitude stays on power |
| [How the frontier moves](https://linear.app/threadbare/issue/THR-1762) | design lane, 2026-10-09 | Claim, Shift, seat, thread carry, other holds |
| [The opposing dominion](https://linear.app/threadbare/issue/THR-1763) | design lane, 2026-10-09 | neglect, raids, seat floor, tending absorbs a raid |
| [Secondary actors](https://linear.app/threadbare/issue/THR-1764) | design lane, 2026-10-10 | faction / army / company / artifact reads; bestow and anoint as carriers |
| [The god's own power](https://linear.app/threadbare/issue/THR-1765) | design lane, 2026-10-10 | attunement ladder; power over bought spheres; cap 2.0 |
| [What the player sees](https://linear.app/threadbare/issue/THR-1766) | attended, 2026-10-11 | the five band lines (used here as data) |

The youngest lane decision (THR-1765) closed 2026-10-10 12:31Z, more than 24 h before this plan started. The calls this plan adds are under § Decided by delegation and carry their own veto window at handoff.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Spheres & Quintessence | 🟠 DORMANT on the god, 🟢 on places and actors | **activates** — the god's scores become live inputs to price, odds and yield |
| Essence & Divine Economy | 🟢 ACTIVE | **extends** — thread yield by tier and band, source income by host band |
| Strategic Projects & Control | 🟢 ACTIVE | **extends** — Claim re-targeted to places and re-keyed; other holds slowed |
| Rival Gods & Schemes | 🟢 ACTIVE | **extends** — rival spheres from the god's opposites; probe re-aimed at real places |
| Action resolution (`unifiedActionResolution`, `resolutionService`) | 🟢 ACTIVE | **extends** — `sphereFactor` reads the target's band |
| Target action slots (card cost) | 🟢 ACTIVE | **extends** — band multiplier before the flat sphere discounts |
| Sphere pressure (`phaseSpherePressure`) | 🟢 ACTIVE | **extends** — new sources `claim`, `seat`, `carry`, `attunement`, `neglect`; explicit tending check |
| Sphere aggregation (`phaseSphereAggregation`) | 🟢 ACTIVE | **extends** — unrounded mean for the dominion read; runs once at init |
| Essence earned + attunement marks | 🟢 ACTIVE | **extends** — a second, run-long mark table writes sphere progress |
| Mandate sphere pressure | 🟢 ACTIVE | **preserves** — unchanged writer of the god's power |

Population consumed (seeds 42 / 99 / 7, medium, measured on the map): 235–246 top-level places, 509–1,037 mortals, 52–82 factions, 185–709 artifacts, 5 armies at tick 0 (THR-1760, THR-1764 censuses).

## Measured substrate

Grep/Read over `origin/main` @ `bec046a8`, 2026-10-11. Several audit facts moved since the map measured them; this table is the current truth.

| Claim | Evidence |
|---|---|
| God-card cost has **one** computation, shared by the preview and the charge, and applies **no** sphere discount | `tierScaledEssenceCost` (`src/engine/targetTierScaling.ts:101`), called from `getTargetActionSlots` (`src/engine/targetActions.ts:464`) and `playerCastDispatch.ts:125`. The sphere gate at `targetActions.ts:449-455` locks, it does not price |
| The flat `SPHERE_DISCOUNT` (1, floor `SPHERE_DISCOUNT_MIN_COST` 1) lives on **nudge** cards only | `effectiveNudgeCost`, `src/engine/encounters/nudges.ts:141-149`; `src/data/nudge-constants.ts:148, 155`. The nudge hand is on the map's Out of scope ("the dice … the nudge hand. Untouched") |
| The player cast's `sphereFactor` is a literal 0 | `src/engine/unifiedActionResolution.ts:439` `const sphereFactor = 0;`. Ten other sites also pass 0 (contestation, encounter scoring, decision board, opposed rolls, planner forecast, stage adapters); they are agent / dice paths and stay 0 |
| Resolution adds `sphereFactor` outside the gain | `computeResolutionThreshold`, `src/engine/resolutionService.ts:125` (THR-1761 measured); range comment `src/types/resolution.ts:25` says 0.0–0.2 |
| Thread yield is flat | `totalRate += threadEdges.length * ESSENCE_PER_THREAD` (`src/engine/influence.ts:109`); `ESSENCE_PER_THREAD = 0.1` (`src/data/influence-content.ts:18`); upkeep `TIER_MAINTENANCE` 0 / 0.1 / 0.2 / 0.35 / 0.5 (`:77`); `essenceIncome.ts` mirrors it for the readout |
| Source income has no band or Held gate | `computeSourceIncome`, `src/engine/essenceSources.ts:84` (skips the seat at `:96`, zero yield at `:103`); called from `influence.ts:153`, `essenceIncome.ts:98` |
| Point-buy shipped | `getSpherePoints` (`src/engine/spherePoints.ts:89`); `createAscendant` writes `spherePoints` (`src/engine/ascendant.ts:121-170`) |
| The god's scores are seeded right after creation | `backfillSphereAffinity(graph, tiles, 0)` at `src/engine/gameInit.ts:323`, after `createAscendant` at `:310`; seeds primary 2 / secondary 1 from `sphereAlignment` (`sphereAffinity.ts:270`) |
| No opposition pair-strength table exists in code | `SPHERE_OPPOSITES` (`src/engine/cosmology.ts:62`) is a plain pairing; the strengths 5/5, 4/5, 3/5, 2/5, 2/5 are a comment at `:60-61`. `oppositionStrength` in `types/rival.ts:18` is a per-rival random, unrelated |
| Hold pressure is 1 a tick | `CONTROL_PRESSURE_PER_TICK = 1` (`src/types/sphereAffinity.ts:61`), pushed at `phaseControlEffects.ts:421` |
| The rival probe pushes at the rival's own id | `rivalProbeMove`, `src/engine/orchestrator.ts:1971`, `targetEntityId: rival.id` (`:2006-2008`); `RIVAL_PRESSURE_MAGNITUDE = 2` (`types/sphereAffinity.ts:67`) |
| Faction aggregate rounds and is blank at tick 0 | `Math.round(sum / members.length)` (`sphereAffinity.ts:498`); `phaseSphereAggregation` (`phaseSphereAggregation.ts:189`) runs at tick time only (`orchestrator.ts:3780`); init calls only the global `computeSphereAggregate` (`gameInit.ts:330`) |
| Claim and Shift target hexes and write nothing a sphere reads | `hex.claim_dominion` (`unified-action-templates.ts:4326`): cost 5, per-tick `{ spirit: 0.3 }`, writes `divineInfluence` 0.02 (`:4350-4351`). `hex.shift_dominion` (`:3639`): cost 4, adds `SHIFT_DOMINION_BOOST` 0.15 to `sphereInfluence['resonance']` (`hexActionBridge.ts:43-44, 385-403`) |
| Essence earned is counted per sphere; card marks are [20, 60] | `GameState.essenceEarnedBySphere` (`types/gameState.ts:249`), written by `applyEssenceEarned` (`essenceEarned.ts:136`); `SPHERE_ATTUNEMENT_THRESHOLDS = [20, 60]` (`nudge-constants.ts:521`) |
| Mandate grows the god through pressure events | `phaseMandate.ts:325, 454` (`MANDATE_PRESSURE_MILESTONE` 2), `:354, 446` (`_COMPLETION` 5), all at `state.ascendantId` |
| The seat exists | `homeSeatLocationId` on the ascendant, set at `influence.ts:427`; read by income at `influence.ts:114` |
| `spherePowerMultiplier` reads the raw score | `src/engine/sphereScaling.ts:25`; callers `encounterAftermath.ts:3821, 3936` (signatures) |
| Nothing named Dominion exists in code | only `SHIFT_DOMINION_*` (`hexActionBridge.ts:43-44`) and `dominionOfStone` (mandate id); no `getDominion` in `src/debug-bridge.d.ts` |

## Decided by delegation (design lane, 2026-10-11 — veto in chat)

The map left these seams to "the core plan doc". Each is decided here; none changes what the game means.

1. **One read module, one writer phase.** `src/engine/dominion.ts` owns the match, the power factor, the band and the carrier test, as pure functions. A new phase, `phaseDominion`, owns the per-tick tending writers (Claim, seat, thread carry) and neglect. Consumers import the band reader only; nothing outside `dominion.ts` reads the match number. *Why:* the map decided "the band is the one read" (THR-1745 gate comment); one module is how that stays true in code.
2. **One carrier test.** `isTended(graph, ascendantId, placeId, tick)` answers "is this place carried this tick" for neglect (THR-1763), the raid absorption rule (THR-1763), and the anointed-faction rule (THR-1764). A place is tended when it has an active Claim, is the seat, holds a threaded mortal standing there (sublocations resolve to their place), or is a Touched-or-better place `controls`-held by an anointed faction. *Why:* THR-1763 found tending working only through a rounding accident; three separate checks would repeat it.
3. **Tending absorbs a raid as a rule, not by rounding.** A pressure event with `source: 'rival'` on a tended place is reduced by `DOMINION_TENDED_RAID_ABSORB` (4, one raid burst) before the erosion threshold is computed. *Why:* THR-1763 sub-decision on tending; non-integer doom bursts would otherwise slip through.
4. **No seed for a third bought sphere.** THR-1768's 2 / 1 seed on the two largest buys stays. A third bought sphere holds score 0 at start and still counts fully in the match (power sits outside the sum, THR-1760 sub-decision 1). *Why:* seeding every bought sphere at its points would move the power baseline for spread buys and invalidate every census the map ran. THR-1749 and THR-1765 both left this to this ticket.
5. **Effect magnitude does not read the band.** The ticket description (2026-10-05) put magnitude on the band through `spherePowerMultiplier`; [THR-1761](https://linear.app/threadbare/issue/THR-1761) overruled it ("each channel is read once": band → price, odds, yield, income; power → magnitude). The description's Done-when "lands a larger effect" is met through odds: the same card on Sovereign ground lands its success bands more often. § Done when states the predicate.
6. **The combined economy run is a build gate.** THR-1762, 1763 and 1764 each asked the core to run Claim upkeep, neglect, raids and bestowed / anointed carriers together before the numbers freeze. The executor runs it on `npm run model:power` with the built constants. Trip-wires from the audits: day-90 income below 10.5 a tick → `DOMINION_RAID_PLACES_PER_DAILY_BURST` 10 → 15; above 13.5 → `DOMINION_UNTENDED_DECAY_PER_TICK` 0.01 → 0.015. Anything outside those two levers is a finding on this ticket, not a silent retune.
7. **Hexes are read, never written.** Claim and Shift move from hex targets to place targets (THR-1762). `dominionOf` still answers for a hex (terrain table) so THR-1750's overlay can draw it. No hex node is created (load-bearing decision: no new node types).
8. **The UL entries are corrected in the build PR.** `Docs/ubiquitous-language/Cosmology.md` § Dominion says "weighted by the god's power in each sphere" and § Dominion Band lists "effect magnitude" among consumers; both were overruled on the map (THR-1760, THR-1761). The fix is a definition correction, no term changes, so it rides the build PR under the ubiquitous-language skill's amend flow.
9. **A band drop and a power level each get one chronicle line, coalesced to one a day.** THR-1763 and THR-1765 named the events; the exact words are § Content. No toast, no interrupt (PC-5, Law 49).
10. **The band prices god cards only; there is no flat discount to stack with.** THR-1761 wrote "band first, then the flat sphere discounts" on the belief that god cards carry `SPHERE_DISCOUNT`. Measured today, they do not: the flat discount lives on nudge cards (`nudges.ts:141`), and the nudge hand is on the map's Out of scope. So the god-card price is the band multiplier on the tier-scaled cost, floored at half. The ticket description's "replaces the per-card sphere discount only where the two would stack" has nothing to replace. The half-price floor is kept as a guard for future discounts.
11. **The opposition weights become a table.** THR-1760 called them "already written into `cosmology.ts`"; they exist only as a comment (`cosmology.ts:60-61`). `DOMINION_OPPOSITION_WEIGHT` is a new data table in `dominion-content.ts` with the comment's values; `cosmology.ts` (165 importers) is not edited.
12. **An Unaware thread keeps today's 0.1 yield.** THR-1761's per-tier table names four values (0.15 / 0.30 / 0.45 / 0.60) for the four upkeep-paying tiers; it is silent on tier 0, which pays no upkeep and yields 0.1 today (`influence-content.ts:18`). Tier 0 stays at 0.1 × band, so no thread earns less than it does now on Foreign ground. *Would change the call:* the combined run (§ Decided 6) showing Unaware threads as a farm.
13. **Prices and odds wait for their explanation.** A card that costs less or lands more often on Held ground, with nothing on the card saying why, is the PC-1 complaint the playtests keep filing. So the cost and odds consumers ship behind `DOMINION_PRICES_LIVE`, default `false`; [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750) flips it to `true` in the same PR that ships the card chip (THR-1766's ghost and red pips). Tests run with the flag on. Yield and income stay live here: they surface only through the essence bar's existing income words, which already explain themselves. *Rejected:* an interim band word on the cost line, which THR-1750 would replace within a cycle and which no mock covers.
14. **Neglect covers every untended place**, not only friendly ones: THR-1763's rule is "a place with no carrier". Decay touches only bought-sphere scores above their seeded value, so a place the god never pushed is never touched.
15. **The two card ids keep their `hex.` names** (UL `Cosmology.md` § Dominion: "keep their names"). Only `targetCategories` (hex → location), the per-tick mutation and the Shift effect change. Readers keyed on the id are unchanged: `action-technical-effects.ts:287, 333`, `actionEffectsProse.ts:194`, `ascendant-milestone-beats.ts:164`, `ascendant-beat-content.ts:622`, `actionArt.ts:92, 118`, `sustained-control-status-prose.ts:37`, `codexRegistry.ts:805` (lists `hex.*` in the Codex's hex group, which stays correct by name). `hexActionBridge.ts:385`'s Shift generator is replaced by the place-target break push; the bridge's hex mutations for other cards are untouched.

## Engine pillar

### Systems design

**E1 — `src/engine/dominion.ts` (new, pure).**

```ts
export type DominionBand = 'hostile' | 'foreign' | 'touched' | 'held' | 'sovereign';

/** The god's bought vector, through the THR-1749 accessor (fallback 3/2 from sphereAlignment). */
// match(obj) = Σ_s points[s] × (score_obj[s] − DOMINION_OPPOSITION_WEIGHT[s] × score_obj[opposite(s)]) / Σ_s points[s]
export function dominionMatch(graph, ascendantId, objectId): number;
// power = min(DOMINION_POWER_CAP, Σ_{s bought} godScore[s] / godSeededBoughtSum)
export function dominionPower(graph, ascendantId): number;
// value = match > 0 ? match × power : match   (THR-1760 sub-decision 2: power widens friendly ground only)
export function dominionOf(graph, ascendantId, objectId): { band: DominionBand; reason: DominionReadReason };
export function dominionBandOfHex(graph, ascendantId, hexKey): DominionBand;   // terrain table, read-only
export function isTended(graph, ascendantId, placeId, tick): TendedBy | null;
```

- **The object's scores, by kind** (THR-1764): place, sublocation, mortal, culture → its own `sphereAffinity.scores`; faction → `getFactionSphereScores` with the member mean **unrounded** for this read; army → its faction (`member_of`); company → unrounded mean of members (`member_of`), else its commander (`commanded_by`); artifact → its bearer (`possesses` / `bonded_to`), unborne → `foreign`; hex → `seedHexSphereAffinity(terrain)`.
- **The god's seeded bought sum** is recorded once at ascendant creation as `properties.dominionPowerBaseline` (additive optional field), so power reads 1.0 at start for every buy (THR-1765). Missing → `DOMINION_POWER_BASELINE_FALLBACK` (3).
- `DominionReadReason` carries `match`, `power`, `kind`, `readThrough` (e.g. `'faction-of-army'`) for traces and the debug bridge; it never reaches a player surface.

**E2 — consumers, all reading `dominionOf(...).band`** (THR-1761 table, § Constants):

1. **Card cost**: `dominionScaledEssenceCost(graph, ascendantId, template, targetId)` = `max(1, ceil(base × DOMINION_COST_FLOOR_SHARE), round_half_up(base × DOMINION_COST_MULTIPLIER[band]))` where `base = tierScaledEssenceCost(...)`. Both call sites switch to it, `getTargetActionSlots` (`targetActions.ts:464`, the preview) and `playerCastDispatch.ts:125` (the charge), so the price shown is the price paid (PC-6). A free card stays free. A card with no world target is priced at Foreign (par). Nudge cards are untouched (§ Decided 10).
2. **Cast odds**: at `unifiedActionResolution.ts:439` (inside `resolveUncontestedStep`, which serves **every** source), `sphereFactor` becomes `DOMINION_SPHERE_FACTOR[band of the target]` **only when `action.source === 'player'`**; mortal and agent steps keep 0, so a mortal never rolls on the god's band. `ResolutionInput.sphereFactor`'s documented range widens to −0.10..0.2. The card forecast words (`CARD_READOUT_SPHERE_FACTOR`, `playerCastReadout.ts:59-64`) read the same value, or the words lie (THR-1761).
   **Both 1 and 2 sit behind `DOMINION_PRICES_LIVE`** (default `false` in this build, § Decided 13): when false, cost and odds read par for every band, while the read, the writers, yield and income are live.
3. **Thread yield** in `computeEssenceGeneration` (`influence.ts:109`): `Σ ESSENCE_PER_THREAD_BY_TIER[tier] × DOMINION_THREAD_YIELD_MULTIPLIER[band of the mortal]` over thread edges, replacing `threadEdges.length × ESSENCE_PER_THREAD`. A location thread reads its place.
4. **Source income** in `computeSourceIncome` (`essenceSources.ts:84`): each source's pre-diminishing-returns income × `DOMINION_SOURCE_INCOME_MULTIPLIER[band of the host place]`, so diminishing returns still apply after. No Held gate (0 of 72 hosts read Held at tick 0, THR-1761). The seat's own income term is not band-scaled (it is a distinct term, `essenceSources.ts:96`).
5. **The essence bar's income readout** (`essenceIncome.ts`) applies 3 and 4 identically, so the words and the ledger agree (PC-6).

**E3 — writers of turf** (THR-1762, THR-1764), in `phaseDominion` except where noted:

| Writer | Pushes | Where | Rate |
|---|---|---|---|
| **Claim Dominion** (re-keyed `hex.claim_dominion`) | the god's bought vector, split by points | its target **place** | `DOMINION_CLAIM_PRESSURE_PER_TICK` 0.03 total; upkeep 0.3 a tick from the primary (was spirit) |
| **Shift Dominion** (re-keyed `hex.shift_dominion`, one-shot, at resolution) | the one bought sphere whose opposing pole there weighs most (points × pair weight × opposite score) | its target place | `DOMINION_BREAK_PRESSURE` 6; cost 4 unchanged |
| **The seat** | bought vector by points | `homeSeatLocationId`'s place | `DOMINION_SEAT_PRESSURE_PER_TICK` 0.03, free |
| **Threaded mortals** | bought vector by points | the place they stand in | `DOMINION_THREAD_CARRY_PER_TICK` [0.005, 0.01, 0.015, 0.02] by tier 1–4 (tier 0 carries nothing); one tier higher when bearing a bestowed gift (`DOMINION_BESTOW_CARRY_TIER_STEP` 1, tier 4 stays 0.02); all carriers in one place capped at `DOMINION_CARRY_CAP_PER_PLACE` 0.03 |
| **Other sustained holds** | their `perTickCost` spheres, as today | their target node | `CONTROL_PRESSURE_PER_TICK` 1 → 0.03 |
| **Ordinary casts** | their card's sphere | their target | unchanged (`ACTION_PRESSURE_SUCCESS` 3 / `_FAILURE` 1) |

Fractional pushes accumulate through the existing `progress` triangle-cost path (whole score points when progress fills), so no new storage. The Claim's target type changes from hex to location; an existing hex-target Claim in a saved-in-memory session is released on first tick with a trace (fail-soft).

**E4 — the opposing dominion** (THR-1763):

- **Neglect** (`phaseDominion`): on every top-level place that `isTended` returns null for (§ Decided 14), each bought sphere whose score is above its seeded value loses `DOMINION_UNTENDED_DECAY_PER_TICK` of progress (never below the seeded value; broken opposing poles never regrow). The seeded value is the place's score at world init, stored once as `properties.sphereAffinity.seeded` (additive) when the place is first seeded.
- **Rivals**: a rival's primary sphere is drawn from `SPHERE_OPPOSITES` of the god's bought spheres, weighted by points (`rival.ts`, replacing the bottom-four World-Soul draw). The probe in `orchestrator.ts` targets one of the god's Touched-or-better places (untended weighted `DOMINION_RAID_UNTENDED_WEIGHT` 3 : 1), lands `RIVAL_PRESSURE_MAGNITUDE` 4 (was 2) with `source: 'rival'`, throttled to one landing a day per `DOMINION_RAID_PLACES_PER_DAILY_BURST` (10) such places, all rivals together. `selectSchemeTarget` prefers the god's turf with the same weighting; scheme magnitude unchanged.
- **Tending absorbs a raid** (§ Decided 3), in `resolveSpherePressure`.
- **The seat floor**: after pressure resolves, if the seat's band is below `DOMINION_SEAT_FLOOR_BAND` (Touched), the god's primary score at the seat is raised by the smallest whole step that restores it, traced `dominion.seat_floor`. Expected never to fire at the decided rates (THR-1763: 0 of 1,856 seats lost); the clamp guards future writers.
- **Doom**: unchanged, world-wide.

**E5 — the god's own power** (THR-1765):

- **Attunement**: when essence earned through a **bought** sphere crosses a mark of `DOMINION_ATTUNEMENT_MARKS` [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800], push `ATTUNEMENT_SPHERE_PROGRESS` (1) progress into the god's score in that sphere through the pressure path, `source: 'attunement'`. Uses the existing crossing helper with this table as its parameter; `SPHERE_ATTUNEMENT_THRESHOLDS` [20, 60] keeps granting repertoire cards exactly as today, pinned by test.
- **Mandate**: unchanged writer (+2 / +2 / +5).
- **Power** sums bought spheres only, divided by the recorded baseline, clamped at `DOMINION_POWER_CAP` 2.0 **on the band read only**; `spherePowerMultiplier` (the signatures) keeps reading the raw primary score.
- No decay of the god's scores.
- THR-1811's rungs read the count of attunement marks crossed: expose `getAttunementMarksCrossed(ascendantId, sphere)` as the one accessor.

**E6 — faction aggregation fixes** (THR-1764 findings 1–2): `phaseSphereAggregation` additionally writes `sphereAggregateExact` (unrounded mean); the dominion read uses it; the rounded `sphereAggregate` keeps its readers (`battleAftermath`). Aggregation runs once at the end of world init so tick 0 is not blank.

### Graph nodes / edges

No new node types and no new edge types. Additive optional properties only: ascendant `dominionPowerBaseline: number`; place `sphereAffinity.seeded: Partial<Record<SphereName, number>>`; faction `sphereAggregateExact`. Edges read: `located_at`, `thread`, `member_of`, `commanded_by`, `possesses`, `bonded_to`, `controls`. Checked against `src/types/graph.ts`.

### Tick phases

`phaseDominion` runs **after** `phaseControlEffects` and **before** `phaseSpherePressure`, so its pushes resolve in the same tick as every other writer's. It (a) enqueues Claim, seat and carry pressure, (b) enqueues neglect, (c) records each place's band before resolution. A post-resolution pass in the same phase file (`afterSpherePressure`, called from the orchestrator right after `phaseSpherePressure`) applies the seat floor and diffs bands to emit drop / rise traces and chronicle candidates.

### Resolution logic

Above (E1–E5). The match is a weighted mean on the 0–10 scale; the band cuts are Hostile < −1.5 ≤ Foreign < 0.5 ≤ Touched < 1.5 ≤ Held < 3.0 ≤ Sovereign. Resolution gains only an additive `sphereFactor`: P = 0.40 + 1.25 × (capability − difficulty) + sphereFactor + modifiers, clamped [0.05, 0.95] (THR-1761, `resolutionService.ts`).

### PRNG callouts

- Rival sphere draw (weighted by the god's points): the rival-generation stream already used in `rival.ts`.
- Probe target choice (untended weighted 3 : 1): the orchestrator's rival stream.
- Scheme target preference: `selectSchemeTarget`'s existing stream.
No other new randomness; every read is deterministic. No `Math.random()`.

## Content pillar

### Data tables

`src/data/dominion-content.ts` (new): every constant in § Constants, plus the band words and lines.

| Band | Word | Line (THR-1766, fixed) |
|---|---|---|
| sovereign | Sovereign | Wholly yours. Your works come easiest here. |
| held | Held | Yours, and holding. Cheaper works, richer threads. |
| touched | Touched | Your mark is on it. A little cheaper. |
| foreign | Foreign | Neither yours nor set against you. |
| hostile | Hostile | Turned against you. Your works cost dearly. |

### Card text (re-keyed and extended cards)

| Card | New player text |
|---|---|
| Claim Dominion | "Set your hand on a place and keep it there. While you hold, it grows more yours each day." |
| Shift Dominion | "Break what stands against you in a place, so your hold can take root." |
| Bestow (added clause) | "…They will tend your ground where they stand." |
| Anoint (added clause) | "…Their towns on your ground will hold for you." |

### Chronicle lines (prose tables in `dominion-content.ts`)

| Event | Template | Rendered sample |
|---|---|---|
| Band drop, untended | "{place} has slipped from {from} to {to}. No one tends it." | "Hollowmere has slipped from Held to Touched. No one tends it." |
| Band drop, raid | "{rival}'s hand has pressed on {place}. It is {to} now." | "The Pale Weaver's hand has pressed on Hollowmere. It is Touched now." |
| Several drops, one day | "{n} of your places slipped today: {list}." (≤ 3 names, then "and others") | "2 of your places slipped today: Hollowmere and Fenwick Ford." |
| Band rise to Held / Sovereign | "{place} is {to} now." | "Thornwall is Held now." |
| Power level | "Your hold on the {sphere words} deepens." keyed by sphere | "Your hold on the green deepens." (life) |

Sphere words for the power line reuse the existing sphere vocabulary (`sphere-vocabulary`); no new lexicon. Rise lines fire for Held and Sovereign only, so Touched churn stays silent (PC-5). The count in "2 of your places" is a count of named things, not a mechanic number (Law 13 holds).

### Encounter templates / attachment content

N/A — no encounter or attachment content changes; encounters already read place sphere scores for openings, and those scores are unchanged by this plan except through the writers above.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces: chronicle, DebugPanel). The WebGL overlay is THR-1750's.*

### Player-facing display

This plan ships **no new player panel**. Two existing surfaces change what they say:

- **The chronicle** gains the § Content lines.
- **Card cost pips and forecast words do not change in this build.** The cost and odds consumers are built and tested but ship behind `DOMINION_PRICES_LIVE = false` (§ Decided 13). THR-1750 turns them on in the same PR as the chip that explains them (THR-1766's ghost and red pips), so no price ever moves without its reason on the card.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Chronicle | "Hollowmere has slipped from Held to Touched. No one tends it." | PC-4 (the game acts without saying so) | The line names the place, the new word and the cause, the day it happens. |
| Chronicle | "The Pale Weaver's hand has pressed on Hollowmere. It is Touched now." | PC-4 | Names the rival who did it. |
| Chronicle | "2 of your places slipped today: Hollowmere and Fenwick Ford." | PC-5 (piled-up rows) | One line a day, not one per place. |
| Chronicle | "Thornwall is Held now." | PC-8 (acted, nothing answered) | The Claim the player kept pays off visibly. |
| Chronicle | "Your hold on the green deepens." | PC-1 | A growth moment in sphere words; the band words on the sheet (THR-1750) say what it means. |
| Card text | Claim / Shift / Bestow / Anoint lines in § Content | PC-1 | Each says what the card does to the ground in plain words. |
| Card cost pips and forecast words | unchanged in this build (flag off) | PC-1, PC-6 | Nothing changes until THR-1750 ships the chip and flips the flag; when it does, the forecast words read the same `sphereFactor` as the roll (PC-6 avoided). |

### Playtest signal

A tester who keeps a Claim on one town for two in-game weeks can say the town became more theirs (from the chronicle line or the sheet), and a tester whose untended town slipped can say why.

### Event notifications

Chronicle lines only. No toast, no interrupt (THR-1763: "never an interrupt"; a rival raid keeps its existing toast).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getDominion(objectId)` → `Promise<{ band, match, power, kind, readThrough, tendedBy } | null>`; declared in `src/debug-bridge.d.ts`.
- `window.__DEBUG.getDominionCensus()` → `Promise<Record<DominionBand, number>>` over top-level places.
- `window.__DEBUG.getGodPower()` → `Promise<{ power, capped, baseline, marksCrossed: Partial<Record<SphereName, number>> }>`.
- DebugPanel: a *Dominion* row on the inspected node (band, match, power, tended-by) and a census line.

### Visual presence (HexMapV2)

N/A here — the overlay, frontier line, Sovereign glow and the drop badge are [THR-1750](https://linear.app/threadbare/issue/THR-1750)'s, built on `dominionOf` / `dominionBandOfHex` from this plan.

### UI Laws engaged

Law 13 (a word, never a number: bands and chronicle lines only), Law 49 (coalesced notifications), Law 56 (no chip nothing wrote: the cost chip waits for THR-1750, which reads this plan's band), Laws 1, 17, 21, 33, 37 at the evidence step.

## Wiring

> Checklist: `Docs/plans/wiring-checklist.md`

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility | Prose | Player controls |
|---|---|---|---|---|---|---|---|
| `engine/dominion.ts` (read) | read by consumers in `phaseEssence`, card cost, resolution | via `getTargetActionSlots` / `playerCastReadout` | none (graph reads) | `dominion.read` (sampled, tracing on) | `getDominion` | — | — |
| `engine/phaseDominion.ts` | new, after `phaseControlEffects`, before `phaseSpherePressure`; `afterSpherePressure` hook | chronicle | place `sphereAffinity.seeded`, ascendant `dominionPowerBaseline` | `dominion.tend`, `dominion.neglect`, `dominion.band_change`, `dominion.seat_floor` | `getDominionCensus` | chronicle lines via `enrichProse()` name slots | Claim / Shift cards |
| attunement writer (in `essenceEarned` crossing site) | `phaseEssence` | chronicle | god `sphereAffinity.progress` | `dominion.attunement` | `getGodPower` | power line | — |
| rival re-aim (`rival.ts`, `orchestrator.ts`, `selectSchemeTarget`) | rival phases | existing rival toast | rival `primarySphere` | `dominion.raid` | `getDominion(...).tendedBy` | raid chronicle line | — |
| card cost / sphereFactor | action targeting, resolution | cost pips, forecast words | — | existing cost / resolution traces gain `band` | existing | — | every card |
| thread yield / source income | `phaseEssence`, `phaseEssenceSources` | essence bar income words | — | existing essence traces gain `band` | existing | — | — |

New-module check: `dominion.ts` has four production readers (cost, resolution, essence, phaseDominion); `phaseDominion` is registered in the orchestrator; no orphan.

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| Place / actor / faction sphere scores → card cost | **add** | `getTargetActionSlots` |
| Sphere scores → resolution odds | **add** (`sphereFactor` was 0) | `unifiedActionResolution.ts`, `playerCastReadout.ts` |
| Sphere scores → thread yield / source income | **add** | `computeEssenceGeneration`, source income, `essenceIncome.ts` |
| Ascendant `spherePoints` → Dominion read | **add** (THR-1749's "future" row) | `dominion.ts` |
| Essence earned → god sphere scores (attunement) | **add** | `phaseSpherePressure` (source `attunement`) |
| Rival → god's turf (probe, schemes) | **extend** — real targets, opposite spheres | `phaseSpherePressure` (source `rival`) |
| Faction aggregate → battle aftermath | **preserve** (rounded field kept) | `battleAftermath.ts` |
| Control effects → sphere pressure | **extend** — Claim keyed to the bought vector; other holds slowed | `phaseControlEffects` → `phaseSpherePressure` |
| Attunement marks → god-card rungs | **add (future)** — THR-1811 reads `getAttunementMarksCrossed` | THR-1811 |

The executor updates `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` for every **add** row (CLAUDE.md DoD).

## Constants table

All in `src/data/dominion-content.ts` unless noted.

| Constant | Default | Purpose / source |
|---|---|---|
| `DOMINION_OPPOSITION_WEIGHT` | chaos/order, light/darkness 1.0 · life/entropy 0.8 · force/mind 0.6 · energy/spirit 0.4 · matter/time 0.4 | opposite-pole weight in the match; read from the cosmology pair strengths (THR-1760) |
| `DOMINION_BAND_FOREIGN_MIN` | −1.5 | Hostile below (THR-1760) |
| `DOMINION_BAND_TOUCHED_MIN` | 0.5 | THR-1760 |
| `DOMINION_BAND_HELD_MIN` | 1.5 | THR-1760 |
| `DOMINION_BAND_SOVEREIGN_MIN` | 3.0 | THR-1760 |
| `DOMINION_POWER_CAP` | 2.0 | power factor clamp on the band read only (THR-1765) |
| `DOMINION_POWER_BASELINE_FALLBACK` | 3 | baseline when `dominionPowerBaseline` is missing |
| `DOMINION_COST_MULTIPLIER` | H 1.5 · F 1 · T 0.9 · Hd 0.8 · S 0.75 | THR-1761 |
| `DOMINION_COST_FLOOR_SHARE` | 0.5 | cost never below half the tier-scaled price (THR-1761; § Decided 10) |
| `DOMINION_SPHERE_FACTOR` | H −0.10 · F 0 · T 0.03 · Hd 0.06 · S 0.10 | THR-1761 |
| `ESSENCE_PER_THREAD_BY_TIER` | [0.1, 0.15, 0.30, 0.45, 0.60] by tier 0–4 | THR-1761 (Model B) for tiers 1–4; tier 0 keeps today's flat 0.1 (§ Decided 12) |
| `DOMINION_THREAD_YIELD_MULTIPLIER` | H 0.5 · F 1 · T 1.1 · Hd 1.25 · S 1.5 | THR-1761 |
| `DOMINION_SOURCE_INCOME_MULTIPLIER` | H 0 · F 1 · T 1.1 · Hd 1.25 · S 1.5 | THR-1761 |
| `DOMINION_CLAIM_PRESSURE_PER_TICK` | 0.03 | THR-1762 |
| `DOMINION_CLAIM_UPKEEP_PER_TICK` | 0.3 (primary) | THR-1762 |
| `DOMINION_BREAK_PRESSURE` | 6 | THR-1762 |
| `DOMINION_SEAT_PRESSURE_PER_TICK` | 0.03 | THR-1762 |
| `DOMINION_THREAD_CARRY_PER_TICK` | [0, 0.005, 0.01, 0.015, 0.02] by tier | THR-1762 |
| `DOMINION_CARRY_CAP_PER_PLACE` | 0.03 | THR-1762 |
| `DOMINION_BESTOW_CARRY_TIER_STEP` | 1 | THR-1764 |
| `DOMINION_ANOINTED_TENDS_MIN_BAND` | touched | THR-1764 |
| `CONTROL_PRESSURE_PER_TICK` (`types/sphereAffinity.ts`) | 1 → 0.03 | THR-1762 |
| `DOMINION_UNTENDED_DECAY_PER_TICK` | 0.01 | THR-1763; trip-wire 0.015 (§ Decided 6) |
| `RIVAL_PRESSURE_MAGNITUDE` (`types/sphereAffinity.ts`) | 2 → 4 | THR-1763 |
| `DOMINION_RAID_PLACES_PER_DAILY_BURST` | 10 | THR-1763; trip-wire 15 (§ Decided 6) |
| `DOMINION_RAID_UNTENDED_WEIGHT` | 3 | untended places drawn 3 : 1 over tended (this plan; THR-1763 said "untended first") |
| `DOMINION_TENDED_RAID_ABSORB` | 4 | one raid burst absorbed on a tended place (§ Decided 3) |
| `DOMINION_SEAT_FLOOR_BAND` | touched | THR-1763 |
| `DOMINION_ATTUNEMENT_MARKS` | [20, 60, 150, 300, 600, 1000, 1500, 2100, 2800] | THR-1765 |
| `ATTUNEMENT_SPHERE_PROGRESS` | 1 | THR-1765 |
| `DOMINION_CHRONICLE_MAX_NAMES` | 3 | names listed in the coalesced drop line |
| `DOMINION_PRICES_LIVE` | false | cost and odds read the band only when true; THR-1750 flips it with the card chip (§ Decided 13) |

## Tracing

```ts
// dominion.band_change — a place's band moved after pressure resolved this tick
interface DominionBandChangeTrace {
  type: 'dominion.band_change';
  placeId: string; from: DominionBand; to: DominionBand;
  cause: 'neglect' | 'rival' | 'doom' | 'claim' | 'seat' | 'carry' | 'cast' | 'other';
  match: number; power: number;
}
// dominion.tend — a tending writer pushed this tick (one per place, summed)
interface DominionTendTrace { type: 'dominion.tend'; placeId: string; by: Array<'claim' | 'seat' | 'carry' | 'anointed'>; pushed: Partial<Record<SphereName, number>>; capped: boolean; }
// dominion.neglect — an untended place relaxed toward its seeded scores
interface DominionNeglectTrace { type: 'dominion.neglect'; placeId: string; spheres: SphereName[]; }
// dominion.raid — a rival probe landed (or was absorbed) on the god's turf
interface DominionRaidTrace { type: 'dominion.raid'; rivalId: string; placeId: string; sphere: SphereName; magnitude: number; absorbed: boolean; throttled: boolean; }
// dominion.attunement — a mark crossed on a bought sphere
interface DominionAttunementTrace { type: 'dominion.attunement'; sphere: SphereName; mark: number; earned: number; newScore: number; power: number; capped: boolean; }
// dominion.seat_floor — the clamp fired (expected never)
interface DominionSeatFloorTrace { type: 'dominion.seat_floor'; placeId: string; before: DominionBand; restoredSphere: SphereName; }
// dominion.read — sampled reads, tracing on only
interface DominionReadTrace { type: 'dominion.read'; objectId: string; kind: string; readThrough: string; band: DominionBand; match: number; power: number; consumer: 'cost' | 'odds' | 'yield' | 'income' | 'debug'; }
```

Existing cost, resolution and essence traces gain an optional `band` field.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| No ascendant, or ascendant has no `spherePoints` and no `sphereAlignment` | every read returns `foreign` (par); one `dominion.read` trace with `readThrough: 'no-god'` |
| Object missing, or kind unknown | `foreign` |
| Object has no `sphereAffinity` | treated as all-zero → `foreign` |
| Artifact unborne / company with no members and no commander / army with no faction | `foreign` |
| `dominionPowerBaseline` missing or 0 | `DOMINION_POWER_BASELINE_FALLBACK` |
| Seat id missing or not a place | no seat writer, no floor; trace once |
| Claim aimed at a hex (old in-memory effect) | released on first tick, upkeep stops, `dominion.tend` not emitted; trace `controls.release_retargeted` |
| Rival with no valid turf target | probe falls back to today's behaviour minus the dead target: no landing, trace `throttled: true` |
| `seeded` scores missing on a place | neglect skips the place (never decays below an unknown floor) |
| Band table key missing | multiplier 1 / factor 0 (par) |
| `sphereFactor` would exceed the documented range | clamped to −0.10..0.2 |

Every read is pure and total; the tick loop never throws from this module.

## Blast Radius

Importer counts from `.codesight/graph.md` (home checkout, 2026-10-11).

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/influence.ts` | 166 | one **optional** field on the ascendant properties type (`dominionPowerBaseline`); no shape change for any reader |
| `src/engine/orchestrator.ts` | 157 | phase registration (one call, one hook) and the rival probe target; no exported signature changes |
| `src/engine/cosmology.ts` | 165 | **not edited** (§ Decided 11) |
| `src/data/unified-action-templates.ts` | 226 | two entries edited (Claim / Shift `targetCategories` hex → location, Claim's per-tick mutation removed, Shift's effect re-keyed) and four card texts. Ids unchanged, so every id-keyed reader holds (§ Decided 15). Risk: a test or catalog that asserts Claim / Shift target hexes — grep `targetCategories` assertions in `__tests__` before the edit |

The other edited engine files (`targetActions.ts`, `unifiedActionResolution.ts`, `influence.ts`, `essenceSources.ts`, `phaseSpherePressure.ts`, `types/sphereAffinity.ts`) are under the 120-importer cut of the codesight list. `types/sphereAffinity.ts` changes two constant **values**; every importer reads them by name.

## Deferrals

None created by this plan. The map's carried fog (worship as a writer, Foundation spheres entering the bought vector, Victory Mandates as dominion goals, relics that hold ground) stays fog per the map's closing comment; none blocks this build.

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (debug + chronicle; the visual surfaces are THR-1750)
- [x] Wiring section connects them

## Vision audit

- [x] *Weight of threads* — a thread now pays by where its mortal stands and tends the ground they stand on, so losing one costs income **and** a carrier. Neglect and raids make places losable (a place, not a thread); the seat floor keeps the home, matching canon's no-loss endings.
- [x] *A chapter, not a spreadsheet* — the Vision auditor noted the constant count leans toward a territory layer. The player never sees it as one: five words, chronicle lines, no map numbers. If the THR-1750 overlay plays as a 4X board in the cold playtest, that is the kill signal, filed against THR-1750.
- [x] *Prose carries mechanics, numbers never reach the player* — bands and chronicle lines only.
- [x] *Attention is a spend* — tending is the defence; a god cannot tend everywhere.
- [x] No Vision premise changes.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does** (resources, action verbs, how power grows)
- [x] The change is written into `Docs/canon/rulebook.md` and the quick reference in the build PR (text below)

This plan changes rules of play (resources, action verbs). The build PR adds to `Docs/canon/rulebook.md` §6, after the Influence Essence paragraph, and one line to `Docs/canon/rulebook-quick-reference.md`:

> **Dominion — your home turf.** Every place, person and power in the world leans toward some spheres and against their opposites. How far it leans toward the spheres you bought is its **Dominion band**: Hostile, Foreign, Touched, Held or Sovereign. On your own ground your works cost less, land more often, and your threads and sources there pay more; on hostile ground everything costs dearly. You widen your ground by **Claim Dominion** (a hold that makes a place more yours each day) and **Shift Dominion** (breaking the opposing pole so a hold can take root); your seat, your threaded mortals and the factions you anoint tend the ground they stand on. Ground no one tends fades back, and rival gods press on it, but your seat never falls below Touched. As you draw essence through your spheres you attune to them, and your ground firms further, up to double strength [IMPL — `src/engine/dominion.ts`, `phaseDominion`; THR-1748. The cost and odds clause is DESIGN until THR-1750 turns on `DOMINION_PRICES_LIVE`; that PR flips the tag].

§4 *How your power grows within a run* gains one bullet pointing at the same paragraph (attunement as the god's sphere growth).

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | every number is a named constant with its source ticket; two trip-wires named |
| 2. Inspectability | PASS | seven trace types; `getDominion` returns match, power and read-through; existing traces gain `band` |
| 3. Determinism | PASS | three draws, each on an existing seeded stream; all reads pure |
| 4. Fail-soft | PASS | every missing input reads Foreign (par); table above |
| 5. Narrative over mechanical perfection | PASS | the seat cannot fall (canon: no soft-loss); battles get no band term (canon: "you will witness the war") |
| 6. Additive over destructive | PASS with note | three optional fields; two constants change value (`CONTROL_PRESSURE_PER_TICK`, `RIVAL_PRESSURE_MAGNITUDE`) and Claim / Shift change target type, all decided on the map |
| 7. Performance budget | PASS with note | the read is a twelve-term sum per call; `phaseDominion` walks top-level places (≤ 250) and threads once per tick. A per-tick band memo keyed on `worldVersion` is the named first fix if the 30-tick smoke shows > 5% tick time |

## Done when

- [ ] For one location, `await window.__DEBUG.getDominion(id)` returns the same band as the card-cost line's `band` and the thread-yield trace's `band` in the same tick (unit + browser assertion).
- [ ] With `DOMINION_PRICES_LIVE` on (test override), a resolution test over ≥ 300 seeded streams: the same card costs less on a Sovereign place than on a Hostile one, and its success rate on the Sovereign place exceeds the Hostile rate by the `DOMINION_SPHERE_FACTOR` spread (0.20) within sampling error. (Magnitude is unchanged by design — § Decided 5.) With the flag off (the shipped default), the same card costs and rolls the same on both places.
- [ ] A mortal's uncontested step at the same place rolls at exactly its pre-change odds whatever the god's band there (pins `sphereFactor` 0 for non-player sources).
- [ ] The preview cost (`getTargetActionSlots`) equals the charged cost (`playerCastDispatch`) for every band, flag on and off.
- [ ] A sustained Claim on an unopposed Foreign place reaches Touched by 6 in-game days and Held by 16 at power 1 (THR-1762 measured p50 4.7 / 13.9 days; the test leaves headroom).
- [ ] An untended Held place loses a band within 30 days; the same place with a Claim keeps it (THR-1763).
- [ ] A rival probe lands on a god's Touched-or-better place (trace `dominion.raid`, `absorbed: false` on an untended place, `true` on a tended one); a probe never targets a non-node id.
- [ ] The seat never reads below Touched over a 1,080-tick CLI run with doom woken.
- [ ] `getGodPower()` reads 1.0 at tick 0 for the showcase god, and rises when a bought sphere's earned essence crosses 150.
- [ ] Factions read a non-blank band at tick 0 (`sphereAggregateExact` written at init).
- [ ] The combined economy run (§ Decided 6) on `npm run model:power` with the built constants lands day-90 income in [10.5, 13.5] a tick with the primary pool never pinned; the output is attached to the closing PR.
- [ ] `SPHERE_ATTUNEMENT_THRESHOLDS` still grants exactly the repertoire cards it grants today (pinned test).
- [ ] UL `Cosmology.md` § Dominion and § Dominion Band carry the corrected definitions; rulebook §6 and quick reference carry the § Rulebook impact text.
- [ ] Browser evidence (chronicle + DebugPanel are UI-pillar surfaces): 1920×1080 screenshot of the DebugPanel Dominion row on `?view=game&seeded&size=medium`, console clean, the `getDominion` assertion above, and a UI-Laws line (Laws 1, 13, 17, 21, 33, 37, 49).
- [ ] `npm run gate` green (code track; engine files add the 30-tick CLI smoke and `npm run test:heavy`).

## Kill criteria

- **The band is invisible in play.** If the next cold playtest after THR-1750 ships shows no tester able to say why one place is cheaper than another, the read is fine but the surface is not: a THR-1750 finding, not a rollback here.
- **Turf runs away.** If a 1,080-tick browser run shows more than half the top-level places Sovereign by day 60, `DOMINION_CLAIM_PRESSURE_PER_TICK` and `DOMINION_POWER_CAP` are the levers (constants only).
- **Turf never moves.** If a tended place shows no band change in 20 days in the browser world, the fractional-progress path is not accumulating: a defect, fixed before merge.

## Coordination block

**Suggested model:** opus — crosses resolution, card targeting, essence generation, sphere pressure and the rival orchestrator.

**Parallel-safe with:** [Dominion on the map and on every sheet](https://linear.app/threadbare/issue/THR-1750) *design* (plan doc only); anything outside the files below.

**Mutex with:** any ticket editing `src/engine/unifiedActionResolution.ts`, `getTargetActionSlots`, `src/engine/influence.ts` / `essenceIncome.ts`, `src/engine/phaseSpherePressure.ts`, `src/engine/rival.ts` or the orchestrator's rival phases — same functions. In Ready for Dev today: [the sphere pour / meeting hand / cost names the sphere](https://linear.app/threadbare/issue/THR-1815) touches card cost words; land one before the other.

**Blocks:** [THR-1750](https://linear.app/threadbare/issue/THR-1750) (renders this band), [THR-1811](https://linear.app/threadbare/issue/THR-1811) (rungs read the attunement marks), [THR-1813](https://linear.app/threadbare/issue/THR-1813) (Monuments read the band).

**Files to touch:**
- Create: `src/engine/dominion.ts`, `src/engine/phaseDominion.ts`, `src/data/dominion-content.ts`, tests beside each
- Edit: `src/engine/orchestrator.ts` (phase registration; probe re-aim), `src/engine/phaseSpherePressure.ts` (new sources; tended-raid absorb), `src/engine/unifiedActionResolution.ts:439` (`sphereFactor`), `src/engine/playerCastReadout.ts`, `src/engine/targetActions.ts:464` + `src/engine/playerCastDispatch.ts:125` (cost, one shared helper), `src/engine/influence.ts:109` + `src/engine/essenceIncome.ts` (yield), `src/engine/essenceSources.ts:84` (`computeSourceIncome`), `src/types/influence.ts` (one optional field), `src/engine/hexActionBridge.ts` (Shift's old resonance write retired with the re-key), `src/engine/essenceEarned.ts` call site (attunement), `src/engine/rival.ts`, `selectSchemeTarget`, `src/engine/phaseSphereAggregation.ts` + `src/engine/sphereAffinity.ts` (exact mean; init run), `src/engine/gameInit.ts` (baseline, seeded scores, init aggregation), `src/types/sphereAffinity.ts` (two constants), `src/types/resolution.ts` (range comment), `src/data/unified-action-templates.ts` (Claim / Shift re-key, four card texts), `src/debug-bridge.d.ts` + bridge impl, DebugPanel, `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/Cosmology.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `scripts/power-progression-model.mjs` (dominion config slot)

## Notes for the executor

- **Read the nine audits before code** (`Docs/audits/2026-10-0{6,9}-thr-17{59..63}-*.md`, `Docs/audits/2026-10-10-thr-176{4,5}-*.md`). Each has a never-merged `proto/thr-17xx-*` branch with the census script that produced its numbers; reuse them for tests rather than re-deriving.
- **Do not seed a third bought sphere** (§ Decided 4) and **do not put the band on effect magnitude** (§ Decided 5). Both look like obvious improvements and both were rejected with measurements.
- **No band term in battle momentum** (THR-1764, canon `rulebook.md` war section). The god's hand in war is the spotlight, which is already band-priced.
- **No headless world has a thread edge.** Test thread carry and thread yield with a fixture that adds the edge; check it live in the browser `?seeded` world.
- **`sphereFactor` was never non-zero.** Grep every reader of `ResolutionInput.sphereFactor` before assuming the range; a negative value must not be clamped to 0 anywhere.
- **Before re-targeting Claim / Shift to places, grep for prefix routing**: anything that sends `hex.*` ids to `hexActionBridge` or picks a hex target picker by id prefix rather than by `targetCategories` (intent-judge advisory). The ids stay `hex.*` (§ Decided 15), so a prefix router would mis-send them.
- **Leave `DOMINION_PRICES_LIVE` false.** Flipping it is THR-1750's job, in the PR that ships the card chip. Do not flip it to make a screenshot look livelier.

## Intent-judge verdict

*Cold opus judge, two rounds, 2026-10-11.*

- **Round 1: Revise** (three GAPs, two minor). (3) `sphereFactor` at `unifiedActionResolution.ts:439` serves every source, so mortal steps would have rolled on the god's band. (9) Blast Radius missed `unified-action-templates.ts` (226 importers). (12) Prices and odds would change with nothing on the card saying why (PC-1). Minor: `resolutionService.ts:124` → `:125`; neglect narrowed past THR-1763's rule. Constants matched every audit; 19 of 20 substrate spot-checks held.
- **Fixes:** E2.2 gated on `action.source === 'player'` with a pinned mortal-odds test; Blast Radius row added with the id-keyed readers (§ Decided 15); cost and odds behind `DOMINION_PRICES_LIVE`, flipped by THR-1750 with its chip (§ Decided 13); citation corrected; neglect restored to every untended place (§ Decided 14).
- **Round 2: Allow.** All twelve dimensions PASS. One advisory (prefix routing of `hex.*` ids), folded into Notes for the executor.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-11 (sonnet auditors, run after intent-judge Allow).*

### NFP audit

**NFP AUDIT: PASS-with-notes.** Tunability PASS (every number named with its source; two trip-wire levers). Inspectability PASS (seven trace types; `getDominion` returns match, power, read-through). Determinism PASS (three draws on existing seeded streams; no `Math.random()`). Fail-soft PASS (eleven rows; missing input → Foreign). Narrative PASS (seat floor; words not numbers; no band in battles). Additive PASS-with-note: `CONTROL_PRESSURE_PER_TICK` 1 → 0.03 and `RIVAL_PRESSURE_MAGNITUDE` 2 → 4 change value, and Claim / Shift change target type, all decided on the map. Performance PASS-with-note: ≤ 250 places a tick, twelve-term read; the memo is a named contingent fix. The auditor did not read the 507 KB wiring checklist in full.

### Three-pillar audit

**PILLAR AUDIT: PASS-with-notes.** Engine, Content and UI all present and substantive; Wiring connects all three with an orphan check; Blast Radius present. Substrate: no Dominion subsystem exists to duplicate; Rival Gods & Schemes and Spheres & Quintessence extended. Notes: the inventory lists Spheres & Quintessence as 🟢 overall (the plan's "dormant on the god" is a refinement), and three inventory rows are named loosely (Essence & Divine Economy, action resolution, sphere pressure) — naming only.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions. Non-negotiables #1 (god, not protagonist), #2, #3 (prose, never numbers), #4 / #6 confirmed. Core loop preserved (chronicle only, no new beat). Tension 4 (legibility vs mystery) handled by shipping prices dark until their chip ships. Notes: the constant count leans toward a territory-optimisation layer near the "not a 4X" line; the original Vision line mapped neglect to "losing a thread", which hits places, not threads. Both answered in § Vision audit above.
