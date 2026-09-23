> **title:** Mortal duels — the fight made opposed, and grudges that boil over (Physical Conflict plan doc 5 of 6)
> **linear_issue:** THR-1258 (wayfinder map, closed 2026-09-23; slices filed on handoff)
> **author:** Claude Code
> **created:** 2026-09-23
> **three_pillars:** Engine `done` · Content `done` · UI `N/A — duels render through plan doc 4's header (see § UI pillar)`

# Mortal duels — the fight made opposed, and grudges that boil over

*When two mortals fight, both roll, both can bleed, and the winner decides whether the loser walks away. A grudge left long enough will bring them back to it.*

## Why this is load-bearing

Plan doc 2's fight is **NPC mode**: the mortal rolls against a card. The charter asked for two modes (rule 3): "NPC mode … and agent mode (fully fleshed agents, slightly deeper)", where agent-mode depth is "opposed band-pairs + a mid-fight event table" (rule 4). Agent mode is where people fight people: rivals, feuding families, the man who took your brother's hand.

Today every duel in the game has **one roller**. At least five encounters sit in the `duel` reveal family (`reveal-family-aliases.ts:136`), and the opponent's side is pure prose in all of them. No shipped template uses `contestsWith` (R4). Grudges, the mortal world's longest-lived relationship edge, license a plot (`undertakingMotive.ts:138-139`) but never a **fight**.

This doc makes a systemic duel opposed on the same six-band ladder, lets the victor's nature decide mercy, and gives grudges a way to boil over. Decisions come from the closed map (THR-1258): THR-1264 (agent mode; the band-pair matrix; the sim), THR-1267 (mortal trigger), THR-1266 (duel endings and humiliation), THR-1532 (advantages on both sides) and THR-1531 (numbers).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| The fight block (plan doc 2: `fightRole` steps, `fightState`, `readOpponentCard`'s derived mortal card, `resolveFightStepInputs`, the forks, the per-fight clock mailbox, `onFightEnded`) | ⚪ planned | **extends** with an opposed mode |
| Transient counter-actions (`bandOpposition.synthesizeBandCounter`, :245) | 🟢 ACTIVE (bands) | **pattern reused**: the opponent's per-exchange roll is a synthesized transient step, never stored |
| Step resolution core (`resolveStepCore`, six bands) | 🟢 ACTIVE | **reuses** it for the opponent's roll. Contestation's binary mapping is *not* used (R4 §3) |
| Colocation detection (`phaseColocationDetection`, :54; its single stream `mulberry32(seed + tick·97)`, :55) | 🟢 ACTIVE | **extends** with the grudge escalation check, on its **own** seeded sub-stream |
| Grudges (`hostile_to`; the injury authority `GRUDGE_PROVENANCE` + `isInjuryProvenance`, `undertakingMotive.ts:40, :269`, over the `cause` / `reason` / `basis` keys) | 🟢 ACTIVE | **reads** them for the trigger and for both sides' Old-wound advantages |
| Endings (plan doc 1: guards, funnel, scar, grudge, humiliation, standing, the courage and mercy drifts) | ⚪ planned | **extends** with the victor's mercy decision, which plan doc 1 leaves to this doc |
| Existing duel-family encounters: `enc.courtyard_duel` and `reputation.power.the_renowned_duel` (god-choice branching encounters, support-NPC duellists), `social.challenge_duel` (`social-encounter-content.ts:1441`), `encounter.honor_duel` (`encounter-content.ts:2807`), `encounter.arcane_duel` (`:2523`); the `conflict` family (`reveal-family-aliases.ts:135`) | 🟢 ACTIVE (single roller) | **untouched in v1.** Each is an authored scene with its own fork, cast and branches; converting any of them is its own design. `fight.duel.grudge` is new because it is **systemic**: colocation spawns it between two agents, which none of these does |

Greps on `main` (2026-09-23), each 0 files in `src/`: `fight.duel.grudge`, `fightMode`, `opponentLoss`, `GRUDGE_ESCALATION_BASE`.

## Engine pillar

### Systems design

**1. Agent mode is a property of the block, not a new block** (THR-1264). `fightBlock(spec)` gains `mode?: 'npc' | 'agent'` (default `'npc'`), written onto every fight step as `fightMode` and copied onto `fightState.fightMode` at fight start. Systemic duels always use `'agent'`. For an agent-mode fight:
- **Both clocks are per-fight:** `FIGHT_MORTAL_CLOCK` (2) each.
- **The opponent side has a home on `fightState`:** `fighterClockSize`, `fighterClockNow`, `opponentBands[]`, `opponentLoss?`, and the opponent's own running state, mirroring the fighter's: `opponentMomentum`, `opponentAdvantages` (read once at start), `opponentWounds`, `opponentBlowsLanded` (for its "behind" test and `fight_offer_quarter`'s losing side) and `opponentHarmTaken`. E2 fills **`opponentEnding: FightEndingRecord`** (declared by plan doc 2's FB2), the loser-or-winner record for the opponent's side; `fightState.ending` stays the fighter's own (plan doc 4 anchors its fighter chips to it). All of it shows in `getFightState`.
- **Both cards are derived** by plan doc 2's `readOpponentCard`, from **raw** scores. Might follows the raw clash-reach bands. Dread is `FIGHT_DERIVED_DREAD_OFFSET` words from Might, and `FIGHT_FAME_DREAD_STEP` harder for a famous mortal (plan doc 2's Fame advantage).
- **The opponent's roll is synthesized** on every fight step: a transient step whose actor is the opponent, whose difficulty comes from the *fighter's* card, resolved through `resolveStepCore` with `variancePolicy: 'agent'` and `quintessencePolicy: 'none'`, on its own stream `mulberry32((state.seed + tick × DUEL_OPPONENT_STREAM_SALT + hashString(actionId + opponentId)) >>> 0)` (the pattern at `unifiedActionResolution.ts:1528`). Keying on the action id means an opponent in two fights in one tick could never draw the same roll, though §6 forbids that anyway. It is never stored in `state.unifiedActions`, following `synthesizeBandCounter`. Its band goes to `fightState.opponentBands` and the `fight.step` trace.

