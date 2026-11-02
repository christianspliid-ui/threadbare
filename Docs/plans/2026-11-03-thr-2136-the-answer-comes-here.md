> **title:** The answer comes here — a chapter step stays on the Stage until it answers, on a running clock too (THR-2136)
> **linear_issue:** THR-2136
> **author:** Claude Code (design lane, unattended, 2026-11-03 — run 2026-11-03a)
> **created:** 2026-11-03
> **three_pillars:** Engine N/A (no simulation change; one registry data row) · Content done (two lines) · UI done

# The answer comes here (THR-2136)

*On a running clock, pressing Play on a chapter step drops the player onto the map with no result. Keep the chapter on the Stage while the world turns, open its answer in the same place, and let that answer go before anything else that arrived meanwhile.*

## Why this is load-bearing

Cold playtest round 6 ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-6.md)), **3/3 testers**, the fourth round running (THR-1806 → THR-1976 → THR-2052 → here). Story: *"Two-step chapters dropped me back on the map between steps and after the last step, with no outcome shown. I thought it had broken."* Veteran: *"For about a minute I thought my spend had done nothing."* Skimmer, at their quit point: *"a snap back to the map with no result."* All three ran on the running clock, the default once the First is bonded.

THR-2052 carried the answer forward to the top of the next step ("Step 1 held. You: …"). That line works, but players read the close itself as "nothing happened". The design question the ticket asks: *what does the player see in the first second after pressing Play, and does the chapter's Aftermath outrank other arrivals?*

Measured on `main` @ `1d67ef29`:

- **The close is deliberate.** `keepChapterOnScreenAfterCommit` returns `false` when the clock was running (`GameView.tsx:2707`) because `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK = false` (`nudge-stage-content.ts:342`, comment: *"a running clock answers in seconds"*). GameView then closes the veil (`:2857-2858`, `:2900-2901`).
- **The paused-clock card exists and is the wrong shape for a running clock.** THR-1812's answering card (`EncounterVeil.tsx:2791-2830`, hook `useChapterAnswerRun.ts`) keeps the veil up, and the veil holds the clock (`homed-surfaces.ts:69`, `EncounterVeil` `stopsTime: true`). So it offers *Let the world turn*, which must close the veil to let time pass (`GameView.tsx:2721-2725`). Flipping the constant alone would pause a running world and ask the player to restart it — the opposite of the fix.
- **A step answers in a few ticks.** The longest content step is 8 ticks (`nudge-stage-content.ts:339`). A tick is `1000 / speed` ms (`useSimulation.ts:290`), so 1–8 s at speed 1.
- **Three things stand between the answer and the screen.** (1) The THR-2053 quiet window: a world-opened chapter waits `INTERRUPT_QUIET_AFTER_INPUT_MS = 2500` after the last input (`interruptRegistry.ts:53`, applied `GameView.tsx:2967-2985`). (2) Any ready premonition blocks the whole scan: `if (activePremonition) return;` (`GameView.tsx:2949`). The premonition takes the Stage first, which is the skimmer's ~20 s Aftermath. (3) The step itself is not on screen while it plays out.
- **The registry already supports a surface that does not stop time.** Every hold reads `stopsTime !== false` (`interruptRegistry.ts:235`, `:363`, `:390`).

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| Chapter answer run (`useChapterAnswerRun`, THR-1812) | 🟢 ACTIVE | extends: one new phase, `answering_live` |
| Answering card (`EncounterVeil` → `ChapterAnsweringCard`) | 🟢 ACTIVE | extends: a live variant (no *Let the world turn*) |
| Interrupt registry / homed surfaces (THR-1877) | 🟢 ACTIVE | extends: one homed row with `stopsTime: false` |
| Encounter auto-open scan + THR-2053 holds | 🟢 ACTIVE | extends: the live record's own answer skips the quiet window and the premonition gate |
| Last-step answer line (`lastStepAnswer`, THR-2052) | 🟢 ACTIVE | unchanged: it is the answer the player now sees open in place |

## Decisions

Made by the design lane under delegation (process.md rule 4; veto in chat). All are inside the period focus Christian set on 2026-11-01 (*"legibility and usability of the different UI modules"*) and follow the ticket's recommended direction, corrected for the clock-hold finding above.

