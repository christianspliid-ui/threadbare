> **title:** The fight block — clock-and-consequence fights on the unified road (Physical Conflict plan doc 2 of 6)
> **linear_issue:** THR-1258 (wayfinder map, closed 2026-09-23; slices filed on handoff)
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `done` · Content `done` · UI `debug surfaces here; the player-facing fight surface is plan doc 4 (see § UI pillar)`

# The fight block — clock-and-consequence fights on the unified road

*A fight is a short sequence of ordinary encounter steps that the engine knows how to run as a fight: rated against its opponent, wearing it down on a clock that persists, hurting the mortal in the currency they already have, and deciding at runtime whether they stand or yield.*

## Why this is load-bearing

Threadbare has wars, company skirmishes and encounter prose about combat, but no individual fight: a mortal cannot face a beast, wound it, be wounded, and leave marks in the world. The Physical Conflict wayfinder map (THR-1258) walked that route and closed on 2026-09-23 with every decision recorded. This doc is the engine core the other five plan docs stand on: monsters (3), defeat and marks (1), the on-screen surface (4), mortal duels (5) and hunts (6) all read the `fightRole` steps, the `fightState` and the clock this doc defines. **It must also be spell-ready:** Christian's condition on the direction (THR-1263) was that spells, items, monster powers and cards all act on a fight through *one* effect vocabulary, never a parallel combat-ability system (THR-1530).

Every rule below carries the decision ticket it comes from, inline. The settled inputs are:
- the charter (map Notes, 2026-08-26);
- the direction (THR-1263);
- the numbers (THR-1531);
- the contract (THR-1269);
- the effect-vocabulary research (THR-1530);
- the event table (THR-1265);
- edges from the world (THR-1532);
- allies (THR-1271).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `encounter`: unified road (`resolveUncontestedStep`, `executeStepResult`, `advanceStep`; and its band-opposition branch, `phaseUnifiedActionProgress` → `collectBandOppositions`, `groups/bandOpposition.ts:283-302`, THR-731) | 🟢 ACTIVE | **extends**. Fight steps are ordinary steps with one marker; all additions are branches keyed on it (THR-1269 §2). **Band opposition never resolves a fight step** (FB1): `collectBandOppositions` today matches any company member on a hex with a foreign band, whatever the template, and would roll the fight step's placeholder difficulty on its authored reach through `contestation.ts` |
| Step resolution core (`stepResolutionCore.ts`, six-band ladder, scale floors) | 🟢 ACTIVE | **extends**. It gets a per-step scale for fight steps; the ladder is unchanged |
| `difficultyContext` enum (`'intel_sensitive' \| 'target_tier_scaled'`, `unifiedAction.ts:1889`) | 🟢 ACTIVE | **extends** with `'opponent_rated'`, the documented declarative pattern (`targetTierScaling.ts:18-34`) |
| Branch decisions (`decideBranchPole`, `readLiveAxisLean`, `sumHandLean` (`poleLean.ts:120`), `decideBranchPole` at `encounters/branchDecision.ts:146`) | 🟢 ACTIVE | **reuses** the pure decision function at runtime for the concession and temper forks; decisions are recorded in `fightState.forks`, not in `choiceHistory` (§6) |
| Choice memory + aftermath variants (`EncounterChoiceMemory`, `branchOnStep`; the hand's writer `recordUnifiedActionNudgeMemory`, `encounterChoiceMemory.ts:59`) | 🟢 ACTIVE | **reuses**. The fight **result** is one choice memory at an index no step owns (`fightResultIndex`, §6), so aftermath variants key on it without colliding with the card records the hand writes by step index |
| Resolution modifiers (`computeResolutionModifiers`, `resolutionModifiers.ts:680`; the effect modifier family via `resolveEffectModifiers`, `effectResolver.ts:308`) and the attended forecast (`buildNudgePhaseModel.ts:614-665`) | 🟢 ACTIVE | **reuses** for the fighter. The unified road's roll never reads these today (it sums push, the group bonus and nudges only, `unifiedActionResolution.ts:467-468`), while the forecast does. Fight steps read them through `resolveFightStepInputs` (§3b); the road-wide gap is THR-1535 |
| Attachments, Items & Possessions (items' `passive`/`conditional` effects, `in_combat`, stacks) | 🟢 ACTIVE | **reaches fights** through the fighter's standing modifiers (§3b) and the fight events (§9) |
| War, Armies & Battles (`Battle`, `battleState`, `Battle.momentum`) | 🟢 ACTIVE | **untouched**. Army battles are a separate system; `FightState.momentum` is a different field on a different type |
| Doom Clock & Journey | 🟢 ACTIVE | **untouched**. The fight clock is a separate thing; UL disambiguates *clock (fight)* |
| Quintessence settlement (`phaseQuintessence`, `computeScaledErosion`, ratio floor) | 🟢 ACTIVE | **extends**. A fight band table is added on the same formula, queued as `source:'fight_harm'`; `spell_price` is accumulated apart from harm so wards cover harm only (THR-1530 §3) |
| Conditions (`apply_condition` applier; `wounded`, `terrified`, `shaken`, `inspired` content) | 🟢 ACTIVE | **reuses**. Conditions land by band through the existing applier (tag immunity and the `damaged` proxy come free) |
| Effect events (`raiseEffectEvent`, `EffectEventSite`, reactive/stack triggers) | 🟢 ACTIVE (battle-only for combat events) | **extends** with fight raises plus two event variants (THR-1530 §4) |
| Generic effect vocabulary (`resource_manipulate`, predicates, executors) | 🟢 ACTIVE | **extends** with `'fight_clock'`, `clock_above:`, `inflict_condition` (THR-1530 §1, §5) |
| Complications (`complicationSelection.ts`, `applyComplicationEffects`) | 🟢 ACTIVE | **extends** with an `inFight` requirement, three fight effect types and 12 content entries (THR-1265) |
| Company queries (`getGroupOf`, `getGroupMembers`, `resolveLocationToHex`) + the unified road's group step (`resolveGroupStep`) | 🟢 ACTIVE (inventory badge 🟠, see note) | **composes** `getCompanyMembersAtHex` (THR-1271); fight steps **skip** the group step (§11) |
| Secrets & Favors (`knows_secret_of`, `owes_favor`; `redeemFavor` / `applyFavorRedemptionConsequences`, `isLiveFavorEdge`; the THR-30 reveal path) | 🟢 ACTIVE | **reuses** the existing spend paths for the secret and favour advantages (§11); no second spend path |
| Capability growth (`applyEncounterGrowth`) and artifact presence (`recordArtifactEncounterPresence`) | 🟢 ACTIVE on the unified road | **reused, with the resolved inputs.** Fights grow mortals and climb Storied arms for free (THR-1270), but on a fight step growth and every other post-roll reader take the step's **resolved** reach and difficulty, not the authored ones (§3c) |

**Badge note.** The generated inventory badges "Spheres & Quintessence" and "Companies & Group Travel" 🟠 DORMANT. Both are live on the paths this plan touches:
- quintessence settles every tick in `phaseQuintessence` (THR-1530 §3);
- companies form at 13–16 per seed by tick 120.

The DORMANT badge for Companies is the generator's tokeniser bug (THR-1259), and the inventory itself calls its badges a single-seed keyword heuristic.

Runtime population consumed:
- fight steps: none ship today;
- opponents: the lair elites (14–26 per medium world by mid-game, measured THR-1268) plus any actor a fight names;
- fighters: the ~21 deciding mortals per medium world, plus unthreaded mortals via systemic triggers (plan doc 3).

## Engine pillar

The work is split into seven slices (FB1–FB7, § Slices). The design first.

### Systems design

**1. The marker (THR-1269 §1–2).** `ActionStep` gains two additive optional fields:
- `fightRole?: 'nerve' | 'clash'`;
- `opponentRef?: string`, a cast key resolved like `StepNudge.opposes`: `resolveOpposedCastNodeId(step.opponentRef, action.supportBindings)`.
  - **When `opponentRef` is set, it must bind.** An unbound ref, or one bound to a deceased node, does **not** fall back to the action's target. The block ends at its first fight step, `broke_off` with `endReason: 'no_opponent'` (or `'opponent_gone'` for a deceased one), with no roll. **That step records no `StepOutcome`.** `advanceStep` always appends the step's outcome (`unifiedActionLifecycle.ts:175`), and `executeStepResult` runs the consequence (`unifiedActionResolution.ts:1681`) and growth (`:1775`) before it, so the check cannot live there. The check runs at the **start of `resolveUncontestedStep`**, before any roll. A hunt that fought "the lair" instead of its beast is the failure this rule prevents (plan doc 3 §4).

**The no-roll end is a route through the resolution tail, not around it** (FB2). `resolveUncontestedStep` returns a `StepResolutionResult`, never an action, and the phase loop always hands that result to `executeStepResult` (`unifiedActionResolution.ts:3091-3127`). So:
- `StepResolutionResult` gains an optional `fightEnd?: { reason: 'no_opponent' | 'opponent_gone' | 'separated' }`. `resolveUncontestedStep` returns early with it (its required band fields hold inert zeros that nothing on this route reads);
- the phase loop passes it on inside the `resolutionStats` argument it already builds (`:3094`, `:3126`), beside §3c's `reach` and `difficulty`;
- `executeStepResult` takes a **no-roll branch** when `resolutionStats?.fightEnd` is set. The branch **skips** everything that presumes a roll: the clearance gate, ops, the consequence and its complication, growth and tier promotion, decided branches, the `StepOutcome` append (`advanceStep` is not called), step prose, charges and step telemetry. It **sets** `fightState.result = 'broke_off'` with the `endReason`, marks the action resolved with `FIGHT_RESULT_ACTION_OUTCOME.broke_off`, and writes the result memory. It **still runs** the tail: `onFightEnded` (with its `FightEndContext`) and `fight.end`, `combat_ended` when `combat_started` was raised (a mid-fight end), the action triggers (on the mapped outcome, §6), the aftermath (which reads `fight:broke_off`), the resolved tick event (with no consequence terms: no `significanceBoost`, no quintessence suffix, no `narrativeTag`), the resolution telemetry (ACTION_END, `action_resolved` and `encounter_resolved`, `:2232-2287`: a fight that ended without a roll **is** an encounter resolved, and its chapter is archived), the event node (recording the mapped outcome) and its `caused_by` edge. It also **skips** the success-keyed faction block (faction reputation, the reputation tally and chain completion, `:1981-2015`, which read `isStepSuccess(outcome)`) and the `action_execution` trace (`:2147`, which reports ops). In the guard form, `aftermathChanges` and `supersededGrowthIds` (declared mid-block, `:2017`, `:2051`) are hoisted above the guard;
- the executor may implement the branch as a guard around the roll-dependent block or by extracting the tail into a helper both routes call. Either way, the list above is the contract.

Plan docs 3 and 6 depend on this route: a hunt whose beast died, or whose hunter left, must still reach its aftermath.
  - Only a step **without** `opponentRef` takes the action's target as its opponent, as `fight.lair.confront` does.
  - **Whatever the source, an opponent that is the fighter themself, or is deceased or missing, ends the block the same way** (`no_opponent` / `opponent_gone`, no roll). **The same check runs before every later fight step:** an opponent who has died since ends the fight `opponent_gone`, and one who no longer shares the fighter's hex ends it `separated`, both through the no-roll route. A seed whose inherited target died falls back to self-target (`unifiedAction.ts:1401`), and plan doc 6's hunt appointment relies on this rule never letting a fighter face themself.

Every fight behaviour below is **engine logic keyed on `fightRole`**; authors write no fight effects.

**2. The opponent card.** `readOpponentCard(graph, opponentId, tick): OpponentCard` returns:
- the monster's `monsterState` when present (populated by plan doc 3; until then no node carries it);
- otherwise a **derived card** for a mortal opponent (NPC mode's "non-graduated agents"):
  - Might is a word from the opponent's **raw** clash-reach score (`FIGHT_DERIVED_MIGHT_BANDS`: raw ≥ 30 severe, ≥ 22 steep, ≥ 15 fair, else gentle; THR-1264). Raw is used because capability saturates near 1.0;
  - Dread is `FIGHT_DERIVED_DREAD_OFFSET` (−1) words from Might, and `FIGHT_FAME_DREAD_STEP` (+1) harder for a famous opponent (§11).
- A missing node falls back to `FIGHT_DEFAULT_CARD` (fair, fair, clock 3).

```ts
type FightRatingWord = 'gentle' | 'fair' | 'steep' | 'severe';
interface OpponentCard {
  readonly opponentId: string | null;
  readonly dread: FightRatingWord;
  readonly might: FightRatingWord;
  readonly nerveReach?: ReachDomain;   // runtime override of the authored nerve reach
  readonly clashReach?: ReachDomain;   // runtime override of the authored clash reach
  readonly clockSize: number;
  readonly clockFilled: number;        // after lazy recovery, at read time
  readonly temper: 'stubborn' | 'berserk' | 'skittish' | 'bargainer'; // from the opponent's trait.temper.* tag; default stubborn
  readonly persistent: boolean;        // true when the clock lives on the node (monsters); false = per-fight (mortals)
}
```

**3. Difficulty, scale and reach for a fight step** (THR-1269 §2, THR-1531). In `resolveUncontestedStep`, a step with `fightRole`:
- **Difficulty:** reads `FIGHT_RATING_DIFFICULTY[card.dread]` for nerve and `[card.might]` for clash. That is the implied `difficultyContext:'opponent_rated'`, read at the site where `'target_tier_scaled'` is read (`unifiedActionResolution.ts:~323-375`). The opponent's own `passive`/`conditional` modifiers for that reach are then folded in as a difficulty delta via `resolveEffectModifiers(opponent, reach)`, so a monster's powers and gear price the step (THR-1530 §5). A berserk fight adds `FIGHT_BERSERK_MIGHT_DELTA` to clash difficulty.
- **Scale:** resolves at `FIGHT_STEP_SCALE = 'regional'` whatever the template's scale. Scale is read at `:487`, `:514` and `:1676` (`resolveCritFailureSeverity(template.scale)`). **All three** read `FIGHT_STEP_SCALE` on a fight step, so a fight's critical failure has the severity of the scale it resolved at. This is the single most important number: at `local` the 0.65 floor erases a monster's Might (THR-1531).
- **Reach:** the card's `nerveReach`/`clashReach` override the authored reach at runtime. Then the fighter's own `encounter_reach_override` effects apply, via a ported `readReachOverride` read placed **before** capability is computed. This fixes the legacy ordering bug THR-1530 found at `encounter.ts:402/409`.

**3b. One function derives a fight step's inputs, for the roll and for the forecast.** `resolveFightStepInputs(state, action, step): FightStepInputs` (new, `src/engine/fights/fightStepInputs.ts`) returns `{ reach, difficulty, scale, modifiers: NamedModifier[] }`:
- the reach after the override chain, the card-rated difficulty plus the opponent's delta, and `FIGHT_STEP_SCALE` (§3);
- **the combat context.** Every predicate context it builds carries `encounterType: 'combat'`, so `in_combat` and `combat_success` read "is a fight exchange" on every fight step, whatever its reach. `inCombat` today is `stepReach === 'iron' || encounterType === 'combat'` (`effectPredicates.ts:152`), and neither `computeResolutionModifiers` (`resolutionModifiers.ts:716`) nor the test-shaper context (`unifiedActionResolution.ts:392`) passes an encounter type. So FB1 gives `computeResolutionModifiers` an optional `encounterType` parameter, and passes `'combat'` there, into the test-shaper context and into the opponent's `resolveEffectModifiers` context. Otherwise an `in_combat` charm would do nothing on a clash whose reach the card overrides (the Hollow Choir's Eye) or on a Soulfire iron→star swap;
- **the fighter's own standing modifiers**, through `computeResolutionModifiers` (the call the attended forecast already makes), as a named term. This is how items, conditions and the effect modifier family (an `in_combat` charm, a Soulfire-style stack earned on the last exchange, a future spell's buff) reach a fight roll, mirroring the opponent's `resolveEffectModifiers` delta. Without it the fighter's gear would be inert on the unified road;
- courage and momentum (FB3), then advantages and allies (FB7), each a named term.

**Before `fightState` exists.** The first fight step is the nerve step, and `fightState` is created only after it resolves. So when `action.fightState` is absent, `resolveFightStepInputs` reads the card (with lazy recovery) and, from FB7, `readFightAdvantages` **directly**; `executeStepResult` then persists the same values into the new `fightState`. That is what lets the nerve-only advantages (Storied arms, Blessed) move the nerve roll and its forecast at all.

**`resolveFightStepInputs` and `readFightAdvantages` are pure reads.** The attended forecast calls them from the UI (`buildNudgePhaseModel.ts:486-489`: "it runs in the UI"), so neither may write anything. Spending happens only in the fight handler inside `executeStepResult` (§11): the favour when the handler creates `fightState`, the secret after the clash it applied to. A forecast drawn ten times redeems nothing.

`resolveUncontestedStep` calls it for every fight step. **The attended forecast calls it too** when `step.fightRole` is set (`buildNudgePhaseModel.ts:614-665`, wired in FB7 when the first fight template exists), and **the forecast applies the same scale step the core does.** `ResolutionInput` has no scale (`src/types/resolution.ts:20-45`), and `forecastAction` only clamps to [0.05, 0.95] (`resolutionService.ts:97-102`), while the roll applies `applyScaleDifficultyAdjust` and the scale's floor inside the core (`stepResolutionCore.ts:221, :254`). So FB7 carries the fight scale on the phase model and applies the exported, pure `applyScaleDifficultyAdjust` (`resolutionScaleAdjust.ts:106`) inside `forecastWithNudges` (`useNudgeHand.ts:36-54`), after the selected cards' deltas are summed, because the floor depends on which cards are chosen. **Then it applies the core's post-roll floor**, `max(P, MIN_PROBABILITY_BY_SCALE[FIGHT_STEP_SCALE])` (`stepResolutionCore.ts:254-265`). `applyScaleDifficultyAdjust` reproduces the floor only when capability plus modifiers already sits at or above it (`resolutionScaleAdjust.ts:131`); below it, the core raises the probability after the roll, and a sub-floor fighter's forecast must show that raised number. Only then are **the odds the player is shown the odds rolled** (THR-1532: "the player sees exactly why the odds are what they are"). THR-1531's Hollow Choir shows the size of the error this closes: a Veil nerve step forecast from Heart would read favourable while the roll sat at the 20% floor.

The same gap exists road-wide (every unified-road step: the forecast adds standing modifiers and the roll does not). That is filed as its own bug ticket, THR-1535 (held for review, because it moves the odds on every step). When it lands, the fighter's standing term here becomes the general one and the fight-only branch is deleted. The forecast's missing scale floor is the same road-wide gap (no `local` step's 0.65 floor reaches the forecast either), recorded on THR-1535.

**3c. The resolved inputs outlive the roll.** The phase loop builds `executeStepResult`'s `resolutionStats` argument (`{ capability, probability, roll }` today) from the `StepResolutionResult` that `resolveUncontestedStep` returns (`:3094`, `:3126`). Both gain two optional fields, `reach` and `difficulty`, filled on fight steps from `resolveFightStepInputs`, and the loop passes them on (with §1's `fightEnd`). Every post-roll reader that today reads `step.reach` or `step.difficulty` reads `resolutionStats?.reach ?? step.reach` (and the same for difficulty) instead:
- capability growth (`unifiedActionResolution.ts:1772-1778`);
- tier promotion, its event and its telemetry (`:1799`, `:1816`, `:1830-1831`);
- consumable charges (`:2177`);
- the frozen step-prose record and its trace (`:1942`, `:1947`, `:1967`);
- timeline and balance telemetry (`:2197-2198`, `:2221-2222`);
- the event node's `stepReach` (`:2630`), which becomes the node's `reachTested` that ambition minting reads (`ambitionTick.ts:398, :429`).

FB5's `encounter_outcome { reach }` raise carries the resolved reach too. **The past-step labels read it back:** Scene So Far (`buildUnifiedEncounterStageModel.ts:441-443, :487`) and the chapter archive (`chapterArchive.ts:201`) label a resolved step by its authored reach today; FB7 switches both to the frozen `StepProseRecord.reach`. So a clash whose card overrides the reach to Eye grows Eye, spends an Eye consumable's charge, and is recorded as an Eye step. The fields are optional, so non-fight steps are untouched (and THR-1535 can reuse them road-wide).

**4. Action-local state** (THR-1269 §3). `UnifiedAction` gains the additive optional `fightState?: FightState`, a sibling of `clearanceGateIds`/`supportBindings`:

```ts
interface FightState {
  readonly opponentId: string | null;
  readonly clockSize: number;
  readonly clockAtStart: number;       // after lazy recovery
  readonly clockNow: number;
  readonly persistent: boolean;
  readonly exchanges: number;          // clash steps resolved
  readonly harmTaken: number;          // quintessence ratio queued as fight_harm
  readonly wounds: number;             // wounding exchanges taken
  readonly blowsLanded: number;        // clashes whose clock delta was > 0
  readonly momentum: number;           // modifier carried into the next fight step
  readonly temperFired: boolean;
  readonly berserk: boolean;
  readonly advantages: readonly FightAdvantage[]; // read once at fight start (FB7)
  readonly result?: FightResult;
  readonly endReason?: 'opponent_gone' | 'separated' | 'no_opponent'; // why a broke_off ended early
  readonly forks: readonly FightFork[];    // runtime decisions; never written to choiceHistory (§6)
  readonly conditionsApplied: readonly string[]; // band conditions applied this fight (FB3), for plan doc 4's chips
  readonly storiedClimbs: readonly string[];     // artifact ids whose Storied level rose this fight (FB2), for plan doc 4's chips
  readonly ending?: FightEndingRecord;     // declared by FB2, written by plan doc 1's fighter branch
  readonly opponentEnding?: FightEndingRecord; // declared by FB2, written by plan doc 5's E2 (a duel's other side)
  readonly lairOutcome?: FightLairOutcome; // declared by FB2, written by plan doc 3's monster branch
}
// The ending's face, one member per distinct story (plan doc 1 keys its chronicle tier and line on it)
type FightEndingFace =
  | 'overcome_monster' | 'overcome_mortal' | 'driven_off' | 'bargained'
  | 'yielded_to_mortal' | 'yielded_to_monster' | 'routed' | 'broke_off'
  | 'mauled' | 'spared' | 'slain';
interface FightEndingRecord {
  readonly face: FightEndingFace; readonly scarWritten: boolean; readonly grudgeWritten: boolean;
  readonly humiliation?: { counterpartyId: string; delta: number };
  readonly reputation?: { counterpartyId: string; delta: number };
  readonly reward?: { templateId: string; instanceId: string; tier: number };
  readonly killRoll?: { chance: number; roll: number };
  readonly guard?: 'the_first' | 'avatar' | 'warded';
  readonly drift?: { axis: ValuePair; pole: 'positive' | 'negative' };
  readonly eventSignificance?: number;
}
interface FightLairOutcome { readonly lairId: string; readonly felled: boolean; readonly lairCleared: boolean; readonly clearingProgressAfter?: number; }
interface FightFork { readonly stepIndex: number; readonly kind: 'concession' | 'temper'; readonly choice: 'fight_on' | 'yield' | 'bargain' | 'refuse' | 'fled' | 'berserk' | 'none'; readonly side?: 'fighter' | 'opponent'; readonly decidedBy: 'conviction' | 'coin' | 'temper'; }
type FightResult = 'overcome' | 'driven_off' | 'bargained' | 'yielded' | 'broke_off' | 'routed' | 'struck_down';
interface FightAdvantage { readonly key: string; readonly label: string; readonly delta: number; readonly appliesTo: 'nerve' | 'clash' | 'first_behind_clash'; readonly spent?: boolean; readonly sourceId?: string; }
```

`fightState` is created at the block's first fight step and updated in `executeStepResult` after every fight step.

**Why `ending`, `lairOutcome`, `conditionsApplied` and `storiedClimbs` are declared here.** `storiedClimbs` is filled from the `climbed` result that `recordArtifactEncounterPresence` already returns at `unifiedActionResolution.ts:1788`, which fight steps record instead of discarding; `conditionsApplied` is filled by FB3's band conditions. The aftermath's consequence chips (plan doc 4) must be state-backed (Law 56), and traces are off unless tracing is enabled. So each ending writer records what it wrote on the resolved action. FB2 declares every ending record (`ending`, `opponentEnding`, `lairOutcome`), and plan docs 1, 3 and 5 fill them, so no ending slice widens `FightState`. Plan doc 5's E1 adds the agent-mode opponent-side fields (the opponent's clock, momentum, advantages, wounds and blows) as one additive block.