**2. The opponent side** (charter rule 4, THR-1530). The synthesized roll is a full fight step, **with the opponent as its actor**, so everything plan doc 2 builds for a fighter works for both sides:
- **its inputs** come from `resolveFightStepInputs` with the opponent as the actor: the opponent's own standing modifiers (plan doc 2's term for items, conditions and effect stacks; not the *standing* of §5, which is a reputation write), its reach override chain, its courage and momentum, and its advantages (its Old wound against the fighter, its secrets, its allies, read once at start; THR-1532);
- **its harm** goes through `computeFightErosion` to the opponent, with the same floor rule (`MEETING_QUINTESSENCE_FLOOR` when the opponent is The First);
- **its conditions** land by band through the applier, as the fighter's do;
- **its effect events** fire with the opponent as the actor and the fighter as the counterpart (plan doc 2 §9), so the opponent's items and future powers react;
- **a `fight_clock` effect against the fighter** lands on the fighter's per-fight clock through the node mailbox (plan doc 2 §5), drained into `fighterClockNow`;
- **`fight_offer_quarter`** runs the losing side's concession fork (plan doc 2 §12);
- **complications** are drawn once per exchange, on the actor's step, as today; the synthesized roll draws none. The mid-fight event table therefore reaches agent mode through the actor's step.
- **no hand:** the god's cards act only on the god's own mortal's side (see §6, which guarantees that side is the actor).

**3. The band-pair matrix** (THR-1264). Each side's band advances the *other's* clock through plan doc 2's `FIGHT_CLOCK_BY_BAND`, and harms *itself*:
- a critical failure by either side ends the fight with that side **struck down**;
- both critical failures means **both struck down**;
- both clocks filling in one exchange is a double knockout.

Results are read from the fighter's side:

| Situation | Fighter's result | `opponentLoss` |
|---|---|---|
| opponent's clock full | `overcome` | `'clock'` |
| opponent struck down | `overcome` | `'struck_down'` |
| opponent yields (concession) | `overcome` | `'yielded'` |
| opponent routs (nerve critical failure) | `overcome` | `'routed'` |
| fighter's clock full, or fighter struck down | `struck_down` | — |
| both struck down, or both clocks full | `struck_down` | `'struck_down'`; each side decided in §5 |
| both rout at the nerve step | `routed` | `'routed'`: nobody stayed; each side takes the rout face |
| both yield at the same fork | `broke_off` | `'yielded'`; neither is humiliated, since nobody won |
| the fighter routs while the opponent would yield | `routed` | —: the rolls come first, so the critical failure ends the fight before any fork runs |

**4. Nerve and concession on both sides.**
- The opponent's nerve step is synthesized at the fighter's nerve step. A critical failure there is the opponent routing.
- The concession fork runs for each side after a wounding exchange, through `decideBranchPole` on that side's `courage_prudence`, and each decision is recorded in `fightState.forks` with its `side` (plan doc 2's memory rule: forks are never choice memories). The god's pole-lean cards count only for the god's own mortal.

**5. The victor decides — only over a beaten loser** (THR-1264, THR-1266). Plan doc 1's rule holds: **only `struck_down` can kill**. In agent mode, the loser is beaten when their clock filled or they were struck down (the fighter's `struck_down`, or `opponentLoss` `'clock'` / `'struck_down'`). Then the **victor's** `mercy_ruthlessness` pole (`decideBranchPole`) picks:
- **spared:** plan doc 1's scar and `blood_drawn` grudge on the loser, and the victor drifts toward mercy;
- **finished:** plan doc 1's guards first (The First, the avatar), then `ctx.rng() < FIGHT_DUEL_KILL_CHANCE_RUTHLESS`, drawn only if both guards pass, so `killRoll` means the same thing in both docs, then `markMortalDead(state.graph, loserId, ctx.tick, { cause: 'fight', byActorId: victorId, mode: 'retain' }, ctx.runtime, ctx.overrideCtx)`, with `ctx` being plan doc 2's `FightEndContext`. A missed kill draw means mauled (scar and grudge).

**A loser who yielded or routed is never finished**, whichever side they are:
- **yielded:** plan doc 1's humiliation (face lost at home) and the drift toward prudence;
- **routed:** the drift toward prudence and `terrified` (already written by the band).

