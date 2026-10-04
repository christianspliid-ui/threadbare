> **title:** The First asks — her story waits on her god; her chores stay out of the Ledger — THR-1715
> **linear_issue:** THR-1715
> **author:** Claude Code (design lane, unattended, run 2026-10-03c)
> **created:** 2026-10-03
> **three_pillars:** Engine done · Content done · UI done

# The First asks — THR-1715

*Two of three round-2 cold-playtest testers quit at the same spot. After the best scene in the game, the bond, the game lives The First's life without them.*

## Why this is load-bearing

Round 2 fixed round 1's blocker: all three testers met and bonded The First, and all three called it the best thing in the game. Then two of the three quit for the same reason. The *story* tester opened the Chapter Ledger and found three of Thessa's chapters *"had already happened (two failed) while I was struggling with panels… the game lived her life without me."* The *skimmer* watched Aldric *"resolve 14 'chapters' by herself in seconds ('Mend Equipment,' 'Forage for Provisions')"* and *"felt like a spectator reading a log"* ([round-2 report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md), lines 21, 49 and 76).

The outcome is agreed. The store page promises *"when the moment matters you whisper"*. The Vision notebook's core loop has stated since Christian's ruling of 2026-09-27 that the world *"halts for every moment that matters: an encounter, a choice, the meeting…"*. UI Law 39 says *"at pause-tier attention, every beat interrupts on its own and pauses the sim"*. Today the game breaks all three for the one mortal the player chose. This plan is the *how*. Process.md rule 4 makes that an agent decision, so the design lane made it under delegation (each call is listed in § Decisions made by delegation, with a veto invited).

## Substrate inventory

**Measured, not grepped.** The census reader is [`readers/first-chapters.ts`](../audits/2026-09-25-living-world-data/readers/first-chapters.ts), and its output is [`output/first-chapters-2026-10-03-thr1715.json`](../audits/2026-09-25-living-world-data/output/first-chapters-2026-10-03-thr1715.json). Setup: current `main` (`453c17f9`), the `?seeded` identity (`DEV_ASCENDANT_IDENTITY`), a medium map, The First seeded by `devSeedTheFirst` exactly as the dev route does, seeds 42 / 99 / 7, 150 turns.

| Measurement | Seed 42 | Seed 99 | Seed 7 |
|---|---|---|---|
| Actions The First started | 30 | 23 | 27 |
| …of which Chapter Ledger rows (`isEncounterAction`) | 26 | 22 | 27 |
| Ledger rows that are chores (authored `threatRating: 'trivial'`) | 4 | 7 | 11 |
| Ledger rows that are story (easy / moderate / hard / unrated-authored) | **22** | **15** | **16** |
| Story chapters starting by turn 30 | 3 | 4 | 3 |
| Turns between story chapters (min / median / max) | 2 / 6 / 25 | 2 / 8 / 29 | 2 / 6 / 27 |
| Steps per story chapter | 2–3 | 2–3 | 2–3 |
| Ledger rows whose template `intrinsicTier` is `background` | 26 of 26 | 22 of 22 | 26 of 27 |
| Notifications built for her: aftermath, auto-resolving | 29 | 22 | 27 |
| Notifications built for her: **step** (the hand of cards) | 2 (both auto) | 0 | 0 |
| Notifications that would pop and halt the clock | **0** | **0** | **0** |

What the table says, in game terms:

1. **The player is never asked.** Across three worlds, not one of The First's chapter steps offered the player a hand. Two of 80 step notifications were even built, and both quietly expired. All she produces is aftermath cards that expire unopened.
2. **Chores are a third of the Ledger** (22 of 75 rows), and they are cleanly separable. Every chore in the sample carries authored `threatRating: 'trivial'` (`mend_equipment`, `forage_provisions`, `rest_and_recover`, `harvest_bounty`, `barter_survival`, `assess_holdings`, `tend_the_weary`, `mend_fishing_nets`). Every scene is `easy` or harder, or is a direct-authored template with no rating. The raw corpus holds 34 trivial entries out of 168 rated ones.
3. **The existing attention tier cannot tell them apart.** `toUnifiedTemplate` hard-codes `rarityTier: 1, intrinsicTier: 'background'` for every raw entry (`src/data/encounter-content.ts:406-407`) and drops `threatRating`. The First's court position then promotes every one of them to `shaping` (`src/engine/attentionTier.ts:26`).
4. **Story arrives every 6–8 turns, and a turn is one real second at speed 1** (`useSimulation.ts:158`, `1000 / speed`). Halting for every story chapter would stop the clock about every seven seconds of running time. The core loop calls that a drumbeat and a broken scan (*"If a session's rhythm feels like a drumbeat … the scan is broken"*). The fix therefore needs a cadence, not only a default.

