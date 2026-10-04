> **title:** Show the roll — the whisper is a weight, and the bonding scenes say so — THR-1714
> **linear_issue:** THR-1714
> **author:** Claude Code (tb-design-lane, run 2026-10-03d)
> **created:** 2026-10-03
> **three_pillars:** Engine done · Content done · UI done

# Show the roll — THR-1714

*The bonding dilemmas were all three round-2 testers' best moment, and all three misread what their whisper did; this plan makes the agreed nudge model legible without changing it.*

## Why this is load-bearing

Meet The First is the first interactive surface every player touches, and since THR-868 it teaches the nudge model: the god leans the odds with a hand of cards and fate settles the band. The cold playtest round 2 ([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cold-playtest-round-2.md)) found the model working — every tester named those scenes as the best moment — and the surface hiding it. Three misreadings, one from each tester:

- *"was Perilous"* — the past tense read as **the roll already happened** (skimmer).
- *"Let fate decide"* — the commit button read as **skip and roll randomly** (skimmer).
- *"In 2 of 3 scenes the outcome matched a card I didn't pick"* and *"rolling scene 3 with nothing selected and getting an outcome as good as the ones I'd paid for … the price/odds UI started to feel decorative"* (veteran). The story tester *"never saw whether a choice 'succeeded'"*.

The veteran's one message to the designer: *"Show me the roll: when I pay essence for an option, tell me in one line what my odds were, what the dice did, and which outcome my nudge caused."* That is the ticket's whole ask, minus the numerals (ruling 6 / UI Law 13 keep the surface in words).

If the surface stays as it is, the player concludes their essence is decorative at the exact moment the game is trying to teach that it is not. Every later encounter speaks the same nudge language, so a lesson mis-taught here is mis-taught everywhere.

## Substrate inventory

**Measured, not grepped.** A throwaway vitest census (not committed — its full source is reproduced in the brainstorm companion) ran the real `resolveFormativeTest` / `resolveBondTest` against current `main` (`354e407e`): every converted dilemma in `ENRICHED_DILEMMA_LIBRARY` (**64** with a `test`, all 64 carrying pole-lean cards), 200 seeds each, plus 1,000 seeds of `MEETING_BOND_TEST`.

| Measurement | Result | What it means for this plan |
|---|---|---|
| A hand of every pole-`a` card: fate wrote the **other** pole | **38.5 %** (4,931 of 12,800) | "The outcome matched a card I didn't pick" is the design working about two times in five. The surface must name it, not prevent it. |
| Same hands: bands drawn | success 7,036 · failure 3,596 · critical_success 833 · near_miss 760 · critical_failure 575 · **success_at_cost 0** | The tempered band (`MEETING_TEMPERED_BAND`) is unreachable in the meeting. Reported, not chased (Notes for the executor). |
| A **silent** formative hand drew a good band | **34.9 %** | Silence is a real choice with real odds; the surface must say "you stayed silent", not imply a skip. |
| Bond test, silent hand: good band | **52.7 %** | The veteran's scene 3 (the bond) gives a good result to silence half the time. |
| Bond test, every card played: good band | **88.7 %** | The hand moves the odds a lot; the player just cannot see it after the roll. |

Substrate the plan touches (code read on `354e407e`):

| Existing subsystem | Status | This plan |
|---|---|---|
| Meet The First formative + bond tests (`meetingEncounter.ts`: `resolveFormativeTest` L754–784, `resolveBondTest` L811–838) | 🟢 ACTIVE | **extends** — two additive fields on each outcome (the forecast going in, with and without the hand). No rng draw added. |
| Nudge stage shell (`NudgePhaseShell.tsx`, `NudgeStageHeader.tsx` L198–222, `nudge-stage-content.ts`) | 🟢 ACTIVE | **extends** — the moved-forecast line and the commit label change copy; the card gains one optional presentation field. |
| Meeting stage adapter (`buildMeetingNudgePhaseModel.ts`) | 🟢 ACTIVE | **extends** — fills the new card field from `poleLean`. |
| Canonical value axes (`axisRegistry.ts`, `getAxisByValuePair`) | 🟢 ACTIVE | **reads** — the pole words the agent sheet already shows. No new vocabulary. |
| Meeting traces `meeting.test_resolved` / `meeting.bond_resolved` (`src/types/trace.ts` L4747–4795) | 🟠 **DORMANT** — declared in the union, **zero emitters** (`grep -rn "test_resolved\|bond_resolved" src` hits only the type) | **activates** — emitted for the first time, extended with the forecast tiers and the fate-line key. |
| Authored-choice commit in the veil (`EncounterVeil.tsx` `StageCommit`, L2659–) | 🟢 ACTIVE | **extends** — it shares `NUDGE_COMMIT_LABEL` today and takes the new "with hand" label. |

