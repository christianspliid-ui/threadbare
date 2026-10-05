> **title:** Forecast window re-plan — quests face the window (threaded mortals excepted), the gauge judges the mortal's own window, and sure things stop paying twice — THR-1740
> **linear_issue:** THR-1740
> **author:** Claude Code (design lane, run 2026-10-05c, decided under delegation — process.md rule 4)
> **created:** 2026-10-05
> **three_pillars:** Engine done · Content N/A — no template, prose or data-table change; the master-content gap is routed to its own ticket · UI N/A — no player-facing surface; the gauge is headless and its debug accessor is unchanged

# Forecast window re-plan — THR-1740

Mortals are meant to take on work they would win about half the time, and today under half their free choices do. This plan decides the three questions [THR-1689's audit](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/audits/2026-10-05-thr-1689-out-of-window-choices.md) left open, measured on `main` `e2f765fc` (after THR-1688's master content) across six arms in both the unattended and the attended world.

## Why this is load-bearing

Christian's ruling (THR-1575, 2026-09-24): a mortal engages a challenge it forecasts at about 50–65%, and who the mortal is decides which ones. The window shipped (THR-1581/1582), but the gauge still reads 0.455 in-window against a 0.60 floor, and five rows of the level-success invariant (`src/engine/__tests__/engagementWindow.invariant.test.ts`) sit skipped waiting on this answer. THR-1689 showed it is **choice, not availability**: an in-window option was on offer in 90% of the out-of-window choices and lost. Until this lands, the top bands keep succeeding above level (expert 0.683, master 0.699 pooled on `main`) because they pad their record with near-certain work, which is the opposite of *tension* and *progression* in the ruling's four goals.

**Decided by delegation** (design lane, 2026-10-05; Christian vetoes in chat): all three decisions below. None changes what the game *means*: each implements the 2026-09-24 ruling more faithfully, and a threaded mortal's branching quests are scored exactly as shipped (its other work takes the same changes as everyone's). Decision 2 restates a gauge floor that was a plan starting value, not a director ruling; it is called out for veto.

## The measurement (baseline and arms)

**Reader:** `Docs/audits/2026-09-25-living-world-data/readers/window-replan.ts`, built per arm by `window-replan.build.mjs` (build-time patches, never shipped). It runs the `gameplay-report` world (unattended) and the `?view=game&seeded&size=medium` world (attended, `readers/attended.ts` setup) on seeds 42 · 99 · 7 × 120 ticks and reports `computeGameplayKpiReport`. The same arms ran through THR-1689's `out-of-window` reader for the own-window share. **Raw output:** `Docs/audits/2026-09-25-living-world-data/output/window-replan-2026-10-05-thr1740.txt`.

Re-run:

```bash
node Docs/audits/2026-09-25-living-world-data/readers/window-replan.build.mjs
node .cache/window-replan-main.mjs 42,99,7 120            # both worlds, gameplay KPI
node .cache/out-of-window.mjs 42,99,7 120                 # own-window share (build: out-of-window.build.mjs)
```

**Re-measure check (Done-when 1).** The `main` arm reproduces `out-of-window.mjs` exactly on the unattended seeds (in-window 0.471 · 0.427 · 0.480 both ways), so the two readers agree.

Pooled over six runs (3 seeds × 2 worlds). Success and attempted difficulty are engagement-weighted per band.

| Arm (probe) | In-window (static) | Own-window¹ | Success nov / jour / exp / mas | Attempted difficulty nov / jour / exp / mas | Exp > jour | Mas > exp | Branching fires /30t (min of 6) | Threaded-agent branching fires (sum) |
|---|---:|---:|---|---|---:|---:|---:|---:|
| `main` (shipped) | 0.455 | 0.515 | 0.610 / 0.624 / **0.683** / **0.699** | 0.100 / 0.208 / 0.230 / 0.219 | 4/6 | 2/6 | 24.25 | 5 |
| `noquest` — quests lose the too-easy exemption | 0.493 | 0.546 | 0.561 / 0.613 / 0.578 / 0.610 | 0.119 / 0.223 / 0.287 / 0.269 | 6/6 | 1/6 | 4.00 | 1 |
| `questfloor` — quests ride the ramp, floor 0.50 | 0.477 | 0.515 | 0.561 / 0.621 / 0.616 / 0.691 | 0.109 / 0.220 / 0.278 / 0.223 | 6/6 | 0/6 | 13.25 | 1 |
| `noquest_below` — + refuse edge 0.30 → 0.40 | 0.511 | 0.555 | 0.575 / 0.607 / 0.659 / 0.698 | 0.116 / 0.216 / 0.263 / 0.266 | 6/6 | 2/6 | 5.50 | 1 |
| **`noquest_neutral` — + odds-neutral value above the midpoint** | **0.510** | **0.552** | **0.544 / 0.592 / 0.603 / 0.628** | 0.124 / 0.234 / 0.279 / 0.269 | **6/6** | 2/6 | 4.00 | 0 |
| `noquest_both` — + too-easy edge 0.75 → 0.70² | 0.537 | 0.601 | 0.542 / 0.605 / 0.610 / **0.719** | 0.117 / 0.223 / 0.268 / 0.246 | 6/6 | 1/6 | 4.50 | 0 |

