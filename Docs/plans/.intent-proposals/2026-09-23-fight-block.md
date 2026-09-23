# Action Proposal — the fight block (Physical Conflict plan doc 2 of 6)

## intent_quote

Christian, chat, 2026-09-23. His direction on the fight research:

> the learnings and direction here is good, make sure we also are prepared to integrate spells when we get those up and running. this is a large design as far as i can see at the level of encounters and undertakings?

His delegation for the night:

> well i am going to bed. you have tons of tokens and time all night to work on this map, you have free roam to take the feature as far as you can design wise. also you can move elements of it into ready for dev so there is enough for our execution agent to work on tonight also. see you tomorrow

## scope (what this plan does)

This is the engine core of individual fights. It covers:
- a `fightRole` marker on ordinary `ActionStep`s, which the engine runs as a fight:
  - opponent-rated difficulty at regional scale;
  - a runtime reach override;
  - an action-local `fightState`;
  - a persistent opponent clock with a single writer;
  - early end;
  - floored quintessence harm and band conditions;
  - momentum;
  - runtime concession and temper forks through the existing pole-decision function;
  - fight effect events;
- three effect-vocabulary additions, so spells, items and monster powers act on fights (the spell-readiness condition);
- edges from the world and allies read at fight start;
- mid-fight complications through the existing pipeline;
- the `fightBlock` authoring helper and the first standalone fight template;
- debug accessors and a CLI spawn.

It is filed as seven sequential slices with engine/content headless evidence. It carries out the decisions on the closed Physical Conflict map (THR-1258): THR-1263, THR-1531, THR-1269, THR-1530, THR-1265, THR-1532 and THR-1271.

## scope (what this plan does NOT do — explicit non-goals)

- No player-facing fight surface. The opponent header, clock pips, fight chips, lair card and chronicle lines are plan doc 4 (THR-1272). Fight steps render as ordinary steps until then.
- No monster entity work. `monsterState`, the families, temper traits and the `isMonster` exclusions are plan doc 3. This doc only *reads* the card.
- No defeat faces, deaths, scars, grudges or victory rewards. Those are plan doc 1 (THR-1266, THR-1270), which consumes `fightState.result`.
- No mortal-vs-mortal opposed rolls (agent mode, plan doc 5) and no hunts (plan doc 6).
- No new resolver, round loop, node type, edge type or divine verb.
- No applying a cast's effects mid-fight. That waits for the spell system (THR-1530); this doc only makes the vocabulary and events ready.
- No change to non-fight steps. The golden resolution test stays green untouched.

## impact_class

Reversible. Every field and union member is additive. No shipped template carries `fightRole` until the last slice, and each slice ships behind its own tests. It is not External: no skill or agent-facing process doc is edited. The wiring guide and rulebook updates are ordinary DoD docs that land with each slice.

## evidence cited

- **Linear issue:** THR-1258 (the map, closed with a carve-up comment), plus the decision tickets named above.
- **Vision premises invoked:** the living world, the god's seat, narrative over mechanics (no Vision edits).
- **UL terms touched:** Encounter, Step, Band, Quintessence, Condition, Cast, Reach; new UL terms land with their slices: Fight, Opponent card, Clock (fight). Agent-seated under the 2026-09-11 blanket.
- **Canon pages consulted:** `Docs/canon/encounters.md`, `Docs/canon/rulebook.md` §7, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`, `Docs/design-system/laws.md` (for the UI N/A rationale).
- **Prior plan docs / tickets built on:**
  - THR-1260 (compile-time macro recommendation);
  - THR-894 (agent-decided branches);
  - THR-1239 (effect activation program);
  - THR-1244 (condition proxy events);
  - THR-1430 (`markMortalDead`, used by plan doc 1).
- **Rejected approaches considered and dismissed:** a new step kind, nested sub-templates, the contested round resolver, compiled forks, mid-list blocks. The reasons are in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node or edge:** respected. There are no new node or edge types; the clock is a property bag internal to the opponent node.
- **No inventing node types:** respected.
- **Relationships are edges, not properties:** respected. The opponent is referenced by cast binding or target, per action, not stored as a node property.
- **Reaches and Spheres are orthogonal:** untouched.
- **Encounter awareness is hex-granular:** untouched. Triggers are plan doc 3.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` (~475 importers): additive optional fields and one union member. The plan doc has a Blast Radius section.

## kill criteria

- If FB7's 400-fight fixture calibration misses the THR-1531 calibration by more than 10 points on any result class, stop before merge and diagnose it.
- If `stepResolutionGolden.test.ts` goes red on any slice, the slice has changed non-fight behaviour. Revert that part.
- After merge, if fights read wrong in play, retune through the constants table only.

## explicit user sign-off

N/A (Reversible). Direction and delegation are quoted above.

## author notes for the judge

