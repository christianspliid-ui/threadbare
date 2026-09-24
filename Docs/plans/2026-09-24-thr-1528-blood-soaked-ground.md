> **title:** Blood-soaked ground — a place remembers the battles and fights fought there — THR-1528
> **linear_issue:** THR-1528
> **author:** Claude Code
> **created:** 2026-09-24
> **three_pillars:** Engine `done` · Content `done — one location-trait definition, its effect and pool rows, four battle and two fight record summaries, the place-memory line` · UI `done — the location page's existing condition row and the place MEMORY section read the new state; no component change`

# Blood-soaked ground — THR-1528

*A battle leaves a place unchanged in the world's record today; after this, the ground remembers it.*

## Why this is load-bearing

Two plans promised this word and neither could keep it:
- **Traits wave 2** (THR-790) wanted `#blood-soaked` on ground where battles were fought. It declined rather than fake the word from `deathCount`, which counts plague and old age alike: *"Minting it from `deathCount` would call a plague a massacre."*
- **The Physical Conflict charter** (THR-1258, 2026-09-23) listed *"cleared or blood-soaked lairs"* among the marks a fight leaves behind. The six plans merged last night delivered the cleared lair (M3) and never the blood-soaked one.

The substrate both need does not exist:
- a battle overwrites a settlement's `prosperity` and `locationSubtype` (`battleAftermath.ts:533-551`) and **mints no record at all**;
- a field battle writes nothing to the ground it was fought on;
- a fight's own state lives on a resolved action that is pruned within 20 ticks.

This plan adds the **record first**: one `event` node per battle, and (slice 2) one per fight, each tied to its place. Then it adds the **word**: a fifth location trait, minted from recent bloodshed and released as it ages.

A record with a writer but no reader is gate theatre (THR-800), so the plan ships both at once.