Why nothing asks today (each claim read at the cited line on `453c17f9`):

- **The thread is born auto.** `meetingEncounter.ts:1009` writes `attentionMode: 'auto_resolve'` for the bonded First, and `gameInit.ts:690` does the same for the seeded First. `VISIBILITY_BY_POSITION.the_first.defaultAttentionMode` is `'auto_resolve'` (`types/encounterVisibility.ts:134-160`).
- **Shaping tier needs an attended tug.** `encounterVisibility.ts:586-594` skips a `shaping` action's step notification unless the player has attended a thread tug for it. Every chapter The First has is `shaping`.
- **The toggle cannot reach pause for her.** `toggleAttentionMode` refuses `pause` below `PAUSE_MODE_MIN_TIER = 2` (`encounterVisibility.ts:371`; `types/encounterVisibility.ts:28`), and both writers create her thread at `tier: 1`. A refused click returns `null` with no feedback, which is the skimmer's *"clicking it did nothing visible"*. A successful click would not repaint either: it mutates the graph with no `touchWorld()`, so the `threadedNodes` memo (`useAgentInteraction.ts:123-137`) serves the old label. Its essence charge writes `prev.essence` (`GameView.tsx:4361-4372`), a field `GameState` does not have (`essencePool`, `gameState.ts:238`), so the 2-essence cost has never been charged.
- **Pause does not hold the action; it holds the clock.** `progressAllActions` advances every unresolved action with no attention check (`unifiedActionResolution.ts:234-237`). What pause mode does is set `autoResolveTick: null` (`encounterVisibility.ts:151`). That makes `shouldAutoOpenEncounterNotification` open the veil (`encounterNotificationRuntime.ts:99-103`), and the veil is a registered interrupt (`interruptRegistry.ts:66`) that `useInterruptAutoPause` turns into a stopped clock. This is the same path `?forceencounters` takes (THR-880), and that path is proven: it is how every encounter review link works today.

| Existing subsystem | Status | This plan |
|---|---|---|
| Attention mode (thread `attentionMode`, `toggleAttentionMode`, TB-040) | 🟢 ACTIVE | **extends**: The First is born `pause`; the toggle reaches pause for her, repaints, and is free |
| Encounter visibility (`encounterVisibility.ts` notification phase) | 🟢 ACTIVE | **extends**: a pause-mode thread's `shaping` steps notify without a tug (Law 39); routine chapters never notify |
| Attention tier (`attentionTier.ts`, background / shaping / story_beat) | 🟢 ACTIVE | **preserved**: tier matrix unchanged; routine is a separate, orthogonal flag |
| Encounter filter pipeline (`encounterFilterPipeline.ts`, 5 stages) | 🟢 ACTIVE | **extends**: one new stage, the *story breath*, for pause-mode threads only |
| Raw-encounter converter (`toUnifiedTemplate`, field allowlist) | 🟢 ACTIVE | **extends**: carries `routine: true` through from authored `threatRating: 'trivial'` |
| Chapter archive + Chapter Ledger (`chapterArchive.ts`, `ChapterLedger.tsx`) | 🟢 ACTIVE | **extends**: records carry `routine`; default view and badge exclude routine; a "Daily life" filter shows them |
| Attention pool / thread tugs (`attentionPool.ts`, phase 2a.65) | 🟢 ACTIVE | **preserved**: tugs still gate shaping steps for auto-mode threads; pause mode simply does not need one |
| Interrupt registry + auto-pause (`interruptRegistry.ts`, `useInterruptAutoPause.ts`) | 🟢 ACTIVE | **preserved**: no change; the veil already registers and names its cause |

## Decisions made by delegation

Each call below was made by the design lane under process.md rule 4, on 2026-10-03, with a veto invited. None of them changes what the game *means*: all serve the agreed outcome, *the moment that matters stops and asks*.