The victor gains **standing** (plan doc 1's `reputation_with` write, not the UL's world renown) and drifts toward courage (THR-1270; plan doc 1's D2 writers). This extends plan doc 1's fighter-side ending in `onFightEnded` to cover the case where the *opponent* is the loser, and records the opponent's face in `fightState.opponentEnding`.

**Where the faces show.** The `fight:<result>` memory is written before `onFightEnded` decides, and `FightResult` has no spared, slain or mauled members, so the aftermath keys only on the result. The faces reach the player through plan doc 1's chronicle lines (keyed by `FightEndingFace`) and plan doc 4's chips, which read `ending` and `opponentEnding`.

**The mercy fork is traced** on plan doc 1's `fight.ending`: `victorPole`, the victor's profile lean, the card lean (the god's hand counts only when the victor is the god's own mortal), `decidedBy`, the kill roll, and any guard that stopped it.

**6. Grudges boil over** (THR-1267). In `phaseColocationDetection`, for each co-located pair (grouped by `located_at`):
- **Eligibility:** one side holds a `hostile_to` toward the other that `isInjuryProvenance` accepts (the gate's own authority, over all three provenance keys), or a `blood_drawn` grudge (plan doc 1). The authority decides; there is no hand-written list. In practice `attempted_killing`, `mentorship_break`, `command_seized`, `usurpation_failed`, `grievance_cooled` and `blood_drawn` license a duel. `old_quarrel` does not: it licenses rivalry only. `group_engagement` is in the authority, but it is written between group nodes (`bandOpposition.ts:427`) and so never matches two individuals.
- Neither side may be busy (`isUnifiedAgentIdle`), `isMonster`, deceased or **the god's avatar** (the decision phase already excludes avatars, `phaseAgentDecision.ts:418-420`, while colocation groups every individual, `phaseColocationDetection.ts:61-62`; mortals fight and the god leans, Vision non-negotiable 1), and **both must have empty movement queues**, so neither walks away on the next tick.
- **One live fight per mortal.** A mortal who is the *opponent* in an unresolved fight counts as busy too. Three leaks are closed:
  - **before `fightState` exists.** The duel opens with a confrontation step, and plan doc 2 creates `fightState` only after the nerve step. So the decision phase's busy set (`phaseAgentDecision.ts:424-427`) adds, for every unresolved action whose template carries a `fightRole` step, **`fightState?.opponentId ?? targetId`**: a duel has no `opponentRef`, so its target is its opponent (plan doc 2 §1). The trigger's own "already in a fight" check uses the same key. The loop stays over `state.unifiedActions` (the shape `stepResolutionCore.contract.test.ts:319-333` pins);
  - **company marches.** `phaseGroups` runs after the decision phase and overwrites members' routes (`groupMovement.ts:9-11`), and `writeMemberRoute` (`:250-286`) checks nothing. So `runGroupMovement` writes **no route for any member** of a company while one of its members is the actor or the opponent of an unresolved fight: **the company holds** for the duel's few ticks, rather than splitting off the duellist. `phaseMovement` then has no queue to move anyone on;
  - **two duels in one pass.** `isUnifiedAgentIdle` reads the phase-start snapshot, which cannot see this pass's spawns. So the trigger keeps a `pickedThisPass` set, and a mortal picked for a duel is excluded from later pairs in the same colocation pass.

  Holding both duellists in place for the fight's few ticks is what plan doc 2's per-node clock mailbox relies on.
- The pair must be off cooldown: `state.fightCooldowns[fightPairKey(a, b)]`, plan doc 3's map and key rule, with **its own constant, `GRUDGE_DUEL_COOLDOWN_TICKS` (80)**, not the lair's 25, so tuning lair re-fights never changes how often a feud flares (NFP #1).
- **The map stores each entry's expiry tick, not its write tick.** Plan doc 3 prunes the map on write, deleting entries older than `FIGHT_TRIGGER_COOLDOWN_TICKS`. Under that rule, any lair write 26 or more ticks after a grudge duel would delete the pair's entry and cut the 80-tick cooldown to about 25. So each trigger writes `tick + its own cooldown`, the check is `tick < expiry`, and the prune deletes only entries whose expiry has passed. The change lands in plan doc 3's M4 (its ticket carries the amendment), so both triggers share one rule from the start.
- **Who is the actor.** Grudges are written both ways (`grudgeEdge.ts:77`), so "the grudge-holder" is usually both. The actor is:
  1. the side the god has threaded, if exactly one is (so the hand, the veil and The First's harm floor reach them);
  2. if both are threaded, the higher court position (The First, then retinue, then watched);
  3. otherwise the side with more courage;
  4. on a tie, the lower id (deterministic).
  
  Both sides fight identically; the actor is only whose action it is.
- **The roll:** `rng() < min(GRUDGE_ESCALATION_MAX, GRUDGE_ESCALATION_BASE × (1 + pairCourage))`. `pairCourage` is the **higher** live `courage_prudence` lean of the two, in [−1, 1], so the chance runs from 0 to `GRUDGE_ESCALATION_MAX`, and which side is the actor never changes how often a feud flares. The rng is **its own sub-stream**, `mulberry32(state.seed + tick × GRUDGE_ESCALATION_STREAM_SALT + hashString(pairKey))`. It never draws from the detection stream, so every existing colocation roll is unchanged whether the trigger is on or off.
- **On a hit,** it spawns `fight.duel.grudge` with `createUnifiedAction({ actorId, templateId: 'fight.duel.grudge', targetId: other, source: 'system', template, scale: template.scale, tick, rng })` (`unifiedActionLifecycle.ts:93-100` requires `template`, `rng`, `scale` and `tick`), drawing its `rng` from the escalation sub-stream, and stamps the cooldown. `phaseColocationDetection` returns only `tickEvents` today (`:117`), so E3 makes it also return `unifiedActions` and `fightCooldowns`.
- **What the grudges mean for the odds:** `writeGrudge` writes both ways (`grudgeEdge.ts:77`), so in most grudge duels both sides carry the Old-wound advantage (+0.10) and the two cancel. **One-sided grudges exist, narrowly:** a failed plot writes a one-way `attempted_killing` hostility on the survivor (`undertaking-objects.ts:1881-1908`), but the write is skipped when an edge already exists (`:1896-1897`). A grudge-licensed plot's plotter already holds an injury grudge, so only a **`faction_war`-licensed** plot (`PLOT_MOTIVES = ['grudge', 'faction_war']`, `strategic-action-constants.ts:1625`) leaves a truly one-sided grudge. There, only the survivor carries the Old wound, which is THR-1264's underdog lift ("4% → 7% with a grudge"), whichever side the actor rule picks.
- **A duellist is never the other's ally.** Two members of one company can hold an injury grudge (`command_seized`, `usurpation_failed`), and plan doc 2's Company advantage counts company members on the hex. The ally read excludes the fight's opponent (a plan doc 2 FB7 rule).
- **What ends a feud's cycle:** a death, a separation (one side leaves), or nothing. A feud that keeps flaring between two neighbours is the story. The cooldown sets its pace: after a duel, `GRUDGE_DUEL_COOLDOWN_TICKS` (80), then about 1/p ticks of co-location (p ≤ `GRUDGE_ESCALATION_MAX`), which is roughly two duels per 200 ticks for a pair that stays together.

### Graph nodes / edges
None new. It reads `hostile_to`; the writes are plan doc 1's (scar, grudge, death, reputation).

### Tick phases
- No new phase. The trigger runs inside `phaseColocationDetection`.
- Opposed rolls run inside step resolution.

### Resolution logic
Two `resolveStepCore` calls per fight step (actor and opponent), plus plan doc 2's forks for each side. No new resolver.

### PRNG callouts
| Draw | Stream | Order |
|---|---|---|
| actor d100 | the step stream | first (unchanged) |
| opponent d100 (synthesized) | its own stream: `mulberry32((seed + tick × DUEL_OPPONENT_STREAM_SALT + hash(actionId + opponentId)) >>> 0)` | second; never touches the actor's stream |
| forks (both sides) | as plan doc 2 | after both rolls |
| victor's mercy coin + kill draw | the step stream (`ctx.rng`) | at the end, after the forks; the kill draw only after both guards pass |
| escalation roll | its own sub-stream (seed + tick × salt + pair-key hash) | once per eligible pair per tick; the detection stream is untouched |

The golden stream for non-fight steps is untouched.

## Content pillar

### Encounter templates
- **`fight.duel.grudge`** ("Old Blood"), the systemic duel:
  - `fightBlock({ mode: 'agent' })` alone. **The opening line is the nerve step's prose, not a step of its own**: a separate non-fight step can roll a critical failure, which `advanceStep` turns into the action's end (`unifiedActionLifecycle.ts:179-190`), so about 1% of duels would abort before `fightState` exists and fall into no calibration class. GAME register, prose placeholders `{name}` and `{target}`: *"{name} sees {target} across the square, and the old wound opens."*;
  - an aftermath keyed on the `fight:<result>` memory at `fightResultIndex(steps)` (plan doc 2), with a line per result (overcome, struck down, yielded, routed, broke off). The faces (spared, slain, mauled) reach the player through plan doc 1's chronicle lines and plan doc 4's chips;
  - **why the opening line does not name the grudge's cause:** enrichment has no grudge-clause token, and the cause is already named where it lives, in the sheet's Blood section clause and the chronicle line. A token for it is a later prose improvement, not a v1 need;
  - spawn-only (no `locationSubtypes`, not cache-registered), `intrinsicTier: 'story_beat'`, like `fight.lair.confront`.

### Prose tables
- Duel afterimages for both sides' bands (*"they trade cuts"*, *"he gets inside her guard"*), authored once in the block's agent-mode defaults.
- Ending lines for **spared** and **finished**, in the GAME register.

### Attachment content
None new. The Scarred condition comes from plan doc 1.

### Data tables
None new. The chronicle lines come from plan doc 1, and the duel's tunables are in § Constants table.

## UI pillar

*Screenshot tool: none owed by this plan's slices' code, which changes no component. The one live 1920×1080 capture of a duel's header with both clocks is owed by **whichever of E1 and plan doc 4's F2 lands second**, since each needs the other; the second slice's closing evidence carries it.*

**UI: N/A here.** Duels are fight steps, and they render through plan doc 4's opponent header: the mortal opponent's portrait, name, derived card as a sentence, and both clocks. F2 renders both clocks when `fightState.fighterClockSize` is present, which E1 writes. UI Laws engaged here: none.

### Debug inspection (DebugPanel)
- `getFightState(actionId)` shows `fightMode`, `fighterClockSize`, `fighterClockNow`, `opponentBands[]`, `opponentLoss` and both sides' forks.
- New `window.__DEBUG.spawnDuel(aIdOrName, bIdOrName)`, which moves `b` to `a`'s location first and returns `{ actionId }`.
- CLI `spawn duel <a> <b>`.

## Wiring

> See checklist: `Docs/plans/wiring-checklist.md`. Add rows for the opposed roll, the opponent side, the victor's mercy decision, the grudge trigger, and `fight.duel.grudge`.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| Opposed roll (synthesized) | step resolution | veil header (plan doc 4) | `fightState.opponentBands`, `fighterClockNow` | `fight.step` (with `opponentBand`) | `getFightState` |
| The opponent side (inputs, harm, conditions, events, mailbox) | step resolution | — | `fightState` | `fight.step`, `fight.clock` | `getFightState` |
| Both-sides forks | step resolution | — | `fightState.forks` (each with `side`) | `fight.fork` (with `side`) | `getFightState` |
| Victor's mercy | `onFightEnded` | chronicle (plan doc 1); chips (plan doc 4) | graph writes; `fightState.ending`, `fightState.opponentEnding` | plan doc 1's `fight.ending` (with the mercy fork's fields) | `getFightState().ending`, `.opponentEnding` |
| Grudge trigger | `phaseColocationDetection` | veil (for the threaded) | `fightCooldowns`, `unifiedActions` | `fight.trigger` (`source: 'grudge'`) | trace viewer |
| `fight.duel.grudge` | — | veil | — | — | `spawnDuel` (the URL lever `?spawn=` would stage a duel with no named opponent) |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIGHT_MORTAL_CLOCK` | `2` (plan doc 2) | Per-fight clock of each mortal in agent mode (THR-1264) |
| `GRUDGE_ESCALATION_BASE` | `0.05` | Per co-located tick, before courage scaling (THR-1267) |
| `GRUDGE_ESCALATION_MAX` | `0.10` | The one clamp on the scaled chance (= 2 × base at full courage) |
| `GRUDGE_ESCALATION_STREAM_SALT` | `6263` (unused elsewhere; 113 is taken by `agentLifecycle.ts:566` and `siegeResolution.ts:384`) | Keeps the escalation sub-stream apart from the detection stream |
| `GRUDGE_DUEL_COOLDOWN_TICKS` | `80` | Per pair, between grudge duels; separate from the lair's `FIGHT_TRIGGER_COOLDOWN_TICKS` |
| `DUEL_OPPONENT_STREAM_SALT` | `6271` (unused elsewhere; 131 is taken three times) | Keeps the synthesized opponent roll on its own stream |
| `FIGHT_DUEL_KILL_CHANCE_RUTHLESS` | `0.25` (plan doc 1) | A ruthless victor's kill chance |
| `GRUDGE_DUEL_REPEAT_CEILING` | `3` | Kill-criteria ceiling: duels per pair in a 200-tick run |

## Tracing

Every trace below **extends `TraceBase`** (`src/types/trace.ts:1276-1283`) with the listed `category`, or adds fields to a sibling plan's trace. It is registered in the THR-928 trio in the slice that first emits it; `src/types/trace.ts` is in E1's, E2's and E3's files.

```ts
// Additive fields on plan doc 2's traces (E1)
interface FightStepTraceAgentMode { opponentBand?: StepOutcome; opponentProbability?: number; fighterClockNow?: number; }
interface FightForkTraceAgentMode { side?: 'fighter' | 'opponent'; }
// E2: the mercy fork, on plan doc 1's fight.ending
interface FightEndingTraceAgentMode { opponentLoss?: 'clock' | 'struck_down' | 'yielded' | 'routed'; bothStruckDown?: boolean; victorPole?: 'positive' | 'negative'; victorProfileLean?: number; victorCardLean?: number; mercyDecidedBy?: 'conviction' | 'coin'; opponentFace?: FightEndingFace; }
// fight.trigger is plan doc 3's category; E3 widens `source` and adds the grudge fields
interface FightTriggerTraceGrudge extends TraceBase {
  category: 'fight.trigger'; source: 'grudge';
  aggressorId: string; targetId: string; grudgeCause: string; chance: number; roll: number;
  skipped?: 'cooldown' | 'busy' | 'no_template' | 'grudge_gone';
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Opponent node removed mid-duel | The fight ends `broke_off` (plan doc 2's rule) |
| Opponent killed elsewhere mid-duel (retained as deceased) | Plan doc 2's deceased-opponent rule: the fight ends `broke_off` / `opponent_gone` at the next step |
| A side moves off the hex despite the busy rule | Plan doc 2's `separated` end; E3's CLI reports how often it happens |
| Opponent has no raw capabilities | `FIGHT_DEFAULT_CARD` for them |
| Both sides would be killed | Each side's victor decision runs independently; the guards apply per side |
| The grudge edge vanishes before the spawn | No spawn; traced `skipped: 'grudge_gone'` |
| `fight.duel.grudge` is missing | The trigger traces `skipped: 'no_template'` once and stops spawning; colocation continues |
| A pair on cooldown, or a busy side | No roll; traced `skipped: 'cooldown'` / `'busy'` **once per pair per cooldown window**, so co-located feuds do not flood the trace ring buffer every tick |

## Interface impact

| Contract | Change | Production read site |
|---|---|---|
| colocation → fight spawn (grudge) | **add** | the unified-action pipeline |
| grudges → fight advantages (both sides) | **extend** | plan doc 2's `readFightAdvantages` |
| fight → endings (victor mercy, opponent-side faces) | **extend** | plan doc 1's writers |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/unifiedAction.ts` | 504 (`.codesight/graph.md`) | `fightMode` on steps; `fightState` gains `fightMode`, `fighterClockSize`, `fighterClockNow`, `opponentBands`, `opponentLoss`, `opponentMomentum`, `opponentAdvantages`, `opponentWounds`, `opponentBlowsLanded` and `opponentHarmTaken` (`opponentEnding` is declared by plan doc 2's FB2). All additive and optional; the ratchet must show zero net-new errors |
| `src/data/unified-action-templates.ts` | 164 | E1 registers `fight.duel.grudge` in a new `FIGHT_ENCOUNTER_TEMPLATES` list (`src/data/fights/fight-templates.ts`), spread into `UNIFIED_ACTION_TEMPLATES` and searched by `getAnyEncounterById` (`encounter-content.ts:14194-14203`). **Not** `SOCIAL_ENCOUNTER_TEMPLATES`: `getAnyEncounterById` reaches social templates only through `getSocialEncounterById`, which searches `SOCIAL_SCENE_TEMPLATES` (`social-encounter-content.ts:2479-2481`). A duel registered there would never be archived as a chapter (`isEncounterAction`, `chapterArchive.ts:69-70`) or counted as `encounter_resolved`. Additive |
| `src/types/trace.ts` | 134 | E3 widens `fight.trigger`'s `source`; E1 adds optional fields to plan doc 2's traces |

**Behavioural blast:** from E3 on, co-located mortals with an injury-class grudge can duel, and some die. The kill criteria bound the rate.

## Three-pillar check

- [x] Engine pillar present (the opposed roll, the opponent side, the matrix, both-sides forks, victor mercy, the grudge trigger)
- [x] Content pillar present (`fight.duel.grudge`, agent-mode afterimages, ending lines)
- [x] UI pillar N/A with rationale (plan doc 4's header; E1 supplies the live capture of both clocks)
- [x] Wiring section connects them

## Vision audit

- [x] **No Vision premise is contradicted.**
  - `Vision/00-north-star.md`: relationships become stories. A grudge can end in blood or in mercy, and the mercy is a character's choice.
  - `Vision/02-non-negotiables.md`: the god is not the protagonist. The god's cards act only through its own mortal, who is always the duel's actor.
  - `Vision/03-design-tensions.md`, tension #2 ("Systemic emergence vs. authored moments"): grudge duels are pure emergence; the authored counterweight is the duel's opening, its per-result aftermath lines and plan doc 1's chronicle lines, while the kill criteria bound how often it kills.
- [x] No Vision edit needed.

## Rulebook impact

- [x] Rules of play change: §7 "Fights" gains **"When mortals fight"** (both roll; two blows decide it; the victor's nature decides mercy over a beaten loser; a yielding or fleeing loser is never killed), and §10.7 gains "a grudge can boil over into a duel". Both are written `[IMPL]` with the slices that land them.
- [x] `Docs/canon/rulebook.md` is updated in the implementation PRs.

> Brainstorm companion: `Docs/plans/2026-09-23-mortal-duels-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Clock, escalation, the clamp, the salt, the cooldown and kill chances are named |
| 2. Inspectability | PASS | Opponent bands, sides, loss mode and victor pole are traced; `getFightState`; `spawnDuel` |
| 3. Determinism | PASS | The opponent sub-stream and the escalation sub-stream are seeded; the actor's and the detection streams are untouched |
| 4. Fail-soft | PASS | See the table |
| 5. Narrative over mechanical perfection | PASS | Mercy is a character decision; grudges have consequences; a loser who flees lives |
| 6. Additive over destructive | PASS | An additive mode and fields; no existing encounter is converted in v1 |
| 7. Performance budget | PASS | Two rolls per duel step; the trigger costs O(co-located pairs) inside an existing O(n) grouping |

## Slices

Each slice is one Linear issue in the Physical Conflict project, not a child of the map. Evidence follows THR-688 rule C (engine and content, CLI/headless).

| Slice | Scope | Blocked by | Done-when (all: `npm test`, `test:heavy`, `check:typecheck`, `vite build`, 30-tick CLI smoke) |
|---|---|---|---|
| **E1: Opposed exchanges** | §1–4: `mode`/`fightMode`; the synthesized opponent roll on its own stream; the opponent side (§2) and its `fightState` fields; the matrix, including the double rout, double yield and rout-before-yield rows; both clocks; `opponentLoss`; both-sides nerve and concession, each side's decision in `fightState.forks` with its `side`; **the `fight.duel.grudge` template** (spawn-only, the opening line as the nerve step's prose), registered in the new `FIGHT_ENCOUNTER_TEMPLATES` that `getAnyEncounterById` searches, so `spawnDuel` and the calibration run; debug `spawnDuel` + CLI `spawn duel` | FB7, FB6 (plan doc 2): FB6 ships the `fight_clock` effect E1 tests | Tests: the matrix (every band pair, including a double knockout); the opponent roll never enters `state.unifiedActions`; the actor's stream is unchanged by the opponent's roll (golden subset); **the opponent's `in_combat` item changes its roll**; **a `fight_clock` effect against the actor lands on `fighterClockNow`**; `getFightState` exposes `fightMode`, `fighterClockSize`, `fighterClockNow`, `opponentBands` and `opponentLoss`; with both sides' forks recorded, an aftermath keyed on `fight:overcome` still resolves; **`fight.duel.grudge` is found by `getAnyEncounterById` and never drawn**, so a duel is archived as a chapter. **CLI calibration:** 400 seeded duels between fixture mortals pinned "bold" (`courage_prudence` +0.35) on both sides: strong (raw clash 30, capability ≈ 1.0) against weak (raw clash ≈ 15, capability ≈ 0.83), **both with Heart (the nerve reach) pinned at capability ≈ 0.89** (THR-1531's bold-guard nerve), **the strong fixture as the actor**, **mid-fight complications off** (THR-1264's sim had none), the weak fixture's raw clash **exactly 15** (at 14 its Might reads *gentle* and the strong side's odds jump), and **everything reset between duels**: harm, conditions, value drift and any grudge a mauling wrote, as plan doc 2's FB7 calibration does. Classify every duel into exactly one of six classes that sum to 100%: stronger wins by clock; weaker wins by clock; someone struck down (either side, or both); broke off; routed (either side's nerve critical failure); yielded. Targets are THR-1264's row: **49 / 4 / 23 / 13**, and the row's 11% remainder, which at +0.35 courage can only be **routs** (bold duellists never yield: the concession fork decides by conviction above `BRANCH_DECISION_NEUTRAL_EPSILON` = 0.05, `branchDecision.ts:155-156`, and THR-1531 shows 4–7% routs per bold fighter, over two nerve steps). So: routed 11, **yielded exactly 0** (a test). Each of the five named classes must sit within ±8 points. If routed misses 11 by more than 8 while the other four sit within tolerance, the remainder was not routs in THR-1264's sim: record the printed breakdown on THR-1264, and the four classes are the gate. **Evidence:** if plan doc 4's F2 has landed, one 1920×1080 capture of a `spawnDuel` fight showing both clocks in its header (otherwise F2 owes it) |
| **E2: The victor decides** | §5: the mercy pole over a beaten loser; spare / finish through plan doc 1's guards and funnel; the yielded and routed faces for either side; `fightState.opponentEnding`; the mercy fork's trace fields; standing and the courage drift through plan doc 1's writers | E1, D2 (plan doc 1; D2 is blocked by D1) | Tests: a merciful victor spares (scar + grudge); a ruthless victor's kill chance (a 10k-draw distribution within ±1 point); **a yielding or routed duellist is never finished, whichever side**; The First is never finished; the victor drifts toward mercy (spared) or courage (won); a duellist who yields loses face at home; `opponentEnding` records the opponent's face whichever side lost; the mercy fork's trace names its decider |
| **E3: Grudges boil over** | §6: the colocation escalation on its own sub-stream; the eligibility (empty queues; no avatar; one live fight per mortal via the busy set, keyed `fightState?.opponentId ?? targetId`; the company-march hold; `pickedThisPass`); the actor rule; the phase's `unifiedActions` / `fightCooldowns` return; the skip traces bounded to once per pair per window; `GRUDGE_DUEL_COOLDOWN_TICKS`; exporting `isInjuryProvenance`; the trigger trace | E1, E2 (systemic duels must ship with both sides' endings); M4 and M1 (plan doc 3: `fightCooldowns`, `fightPairKey`, the `fight.trigger` category, `isMonster`) | Tests: an injury-class grudge pair spawns at the expected rate; `old_quarrel` never spawns; the cooldown holds; **a threaded mortal is always the actor**; **existing `agent_encounter` detections are identical with the trigger on and off** (same seed, on the tick the trigger rolls); **a duel's opponent is busy from the spawn, before `fightState` exists**; **a company march does not move a duellist**; **no mortal is picked for two duels in one pass**; the avatar never duels. **a grudge pair's cooldown survives a lair write and another pair's write 26–79 ticks later** (the expiry-tick map); **CLI:** seed 42 medium, 200 ticks: count **spawned** grudge duels (`fight.trigger`, `source: 'grudge'`, no `skipped`): ≥1 if any injury-class pair co-located, else report the pair count, and skips alone never satisfy the check; and **no pair duels more than `GRUDGE_DUEL_REPEAT_CEILING` times**; print the result distribution of grudge duels, `separated` included; **a mortal already in a fight, as actor or opponent, is never picked** (a test) |

## Kill criteria

- **E1, before merge:** if the 400-duel calibration misses THR-1264's row by more than 8 points in any of its four named classes (49 / 4 / 23 / 13), or yields any duel between the two bold fixtures, stop and diagnose before merge. Likely causes: an opponent-side modifier double-counted, the matrix mapping off by one band, or the concession fork reading the wrong side's courage. The routed class is diagnostic (see E1's Done-when).
- **E3, after merge:** the pace the numbers imply is about two duels per pair per 200 ticks (§6). If any pair duels more than `GRUDGE_DUEL_REPEAT_CEILING` (3) times in 200 ticks, the cooldown or the eligibility is leaking: fix before tuning. If more than 10% of grudge duels end `separated`, the busy rule is leaking. If grudge duels kill more than one mortal per 100 ticks on a medium map, halve `GRUDGE_ESCALATION_BASE`; it is a constant.

## Done when

- [ ] E1–E3 each closed by its own PR with the slice's Done-when evidence
- [ ] Rulebook §7 "When mortals fight" and §10.7's grudge boil-over `[IMPL]`
- [ ] UL entry **Duel** (an agent-mode fight: both sides are mortals who roll) seated by delegation, disambiguated from `encounterType: 'duel'` and the `duel` reveal family (single-roller encounters that stay as they are in v1); the UL **Grudge** entry amended: a grudge still puts nothing on the board by itself, except that co-located grudge-holders can boil over into a duel; the same edit reconciles "a **bidirectional** `hostile_to` edge" with the one-way `attempted_killing` case and brings the stale three-cause list up to date (`Agents.md:694-696`)
- [ ] The systemic wiring guide documents `fightBlock({ mode })` and the opponent side; interface map rows
- [ ] **Wiki pages owed** (matched against `public/wiki-manifest.json` `sources`): E1 → `encounters-manual-reference` and `action-catalog` (the template), with a one-line note on `divine-actions-reference` for its type-only `unifiedAction.ts` match; E3 → `agents-reference` and `encounters-agents-reference` (the busy set); E2 → none
- [ ] `npm test`, `npm run test:heavy`, `npm run check:typecheck`, `npx vite build`, a 30-tick CLI smoke per slice; the close keyword for that slice's issue on its own line in the commit and PR body
- [ ] `Browser-verify exempt: engine + content only` on E2 and E3; E1's capture is evidence for plan doc 4's F2, not a component change

## Coordination block

**Suggested model:** opus.

**Parallel-safe with:**
- plan doc 4's F3 and F4: disjoint files;
- THR-1535 (if it lands before FB1): disjoint. THR-1534 and THR-1525 are merged.

**Mutex with:**
- E2 with plan doc 1's D1/D2 and plan doc 3's M3: all extend `src/engine/fights/fightOutcome.ts` (`onFightEnded`); run in sequence;
- E1 with plan doc 2's FB slices: E1 edits `src/engine/unifiedActionResolution.ts` (the opponent side); it is blocked by FB7, so this holds by construction;
- E1 with plan doc 3's M1 and plan doc 4's F1/F2: all edit `src/debug-bridge.ts`/`.d.ts`, and E1 and M1 both edit `scripts/cli.ts`;
- E3 with plan doc 3's M4 and M3: all three edit `src/types/trace.ts` (`fight.trigger`; union members only);
- any slice editing `phaseColocationDetection.ts`, `phaseAgentDecision.ts` or `groups/groupMovement.ts` (E3);
- E2 with plan doc 3's M3/M4 and plan doc 1's D1: all edit `src/types/trace.ts` (union members and fields only);
- E1 with plan doc 3's M2: both edit `src/types/unifiedAction.ts` (union members and optional fields);
- E3 with plan doc 1's D1: E3 exports `isInjuryProvenance` from `src/engine/undertakingMotive.ts`, where D1 extends `GRUDGE_PROVENANCE`.

**Files to touch:**
- E1: new `src/data/encounters/fight-duel-grudge.ts`, new `src/data/fights/fight-templates.ts` (`FIGHT_ENCOUNTER_TEMPLATES`), `src/data/encounter-content.ts` (`getAnyEncounterById` searches it), `src/data/unified-action-templates.ts`, `src/data/fights/fightBlock.ts`, `src/engine/unifiedActionResolution.ts` (the opponent side), new `src/engine/fights/opposedRoll.ts`, `src/types/unifiedAction.ts` (`fightMode`, the `FightState` fields), `src/types/trace.ts`, `src/debug-bridge.ts`/`.d.ts`, `scripts/cli.ts`
- E2: `src/engine/fights/fightOutcome.ts`, `src/types/trace.ts` (the mercy fields on `fight.ending`)
- E3: `src/engine/phaseColocationDetection.ts`, `src/engine/phaseAgentDecision.ts` (the busy set), `src/engine/groups/groupMovement.ts` (the company hold), `src/engine/undertakingMotive.ts` (export `isInjuryProvenance`), `src/types/trace.ts`
- New constants live in plan doc 2's `src/data/fight-constants.ts`.

## Notes for the executor

- **Never** push the synthesized opponent action into `state.unifiedActions`; it is transient, like `synthesizeBandCounter`'s.
- **Never** route a duel through `contestation.ts`'s binary mapping. It loses four of the six bands (R4 §3).
- **Never** finish a loser who yielded or fled. Only a beaten loser faces the victor's mercy.
- **Never** draw the escalation roll from the detection stream; it has its own.
- `old_quarrel` grudges must never trigger a duel. They license rivalry, not blood (R3).
- The existing duel encounters are out of scope in v1. Do not convert them.

## Intent-judge verdict

*intent-judge, run 4 of 4, 2026-09-24. **Allow**, impact class Reversible (judge-confirmed).*

- **Model slip, recorded:** `INTENT_JUDGE_MODEL` is `fable`, but the account's Fable limit was exhausted (HTTP 429), so every run was on Opus 5.5. The judge recorded the anti-correlation slip, so treat this as a partial-guarantee verdict (impediment #1060).
- **Run history:**
  - run 1: Revise, 12 findings; E4 (converting the authored duels) was then descoped;
  - run 2: Revise, 10 findings;
  - run 3: Revise, 2 required actions (the calibration classes and the busy-set leaks);
  - run 4: Allow, with 2 GAPs and 8 advisories.
- **The GAPs, folded in before commit:**
  - G1: `fight.duel.grudge` registers in a new `FIGHT_ENCOUNTER_TEMPLATES` that `getAnyEncounterById` searches, so duels are archived as chapters.
  - G2: `fightCooldowns` stores expiry ticks, so the lair trigger's prune cannot cut the grudge duel's 80-tick cooldown. The amendment is on plan doc 3's M4 ticket (THR-1547).
- **The advisories, folded in:**
  - calibration: state is reset between duels, and the weak fixture's raw clash is pinned at 15;
  - E3 counts spawns only, and skip traces are bounded;
  - the opening line is the nerve step's prose, so no duel aborts before `fightState` exists. The same note is on FB7's ticket for `fight.lair.confront`;
  - E2 fills `opponentEnding`, and the blast row lists every opponent-side field;
  - unused stream salts;
  - the company holds for the duel;
  - the two senses of "standing" are told apart.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-09-24 (three sonnet auditors, in parallel, after the intent-judge Allow).*

### NFP audit

| NFP | Verdict | Evidence |
|-----|---------|----------|
| 1. Tunability | PASS | Constants table names 8 tunables (`FIGHT_MORTAL_CLOCK`, `GRUDGE_ESCALATION_BASE`/`_MAX`, both stream salts, `GRUDGE_DUEL_COOLDOWN_TICKS`, `FIGHT_DUEL_KILL_CHANCE_RUTHLESS`, `GRUDGE_DUEL_REPEAT_CEILING`); no unnamed gameplay magic numbers found |
| 2. Inspectability | PASS | Wiring table matches `wiring-checklist.md`'s own 6-column schema (Module/Phase/UI/GameState/Trace/Debug); 4 new trace interfaces (`FightStepTraceAgentMode`, `FightForkTraceAgentMode`, `FightEndingTraceAgentMode`, `FightTriggerTraceGrudge`); `getFightState`, `spawnDuel`, CLI `spawn duel` |
| 3. Determinism | PASS | PRNG-callouts table enumerates every draw; opponent roll and escalation roll each on their own seeded `mulberry32` sub-stream (`state.seed`+tick+salt); "the actor's and the detection streams are untouched"; actor-selection tie-break is "on a tie, the lower id (deterministic)" |
| 4. Fail-soft | PASS | Fail-soft table covers 8 cases: node removed/deceased mid-duel, forced separation, missing capabilities (`FIGHT_DEFAULT_CARD`), mutual kill, vanished grudge, missing template, cooldown/busy pair |
| 5. Narrative over mechanical | PASS | Mercy is a character decision via `mercy_ruthlessness`; "a loser who yielded or routed is never finished"; Vision audit cites "relationships become stories" and "the mercy is a character's choice" |
| 6. Additive over destructive | PASS | `mode` is optional (default `'npc'`); all new `FightState` fields optional; "no existing encounter is converted in v1"; Blast Radius row: "All additive and optional; the ratchet must show zero net-new errors" |
| 7. Performance budget | PASS | Stated cost model: "Two rolls per duel step... the trigger costs O(co-located pairs) inside an existing O(n) grouping"; skip-traces throttled "once per pair per cooldown window" to bound the trace ring buffer |

NFP AUDIT: PASS

### Three-pillar audit

| Pillar | Verdict | Finding |
|--------|---------|---------|
| Engine | present-and-substantive | All 5 required subsections present; Systems design is a detailed 6-part spec (agent mode, opponent side, band-pair matrix, nerve/concession, victor's mercy, grudge trigger); PRNG callouts table names every draw and stream order |
| Content | present-and-substantive | Encounter templates and Prose tables each have standalone headings; Attachment content and Data tables are merged under one heading "Data tables / attachment content" (see below) |
| UI | N/A-with-rationale | Specific rationale tied to a named sibling doc/component (plan doc 4's F2 header); Debug inspection subsection is still filled in despite the N/A |

**Missing-required-sections:** Content § "Attachment content" has no standalone heading — it is merged into "Data tables / attachment content." Substance (none new, with reason) is present under the merged heading, so this is a formatting deviation, not an omission. No other required section is absent.

**Wiring check:** Yes. The Wiring table lists Module / Orchestrator phase / UI component / GameState field / Trace emitted / Debug visibility for all six connections (opposed roll, opponent side, both-sides forks, victor's mercy, grudge trigger, `fight.duel.grudge`), naming real phases (`phaseColocationDetection`, `onFightEnded`) and cross-doc UI components (plan doc 1's chronicle, plan doc 4's veil/header).

**Substrate check:** Present and clean. `## Substrate inventory` opens the doc, citing 7 existing subsystems with ACTIVE/planned status and extends/reads/untouched dispositions, verified against `systems-inventory.md`: colocation detection → Movement & Colocation 🟢, grudges/`hostile_to` → Reputation & Influence's `grievance` domain 🟢, `resolveStepCore` → `step` domain. Sibling systems (the fight block, endings) are honestly marked "planned," not falsely claimed ACTIVE, and are extended rather than duplicated. Existing single-roller duel encounters are named and explicitly left untouched with rationale (authored scene vs. systemic trigger). Zero-grep evidence (`fight.duel.grudge`, `fightMode`, etc.) confirms no naming collision. No green-field duplication found.

**PILLAR AUDIT: PASS-with-notes** — sole deviation is the merged Content subsection heading (Attachment content / Data tables).

**Author's response:** the heading is split into "Attachment content" and "Data tables".

### Vision audit

**1. Vision premises touched**
- `00-north-star.md` → "mortal not a unit; sovereignty/moral-cost is the axis" — extended: opponent side gains full simulated depth (its own harm, advantages, conditions); the victor's mercy is the mortal's own `mercy_ruthlessness`-pole choice, not the player's.
- `01-core-loop.md` → not referenced (spawn is systemic; scan/encounter surfacing deferred to plan doc 4).
- `02-non-negotiables.md` → "god is not the protagonist" — confirmed (plan §2: no hand on the opponent side; card lean counts only when the victor is the god's own mortal; the avatar is explicitly excluded from duels, citing this premise by name); "graph edges not properties" — confirmed (no new nodes; reads `hostile_to`).
- `03-design-tensions.md` → tension #2 (emergence vs. authored) — confirmed/navigated: kill criteria plus authored opening/afterimage/ending lines counterweight the raw emergence of grudge-triggered duels.
- `taste-profile.md` → "player is a god" and "narrative over mechanical perfection" confirmed in substance though not cited by path; "meeting-prose register (v2)" — silent/unverifiable here (one sample line given; full prose audit is a separate gate).

**2. Vision contradictions**
No contradictions found.

**3. Five qualitative checks**
- North star: yes — opposed rolls make the opponent as simulated as the fighter; mercy is character-driven, not player-driven.
- Core loop: preserved on the evidence given — grudge duels reach the veil only for threaded mortals; UI itself is out of this doc's scope.
- Non-negotiables: stays inside — god's cards never touch the opponent side; avatar excluded by construction.
- Design tensions: tension #2 deliberately counterweighted, not overdrawn.
- Taste profile: respects god/protagonist and narrative-over-mechanics; the sample line ("the old wound opens") is figurative on established IPK vocabulary, not obviously v2-compliant or non-compliant from this doc alone.

**VISION AUDIT: PASS-with-notes** [design-brief-stale]

**Author's response:** the opening line is a seed. The executor finalizes it against the voice scorer, as for every GAME-register line in the set.
