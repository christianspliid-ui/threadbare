---
lane: tb-weekly-review
run: 2026-10-30
filed: 0
canceled: 0
tweaksShipped: 0
needsChristian: false
---
# Weekly review — 2026-10-30

Window 10-23 → 10-30. Inputs: [weekly-review-2026-10-25](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-review-2026-10-25.md), [cicd-metrics.tsv](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-metrics.tsv), [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md), [impediments.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) rows #1223–#1236. This report's date is the start of next week's retro window. Don't use `retro-draft`'s default, which still starts at 10-23.

## Needs Christian
Nothing needs you. The build queue ran dry this week: there is nothing ready to build after the ticket in progress. Filling it is the design lane's job, not a decision for you.

## Headline numbers
Row 10-23 → 10-30, compared with 10-18 → 10-25:
- Merges/day **12.3** (10.4). 86 ticket PRs opened, 86 merged. Open → merge median 5 min.
- Catch-up **48.8 %** (29.7). This is the pipelined pre-PR sync merge again, not conflicts: DIRTY 0, peak open 1.
- Slow > 60 min **4.7 %** (2.7). p90 29 min (39).
- CI PR median **4.4 min** (4.7), p90 7.9 (15.2). Failures 8.8 % (7.8).
- Heavy tests red on main **23.1 %** (10.2). 5 of 21 completed runs failed, each in a different file: `premonitionSteer.integration`, `armedTargets.budget.heavy` (a 5 s frame budget), `peopleThingsCells`, and two more. Main has been green since 10-28 18:08Z. **Handoff, product-side:** heavy engine tests flake under CI load, one file at a time, and need a pickup ticket only if a file reds twice.
- Pickup lane: 49 finished runs from 10-28 08:11Z to 10-30 18:29Z. 39 were idle (veto holds), median 1 min, 0 failed. There were no runs at all for about 40 h, from 10-29 02:12Z to 10-30 18:12Z (most likely the PC asleep).

## Impediments and drift
14 rows (#1223–#1236), about 3 h lost. No drift-scan issues this week. Doctrine versions are unchanged (prose@2, encounter-authoring@1, identity-vision@2, cosmology@1, rules-of-play@1, ui-laws@1, architecture@1, coordination-process@1), so no guidance audit.
- **Two pickup runs built the same ticket at once, four times:** #1227, #1232, #1235, #1236, plus PR #2648 on 10-28. That cost about 85 min, and one real review fix missed its PR, which became [THR-2076](https://linear.app/threadbare/issue/THR-2076). It clears Rule 0's bar, but it is harness work, so no ticket. See Tweaks.
- Stays a log row: #1228 (a plan put its score term in a field the board never reads), #1229 and #1231 (Done-whens the seeded world can't reach), #1234 (veto lines written 12 h early, caught by the check), #1226, #1225, #1224, #1233.

Filed: none.

## Tweaks
Ledger: [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md).
- 10-24 CI fan-out: **kept, closed**. Median 14 → 4.4 min.
- 10-24 pipelined pickup: **kept, closed**. Merges/day 12.3, DIRTY 0, slow 4.7 %. Throughput is now limited by supply, not by the gate.
- 10-25 looser gate test timeouts: **improved**, week 1 of 2. No default-timeout gate reds since the merge. The two remaining rows are tests that set their own timeout.
- 10-25 resume-path "recently active = alive": **no effect**, week 1 of 2. Four duplicate builds came after the merge, and the predecessor was seconds old in at least two of them. Not reverted, because it has never stood the lane down wrongly.
- **Shipped: none.** The obvious fix is to hold the turn open on the review subagents. That can't work here: the Agent tool returns at once, and a foreground `sleep` is blocked. Shipping a second guess at the signal would repeat the 10-23 mistake. Next step, agent-owned: spot-read the 10-27 06:25Z run's Step 1.6 output, then fix whichever half failed. The worktree-leak tweak promised last week was not shipped either. The reaper is an unversioned deletion script, too risky to change unattended. Worktrees: 664 (600).

## Queue
- **Ready for Dev 0.** Supply problem: the builder holds [THR-2087](https://linear.app/threadbare/issue/THR-2087) and nothing waits behind it. In Design 1 ([THR-2089](https://linear.app/threadbare/issue/THR-2089)). [THR-1926](https://linear.app/threadbare/issue/THR-1926) (The Crossroads) has sat in Implementation Planning since 10-18 with a passed gate. That is the shelf's quickest refill, and it is for the design lane.
- In Dev 2: THR-2087 (live, claimed 18:13Z) and [THR-1947](https://linear.app/threadbare/issue/THR-1947) (`Parked`, unassigned, untouched since 10-23). The wiki-warning half of THR-1947 still waits on an attended run or permission to edit the gate. Agents may un-park it.
- Todo process tickets: 7. THR-2063 to THR-2066 (removals from 10-26, within the freeze), [THR-1938](https://linear.app/threadbare/issue/THR-1938) (a real false-fail) and [THR-1951](https://linear.app/threadbare/issue/THR-1951) (satisfied upstream by [#2535](https://github.com/christianspliid-ui/threadbare/pull/2535): it needs a closer, so park it, never cancel). Last week's filing, [THR-2041](https://linear.app/threadbare/issue/THR-2041), shipped (Done 10-25). **0 canceled.** No orphans.

## Blocking hygiene
- Scheduler: every cron matches the [registry](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md). The five folded lanes stay disabled, and `tb-weekly-review` stays Fri `0 17 * * 5`.
- The ~40 h with no pickup runs (10-29 02:12Z → 10-30 18:12Z) was the biggest throughput loss this week, though the shelf was nearly empty anyway.
