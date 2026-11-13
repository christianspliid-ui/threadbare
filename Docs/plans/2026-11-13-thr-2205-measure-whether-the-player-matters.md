> **title:** Measure whether the player matters — a hands-off run and a played run on the same seed, compared on how the age turns out (THR-2205)
> **linear_issue:** THR-2205
> **author:** Claude Code (design lane, run dl-20261113T1719Z)
> **created:** 2026-11-13
> **three_pillars:** Engine done (an offline census over the engine; no tick change) · Content N/A — the measure is headless and writes no player text · UI N/A — nothing a player sees changes

# Measure whether the player matters (THR-2205)

*Ten playtest rounds asked whether a newcomer could read the game. None asked whether playing it changes
anything. This plan adds one number that does: the same seed run twice, once with no card ever played and
once with every affordable card played. The number is how many headline outcomes of the age differ.*

## Why this is load-bearing

Christian approved this on 2026-11-12 ("Yes, file them"): ticket 5 of 5 in the direction "make the middle a
game". On 2026-11-12 an expert ran the deployed build twice, once played and once with every decision
auto-answered. Both runs reached the same Apotheosis, the same "Aspect" status and the same ending. The
other four tickets ([purse](https://linear.app/threadbare/issue/THR-2201),
[clocks](https://linear.app/threadbare/issue/THR-2202),
[stops](https://linear.app/threadbare/issue/THR-2203),
[climax](https://linear.app/threadbare/issue/THR-2204)) each try to make play matter. Without a number,
nobody can tell whether any of them did. This plan defines the number and records today's value, which is
the baseline those four must move.

## Substrate inventory

Measured on `main` @ 175d10b0.

| Subsystem | Status | Finding | This plan |
|---|---|---|---|
| Seeded-route build, headless (`devSeedTheFirst`, `devSeedAscendantTestPackage`, `settleOpeningSpineBeats`, Lives-on warm-up), as in `proto/thr-2201-essence-census` | 🟢 ACTIVE | Builds the `?view=game&seeded&size=medium&warm=300` world without a browser. The CLI world has no thread edges, so the CLI route cannot be used. | **reuses** the build verbatim |
| Step hold: `isPlayerHoldLive` / `releasePlayerHold` (`playerStepHold.ts`); `stepOffersPlayerMove` holds only steps with nudges or a deal | 🟢 ACTIVE (THR-2140) | A held step is exactly a step the UI puts in front of the player. A fork step is decided by the mortal (Law 11) and is not held. | **reads**: both arms release every hold |
| Hand build: `buildNudgePhaseModel` (as `__DEBUG` builds it); payment `spendNudgeEssence` + `withEssenceSpend` | 🟢 ACTIVE | The commit path's pure half. This is the smallest seam: no `window.__DEBUG`, no React. | **reuses** for the played arm |
| Outcomes: `firstFate` (`twilight.ts:140`), `mandateState.{progress,completed}`, `doomClock.currentStage`, `phase` (`'twilight'` at age end, orchestrator `:3052-3094`), `chapterArchive` | 🟢 ACTIVE | Everything the headline needs is already in `GameState`. | **reads** |
| Mandate filling: since THR-2081 only the god's own casts fill it (`mandateState.godLedger`) | 🟢 ACTIVE | A hands-only played arm cannot move the Mandate on today's `main`. [A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208) changes that. | **reads**; the measure will show the change when it lands |
| `census:*` npm scripts (about 30, e.g. `census:mandate`, promoted from a design-lane proto) | 🟢 ACTIVE | The established home for offline product measures. No gate reads them. | **extends**: one more |

## Decisions (made by the design lane under delegation, 2026-11-13 — veto in chat)

1. **Two arms, same seed, same route.** *Hands-off*: every held step is released with no card played.
   *Played*: every held step plays every card in hand order that the pool can still pay for (the greedy god
   of the purse census). Both arms leave every fork to the mortal (Law 11) and cast nothing on the map.
   Both arms are hands-off during the 300-tick warm-up, which is the route the testers and the expert
   played. Determinism (NFP 3) makes every difference the player's doing. A repeat of the hands-off arm
   proves the noise floor is zero.
2. **Only the headline counts.** Any card play changes what the seeded dice draw next, so the two worlds'
   chapter lists drift apart whether or not the play meant anything. Counting that would read 100% on every
   build. The predicate reads five **headline outcomes** at tick 800 (or at the age's end, if sooner):
   - **H1:** which clock ended the age (Mandate, Doom or not yet). If both arms' ages ended the same way,
     it counts when they ended a season or more apart.
   - **H2:** the First's fate (Aspect, lived, died).
   - **H3:** whether the First's Apotheosis chapter happened.
   - **H4:** Mandate progress, when the arms differ by 0.10 or more.
   - **H5:** the Doom stage.

   Chapter-list overlap, the band mix, cards played and essence left are printed as **diagnostics** and
   never counted.
3. **The predicate tests *different*, never *better*.** Law 32: the game does not rank the player. On one
   seed, **the player mattered** when at least one headline outcome differs between the arms. The KPI is
   *seeds where the player mattered, out of three*, with the headline-difference count per seed beside it.
4. **Where the number lives: an on-demand census, `npm run census:agency`.** It is a product measure with no
   gate, the same class as `census:mandate`. **Weekly reporting is held by the pipeline freeze.** The freeze
   ([THR-1946](https://linear.app/threadbare/issue/THR-1946)) was made permanent by the weekly review a few
   hours before this run. Adding a step to the weekly review's prompt would be a new standing lane rule, so
   that wiring waits for Christian. The ticket allowed this: "hold only the wiring, not the design". Until
   then, a session that ships one of the four sibling tickets can run the census and quote the number.
5. **The arms run in the background; the verdict runs in the foreground.** A full age is 820–880 ticks, and
   one arm took 15–17 minutes to reach it (measured below). That is past the 600-second cap on a
   foreground command (impediment rows 1202, 1211–1214), so `--all` spawns the six arms as child processes,
   at most four at a time, and must be launched in the background. A background command has no cap. The
   whole set takes about 35 minutes of wall time. Each arm writes JSON. `--compare` reads the pairs and prints
   the verdict in seconds, in the foreground.

Rejected, one line each: a random-play third arm (it separates policy from perturbation, which matters only
once the headline moves; it is the first extension); a cast-playing arm (it mixes two verbs; `census:mandate`
`godloc` already measures casts); counting chapter divergence (chaos alone saturates it); a merge gate (the
freeze, and a gate on design direction is not a fault check).

## Baseline on `main` (measured 2026-11-13, proto branch `proto/thr-2205-agency-census`)

**The player mattered on 0 of 3 seeds. Headline differences: 0, 0, 0.** The hands-off arm repeated on seed 42
gave the same result to the last chapter: zero noise.

| seed · arm | age ended | held steps | cards played (essence) | at t800: Doom · Mandate · First · Apotheosis | essence at t800 |
|---|---|---|---|---|---|
| 42 · hands-off | Doom, t861 | 28 | 0 | 5 · 0.13 · Aspect · yes | 720 (cap) |
| 42 · played | Doom, t876 | 24 | 117 (203) | 5 · 0.11 · Aspect · yes | 717 |
| 99 · hands-off | Doom, t822 | 25 | 0 | 5 · 0.11 · lived · yes | 720 (cap) |
| 99 · played | Doom, t828 | 35 | 178 (292) | 5 · 0.12 · lived · yes | 720 (cap) |
| 7 · hands-off | Doom, t833 | 26 | 0 | 5 · 0.06 · Aspect · yes | 720 (cap) |
| 7 · played | Doom, t820 | 29 | 139 (236) | 5 · 0.07 · Aspect · yes | 720 (cap) |

What the numbers say, in game terms:

- **Playing every card changed nothing a player would tell.** On all three seeds both arms ended by Doom
  within 15 ticks of each other. The First's fate matched, the Apotheosis happened in both by t400, and the
  Mandate never passed 0.13. This confirms the expert session on two more seeds, as the ticket asked.
- **Play does move the world underneath.** The First's chapter templates overlap only 65–86% between the
  arms, and the band mix shifts (seed 99 played: 58 successes against 50). None of it reaches the
  headline. That is the gap the four sibling tickets exist to close.
- **The only timing effect points both ways.** Played, the First became an Aspect a snapshot earlier on
  seed 42 and two snapshots later on seed 7. That is perturbation, not policy. Timing stays a diagnostic.
- **The purse never bit.** Both arms sat at the essence cap from about t600, which matches the
  [purse plan](2026-11-13-thr-2201-make-the-purse-bite.md)'s census.
- **The Mandate cannot move here.** It fills only from casts (THR-2081), and neither arm casts.
  [A bound mortal's deeds fill the Mandate](https://linear.app/threadbare/issue/THR-2208) is the first
  sibling that can move H4.

Runtime: each arm took 880–1,030 s of wall time to reach the age's end, with three to five arms running at
once on 16 cores. Seven at once slowed every arm about eightfold.

## Engine pillar

No tick, phase, node or edge changes. The work is one offline script over the engine:

- `scripts/agency-census.ts`, promoted from
  [`proto/thr-2205-agency-census`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-2205-agency-census)
  as `census:mandate` was. Modes: `--arm none|greedy --seed N --warm W --ticks T --budget-s S --out f.json`
  (one arm); `--all --out-dir D` (spawns the six arms over `AGENCY_SEEDS` with `child_process`, at most
  `AGENCY_MAX_PARALLEL` at once, then runs the compare); and `--compare a.json b.json [...]`. `--all` passes no
  `--budget-s`: an arm's end point is set by ticks and the age's end, never by wall time, so a slow machine
  cannot change the verdict (NFP 3). `--budget-s` stays for hand-run single arms, and `--compare` marks any
  arm with `stopReason: budget` as "not measured". A progress line
  goes to stderr every 25 ticks.
- `agencyVerdict(none, played)` is an exported pure function. It is unit-tested on hand-built result
  objects: identical arms give 0, and one test per headline outcome flips exactly that one.
- `package.json`: `census:agency`, the same esbuild-then-node pattern as its siblings.
- **PRNG:** none added. Arms differ only in the cards committed; the seed is fixed per run.

## Content pillar

Content: N/A — the census writes no player-facing text, template or table.

## UI pillar

UI: N/A — nothing a player sees changes; the output is a console verdict and JSON files. No UI Law engaged.

## Interface impact

| Contract | Disposition |
|---|---|
| Hold → commit (`releasePlayerHold`, `activeNudges`, `withEssenceSpend`) | **preserve** — read-only reuse, from a script |
| Twilight outcome read (`firstFate`, `mandateState`, `doomClock`) | **preserve** — read-only |

No cross-system write is added.

## Wiring

> See checklist: Docs/plans/wiring-checklist.md — one new offline script, outside the tick loop; every runtime row is "none".

| Module | Orchestrator phase | UI | GameState flow | Traces | Debug | Prose | Player controls |
|---|---|---|---|---|---|---|---|
| `scripts/agency-census.ts` | none (drives `runTick` from outside) | none | reads only; the script's own copy of state | none | console + JSON | none | none |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `AGENCY_COMPARE_TICK` | 800 | Tick at which the headline is read (or the age's end, if sooner) |
| `AGENCY_MANDATE_DELTA` | 0.10 | Mandate progress gap that counts as different (H4) |
| `AGENCY_END_TICK_DELTA` | 90 (one season) | Two same-kind endings this far apart count as different (H1) |
| `AGENCY_MIN_HEADLINE_DIFFS` | 1 | Headline differences for "the player mattered" on a seed |
| `AGENCY_SEEDS` | 42, 99, 7 | The three seeds (the purse census's set) |
| `AGENCY_WARM` / `AGENCY_TICKS` | 300 / 900 | Warm-up length; run length per arm (the age ends first, at 820–880) |
| `AGENCY_MAX_PARALLEL` | 4 | Arms run at once by `--all`; seven at once slowed each about eightfold |

## Tracing

N/A — no new trace type. The census prints one JSON line per arm (held steps, cards played, essence spent,
the end state) and one verdict line per seed naming each headline difference. That is the inspectability
surface (NFP 2).

## Fail-soft table

| Failure | Behaviour |
|---|---|
| Hand build throws on a step | The step is released with no card in both arms (counted in `heldSteps`) |
| A hand-run arm hits its time budget | It stops, records `stopReason: budget`; `--compare` reports that seed as "not measured" rather than compare an end point set by the clock |
| A child arm crashes under `--all` | Its log is kept; that seed reads "not measured"; the other arms finish |
| A result file is missing | `--compare` reports that seed as "not measured"; the KPI is over measured seeds |
| No First bonded | Fate reads `none`; the other four outcomes still compare |

## Files touched

Create `scripts/agency-census.ts`, `scripts/__tests__/agency-census.test.ts`; edit `package.json`
(one script line). No `src/` file changes.

## Done when

- [ ] `npm run census:agency -- --all --out-dir .cache/agency`, launched in the background, runs the six arms on
  `main` and prints one verdict line per seed plus the KPI line. `--compare` on the written files reprints it
  in the foreground in under a minute.
- [ ] Two hands-off runs on seed 42 compare with **0** headline differences and chapter overlap 1.00 (noise floor).
- [ ] The unit test covers `agencyVerdict`: identical inputs → 0 differences; each of H1–H5 flipped alone → 1.
- [ ] The PR body pastes the three-seed verdict on its own `main` and the baseline table above for comparison.
- [ ] `npm run gate` passes on the code track. No Engine-path file is touched, so no review-gate.

## Kill criteria

If the noise floor is not zero (two hands-off runs differ), determinism is broken on the seeded route. Stop,
file it as a bug against NFP 3, and do not publish a KPI until it is fixed.

- **Too sensitive:** once the random-play arm exists, if it and the greedy arm both differ from hands-off on
  every seed by the same outcomes, the headline is reading perturbation, not policy. Re-fit
  `AGENCY_MANDATE_DELTA` / `AGENCY_END_TICK_DELTA` before quoting the KPI again.
- **Too coarse:** if a sibling ticket ships and a played run visibly changes how the age ends (a playtest or an
  expert session says so) while the KPI still reads 0/3, the five headline outcomes miss what changed. Revisit
  the set before the next sibling is judged by it.

## Coordination block

**Suggested model:** sonnet — a promotion of a working proto script plus one pure-function test.
**Parallel-safe with:** [THR-2201](https://linear.app/threadbare/issue/THR-2201), [THR-2207](https://linear.app/threadbare/issue/THR-2207), [THR-2208](https://linear.app/threadbare/issue/THR-2208), [THR-2211](https://linear.app/threadbare/issue/THR-2211), [THR-2212](https://linear.app/threadbare/issue/THR-2212): they touch `src/`; this touches only `scripts/` and one `package.json` line.
**Mutex with:** `package.json` `scripts` block. A census added by THR-2201 (`census:essence-scarcity`) lands on adjacent lines; merge, do not overwrite.

**Files to touch:** `scripts/agency-census.ts` (new), `scripts/__tests__/agency-census.test.ts` (new), `package.json` (one line). No `src/` file, so no interface-map, contract or wiki edit.

## Notes for the executor

- Bundle with esbuild as the siblings do; the plain strip-types path cannot load the engine's extensionless
  imports. `--all` uses `child_process`: add `--external:child_process`, as `census:bounties` does.
- The proto writes `--compare` before the world build, but the bundle still loads the engine's data
  modules (about 20 s). Acceptable; do not split the file to save it.
- First extension, not this slice: a seeded random-play arm, once a headline difference appears.

## Intent-judge verdict

**Allow** (one run, 2026-11-13, impact class Reversible confirmed). Eleven dimensions PASS or N/A. One GAP on
dimension 10: the kill criteria covered only the noise floor. Fixed: § Kill criteria gained "too sensitive"
and "too coarse".

## Forked-audit verdicts

**NFP auditor:** PASS-with-notes. 1, 4, 5, 6, 7 PASS. 2: tracing is N/A, and the JSON and verdict line are the
inspectability surface. 3: a wall-time `--budget-s` stop could make an arm's end depend on machine speed.
Fixed: `--all` passes no budget, and a budget-stopped arm reads "not measured".

**Pillar auditor:** PASS. Engine present and substantive (an offline script with a pure verdict function);
Content and UI N/A with rationale; Wiring is a deliberate no-integration entry; the substrate inventory
extends existing pieces and duplicates no inventory subsystem.

**Vision auditor:** PASS. `npm run vision-audit` ran clean. No contradiction: the census changes no tick,
card, text or screen, leaves forks to the mortal, and tests "different, never better" (Law 32).

## Three-pillar check

- [x] Engine: one offline census over the engine, a pure verdict function and its test; no tick change
- [x] Content: N/A, with reason (no player text, template or table)
- [x] UI: N/A, with reason (nothing a player sees changes)
- [x] Wiring: an offline script; every runtime row is "none"

## Vision audit

- [x] The plan contradicts no Vision premise. It measures one: the north star's "the god shapes mortals'
  stories", read against Law 28 ("a decision at tick 47 should echo at tick 130"). The baseline says the echo
  does not reach the age's headline today.
- [x] Law 32 ("the game does not rank the player") is honoured: the predicate tests difference, never which
  ending is better. Law 11 is honoured: both arms leave every fork to the mortal.

## Rulebook impact

- [x] No rule of play changes; the census only reads the game.
- [x] `Docs/canon/rulebook.md` needs no edit.

> Brainstorm companion: `Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters-brainstorm.md`.

## NFP-compliance table

| NFP | Verdict | Note |
|---|---|---|
| 1. Tunability | PASS | Every threshold is a named constant above |
| 2. Inspectability | PASS | The verdict names each differing outcome; per-arm JSON holds the snapshots |
| 3. Determinism | PASS | Fixed seeds; the noise-floor run is part of Done-when |
| 4. Fail-soft | PASS | See the fail-soft table; the census never touches the live tick loop |
| 5. Narrative over mechanics | PASS | The headline is story-level: the ending, the First's fate, the climax |
| 6. Additive | PASS | One new script and one npm line |
| 7. Performance budget | PASS | Arms run in the background (about 35 min for the set); no runtime cost to the game |