1. **The First is born asking.** Her thread is written `attentionMode: 'pause'`, by both the meeting and the seeded route. *Why:* this is the store page, the core loop and Law 39, and it is the ticket's recommended direction. *Rejected:* keep auto and add a "first chapter always asks" exception. That still lets chapter two resolve without the player, and the Fixed-when forbids it.
2. **A chore is an authored `threatRating: 'trivial'` encounter.** It becomes a template flag `routine: true`, carried through conversion. Nothing else is routine: direct-authored templates without a rating (factory, slice and crafting quests) are always story. *Why:* the measured split is clean (§ Substrate, point 2) and the classification already exists in authored data, so this is activation, not invention. *Rejected:* a hand list of chore ids (it rots as content grows), and re-tiering raw entries to `shaping` (that would change what every watched and retinue mortal shows, far past this ticket).
3. **Chores never notify and never fill the Ledger's default view or badge.** They still happen, still archive, and are one click away under a **Daily life** filter on the Ledger (Law 55: nothing is lost, only demoted). *Why:* the ticket's direction, plus the skimmer's quit point. *Rejected:* deleting chores from the archive. Their consequences are state (Law XIV) and must stay reviewable.
4. **A pause-mode mortal's story steps ask without a tug.** This applies to any thread the player has set to pause, The First by default, which is what Law 39 already promises. *Rejected:* special-casing `the_first` only. That would make the player-set toggle a lie for retinue mortals.
5. **The story breath: after a pause-mode mortal's story chapter ends, she starts no new story chapter for `PAUSED_STORY_BREATH_TICKS` (default 24 turns, two in-game days).** During the breath she lives her daily life: chores, travel and social life, all of it silent. *Why:* the measured 6–8-turn rhythm at one second a turn would stop the clock every seven seconds, and the core loop names that drumbeat as broken. Two days puts The First's chapters at about 5–8 per 150 turns: often enough to be the main loop the skimmer asked for, sparse enough that the scan still exists. *Would change the call:* round-3 testers saying her chapters come too rarely (shorten it) or too often (lengthen it). It is one number. *Rejected:* letting chapters queue and wait (the action does not wait, by construction), and capping halts per minute of wall clock (it punishes speed-up instead of shaping the life).
6. **The badge counts unread *story* chapters.** It keeps the opening plan's "unread, not total" rule (THR-1605 S5) and drops chores from the count. *Rejected:* the ticket's "chapters waiting on the player". Under this plan a waiting story chapter is already open on screen, halting the clock, so that count would read 0 or 1 forever.
7. **Changing attention mode is free.** `ATTENTION_MODE_CHANGE_COST` goes from 2 to 0. *Why:* Law 51 files attention modes as *player-set preferences*; the charge has never actually fired since TB-040 (it wrote a non-existent field); and re-implementing it would need a sphere choice nobody designed. *Rejected:* fixing the charge onto `essencePool`. That would put a price on paying attention to your own mortal.
8. **The toggle's tier gate exempts The First.** `PAUSE_MODE_MIN_TIER` still guards other threads (a thin thread to a stranger does not get to stop the world), but never her. A refused click shows the sanctioned rejection feedback with its reason (Law 47).

## Engine pillar

### Systems design

**E1 — Born asking.** `meetingEncounter.ts` (`createAgentFromMeeting`) and `gameInit.ts` (`devSeedTheFirst`) write `attentionMode: 'pause'`. `VISIBILITY_BY_POSITION.the_first.defaultAttentionMode` becomes `'pause'`, so a thread with the field missing (an old save) reads as pause. All other positions are unchanged. Explicit `auto_resolve` values in old saves are left alone: they cannot be told apart from a player's choice.

**E2 — Routine flag.** Add `routine?: boolean` to `UnifiedActionTemplate` (`src/types/unifiedAction.ts`), documented as *"A chore: authored `threatRating: 'trivial'`; lives in daily life, never notifies, never a Ledger default row"*. `toUnifiedTemplate` sets it from `e.threatRating === ROUTINE_THREAT_RATING`. The converter is a field allowlist (memory: a field it does not name is dropped), so the line must be explicit. Add a helper `isRoutineTemplate(templateId)` in `src/engine/chapterArchive.ts`, beside `isEncounterAction`, resolving through `getAnyEncounterById ?? getUnifiedTemplateById`. An unknown id returns `false`, so an unclassified template is treated as story: fail toward asking.

**E3 — Visibility.** In the notification phase (`encounterVisibility.ts`, all three loops: legacy, unified step, aftermath):
- (a) skip any action whose template `isRoutineTemplate`;
- (b) in the `shaping` tug gate, also admit the action when the thread's `attentionMode` is `'pause'`.

Nothing else in that phase changes. `buildEncounterNotification` already gives pause-mode notifications `autoResolveTick: null`, which opens the veil and halts the clock through the existing interrupt registry.