1. **D1 — After Play, the chapter stays on the Stage, on any clock.** On a running clock the Stage becomes the answering card and **time keeps running underneath it**: the card does not hold the clock. It shows the choice line ("Played: Boost." / "Stayed silent.", existing) and, in the Fate place, a waiting line with the sanctioned breathing placeholder (Law 54): *"The world turns. The answer comes here."* The TIME control reads the existing *"turning · until {chapter} answers"* (Law 52). The paused-clock card (THR-1812) is unchanged.
2. **D2 — The answer opens in the same place.** When the step answers, its next beat (which opens on THR-2052's "Step 1 held. You: …" line) or its Aftermath replaces the card on the Stage, with no map in between. Opening it is an ordinary beat: it holds the clock (Law 39), and the hold remembers *running*, so the world runs on when the player closes it.
3. **D3 — The chapter's own answer goes first.** While a live answer is pending, its next beat or Aftermath opens before any premonition, story beat or other arrival that became ready during the wait. Those wait their turn, as arrivals already do behind an open interrupt; nothing is dropped. The THR-2053 quiet window does not apply to this one beat. That window stops the world opening a chapter under a click aimed elsewhere. Here the Stage is already showing this chapter, and the click it answers is the player's own Play. The THR-2053 **surface** hold still applies: if the player left with *Back to the map* and opened something of their own, the answer waits as today.
4. **D4 — One way out.** The live card keeps *Back to the map*. Pressing it ends the card. The answer then arrives as an ordinary beat, exactly as today on a running clock. *Let the world turn* does not appear, because the world is already turning.
5. **D5 — Bounded.** The existing `CHAPTER_ANSWER_RUN_MAX_TICKS` (24) bounds the live wait. A step that plays out a moveless step (THR-2140) keeps the card up, as the running phase already does. If no answer opens, the card closes with the existing dropped or timeout toast.

Rejected: flipping `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` alone (it pauses a running world, see above); a result toast on the map (testers read the map snap itself as failure, and a toast is not the Stage's one chrome, Law 37); pausing the clock for every commit (rulebook §3: no forced pauses or resumes, 2026-09-27).

## Engine pillar

N/A for the simulation. No tick phase, resolution, graph or PRNG change: the step resolves exactly as today. No file under `src/engine/` changes. The one new data row (`src/data/homed-surfaces.ts`, U3) is read by the view registry `src/engine/views/interruptRegistry.ts` unchanged. It is listed under UI because only the screen reads it. No GameState field is added: the live phase is React state in the hook.

## Content pillar

- **C1** — `CHAPTER_ANSWER_LIVE_WAITS_LINE = 'The world turns. The answer comes here.'` in `src/data/nudge-stage-content.ts`, beside `CHAPTER_ANSWER_WAITS_LINE` (`:277`). Plain register, no second person, no number (Laws 4, 42).
- **C2** — `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` keeps its name and becomes `true`. Its comment is rewritten to say the running-clock card is the *live* variant, which does not hold the clock. Turning it back to `false` restores today's close: the kill switch (NFP 1).
- **C3** — homed row `holderName` is not needed: the live surface stops no time, so nothing names it as a holder.

## UI pillar

- **U1 — Live phase.** `useChapterAnswerRun.ts` gains `answering_live` (record built by a new `showLiveCard(target)`). `stepChapterAnswer` for `answering_live`:
  - veil closed by *Back to the map* → `waiting` (as `answering_card` does today);
  - step answered and a pending answer beat exists (`hasPendingAnswerBeat`) → emit a new effect `{ kind: 'open_answer' }` and end the record;
  - answered with no beat and not a moveless step → `none` + dropped toast;
  - `CHAPTER_ANSWER_RUN_MAX_TICKS` counted from `startedAtTick` (set at `showLiveCard`) → timeout toast, close;
  - a player pause leaves the card up; the TIME control reads the existing *"paused · {chapter} answers when time runs"*.
  `chapterAnswerStatus` returns the turning line for `answering_live` while running.
- **U2 — GameView wiring.** `keepChapterOnScreenAfterCommit` calls `showLiveCard` when the hold says the clock was running, and keeps the veil up. `open_answer` opens the pending beat at once through `handleOpenEncounterFromNotification`. The answer is for the same mortal and chapter, so the Stage swaps content and never closes. While a live record is pending, `activePremonition` resolves to `null`: the queue is untouched and the premonition shows when the record ends. The auto-open scan's `recent_input` hold is skipped for the live record's own beat only.
- **U3 — The live card stops no time.** A new row in `src/data/homed-surfaces.ts`: `{ kind: 'encounter-answering', surfaceId: 'EncounterVeilAnswering', home: 'stage', stopsTime: false, palette: 'encounter' }`. While the record is `answering_live`, the veil registers under this id instead of `EncounterVeil`. It is still the Stage, so there is no new container type (THR-1823). Grey zone: the executor finds where the encounter's homed entry is marked rendering (the registry's `rendering` list built from `stageVMByKind`, `GameView.tsx:3568-3575`). It swaps the id there, so the hold and `resolveClockHolder` both see it.
- **U4 — Live card face.** `ChapterAnsweringCard` takes `live: boolean`. When it is set, the card has no *Let the world turn* button, focus lands on *Back to the map*, and the waits line is C1 under a `.animate-breathe` bar at the Fate slot's size (Law 54). Text tone: the waits line carries information, so it uses `--text-secondary`, not whisper (Law 45).
- **U5 — Debug.** `DebugChapterAnswer.state` gains `'answering_live'`, and the record gains `premonitionDeferred: boolean`. It is true while a ready premonition waits behind the live answer (D3), so the reordering can be inspected (`useChapterAnswerRun.ts` and `src/debug-bridge.d.ts`).
- Laws engaged: 37, 38, 39, 45, 47, 52, 54, 55. Browser-verify: Playwright DOM on `?view=game&seeded&size=medium&forceencounters`, clock running at speed 1.

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Live answering card, under the choice line | "Played: Boost." / "Stayed silent." then "The world turns. The answer comes here." | PC-8 | The card stays where they pressed Play and says the answer will land there |
| TIME control during the wait | "turning · until {chapter} answers" (existing) | PC-8 | Time is visibly running, and for what (Law 52) |
| Next step, opened in place | "Step 1 held. You: Boost." (`CHAPTER_LAST_STEP_ANSWER_LINE` + suffix; band words from `OUTCOME_BAND_WORDS`: triumphed · held · held at a cost · wavered · broke · collapsed). The chapter's stakes line stays at the top of the Stage as on every step | PC-2 | By design, the band word is the step-level answer. The full result line belongs to the chapter's end. The step is named by number, with its band word and the player's own hand, in the same chrome |
| Last step, Aftermath opened in place | Worked example, *Ward Inspection* (`arcane-circle-encounter-content.ts:345-352`, rendered through `buildStakesLine` / `STAKES_RESULT_FORMS`). **Before Play:** "Led here by your hand, Elara must find and mend the weak points in the tower wards — or leave the wards patched and still fragile." **After, in place:** "Elara mended the wards and found one had been tested." (won) · "Elara mended the wards and found one had been tested, at a cost." (success at a cost) · "Elara patched the wards, the third weak point unexplained." (lost) | PC-2 | The result closes the stakes sentence: "mended the wards" answers the goal "mend the weak points", and "patched … unexplained" answers the risk "leave the wards patched and still fragile". The text does not change. It now opens first, and in the same place as the stakes line |
| Live wait ends with no answer | "{Chapter} ended without an answer on screen. Its record is in the Chapter Ledger." / "{Chapter} did not answer in time. Its record is in the Chapter Ledger." (existing toasts, `nudge-stage-content.ts:333-335`) | PC-8 | Says it is over and where the record is; the Chapter Ledger holds the step (Law 55) |

PC-8 is owed a visible reply within one `--anim-fast` of Play (Law 47): the card swaps in at once, and the map never shows. PC-2 is owed the answer on the same surface: D2.

### Playtest signal

No round-7 tester reports a chapter step or chapter ending "with no result" or "dropped back on the map". The ticket's Fixed-when.

### Event notifications

N/A — no new toast; the existing dropped and timeout toasts keep their text.

### Debug inspection (DebugPanel)

U5: `await window.__DEBUG.getChapterAnswer()` reports `answering_live` and `premonitionDeferred`; `await window.__DEBUG.getInterruptState()` lists `EncounterVeilAnswering` under `homedSurfaces`, and leaves it out of `open` while the clock runs.

### Visual presence (HexMapV2)

N/A — the map stays dimmed under the Stage, as during any step.

## Interface impact

| Contract | Change |
|---|---|
| `HOMED_SURFACES` → interrupt registry | add: `EncounterVeilAnswering`, `stopsTime: false` |
| `ChapterAnswerPhase` / `DebugChapterAnswer` | extend: `answering_live` |
| `ChapterAnswerEffect` | extend: `open_answer` |
| Encounter auto-open scan ↔ premonition queue | extend: a pending live answer defers `activePremonition` (no queue write) |

No cross-system engine read or write; `Docs/canon/interface-map.md` needs no row (view-only). `Docs/plans/wiring-checklist.md`: no new module, phase or state field.

## Wiring

| Module | Phase | UI | Trace | Debug |
|---|---|---|---|---|
| `answering_live` | render-time (React effect) | U1, U4 | none (view state; `[chapter-answer]` dev log already logs phase changes) | `await __DEBUG.getChapterAnswer()` |
| `EncounterVeilAnswering` row | render-time registry | U3 | none | `await __DEBUG.getInterruptState()` lists it under `homedSurfaces`; `open` excludes it |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` | `true` (was `false`) | show the live card on a running clock; `false` = today's close |
| `CHAPTER_ANSWER_LIVE_WAITS_LINE` | "The world turns. The answer comes here." | the live card's waiting line |
| `CHAPTER_ANSWER_RUN_MAX_TICKS` | 24 (existing) | bounds the live wait |

## Tracing

N/A — no new trace type. The phase is UI state; the step's own resolution traces are unchanged.

## Fail-soft table

| Failure | Fallback |
|---|---|
| No hold recorded at commit (`null`) | treated as running (today's rule): live card |
| Answer beat cannot open (`handleOpenEncounterFromNotification` declines) | record ends; the beat stays pending, and the scan opens it on its next pass, as today; the thread badge is the recovery route (Law 39) |
| Mortal gone / thread released mid-wait | existing dropped toast; card closes |
| Max ticks reached | existing timeout toast; card closes; the record stays in the Chapter Ledger |
| Player opens a surface of their own during the wait | the card yields as any veil does; the record moves to `waiting` (D4) |

## Blast Radius

N/A — `GameView.tsx`, `useChapterAnswerRun.ts`, `EncounterVeil.tsx`, `nudge-stage-content.ts` and `homed-surfaces.ts` are each well under 100 importers; no `src/types/` change. Not a `review-gate` scope PR unless the UI diff passes 400 lines.

## Kill criteria

If round 7 testers say the Stage "hangs" or blocks the map while they wait, keep the card but lift the map's dimming for the live phase and re-test. If any tester still reports no result, set `CHAPTER_ANSWER_CARD_ON_RUNNING_CLOCK` back and pause the clock on commit instead. That route needs Christian, because it reverses the rulebook §3 no-forced-pause ruling.

## Three-pillar check

- [x] Engine pillar: N/A with rationale (no simulation change)
- [x] Content pillar present (C1–C3)
- [x] UI pillar present (U1–U5)
- [x] Wiring section connects them

## Vision audit

- [x] No premise contradicted. The god's attention stays where they acted; time stays the player's (no forced pause or resume, rulebook §3).
- [x] Vault `Vision/01-core-loop.md` § "Time stops for every moment" is extended, not broken. The step and its answer still stop time. The live card is an interstitial between them, not a reading moment, and it may stop no time only because it stays content-light: the choice line and the waiting line, nothing else. **Binding on the executor:** no prose, cast or stakes are added to the live card. Anything that must be read belongs on the answer beat, which holds the clock.
- [x] `Vision/00-north-star.md` (one story legible before another takes focus) is served by D3.
- [x] No Vision edit needed.

## Rulebook impact

- [x] No rule of play changes. Step timing and resolution are untouched.
- [x] No `Docs/canon/rulebook.md` edit needed.

> Brainstorm companion: `Docs/plans/2026-11-03-thr-2136-the-answer-comes-here-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | one switch, one line, existing bound |
| 2. Inspectability | PASS | phase in `__DEBUG.getChapterAnswer()`; surface in `getInterruptState()` |
| 3. Determinism | PASS | no PRNG; the sim runs the same ticks |
| 4. Fail-soft | PASS | table above |
| 5. Narrative over mechanics | PASS | the story stays on screen between its beats (Law 55) |
| 6. Additive | PASS | a phase, an effect, a row; the paused path untouched |
| 7. Performance | PASS | one extra reducer case per tick while a card is up |

## Done when

- [ ] `useChapterAnswerRun.test.ts` covers `answering_live`: answered with a pending beat → `open_answer`; answered with none → dropped toast; a moveless step keeps the record; 24 ticks → timeout; veil closed → `waiting`.
- [ ] A GameView-level test (the `thr1976AuthoredChoiceAnswers.test.tsx` pattern) commits a hand with the clock running and asserts: `chapter-answering-card` is present with no `chapter-answer-run` button; the registry's `open` list excludes the encounter surface (the clock is not held); after the step answers, the next step's veil renders "Step 1 …" without the veil unmounting in between.
- [ ] A test with a ready premonition and a live answer asserts the Aftermath opens first and the premonition opens after it closes.
- [ ] Browser evidence (four parts): a 1920×1080 screenshot of the live card over a running clock; console clean; `await window.__DEBUG.getChapterAnswer()` returning `state: 'answering_live'` and then, after `window.__DEBUG.tick(8)`, `'none'` with the next step's Stage up; a UI-Laws line for Laws 1, 13/14, 17, 21, 33, 37, 47, 52, 54.
- [ ] `npm run gate` green.

## Coordination block

**Suggested model:** opus. A small state machine with clock-hold interplay across three existing systems (answer run, registry, auto-open scan); the edge cases are where it goes wrong.
**Parallel-safe with:** [The pool says how full it can get](https://linear.app/threadbare/issue/THR-2148) (top bar and Inspector, not the Stage), [Legibility 1](https://linear.app/threadbare/issue/THR-2122) (`Section.tsx`), [The sheet says what grew](https://linear.app/threadbare/issue/THR-2149) (Inspector).
**Mutex with:** [Legibility 3, the Stage and dialogs](https://linear.app/threadbare/issue/THR-2124) (both edit `EncounterVeil.tsx`); [Every card says what it buys](https://linear.app/threadbare/issue/THR-2147) only if it touches `GameView.tsx`'s commit handlers; anything editing `useChapterAnswerRun.ts`, the encounter auto-open scan in `GameView.tsx`, or `homed-surfaces.ts`.

**Files to touch:** `src/components/Game/hooks/useChapterAnswerRun.ts`, `src/components/Game/GameView.tsx`, `src/components/Game/EncounterVeil.tsx`, `src/data/nudge-stage-content.ts`, `src/data/homed-surfaces.ts`, `src/debug-bridge.d.ts`, their tests (`useChapterAnswerRun.test.ts`, `encounterVeilAnsweringCard.test.tsx`, a new GameView-level test).

## Notes for the executor

- The paused-clock path (THR-1812: `answering_card` → *Let the world turn* / *Back to the map*) must behave exactly as today; its tests stay green unchanged.
- `activePremonition` is declared before the chapter-answer hook (`GameView.tsx:1054` vs `:3768`). Lift a small "live answer pending" state above it, or move the memo below; do not read the ref during render.
- The Stage's type and hierarchy belong to Legibility 3; keep the live card on today's tokens.

## Forked-audit verdicts

### NFP audit

PASS-with-notes. Tunability, Determinism, Fail-soft, Narrative and Performance PASS. Notes:
- Inspectability: the premonition deferral had no debug field of its own.
- Additive: C2 changes an existing default and D3 changes the premonition-first order. Both are reversible through the switch.

**Answer:** U5 adds `premonitionDeferred` to the debug record. The order change is the point of D3, and the kill switch covers it.

### Three-pillar audit

Run 1, FAIL. The auditor read the draft before `## Coordination block` and `## Notes for the executor` were written. It also noted that the Engine sentence placed the row under `src/engine/`, and that the UI pillar had no Debug-inspection heading. All of these were fixed.

Run 2, PASS-with-notes. Engine is N/A with a reason; Content and UI are substantive; nothing is missing. Notes taken: the template's subsection headings are compressed into C1–C3 and U1–U5, and the Wiring table has no GameState column. The Engine pillar states that no GameState field is added.

### Vision audit

PASS-with-notes. No contradiction. North star confirmed (D3). Core loop's "Time stops for every moment" extended: the live card stops no time, and it may do so only while it stays content-light. Note: the plan cited no Vision file by path.

**Answer:** § Vision audit now cites `Vision/01-core-loop.md` and `00-north-star.md`, and states the content-light limit as binding on the executor.

### Intent-judge verdict

**Allow** on the third run (impact class Reversible, judge-confirmed; 0 GAPs, 0 VIOLATIONs).
- Run 1, Revise. Dimension 2: the Engine sentence placed the registry row under `src/engine/`. Dimension 12: the Player-facing text table gave no before/after lines and did not quote the toasts. Fixed.
- Run 2, Revise. Dimension 12: the stakes line was described rather than quoted. Fixed with the *Ward Inspection* worked example, checked against `arcane-circle-encounter-content.ts:349-352`.
- Run 3, Allow.