**5. The clock** (THR-1269 §2, THR-1268 §7, THR-1531).
- `advanceFightClock(graph, opponentId, delta, cause, tick)` is **the one clock writer**:
  - for a persistent card (a monster) it writes `monsterState.clockFilled`, clamps to `[0, clockSize]` and stamps `clockUpdatedTick`;
  - for a per-fight card, **band deltas** are applied to `fightState.clockNow` by the handler, which holds the action. **Only effect-path writes** (a spell, an item, a reactive trigger, which hold no action) go through the node mailbox below.
- **The clock-full check runs once per clash step, after everything that step can write** (FB2; FB5 and FB6 feed it). In order: (1) the band's landing write; (2) the step's effect events (§9), whose reactive triggers and items may write the clock through `advanceFightClock`; (3) the mailbox drain, for a per-fight clock; (4) the step complication's `fight_clock` (§12); then (5) the clock is re-read. If it is full, the opponent is alive, and **a blow landed this step** (the band's write, or any positive effect-path write against this opponent during this step), the fight ends `overcome`. So an item's `fight_clock +1` on `encounter_outcome` that fills the clock wins the wielder's fight in that step.
- **Precedence within one clash.** The clock-full check (`overcome`) runs first, then the temper checkpoint, then the concession fork, and **no fork runs once `fightState.result` is set**. Two collisions make the order matter: a `success_at_cost` clash can both fill the clock and wound, and a critical (+2) can both cross the half mark and fill a clock of 2 or 3. The fight that is won does not also yield or flee.
- **A full clock with nothing landed this step waits.** It falls to the next landing blow at any later clash. This covers a clock filled before the fight (the `spawnFight` preset, an effect between fights), by a third party mid-fight, or left full by a ward that stopped a death. If no blow lands by the last clash, the fight ends `broke_off`, and the full clock waits for whoever lands next.
- **Only death ends a fight as `opponent_gone`; a full clock never does.** A kill is claimed by the dispatcher's death write (plan doc 3's `markMortalDead`), so a second fight finds the opponent deceased at its next step. `filledByThisWrite` is kept on the `fight.clock` trace for inspection; no ending depends on it.
- The same writer backs the effect vocabulary's `resource_manipulate` `'fight_clock'` (FB6), so a spell or item and a clash land on one clock.
- **A per-fight clock has a mailbox on its node.** An effect executor or a reactive trigger holds only `{ casterId, tick, graph }` (`effectEventDispatch.ts:201`), never the action. So for a per-fight card, `advanceFightClock` writes the delta to the opponent node's transient `pendingFightClockDelta` property. **The handler drains it twice per step:** at the **start** of the step, for writes made between steps (by a third party; they count toward the clock but are not this step's blow), and at step (3) of the clock-full check below, for writes this step's own events made (they count as a blow landed this step). Each drain deletes the property. A new fight clears any stale value **before the nerve step's raises**, so a nerve-step write is never wiped as stale. **A complication's `fight_clock` on a per-fight clock writes `fightState.clockNow` directly**, because the handler holds the action; through the mailbox it would arrive after the drain and miss the re-read. That is how a spell or item reaches a mortal opponent's clock, and either side of a duel (plan doc 5). A persistent card (a monster) is written directly, as before.
- Clash band → delta is `FIGHT_CLOCK_BY_BAND`: critical success +2, success +1, near miss +1, at cost +1, failure 0, critical failure 0 (the fight ends as struck down).
- **Lazy recovery:** at fight start, `recovered = floor((tick − clockUpdatedTick) / FIGHT_CLOCK_RECOVERY_TICKS)` is subtracted before `clockAtStart` is recorded. There is no per-tick phase and so no per-tick cost. **`advanceFightClock` applies any pending recovery before its own delta**, because it stamps `clockUpdatedTick` on every write, and a write that skipped the recovery would erase it. `spawnFight`'s `clockFilled` preset, written while the game may be paused, calls `touchWorld` so the UI reads the new clock.
- **The per-node mailbox relies on one live fight per mortal opponent.** Every spawner honours that: plan doc 5 puts an unresolved fight's opponent in the decision phase's busy set, and this doc's and plan doc 3's triggers skip a busy mortal. Were two fights ever to share a mortal opponent anyway, the delta goes to whichever drains first, traced; that is a known limit, not a crash. Monsters keep a persistent clock and use no mailbox.