**E4 — Story breath.** A new filter stage `filterByStoryBreath` in `encounterFilterPipeline.ts`, run after Prerequisites and before Threat. For an agent whose inbound thread has `attentionMode === 'pause'` and `lastStoryChapterEndTick` set, with `tick - lastStoryChapterEndTick < PAUSED_STORY_BREATH_TICKS`, it drops every candidate whose template is not routine. All other agents get it as a pass-through: one map lookup per agent, with the thread map built once per tick by the caller. Encounter **seeding** bypasses the eligibility pipeline by design (memory: seed skips filter), so a deliberately seeded story pressure still lands during a breath. That is intended: seeds are authored pressure, not daily drift.

**E5 — Writing the breath anchor.** When a unified action whose template is non-routine and `isEncounterAction` resolves for an actor with a pause-mode inbound thread, write `lastStoryChapterEndTick = tick` onto that thread edge's properties. This is a relationship-internal datum, so it lives on the edge, not on a node. The write site is the action-resolution path that already builds the `ChapterRecord` (`buildChapterRecord` caller). Add the field to `ThreadEdgeProperties` (`src/types/influence.ts`) as optional.

**E6 — Toggle repair.** In `toggleAttentionMode`:
- the tier gate becomes `newMode === 'pause' && props.courtPosition !== 'the_first' && props.tier < PAUSE_MODE_MIN_TIER`;
- the function returns a discriminated result, `{ ok: true, newMode } | { ok: false, reason: 'thread_too_thin' | 'no_edge' }`, so the UI can say why;
- the cost constant becomes `0`.

`handleToggleAttentionMode` (`GameView.tsx`) drops the dead `essence` write, calls `touchWorld()` after a successful toggle so the row repaints, and on `ok: false` plays the Law 47 rejection feedback.

### Graph nodes / edges

No new node or edge types. One new optional property on the existing `thread` edge, `lastStoryChapterEndTick?: number`. One new optional template field, `routine?: boolean` (template data, not graph).

### Tick phases

- E3 runs in the existing encounter-visibility phase, unchanged in position.
- E4 runs inside agent decision (the filter pipeline), unchanged in position.
- E5 runs in unified-action resolution, at the chapter-archive write.

### Resolution logic

There is no new scoring. The breath is a hard eligibility filter, not a weight. A weight would still let a high-scoring scene through every few turns and re-create the drumbeat.

### PRNG callouts

None. Every new rule is a deterministic predicate (NFP #3).

## Content pillar

### Encounter templates

No new templates. **The classification lives in content:** `threatRating: 'trivial'` on a raw entry now means *daily life* to the player, not just low danger. Two duties follow:
- **C1:** add one line to `Docs/canon/encounters.md`'s authoring rules saying so ("`trivial` = a chore; it never asks the god and never appears as a chapter").
- **C2:** in the same PR, audit the 34 trivial entries by name and list any that read as a *scene* rather than a chore. Re-rate a mis-rated entry to `easy` in the PR (an authored-data edit, not code). The census sample found none, but it covered only 8 of the 34.

### Prose tables

**UL:** *Daily life* (code word `routine`) is a new term: a classification with a template field, a canon authoring rule and a player-facing filter. It is filed as a UL-proposal ticket at handoff (linked from the handoff comment), and the build PR seats it beside `Chapter Ledger` in `Docs/ubiquitous-language/Encounters.md` once accepted.

C3: the Ledger filter label **"Daily life"** and its one-line empty state, *"Nothing ordinary has happened yet."* Plain register, no second person (Law 42).

### Attachment content / Data tables

N/A. No attachments or world-model data are involved; the classification rides existing authored fields.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces: ThreadsPanel, ChapterLedger, EncounterVeil). No WebGL surface is touched.*

### Player-facing display

