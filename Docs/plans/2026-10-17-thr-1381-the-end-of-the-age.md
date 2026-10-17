> **title:** `The end of the age — Twilight's authored closing beats and the World-Soul's memories — THR-1381`
> **linear_issue:** THR-1381
> **author:** Claude Code (design lane, run 2026-10-17c)
> **created:** 2026-10-17
> **three_pillars:** Engine `done — finishing the Mandate starts the Twilight as canon says, a pure twilight module builds the closing beats and captures up to three World-Soul memories at the end of the age, concludeRun writes them into the account; no new node type, edge type, tick phase or GameState field` · Content `done — eight authored ending openings (seven doom kinds and the Mandate), three First-fate lines, four memory lines, the ceremony's labels and tooltips` · UI `done — one new ceremony, "The age ends", between the end of the clock and the harvest screen, registered as one entry in the homed-surface list; debug levers and a DebugPanel readout`

# The end of the age — THR-1381

*A run's last minute is the part the player keeps. Today the clock runs out, a popup says "The Unmaking begins. The world trembles.", seven silent ticks pass, and the harvest screen opens. Finishing the Mandate does not end the age at all. This plan writes the ending: three short authored beats the player watches before the harvest, and the World-Soul's memories of the age, written for the first time.*

## Why this is load-bearing

