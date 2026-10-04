# Why `start_local` fell when the fair draw was on — THR-1687 (design lane, 2026-10-04)

**Question.** The THR-1687 pickup built the fair own-hex draw (`CAP_FILL_LOCAL_ORDER = 'template_hash'`) and shipped it switched off, because its guard rail failed. On seed 42, 200 ticks, recorded `start_local` decisions fell 753 → 620 (−17.7% against a −10% bar), and strategic decisions fell 44 → 28 (seed 99: 104 → 38). Nobody could explain either drop. Busy mortal-ticks were flat and actions fired *rose*.

**Answer.**
- **The `start_local` drop is a crash in the bookkeeping, not lost work.** With the fair draw on, the planner begins *more* encounters (+5.4% on seed 42, +18.9% on seed 99). More of them belong to the unified-only catalogue. For those templates the planner throws after starting the encounter, and the decision record is never written. Filed as [THR-1722](https://linear.app/threadbare/issue/THR-1722).
- **The strategic drop is the decision board choosing encounters more often.** The board contests are the same number; strategic candidates simply win fewer of them, because better-fitting encounters now reach the board.

Decision taken on this evidence: [plan § D4](../plans/2026-10-01-thr-1687-cap-local-order.md#d4--the-flip-design-lane-run-2026-10-04a-decided-under-delegation-open-to-veto).

## Method

- **Branch:** PR #2180's head `dd124ab0`, on top of `d20c72c3`.
- **Probe branch:** [`proto/thr-1687-start-local-drop`](https://github.com/christianspliid-ui/threadbare/tree/proto/thr-1687-start-local-drop), never merged. It makes the switch overridable through `globalThis.__CAP_LOCAL_ORDER` and adds three probes:
  - the call-site stack of every `createUnifiedAction`;
  - the message and site of every throw swallowed by `phaseAgentDecision`'s per-agent `catch`;
  - per board contest, whether a strategic candidate was present and which family won.
- **Harness:** `proto-thr1687/planner-ab.ts` on that branch. Same world construction as `readers/reach.ts`: `initializeGameState`, balanced cosmology, medium map, `runTick` × 200. Raw JSON for every run is committed next to it.
- **Two kinds of run:**
  - one process per arm running seeds 42 and 99 (`walk2` / `hash2`);
  - one process per arm per seed (`walk6a/b` / `hash6a/b`).
  - Seed 99 differs by a few percent between the two because module state carries across seeds in one process. Seed 42 is identical in both, and the pickup's own numbers reproduce exactly (863 → 693 planner decisions, 753 → 620 `start_local`).

## 1. The planner starts more encounters, and records fewer

**Every agent-sourced action came from the planner.** The `createUnifiedAction` probe on seed 42 (hash) found 934 calls from `phaseAgentDecision.ts:1692` and 121 from `evaluateEncounterSeeds`, and no other agent path. The deprecated `phaseIdleSelection` is not called.

**But recorded planner starts fall short of that.** On seed 42 (hash), recorded `start_local` + strategic = 648. Tagging each new action against the agent's latest recorded decision gave:
- 620 matched a same-tick `start_local`;
- about 400 had no same-tick record.

**The swallowed throw.** The instrumented `catch` caught one message, from one site:

> `Cannot read properties of undefined (reading 'name')` at `phaseAgentDecision.ts:1895` (main `dac362eb`)

| Swallowed throws, 200 ticks | walk | hash |
|---|---|---|
| seed 42 | 134 | 314 |
| seed 99 | 123 | 339 |

**Why it throws.** At `:1677` the planner resolves the selection with the legacy `getAnyEncounterById`. At `:1895` it builds the "begins" news line from `template.name` after the unified/legacy branch. 86 of the 254 `encounter.*` / `reputation.*` unified templates are absent from the legacy lookup. Every one of them throws there:

| Family | Unified-only templates |
|---|---|
| `encounter.town` | 27 |
| `encounter.anomaly` | 10 |
| `encounter.slice` | 10 |
| `encounter.border` | 6 |
| `encounter.realm` | 5 |
| `encounter.company` | 4 |
| `reputation.*` | 2 each |

**What survives and what is lost.** The action was pushed at `:1740`, so it runs. The engagement ledger stamp (`:1744`) and the familiarity and novelty writes run before the throw, so the KPI and D2 numbers in the pickup comment are sound. Lost are:
- the `agent_encounter` "begins" event;
- the `encounter_decision` balance event, the counter the guard rail reads.

**The fair draw sends the planner into exactly these families:**

| Planner-created actions (`createUnifiedAction` from the planner), 200 ticks | seed 42 walk → hash | seed 99 walk → hash |
|---|---|---|
| all | 886 → 934 | 824 → 980 |
| `encounter.town.*` + `reputation.*` | 14 → 196 | 3 → 225 |
| recorded `start_local` | 753 → 620 | 706 → 645 |
| balance `totalActionsAttempted` | 977 → 1,037 | 912 → 1,099 |
| balance `totalActionsCompleted` | 576 → 633 | 571 → 699 |
| decider-ticks busy | 0.942 → 0.940 | 0.895 → 0.926 |
| mortals alive at tick 200 (509 / 643 at tick 0) | 653 → 762 | 803 → 964 |
| median action length (ticks) | 22 → 22 | 22 → 23 |

**Read plainly.** Mortals do more with the fair draw, and none of the work in front of them is lost. The guard rail's fear ("fair local sampling is costing mortals the work in front of them") does not hold.

## 2. Strategic decisions fall because encounters win the board more often

Strategic candidates (ambitions: projects, instants, claims) compete with encounters on the unified decision board (`UNIFIED_DECISION_BOARD_MODE = 'live'`). The probe counted every board contest:

| Board contests, 200 ticks | seed 42 walk → hash | seed 99 walk → hash |
|---|---|---|
| strategic candidate present | 952 → 946 | 1,094 → 1,000 |
| … strategic won | 44 → 28 (4.6% → 3.0%) | 104 → 38 (9.5% → 3.8%) |
| no strategic candidate present | 116 → 108 | 115 → 125 |

- **Opportunities are unchanged; outcomes are not.** About as many contests offer an ambition in both arms. Strategic scoring is untouched by THR-1687 (the cap never sees strategic candidates).
- **What changed is the competition.** The encounters on the board are now the ones the mortal's own hex actually offers, including work that fits its band. Under `'walk'` they were cut by catalogue position before scoring.
- **What it means.** The ambition share under `'walk'` was partly an artefact of that cut. Whether ambitions *should* hold a larger share of mortal choices is a board-weight question for the strategic family, and is reported as such in the plan.

## Not chased

- **The population difference** (762 vs 653 alive at tick 200 on seed 42) is a different-world effect. It comes downstream of more completed encounters. It is reported, not explained.
- **`evt_<actor>_<tick>_0` collisions** are already logged (impediment #1129).
