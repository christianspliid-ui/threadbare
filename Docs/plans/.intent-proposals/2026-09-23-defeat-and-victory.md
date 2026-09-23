# Action Proposal — defeat, death and victory (Physical Conflict plan doc 1 of 6)

## intent_quote

Christian, chat, 2026-09-23. His direction on the fight research:

> the learnings and direction here is good, make sure we also are prepared to integrate spells when we get those up and running. this is a large design as far as i can see at the level of encounters and undertakings?

His delegation for the night:

> well i am going to bed. you have tons of tokens and time all night to work on this map, you have free roam to take the feature as far as you can design wise. also you can move elements of it into ready for dev so there is enough for our execution agent to work on tonight also. see you tomorrow

Charter rule 6 (Christian, 2026-08-26, map Notes): **"Death is band-gated (decisive/critical outcomes only) and defeat wears many faces — yield, rout, capture, humiliation, scar + grudge, spared."**

## scope (what this plan does)

This plan turns fight results into world writes through existing systems, in two slices.

**D1: the fighter's side of defeat.**
- **The ending faces:**
  - broke off, yielded and routed, with drift toward prudence;
  - struck down, then mauled or slain, decided by the victor's nature (monster temper kill chance; for mortal victors, the mercy pole).
- **Guards:** The First never dies in a fight, and neither does the god's avatar. The `death_prevented` ward is honoured. (Band casualties honouring it was THR-1534, its own ticket, merged 2026-09-23.)
- **The death itself:** it goes through the existing `markMortalDead` funnel with a new `'fight'` cause.
- **Writes:** a new permanent Scarred trait, and a new `blood_drawn` grudge cause (toward monsters too).
- **Reactive loop:** fight deaths feed it through an optional-source form of the existing outcome-node writer.

