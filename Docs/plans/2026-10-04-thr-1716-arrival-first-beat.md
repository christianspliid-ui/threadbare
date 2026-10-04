> **title:** The world arrives with its first beat already open — THR-1716
> **linear_issue:** THR-1716
> **author:** Claude Code (tb-design-lane, run 2026-10-04b, under delegation)
> **created:** 2026-10-04
> **three_pillars:** Engine `done — one pure helper offers the opening spine beat at arrival` · Content `done — three microcopy strings, one tooltip; no prose rewritten` · UI `done — arrival beat enters itself, bond release starts time, first-run Play prompt, one-click remembrance; Playwright DOM`

# The world arrives with its first beat already open — THR-1716

*After Ascend, the first story beat is on screen before the player touches the map, and the first time the world moves is a choice the player makes inside the story.*

## Why this is load-bearing

Cold playtest round 2 (2026-10-03, [THR-1716](https://linear.app/threadbare/issue/THR-1716)) found the opening that [THR-1605](https://linear.app/threadbare/issue/THR-1605) built still waits behind a button nobody points at. The story tester: *"The actual story only started when I happened to press Play. I spent about 8 clicks lost before that."* One near-quit came *"on first arriving at the map with no direction"*. The skimmer was *"~2 minutes in, still in character creation"*, because each of the four picture screens takes a click to zoom, a click to confirm and a slow fade.

The cause is one measured fact. Beat 0 ("Reach Down") is authored to be due at turn 0, but the code that offers beats only runs inside a tick, and the world arrives paused:

```
$ grep -n "SPINE_TRIGGER_TURNS: " src/data/ascendant-beat-content.ts
41:export const SPINE_TRIGGER_TURNS: readonly number[] = [0, 2, 4, 6, 8];
$ grep -n "useState(false)" src/components/Game/hooks/useSimulation.ts
89:  const [running, setRunning] = useState(false);
$ grep -rn "phaseAscendantBeatDirector(" src | grep -v __tests__ | grep -v "export function"
src/engine/orchestrator.ts:2975:    const r = runInlinePhase('ascendant_beat_director', s, () => phaseAscendantBeatDirector(s, beatRng));
```

`phaseAscendantBeatDirector` has exactly one caller, the tick orchestrator, and the beat state starts as `spineCursor: 0, pending: null` (`createInitialAscendantBeatState`, `ascendantBeat.ts:93-99`, called from `gameInit.ts:398`). So until the player presses Play, nothing is offered, the meeting effect (`GameView.tsx:4234-4266`, gated on `openingBeatResolved`) never fires, and the god stares at a still map. Even after a tick, Beat 0 arrives as an offer banner the player must click to enter (`GameView.tsx:5861-5863`) before the "Reach Down" modal opens.

The outcome is agreed: the ticket states the Fixed-when (*no round-3 tester spends more than three actions on the map before their first story beat*) and a recommended direction (*the first beat fires without needing Play; keep the remembrance, but one click selects*). Christian's ruling of 2026-09-27 sets the clock: *"the Stellaris model. Real-time, with generous auto-pause on important things"* ([THR-1608 comment](https://linear.app/threadbare/issue/THR-1608)). This plan is the *how*, which process.md rule 4 makes an agent decision. The design lane made each call under delegation; they are listed in § Decisions made by delegation with a veto invited.

**This plan does not build on any lane decision still inside its veto window.** It is the pre-bond half of the opening. [The First asks](https://linear.app/threadbare/issue/THR-1715) governs what happens *after* the bond, and nothing here reads or changes its attention-mode calls.

## Decisions made by delegation (veto in chat)

1. **The opening beat is offered the moment the world exists, at turn 0, without a tick.** *Why:* Beat 0 is already authored as due at turn 0; the only thing missing is a caller. *Rejected:* auto-run the clock until Beat 0 (it lets the world move before the player has done anything, which breaks the Stellaris start and burns seconds of doom-free simulation the player never saw); a pulsing Play prompt as the *only* fix (it still makes the player's first act on the map a guess about a control).
2. **At arrival the opening beat opens by itself.** The offer banner is a thread-tug for later beats, the player's choice to engage; the opening is the game's first sentence and is not optional (it is already non-dismissable, `GameView.tsx:5875`). *Rejected:* keep the banner (one wasted click, and the click lands on something the player has never seen).
3. **The world stays paused at arrival, and the bond's own button starts time.** The bond ends on *"Let them walk."* (`BOND_RELEASE_TEXT`, `meeting-narrative-prose.ts:76`). When the clock has never run in this world, pressing it sets the clock to run when the meeting closes. It is the player's act, in the story's words, so this is not an auto-run and not a forced-resume side channel: it goes through the same held-state path a Play press inside a popup already uses (`toggleIfHeld`, THR-1711). After the first run, resume-to-prior (THR-1608 S3) is untouched. *Rejected:* always resume after the bond (overrides a player who paused on purpose on a later re-threading); leave it paused and rely on the prompt alone (the "storybook straight into a spreadsheet" drop the story tester named).
4. **Until time has run once, the Play control asks for it.** If no interrupt is open and the clock has never run, the Play control shows a quiet pulse and a one-line caption: *"Time is still. Press Play or Space to let the world move."* It disappears for good the first time the clock runs. This is the fallback for every path that skips decision 3: the meeting closed without a bond, an identity-less start (`?view=game`), a cooldown. *Rejected:* a modal tutorial (an interrupt to explain interrupts); a permanent caption (Law 53, the HUD is a budget).
5. **The remembrance keeps all four picture screens; one click chooses.** Testers praised its writing and the recap, so its length stays. What goes is the zoom-then-confirm double click: a click on a picture *chooses* it, and the chosen picture takes the large composition the zoom used to show, so the art still gets its moment. For the two screens that advance on their own (the stirring and the drive), the chosen state holds briefly with **"Choose again"** and Escape to undo before the flow moves on. The origin and transformation screens already end in a naming or court step and a Continue button, so clicking another picture before Continue simply re-chooses. Arrow keys move a focus ring across the row and Enter chooses. *Rejected:* cut a screen (the testers' praise is the one thing round 1 and round 2 agree on, and cutting identity input is a meaning call, not a how call); keep click-to-zoom behind a separate magnifier (a second vocabulary for one act).

**Would change the calls:** round-3 testers who want the world to start on its own (decision 3 becomes "the bond resumes always"); testers who choose a picture by accident and cannot undo it (lengthen the hold, or give the stirring and drive screens a Continue too); a director ruling that remembrance picks are irreversible acts under Law 48 (then every screen gets a Continue, which costs back one click per screen).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Ascendant Beats & Progression (`phaseAscendantBeatDirector`, `ascendant-beat-content.ts`) | 🟢 ACTIVE | **extends** — a pure helper `offerArrivalSpineBeat` reuses the director's spine branch once, at arrival. Pool, deepening and gift gates unchanged. |
| Meet The First (`meetingEncounter.ts`, `MeetTheFirstFlow`, GameView auto-trigger) | 🟢 ACTIVE | **preserved** — the auto-trigger already fires on `openingBeatResolved` with no tick; it now runs at tick 0. |
| Interrupt registry + auto-pause (`interruptRegistry.ts`, `useInterruptAutoPause.ts`) | 🟢 ACTIVE | **extends** — one method `runIfHeld()`, the mirror of the existing `pauseIfHeld()`. |
| Simulation clock (`useSimulation.ts`, `SimulationControls.tsx`) | 🟢 ACTIVE | **extends** — a session flag `clockEverRan`; the first-run prompt reads it. |
| Remembrance flow (`src/components/Remembrance/*`) | 🟢 ACTIVE | **extends** — selection becomes one click; the timings become named constants. |

Population counts: none consumed. The opening beat is one per world; the remembrance has four picture screens (`RemembranceFlow.tsx:114-121`: stirring, origin, drive, transformation, then reveal).

## Engine pillar

### Systems design

**E1 — `offerArrivalSpineBeat(state: GameState): Partial<GameState>`** in `src/engine/ascendantBeat.ts`. It returns `{ ascendantBeats }` with the opening beat pending, exactly as the director's spine branch would (`offer(beats, def, def.trigger, turn, 0, bindBeatSubject(def, state), true)`, `ascendantBeat.ts:616`), when **all** hold:

- `state.ascendantBeats` exists, `spineCursor === 0`, `pending === null`;
- the cursor beat's trigger is satisfied at `state.tick` (Beat 0's `minTurn` is 0, so true at tick 0);
- The First is not bonded (`firstIsBonded(state)` false).

Otherwise it returns `{}`. It emits `beat.arrival_offer` once when it offers. It consumes **no PRNG**: the director's spine branch draws nothing (the `rng` parameter is used only by the cadence-gated pool draw, `ascendantBeat.ts:627`).

The bond gate keeps every pre-bonded dev route (`?seeded`, `?spawn=`, `?testavatar`) exactly as today: their First is bonded, so the helper is a no-op and Beat 0 still arrives on the first tick.

**E2 — Call site.** `useSimulation.ts`'s initial `useMemo` (the one that calls `initializeGameState`, ending at line 83) merges `offerArrivalSpineBeat(result.state)` into the returned state. The arrival is a player event, so the call lives where the player arrives, not inside `initializeGameState`: the headless CLI and every test fixture that builds a world keep today's byte-identical tick-0 state. A new cycle (`handleBeginNextCycle`) is not an arrival and does not call it.

### Graph nodes / edges

None. No graph write; the helper changes only `GameState.ascendantBeats`.

### Tick phases

None changed. The director (phase `1.75`) still runs every tick; at tick 1 it sees `pending` and skips (`emitSkipped(turn, 'pending', …)`), which is what it already does while any beat is open.

### Resolution logic

None. The beat resolves through the existing `resolveBeat` path when the player presses "Reach Down".

### PRNG callouts

None. The helper draws nothing. Determinism note: on the first-run path the opening beat now becomes pending at tick 0 instead of tick 1. No seeded draw moves, so the world's random stream is unchanged.

## Content pillar

### Encounter templates

None.

### Prose tables

None rewritten. Beat 0's prose (`SPINE_BEAT_PRESENTATION['beat.spine.opening']`) already opens *"You walk the world again as {avatarName}…"*, which reads correctly as the first thing after the title. The bond's *"Let them walk."* already means "let the world go on"; this plan gives it that effect.

### Attachment content

None. No attachment, condition or trait is granted or read.

### Data tables

Three microcopy strings and one tooltip, in `src/data/ui-content.ts` (the `ui.*` table `resolveTooltip` reads, Law 17):

- `ui.sim_first_run` tooltip, on the Play control while the prompt shows: *"The world waits while time is still. Play lets mortals live their days; it stops again for every moment that matters."* (≤200 chars, Law 18.)
- Prompt caption: *"Time is still. Press Play or Space to let the world move."* Second person is legal here: it is the god's own control (Law 42; THR-1715 precedent).
- Remembrance undo control: *"Choose again"*.

No new game term. The prompt and the hold are UI states with code names only (`firstRunPrompt`, `chosenHold`), never player-facing words, so they owe no UL entry.

## UI pillar

*Screenshot tool: Playwright (every surface here is DOM: the beat modal, the meeting, the top bar, the remembrance). UI Laws engaged: 1, 12, 13/14, 17, 18, 21, 23, 25, 33, 37, 39, 41, 42, 44, 46, 47, 48, 50, 52, 53.*

### Player-facing display

**U1 — The arrival beat enters itself.** In `GameView.tsx`, when the pending beat is `OPENING_SPINE_BEAT_ID` and was offered by the arrival helper, `beatEntered` starts `true`, so `AscendantBeatModal` opens directly and the offer banner never renders. Later beats keep the banner. The modal is already a registered interrupt and already non-dismissable for spine beats.

**U2 — "Let them walk." starts time, once.** `useInterruptAutoPause` gains `runIfHeld(): boolean`, the mirror of `pauseIfHeld`: while an interrupt holds the clock it sets the saved state to running and returns `true`. `handleMeetingComplete` calls `interruptHoldRef.current?.runIfHeld()` **only when `clockEverRan` is false**. When the meeting closes, the registry's resume-to-prior policy restores "running", and the world moves. When `clockEverRan` is true, the handler does nothing new and resume-to-prior returns the clock to how the player left it.

**U3 — The first-run Play prompt.** `useSimulation` exposes `clockEverRan` (set true the first time `running` becomes true, never reset in a session; a page reload is a new arrival). `SimulationControls` takes a `firstRunPrompt` prop, true when `!clockEverRan && !running && heldRunning === null` and the world has existed for `FIRST_RUN_PROMPT_DELAY_MS` (so it never flashes under the arrival beat). It renders a slow pulse ring on the Play button and the caption in the top bar's existing time zone (Law 35; nothing new in persistent chrome beyond the caption while it shows, Law 53). `prefers-reduced-motion` collapses the pulse to a static ring (Law 44). The Play button's tooltip switches to `ui.sim_first_run` while the prompt shows.

**U4 — One-click remembrance.** In `StirringBeat`, `OriginBeat`, `DriveBeat` and `TransformationBeat`:

- A click on a picture in the row **chooses** it. The `focusedId → second click` branch is removed; the chosen picture takes the enlarged composition the focus view used to render, and the others dim, so input is acknowledged within one `--anim-fast` (Law 47).
- **Stirring and drive** (which call `onSelect` on a timer today, `StirringBeat.tsx:27`, `DriveBeat.tsx:39`): during the hold a **"Choose again"** text button and Escape return to the row (Law 23). When the hold ends, `onSelect` fires as today.
- **Origin and transformation:** choosing reveals the naming / court step as today; clicking another picture before Continue re-chooses. Continue is unchanged.
- **Keyboard:** Left/Right move a visible focus ring along the row (`:focus-visible`, Law 23), Enter chooses. `OriginBeat.enter.test.tsx`'s Enter-to-continue path is kept.
- The prev/next arrows of the old focus view go; the row is the browser now.
- Hit areas stay the full card (Law 46). Motion stays inside the ceremonial tier the remembrance already uses (Law 41); no `transition: all` is added, and the existing `transition-all` on `FragmentCard` is narrowed to `opacity, filter` while the file is open.

### Event notifications

None new. The first clock run is a UI trace only (dev).

### Debug inspection (DebugPanel)

`window.__DEBUG.getOpeningState()` gains two fields: `arrivalBeatOffered: boolean` (the `beat.arrival_offer` trace fired this session) and `clockEverRan: boolean`. Typed in `src/debug-bridge.d.ts`.

### Visual presence (HexMapV2)

N/A — no map change. The camera and avatar marker from THR-1605 S6/S7 are untouched.

## Interface impact

| Contract (interface-map name or new) | Producer | Consumer | Disposition |
|---|---|---|---|
| `player-acts-pace-spine-gifts` | `playerActCount` writers | `phaseAscendantBeatDirector` | **preserve** — gifts 1–4 keep every gate; only Beat 0 (cursor 0, gate (a) only) is offered early |
| `meeting-bond-writes-the-first` | `createAgentFromMeeting` | `isFirstBonded`, `isMeetTheFirstAvailable` | **preserve** — the helper reads the bond through `firstIsBonded` |
| Interrupt resume-to-prior (THR-1608 S3; UI-internal, not a map row) | `useInterruptAutoPause` | the clock | **extend** — `runIfHeld()`, called from one site under one condition |

No new cross-system write. The helper writes `ascendantBeats.pending`, which the beat modal already reads.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `offerArrivalSpineBeat` (E1) | none — called once from `useSimulation` init (E2) | `AscendantBeatModal` (U1) | `ascendantBeats.pending` | `beat.arrival_offer` | `getOpeningState().arrivalBeatOffered` |
| `runIfHeld` (U2) | — | `MeetTheFirstFlow` → `handleMeetingComplete` | — (UI state) | `clock.first_run` (dev UI trace) | `getInterruptState().wasRunningBeforeInterrupt` |
| `clockEverRan` + prompt (U3) | — | `SimulationControls` via `GameViewTopBar` | — (UI session state) | `clock.first_run` | `getOpeningState().clockEverRan` |
| One-click remembrance (U4) | — | `StirringBeat`, `OriginBeat`, `DriveBeat`, `TransformationBeat`, `FragmentCard` | — | none (pre-world; no trace buffer yet) | component tests |

**Player controls:** Play button, Space, and the bond's "Let them walk." all start the clock; whichever comes first sets `clockEverRan`. The manual "Meet The First" card in the location drawer stays as the retry path.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FIRST_RUN_PROMPT_DELAY_MS` | `1500` | How long the world must sit still with no interrupt open before the Play prompt shows; stops a flash under the arrival beat |
| `STIRRING_CHOSEN_HOLD_MS` | `1200` (today's inline value, now named) | How long the chosen stirring picture holds, with "Choose again", before the flow moves on |
| `DRIVE_CHOSEN_HOLD_MS` | `1000` (today's inline value, now named) | Same, for the drive screen |
| `ORIGIN_NAMING_REVEAL_MS` | `600` (today's inline value, now named) | Delay from choosing an origin to the naming field appearing |
| `TRANSFORMATION_COURT_REVEAL_MS` | `700` (today's inline value, now named) | Delay from choosing a hunger to the court step appearing |

The four remembrance values keep today's numbers; naming them is the tunability fix (NFP #1). Round-3 evidence decides whether the holds shorten.

## Tracing

```ts
// beat.arrival_offer — the opening spine beat was offered at arrival, before any tick (E1)
interface BeatArrivalOfferTrace {
  tick: number;          // the arrival tick, 0 on a fresh world
  category: 'beat.arrival_offer';
  beatId: string;        // OPENING_SPINE_BEAT_ID ('beat.spine.opening')
  summary: string;
}

// clock.first_run — dev-only UI trace, the first time the clock runs in this session (U2/U3).
// Same channel as THR-1608's clock.interrupt_open / clock.interrupt_close.
interface ClockFirstRunTrace {
  tick: number;
  category: 'clock.first_run';
  source: 'bond_release' | 'play_control' | 'hotkey' | 'debug';
  summary: string;
}
```

Both add to the `src/types/trace.ts` union.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `ascendantBeats` missing (old save, fixture) | Helper returns `{}`; Beat 0 behaves as today (first tick) |
| Spine cursor not 0, or a beat already pending | Helper returns `{}` |
| First already bonded (dev routes, a loaded save) | Helper returns `{}`; no early beat, no auto-enter |
| Helper throws | Caught inside the helper, traced as the director's error is, returns `{}`; the world loads and Beat 0 arrives on the first tick |
| No identity (`?view=game`): meeting cannot mount | Beat 0 still opens at arrival; after "Reach Down", the Play prompt shows (U3), so the player is never left without direction |
| Meeting closed without a bond | Resume-to-prior keeps the clock paused; the Play prompt shows |
| `interruptHoldRef` null when the bond completes | `runIfHeld` is optional-chained; the meeting closes paused and the Play prompt shows |
| The player pauses after "Let them walk." | `clockEverRan` is already true; resume-to-prior and the Play control behave exactly as today |
| A remembrance hold timer outlives an undo | The timer is cleared on "Choose again" / Escape and on unmount (`useEffect` cleanup) |

## Blast Radius

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | 148 (`.codesight/graph.md`; 125 by direct import grep) | **Additive only.** Two new members in the `TraceCategory` union, two matching entries in `TRACE_CATEGORIES` (the pattern the existing `beat.*` categories follow), and two new interfaces in the `TraceEntry` union. No existing member, field or reader changes, so every importer sees a widened type and nothing else. Proof: `npm run check:typecheck` (the ratchet) shows no net-new errors; regression guard: `trace-categories.test.ts` and `trace.test.ts` |

Every other file in scope is under 10 importers (`ascendantBeat.ts` 7, `ui-content.ts` 5, `useSimulation.ts` 2, `useInterruptAutoPause.ts` 2, `FragmentCard.tsx` 1). `GameView.tsx` and `debug-bridge.ts` are low-importer but large surfaces, held by the THR-1715 mutex.

## Three-pillar check

- [x] Engine pillar present (E1, E2)
- [x] Content pillar present (three strings, one tooltip; no prose rewrite, with reason)
- [x] UI pillar present (U1–U4, Playwright DOM, Laws listed)
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise (checked against `Vision/00-north-star.md`, `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md`, `Vision/taste-profile.md`). The core loop (`Vision/01-core-loop.md`)'s *"halts for every moment that matters: an encounter, a choice, the meeting…"* is served: the first moment now happens. The Stellaris start (paused until the god acts) is kept; the god's first act is a story choice.
- [x] No Vision edit needed.

## Rulebook impact

- [x] This plan does not change a rule of play. The clock model, the spine order and every gift gate are unchanged; only *when* the already-due opening beat is offered moves from the first tick to arrival.
- [x] No `Docs/canon/rulebook.md` edit is needed, because no rule changed.

> Brainstorm companion: `Docs/plans/2026-10-04-thr-1716-arrival-first-beat-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Five named constants; four were inline magic numbers before |
| 2. Inspectability | PASS | `beat.arrival_offer`, `clock.first_run`; two new `getOpeningState()` fields |
| 3. Determinism | PASS | No PRNG in the helper; the seeded stream is unchanged; CLI and fixtures untouched because the call is at the UI arrival site |
| 4. Fail-soft | PASS | See table; every failure degrades to today's behaviour plus the Play prompt |
| 5. Narrative over mechanical perfection | PASS | The world's first motion is the story's own line, "Let them walk." |
| 6. Additive over destructive | PASS with note | Additive helper, method, flag and prop. The remembrance's second-click branch and its focus-view arrows are removed: the change the ticket asks for |
| 7. Performance budget | N/A | One helper call per world load; no tick-path cost |

## Done when

- [ ] **Arrival:** unit tests prove `offerArrivalSpineBeat` offers `beat.spine.opening` at tick 0 for an unbonded world with fresh beat state, and returns `{}` when the First is bonded, when `ascendantBeats` is missing, when a beat is pending, and when the cursor is not 0. A test asserts it reads no RNG (it takes none).
- [ ] **No action before the first beat:** Playwright at 1920×1080 on `?view=game&firstunmet&size=medium`. On load, with **no tick and no click**: `(await window.__DEBUG.getInterruptState()).open` includes the ascendant beat, `(await window.__DEBUG.getOpeningState()).arrivalBeatOffered === true`, and the game tick is 0. Screenshot of the "Reach Down" modal. Pressing "Reach Down" opens the meeting (`window.__DEBUG.getMeetingState()` non-null).
- [ ] **The bond starts time:** a hook test proves `runIfHeld()` sets the saved state to running and the clock runs when the last interrupt closes. A GameView-level test proves completing the meeting with `clockEverRan === false` leaves the clock running after close, and with `clockEverRan === true` and a paused clock leaves it paused (resume-to-prior intact).
- [ ] **The prompt:** a component test proves `SimulationControls` shows the prompt and the `ui.sim_first_run` tooltip only when `firstRunPrompt` is true, and a reduced-motion test proves the pulse is static. Playwright on `?view=game` (no identity, so no meeting): after "Reach Down", the prompt is visible; screenshot; pressing Space clears it and `getOpeningState().clockEverRan === true`.
- [ ] **One-click remembrance:** component tests prove, for each of the four picture screens, one click chooses; "Choose again" and Escape undo during the stirring and drive holds; Enter on a focused picture chooses; origin and transformation still need Continue. Playwright from the title screen (New World) with a screenshot of a chosen state.
- [ ] Browser-verify four-part evidence per `Docs/canon/verification-gates.md` § Browser-verify, citing Laws 1, 13/14, 17, 21, 33, 37, 39, 44, 47, 52.
- [ ] `npm run gate` green (code track): `npm test`, `npm run check:typecheck`, `npx vite build`, freshness gates. Engine file touched, so a 30-tick CLI smoke and `npm run test:heavy` (expected unchanged: the CLI never calls the helper).
- [ ] Closing commit body and PR body each carry the close line for this ticket on its own line.

## Coordination block

**Suggested model:** opus — the hold/undo interaction and the held-clock path need judgement; the engine helper is small.

**Parallel-safe with:** [THR-1714](https://linear.app/threadbare/issue/THR-1714) (it edits the meeting's test beats and the encounter stage shells; this plan touches no MeetTheFirst component file and no encounter-stage file). [THR-1713](https://linear.app/threadbare/issue/THR-1713) (unclaimed design ticket, no files yet).

**Mutex with:** [THR-1715](https://linear.app/threadbare/issue/THR-1715) (both edit `src/components/Game/GameView.tsx` and `src/debug-bridge.ts` / `src/debug-bridge.d.ts`).

**Files to touch:**
- Edit: `src/engine/ascendantBeat.ts` (E1 helper)
- Edit: `src/components/Game/hooks/useSimulation.ts` (E2 call; `clockEverRan`)
- Edit: `src/components/Game/hooks/useInterruptAutoPause.ts` (`runIfHeld`)
- Edit: `src/components/Game/GameView.tsx` (U1 auto-enter; U2 bond release; prompt prop)
- Edit: `src/components/Game/GameView/GameViewTopBar.tsx`, `src/components/Game/SimulationControls.tsx` (U3)
- Edit: `src/components/Remembrance/StirringBeat.tsx`, `OriginBeat.tsx`, `DriveBeat.tsx`, `TransformationBeat.tsx`, `FragmentCard.tsx` (U4)
- Edit: `src/data/ui-content.ts` (tooltip + strings)
- Edit: `src/types/trace.ts` (two trace types)
- Edit: `src/debug-bridge.ts`, `src/debug-bridge.d.ts` (two `getOpeningState` fields)
- Edit: `public/run-lifecycle-reference.html` (opening paragraph; blocking wiki-freshness gate)
- Create: tests beside each (`src/engine/__tests__/arrivalSpineBeat.test.ts`, hook, component and remembrance tests)

## Notes for the executor

- **Reuse `forceOfferBeatById`** (`ascendantBeat.ts:460`): it already offers a beat by id with subject binding and advances the cursor when the beat is at the cursor. E1 can be the gate check (cursor 0, nothing pending, trigger satisfied, First unbonded) wrapped around it, rather than a second copy of the director's `offer(...)` call.
- **Do not put the helper inside `initializeGameState`.** That would shift every CLI world and fixture to a pending beat at tick 0 and re-baseline heavy tests for no player benefit. The arrival is a UI event.
- **Do not add a `resume: 'always'` registry field for the meeting.** The bond release is a player press routed through the held state, the THR-1711 pattern; it is conditional on `clockEverRan`.
- **`?seeded` must look exactly as it does today** (bonded First → helper no-op → Beat 0 on the first tick behind its banner). Check one `?seeded` load before closing.
- **Wiki freshness is blocking:** `public/run-lifecycle-reference.html` declares `src/engine/ascendantBeat*.ts` in its `sources` (`public/wiki-manifest.json`), so editing `ascendantBeat.ts` requires updating that page in the same PR — say the opening beat is offered at arrival, before any tick (THR-730).
- THR-1711 item 2 noted that the setup screens' "click again to choose" taught the opposite of the card drawer's re-click. This plan removes "click again to choose" from setup, so the two now agree.

## Intent-judge verdict

**Allow** (cold fable judge, 2026-10-04, second pass). Pass 1 returned **Revise** on one VIOLATION, blast radius: `src/types/trace.ts` has 148 importers and the plan had no Blast Radius section. The section was added, the proposal corrected, and two optional accuracy notes applied. Pass 2 scored all 11 dimensions PASS with zero findings.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-04 (design lane, run 2026-10-04b)*

### NFP audit

NFP AUDIT: PASS-with-notes. 1 Tunability PASS-with-note (five named constants, four of them inline values now named; the pulse-ring size and caption fade are unspecified, so they inherit the motion tokens). 2 Inspectability PASS-with-note (two traces and two `getOpeningState()` fields; the remembrance is pre-world and covered by component tests; `clock.first_run` is a dev UI trace on the THR-1608 channel). 3 Determinism PASS (the helper draws nothing; the seeded stream is unchanged). 4 Fail-soft PASS (nine-row table; the helper catches internally and returns `{}`). 5 Narrative PASS (time starts on the bond's own line). 6 Additive PASS-with-note (the second-click branch and focus-view arrows are removed, as the plan acknowledges). 7 Performance PASS (one call per world load, nothing on the tick path).

### Three-pillar audit

PILLAR AUDIT: PASS-with-notes. Engine, Content and UI are each present and substantive. Wiring maps every module to its phase, component, field, trace and debug surface, and lists the player controls. The substrate inventory states extends or preserves for all five rows, with no green-field duplicate, and the plan reuses `forceOfferBeatById`. Note: the Attachment content subsection was missing. It is now added as "None", with a reason.

### Vision audit

VISION AUDIT: PASS-with-notes. The plan touches the north star (the first beat now opens before any map action), the core loop (resume-to-prior is extended once, only while the clock has never run), non-negotiables #2 and #7, and the taste profile's Stellaris-clock entry. No contradictions. Soft notes: (1) the Vision audit cited no file paths; they are now added. (2) "Let them walk." starting time is a conditional exception to resume-to-prior. It is justified as the player's own act and invites a veto, so it is kept flagged in the decision record.
