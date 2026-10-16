> **title:** Hunger and unrest — a hungry town boils over through Restless, Lawless, On the edge and Rising, and the player can read why — THR-1934
> **linear_issue:** THR-1934
> **author:** Claude Code (design lane, unattended, run 2026-10-16a)
> **created:** 2026-10-16
> **three_pillars:** Engine done · Content done · UI done

# Hunger and unrest — THR-1934

*Unrest becomes the pressure a town lives under. Hunger, sieges, sickness, want and grief raise it; contentment lowers it. At four bands the world acts: people leave, streets turn lawless, a town turns to a better lord, and a town rises against its holder.*

## Why this is load-bearing

Today unrest is never felt. `phaseUnrest` (`src/engine/phaseUnrest.ts:69-77`) removes `UNREST_DECAY_RATE` 1 every tick, 12 a day, and the header's promise is never kept:

```ts
// phaseUnrest.ts:7
 *   - Threshold effects: defection rolls at 70, settlement sack risk at 90
// phaseUnrest.ts:82-87 — the only reads of the two thresholds
if (prevUnrest >= UNREST_DEFECTION_THRESHOLD && newUnrest < UNREST_DEFECTION_THRESHOLD) {
  thresholdsCrossed.push('defection_cleared');
}
```

Nothing else reads `UNREST_DEFECTION_THRESHOLD` or `UNREST_SACK_THRESHOLD` (grep: only the CMS display, `src/components/CMS/tunableConstants.ts:747,751`). In [the decision's sketch](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.seed42.no-impulse.output.txt) (seed 42, medium, 50 days), no town ever reaches 30, and the four towns at scarcity flashpoint sit there 23–47 days with a median unrest of 0. That breaks Game Design Law 45 (never promise what the world will not do). The only behaviour unrest drives is the Lawless trait (`phaseLocationTraits.ts:196-202`), a complication penalty at 70 (`complicationSelection.ts:141-146`) and a prosperity drag (`phaseProsperity.ts:443-447`).

This plan is the fourth of the kingdom economy on the [Mortal economy map](https://linear.app/threadbare/issue/THR-1863), after the purse, the crown and war aims. The map's test is Christian's: *"does this give factions something worth fighting over?"* (2026-10-14). A hungry town becomes a prize a neighbour can win without a war, and a rising makes a rebel worth a campaign.

**Settled input** (each decided by the design lane under delegation, rule 4 of `Docs/canon/process.md`; no veto arrived):

- **[Hunger and unrest](https://linear.app/threadbare/issue/THR-1869)** — the whole model: drift ≤ 4 a day toward a target of hunger + poverty + siege + sickness + bounded death-site haunting − contentment; the bands 30 Restless, 50 Lawless, 70 On the edge, 90 Rising and what each does; a mortal's ladder of response; the chronicle and interrupt rules; its plan-doc predicates; the [Flee the Ravaged Land addendum](https://linear.app/threadbare/issue/THR-1869). Decided 2026-10-14T17:37Z; veto day closed 2026-10-15T17:37Z.
- **[What the player sees of the economy](https://linear.app/threadbare/issue/THR-1870)** ([decision record](../audits/2026-10-15-thr-1870-economy-visibility-decision.md)) — one word ladder per quantity; the place page's **Fortunes** row; **On the edge** as a condition chip (enter 70, release 55) and Rising as an event; the Trouble lens **Hunger** mark and band words in the unrest hover; four chronicle triggers; no Needs-you entry. Decided 2026-10-14T22:29Z; veto day closed 2026-10-15T22:29Z.
- **[The settlement economy plan](https://linear.app/threadbare/issue/THR-1923)** ([plan](2026-10-14-thr-1923-settlement-economy.md), Ready for Dev, not built) — `population`, `foodStore`, `foodBalance`, buildings, the happiness term and the **Restless** trait (enter 30, release 15). Read when present; § Wiring says what ships before it.
- **[The crown plan](https://linear.app/threadbare/issue/THR-1932)** ([plan](2026-10-15-thr-1932-crown.md), lane, 2026-10-15 ~18:47Z) — the offer score's protection term (`crown/offer.ts`), which On the edge reads. **The youngest input:** this plan's handoff holds the build until 2026-10-16T18:47Z.
- **[War aims](https://linear.app/threadbare/issue/THR-1933)** ([plan](2026-10-15-thr-1933-war-aims.md), lane, 2026-10-15 ~22:20Z) — `isEnemyFaction` and the revenge focus; a defection's grudge and a rising's `hostile_to` feed it. Read only; nothing here waits on it.
- **[The faction purse](https://linear.app/threadbare/issue/THR-1931)** (built, [#2435](https://github.com/christianspliid-ui/threadbare/pull/2435)) — `townTaxOf` (`src/engine/factionPurse/income.ts:203-208`), which Lawless halves.

**How-level choices this plan made** (the decisions left them open; reasons in the [brainstorm companion](2026-10-16-thr-1934-hunger-and-unrest-brainstorm.md)): two slices; the target computed daily, the number moved every tick; one hunger counter with two sources; the settlement economy's happiness term folded in without double-counting hunger; a town's view of a new lord; a defection's grudge written as a revenge ambition; a rising through `faction_splinter` with a new `resident_of` selector; relief and a cooldown after a town turns; the interrupt through the existing event popup; people leave only once the settlement economy counts them.

## Slices

| Slice | Ticket | What ships | Blocked by |
|---|---|---|---|
| **S1 — unrest as pressure** | this ticket | the target and drift; the five inputs; the scarcity arc's one-shot jumps retired; **Restless** (people leave, the mortal lean, Flee the Ravaged Land, the Means lean); **Lawless** (the granary riot, the tax halved); the **Fortunes** row; the prosperity ladder unified; `__DEBUG` and traces | [one death keeps a town in unrest forever](https://linear.app/threadbare/issue/THR-1925) and [scarcity arcs jam](https://linear.app/threadbare/issue/THR-1919) ship first |
| **S2 — the town turns** | filed at handoff | **On the edge** (trait, chip, daily defection, grudge); **Rising** (split or founding, `controls` and `hostile_to`, the sack); **empties**; the four chronicle triggers; the gated interrupt; the Trouble lens band words and Hunger mark | S1; the [crown build](https://linear.app/threadbare/issue/THR-1932) (`crown/offer.ts`); [map lenses II](https://linear.app/threadbare/issue/THR-1898) for the lens lines only |

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| **Unrest** (`phaseUnrest.ts`, every tick, `orchestrator.ts:3899`; constants :25-28) | 🟢 ACTIVE | **replaces the decay** with drift toward a target, behind `UNREST_PRESSURE_ENABLED`. |
| Unrest writers — one-off pushes: Incite Unrest +20 (`unified-action-templates.ts:1835,1850`), Open the Markets −10 (:2118, `location-action-constants.ts:49`), Sicken the Wells +15 (:2423), Curse the Roads +10 (:2461), doom cards 12 × severity (`phaseDoom.ts:145-151`, `game-config.ts:118`), complications +1…+15 (`complicationEffects.ts:159-165`) | 🟢 ACTIVE | **kept.** They drift back at the same rate. |
| Unrest writers — per-tick or arc: death-site haunting (`phaseProsperity.ts:901-913`, `deathSiteUnrestBonus` 0–3 per tick); scarcity arc +12 / +25 (`economicPower.ts:330-336`, `economic-power-config.ts:35,38`); health bleed +1 per tick below 50 (`phaseUnrest.ts:58-60`) | 🟢 ACTIVE | **become target terms** (death site after [THR-1925](https://linear.app/threadbare/issue/THR-1925); sickness) or **retire** (the arc's jumps; hunger carries them). |
| **Location Traits** — Lawless (`location-trait-constants.ts:90-91` enter 50 / release 30, sustain 36 ticks :60; rule `phaseLocationTraits.ts:196-202`; chip `condition-trait-content.ts:609-625`) | 🟢 ACTIVE | **reads** for the Lawless effects. S2 adds `on_the_edge` the same way. No `restless` trait exists yet (the settlement economy adds it). |
| **Mortal Economy & Prosperity** — prosperity (`getProsperityTier`, `phaseProsperity.ts:205-211`; unrest drag :443-447); stock tiers (`phases/resourceStockTiers.ts`, staple test as `economicPower.ts:253-255`); scarcity arc (`economicPower.ts` §3, every 12 ticks, ≤ 3 arcs; unrest-phase seed `cg.quest` :315-333) | 🟢 ACTIVE | **reads** prosperity and stock tiers; **changes** the arc's unrest-phase seed to the granary riot. |
| **Faction purse** — `townTaxOf` (`factionPurse/income.ts:203-208`, no unrest read today); `taxHolderOf` (:170-198) | 🟢 ACTIVE | **extends** `townTaxOf` with one Lawless multiplier; **reads** `taxHolderOf` for "the holder". |
| **War, Armies & Battles** — siege state (an actor with `battleState.battleType === 'siege'` and `battleState.settlementId`, `siegeResolution.ts:236-263`; removed at the end, `battleResolution.ts:529`) | 🟢 ACTIVE | **reads** (no settlement property marks a siege). |
| **Factions & Succession** — `faction_splinter` (`encounterAftermath.ts:3315-3430`; selectors `unifiedAction.ts:413-419`, no residence option); `foundFaction` (`strategicGraphOps.ts:1801-1898`, writes no `member_of` and no `controls`); faction ambitions (`grievanceSourceId` / `targetNodeId` declared, `types/faction.ts:176-179`, written by nothing — `factionAmbitions.ts:264` sets `targetNodeId: null`) | 🟢 ACTIVE | **S2 extends** the selector union with `resident_of`; **S2 writes** `controls`, `hostile_to` and a revenge ambition. |
| **Agents** — residence (`agentResidence.ts:88-92`: `originLocationId`, `residencePositionId`, `residenceArrivedTick`); `relocationIntent` (`types/movement.ts:101-116`, written only by the `agent_relocation` aftermath, TTL 36 ticks, pull `0.5/(1+dist)`, `relocationIntent.ts:248-292`) | 🟢 ACTIVE | **reads** residence; **writes** `relocationIntent` through `setRelocationIntent`. |
| Ambitions — *Flee the Ravaged Land* (`ambition-templates.ts:1672-1726`; event-minted only, `ambition-minting-rules.ts:74-254`; no world-state trigger) | 🟢 ACTIVE | **adds** one world-state minting site (the Restless leaver). |
| Encounter — the granary riot (`encounter.town.granary_riot`, `granary-riot.ts:81-99`; gated only on `settings:['urban']`, no famine gate) | 🟢 ACTIVE | **seeded** by the arc and by Lawless-while-hungry. |
| Great Chronicle — `EconomicChronicleTrigger` (`economic-chronicle-content.ts:19-41`), significance (:45-63), templates (:71+), `resolveEconomicChronicle` (`economicChronicle.ts:175`); spotlight gate pattern (`resourceStockTiers.ts:126`, `ECON_PHASE_SPOTLIGHT_CAP` 40) | 🟢 ACTIVE | **S2 extends** with four triggers. |
| Event popup — an engine event with `notification.channel: 'popup'` (`notificationRouter.ts:220-232`) is the interrupt registry's `EventPopup` (`interruptRegistry.ts`) | 🟢 ACTIVE | **S2 reuses** for the gated interrupt. |
| Place page — `LocationView.tsx` (`LivelihoodLine` :959, rendered :1438) | 🟢 ACTIVE | **S1 adds** the Fortunes row above the livelihood line. |
| Threads prosperity word — `deriveProsperityLabel` (`retinue.ts:345`, read :552) | 🟢 ACTIVE | **S1 retires** it for `getProsperityTier` (the visibility decision's one ladder). |

**Grep census, main @ 54193f42:** no numeric population on any settlement (`resourceEconomy.ts:43-60`: "Population is not tracked directly"); no migration code (`MIGRATION_CHANCE` is `@deprecated`, `agentLifecycle.ts:76-79`); no rebellion or rising mechanic (only flavour tags, e.g. `agenda-content.ts:188-195`); no paying-work pull reads a mortal's Means (the [mortal wealth plan](https://linear.app/threadbare/issue/THR-1936) S2 adds it); `TICKS_PER_DAY` = 12 (`attention-constants.ts:14`).

## Engine pillar

### Systems design

New module **`src/engine/unrestPressure.ts`** with pure helpers in `src/engine/unrestPressure/` (`inputs.ts`, `hunger.ts`, `bands.ts`, `leave.ts`; S2 adds `defection.ts`, `rising.ts`), constants in `src/data/unrest-pressure-constants.ts`. No new phase: `phaseUnrest` calls in.

**1. The target (daily).** On the tick where `tick % TICKS_PER_DAY === UNREST_TARGET_TICK_OFFSET`, for every settlement (`getLocationNodes` filtered to subtypes hamlet/town/city/capital — the place tier only), `computeUnrestInputs(state, settlement)` returns:

| Input | Rule | Cap |
|---|---|---|
| `hunger` | `hungerDays > 0 ? HUNGER_BASE + HUNGER_PER_DAY × (hungerDays − 1) : 0` | `HUNGER_MAX` 55 |
| `poverty` | `max(0, POVERTY_PIVOT − prosperity) × POVERTY_PER_POINT` | `POVERTY_MAX` 20 |
| `siege` | `SIEGE_PRESSURE` while a siege actor names the settlement, and for `SIEGE_LINGER_DAYS` after `lastSiegeSeenTick` | 30 |
| `sickness` | `SICK_PRESSURE` while `populationHealth < SICK_HEALTH_LINE` (missing health reads `LOC_HEALTH_DEFAULT_BASELINE` 80) | 10 |
| `deathSite` | [THR-1925](https://linear.app/threadbare/issue/THR-1925)'s bounded haunting term (`deathSiteUnrestBonus × DEATH_SITE_UNREST_TARGET_SCALE`, fading with time since the last death) | THR-1925's `DEATH_SITE_UNREST_TARGET_MAX` |
| `contentment` | with the settlement economy live: its happiness term **without** `HUNGER_UNHAPPY`, as `−UNREST_FROM_HAPPINESS × happiness`, bounded ±`UNREST_HAPPINESS_MAX`; before it: `−PROSPERITY_CONTENT_RELIEF` 10 when prosperity > `PROSPERITY_CONTENT_LINE` 60 | ±20 |

`target = clamp(hunger + poverty + siege + sickness + deathSite + contentment, 0, 100)`. The phase writes `unrestTarget` and `unrestInputs: { hunger, poverty, siege, sickness, deathSite, contentment }` on the settlement (flat numbers; the Fortunes row, Flee, the debug tab and S2 read them).

**2. The drift (every tick).** `unrest` moves toward `unrestTarget` by at most `UNREST_DRIFT_PER_DAY / TICKS_PER_DAY` (4/12) per tick, clamped 0–100. The flat decay, the prosperity damper and the per-tick health bleed retire behind `UNREST_PRESSURE_ENABLED` (off = today's code). One-off pushes (§ Substrate) are unchanged; the drift pulls them back at 4 a day, so an Incite Unrest lasts about five days instead of under two.

**3. Hunger.** `hungerDays` (settlement, int) is updated in the daily pass: +1 if `isHungryToday(settlement)`, else reset to 0. `isHungryToday`:

- with the settlement economy live (`foodStore` is a number): `foodStore <= 0 && foodBalance < 0`;
- before it: any staple the settlement draws on has `stockTier === 'scarce'` (the same staple test as `economicPower.ts:253-255`; the [prototype](https://github.com/christianspliid-ui/threadbare/blob/proto/thr-1869-hunger-unrest/scripts/proto/hunger-unrest-sketch.ts)'s signal).

The settlement economy's `starveDays` is not reused: it resets when a person is lost, which would saw-tooth the term.

**4. Siege memory.** The daily pass scans siege actors once (`battleState.battleType === 'siege'`, by `settlementId`) and writes `lastSiegeSeenTick` on each named settlement. No war code is edited.

**5. The scarcity arc keeps its phases, words and scenes; its jumps retire.** With `UNREST_PRESSURE_ENABLED`, `economicPower.ts:330-336` adds nothing to unrest (hunger carries it). At the `unrest` phase the arc seeds the granary riot instead of `cg.quest`: the existing seed record with `templateId: 'encounter.town.granary_riot'` in place of `encounterFamily: 'cg.quest'` (the flashpoint's `encounter_route_embargo` seed, `:337-347`, is the pattern), `seedLabel` unchanged.

**6. Restless — people leave (S1).** A settlement is Restless while it bears the `restless` trait (enter 30, release 15; the settlement economy's row, § Wiring). Every `RESTLESS_LEAVE_DAYS` (3) days of being Restless, `pickLeaveDestination(state, town)` returns the nearest settlement within `MIGRATION_RADIUS_HEXES` (6) that is not hungry and not Restless, preferring one with the same tax holder (`taxHolderOf`), then hex distance, then id. None → nobody leaves, trace `unrest.leave.none`. Otherwise:

1. **A person** (settlement economy live): `population −1` here (never below 1), `population +1` there, through the settlement economy's population writer; trace `unrest.leave`. Before the settlement economy: skipped, `unrest.leave.skipped` once per run.
2. **A mortal** leans: of the free-willed mortals whose residence is this town or one of its sublocations (`resolveToParentLocation`), the most recent arrival (`residenceArrivedTick`, ties by id) gets a `relocationIntent` to the destination (`destination: location`, `stampResidenceOnArrival: true`, the default TTL) through `setRelocationIntent`. A lean, not an order: the existing pull scores it.
3. **Flee the Ravaged Land** (the decision's addendum): when that mortal's home has `unrestInputs.hunger` as its largest input and the mortal holds no Flee ambition, the ambition is minted for them through the same helper the `assign_ambition` aftermath effect uses, with the destination as its target. The ambition is otherwise unchanged.

**7. Restless — the Means lean (S1, hook).** When [mortal wealth](https://linear.app/threadbare/issue/THR-1936) S2's `computeMeansWant` exists, a mortal whose home settlement is Restless or worse computes `poverty` with `wealth − MEANS_RESTLESS_DROP` (20, one Means band). One helper, `homeIsRestless(state, agentId)`, in `unrestPressure/bands.ts`. If mortal wealth S2 lands later, its PR calls the helper; this slice exports it and its test.

**8. Lawless (S1).** While a settlement bears `lawless` (existing, 50 / 30):

- **The tax halves:** Lawless is a `has_trait` edge (`phaseLocationTraits.ts:32,234`), and `townTaxOf(settlement: GraphNode)` (`factionPurse/income.ts:203`) takes no graph, so it gains an optional second parameter, `townTaxOf(settlement, graph?)`. With a graph, it multiplies by `LAWLESS_TOWN_TAX_FACTOR` (0.5) when the settlement has an outgoing `has_trait` edge to the lawless trait. Its only production caller, `computePurseIncome` (`income.ts:329`), passes `graph`. Without a graph the result is unchanged, so a caller that does not pass one keeps today's value. [War aims](https://linear.app/threadbare/issue/THR-1933)' `townValueFor` passes the graph too, so a lawless town is worth less to take.
- **Riots:** on the day a settlement gains `lawless` while `hungerDays > 0`, one granary-riot seed is planted for a resident (same record as § 5, `sourceReactionId: 'lawless'`), at most once per `RIOT_SEED_COOLDOWN_DAYS` (10).
- The existing Lawless pool lean (`location-trait-constants.ts:192-198`) is unchanged.

**9. On the edge (S2).** A new location trait `on_the_edge`, input `unrest`, enter `ON_THE_EDGE_ENTER` 70, release `ON_THE_EDGE_RELEASE` 55, same rule shape as Lawless. Once a day, for each **held** settlement bearing it and out of cooldown (`lastTurnTick`):

- **Candidates:** every faction, other than the holder (`taxHolderOf`), that is the tax holder of at least one settlement within `DEFECTION_RADIUS_HEXES` (8).
- **The town's view of a lord** (`townViewOf(state, town, F)`, `unrestPressure/defection.ts`):

```
protection = crown/offer.ts protection term, evaluated over this one town     // 0..1
standing   = +1 if F keeps a hall or a member resident in the town (war aims' hasHallIn when built; the same located_at test inline before)
             −1 if an army of F besieged the town within DEFECTION_MEMORY_DAYS
             else 0
fed        = share of F's held settlements with hungerDays = 0               // 0..1
solvent    = F's purse Means word is not Destitute ? 1 : 0
view       = DEFECT_W_PROTECTION·protection + DEFECT_W_STANDING·standing
           + DEFECT_W_FED·fed + DEFECT_W_SOLVENT·solvent
```

- **Defect** when `max view(F) > view(holder) + DEFECTION_MARGIN` (ties by id). The holder's `controls` edges to the town are removed; F gains one with `{ via: 'defection', takenFrom: holder, establishedTick }`; `touchStructure()`. The old holder's `relates_to` toward F takes `DEFECTION_GRUDGE_SENTIMENT` (−0.35, past war aims' −0.3 enemy line) and `defectionTick`; if it has no active military ambition it adopts `revenge` with `grievanceSourceId: F` and `targetNodeId: town` (both declared fields, written for the first time). The relationship itself is carried by the `relates_to` edge; the two ids on the ambition say only what the ambition is about, like an army objective’s `targetNodeId`, and no reader treats them as the relationship. The town takes `DEFECTION_RELIEF` (−15) as a one-off push and `lastTurnTick = tick`.
- **Unheld** settlements on the edge do not defect (no holder to leave); they lose people at the Restless rate and read "on the edge of leaving".

**10. Rising (S2).** Once a day, a settlement with `unrest ≥ RISING_THRESHOLD` (90), out of cooldown:

- **Held:** the holder's members whose residence is the town split off through `faction_splinter` with a new selector `{ kind: 'resident_of', locationId }` (reads `agentResidence`, place tier via `resolveToParentLocation`). If no member lives there, the resident with the highest `member_of.rank` in any faction (else the earliest `residenceArrivedTick`, ties by id) founds a free town through `foundFaction`, and becomes its first member. Either way the new faction gains the town's `controls` edge (`via: 'rising'`, `takenFrom: holder`), the holder's is removed, and `hostile_to` is written both ways with `{ reason: 'rising', sinceTick }` (war aims' enemy rule reads it). No resident at all → no rising (trace `unrest.rising.no_one`), the town keeps its holder.
- **The sack:** the rising removes the town's costliest building Place (the settlement economy's building table cost; ties by id) through the settlement economy's building-loss path. Before the settlement economy: skipped, traced.
- **Unheld:** the town **empties**: people leave at `EMPTYING_LEAVE_MULTIPLIER` (2) times the Restless rate (§ 6). When `population` reaches 1, the `empties` chronicle line fires once. Before the settlement economy: nothing to empty, traced.
- The town takes `RISING_RELIEF` (−30) and `lastTurnTick = tick`. `TOWN_TURN_COOLDOWN_DAYS` (20) covers both defection and rising.

### Graph nodes / edges

No new node or edge type (Law 42). Properties (all optional, additive):

| Node / edge | Property | Shape | Writer | Readers |
|---|---|---|---|---|
| settlement | `unrestTarget` | number 0–100 | `phaseUnrest` (daily) | drift, debug |
| settlement | `unrestInputs` | `{ hunger, poverty, siege, sickness, deathSite, contentment }` | `phaseUnrest` (daily) | Fortunes row, Flee, Trouble hover (S2), debug |
| settlement | `hungerDays` | int ≥ 0 | `phaseUnrest` (daily) | hunger input, riot seed, `fed`, Hunger mark (S2) |
| settlement | `lastSiegeSeenTick` | tick | `phaseUnrest` (daily) | siege input |
| settlement | `restlessDays` | int ≥ 0 | `phaseUnrest` (daily) | leave cadence |
| settlement (S2) | `lastTurnTick` | tick | defection, rising | cooldown |
| `controls` (S2) | `via: 'defection' \| 'rising'`, `takenFrom` | existing shape (conquest writes `takenFrom`, crown plan) | defection, rising | crown loyalty, chronicle |
| `relates_to` (S2) | `defectionTick` | tick | defection | debug |
| `hostile_to` (S2) | `reason: 'rising'`, `sinceTick` | existing edge, new reason value | rising | `isEnemyFaction` |
| faction ambition (S2) | `grievanceSourceId`, `targetNodeId` (existing, now written) | ids | defection | war aims revenge focus, abandon check |
| `FactionMemberSelection` (S2) | `{ kind: 'resident_of'; locationId }` | union member | rising | `faction_splinter` selector |

### Tick phases

| Phase | Placement | Cadence | Reads | Writes |
|---|---|---|---|---|
| `unrest` (existing, `orchestrator.ts:3899`) | unchanged | target + hunger + leave + S2 turns daily; drift every tick | prosperity, health, stock tiers, settlement-economy props, siege actors, traits, residence, purse Means (S2), crown view (S2) | the properties above; `population` (via the settlement-economy writer); `relocationIntent`; S2 edges |
| `economic_power` (existing) | unchanged | every 12 ticks | — | arc seed now the granary riot; no unrest jump |
| `faction_purse` (existing) | unchanged | daily | `lawless` trait | town tax × 0.5 |
| `location_trait` (existing, :3919) | unchanged | every tick | `unrest` | `restless` (if not present), `on_the_edge` (S2) |

The unrest phase runs after prosperity and before location traits (`orchestrator.ts:3823, 3899, 3919`), so traits read today's number. Faction actions and ambitions run later in `post-economy` (`phases/index.ts:72-78`), so a defection's revenge ambition is read the same tick.

### Resolution logic

1. **Pressure, not spikes:** the number only ever moves 4 a day toward the target; pushes ride on top and fade.
2. **One counter for hunger,** two sources; the settlement economy wins when live.
3. **Defence of the holder first:** a town defects only when a lord beats its holder by `DEFECTION_MARGIN`; a holder that protects, feeds and pays keeps its towns.
4. **Turning is rare and spaced:** a 20-day cooldown and a relief push stop a town flipping back and forth.
5. **Nothing is created from nothing:** a rising needs a resident; emptying needs a population.

### PRNG callouts

None. Every pick is deterministic (argmax with id ties). No new random stream.

## Content pillar

### Encounter templates

No new template. The granary riot (`encounter.town.granary_riot`) becomes the arc's unrest-phase scene and the Lawless-while-hungry riot (§ Engine 5, 8). A content test asserts the seed resolves to the template.

### Prose tables

**S1 — the Fortunes sentence** (`src/data/fortunes-prose.ts`, pure builder `fortunesSentence(state, settlementId)`). The prosperity word (`getProsperityTier`, lower-cased) then, only when a band is crossed, the band and its largest input:

| Band | Form |
|---|---|
| none | "{Town} is {prosperity} and quiet." |
| Restless | "{Town} is {prosperity}, and its people are restless{cause}." |
| Lawless | "{Town} is {prosperity}, and its streets have turned lawless{cause}." |
| On the edge, held (S2) | "{Town} is {prosperity}, and it is on the edge of turning from {Holder}{cause}." |
| On the edge, unheld (S2) | "{Town} is {prosperity}, and its people are on the edge of leaving{cause}." |

| Largest input | `{cause}` |
|---|---|
| hunger | " with hunger" |
| poverty | " with want" |
| siege | ", with an army at the walls" |
| sickness | " with sickness" |
| deathSite | " over their dead" |
| a push (unrest − target is larger than every input) | "" (no clause) |

**S2 — four chronicle triggers** added to `EconomicChronicleTrigger`, three variants each in the game register, full-detail settlements only (the `ECON_PHASE_SPOTLIGHT_CAP` gate, `resourceStockTiers.ts:126`):

| Trigger | Significance | Sample variant (the visibility decision's) |
|---|---|---|
| `town_on_the_edge` | 0.6 | "Ferris mutters against House Ashfold; men count the days since the last cart of grain." |
| `town_defects` | 0.8 | "Ferris has turned from House Ashfold and opened its gates to Saltmarch Hold." |
| `town_rises` | 0.85 | "Ferris has risen. Its people burned the reeve's hall and named their own captains." |
| `town_empties` | 0.75 | "The last carts have left Ferris. No one tends its fields now." |

The `town_on_the_edge` variants choose a cause line from `unrestInputs` (grain for hunger, the siege lines for a siege, a general line otherwise), so a besieged town does not mention grain.

### Attachment content

N/A — no attachment changes; unrest moves towns and mortals' leanings, it grants nothing.

### Data tables

`src/data/unrest-pressure-constants.ts` (§ Constants); `src/data/fortunes-prose.ts`; S2's four template rows in `economic-chronicle-content.ts`; S2's `on_the_edge` row in `location-trait-constants.ts` and its chip in `condition-trait-content.ts`.

## UI pillar

*Screenshot tool: Playwright (the place page and chips are DOM) at 1920×1080. S2's Trouble lens Hunger mark is WebGL: Claude-in-Chrome for the mark, Playwright for the hover text.*

### Player-facing display

- **S1 — the Fortunes row.** One sentence at the top of the place page's economy block, above THR-1923's livelihood line (`LocationView.tsx:1438`; ord 18 in the Inspector's place registry when [Inspector S2b](https://linear.app/threadbare/issue/THR-1910) lands, whichever is second carries it). The prosperity word carries the registry tooltip `ui.econ.prosperity`. Town and holder names route through the ref router.
- **S1 — one prosperity ladder.** `deriveProsperityLabel` (`retinue.ts:345`) retires; Threads reads `getProsperityTier`, so "Stable" disappears and the five words match everywhere.
- **S1 — the Restless chip** is the settlement economy's (enter 30, release 15, its tooltip); if this slice lands first it adds the row with those exact words.
- **S2 — the On the edge chip** (condition chip like Lawless): tooltip `ui.econ.on_the_edge`.
- **S2 — Trouble lens:** the `hunger` mark (red, one badge) on a settlement with `hungerDays > 0`; the unrest hover speaks band words. Built into the lens when [map lenses II](https://linear.app/threadbare/issue/THR-1898) is on main; whichever of the two lands second adds the lines. Restless alone never lights a hex (the visibility decision).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Fortunes row, calm | "Millbrook is modest and quiet." | PC-1 | Equilibrium is one plain sentence; no number, no arrow. |
| Tooltip on the prosperity word, `ui.econ.prosperity` (S1) | "How well a place lives: destitute, struggling, modest, prosperous or flourishing. Good harvests, trade and peace raise it; hunger, war and sickness wear it down." | PC-1 | The explanation of the word lives here, in the one tooltip registry (Law 17); the five words are `getProsperityTier`'s, in its order. |
| Threads, a mortal's home prosperity (`ThreadsPanel.tsx:484`, `ThreadDetailView.tsx:933`) | one of "Destitute", "Struggling", "Modest", "Prosperous", "Flourishing" (today `deriveProsperityLabel`: "Destitute", "Struggling", "Stable", "Prosperous", at other cut-offs) | PC-6 | Must match the Fortunes row, the Trade lens hover (THR-1878) and the visibility decision's ladder for the same town on the same day. "Stable" is gone from every surface. |
| Chip, Restless (S1 only if it lands before the settlement economy; the words are [THR-1923's](2026-10-14-thr-1923-settlement-economy.md), § Player-facing text, verbatim) | "Restless" · tooltip: "Its people are unhappy: too crowded, too hungry, or too little to live for. Left alone, a restless town can slide into {{location.lawless}}." | PC-6 (must agree with Unrest and Lawless) | Same trait id, constants (enter 30, release 15) and words as THR-1923, so whichever plan lands second adds nothing. |
| Fortunes row, Restless | "Millbrook is struggling, and its people are restless with hunger." | PC-1, PC-6 | Same word as the Restless chip; the cause is the largest input, so it agrees with the Hunger mark and the livelihood line ("its fields cannot feed its people"). |
| Fortunes row, Lawless, siege | "Ferris is modest, and its streets have turned lawless, with an army at the walls." | PC-1, PC-6 | Same word as the Lawless chip. |
| Fortunes row, On the edge (S2) | "Ferris is struggling, and it is on the edge of turning from House Ashfold with hunger." | PC-1, PC-6 | The holder is named and a link; the same words as the chip and the chronicle line. |
| Chip, On the edge (S2) | "On the edge" · tooltip: "Its people have had enough. If another lord nearby can protect and feed them better, the town will turn to it; left like this, it may rise." | PC-6 (must agree with Lawless, Restless and the chronicle) | It enters above Lawless and releases above Restless, so a town that shows it also shows Lawless. |
| Chronicle (S2) | the four rows above | PC-5 | **Frequency:** On the edge fires on entry only; defects and rises at most once per town per 20 days; empties once per town. The decision's census: 0–2 towns on the edge per seed in 50 days. |
| Event popup (S2, gated) | title "Ferris is on the edge" / "Ferris has risen" · body = the chronicle line | PC-3 | Only when a threaded mortal lives there or the god keeps a shrine there (the decision’s words). The game has no shrine node; its shrine is an essence source of the god’s at the town or one of its sublocations (`essenceSources.ts`), which is the read. Otherwise chronicle only. |
| Trouble hover (S2) | "Unrest: Ferris is on the edge. It may turn from House Ashfold to a lord who can feed it." · "Hunger: Millbrook's fields cannot feed its people." | PC-5, PC-6 | The visibility decision's words. |

No number appears on any surface (Law 13): unrest, the target, the inputs and the view scores stay in traces and the debug tab.

### Playtest signal

A tester who opens a hungry town's page can say in their own words that it is hungry and getting angry; a warm tester who reads the chronicle can say why a town changed hands. **Watch item:** no tester reports a calm, fed town shown as restless or lawless.

### Event notifications

S1: none new (the Restless and Lawless chips appear on the page; the livelihood tug exists for a threaded mortal's home). S2: the four chronicle lines; the gated event popup for On the edge and Rising.

### Debug inspection (DebugPanel)

- **Economy tab** gains per settlement: unrest, target, the six inputs, `hungerDays`, band, `restlessDays`, last leave destination; S2: each candidate lord's view parts and the holder's.
- `__DEBUG.getUnrest(locationId)` → `{ unrest, target, inputs, hungerDays, band, leaveTo }`; S2 `__DEBUG.getTownView(locationId)` → `{ holder, holderView, candidates: [{ factionId, protection, standing, fed, solvent, view }] }`.

### Visual presence (HexMapV2)

S1: N/A — no map change; the plain map stays quiet (THR-1830's lens grammar). S2: the Trouble lens Hunger mark only.

### UI Laws engaged

| Law | How |
|---|---|
| 1 / 17 | `ui.econ.prosperity` and `ui.econ.on_the_edge` registry tooltips. |
| 13 / 14 | Words, never numbers. |
| 21 | Town and holder names in the Fortunes row and popups route through the ref router. |
| 33 | The longest Fortunes sentence (~110 characters) wraps in the place page's prose block; checked at 1920×1080. |
| 37 | One ladder: the Fortunes word, the chips and the chronicle share band words; prosperity uses `getProsperityTier` only. |
| 56 | Every chip reads written state (the trait edges). |

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `unrestPressure/inputs.ts`, `hunger.ts` | `unrest` (daily) | Fortunes row | settlement `unrestTarget`, `unrestInputs`, `hungerDays`, `lastSiegeSeenTick` | `unrest.target` | Economy tab; `__DEBUG.getUnrest` |
| `unrestPressure.ts` drift | `unrest` (every tick) | chips (via traits) | `unrest` | existing `unrest_tick` (+ `target`) | Economy tab |
| `unrestPressure/leave.ts` | `unrest` (daily) | — | `population` (SE writer), `relocationIntent`, Flee ambition | `unrest.leave`, `.none`, `.skipped` | Economy tab |
| `unrestPressure/bands.ts` (`homeIsRestless`) | read by mortal wealth S2 | — | — | — | — |
| `economicPower.ts` arc seed | `economic_power` | — | seed record | existing `scarcity_arc` | — |
| `factionPurse/income.ts` (`townTaxOf(settlement, graph?)`; `computePurseIncome` passes `graph`) | `faction_purse` | Purse panel (existing) | — | existing purse traces | Purse tab |
| `fortunes-prose.ts` | — | `LocationView` Fortunes row | reads | — | — |
| S2 `defection.ts` | `unrest` (daily) | chip, chronicle, popup | `controls`, `relates_to`, ambition | `unrest.defect`, `unrest.defect.considered` | `__DEBUG.getTownView` |
| S2 `rising.ts` | `unrest` (daily) | chronicle, popup | new faction, `controls`, `hostile_to`, building loss | `unrest.rising`, `.no_one` | Economy tab |

**Order with neighbours.**

- **Ship first:** [THR-1925](https://linear.app/threadbare/issue/THR-1925) (its bounded haunting is the `deathSite` input; if it shipped only its once-a-day stopgap, S1 converts that into the target term) and [THR-1919](https://linear.app/threadbare/issue/THR-1919) (an arc slot must free up, or the riot seed fires in three towns only).
- **[The settlement economy](https://linear.app/threadbare/issue/THR-1923), either order.** If it lands first: S1 reads `foodStore` / `foodBalance` for hunger, replaces its "toward the happiness term at the existing decay rate" with the contentment input (dropping `HUNGER_UNHAPPY` from it), and turns on people leaving. If S1 lands first: hunger reads stock tiers, contentment reads prosperity, nobody leaves (only the mortal lean), and the settlement economy's PR makes those three switches, which § Notes spells out. The `restless` trait row is added by whichever lands first, with its plan's constants.
- **[Mortal wealth S2](https://linear.app/threadbare/issue/THR-1952):** whichever lands second wires `homeIsRestless` into `computeMeansWant`.
- **S2 after the crown build** (`crown/offer.ts`). War aims is not a blocker: without it, a defection's grudge and a rising's `hostile_to` are written and simply wait for an army that reads them.
- **[Pressure-driven migration](https://linear.app/threadbare/issue/THR-729)** (an old idea ticket) is absorbed by S1's Restless leaving, as the decision says. S1's handoff comments on it naming this plan; it stays open until S1 merges, then is closed as superseded, so no second migration build is picked up.
- **[The god's stake](https://linear.app/threadbare/issue/THR-1935)** reads `hungerDays` and the band for its prayer, and names On the edge in the prayer line (the visibility decision § 7).

## Interface impact

Mapped subsystems in `Docs/canon/interface-map.generated.md`: **Mortal Economy & Prosperity** (unrest, stock tiers, the purse's town tax, the scarcity arc — changed); **Factions & Succession** (S2: `controls`, `hostile_to`, `relates_to`, ambitions, the splinter selector); **War, Armies & Battles** (siege actors read); **Essence & Divine Economy** — S2 reads essence sources for the popup gate only.

| Contract | Kind | Production read site |
|---|---|---|
| `unrest-pressure-inputs` (settlement `unrestInputs`, `unrestTarget`, `hungerDays`) | **add** | Fortunes row; Flee minting; the god's stake (later) |
| `siege-state-raises-unrest` (siege actors → `lastSiegeSeenTick`) | **add** | siege input |
| `lawless-halves-town-tax` (`lawless` trait → `townTaxOf`) | **add** | `computePurseIncome` |
| `restless-moves-people` (SE `population` both ends; `relocationIntent`) | **add** | settlement economy food sink; `phaseAgentDecision` arrival |
| `scarcity-arc-seeds-granary-riot` | **extend** (seed target changed) | encounter seeding |
| `happiness-term-into-unrest` (settlement economy plan's row) | **extend** — becomes the contentment input | `phaseUnrest` |
| S2 `town-defection-moves-controls` | **add** | crown loyalty (`takenFrom`), war aims (`isEnemyFaction` via `relates_to`), revenge ambition |
| S2 `rising-founds-rebel` (`controls`, `hostile_to reason:'rising'`) | **add** | `isEnemyFaction` |

`scripts/interface-contracts.ts` gets the same rows. `Docs/canon/systems-inventory.md`'s Unrest row becomes "pressure toward a target; four bands with world effects". Wiki pages whose `sources` match (`public/wiki-manifest.json`) for `phaseUnrest.ts`, `economicPower.ts` and `factionPurse/` update in the slice that edits them.

**UL:** *On the edge* and *Rising* (S2) are new player words; S2 files the UL proposal. It must separate a town’s *Rising* from the existing "Rising Faction" ascendant-beat text (`ascendant-beat-content.ts`, `ascendant-pool-beat-templates.ts`), so one word does not name two things (PC-6). *Fortunes* is the place-page row's name (the visibility decision's word); S1 files it with the settlement economy's open [UL proposal](https://linear.app/threadbare/issue/THR-1924) as an added term.

## Constants table

All in `src/data/unrest-pressure-constants.ts` unless noted.

| Constant | Default | Purpose |
|----------|---------|---------|
| `UNREST_PRESSURE_ENABLED` | `true` | Off = today's flat decay, arc jumps and health bleed (rollback) |
| `UNREST_DRIFT_PER_DAY` | `4` | Most unrest moves toward its target in a day |
| `UNREST_TARGET_TICK_OFFSET` | `0` | Tick within the day the target is recomputed |
| `HUNGER_BASE` / `HUNGER_PER_DAY` / `HUNGER_MAX` | `10` / `3` / `55` | Hunger term: first day, each further day, cap |
| `POVERTY_PIVOT` / `POVERTY_PER_POINT` / `POVERTY_MAX` | `35` / `0.6` / `20` | Poverty term below this prosperity |
| `SIEGE_PRESSURE` / `SIEGE_LINGER_DAYS` | `30` / `5` | Siege term (a flat value, so it is also its cap) and how long it lasts after |
| `SICK_PRESSURE` / `SICK_HEALTH_LINE` | `10` / `40` | Sickness term (flat, so also its cap) below this health |
| `PROSPERITY_CONTENT_LINE` / `PROSPERITY_CONTENT_RELIEF` | `60` / `10` | Contentment before the settlement economy |
| `UNREST_FROM_HAPPINESS` / `UNREST_HAPPINESS_MAX` (the settlement economy's constants, `settlement-economy` constants file; this plan imports them, never copies) | `4` / `20` | Contentment with the settlement economy: unrest per point of happiness, and the bound either way |
| `RESTLESS_LEAVE_DAYS` | `3` | One person leaves a Restless town this often |
| `EMPTYING_LEAVE_MULTIPLIER` | `2` | S2: an unheld Rising town loses people this many times faster |
| `MIGRATION_RADIUS_HEXES` | `6` | Where they go |
| `MEANS_RESTLESS_DROP` | `20` | A Restless home counts one Means band poorer for the want |
| `LAWLESS_TOWN_TAX_FACTOR` (`faction-purse-constants.ts`) | `0.5` | A lawless town pays half |
| `RIOT_SEED_COOLDOWN_DAYS` | `10` | One Lawless riot seed per town this often |
| `ON_THE_EDGE_ENTER` / `ON_THE_EDGE_RELEASE` (`location-trait-constants.ts`) | `70` / `55` | S2 chip and defection band |
| `DEFECTION_RADIUS_HEXES` | `8` | S2: lords this near are weighed |
| `DEFECTION_MARGIN` | `0.25` | S2: how much better a lord must be |
| `DEFECT_W_PROTECTION` / `DEFECT_W_STANDING` / `DEFECT_W_FED` / `DEFECT_W_SOLVENT` | `1.0` / `0.3` / `0.8` / `0.5` | S2: the town's view weights |
| `DEFECTION_MEMORY_DAYS` | `30` | S2: a siege this recent counts against a lord |
| `DEFECTION_GRUDGE_SENTIMENT` | `−0.35` | S2: old holder's sentiment toward the new one |
| `DEFECTION_RELIEF` / `RISING_RELIEF` | `−15` / `−30` | S2: one-off push after turning |
| `RISING_THRESHOLD` | `90` | S2: the town rises |
| `TOWN_TURN_COOLDOWN_DAYS` | `20` | S2: no second turn sooner |
| `ECONOMIC_CHRONICLE_SIGNIFICANCE` (existing) | `town_on_the_edge 0.6 · town_defects 0.8 · town_rises 0.85 · town_empties 0.75` *new* | S2 chronicle weight |

## Tracing

```ts
// unrest.target — daily, per settlement whose target or band changed
interface UnrestTargetTrace {
  category: 'unrest.target';
  tick: number;
  locationId: string;
  target: number;
  inputs: { hunger: number; poverty: number; siege: number; sickness: number; deathSite: number; contentment: number };
  hungerDays: number;
  hungerSource: 'settlement_economy' | 'stock_tier';
  band: 'calm' | 'restless' | 'lawless' | 'on_the_edge' | 'rising';
}

// unrest.leave — a Restless town loses a person, a mortal leans
interface UnrestLeaveTrace {
  category: 'unrest.leave' | 'unrest.leave.none' | 'unrest.leave.skipped';
  tick: number;
  fromId: string;
  toId: string | null;
  personMoved: boolean;           // false before the settlement economy
  leaningAgentId: string | null;
  fleeMinted: boolean;
}

// unrest.defect.considered / unrest.defect — S2, daily per town on the edge
interface UnrestDefectTrace {
  category: 'unrest.defect.considered' | 'unrest.defect';
  tick: number;
  locationId: string;
  holderId: string;
  holderView: number;
  best: { factionId: string; protection: number; standing: number; fed: number; solvent: number; view: number } | null;
  margin: number;
}

// unrest.rising — S2
interface UnrestRisingTrace {
  category: 'unrest.rising' | 'unrest.rising.no_one';
  tick: number;
  locationId: string;
  holderId: string | null;
  path: 'split' | 'founded' | 'emptied' | 'none';
  newFactionId: string | null;
  residentsMoved: number;
  sackedBuildingId: string | null;
}
```

The existing `unrest_tick` trace gains `target`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Settlement with no `prosperity` / `populationHealth` | Poverty 0; health reads `LOC_HEALTH_DEFAULT_BASELINE` (80) |
| No staple stock tiers yet | Not hungry |
| Settlement economy props missing on some settlement | That settlement uses the stock-tier hunger and prosperity contentment |
| THR-1925 absent | `deathSite` 0 and the old per-tick add stays (the bug); the S1 PR is blocked by it, so this is a guard only |
| No leave destination | Nobody leaves; `unrest.leave.none` |
| Leaving mortal has no residence or no hex | Skip the lean; the person still moves |
| Mortal wealth S2 absent | `homeIsRestless` exported, unused |
| S2: crown helper absent | Protection term = `OATH_NO_THREAT_PROTECTION` (0.5) for every lord; one trace |
| S2: holder unknown (`taxHolderOf` null) | Treated as unheld |
| S2: no resident at a rising | No rising; `unrest.rising.no_one` |
| S2: `foundFaction` or the splinter fails | Caught; no `controls` change; trace; the town keeps its holder |
| Any error in the daily pass | Caught per settlement inside `phaseUnrest`; the drift still runs |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | ≥100 (CLAUDE.md high-impact list) | S2 adds one member to the `FactionMemberSelection` union; the selector switch gets one case; no other shape changes |
| `src/engine/phaseUnrest.ts` | 3 | Behaviour change behind `UNREST_PRESSURE_ENABLED`; fixture tests on both flag states |

`src/types/graph.ts`, `gameState.ts` and `traceBuffer.ts` are not changed beyond trace category additions in `src/types/trace.ts`.

## Game Design Laws check

- **Law 45 [P]** (never promise what the world will not do): the 70 / 90 header promise is finally kept, and nothing on screen names defection or rising until S2 ships them. Conforms.
- **Law 13 [P]** (factions act whether or not the god watches): every band acts attention-blind; only the popup is gated. Conforms.
- **Law 42 [E]** (simple frameworks): one target formula, one drift, four bands; no new node or edge. Conforms.
- **Law 43 [E]** (one concept): happiness folds into unrest; hunger is one counter. Conforms.
- **Law 22 [E]** (no dead air): a hungry town says so on its page in one sentence. Conforms.
- **Law 12** (hunger is a reason to pray): the prayer is the god's stake's; this plan exposes `hungerDays` for it.
- **Law 36** (the god's purse is small): untouched.
- No new random draw (Laws 1–8 untouched).

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (Fortunes sentences; riot seeds; S2 chronicle)
- [x] UI pillar present (Fortunes row, ladder, chips; S2 lens lines and popup)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise: anomalies are the content (rare bands), prose not numbers (band words), factions act without the god (attention-blind), the god tilts through existing verbs.
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does**: unrest is pressure toward what a town lives through, and its bands make people leave, streets lawless, towns turn and towns rise.
- [x] `Docs/canon/rulebook.md`'s settlement paragraph and `rulebook-quick-reference.md` are updated in S1's PR; S2 adds the turning and rising sentence.

> Brainstorm companion: `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every input, cap, band, cadence, weight and relief is a named constant |
| 2. Inspectability | PASS | `unrestInputs` on every settlement; four trace types; `__DEBUG.getUnrest` and `getTownView` |
| 3. Determinism | PASS | No random draw; argmax with id ties; settlements in id order |
| 4. Fail-soft | PASS | See table; every missing upstream system has a fallback |
| 5. Narrative over mechanical perfection | PASS with note | A town's "view" of a lord is a simple sum, not a population poll; it reads as the town's mood |
| 6. Additive over destructive | PASS with note | Old decay kept behind `UNREST_PRESSURE_ENABLED`; optional properties; one union member; `townTaxOf` gains an optional parameter. `deriveProsperityLabel` is removed outright, not flagged: it is a second word ladder for one quantity, and the visibility decision retired it |
| 7. Performance budget | PASS | Daily pass over ~40 settlements plus one siege-actor scan; per-tick drift is one subtraction per settlement. S2: per on-the-edge town, ≤ ~10 candidate lords (0–2 towns per seed in the census) |

**Feedback loop note:** unrest lowers the prosperity target (`phaseProsperity.ts:443-447`, ≤ 20) and low prosperity raises unrest (poverty, ≤ 20). Both terms are capped, so the loop is bounded; the kill criteria watch for a poverty-only Lawless town.

## Kill criteria

- If more than a quarter of settlements are Lawless on any day on two of three seeds, lower `HUNGER_MAX` before anything else (hunger drives 83–87% of the pressure in the census).
- If any town reaches Lawless with `poverty` as its largest input on two of three seeds, lower `POVERTY_MAX` to 10.
- S2: if no town reaches On the edge in 100 days on any seed with the settlement economy on, lower `ON_THE_EDGE_ENTER` to 65 and re-measure (the decision's own *would change the call*).
- S2: if one town defects more than twice in 100 days, raise `DEFECTION_MARGIN` before the cooldown.

## Done when

**S1 (this ticket).** Measured over 600 ticks on seeds 42, 99 and 7 (medium), unless stated.

- [ ] **Felt:** at least 3 towns reach Restless on each seed (the census found 7–12).
- [ ] **Not everywhere:** at most a quarter of settlements are Lawless on any day.
- [ ] **Hunger, not grief:** no town at 50 or above has `deathSite` as its only non-zero input.
- [ ] **Fed calms it:** a fixture town with one scarce staple reaches Restless within 10 days; restored to adequate, it falls below Restless within 10 days.
- [ ] **Pushes fade:** a fixture Incite Unrest (+20) on a calm, fed town is back within 4 of its target in 5 days.
- [ ] **The arc does not jump:** with the flag on, no `scarcity_arc` transition changes `unrest` in the tick it fires; its unrest-phase seed names `encounter.town.granary_riot`.
- [ ] **Lawless pays less:** a fixture lawless town's `townTaxOf` is half the same town's untraited value.
- [ ] **People lean away:** on seed 42, every `unrest.leave` names a destination within 6 hexes that was not hungry and not Restless; with the settlement economy live, the two populations change by −1 / +1.
- [ ] **Rollback:** with `UNREST_PRESSURE_ENABLED = false`, a 300-tick run on seed 42 matches main in every settlement's unrest.
- [ ] Place page: four-part browser evidence — a 1920×1080 screenshot of a Fortunes row with a band and a calm one; a clean console; `(await window.__DEBUG.getUnrest('<locationId>')).inputs.hunger >= 0`; a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37.
- [ ] Interface contracts, systems inventory, the matching wiki pages and the rulebook settlement paragraph updated in the same PR.
- [ ] `npm run gate` green (code track: tests, typecheck ratchet, build, 30-tick CLI smoke, `test:heavy`); `npm run gate -- --final` last before push.
- [ ] Closing commit body and PR body carry the line-anchored closer for this issue.

**S2 (its own ticket)** — the decision's predicates, with the settlement economy on, 100 days, seeds 42/99/7: at least 1 town reaches On the edge on each seed; every defection and rising leaves a chronicle line and moves a `controls` edge; no town at 70 or above has death-site haunting as its only input. Plus: a fixture where a fed, solvent neighbour with a hall in the town beats a broke holder defects on the next daily pass, and the holder gains a revenge ambition naming the town; a fixture rising with resident members creates a faction holding the town and `hostile_to` the holder; the popup fires only for a threaded resident or an essence source; the Trouble lens lines render from state.

## Coordination block

**Suggested model:** opus — it replaces a per-tick engine curve every system downstream reads, with three optional upstream systems to switch on and off.

**Parallel-safe with:** [the type and icons rollout](https://linear.app/threadbare/issue/THR-1879) and [war aims S1](https://linear.app/threadbare/issue/THR-1933) — no file overlap (war aims edits army and battle files; this edits unrest, the arc seed and one purse line).

**Mutex with:**

- [One death keeps a town in unrest forever](https://linear.app/threadbare/issue/THR-1925) — **ships first**; both edit the death-site path and `phaseUnrest.ts`.
- [Scarcity arcs jam](https://linear.app/threadbare/issue/THR-1919) — **ships first**; both edit `economicPower.ts` §3.
- [The settlement economy](https://linear.app/threadbare/issue/THR-1923) — both edit `phaseUnrest.ts` and the `restless` trait row; run one after the other, either order (§ Wiring).
- [The crown](https://linear.app/threadbare/issue/THR-1932) — S2 only; S2 is blocked by its build (`crown/offer.ts`).
- [Mortal wealth S2](https://linear.app/threadbare/issue/THR-1952) — the `homeIsRestless` hook in `computeMeansWant`; whichever is second wires it.
- [Inspector S2b](https://linear.app/threadbare/issue/THR-1910) — it moves the place page's rows; whichever lands second carries the Fortunes row.
- [The faction purse](https://linear.app/threadbare/issue/THR-1931) follow-ups touching `factionPurse/income.ts` — one line here.

**Files to touch:** (S1; S2's list goes on its own ticket)
- Create: `src/engine/unrestPressure.ts`, `src/engine/unrestPressure/{inputs,hunger,bands,leave}.ts`, `src/data/unrest-pressure-constants.ts`, `src/data/fortunes-prose.ts`, tests `src/engine/__tests__/unrestPressure*.test.ts`
- Edit: `src/engine/phaseUnrest.ts`, `src/engine/phaseProsperity.ts` (death-site per-tick add off under the flag, if THR-1925 left it), `src/engine/phases/economicPower.ts` (arc jumps, seed), `src/engine/factionPurse/income.ts` + `src/data/faction-purse-constants.ts` (Lawless factor), `src/engine/retinue.ts` (ladder), `src/components/Game/LocationView.tsx` (Fortunes row), the `ui.econ.prosperity` tooltip registry entry, `src/types/trace.ts`, `src/components/Game/debug/` Economy tab, `src/debug-bridge.ts` + `.d.ts`, `scripts/interface-contracts.ts`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md` + quick reference, the matching wiki pages.

## Notes for the executor

- **The hunger counter is yours, not the settlement economy's.** Do not reuse `starveDays`.
- **Do not double-count hunger.** If the settlement economy is on main, its happiness term enters as `contentment` without `HUNGER_UNHAPPY`; its own "toward happiness at the decay rate" code is replaced, not kept beside the drift.
- **Pushes stay pushes.** Do not turn Incite Unrest, doom cards or complications into target terms; the decision kept them one-off.
- **Graph-op unrest writes are unclamped** (`graphOpExecutor.ts:534-541`); the drift must clamp 0–100 every tick as today's phase does.
- **Missing `populationHealth`:** read sites treat it as 80, but the graph-op executor treats it as 0 (`graphOpExecutor.ts:540`), so a first Blight writes −12. The sickness input reads with the 80 default; do not "fix" the executor here (out of scope, note it in the PR).
- **Place tier only.** Use `getLocationNodes`, never a bare `getNodesByType('location')` (it returns both tiers).
- **S2: `controls` moves are structural** — `touchStructure()` on every create and remove, as the crown plan does.

## Intent-judge verdicts

- **Run 1 — Revise.** Dimension 12: the prosperity tooltip and the Restless chip words were not quoted, and the Threads prosperity word had no row. Dimension 3: `townTaxOf` takes no graph, so the Lawless check had no way to read the trait edge. Dimension 4: the settlement economy's happiness constants and the siege and sickness caps were missing from the constants table. Advisories: the shrine gate and the existing "Rising Faction" text. Fixed: all five, plus both advisories.
- **Run 2 — Allow** (11 PASS, 1 GAP). Advisory folded in: THR-729 (pressure-driven migration) is named in § Wiring with its fate.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Inspectability, determinism, fail-soft and performance PASS. Notes, folded in: the emptying rate is now a named constant (`EMPTYING_LEAVE_MULTIPLIER`) and the settlement economy's two happiness constants are in the constants table as imports; the town's view of a lord is a simple weighted sum, accepted as the town's mood (NFP 5); `deriveProsperityLabel` is removed outright rather than flagged, now stated in the NFP table with the reason (one ladder per quantity).

### Three-pillar audit

PASS-with-notes. Engine, Content and UI present and substantive; every required section present; no green-field duplication (migration is acknowledged as deprecated, rising reuses the splinter and founding paths). Notes: Restless people-leaving, the sack and emptying wait on the settlement economy and are traced as skipped until then; three wiring rows (the Means hook, the arc seed, the prose builder) carry "—" for UI or debug because they have no surface of their own.

### Vision audit

PASS-with-notes. No contradictions; extends the north star's "what the world does next" and design tension 4 (legibility: the Fortunes sentence names the cause). Notes: the payoff is mostly world texture, with only the Restless lean and Flee reaching named mortals; it leans toward kingdom simulation, bounded by rare bands and chronicle caps. The ambition's `grievanceSourceId` / `targetNodeId` are existing declared fields; § Systems design 9 now states that the relationship lives on the `relates_to` edge and the ids only say what the ambition is about.
