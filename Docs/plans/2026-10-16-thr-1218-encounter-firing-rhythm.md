> **title:** Encounter firing rhythm — the pruning pass, measured: fewer retold stories, no droughts, no count cap — THR-1218
> **linear_issue:** THR-1218
> **author:** Claude Code (design lane, unattended, run 2026-10-16c)
> **created:** 2026-10-16
> **three_pillars:** Engine done · Content done · UI done (one Chronicle line, debug fields; Playwright DOM)

# Encounter firing rhythm — THR-1218

*The firing verdict accepted "everything fires" as a starting point and asked for pruning once real content could be measured. Measured now, the problem has turned around: the player's mortal tells the same few stories again and again and sometimes has none for days.*

## Why this is load-bearing

On 2026-08-10 Christian ruled the firing verdict of the vertical slice ([THR-907](https://linear.app/threadbare/issue/THR-907)): *"Rhythm works — prune later."* It was ruled on spawn links, without free play, so it reads as "not obviously wrong", not as measured. This ticket is the "later". The 2026-10-02 design request on it asked for three things: a natural-firing baseline first, the pruning levers as named constants (per-agent spacing, per-family cooldown, a density cap per attended tier, suppression), and a split between calls agents calibrate and creative forks for Christian.

The baseline is now measured ([natural-firing baseline](../audits/2026-10-16-thr-1218-natural-firing-baseline.md), three seeds × 600 ticks on `617802fb`, no spawn links). It shows that the "everything fires" posture no longer reaches the player. [THR-1715](2026-10-03-thr-1715-the-first-asks.md) (shipped) already pruned it: chores never ask, and after every story chapter a paused mortal takes a two-day breath. Two-thirds of The First's encounters are chores. Her story chapters come every 23–26 ticks at the tightest, the breath's floor.

What a player following The First over fifty days *would* notice is two other things:

1. **Retold stories.** On seed 42, 18 story chapters were drawn from 6 templates: *Barter with travelers* ×5, *Shadow in the night* ×5, *The healer's oath* ×4. Christian's standing direction for encounters is that *"doing the same encounter twice should be very rare"* (encounter design goal, recorded 2026-04). Today's brake lets a chapter return every five days, five times.
2. **Droughts.** On seeds 7 and 1234 she went 64–142 ticks (5–12 game days) with no story at all, because the stories near her had run out.

Without this plan, pruning stays a backlog line, and the next person to tune firing will reach for a count cap that [Law 29](../game-design/laws.md) forbids. With it, the levers are named, the posture is recorded, and the two measured problems get one small fix each.

## Decisions (made by delegation — design lane, 2026-10-16, process.md rule 4; veto invited)

None of these changes what the game means. All serve agreed outcomes: the THR-907 verdict (prune later), Law 29 (density is player-authored), THR-1715's "the moment that matters stops and asks", and the encounter design goal (nomadic stories, rare repeats).

| # | Decision | Why (evidence) | Rejected |
|---|---|---|---|
| D1 | **The posture replacing "everything fires" is: a followed mortal's story chapters ask; chores never do; a breath follows each story; no count cap anywhere.** Recorded in `Docs/canon/encounters.md` as the firing posture. | Measured: 0 non-First notifications, 67% of The First's encounters are chores, breath binds every gap (baseline § 2–3). Law 29 [E]: *"the answer to many chapters is helping the player hold them (the Chapter Ledger), never a cap"*. | A density cap per attended tier (the design request's item): it is a cap, so Law 29 forbids it. |
| D2 | **No cross-thread interrupt budget.** Several followed mortals each keep their own breath; the Stage's hold rule ([THR-1877](2026-10-14-thr-1877-encounter-stage.md) D2) already shows one moment at a time and holds the rest in Needs you. | Law 29; THR-1715 decision 5 rejected queue-and-wait because *"the action does not wait, by construction"* (`progressAllActions` advances every action, `unifiedActionResolution.ts:234-237`), so a world breath with the clock running would let held chapters play out without the player. | A shared "world breath" between halts; a breath that lengthens with the number of followed mortals (a cap in disguise). |
| D3 | **No per-family cooldown.** Family stays unkeyed; the census reports family repeats as a tripwire. | Measured: a story chapter followed its own family 1 time in 43 pairs (baseline § 3). | Keying `encounterType` / reach / id prefix now: a lever with nothing to fix. |
| D4 | **The repeat brake covers every paused mortal, not only The First.** `FIRST_CHAPTER_REPEAT_FLOOR_TICKS` becomes `PAUSED_STORY_REPEAT_FLOOR_TICKS` (same 60) and applies to any actor whose inbound thread is in `pause` mode. | THR-1715 decision 4 applied the same rule to the breath: special-casing The First makes the player's pause toggle a lie for retinue. `isBondedFirstActor` gates it today (`phaseAgentDecision.ts:1027`). | Keeping it First-only. |
| D5 | **A paused mortal tells a story at most twice per run (`PAUSED_STORY_MAX_TELLINGS = 2`) while she has another story within reach.** Story chapters only; chores are untouched. If the cap would leave her no story candidate, she lives her daily life instead of retelling; after `STORY_DROUGHT_RELAX_TICKS` (144, twelve days) with no story chapter, the cap relaxes for her until her next story chapter ends. | Baseline § 3: 5 tellings of one tale in 50 days. Encounter design goal: repeats "very rare". Two, not one: a pool of 6–7 local stories (measured) with one telling each would drought within two weeks. | One telling (droughts); a scoring penalty only (`NOVELTY_EMA_DECAY` already exists and still allowed ×5). |
| D6 | **The restless road.** A paused mortal with no story chapter for `STORY_DROUGHT_TICKS` (72, six days) and no story she may still draw within reach sets out for the nearest place whose encounters hold one. The Chronicle says so in one line. | Baseline § 3: droughts of 5–12 days. Encounter design goal: *"agents move from encounter to encounter (nomadic lifestyle)"*. The engine already has the move: forced travel to the nearest content-bearing place (`phaseAgentDecision.ts:2458`), fired only when a mortal is idle with no candidates. The mortal goes on her own drive (Law 9: the god never commands). | A score boost for story at home (there is none left to boost); a reserved cap slot for story (does not help when the pool is empty). |
| D7 | **Lever hygiene.** Name the curator's unexported weights; correct the story-beat cooldown's comment (it is global, not per thread); wire `STORY_BEAT_QUEUE_OVERFLOW_DEMOTE` (read by nothing but the CMS today); mark `ATTEND_COOLDOWN` unused. | NFP #1. Substrate § 2 below. | Deleting the dead flags (NFP #6: additive). |
| D8 | **The census becomes a script.** `npm run census:rhythm` runs the baseline and prints PASS/WARN predicates (§ Done when). The first build slice also traces why half of The First's story chapters produced only an aftermath notice in the headless run. | Measured split: 24 of 48 halted, 24 aftermath-only, same templates on both sides (baseline § 2). Probably the harness never dismissing a veil (`runEncounterAutoOpenScan`, one auto-interrupt at a time), but not confirmed. | Leaving the census as a one-off. |

### Creative forks — raised to Christian only after this ships to a build he opens (process rule 5)

- **F1. Many followed mortals.** With four mortals in pause mode, the world stops about four times as often. By Law 29 that is the player's doing, and the answer is to help them hold it. If Christian finds it too much in play, the fix is a Law 29 amendment, his call. Not reserved now; nothing in this plan depends on it.
- **F2. How often The First's story comes.** The breath (22 ticks) and the restless road's patience (72) are tuning. "Too rare" or "too often" after play is his taste call; each answer is one number.

## Substrate inventory

Measured on `617802fb` (commands and outputs in the [baseline](../audits/2026-10-16-thr-1218-natural-firing-baseline.md); code read at the cited lines).

| Existing subsystem | Status | This plan |
|---|---|---|
| Encounter filter pipeline + story breath (`encounterFilterPipeline.ts`, stage 3b; `attentionCadence.ts` `storyBreathRemaining` :71) | 🟢 ACTIVE | **preserved**; the breath predicate's pause-mode test is reused by D4/D5/D6 |
| Cooldown filter (`filterByCooldown`, `phaseAgentDecision.ts:184`; `FIRST_CHAPTER_REPEAT_FLOOR_TICKS = 60`, `agent-behavior-constants.ts:763`) | 🟢 ACTIVE | **extends** (D4): floor applies to every paused mortal |
| Template retirement (`MAX_COMPLETIONS_PER_TEMPLATE = 5`, `:716`; read `phaseAgentDecision.ts:1013` from `familiarityRecord.attemptCount`) | 🟢 ACTIVE | **extends** (D5): a tighter story-only cap for paused mortals, read from the same record |
| Forced travel (`IDLE_FORCED_TRAVEL_THRESHOLD = 10`, `:457`; `phaseAgentDecision.ts:2458-2520`) | 🟢 ACTIVE | **extends** (D6): a second trigger, with a story predicate on the destination |
| Routine flag (`isRoutineTemplate`, `attentionCadence.ts:46`) | 🟢 ACTIVE | **preserved**; defines "story" for D5/D6 |
| Pacing governor (`pacingGovernor.ts:59`, `STORY_BEAT_COOLDOWN = 12` global; `STORY_BEAT_QUEUE_OVERFLOW_DEMOTE` dead) | 🟢 ACTIVE | **hygiene** (D7) |
| Curator (`curator.ts:43-55`: `W_COURT`, `W_THREAT`, `W_CHAIN`, `W_RECENCY = -0.15`, `W_REACH = 0.1`, `W_FACTION`, `W_AMBITION`, all module-local) | 🟢 ACTIVE | **hygiene** (D7): exported as named constants, values unchanged |
| Stage hold rule (THR-1877 D2, `resolveInterrupts`) | 🟢 planned | **preserved** (D2) |
| Firing census (`scripts/firing-census.ts`, `npm run census:firings`) | 🟢 ACTIVE | **extends** (D8): `scripts/firing-rhythm-census.ts` built from it |
| `getAttentionCadence` (`debug-bridge.ts:1670`) | 🟢 ACTIVE | **extends**: tellings, drought, restless-road fields |

Population consumed: the paused mortals. In the headless baseline that is The First alone (one per world); in the browser, The First plus any thread the player sets to pause (`PAUSE_MODE_MIN_TIER = 2`). D5's story pool: 6–7 distinct story templates reached The First in 600 ticks per seed (baseline § 3).

## Engine pillar

### Systems design

**E1 — One "paused mortal" predicate.** Add `isPausedThreadActor(graph, agentId): boolean` to `attentionCadence.ts`: an inbound thread, not `dormant`, whose `resolveAttentionMode` is `'pause'`, the same test `storyBreathRemaining` makes (:71-80). Refactor `storyBreathRemaining` to call it (behaviour unchanged).

**E2 — Repeat floor for every paused mortal (D4).** Rename the constant to `PAUSED_STORY_REPEAT_FLOOR_TICKS` (keep `FIRST_CHAPTER_REPEAT_FLOOR_TICKS` as a deprecated alias export so CMS and tests keep compiling). At `phaseAgentDecision.ts:1027`, pass the floor when `isPausedThreadActor(graph, agentId)`. `isBondedFirstActor` stays for its other callers. The floor's existing fail-soft (fall back to scaled cooldowns when it would empty the list) is unchanged.

**E3 — Story tellings cap (D5).** After retirement (`:1011-1014`) and before cooldown, for a paused mortal only: drop a candidate when `!isRoutineTemplate(c.templateId)` and `attemptCount[c.templateId] >= PAUSED_STORY_MAX_TELLINGS`, **unless** her drought (E5) is at least `STORY_DROUGHT_RELAX_TICKS`. This is not fail-soft back to repeats when it empties the story set: chores and travel remain, which is the intended outcome. It can never empty the whole list on its own, because it removes only story candidates. If the list is empty anyway (no chores either), the existing idle and forced-travel path runs as today.

`attemptCount` counts attempts, so a failed telling counts. *Why:* a failed tale retold is still a retold tale; the failure cooldown already keeps the retry trap away.

**E4 — The drought anchor.** The drought is `tick − lastStoryChapterStartTick`. A new optional thread-edge property, `lastStoryChapterStartTick?: number`, is written where a paused mortal's non-routine encounter action is **created** (`phaseAgentDecision.ts`, beside the `effectiveTier` stamp at :1917). It is relationship-internal, like THR-1715's `lastStoryChapterEndTick`, so it lives on the edge. Before the first story chapter the anchor is missing and the drought counts from the thread's `establishedTick` (`ThreadEdgeProperties`, `src/types/influence.ts:109`), else from 0. A future anchor (a save edit) reads as no drought (fail-soft, mirroring `storyBreathRemaining`). Add `storyDroughtTicks(graph, agentId, tick)` to `attentionCadence.ts`.

**E5 — The restless road (D6).** In the decision phase, before candidate filtering, for a paused mortal who is not travelling, has no unresolved action and is not held at an appointment:

1. If `storyDroughtTicks < STORY_DROUGHT_TICKS`, or her last restless road started less than `RESTLESS_ROAD_COOLDOWN_TICKS` ago, do nothing.
2. If her own location's cache entries include a story template she may still draw (not retired, under the tellings cap, not on cooldown), do nothing; the story is coming.
3. Otherwise pick the nearest location by hex distance whose cache entries include such a template, within `RESTLESS_ROAD_MAX_HEXES`, and set her moving there with the forced-travel code's path (graph path first, hex A* fallback). That code is extracted into `startTravelTo(…)` so both triggers share it. Write `lastRestlessRoadTick` on the thread edge, emit `agent.restless_road`, and push the Chronicle event (UI pillar).
4. No such place → nothing happens, and the trace says `outcome: 'no_destination'`. The E3 relax then lets her retell at home.

"May still draw" uses the existing per-agent checks only (retirement, tellings cap, cooldown). It does not run the full eligibility pipeline per remote entry, which would cost too much per tick. A destination whose story turns out ineligible on arrival is harmless: she is in a new place with new chores and neighbours, and the drought clock keeps running.

### Graph nodes / edges

No new node or edge types. Two new optional properties on the existing `thread` edge (`ThreadEdgeProperties`, `src/types/influence.ts`): `lastStoryChapterStartTick?: number`, `lastRestlessRoadTick?: number`.

### Tick phases

E2, E3 and E5 run inside agent decision (2b), unchanged in position. E4 runs at action creation in the same phase.

### Resolution logic

No new scoring. E3 is a hard per-agent eligibility filter (a weight would let a high-scoring retelling through, as `NOVELTY_EMA_DECAY` does today). E5's destination choice is "nearest by hex distance; ties to the lower location id", deterministic.

### PRNG callouts

None. Every rule is a deterministic predicate (NFP #3). The census's world build uses the seeded generator it already uses.

## Content pillar

### Encounter templates

No new templates. The tellings cap makes the existing story pool go further, but it does not grow it. **Duty for content authors, recorded in `Docs/canon/encounters.md`:** a place whose only stories are one or two templates will send a followed mortal on the road within days. That is intended, and it is a signal for where the Encounter Factory's next batches should land. The census's per-location "story sources" table (§ Done when) shows where.

### Prose tables

One Chronicle line, in a new `src/data/attention-content.ts` (no such file today; `src/data/attention-constants.ts` holds numbers only):

`RESTLESS_ROAD_LINE = '{name} grows restless and takes the road to {place}.'`

Both slots are filled by references: the mortal's and the destination's entity refs, declared by the producer (UI Law 2), never parsed from the string.

### Attachment content

N/A: no attachments are touched.

### Data tables

The constants below, in `src/data/agent-behavior-constants.ts`, each with `@range` and registered in the CMS tunable list (`src/components/CMS/tunableConstants.ts`) beside `FIRST_CHAPTER_REPEAT_FLOOR_TICKS`.

## UI pillar

*Screenshot tool: Playwright (DOM: the Chronicle and debug bridge). No WebGL change; the mortal's travel already draws on the map.*

### Player-facing display

No new surface. The restless road shows in the Chronicle as one line, and the mortal's travel shows on the map as any journey does. Retold stories simply happen less; nothing announces their absence.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Chronicle (Ledger rail, *Now*) | "Thessa grows restless and takes the road to Greywater." (*Thessa* and *Greywater* are links, UI Law 21) | **PC-4** (the game acts without saying so) | The line is the saying so: it lands the tick she sets out, and both names open their pages. Clicking her shows her journey. |
| — | Fewer retellings: no text | **PC-5** (repeated rows) | Answered by the plan itself: the same chapter title stops reappearing in the Chapter Ledger five times. |

### Playtest signal

A tester who follows The First for a long session can say where she went and why ("she got restless and left"), and does not report "the same story again" in their log.

### Event notifications

The Chronicle line only. No alert, no Needs-you row, no interrupt: the restless road is not a moment that matters, and Law 15 keeps interrupts for those.

### Debug inspection (DebugPanel)

`__DEBUG.getAttentionCadence(agentId?)` gains `storyDroughtTicks`, `storyTellings: Record<templateId, number>` (story templates only), `tellingsCapRelaxed: boolean`, `lastRestlessRoadTick: number | null`. Update `src/debug-bridge.d.ts` with them.

### Visual presence (HexMapV2)

N/A: travel already renders through the movement layer; no new signifier.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `attentionCadence.ts` (E1, E4 helpers) | 2b agent decision | — | thread edge properties | — | `getAttentionCadence` |
| `phaseAgentDecision.ts` (E2, E3, E5) | 2b agent decision | — | thread edge properties, `movementState` | `encounter.tellings_capped`, `agent.restless_road` | `getAttentionCadence`, `getTraces()` |
| Chronicle line | 2b (event pushed with the travel) | Chronicle (Ledger rail) | tick events → chronicle | — | the Chronicle |
| `scripts/firing-rhythm-census.ts` | headless | — | — | reads the two traces | `npm run census:rhythm` |

Interface map: one new cross-system write, decision phase → Chronicle (the restless-road line). Add a row to `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`; its production read site is the Chronicle's tick-event reader, the same one `riteChronicleEvent` (`threadingRiteQueue.ts:419`) feeds.

## Interface impact

The touched subsystems are ⚪ UNAUDITED in `Docs/canon/interface-map.md` (Encounters & Dilemmas (core), Attention & Chronicle, Movement & Colocation), so this is audit-on-touch:

| Contract | Writer | Reader | Disposition |
|---|---|---|---|
| thread `attentionMode` → repeat floor | meeting / gameInit / toggle | `filterByCooldown` caller (`phaseAgentDecision.ts:1027`) | **extend**: any paused mortal, not only the bonded First (E2) |
| `familiarityRecord.attemptCount` → tellings cap | encounter resolution (existing writer) | E3 filter in agent decision | **extend**: a second, story-only reader beside retirement |
| thread `lastStoryChapterStartTick` → drought | E4, at action creation | E3 relax, E5 trigger, `getAttentionCadence` | **add**: production read sites named |
| restless road → movement | E5 (`startTravelTo`) | `phaseMovement` via `movementState` (existing) | **preserve**: forced travel's shape, new caller |
| restless road → Chronicle (`restless-road-reaches-chronicle`) | E5, tick event | Chronicle tick-event reader (as `riteChronicleEvent`, `threadingRiteQueue.ts:419`) | **add** (S2): row in `interface-map.md` + `scripts/interface-contracts.ts` |

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `PAUSED_STORY_REPEAT_FLOOR_TICKS` | `60` | A paused mortal does not restart a story she just told for five days (was `FIRST_CHAPTER_REPEAT_FLOOR_TICKS`, First only) |
| `PAUSED_STORY_MAX_TELLINGS` | `2` | Times a paused mortal may tell one story per run while another is within reach |
| `STORY_DROUGHT_TICKS` | `72` | Six days with no story chapter, and the paused mortal takes the restless road |
| `STORY_DROUGHT_RELAX_TICKS` | `144` | Twelve days with no story, and the tellings cap relaxes until her next story ends |
| `RESTLESS_ROAD_COOLDOWN_TICKS` | `48` | At most one restless road per four days |
| `RESTLESS_ROAD_MAX_HEXES` | `12` | Farthest destination searched; beyond this she stays and the cap relaxes later |
| `CURATOR_W_RECENCY`, `CURATOR_W_REACH` (+ the rest of `curator.ts:43-55`) | today's values | Exported as named constants, no value change (D7) |

## Tracing

```ts
// encounter.tellings_capped — emitted when E3 drops at least one story candidate for a paused mortal
interface TellingsCappedTrace {
  type: 'encounter.tellings_capped';
  tick: number;
  agentId: string;
  droppedTemplateIds: string[];   // story templates at the cap
  remainingStoryCandidates: number;
  relaxed: false;                 // a relaxed pass emits nothing
}

// agent.restless_road — emitted each time E5 runs past its step-1 guard
interface RestlessRoadTrace {
  type: 'agent.restless_road';
  tick: number;
  agentId: string;
  droughtTicks: number;
  outcome: 'set_out' | 'story_at_home' | 'no_destination';
  fromLocationId: string;
  toLocationId: string | null;
  hexDistance: number | null;
  storyTemplateIds: string[];     // the drawable story templates at the destination
}
```

Register both in `TRACE_CATEGORIES` (`src/engine/traceBuffer.ts:23`) and the `TraceCategory` union in `src/types/trace.ts`.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| No thread edge, or a dormant / auto-mode thread | Every new rule is a pass-through; behaviour is today's |
| `familiarityRecord` missing | Treated as zero tellings (the existing retirement code's default) |
| Anchor tick in the future (save edit) | No drought, no relax (mirrors `storyBreathRemaining`) |
| Tellings cap removes every story candidate | Chores and travel remain; after `STORY_DROUGHT_RELAX_TICKS` the cap relaxes |
| No destination within `RESTLESS_ROAD_MAX_HEXES` | Trace `no_destination`; she stays; the relax covers her |
| No path to the destination (graph and hex A* both fail) | Trace `no_destination`, no move, no Chronicle line |
| Held at an appointment | E5 skips her; the appointment wins (`heldAtAppointment`) |
| Chronicle reference unresolvable | The line falls back to her name as plain text and "a far place" (UI Law 43: no `{token}` reaches the screen) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/engine/traceBuffer.ts` | wide-blast (CLAUDE.md high-impact list) | Two string entries appended to `TRACE_CATEGORIES`; no shape change. The existing registration test covers it |
| `src/engine/unifiedActionResolution.ts` | cited only (`:234-237`) | Read, not edited |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present (one line, constants, a canon duty)
- [x] UI pillar present (Chronicle line, debug fields)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise. It serves `01-core-loop.md`'s "quiet simmer punctuated by emphasis" and the 2026-07-04 density settlement (cadence is texture, never a count ceiling). The restless road is the mortal's own drive, not the god's command (Vision `02-non-negotiables.md` §1).
- [x] No Vision edit needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does, lightly** (below).
- [x] It does, and `Docs/canon/rulebook.md` is updated in the build PRs, each half with the slice that ships it (S1: the tellings sentence; S2: the restless-road sentence): rulebook §7/§9 on how often a followed mortal's story arrives. Add one paragraph to `Docs/canon/rulebook.md` (*A followed mortal rarely tells the same story twice, and a mortal with no story nearby goes looking for one*), marked `[IMPL]` with this ticket, in the S2 PR.

## Game Design Laws check

- **Law 29 [E]** (never ration chapters): kept. No cap on count; D5 removes retellings, D6 adds story where there was none. Net chapters per run should rise, not fall. The census reports story chapters per 150 ticks, and S1's Done-when checks they do not fall.
- **Law 15 [E]** (interrupts only for asked-for mortals): untouched. Every rule applies only to paused (followed) mortals, and none adds an interrupt.
- **Law 9 [E]** (the god never commands): the restless road is the mortal's own move, shown as hers.
- **Law 24 [E]** (failure never loops): the tellings cap counts failures, which strengthens it.
- **Law 42 [E]** (simple frameworks): one predicate, one cap, one trigger reusing forced travel. No bespoke per-encounter case.
- **Law 45 [P]** (never promise what the world will not do): the Chronicle line is emitted only after the move is set (`set_out`).

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Six named constants with ranges; curator weights named (D7) |
| 2. Inspectability | PASS | Two traces, four debug fields, the census script |
| 3. Determinism | PASS | No PRNG; nearest-destination ties break on location id |
| 4. Fail-soft | PASS | Fail-soft table; every rule passes through for non-paused mortals |
| 5. Narrative over mechanical perfection | PASS | Fewer retold tales; a restless mortal on the road is a story beat in itself |
| 6. Additive over destructive | PASS with note | Constant renamed with a deprecated alias; dead flags kept and wired or marked, not deleted |
| 7. Performance budget | PASS with note | E5 runs per paused mortal (1–4 in play) per decision and scans cache entries only after a six-day drought, at most once per four days; forced travel already does the same scan |

## Slices

- **S1 (this ticket)**: D4, D5, D7, D8. Census script, the repeat floor for every paused mortal, the tellings cap with its relax, lever hygiene, debug fields, and the trace of the 24 aftermath-only chapters. Engine + debug; no player-facing text.
- **S2 ([THR-1959](https://linear.app/threadbare/issue/THR-1959), blocked by S1)**: D6. The restless road, its Chronicle line, the rulebook paragraph, Playwright evidence.

## Done when

**S1**
- [ ] `npm run census:rhythm -- --seeds 42,7,1234 --ticks 600` prints, per seed: story chapters per 150-tick quarter, the gap list, tellings per story template, family repeats, halts vs aftermath-only, and a story-sources-by-location table; plus predicates:
  - **PASS when** no paused mortal tells one story template more than `PAUSED_STORY_MAX_TELLINGS` times outside a relaxed window;
  - **PASS when** story chapters per seed are not fewer than the baseline's (18 / 10 / 13 own-draw story chapters on seeds 42 / 7 / 1234 at `617802fb`) minus one;
  - **WARN when** a story chapter follows its own family in more than 20% of pairs (D3's tripwire).
- [ ] The aftermath-only split is explained in the closing status fragment: either a harness artifact (with the evidence) or a defect, filed as a bug.
- [ ] A browser check on `?view=game&seeded&size=medium`: after `window.__DEBUG.tick(600)`, `await window.__DEBUG.getAttentionCadence()` shows `storyTellings` with no value above 2 unless `tellingsCapRelaxed` was true.
- [ ] Rulebook §7/§9 gains the tellings sentence (*A followed mortal rarely tells the same story twice*), `[IMPL]` THR-1218.
- [ ] `npm run gate` green; heavy tests (`npm run test:heavy`) and a 30-tick CLI smoke (engine files).

**S2**
- [ ] On a seed where the baseline shows a drought (seed 7), the census reports `set_out` traces, and **for every drought that reaches `STORY_DROUGHT_TICKS` while a drawable story exists within `RESTLESS_ROAD_MAX_HEXES`, a `set_out` trace follows within one decision of the threshold** (cooldown permitting). Droughts ending in `no_destination` are listed, not failed: the relax window covers them by design (E3, E5 step 4).
- [ ] Playwright at 1920×1080: the Chronicle shows the restless-road line with both names as links (Laws 13/14, 21, 43), plus console output, a `__DEBUG.getAttentionCadence()` assertion (`lastRestlessRoadTick` set) and a UI-Laws line (Laws 1, 13/14, 17, 21, 33, 37).
- [ ] Rulebook restless-road sentence added (the tellings sentence landed with S1).

## Kill criteria

- **The tellings cap starves her.** The census after S1 shows own-draw story chapters on seeds 42 / 7 / 1234 falling below 18 / 10 / 13 by more than one → lower `STORY_DROUGHT_RELAX_TICKS` first, then raise `PAUSED_STORY_MAX_TELLINGS`.
- **She wanders too much.** After S2, a playtest log reports The First "keeps wandering off" or leaving mid-story → raise `STORY_DROUGHT_TICKS` / `RESTLESS_ROAD_COOLDOWN_TICKS`; if that does not settle it, switch the restless road off (S2 is self-contained behind its trigger) and file the drought as content work for the Factory.
- **Family repetition appears.** The census family tripwire (> 20% of story pairs) fires → revisit D3 with a family key.

## Coordination block

**Suggested model:** opus. The cooldown, retirement and forced-travel code in `phaseAgentDecision.ts` is dense and order-sensitive (THR-1804 commuted two filters on purpose), and the census must match the baseline's harness exactly.

**Parallel-safe with:** THR-1900 (map camera), THR-1903 (carved places), THR-1932 / THR-1933 / THR-1934 builds (economy files, not the decision phase's encounter section), every Inspector / frame / Stage slice (UI files only).

**Mutex with:** any ticket editing `src/engine/phaseAgentDecision.ts`'s cooldown / retirement / forced-travel region or `src/engine/attentionCadence.ts` (check In Dev before claiming); THR-1952 (mortal wealth S2, "poor or greedy mortals lean toward paying work", which edits decision scoring in the same phase).

**Files to touch:** (S1; S2's are named on THR-1959)
- Create: `scripts/firing-rhythm-census.ts` (from `Docs/audits/2026-10-16-thr-1218-natural-firing/natural-firing-baseline.ts` + `analyse.cjs`); `package.json` script `census:rhythm`.
- Edit: `src/engine/traceBuffer.ts` (two `TRACE_CATEGORIES` entries), `Docs/canon/rulebook.md` (the D5 sentence), `src/engine/attentionCadence.ts` (E1, E4 helpers), `src/engine/phaseAgentDecision.ts` (E2, E3, E4 write), `src/data/agent-behavior-constants.ts` (constants), `src/types/influence.ts` (edge props), `src/engine/curator.ts` + `src/data/attention-constants.ts` + `src/engine/pacingGovernor.ts` + `src/engine/phaseAttention.ts` (D7), `src/components/CMS/tunableConstants.ts`, `src/types/trace.ts`, `src/debug-bridge.ts` + `.d.ts`, `Docs/canon/encounters.md` (firing posture, D1, content duty).

## Notes for the executor

- **Do not add a count cap, a cross-thread budget or a family cooldown.** D1–D3 are decisions, and Law 29 is binding.
- `MAX_COMPLETIONS_PER_TEMPLATE` (5) stays for everyone; the tellings cap is an extra, tighter rule for paused mortals' story chapters only.
- Run the cap **after** retirement and **before** cooldown, so the repeat floor's fallback judges the pool the mortal can actually draw from (the THR-1804 ordering note at `:1008-1010`).
- The headless census never has a second thread. To see D4 on a retinue mortal, a unit test with a hand-built pause-mode retinue thread is enough.

## Forked-audit verdicts

*Run 2026-10-16 (design lane, three Sonnet subagents in one message). Intent judge: **Allow** (Reversible confirmed; GAPs on blast radius and kill criteria, both fixed in this revision along with its two advisory notes: the S2 gap bound now excludes `no_destination` droughts, and the rulebook lands each half with its own slice).*

### NFP audit

**PASS-with-notes.** Tunability, inspectability, determinism, fail-soft and narrative PASS. Two notes. (6) E2 and E3 change existing cooldown and retirement behaviour for retinue mortals, and `storyBreathRemaining` is refactored through E1. *Answer:* intended (D4); the refactor is behaviour-preserving and the existing breath tests are the lock. (7) The performance claim rests on frequency, not profiling. *Answer:* E5 runs at most once per four days per paused mortal, after a six-day drought, and its scan is forced travel's; the S1/S2 heavy test and 30-tick CLI smoke are the check.

### Three-pillar audit

**PASS.** Engine E1–E5, Content (one line, constants, a canon duty) and UI (Chronicle line, debug fields, Playwright) are present and substantive. Every template section is present, Blast Radius included. The substrate inventory extends existing systems, and the restless road reuses forced travel. Minor: the Rulebook impact checkboxes read oddly, but they are consistent.

### Vision audit

**PASS-with-notes.** No contradictions. It confirms cadence over pacing, the mortal as a person, influence never command, and the taste profile's rejection of fixed caps. The plan directly addresses the design-tensions drift signal (*same encounter fires twice in a run with the same beats*). Note: the tellings cap leans slightly toward authorship, but it is a gate, not a script, and the relax window and chores keep emergence. *Answer:* agreed; that is why the cap is two tellings, not one, and why it relaxes.