¹ Own-window share from the `out-of-window` reader, unattended seeds only, computed from each run's `--json` commit rows (`inOwnWindow`); per-seed lines are in the raw output's "Own-window share" block (chosen arm: 0.557 · 0.555 · 0.546).
² `ENGAGE_TOO_EASY_AT` 0.70 is outside the constant's documented `@range 0.75–0.95`; measured only to bound decision 3.

**The threaded-mortal check (added after the intent judge's escalation).** Threaded-agent fires are few per run, so they were re-measured on **six attended seeds** (42 · 99 · 7 · 4 · 8 · 13 × 120 ticks). Two more arms keep the shipped behaviour for a mortal threaded to the god: `threadonly_neutral` keeps the quest exemption for threaded mortals only, and **`threadkeep`** also leaves their quests out of the odds-neutral scale. Unattended worlds have no thread edges, so both arms equal `noquest_neutral` there; the rows below are attended only.

| Arm (attended, 6 seeds) | Mean in-window (static) | Threaded-agent branching fires (sum, per seed) | All branching fires /30t (min) |
|---|---:|---|---:|
| `main` | 0.451 | **9** (2 · 3 · 0 · 1 · 2 · 1) | 26.75 |
| `noquest_neutral` | 0.500 | 0 (0 · 0 · 0 · 0 · 0 · 0) | 3.00 |
| `threadonly_neutral` | 0.516 | 3 (1 · 1 · 0 · 0 · 0 · 1) | 3.75 |
| **`threadkeep`** | **0.519** | **11** (1 · 2 · 3 · 1 · 3 · 1) | 3.75 |

Every arm holds idle ≤ 0.005, `retry_after_failure_rate` 0, failure-streak p95 ≤ 6 (`KPI_FAILURE_STREAK_P95_MAX` 4 is already exceeded on `main` at 5; see Grey zones), template entropy ≥ 0.916 and top share ≤ 0.045. **No arm reaches 0.60 on the static window.**

## Decisions

### Decision 1 — Branching quests face the window like any other work, except for a mortal threaded to the god

**Decision.** Remove the too-easy exemption from the window's fit for every mortal **not threaded to the ascendant**. Such a mortal's near-certain branching quest is discounted like any other work beneath it. A **threaded** mortal's quests are scored exactly as shipped: they keep the exemption and are left out of Decision 3's odds-neutral scale. Every quest **stays reachable** and keeps its other pulls: the outgrowth-filter exemption (`encounterFilterPipeline.ts:600`), the cap reserve (`BRANCHING_CAP_RESERVE` 3) and the branching curator's ×1.75 lift (`branchingCurator.ts`).

**Why.** The exemption was written to keep quests *reachable* for the mortals whose stories the player follows: THR-452/465 tuned branching fires for threaded agents, and `BRANCHING_TARGET_FIRE_PER_30T`'s own comment says "per threaded agent". For everyone else, in the window it made quests *preferred*: a quest at forecast 0.95 competes at fit 1 and wins on value. Removing it for unthreaded mortals is the single largest lever measured: +0.038 in-window, every expert-over-journeyman rung holds (4/6 → 6/6), and master success falls from 0.699 to 0.610.

**Why the threaded carve-out.** The first draft removed the exemption for everyone. The intent judge escalated it: on the attended world, The First's branching quests went from a handful per run to **zero on all six seeds**. Branching quests are the only authored multi-choice content, and the threaded mortal is where the player meets them. Two agreed outcomes collided there (THR-1575's window, and THR-452/465's quest flow for threaded mortals). The carve-out keeps both, so neither has to give: The First's quest fires hold (9 → 11 across six seeds), and the window's gains for everyone else are unchanged (attended in-window 0.451 → 0.519). Threaded mortals are a handful against hundreds; they barely move the gauge.

**The gate the ticket asked for, measured and met on both readings.**
- **Threaded-agent branching fires** (the ticket's population), attended world, six seeds: 11 under the chosen design against 9 on `main`.
- **`branching_fire_per_30t`** (the coded KPI, every mortal) ≥ `KPI_BRANCHING_FIRE_MIN_PER_30T` (1) on every seed in both worlds: minimum 3.75 attended, 4.00 unattended.

**What it costs, stated plainly.** All-mortal branching fires fall about 80% (24–28 → 4–9 per 30 ticks). What is lost is mostly unthreaded masters re-running reputation quests they cannot fail (`reputation.eye.the_oracle_consulted` alone was 25 near-certain commits on `main`). These are mortals the player is not following.

**Options weighed.**
- **Remove the exemption for everyone** (`noquest_neutral`): The First's quest fires go 9 → 0. Rejected; this was the escalation.
- **Keep the exemption for threaded mortals but scale their value** (`threadonly_neutral`): 9 → 3. Rejected for the same reason.
- **A quest floor for everyone** (`questfloor`, quests ride the ramp but never below 0.50): keeps about half of all branching fires but buys only +0.022 in-window, keeps master success at 0.691 and loses the master-over-expert rung everywhere (0/6). Rejected; it preserves the padding the decision exists to remove.

### Decision 2 — The gauge judges the mortal's own window; the floor is "most"

**Decision.** The in-window KPI judges each free choice against **the window the mortal actually used**: `[ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH]` shifted by courage and setbacks, exactly as `computeEngagementFit` computed it at commit. `KPI_IN_WINDOW_MIN` is restated from **0.60 to 0.50**: most free choices sit in the mortal's own window. The static-window share stays reported, labelled as such, for continuity.

**Why the own window.** The shift is part of the ruling's design, not noise around it. Courage is "who a mortal is should count a lot"; the setback shift is the guard against trap 2 (Christian, 2026-09-24: never recreate mortals who fail, get stuck and spiral). A gauge that counts a setback-shifted choice as a miss penalises the guard for working. On `main`, 24% of out-of-window choices are inside the mortal's own window, 166 of 237 of them under a setback shift.

**Why 0.50.** 0.60 was a starting value in the THR-1575 constants table ("starting values from the 2026-09-24 model … calibrate against the KPIs with the gauge"), not a director ruling. Christian's 2026-09-26 line is that these bands are "a constant we tweak as we search for a good game". The window is a *multiplier* by design ("desire, ambition, faction, reputation and resonance still decide *which*"), so some choices just past an edge are theme winning, which the ruling wants. The invariant row's own name is "most free choices are in-window". **The direct guard on tension is level success per band**, which this plan arms for all four bands (Decision 3). With all three decisions applied, the own-window share reads 0.546–0.557 per seed: it passes 0.50 with about 0.05 to spare, and it would fail 0.60.

**Would change the call.** Christian saying "keep 0.60". The executor then leaves the in-window row skipped against 0.60, and steeper ramps (the `noquest_both` arm, 0.601 own-window) become the next design question, at the cost of master success 0.719.

### Decision 3 — Sure things stop paying twice; the ramps stay

**This is a third option beyond the ticket's two** ("steeper ramps, or accept that value and theme outrank the window near its edges"). The measurement showed the edge contest is not between the window and theme, but between the window and the odds counted a second time inside value. Both listed options were measured and are weighed below.

**Decision.** Keep the window's ramps as shipped. Instead, make an encounter's **value odds-neutral above the window's midpoint**: when its engagement forecast `F` is above `ENGAGE_VALUE_ODDS_PIVOT` (the window midpoint, 0.575), its value per tick is scaled by `ENGAGE_VALUE_ODDS_PIVOT / F`. A threaded mortal's branching quests are excepted (Decision 1).

**Why.** THR-1689 found the winner beats the in-window option on value per tick (median 1.87×) and desire (1.39×). The reason for the value gap is structural. Value per tick is built on expected utility (`encounterScoring.ts:1303-1304`), which already weights each outcome's reward by its odds. So a near-certain encounter earns up to ~1.7× the value of an identical one at 0.575 *before* the window's fit is applied. The fit pulls one way and the value term pulls the other, and value wins. Under the ruling, odds decide whether a challenge is *acceptable* (the window), and theme decides *which* acceptable one. The odds should not earn extra value too. Below the midpoint nothing changes: long odds keep their full risk, and the rulebook says long odds are the god's to impose.

**Evidence.** `noquest_neutral` gives the most level success of any arm. The shipped design (`threadkeep`) equals it in the unattended world, which is the world the invariant test runs, because unattended worlds have no thread edges. There every band sits inside `[KPI_BAND_SUCCESS_MIN − tol, KPI_BAND_SUCCESS_MAX + tol]` on seeds 42/99 (expert 0.607 · 0.570; master 0.508 · 0.620). In the attended world `threadkeep` reads expert 0.634 · 0.540 and master 0.589 · 0.647 on seeds 42/99, also inside. Masters choose master-band content 8.6% of the time, up from 3.7%.

**Options weighed.**
- **Steeper ramps** (`noquest_below`, `noquest_both`) buy share: +0.018 and +0.044 over `noquest`. But `noquest_both` pushes `ENGAGE_TOO_EASY_AT` outside its documented range and lifts master success to 0.719, which breaks the level invariant the window exists for. `noquest_below` gives the same share as the chosen arm but leaves master success at 0.698.
- **Accept that value outranks the window near its edges** (the ticket's second option). Rejected because value per tick is not theme; it is mostly the odds counted a second time.
- **Odds-neutral value on undertakings too.** Not measured, so not decided. Undertakings are not in the in-window share (the ledger stamps encounters only), and they already gain board share under this change (undertaking wins in-window 48 → 100). See Grey zones.

## Substrate inventory

| Existing subsystem (inventory name) | Status | This plan |
|---|---|---|
| `engagement` — `engagementWindow.ts` (THR-1582) | 🟢 ACTIVE | **preserves** — the fit, ramps and shifts are unchanged; `exemptTooEasy` stays in the API, unused by the scorer |
| encounter scoring — `encounterScoring.ts` (`scoreAndSelect`) | 🟢 ACTIVE | **extends** — exemption off by flag; odds-neutral value term; the candidate carries its window edges |
| `kpi` — `engagementKpi.ts`, `gameplayKpi.ts`, `kpiConstants.ts` (THR-1578) | 🟢 ACTIVE | **extends** — own-window share counted alongside the static share; the threshold row switches basis |
| `decision` — `decisionBoard.ts` | 🟢 ACTIVE | **preserves** — reads `valuePerTick` and `engagementFit` from the candidate; no change |
| branching — `encounter/branchingConstants.ts`, `branchingCurator.ts`, cap reserve in `encounterFilterPipeline.ts` | 🟢 ACTIVE | **preserves** — outgrowth exemption, cap reserve and curator lift untouched |
| agent decision — `phaseAgentDecision.ts` (commit stamp, `engagement_decision` trace) | 🟢 ACTIVE | **extends** — the stamp carries the window edges the scorer used |

Runtime population consumed: free-choice encounter commits, 1,823 (`main`) to 2,015 (chosen arm) across three unattended seeds × 120 ticks.

## Engine pillar

### Systems design

1. **Quest exemption scoped to threaded mortals (Decision 1).** New constant `BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE: 'all' | 'threaded' | 'none' = 'threaded'` in `encounter/branchingConstants.ts` (`'all'` is today's behaviour). In `scoreAndSelect`, compute once per decision pass `isThreaded = graph.getIncomingEdges(agentId, 'thread').length > 0` (the same edge `encounterScoring.ts:543` already reads for divine hunches), then `questKeepsShipped = entry.isQuestEncounter === true && (scope === 'all' || (scope === 'threaded' && isThreaded))`. `encounterScoring.ts:1502` passes `exemptTooEasy: questKeepsShipped`. `BRANCHING_QUEST_SKIP_OUTGROWTH` stays `true` and keeps governing only the outgrowth filter (`encounterFilterPipeline.ts:600`). The trace site that stamps `exempt: 'too_easy'` (`phaseAgentDecision.ts:243`) uses the same predicate (carry `questKeepsShipped` on the candidate), so the trace never claims an exemption that did not apply.
2. **Odds-neutral value (Decision 3).** In `scoreAndSelect`, after `valuePerTick` is computed (`encounterScoring.ts:1304`):
   `oddsNeutralScale = ENGAGE_VALUE_ODDS_NEUTRAL && !windowBypassed && !questKeepsShipped && isFinite(F) && F > ENGAGE_VALUE_ODDS_PIVOT ? ENGAGE_VALUE_ODDS_PIVOT / F : 1`,
   and `valuePerTick *= oddsNeutralScale`. It applies only where the window applies (free choice). Appointments, seeded and forced arrivals, lair fights, debug spawns and The First's meeting bypass both. `ScoredCandidate` gains `oddsNeutralScale: number` (additive), so the board's `evt` already carries the scaled value and every downstream reader agrees.
3. **Own-window gauge (Decision 2).** `ScoredCandidate` gains `engagementWindowLow` / `engagementWindowHigh` from `engagementFitResult`. `EngagementStamp` gains optional `windowLow?` / `windowHigh?`, written at the commit stamp (`phaseAgentDecision.ts:1759`) from the selected candidate. `stampEngagementCommit` counts `inOwnWindowCommits` (a free choice whose `forecast` lies in `[windowLow, windowHigh]`; a stamp without edges falls back to the static window). `EngagementKpiReport` gains `ownWindowShare`, keeps `inWindowShare` (static), and `gameplayKpi.ts:541` evaluates `own_window_share` against `KPI_IN_WINDOW_MIN`. The static row is still printed, as information.

**Blast radius check (no section owed).** Importers, by grep for `from '…/<module>'` across `src/` and `scripts/` on `e2f765fc`: `encounterScoring` 28, `agent-behavior-constants` 68, `kpiConstants` 10, `engagementKpi` 9, `engagementWindow` 4 (unchanged). `phaseAgentDecision.ts` and `encounter/branchingConstants.ts` are edited at call sites only. None reaches 100, and `src/types/trace.ts` is deliberately not edited.

### Graph nodes / edges

None. All changes are runtime structures (`ScoredCandidate`, `EngagementStamp`, the KPI ledger).

### Tick phases

Unchanged: agent decision (`phaseAgentDecision`) → scoring (`scoreAndSelect`) → board (`scoreUnifiedBoard`) → commit stamp.

### Resolution logic

The roll is untouched. Only the choice changes: one multiplier on value per tick above the pivot, and one exemption narrowed to threaded mortals.

### PRNG callouts

None. Every new term is deterministic arithmetic (NFP #3).

## Content pillar

Content: N/A. No template, prose table or data-table change. The masters-attempt-harder-than-experts rung fails on every arm (≤ 2/6), because masters still choose master-band content under 9% of the time: eight master everyday templates against hundreds of novice ones. That is content volume, owned by [THR-1627](https://linear.app/threadbare/issue/THR-1627)'s program; this plan routes the rung to its own Deferral ticket, [THR-1742](https://linear.app/threadbare/issue/THR-1742) (Done when).

## UI pillar

UI: N/A. No player-facing surface changes. The in-window gauge is a headless KPI (`npm run gameplay-report`). `window.__DEBUG.getEngagementVerdicts` keeps its shape, and `engagement_decision` traces keep their fields (`exempt` now appears only on a threaded mortal's quests). Browser-verify is not owed; evidence is CLI/headless (THR-688 rule C).

## Wiring

> See checklist: Docs/plans/wiring-checklist.md

| Module | Orchestrator phase | UI component | GameState field | Trace emitted | Debug visibility |
|---|---|---|---|---|---|
| `encounterScoring.ts` (exemption scope, odds-neutral scale, window edges and `questKeepsShipped` on the candidate) | agent decision → `scoreAndSelect` | none | none (runtime `ScoredCandidate`) | `decision_board_comparison` `evt` carries the scaled value | `getEngagementVerdicts` (unchanged) |
| `phaseAgentDecision.ts` (stamp window edges; exempt-trace flag) | agent decision, commit | none | `runtime.engagementLedger` | `engagement_decision` (unchanged shape) | `getEngagementVerdicts` |
| `kpi/engagementKpi.ts` (`inOwnWindowCommits`, `ownWindowShare`) | KPI report | none | `runtime.engagementLedger` | none | `gameplay-report` CLI |
| `kpi/gameplayKpi.ts` (threshold row basis) | KPI report | none | none | none | `gameplay-report` CLI |

Interface map: the 🟢 LIVE contract `engagement-forecast-gates-choice` is **extended**: the free-choice score now also carries `oddsNeutralScale`, and only a threaded mortal's quests stay exempt. Update its row in `Docs/canon/interface-map.md` and its entry in `scripts/interface-contracts.ts` in the same PR. No new cross-system read or write.

## Interface impact

| Contract | Disposition | Note |
|---|---|---|
| `engagement-forecast-gates-choice` (Encounters → Encounters) | **extend** | value scaled above the pivot; quest exemption scoped to threaded mortals; candidate carries window edges |
| Engagement ledger → KPI report (`engagementKpi.ts`) | **extend** | `ownWindowShare` added; `inWindowShare` kept |
| Branching reachability (outgrowth exemption, cap reserve, curator) | **preserve** | untouched |

## Constants table

| Constant | Default | Purpose |
|---|---|---|
| `BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE` (new, `branchingConstants.ts`) | `'threaded'` | Whose branching quests keep the shipped scoring (too-easy exemption, no odds-neutral scale): `'all'` (today), `'threaded'` (mortals threaded to the ascendant), `'none'` (Decision 1) |
| `BRANCHING_QUEST_SKIP_OUTGROWTH` | `true` (unchanged) | Now governs only the outgrowth filter's exemption |
| `ENGAGE_VALUE_ODDS_NEUTRAL` (new, `agent-behavior-constants.ts`) | `true` | Switch for the odds-neutral value term (Decision 3) |
| `ENGAGE_VALUE_ODDS_PIVOT` (new) | `(ENGAGE_WINDOW_LOW + ENGAGE_WINDOW_HIGH) / 2` = 0.575 | Forecast above which an encounter's value stops growing with its odds. @range 0.50–0.65 |
| `KPI_IN_WINDOW_MIN` (`kpiConstants.ts`) | **0.50** (was 0.60) | Min share of free choices inside the mortal's **own** window (Decision 2) |
| `ENGAGE_REFUSE_BELOW`, `ENGAGE_BELOW_FIT_MIN`, `ENGAGE_TOO_EASY_AT`, `ENGAGE_TOO_EASY_FIT` | unchanged (0.30 / 0.10 / 0.75 / 0.10) | The ramps stay (Decision 3) |

## Tracing

No new trace type; `src/types/trace.ts` is not edited. `EngagementDecisionTrace.exempt` is emitted only for a threaded mortal's quests; the field stays in the type (NFP #6). The board's `decision_board_comparison` entries report `evt` after the odds-neutral scale. The candidate's `oddsNeutralScale` is on `ScoredCandidate` for any reader that wants to explain *why* a sure thing lost:

```ts
// ScoredCandidate (encounterScoring.ts) — additive
/** THR-1740: value-per-tick multiplier above ENGAGE_VALUE_ODDS_PIVOT (1 at or below it, when the window is bypassed, or when questKeepsShipped). */
oddsNeutralScale: number;
/** THR-1740: a branching quest scored as shipped because of BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE (threaded mortal). */
questKeepsShipped: boolean;
/** THR-1740: the window `computeEngagementFit` used (after courage and setback shifts); NaN when bypassed. */
engagementWindowLow: number;
engagementWindowHigh: number;

// EngagementStamp (kpi/engagementKpi.ts) — additive, optional
windowLow?: number;
windowHigh?: number;

// EngagementKpiReport — additive
ownWindowShare: number;
```

## Fail-soft table

| Failure | Behaviour |
|---|---|
| `F` NaN / non-finite | `oddsNeutralScale` 1, today's value |
| Window bypassed (not a free choice) | `oddsNeutralScale` 1; window edges NaN; stamp carries no edges |
| Stamp has no window edges (older ledger, bypass, throw) | Own-window count falls back to the static window for that stamp |
| `ENGAGE_VALUE_ODDS_PIVOT` ≤ 0 (bad tuning) | Treated as off (scale 1) |
| Thread-edge read throws | `isThreaded` false: the quest faces the window like an unthreaded mortal's |
| Unknown `BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE` value | Treated as `'all'` (today's behaviour) |
| `freeChoiceCommits` 0 | `ownWindowShare` 0, as `inWindowShare` today |

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every change is a named constant (scope, switch, pivot, KPI floor); the ramps stay tunable as before |
| 2. Inspectability | PASS | `oddsNeutralScale`, `questKeepsShipped` and window edges on the candidate; static and own-window shares both reported; arms reproducible from the committed reader |
| 3. Determinism | PASS | No PRNG; pure arithmetic and one edge read on existing state |
| 4. Fail-soft | PASS | See the fail-soft table; every new term defaults to today's behaviour |
| 5. Narrative over mechanical perfection | PASS | Theme still picks among acceptable work; a threaded mortal's quests are untouched; the change removes a mechanical bias (odds counted twice) |
| 6. Additive over destructive | PASS | New fields and constants only; `exemptTooEasy` and `BRANCHING_QUEST_SKIP_OUTGROWTH` kept; scope `'all'` restores today |
| 7. Performance budget | PASS | One multiply per scored candidate and one thread-edge read per decision pass |

## Three-pillar check

- [x] Engine pillar present (Systems design 1–3)
- [x] Content pillar N/A with rationale (no content change; the master-content rung goes to Deferral THR-1742)
- [x] UI pillar N/A with rationale (headless gauge, no surface; debug accessor unchanged; browser evidence not owed)
- [x] Wiring section connects them (interface-map row and `interface-contracts.ts` in the same PR)

## Vision audit

- [x] Serves the north star ("the player hesitates"): a mortal's own challenges sit at open odds more often, so a card is worth hesitating over.
- [x] Serves the 2026-09-24 ruling's four goals. **Tension:** level success in all four bands. **Progression:** expert attempted difficulty rises above journeyman on 6/6 runs (from 4/6). **Variety:** entropy ≥ 0.924, top share ≤ 0.040. **Theme:** desire and the other terms still choose among in-window work.
- [x] Does not recreate either trap: retry-after-failure 0 on every run; failure never touches reach.
- **Watch:** branching quests are the only authored multi-choice content. A threaded mortal keeps them exactly as shipped (fires 9 → 11 over six attended seeds); unthreaded mortals fire them about 80% less. Every quest stays reachable and keeps its curator lift.

## Rulebook impact

- [x] This plan does not change a rule of play. The rulebook line already reads "a mortal takes on challenges it forecasts at ~50–65%; skill decides which ones … long odds are the god's to impose" (`Docs/canon/rulebook-quick-reference.md`); this plan implements it more faithfully.
- [x] No `Docs/canon/rulebook.md` edit is owed. No glossary term changes; "own window" is plan vocabulary for `computeEngagementFit`'s shifted edges, not a new UL term.

> Brainstorm companion: `Docs/plans/2026-10-05-thr-1740-forecast-window-replan-brainstorm.md`.

## Slices

One slice, one PR (the three decisions are measured together, and the invariant rows depend on all three).

## Done when

- [ ] `BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE = 'threaded'` is wired at `encounterScoring.ts` (the fit and the odds-neutral scale) and at the `exempt` trace stamp in `phaseAgentDecision.ts`; `BRANCHING_QUEST_SKIP_OUTGROWTH` still gates only the outgrowth filter. Unit tests: a threaded mortal's quest at F 0.95 keeps fit 1 and scale 1; an unthreaded mortal's gets the too-easy fit and `pivot/F`; scope `'all'` reproduces today's scores.
- [ ] `ENGAGE_VALUE_ODDS_NEUTRAL` / `ENGAGE_VALUE_ODDS_PIVOT` scale `valuePerTick` above the pivot for free choices only. Unit tests: scale 1 at and below the pivot, `pivot/F` above it, 1 when bypassed, 1 for NaN `F`.
- [ ] `ownWindowShare` is counted from stamped window edges and evaluated against `KPI_IN_WINDOW_MIN` = 0.50; `inWindowShare` (static) is still reported. Unit test: a setback-shifted choice at F 0.47 inside `[0.45, 0.60]` counts as own-window and not as static.
- [ ] **Gate (Decision 1), two readings, both owed:**
  - Threaded-agent branching fires: `node .cache/window-replan-main.mjs 42,99,7,4,8,13 120 --modes attended` (rebuilt on the branch) sums to **at least `main`'s 9** across the six seeds.
  - `node .cache/window-replan-main.mjs 42,99,7 120` (both worlds) shows `branching_fire_per_30t ≥ KPI_BRANCHING_FIRE_MIN_PER_30T` on all six runs.
  - The PR body reports both against this plan's tables.
- [ ] **Invariant rows in `engagementWindow.invariant.test.ts`:**
  - *the expert band succeeds level* — un-skipped.
  - *the master band succeeds level* — un-skipped.
  - *experts attempt harder content than journeymen* — un-skipped, condition unchanged.
  - *most free choices are in-window* — re-armed on `ownWindowShare ≥ KPI_IN_WINDOW_MIN`.
  - *masters attempt harder content than experts* — stays `it.skip` with its `TODO` re-pointed to `TODO(THR-1742)` (Deferral, filed by the design lane).
  - No remaining `TODO(THR-1689)` or `TODO(THR-1740)` in the file.
- [ ] `npm run test:heavy` green; `npm run gameplay-report -- --seeds 42,99,7` pasted in the PR body.
- [ ] Interface map row `engagement-forecast-gates-choice` and `scripts/interface-contracts.ts` updated.

## Kill criteria

- If, with all three decisions in, **expert or master level success falls outside the tolerance on seed 42 or 99**, stop and post the gauge output on the ticket. Do not retune ramps, `ODDS_*` or `SIGMOID_*` to pass, and never add a floor or actor-scaled difficulty (THR-1575's standing rule).
- If **branching fires fall below 1 per 30 ticks** on any seed in either world, or **threaded-agent branching fires over the six attended seeds fall below `main`'s count**, stop and report with the `engagement_decision` traces for the branching candidates. Do not add a quest-specific bonus to the fit; that is a design change.
- If the own-window share falls **below 0.50** on seed 42 or 99, stop and report; that sends Decision 2 back to Christian.

## Grey zones / executor decisions

- **Threaded mortals play branching quests rarely, before and after.** `main` gives 9 fires in six attended 120-tick runs (about 0.4 per 30 ticks), short of `BRANCHING_TARGET_FIRE_PER_30T`'s 1 per 30 ticks *per threaded agent*. This plan holds that count (11 under the chosen design) and does not try to raise it. Report the counts in the PR body.
- **Undertakings keep odds-weighted value.** Their EVT (`decisionBoard.ts` `undertakingEVT`) multiplies payoff by `advanceProbability`. Not measured under the odds-neutral term, so leave it. They are outside the in-window share and already gain board share under this change.
- **`KPI_FAILURE_STREAK_P95_MAX` (4) is already exceeded on `main`** (p95 5 on seed 99) and reads 4–6 across arms. It is an advisory row today. Report it; do not tune for it in this slice.
- **The `[EncounterEventNode] … Duplicate node ID` log line** seen once on `main` seed 42 is a caught, fail-soft event-node collision unrelated to this plan.

## Coordination block

**Suggested model:** opus — one PR moves the free-choice score for every mortal and re-arms five invariant rows behind kill criteria; it needs judgement on noisy per-seed numbers, not transcription.
**Parallel-safe with:** content-only tickets (encounter authoring under `src/data/encounters/`), UI tickets that do not touch `src/engine/`.
**Mutex with:** anything editing `encounterScoring.ts` `scoreAndSelect`, `engagementWindow.ts`, `kpi/engagementKpi.ts` or `engagementWindow.invariant.test.ts`, because all of them move the same gauge; and THR-1702 (found leads), which changes which held-lead surveys the board offers (`strategicActionCandidates.ts` `heldLeadRuinIds`) and so moves the same band and success baseline. Land one, re-baseline, then the other.

**Files to touch:**
- Edit: `src/engine/encounter/branchingConstants.ts` (`BRANCHING_QUEST_WINDOW_EXEMPT_SCOPE`)
- Edit: `src/data/agent-behavior-constants.ts` (`ENGAGE_VALUE_ODDS_NEUTRAL`, `ENGAGE_VALUE_ODDS_PIVOT`)
- Edit: `src/engine/encounterScoring.ts` (`scoreAndSelect`: scope predicate, odds-neutral scale, candidate fields)
- Edit: `src/engine/phaseAgentDecision.ts` (exempt-trace predicate at :243; window edges on the stamp at :1759)
- Edit: `src/engine/kpi/engagementKpi.ts` (`windowLow/High` on the stamp, `inOwnWindowCommits`, `ownWindowShare`)
- Edit: `src/engine/kpi/gameplayKpi.ts` (threshold row basis), `src/engine/kpi/kpiConstants.ts` (`KPI_IN_WINDOW_MIN`)
- Edit: `src/engine/__tests__/engagementWindow.invariant.test.ts` (four rows re-armed, one re-pointed to THR-1742)
- Edit: unit tests beside `encounterScoring` and `engagementKpi`
- Edit: `Docs/canon/interface-map.md`, `scripts/interface-contracts.ts`

## Notes for the executor

- `BRANCHING_QUEST_SKIP_OUTGROWTH` keeps its name and meaning (the outgrowth filter). Do not reuse it for the window; the new scope constant owns that.
- Read the thread edge as `graph.getIncomingEdges(agentId, 'thread')`, as `encounterScoring.ts:543` already does. Compute it once per `scoreAndSelect` call, not per candidate.
- The probe reader `Docs/audits/2026-09-25-living-world-data/readers/window-replan.ts` is the gate tool. Rebuild it on your branch (`node …/window-replan.build.mjs main`); its `main` arm then measures your change. Do not commit `.cache/`.
- Per-seed band success swings about ±0.06 at these sample sizes. Judge the invariant on seeds 42/99 as the test does; report seed 7 and the attended world without gating on them.
- Do not touch the ramps, `ODDS_*` or `SIGMOID_*`. If a row will not pass, the kill criteria say stop.

## Intent-judge verdict

**Allow** (round 3, fable, cold context; impact class Reversible confirmed).

- **Round 1 — Escalate.** The first draft removed the quest exemption for every mortal. On the attended world, The First's branching quests went to zero. The ticket's gate named threaded agents, and the draft had read it against all mortals. The lane answered by measuring the option the judge's escalation question named, keeping the shipped scoring for a threaded mortal's quests: `threadonly_neutral`, then `threadkeep`, on six attended seeds. It adopted `threadkeep` (threaded fires 9 → 11) and rewrote Decision 1 and both gate readings.
- **Round 2 — Revise.** Four accuracy gaps: a table mean (0.503 → 0.500), an over-claim about threaded mortals, Decision 3 evidence citing the wrong arm, and a stale constant name in the proposal. Also one contradicted line in the companion. All were fixed.
- **Round 3 — Allow.** No gaps; numbers re-verified against the raw output.

## Forked-audit verdicts

### NFP audit — PASS-with-notes

All seven NFPs PASS. Two notes:
- **#5:** unthreaded branching fires fall about 80%. The plan states this openly.
- **#6:** the default scoring changes for every unthreaded mortal, and the gauge's basis and floor move (0.60 static → 0.50 own window). It is additive in shape, and scope `'all'` restores today.

No action needed: both are the decisions themselves, carried as veto lines.

### Three-pillar audit — PASS-with-notes

- **Pillars:** Engine present and substantive. Content and UI are N/A with rationale.
- **Wiring:** adequate for a headless engine change.
- **Substrate:** inventory matched against `systems-inventory.md`; no green-field duplication.
- **Note:** the plan did not state its importer check for the conditional Blast Radius section. **Fixed:** a "Blast radius check" paragraph now lists the counts, all under 100.

### Vision audit — PASS-with-notes

No contradictions.
- **Confirmed:** north star ("the player hesitates"), non-negotiables #2, #6 and #7.
- **Extended:** core loop (threaded mortals' authored quests hold, 9 → 11) and design tension #2, systemic emergence vs authored moments (unthreaded quest fires fall about 80%, offset by the threaded carve-out).
- **Taste-profile note:** Decisions 2 and 3 are mechanical. They sit under narrative-over-mechanics and carry the veto path.

No action needed.
