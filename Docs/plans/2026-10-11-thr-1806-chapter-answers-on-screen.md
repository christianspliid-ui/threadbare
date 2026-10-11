> **title:** A chapter answers on screen — THR-1806
> **linear_issue:** THR-1806
> **author:** Claude Code (design lane, run 2026-10-10d — decided under delegation, process.md rule 4)
> **created:** 2026-10-11
> **three_pillars:** Engine N/A (step timing and resolution unchanged; the fix is what the screen says and when the clock runs on the player's word) · Content done (ten named strings) · UI done

# A chapter answers on screen — THR-1806

*The player made a choice. They must see it answered, or be told plainly what the answer is waiting for.*

## Why this is load-bearing

Two of three round-3 cold testers ([round report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-3.md)) committed a step of a thread chapter on the main map and saw nothing happen. The veteran: *"I made a choice and got nothing … For a systems player, an action with no visible consequence is the cardinal sin."* The skimmer: *"Results of main-map quests weren't shown. I found them only by clicking 'Chapter Ledger'."* Both designer notes ask for the same thing: a result after every choice, on screen. This is complaint class PC-8 (the player acts and nothing answers), with PC-2 (hidden outcomes) as its consequence.

## Measured, not assumed

Worktree at `origin/main` `1ed28336`; live reproduction on the dev server at `?view=game&seeded&size=medium`, 1920×1080, 2026-10-10 ~20:30Z. The chapter was Kael Thornweaver's *The Healer's Oath* (a three-step chapter on a pause-tier thread, the same tier The First's chapters use).

| Claim | Evidence |
|---|---|
| A chapter step that opens while the clock is paused records "paused" as the state to return to | `__DEBUG.getInterruptState()` with the veil open: `{ open: ['EncounterVeil'], wasRunningBeforeInterrupt: false, running: false }` |
| Committing a step closes the veil at once and leaves the player on a paused, silent map | After clicking *Stay silent, let fate answer* on step 1: `getOpenModals()` → `[]`, `getInterruptState()` → `{ open: [], running: false }`, the TIME readout reads `paused`. Nothing on the map names the pending answer. Code: `handleCommitNudges` ends `setInterruptSuppressedUntilTick(gameState.tick + 1); setTieredEncounterState(null);` (`GameView.tsx:4217-4218`) |
| The step cannot answer until world time passes | A step resolves when `stepProgress >= stepDuration` (`unifiedActionLifecycle.ts:151-153`) and progress only moves on a tick (`progressUnifiedAction`, `:129-135`). Durations are content ranges, minimum one tick to observe: census of every `duration: { min, max }` in `src/data` + `src/content` gives max values `1`×343, `2`×248, `3`×143, `4`×49, `5`×18, `6`×3, `7`×1, `8`×2 |
| With the clock moving, every answer arrives on screen by itself | Same chapter, ticked with `__DEBUG.tick(1)`: step 1 answered after 1 tick (step 2's veil opened carrying step 1's result, "SHAKEN — It was just a failure…"), step 2 after 3 ticks, step 3 after 4 ticks, and the **Aftermath opened by itself** ("all 3 resolved", bond + boons). Re-run with the Play button: next veil opened 2–3 s after each commit, the aftermath ~4 s after the last |
| The time readout already has a slot to name what holds the clock | `SimulationControls.tsx:84`: `heldBy ? \`paused · ${heldBy}\` : running ? 'held · runs on after' : 'held · stays paused'` |
| The clock rule this must keep | Rulebook §3 (Christian, 2026-09-27): *"when the last one closes, the clock goes back to the state it was in. A god who paused to think stays paused."* `useInterruptAutoPause.ts:68-90` implements it and states there is no forced-resume side channel by that ruling |
| A paused-mode pause can be re-pointed while held | `pauseIfHeld()` / `runIfHeld()` on the hook handle (`useInterruptAutoPause.ts:28-42`, THR-1711/1716) |

**Diagnosis.** The answer is never lost: it is waiting for world time, and the player was left on a paused map with nothing saying so. Testers who paused to read the chapter (the natural thing to do) hit it every time; testers with the clock running would see the answer in 2–4 s. The ledger badge was the only thing that changed. The ticket's open question ("why the auto-open did not fire on resolution") did not reproduce: with time moving, the auto-open fired for every step and for the aftermath, in both the `tick(n)` and the Play-button runs.

## Decisions (made under delegation — veto in chat)

1. **A committed step on a paused clock keeps the chapter on screen.** The veil does not close. It turns into an *answering* card in the same place: the player's choice line, "The world must turn before this answers.", and one primary button, **"Let the world turn"**. A secondary link, **"Back to the map"**, closes it as today.
2. **"Let the world turn" runs the clock until this step answers, then pauses again.** The veil closes, the clock runs at the player's speed, the TIME readout names what it is waiting for ("turning · until The Healer's Oath answers"), and the next step or the aftermath opens itself exactly as it does today when time runs (measured above). When it opens, the clock's return state is set to paused, because that is the state the player left it in. The god who paused stays paused; the player asked for exactly the time this answer needs.
3. **"Back to the map" leaves the clock paused and says why.** The TIME readout reads "paused · The Healer's Oath answers when time runs" until the player runs time or the answer arrives. The answer still opens by itself when it comes.
4. **A running clock is unchanged.** If the clock was running when the chapter opened, commit closes the veil and the answer arrives in seconds, as it does today.
5. **Every step, not only the last.** The gap is the same after step 1 of 3 as after step 3 of 3 (measured), so the answering card follows every commit on a paused clock.
6. **No engine change.** Steps keep their world-time durations; nothing resolves at commit. The ticket recommended resolving the final step at commit. That would make a step take no world time when the player happens to be paused and the usual time when they are not, and it would need a resolution path outside the tick. The answering card gives the same "result right after the choice" with one click and keeps the world's clock honest.
7. **The Chapter Ledger stays the history.** It is not a delivery route for a fresh answer.

Options weighed and not taken are in the [brainstorm companion](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen-brainstorm.md).

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| Unified action step lifecycle (`unifiedActionLifecycle.ts`) | 🟢 ACTIVE | **unchanged** — durations, progress, resolution |
| Encounter auto-open scan (`runEncounterAutoOpenScan`, `GameView.tsx:4274-4290`) | 🟢 ACTIVE | **unchanged** — it already opens the next step and the aftermath once time moves |
| Interrupt auto-pause (`useInterruptAutoPause`) | 🟢 ACTIVE | **read + existing API** — `pauseIfHeld()` sets the return state when the answer opens; no new side channel |
| Encounter veil (`EncounterVeil.tsx`) | 🟢 ACTIVE | **extends** — an `answering` presentation after commit |
| Time readout (`SimulationControls.tsx`) | 🟢 ACTIVE | **extends** — two new status texts through the existing `heldBy`-style slot |

## Interface impact

The plan adds no cross-system read or write. Every value it reads (`tieredEncounterState`, `gameState.unifiedActions`, `running`, the auto-pause handle) is one GameView already reads.

| Contract | Disposition | Note |
|---|---|---|
| Unified actions → UI: `GameState.unifiedActions[].currentStep / resolved` | preserve | Read to detect that the committed step has answered |
| Interrupt registry → GameView: `EncounterVeil` entry | preserve | The answering card is the veil, still registered, so the clock stays held while it is up |
| Auto-pause handle: `pauseIfHeld()` | preserve | Existing API (THR-1711); called when the answer's veil opens after an answer run |
| Debug bridge: `getChapterAnswer()` | add | New read-only accessor; debug surface, no production read site needed |

No `Docs/canon/interface-map.md` or `scripts/interface-contracts.ts` change.

## Engine pillar

Engine: N/A — step durations, progress, outcome resolution and the auto-open scan stay as they are. The clock runs through the normal run loop when the player presses the button, so every tick is the same tick a Play press would produce.

## Content pillar

### Data tables

Ten strings in `src/data/nudge-stage-content.ts`, beside `NUDGE_COMMIT_LABEL` (`:236`), so copy changes are data edits:

| Constant | Text |
|---|---|
| `CHAPTER_ANSWER_WAITS_LINE` | `The world must turn before this answers.` |
| `CHAPTER_ANSWER_RUN_LABEL` | `Let the world turn` |
| `CHAPTER_ANSWER_BACK_LABEL` | `Back to the map` |
| `CHAPTER_ANSWER_TURNING_STATUS` | `turning · until {chapter} answers` |
| `CHAPTER_ANSWER_PAUSED_STATUS` | `paused · {chapter} answers when time runs` |
| `CHAPTER_ANSWER_PLAYED_LINE` | `Played: {cards}.` |
| `CHAPTER_ANSWER_SILENT_LINE` | `Stayed silent.` |
| `CHAPTER_ANSWER_TIMEOUT_TOAST` | `{chapter} did not answer in time. Its record is in the Chapter Ledger.` |
| `CHAPTER_ANSWER_DROPPED_TOAST` | `{chapter} ended without an answer on screen. Its record is in the Chapter Ledger.` |
| `CHAPTER_ANSWER_UNNAMED` | `this chapter` |

`{cards}` is the played cards' display names joined with ", ", from the same `cardsById.get(id)?.name` lookup `handleCommitNudges` already makes for the nudge memory (`GameView.tsx:4181`). An empty hand, or a hand whose names all fail to resolve, renders `CHAPTER_ANSWER_SILENT_LINE`; an unresolved name is dropped, never shown as an id (Law 43). `{chapter}` is the template's display name (the veil's title, e.g. "The Healer's Oath"), filled through the existing enrichment path (Law 43). When the name does not resolve, every string renders `CHAPTER_ANSWER_UNNAMED` ("this chapter"); an id never reaches the screen. No prose, encounter or template change.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces). The veil and the time readout are DOM; no WebGL involved.*

### Player-facing display

- **Answering card (`EncounterVeil.tsx`).** New optional props `answering?: { choiceLine: string }`, `onLetWorldTurn?: () => void`, `onBackToMap?: () => void`. When `answering` is set, the veil keeps its header (title, actor, step dots) and replaces the choice block with: the committed choice line (the hand played, or "Stayed silent"), `CHAPTER_ANSWER_WAITS_LINE`, a primary `Button` with `CHAPTER_ANSWER_RUN_LABEL`, and a text link with `CHAPTER_ANSWER_BACK_LABEL`. Escape maps to *Back to the map*. Enter maps to *Let the world turn*.
- **GameView commit path.** `handleCommitNudges` (`:4102`) and `handleEncounterCommitAndContinue` (`:4230`) keep their engine writes. Their last lines change: when `interruptAutoPause.getWasRunningBeforeInterrupt() === false` (the clock will stay paused on close), set `tieredEncounterState` to the same state with `answering: { actionId, stepIndex, choiceLine }` instead of `null`. When it is `true`, close as today. The suppression and committed-id bookkeeping (`:4211-4217`) are unchanged.
- **Answer run (new `src/components/Game/hooks/useChapterAnswerRun.ts`).** Holds `{ actionId, stepIndex, chapterName, startedAtTick } | null`.
  - *Let the world turn:* record the run, close the veil (`setTieredEncounterState(null)`), then `setRunning(true)`. The registry releases the hold on close and the clock is already set to run.
  - *Watch:* on each `gameState.unifiedActions` change, the run ends when the action's `currentStep !== stepIndex`, or `resolved`, or the action is gone.
  - *End with a beat open:* when the auto-open scan has opened the answer (veil open again), call `interruptAutoPause.pauseIfHeld()` so the clock returns to paused when the player closes it.
  - *End with nothing open* (action gone, thread set to *Lives on*, or the answer opened no beat): `setRunning(false)` and push one toast, `CHAPTER_ANSWER_DROPPED_TOAST`. The run never ends in silence.
  - *Cap:* after `CHAPTER_ANSWER_RUN_MAX_TICKS` ticks without an answer, `setRunning(false)` and push one toast, `CHAPTER_ANSWER_TIMEOUT_TOAST`
  - *The player takes the clock back:* pressing Pause (or Space) during a run ends the run and turns it into a *waiting* answer (below), so the readout says what is still pending. The player's own press wins.
- **Back to the map.** Close the veil as today and record `{ actionId, stepIndex, chapterName }` as a *waiting* answer (same hook). While it waits and the clock is paused, the time readout shows `CHAPTER_ANSWER_PAUSED_STATUS`. It clears when the answer arrives. If the action goes away instead, it clears with `CHAPTER_ANSWER_DROPPED_TOAST`. Pressing Play starts no special run; the answer opens itself as today, and the clock follows normal rules (a player who pressed Play is running).
- **Time readout (`SimulationControls.tsx`).** A new optional `answerStatus?: string` prop. When set and the clock is not held by an interrupt, it replaces `running ×N` / `paused`. GameView passes `CHAPTER_ANSWER_TURNING_STATUS` during a run and `CHAPTER_ANSWER_PAUSED_STATUS` while an answer waits.

### Player-facing text

| Surface | Exact text the player reads | Complaint class touched | How the player understands it |
|---|---|---|---|
| Answering card, silent hand (rendered sample) | "Stayed silent." / "The world must turn before this answers." / **[Let the world turn]** · Back to the map | PC-8 | The choice was taken; the answer needs world time; one click gives it |
| Answering card, played hand (rendered sample) | "Played: Steady Hand, Old Debts." / "The world must turn before this answers." / **[Let the world turn]** · Back to the map | PC-8, PC-3 | The cards the player just spent are named back to them; no ids |
| Time readout after Pause pressed mid-run | "paused · The Healer's Oath answers when time runs" (the run becomes a waiting answer) | PC-8, Law 52 | The press was obeyed; the answer is still waiting on time |
| Time readout during a run | "turning · until The Healer's Oath answers" | PC-8, Law 52 | Time is running, and for what |
| Time readout after *Back to the map* | "paused · The Healer's Oath answers when time runs" | PC-2, Law 52 | The answer is waiting on the clock, not lost |
| Next step (unchanged; measured sample, step 2 of *The Healer's Oath*) | Stakes, before: "Choosing this road, Kael Thornweaver must break the sickness in the lower streets — or go down with the sickness they fought all month." Result of the step just answered, on the same veil: "SHAKEN — It was just a failure. But failure has texture — this one pressed on something that doesn't let go easily; their next action will start from this." | PC-2 | The card said what was played; the next veil opens with that step's result under the same stakes line, so the answer reads as the reply to the choice |
| Aftermath (unchanged; measured sample) | "all 3 resolved" / "AFTERMATH — Kael Thornweaver completed at great cost The Healer's Oath. Kael Thornweaver's choices left one reward, two skill shifts behind in the world." with rows "BOND · Kael Thornweaver's Reputation ▲▲▲", "BOON · Heart ▲▲", "BOON · Gold ▲▲", "BOON · Tonguebound — Kael Thornweaver gained Tonguebound. ▲" | PC-2 | The chapter's outcome appears by itself after the last answer, without the ledger |
| Cap toast | "The Healer's Oath did not answer in time. Its record is in the Chapter Ledger." | PC-2 | Rare fallback; names where to look |
| Dropped toast (the mortal died, the thread was released or set to *Lives on*, or the answer opened no beat; during a run or while waiting) | "The Healer's Oath ended without an answer on screen. Its record is in the Chapter Ledger." | PC-8, PC-2 | The answer was taken away, and the game says so and where to read it |
| Any of the above with an unresolved chapter name | "turning · until this chapter answers" / "This chapter ended without an answer on screen. …" | PC-3 | Never an id; the sentence still reads |

### Playtest signal

A round-4 tester who commits a step of a main-map chapter sees the next step or the aftermath on screen without opening the Chapter Ledger. No tester says a choice "did nothing". A tester who mentions the answering card describes it as the game waiting for time, not as a stall.

### Event notifications

None new. The cap toast uses the existing toast channel (`handlePushToast`).

### Debug inspection (DebugPanel)

- `window.__DEBUG.getChapterAnswer(): Promise<{ state: 'none' | 'answering_card' | 'running' | 'waiting'; actionId: string | null; stepIndex: number | null; chapterName: string | null; ticksRun: number }>`, declared in `src/debug-bridge.d.ts`.
- A dev-only `console.debug('[chapter-answer]', state, actionId, stepIndex)` line on each state change.

### Visual presence (HexMapV2)

N/A — no map layer changes.

## Wiring

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `useChapterAnswerRun.ts` (new) | none (render-time) | `GameView` | reads `unifiedActions` | `console.debug('[chapter-answer] …')` (UI) | `__DEBUG.getChapterAnswer()` |
| `EncounterVeil.tsx` answering card | none | `EncounterVeil` | none | — | `getOpenModals()` still lists `EncounterVeil` |
| `SimulationControls.tsx` `answerStatus` (via `GameViewTopBar.tsx`) | none | TIME readout | none | — | readout text |
| `nudge-stage-content.ts` strings | — | veil, readout, toast | — | — | — |

Wiring checklist (`Docs/plans/wiring-checklist.md`): no new engine module, no new GameState field, no cross-system read/write. The Design Reference Wiki page whose `sources` include `EncounterVeil.tsx` or `SimulationControls.tsx` gets a one-line note on the answering card.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `CHAPTER_ANSWER_RUN_MAX_TICKS` | `24` | Ticks an answer run waits before giving up (two in-world days; the longest content step is 8 ticks before tier scaling) |
| `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` | `false` | Show the answering card even when the clock was running. Off: a running clock delivers in seconds |

Both live in `src/data/nudge-stage-content.ts` with the strings.

## Tracing

No engine trace: no engine state changes. The UI-side record is the debug accessor and the dev `console.debug` line:

```ts
interface DebugChapterAnswer {
  state: 'none' | 'answering_card' | 'running' | 'waiting';
  actionId: string | null;
  stepIndex: number | null;
  chapterName: string | null;
  ticksRun: number;   // ticks since "Let the world turn", 0 otherwise
}
```

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| The committed action vanishes during a run or while waiting (agent dies, thread released) | The run ends with `setRunning(false)`; the readout clears and `CHAPTER_ANSWER_DROPPED_TOAST` names what happened |
| The answer arrives but another surface blocks the auto-open | The clock still stops (`pauseIfHeld` or `setRunning(false)`); the auto-open scan opens it when the surface closes, as today; the thread badge is the recovery route (Law 39) |
| No answer within `CHAPTER_ANSWER_RUN_MAX_TICKS` | Clock stops; `CHAPTER_ANSWER_TIMEOUT_TOAST` names the ledger |
| The chapter name does not resolve | Strings render `CHAPTER_ANSWER_UNNAMED`; no id is shown |
| `getWasRunningBeforeInterrupt()` returns `null` at commit (no registry hold recorded) | Treat as running: close as today. Worst case equals current behaviour |
| The player presses Pause mid-run | The run becomes a waiting answer; the clock stays where the player put it |
| Two chapters commit back to back | One run at a time; a second commit while a run is active replaces it (the newer card is on screen) and the older answer still opens itself when time runs |

## Three-pillar check

- [x] Engine pillar — N/A with rationale (timing and resolution unchanged; the run loop is the player's Play)
- [x] Content pillar — ten named strings
- [x] UI pillar — answering card, answer-run hook, time readout, debug accessor
- [x] Wiring section connects them

## Vision audit

- [x] No contradiction with the Stellaris clock (rulebook §3, 2026-09-27). The clock never moves without the player's press. The press asks for this answer, and the clock returns to paused when it arrives, which is the state the player left it in.
- [x] The First is born asking (THR-1715): her chapters still stop the world; this changes only what happens after the player answers.
- [x] UI Laws engaged: **39** (beats still interrupt on their own; the answering card is part of the beat); **40** (no badge cleared by this); **47** (the commit is acknowledged on the surface the player clicked); **52** (the readout names why time runs or waits); **42/43** (plain microcopy, enriched placeholders); **1, 13/14, 17, 21, 33, 37** checked at closeout per the browser-verify contract.

## Rulebook impact

- [x] This plan does not change a rule of play: steps keep their world time and the clock still returns to the state the player left it in.
- [x] Rulebook §3 gains one sentence describing the new surface, in this ticket's implementation PR: *"A step you answer while paused waits for world time. The chapter says so and offers to let the world turn until it answers, then stops again."* `[IMPL]` once shipped.

> Brainstorm companion: `Docs/plans/2026-10-11-thr-1806-chapter-answers-on-screen-brainstorm.md`

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Two named constants; ten strings in content |
| 2. Inspectability | PASS with note | No engine trace (no engine state); `__DEBUG.getChapterAnswer()` answers "why is nothing on screen" |
| 3. Determinism | PASS | Ticks come from the normal run loop; no resolution path changes |
| 4. Fail-soft | PASS | Seven cases; worst case equals today |
| 5. Narrative over mechanical perfection | PASS | The chapter holds the player's attention until the world answers |
| 6. Additive over destructive | PASS | One new hook, optional props; two handlers' final lines branch |
| 7. Performance budget | PASS | One effect on `unifiedActions` change while a run or wait is active |

## Done when

- [ ] Unit tests for `useChapterAnswerRun` (renderHook): run ends on `currentStep` change, on `resolved`, on action removal, on the tick cap, and on a player pause; `pauseIfHeld` is called when a veil is open at the end; action removal mid-run and while waiting pushes `CHAPTER_ANSWER_DROPPED_TOAST`; the cap pushes `CHAPTER_ANSWER_TIMEOUT_TOAST`; an unresolved name renders "this chapter".
- [ ] An `EncounterVeil` component test: with `answering` set, the card shows the three strings and the two controls; Escape calls `onBackToMap`.
- [ ] Browser evidence on `?view=game&seeded&size=medium`, at 1920×1080, clock paused. Tick until a pause-tier chapter veil opens; commit step 1. `getOpenModals()` contains `EncounterVeil` and `getChapterAnswer().state === 'answering_card'`; screenshot the card. Click *Let the world turn*: the next step's veil opens by itself; `getInterruptState().wasRunningBeforeInterrupt === false`. Repeat to the last step: the aftermath opens by itself; after *got it*, `getInterruptState().running === false`.
- [ ] The reported path: `?view=game&firstunmet&size=medium`, bond with The First, pause, tick until her first chapter veil opens, play one card and commit. `getChapterAnswer().state === 'answering_card'` and the card reads `Played: <card name>.` Screenshot it. (Every pause-tier chapter goes through the single veil mount, `GameView.tsx:6270`, and `onCommitNudges={handleCommitNudges}` at `:6338`, so The First and Kael share this path; this bullet proves it on hers.)
- [ ] Same setup, *Back to the map* after a commit: the readout shows `paused · <chapter> answers when time runs`; press Play; the next veil opens by itself.
- [ ] With the clock running before the veil opened, commit closes the veil as today (no card).
- [ ] Rulebook §3 sentence added.
- [ ] `npm test`, `npm run check:typecheck`, `npx vite build` pass; console clean; UI-Laws judgment line names Laws 1, 13/14, 17, 21, 33, 37, 39, 47, 52.

## Kill criteria

- A round-4 tester still says a main-map choice "did nothing" → read `getChapterAnswer()` on that path; the card is not reaching it.
- A round-4 tester says the game "ran on by itself" after a chapter → the clock is not returning to paused; check the `pauseIfHeld` call.

## Coordination block

**Implementation ticket:** one, filed into the *Cold playtest · round 3* milestone (Onboarding & First-Run Experience) at handoff, as the design ticket's Done-when requires.

**Suggested model:** sonnet — one hook, one veil presentation, one readout prop, all anchored.

**Parallel-safe with:** [THR-1795](https://linear.app/threadbare/issue/THR-1795) — scripts and hooks only.

**Mutex with:** [THR-1808](https://linear.app/threadbare/issue/THR-1808) and [THR-1807](https://linear.app/threadbare/issue/THR-1807) once they are planned — both touch what opens over the map after the bond and the veil's surfaces (`GameView.tsx` commit handlers ~4100–4240 and the veil mount ~6270–6340; `EncounterVeil.tsx`).

**Files to touch:**
- Create: `src/components/Game/hooks/useChapterAnswerRun.ts`, its test
- Edit: `src/components/Game/GameView.tsx`, `src/components/Game/GameView/GameViewTopBar.tsx` (threads `answerStatus` to `SimulationControls` the way `clockHeldBy` → `heldBy` does, `GameViewTopBar.tsx:215`), `src/components/Game/EncounterVeil.tsx`, `src/components/Game/SimulationControls.tsx`, `src/data/nudge-stage-content.ts`, `src/debug-bridge.d.ts` + `src/debug-bridge.ts` (registers `getChapterAnswer` beside `getGiftDelivery`), `Docs/canon/rulebook.md` §3

## Notes for the executor

- Do **not** add a forced resume to `useInterruptAutoPause`. The run starts with an ordinary `setRunning(true)` after the veil closes, and ends through the hook's existing `pauseIfHeld()`.
- The suppression window (`setInterruptSuppressedUntilTick(gameState.tick + 1)`) and `committedEncounterNotificationIds` keep working as today. The answering card shows the committed step's notification, so the auto-open must not re-open that step's choice. Keep `suppressedEncounterNotificationId` set while the card is up.
- `getWasRunningBeforeInterrupt()` must be read **before** `setTieredEncounterState` changes, while the veil still holds the clock.
- THR-1809's gift hold already treats an open veil as an interrupt, so a gift waits behind the answering card. Nothing to add.

## Intent-judge verdict

**Allow** on the fourth run (opus, cold context, 2026-10-11). Runs 1–3 returned **Revise**, all folded in: run 1 asked for a played-card rendered sample, a quoted mid-run Pause readout, two more named strings and proof on The First's own chapter; run 2 for exact result and aftermath words (PC-2) and a consistent string count; run 3 for a visible reply when an answer is dropped (`CHAPTER_ANSWER_DROPPED_TOAST`) and a fallback for an unresolved chapter name. Run 4's one advisory (name `GameViewTopBar.tsx` and `src/debug-bridge.ts` in Files to touch) is folded in. Impact class confirmed Reversible.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-11*

### NFP audit

PASS-with-notes. Tunability PASS: two named constants and ten named strings beside `NUDGE_COMMIT_LABEL`. Inspectability PASS-with-note: `__DEBUG.getChapterAnswer()` and a dev `console.debug` line; no engine trace, justified because no engine state changes. Determinism PASS: ticks come from the normal run loop. Fail-soft PASS-with-note: every case falls back to today's behaviour; the auditor flagged the NFP row's case count ("Six") against a seven-row table. *Author response: corrected to seven.* Narrative PASS. Additive PASS: one hook, optional props, two handler tails behind a branch. Performance PASS: one effect active only during a run or wait.

### Three-pillar audit

PASS. Engine N/A with rationale (durations, resolution and the auto-open scan unchanged); a substrate inventory is present anyway and shows no duplication. Content present and substantive: ten named strings with placeholder and fallback rules. UI present and substantive: player-facing display and text tables with PC classes, playtest signal, debug accessor. No missing required sections; Blast Radius not owed (no file at 100 importers). The Wiring table ties each module to phase, component, state read, trace substitute and debug surface.

### Vision audit

PASS. Non-negotiables confirmed: narrative over mechanical perfection (steps keep world time), the god is not the protagonist (the player asks for time, never steers the result), mechanics surface as prose. Core loop confirmed: the aftermath still opens by itself after the last answer. North star confirmed: witnessing, not steering. No contradictions found. The auditor noted the plan cites no Vision file by path; premises were matched from content, and the governing ruling (rulebook §3, 2026-09-27) is quoted in the plan. `[design-brief-stale]` (no Vision summary section in `Docs/design-brief.md`).