**D2: victory yields and the chronicle.**
- **Rewards:** one reward-pool draw for felling a monster, and one for bargaining: at a major lair both draw on the `success` curve (the pool has no curve between `success` and `failure`), and at a legendary lair the kill draws on `critical_success` and the bargain on `success`.
- **Reputation:** gratitude toward the settlement nearest the lair, and standing for beating a mortal (a `reputation_with` write, not the UL's world renown).
- **Drift:** toward mercy after a bargain.
- **Chronicle:** one `fight_ended` event type, with eleven face lines tiered notable or routine.

It carries out THR-1266 (with its correction) and THR-1270.

## scope (what this plan does NOT do — explicit non-goals)

- No fight mechanics (plan doc 2), no monster or lair writes (plan doc 3) and no fight UI (plan doc 4). Existing surfaces render the marks; the fight chips and moments belong to plan doc 4.
- No capture or captivity (there is no substrate; v2 layer), and no witnessed-by reputation spread (v2).
- No new reward system, trophy catalog, death mechanism or essence source for the god.
- No wiring of the agent-mode victor's mercy decision into the duel flow. That is plan doc 5; the constant and the decision shape are defined here.
- No refactor of `phaseAgentLifecycle`'s removal-mode death.

## impact_class

Reversible, with one caveat on a world-state change: once D1 ships, fights can kill mortals (rarely, gated and guarded). That's the ruled design (charter rule 6), and the kill chances are constants. The band-casualty ward fix, which changes existing behaviour, moved to THR-1534.

## evidence cited

- **Linear issue:** THR-1258 (closed map); decision tickets THR-1266 (+ correction), THR-1270, THR-1261, THR-1531.
- **Vision premises invoked:** defeat wears many faces; harm becomes a drive (rulebook §10.7); the living world keeps score.
- **UL terms touched:** Grudge, Grievance, Quintessence, Broken. New terms **Struck down** and **Scarred**, seated by delegation in the slices.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §7 and §10.7, `Docs/canon/interface-map.md`, `Docs/canon/systems-inventory.md`.
- **Prior tickets built on:**
  - THR-1430 (`markMortalDead` funnel; its doc comment names this framework);
  - THR-1438 (grudge causes);
  - THR-1206 (reputation);
  - THR-1234 (reward minting).
- **Rejected approaches:** death on any critical failure, difficulty-scaled death, a separate death funnel, a trophy catalog. The reasons are in the brainstorm companion.

## load-bearing decisions touched

- **Everything is a graph node or edge:** respected. There are no new node or edge types. Marks are `has_trait` and `hostile_to`, and deaths go through the retained `deceased` mark.

## high-impact files touched (from Codesight)

`src/types/gameState.ts` (613 importers) gains one `TickEvent.type` member, `fight_ended` (D2); `src/types/trace.ts` (134) gains one trace category (D1). Both are in the plan's Blast Radius section. The `MortalDeathCause` member moved to plan doc 2's FB2.

## kill criteria

- If D1's seeded kill-chance distribution misses its constant by more than 1 point over 10k rolls, the draw is wrong. Fix it before merge.
- If The First or the avatar can die in any test path, that is a blocking defect.
- After merge, if mortals die too often in play, lower `FIGHT_KILL_CHANCE_BY_TEMPER` (constants only).

## explicit user sign-off

N/A (Reversible). Charter rule 6 is quoted above, and the delegation is quoted in `intent_quote`.

## author notes for the judge

- **Third revision (after run 3's Revise, 3 GAPs):** one ending-face union (plan doc 2's `FightEndingFace`, 11 members) keys the trace, the tier table and the line table, and yielding to a mortal is notable in the prose table too; the victor is written as the existing `inflictedBy` edge property and read through the grudge clause, the chronicle line and plan doc 4's chip, with no invented sheet phrase; D1 is blocked by THR-1536; settlements are the registry's `LOCATION_CLASSES.settlement`; the proposal's stale lines are fixed; D1 also corrects the UL Narrative Event sentence.

- **Second revision (after run 2's Revise, 12 findings):** the reactive loop emits the plot's exact shape, and the grief-routing gap it shares with the plot is filed as THR-1536 (Ready for Dev); the trophy recipe is keyed by `AttachmentCategory` (`possession`), with no narrowing and no sphere claim in v1, and the bargained curve and the 5% bad-outcome flip are stated; `writeGrudge` passes `upgradeCause`; home and settlement are defined (`originLocationId`, `SETTLEMENT_SUBTYPES`, the lair excluded); Scarred carries `#negative` and goes through the applier, with `scarredBy` justified; D1 is also blocked by M1; `ending` is the `FightEndingRecord` (four optional fields added in plan doc 2); NPC-mode mortal victors never kill, and the mercy coin is plan doc 5's; kill criteria recalibrated on kill checks with a minimum sample; UL Struck down seated in D1, with the `scar` contract updated; tiers renamed notable/routine, and yielding to a mortal is notable, so humiliation reaches the chronicle.

- **Revised after a first judge run (Escalate on humiliation, plus 10 Revise-class items).** Humiliation is now decided under the 2026-09-11 blanket delegation (charter rule 6 names it; how it works is the agent's call), recorded on THR-1266 with a veto invitation: yielding to a person costs face at home, and the victor gains renown. The chronicle now rides `phaseNarrative`'s real path (a `TickEvent` with significance ≥ 0.8), the trophy goes through `drawSeededReward`, `blood_drawn` joins all three provenance sets and the sheet clause, Scarred is a `trait.scar.*` condition in the existing catalog, The First's floor moved to plan doc 2's FB3, kill criteria are in the plan with thresholds, and the band-casualty fix is its own ticket (THR-1534).

- The First carve-out is the map's most veto-able call. It is flagged in the plan and on THR-1266, and a veto changes one guard.
- The THR-1261 "no death API" premise was stale. The funnel exists (THR-1430), and the correction was posted on THR-1266 the same session. The plan calls the funnel and does not extract one.
- The UI pillar is N/A by the map's carve-up. Existing chronicle, sheet and possessions surfaces render every mark this plan writes, and plan doc 4 adds the fight chips.