The rulebook has promised a Twilight since its first draft (§8: *"In Twilight you do not act; you witness. The world collapses or transforms. The threads you held resolve."*) and a World-Soul that *"absorbs what was vivid"*. Neither exists in play. The verdict on this question ([THR-414](https://linear.app/threadbare/issue/THR-414), 2026-06-23) asked for a lightweight split: **authored closing beats** plus **a procedural rule for which emergent threads the finale harvests**. Half of that is now built: [The world remembers](https://linear.app/threadbare/issue/THR-1813) picks the god's echoes by rule at the harvest (its plan's Decided 4, shipped in [PR #2444](https://github.com/christianspliid-ui/threadbare/pull/2444)). The backlog triage of 2026-10-14 narrowed this ticket to what remains: **(1) the authored closing beats** and **(2) writing Resonance memories**, which the account record already carries but nothing writes (`accountRecord.ts:246`, `TODO(THR-1381)`).

Without this: the end of a run, the moment Vision says a player should finish *"with a story they can tell in prose"* (`Vision/02-non-negotiables.md`), is a one-line popup; a player who completes the Mandate keeps playing into a doom ending that overwrites their triumph (measured below); and the cross-run World-Soul ships with an empty memory forever.

**The split, stated once.** *Authored:* the words of each closing beat (one opening per way an age can end, one line per fate of the First, one line per kind of memory). *Emergent:* who and what the beats name, chosen by rule from the run's own state: the clock that ended it, the First and their fate, the sphere the world leaned to, and the god's first harvested echo. Nothing is rolled.

## Decided by delegation (design lane, 2026-10-17 — veto in chat)

Canon and the agreed outcome decide each of these; Christian may veto any one in a sentence.

1. **Finishing the Mandate ends the age.** When the Mandate completes, the Twilight starts at once, with the age ending in triumph. *Why:* rulebook §8 (*"triggered either by the Doom Clock culminating or the Mandate completing"*), quick reference *The Clocks and the Ending*, and Game Design Law 32 (*"The Mandate and Doom are two kinds of ending, not a win and a loss"*). Measured below: today only doom expiry starts the Twilight, so a completed Mandate is followed by more play and a doom ending. *Veto words:* **"let me keep playing after the Mandate"**.
2. **In the Twilight the player watches; the beats replace the seven silent ticks.** One ceremony, *The age ends*, with three beats in order: **how it ended**, **your First**, **what the world will remember**, and one button to the harvest. Time is stopped while it is open. *Why:* rulebook §8 *"you do not act; you witness"* (the March 2026 vault draft's "playable final interventions" is the older idea, superseded by the rulebook); Law 27 (the world stops for every moment that matters). *Veto words:* **"give me a last turn to act in the Twilight"**.
3. **The opening is authored per way the age can end: seven doom kinds and the Mandate.** Its title is the doom kind's last stage name (*The Breach*, *The Sundering*…) or the Mandate's name. *Why:* the doom kind is the run's one authored arc, and the vault's Unmaking note already says *"Doom clock archetype determines flavor"*. Eight openings is the smallest set that never says the wrong thing.
4. **The First's beat names their fate in one line, from state, never a roll:** became your Aspect, lived to see the end, or died before it. *Why:* rulebook §8 *"The threads you held resolve"*; the First is the one thread every run has (`getFirstId`).
5. **The World-Soul keeps up to three memories of each age, captured once when the age ends:** how it ended, the sphere the world leaned to most, and the god's greatest mark (its first harvested echo). Older memories fade by `RESONANCE_DEGRADE_PER_RUN` each age and drop when gone; ten are kept (`MAX_RESONANCE_MEMORIES`, existing). *Why:* the rulebook's Resonance (*"absorbs what was vivid"*) needs a writer; capturing at the end of the age reads facts the game already holds instead of adding per-tick polling, and the significance weights are the ones the 2026-03-28 World-Soul plan specified. The four other memory kinds the type allows (great conflict, betrayal, sacrifice, divine intervention mid-run) are **not** captured: no run-level record of them exists to read (measured below), and a memory the game cannot back would break Law 45.
6. **The two age-end popups retire into the beat.** "The Unmaking begins. The world trembles." and "Victory! Mandate … fulfilled before the final doom closes." become chronicle lines; the ceremony's opening says the same thing in full a moment later. *Why:* PC-5 (piled-up surfaces); one fact told once (PC-6).
7. **Showing the carried memories in the next world belongs to "The world remembers" step**, filed as [The next world shows what the World-Soul remembers](https://linear.app/threadbare/issue/THR-1971) (Deferral, blocked by [Choices widen across runs](https://linear.app/threadbare/issue/THR-1844)). This plan's own reader is the third beat.

**Not re-specified here:** the echo-selection rule (THR-1813 plan, Decided 4); the harvest screen's contents (unchanged except that it now opens after the ceremony).

## Substrate inventory

Measured on `origin/main` at `3a2662f6` (worktree `docs/plan-2026-10-17-thr-1381-twilight`), Grep tool over `src/`.

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Cycle end — `cycleEnd.ts` (`startTwilight`, `runTwilightTick`, `computeHarvest`) | 🟢 ACTIVE (the harvest) / 🟠 the Twilight is 7 empty ticks | **extends** — adds `completeTwilight`; the ceremony path stops calling `runTwilightTick` |
| Age-end check — `orchestrator.ts` `phaseDoomExpiry` (`:2860-2900`) | 🟢 ACTIVE | **extends** — also starts the Twilight when the Mandate completes |
| Mandate — `phaseMandate.ts` (`:293-405`) | 🟢 ACTIVE | **preserve** — its completion flag is read; its popup becomes a chronicle line |
| World-Soul memory — `worldSoul.ts` (`captureMemory` `:117`, `selectTopMemories` `:142`, `degradeMemories` `:152`, `pruneMemories` `:163`), `types/worldSoul.ts` (`ResonanceMemory` `:44-59`, `MAX_RESONANCE_MEMORIES` `:31`) | 🟠 DORMANT — no production caller | **activates** — `captureMemory`, `degradeMemories`, `pruneMemories`, `selectTopMemories` gain their first callers |
| Account record — `accountRecord.ts` `concludeRun` (`:186`), resonance carry `:246-251` | 🟢 ACTIVE (slice 1 of THR-1813) | **extends** — the resonance carry degrades, prunes and appends this age's memories |
| Homed surfaces (Law 58 list) — `data/homed-surfaces.ts` (`:65-84`), `hosts/hostKinds.ts`, `interruptRegistry.ts`, `hosts/CeremonyHost.tsx` | 🟢 ACTIVE | **extends** — one new entry, `age-twilight` |
| Harvest screen — `HarvestScreen.tsx` via `CeremonyHost` `'cycle-harvest'` | 🟢 ACTIVE | **preserve** — opens after the ceremony, unchanged |
| Twilight run-state types — `TwilightState`, `initiateTwilight`, `tickTwilight`, `computeSuccessPenalty` (`types/worldSoul.ts:108`, `worldSoul.ts:181-213`) | 🟠 DORMANT — no production caller | **left dormant** — they model a playable Twilight, which Decided 2 rules out; not deleted (NFP 6) |

**Measurements behind the decisions** (each a Grep over `src/`, tests excluded):

| Claim | Evidence |
|---|---|
| Only doom expiry starts the Twilight | `phase: 'twilight'` is written at `orchestrator.ts:2882` and `cycleEnd.ts:72,83` only; `phaseMandate.ts:293-405` sets `mandateState.completed` and writes no `phase`; after completion it returns early (`:505`) |
| The Twilight shows nothing and simulates nothing | `useSimulation.ts:203-213`: in `'twilight'`, `doTick` calls `runTwilightTick` (tick + 1, phase → `'harvest'` after `TWILIGHT_TICKS` 7, `game-config.ts:150`) instead of `runTick`; no component under `src/components` renders a twilight surface (grep `twilight` -i: only `useSimulation`, two comments, terrain prose) |
| The Twilight counter is a module singleton | `cycleEnd.ts:66` `let twilightCounter = 0;` — breaks the load-bearing rule "engine caches are owned per session" |
| The only age-end text | popup `orchestrator.ts:2887-2893` ("The Unmaking" / "The Unmaking begins. The world trembles."); `phaseMandate.ts:363` ("Victory! Mandate … fulfilled before the final doom closes."); `computeHarvest`'s `chronicleSummary` (`cycleEnd.ts:191-195`); the harvest screen's titles |
| Nothing writes memories | grep `\b(captureMemory|selectTopMemories|degradeMemories|pruneMemories)\b`: definitions in `engine/worldSoul.ts`, its test, and the comment at `accountRecord.ts:246` — no other hit; `phaseWorldSoul` (the 2026-03 plan's capture site) does not exist |
| The carried memories reach the next world's state | `accountRecord.ts:249-250` copies them into the record; `gameInit.ts:597` copies `carried.resonance` into the new `worldSoul` |
| No run-level record of wars, betrayals or sacrifices | `GameState` (`types/gameState.ts`) has no war, battle-history or betrayal field (grep `^\s+(wars|battles|battleHistory|warHistory)\??:` → 0 hits); battles exist only as tick events (`gameState.ts:110`) |
| The seven doom kinds and their last stage names | `src/data/doom/*.json` `stageNames[4]`: ascension → *The Ascension*, breach → *The Breach*, changing → *The New Order*, convergence → *The Singularity*, failing → *The Failing*, reckoning → *The Reckoning*, sundering → *The Sundering* |
| The First and death are readable | `getFirstId(graph, ascendantId)` (`meetingEncounter.ts:1455`); `isAspect(graph, id)` (`aspects.ts:48`); a dead mortal carries `properties.deceased === true` (asserted in `aspects.test.ts:231`, `battleAftermath.test.ts:689`) |
| The sphere the world leans to is computed every tick | `worldSoul.aggregate.dominantSphere` (`types/worldSoul.ts:73-80`), written by `phaseSphereAggregation` |
| The world does not change during the ceremony | time is stopped by the ceremony, and the Twilight runs no `runTick` (above), so `computeHarvest(state)` called when the ceremony opens and again when it closes returns the same picks |

## Interface impact

The cycle-end and World-Soul code had no interface-map rows until THR-1813 added `twilight-harvest-preserves-defining-card`. Audited on touch:

| Contract | Action | Producer → consumer |
|---|---|---|
| `twilight-harvest-preserves-defining-card` | **preserve** | unchanged |
| `mandate-completion-ends-age` | **add** (register in `scripts/interface-contracts.ts`) | `phaseMandate` writes `mandateState.completed` → `phaseDoomExpiry` (renamed in prose only: the age-end check) reads it and starts the Twilight |
| `age-end-writes-resonance-memories` | **add** | `captureAgeMemories` (`twilight.ts`) → `concludeRun` writes them into `AccountRecord.resonance`; **reader this run:** the ceremony's third beat (`buildTwilightBeats`); **reader next run:** [THR-1971](https://linear.app/threadbare/issue/THR-1971) (Deferral) |
| account resonance carry (`concludeRun` → `gameInit.ts:597`) | **extend** | the carry now degrades and prunes before appending |

## Engine pillar

### Systems design

**E1 — `src/engine/twilight.ts` (new, pure).** No graph writes, no randomness.

```ts
export type AgeEnding =
  | { kind: 'mandate'; mandateName: string }
  | { kind: 'doom'; archetype: DoomClockArchetype; finalStageName: string };

export type FirstFate = 'aspect' | 'lived' | 'died';

export interface TwilightBeats {
  godName: string;
  ending: AgeEnding;
  first?: { id: string; name: string; fate: FirstFate; calling?: string };
  memories: ResonanceMemory[];   // this age's, top TWILIGHT_MEMORIES_SHOWN
}

/** Which clock ended the age. Mandate completed → 'mandate'; otherwise the doom kind. */
export function ageEnding(state: GameState): AgeEnding;
/** The First and their fate, or undefined when no First was bonded. */
export function firstFate(state: GameState): TwilightBeats['first'];
/** Up to three memories of this age, by rule (Decided 5). Pure; called twice with the same state it returns the same list. */
export function captureAgeMemories(state: GameState, harvest: HarvestResult, cycle: number): ResonanceMemory[];
/** Everything the ceremony shows. */
export function buildTwilightBeats(state: GameState, harvest: HarvestResult, cycle: number): TwilightBeats;
```

- `ageEnding`: `state.mandateState?.completed` → `{ kind: 'mandate', mandateName }` (the definition's `name`); else the doom clock's archetype and `stageNames[4]` from its data file. Missing data → fail-soft row.
- `firstFate`: `getFirstId(graph, ascendantId)`; `isAspect` → `'aspect'`; else `properties.deceased === true` → `'died'`; else `'lived'`. `calling` is the mortal's stored calling label (`readStoredCalling(node)`, `calling.ts:183`) when one exists.
- `captureAgeMemories`, in this order, each `ResonanceMemory` with `id: mem-<cycle>-<memoryType>`, `cycleOrigin: cycle`, `degradation: 0`:
  1. **The ending** — always: `mandate_triumph` (significance `RESONANCE_SIGNIFICANCE_MANDATE`, spheres = the god's bought pair) or `doom_scar` (`RESONANCE_SIGNIFICANCE_DOOM`, spheres `[]`).
  2. **The world's leaning** — `sphere_dominance` when `worldSoul.aggregate?.dominantSphere` is set (`RESONANCE_SIGNIFICANCE_DOMINANCE`, spheres `[that sphere]`).
  3. **The god's mark** — `divine_intervention` when `harvest.divineEchoes?.[0]` exists (`RESONANCE_SIGNIFICANCE_DIVINE`, spheres = the echo's spheres), naming it through `echoDisplayName`.
  `summary` is the rendered memory line (§ Content › Memory lines) — stored rendered, because the next world has no graph to fill a template from.

**E2 — `cycleEnd.ts`: `completeTwilight(state): GameState`, and the module counter goes.** `completeTwilight` sets `phase: 'harvest'`. It is the one way out of the Twilight: the ceremony's button, the fail-soft fallback and `endAgeNow` all call it. `doTick` stops calling `runTwilightTick` (time is stopped while the ceremony is open). That leaves `runTwilightTick`, the module-level `let twilightCounter` (`cycleEnd.ts:66`, a module singleton the load-bearing rule forbids) and `TWILIGHT_TICKS` with no production caller, so **all three are deleted** with their test cases (`cycleEnd.test.ts`, `orchestrator.test.ts`) and the two CMS rows that list the constant (`CMS/registry.ts:1192`, `CMS/tunableConstants.ts:87`; `configManagerMandateWeights.test.tsx` updates). `startTwilight` stays (it sets the phase), minus its counter reset.

**E3 — the age-end check (`orchestrator.ts` `phaseDoomExpiry`).** Add, before the doom branch: `if (state.mandateState?.completed && state.phase === 'playing') → phase 'twilight'`, trace `age.ended { by: 'mandate' }`. The doom branch keeps its floor (Law 31) and adds the same trace with `by: 'doom'`. Its popup event becomes `channel: 'chronicle'` with the line in § Content. **The Mandate branch has no floor:** Law 31 limits doom, and the Mandate cannot complete before its own stages anyway.

**E4 — `phaseMandate.ts:363`.** The completion event's channel becomes `'chronicle'` (text unchanged except as § Content says).

**E5 — `accountRecord.ts` `concludeRun`.** Replace the resonance carry (`:246-251`, removing the `TODO(THR-1381)`):

```ts
const carried = pruneMemories(degradeMemories(state.worldSoul.resonance.memories, RESONANCE_DEGRADE_PER_RUN));
let resonance: ResonanceState = { memories: carried, maxMemories: state.worldSoul.resonance.maxMemories };
for (const m of captureAgeMemories(state, harvest, cycleCount)) resonance = captureMemory(resonance, m);
```

`captureMemory` already evicts the weakest (`significance × (1 − degradation)`) when full. `concludeRun` already receives `harvest`, so no new argument.

### Graph nodes / edges

None added, none changed. Memories live in `WorldSoulState.resonance` and the account record, outside the graph, as `ResonanceMemory` already does.

### Tick phases

No new phase. `phaseDoomExpiry` (existing) gains the Mandate branch (E3). The ceremony runs while time is stopped.

### Resolution logic

Selection is by rule only: the ending from which clock ran out; the First's fate from three state facts in a fixed order (Aspect, then death, then alive); the memories in a fixed order, each present only when its fact exists; eviction by the existing `captureMemory` score.

### PRNG callouts

None. Every choice is a read of state (NFP 3). Law 5 does not apply: nothing here rolls or draws.

## Content pillar

All strings live in a new `src/data/twilight-content.ts` (one table per beat, keyed by ending kind, fate and memory type), plus tooltip rows in `src/data/ui-content.ts`. Register: game-master narration, facts stated plainly, no closing abstraction (taste profile § prose). `{god}` is the ascendant's name; `{first}` the First's name; `{calling}` their calling label in lower case.

### Prose tables — the ending (beat 1)

Title, then the kind's line, then the shared close.

| Ending | Title | Line |
|---|---|---|
| doom `ascension` | The Ascension | Something below the gods climbed to godhood, and the world bent to it. |
| doom `breach` | The Breach | A force from outside the world broke through its walls. |
| doom `changing` | The New Order | A new order of the heavens replaced the old one. |
| doom `convergence` | The Singularity | Every power in the world was drawn to one point, and that point gave way. |
| doom `failing` | The Failing | One of the forces that made the world gave out. |
| doom `reckoning` | The Reckoning | Every old debt came due at once. |
| doom `sundering` | The Sundering | The world broke apart along its oldest seams. |
| `mandate` | {mandate name}, fulfilled | {god} did all the Mandate asked before the end came. |

Shared close, doom: "The age of {god} ends. From here you watch; you cannot act." Mandate: "The age of {god} ends in triumph. From here you watch; you cannot act."

### Prose tables — the First (beat 2)

| Fate | Line |
|---|---|
| `aspect` | {first}, your First, stands at the end of the age as your Aspect. |
| `lived` | {first}, your First, lived to see the age end, a {calling} to the last. |
| `lived`, no calling | {first}, your First, lived to see the age end. |
| `died` | {first}, your First, died before the age ended. |

No First → the beat is not shown (no empty heading).

### Prose tables — memory lines (beat 3, and the stored `summary`)

| Memory type | Line |
|---|---|
| `doom_scar` | {final stage name} ended the age of {god}. |
| `mandate_triumph` | {god} fulfilled {mandate name} before the end. |
| `sphere_dominance` | When the age of {god} ended, the world leaned most to {Sphere}. |
| `divine_intervention` — Monument | {god} held {echo name} above every other place. |
| `divine_intervention` — Legacy | {god} raised {echo name} above every other mortal. |
| `divine_intervention` — Relic | {god}'s chosen carried {echo name}. |

`{echo name}` comes from `echoDisplayName`, so a Legacy reads *the line of Maren Ashfold* exactly as the harvest screen names it (PC-6).

### Chronicle lines (replacing the popups)

- Doom: "{final stage name}: the Unmaking begins." (replaces "The Unmaking begins. The world trembles.")
- Mandate: "{mandate name} is fulfilled." (replaces "Victory! Mandate … fulfilled before the final doom closes.")

### Encounter templates / Attachment content

N/A — the closing beats are a ceremony, not an encounter: no roll, no cards, no cast, so the encounter pipeline would add machinery with nothing to resolve.

### Data tables

The eight ending rows key on the doom archetype id already in `src/data/doom/*.json`; a content test asserts that every archetype file has a row (an archetype added later fails the test instead of falling back silently).

## UI pillar

*Screenshot tool: Playwright (the ceremony is DOM, like the harvest screen; no WebGL).*

### Player-facing display

**A new ceremony, `AgeTwilightScreen.tsx`** (`src/components/Game/`), rendered by `CeremonyHost` for kind `age-twilight`, on the same `Overlay`/`Panel` primitives and size tier as `HarvestScreen`. One panel, tinted by the god's primary sphere, with three sections in order and one button:

1. **The ending** — the title as a heading, then the line and the close.
2. **Your First** — the First's portrait (`EntityVisual`) and name (the same entity-name component the harvest screen uses for echo names: tooltip and link), then the fate line. Hidden when there is no First.
3. **What the world will remember** — the subline, then each memory line (≤ `TWILIGHT_MEMORIES_SHOWN`), sphere-tinted by the memory's first sphere.
4. Button **See what the age leaves** → `completeTwilight`, and the harvest screen opens.

**Registration is one entry in the Law 58 list** (`Docs/design-system/extending.md` row for homed surfaces): `HOMED_SURFACES` gains `{ kind: 'age-twilight', surfaceId: 'AgeTwilightScreen', home: 'ceremony', stopsTime: true, heldLine: 'The age is ending' }`; `CEREMONY_HOST_KINDS` gains `'age-twilight'`; its open predicate `'age-twilight': s => s.twilightPending === true` joins `HOMED_SURFACE_OPEN_WHEN` (`interruptRegistry.ts`, beside `'cycle-harvest'` at `:145`); `CeremonyHost` gains the case. `useSimulation` sets `twilightPending` when the phase becomes `'twilight'` (where it calls `startTwilight` today, `:248-252`) and computes the beats once, there. The tests that pin the ceremony list (`homedSurfaces.test.ts:140`, `Overlay.test.tsx:147`) gain the kind.

**UI Laws engaged:** 1 (every term has a tooltip: *Aspect*, *World-Soul*, *Mandate*, the sphere name), 13/14 (words only, no numerals: memory strength is not shown), 17 (the stakes are none: the close says the player cannot act), 21 (the First's name links), 25 (the one button names what it does), 33 (fits 1920×1080 without scrolling: at most one title, three lines, one portrait and three memory lines), 37 (ceremony z-band; `closeOnEscape={false}` and `onClose={STAY_OPEN}`, as `HarvestScreen.tsx:83-86` does, because the age cannot be resumed), 56/58 (one registry entry; nothing promised that the game does not do).

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Ceremony, ending (doom, rendered) | "**The Breach** · A force from outside the world broke through its walls. The age of Ilmarra ends. From here you watch; you cannot act." | PC-4, PC-7 | The close says, in the player's words, that the run is over and why the cards are gone; the button is the only thing to do |
| Ceremony, ending (Mandate, rendered) | "**The Long Peace, fulfilled** · Ilmarra did all the Mandate asked before the end came. The age of Ilmarra ends in triumph. From here you watch; you cannot act." | PC-4 | Same; the player learns that finishing the Mandate ended the age |
| Ceremony, First (rendered) | "Maren Ashfold, your First, lived to see the age end, a mender to the last." | PC-6 | The name, portrait and calling are the ones on the person page |
| Ceremony, memory heading | "What the world will remember" · subline "The World-Soul keeps these." | PC-1 | Tooltip `ui.twilight_memory`: "The World-Soul is the memory under every world. It keeps a few lines from each age, and older ones fade." |
| Ceremony, memory lines (rendered) | "The Breach ended the age of Ilmarra." · "When the age of Ilmarra ended, the world leaned most to Life." · "Ilmarra held The Long Barrow above every other place." | PC-6 | *The Long Barrow* is the name the harvest screen lists a moment later |
| Ceremony, memory subline when the record is not kept | "This world's memory will not be kept." | PC-4 | Shown on the same `remembered === false` paths as `ui.harvest_wake_unremembered` (Advanced setup, dev routes, failed save), so the ceremony never promises a carry the harvest then denies |
| Ceremony button | "See what the age leaves" | PC-8 | Tooltip `ui.twilight_continue`: "Open the harvest: what this age leaves for the next world." The harvest opens at once |
| Held line (another surface open) | "The age is ending" | PC-4 | The existing held-line chip, one entry |
| Chronicle (doom) | "The Breach: the Unmaking begins." | PC-5 | Replaces the popup; the ceremony follows at once |
| Chronicle (Mandate) | "The Long Peace is fulfilled." | PC-5 | Replaces the "Victory!" popup |

**Words:** the screen says *the age ends*, *World-Soul*, *remember*; it never says *Twilight*, *Resonance* or *Unmaking* in a heading (UL `Cosmology.md:213`, the Harvest collision note: *"in prose, the run-end is the end of an age"*). *Twilight* and *Resonance* stay engine names; no UL proposal is needed because no new player word is introduced.

### Playtest signal

A tester whose run ends can say how the age ended and what became of their First, in their own words, without having opened the chronicle.

### Event notifications

The two chronicle lines above. No toast, no popup, no interrupt besides the ceremony itself.

### Debug inspection (DebugPanel)

- `window.__DEBUG.beginTwilight()` (async): ends the age now by the normal path (Mandate if completed, else doom) and opens the ceremony. Distinct from `endAge()`, which keeps its current meaning (straight to the harvest) so THR-1813's browser test still holds.
- `window.__DEBUG.getTwilightBeats()` (async): the `TwilightBeats` the ceremony shows, or `null` outside the Twilight.
- DebugPanel world tab, *Account* readout (THR-1813): adds a *Memories* row listing each carried memory's type, cycle and memory word.

### Visual presence (HexMapV2)

N/A — the ceremony covers the map like the harvest screen; no map layer changes.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| Age-end check (E3) | `phaseDoomExpiry` | — | `phase`, reads `mandateState.completed` | `age.ended` | traces tab |
| `twilight.ts` (E1) | none (called when the Twilight opens and at run end) | `AgeTwilightScreen` | reads `worldSoul.aggregate`, `mandateState`, `doomClock`, graph | `twilight.beats_built`, `resonance.memory_captured` | `getTwilightBeats`, traces tab |
| `completeTwilight` (E2) | none (ceremony close, fallback, `endAge`) | `AgeTwilightScreen` → `HarvestScreen` | `phase` | `twilight.fallback` (fallback paths only) | traces tab |
| `concludeRun` memories (E5) | none (run end) | — | `AccountRecord.resonance` | `resonance.memory_captured` (one per memory), `resonance.memory_evicted` | DebugPanel *Memories*, `getAccountRecord` |
| Ceremony registration | — | `CeremonyHost`, `interruptRegistry`, `homed-surfaces` | UI state `twilightPending` | — | `getOpenModals` lists `age-twilight` |

Checked against `Docs/plans/wiring-checklist.md`: a new modal kind (registry entry + held line), new trace categories (`src/types/trace.ts`), a new player control (one button). `enrichProse()` is not used: the lines are filled from names, not enriched.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `RESONANCE_SIGNIFICANCE_DOOM` | 0.9 | How strongly a doom ending is remembered (2026-03-28 World-Soul plan's `doom_scar`) |
| `RESONANCE_SIGNIFICANCE_MANDATE` | 0.85 | Same for a Mandate ending (`mandate_triumph`) |
| `RESONANCE_SIGNIFICANCE_DIVINE` | 0.8 | The god's greatest mark (`divine_intervention`) |
| `RESONANCE_SIGNIFICANCE_DOMINANCE` | 0.7 | The sphere the world leaned to (`sphere_dominance`) |
| `RESONANCE_DEGRADE_PER_RUN` | 0.15 | How much every carried memory fades each age (the value `buildHarvestOutcome` already uses); a memory is gone after seven ages |
| `MAX_RESONANCE_MEMORIES` | 10 (existing) | Memories the World-Soul keeps; the weakest is dropped first |
| `TWILIGHT_MEMORIES_SHOWN` | 3 | Memory lines the ceremony (and THR-1971's step) shows |

All in `src/data/game-config.ts` with the other cycle-end constants, except `MAX_RESONANCE_MEMORIES`, which stays where it is.

## Tracing

```ts
// age.ended — the age-end check started the Twilight
interface AgeEndedTrace { category: 'age.ended'; tick: number; by: 'mandate' | 'doom'; archetype?: string; summary: string; }
// twilight.beats_built — the ceremony's contents, once per Twilight
interface TwilightBeatsBuiltTrace { category: 'twilight.beats_built'; tick: number; ending: 'mandate' | 'doom'; firstFate: 'aspect' | 'lived' | 'died' | 'none'; memoryTypes: string[]; fallbacks?: string[]; }
// resonance.memory_captured — one per memory written into the account at run end
interface ResonanceMemoryCapturedTrace { category: 'resonance.memory_captured'; tick: number; memoryId: string; memoryType: string; significance: number; reason: string; }
// twilight.fallback — the ceremony could not show; the age went straight to the harvest
interface TwilightFallbackTrace { category: 'twilight.fallback'; tick: number; cause: 'beats_threw' | 'mount_failed'; }
// resonance.memory_evicted — captureMemory dropped the weakest to make room, or a memory faded out
interface ResonanceMemoryEvictedTrace { category: 'resonance.memory_evicted'; tick: number; memoryId: string; cause: 'full' | 'faded'; }
```

## Fail-soft table

| Failure case | Fallback |
|---|---|
| Doom archetype data missing or `stageNames` short | Title "The Unmaking", line omitted; shared close still shown; `twilight.beats_built.fallbacks` lists `doom_data_missing` |
| Mandate completed but its definition is missing | Title "The Mandate, fulfilled"; the memory line uses "the Mandate" |
| A session loads or resumes with `phase: 'twilight'` and no `twilightPending` (a reload mid-ceremony) | The same `useSimulation` phase effect runs on mount for the loaded phase, not only on change: it builds the beats and sets `twilightPending`, so the ceremony reopens; if that throws, the first fallback row applies |
| No First bonded, or the First's node is gone | Beat 2 hidden; `firstFate: 'none'` traced |
| `worldSoul.aggregate` absent | No `sphere_dominance` memory; the ending memory still captured |
| No divine echo picked | No `divine_intervention` memory |
| `buildTwilightBeats` throws | Caught in `useSimulation` where it is called (the phase effect that sets `twilightPending`): `twilightPending` stays false, `completeTwilight` is called at once, trace `twilight.fallback { cause: 'beats_threw' }`. The harvest opens; the player loses only the beats |
| The ceremony cannot mount (a render error) | `CeremonyHost` already renders `HomedSurfaceFallback` for a surface that fails (`CeremonyHost.tsx:147`); its `onContinue` (`onHomedSurfaceSkip`) and `onFallback` for `age-twilight` call `completeTwilight`, trace `twilight.fallback { cause: 'mount_failed' }`. A test renders the fallback for this kind and asserts the phase reaches `'harvest'` |
| Carried memories malformed in an old record | `migrateAccount` already validates resonance (`accountRecord.ts:80,101`); an invalid memory is dropped, never thrown |

## Blast Radius

| File | Importer count | Cascade-risk note |
|---|---|---|
| `src/engine/orchestrator.ts` | 79 importers (grep of `from '…/orchestrator'`) | One branch added inside `phaseDoomExpiry`; no export changes |
| `src/types/trace.ts` | 129 importers (grep of `types/trace`) | Five trace categories added to the union; additive |

`src/types/gameState.ts` (754 importers) is **not** touched: no field is added (the ceremony flag is UI state, the memories live in the existing `worldSoul.resonance`).

## Three-pillar check

- [x] Engine pillar present (age-end check, twilight module, memory capture, concludeRun)
- [x] Content pillar present (eight openings, First lines, memory lines, chronicle lines, tooltips)
- [x] UI pillar present (the ceremony, its registration, debug levers, DebugPanel row)
- [x] Wiring section connects them

## Game Design Laws

- **Law 27** (the world stops for every moment that matters): the ceremony stops time. **Law 32** (a run is not about winning): the Mandate and doom each get an ending with its own words and its own memory; neither is a loss screen. **Law 31** (doom leaves room for one journey): the doom floor is untouched. **Law 39** (no god grows stronger between runs): memories are words carried in the World-Soul; nothing reads them as a bonus. **Law 45** (never promise what the world will not do): the subline says the World-Soul *keeps* the memories, which the record does; it does not claim the next world shows them, and the unremembered paths say so. **Laws 9/10** (influence, never command; no player-picked endings): the Twilight takes no input but *continue*. Nothing here rolls, so § I does not apply. No [E] law is broken.

## Vision audit

- [x] This plan does not contradict any Vision premise — it builds the rulebook's *witness* Twilight and Vision's *"a story they can tell in prose"* at the run's end.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan changes no rule of play the rulebook does not already state: the rulebook already says either clock ends the age and that the player witnesses the Twilight. The code is brought into line with it.
- [x] `Docs/canon/rulebook.md` is updated **in this plan's PR**, per the ticket's Done-when: §8's Twilight paragraph and the World-Soul paragraph cite this plan with `[DESIGN — THR-1381]` tags; open question 6 moves to *resolved by plan*, citing this plan and THR-1813 for echo selection. The build flips those tags to `[IMPL]`.

> Brainstorm companion: `Docs/plans/2026-10-17-thr-1381-the-end-of-the-age-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Four significances, the fade rate and the shown count are named constants; the cap already was. `TWILIGHT_TICKS` retires with the silent ticks it timed |
| 2. Inspectability | PASS | `age.ended`, `twilight.beats_built`, `resonance.memory_captured`, `resonance.memory_evicted`; `getTwilightBeats`; DebugPanel *Memories* |
| 3. Determinism | PASS | No randomness; every pick is a read of state in a fixed order; memory ids derive from cycle and type |
| 4. Fail-soft | PASS | Every missing input drops one line, never the ceremony; a failing ceremony falls back to `completeTwilight` (straight to the harvest), so the harvest is always reached |
| 5. Narrative over mechanical perfection | PASS | The plan exists to give the run an ending in words; the Mandate ending the age honours the player's triumph instead of letting doom overwrite it |
| 6. Additive over destructive | PASS with note | Two popups become chronicle lines (same facts, one surface); the dormant playable-Twilight functions stay. Deleted: `runTwilightTick`, its module counter and `TWILIGHT_TICKS`, because this plan removes their last production caller and the counter breaks the per-session cache rule |
| 7. Performance budget | PASS | Runs once per age; no per-tick work added |

## Kill criteria

- **The beats do not land.** If the next cold or warm playtest that reaches a run's end shows testers cannot say how the age ended or what became of their First, rewrite the lines in `twilight-content.ts`; the structure stays.
- **Runs feel cut short.** If finishing the Mandate ending the age draws Christian's veto or a playtest complaint that a run ended before the player was ready, revert E3 alone (the Mandate branch and its trace); the beats still serve doom endings unchanged.
- **The harvest is ever unreachable.** A run that cannot reach *Wake in a new world* is a release-blocking bug in the fallback, not a tuning matter: fix the fallback before anything else ships on this path.

## Done when

- [ ] A test: a state with `mandateState.completed` in `'playing'` enters `'twilight'` on the next `phaseDoomExpiry`, tracing `age.ended { by: 'mandate' }`; a doom expiry before the floor still holds.
- [ ] A test per beat: `buildTwilightBeats` on fixtures returns the right ending (each of the seven archetypes and the Mandate), the right First fate (Aspect, lived, died, none) and the memories in the stated order, with `summary` strings matching § Content exactly; called twice on the same state it returns equal results.
- [ ] A content test: every archetype in `src/data/doom/` has an ending row.
- [ ] A test drives `concludeRun` twice: the second record holds the first age's memories at degradation 0.15 plus the second age's at 0; with ten memories already held, the weakest is evicted (`resonance.memory_evicted`).
- [ ] The two popups are chronicle lines (a test on the emitted event channel).
- [ ] Both fallbacks reach the harvest: a test where `buildTwilightBeats` throws, and a test rendering `HomedSurfaceFallback` for `age-twilight`, each end in `phase: 'harvest'` with a `twilight.fallback` trace. `runTwilightTick`, `twilightCounter` and `TWILIGHT_TICKS` are gone (grep finds none).
- [ ] `npm run gate` passes (code track: test, typecheck ratchet, build, CLI smoke, test:heavy because engine files change); `npm run gate -- --final` last before push.
- [ ] Browser (Playwright, 1920×1080) on `?view=game&seeded&size=medium`: `await window.__DEBUG.beginTwilight()` opens *The age ends*; `await window.__DEBUG.getTwilightBeats()` matches what is on screen; *See what the age leaves* opens the harvest; `await window.__DEBUG.getAccountRecord()` then lists this age's memories; console clean; UI-Laws line for 1, 13, 14, 17, 21, 25, 33, 37.
- [ ] Rulebook tags flipped to `[IMPL]`; interface rows `mandate-completion-ends-age` and `age-end-writes-resonance-memories` in `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`; `TODO(THR-1381)` removed.
- [ ] Closing commit and PR body carry the line-anchored close keyword for this ticket.

## Coordination block

**Suggested model:** opus — it crosses the orchestrator's age-end check, the account record, the ceremony registry and `useSimulation`'s phase effects, and the fail-soft fallback must keep the harvest reachable on every path.

**Parallel-safe with:** [Echoes stand in the new world](https://linear.app/threadbare/issue/THR-1843) (world creation; this plan touches run end) and the economy builds (no shared files).

**Mutex with:** [Choices widen across runs](https://linear.app/threadbare/issue/THR-1844) on `src/engine/accountRecord.ts` (`concludeRun`; both edit it — whichever lands second merges `origin/main` first) and on the homed-surface lists if it adds its own entry; any open ticket editing `phaseMandate.ts` or `phaseDoomExpiry`.

**Files to touch:**
- Create: `src/engine/twilight.ts`, `src/data/twilight-content.ts`, `src/components/Game/AgeTwilightScreen.tsx`, tests beside each.
- Edit: `src/engine/orchestrator.ts` (`phaseDoomExpiry`: Mandate branch, popup → chronicle), `src/engine/phaseMandate.ts` (popup → chronicle), `src/engine/cycleEnd.ts` (`completeTwilight`; delete `runTwilightTick` and its counter), `src/components/CMS/registry.ts` + `src/components/CMS/tunableConstants.ts` (drop the `TWILIGHT_TICKS` rows), `src/engine/accountRecord.ts` (`concludeRun` memories), `src/data/game-config.ts` (constants), `src/types/trace.ts` (five categories), `src/data/homed-surfaces.ts`, `src/components/Game/hosts/hostKinds.ts`, `src/components/Game/interruptRegistry.ts`, `src/components/Game/hosts/CeremonyHost.tsx`, `src/components/Game/hooks/useSimulation.ts` (`twilightPending`, `doTick`, `endAgeNow`, `beginTwilight`), `src/data/ui-content.ts` (two tooltips), `src/debug-bridge.ts` + `.d.ts`, DebugPanel world tab, `Docs/canon/rulebook.md`, `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`, `Docs/design-system/extending.md` (if the homed-surface row needs the new kind named).

## Notes for the executor

- **Do not re-pick echoes.** The third memory reads `harvest.divineEchoes[0]` as `computeHarvest` returns it; THR-1813's rule decides it.
- **Compute the harvest once for the beats, once at completion.** Both calls see the same world (time is stopped, and the Twilight runs no `runTick`); do not cache the harvest across the boundary in a module variable.
- **The Mandate branch must run before the doom branch** in `phaseDoomExpiry`, so a run where both are true ends in triumph.
- **Keep `endAge()` meaning "straight to the harvest"**; add `beginTwilight()` beside it.
- **Do not show memory strength as a number.** A carried memory's word is THR-1971's business.

## Intent-judge verdicts

**Round 1 — Revise.** Dimension 10 VIOLATION: no kill-criteria section in the plan (they were only in the proposal). Dimension 4 GAP: the failed-mount fallback named no mechanism. Dimension 8 GAP: the fallback kept `runTwilightTick`'s module singleton on a production path while E2 proposed deleting it. All three fixed: a `## Kill criteria` section; both fallbacks call `completeTwilight` (`HomedSurfaceFallback` for a mount failure, a catch in `useSimulation` for a throw) with a `twilight.fallback` trace; `runTwilightTick`, its counter and `TWILIGHT_TICKS` are deleted.

**Round 2 — Allow.** One dimension-4 GAP below the threshold, with four advisories, all applied: the NFP row now names `completeTwilight` as the fallback; `TwilightBeatsBuiltTrace` gained `fallbacks`; a fail-soft row covers a reload mid-ceremony; the proposal counts five trace categories.

## Forked-audit verdicts

### NFP audit

NFP AUDIT: PASS-with-notes. 1 Tunability PASS (four significances, the fade rate and the shown count named in `game-config.ts`; `TWILIGHT_TICKS` retired). 2 Inspectability PASS (five trace categories, `getTwilightBeats`, DebugPanel *Memories*, wiring table). 3 Determinism PASS (nothing rolled; fixed pick order; ids from cycle and type; `captureAgeMemories` idempotent). 4 Fail-soft PASS (each missing input, a reload mid-ceremony, and both fallbacks reach `completeTwilight`). 5 Narrative PASS (authored closing beats; the Mandate ending no longer overwritten by doom). 6 Additive PASS-with-note (deletes `runTwilightTick`, `twilightCounter`, `TWILIGHT_TICKS`, justified by no remaining production caller and the singleton rule; two popups become chronicle lines; dormant playable-Twilight types kept). 7 Performance PASS (once per age; one boolean read added to `phaseDoomExpiry`).

### Three-pillar audit

PILLAR AUDIT: PASS. Engine present-and-substantive (E1–E5, no-PRNG callout, fail-soft). Content present-and-substantive (eight endings, First lines, memory lines, chronicle lines, tooltips; encounter templates N/A with rationale; a content test on the doom data). UI present-and-substantive (ceremony and registration, quoted player-facing text with PC mapping, playtest predicate, debug levers; HexMapV2 N/A with rationale; Playwright named). No missing required sections. Wiring ties every module to phase, component, field, trace and debug. Substrate: activates the dormant memory functions and extends `cycleEnd`, `accountRecord` and the homed-surface list; no green-field rebuild.

### Vision audit

VISION AUDIT: PASS-with-notes. Premises touched: north star (a run ends in a story told in prose — extended; two clocks — extended, the Mandate now also ends the age), core loop (halts for every moment that matters — confirmed), non-negotiables #1–#3 (confirmed: the only input is *continue*, no numbers), taste profile (plain register — confirmed). No contradictions. Notes: north star :51 ("the player's hand must be on the tiller") sits near Decided 2's watched Twilight, but the watch is scoped to a three-beat run-end ceremony, not play; north star :39 frames the Mandate as "toward a win", which Law 32 already reframes as one of two endings. No Vision edit needed.
