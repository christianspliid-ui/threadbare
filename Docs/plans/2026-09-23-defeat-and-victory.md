> **title:** Defeat, death and victory — what a fight leaves in the world (Physical Conflict plan doc 1 of 6)
> **linear_issue:** THR-1258 (wayfinder map, closed 2026-09-23; slices filed on handoff)
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `done` · Content `done` · UI `N/A here — existing surfaces render every write; fight chips are plan doc 4 (see § UI pillar)`

# Defeat, death and victory — what a fight leaves in the world

*A fight that changes nothing is a dice roll. This doc makes every ending write something the world remembers: a scar, a grudge, lost face, a death with a culprit, a trophy, a town's gratitude. Every write goes through a system that already exists.*

## Why this is load-bearing

The fight block (plan doc 2) produces a result: `overcome`, `driven_off`, `bargained`, `yielded`, `broke_off`, `routed` or `struck_down`. Nothing in that doc writes the *consequences*. The map's watchability finding (THR-1263) was that the games people actually follow make fights leave marks: Wildermyth's transformations, Crusader Kings III's scars, Dwarf Fortress's histories. Christian's charter (rule 6) asked for "defeat wears many faces — yield, rout, capture, humiliation, scar + grudge, spared", with death band-gated and rare.

This doc turns results into marks, with **no new reward system** (THR-1270's guard) and **no new death mechanism**. The existing `markMortalDead` funnel (THR-1430) names this framework as its next caller.

Decisions come from the closed map (THR-1258): THR-1266 (defeat faces, the death gate, and its correction comment), THR-1270 (victory yields), THR-1261 (substrate) and THR-1531 (frequencies). One face the map left undecided, humiliation, is decided here under the standing delegation (§2b), with a veto invited.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Death funnel (`markMortalDead`, `agentLifecycle.ts:225`, THR-1430; `MortalDeathCause` union `:168`) | 🟢 ACTIVE | **calls** it in `mode:'retain'`, passing plan doc 2's `ctx.runtime` and `ctx.overrideCtx` so the `death_prevented` ward is honoured. The `'fight'` cause is added by plan doc 2's FB2 |
| Band casualties (`bandOpposition.ts:374`, which skips the ward) | 🟢 ACTIVE (defect) | **not touched here.** The fix was its own ticket, THR-1534, and it merged on 2026-09-23 (PR #1990), before any fight code |
| Grudges (`writeGrudge`, `GrudgeCause`, `grievance/grudgeEdge.ts:33-139`; `INJURY_CAUSES` `:72`) and the motive gate's `GRUDGE_PROVENANCE` (`undertakingMotive.ts:40`, "the gate's own set is the authority") and the sheet clauses `GRUDGE_CAUSE_CLAUSES` (`src/data/grievance-prose.ts:43`) | 🟢 ACTIVE | **extends** all three with `'blood_drawn'`. Without the gate entry it reads as a rivalry (UL `Agents.md` § Rivalry), and without the clause the sheet says "something neither of them speaks of" |
| Reactive loop (`createUndertakingOutcomeNode`, `grievance/undertakingOutcomeNode.ts:131`; consumers: the mint lane `ambitionTick.ts:~392-410`, the omen portent `phaseOmenAgenda.ts:~444-462`, the receipt `foreshadowing/motiveReceipt.ts:~92`) | 🟢 ACTIVE | **extends** the writer with an optional-source form; all three consumers see a fight death as they see an undertaking harm (§3). **Known gap, not this doc's:** the victim edge of a killing reaches only the corpse, and the ambition phase walks the retained dead. That is THR-1536 (filed 2026-09-23, Ready for Dev), which fixes it for the plot and for fights at once |
| Value drift (`driftTowardPole`, `src/engine/encounters/branchDecision.ts:327`; `BRANCH_DECISION_DRIFT_MAGNITUDE` 0.08) | 🟢 ACTIVE | **reuses** it for yield/rout (toward prudence), bargain/spare (toward mercy) and a won duel (toward courage) |
| Rewards (`drawSeededReward`, `rewardPool.ts:624`, "the single seeded draw path every reward in the game runs through", THR-1146; tier curves `TIER_CURVE_*` `:383-386`; bad-outcome chances `:389`) | 🟢 ACTIVE | **reuses** it for the trophy draw. Going through it keeps `reward_tier_bonus` live, so a blessing or a future spell improves a trophy with no fight code. **No sphere flavour in v1:** `sphereTint` is not read at draw time (`rewardPool.ts:133-137`), and making it live changes what shipped encounters hand out |
| Reputation (`applyReputationWithDelta(graph, a, b, delta, tick, cause)`, `reputation.ts:233`), residence (`readResidence`, `agentResidence.ts:131`: `originLocationId` is the first position ever observed) and the settlement class of the world-object registry (`LOCATION_CLASSES.settlement`, `src/data/world-objects.ts:147`: hamlet, town, city, capital, camp, farmland; `seedLivingWorld.ts:98` already builds its set from it) | 🟢 ACTIVE | **reuses** them for gratitude, standing and humiliation. The registry is the authority; `phaseProsperity.ts`'s private four-subtype copy is not used |
| Conditions and scars (`CONDITION_TRAIT_DEFINITIONS`, `condition-trait-content.ts`; the Condition kind already owns the `trait.scar.` prefix, `content-objects.ts:289`; seeded via `ENCOUNTER_TRAIT_DEFINITIONS`, hover via `ATTACHMENT_TEMPLATE_SOURCES`; tags `#scar` and `#combat` already seated) | 🟢 ACTIVE | **extends** with one scar, `trait.scar.scarred`, in the existing catalog: no registration or seeding work is owed. The Condition kind requires a `family` and a `polarity` tag (`content-objects.ts:303`), so Scarred carries `#scar` (family) and `#negative` (polarity), both seated, plus `#combat` |
| Chronicle (`phaseNarrative`, `orchestrator.ts:2520-2563`: any `TickEvent` with `significance ≥ 0.8` becomes a `chronicleEntries` row; the panel renders `gameState.chronicleEntries`, `GameView.tsx:5132`) | 🟢 ACTIVE | **extends** with one `TickEvent` type, `fight_ended`; notable endings clear the threshold, routine ones do not |
| Court positions (`thread` edge with `courtPosition:'the_first'`) and avatars (`getAvatarsOf`) | 🟢 ACTIVE | **reads** them for the two guards the funnel doesn't carry |
| The fight block's `onFightEnded(state, action, ctx)` (plan doc 2, FB2) | ⚪ planned | **extended** here: the fighter-side branch |

Greps on `main` (2026-09-23), each 0 files in `src/`: `blood_drawn`, `trait.scar.scarred`, `fight_ended`, `FIGHT_KILL_CHANCE`, `FIGHT_HUMILIATION`, `applyFightEndingForFighter`. Nothing here rebuilds an existing piece.

## Engine pillar

### Systems design

**1. The fighter-side branch of `onFightEnded`.** One function, `applyFightEndingForFighter(state, action, fightState, ctx): TickEvent[]`, is added to plan doc 2's dispatcher (`src/engine/fights/fightOutcome.ts`). `ctx` is plan doc 2's `FightEndContext` (`tick`, `rng`, `runtime`, `overrideCtx`). Plan doc 3 adds the opponent/lair branch to the same dispatcher, and the mutex sequences the two. The results (THR-1266):

| Result | Writes (all existing writers) |
|---|---|
| `broke_off` | nothing beyond what the exchanges already wrote |
| `yielded` to a **monster** | nothing extra (THR-1266) |
| `yielded` to a **mortal** | `driftTowardPole(courage_prudence, 'negative', FIGHT_ENDING_DRIFT)` and **humiliation** (§2b) |
| `routed` | the same drift toward prudence. `terrified` and the ×3 nerve harm are already written by plan doc 2's bands |
| `struck_down` | the **victor's decision** (§2) |
| `overcome` / `driven_off` / `bargained` | the victory yields (§4) |

Whatever the face, the branch records what it wrote on the resolved action as `fightState.ending` (the `FightEndingRecord` plan doc 2's FB2 declares: face, scar, grudge, humiliation, reputation, reward). It returns that record as its patch, which plan doc 2's dispatcher merges into the `fightState` it hands back (`onFightEnded` returns `{ events, fightState }`). Plan doc 4's "scarred" and "standing" chips read this field, never the trace buffer, because traces can be off.

**2. Struck down: the death gate** (THR-1266). Only `struck_down` can kill.
- **Monster victor:** `ctx.rng() < FIGHT_KILL_CHANCE_BY_TEMPER[temper]`. With berserk at 0.15 and stubborn at 0.05, that is about 2% per visit for a bold guard against a berserk elite (THR-1531).
- **Mortal victor in agent mode** (a duel, plan doc 5): the victor's mercy decides, and that decision, its coin and its kill draw are **plan doc 5's E2**, which calls this branch's guards and funnel. This doc owns no mercy draw.
- **Mortal victor in NPC mode** (a named mortal on a derived card): **no kill check** in v1; the fighter is mauled. Only monsters and agent-mode victors can kill.
- **Guards, checked before any kill** (the funnel carries neither):
  1. **The First never dies in a fight** in v1: the fighter is the **target** of the ascendant's `thread` edge whose `courtPosition` is `'the_first'` (`ascendantBeatSeeding.ts:85-93`). They are mauled instead. **The quintessence floor is not this doc's write.** Fight harm is queued for `phaseQuintessence` and lands after this dispatcher runs, so the floor lives in plan doc 2's FB3 harm computation: The First's harm is clamped by headroom above `MEETING_QUINTESSENCE_FLOOR` (`meeting-nudge-constants.ts:124`) instead of `QUINTESSENCE_RATIO_FLOOR`. That is a cross-plan requirement recorded in plan doc 2. THR-1261's rule stands: nothing writes `properties.quintessence` directly.
  2. **The god's avatar** (`getAvatarsOf`) is never killed by a fight.
- **Draw order:** both guards first, then the single kill draw. So `killRoll` is present on the record exactly when a draw happened, and plan doc 5's E2 follows the same order.
- **Kill:** `markMortalDead(state.graph, fighterId, ctx.tick, { cause: 'fight', byActorId: victorId, mode: 'retain' }, ctx.runtime, ctx.overrideCtx)`.
  - `warded` → the mortal lives and is mauled;
  - `echo` → Aspect echo, handled by the funnel.
- **Mauled** (survived being struck down):
  - a permanent `trait.scar.scarred` edge, written **through the `apply_condition` applier**, called as plan doc 2's extracted `applyConditionToActor(graph, fighterId, 'trait.scar.scarred', opts)` (tag immunity and the proxy events come free; no duration, so it never expires). The applier's fixed edge properties (`encounterAftermath.ts:2272-2285`) do not include the culprit, so `opts` carries an additive `edgeProperties` bag merged onto the new edge: the victor written as the **existing `inflictedBy` edge property** (THR-1429's culprit field on `has_trait` edges, `undertaking-objects.ts:1107`) and a `scarredTick`. Being `#negative`, it fires the applier's `damaged` proxy, which is intended: a mauling is damage. **Why a property, not an edge:** it is provenance on the instance edge, as `inflictedBy` already is; the traversable relation is the `hostile_to` grudge written in the same step (the `slainBy` precedent, `agentLifecycle.ts:276`). **Where the player reads who did it:** the grudge's clause in the sheet's Blood section, the chronicle line, and plan doc 4's chip. There is **no new "scarred by" sheet phrase**: the Traits row renders names only (`agentDetail.ts:997`), the conditions list skips the `scar` subcategory (`agentAttachments.ts:258`), and this doc changes no component. **A second mauling adds no second scar.** The applier would add one (it mints a fresh edge id on every call, `encounterAftermath.ts:2266`, and never reads `maxLevel`), so **D1 checks first**: a fighter who already holds a `trait.scar.scarred` edge gets no second. The first scar is the story, and `inflictedBy` keeps the first victor. The grudge toward the new victor is still written, and the trace records `scarSkipped: 'already_scarred'`. A tag-immune fighter's scar is refused by the applier (`:2246-2262`), traced `scarSkipped: 'immune'`. When the applier reports `touchedStructure` (`:2287`), D1 calls `touchStructure(ctx.runtime)`;
  - `writeGrudge(graph, fighterId, victorId, tick, 'blood_drawn', { upgradeCause: true })`, including when the victor is a monster ("the beast that scarred me"). The `upgradeCause` option follows the THR-1438 precedent (`grudgeEdge.ts:44-62`): without it, a mauling on top of a standing `old_quarrel` or `covets` edge would stay a rivalry, and adding `blood_drawn` to `INJURY_CAUSES` would do nothing;
  - `wounded` is already applied by the band (plan doc 2).
- **Spared** (agent mode): scar + grudge, and the victor drifts toward mercy.

**2b. Humiliation: yielding to a person** (charter rule 6; decided here under Christian's 2026-09-11 delegation; veto invited on THR-1266). The charter names humiliation as a face of defeat, and THR-1266's menu left it out without a decision. Decided: **humiliation is what yielding to another person means.**
- When the fighter yields and the victor is a mortal (not `isMonster`), the fighter loses face with the people who know them: `applyReputationWithDelta(state.graph, fighterId, homeSettlementId, −FIGHT_HUMILIATION_REPUTATION, ctx.tick, 'fight_humiliation')`.
- **Home** is `readResidence(state.graph, fighterId).originLocationId`, resolved to its parent location (`resolveToParentLocation`) when it is a place, and used only when that location's subtype is in `LOCATION_CLASSES.settlement`. Failing that, the snapshot's `positionId` under the same test. Failing both, no write.
- The victor's side of it is **standing** (§4, THR-1270's won-a-duel line). *Standing* here is a `reputation_with` write, the UL's Reputation (`Agents.md:133`), never the UL's one-sided world renown (`reputationScore`).
- There is **no new condition**. Losing face is a reputation write. **What the player can actually see:** a −0.05 from the neutral 0.5 does not change the Standings band ("Accepted" spans 0.4–0.6, `domain-words.ts:174`), so on the sheet a first humiliation reads as a neutral row. It is legible in two places: plan doc 4's **standing** chip (BOND, ▼, `reputation with {settlement}`), and the chronicle, because **yielding to a mortal is a notable face** (§5), not a routine one.
- Yielding to a monster humiliates nobody; there is nobody to tell. **A yield with no opponent node** (plan doc 2's default card, `opponentId: null`) takes the `yielded_to_monster` face for the same reason: nobody was yielded to, so nobody tells. Its chronicle line names the foe as *its foe*.
- **Capture** stays deferred to the v2 layer: there is no captivity substrate (THR-1266).

**3. Deaths feed the reactive loop** (THR-1266, rulebook §10.7). A fight death (outcome `died`) emits through `createUndertakingOutcomeNode` with harm class `named_death`, culprit = the victor and victim = the dead: **exactly the plot's shape** (`undertaking-objects.ts:~1949-2008`). Today that shape reaches only the corpse and the witnesses at the site: the dead's bonds are never written a victim edge, and the ambition phase walks the retained dead. **That gap is THR-1536** (Ready for Dev), which routes the victim relation to the dead's living bonds (`viaBondOf`, the THR-1383 faction-leader pattern) and stops the dead pursuing. It fixes the plot and fights together, so this doc emits the plot's shape and does not build a second route. THR-1266's premise ("the dead's bonds take grievances") holds once THR-1536 lands.
- The writer takes an undertaking `project`, so D1 adds the **smallest optional-source form**: `project` is optional when `source: { kind: 'fight', actorId, actionId, templateId }` is given. The node id is `evt_und_fight_<actionId>_<tick>`, under the existing `UNDERTAKING_EVENT_NODE_ID_PREFIX`, with the existing `eventType: 'undertaking_outcome'` and one extra property, `source: 'fight'`. **The source form supplies what the writer reads from `project`:** `targetNodeId` = the victim, so the omen deed reads "the killing of <victim>" as the plot's does (`phaseOmenAgenda.ts:424`); `projectId` = the fight's `actionId`; `verb` = `'fight'` (the trace, `undertakingOutcomeNode.ts:269`).
- **All three consumers therefore see it as an undertaking harm, deliberately.** The mint lane reads the victim relation (`ambitionTick.ts:~402`). The omen portent weighs `named_death` (`phaseOmenAgenda.ts:~452`). The receipt credits it as the `undertaking` kind (`motiveReceipt.ts:~92`). To the world, a killing in a fight is a harm with a culprit like any other; the `source` property is for inspection only.
- The god stays excluded as a culprit (the writer's existing guard). A monster culprit is allowed (a monster is an `actor`).

**4. Victory yields** (THR-1270). No new reward system.

| Result | Writes |
|---|---|
| `overcome` (a monster) | **The trophy:** `drawSeededReward(state.graph, { recipe: FIGHT_TROPHY_RECIPE, outcomeType: FIGHT_TROPHY_OUTCOME.overcome[lairTier], seed: state.seed, tick: ctx.tick, actorId: fighterId, templateId: action.templateId, overrideCtx: ctx.overrideCtx, site: 'fight_trophy' })`, with `'fight_trophy'` an additive member of the content-query site union (`src/types/contentQuery.ts:119-127`), so the draw is not logged as the aftermath's `reward_draw`. Its seed key is the step route's (`unifiedActionResolution.ts:1154-1160`), which is harmless because fight steps carry no step reward pool (plan doc 2's FB7 invariant). Major versus legendary is expressed through the pool's existing tier curves, not new tags. A `success`-curve draw flips to the harmful table 5% of the time (`BAD_OUTCOME_CHANCE_SUCCESS`, `rewardPool.ts:389`): the den keeps a sting, a cursed trinket or a condition. That is intended and traced. **Gratitude:** `applyReputationWithDelta(…, fighterId, nearestSettlement, FIGHT_VICTORY_REPUTATION_OVERCOME, …)`. A chronicle event (§5). The lair and monster writes are plan doc 3's |
| `overcome` (a mortal) | **Standing:** `FIGHT_VICTORY_REPUTATION_DUEL` with the loser's faction ?? the loser's residence settlement. `driftTowardPole(courage_prudence, 'positive', FIGHT_ENDING_DRIFT)` (THR-1270's "drift toward courage"). A chronicle event |
| The **victor** over a mortal who yielded | The same standing write for the victor, with the same counterparty rule (the yielder's faction ?? the yielder's residence settlement): the other side of §2b |
| `driven_off` | `FIGHT_VICTORY_REPUTATION_DRIVEN_OFF` toward the lair's settlement, plus a chronicle event |
| `bargained` | One draw at `FIGHT_TROPHY_OUTCOME.bargained[lairTier]`: the hoard. At a major lair a bargain pays like a kill (both `success`); at a legendary lair the kill draws on the `critical_success` curve and the bargain on `success`; `driftTowardPole(mercy_ruthlessness, 'positive', FIGHT_ENDING_DRIFT)`, and a chronicle event |

The nearest settlement is a location whose subtype is in `LOCATION_CLASSES.settlement` (so the lair itself, a location on the same hex, never qualifies): the one on the lair's hex if any, otherwise the nearest by hex distance within `FIGHT_GRATITUDE_RADIUS_HEXES`, ties broken by node id (deterministic); if none is found, no reputation write happens. Growth (`applyEncounterGrowth`) and the Storied count (`recordArtifactEncounterPresence`) are already automatic on the fight road (THR-1270). The god gains nothing new.

**5. The chronicle.** The fighter branch returns one `TickEvent` per fight with its patch, and the dispatcher appends it to `executeStepResult`'s events:
- `type: 'fight_ended'`, a new additive member of `TickEvent.type` (`src/types/gameState.ts:80`; see Blast Radius);
- `significance` from `FIGHT_EVENT_SIGNIFICANCE[FIGHT_EVENT_TIER_BY_FACE[face]]`: **notable** endings (felled, driven off, bargained, a mortal beaten, **yielded to a mortal** (the humiliation), mauled, spared, slain) are 0.85, so `phaseNarrative` turns them into `chronicleEntries` rows; **routine** endings (yielded to a monster, routed, broke off) are 0.4, so they reach the event log and the digest but not the chronicle;
- `message`: the chronicle line, composed by the dispatcher from `FIGHT_CHRONICLE_LINES[face]` with the three names it already holds (fighter, opponent, place). No enrichment tokens are involved, since `phaseNarrative` copies `message` verbatim into `prose`. v1 has one line per face, with no seeded variation;
- `actorId` = the fighter, and `hexCoords`.

`tickEventTypeToNarrativeType` needs no row: its fallback, `'action_resolved'`, is right for a fight. `TICK_EVENT_COLORS` gets a `fight_ended` colour (D2; a `src/data` edit, no component change). The chronicle panel renders the rows with no component change.

### Graph nodes / edges

- **No new node or edge types.**
- Writes (all existing kinds): the `has_trait` scar edge, the `hostile_to` grudge edge, the retained `deceased` mark through the funnel, the outcome-event node (existing reactive loop), `reputation_with` edges, and the trophy `possesses` edge (through `drawSeededReward` → `instantiateReward`).
- One new condition definition node (Scarred), in the existing `CONDITION_TRAIT_DEFINITIONS`.

### Tick phases

None new. Everything runs inside `onFightEnded` during step resolution; the reactive loop's downstream grievances run in their existing phase, and the chronicle row is made by the existing `phaseNarrative`.

### Resolution logic

Two decisions:
- the kill check, a single seeded draw, only on `struck_down`, after the guards;
- the agent-mode victor's mercy pole is plan doc 5's (E2), not this doc's.

### PRNG callouts

| Draw | Stream | When |
|---|---|---|
| kill check | `ctx.rng`, the fight step's rng, drawn **after** the step core and the fork draws | only on `struck_down`, after both guards pass |
| trophy pick | `drawSeededReward`'s own keyed stream (`mulberry32(seed + tick·41 + hash(actor) + hash(template))`) | on `overcome` / `bargained` |

## Content pillar

### Attachment content
**`trait.scar.scarred`** ("Scarred"), added to `CONDITION_TRAIT_DEFINITIONS` in `src/data/condition-trait-content.ts`:
- `subcategory: 'scar'`; public; tags `#scar #combat` (both already seated); `maxLevel: 1`; **no** capability contribution (a narrative mark);
- the instance edge carries `inflictedBy` (the victor, the existing culprit field) and `scarredTick`;
- tooltip word: *scarred*;
- on the sheet it appears by name in the Traits row (`agentDetail.ts:997`); the victor is read through the grudge clause and the chronicle line, not a new phrase.

The flavour text is written in the GAME register.

**UL:** **Scarred** is seated by delegation in D1, with an Also-see to **SCAR** and one sentence: *the SCAR chip names what an encounter cost; Scarred is the one fight wound that never heals, and the chip that reports it is a SCAR.* The word "mark" is not used for the scar: UL gives it to Hidden Mark.

**Grudge clause** (`GRUDGE_CAUSE_CLAUSES`): `blood_drawn: 'one of them drew the other\'s blood'`.

### Prose tables
`FIGHT_CHRONICLE_LINES: Record<FightEndingFace, string>`, one line per face, in the new `src/data/fight-ending-content.ts`. `{fighter}`, `{opponent}` and `{place}` are the dispatcher's own three slots, filled from names it holds; they are not enrichment tokens. GAME register; GM narration, never in situ (prose doctrine):

| Face | Tier | Seed line |
|---|---|---|
| `overcome_monster` | notable | *{fighter} felled {opponent} at {place}.* |
| `overcome_mortal` | notable | *{fighter} beat {opponent} at {place}.* |
| `driven_off` | notable | *{fighter} drove {opponent} out of {place}.* |
| `bargained` | notable | *{fighter} let {opponent} live at {place}, and walked away with something.* Plain, when `ending.reward` is absent: *{fighter} let {opponent} live at {place}.* |
| `mauled` | notable | *{opponent} struck {fighter} down at {place}; {fighter} will carry the scar.* Plain, when `scarWritten` is false: *{opponent} struck {fighter} down at {place}.* |
| `spared` | notable | *{opponent} beat {fighter} at {place}, and let them live.* |
| `slain` | notable | *{opponent} killed {fighter} at {place}.* |
| `yielded_to_mortal` | notable | *{fighter} yielded to {opponent} at {place}, and everyone at home will hear of it.* |
| `yielded_to_monster` | routine | *{fighter} gave ground to {opponent} at {place}.* |
| `routed` | routine | *{fighter} fled from {opponent} at {place}.* |
| `broke_off` | routine | *{fighter} and {opponent} broke off at {place}, both bloodied.* |

**A line never claims a write that did not happen.** The two lines that name a write (the bargain's prize, the mauling's scar) carry a plain variant, `FIGHT_CHRONICLE_LINES_PLAIN`, used when that write was skipped. The executor finalizes these against the voice scorer.

### Data tables
In `src/data/fight-ending-content.ts`:
- `FIGHT_TROPHY_RECIPE`: `{ categoryWeights: { possession: 1 } }`. `categoryWeights` is keyed by `AttachmentCategory` (`possession` / `condition` / `blessing` / `curse`, `types/attachments.ts:172`), not by possession subcategory. v1 does not narrow to arms, relics or hides: `tagFilters` is all-of, `anyTags` is not passed through the recipe, and there is no seated `#vestment`. A beast's den holds whatever the pool holds.
- `FIGHT_TROPHY_OUTCOME`: `{ overcome: { major: 'success', legendary: 'critical_success' }, bargained: { major: 'success', legendary: 'success' } }`, which selects the existing `TIER_CURVE_*` per lair tier.

No reward-pool entry is retagged, and no trophy catalog is created (THR-1270's guard).

### Encounter templates
None new. `fight.lair.confront` (plan doc 2) keys its aftermath lines on the same results.

## UI pillar

*Screenshot tool: none owed by this plan's slices.*

**UI: N/A here, by design.** The player sees these marks through surfaces that already exist:
- the chronicle panel, which renders `chronicleEntries` (`GameView.tsx:5132`), so a notable ending appears with no component change;
- the agent sheet, where Scarred appears under the existing familiarity gate;
- the grudge in the sheet's Blood section, now with its own clause;
- reputation on the sheet (a humiliation's −0.05 does not move the Standings band from "Accepted", so it is read through plan doc 4's standing chip and the chronicle line, not the band word);
- the trophy in possessions.

The **fight-specific** surfaces are **plan doc 4** (THR-1272): Law-56 consequence chips for felled, scarred, slain and Storied, which read what this doc writes. Moments for followed mortals' fights are deferred to the v2 layer by plan doc 4. UI Laws engaged here: none.

### Debug inspection (DebugPanel)
`getFightState(actionId)` (plan doc 2, **FB7**) returns `ending` as the `FightEndingRecord` plan doc 2's FB2 declares: `face`, `scarWritten`, `grudgeWritten`, `humiliation?`, `reputation?`, `reward?`, `killRoll?`, `guard?`, `drift?` and `eventSignificance?` (the last four added to that declaration alongside this revision). This is the whole audit trail of an ending. Because the accessor ships in FB7, D1 is blocked by FB7.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Add a row for `onFightEnded`'s fighter branch and the `fight_ended` event.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Fighter branch of `onFightEnded` | step resolution (existing) | existing sheet (plan doc 4 adds chips) | graph writes via existing writers; `archetypeDrift` | `fight.ending` | `getFightState(...).ending` |
| Death through the funnel | same | chronicle panel (notable) | node `deceased` | `fight.ending` + funnel outcome | same |
| Reactive-loop emission | same → reactive-loop phase, omen agenda | existing Blood section, ambitions, receipt | outcome node | existing reactive-loop traces | existing |
| Trophy / reputation / humiliation | same | sheet possessions / reputation | graph | `fight.ending` + the reward pool's content-query trace | same |
| `fight_ended` tick event | same → `phaseNarrative` | `ChroniclePanel` (existing) | `tickEvents` → `chronicleEntries` | — | events log |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIGHT_KILL_CHANCE_BY_TEMPER` | `{ berserk: 0.15, stubborn: 0.05, skittish: 0, bargainer: 0 }` | Chance a monster kills a mortal it struck down (THR-1266) |
| `FIGHT_DUEL_KILL_CHANCE_RUTHLESS` | `0.25` | Chance a ruthless mortal victor kills (agent mode; wired by plan doc 5) |
| `FIGHT_ENDING_DRIFT` | `BRANCH_DECISION_DRIFT_MAGNITUDE` (0.08) | Drift toward prudence on yield or rout; toward mercy on bargain or spare; toward courage on a won duel |
| `FIGHT_HUMILIATION_REPUTATION` | `0.05` | Face lost at home by yielding to a person (§2b) |
| `FIGHT_VICTORY_REPUTATION_OVERCOME` | `0.10` | Settlement gratitude for felling a monster (within the 0.15 cap) |
| `FIGHT_VICTORY_REPUTATION_DRIVEN_OFF` | `0.03` | … for driving it off |
| `FIGHT_VICTORY_REPUTATION_DUEL` | `0.05` | Standing gained for beating, or being yielded to by, a mortal |
| `FIGHT_GRATITUDE_RADIUS_HEXES` | `3` | How far a lair's grateful settlement may be |
| `FIGHT_EVENT_SIGNIFICANCE` | `{ notable: 0.85, routine: 0.4 }` | Notable endings clear `phaseNarrative`'s 0.8 chronicle threshold; routine ones do not |
| `FIGHT_EVENT_TIER_BY_FACE` | `Record<FightEndingFace, 'notable' \| 'routine'>`: notable for `overcome_monster`, `overcome_mortal`, `driven_off`, `bargained`, `yielded_to_mortal`, `mauled`, `spared`, `slain`; routine for `yielded_to_monster`, `routed`, `broke_off` | Which faces reach the chronicle |
| `FIGHT_TROPHY_OUTCOME` | see Data tables | The reward tier curve per result and lair tier |

## Tracing

Every trace below **extends `TraceBase`** (`src/types/trace.ts:1276-1283`) with the listed `category`. It is registered in the THR-928 trio (the `TraceCategory` union, `TRACE_CATEGORIES`, the `TraceEntry` union) in D1; `src/types/trace.ts` is in D1's files.

```ts
// fight.ending — emitted once per fight by the fighter-side branch of onFightEnded
interface FightEndingTrace extends TraceBase {
  category: 'fight.ending';
  actionId: string; fighterId: string; victorId: string | null;
  result: FightResult;
  face: FightEndingFace; // plan doc 2's FB2 union: overcome_monster | overcome_mortal | driven_off | bargained | yielded_to_mortal | yielded_to_monster | routed | broke_off | mauled | spared | slain
  killRoll?: { chance: number; roll: number };
  guard?: 'the_first' | 'avatar' | 'warded';
  scarWritten: boolean; scarSkipped?: 'already_scarred' | 'definition_missing' | 'immune';
  grudgeWritten: boolean; outcomeNodeId?: string;
  humiliation?: { counterpartyId: string; delta: number };
  reward?: { templateId: string; instanceId: string; tier: number };
  reputation?: { counterpartyId: string; delta: number };
  drift?: { axis: ValuePair; pole: 'positive' | 'negative' };
  eventSignificance?: number; // set once D2 lands the tiers; D1 registers the category without it
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No victor id (a default-card opponent) | No kill check (only named victors can kill); mauled |
| A named mortal victor in NPC mode | No kill check in v1; mauled. Agent-mode mercy is plan doc 5's E2 |
| No lair resolvable for the trophy, or a minor lair | No trophy; traced |
| `markMortalDead` returns `warded` / `not_a_mortal` | Mauled; traced with `guard:'warded'` |
| The Scarred definition is missing | Skip the scar edge; still write the grudge; `scarSkipped:'definition_missing'` |
| The fighter is already Scarred | No second scar (D1's own check; the applier would add one); the grudge is still written; `scarSkipped:'already_scarred'` |
| The fighter is immune to the scar's tags | The applier refuses; the grudge is still written; `scarSkipped:'immune'` |
| A yield with no opponent node | Face `yielded_to_monster`; no humiliation; the line names *its foe* |
| `writeGrudge` returns false (self, or already present) | Continue; `grudgeWritten:false` |
| `drawSeededReward` returns an empty pool or no pick | No trophy; traced by the pool's own content-query trace |
| No settlement within the gratitude radius, or no settlement home for humiliation or standing | Skip that reputation write |
| The reactive-loop writer declines (god as culprit, invalid victim) | Continue; no outcome node |
| The fighter branch throws | Caught by plan doc 2's dispatcher guard; `fight.end` carries `dispatchError`; the action stays resolved |

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| fight → death funnel | **extend** (`'fight'` cause, ward honoured) | existing `deceased` readers |
| fight → grudges (`hostile_to`, `blood_drawn`) | **extend** | the motive gate (`holdsMotive`, via `GRUDGE_PROVENANCE`), the sheet's Blood section clause, plan doc 2's Old-wound advantage, plan doc 6's hunt reason |
| fight → reactive loop | **add** (a non-undertaking source) | the mint lane, the omen portent, the receipt |
| fight → reward pool | **extend** (a new caller of `drawSeededReward`, `reward_tier_bonus` honoured) | possessions |
| fight → reputation (gratitude, standing, humiliation) | **extend** | the sheet; reputation-gated content |
| fight → chronicle (`fight_ended` tick event) | **add** | `phaseNarrative` → `chronicleEntries` → `ChroniclePanel` |

The executor updates `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts` in each slice.

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/gameState.ts` | 613 (`.codesight/graph.md`) | `'fight_ended'` joins the `TickEvent.type` union (D2). It is an additive member. Two mappings read the union: `tickEventTypeToNarrativeType` has a fallback, and `TICK_EVENT_COLORS: Record<TickEvent['type'], string>` (`src/data/uiColorPalette.ts:153`, read by `NarrativeFeed.tsx` and the debug event view) is already incomplete and in the typecheck baseline. **D2 adds a `fight_ended` colour** there, so fight rows are not uncoloured. The ratchet must show zero net-new errors |
| `src/types/trace.ts` | 134 | One category joins the closed `TraceCategory` union and the THR-928 trio (D1); `trace-vocabulary.test.ts` guards it |

**Behavioural blast:** none before a fight step exists (FB7). After D1, `blood_drawn` grudges license plots like other injuries, which is intended: the scarred may one day plot back.

## Three-pillar check

- [x] Engine pillar present (endings, the death gate with guards, humiliation, the reactive loop, victory writes, the chronicle event)
- [x] Content pillar present (the Scarred condition, the grudge clause, eleven chronicle lines, the trophy recipe)
- [x] UI pillar N/A with rationale (existing surfaces render the marks; fight chips are plan doc 4); debug trail included
- [x] Wiring section connects them

## Vision audit

- [x] **No Vision premise is contradicted.** Defeat has many faces, and death stays rare and caused (charter rule 6). The premises this touches:
  - `Vision/00-north-star.md`: mortals accumulate stories; fights leave scars, grudges, lost face and chronicle lines that the story is made of;
  - `Vision/01-core-loop.md`: this extends an encounter's aftermath and nothing else;
  - `Vision/02-non-negotiables.md`: the god is not the protagonist. The First and the avatar are guarded, and victory grants the god nothing new;
  - `Vision/03-design-tensions.md`: the death gate is conservative (guarded, rare, set by the victor's nature) rather than leaning into lethality for drama.
- [x] **The tension The First's carve-out pulls on is named.** `Vision/03-design-tensions.md` holds that the player "cannot save them unconditionally" and that there must be "enough to grieve when a mortal dies". The carve-out is **not** an unconditional save. The First can still die by the lifecycle, a plot, a commissioned killing or a band casualty. It removes one cause of death, a doubles roll in a fight, because that is the one the player can neither see coming nor answer. It is the map's most veto-able call and is flagged as such (THR-1266).
- [x] Fights become part of the reactive loop, where harm becomes somebody's next drive. That is the living world.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This changes rules of play. §7 "Fights" (plan doc 2) gains **"How a fight ends"**: the faces of defeat (including humiliation), the death gate and its guards, scars and grudges, and what winning pays. The reactive-loop paragraph (§10.7) gains the fight as a harm source. Each is written `[IMPL]` with the slice that lands it.
- [x] `Docs/canon/rulebook.md` is updated in the implementation PRs, not in this plan-doc PR.

> Brainstorm companion: `Docs/plans/2026-09-23-defeat-and-victory-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Kill chances, drift, reputation, significance, radius and the trophy curve are all named |
| 2. Inspectability | PASS | `fight.ending` carries every decision, roll and guard; `getFightState(...).ending` |
| 3. Determinism | PASS | One seeded kill draw after all other draws; the reward pool's own keyed stream; existing coin contract |
| 4. Fail-soft | PASS | See the table; every writer's refusal degrades to "mauled" or "skip" |
| 5. Narrative over mechanical perfection | PASS | Endings are story beats with culprits, marks and consequences in the reactive loop |
| 6. Additive over destructive | PASS | A new grudge cause, a scar, a tick-event type and an optional-source variant, all additive |
| 7. Performance budget | PASS | Only at fight end; no per-tick work |

## Slices

Each slice is one Linear issue in the Physical Conflict project, **not** a child of the map. Evidence follows THR-688 rule C (engine and content, CLI/headless).

| Slice | Scope | Blocked by | Done-when (all: `npm test`, `test:heavy`, `check:typecheck`, `vite build`, 30-tick CLI smoke) |
|---|---|---|---|
| **D1: Endings and the death gate** | §1–3: the fighter branch for defeat faces, including humiliation; UL **Struck down** (*a fight's clash critical failure; the one ending that can kill*) and **Scarred** seated by delegation, the D1 issue recording `seated by delegation <date>` (`Docs/ubiquitous-language/Process.md:133`); fight endings added as a source in the `scar` contract (`Docs/ubiquitous-language/Traits.md:77`); the UL **Narrative Event** sentence corrected by delegation (`Docs/ubiquitous-language/Prose.md:73` says low-significance events reach the chronicle, the reverse of `orchestrator.ts:2527`); the kill check, both guards and the funnel call; Scarred + the mauled writes (second mauling included); `blood_drawn` in `GrudgeCause`, `INJURY_CAUSES`, `GRUDGE_PROVENANCE` and `GRUDGE_CAUSE_CLAUSES`, and in UL **Grudge**'s provenance list (`Agents.md:688ff`); the reactive-loop optional source; `fightState.ending`; the `fight.ending` trace; `getFightState().ending`; the UL entry Scarred | FB4, FB7 (plan doc 2); M1 (plan doc 3), because D1 calls `isMonster`; **THR-1536**, because until it lands the ambition phase walks the retained dead, and D1's victim edge would mint a slain fighter vengeance against their killer | Tests: every result's writes; The First is never killed (mauled; the floor itself is FB3's test); the avatar is never killed; a `death_prevented` ward yields mauled; the kill chance per temper (a seeded distribution over 10k rolls, within ±1 point); a grudge toward a monster is written, and `holdsMotive` reads `blood_drawn` as a grudge, not a rivalry; the sheet clause renders; a second mauling adds no scar (D1's own check); a tag-immune fighter's scar is refused and traced `immune`; `inflictedBy` and `scarredTick` sit on the scar edge; with a guard firing, no kill draw is taken; a fight death's outcome node carries `targetNodeId` = the victim, and its omen deed names the victim; UL **Grudge**'s `GRUDGE_PROVENANCE` list gains `blood_drawn`; yielding to a mortal costs `FIGHT_HUMILIATION_REPUTATION` at the residence, and yielding to a monster costs nothing; a fight death's outcome node **has the plot's shape** (victim edge `role: 'target'`, culprit, `named_death`), compared against a plot death in the same test; a mauling on top of an `old_quarrel` edge upgrades it to `blood_drawn`; `fightState.ending`'s `face`, `scarWritten`, `grudgeWritten`, `killRoll` and `guard` equal the `fight.ending` trace's |
| **D2: Victory yields and the chronicle** | §4–5: the trophy through `drawSeededReward`; gratitude, standing and the victor's side of humiliation; drift toward mercy and courage; the `fight_ended` tick event + `FIGHT_CHRONICLE_LINES` | D1 | Tests: overcome draws through `drawSeededReward`, and a `reward_tier_bonus` override on the fighter shifts the tier curve; gratitude goes to the nearest settlement within radius; bargained drifts toward mercy; beating a mortal drifts toward courage and writes standing; a notable ending adds a `chronicleEntries` row and a routine one does not; a bargain with no prize and a mauling with no scar use the plain lines; the trophy draw is traced with site `fight_trophy`; gratitude ties break by node id; yielding to a mortal is notable; the trophy draw keys `categoryWeights` by `possession`. **CLI:** 30 seeded `fight.lair.confront` fights (seed 42 / medium, via `spawn fight`): the number of new `chronicleEntries` rows **whose id is a `fight_ended` event** equals the number of notable endings in the `fight.ending` traces |

## Kill criteria

- **D1, before merge:** the 10k-roll kill-chance test must sit within ±1 point of `FIGHT_KILL_CHANCE_BY_TEMPER` for every temper. A miss means the chance is read wrongly or a guard fires where it should not (a sample of `rng() < chance` cannot detect draw order, so D1 also pins it: with a guard firing, no draw is taken and `killRoll` is absent).
- **After D2 merges:** run three seeds (42, 99, 7) on a medium map for 1,000 headless ticks each and count `fight.ending` traces by face. Once **at least 200** monster fights have run, if more than **4%** of them end `slain` (twice THR-1531's ~2% per visit), halve `FIGHT_KILL_CHANCE_BY_TEMPER`. If **60 or more kill checks against berserk victors** (`killRoll` present, temper berserk) produce **zero** kills, the gate is unreachable (a healthy 0.15 gate does that with probability 0.85^60 ≈ 0.006%): diagnose before tuning. Both levers are constants, so no code change is needed.
- **After D2 merges:** if notable endings flood the chronicle (more than one fight line per 10 ticks on a medium map), narrow what counts as marked: move faces from `notable` to `routine` in `FIGHT_EVENT_TIER_BY_FACE`, keeping felled, slain and spared. That is a constant change.

## Done when

- [ ] D1 and D2 each closed by their own PR with the slice's Done-when evidence
- [ ] Rulebook §7 "How a fight ends" and §10.7's fight harm source `[IMPL]`; UL entries **Struck down** and **Scarred** seated by delegation in D1 (Scarred with its SCAR Also-see), and the `scar` contract naming fight endings as a source; the systemic wiring guide documents the `'fight'` death cause, `blood_drawn`, humiliation and the `fight_ended` event; interface map rows
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke per slice; the close keyword for that slice's issue on its own line in the commit and PR body
- [ ] `Browser-verify exempt: engine + content only` (no `src/components/` change)

## Coordination block

**Suggested model:** opus. The death gate and its guards are the highest-stakes logic on the map.

**Parallel-safe with:**
- plan doc 3's M2: its files (`encounterSupportBundle.ts`, `encounterFilterPipeline.ts`, `proseEnrichment.ts`, the hunt content) are disjoint from D1's and D2's;
- the ward fix (THR-1534) and the desire-score slice (THR-1525) are both merged, so neither constrains these slices.

**Mutex with:**
- plan doc 3's M3: both extend `src/engine/fights/fightOutcome.ts` (`onFightEnded`); run in sequence;
- plan doc 3's M1 and plan doc 2's FB7: all three edit `src/debug-bridge.ts`/`.d.ts`;
- D2 with plan doc 3's M4: both edit `src/types/gameState.ts` (`TickEvent.type`; `fightCooldowns?`);
- any slice editing `src/engine/grievance/undertakingOutcomeNode.ts`, `grudgeEdge.ts`, `src/engine/undertakingMotive.ts`, `src/data/grievance-prose.ts` or `src/data/condition-trait-content.ts`.

With WIP = 1 these land in sequence anyway; every slice that registers a trace category also edits `src/types/trace.ts`, and a conflict there is a union-member merge.

**Files to touch:**
- D1: `Docs/ubiquitous-language/` (Struck down, Scarred, the `scar` contract), `src/engine/fights/fightOutcome.ts`, `src/engine/grievance/grudgeEdge.ts`, `src/engine/undertakingMotive.ts`, `src/data/grievance-prose.ts`, `src/engine/grievance/undertakingOutcomeNode.ts`, `src/data/condition-trait-content.ts`, `src/data/fight-constants.ts` (plan doc 2's constants file), `src/types/trace.ts`, `src/debug-bridge.ts`/`.d.ts`
- D2: `src/engine/fights/fightOutcome.ts`, new `src/data/fight-ending-content.ts`, `src/data/fight-constants.ts`, `src/types/gameState.ts` (the `TickEvent.type` member), `src/data/uiColorPalette.ts` (the `fight_ended` colour), `src/types/contentQuery.ts` (the `'fight_trophy'` site)

## Notes for the executor

- **Do not** write a death yourself. Call `markMortalDead`; it owns the ward, the echo and the `deceased` shape.
- **Do not** write quintessence. The First's floor is FB3's harm clamp (plan doc 2).
- **Do not** remove The First's carve-out without a director ruling. It is the map's most veto-able decision, and a veto arrives as a comment on THR-1266. The humiliation decision (§2b) is vetoable the same way.
- **Do not** call `instantiateReward` directly. `drawSeededReward` is the one draw path, and bypassing it makes trophies deaf to blessings and spells.
- Monsters as victors: the grudge toward a monster is intended. Plan doc 6's hunts read it as a reason.
- `bandOpposition.ts` was THR-1534's (merged), not this doc's.
- The word is **standing**, not renown: UL renown is `reputationScore`, one-sided. Carry the word into the rulebook §7 and wiring-guide text.

## Intent-judge verdict

*intent-judge, run 4 of 4, 2026-09-23. **Allow**, impact class Reversible (judge-confirmed). The caveat that fights can kill is ruled design (charter rule 6), and the kill chances are constants.*

- **Model slip, recorded:** `INTENT_JUDGE_MODEL` is `fable`, but the account's Fable limit was exhausted (HTTP 429). All runs were on Opus 5.5, at the spawner's direction, and the judge recorded the anti-correlation slip. Treat this as a partial-guarantee verdict.
- **Run history:**
  - run 1: Escalate on humiliation, plus 10 Revise-class items. Humiliation was then decided under the 2026-09-11 delegation, with a veto invitation on THR-1266;
  - run 2: Revise, 12 findings;
  - run 3: Revise, 3 findings;
  - run 4: Allow, with 1 GAP, 9 polish items and 2 sibling findings.
- **The GAP, fixed inline:** "renown" is now **standing** throughout. Standing is a `reputation_with` write, the UL's Reputation, as against the UL's world renown (`reputationScore`).
- **Polish applied:**
  - the scar write names `applyConditionToActor`, carries `inflictedBy` / `scarredTick` through `opts.edgeProperties`, checks for an existing scar itself (the applier ignores `maxLevel`), traces `immune`, and passes `touchedStructure` on;
  - the `TICK_EVENT_COLORS` mapping gets a `fight_ended` colour;
  - the outcome node's source form supplies `targetNodeId`, `projectId` and `verb`;
  - `eventSignificance` is optional in D1's trace;
  - a yield with no opponent node takes the `yielded_to_monster` face, with no humiliation;
  - gratitude ties break by node id;
  - one standing counterparty rule applies to both sides;
  - The First is the *target* of the `thread` edge;
  - the trophy draw is traced with site `fight_trophy`;
  - stale lines are corrected (THR-1534 merged; eleven face lines; the draw-order test named);
  - chronicle lines that name a write have plain variants;
  - `blood_drawn` is added to UL Grudge's provenance list;
  - "marks" becomes "writes" in the header.
- **Sibling findings, routed:**
  - S1 (the critical-band conditions) is written into plan doc 2's FB3;
  - S2 (how a branch persists its record, the `opponentEnding` declaration, the draw order) is handled across plan docs 2 and 5.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-23 (three sonnet auditors, in parallel, after the intent-judge Allow).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | 11-row Constants table (kill chances by temper, drift, reputation deltas, radius, significance, trophy curves); Kill-criteria responses are named-constant edits ("halve `FIGHT_KILL_CHANCE_BY_TEMPER`") |
| 2. Inspectability | PASS | `FightEndingTrace` (13 fields: face, killRoll, guard, scar/grudge, humiliation, reward, drift) + `fightState.ending`; D1 test pins trace fields equal record fields; Wiring table matches `wiring-checklist.md`'s 6-column format exactly |
| 3. Determinism | PASS | Kill draw via `ctx.rng`, fixed order after guards, pinned by test ("no draw taken" when a guard fires); trophy via `drawSeededReward`'s own keyed `mulberry32(seed+tick+hash…)` stream; no unseeded randomness anywhere |
| 4. Fail-soft | PASS | 12-row Fail-soft table; explicit "fighter branch throws → caught by dispatcher guard; action stays resolved" — no thrown exception escapes |
| 5. Narrative over mechanical | PASS | Endings produce scars/grudges/chronicle lines, not loot-optimization; plain-variant chronicle lines so "a line never claims a write that did not happen" |
| 6. Additive over destructive | PASS | "No new reward system," "no new death mechanism"; `fight_ended`/`blood_drawn` are additive union members; `createUndertakingOutcomeNode`'s optional-source form is backward-compatible; `bandOpposition.ts` explicitly left untouched |
| 7. Performance budget | PASS | "Only at fight end; no per-tick work"; no new orchestrator phase, confirmed in Tick phases section |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | Systems design, graph edges ("no new types"), tick phases ("none new"), resolution logic, and a PRNG table with two named seeded draws — all filled in depth |
| Content | present-and-substantive | Scarred condition + UL delegation, an 11-face chronicle prose table with plain-variant fallbacks, two trophy data tables, encounter templates ("none new") |
| UI | N/A-with-rationale | Existing chronicle/sheet/possessions surfaces render every write, cited to component + line (`GameView.tsx:5132`, `agentDetail.ts:997`); new chips explicitly scoped to sibling plan doc 4 |

**Missing-required-sections:** none. All five Engine subsections and all four Content subsections are present and substantive; UI's subsections are correctly omitted per its stated N/A rationale.

**Wiring section check:** Yes — the Wiring table maps every write (fighter branch of `onFightEnded`, death funnel, reactive-loop emission, trophy/reputation/humiliation, `fight_ended` event) to orchestrator phase, the existing UI component that surfaces it, GameState field, trace, and debug visibility.

**Substrate-existence check:** PASS. The doc opens with `## Substrate inventory` immediately before the Engine pillar, citing file:line-precise existing code (death funnel, grudges, reactive-loop writer, value drift, reward pool, reputation/residence/settlement registry, conditions, chronicle) for every mechanic it touches, each disposed as calls/extends/reuses. Cross-checked against `Docs/canon/systems-inventory.md`: all map to 🟢 ACTIVE subsystems (Agent Lifecycle, Reputation & Influence, Encounters & Dilemmas, Attachments/Items/Possessions, Effects & Conditions, Attention/Chronicle/Narrative) — no green-field duplication found. Rows cite function/file names rather than the inventory's coarse subsystem labels, but traceability is finer-grained, not weaker. A closing grep block confirms none of the new symbols (`blood_drawn`, `trait.scar.scarred`, `fight_ended`, etc.) pre-exist under another name.

PILLAR AUDIT: PASS

### Vision audit

**1. Vision premises touched**
- `Vision/00-north-star.md` → "mortals accrue witnessed interior life — grudge, bond, cost — into a story the player can tell" — **confirmed** (scars, grudges, reputation, chronicle lines all deposit witnessed history from a fight)
- `Vision/01-core-loop.md` → "aftermath is where consequences compound, tick 47 echoes at tick 130" — **extended** (doc self-scopes as pure aftermath work; significance-banding guards the "one story front-of-stage" rule against chronicle flooding)
- `Vision/02-non-negotiables.md` → #1 god-not-protagonist, #2 narrative-over-mechanics, #3 prose-not-numbers, #4 graph-edges-not-properties, #7 three-pillars — all **confirmed**
- `Vision/03-design-tensions.md` → tension 3 (divine remove vs. attachment) — directly engaged, self-flagged; tension 2 (emergence vs. authored) — **extended**, minor lean toward fixed prose
- `Vision/taste-profile.md` → not cited by the doc, but **confirmed** by inspection (prose-first, graph-edges, austere voice all correctly applied)

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- **North star:** Yes — scars/grudges/reputation give mortals witnessed history rather than a reset dice roll; moves toward the "person, not a unit" moment.
- **Core loop:** Yes — squarely aftermath-beat work; chronicle significance-banding explicitly guards "one story at a time" from becoming a drumbeat.
- **Non-negotiables:** Stays inside. The god gains nothing from victory; no direct mortal control added. One self-flagged tension: The First's fight-death immunity blocks only one vector (a doubles roll) — lifecycle, plot, commissioned killing and band casualty stay open — and is explicitly veto-invited, not a blanket unconditional save.
- **Design tensions:** Conservative on divine-remove-vs-attachment (narrow guard, not blanket). Soft lean toward authored-fixed on emergence-vs-authored — v1 ships one hardcoded chronicle line per face with no seeded variation, acknowledged as v1 scope.
- **Taste profile:** Respected — humiliation's −0.05 stays under the visible reputation band (no number leak); `inflictedBy` correctly kept as edge-provenance while `hostile_to` carries the real relation; chronicle lines are plain GAME-register, matching prose doctrine v2.

VISION AUDIT: PASS-with-notes [design-brief-stale]

**Author's response to the notes:** none of the audits returned FAIL or REVISE. The two notes are the documented, veto-invited choices: The First's narrow carve-out, and a v1 of one line per face (seeded variation is a later prose pass).
