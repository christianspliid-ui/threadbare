---
lane: daily-backlog-grooming
run: 2026-08-24
promoted: 0
filed: 0
resolved: 0
swept: 2
canceled: 0
newFindings: 2
needsChristian: true
---
# Backlog Grooming — 2026-08-24

## Needs Christian

- **Two encounters, one verdict** ([THR-1130](https://linear.app/threadbare/issue/THR-1130)) — the Encounter Factory retrofit is parked on your 2-of-6 batch-1 sample verdict. Your 08-23 bond-chip feedback already shipped as [THR-1205](https://linear.app/threadbare/issue/THR-1205); the "worth meeting twice" call is still open. Parked 7 days. **Recommendation:** rule on the two samples so batch 2 can start.
- **One yes/no on feel** ([THR-1168](https://linear.app/threadbare/issue/THR-1168)) — should committing a hand of nudge cards carry ~1.6s of held breath (cello swell, reach-tinted struck note) before the outcome lands? Either answer closes it. Parked 6 days. **Recommendation:** say no unless you want the beat — 1.6s unskippable on every commit is a long time at hour twenty.
- **An attended session is the bottleneck, not the queue.** Three items need one and cannot move without it: [THR-1133](https://linear.app/threadbare/issue/THR-1133) (19 owed 1920×1080 captures, one dev-server sitting), and two design tickets staged and unclaimed — [THR-790](https://linear.app/threadbare/issue/THR-790) (traits wave 2, staged 9 days) and [THR-1002](https://linear.app/threadbare/issue/THR-1002) (card grammar, staged 5 days). **Recommendation:** one attended design session clears more than any hourly run can.

## Work in flight
- **THR-1130** — batch 1 authored, shipped; parked on your verdict. Park shape intact (`In Dev` ∧ `assignee: null` ∧ `Parked`).
- **THR-1133** — nothing shipped; 9 capture passes accumulated, awaits an attended run. Park intact.
- **THR-1168** — Member 2 (registration cue) retired and merged (PR #1534). Member 1 awaits the feel call. Park intact.

## Technical gates resolved this run
None — no issue was parked on a decision that was mine to make. All three In Dev parks are genuine director forks, verified against their latest comments and their merged PRs.

## Counts by state
Idea 73 · Todo 19 · In Design 2 · Implementation Planning 0 · Ready for Dev 2 · In Dev 3 (all `Parked`).

## Problems found and fixed
- **Nothing needed fixing.** No orphan issues (every issue in all six states carries a project); no completed-but-open project; no Idea/Next project holding an active-state issue; no unclaimable deferral (both Ready-for-Dev items carry a coordination block and a Done-when).
- **Finding 1 — zero non-`Deferral` program work in Ready for Dev.** Both claimable items ([THR-1207](https://linear.app/threadbare/issue/THR-1207), [THR-1210](https://linear.app/threadbare/issue/THR-1210)) are `Deferral`s spun out of the just-shipped THR-1206. That is below the orchestrator's `ORCH_PROGRAM_WORK_FLOOR` of 2 — the same starved-shelf trigger that staged THR-1002 on 08-19. Left for the orchestrator's T1/T2, which owns promotion; recording it so the second consecutive starve is visible.
- **Finding 2 — three `Now` projects hold no issue in an active state:** UI Visual Overhaul, Social Systems Expansion, Continuous Improvement. Not fixed — moving a project out of `Now` is a roadmap signal, not hygiene, and Continuous Improvement being idle is the process-work throttle working as designed. Flagged for the weekly retro.

## Materiality sweep
In-scope tickets swept: **2**. Canceled: **0**. Consolidated: 0.
- **THR-1114** (`Improvement`, two off-union `sphereAffinity` values) — **stands.** Mislabeled: this is a cosmology content call affecting what the Codex tells the player and what prerequisite/scoring reads, not process work. §2.5 excludes product from cancellation.
- **THR-1134** (project Continuous Improvement, shareable state snapshot) — **stands.** Filed from attended chat at Christian's explicit request; a director-requested capability is not a process receipt. Question 1 does not apply.

`0 canceled` is the finding: nothing currently queued is below the bar. The 2026-08-11 sweep's nine cancellations appear to have held.

## Roadmap cross-reference
`.planning/ROADMAP.md` § Future Work checked item by item against Linear. **No gaps.** All twelve tracked: content-library phases 3–5 → THR-54/55/56; social systems TB-095…099 → THR-74 (Done), THR-724 (Done) and the Social Systems Expansion project; M3 → its own project; doom → THR-293; rival activation → THR-66 (Done); onboarding → THR-72; culture seeding → THR-70; NPC workforce → THR-67; chain reactions → THR-68; Codex → THR-52. Nothing filed.

## Pipeline status
Claimable shelf: **2 items, both `Deferral`, both Medium, both Content Architecture (`Now`)** — correct ordering per "deferrals in active projects first".
**Recommended next pickup: [THR-1207](https://linear.app/threadbare/issue/THR-1207)** — its blocker THR-1206 is Done, and it carries the strongest quotable loss on the board (31% of authored reputation-tally writes silently discarded; shipped content whose mechanical effect never fires). THR-1210 is a docs-track UL entry and can ride any run.
**Closest to Ready for Dev:** [THR-1215](https://linear.app/threadbare/issue/THR-1215) (High, filed today, full coordination block and Done-when, gates every future factory run). Promotion left to the orchestrator so two lanes do not race it.
