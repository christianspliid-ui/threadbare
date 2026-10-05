# Why mortals choose outside the forecast window (THR-1689)

**Ticket:** THR-1689 · **Program:** forecast window (THR-1582), content above novice (THR-1627) · **Measured on:** `main` after THR-1687 (`CAP_FILL_LOCAL_ORDER = 'template_hash'`), 2026-10-05 · **Evidence:** CLI/headless only (THR-688 rule C).

**Raw output:** `Docs/audits/2026-09-25-living-world-data/output/out-of-window-2026-10-05-thr1689.txt`
**Reader:** `Docs/audits/2026-09-25-living-world-data/readers/out-of-window.ts`, built by `out-of-window.build.mjs`

## The question

Mortals are meant to take on work they forecast winning 50–65% of the time. Fewer than half their free choices land there. THR-1687 fixed the shortlist that hid expert content, and the share did not rise. This audit asks which out-of-window choices mortals make, and whether each one is *choice* (an in-window option was there and lost) or *availability* (nothing in-window was on offer).

## Short answer

**It is choice, not availability.** Of 1,025 out-of-window free choices on seeds 42, 99 and 7, an in-window encounter was genuinely missing from the scorer's list in only 97 (9.5%). The out-of-window choices split into four groups that don't overlap:

| Group | Choices | Share | What is happening |
|---|---:|---:|---|
| **Branching quests at near-certain odds** | 319 | 31% | Quests are exempt from the window's "too easy" discount, so a quest the mortal is sure to win (forecast ~0.95) competes at full strength |
| **Inside the mortal's own window** | 224 | 22% | The board shifts each mortal's window for courage and recent failures. The KPI judges against the fixed 0.50–0.65 window |
| **Just past an edge** | 407 | 40% | Fit still ≥ 0.5. The winner beat an in-window option on value and desire |
| **Deep outside** | 75 | 7% | Fit < 0.5 |

**One counterfactual probe** (built only for this measurement, never shipped) removed the quest exemption. The in-window share rose from **0.452 to 0.506**, experts tried harder work, and the master band stopped succeeding above the others. Nobody went idle.

## How it was measured

- **World:** the `gameplay-report` world (random archetype, balanced cosmology, medium map), 120 ticks, seeds 42, 99, 7 — the run that produces the KPI table's in-window share.
- **Commits:** every encounter commit stamp the engine writes (`stampEngagementCommit`), captured by swapping a recording `Map` into `runtime.engagementLedger.stamps`. The reader recorded exactly the ledger's count on every seed (629 · 587 · 656).
- **The board behind each commit:** joined to the same mortal-tick's `engagement_decision` and `decision_board_comparison` traces (100% joined, 0 traces dropped). The build patches `BOARD_TRACE_TOP_N` so the traces carry the whole board rather than its top 5. It also adds a read-only hook that hands over the encounter scorer's **full** ranked list (up to 40), because the board only ever sees the scorer's top 5 encounters (`scored.slice(0, 5)` in `scoreAndSelect`).
- **Behaviour-neutral:** an untraced arm on the same seeds gives a byte-identical ledger (in-window 0.4610 · 0.4327 · 0.4619 both ways).
- **"In window"** below always means the fixed `[ENGAGE_WINDOW_LOW, ENGAGE_WINDOW_HIGH]` = [0.50, 0.65], which is what the KPI judges.

## Findings

### 1. By band and side of the window

| Decider band | Free choices | In window | Below | Above | Above at ≥ 0.75 |
|---|---:|---:|---:|---:|---:|
| novice | 661 | 50.4% | 19.5% | 30.1% | 81 |
| journeyman | 626 | 52.6% | 12.6% | 34.8% | 66 |
| expert | 362 | 37.3% | 12.4% | 50.3% | 103 |
| master | 223 | 22.4% | 10.8% | 66.8% | 103 |

The higher the band, the more choices go **above** the window. 46% of out-of-window choices sit within 0.05 of an edge. The median distance is 0.08 above the window and 0.035 below it.

### 2. Kind of work: sure things vs gambles