**6. Early end** (THR-1269 §5). `advanceStep` gains one additive branch: when `action.fightState?.result` is set, the action resolves early, like the natural final-step branch, **except that its final outcome is `FIGHT_RESULT_ACTION_OUTCOME[result]`**, not `computeFinalActionOutcome`. That function returns `success_at_cost` for any history containing a failure (`unifiedActionLifecycle.ts:303-308`), so a yield would read as a success to "after the fight" `action_trigger` items (THR-1530 §4c) and to the aftermath's band prose. `fightState.result` stays the full record; the mapping is what the rest of the game reads. The result is set as follows:
- **set by the fight handler:** `overcome` (clock full), `driven_off` / `bargained` (temper), `yielded` (concession), `broke_off` (the last clash resolved and the clock is not full);
- **existing path:** a critical failure already ends the action through the fail-action short-circuit, which runs **first** and returns `'critical_failure'` (`unifiedActionLifecycle.ts:179-182`). The handler records it as `routed` (nerve step) or `struck_down` (clash step), and both map to `critical_failure` in `FIGHT_RESULT_ACTION_OUTCOME`, because a rout is a critical failure. The fight's own early-end branch runs after that check and never overrides it.

**The action-trigger ladder reads the result too.** "After the fight" items do not read `action.outcome`: the trigger block feeds `ladderEventsFor` the **step** band (`unifiedActionResolution.ts:2319-2322`), and `success_at_cost` fires `['encounter_at_cost', 'encounter_success']` (`effects/actionTrigger.ts:89-91`). So a yield that followed an at-cost wound would fire success items. FB2 changes that one line: when `finalAction.fightState?.result` is set, the ladder is fed `FIGHT_RESULT_ACTION_OUTCOME[result]` instead of the step band.

**No step reward draw on a fight step.** `resolveUnifiedReward` (`:1975`) reads the resolved step's reward pool with the same step band. A fight's prize is plan doc 1's victory yield, drawn from the fight result, so FB7's catalog invariant rejects a step reward pool on any `fightRole` step.

**Where the fight handler sits in `executeStepResult`:** after the consequence and its complication are selected (`:1681`), and **before** growth (`:1770`) and `advanceStep` (`:1851`). That is what lets a complication's `fight_offer_quarter` or `fight_clock`, and the clock-full check, end the fight in the same step.

Every result is also written as **one** `EncounterChoiceMemory` `{ stepIndex: fightResultIndex(template.steps), stepId: 'fight', choiceId: 'fight:<result>', choiceText: <result word>, interventionType: 'fight', essenceSpent: 0, probabilityBoost: 0, tick }`, so aftermath `branchOnStep` variants key on it. `stepOutcomes` stays append-only and nothing is skipped (R1 verified step-index safety).

**The memory rule** (a second correction to THR-1269 §4). Two facts decide it:
- the aftermath reader takes the **first** memory at `branchOnStep`: `choiceHistory?.find(c => c.stepIndex === config.branchOnStep)` (`src/types/unifiedAction.ts:2250`);
- every index a step owns is **already shared**. The hand's card record (`recordUnifiedActionNudgeMemory`, `encounterChoiceMemory.ts:59`, written when a card is committed) and the agent-decided branch memory (`branchDecision.ts:525`) both replace by step index (`encounterChoiceMemory.ts:104`). The step history (`unifiedActionResolution.ts:1938`), the chapter archive (`chapterArchive.ts:221`) and the veil's step lines (`buildUnifiedEncounterStageModel.ts:493`) read those records.

So:
- **the result memory sits at `fightResultIndex(steps) = steps.length`**, the index past the terminal block, which no step owns. `fightBlock` exports the helper, and a fight template's aftermath sets `branchOnStep: fightResultIndex(steps)`. Any validator that requires `branchOnStep < steps.length` accepts exactly that index when the last step is a fight step (FB7);
- **fork decisions are not choice memories at all.** They are recorded in `fightState.forks` and traced (`fight.fork`), so they can neither shadow the result nor erase a card record.

A card the god plays on the nerve step, or on a wounding clash, therefore keeps its record, and a wounded, fought-on, then victorious fight still resolves its aftermath on `fight:overcome`.

**The post-fight dispatcher.** FB2 also creates `onFightEnded(state, action, ctx): FightEndedResult` in `src/engine/fights/fightOutcome.ts`, where `FightEndedResult = { events: TickEvent[]; fightState: FightState }`. It emits `fight.end` and is the **single place** where results turn into world writes. Plan doc 1 adds the defeat faces and victory yields; plan doc 3 adds the monster and lair writes; plan doc 5 adds the opponent's side. It ships empty apart from the trace, so each later slice extends one known function instead of inventing its own hook.

**How a branch records what it wrote.** `FightState` is readonly, so each branch returns a patch (`ending`, `opponentEnding`, `lairOutcome`), and the dispatcher merges the patches, in branch order, into the `fightState` it returns. The call site writes that `fightState` onto the resolved action before the aftermath is built, so plan doc 4's chips and `getFightState` read the records.

```ts
interface FightEndContext {
  readonly tick: number;
  readonly rng: () => number;                 // the step's seeded resolution rng (NFP #3)
  readonly runtime?: SimulationRuntime;       // for touchWorld / touchStructure after world writes
  readonly overrideCtx: RuleOverrideContext;  // for markMortalDead's death_prevented ward
}
```

- **Call site:** `executeStepResult` (`src/engine/unifiedActionResolution.ts:1301`), wherever it first holds a resolved action carrying `fightState.result`: immediately after its `advanceStep` call (`:~1853`) on a rolled step, or in §1's no-roll branch. That function already holds `state`, `tick`, `rng` and `runtime`. It builds `overrideCtx` exactly as the growth call beside it does (`{ graph: state.graph, effectStates: state.effectStates, persisted: state, tick }`, `:~1784`) and appends the returned events to its own `events`.
- **Exactly once:** a set `result` resolves the action in the same step (by `advanceStep`, or by the no-roll branch), so a fight cannot reach the call site twice. FB2's test asserts one `fight.end` per fight.
- **Why the context is threaded now:** plan doc 1's death call (`markMortalDead(…, runtime, overrideCtx)`) and plan doc 3's lair write (`clearLair`, then `touchStructure(runtime)`) both need it. A dispatcher without it would make each later slice re-plumb the call site.

**v1 placement rule (THR-1269 §6):** a fight block is **terminal** in its step list. An early end ends the action, and the aftermath carries the story on.

**A fight inside a branch is a sequel in v1** (a refinement of THR-1269 §6, recorded there with a veto invitation). The charter allows "one fight inside a single branch", but a branch variant is a single step (`variants: Record<string, ActionStep>`, `unifiedAction.ts:1975`), and `assertDecidedAftermathReachable` requires a fork template's `branchOnStep` to be a deciding index (`src/testing/contentInvariants.ts:189-205`). So a branch that wants a fight **plants a standalone fight template** through the existing `encounter_seed` op or an appointment, exactly as several fights in one story already do. `fightBlock` stays flat and terminal, and nothing in v1 nests a block inside a variant. A pure `fightBlock(spec)` cannot see steps appended after its return value, so the rule is a **catalog content invariant** (FB7): over `UNIFIED_ACTION_TEMPLATES`, once a step carries `fightRole`, every later step does too.

**The fight is a third producer of aftermath variant keys** (FB7). `assertAftermathVariantsProducible` (`contentInvariants.ts:237, :264-276`, run over every template by `unifiedTemplateAftermathReachability.test.ts:121-124`) accepts variant keys from exactly two producers today: a `decidedBy` fork and `authoredChoices`. FB7 registers a third: `fight:<result>` keys are producible when `branchOnStep === fightResultIndex(steps)` and the last step carries `fightRole`. It adds a falsification case (a `fight:*` key on a template without a fight block must still fail), and updates that docstring and the interface-map row. Otherwise `npm test` goes red at FB7.

