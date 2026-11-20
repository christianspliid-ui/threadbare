---
lane: tb-weekly-review
run: 2026-11-20
filed: 0
canceled: 0
tweaksShipped: 0
needsChristian: false
---
# Weekly review — 2026-11-20

Window 11-13 → 11-20. Inputs: [weekly-review-2026-11-13](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-review-2026-11-13.md), [cicd-metrics.tsv](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-metrics.tsv), [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md), [impediments.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) rows #1252–#1261.

## Needs Christian
Nothing needs you. Two things to know, neither needs an answer:
- The studio was silent for three stretches this week, about 31 hours in total (Sunday 11-15 daytime, and the nights to 11-19 and 11-20). That is far less than last week's four days.
- On Thursday night the pickup lane hit the 5-hour usage limit and stopped for about an hour and a half, in the middle of one build. The build was finished the next morning with nothing lost.

## Headline numbers
Row 11-13 → 11-20, compared with 11-06 → 11-13:
- Merges/day **7.4** (3.6). 53 ticket PRs opened, 52 merged. Open → merge median 5.8 min (5.7), p90 38.9 (15.4).
- Catch-up **54.7 %** (28). This is the pipelined pre-PR sync, by design. DIRTY 0, peak open 2.
- Slow > 60 min **3.8 %** (4).
- CI PR median **5.3 min** (5.1), p90 6.0 (6.0). Failures **8.4 %** (4.4): 7 of 83 runs on six branches, inside the 7.8–8.8 % of the October weeks.
- Heavy tests red on main **2.4 %** (0).
- Pickup lane, 50 runs from 11-19 13:11Z to 11-20 15:42Z: 16 built or resumed, 28 idle, 6 failed on the usage limit. 25 of the idle runs were one eight-hour veto hold on 11-19 (13:11Z → 21:11Z, all four ready tickets held). One PR open, armed and waiting on checks ([#2879](https://github.com/christianspliid-ui/threadbare/pull/2879)). No stuck PRs. wip-gate log: 0 denials, 0 fail-soft.

## Impediments and drift
10 rows, about 90 min of quoted loss. Drift-scan issues: the four standing ones refreshed today ([THR-915](https://linear.app/threadbare/issue/THR-915), [THR-1799](https://linear.app/threadbare/issue/THR-1799), [THR-747](https://linear.app/threadbare/issue/THR-747), [THR-911](https://linear.app/threadbare/issue/THR-911)). All are `Idea` and none is a new red signal. Doctrine versions are unchanged (prose@2, encounter-authoring@1, identity-vision@2, cosmology@1, rules-of-play@1, ui-laws@1, architecture@1, coordination-process@1), so no guidance audit.
- **Duplicate builds, three this week, about 80 min.** #1255 (THR-2229, 11-15, ~15 min), #1261 (THR-2259, 11-20, ~25 min), and one not logged: the 09:56Z and 10:28Z runs on 11-20 both built THR-2255, and the second called the first "gone quiet" while it ran until 11:04Z (~40 min). This clears the bar the 11-06 verdict set for reopening. A spot-read of the 13:23Z run shows the cause: it read the run list and then treated the ticket as abandoned anyway. The rule that covers this (pull-work Step 1.6, resume path) is in the text and was read past. Another paragraph will not fix that. The fix is the cut already filed as [THR-2063](https://linear.app/threadbare/issue/THR-2063) (short core procedure, hard checks in scripts). **No new ticket**; this week's evidence goes on THR-2063 as a comment. No duplicate shipped twice.
- **#1259 / #1258 (~20 min + a 40 min census rerun):** a machine sleep mid-run left NUL-filled files and a blank branch ref, and every `git fetch` failed until the ref was rewritten. Both rows carry the repair. One event, so they stay rows.
- **#1260:** [wiring-checklist.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/wiring-checklist.md) is 545 KB (3,240 lines), too big for an agent to read, so plan-doc audits check wiring against the plan's own table. One row and no quoted loss, so it stays a row. It is the first candidate for a ticket if it recurs, as a split, not a new check.
- **#1252, #1253 (counts 2 and 6):** browser-evidence friction (a queued Doom notice that never renders in a tick batch; Playwright screenshots landing in a sibling worktree; long tick evaluates resetting the tab). The rows carry working routes. #1252 describes a possible product bug in notice queuing: handed to the queue, not fixed here.
- **#1254, #1256, #1257 (~5 min each):** stay rows.

Filed: none.

## Tweaks
- Open ledger: empty at the start of the run. Nothing to judge.
- **WIP claim gate sunset (due today): renewed.** Three real denials inside six weeks (THR-1971 on 10-25, THR-2091 on 10-30, THR-2188 on 11-07), no fail-soft, and its log is what records pipelined claims. Next review 2027-01-01. Recorded in the [ledger](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md).
- Shipped harness tweaks: **none**. The one harness problem this week (duplicate builds) needs the THR-2063 cut. A freeze-compatible tweak cannot reach it: the only small change on offer is another rule, and the freeze forbids that.

## Queue
- **Ready for Dev 4**, all product, all from cold-playtest round 8: [THR-2265](https://linear.app/threadbare/issue/THR-2265), [THR-2260](https://linear.app/threadbare/issue/THR-2260), [THR-2261](https://linear.app/threadbare/issue/THR-2261), [THR-2266](https://linear.app/threadbare/issue/THR-2266). 0 process tickets. The shelf is thin but it is being fed: the pickup lane built ten tickets today.
- **In Dev 2:** [THR-2256](https://linear.app/threadbare/issue/THR-2256) is live (PR #2879 armed at 15:58Z). [THR-1947](https://linear.app/threadbare/issue/THR-1947) is still `Parked` and unassigned since 10-23, waiting on an attended run. A healthy park.
- **Todo process 5**, unchanged: [THR-2063](https://linear.app/threadbare/issue/THR-2063), [THR-2064](https://linear.app/threadbare/issue/THR-2064), [THR-2065](https://linear.app/threadbare/issue/THR-2065), [THR-2066](https://linear.app/threadbare/issue/THR-2066) are freeze-compatible removals with quoted costs. [THR-1951](https://linear.app/threadbare/issue/THR-1951) is satisfied upstream: park it, never cancel it. **0 canceled.** No orphans.

## Blocking hygiene
- Scheduler: every enabled cron matches the [registry](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md). The five folded lanes stay disabled.
- Nothing else blocked a lane or a ticket this week.