## Decisions made by delegation

All made by the design lane under process.md rule 4 (2026-09-11) against the agreed nudge model; the ticket's own recommended direction decided most of them. **Veto any one in chat.**

| # | Decision | Decided by |
|---|---|---|
| D1 | **Words, never numbers.** The veteran asked for odds and dice; the surface gives the forecast word and what fate did with the lean, never a percentage or a d100. | Ruling 6 (THR-772/868), UI Law 13, UL *Forecast tier*; the ticket's "no raw number". |
| D2 | The moved-forecast line reads **"your hand: Perilous → Uncertain"** instead of "was Perilous". Present tense; names its cause. | Ticket recommendation; skimmer quote. |
| D3 | The commit button has **two labels**: **"Play your hand, let fate answer"** when any card is staged, **"Stay silent, let fate answer"** when none is. On every nudge stage, not only the meeting. | Ticket recommendation (it suggested "Whisper and let fate answer"; **Whisper** is already a card keyword, so the act is named by the hand instead), widened so silence reads as an act (veteran's scene 3). |
| D4 | **A meeting card that leans says so on its face**: "Leans Brave" — the axis's own sheet word (`getAxisByValuePair(valuePair).virtue.word` / `.vice.word`). | Without it the reveal's "you leaned toward Brave" cannot be traced to the cards played. Sheet words, not new words (memory: chip nouns are sheet words). |
| D5 | **Every meeting reveal opens with one fate line** — two short sentences: what the hand made the odds, then what fate did with the lean. On both formative tests and the bond. | Ticket recommendation; Law 38 (*Fate → Outcome*). |
| D6 | **Silent and odds-only hands are named as such** ("You stayed silent." / "Your hand … leaned nowhere."). | 34.9 % / 52.7 % silent good bands measured above. |
| D7 | **In-world encounters get D2 and D3 only** — no fate line on the in-world aftermath in this ticket. | The 3/3 evidence is the meeting; in-world steps already show per-step outcome colours (Law 37). If round 3 shows the same confusion in-world, that is a follow-up, not scope here. |
| D8 | **The two dormant meeting traces are emitted**, carrying what the fate line said. | NFP #2; the dormant row above. |

**One interpretation recorded for veto:** THR-868's verdict 10 says the meeting teaches *"in-fiction only … no UI callouts, no tooltips"*. The fate line is not a tutorial — it is the narrator stating what happened, in prose type, in the reveal beat, the way the band prose already does. The card's lean tag is a fact about the card, like its cost. Neither explains the system; both report it. If Christian reads either as a callout, the veto is one sentence and the fallback is D5 alone in fully diegetic phrasing.

## Engine pillar

### Systems design

**E1 — Forecast going in, on the outcome.** `resolveFormativeTest` and `resolveBondTest` each compute two forecast tiers with the pure `forecastAction` (`resolutionService.ts`) on the exact `ResolutionInput` `resolveMeetingBand` rolls against — once with `actionModifiers: 0` (the silent forecast) and once with the hand's summed `forecastDelta` (the hand forecast). Both land on the outcome as new optional fields:

```ts
// src/types/meetingEncounter.ts — additive
export interface FormativeOutcome {
  // …existing fields unchanged…
  /** Forecast tier with no cards played (THR-1714). */
  readonly baseForecastTier?: ForecastTier;
  /** Forecast tier with the played hand (THR-1714). Equal to base when silent. */
  readonly handForecastTier?: ForecastTier;
}
export interface BondOutcome {
  // …existing fields unchanged…
  readonly baseForecastTier?: ForecastTier;
  readonly handForecastTier?: ForecastTier;
}
```

To keep one definition of the input (the comment at `meetingEncounter.ts` L660 already insists on it), factor the `ResolutionInput` construction inside `resolveMeetingBand` into a small exported helper `meetingResolutionInput(difficulty, nudgeDelta)` and call it from the band roll, the two forecasts, **and** `buildMeetingNudgePhaseModel` (which builds the same object by hand today). One builder, three readers: the word the player reads before the roll, the word the fate line quotes, and the band rolled cannot drift apart.

**E2 — Fate line selection (pure).** New module `src/engine/meetingFateLine.ts`:

```ts
export type FateAnswer = 'with' | 'half' | 'turned_soft' | 'turned';
export type LeanState = 'leaned' | 'odds_only' | 'silent';

export interface FateLine {
  /** Stable key — `${leanState}.${fateAnswer}`, or `bond.${leanState}.${fateAnswer}`. */
  readonly key: string;
  /** The filled sentence pair the reveal renders. */
  readonly text: string;
}

export function selectFormativeFateLine(o: FormativeOutcome, agentName: string): FateLine;
export function selectBondFateLine(o: BondOutcome, agentName: string): FateLine;
```

- `leanState`: `silent` when `playedNudgeIds` is empty; `odds_only` when cards were played but `netLean === 'none'` (no leaning cards, or a tie); else `leaned`. The bond has no poles, so a bond hand is `leaned` (any card played) or `silent`.
- `fateAnswer`: `FATE_ANSWER_BY_BAND[band]` (constants table).
- Pole words: `getAxisByValuePair(valuePair)` → `virtue.word` for pole `a`, `vice.word` for pole `b` (sign convention: pole `a` is the positive pole, `meetingEncounter.ts` L768). The **leaned** word is `netLean`'s pole; the **written** word is `writtenPole`'s.
- Forecast words: `FORECAST_TIER_WORDS[handForecastTier]` and `[baseForecastTier]`.
- Pure, no rng, no state. The template table lives in content (C1).

**E3 — Emit the two dormant traces.** `MeetingTestResolvedTrace` once per formative test, `MeetingBondResolvedTrace` once per completed meeting. Today `MeetingEncounterResult` does **not** carry the outcomes (it holds the folded profile, reach capabilities and starting quintessence), so:
1. `MeetingEncounterResult` gains optional `formativeOutcomes?: readonly FormativeOutcome[]` and `bondOutcome?: BondOutcome`, set by the existing fold (`meetingEncounter.ts` L840–, the function that turns outcomes into a result).
2. `createAgentFromMeeting(graph, result, ascendantId, tick)` (L917 — called from `src/components/Game/meetingBond.ts` `bondFirstFromMeeting`) emits the traces through the engine's `emitTrace` (`traceBuffer.ts`, the import `encounterAftermath.ts` uses), with `actorId` = the new agent id and the fate-line keys recomputed by the pure selector. Engine-side, so the React beats stay trace-free.
Absent outcome arrays (an old in-flight meeting) emit nothing. Each trace gains the fields in § Tracing.

### Graph nodes / edges

None. Outcomes are transient meeting state until the existing fold writes the agent; nothing new is persisted on the graph.

### Tick phases

None. The meeting runs before the tick loop owns the First; resolution happens on a player click.

### Resolution logic

Unchanged. The band roll, the pole write, the riders and the shift table are untouched. The fate line *reads* the result; it never feeds back into it.

### PRNG callouts

**No new draws.** `forecastAction` is pure. `resolveFormativeTest`'s stream (`createSeededRng(seed, 'meeting_test_${i}')`) and `resolveBondTest`'s (`'meeting_bond'`) keep their draw order exactly, because the forecasts are computed **without** touching `rng`. A unit test pins it: same seed + same hand → identical `band` / `writtenPole` before and after this change, over all 64 converted tests.

## Content pillar

### Encounter templates

None changed. The 64 converted dilemmas and the bond test keep every authored card, delta and band prose. The lean tag (D4) reads the existing `poleLean` field.

### Prose tables

**C1 — The fate-line table.** In `src/data/meeting-narrative-prose.ts` (beside `MEETING_FATE_REVEAL_CONTINUE`), two tables of plain-register sentences — game prose, GM narration, second person only for the god's own act (Law 42):

The **forecast clause**, by lean state (`{hand}` / `{base}` are forecast words):

| `leanState` | Clause |
|---|---|
| `leaned` | `Your hand made it {hand}.` |
| `odds_only` | `Your hand made it {hand}, but leaned nowhere.` |
| `silent` | `You stayed silent. It stood {base}.` |

The **fate clause**, formative (`{name}`, `{leaned}`, `{other}`, `{written}` are the candidate's name and pole words):

| | `with` | `half` | `turned_soft` | `turned` |
|---|---|---|---|---|
| `leaned` | `Fate went with you: {name} came out {leaned}.` | `Fate met you halfway: {name} leans {leaned}, not all the way.` | `Fate turned it, barely: {name} edged toward {other}.` | `Fate turned against you: {name} came out {other}.` |
| `odds_only` / `silent` | `Fate chose alone, and well: {name} came out {written}.` | `Fate chose alone: {name} leans {written}, not all the way.` | `Fate chose alone: {name} edged toward {written}.` | `Fate chose alone, and hard: {name} came out {written}.` |

The **fate clause**, bond (no poles):

| | `with` | `half` | `turned_soft` | `turned` |
|---|---|---|---|---|
| `leaned` | `Fate went with you.` | `Fate met you halfway.` | `Fate turned it, barely.` | `Fate turned against you.` |
| `silent` | `Fate answered alone, and kindly.` | `Fate answered alone, halfway.` | `Fate answered alone, coolly.` | `Fate answered alone, and hard.` |

Worked examples (seeded First "Kael", iron axis, words Brave / Power-Hungry):
- *"Your hand made it Favorable. Fate turned against you: Kael came out Power-Hungry."* — the veteran's "outcome matched a card I didn't pick", now said.
- *"You stayed silent. It stood Uncertain. Fate answered alone, and kindly."* — the veteran's scene 3, now said.

The `half` column is authored though currently unreachable (census: 0 `success_at_cost`), so the table stays total over `StepOutcome` and needs no edit if the tempered band is ever reached.

**C2 — Lean tag copy.** `NUDGE_LEAN_TAG = 'Leans {word}'` in `nudge-stage-content.ts`. ≤3 words; the word is a sheet word, so it already carries a tooltip through the trait/axis registry where one exists (Law 17).

**C3 — Commit labels and the moved-forecast line** in `nudge-stage-content.ts`:

| Constant | Copy |
|---|---|
| `NUDGE_COMMIT_LABEL` (kept, now = the with-hand label) | `Play your hand, let fate answer` |
| `NUDGE_COMMIT_LABEL_SILENT` (new) | `Stay silent, let fate answer` |
| `NUDGE_FORECAST_SHIFT_LINE` (new) | `your hand: {from} → {to}` |

`ui.nudge_objective` (`ui-content.ts` L320) says *"When you let fate decide"* — reword to *"When you hand the moment to fate"* so the tooltip does not quote a retired button. No other tooltip changes; `ui.nudge_forecast` already says the forecast is pre-roll and never a promise.

**UL.** No new player-facing term. "Fate line" is a code name for the reveal sentence, never shown; *Forecast tier*, *Dealt Hand* ("your hand") and the axis words are existing vocabulary. The ticket suggested the verb **Whisper** for the commit; it is not used, because **Whisper** is already a nudge-card keyword (`nudge-card-library.ts` L152, tooltip label in `ui-content.ts` L116) and a commit button wearing a card keyword would read as that card. The UL *Forecast tier* entry's "a `favorable` forecast that resolves `failure` is an ordinary event" is now something the player is told.

### Attachment content

None.

### Data tables

The constants in § Constants table. No world-model change.

## UI pillar

*Screenshot tool: Playwright (DOM surfaces — the meeting is DOM over a static ComicPanel image; no WebGL).*

### Player-facing display

**U1 — Moved-forecast line** (`NudgeStageHeader.tsx` L208–221): renders `NUDGE_FORECAST_SHIFT_LINE` with `{from}` = base word, `{to}` = current word, in the same slot, size and italic whisper tone, still inline beside the die (the no-layout-jump comment there stays true). Still shown only when the forecast moved.

**U2 — Two-state commit** (`NudgePhaseShell.tsx` L425–429): `hand.selectedIds.length > 0 ? NUDGE_COMMIT_LABEL : NUDGE_COMMIT_LABEL_SILENT`. The empty-hand state (`NUDGE_EMPTY_HAND_LINE`) shows the silent label. `EncounterVeil.tsx` `StageCommit` (authored-choice path) shows `NUDGE_COMMIT_LABEL` — choosing an option is playing your hand. The two-beat pattern of Law 48 is unchanged: stage, then commit.

**U3 — Lean tag on the card**: `EncounterStageNudgeCardModel` gains `leanLabel?: string`. `buildMeetingNudgePhaseModel` fills it from `poleLean` + the test's `valuePair` (fail-soft: no axis → no tag). The card renders it as one small line under `effectLine`, neutral warm text, never coloured as polarity (a lean is not good or bad — Law 31). In-world cards leave it unset and render exactly as today.

**U4 — Fate line on the reveal**: `FormativeTestBeat.tsx` (reveal block, L223–) and `BondBeat.tsx` (`stage === 'reveal'`, L167–) render the selected line **above** the band prose, in prose type, the god-voice line's gold-italic style (the existing `rgba(212,168,122,0.7)` token there — move it to a `--veil-*` token if the executor touches the colour, Law 30). `data-testid="formative-fate-line"` / `"bond-fate-line"` with `data-fate-key`. Selection happens in the beat from the outcome object; no state is added.

### Event notifications

None. The meeting is already its own full-screen beat.

### Debug inspection (DebugPanel)

`await window.__DEBUG.getMeetingState()` (exists and is async — `debug-bridge.ts` L2724, reading `meetingDebugState.ts`) adds, per resolved test, `{ baseForecastTier, handForecastTier, fateLineKey }`. The two traces become visible in the trace viewer for the first time.

### Visual presence (HexMapV2)

N/A — the meeting is a full-screen beat before the map is in play; nothing changes on the hex map.

### UI Laws engaged

**1** (the lean tag's word is a sheet word with its existing tooltip), **13/14** (forecast and pole words only; no numeral, no raw key — `getAxisByValuePair` miss falls back, never prints `mercy_ruthlessness`), **16** (the fate line is a sentence, not a label strip), **17** (no inline concept copy: the words come from the registries), **21** (N/A in the meeting — the candidate is not yet a graph entity), **31** (the lean tag is neutral, not polarity-coloured), **33** (one line above the prose inside the existing scroll column; the meeting's 78vh column absorbs it, nothing below the fold), **37/38** (the beat order Fate → Outcome is kept and made explicit), **42** (plain register; "you" only for the god's own act), **43** (every `{token}` filled; a test pins no `{` reaches the DOM), **47** (the commit label changes the instant a card is staged), **48** (two-beat commit unchanged). No exception is needed.

## Interface impact

| Contract | Disposition |
|---|---|
| Meeting forecast = meeting roll (one `ResolutionInput`, `meeting-nudge-constants.ts` header) | **preserve + strengthen** — one builder (E1) instead of two hand-built copies |
| `FormativeOutcome` / `BondOutcome` → beats → `MeetingEncounterResult` fold | **extend** — two optional fields, read by the fate line (U4) and the traces (E3) |
| `meeting.test_resolved` / `meeting.bond_resolved` traces | **add a writer** — the read side is the trace viewer and `getMeetingState()` |
| `NUDGE_COMMIT_LABEL` shared by nudge shell + veil `StageCommit` | **preserve** the sharing; add the silent sibling |

None of these is a row in `Docs/canon/interface-map.md` today (grep: no `meeting` contract). The executor adds none unless `npm run generate-interface-map` asks for one.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|--------|-------------------|-------------|-----------------|---------------|-----------------|
| `meetingResolutionInput` (new helper, `meetingEncounter.ts`) | none (player click) | `buildMeetingNudgePhaseModel` | — | — | — |
| `resolveFormativeTest` / `resolveBondTest` (+ forecast fields) | none | `FormativeTestBeat`, `BondBeat` | outcome objects (transient) | via E3 | `getMeetingState()` |
| `meetingFateLine.ts` (new) | none | `FormativeTestBeat`, `BondBeat` | — | key recorded in E3 | `getMeetingState().fateLineKey` |
| Meeting fold (`createAgentFromMeeting` site) | none (meeting end) | — | agent node (existing) | `meeting.test_resolved` ×N, `meeting.bond_resolved` ×1 | trace viewer |
| `NudgeStageHeader`, `NudgePhaseShell`, `EncounterVeil.StageCommit` | none | themselves | — | — | DOM testids |

Prose pipeline: the fate line fills its own `{name}` / word tokens; it does not pass through `enrichProse()` because it carries no world placeholders. Player control: the commit button (existing).

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `FATE_ANSWER_BY_BAND` | `critical_success, success → 'with'` · `success_at_cost → 'half'` · `near_miss → 'turned_soft'` · `failure, critical_failure → 'turned'` | Which fate clause each band reads as. Total over `StepOutcome`; changing how a band *reads* is one row. |
| `MEETING_FATE_LINE_FORECAST_CLAUSES` | § C1 table 1 | Forecast clause per lean state |
| `MEETING_FATE_LINE_FORMATIVE_CLAUSES` | § C1 table 2 | Fate clause, formative |
| `MEETING_FATE_LINE_BOND_CLAUSES` | § C1 table 3 | Fate clause, bond |
| `NUDGE_COMMIT_LABEL` | `Play your hand, let fate answer` | Commit with a staged hand / chosen option |
| `NUDGE_COMMIT_LABEL_SILENT` | `Stay silent, let fate answer` | Commit with nothing staged |
| `NUDGE_FORECAST_SHIFT_LINE` | `your hand: {from} → {to}` | The moved-forecast line |
| `NUDGE_LEAN_TAG` | `Leans {word}` | A leaning card's face line |
| `MEETING_FATE_LINE_FALLBACK_POLE_WORDS` | split the `ValuePair` key on `_` | Pole words when `getAxisByValuePair` misses (`courage_prudence` has no reach axis) |

## Tracing

The two existing interfaces (`src/types/trace.ts` L4759, L4789) gain additive fields and get their first emitter:

```ts
export interface MeetingTestResolvedTrace extends TraceBase {
  category: 'meeting.test_resolved';
  // …existing fields unchanged…
  /** Forecast with no cards (THR-1714). */
  baseForecastTier: ForecastTier;
  /** Forecast with the played hand (THR-1714). */
  handForecastTier: ForecastTier;
  /** Which fate line the player read — `${leanState}.${fateAnswer}`. */
  fateLineKey: string;
}

export interface MeetingBondResolvedTrace extends TraceBase {
  category: 'meeting.bond_resolved';
  // …existing fields unchanged…
  baseForecastTier: ForecastTier;
  handForecastTier: ForecastTier;
  fateLineKey: string;
}
```

Volume: at most `MEETING_TEST_COUNT_TOTAL` (3) entries per game — the existing doc comment's "one entry per resolution" rule holds. The diagnostic the old comment named (`netLean` vs `writtenPole`) becomes readable next to what the player was told.

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `getAxisByValuePair` returns undefined | Pole words from `MEETING_FATE_LINE_FALLBACK_POLE_WORDS` (split the key); the lean tag uses the same words. Never the raw key. |
| An outcome from an old in-flight meeting lacks the forecast fields | The fate line drops its forecast clause and renders the fate clause alone; the trace records `handForecastTier` = `baseForecastTier` = `'uncertain'` and the key with a `.noforecast` suffix. |
| `band` outside the table | `FATE_ANSWER_BY_BAND` is total over `StepOutcome`; a non-member reads as `'with'`/`'turned'` by `MEETING_POLE_SHIFT_BY_BAND` sign and warns once. |
| Agent name empty | `DERIVED_FACTOR_ACTOR_FALLBACK` (`'The acting hand'`) — the shared stand-in. |
| Trace buffer absent at the fold | Skip emission; resolution and the agent write are unaffected (tracing is never on the critical path). |
| A `{token}` survives filling | Unit test fails the build (Law 43); at runtime the line is suppressed rather than rendered with a brace. |

## Blast Radius

`src/types/trace.ts` is a ≥100-importer file (codesight top tier). The change is two **additive** fields on two existing union members and a new emitter — no union member added or removed, no field renamed — so no importer changes shape. `src/types/meetingEncounter.ts` gains optional fields only. Nothing else in scope is high-impact.

| File | Importer count | Cascade-risk note |
|------|---------------|-------------------|
| `src/types/trace.ts` | hundreds (`.codesight/graph.md`) | Additive fields on existing members; `tsc -b` net-new diff must be zero outside the touched files. |

## Three-pillar check

- [x] Engine pillar present — E1 forecast fields, E2 fate-line selector, E3 trace activation
- [x] Content pillar present — C1 fate-line tables, C2 lean tag, C3 labels + one tooltip reword
- [x] UI pillar present — U1–U4
- [x] Wiring section connects them

## Vision audit

- [x] This plan does not contradict any Vision premise — it serves the core one the meeting was converted to teach: *the god acts in physics; fate decides.* Fate still decides; the player is now told that it did.
- [x] The one interpretive call (verdict 10, *no UI callouts* in the meeting) is recorded above with its fallback.

## Rulebook impact

- [x] This plan does not change a rule of play. Nudge odds, the band ladder, pole writes and costs are untouched. `Docs/canon/rulebook.md` names no commit-button copy (grep: no hit for "Let fate decide"), so no edit is owed.
- [x] No `Docs/canon/rulebook.md` update is owed in this PR.

> Brainstorm companion: `Docs/plans/2026-10-03-thr-1714-show-the-roll-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every word and the band→answer mapping are named constants; no number is introduced. |
| 2. Inspectability | PASS | Activates two dormant traces with the forecast and the line the player read. |
| 3. Determinism | PASS | No new draws; a test pins identical bands/poles per seed before and after. |
| 4. Fail-soft | PASS | See table — a missing axis, field or name degrades the line, never the resolution. |
| 5. Narrative over mechanical perfection | PASS | The line is narration of what happened, not a readout; numbers stay hidden. |
| 6. Additive over destructive | PASS | Optional fields, new constants, one new module; `NUDGE_COMMIT_LABEL` keeps its name. |
| 7. Performance budget | N/A | Three pure `forecastAction` calls per test, on a click, once per game. |

## Done when

- [ ] In the meeting (`?view=game&firstunmet&size=medium`), each of the two formative reveals and the bond reveal opens with a fate line whose forecast word equals the word the header showed at commit, and whose pole word matches `revealed.writtenPole` (and `netLean` where it says "with you").
- [ ] A leaning meeting card shows `Leans <word>`; a non-leaning card shows no tag.
- [ ] The commit reads `Stay silent, let fate answer` with nothing staged and `Play your hand, let fate answer` after staging one card, on both a meeting test and an in-world nudge stage (`?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge`).
- [ ] The moved-forecast line reads `your hand: <base> → <current>`; no `was ` string remains in the header.
- [ ] Unit: `meetingFateLine` covers every (`leanState` × `fateAnswer`) cell for formative and bond, fills every token, and resolves pole words for all 9 `ValuePair`s (fallback for `courage_prudence`).
- [ ] Unit: over all 64 converted tests × 20 seeds, `band` and `writtenPole` are identical to the pre-change resolver (determinism pin).
- [ ] `meeting.test_resolved` ×2 and `meeting.bond_resolved` ×1 appear after one full meeting (`window.__DEBUG.enableTracing()` first), each with `fateLineKey`.
- [ ] `npm run gate` green; `tsc -b` net-new diff zero outside touched files.
- [ ] Browser-verify: 1920×1080 Playwright screenshots of a formative reveal, the bond reveal and the in-world commit; console clean; `await window.__DEBUG.getMeetingState()` assertion; UI-Laws line citing 1, 13/14, 16, 17, 31, 33, 38, 42, 43, 47, 48.
- [ ] Closing commit body carries the close keyword line for this issue.
- [ ] **Round 3** (the ticket's own Fixed-when, judged by the cold-playtest lane, not by the executor): a tester can explain why an outcome differed from the card they paid for.

## Kill criteria / how we would know this is wrong

- Round 3 testers still describe the essence they spent in the meeting as decorative, or still read the result as "the card I didn't pick" without the word "fate" or "odds" in their account → the line is not being read; next step is placement or weight, not more words.
- A tester reads the lean tag as a promise ("I picked Brave, so it will be Brave") → the tag is teaching determinism; drop D4, keep the line.
- Christian vetoes the verdict-10 interpretation → ship D5 in fully diegetic phrasing (the fallback recorded above).

## Coordination block

**Suggested model:** sonnet — a contained, well-specified change across one engine module, one data file and four components; no tuning judgement left open. (Advisory; the automation runs Opus regardless.)

**Parallel-safe with:** [THR-1720](https://linear.app/threadbare/issue/THR-1720) (unaffordable encounter choice — the Intervene charge path in `resolveInterveneChoice.ts`/`nudgeCommit.ts`, not the commit button's label; if its fix touches `StageCommit`, take the mutex instead); [THR-1626](https://linear.app/threadbare/issue/THR-1626) (reward draws — disjoint engine files).

**Mutex with:**
- [THR-1713](https://linear.app/threadbare/issue/THR-1713) — both edit `NudgeStageHeader.tsx` and `nudge-stage-content.ts`; THR-1713's "was Perilous" item is decided here (D2), so its plan must cite this one rather than re-decide it.
- [THR-1715](https://linear.app/threadbare/issue/THR-1715) — both edit `src/engine/meetingEncounter.ts` (it changes `createAgentFromMeeting`'s attention mode; this plan emits traces at the same fold).

**Files to touch:**
- Create: `src/engine/meetingFateLine.ts` (+ `src/engine/__tests__/meetingFateLine.test.ts`)
- Edit: `src/engine/meetingEncounter.ts` (helper, forecast fields, trace emission at the fold)
- Edit: `src/types/meetingEncounter.ts` (optional forecast fields; optional outcome arrays on `MeetingEncounterResult`)
- Edit: `src/types/trace.ts` (additive trace fields)
- Edit: `src/data/meeting-narrative-prose.ts` (fate-line tables)
- Edit: `src/data/nudge-stage-content.ts` (labels, shift line, lean tag, `FATE_ANSWER_BY_BAND` may live in the fate-line data file instead)
- Edit: `src/data/ui-content.ts` (`ui.nudge_objective` reword)
- Edit: `src/components/MeetTheFirst/buildMeetingNudgePhaseModel.ts` (shared input helper, `leanLabel`)
- Edit: `src/components/MeetTheFirst/FormativeTestBeat.tsx`, `BondBeat.tsx` (fate line)
- Edit: `src/components/MeetTheFirst/meetingDebugState.ts` (debug fields)
- Edit: `src/components/Game/encounter-stage/types.ts` (`leanLabel?`)
- Edit: `src/components/Game/encounter-stage/shells/NudgePhaseShell.tsx` (two-state label, lean tag render)
- Edit: `src/components/Game/encounter-stage/shells/NudgeStageHeader.tsx` (shift line)
- Edit tests that assert the old strings: `nudgeStageFateAlone.test.tsx`, `EncounterVeil.test.tsx`, `encounterVeilNudgeHeaderMerge.test.tsx`, `wanderingHealerAftermathProgression.test.ts` (grep `Let fate decide` / `nudge-forecast-moved`).

## Notes for the executor

- **Do not change the roll.** No delta, band, rider or shift moves. If a test of yours needs a different outcome, pin the seed, never the table.
- **Compute forecasts without `rng`.** Calling anything that draws before `resolveMeetingBand` shifts every seeded meeting; the determinism pin will catch it.
- **The tempered band is unreachable in the meeting today** (census: 0 of 12,800 `success_at_cost`; `resolveAction` in `'encounter'` mode does not produce it at these inputs). Do not try to fix it here — the `half` row is authored so the table stays total. It is a separate question for whoever next tunes the meeting (`MEETING_TEMPERED_BAND` reads as dead code).
- `Docs/design-system/laws.md` Law 48 quotes `"Let fate decide"` as its example; update the example string to the new label in the same PR (an example, not a rule change).
- Comments quoting "Let fate decide" in `EncounterVeil.tsx` L359, `GameView.tsx` L1468, `ActionDrawer.tsx` L6 and the `interface-contracts.ts` evidence prose are history; update the live-code comments, leave recorded evidence strings alone.
- The candidate's gender is not known to the line, which is why every clause names `{name}` and never a pronoun.

## Intent-judge verdict

**Pass 1 (2026-10-03, fable, cold context): Allow** — 10 PASS, 1 GAP. The GAP (dimension 6, UL): the plan called *Whisper* existing vocabulary, but the glossary has no such entry, and **Whisper** is already a nudge-card keyword (`nudge-card-library.ts` L152). Applied the same pass: the commit label no longer uses the word ("Play your hand, let fate answer"), and the UL paragraph and D3 say why. With the term gone, no UL-proposal is owed.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-10-03 (sonnet auditors, run after the Whisper fix)*

### NFP audit

PASS-with-notes. NFPs 1–5 PASS; 6 PASS-with-note (`NUDGE_COMMIT_LABEL` keeps its name but its copy changes, the meeting input builder is refactored into one helper, and `ui.nudge_objective` is reworded — all deliberate and listed); 7 N/A (three pure forecast calls per test, on a click, once per game).

### Three-pillar audit

PASS. Engine (E1–E3), Content (C1–C3) and UI (U1–U4) are present and substantive; the Wiring table connects each module to phase, component, state, trace and debug surface; the Substrate inventory extends the active meeting and nudge-stage modules and activates the two dormant traces rather than rebuilding anything.

### Vision audit

PASS-with-notes. No contradictions. Confirms non-negotiables #1 (the god bends the odds, fate picks), #2 and #3 (prose, never numbers), and extends design tension #4 (*mechanical legibility vs narrative mystery*, which already says intervention costs need more legibility). Notes: watch tension #4's drift signal (players talking optimal strategy) after the forecast-word and lean-tag changes; the THR-868 verdict-10 interpretation is a soft risk to the taste profile's show-don't-tell preference, carried with its veto path above.