**7. Harm, conditions and momentum by band** (THR-1269 §2, THR-1531).
- **Harm:** `computeFightErosion({ role, band, attended, difficulty, currentRatio })`, where `attended` is `action.effectiveTier === 'story_beat'` (`unifiedAction.ts:2944`; the legacy encounter path's precedent, `encounter.ts:587`) and **never** the template's `intrinsicTier`, which is `story_beat` for every `fight.lair.confront` and would double every systemic fight's harm. The harm = `FIGHT_HARM_BASE × bandMult × (attended ? EROSION_ATTENDED_MULT : 1) × (1 + difficulty × DIFFICULTY_EROSION_SCALE) × (berserk ? FIGHT_BERSERK_HARM_MULT : 1)`, clamped by headroom against a floor. The floor is `QUINTESSENCE_RATIO_FLOOR`, or **`MEETING_QUINTESSENCE_FLOOR` when the fighter is The First**. That is plan doc 1's guard: The First never dies in a fight, and because harm is queued for `phaseQuintessence`, the floor has to live here rather than at the ending (a cross-plan requirement; THR-1261 forbids writing quintessence directly). This is `computeScaledErosion`'s shape with the fight band tables `FIGHT_CLASH_HARM_MULT` / `FIGHT_NERVE_HARM_MULT`. The result is queued as a `QuintessenceEvent` with `source:'fight_harm'`.
  - Fight steps **skip** the generic quintessence band consequence in `outcomeConsequences`, so there is one harm path (THR-1269 §2).
  - `phaseQuintessence` accumulates `source:'spell_price'` separately and applies `prevent_loss` to harm only (THR-1530 §3).
- **Conditions by band,** through the existing `apply_condition` applier with `FIGHT_CONDITION_INTENSITY`. That applier is today a `case` inside `applyAftermathEffects` (`encounterAftermath.ts:2183`), not a callable function, so **FB3 extracts it** as an exported `applyConditionToActor(graph, targetId, conditionTraitId, opts)`, with the `case` delegating to it unchanged. `opts` carries `intensity`, `durationTicks` and an additive **`edgeProperties`** bag merged onto the new `has_trait` edge (plan doc 1's Scarred passes `inflictedBy` and `scarredTick`; the applier's fixed properties, `encounterAftermath.ts:2272-2285`, do not include them). Band conditions (FB3), `inflict_condition` (FB6), `fight_condition` complications (FB7) and plan doc 1's Scarred all call that one function, so tag immunity and the proxy events behave the same everywhere:
  - nerve: critical success → `inspired`, near miss/at cost → `shaken`, failure → `terrified`, **critical failure (the rout) → `terrified`** (THR-1266);
  - clash: at cost/failure → `wounded`, **critical failure (struck down) → `wounded` at `FIGHT_CONDITION_INTENSITY_SEVERE`** (THR-1266: "harm ×5 and `wounded` at high intensity").
  
  The critical rows are written here, by the band, on the step that ends the fight: the handler runs before `advanceStep`'s critical-failure short-circuit. Plan doc 1's rout and mauling faces rely on them ("already written by plan doc 2's bands") and add nothing of their own.
- **Momentum** (a named modifier carried into the next fight step, surfaced as a factor line the way `carryoverFactorLines` are):
  - nerve → first clash via `FIGHT_NERVE_CARRY` (+0.10 / 0 / −0.05 / −0.10);
  - clash → next clash via `FIGHT_CLASH_MOMENTUM` (+0.10 / +0.05 / 0 / −0.05 / −0.05);
  - authored `carryoverFactorLines` still add on top.
- **Courage on the nerve step:** `FIGHT_NERVE_COURAGE_WEIGHT × readLiveAxisLean(courage_prudence)` is added as a named modifier.

**8. The forks, decided at runtime** (THR-1269 §4, THR-1531).
- **Concession:** after a clash that **wounds** (at cost/failure), and not on the last clash, the handler calls the resolver. After the last clash, a yield is moot: the fight already ends `broke_off`. That is the THR-1531 sim's rule, whose yield check ran only while exchanges remained. The call is `decideBranchPole(readLiveAxisLean(state, fighter, 'courage_prudence'), sumHandLean(step.nudges, action.activeNudges, 'courage_prudence'), rng)`. The negative pole sets `result:'yielded'`. The rng is drawn only inside the neutral band, which is the existing contract.
- **Temper**, once, when `clockNow` first reaches `ceil(clockSize × FIGHT_TEMPER_CLOCK_FRACTION)` (0.5). A persistent clock that **starts** at or above the checkpoint (a beast already half-broken by an earlier visit) fires it at the first clash, traced `temperAtStart: true`:
  - `skittish` → `driven_off`;
  - `berserk` → `fightState.berserk = true`;
  - `bargainer` → a `mercy_ruthlessness` pole decision whose positive pole sets `bargained`;
  - `stubborn` → nothing.
- Each decision is recorded in `fightState.forks` (`kind`, `choice`: `fight_on` / `yield` / `bargain` / `refuse` / `fled` / `berserk`, `decidedBy`), **never as a choice memory** (the memory rule in §6).
- When the temper checkpoint fires against a persistent opponent, it also sets `monsterState.temperShown = true` (a field on plan doc 3's card). The lair card (plan doc 4) reveals the temper word only once it has been seen.
- Unattended fights have no hand, so the card lean is 0 and the decision rests on the profile and the near-neutral coin (R1 §4).

**9. Fight events** (THR-1530 §4). One `raiseEffectEvent` call per row, plus new `EffectEventSite` tags:

| Moment | Raise | On |
|---|---|---|
| the nerve step resolves (the handler's first run) | `combat_started`, raised before that step's `encounter_outcome` | fighter and opponent |
| each fight step resolves | `encounter_outcome {reach, success, combat: true}`, `counterpartId` = opponent | fighter |
| each clash that lands (+≥1) | `attacked` (new `EffectEvent` variant plus a mapping row to reactive `attacked`) | opponent; the fighter too on near miss/at cost (traded blows) |
| clock advances | `damaged {amount: delta}` | opponent |
| result `overcome` | `opponent_overcome` (new variant) → stack `on_kill` | fighter |
| fight ends (any result) | `combat_ended` | both |

Plumbing (THR-1530 §4 a–b):
- reactive executions receive `counterpartId` as `ExecutionContext.targetId`;
- a fight action classifies as `encounterType: 'combat'`, so `in_combat` reads "is a fight exchange", not "is an iron step";
- **`combat_success` needs its own field.** Stack classification never sees the predicate context: `getStackTriggers` reads only the event (`effects/effectEvents.ts:110-121`), whose `encounter_outcome` variant is `{ reach, success }` (`:66`). So FB5 adds an optional `combat?: boolean` to that variant, and `getStackTriggers` counts `combat === true` as a combat reach. A Soulfire-style iron→star exchange then still stacks `combat_success`;
- **timing:** `combat_started` is raised when the nerve step resolves, because the handler first runs then. So a reactive that fires on it (a monster's roar) moves the first clash, never the nerve roll. A roar meant to shake nerve is the complication "it roars" or a card-time effect.

**10. Effect vocabulary additions** (THR-1530 §1, §5):
- `resource_manipulate.resource` gains `'fight_clock'`, routed to `advanceFightClock` against the counterpart. **Three live sites read `resource_manipulate`, and each needs its branch:**
  - **the executor** (`src/engine/effectExecutors.ts:773-783`), today a deliberate no-op for every resource ("applied by resolver/tick, not executor"). Without a real `fight_clock` branch, reactive triggers could never write the clock. The branch calls `advanceFightClock` on `ctx.targetId` (FB5's `counterpartId` plumbing), or on the caster for `target: 'self'`;
  - **the one-shot item path** (`src/engine/effects/effectEvents.ts:287-327`), which writes an untyped property, so the compiler will not flag it. It fires on the bearer's first `encounter_outcome` after the item is attached;
  - **the per-tick path** (`src/engine/effectTick.ts:393-411`), whose parameter hard-codes `'essence' | 'quintessence'`, so typecheck surfaces it. It routes `fight_clock` to `advanceFightClock`, which is THR-1530's "a bleeding or regenerating opponent for free";
- `ParameterizedCondition` gains `clock_above:${n}`;
- a new `inflict_condition { conditionTraitId, target: 'self' | 'counterpart', durationTicks?, intensity? }` primitive, routed through the `apply_condition` applier. It serves monster special moves, curse spells and cursed items.

These are additive union members, each with an exhaustiveness guard (THR-1239).

**11. Advantages and allies at fight start** (THR-1532, THR-1271). The code term is **advantage**, not "edge". `Edge` is canonical UL for a graph relationship (`Docs/ubiquitous-language/Graph.md:69-75`), so THR-1532's "edges from the world" is renamed to avoid the collision. `readFightAdvantages(state, fighterId, opponentId)` fills `fightState.advantages` once, at fight start:

| Advantage | Source | Effect | Cost, through the existing single writer |
|---|---|---|---|
| Old wound | injury-class `hostile_to` toward the opponent | +0.10 clash | none |
| Their secret | a live `knows_secret_of` the opponent | `FIGHT_ADVANTAGE_SECRET` (+0.10) on the first clash where the fighter is **behind**: `fightState.wounds > fightState.blowsLanded` (more wounding exchanges taken than blows landed this fight). It counts exchanges, not clock segments, so a critical (+2) or a kin-calling complication (−1) does not skew it | **spent by the handler after the clash it applied to**, through the existing reveal path (`graphOpExecutor.ts:~805`, THR-30). The edge is retained and stops being live, the "exposed mark" semantics; it is never removed |
| A favour called | an `owes_favor` from a mortal on the hex that passes `isLiveFavorEdge` (`leverageOps.ts:44`) **and not** `isAppointmentFavour` (`appointments.ts:79`) | an ally (+`FIGHT_ALLY_ASSIST`) | **spent by the handler when it creates `fightState`**, exactly once per fight, through `redeemFavor` (`leverageOps.ts:182`) / `applyFavorRedemptionConsequences` (`secretsFavorsConsequences.ts:269`), the one writer the secrets phase and the encounter path already use. An appointment promise is never consumed |
| Company | `getCompanyMembersAtHex`, **excluding the fight's opponent** (two members of one company can duel over an injury grudge, plan doc 5) | +`FIGHT_ALLY_ASSIST` each, capped at `FIGHT_ALLY_MAX` | none |
| Storied arms | a possessed or bonded artifact with Storied ≥ `FIGHT_ADVANTAGE_STORIED_MIN_LEVEL` | +0.05 on the **nerve** step | none |
| Blessed | the `blessed` condition | +0.05 on the **nerve** step only | none |
| Cursed | the `cursed` condition **or a cursed artifact** (`trait.artifact.cursed` on a possessed or bonded artifact) | −0.05 on **clash** steps only | none |
| Fame (mortal opponents) | THR-1532's rule: the opponent's `reputationScore` in the top band, `≥ FIGHT_FAME_REPUTATION_MIN` (0.8, the sheet's *Revered*, `REPUTATION_WORDS` tier 4, `domain-words.ts:171-177`), so the player can see why | Dread `FIGHT_FAME_DREAD_STEP` (1) word harder | — |

Each advantage is a named modifier (factor line) with no hidden number. This corrects THR-1532, whose table implied removing spent edges; the substrate's spend semantics win.

**THR-1532's Fame rule replaces THR-1264's.** THR-1264 made a mortal's Dread "one word higher for a mortal with a `blood_drawn` reputation". No such reputation exists: `blood_drawn` is a grudge provenance (plan doc 1), a relation between two people, not a standing the world holds. THR-1532 decided the same lift from the opponent's `reputationScore` in the top band, which is live and shown on the sheet, so this doc follows THR-1532. The correction is recorded on THR-1264, veto invited.

**The company group step on the same road** (THR-74, R1). For group-affinity templates, `resolveUncontestedStep` already substitutes a company's best member and adds a group bonus (`unifiedActionResolution.ts:~363-369`, `:467`: `groupStep?.actingMemberId ?? action.actorId`, `groupStep?.totalBonus`). **Fight steps skip `resolveGroupStep`.** The named fighter always rolls, and company help counts **once**, through the Company advantage above. FB7 tests a template with `'group'` actor affinity that embeds a fight block, so allies are never double-counted.

**12. Mid-fight events** (THR-1265). The existing per-step complication pipeline fires on fight steps with three additions:
- `ComplicationRequirement.inFight?: true | 'monster' | 'mortal'`. Fight steps draw only `inFight` templates, and non-fight steps never draw them.
- Effect types `fight_momentum {delta}`, `fight_clock {delta}`, `fight_offer_quarter` and `fight_condition { conditionTraitId, side: 'fighter' | 'opponent' }`. **The complication applier does nothing for them**, following the `partial_progress` precedent (`complicationEffects.ts:~79`; `applyComplicationEffects` returns only events, `:31-37`). The fight handler reads them from the step's selected complication at its own place in `executeStepResult` (after the consequence is selected, before growth and `advanceStep`; §6), and applies each through the fight's own writer: the clock writer, the momentum field, the concession/temper rule, and the `apply_condition` applier. The older complication `attachment` effect is **not** used: it writes `activeAttachmentIds` that nothing expires and that never becomes a condition (`complicationEffects.ts:85-93`). **`fight_offer_quarter`** offers quarter to whichever side is losing (THR-1265): if the fighter is behind (the §11 predicate), the fighter's concession fork runs now; otherwise, in NPC mode, the opponent's temper checkpoint fires now (a monster offered quarter shows its temper: a bargainer bargains, a skittish one flees, stubborn and berserk refuse); in agent mode the opponent's concession fork runs (plan doc 5). **On the last clash, §8 wins for the fighter's side:** a yield is moot once the fight is ending `broke_off`, so a behind fighter's offer lapses (traced `fight.fork`, choice `none`). The opponent's side still answers on the last clash, because a bargain or a flight changes how the fight ends.
- `fightBlock(spec).complications?` merges authored events into that fight's pool.

### Graph nodes / edges

**No new node types, no new edge types.**
- **Node writes:** `monsterState.clockFilled` / `clockUpdatedTick` on an opponent that carries `monsterState` (the bag is minted by plan doc 3), through the one writer. That is a property bag internal to the node, not a relationship.
- **Edge writes:** `has_trait` condition edges through the existing applier; spending a secret (the reveal path; the edge is retained) or a favour (`redeemFavor`). No edge is removed.
- `hostile_to` grudges and deaths are plan doc 1's writes.

### Tick phases

**No new phase.** Everything runs inside unified-action step resolution, in the agent-decision/encounter progress phase where fight steps resolve like any step. Clock recovery is lazy at fight start, so there is no per-tick hook. The `spell_price` split happens in `phaseQuintessence`'s accumulation step.

### Resolution logic

- Every test is `resolveStepCore`: sigmoid capability → `P = cap − difficulty + mods` → d100 → the six bands. The charter's hard constraint holds by construction; this doc adds no resolver.
- Fight modifiers are named `actionModifiers` terms from `resolveFightStepInputs` (§3b): the fighter's standing modifiers, courage, momentum, advantages and allies, plus cards via the existing hand.
- Difficulty comes from the card.

### PRNG callouts

| Draw | Stream | When |
|---|---|---|
| d100 per fight step | the existing step stream (`resolveStepCore` draw 1) | always |
| resist | existing (draw 2) | only when a resist is funded (existing contract) |
| concession / temper coin | the same per-step rng passed to the handler | **only** when the net lean is inside `BRANCH_DECISION_NEUTRAL_EPSILON` (existing `decideBranchPole` contract) |
| complication pick | the existing complication stream | on failure-tier bands (existing) |
| effect-event raises (§9) and their reactives' chance draws | the step's resolution rng, passed to `raiseEffectEvent` (`effectEventDispatch.ts:66`) | in raise order, after the step core's draws and before the fork coin |

No `Math.random`. The fork draw is ordered **after** the step core's draws, so the existing golden streams are unchanged for non-fight steps. `stepResolutionGolden.test.ts` must stay green untouched.

## Content pillar

### Encounter templates

- **`fightBlock(spec)`** (`src/data/fights/fightBlock.ts`): a pure helper returning plain `ActionStep[]` (THR-1269 §1):
  - one nerve step and `exchanges` clash steps (default and max: `FIGHT_EXCHANGE_CAP`);
  - `fightRole` and `opponentRef` stamped on each, and `difficulty: FIGHT_STEP_PLACEHOLDER_DIFFICULTY` (0.35, the `fair` rating). The roll never reads it, but readers that never see the card (the planner, the cache, the CMS, the codex) read a plausible middle value instead of zero. **Four readers must not read it, and are routed through `resolveFightStepInputs` or suppressed on fight steps:**
    - capability growth (`unifiedActionResolution.ts:1772`, `step.difficulty * 100`): FB1 reads the resolved difficulty, so felling a severe beast grows a mortal like a severe test;
    - the veil header's threat and reach labels (`buildUnifiedEncounterStageModel.ts:212, :220`, printed at `EncounterVeil.tsx:1566`): FB7 reads the resolved difficulty and reach;
    - the whisper card's quoted step (`buildNudgePhaseModel.ts:476` → `stepFactorLines.ts:313-316`): FB7 quotes the resolved reach and difficulty;
    - the attended forecast (§3b): FB7;
  - the default band afterimages (below), per-step `nudges`/`deal` from the spec, and the spec's `complications`.
  
  The JSON package path pre-expands it in `compile-encounter.ts`, which inlines the return value; no function reaches the generated action catalog.
- **`fight.lair.confront`** ("The Beast in Its Den"), the first standalone fight template:
  - **`actorAffinities: ['individual']`**, declared: plan doc 6's hunt resolves the confront by query through `eligibleAt`, which drops a template without it (`encounterSeeding.ts:329`), while plan doc 3's trigger spawns it directly;
  - **spawn-only**: no `locationSubtypes`, and not cache-registered, so the draw pipeline never offers it; it arrives only through plan doc 3's trigger, plan doc 6's hunt and the debug lever;
  - `intrinsicTier: 'story_beat'`, the same tier as `monster.hunt.named_elite`. So a fight opens the veil for The First and the retinue, and surfaces for a watched mortal only through an attended tug (the attention matrix, `attentionTier.ts:20-27`; plan doc 4 § Event notifications);
  - scale `regional`; opponent = the action's target (no `opponentRef`);
  - **registered in `MONSTER_ENCOUNTER_TEMPLATES`** (`monster-encounter-content.ts`, imported from the new `data/encounters/fight-lair-confront.ts`), which flows into `UNIFIED_ACTION_TEMPLATES` (`unified-action-templates.ts:5598`) and is what `getAnyEncounterById` searches (`encounter-content.ts:14194-14203`, via `getMonsterEncounterById`). So `isEncounterAction` finds it: fights are archived as chapters and counted by `encounter_resolved`. Having no `locationSubtypes`, it is never drawn (an FB7 test);
  - a one-line opening step prose, then the block;
  - an aftermath keyed on the `fight:<result>` memories with a short line per result.
  
  It is spawnable by the plan doc 3 trigger and by the debug lever.

### Prose tables

The **default fight afterimages** are authored once, in the fight block's defaults, one per band per role. **Voice:** GAME register, never novel; GM narration, never in situ (prose doctrine; `Docs/canon/prose.md`); prose placeholders only: `{name}` / `{actor}` (the fighter), `{target}` (the opponent, since the standalone template's opponent is its target) and `{cast:…}` (a cast-bound opponent). `$actor` is an aftermath-effect sentinel, never prose; it would render raw (Law 14).

| | critical success | success | near miss | at cost | failure | critical failure |
|---|---|---|---|---|---|---|
| **nerve** | holds, and something hot in the chest answers | holds | holds, badly | holds, shaking | the fear gets in | breaks and runs |
| **clash** | a clean, telling blow | lands a blow | trades blows | lands one and takes one | is driven back | is struck down |

These are one-line seeds, finalized by the author in FB7 against the voice scorer. Authored per-fight overrides go through the spec.

### Attachment content

None new. The fight reuses `wounded`, `terrified`, `shaken` and `inspired`. The scar trait and the temper traits belong to plan docs 1 and 3.

### Data tables

**12 fight complications** (THR-1265 starter table) in `src/data/complication-templates.ts` with `requires.inFight`:
- the footing gives;
- mud and blood;
- the blade bites stone;
- the haft cracks;
- blood in the eyes (`fight_condition shaken`, fighter);
- it roars (`fight_condition terrified`, fighter);
- it calls its kin;
- the crowd sees it falter;
- a stranger steps in;
- you learn how it moves;
- the ground drinks it (a fixed-sphere `sphere_pressure`, `entropy`: `sphere_pressure` takes a literal sphere (`types/complication.ts:104`), and a lair-keyed sphere would need a sentinel the applier lacks, so that is out of v1);
- quarter offered.

## UI pillar

*Screenshot tool: **Playwright** for FB7 only (the forecast, the header labels and the whisper card read the fight's real inputs; the worktree-Vite + Playwright route, `Docs/canon/verification-gates.md` § Browser-verify). FB1–FB6 are engine-only.*

**UI: player-facing fight surface — N/A in this doc, by design.** Fight steps are ordinary encounter steps, so they render in the existing encounter veil today, with step prose, forecast, hand and outcome band, and no new component. **The forecast reads the same `resolveFightStepInputs` the roll does** (§3b, wired in FB7), so it shows the fight's real odds. The fight-specific surface belongs to **plan doc 4** (THR-1272), which builds on this doc's `fightState` and card:
- the opponent header;
- clock pips on the `StepDots` grammar;
- the fight consequence chips;
- the lair sidebar card.

Chronicle lines are plan doc 1's (a `fight_ended` tick event). Moments for followed mortals' fights are deferred to the v2 layer (plan doc 4).

Keeping it separate lets this engine core ship and be verified headlessly (THR-688 rule C). **UI Laws engaged (FB7 only):** Law 1 (image, tooltip and link on every concept the forecast names), Law 13/14 (words, no raw tokens or numerals), Law 15 (no new magnitude language), Law 17 (tooltips from the registry), Law 21 (clickable names), Law 33 (1920×1080, no scroll) and Law 37 (one chrome).

### Visual presence (HexMapV2)

None. A fight is a run of encounter steps, not a map event: nothing new is drawn on the hex map. The lair and cleared-lair icons already exist, and the lair sidebar card is plan doc 4.

### Debug inspection (DebugPanel)

`window.__DEBUG` gains these accessors, declared in `src/debug-bridge.d.ts` with JSDoc and implemented in `src/debug-bridge.ts`, tree-shaken in prod:
- `getFightState(actionId)`;
- `inspectOpponentCard(id)`;
- `spawnFight(targetIdOrName, opts?: { clockFilled?: number; outcome?: StepOutcome })` (the band narrowed by `isReviewableOutcomeBand`, `debugOutcomePin.ts:160`), returning `{ actionId }`: a review lever that **first moves `@hero` to the target's location** (the existing `move agent` debug path; a fight whose sides no longer share a hex ends `separated`), then stages `fight.lair.confront` on `@hero` against the named target, the way `?spawn=` stages a template (open, as The First). `clockFilled` presets the target's clock through `advanceFightClock` (cause `'debug'`). `outcome` pins the band through the existing `setOutcomePin` (THR-1030), so `getOutcomePinVerdict()` reports on it. Reviews use this rather than `?spawn=fight.lair.confront`, which stages the template with no named opponent.

The in-game CLI gains `spawn fight <agent|@hero> --target <actor>`.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Add rows for the fight handler, `resolveFightStepInputs` (roll and forecast), the clock writer, `onFightEnded`, `fightForks`, `readFightAdvantages`, `fight.lair.confront`, and the debug accessors.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Fight step handler (in `unifiedActionResolution.ts`) | encounter / unified-action progress (existing) | existing encounter veil | `unifiedActions[].fightState` | `fight.step`, `fight.fork`, `fight.end` | `getFightState`; trace viewer |
| `readOpponentCard` | read at fight step | — (plan doc 4) | reads `monsterState` / raw capabilities | inside `fight.step` | `inspectOpponentCard` |
| `advanceFightClock` | fight step; `resource_manipulate` | — (plan doc 4) | opponent node `monsterState` | `fight.clock` | `inspectOpponentCard` |
| `advanceStep` early end | existing | — | `resolved`, `outcome` | existing resolution trace + `fight.end` | action list |
| Fight effect raises | fight step | — | `effectStates` via existing dispatch | existing effect-event traces | trace viewer |
| `computeFightErosion` | fight step → `phaseQuintessence` | existing quintessence readouts | `pendingQuintessenceEvents` | existing quintessence traces | `getAgentAttachments`, sheet |
| Fight complications | fight step (existing pipeline) | existing complication prose | existing | existing complication trace | trace viewer |
| `fightBlock` / `fight.lair.confront` | — (authoring) / spawn-only | veil | — | — | `spawnFight` (the URL lever stages it without a named opponent) |
| `resolveFightStepInputs` | fight step (roll) and the attended forecast (UI, pure) | encounter veil forecast (FB7) | reads the card, `fightState`, standing modifiers | inside `fight.step` (`modifiers`) | `getFightState`; the forecast equality assertions |
| No-roll end (§1) | fight step, before the roll | existing aftermath | `resolved`, `outcome`, `fightState.endReason` | `fight.end` | `getFightState(...).endReason` |
| `onFightEnded` | after the fight's result is set | aftermath chips (plan doc 4) | `fightState.ending` / `opponentEnding` / `lairOutcome` | `fight.end` (+ plan docs 1 and 3's traces) | `getFightState` |
| `fightForks` | wounding clash; temper checkpoint | — | `fightState.forks`, `result` | `fight.fork` | `getFightState(...).forks` |
| `readFightAdvantages` | fight start (pure; spends happen in the handler) | forecast factor lines (FB7) | `fightState.advantages` | inside `fight.step` | `getFightState(...).advantages` |
| Debug accessors | — | DebugPanel / console | — | — | `getFightState`, `inspectOpponentCard`, `spawnFight`; CLI `spawn fight` |

## Constants table

All live in a new `src/data/fight-constants.ts` unless noted (NFP #1).

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIGHT_RATING_DIFFICULTY` | `{ gentle: 0.20, fair: 0.35, steep: 0.50, severe: 0.65 }` | Card word → step difficulty; each sits inside its `DIFFICULTY_WORD_BANDS` word so the display round-trips (THR-1531) |
| `FIGHT_STEP_SCALE` | `'regional'` | Scale every fight step resolves at (THR-1531) |
| `FIGHT_EXCHANGE_CAP` | `3` | Most clash steps in one block (THR-1531) |
| `FIGHT_NERVE_COURAGE_WEIGHT` | `0.15` | × live `courage_prudence` on the nerve step |
| `FIGHT_NERVE_CARRY` | `{ critical_success: 0.10, success: 0, near_miss: -0.05, success_at_cost: -0.05, failure: -0.10 }` | Nerve band → first clash modifier |
| `FIGHT_CLASH_MOMENTUM` | `{ critical_success: 0.10, success: 0.05, near_miss: 0, success_at_cost: -0.05, failure: -0.05 }` | Clash band → next clash modifier |
| `FIGHT_CLOCK_BY_BAND` | `{ critical_success: 2, success: 1, near_miss: 1, success_at_cost: 1, failure: 0, critical_failure: 0 }` | Clash band → opponent clock |
| `FIGHT_HARM_BASE` | `0.03` | = `QUINTESSENCE_ENCOUNTER_FAILURE_EROSION`; one harm scale |
| `FIGHT_CLASH_HARM_MULT` | `{ near_miss: 0.5, success_at_cost: 1, failure: 1, critical_failure: 5 }` | Clash band → harm multiplier |
| `FIGHT_NERVE_HARM_MULT` | `{ near_miss: 0.5, success_at_cost: 0.5, failure: 1, critical_failure: 3 }` | Nerve band → harm multiplier |
| `FIGHT_CONDITION_INTENSITY` | `0.5` | Intensity of band conditions (matches `CONDITION_DEFAULT_INTENSITY`) |
| `FIGHT_CONDITION_INTENSITY_SEVERE` | `0.9` | `wounded` on a clash critical failure (struck down; THR-1266's "high intensity") |
| `FIGHT_BERSERK_MIGHT_DELTA` | `0.15` | Clash difficulty added when berserk |
| `FIGHT_BERSERK_HARM_MULT` | `1.5` | Harm multiplier when berserk |
| `FIGHT_CLOCK_RECOVERY_TICKS` | `50` | One segment recovered per this many ticks (lazy) |
| `FIGHT_DEFAULT_CARD` | `{ dread: 'fair', might: 'fair', clockSize: 3 }` | Fail-soft card |
| `FIGHT_STEP_DURATION` | `{ min: 1, max: 1 }` | The required `ActionStep.duration` for every fight step (one tick per exchange) |
| `FIGHT_STEP_FAIL_BEHAVIOR` | `'continue_weakened'` | A failing exchange must not end the action (`advanceStep` ends on `fail_action`, `unifiedActionLifecycle.ts:179-181`); a critical failure still ends it by the lifecycle's own rule |
| `FIGHT_DEFAULT_NERVE_REACH` / `FIGHT_DEFAULT_CLASH_REACH` | `'heart'` / `'iron'` | Authored defaults when neither the spec nor the card names a reach (THR-1263) |
| `FIGHT_DERIVED_MIGHT_BANDS` | raw `≥30 severe, ≥22 steep, ≥15 fair, else gentle` | Mortal opponents' derived Might |
| `FIGHT_MORTAL_CLOCK` | `2` | Per-fight clock of a mortal opponent (THR-1264) |
| `FIGHT_ADVANTAGE_OLD_WOUND` | `0.10` | The grudge advantage (clash) |
| `FIGHT_ADVANTAGE_SECRET` | `0.10` | The spent-secret advantage (the first clash where the fighter is behind) |
| `FIGHT_ADVANTAGE_STORIED_MIN_LEVEL` / `FIGHT_ADVANTAGE_STORIED` | `2` / `0.05` | Storied arms, nerve step only |
| `FIGHT_ADVANTAGE_BLESSED` / `FIGHT_ADVANTAGE_CURSED` | `0.05` / `-0.05` | Blessed: nerve step only. Cursed (condition or a cursed artifact): clash steps only (THR-1532) |
| `FIGHT_ALLY_ASSIST` / `FIGHT_ALLY_MAX` | `0.05` / `3` | Company allies on the hex |
| `FIGHT_TEMPER_CLOCK_FRACTION` | `0.5` | Where on the clock the temper checkpoint sits |
| `FIGHT_DERIVED_DREAD_OFFSET` | `-1` | A mortal opponent's Dread, in words from their Might |
| `FIGHT_FAME_DREAD_STEP` | `1` | Extra Dread for a famous opponent |
| `FIGHT_FAME_REPUTATION_MIN` | `0.8` | The `reputationScore` (the sheet's *Revered*) at which a mortal opponent counts as famous (THR-1532) |
| `FIGHT_STEP_PLACEHOLDER_DIFFICULTY` | `0.35` | The `difficulty` `fightBlock` stamps for card-blind readers; the roll never reads it |
| `FIGHT_RESULT_ACTION_OUTCOME` | `{ overcome: 'success', driven_off: 'success', bargained: 'success_at_cost', broke_off: 'success_at_cost', yielded: 'failure', routed: 'critical_failure', struck_down: 'critical_failure' }` | The action's final outcome for each fight result (§6) |

## Tracing

Every fight trace **extends `TraceBase`** (`src/types/trace.ts:1276-1283`: `id`, `tick`, `timestamp`, `category`, `agentId?`, `summary`) with `category: 'fight.…'`. Each is registered in the THR-928 trio (the `TraceCategory` union, `TRACE_CATEGORIES`, the `TraceEntry` union) **in the slice that first emits it**: `fight.step` in FB1, `fight.clock` and `fight.end` in FB2, `fight.fork` in FB4. The shapes below list only the fields each adds to `TraceBase`.

```ts
// fight.step — emitted once per fight step, after the band is known
interface FightStepTrace extends TraceBase {
  category: 'fight.step';
  actionId: string; fighterId: string; opponentId: string | null;
  role: 'nerve' | 'clash'; exchange: number;              // 0 for nerve
  card: { dread: FightRatingWord; might: FightRatingWord; reach: ReachDomain; readFrom: 'monsterState' | 'derived' | 'default' };
  difficulty: number; opponentModifierDelta: number; scale: ActionScale;   // always FIGHT_STEP_SCALE today
  modifiers: readonly { name: string; delta: number }[];  // courage, momentum, advantages, allies, cards
  band: StepOutcome; clockDelta: number; clockNow: number; clockSize: number;
  harmQueued: number; conditionsApplied: readonly string[];
}
// fight.fork — emitted for each runtime decision
interface FightForkTrace extends TraceBase {
  category: 'fight.fork';
  actionId: string; fighterId: string; fork: 'concession' | 'temper';
  axis: ValuePair | null; temper?: string; profileLean: number; cardLean: number;
  decidedBy: 'conviction' | 'coin' | 'temper'; choice: string; temperAtStart?: boolean;
}
// fight.end — emitted once when fightState.result is set
interface FightEndTrace extends TraceBase {
  category: 'fight.end';
  actionId: string; fighterId: string; opponentId: string | null;
  result: FightResult; endReason?: 'opponent_gone' | 'separated' | 'no_opponent'; rolled: boolean; // false on the no-roll route
  exchanges: number; clockAtStart: number; clockNow: number; harmTaken: number; advantages: readonly string[];
  dispatchError?: string; // set when onFightEnded threw; the action still resolved
}
// fight.clock — emitted by advanceFightClock (clash, spell, item or recovery)
interface FightClockTrace extends TraceBase { category: 'fight.clock'; filledByThisWrite: boolean; opponentId: string; delta: number; before: number; after: number; cause: string; }
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `opponentRef` set but unbound, or bound to a deceased node | The block ends at its first fight step, `broke_off` with `endReason: 'no_opponent'` / `'opponent_gone'`, with no roll. No fallback to the target |
| No `opponentRef` and no `targetId` node | `FIGHT_DEFAULT_CARD`, `opponentId: null`; the fight runs, the clock is per-fight |
| Opponent node missing mid-fight (removed) | The fight ends `broke_off` / `opponent_gone` at the next step, through the no-roll route (§1): the aftermath, the resolved event and `fight.end` all still happen |
| `monsterState` malformed (unknown word, NaN clock) | The unknown word reads `fair`; the clock is clamped to `[0, clockSize]`; a non-finite value reads 0 |
| Opponent has no temper tag | `stubborn` |
| `fightRole` on a step outside a block (hand-authored mistake) | The step resolves as a fight step against the target; `fightBlock` never produces this; a content test catches it |
| Content after a terminal block | The catalog content invariant fails the test run (FB7); at runtime, the early end resolves the action before any such step |
| A stale `pendingFightClockDelta` from an earlier fight | Cleared at the new fight's start; traced as `fight.clock` with cause `'stale_cleared'` |
| `readLiveAxisLean` has no profile | Neutral: the coin decides (existing contract) |
| A spent advantage's favour or secret is already gone (redeemed or revealed elsewhere mid-fight) | Skip spending; the advantage still applied, because it was read at fight start |
| Effect raise throws | Caught per raise (existing dispatcher fail-soft); the fight continues |
| `onFightEnded` throws (a later slice's world write fails) | Caught at the call site; `fight.end` is still traced with `dispatchError`; the action stays resolved; no partial retry |
| Two fights against one persistent opponent in the same tick (a shared monster clock) | Fights resolve in turn. The first whose clash step ends with the clock full and a blow landed records `overcome`, and the dispatcher's death write claims the kill. The other fight finds the opponent deceased at its next step and ends `broke_off` / `opponent_gone`. A full clock on a living opponent never ends a fight by itself (§5) |
| A fighter's own item or spell fills the opponent's clock mid-step | Counted by the same step's clock-full check (§5), so the wielder's fight ends `overcome` |
| A forecast is drawn repeatedly (UI re-render) | `readFightAdvantages` and `resolveFightStepInputs` are pure: nothing is spent until the handler runs |
| Fighter and opponent no longer share a hex between steps (multi-tick steps; a future escape spell) | The fight ends `broke_off` with reason `separated`. **A deliberate deviation from THR-1530 §1**, which routes a separated fighter as fled: a fighter carried off by a spell, a ward or a shove did not break in fear, and `routed` would write the prudence drift and `terrified` for a departure they did not choose. The teleport hook still holds: once `teleport` gets a real executor, an escape spell ends a fight with no fight-specific code |
| A persistent clock starts at or above the temper checkpoint | The checkpoint fires at the first clash; `fight.fork` traces `temperAtStart: true` |

## Interface impact

`Docs/canon/interface-map.md` rows touched:

| Contract | Change | Production read site |
|---|---|---|
| encounter step → quintessence queue | **extend** with a `fight_harm` source | `phaseQuintessence` (existing) |
| encounter step → conditions applier | **extend** (fight bands) | existing condition readers |
| fight → opponent clock (`monsterState`) | **add** | the next fight's `readOpponentCard` (this doc); the lair sidebar (plan doc 4) |
| fight → effect events | **add** (`combat_*`, `attacked`, `damaged`, `opponent_overcome`) | the existing reactive/stack dispatch |
| fight → choice memory → aftermath variants | **extend** (the `fight:` prefix) | `resolveAftermathVariant` (existing) |

The executor updates the map rows and `scripts/interface-contracts.ts` in the slice that lands each write (per the DoD).

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 501 | Additive optional fields only: `ActionStep.fightRole`, `opponentRef`; `UnifiedAction.fightState` (with `ending` / `lairOutcome` declared up front); the `difficultyContext` union member. No narrowing changes; the ratchet must show zero net-new errors |
| `src/types/effects.ts` | ~78 | Additive union members (`'fight_clock'`, `clock_above`, `inflict_condition`); the exhaustiveness guard forces every switch to handle `inflict_condition`, a new `type` (`effectExecutors.ts:793`), **by design** (THR-1239). A new `resource` **value** is not caught by it, so FB6 lists the three `resource_manipulate` sites by hand (§10) |
| `src/engine/encounterAftermath.ts` | ~59 | The `inflict_condition` route and complication effect handling; additive cases |
| `src/data/unified-action-templates.ts` | ~164 | FB7 registers `fight.lair.confront` in the existing arrays; additive |
| `src/types/trace.ts` | ~134 | Four trace categories registered in the THR-928 trio; additive union members |

**Behavioural blast:** none for non-fight steps, **with one exception**. FB3's `spell_price` split changes settlement for the one live caller that queues a spell price, the `use × Power` undertaking cell (`src/data/undertaking-objects.ts:~2302`, `source:'spell_price'`). Today `prevent_loss` acts on the summed delta (`phaseQuintessence.ts:~62-65`), so a warded caster's price is swallowed. After FB3 the ward covers harm only, and the caster pays. That is the intended semantics (THR-1530 §3), and FB3 carries a regression test for a warded caster. No shipped template carries `fightRole` until FB7, and the golden step-resolution test must stay green untouched.

## Slices

Each slice is one Linear issue in the Physical Conflict project, **not** a child of the map (the cascade trap, THR-1258 close comment). The evidence shape is THR-688 rule C: engine and content, CLI/headless. No browser evidence is owed; UI is plan doc 4.

| Slice | Scope | Blocked by | Done-when (all: `npm test`, `test:heavy`, `check:typecheck`, `vite build`, 30-tick CLI smoke) |
|---|---|---|---|
| **FB1: Fight steps read their opponent** | §1–3c: `resolveFightStepInputs` (reach, difficulty, scale at all three reads, **the fighter's standing modifiers**, the opponent's delta, **the combat context**, the pre-`fightState` read); **the resolved reach and difficulty carried on `resolutionStats` to every post-roll reader** (§3c); **band opposition skips fight steps**; `fightRole`, `opponentRef`, `OpponentCard`, `readOpponentCard` (monster bag / derived / default), opponent-rated difficulty + opponent modifier delta, regional scale override, runtime reach override + the ported reach-override read (before capability) | — | Unit tests: card read (all three sources); difficulty per word; a `local` template's fight step resolves at `regional` (trace shows scale); reach precedence (card over authored, fighter effect over card). **an `in_combat` conditional item on the fighter changes a fight step's probability, as a named term, on an iron clash and on a clash whose reach the card overrides to eye**; growth after a severe clash is a severe step's growth; **a clash whose card overrides the reach to Eye grows Eye, not Iron, spends an Eye consumable's charge, and records Eye as the event node's `reachTested`**; **a company member fighting on a hex shared with a foreign active band produces a `fight.step` trace and no contested pair**; a `local` template's critical failure on a fight step takes regional severity. Golden test untouched and green |
| **FB2: fightState, the clock, early end** | §4–6: `FightState`; `advanceFightClock` (reports `filledByThisWrite`) + `fight.clock` trace; band → clock; lazy recovery; `advanceStep` early end; result → one choice memory at `fightResultIndex(steps)` (the memory rule); `fightState.forks`; `broke_off` / `overcome` / `routed` / `struck_down`; terminal rule; the empty `onFightEnded(state, action, ctx)` dispatcher (the `FightEndContext` threaded from `executeStepResult`) + `fight.end` trace; the `opponent_gone`, `separated` and `no_opponent` ends **through the no-roll route** (`StepResolutionResult.fightEnd`, the loop pass-through, `executeStepResult`'s no-roll branch); **the action-trigger ladder fed from the result**; the clock-full check order (§5); the `ending` / `opponentEnding` / `lairOutcome` / `conditionsApplied` / `storiedClimbs` declarations, with `storiedClimbs` filled here, and the dispatcher's patch merge; **the `'fight'` member of `MortalDeathCause` and its sheet word** (`DEATH_CAUSE_WORDS.fight = 'slain'`); **`killerIsKnown` reads a fight death as seen** (`agentDetail.ts:1299-1314`: a fight is a public deed, and plan doc 1's chronicle line names the victor, so the sheet and plan doc 4's lair card name the slayer) | FB1 | Tests: each band's clock delta; **each `FightResult` resolves the action with `FIGHT_RESULT_ACTION_OUTCOME[result]`**, including overcome after a wounding exchange → `success`, `routed` → `critical_failure` and `yielded` → `failure`; **a `no_opponent` fight leaves `stepOutcomes` unchanged, writes no `consequence_applied` trace and grants no growth**; a clock already full at fight start falls on the first landing blow, and a full clock with no blow landed by the last clash ends `broke_off`; **a `no_opponent` end, a mid-fight `opponent_gone` end and a `separated` end each produce the `fight:broke_off` aftermath, one `fight.end` and one dispatch, and the two mid-fight ends also raise `combat_ended`**; **after a yield that followed an at-cost wound, an `encounter_success` trigger item does not fire and an `encounter_failure` item does**; a dispatcher branch's patch lands on the resolved action's `fightState`; the result memory is written at `fightResultIndex` and an aftermath variant keyed on `fight:overcome` resolves; **an attended test commits a hand on the nerve step and on a wounding clash through `recordUnifiedActionNudgeMemory`: both card records survive in the step history, and the `fight:overcome` variant still resolves**; the recovery math; step-index safety (`branchOnStep` fixture); **two fights against one monster in one tick: the first to land on a full clock records `overcome`, and the other ends `opponent_gone`**; **a fighter moved off the opponent's hex ends `broke_off` / `separated`**; exactly one `fight.end` per fight, and the dispatcher receives a `runtime` and an `overrideCtx`; **an unbound `opponentRef` ends the block `no_opponent` with no roll**; a fixture death with cause `'fight'` reads "slain" on the sheet, and its `death.by` names the victor |
| **FB3: Harm, conditions, momentum** | §7: `computeFightErosion` (floored, `fight_harm`); fight steps skip the generic quintessence consequence; the `spell_price` split in `phaseQuintessence`; band conditions via the applier, extracted as the exported `applyConditionToActor` (recorded in `fightState.conditionsApplied`); courage and momentum modifiers as factor lines | FB2 | Tests: harm per band (attended ×2 only when `effectiveTier === 'story_beat'`, never from the template's `intrinsicTier`; berserk ×1.5; floor holds); conditions land per band through `applyConditionToActor` (`damaged` proxy fires), **a routed fighter carries `terrified` and a struck-down fighter carries `wounded` at `FIGHT_CONDITION_INTENSITY_SEVERE`**, and the aftermath `apply_condition` effect behaves byte-for-byte as before (its existing tests stay green untouched); a ward covers harm but not `spell_price`; **a regression test for a warded caster on the `use × Power` cell** (the price is now paid); **The First's fight harm never takes quintessence below `MEETING_QUINTESSENCE_FLOOR`**, even at critical failure; the momentum chain across three clashes |
| **FB4: The forks** | §8: concession after a wounding clash (not after the last); the temper checkpoint at half clock (reading `trait.temper.*`; default stubborn; sets `monsterState.temperShown` on persistent opponents **only when the opponent carries `monsterState`**, which plan doc 3's M1 declares and may land after FB4); fork decisions in `fightState.forks`; the `fight.fork` trace; `fight_offer_quarter`'s side rule | FB3 | Tests: prudent profile → yield; courageous → fights on; a pole-lean card flips a mildly prudent mortal; unattended determinism (same seed, same decision); each temper's effect; **with a `fight_on` fork recorded, an aftermath variant keyed on `fight:overcome` still resolves**; a persistent clock starting past the checkpoint fires temper at the first clash |
| **FB5: Fight events** | §9: the six raises (in the fight-step handler in `unifiedActionResolution.ts`), two new event variants + mapping rows, `counterpartId` → `targetId`, the `'combat'` classification | FB4 (serializes the shared handler file) | Tests: a reactive `attacked` trait on an opponent fires once per landing clash; `on_kill` stacks on `overcome`; `combat_started` expiry and `leave_combat` behave; a Soulfire-style reach-swapped exchange still stacks `combat_success` (the event's `combat` field); **a reactive on `combat_started` moves the first clash, not the nerve roll**; **a stack earned on one exchange moves the next exchange's odds** (through the fighter's standing modifiers) |
| **FB6: Effect vocabulary for fights** | §10: `'fight_clock'` on `resource_manipulate` at **all three sites** (the executor, the one-shot item path, the per-tick path), a persistent clock directly and a per-fight clock through the node's `pendingFightClockDelta` mailbox (§5); `clock_above:`; `inflict_condition` (through the applier) | FB2, FB5 | Tests: `pendingFightClockDelta` is cleared at a new fight's start, before the nerve step's raises; an item with `resource_manipulate fight_clock +1` on `encounter_outcome` advances a monster's clock, **and a mortal opponent's per-fight clock in the same step (the mailbox is drained before the clock-full check)**; **the item's write that fills the clock ends the wielder's fight `overcome`** (the item attached after the nerve step, since a one-shot fires on the first `encounter_outcome` and the nerve step runs no clock-full check); **a reactive-nested `fight_clock`: a monster reactive on `damaged` that rewinds its own clock**; a per-tick `fight_clock` bleeds an opponent's clock; a write after a pending recovery applies the recovery first; `inflict_condition` on the counterpart applies with tag immunity honoured; exhaustiveness guards compile |
| **FB7: The block, the template, advantages, allies, events** | §11–12 + content: the `fightBlock` helper (+ `compile-encounter` pre-expansion; defaults `FIGHT_STEP_DURATION`, `FIGHT_STEP_FAIL_BEHAVIOR`, the default reaches); `fight.lair.confront`; default afterimages; `readFightAdvantages`, `getCompanyMembersAtHex`, spending **through the existing favour/secret writers**; group step skipped; the `inFight` requirement + four effect types (read by the handler) + 12 complications; the terminal rule as a content invariant; the third variant-key producer; the header, whisper and forecast readers, and the past-step labels (Scene So Far, the chapter archive); `fight.lair.confront` registered in `MONSTER_ENCOUNTER_TEMPLATES`; debug `getFightState` / `inspectOpponentCard` / `spawnFight` (with `touchWorld` after a preset); CLI `spawn fight`; **the attended forecast reads `resolveFightStepInputs`** (`buildNudgePhaseModel.ts`) | FB5 (it serializes `unifiedActionResolution.ts`; FB6 optional) | Tests: helper expansion shape and terminal-rule throw; advantages read and spent (a spent favour is redeemed, not removed; an appointment favour is never touched; a secret is revealed, not removed); **building the nerve step's forecast leaves the favour live, and the favour is redeemed exactly once per fight**; **the catalog invariant rejects a step reward pool on a `fightRole` step**; `fight.lair.confront` is found by `getAnyEncounterById` and never drawn; the past-step labels read `StepProseRecord.reach`; ally cap; a `'group'`-affinity template embedding a block counts allies once; the complication pool is scoped. **CLI calibration evidence:** 400 seeded fights of `fight.lair.confront` against a **fixture opponent** carrying a hand-written `monsterState` equal to THR-1531's "Major elite" row (steep / steep / clock 4 / stubborn), fought by a fixture fighter stamped to that row's "bold guard" profile (clash and nerve reach capability ≈ 1.0 and 0.89, `courage_prudence` +0.35). Harm, conditions and the monster's clock are reset between fights. The printed result distribution must sit within ±10 points of the row on every result class (n = 400 puts ±10 at about 4σ, outside sampling noise). **Browser evidence** (FB7 touches `src/components/`): `spawnFight` against a **named mortal** (a derived card, since plan doc 3's M1 may not have landed; a monster once it has), a 1920×1080 screenshot of the fight step's forecast and header, and `__DEBUG` assertions that the forecast probability equals the resolver's for that step **four ways: plain, with a card selected, on a step that hits the regional floor, and for a sub-floor fighter** (low Veil and `terrified`, where the core raises the probability after the roll, `stepResolutionCore.ts:254-265`; the forecast mirrors that post-roll floor, not only `applyScaleDifficultyAdjust`, which reproduces the floor only when capability plus modifiers is at or above it, `resolutionScaleAdjust.ts:131`). Tests: Storied arms and Blessed move the nerve roll and its forecast; the catalog invariant rejects content after a fight block; a `fight:*` variant key on a template without a block still fails the producibility test |

## Kill criteria

- **Before merge of FB7:** if the 400-fight fixture calibration (FB7 Done-when) misses THR-1531's "Major elite / bold guard" row by more than 10 points on any result class, stop and diagnose before merge. Likely causes: a modifier double-counted, or the generic consequence not skipped. (The scale override cannot show here, since `fight.lair.confront` is itself regional; FB1's `local`-template test covers it.)
- **After merge:** if fights read wrong in play (too deadly, too soft), the tunables table is the lever. `FIGHT_EXCHANGE_CAP`, `FIGHT_CLASH_HARM_MULT` and `FIGHT_RATING_DIFFICULTY` move the result mix, and none needs a code change.

## Three-pillar check

- [x] Engine pillar present (§1–12, seven slices)
- [x] Content pillar present (the helper, the standalone template, default afterimages, 12 complications)
- [x] UI pillar: the player surface is N/A here with rationale (plan doc 4); debug surfaces are included
- [x] Wiring section connects them

## Vision audit

- [x] **No Vision premise is contradicted.** The god's seat is unchanged: fights inherit the hand, and no new divine verb exists (charter rule 7).
- [x] **The living-world premise is served:** unthreaded mortals fight and leave marks, and several mortals' blows add up on one monster.
- [x] **Narrative over mechanical perfection** is served by the named factor lines (the reader sees *why*) and the results as story beats.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes rules of play: a **new §7 subsection, "Fights"**. It covers: nerve, then up to three exchanges; the opponent's clock and its persistence; harm in quintessence and conditions; stand or yield by values and the god's lean; temper at half clock; edges from the world. It is written `[IMPL]` as each slice lands (FB2 onwards). The quick-reference card gains one **Fights** line when FB7 lands.
- [x] `Docs/canon/rulebook.md` is updated in the implementation PRs (listed in the slices), not in this plan-doc PR. An `[IMPL]` sentence must land with the code it describes.

> Brainstorm companion: `Docs/plans/2026-09-23-fight-block-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every number is in `fight-constants.ts` (constants table); cards are words mapped by one table |
| 2. Inspectability | PASS | Four trace types; every modifier is a named factor line; `getFightState` / `inspectOpponentCard` |
| 3. Determinism | PASS | No new stream; the fork coin is drawn only inside the neutral band, after the core's draws; golden streams are unchanged for non-fight steps |
| 4. Fail-soft | PASS | See the fail-soft table; the default card keeps every fight runnable |
| 5. Narrative over mechanical perfection | PASS | Results are story beats; marks and advantages make fights about the people in them |
| 6. Additive over destructive | PASS with note | Every field and union member is additive. There are two behaviour changes: (a) skipping the generic quintessence band consequence applies **only** to fight steps, which do not exist before FB7; (b) the `spell_price` split changes a warded caster's settlement on the live `use × Power` cell. That is intended, and covered by FB3's regression test |
| 7. Performance budget | PASS | O(1) per fight step (one card read, one clock write, a few raises); the advantages read is once per fight; there is no per-tick work (lazy recovery) |

## Done when

- [ ] FB1–FB7 each closed by its own PR, with that slice's Done-when evidence from § Slices in the closing commit or completion comment
- [ ] `stepResolutionGolden.test.ts` untouched and green at every slice (non-fight behaviour unchanged)
- [ ] FB7's 400-fight fixture calibration (the "Major elite / bold guard" row, see FB7's Done-when) sits within ±10 points of THR-1531 on every result class
- [ ] UL terms seated by delegation, each in the slice that lands it: **Fight**, **Opponent card**, **Dread**, **Might**, **Nerve (step)** and **Clash (step)** in FB1; **Clock (fight)** and **Exchange** in FB2; **Fight advantage** in FB7. Each entry disambiguates from existing senses: *advantage*, not graph *Edge*; *clock (fight)*, not the doom clock; *Opponent card* (a fight's rating record), not a **Card** (the god's repertoire) or a nudge card; *Might* (an opponent rating), not the `DealContextTag` `might` (a card-context tag a clash step's deal may also carry: the senses agree, so neither is renamed); *Dread* (an opponent rating), not the Iron lexicon word 'Dread' (`src/types/traits.ts:156`); *momentum* (fight), not `Battle.momentum`
- [ ] Rulebook §7 "Fights" subsection `[IMPL]`, systemic wiring guide (new template fields, effect types, complication requirement), interface map rows, and matching wiki pages updated in the slices that land each behaviour
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, and a 30-tick CLI smoke per slice; the closing commit body carries the close keyword for that slice's issue
- [ ] `Browser-verify exempt: engine + content, no src/components change` on FB1–FB6. FB7 wires the forecast (`buildNudgePhaseModel.ts`) and owes the four-part browser evidence

## Coordination block

**Suggested model:** opus for all slices. They touch the hottest resolution path, and FB2–FB4 carry the invariants.

**Parallel-safe with:**
- plan doc 3's M1 (monster card and `isMonster`) is **blocked by FB1**, because `MonsterState` imports FB1's `FightRatingWord`. Once FB1 lands, M1 is parallel-safe with FB2–FB4: it writes `monsterState` on elites and the fight slices only read it, and the files are disjoint (`lairEscalation.ts`, `types/monster.ts`, the predicate callers);
- plan doc 1's D1 (defeat faces) is **blocked by FB4, FB7 and plan doc 3's M1**: it consumes the forks' results, extends `getFightState` (FB7) and calls `isMonster` (M1).

**Mutex with:**
- FB1–FB5 and FB7 with each other: all edit `unifiedActionResolution.ts` (FB7 for the group-step skip, the advantage read at fight start and the complication context), so they run in sequence via the blocked-by chain;
- FB7 with any slice editing `buildNudgePhaseModel.ts`;
- FB1–FB5 and FB7 with THR-1535 (the road-wide standing-modifier fix): both edit `unifiedActionResolution.ts`. Land THR-1535 before FB1 or after FB7, never interleaved;
- FB1 with THR-1534 (the ward fix): both edit `src/engine/groups/bandOpposition.ts`. **Moot now:** THR-1534 merged on 2026-09-23 (PR #1990), so FB1 builds on it;
- FB3 with any slice editing `phaseQuintessence.ts`;
- FB6 with any slice editing `src/types/effects.ts` or the effect executors;
- FB7 with any slice editing `src/data/complication-templates.ts`;
- FB7 with plan doc 3's M2: both edit `src/data/monster-encounter-content.ts` (FB7 registers `fight.lair.confront` there). M2 is blocked by FB7, so this holds by construction;
- FB7 with plan doc 3's M1, plan doc 1's D1 and plan doc 4's F1/F2: all edit `src/debug-bridge.ts`/`.d.ts`, and M1 also edits `scripts/cli.ts`. D1 and F2 are blocked by FB7, so this holds by construction; M1 runs before or after it.

**Files to touch:** FB1: `types/unifiedAction.ts`, `unifiedActionResolution.ts`, `engine/resolutionModifiers.ts` (the optional `encounterType`), `engine/groups/bandOpposition.ts` (skip fight steps), new `data/fight-constants.ts`, new `engine/fights/opponentCard.ts`, new `engine/fights/fightStepInputs.ts`. FB2: `+unifiedActionLifecycle.ts`, new `engine/fights/fightClock.ts`, new `engine/fights/fightOutcome.ts` (the dispatcher), `unifiedActionResolution.ts` (its call site in `executeStepResult`), `engine/agentLifecycle.ts` (the `'fight'` cause), `engine/agentDetail.ts` (`DEATH_CAUSE_WORDS.fight`; `killerIsKnown` for fight deaths). FB3: `+phaseQuintessence.ts`, `outcomeConsequences.ts`, new `engine/fights/fightHarm.ts`, `engine/encounterAftermath.ts` (extract `applyConditionToActor`; the `case` delegates to it). FB4: new `engine/fights/fightForks.ts`, `unifiedActionResolution.ts` (the fight-step handler that calls it). FB5: `unifiedActionResolution.ts` (the handler raises), `engine/effects/effectEvents.ts` (the `combat` field and `getStackTriggers`), `effectEventDispatch.ts`, `effectPredicates.ts`. Trace registration (FB1, FB2, FB4): `src/types/trace.ts`. FB6: `types/effects.ts`, `engine/effectExecutors.ts` (the executor branch), `engine/effects/effectEvents.ts` (the one-shot path), `engine/effectTick.ts` (the per-tick path), `encounterAftermath.ts`. FB7: `unifiedActionResolution.ts`, new `engine/fights/fightAdvantages.ts` (`readFightAdvantages`), new `engine/fights/fightAllies.ts` (`getCompanyMembersAtHex`), `components/Game/encounter-stage/adapters/buildNudgePhaseModel.ts`, `components/Game/encounter-stage/useNudgeHand.ts`, `components/Game/encounter-stage/adapters/buildUnifiedEncounterStageModel.ts`, `engine/encounters/stepFactorLines.ts` (the whisper sentence; its fix site `buildNudgePhaseModel.ts:476` is listed above), `engine/chapterArchive.ts` (the past-step label), `data/monster-encounter-content.ts` (the registration), `src/testing/contentInvariants.ts` + its reachability test, new `data/fights/fightBlock.ts`, new `data/encounters/fight-lair-confront.ts`, `data/unified-action-templates.ts`, `scripts/compile-encounter.ts`, `data/complication-templates.ts`, `types/complication.ts`, `engine/complicationEffects.ts`, `debug-bridge.ts`/`.d.ts`, `scripts/cli.ts`. Docs per the DoD: rulebook §7, the systemic wiring guide (new template fields and effect types), the interface map, the wiki pages whose `sources` match.

## Notes for the executor

- **Do not** build a round loop or a new resolver. Every fight roll is `resolveStepCore`. If you find yourself computing a probability outside it, stop.
- **Do not** let authors wire fight behaviour through step effects. The marker drives everything, and systemic fights must behave identically to authored ones.
- `markMortalDead` exists (THR-1430). This doc never kills anyone; defeat faces are plan doc 1. FB2 adds only the `'fight'` cause and its sheet word, so that plan docs 1 and 3 share one union member instead of racing to add it.
- Monster cards arrive with plan doc 3. Until then, test against derived and default cards, and against a fixture node carrying a hand-written `monsterState`.
- The regional-scale override is the number most likely to be "fixed" by a well-meaning edit. Its test is the guard. Read THR-1531 before touching it.

## Intent-judge verdict

*intent-judge, run 6 of 6, 2026-09-24. **Allow**, impact class Reversible (judge-confirmed).*

- **Model slip, recorded:** `INTENT_JUDGE_MODEL` is `fable`, but the account's Fable limit was exhausted (HTTP 429). All six runs were on Opus 5.5, at the spawner's direction. The judge recorded the anti-correlation slip, so treat this as a partial-guarantee verdict. Impediment #1060 has the details.
- **Run history:**
  - runs 1–3: Revise with 11, 11 and 10 findings;
  - run 4: Revise with 4 blocking;
  - run 5: Revise with 4 blocking and 8 non-blocking:
    - the no-roll end as a route through the resolution tail;
    - the trigger ladder fed from the fight result;
    - the clock filled mid-fight;
    - pure reads for the forecast;
  - run 6: Allow, with 1 GAP and 7 advisories.
- **Run 6's advisories, applied before commit:**
  - A1: `fight_clock` is routed at all three `resource_manipulate` sites: the executor, the one-shot item path and the per-tick path. FB6's paths are corrected, with a reactive-nested test and the item attached after the nerve step. The exhaustiveness-guard claim is narrowed to `inflict_condition`.
  - A2: the mailbox drains at step start and at the clock-full check. It is cleared before the nerve step's raises, and a complication writes a per-fight clock directly.
  - A3: precedence within one clash: `overcome`, then temper, then concession. No fork runs once a result is set.
  - A4: the no-roll branch's leftovers are placed:
    - skipped: the faction block and the `action_execution` trace;
    - run: the resolution telemetry;
    - hoisted: two locals.
  - A5: the event node's `stepReach` joins the resolved-reach readers.
  - A6: Fame follows THR-1532's decided rule (`reputationScore` in the top band, the sheet's *Revered*), replacing THR-1264's nonexistent `blood_drawn` reputation. Both corrections go on THR-1264, with a veto invited.
  - A7: a citation fixed.
- **Sibling edits folded in:**
  - `applyConditionToActor`'s `opts.edgeProperties` (plan doc 1's scar);
  - `actorAffinities: ['individual']` on `fight.lair.confront` (plan doc 6's query resolution);
  - `killerIsKnown` reads a fight death as seen (plan doc 4's lair card);
  - the Company advantage excludes the fight's opponent (plan doc 5).

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-24 (three sonnet auditors, in parallel, after the intent-judge Allow).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | "All live in a new `src/data/fight-constants.ts`" — ~30 named constants tabled; Kill criteria names `FIGHT_EXCHANGE_CAP`, `FIGHT_CLASH_HARM_MULT`, `FIGHT_RATING_DIFFICULTY` as the tuning levers, "none needs a code change" |
| 2. Inspectability | PASS | 4 registered trace types (`fight.step`/`fork`/`end`/`clock`, each extending `TraceBase`) + debug accessors (`getFightState`, `inspectOpponentCard`, `spawnFight`); Wiring table matches `wiring-checklist.md`'s own column format (Module/Phase/UI/GameState/Trace/Debug) with every row populated, not left blank |
| 3. Determinism | PASS | PRNG-callout table pins every draw to an existing stream; "No `Math.random`. The fork draw is ordered after the step core's draws, so the existing golden streams are unchanged"; `stepResolutionGolden.test.ts` pinned green |
| 4. Fail-soft | PASS | 16-row fail-soft table (unbound opponent, malformed `monsterState`, dispatcher throws, stale mailbox value, etc.); e.g. "`onFightEnded` throws ... the action stays resolved; no partial retry" |
| 5. Narrative over mechanical | PASS | Vision audit: "results as story beats"; the `separated`/`routed` split is argued in-doc specifically to keep prose honest about agency ("did not break in fear, and `routed` would write ... a departure they did not choose") |
| 6. Additive over destructive | PASS-with-note | Blast Radius: "Additive optional fields only" on all high-importer types. Self-flagged exception: the `spell_price`/`prevent_loss` split changes settlement for one live caller (a warded caster now pays), named explicitly and covered by "FB3 carries a regression test" |
| 7. Performance budget | PASS | "O(1) per fight step (one card read, one clock write, a few raises) ... there is no per-tick work (lazy recovery)"; exchanges hard-capped at `FIGHT_EXCHANGE_CAP` |

NFP AUDIT: PASS-with-notes (see rows above)

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All 5 template subsections present: systems design (§1–12, exhaustive), graph nodes/edges, tick phases, resolution logic, PRNG callouts table |
| Content | present-and-substantive | All 4 subsections present: encounter templates (`fightBlock`, `fight.lair.confront`), prose table (default afterimages), attachment content (N/A-with-reason: reuses existing conditions), data tables (12 complications) |
| UI | present-but-thin | Debug inspection fully present (`window.__DEBUG` accessors, CLI). Player-facing display and Event notifications addressed via cited N/A-with-rationale (deferred to plan doc 4 / plan doc 1). **Visual presence (HexMapV2) subsection is entirely absent — no header, no content, not even an N/A line** |

**Missing-required-sections list:** UI § Visual presence (HexMapV2) — absent. All other Engine/Content/UI subsections present.

**Wiring check:** Yes. The Wiring table matches the template's exact columns (Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility) and every row is populated with real values for every module the doc introduces, including explicit "— (plan doc 4)" markers where UI is deliberately out of scope.

**Substrate-existence check:** Present and strong. The `## Substrate inventory` table cites 17 existing subsystems with extends/reuses/composes/untouched dispositions. It explicitly reconciles both 🟠 DORMANT badges it touches (Spheres & Quintessence; Companies & Group Travel) with cited runtime evidence and a named generator bug (THR-1259), and explicitly disambiguates the new fight system from "War, Armies & Battles" (🟢 ACTIVE, inventory's own "do not green-field" warning) by field and scope — precluding the exact collision this check exists to catch. No green-field duplication found.

**PILLAR AUDIT: PASS-with-notes** — UI pillar omits any Visual presence (HexMapV2) disposition; plausibly legitimate N/A for an engine-only doc but left unstated.

**Author's response:** the missing subsection is added (§ UI pillar, "Visual presence (HexMapV2)": none, with its reason). No audit returned FAIL or REVISE.

### Vision audit

[design-audit-overflow: the auditor's one-line reading note is omitted (it ran `npm run vision-audit`, found it a citation-grep heuristic, and read all five Vision files directly); sections 1–3 and the verdict are verbatim.]

**1. Vision premises touched**
- `00-north-star.md` → "the nudge shifted the odds, fate picked the band, and the fork was always the mortal's to take" — **extended** (concession/temper forks via `decideBranchPole` + card lean + coin, applied to a new physical-fight domain)
- `01-core-loop.md` → "portfolio scan → curated encounter → aftermath" — **confirmed** (fight steps are ordinary encounter steps in the existing veil; no new phase, no new resolver, aftermath keys on `fight:<result>`)
- `02-non-negotiables.md` → #1 god-not-protagonist, #2 narrative-over-mechanics, #3 prose-not-numbers, #4 graph-edges — **confirmed** (no direct control anywhere in the fork logic; self-audited NFP #5; raw numbers confined to `window.__DEBUG`, UI Laws 13/14 cited for the one UI-touching slice; "No new node types, no new edge types" stated explicitly)
- `03-design-tensions.md` → tension 2 (emergence vs. authored) — **confirmed**, navigated; tension 3 (divine remove vs. attachment) — **confirmed** (permanent scars/deaths/grudges, no reload)
- `taste-profile.md` → "Player is a god, never a protagonist"; "Numbers in UI" anti-pattern — both **confirmed/respected**

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- North star: Yes — the fork mechanic is a near-literal instance of the north-star's central described moment, extended into fights.
- Core loop: Yes — reuses existing step/veil/aftermath machinery; adds no phase or resolver.
- Non-negotiables: Yes — mortal sovereignty held (probabilistic forks only); graph purity and prose-only surfacing preserved.
- Design tensions: Soft note — this doc is almost entirely engine mechanism; authored content is thin here, but explicitly deferred to sibling docs 1/3/4/5, a stated division of labor.
- Taste profile: Yes — no numbers reach the player surface; austere voice preserved via the reused veil.

**VISION AUDIT: PASS-with-notes** [design-brief-stale]