- **U1 — ThreadsPanel attention toggle** (`ThreadsPanel.tsx` `AutoToggle`). The label reads the true state after every click. Copy is **"Asks you"** for pause and **"Lives on"** for auto, replacing the bare "Auto", which named the mechanism and not the meaning (Law 42). The tooltip, from the one registry (Law 17), gives one sentence each, naming the mortal rather than guessing a pronoun: *"{name}'s important moments stop the world and wait for you."* / *"{name}'s moments resolve on their own; you can read them afterwards."* (The second person is legal here: it is the god's own control, Law 42.) A refused click shakes and gives its reason (Law 47).
- **U2 — Chapter Ledger.** The default view and the launcher badge exclude routine records and routine active actions. `countThreadedChapters` gains the routine filter, and so does the `unreadChapterCount` input it feeds (`firstScreenReveal.ts:89`). A **Daily life** filter chip beside "show all" lists routine rows (Laws 40 and 55). The per-agent ledger (`filterAgentId`) shows story by default and offers the same chip.
- **U3 — The halt itself.** No new surface. The First's story step opens the existing EncounterVeil, which already registers as an interrupt and names its cause (Law 52). The aftermath continues in the same chrome (Law 37).

### Event notifications

No new toasts. Routine actions stop producing aftermath notifications (E3a). Their badge-and-expire churn was the "log" the skimmer read.

### Debug inspection

- **D1:** add `window.__DEBUG.getAttentionCadence(agentId?)`, returning `{ attentionMode, lastStoryChapterEndTick, breathRemaining, routineActive, storyActive }` for The First (or the named agent). It is how a Done-when proves the breath and the mode are wired.
- **D2:** `getEncounterNotifications` is unchanged; a pause-mode step notification shows `autoResolveTick: null`.

### Visual presence (HexMapV2)

N/A. Nothing on the map changes.

### UI Laws engaged

**1** (the toggle and the Daily-life chip carry tooltips), **13/14** (no raw keys or magnitudes: the toggle copy and filter label are words), **17** (both tooltips register in the one registry as `ui.attention.asks` / `ui.attention.lives_on` / `ui.ledger.daily_life`, resolved through `resolveTooltip`, never inline strings), **21** (Daily-life rows keep the Ledger's existing clickable actor names), **33** (the chip sits in the Ledger's existing filter row; nothing grows below the fold), **37** (one chrome through step and aftermath), **39** (pause tier interrupts every beat: this plan makes it true), **40** (the badge never destroys what it counts), **42** (plain register), **47** (input acknowledged: the dead toggle), **49** (no storm: the breath is the cadence guard, and the veil queue opens one at a time, `runEncounterAutoOpenScan`), **51** (attention mode is a persisted preference), **52** (an auto-pause names its cause: the veil already does), **55** (nothing lost: Daily life). No exception is needed.

## Interface impact

The touched subsystems are ⚪ UNAUDITED in `Docs/canon/interface-map.md` (no row names attention mode, the visibility phase or the ledger), so this is audit-on-touch:

| Contract | Writer | Reader | Disposition |
|---|---|---|---|
| thread `attentionMode` → notification `autoResolveTick` | meeting / gameInit / toggle | `buildEncounterNotification` | **preserve** (value changes, shape does not) |
| thread `attentionMode` → shaping tug gate | same | `encounterVisibility.ts` unified + legacy loops | **extend**: pause admits without a tug |
| template `routine` → visibility, ledger, badge, breath | `toUnifiedTemplate` | E3, U2, E4 | **add**: production read sites named in each item |
| thread `lastStoryChapterEndTick` → breath stage | action resolution (E5) | `filterByStoryBreath` (E4) | **add**: write and read both in this plan |

No contract is retired, so no tests on a dead side need deleting.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `meetingEncounter.ts` / `gameInit.ts` (E1) | bond / init | — | thread edge `attentionMode` | existing | `getAttentionCadence` |
| `toUnifiedTemplate` + `isRoutineTemplate` (E2) | load time | — | template `routine` | — | `getAttentionCadence.routineActive` |
| `encounterVisibility.ts` (E3) | encounter visibility | EncounterVeil (existing) | `encounterNotifications` | `attention.routine_suppressed` (new, sampled) | `getEncounterNotifications` |
| `filterByStoryBreath` (E4) | agent decision | — | — | `FilterPipelineTrace.storyBreath` count (extend) | `getAttentionCadence.breathRemaining` |
| breath anchor write (E5) | unified-action resolution | — | thread edge `lastStoryChapterEndTick` | `attention.story_breath_start` (new) | `getAttentionCadence` |
| `toggleAttentionMode` + handler (E6) | player action | ThreadsPanel `AutoToggle` (U1) | thread edge `attentionMode` | `attention_mode_change` (existing; cost now 0) | existing trace |
| Ledger filter + badge (U2) | — | `ChapterLedger.tsx`, launcher badge | `chapterArchive[].routine` | — | DOM |

`Docs/plans/wiring-checklist.md`: add the `getAttentionCadence` accessor and the Daily-life filter row.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `PAUSED_STORY_BREATH_TICKS` | `24` | Turns after a pause-mode mortal's story chapter ends before she may start another. Two in-game days. The cadence knob |
| `ROUTINE_THREAT_RATING` | `'trivial'` | The authored threat rating that marks a raw encounter as daily life |
| `ATTENTION_MODE_CHANGE_COST` | `0` (was `2`, never charged) | Essence to switch attention mode. Kept as a constant so pricing it later is one number |
| `PAUSE_MODE_MIN_TIER` | `2` (unchanged) | Thread tier needed to set pause, for every thread except The First |
| `FIRST_STORY_HALTS_PER_150_BAND` | `[5, 8]` | Verification band only, not runtime: The First's halting chapters per 150 turns on seeds 42 / 99 / 7 |

## Tracing

```ts
// attention.story_breath_start — a pause-mode mortal's story chapter ended; the breath begins
interface StoryBreathStartTrace {
  type: 'attention.story_breath_start';
  tick: number;
  agentId: string;
  actionId: string;      // the chapter that ended
  templateId: string;
  breathUntilTick: number; // tick + PAUSED_STORY_BREATH_TICKS
}

// attention.routine_suppressed — one per tick at most, aggregated: routine actions kept off the player's screen
interface RoutineSuppressedTrace {
  type: 'attention.routine_suppressed';
  tick: number;
  count: number;          // routine notifications not built this tick
  agentIds: string[];     // threaded actors affected (capped at 10)
}
```

`FilterPipelineTrace` gains `storyBreath: number` (candidates after the stage), on the same pattern as the other stage counts.

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Template not found for `isRoutineTemplate` | `false`: treated as story, so it asks. Failing toward attention is the safe direction for this ticket |
| Thread edge missing `attentionMode` | `VISIBILITY_BY_POSITION` default: `pause` for the_first, `auto_resolve` elsewhere (unchanged) |
| `lastStoryChapterEndTick` missing or in the future (save edit) | No breath: the stage passes everything |
| Breath stage throws | The pipeline's existing per-stage catch skips the stage and uses the previous input |
| Every candidate is story during a breath | The agent gets routine or non-encounter actions; with none of those either, the existing idle fallback (`idleBehavior.ts`) |
| Toggle on a missing edge | `{ ok: false, reason: 'no_edge' }`; UI rejection feedback; no state change |
| Two pause-mode mortals halt in the same tick | The existing one-at-a-time veil scan (`runEncounterAutoOpenScan`) queues them; the second opens when the first closes (Law 49) |

## Blast Radius

`src/types/unifiedAction.ts` and `src/types/gameState.ts`-adjacent types sit near the top of `.codesight/graph.md`.

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/types/unifiedAction.ts` | hundreds (see `.codesight/graph.md`) | One optional field added; no existing field changes, so no cascade |
| `src/types/influence.ts` | high | One optional property on `ThreadEdgeProperties`; additive |
| `src/engine/encounterFilterPipeline.ts` | per-agent hot path (agent decision is the top tick phase, 148 ms/tick steady per the 2026-10-03 briefing) | One O(1) lookup per agent; measure with `npm run cli` tick cost before and after, and the 30-tick smoke |

## Three-pillar check

- [x] Engine pillar present (E1–E6)
- [x] Content pillar present (C1–C3: the classification lives in authored data)
- [x] UI pillar present (U1–U3, D1)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise (`Vision/01-core-loop.md`, `00-north-star.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `taste-profile.md` read in full). It enacts *"time stops for every moment"* (core loop, 2026-09-27) for the player's own mortal, and the breath enforces the core loop's anti-drumbeat cadence.
- [x] No Vision edit is needed.

