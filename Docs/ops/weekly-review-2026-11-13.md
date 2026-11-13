---
lane: tb-weekly-review
run: 2026-11-13
filed: 0
canceled: 0
tweaksShipped: 0
needsChristian: false
---
# Weekly review — 2026-11-13

Window 11-06 → 11-13. Inputs: [weekly-review-2026-11-06](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/weekly-review-2026-11-06.md), [cicd-metrics.tsv](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-metrics.tsv), [cicd-tweaks.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Docs/ops/cicd-tweaks.md), [impediments.md](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/impediments.md) rows #1249–#1251.

## Needs Christian
Nothing needs you. One thing to know: the studio stopped for four days this week because the PC was asleep. It was put to sleep from the Start menu on Sunday 11-08 around 13:50 your time and woke on Thursday 11-12 around 19:40, and no lane can run while it sleeps. If you want work to continue while you're away, leave the PC awake. If you put it to sleep on purpose, this needs nothing from you.

## Headline numbers
Row 11-06 → 11-13, compared with 10-30 → 11-06:
- Merges/day **3.6** (9.6). 25 ticket PRs opened, 25 merged. Open → merge median 5.7 min (5.9). The cause is the ~102 h outage, plus an empty shelf on 11-08. The harness is not the cause.
- Catch-up **28 %** (38.2). This is the pipelined pre-PR sync. DIRTY 0, peak open 1.
- Slow > 60 min **4 %** (3.0). p90 15.4 min (32.6).
- CI PR median **5.1 min** (5.1), p90 6.0 (6.9). Failures **4.4 %** (2.3).
- Heavy tests red on main **0 %** (3.1).
- Pickup lane: 50 runs from 11-08 06:31Z to 11-13 15:51Z, including the outage. 8 runs built and shipped, 35 were idle (the shelf was empty on 11-08, and veto holds ran until 20:43Z on 11-13), and 5 found Linear dark on 11-13 between 13:11Z and 14:51Z. 1 failed on a Cloudflare 403 at sign-in. No stuck PRs. wip-gate log: 1 deny, 0 fail-soft.

## Impediments and drift
3 rows, about 35 min lost. Drift-scan issues: the four standing ones refreshed on 11-13 ([THR-915](https://linear.app/threadbare/issue/THR-915), [THR-1799](https://linear.app/threadbare/issue/THR-1799), [THR-747](https://linear.app/threadbare/issue/THR-747), [THR-911](https://linear.app/threadbare/issue/THR-911)). All are `Idea` and none is a new red signal. Doctrine versions are unchanged (prose@2, encounter-authoring@1, identity-vision@2, cosmology@1, rules-of-play@1, ui-laws@1, architecture@1, coordination-process@1), so no guidance audit.
- **#1251 (Linear connector dark, ×3 today, ~5 min a run):** this is an outside outage. The rule "retry once, then don't claim" held: no ticket was touched. It stays a row; there is nothing to fix on our side.
- **#1249 (~10 min):** two overlapping pickup runs each stood down for the other, and a third run picked the ticket up. This is the second overlap row since the Step 1.6 tweak closed. It shipped once and cost ~10 min, which is below the bar. It stays a row; reopen it only if a double ship appears.
- **#1250 (~10 min):** another lane navigated the shared Playwright browser away. The row records the workaround (a private headless Chrome). It stays a row.
- **Not logged, the biggest loss:** the ~102 h sleep outage. It was a user-initiated sleep, so it is not an impediment (see Needs Christian).

**Freeze decision (owed by canon today):** the pipeline freeze ([THR-1946](https://linear.app/threadbare/issue/THR-1946)) is now **permanent**. Over its four weeks, every shipped tweak was a removal or a fix, CI median fell from 14 to 5 min, and no impediment row asked for new machinery. Recorded in [#2812](https://github.com/christianspliid-ui/threadbare/pull/2812).

Filed: none.

## Tweaks
- Open ledger: empty at the start of the run. Nothing to judge.
- **Review gate sunset (due today): renewed.** 475 confirmed findings on 185 of 369 receipted PRs since 10-02, and 460 of them fixed. Next review 2026-12-25. Recorded in [#2812](https://github.com/christianspliid-ui/threadbare/pull/2812) (docs only, auto-merge armed).
- Shipped harness tweaks: none. Nothing moved the wrong way for a harness reason.
- Due next week: the WIP claim gate hook's sunset (11-20).

## Queue
- **Ready for Dev 5**, all product, all held by veto windows until 20:43Z today: [THR-2211](https://linear.app/threadbare/issue/THR-2211), [THR-2212](https://linear.app/threadbare/issue/THR-2212), [THR-2208](https://linear.app/threadbare/issue/THR-2208), [THR-2201](https://linear.app/threadbare/issue/THR-2201), [THR-2207](https://linear.app/threadbare/issue/THR-2207). 0 process tickets.
- **In Dev 1:** [THR-1947](https://linear.app/threadbare/issue/THR-1947) has been `Parked` and unassigned since 10-23. It waits on an attended run, because unattended runs are refused edits to the gate, CI and DoD files. This is a healthy park. It is now the only freeze-compatible cut left that needs an attended session.
- **Todo process 5:** THR-2063 to THR-2066 are freeze-compatible removals with quoted costs. [THR-1951](https://linear.app/threadbare/issue/THR-1951) is satisfied upstream: park it, never cancel it. **0 canceled.** No orphans.

## Blocking hygiene
- Scheduler: every enabled cron matches the [registry](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-tasks-registry.md). The five folded lanes stay disabled.
- The `tb-weekly-review` live prompt and its [mirror](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/ops/scheduled-task-prompts/tb-weekly-review.md) now both read "freeze permanent".