- **Fifth revision (after run 5's Revise, 4 blocking):** B1: the no-roll end is a route through the resolution tail. `StepResolutionResult.fightEnd` is passed through the loop's `resolutionStats` to a no-roll branch of `executeStepResult`, which skips the roll-dependent block but runs `onFightEnded`, `fight.end`, `combat_ended`, the action triggers, the aftermath, the resolved event and the event node. The same pre-roll check ends later steps `opponent_gone` / `separated`. B2: the action-trigger ladder is fed `FIGHT_RESULT_ACTION_OUTCOME[result]`, and fight steps carry no step reward pool (a catalog invariant). B3: the clock-full check runs once per clash step after the landing write, the event raises, the mailbox drain and the complication; a blow landed this step plus a full clock ends `overcome`; only death ends a fight `opponent_gone`. B4: `readFightAdvantages` / `resolveFightStepInputs` are pure; the handler spends the favour at `fightState` creation and the secret after its clash. Polish: the forecast's post-roll floor stated in §3b; `resolutionStats` built by the loop from `StepResolutionResult`; an optional `combat` field on `encounter_outcome` for `combat_success`; `combat_started` timing stated; the attended predicate is `effectiveTier === 'story_beat'`; `advanceFightClock` applies pending recovery first and the paused preset touches the world; past-step labels read `StepProseRecord.reach`; `fight.lair.confront` registers in `MONSTER_ENCOUNTER_TEMPLATES`; the trace's `scale` is `ActionScale`; the PRNG table lists the raises; the wiring table gains the promised rows; the last-clash quarter rule is stated. Sibling asks: the critical-band conditions (rout → `terrified`, struck down → severe `wounded`, THR-1266); `onFightEnded` returns `{ events, fightState }` and merges branch patches; `opponentEnding` is declared for plan doc 5; the mailbox's one-live-fight assumption is recorded; Fame keys on a Legendary reach reputation in the clash reach, replacing THR-1264's nonexistent `blood_drawn` reputation.

- **Fourth revision (after run 4's Revise, 4 blocking):** the no-opponent check moved to the start of `resolveUncontestedStep` (before any roll; `endFightWithoutStep` appends no outcome); the critical-failure short-circuit runs first, so `routed` maps to `critical_failure`, and FB2 tests every result's mapped outcome; the handler sits after consequence selection and before growth and `advanceStep`; the resolved reach and difficulty ride `resolutionStats` to every post-roll reader (growth, promotion, charges, prose record, telemetry, `encounter_outcome`); band opposition skips fight steps (FB1, mutex with THR-1534); a fight inside a branch is a planted sequel in v1, recorded on THR-1269 with a veto invitation; the forecast mirrors the post-roll floor; band deltas vs mailbox writes are separated, and a clock full at fight start falls on the first landing blow. Sibling asks: `FightEndingFace` is one declared union; FB3 extracts the condition applier as `applyConditionToActor`; `FightEndingRecord` gained its four audit fields; `conditionsApplied` / `storiedClimbs` declared; an opponent that is the fighter, dead or missing never fights.

- **Third revision (after run 3's Revise, 10 findings):** the forecast applies the core's scale step (`applyScaleDifficultyAdjust`) inside `forecastWithNudges`; the four placeholder-difficulty readers (growth, the header's threat and reach labels, the whisper card, the forecast) route through `resolveFightStepInputs`; every fight predicate context carries `encounterType: 'combat'` (an optional parameter on `computeResolutionModifiers`); per-fight clocks take effects through a `pendingFightClockDelta` mailbox on the node; complication fight effects are read by the handler (the `partial_progress` precedent), with `fight_condition` replacing the inert `attachment` path; the terminal rule is a catalog content invariant and the fight is registered as a third aftermath variant-key producer; nerve-only advantages are read before `fightState` exists; prose placeholders corrected; 'Opponent card' disambiguated from Card; `spawnFight` moves the hero and returns the action id; FB7's browser evidence uses a named mortal; 'behind' counts blows landed; `no_opponent` records no step outcome; results map to the action's final outcome through `FIGHT_RESULT_ACTION_OUTCOME`.

- **Second revision (after the re-run's Revise, 11 findings):** the result memory moved to `fightResultIndex(steps)` (past the terminal block) and fork decisions to `fightState.forks`, so the hand's card records are never shadowed; `resolveFightStepInputs` feeds both the roll and the attended forecast and reads the fighter's standing modifiers (the road-wide gap is filed separately); the crit-severity scale read; FB7 blocked by FB5 and owning the forecast wiring with browser evidence; UL disambiguations for Might, Dread and momentum; named constants for the temper fraction, Dread offsets and the placeholder difficulty; 'behind' defined; `fight_offer_quarter`'s side rule; the separation deviation from THR-1530 stated.

- The plan is large, but it is sliced so the build queue can start tonight with FB1 while plan docs 1 and 3 are written. FB1 has no dependencies.
- The UI pillar is deliberately N/A for the player surface. The map's carve-up puts the fight surface in its own plan doc (4), so this core can be verified headlessly (THR-688 rule C). Debug accessors are included.
- R1–R5 code research (this session, current `main`) grounds the anchors: `advanceStep` is the only progression function; `decideBranchPole` is pure; `difficultyContext` is a closed enum for catalog-serialization reasons; the carryover mechanism exists. Where earlier research was stale (THR-1261's "no death API"; THR-1262's "wandering elite"), the plan cites the corrected facts.
