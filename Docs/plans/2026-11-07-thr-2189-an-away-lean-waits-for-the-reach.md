> **title:** An away lean waits for the reach — it holds until the mortal reaches for that road again, says one honest line before paying, and is not offered on a work (THR-2189)
> **linear_issue:** THR-2189
> **author:** Claude Code (design lane, unattended, 2026-11-07 — run 2026-11-07g)
> **created:** 2026-11-07
> **three_pillars:** Engine done (one wait branch, one offer gate, one forecast branch, one flag) · Content done (three lines, one rulebook sentence) · UI done (no new surface; the away offer's words change and it leaves work rows)

# An away lean waits for the reach (THR-2189)

*A god who leans a threaded mortal away from the road they favour pays for something that, three times in four, would have happened anyway: the mortal sets that road aside at their next choice whether or not the god's hand is on them. The lean only matters on the day the mortal reaches for that road again. This plan makes the away lean wait for that day, so a "followed" ending is always the god's doing. It gives the away offer one honest line instead of three forecast words that carry no signal, and it stops offering away on a work, where it almost never matters. Measured: an away lean that ended "followed" had changed the mortal's choice 156 times in 533 today, and 86 times in 86 after.*

## Why this is load-bearing

[The Crossroads](2026-10-14-thr-1926-the-crossroads.md) gives the god two ways to lean: toward a road, or away from the road the mortal favours. [A lean waits for its road](2026-11-07-thr-2188-a-lean-waits-for-its-road.md) made the toward lean honest. Its census left the away words open: they are followed 77–98% of the time whatever they say, including "Kael will hold to it anyway". That breaks Law 45 (the game says what the world will not do) and Law 36 (a small purse spent on an outcome that was coming anyway). It also blurs Law 17: the player is told a word before paying, but the word does not tell them anything.

**Decided by delegation — design lane, 2026-11-07 (process.md rule 4).** All three changes are this lane's call, inside the agreed Crossroads design: the away lean keeps its meaning (a weight against the road the mortal favours, never an order), and only *when* it is read and *what it says* change. Veto in chat. Evidence and options weighed: [brainstorm companion](2026-11-07-thr-2189-an-away-lean-waits-for-the-reach-brainstorm.md).

## The measurement

Instrument: `scripts/crossroads-away-census.ts` on the never-merged branch [`proto/thr-2189-away-lean-waits`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2189-away-lean-waits) (main @ `2b3bebee` plus the THR-2188 build, plus an env-switched wait). Seeds 42 and 7, 600 ticks, medium map, six threaded mortals per seed, an **away lean on the leader at every fresh reading**. `leanTurned` is the engine's own counterfactual (`boardWinnerWithoutLean`): the lean changed the board's winner.

| Arm | Leans | Followed | Lean turned the winner | Followed anyway | Resisted | Faded |
|---|---|---|---|---|---|---|
| Today | 608 | 533 (88%) | 156 (26%) | 377 (62%) | 53 | 22 |
| **Away waits for the reach (this plan)** | 158 | 86 (54%) | **86 (54%)** | **0** | 30 | 42 (27%) |

The wait arm places fewer leans because each is held longer (mean 33 ticks against 9). Every "followed" is now the lean's work.

**The three forecast words carry no signal, in either arm.**

| Word at placement | Today: lean turned the winner | After: followed, of leans that met the road | After: followed, of all leans |
|---|---|---|---|
| likely | 23 / 109 (21%) | 11 / 16 (69%) | 11 / 24 (46%) |
| may | 80 / 292 (27%) | 53 / 61 (87%) | 53 / 83 (64%) |
| not_enough ("will hold to it anyway") | 53 / 207 (26%) | 22 / 39 (56%) | 22 / 51 (43%) |

The words are read off the board the mortal just decided with. The lean is decided on a later board, after the encounter that was just taken has changed the mortal's day. The lead at placement (s₂ / s₁, bucketed ≤ 0.5 / 0.5–0.7 / 0.7–0.85 / ≥ 0.85) predicts no better: 43%, 64%, 50%, 67% followed after. "Will hold to it anyway" is wrong more often than right in both arms.

**What does hold:** when the mortal reaches for the road again, the away lean turns them 86 times in 116 (74%), and it never fails worse than 56% in any band. About one away lean in four fades because the mortal never reaches for that road again within six days.

**Works:** on an undertaking (a work), today's away lean turned the winner once in 27. Under the wait, all 7 faded. A mortal's own work is not a road they "reach for" at a choice; it runs.

## Substrate inventory

| Existing subsystem | Status | This plan |
|---|---|---|
| The Crossroads (`crossroads.ts`, `crossroadsDecision.ts`, `crossroadsActions.ts`, `crossroads-content.ts`) | 🟢 ACTIVE | **extends** — one away forecast branch, one wait predicate, one offer gate |
| Agent decision phase (`phaseAgentDecision.ts`) — THR-2188's wait branch | 🟢 ACTIVE | **extends** — the same `leanWaits` test gains the away case |
| Crossroads row (`views/subjects/crossroadsRow.ts`, drawn by `CardActStrip`) | 🟢 ACTIVE | **extends** — away offered only on an encounter road |
| `boardWinnerWithoutLean` (`crossroads.ts`) | 🟢 ACTIVE | **reused** — the counterfactual already computed for `leanTurned` |

## Engine pillar

### Systems design

1. **An away lean waits for the reach.** In `phaseAgentDecision`'s Crossroads lean block, beside THR-2188's `leanWaits`, a held away lean also waits when `CROSSROADS_AWAY_WAITS_FOR_REACH` is true, the lean is not expired or malformed, its road is on the board (`preparedLean.effective !== null`), no override took the decision, and the **unleaned** winner (`boardWinnerWithoutLean(crossroadsBoard.entries, BOARD_SCORE_FLOOR)`) is not the leaned road. It is not resolved and not cleared; it emits `crossroads_lean_waiting` (the THR-2188 trace, unchanged) and stays. At the decision where the mortal's unleaned first choice **is** the road, it resolves as today: `followed` when the lean turned them, `resisted` when they took it anyway. `CROSSROADS_HOLD_MAX_TICKS` (72) still ends it as `lapsed_expired`.
   Put the predicate in `crossroadsDecision.ts` as `awayLeanWaitsForReach(prepared, board, encounterCandidates, strategicCandidates, floor, overridden)` so it is unit-testable, pure, and cannot throw (identity lookups return `null` on drift → no wait).
2. **One honest away forecast.** `forecastLean` gains: when `CROSSROADS_AWAY_WAITS_FOR_REACH` is true and `lean.direction === 'away'` and the target is the snapshot's leader, return `'likely'`. The word now describes the lean's conditional promise (if the mortal reaches for it again, the hand will likely turn them), which is measured at 74% and at least 56% in every band. With the flag off, today's arithmetic runs unchanged. The away-on-a-non-leader branch is unchanged (the row never offers it).
3. **No away on a work.** `crossroadsRow` offers "Lean away" on the first road only when `snapshot.options[0].family === 'encounter'`; `placeCrossroadsLean` refuses `direction === 'away'` on a `strategic_action` road with a new reason `away_on_a_work`. Law 25 / UI Law: no control that cannot matter.

Toward leans are untouched: their words are calibrated by THR-2188 (56 / 38 / 14%), and their wait branch is unchanged.

### Graph nodes / edges · Tick phases · PRNG

None new. `crossroadsLean` stays a node property; the wait reads the board already built at the decision. Agent decision only, at the existing lean block. No randomness: the counterfactual is a deterministic sort.

### Resolution logic

| Held away lean at a full decision | Today | After |
|---|---|---|
| Past `CROSSROADS_HOLD_MAX_TICKS` | `lapsed_expired` | unchanged; new away line |
| Road off every list | waits (THR-2188) | unchanged |
| Road on the board, the mortal's unleaned first choice is something else | `followed` (the mortal set it aside anyway) | **waits**: trace only, lean kept |
| Road is the unleaned first choice, the lean turns them | `followed` | `followed` (unchanged) |
| Road is the unleaned first choice, they take it anyway | `resisted` | `resisted` (unchanged) |
| An override (Compulsion, compelled journey) took the decision | resolves against the override | unchanged (no wait) |

## Content pillar

Files: `src/data/crossroads-content.ts`, `src/data/ui-content.ts`, `Docs/canon/rulebook.md`. No encounter templates, prose tables or attachments change.

| Key | Today | After |
|---|---|---|
| `LEAN_FORECAST.away.likely` | "{name} will likely set it aside." | "If {name} reaches for it again, your hand will likely turn them from it." |
| `LEAN_HELD.away` | "Your hand rests on {name}, away from {road}. It waits until {name} next faces that road." | "Your hand rests on {name}, away from {road}. It waits until {name} reaches for that road again." |
| `OUTCOME_TOAST.lapsed_expired` | one string for both directions | keyed by direction: **toward** unchanged ("Your lean fades: {name} did not face {road} again in time."); **away** "Your lean fades: {name} never reached for {road} again." |
| `LEAN_REFUSAL.away_on_a_work` (new) | — | "{name} is not choosing that work; it runs on its own." |
| `ui.crossroads.forecast` (`src/data/ui-content.ts`) | "Read from how they weigh things now. The world may change before they choose, and your hand waits until that road is in front of them again." | "Read from how they weigh things now. The world may change before they choose. A lean toward waits until that road is in front of them again; a lean away waits until they reach for it again." |

`LEAN_FORECAST.away.may` and `.not_enough` stay in the table for the flag-off path. `resolveCrossroadsLean` picks the expiry line by `lean.direction`. `LEAN_PLACED_MESSAGE` aliases `LEAN_HELD` and follows it.

**Rulebook §4**, *You can stand at a threaded mortal's crossroads*: after "toward it, or away from the road they favour", the sentence "It waits until that road is in front of them again, for up to six days" becomes "A lean toward waits until that road is in front of them again; a lean away waits until they reach for that road again; either way for up to six days". Changelog line at the foot.

## UI pillar

*Screenshot tool: Playwright (DOM). No WebGL.*

No new surface or component. The Crossroads row (`crossroadsRow.ts` → `CardActStrip`) shows the changed away forecast and held line, and shows no "Lean away" on a work row. The outcome toast shows the new away expiry line. Laws engaged: Law 17 (the stakes in words before paying: the away line now says what the lean does and when), Law 13/14 (no numerals: "six days" only in the rulebook), Law 21 (the road name stays an identity link), Law 25 (no control that cannot matter: away leaves work rows), Law 33 (the away forecast grows by about forty characters inside the existing strip; it wraps as the toward lines already do at 1920×1080 — the build screenshots it).

### Player-facing text

| Surface | Exact text the player reads | Complaint class | How the player understands it |
|---|---|---|---|
| Confirm strip, away (before paying) | "If Kael reaches for it again, your hand will likely turn them from it." | PC-1, PC-2 | Says what the lean does and that it waits for a moment that may not come |
| Crossroads row, held away | "Your hand rests on Kael, away from The Oath-Breaker's Rite. It waits until Kael reaches for that road again." · "Lift your hand" | PC-4, PC-8 | A lean that sits for days now says what it waits for |
| Outcome toast, followed away (unchanged) | "Kael sets The Oath-Breaker's Rite aside, as you leaned. Kael calls it faith." | PC-2 | Now arrives only when the god's hand did it |
| Outcome toast, resisted away (unchanged) | "Kael feels your hand and holds to The Oath-Breaker's Rite anyway. Kael pushes the hand away and does not look back." | PC-2 | A real refusal, on the day Kael reached for it |
| Outcome toast, faded away | "Your lean fades: Kael never reached for The Oath-Breaker's Rite again." | PC-2, PC-8 | The lean was not needed; the world, not the lean, kept Kael off that road |
| Forecast tooltip `ui.crossroads.forecast` (changed) | Today: "Read from how they weigh things now. The world may change before they choose, and your hand waits until that road is in front of them again." After: **"Read from how they weigh things now. The world may change before they choose. A lean toward waits until that road is in front of them again; a lean away waits until they reach for it again."** | PC-6 | The tooltip, the held line and the rulebook now say the same thing for each direction |
| Work row | (no "Lean away" button) | PC-8 | No control that cannot matter |

### Playtest signal

No tester lists "will hold to it anyway" or an away lean that "worked" without them under surprises. A tester who leans away and sees "sets it aside, as you leaned" can tie it to a day the mortal went for that road.

### Debug inspection · Visual presence · Vocabulary

`window.__DEBUG.getCrossroads` already returns the held lean and its forecasts; it shows the new away word and a waiting away lean with its `tick`. The trace viewer lists `crossroads_lean_waiting`. HexMapV2: N/A, the lean has no map presence. No new term: "reaches for" is plain English; "road" stays the choice sense pending [UL-proposal: Crossroads, Lean and Road](https://linear.app/threadbare/issue/THR-2190).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — no new trace, phase, component or GameState field; one constant in its data file.

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `awayLeanWaitsForReach` + `phaseAgentDecision` lean block | agent decision, lean resolution | Crossroads row held state | `crossroadsLean` kept | `crossroads_lean_waiting` | trace viewer, `getCrossroads` |
| `forecastLean` away branch | click time (row) and placement (`placeCrossroadsLean`) | Crossroads row forecast | `crossroadsLean.forecastAtPlacement` | `crossroads_lean_placed.forecast` | `getCrossroads` |
| away offer gate | — | Crossroads row | — | `crossroads_lean_placed` not emitted on refusal | — |

## Interface impact

| Contract | Change |
|---|---|
| `god-leans-mortal-crossroads` (`scripts/interface-contracts.ts`) | **extend**: an away lean may stay held across decisions until the mortal's unleaned first choice is its road; add `awayLeanWaitsForReach` and `CROSSROADS_AWAY_WAITS_FOR_REACH` to its symbols. Dated line in `Docs/canon/interface-map.md` |

No new cross-system write.

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `CROSSROADS_AWAY_WAITS_FOR_REACH` (new, `premonition-constants.ts`) | `true` | One-flag revert: `false` restores today's away resolution and away forecast arithmetic |
| `CROSSROADS_HOLD_MAX_TICKS` | 72 (unchanged) | Now also bounds how long an away lean waits for the reach |
| `CROSSROADS_LEAN_AWAY_COST` | 2 (unchanged) | Kept: the lean now always matters when it resolves, and one in four fades — the price stands (Law 36: no refunds) |

## Tracing

N/A — no new trace type or field. `crossroads_lean_waiting` (THR-2188) now also fires for an away lean waiting for the reach; its `direction: 'away'` tells them apart. Volume: at most one per full decision per threaded mortal holding a lean, for at most `CROSSROADS_HOLD_MAX_TICKS`, tracing on only. `crossroads_lean_outcome.leanTurned` becomes `true` on every away `followed` — the census asserts it.

## Fail-soft table

| Failure | Fallback |
|---|---|
| Malformed or expired lean | Not waited; today's paths |
| The counterfactual winner cannot be resolved to an identity (index drift) | No wait; resolves as today |
| No board this decision (the board threw) | No wait test; THR-2188's "board that threw leaves the lean held" path |
| An old save holds an away lean with `forecastAtPlacement: 'not_enough'` | Reads as before; the wait applies; the toast is the new one |
| An old save holds an away lean on a work | Waits and fades at the hold limit; no new placement on a work is possible |

## Blast Radius

| File | Importer count | Note |
|---|---|---|
| `src/engine/phaseAgentDecision.ts` | wide (decision hot path) | One boolean OR'd into the existing `leanWaits`; no other branch changes |
| `src/data/crossroads-content.ts` | small | `OUTCOME_TOAST.lapsed_expired` changes shape (string → keyed); its one reader and the content tests move with it |

## Three-pillar check

- [x] Engine pillar present
- [x] Content pillar present
- [x] UI pillar present (changed words on existing surfaces, one offer removed from work rows)
- [x] Wiring section connects them

## Vision audit

- [x] No Vision premise is contradicted. Law 9 holds: the away lean still only halves one road's weight, and the mortal still decides (30 of 116 took the road anyway). Laws 17, 36 and 45 are what this restores.
- [x] **Law 18 note.** The away word stops being the snapshot's arithmetic because that arithmetic describes a board that will never decide the lean (measured: no signal). The new word is the measured rate of the decision that does resolve it, and the line says it is conditional. Lean resolution uses no randomness, so there is no dice call for the word to share; the old word already broke Law 18's intent by describing a board that does not decide. With the flag off, the arithmetic returns. Recorded here so a veto can name it.

## Rulebook impact

- [x] This plan changes a rule of play: when an away lean resolves, and where it can be placed.
- [x] `Docs/canon/rulebook.md` §4 is updated in the build PR (Content pillar).

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | One revert flag; the hold limit and the price unchanged |
| 2. Inspectability | PASS | `crossroads_lean_waiting` with `direction`; `leanTurned` true on every away follow |
| 3. Determinism | PASS | No randomness |
| 4. Fail-soft | PASS | Table above |
| 5. Narrative over mechanics | PASS | "Sets it aside, as you leaned" is only said when it is true |
| 6. Additive over destructive | PASS | New predicate, flag and refusal; old words kept for the flag-off path |
| 7. Performance | PASS | One `boardWinnerWithoutLean` call per decision per threaded mortal holding an away lean (already computed once at resolution) |

## Done when

- [ ] `npm run census:crossroads-away-leans` (the proto census ported **without** its env switch, beside `census:crossroads-leans`) on seeds 42 and 7, 600 ticks, shows: every away `followed` has `leanTurned: true` (0 "followed anyway"); away `followed` ≥ 65% of away leans that met their road; away faded ≤ 35% of away leans; no away lean placed on a work. Paste before and after tables in the PR.
- [ ] `npm run census:crossroads-leans` shows the toward rows unchanged from THR-2188's after-table (± 2 points), and its kill lines still PASS.
- [ ] Unit tests: `awayLeanWaitsForReach` true when the unleaned winner is another road, false when it is the leaned road, false under an override, false on identity drift; an away lean kept across a decision traces `crossroads_lean_waiting`; `forecastLean` returns `'likely'` for away-on-leader with the flag on and today's words with it off; the row offers no away on a `strategic_action` leader; `placeCrossroadsLean` refuses `away_on_a_work`; the away expiry toast reads the new line and the toward one is unchanged.
- [ ] The four content lines, the `ui.crossroads.forecast` tooltip and rulebook §4 read exactly as in the Content table.
- [ ] Wiki: the pages whose sources match `phaseAgentDecision.ts` / `crossroads*.ts` gain the away wait.
- [ ] `npm run gate` passes, including the 30-tick CLI smoke. One 1920×1080 screenshot of Kael's Crossroads row with the away offer armed (`?view=game&seeded&size=medium`), showing the new line fits the strip.

## Kill criteria

- If the build's census shows away `followed` below 60% of leans that met their road, the hand is too weak to promise "likely": change the word to "may" (one content line) before shipping.
- If away fades exceed 40% of away leans, the lean mostly buys nothing: re-measure with the hold limit, and consider pricing away below toward, never a refund.
- If the wait visibly holds leans so long that players stop leaning away (warm round 4 shows no away leans placed), revert with `CROSSROADS_AWAY_WAITS_FOR_REACH = false`.

## Coordination block

**Suggested model:** opus. It edits the decision hot path and the census needs reading by direction.

**Parallel-safe with:** UI-only tickets and anything outside the Crossroads files and `phaseAgentDecision.ts`'s lean block.

**Mutex with:** any ticket on `forecastLean`, the `CROSSROADS_*` constants, `crossroads-content.ts`, or `phaseAgentDecision.ts`'s Crossroads lean block, because the wait predicates and the toast shape are shared with THR-2188's build.

**Files to touch:**
- Edit: `src/engine/crossroads.ts` (`forecastLean` away branch), `src/engine/crossroadsDecision.ts` (`awayLeanWaitsForReach`, direction-keyed expiry line), `src/engine/phaseAgentDecision.ts` (OR into `leanWaits`), `src/engine/crossroadsActions.ts` (`away_on_a_work`), `src/engine/views/subjects/crossroadsRow.ts` (offer gate), `src/data/premonition-constants.ts` (flag), `src/data/crossroads-content.ts` (four lines), `src/data/ui-content.ts` (the forecast tooltip), `Docs/canon/rulebook.md`, `scripts/interface-contracts.ts`, `Docs/canon/interface-map.md`, the wiki pages, the crossroads tests
- Create: `scripts/crossroads-away-census.ts` + its `package.json` script

## Notes for the executor

- Port the census from the proto branch, not its `phaseAgentDecision` edit: that reads `process.env` inside `src/`, which must not ship.
- `crossroadsBoard.entries` already carry `crossroadsLean` multipliers; `boardWinnerWithoutLean` divides them back out — reuse it, do not re-score.
- `review-gate` applies (touches `src/engine/`).

## Intent-judge verdict

Two runs, cold, opus. **Run 1: Revise.** One GAP on player legibility: the shared forecast tooltip `ui.crossroads.forecast` was quoted as unchanged, but under this plan it no longer described the away lean. Also flagged: the summary figure "155 in 511" was the encounter-only count, not the total. Both fixed. The tooltip is now keyed in words to each direction and added to the Content table, the Done-when and the files list; the summary reads 156 in 533. The Law 18 note gained the no-randomness line. **Run 2: Allow** (Reversible). One recorded GAP on the Vision axis: the away word is a measured constant, not computed per case, under [E] Law 18. Not a violation, because it is recorded, behind a revert flag, with a veto invited. The judge recommends naming the trade to Christian in one line. The judge also confirmed this does not change what the lean is *for*: halving a road's weight only matters when that road would win, so waiting for that decision changes only when the lean is settled.

## Forked-audit verdicts

*Generated by design-audit-pipeline — 2026-11-07*

### NFP audit

**NFP AUDIT: PASS-with-notes.** Determinism, fail-soft, narrative, inspectability and performance PASS (the counterfactual is a deterministic sort; the predicate is pure and cannot throw; `crossroads_lean_waiting` carries `direction`; one `boardWinnerWithoutLean` call per decision per mortal holding an away lean). Tunability, note: the fixed "likely" away word rests on a measured 74% and lives in a content line, not a constant. Accepted: the word is a sentence, and the flag reverts it. Additive, note: `OUTCOME_TOAST.lapsed_expired` changes shape and the forecast tooltip is replaced rather than added. Accepted: both are in the Blast Radius and Content tables, and the old away words stay for the flag-off path.

### Three-pillar audit

**PILLAR AUDIT: PASS.** Engine, Content and UI are each present and substantive. The Content table gives exact text for five keys and the rulebook sentence. The UI pillar names Playwright (DOM), quotes every surface with its complaint class, and marks HexMapV2 N/A with a reason. Wiring ties each module to phase, component, field, trace and debug surface. The substrate inventory matches the `crossroads` row in `systems-inventory.md`; nothing is green-fielded.

### Vision audit

**VISION AUDIT: PASS-with-notes.** No contradictions across the six Vision files. North star and non-negotiables #1, #2, #3 and #7 are confirmed: the lean is still a weight, and 30 of 116 mortals took the road anyway. Design tension #4 moves toward legibility, and the conditional line keeps the mystery of whether the mortal reaches for the road. Note: the tooltip's "A lean toward… a lean away…" reads slightly mechanical. Kept: it is a tooltip, and it has to name both directions. Note: one away lean in four fades without effect. This is covered by the fade line, and the kill criterion watches it at 40%. Note: the Law 18 trade is a Law matter, not a Vision one, and it is recorded.