## Rulebook impact

- [ ] This plan does not change a rule of play — **it does:** The First's attention default and the breath are clock rules.
- [x] `Docs/canon/rulebook.md` is updated in the same build PR. One line under the clock section: *"The First is born asking: her story chapters stop the world. After one ends she lives two days of ordinary life before the next can begin [IMPL — THR-1715]."* The same line goes in `rulebook-quick-reference.md`.

> Brainstorm companion: [`2026-10-03-thr-1715-the-first-asks-brainstorm.md`](2026-10-03-thr-1715-the-first-asks-brainstorm.md)

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | The breath, the routine rating and the toggle cost are named constants; the cadence is one number |
| 2. Inspectability | PASS | Two new traces, one pipeline-trace field, and the `getAttentionCadence` accessor |
| 3. Determinism | PASS | No randomness; every rule is a predicate on authored data and ticks |
| 4. Fail-soft | PASS | See the table; unknown templates fail toward asking, and the stage is inside the pipeline's catch |
| 5. Narrative over mechanical perfection | PASS | Demoting chores is a story decision: daily life is texture, not chapters |
| 6. Additive over destructive | PASS with note | All fields are optional and new. The one value change is the First's default mode, which is the fix. The cost constant goes to 0 rather than being deleted |
| 7. Performance budget | PASS with note | One map lookup per agent in agent decision; measure before and after with the CLI |

