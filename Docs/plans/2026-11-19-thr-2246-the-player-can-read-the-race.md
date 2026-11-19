> **title:** The player can read the race — which clock is ahead, how the age ends at this pace, and the one move that would change it (THR-2246)
> **linear_issue:** THR-2246
> **author:** Claude Code (design lane, run dl-20261119-1036)
> **created:** 2026-11-19
> **three_pillars:** Engine done (one Mandate-state field, a pure projection, a lever pick, one alert) · Content done (four forecast lines, two lever lines, one tooltip, one recap line) · UI done (Mandate row, Mandate block, Mandate dialog, Doom dialog, warm recap)

# The player can read the race (THR-2246)

*Two bars sit on screen all game and nothing says which one ends the age. This plan adds one sentence
that says how the age ends at the current pace, one line that names the move that would change it most,
and an alert when the forecast turns.*

## Why this is load-bearing

Ticket 2 of the direction "make the ending a game" (Christian, chat, 2026-11-18: *"assess what can push
the game forward then prepare enough for design and dev that our routines run again"*). In warm round 4
([report](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/warm-playtest-round-4.md))
all three testers listed Doom under "never understood". The story tester asked *"Should I be doing
something about the doom? Nothing tells me."* A player who cannot see that the Unmaking is coming first
cannot decide to change course. Ticket 1 ([a well-played age can be won](https://linear.app/threadbare/issue/THR-2245),
plan `Docs/plans/2026-11-19-thr-2245-a-well-played-age-can-be-won.md`) makes the race winnable. This
ticket makes it readable. Law 32 holds: the sentence says which clock ends the age, never that the
player is winning or losing.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| **Mandate** (`systems-inventory.md:40`): progress and ledger window (`phaseMandate.ts`, `mandateLedger.ts`) | 🟢 ACTIVE | **extends**: one optional field sampled in the same phase |
| **Doom Clock & Journey** (`systems-inventory.md:39`): `doomClock.ts`, `phaseDoom.ts` | 🟢 ACTIVE | **reads** progress and `wokeAtTick` only |
| Encounter forecasts `plannerForecast.ts`, `scaledForecast.ts` (`systems-inventory.md:400,431`) | 🟢 ACTIVE | **not reused**: they forecast a step's odds, not a clock. No race or pace projection exists anywhere, so the plan builds no parallel system |
| Mandate checkpoint alerts (`phaseMandate.ts:432`) | 🟢 ACTIVE | **reuses** the event shape; rewords "on pace" |
| THR-2240 Stay answer (`doomStayNotice.ts`, `DoomStayAnswer`) | 🟢 ACTIVE | **reused** as the Stay lever |
| Warm recap (`warmRecap.ts`) | 🟢 ACTIVE | **extends**: one line kind |

Measured on `origin/main` @ `ad024eb9`:

- **Mandate progress:** `MandateState.progress`, 0–1 (`src/types/mandate.ts:108`), written each tick by
  `phaseMandate`: `const progress = clamp01((clamp01(primaryRatio) + clamp01(secondaryRatio)) / 2);`
  (`src/engine/phaseMandate.ts:369`). The only rate-like data is `recentLedgerMoves` / `recentLedgerDelta`
  over `MANDATE_TREND_WINDOW_TICKS = 36` (`game-config.ts:188`). It is in ledger **points**, not progress,
  and three days is too short to project from, because chapter deeds arrive in bursts.
- **Doom:** `doomClock.progress`, `currentTick`, `totalTicks`, `tickModifier`, `lastStep`
  (`src/types/doomClock.ts:72-109`). `advanceDoomClock` steps by `tickModifier × rateMultiplier`, floored at
  0.1 (`doomClock.ts:746-772`). `DEFAULT_DOOM_TICKS = 1080` and `DOOM_MIN_RUN_TICKS_AFTER_BOND = 720`
  (`game-config.ts:37,78`). An expired clock holds until that floor (`orchestrator.ts:3037`).
- **No projection exists.** A search for `ticksUntil|eta|forecast|projected|pace|ticksLeft` in `src/`
  finds only `DoomClockDetail`'s "Remaining" row (`totalTicks - currentTick`, rate ignored), the checkpoint
  message "Your mandate stays on pace." (`phaseMandate.ts:439`), and the unrelated encounter `forecastTier`.
- **Surfaces:** the folded god-rail row reads `'Goal · {trend}'` (`frame-content.ts:135`, `godRail.ts:277`).
  `MandateBlock.tsx` shows a flavour line, the fill line, the bar and the trend word, and the whole block is
  one `role="button"` opening `MandateDetail`. `DoomClockDetail.tsx` hosts THR-2240's `DoomStayAnswer`. The
  warm recap (`src/engine/views/warmRecap.ts`) has a Doom line and no Mandate line. The top bar is one row of
  `--topbar-height` with no vertical room (`GameViewTopBar.tsx:464`). The god rail's hand keeps
  `GOD_RAIL_HAND_MIN_ROWS = 3` and folded rows give way first (`frame/handFit.ts`).
- **Lever evidence:** in THR-2245's census, chapters-only reaches Mandate 0.82–0.96 by tick 800 against
  hands-off's 0.06–0.12. Holding Stay all age slows Doom by at most about 0.12 of the clock (THR-2245 plan,
  decision 5). Chapters move the race most.

## Decisions (made by the design lane under delegation, 2026-11-19 — veto in chat)

1. **The forecast reads two paces over fifteen days.** Once a day the engine samples Mandate and Doom
   progress, and keeps fifteen samples. Pace = change ÷ ticks across the window. Projected end of each clock
   = now + remaining ÷ pace. Doom's end is pushed to the post-bond floor (`doomFloorMetAtTick`) when it
   would fall earlier. Not
   used: `lastStep` alone (blind to nudge jumps) and the 36-tick ledger window (bursty, and in points).
2. **Four states, plus a hidden one.** `mandate_first`, `doom_first`, `close` (ends within
   `RACE_CLOSE_SHARE` of the time left to Doom), `stalled` (the Mandate did not rise across the window
   **and** the trend word is not Rising, so the rail never says "Rising" beside "has not risen lately").
   A Mandate pace at or below `RACE_STALL_EPSILON` gets no end tick (`mandateEndTick: null`, no division).
   With a Rising trend it reads `doom_first`; otherwise it reads `stalled`.
   `hidden` covers Doom below the Signs stage (`RACE_SHOW_FROM_DOOM`), fewer than five samples, or no
   Mandate. So no player is told on day one how the age ends.
3. **The forecast turns only after it holds.** A new state replaces the shown one after it has been the
   computed state for `RACE_TURN_HOLD_TICKS` (two days) in a row, so the line does not flap.
   **First sight is not a turn.** The first move from `hidden` to a shown state, once per age (`raceWatch.seen`),
   emits its own first-sight alert and the trace with `from: 'hidden'`, and the census does not count it as a
   turn. A later fall back to `hidden` is a data gap (Mandate gone, non-finite sample). The surfaces fall back
   to today's text without an alert, and the return from that gap is silent too.
4. **The lever is the chapter, then Stay.** In `doom_first`, `close` or `stalled`: if a mortal is bound to
   the Mandate, the lever names the Mandate sphere furthest from its target and that mortal (the First
   first). With no bound mortal, it is Stay the Unmaking, if unlocked and not held. Otherwise there is no
   lever line. `mandate_first` shows no lever. Places are not a lever yet: until
   [a place you tend fills the Mandate](https://linear.app/threadbare/issue/THR-2249) ships, a place cast
   credits the Mandate weakly (THR-2245 finding 3), and naming it would be a weak promise (Law 56's spirit).
   Ticket 4 below adds the place entry after it.
5. **Where it lives — no height added anywhere.** The folded rail row trades its trend word for the race
   word. The opened Mandate block shows the forecast in the flavour line's slot, and the flavour moves to
   `MandateDetail`. The lever lives in the dialogs (`MandateDetail`, and `DoomClockDetail` when the lever is
   the chapter, since Stay is already THR-2240's answer there), because the block is one button and a link
   inside a button is a nested control. The top bar is untouched.
6. **The turn is an alert, not a stop.** A turn emits one `mandate_progress` event on the existing `alert`
   channel (no pause, Law 39), plus a recap line when it turned while the player was away. The checkpoint's
   "Your mandate stays on pace." is replaced by the forecast sentence, so the game never says "on pace"
   while the forecast says Doom comes first (PC-6).

## Engine pillar

- **New `src/engine/raceForecast.ts`** (pure, no graph writes), with
  `type RaceState = 'hidden' | 'mandate_first' | 'doom_first' | 'close' | 'stalled'`:
  - `sampleRace(watch, tick, mandateProgress, doomProgress): RaceWatch` takes one sample every
    `RACE_SAMPLE_EVERY_TICKS` and keeps `RACE_WINDOW_SAMPLES`.
  - `projectRace(watch, doomClock, tick): RaceProjection` returns
    `{ state, mandateEndTick | null, doomEndTick }`. The post-bond floor comes from the existing
    `doomFloorMetAtTick(doomClock)` (`doomClock.ts:716`, `woke + DOOM_MIN_RUN_TICKS_AFTER_BOND`). `null` (the
    clock still asleep) → `hidden`.
  - `settleRace(watch, computed, tick): { watch; turned: RaceState | null }` applies the hold.
  - `raceLever(state, graph): RaceLever | null` returns `{ kind: 'chapter'; sphere; mortalId }` or
    `{ kind: 'stay' }`. It reads `mandateDeedSpheres` (`mandateLedger.ts:294`), the bound mortals
    (`godSheet.ts:466`) and the Stay state through `doomStayNotice` (`views/doomStayNotice.ts`).
- **One field:** `MandateState.raceWatch?: { samples: Array<{ tick; mandate; doom }>; shown: RaceState;
  seen: boolean; pending?: { state: RaceState; since: number } }` in `src/types/mandate.ts`. It is optional; absent reads as
  `hidden`.
- **Phase:** `phaseMandate` calls sample → project → settle after `progress` is computed (`:369`), and writes
  `raceWatch`. On a turn it pushes one `mandate_progress` event with `notification: { channel: 'alert',
  icon: 'mandate' }` (same shape as `:432-447`) and emits the trace below. The checkpoint "held" message
  appends the forecast sentence when the race is shown, in place of "Your mandate stays on pace."
- **Views:** `selectMandateRow` (`godSheet.ts:491`) gains `race: { state; sentence; word } | null`, and
  `mandateSummary` (`godRail.ts:277`) reads `race.word` when shown. `warmRecap` snapshots `race` and adds a
  `race` line kind (after `doom` in `WARM_RECAP_KEEP_ORDER`).
- **PRNG:** none. **Graph:** no node or edge.

## Content pillar

All words live in `src/data/race-content.ts` (new), beside their thresholds. Every sentence is 15 words or
fewer and uses sheet words: "Mandate" (the block, the dialog and the `ui.mandate` hover; the folded rail
row's label is "Goal", a pairing that already exists) and "Doom" (the top bar). The word "race" names the
module and its hover id only. No player sentence says it.

### Player-facing text

| Surface | Exact text | Complaint class | How the player understands it |
|---|---|---|---|
| Forecast, `mandate_first` | "At this pace, your Mandate is fulfilled before Doom ends the age." | PC-7 | Plain words. "Mandate" and "Doom" carry `ui.mandate` / `ui.doom_bar` hovers (Law 17) |
| Forecast, `doom_first` | "At this pace, Doom ends the age before your Mandate is fulfilled." | PC-7, PC-9 | Same. **Next step, first sight:** in the Mandate block the fill line stays right under the forecast and already names the move ("Rises when you spend Order essence on Kael Thornweaver's chapters, or on places.", THR-2236). The block opens `MandateDetail`, where the lever line names the one move. The rail row carries no lever; clicking it opens the block |
| Forecast, `close` | "At this pace, your Mandate and Doom finish close together." | PC-7 | Same |
| Forecast, `stalled` | "Your Mandate has not risen lately. At this pace, Doom ends the age first." | PC-8 | "lately" is the fifteen-day window, said in the new `ui.race` hover |
| Folded rail row | "Goal · Lands first" / "Goal · Doom lands first" / "Goal · Close finish" (`stalled` reads "Doom lands first") | PC-6 | Words about who *finishes* first, not who is fuller (see PC-6 below). The hidden state keeps today's "Goal · {trend}" |
| Lever, chapter (rendered; same words in `MandateDetail` and `DoomClockDetail`) | "Spend Order essence on Kael Thornweaver's chapters to raise your Mandate." | PC-9, PC-8 | The name is an `EntityLink` to his card (Law 21); "Order" carries its `sphere.*` hover. **Reply within a second:** the click opens his card through `useRefRouter`. A deed then answers on the existing THR-2208 surfaces: the Mandate block's "last deeds" line ("…raised your Mandate in Order.") and the trend word turning Rising |
| Lever, Stay | "Stay the Unmaking to slow Doom." + the existing **Stay it** button | PC-9, PC-8 | Reuses THR-2240's button and handler (`DialogHost.tsx:449`). **Reply within a second:** the dialog closes and the god's page opens on the Stay card, as it does from the Doom dialog today. **Once Stay is held**, the lever slot shows THR-2240's held line, "You are holding it back." (`doom-stay-content.ts:39`), with no button. When the Stay lapses, the Stay lever returns |
| Turn alert | "How the age ends has shifted. At this pace, Doom ends the age before your Mandate is fulfilled." With a lever, its sentence follows: "Spend Order essence on Kael Thornweaver's chapters to raise your Mandate." | PC-4, PC-7 | Alert channel, no pause. `mandate_progress` alerts go to the Chronicle (`alertChronicle.ts:69`), so the turn is a Chronicle row like the checkpoint alerts, with no new click route. The move is named in the words, and the rail word changes in the same tick |
| First sight (alert, once per age) | "Now you can see how the age ends. At this pace, your Mandate and Doom finish close together." With a lever, its sentence follows, as for a turn | PC-7, PC-6 | Same channel and Chronicle row as a turn. It says "now you can see", never "shifted", because there was no earlier forecast |
| Warm recap, snapshot hidden and now shown | "While you were away, how the age ends came into view. At this pace, Doom ends the age before your Mandate is fulfilled." | PC-4 | No "shifted" for a first sight |
| Warm recap | "While you were away, how the age ends shifted. At this pace, your Mandate and Doom finish close together." | PC-4 | Shown only when the shown state differs from the snapshot |
| Checkpoint held (was "Your mandate stays on pace.") | `{checkpoint.label} held. {forecast}`. Rendered with a label from `mandateGenerator.ts:84`: "Seat of Rule held. At this pace, your Mandate is fulfilled before Doom ends the age." The race is hidden → "{checkpoint.label} held." alone | PC-6 | One fact, one telling: the checkpoint no longer says "pace" on its own |
| Tooltip `ui.race` (new, under 200 chars) | "Which clock finishes first if the last fifteen days' pace holds, not which is fuller: your {{ui.mandate}} or {{ui.doom_bar}}." | PC-1 | Registered in `ui-content.ts`, chains to both concepts |

**PC-6, the surfaces beside the new text:**
- *Mandate trend word* (three days, ledger points) stays beside the forecast (fifteen days, progress). They
  answer different questions ("moving now?" against "where is this heading?"). The one pair that could
  contradict, Rising beside `stalled`, cannot occur: `stalled` requires a trend word that is not Rising
  (decision 2). A Rising trend with `doom_first` is consistent, because the Mandate is moving but too slowly.
- *Doom dialog "Remaining" row* (`DoomClockDetail.tsx:216`, `durationLabel(totalTicks - currentTick)`, rate
  ignored). Ticket 2 removes it while the race is shown, because the forecast replaces it with a rate-aware
  reading. It stays while the race is hidden. "Elapsed" and "Next beat" stay.
- *The Mandate fill bar and the Doom bar* show how full each clock is. The race word shows which one
  finishes first at this pace. A Mandate less full than Doom can still land first if it moves faster. That
  is why the rail words say "lands first" and never "ahead" or "behind", which would read as a fill
  comparison. The `ui.race` hover says it outright: "at this pace", not "how full".
- The `ui.race` hover sits on the folded rail word too (Law 17), where most players first meet it.

**PC-8, between a move and the forecast turning:** the forecast stays silent for at least two days after
a move. That is deliberate. It reads fifteen days of pace, and a line that jumped on every card would flap
(decision 3). The move is answered at once where it lands: a deed by the Mandate's "last deeds" line and its
trend word, Stay by the held line and the Doom bar's slowed step (THR-2240). The forecast then answers in
its own time, with the turn alert. The `ui.race` hover says "the last fifteen days' pace", so a player who
asks why the sentence has not moved yet can read why.

Fallbacks, rendered:
- No mortal name → "Spend Order essence on the chapters of a mortal bound to you." (no link)
- No sphere name → "Spend essence on Kael Thornweaver's chapters to raise your Mandate."
- Unknown state → no line (Law 43, no raw token).

The lever reads the same in `MandateDetail`, in `DoomClockDetail` and in the alert: "Spend Order essence on
Kael Thornweaver's chapters to raise your Mandate." It names the Mandate outright, so in the Doom dialog it
cannot read as raising Doom.

## UI pillar

Screenshot tool: Playwright (all DOM; no WebGL surface changes).

- **`godRailComponents.tsx` folded row:** text only. No width change; at 1920 the longest summary
  ("Goal · Doom lands first") must not truncate. If it does, the row keeps "Goal · {trend}" and the executor
  records it.
- **`MandateBlock.tsx`:** when `race` is non-null, the forecast replaces the flavour line in its slot (same
  `--text-xs`, not italic, `--text-primary`), with the `ui.race` hover on the sentence. Height is unchanged.
- **`MandateDetail.tsx`:** forecast first under the title, then the lever line, then the flavour line.
- **`DoomClockDetail.tsx`:** the forecast sentence above `DoomStayAnswer`, and the chapter lever only. The
  "Remaining" row is dropped while the race is shown (PC-6 above).
- **`WarmStartOverlay.tsx`:** renders the new `race` line kind like the `doom` line.

UI Laws engaged: 13 (no numerals: words only, the paces stay in traces), 14, 17, 18, 21, 25, 33 (nothing
below the fold), 39 (alert, no pause), 43, 49 (one alert per turn), 53 (no new persistent chrome datum: the
rail word replaces the trend word), 56's spirit (each word reads engine state). Game Design Laws: 30, 32.

### Playtest signal

In the warm round after this ships, a tester asked "how is your age heading?" answers with which clock comes
first, and names one move they made because of it (a chapter played for the Mandate, or Stay held). It is
refuted if a tester says Doom ended the age "out of nowhere".

### Debug inspection

`window.__DEBUG.getRace()` returns `{ shown, computed, mandateEndTick, doomEndTick, samples, lever }`.
The debug-only `window.__DEBUG.forceRace(state | null)` overrides the shown state for evidence and is never
saved. Declared in `src/debug-bridge.d.ts`.

### Browser-verify

`?view=game&seeded&size=medium` at 1920×1080. For each of the four states, `await
window.__DEBUG.forceRace(state)`, then screenshot the rail with the Mandate block open and `MandateDetail`
open. `await window.__DEBUG.getRace()` is the assertion. Add one unforced run: `window.__DEBUG.tick(300)`,
then `getRace()` showing a non-hidden computed state. Plus console output and the UI-Laws line.

## Interface impact

| Contract | Disposition |
|---|---|
| `phaseMandate` → `mandateState` | **extend**: writes `raceWatch` |
| Doom clock → Mandate phase (read of `doomClock.progress`, `wokeAtTick`) | **add** read; production reader is `phaseMandate` |
| `mandateState` → god-rail / Mandate dialog / Doom dialog / warm recap views | **extend**: read `raceWatch` |

Update `Docs/canon/interface-map.md` and `scripts/interface-contracts.ts`. **Blast radius:** none required.
`src/types/mandate.ts` has 27 importing files (grep of `from '…mandate'` in `src/`), well under 100.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — one pure module, one optional state field, five view reads.

| Module | Phase | UI | GameState | Trace | Debug | Prose | Controls |
|---|---|---|---|---|---|---|---|
| `raceForecast` | `phaseMandate`, after progress | rail row, `MandateBlock`, `MandateDetail`, `DoomClockDetail`, `WarmStartOverlay` | `mandateState.raceWatch` | `mandate.race_turned` | `getRace`, `forceRace` | Fixed templates in `race-content.ts` filled by `fillSegments`; no `enrichProse()` (no fiction slots) | Chapter lever `EntityLink` (`MandateDetail`, `DoomClockDetail`); Stay it button (`MandateDetail`, a new `onStay` prop wired in `DialogHost.tsx`: `setMandateDetailOpen(false)`, then `openAgentSheetForId(ascendantId)`, as the Doom dialog's handler at `:449`) |

## Constants table

All in `src/data/race-content.ts`.

| Constant | Default | Purpose |
|---|---|---|
| `RACE_SAMPLE_EVERY_TICKS` | 12 (`TICKS_PER_DAY`) | One sample a day |
| `RACE_WINDOW_SAMPLES` | 15 | Fifteen days of pace, a sixth of a 1,080-tick age |
| `RACE_MIN_SAMPLES` | 5 | Below this the race stays hidden |
| `RACE_SHOW_FROM_DOOM` | 0.20 | Hidden before Doom's Signs stage |
| `RACE_CLOSE_SHARE` | 0.15 | Ends this near, as a share of the time left to Doom, read "close" |
| `RACE_STALL_EPSILON` | 0.0001 | Mandate rise across the window at or below this reads "stalled" |
| `RACE_TURN_HOLD_TICKS` | 24 | A new state must hold two days before it shows |
| `RACE_MAX_TURNS_PER_AGE` | 3 | Census ceiling on turns per seed (ticket 3) |

## Tracing

```ts
// mandate.race_turned — emitted when the shown race state changes
interface MandateRaceTurnedTrace {
  category: 'mandate.race_turned';
  tick: number;
  from: RaceState; to: RaceState;
  mandateProgress: number; doomProgress: number;
  mandateEndTick: number | null; doomEndTick: number;
}
```

## Fail-soft table

| Failure | Behaviour |
|---|---|
| No Mandate, no Doom clock, or Doom not woken | `hidden`; no line, rail keeps "Goal · {trend}" |
| Non-finite progress or pace | Sample skipped; projection `hidden` |
| Mandate pace ≤ `RACE_STALL_EPSILON` | `mandateEndTick: null`, no division; `stalled`, or `doom_first` while the trend word is Rising (decision 2) |
| Doom pace non-positive (cannot happen above `DOOM_RATE_FLOOR`, guarded anyway) | `hidden` |
| Lever mortal node gone | Fallback name; the link renders as plain text (Law 21 fail-open) |
| `raceWatch` absent on an old save | Starts empty; hidden until five samples |

## Implementation tickets

1. **Engine:** `raceForecast.ts`, the `raceWatch` field, the phase wiring, the turn alert and trace, the
   checkpoint message, `getRace` / `forceRace`, and unit tests (each state, the hold, the floor, the lever
   order). Review gate applies (`src/engine/`, `src/types/`).
2. **Content + UI:** `race-content.ts` words, the `ui.race` tooltip, the five surfaces, the recap line, and
   the browser evidence. Blocked by 1.
3. **Census:** the agency census prints the shown race state per snapshot and its turn count per arm.
   Predicate: turns ≤ `RACE_MAX_TURNS_PER_AGE` on every seed and arm, and the state shown at Doom
   `DOOM_CLIMAX_START` names the clock that ended the age on at least two of three seeds per played arm.
   Blocked by 1 and by [the census plays the whole game](https://linear.app/threadbare/issue/THR-2248).
4. **Content:** the place lever ("Tend a place in {Sphere} to raise your Mandate.", linking the god's strongest
   short-sphere place). Blocked by 2 and by [THR-2249](https://linear.app/threadbare/issue/THR-2249).

## Done when

- [ ] Tickets 1–3 merged; each PR body carries its own `Fixes` line, never this plan ticket's.
- [ ] Ticket 2's evidence: four forced-state screenshots at 1920×1080 and one unforced `getRace()` reading.
- [ ] Ticket 3's census line reads HOLDS on main.
- [ ] `npm run gate` green on each code track.
- [ ] **Fixed when:** in a later warm round, at least two of three testers can say how their age is heading
  and name one thing they did about it.

## Kill criteria

- If ticket 3 counts more than three turns on any seed, raise `RACE_TURN_HOLD_TICKS`, then widen the
  window, and re-measure. If neither holds, the forecast is too noisy to show. Hide it and the lane
  decides again.
- If the state shown at Doom 0.80 names the wrong clock on two of three seeds, the projection model is wrong
  (paces are not steady). Do not ship ticket 2's surfaces until it holds.

## Coordination block

**Suggested model:** opus for ticket 1 (engine phase, review gate), sonnet for 2–4.
**Parallel-safe with:** [the Twilight says what the Mandate came to](https://linear.app/threadbare/issue/THR-2250)
(Twilight files only).
**Mutex with:** `src/engine/phaseMandate.ts` and `src/types/mandate.ts` (ticket 1); `scripts/agency-census.ts`
(ticket 3, with THR-2248); `src/engine/views/warmRecap.ts` (ticket 2).

**Files to touch:** ticket 1 — create `src/engine/raceForecast.ts` and its test; edit `src/types/mandate.ts`,
`src/engine/phaseMandate.ts`, `src/debug-bridge.ts`, `src/debug-bridge.d.ts`, `Docs/canon/interface-map.md`,
`scripts/interface-contracts.ts`. Ticket 2 — create `src/data/race-content.ts`; edit `src/data/ui-content.ts`,
`src/engine/views/subjects/godSheet.ts`, `src/engine/views/godRail.ts`, `src/engine/views/warmRecap.ts`,
`src/components/Game/ascendant-bar/MandateBlock.tsx`, `src/components/Game/MandateDetail.tsx`,
`src/components/Game/DoomClockDetail.tsx`, `src/components/Game/WarmStartOverlay.tsx`,
`src/components/Game/frame/godRailComponents.tsx`, `src/components/Game/hosts/DialogHost.tsx` (the
`MandateDetail` `onStay` prop), tests. Ticket 1 may hold the constants in
`race-content.ts` if it lands first.

## Notes for the executor

- Stale comments: `phaseMandate.ts:344`, `debug-bridge.d.ts:2205` and `godSheet.ts:498` say the trend reads
  "the last day". It is three days since THR-2236. Fix them in ticket 1.
- Do not show a numeral, a percentage or a projected day count. The paces and end ticks stay in the trace
  and `getRace`. The hover's "fifteen days" names the window in words (Law 13's duration reading), not a
  projection.
- Do not add a score, a grade or "you are winning/losing" (Law 32).

## Three-pillar check

- [x] Engine: one pure module, one optional field, one alert, one trace
- [x] Content: four forecast lines, two lever lines, one tooltip, one recap line, one checkpoint change
- [x] UI: five surfaces, no height added, no new persistent datum
- [x] Wiring: table above

## Rulebook impact

- [x] This plan does not change a rule of play: the forecast reads both clocks and moves neither.
- [x] `Docs/canon/rulebook.md` is untouched, so no same-PR edit is owed.

## Vision audit

- [x] No Vision premise is contradicted. Law 30: two clocks and one purse become visible as one race.
  Law 32: the sentence names which ending comes, never a rank.
- [x] Vision `02-non-negotiables.md` #3 (prose, never numbers) holds: words only. No Vision edit is owed.
- [x] `03-design-tensions.md` #4 (legibility vs mystery): the lever names a move in story words ("Spend Order
  essence on Kael's chapters"), never "the best move" or an optimal plan. It shows only while Doom lands
  first or the finish is close, and never when the Mandate lands first.

> Brainstorm companion: `Docs/plans/2026-11-19-thr-2246-the-player-can-read-the-race-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Eight named constants; the words sit beside them |
| 2. Inspectability | PASS | `mandate.race_turned` trace; `getRace` shows paces and end ticks |
| 3. Determinism | PASS | No randomness; samples on fixed ticks |
| 4. Fail-soft | PASS | See the table; every gap reads `hidden` |
| 5. Narrative over mechanics | PASS | One sentence about the age, not a meter |
| 6. Additive | PASS | One optional field; the checkpoint line is reworded, not removed |
| 7. Performance | PASS | One sample a day, fifteen numbers, one O(1) projection per tick. `raceLever` runs in the dialog view selectors while a dialog is open, and in `phaseMandate` only on a turn or first sight (a few times an age). Each call reads the bound mortals (one edge scan from the god) and two ledger ratios |

## Intent-judge verdict

**Allow** on run 7, 2026-11-19, with impact class Reversible confirmed. Runs 1–6 returned **Revise**. The
findings, all fixed in this doc, were:
- run 1: the substrate inventory section was missing;
- runs 1, 3 and 4: PC-6 neighbours (trend word, Doom "Remaining" row, fill bars) and the word "race" with no
  explanation;
- run 2: PC-8 replies for the lever controls, and the wiring columns;
- runs 3 and 5: the stalled-state rule and first sight;
- run 6: the fallback grammar, "raise it", and the Doom floor's source.

Run 7's non-blocking notes are folded in: the `RaceState` type, the `DialogHost` `onStay` wiring, the NFP 7
tick-path note, and the day-count wording.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-19. Condensed.*

**NFP audit: PASS-with-notes.** 1–5 PASS.
- NFP 6, PASS-with-note: the plan rewords the checkpoint line, drops the Doom "Remaining" row while the race
  shows, and moves the flavour line. Each is a reading moved, not removed, and is justified under PC-6.
- NFP 7, PASS-with-note: the plan gave no cost bound for the lever read. One is now in the NFP table.

**Three-pillar audit: PASS.** Engine, Content and UI are all present and substantive. The wiring connects
phase, UI, state, trace, debug, prose and controls. The substrate is extended, with no green-field
duplication (the encounter forecasts were set aside for a stated reason).

**Vision audit: PASS-with-notes.** No contradictions. North star, core loop, non-negotiables #2, #3, #6 and #7,
and the taste profile's prose-first UI are confirmed. Soft note on tension #4: a "one move" lever leans toward
optimal-strategy talk. Answered in § Vision audit: the lever is a story move, never "the best", and never shows
while the Mandate lands first.