- **Near-certain encounters (forecast ≥ 0.75, where the window's fit has bottomed out): 353 of 1,025 (34%).** 309 of them are branching quests, which carry the too-easy exemption. The top fifteen are all reputation/quest templates (`reputation.eye.the_oracle_consulted` ×26, `reputation.star.the_star_pilgrim` ×21, `eye.reckoning.verdict_that_burns` ×18, …).
- **Masters:** 94 of their 223 free choices (42%) are exempt quests above the window. **Experts:** 94 of 362 (26%).
- **Surveys and harvests do not touch the share.** The 2026-10-01 lead was that sure-thing undertakings are scored as dice rolls. They are, but the ledger stamps **encounters only**, so no undertaking enters the in-window share either way. Undertaking wins over the three seeds were 109: 36 `certain` (held-lead surveys, THR-1686), 56 in, 12 above, 5 below.
- **The rest by encounter kind:** explore, trade, assist, lead, create and steal each run 34–51% out-of-window, close to the overall rate. No single kind of everyday work is the problem.

### 3. Was an in-window option on offer?

| Decider band | Out-of-window | In-window encounter on the board | Only an in-window undertaking | None on the board |
|---|---:|---:|---:|---:|
| novice | 328 | 64.3% | 0.6% | 35.1% |
| journeyman | 297 | 76.4% | 8.8% | 14.8% |
| expert | 227 | 66.5% | 7.0% | 26.4% |
| master | 173 | 72.3% | 3.5% | 24.3% |

- **On the board and lost (714):** the best in-window encounter's median rank was 2. The winner outscored it by a median **2.5×**, mostly on **value per tick (2.0×)** and **desire (1.5×)**. Value per tick was the biggest single term in 397 cases, desire in 292, an arrival or appointment pull in 25.
- **Not on the board (311):** in 214 of these an in-window encounter **was** in the scorer's full list, at median rank 7. It was outscored at the scorer stage by the same terms and never reached the board's top 5. Widening the board's slice would not change these winners, because the scorer had already ranked them lower.
- **Genuinely absent: 97 (9.5% of out-of-window)**, mostly novices (47) — the only real availability gap.

### 4. Free choice vs compulsion

The share already counts free choices only (`freeChoice`). These unattended runs contain **no compulsions at all** (0 of 1,872 stamps), so compulsion is not part of the gap. An attended world with a god sending premonitions would be the place to look, and at most it would move the denominator.

### 5. "Experts succeed above the window" — choice, not overreach

Expert success reads 0.55 · 0.64 · 0.66 on these seeds (pooled 0.71 on 42 + 99 in THR-1688's runs). Split by forecast (resolved free choices, pooled):

| Band | Forecast bucket | n | Mean forecast | Success |
|---|---|---:|---:|---:|
| expert | 0.50–0.65 | 126 | 0.585 | 0.492 |
| expert | ≥ 0.75 | 89 | 0.950 | 0.989 |
| master | 0.50–0.65 | 46 | 0.585 | 0.543 |
| master | ≥ 0.75 | 91 | 0.950 | 0.923 |

Experts' and masters' in-window work succeeds at or **below** its forecast. Their high overall success comes from the near-certain quests mixed in, not from in-window work that proves too easy. (Experts' in-window success under forecast, 0.49 vs 0.585, is about 2 standard errors on n = 126. The probe arm reads 0.56 vs 0.585 on n = 171, which is within noise, so treat it as a lead, not a finding.)

### 6. Content band chosen

On `main` today no free choice lands on **master-band** content at all (window-fit band of the template's demanded difficulty). Masters pick novice-band content 69.5% of the time. THR-1688 (PR #2232, master everyday encounters) is not on `main` yet, so this re-measures once it lands. Mean step difficulty is also a weak proxy for multi-step templates: 36 of masters' 50 in-window commits are on novice-band templates, because the whole-action forecast `F` compounds over steps.

## The counterfactual: quests lose the too-easy exemption

This is a probe build only (`out-of-window-noquest.mjs`, patch on `encounterScoring.ts`), never shipped. Quests stay reachable (the outgrowth filter's own exemption is untouched, and that filter is off anyway since THR-1581), but they are discounted above the window like any other work.

| Seed | In-window share, shipped → probe | Quest commits | Expert mean attempted difficulty | Master success |
|---|---|---|---|---|
| 42 | 0.461 → **0.524** | 103 → 8 | 0.218 → 0.298 | 0.740 → 0.576 |
| 99 | 0.433 → **0.499** | 104 → 20 | 0.228 → 0.279 | 0.691 → 0.759 |
| 7 | 0.462 → **0.497** | 128 → 26 | 0.200 → 0.276 | 0.785 → 0.596 |

- **Idle stays at 0** (0.0014 · 0 · 0 → 0 · 0 · 0). Retry-after-failure stays at 0. The failure-streak p95 moves 4 → 5.
- **Undertakings pick up some of the slack:** wins go 109 → 160.
- **Journeyman success falls too** (0.665 · 0.641 · 0.637 → 0.516 · 0.593 · 0.594), so near-certain quests were padding every band, not only the top two.
- **Still short:** 0.506 pooled, below `KPI_IN_WINDOW_MIN` (0.60). The near-edge group grows (407 → 504), so the remaining gap is the window's ramps against the spread of value and desire.
- **Not measured:** the branching-fire KPI for threaded agents (`KPI_BRANCHING_FIRE_MIN_PER_30T`). The exemption's original reason (THR-452 / THR-465) was keeping branching quests firing for threaded agents. These unattended worlds have no threads, so that has to be measured in the attended world before anything ships.

A **second reading of the share** is possible with no behaviour change: measured against each mortal's *own* shifted window, it is **0.495** shipped and **0.547** with the probe. That is not a free lift. The shift moves both edges, so some static-in-window choices fall outside a shifted window.

## A note on the target

The ticket quotes the KPI floor as 0.50. In code `KPI_IN_WINDOW_MIN` is **0.60** (`src/engine/kpi/kpiConstants.ts`). 0.50 is the window's low edge (`ENGAGE_WINDOW_LOW`). The design request below works against 0.60.

## Recommendation — design request for the design lane

Filed as **THR-1740** (`Todo`, plan-doc Done-when, for the design lane). No tuning was done here. Three decisions, in the order the evidence ranks them:

1. **Do branching quests face the window like other work?** The exemption was written to keep quests *reachable*. In the window it makes them *preferred*: a near-certain quest is never discounted, so it wins on value. Recommended: keep quests reachable but let the too-easy discount apply (or a milder floor for quests, if narrative threads need a pull). The probe says +5.4 points of share, experts trying harder work, and band success levelling. **Gate before shipping:** the branching-fire KPI for threaded agents, measured in the attended world (`readers/attended.ts`).
2. **Which window does the KPI judge, and is the target still 0.60?** The board asks each mortal to stay inside its own shifted window. The gauge judges a fixed one. Decide which is the contract, and restate the floor against it. This is a gauge decision, not tuning.
3. **Are the ramps outside the window soft enough to matter?** In 70% of out-of-window choices an in-window option was on the board and lost by a median 2.5×, on value per tick and desire. The ramps run 0.10 wide above and 0.20 below, so a candidate at 0.67 keeps about 0.8 of its score. Either steeper ramps, or accept that theme and value outrank the window near its edges. This should be decided **after** 1 and 2, measured on the probe's baseline.

It also carries THR-1688's three skipped invariant rows in `engagementWindow.invariant.test.ts` (`TODO(THR-1689)`: masters attempt harder content than experts; the master band succeeds level; the expert band succeeds level). Decision 1 is the main reason the top bands succeed above the rest, and THR-1688's master content is what lets masters out-attempt experts.

## Re-running

```bash
node Docs/audits/2026-09-25-living-world-data/readers/out-of-window.build.mjs
node .cache/out-of-window.mjs 42,99,7 120            # shipped, whole board, ~1 min
node .cache/out-of-window.mjs 42,99,7 120 --no-trace # neutrality check
node .cache/out-of-window-noquest.mjs 42,99,7 120    # the quest-exemption probe
```

`--json <path>` writes every commit row with its board join.