**A prerequisite found while designing, now fixed:** a won siege used to **delete the town it took**, because the aftermath disbanded the settlement as if it were the losing army. That would have removed the very place this record belongs to. It was filed as THR-1563 and merged on 2026-09-24 (PR #2000): only an army is disbanded now (`battleAftermath.ts:662-674`), and occupants of a destroyed Place move up to its parent (`relocateOccupantsToParent`, `:433-459`).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| War, Armies & Battles (`systems-inventory.md:37`: `battleResolution.ts` `resolveBattle` `:463-503`; `battleAftermath.ts` `applyAftermath` `:466-694`) | 🟢 ACTIVE | **extends**: `applyAftermath` returns a small summary (it returns `void` today, `:471`). `resolveBattle` writes the battle record from it **before** it removes the battle node. Every resolution path goes through `resolveBattle`: an army gone (`battleResolution.ts:298-303`), momentum (`:434`, `:443`), collapse (`:449-453`) and the siege ticks (`siegeResolution.ts:323`, `:498`, `:504`, `:509`). One writer covers all of them; the only other battle and siege `removeNode` calls are creation rollbacks (`battleResolution.ts:267`, `siegeResolution.ts:297`) |
| Events (`event` node, `EVENT_TYPES` `world-objects.ts:198-203`, Event row `:378-383`; writer precedent `writeAppointmentEvent` `appointments.ts:387-434`) | 🟢 ACTIVE | **extends**: two event types, `battle_fought` and `fight_fought`, written the appointment writer's way (node, `participated_in`, `occurred_at`, fail-soft) |
| Location Traits (`systems-inventory.md:109`, phase 6.6385: `phaseLocationTraits.ts`, the rule list `:113-144`, `location-trait-constants.ts`) | 🟢 ACTIVE | **extends**: a fifth rule, *Blood-soaked*. It needs three optional rule fields: a computed input (a read function beside `SCALAR_PROPERTY`), its own sustain, and its own chronicle significance |
| Location condition tables (`LOCATION_CONDITION_MOVEMENT_TAX`, `LOCATION_TRAIT_ENCOUNTER_BONUS`) | 🟢 ACTIVE | **extends**: one row in each; the location page and the pool read them with no new code |
| Place detail page (`placeMemoryResolver`, `detailPageResolvers.ts:703-730`) | 🟢 ACTIVE | **extends**: the MEMORY section prefers a recent battle or fight over the latest ordinary encounter |
| The fight dispatcher (`FIGHT_END_BRANCHES`, `src/engine/fights/fightOutcome.ts`, FB2 merged 2026-09-24) | 🟢 ACTIVE | **extends (slice 2)**: one branch that writes the fight record |

## Engine pillar

### Systems design

**1. The battle record** (slice 1).

- **`applyAftermath` returns a summary.** It becomes `applyAftermath(...): BattleAftermathSummary`:
  - `{ severity: DestructionSeverity | null; victorFactionId?; loserFactionId?; commanderFate?; commanderId?; settlementId? }`;
  - the stalemate branch returns `{ severity: null }` from its early return (`:474-483`);
  - **mutual destruction names no victor.** `applyAftermath` treats `'mutual_destruction'` as a defender win internally (`isAttackerVictory` is false, `:486-488`). The summary leaves `victorFactionId` and `loserFactionId` unset for it, so nothing downstream reads a defender victory that never happened;
  - the change is additive: the one caller ignores the return today.
- **Capture before the aftermath.** `resolveBattle` reads both armies' commanders (their `commanded_by` edges) before calling `applyAftermath`, because the loser's army is disbanded inside it. A siege's defender is the settlement, which has no commander, so a siege records the attacker's commander only.
- **Write before the removal.** After the aftermath, **before** `graph.removeNode(battleNodeId)` (`battleResolution.ts:502`), `resolveBattle` calls `recordBattleFought(state, battleNode, bs, resolutionType, summary, commanders)`.
- **What `recordBattleFought` writes:**
  - **Id:** `evt_battle_${battleNodeId}`. The battle id already carries the start tick, so this is unique and deterministic.
  - **Properties:** `eventType: 'battle_fought'`, `tick`, `startedTick`, `battleType` (`'field_battle' | 'siege'`, `src/types/battle.ts:15`), `resolutionType`, `severity`, `locationId`, and a `summary` sentence for the place's memory (§ Content).
  - **The place:**
    - **A siege** records at `bs.settlementId`, the town. The siege node itself sits on the army's position (`siegeResolution.ts:273-280`), and the detection arm that starts a siege accepts a settlement standing on that position (`battleResolution.ts:555-602`), so the battle's `located_at` can name a different node from the town.
    - **A field battle** records at the battle node's `located_at` target. Armies stand on Location nodes (`armySpawning.ts:262-269`; `selectArmyObjective` refuses any other start, `:146`), so that target is a Location, which is what `occurred_at` requires.
    - Both are resolved up to the outer-tier Location through `resolveToParentLocation` (a warhost can stand on a Place).
  - **Edges:** `occurred_at` event → Location (`{ tick }`). `participated_in` from each captured commander **whose node is still in the graph after the aftermath**, with `role: 'attacker' | 'defender'`, `tick`, and an `outcome` read from `resolutionType`, never from the aftermath's winner:

    | `resolutionType` | attacker's `outcome` | defender's `outcome` |
    |---|---|---|
    | `attacker_victory` | `won` | `lost` |
    | `defender_victory` | `lost` | `won` |
    | `stalemate` | `stalemate` | `stalemate` |
    | `mutual_destruction` | `lost` | `lost` |

    **A fallen commander keeps their edge when their node is kept.** Today the aftermath removes a killed commander outright (`battleAftermath.ts:646-647`), so no edge can be written. THR-1566 retains them as deceased, and from then on the record writes their edge like any other: the battlefield is exactly where that history belongs.
  - **The per-place stamp:** `lastBattleTick = tick` on the Location (§ 3).
  - **Faction names** are kept in `summary` as display text only. The faction relationship stays where it lives, on the armies' and commanders' `member_of` edges, and is not copied into a property (the Property-vs-Edge rule).
  - **Fail-soft:** the writer is wrapped in try/catch and traces its failure, like the appointment writer.
- **Wiring:** `touchWorld(runtime)` after the write.

**2. The fight record** (slice 2, after FB7 so a real fight exists).

- **The branch:** `recordFightFought` is registered **first** in `FIGHT_END_BRANCHES` (`fightOutcome.ts`).
  - **It never throws.** The dispatcher stops on a throwing branch, so the branch catches and traces its own errors.
  - **It writes only when `fightState.exchanges > 0`**, meaning a real exchange happened. Two kinds of end are deliberately not records:
    - the no-roll ends (`no_opponent`, `opponent_gone`);
    - a nerve-step rout with zero clashes (`routed`, no exchange). A mortal who fled at the sight of the beast spilled no blood there.
  - **Why first, knowing the cost:** registered first, the record cannot carry the ending's face (`slain` / `spared`, which D1 and D2 write later in the same dispatch). That is chosen: the record must exist even if a later branch fails, and the place needs only "a fight happened here". Do not move the branch later to enrich the summary.
- **What it writes:**
  - **Id:** `evt_fight_${actionId}`. **One per fight, not per side.**
  - **Properties:** `eventType: 'fight_fought'`, `tick`, `result`, `templateId`, `locationId`, `summary`.
  - **The place:** the fighter's position resolved to the outer-tier Location. For a lair fight, that is the lair.
  - **Edges:** `occurred_at` → Location. `participated_in` from the fighter (`role: 'fighter'`) and from the opponent (`role: 'opponent'`), each with `outcome: fightState.result` and `tick`.
  - **The per-place stamp:** `lastFightTick = tick` on the Location.
- **The per-step `encounter_outcome` nodes a fight already writes are not counted.** There are up to four per fight, they cannot be told apart from other encounters, and a no-roll end writes one too.

**3. The per-place stamps** (`lastBattleTick`, `lastFightTick`) are the index that keeps the rule cheap.
- Events are never pruned (no event-node pruning exists in `src/engine`), and `getIncomingEdges(loc, 'occurred_at')` scans every incoming edge of a place, so the rule must not walk a place's whole history every tick.
- A place whose stamps are both older than the window reads zero in O(1).
- The stamps are scalar bookkeeping on the Location; the relationship is the `occurred_at` edge.

**4. The rule: *Blood-soaked*.**
- **Input:** `bloodshed(place, tick)`, the sum over the place's battle and fight records inside `BLOOD_SOAKED_WINDOW_TICKS`: `BLOOD_SOAKED_BATTLE_WEIGHT` per battle and `BLOOD_SOAKED_FIGHT_WEIGHT` per fight.
  - **`null` when the place carries neither `lastBattleTick` nor `lastFightTick`.** The phase then skips the rule and writes no sustain counter (`phaseLocationTraits.ts:181-183`), as it does for a scalar nobody wrote. Returning `0` there would write a counter on every Location every tick and fail the existing pin (`phaseLocationTraits.test.ts:260-268`).
  - **`0` when stamps exist but both fall outside the window**, so the trait releases.
- **Thresholds:** it enters at `BLOOD_SOAKED_ENTER` (one battle, or three fights) and releases below `BLOOD_SOAKED_RELEASE`.
- **Sustain:** its own, `BLOOD_SOAKED_SUSTAIN_TICKS` (1). The shared 36-tick sustain exists so a word does not flicker. Here the input is already a ten-day window, so the ground reads blood-soaked from the day of the battle, not three days after it.
- **The three new optional `LocationTraitRule` fields:**
  - `read?: (graph, loc, tick) => number | null`, used instead of `SCALAR_PROPERTY` when present;
  - `sustainTicks?: number`, which overrides the shared default;
  - `chronicleSignificance?: number`, which overrides `LOCATION_TRAIT_EVENT_SIGNIFICANCE` on the mint line. The line's write (`phaseLocationTraits.ts:239`) becomes `rule.chronicleSignificance ?? LOCATION_TRAIT_EVENT_SIGNIFICANCE`.
  - The four existing rules set none of them, so they behave byte for byte as today, and still write their mint lines at 0.4. A test pins both.
- **Registration:** `LocationTraitInput` gains `'bloodshed'`, `LOCATION_TRAIT_IDS` gains `bloodSoaked`, and the rule is appended last. It is independent of the other four: a battlefield can also be haunted.
- **The falsifier** the ticket demands: a place with many deaths and no battle or fight record never mints it. The rule reads records, never `deathCount`.

### Graph nodes / edges

- **No new node or edge types.** Two new values of the existing `event` node's `eventType` discriminator, registered in `EVENT_TYPES`. The Event row's `writers` gains `battleResolution` and (slice 2) `fights/fightOutcome`.
- **Edges used:** the existing `occurred_at` (event → Location, required `tick`) and `participated_in` (actor → event, required `role`, `outcome`, `tick`).

### Tick phases

- **Battle records** are written in `battle_tick` (phase 2.357, `orchestrator.ts:3254`), inside `resolveBattle`.
- **Fight records** are written at fight resolution, through the dispatcher.
- **The rule** runs in `phaseLocationTraits` (phase 6.6385, `orchestrator.ts:3634-3643`), after both.

### Resolution logic

The rule is arithmetic over records in a window, and no probability is involved. The weights are named.

### PRNG callouts

None. Record ids derive from existing ids, and nothing is drawn.

## Content pillar

### Encounter templates

No new templates. The pool reads the trait through `LOCATION_TRAIT_ENCOUNTER_BONUS` (below), so scenes about violence, loss and fear gather at a battlefield the way the uncanny gathers at haunted ground.

### Prose tables

GAME register, narrator mode, one line each. The executor finalizes them against the voice scorer.
- **Battle record `summary`**, one per `resolutionType` and battle type:
  - a won siege: *"{Victor} took {place} by siege."*
  - a siege that failed: *"{Place} held against {attacker}."*
  - a field battle won: *"{Victor} broke {loser} here."*
  - a stalemate: *"Two armies met here and neither gave way."*
  - mutual destruction: *"Two armies met here and destroyed each other."*
- **Fight record `summary`:**
  - against a monster: *"{Fighter} fought {opponent} here."*
  - a duel: *"{Fighter} and {opponent} fought here."*
- **Mint line** (phaseLocationTraits' existing line, with this trait's name): *"The ground at {place} is blood-soaked."*
- **Place MEMORY:** the record's `summary`, with the day it happened.

### Attachment content

**One location-trait definition**, `trait.condition.location.blood_soaked`, in `condition-trait-content.ts` beside the four minted traits:
- **name:** *Blood-soaked*
- **description:** *"A battle was fought here lately, or blood has been spilled here again and again. Travellers go around, and the talk is of what happened."*
- **tags:** `#condition #location #combat #negative`
- **visibility:** public
- **no duration row:** a minted trait has a cause, not a term
- **`domainContributions: {}`:** a place has no capability; the readers are the tables below

### Data tables

- **`LOCATION_CONDITION_MOVEMENT_TAX`:** `blood_soaked: LOCATION_AVOIDED_MULTIPLIER`, the same row as *Haunted* and *Plague Scare*. People go around a battlefield.
- **`LOCATION_TRAIT_ENCOUNTER_BONUS`:** `'#combat': 0.10`, `'#loss': 0.08`, `'#fear': 0.06`, `'#iron': 0.05`. Every key must be a seated content tag (`locationTraitBonus.test.ts` checks), and the existing cap of 0.15 applies.
- **No step modifier, deliberately.** An Iron bonus would make fights easier exactly where fights already happened, and a lair would feed its own trait. The road and the pool are the honest readers. The UL (`Traits.md:47`) asks for at least one reader row, and this has two.

## UI pillar

*Screenshot tool:* none. No `src/components/` file changes, so the surface is browser-verify exempt under THR-688 rule C: engine and content changes are accepted through headless evidence. Both player surfaces render through existing code covered by THR-790's evidence. The one new prose path, the place MEMORY line, is proved headlessly: a test in `detailPageGenerator.test.ts` asserts that a sieged town's detail page carries the siege sentence in its MEMORY section.

### Player-facing display

- **The location page** (`LocationProfileModal`) shows *Blood-soaked* in its conditions row. The tooltip, the effect subtitle derived from the movement-tax row (`conditionEffectLine`) and "until it lifts" all come from the existing reader. No code changes.
- **The place MEMORY section** (`placeMemoryResolver`) shows the most recent battle or fight record inside `BLOOD_SOAKED_WINDOW_TICKS`, ahead of the latest ordinary encounter, and falls back to today's behaviour otherwise. A town that was sieged remembers the siege.
  - **The existing helper will not find the record.** `getLocationEncounterHistory` filters `eventType === 'encounter_outcome'` (`encounterEventNode.ts:320`). The resolver walks the place's `occurred_at` edges for `battle_fought` and `fight_fought` itself, or the helper gains an event-type parameter.
- **UI Laws engaged:**
  - Law 14: the word is the definition's display name, never an id.
  - Law 56: the row is state-backed, by a real `has_trait` edge.
  - Law 13: no numbers; bloodshed is never shown.

### Event notifications

- The mint line is written as a narrative tick event at `BLOOD_SOAKED_CHRONICLE_SIGNIFICANCE` (0.85), through the rule's `chronicleSignificance`. The chronicle takes lines at 0.8 and above (`orchestrator.ts:2526-2527`), so this one reaches it. The other minted traits stay at 0.4 (event log only).
- **Why louder:** a battle is otherwise invisible in normal play today. War news is built from debug traces (THR-1564, filed today), so this line is currently the only mark a battle leaves that the player can read.
- **It stays quiet:** battles are rare, and a lair needs three fights inside ten days.
- **When war news ships, this goes back down** (§ Kill criteria).

### Debug inspection (DebugPanel)

- `getLocationTraits` (debug bridge) and CLI `traits` report each marked place's current `bloodshed`.
- A new debug accessor, `getBattleRecords(locationId?)`, lists the `battle_fought` and `fight_fought` records (and their `occurred_at` places), so the census and the executor can read them without traces.

### Visual presence (HexMapV2)

N/A. Location traits have no hex-map signifier today, and this plan does not add one.

## Wiring

Checked against `Docs/plans/wiring-checklist.md`: every module below names its orchestrator phase, UI surface, GameState field, trace and debug visibility.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `recordBattleFought` (`battleResolution.ts`) | `battle_tick` (2.357) | place MEMORY | `event` node + `occurred_at`; `lastBattleTick` on the Location | `battle.recorded` (below) | `getBattleRecords` |
| `recordFightFought` (dispatcher branch, slice 2) | fight resolution | place MEMORY | `event` node + `occurred_at`; `lastFightTick` | `fight.recorded` | `getBattleRecords` |
| the *Blood-soaked* rule (`phaseLocationTraits.ts`) | location traits (6.6385) | LocationProfileModal conditions row | `has_trait` edge; `locationTraitSustain.bloodSoaked` | the existing `location_trait` aggregate, with `input: 'bloodshed'` | `getLocationTraits`, CLI `traits` |
| `placeMemoryResolver` | render time | place detail page | reads records | — | — |

**Player controls:** none. The player reads the word and the memory; nothing new is clicked.

**Prose:**
- `recordBattleFought` and `recordFightFought` write the record summaries at record time, from the tables above.
- The mint line uses phaseLocationTraits' existing chronicle template with the trait's display name.
- Place MEMORY renders the record's summary with its day.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `BLOOD_SOAKED_WINDOW_TICKS` | `120` | How long bloodshed counts: ten days. The ground stays soaked that long after the last battle |
| `BLOOD_SOAKED_BATTLE_WEIGHT` | `1.0` | A battle's share of bloodshed |
| `BLOOD_SOAKED_FIGHT_WEIGHT` | `0.34` | A fight's share: three fights ≈ one battle |
| `BLOOD_SOAKED_ENTER` | `1.0` | Bloodshed at which the trait mints |
| `BLOOD_SOAKED_RELEASE` | `0.5` | Bloodshed below which it lifts (hysteresis: one fight left in the window lifts it) |
| `BLOOD_SOAKED_SUSTAIN_TICKS` | `1` | The rule's own sustain; the window already prevents flicker |
| `BLOOD_SOAKED_CHRONICLE_SIGNIFICANCE` | `0.85` | The mint line reaches the chronicle (threshold 0.8), set on the rule's `chronicleSignificance` |

## Kill criteria

- **Rarer than assumed.** If `census:location-traits` reads UNMINTED for `blood_soaked` on both seeds at 200 ticks after S1, battles are rarer than the window assumes. Widen `BLOOD_SOAKED_WINDOW_TICKS` or lower `BLOOD_SOAKED_ENTER`, and report the census in the PR.
- **Too common.** If more than a quarter of a world's settlements carry it at once, the weights are too generous. Tune the constants before closing.
- **Too costly.** If tick cost rises more than 2% at medium, the stamp gate is not doing its job. Profile the rule before closing.
- **War news lands (revisit, not kill).** When THR-1564 ships battle lines built from state, a battle would reach the chronicle twice. THR-1564's executor sets `chronicleSignificance` back to `LOCATION_TRAIT_EVENT_SIGNIFICANCE` in the same PR. This is recorded on THR-1564 too.

## Tracing

```ts
// battle.recorded — emitted when resolveBattle writes a battle record (or fails to)
interface BattleRecordedTrace extends TraceBase {
  category: 'battle.recorded';
  battleId: string;
  eventId?: string;          // absent when the write failed
  locationId?: string;
  resolutionType: BattleResolutionType;
  severity: DestructionSeverity | null;
  error?: string;
}

// fight.recorded — emitted by the fight-record branch (slice 2)
interface FightRecordedTrace extends TraceBase {
  category: 'fight.recorded';
  actionId: string;
  eventId?: string;
  locationId?: string;
  skipped?: 'no_exchanges' | 'no_place';
  error?: string;
}
```

The existing `location_trait` aggregate trace's `input` union gains `'bloodshed'`. Traces are the debug layer; **nothing player-facing reads them** (the lesson of THR-1564).

## Fail-soft table

| Failure case | Fallback |
|---|---|
| The battle node has no `located_at` edge (field battle) | No record; traced `error: 'no_place'`. The battle resolves as today |
| A siege's `settlementId` names a node that is gone | Fall back to the battle node's `located_at` target; if that is gone too, `no_place` as above |
| The place resolves to a node that is gone | No `occurred_at` and no stamp; the record is still written (history without a place), traced |
| A commander was removed by the aftermath | No `participated_in` for them; the summary still names the sides |
| `recordFightFought` throws | Caught inside the branch and traced; the dispatcher's other branches still run |
| Stamps are missing (a place that never saw a battle, or an old save) | `readBloodshed` returns `null`: the rule is skipped and no counter is written. Nothing is backfilled |
| A record node exists with no `occurred_at` | The rule never sees it (it walks the place's edges); the place memory ignores it |

## Interface impact

| Contract | Change |
|---|---|
| **add** `battles-leave-a-record-on-the-ground` | Writer: `resolveBattle` → `battle_fought` + `occurred_at`. Readers: the *Blood-soaked* rule, place MEMORY |
| **add** `fights-leave-a-record-on-the-ground` (slice 2) | Writer: the dispatcher branch. Readers: the same |
| `location-traits-shift-encounter-pool` (`scripts/interface-contracts.ts:428`, THR-790) | **extend**: a fifth trait row in the pool table |
| `location-condition-taxes-movement-and-gates-templates` (`scripts/interface-contracts.ts:2179`) | **extend**: a fifth trait row in the movement-tax table |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/trace.ts` | 135 importers (`.codesight/graph.md:15`, 2026-09-24) | two trace members and one union member, all additive; `npm run check:typecheck` shows zero net-new errors |

`src/types/gameState.ts` is untouched: records live on the graph, stamps on nodes.

## Three-pillar check

- [x] Engine pillar: two record writers, the stamps, the rule and its three optional fields.
- [x] Content pillar: the definition, the table rows, the record summaries, the mint line.
- [x] UI pillar: the location page and place MEMORY read the new state through existing surfaces (browser-verify exempt, with reason; the MEMORY line is proved at the resolver).
- [x] Wiring connects them.

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `00-north-star.md:43`, *"a story the player can tell in prose"*: a player can now say where the war was fought, because the place says so.
  - `00-north-star.md:57`, *"consequences that do not reverse"*: the battle's record is permanent. Only the word fades; the memory stays.
  - `02-non-negotiables.md:23`, narrative over mechanical perfection: the word waited for an honest source rather than being faked from `deathCount`.
- [x] **Design tension #2** (`03-design-tensions.md:23`, systemic emergence vs authored moments): a systemic mark with authored words. The pool rows let authored scenes about loss find the battlefield.

## Rulebook impact

- [x] **A rule of play changes.** `Docs/canon/rulebook.md:421` currently ends *"No blood-soaked — there is no per-place battle record…"*. That sentence becomes: *"Ground where a battle was fought, or where blood was spilled again and again, turns **Blood-soaked**: travellers go around it, and talk of loss and violence gathers there, until ten days have passed without more."* It is tagged `[IMPL]` with slice 1, and slice 2 adds "or fights".
- [x] UL **Location Trait** (`Docs/ubiquitous-language/Traits.md:45`) adds *Blood-soaked* to the minted list, with its cause.

> Brainstorm companion: `Docs/plans/2026-09-24-thr-1528-blood-soaked-ground-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Seven named constants, each with a seam: the window, weights and thresholds in the rule, the sustain and the chronicle significance through the rule's own optional fields |
| 2. Inspectability | PASS | Two record traces, the rule's existing aggregate, `getBattleRecords`, CLI `traits` |
| 3. Determinism | PASS | No draws; ids derive from battle and action ids; the rule is arithmetic |
| 4. Fail-soft | PASS | See the table; every writer is wrapped and traced, and the rule reads 0 on missing data |
| 5. Narrative over mechanical perfection | PASS | The word waited for an honest source; the place remembers the siege by name; mutual destruction is never told as a victory |
| 6. Additive over destructive | PASS | Two event types, three optional rule fields, a summary return on a void function; the four rules unchanged |
| 7. Performance budget | PASS | The stamps gate the rule to O(1) for every place without recent bloodshed; the edge walk runs only at the handful of recent battlefields |

## Slices

| Slice | Scope | Blocked by | Done-when |
|---|---|---|---|
| **S1: Battles** (this issue) | §1, §3, §4; the definition, rows, summaries, mint line, place MEMORY, `getBattleRecords`, registry, canon and UL | none (THR-1563 merged 2026-09-24) | see § Done when |
| **S2: Fights** (THR-1574) | §2; the fight weight | S1; FB7 (THR-1543: `spawnFight` and the first fight template) | **Tests:** a fight with at least one exchange writes one record (not two); a no-roll end and a zero-clash rout write none; the branch never throws into the dispatcher. **CLI:** three `spawn fight`s at one place inside the window mint *Blood-soaked* there, and one does not |

## Done when

- [ ] **S1 tests:**
  - **One record each, at the right place.** A won siege, a failed siege, a field battle, a stalemate and a mutual destruction each write one `battle_fought` record at the right outer-tier place, with `lastBattleTick` stamped. A siege records at its town even when its node sits on another node.
  - **Written before the removal.** The record exists before the battle node is removed.
  - **Outcomes follow the table.** Each `participated_in` edge's `outcome` matches the table in §1. A mutual destruction's summary and edges name no victor.
  - **Commanders.** A commander removed by the aftermath gets no edge; a commander retained as deceased (fixture: node present, marked dead) does.
  - **The falsifier.** A place with 20 deaths and no record never mints.
  - **Minting and lifting.** One battle mints on the next traits pass, and the trait lifts once the battle is `BLOOD_SOAKED_WINDOW_TICKS` old.
  - **The four rules unchanged.** They behave byte for byte as today (fixture world), including their 0.4 mint significance, and the new mint line is written at 0.85.
  - **Place MEMORY.** A sieged town's detail page (`detailPageGenerator`) carries the siege sentence in MEMORY inside the window, and today's line outside it.
- [ ] **S1 CLI:** seed 42 medium, 200 ticks.
  - `getBattleRecords` lists every battle the run resolves.
  - The Crystalspire siege (tick ~158 on this seed) leaves Crystalspire standing and *Blood-soaked*.
  - `npm run census:location-traits` (seeds 42 and 99) reports `blood_soaked` with its verdict, read against § Kill criteria.
- [ ] **Every gate:** `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke. `Browser-verify exempt: no src/components change; the location page and detail page render through existing code, and the MEMORY line is asserted at the resolver`.
- [ ] **Wiki pages** the blocking `check:wiki-freshness:blocking` gate owes, because their `sources` in `public/wiki-manifest.json` match files this slice edits:
  - `armies-battles-reference` (`battleResolution.ts`, `battleAftermath.ts`): the battle record and where it lands;
  - `traits-marks-reference` (`condition-trait-content.ts`): *Blood-soaked*, what it does and how it lifts;
  - `world-objects` (`world-objects.ts`): the two new event types.
- [ ] **Registry, canon, UL, rulebook and interface map:**
  - `EVENT_TYPES` and the Event row's writers;
  - the Event row note in `Docs/canon/world-objects.md`;
  - UL `Location Trait` in `Traits.md`;
  - the rulebook sentence at `:421`;
  - the two added and two extended interface-map rows.
- [ ] S2 closed by its own PR with its evidence above.
- [ ] The close keyword for each issue, alone on its own line, in its closing commit body and PR body.

## Coordination block

**Suggested model:** opus. The record writer sits inside battle resolution, and the rule change must leave four live rules untouched.

**Parallel-safe with:**
- THR-1523, THR-1526 and THR-1562: disjoint files.
- the Physical Conflict slices other than the dispatcher's users (S2 only): disjoint files, except `src/types/trace.ts` (union members only; keep both on conflict).

**Mutex with:**
- **THR-1566** (a killed commander is kept as deceased): both edit `src/engine/battleAftermath.ts`. Either order works: before THR-1566 a killed commander gets no edge (the fail-soft row); after it, they get one.
- **THR-1564** (war news from state): both edit `src/engine/battleResolution.ts`. It will read the `battle_fought` record for its battle lines, and it owns lowering the chronicle significance (§ Kill criteria). Run it after S1.
- **S2 only:** D1, D2, M3 and E2 (THR-1548, THR-1549, THR-1546, THR-1557) each register a branch in `FIGHT_END_BRANCHES` (`src/engine/fights/fightOutcome.ts`). Run them in sequence; S2's branch goes **first** in the list.
- any slice editing `src/engine/phaseLocationTraits.ts` or `src/data/location-trait-constants.ts`.

**Files to touch:** S1 first; S2 is listed after it.

**S1:**
- Edit:
  - `src/engine/battleResolution.ts` (`recordBattleFought`, the call before the node's removal, the commander capture)
  - `src/engine/battleAftermath.ts` (the summary return)
  - `src/engine/phaseLocationTraits.ts` (the three optional rule fields, the fifth rule, `readBloodshed`)
  - `src/data/location-trait-constants.ts` (ids, constants, pool rows, `LocationTraitInput`)
  - `src/data/condition-trait-content.ts` (definition, tax row)
  - `src/engine/detailPageResolvers.ts` (place MEMORY)
  - `src/data/world-objects.ts` (`EVENT_TYPES`, Event writers)
  - `src/types/trace.ts`
  - `src/debug-bridge.ts`/`.d.ts` (`getBattleRecords`)
  - `scripts/cli.ts` (`traits` prints bloodshed)
- Tests:
  - `src/engine/__tests__/phaseLocationTraits.test.ts`
  - `battleAftermath.test.ts`
  - `battleResolution.test.ts`
  - `locationTraitBonus.test.ts`
  - `src/engine/__tests__/detailPageGenerator.test.ts` (the place MEMORY line, through the generator)
- Docs:
  - `Docs/canon/rulebook.md`
  - `Docs/ubiquitous-language/Traits.md`
  - `Docs/canon/world-objects.md`
  - `Docs/canon/interface-map.md` + `scripts/interface-contracts.ts`

**S2:**
- Edit:
  - `src/engine/fights/fightOutcome.ts` (register the branch)
  - new `src/engine/fights/fightRecord.ts`
  - `src/data/world-objects.ts` (Event writers)
  - `src/types/trace.ts`
- Tests:
  - `src/engine/fights/__tests__/fightRecord.test.ts`

## Notes for the executor

- **Write the battle record before `graph.removeNode(battleNodeId)`.** After it, the battle's `located_at` edge is gone, and with it the only honest answer to "where was this field battle fought".
- **A siege records at its town** (`bs.settlementId`), not at the siege node's `located_at`.
- **Read `outcome` from `resolutionType`**, never from the aftermath's winner: the aftermath counts a mutual destruction as a defender win.
- **Resolve to the outer tier** (`resolveToParentLocation`). `deathCount` is written to the raw position, which is why deaths in a Place never reach the town's *Haunted* check. Do not repeat that.
- **Do not read `deathCount`.** The ticket's falsifier exists to stop exactly that.
- **Record one fight per fight.** A duel has two sides but one fight.
- **Killed commanders:** today the aftermath removes them outright (`battleAftermath.ts:646-647`, bypassing `markMortalDead`). THR-1566 keeps them as deceased. Write the edge whenever the node is present after the aftermath; the test covers both states, so the writer needs no change when THR-1566 lands.
- **War news reads traces today** (THR-1564). Do not route anything player-facing through the new traces. The record is state, and state is what surfaces read.

## Intent-judge verdict

*Two passes, 2026-09-24.*

- **First pass: Revise.** Five required findings and six advisory. All eleven are applied; the proposal's revision notes list them (F1–F11).
- **Second pass: Allow.** Impact class Reversible. Two GAPs and five advisories, all applied before commit:
  - **The chronicle revert has an owner.** The note is posted on THR-1564: its executor sets `chronicleSignificance` back to 0.4 in the same PR.
  - **`readBloodshed` returns `null` when a place carries no stamps**, so the rule is skipped and no counter is written. It returns `0` only for stamps outside the window.
  - **Small corrections:** the `battleType` union (`'field_battle' | 'siege'`); the "army gone" label on `battleResolution.ts:298-303`; `02-non-negotiables.md:23`.
  - **S2 is named:** THR-1574.
  - **The place MEMORY resolver** must walk `occurred_at` itself, because `getLocationEncounterHistory` filters to `encounter_outcome`.
- **Added after the pass:** the three wiki pages the blocking freshness gate owes (`armies-battles-reference`, `traits-marks-reference`, `world-objects`).

## Forked-audit verdicts

*Generated by design-audit-pipeline, 2026-09-24.*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table: 7 named constants (`BLOOD_SOAKED_WINDOW_TICKS`, weights, `_ENTER`, `_RELEASE`, `_SUSTAIN_TICKS`, `_CHRONICLE_SIGNIFICANCE`), each with a stated purpose/seam |
| 2. Inspectability | PASS | Wiring table maps each module to phase/UI/GameState/trace/debug column, matching `wiring-checklist.md`'s established shape; two new trace categories (`battle.recorded`, `fight.recorded`) with full interfaces; new `getBattleRecords` debug accessor + CLI `traits` |
| 3. Determinism | PASS | "PRNG callouts: None" — record ids derive from existing battle/action ids; rule is pure arithmetic over a time window, no draws |
| 4. Fail-soft | PASS | Explicit 7-row Fail-soft table (missing `located_at`, dead settlement, dead place, removed commander, branch throw, missing stamps, orphaned record); writers wrapped try/catch and traced, mirroring the `writeAppointmentEvent` precedent |
| 5. Narrative over mechanical | PASS | Word is minted only from real battle/fight records, explicitly refusing the `deathCount` shortcut THR-790 rejected; mutual destruction's outcome table names no victor, honoring the "call a plague a massacre" concern |
| 6. Additive over destructive | PASS | Two new `eventType` values (no new node/edge types); three new *optional* `LocationTraitRule` fields; `applyAftermath` gains a return value on a previously-`void` function with one ignoring caller; the four existing trait rules are pinned byte-for-byte unchanged in Done-when |
| 7. Performance budget | PASS-with-note | Per-place stamps gate the rule to O(1) for untouched places (§3), and a Kill-criterion checks tick cost (>2% at medium) — but this is a reactive gate at closeout rather than upfront profiling before the design was finalized; acceptable given the O(1)-by-construction argument, hence the note rather than a fail |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, Graph nodes/edges, Tick phases, Resolution logic, PRNG callouts all filled with concrete line-anchored detail (e.g. `battleResolution.ts:502`, `phaseLocationTraits.ts:181-183`) |
| Content | present-and-substantive | Encounter templates (N/A rationale inline), Prose tables, Attachment content, Data tables all filled with actual copy and table rows |
| UI | present-and-substantive | Player-facing display, Event notifications, Debug inspection filled; Visual presence explicitly N/A with one-line rationale (no hex-map signifier for location traits today) |

No missing required sections.

**Wiring check:** Present and complete — the Wiring table uses the exact template column set (Module / Orchestrator phase / UI component / GameState field / Trace emitted / Debug visibility) and names a phase, component, field, trace, and debug surface for all four rows; Player controls and Prose sub-notes are also filled.

**Substrate-existence check:** PASS. The plan opens with `## Substrate inventory` before the Engine pillar, listing six existing subsystems each marked ACTIVE with an explicit "extends" disposition and line-anchored citations. Cross-checked against `Docs/canon/systems-inventory.md`: "War, Armies & Battles" (tick phases 2.352-2.358) and "Location Traits" (6.6385, THR-790) both match the plan's citations exactly. No green-field duplication — the plan adds two `event`-node subtypes and a fifth trait rule to catalogs that already exist, not a new system.

`PILLAR AUDIT: PASS`

### Vision audit

**1. Vision premises touched**
- `00-north-star.md` → "a story the player can tell in prose" (line 43) — confirmed. → "consequences that do not reverse" (line 57) — confirmed (permanent battle record; only the word fades).
- `01-core-loop.md` → not referenced (no scan/encounter/aftermath rhythm change).
- `02-non-negotiables.md` → "narrative over mechanical perfection" (item 2) — confirmed (declined to fake the trait from `deathCount`). → "everything is a graph node/edge" (item 4) — confirmed (event nodes + `occurred_at`/`participated_in` edges; faction identity deliberately kept off properties). → "player is a god, not a protagonist" (item 1) — silent (no player-control surface added).
- `03-design-tensions.md` → tension #2, systemic emergence vs. authored moments (line 23) — confirmed and self-cited; systemic record, authored summary/mint lines.
- `taste-profile.md` → "Numbers in UI" anti-pattern — confirmed (Law 13, bloodshed never shown). → "graph edges, not property-bag relationships" — confirmed. → "austere, Malazan-adjacent voice" — plausibly confirmed by the drafted summary lines (plain, narrator-mode, no lyricism); not independently scored here.
- `Docs/design-brief.md` § Vision summary → principle 3 (prose carries narrative, UI carries status) and principle 6 (content is design) — confirmed.

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- North star: yes — adds a permanent, readable trace of consequence the player can narrate later.
- Core loop: preserved — no change to scan/encounter/aftermath; this is background world-state texture.
- Non-negotiables: stays inside — no direct-control surface, graph-edge discipline honored throughout.
- Design tensions: leans on #2 deliberately and evenly — systemic trigger, authored words, counter-pull (authored prose tables) present.
- Taste profile: respects no-numbers and graph-edge rules; prose examples read plain/narrator-mode, consistent with the register bar.

**VISION AUDIT: PASS**

**Author's response to the notes:** NFP #7's note is the design, not an omission. The up-front argument is the O(1) stamp gate. The kill criterion (more than 2% tick cost at medium) is the measurement that checks it, at closeout, on a real world.