## Done when

- [ ] **Asks:** on `?view=game&firstunmet&size=medium`, after the bond, The First's first story chapter opens the EncounterVeil with the clock stopped within 30 turns (`await window.__DEBUG.getAttentionCadence()` shows `attentionMode: 'pause'`). Browser evidence via `window.__DEBUG.tick(n)` plus a 1920×1080 screenshot of the veil.
- [ ] **Never alone:** the census reader `first-chapters.ts` (extended to read `routine` and the built notifications' `autoResolveTick`) shows, on seeds 42 / 99 / 7 over 150 turns, **zero** auto-resolving step notifications for The First's story chapters, and a halting story-chapter count inside `FIRST_STORY_HALTS_PER_150_BAND`. Tune `PAUSED_STORY_BREATH_TICKS` within 12–36 to land in the band, and record the value.
- [ ] **No chores in the Ledger:** the census shows zero routine rows in `countThreadedChapters`; a jsdom test on `ChapterLedger` proves the Daily-life chip lists them and the badge excludes them.
- [ ] **Toggle works:** a unit test proves `toggleAttentionMode` reaches pause for a tier-1 the_first thread and refuses a tier-1 retinue thread with `reason: 'thread_too_thin'`; a component test proves the label repaints without a tick.
- [ ] **Breath:** a unit test proves `filterByStoryBreath` drops story candidates inside the breath for a pause-mode thread, passes everything for auto-mode threads, and passes everything once the breath ends.
- [ ] C2 audit of the 34 trivial entries is listed in the PR body.
- [ ] The rulebook and quick-reference lines land; `Docs/canon/encounters.md` carries the C1 line.
- [ ] `npm run gate` green, including a 30-tick CLI smoke and `npm run test:heavy` (engine files touched); browser-verify four-part evidence per `Docs/canon/verification-gates.md`.
- [ ] **Do not start before** the `Claimable from:` time in the issue description (the 24-hour veto window on the lane's delegated calls).

## Kill criteria

How we would know this plan was wrong, and what to do then:

- **The mechanism is wrong.** The post-build census shows any auto-resolving step notification for a First story chapter, or halting chapters outside 5–8 per 150 turns after tuning the breath within 12–36. Stop and reopen the design. Do not widen the band to pass.
- **The cadence is wrong.** Round-3 cold testers say The First "keeps stopping", or report a story chapter that resolved without them. Retune `PAUSED_STORY_BREATH_TICKS`, or revisit the classification through the C2 audit.
- **Chores mattered.** Testers or Christian need chore consequences visible as chapters. Drop U2's default filter; the rest of the plan stands.

## Coordination block

**Suggested model:** opus. It crosses engine, UI and a content audit, and the breath tuning needs judgement against a measured band.

**Parallel-safe with:** [THR-1710](https://linear.app/threadbare/issue/THR-1710) (the avatar's profile reads as a stranger: profile sheet copy, disjoint files); [THR-1709](https://linear.app/threadbare/issue/THR-1709) (court screen layout: disjoint component).

**Mutex with:**
- [THR-1708](https://linear.app/threadbare/issue/THR-1708) (both edit chapter / aftermath player text and likely `ChapterLedger.tsx` or the aftermath notification copy: its "Your nudge left…" on untouched chapters);
- [THR-1711](https://linear.app/threadbare/issue/THR-1711) (both touch the interrupt / auto-pause path: its pause-inside-popup item edits `useInterruptAutoPause.ts`, and the EncounterVeil Escape fix);
- [THR-1716](https://linear.app/threadbare/issue/THR-1716) (both change what happens on the clock right after the bond).

**Files to touch:**
- Edit: `src/engine/meetingEncounter.ts`, `src/engine/gameInit.ts` (E1)
- Edit: `src/types/encounterVisibility.ts` (the_first default; cost constant)
- Edit: `src/types/unifiedAction.ts` (`routine?`), `src/types/influence.ts` (`lastStoryChapterEndTick?`)
- Edit: `src/data/encounter-content.ts` (`toUnifiedTemplate` carries `routine`; C2 re-ratings if any)
- Edit: `src/engine/chapterArchive.ts` (`isRoutineTemplate`; record `routine`)
- Edit: `src/engine/encounterVisibility.ts` (E3, E6)
- Edit: `src/engine/encounterFilterPipeline.ts` (E4)
- Edit: the unified-action resolution site that builds `ChapterRecord` (E5)
- Edit: `src/components/Game/GameView.tsx` (toggle handler), `src/components/Game/ThreadsPanel.tsx` (U1), `src/components/Game/ChapterLedger.tsx` (U2), `src/components/Game/GameView/firstScreenReveal.ts` (badge input)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (D1)
- Edit: `Docs/canon/rulebook.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/encounters.md`, `Docs/plans/wiring-checklist.md`, the `Chapter Ledger` UL entry (one line: routine excluded from the default view)
- Edit: `Docs/audits/2026-09-25-living-world-data/readers/first-chapters.ts` (verification extension)

## Notes for the executor

- **Automated captures on `?seeded` will now see veils.** The seeded First is born asking too, deliberately, so the dev route matches the real one. `suppressBeats` does not touch the encounter veil (by design), so a verification run that needs a clear screen dismisses the veil through its own flow or flips the First to "Lives on" with the toggle. **Do not** special-case the seeded route back to auto: a dev route that differs from the player's path is how this bug hid.
- **Tests that assumed auto for the First** (search `auto_resolve` near `the_first` in `src/**/__tests__`) need their expectation updated, not the default reverted. List them in the PR.
- **Do not touch the tier matrix** (`attentionTier.ts`). Routine is orthogonal on purpose; re-tiering raw entries would change what every watched and retinue mortal shows.
- **Side finding, not in scope:** the encounter cache rebuilds every raw entry's threat as `RARITY_TO_THREAT[1] = 'trivial'` (`encounterCache.ts:196-197`), so the filter pipeline's Threat stage sees the whole raw corpus as trivial. That is a separate engine question (courage vs danger tolerance is blind). Do not fix it here: `routine` reads the authored rating, not the cache's. It is recorded in the design-lane report for triage.
- **Aftermath after a halted step** continues in the same veil chrome (Law 37). Verify that a 3-step chapter produces one continuous veil session per step plus its aftermath, not a fresh cold-open each time (Law 55 re-orientation already handles a return).
- [THR-1644](https://linear.app/threadbare/issue/THR-1644) (threading as character creation) will later make every threaded mortal's ceremony richer. Nothing here blocks it, and its design should inherit "born asking" for The First.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-03 (design lane run 2026-10-03c). Intent judge: **Allow** (Reversible; two GAPs — UL term for Daily life, kill criteria in the plan doc — both fixed before commit).*

### NFP audit

NFP AUDIT: PASS-with-notes. 1 Tunability PASS (breath, routine rating, toggle cost named; retune band 12–36). 2 Inspectability PASS (two typed traces, `FilterPipelineTrace.storyBreath`, `getAttentionCadence`). 3 Determinism PASS (no PRNG; hard tick predicate; seeding bypass stated). 4 Fail-soft PASS (unknown template → asks; missing/future anchor; `ok:false`; per-stage catch). 5 Narrative PASS (chores as daily-life texture; breath replaces drumbeat). 6 Additive PASS-with-note (First's default flips to pause and the cost constant 2 → 0 — both justified; explicit old-save modes untouched). 7 Performance PASS-with-note (one lookup per agent on the hot path; before/after measurement committed, no numeric budget set).

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine, Content, UI all present-and-substantive; no missing required sections. Wiring connects every module to phase / component / state / trace / debug (minor: the E2 flag and tooltip registry entries carry no trace). Substrate inventory present and measured; no green-field duplication or DORMANT rebuild. Note: `attentionPool.ts` (2a.65) was not listed — added as a preserved row.

### Vision audit

VISION AUDIT: PASS-with-notes. Core loop "halts for every moment that matters" — extended; "one complex story at a time" — confirmed; non-negotiables (god not protagonist; prose not numbers) — confirmed; taste profile Stellaris halt — confirmed; north star witnessing — extended. No contradictions. Note: demoting chores leans toward authored curation over emergence (tension 2), offset by the Daily-life filter (Law 55). The plan's Vision section now names the files by path.
