# CI/CD review — 2026-10-17 (scheduled run, off-cycle)

This is the third entry of the weekly series. The lane is registered for Thursdays (`17 15 * * 4`), but this run fired on Saturday, two days after the 2026-10-15 run. As a result, its 7-day window (10-10 → 10-17) overlaps last week's post-gate window (10-10 → 10-15). The table therefore also shows the **non-overlapping slice** (10-15 → 10-17, about 2.9 days). Christian was not present.

## Numbers

| Window | Merges/day | Catch-up % | Slow > 60m % | p90 open→merge | Peak open | CI PR median | Heavy red on main |
|---|---|---|---|---|---|---|---|
| 09-26 → 10-03 (hourly) | 13.0 | 6.6 | 5.5 | 15 min | 3 | 9.6 min | 65.3 % |
| 10-03 → 10-10 (`*/20`, no gate) | 9.3 | 33.3 | 23.1 | 330 min | 6 | 10.7 min | 68.3 % |
| 10-08 → 10-15 (7-day row) | 11.0 | 15.2 | 16.9 | 112 min | 6 | 10.8 min | 66.3 % |
| *10-10 → 10-15 (post-gate only)* | *8.6* | *8.9* | *11.6* | *62 min* | *3* | *8.2 min* | *56.7 %* |
| **10-10 → 10-17 (7-day row)** | **10.0** | **6.9** | **8.6** | **53 min** | **3** | **10 min** | **36.8 %** |
| *10-15 → 10-17 (new slice)* | *14.0* | *5.0* | *7.5* | *51 min* | *2* | *14 min* | *0 %* |

Other columns for the 7-day row: 72 ticket PRs opened, 70 merged, 78 docs PRs merged. CI PR failure rate was 2.3 % and CI PR p90 15 min. At measurement time there were 0 open non-draft PRs and 0 DIRTY. WIP-gate log: 0 denials and 0 fail-soft allows in the window. The `errors` cell is empty.

The new slice is the best stretch in the series: 14 merges a day with catch-up at 5 %. Its CI median rose to 14 min, but the slice holds only 62 runs, so treat that number as noise until the next full week.

**Lane runs** (`tb-opus-pickup`, the last 49 finished runs, 10-16 01:53Z → 10-17 19:49Z): 20 idle (< 3 min), median 16.3 min, 0 failed. The longest run took 141 min: 10-16 11:31Z, on the crown PR, where a review found four bugs and fixed them. No run lasted more than 3 h.

**Every lane was dark from 10-16 16:52Z to 10-17 09:31Z, about 16.7 h.** `tb-orchestrator` shows the same gap (16:30Z → 09:34Z), so the app or the machine was offline. This is not a harness fault. About 50 pickup slots were lost.

## The finding: background commands defeat the predecessor check

**Two pickup runs overlapped on 10-17,** and one of them built a ticket a second time:

- **12:11Z run:** ran until 13:15Z, overlapping the 13:13Z run. The 13:13Z run claimed nothing.
- **13:31Z run:** built THR-1919, backgrounded its gate and ended its turn. The run list marked it `succeeded` at 13:45:06Z.
- **13:45:14Z run:** its Step 1.6 predecessor check (THR-1887) saw only itself as `running`. It found the 13:31Z run's worktree dirty and committed it as "stranded" work (`f54470c7`). It then moved the work into its own worktree, re-ran every gate and the review, and shipped [#2459](https://github.com/christianspliid-ui/threadbare/pull/2459).
- **13:31Z run, resumed:** the gate's completion notification woke it at about 13:51Z. It found its closeout already committed, saw two active runs and stood down. About 20 minutes of build and gate work was done twice.

**Cause.** A turn that ends while a `run_in_background` command is still running counts as a finished run, so the scheduler starts the next slot. The session is still alive, and it resumes when the notification arrives. The run list, which is the only thing Step 1.6 reads, says `succeeded`. Evidence:

- In all four overlaps visible over the last two weeks (10-14 20:11Z and 23:31Z; 10-17 12:11Z and 13:31Z), the overlapped run had backgrounded commands and was resumed by their notifications.
- Last week's report credited THR-1887 ([#2418](https://github.com/christianspliid-ui/threadbare/pull/2418)) with ending overlaps. It could not end them, because it reads the same run list.
- Since 10-10, 78 of 298 pickup gate calls ran in the background. The 219 timed foreground gate runs took 1.7 min median and 5.8 min at most, well inside the 10-min Bash cap. Backgrounding buys nothing.

**Fix shipped:** see *What shipped*.

## Tweak verdicts

| Tweak | Verdict |
|---|---|
| 2026-10-09: WIP-until-merged claim gate | **Kept** (week 2 of 2, improved). Catch-up is 6.9 % against a target of ≤ 10 %. Slow is 8.6 % against ≤ 8 %: one PR short over 7 days, and 7.5 % in the new slice. Peak concurrent is 3 over 7 days and 2 in the slice. Fail-soft was 0 in both weeks. Closed. |
| 2026-10-15: sunset the inert Stop hook | **Kept.** 40 ticket PRs merged since, and nothing moved, as predicted. No impediment logs work lost at Stop. The one near-loss (#1198, an unpushed 23k-line batch) happened mid-run, and the retro fixed it in pull-work. Closed. |
| 2026-10-17: pickup runs keep commands in the foreground | New this week, open. |

**The slow PRs added this week** (both 10-15/16) did not come from conflicts:

- [#2444](https://github.com/christianspliid-ui/threadbare/pull/2444) (101 min): four review-gate rounds.
- [#2419](https://github.com/christianspliid-ui/threadbare/pull/2419) (112 min): red CI.

## Six-week sunset

| Gate / hook | Age | Catches | Verdict |
|---|---|---|---|
| `wip-gate.ts` | since 2026-10-09 | 1 deny ever (10-09, during the drain) | Under 6 weeks; due 2026-11-20. The pull-work Step 1.5 text holds the slot before the hook is reached, so the sunset pass should weigh the text, not the hook's log. |
| `review-gate.sh` | since 2026-10-02 | under 6 weeks | Renewal due 2026-11-13, counted from `review-gate-receipt` PR comments. |
| `worktree-write-guard.mjs` | since 2026-07-21 (Node port 2026-10-03) | uncountable (no log) | Last week's plan to add a deny log is **dropped under the freeze**, because a log is a new probe (THR-1946). Judge it at the first sunset pass after 2026-11-13. |

## Hot-spot files

There was one catch-up merge on a ticket PR that was not already counted last week: [#2465](https://github.com/christianspliid-ui/threadbare/pull/2465), 16 min. It merged main to pick up the docs PR [#2464](https://github.com/christianspliid-ui/threadbare/pull/2464). That was a freshness refresh, not a conflict: no file was changed on both sides. The other four catch-ups in the window (#2382, #2387, #2397, #2410) are in last week's table, where only the append-only ledgers overlapped. No lever this week.

## Stuck now

`check:armed-prs`: healthy, 0 open non-draft PRs. [#2463](https://github.com/christianspliid-ui/threadbare/pull/2463) (THR-1935) is a **draft** and DIRTY. It is a deliberate hold: the kill criterion hit on the census. It is not stuck. Nothing has been stuck for more than 6 h.

## What shipped

- [#2466](https://github.com/christianspliid-ui/threadbare/pull/2466): pickup runs keep every command in the foreground. The change is in the `tb-opus-pickup` prompt (live + mirror, backup `SKILL.md.bak-2026-10-17`) and pull-work Step 1.6. Auto-merge is armed. The diff is docs-only, so no review gate is owed. `npm run gate` and `--final` PASS. It falls under the freeze exception for repairs to machinery that broke a cited run.

Only one tweak shipped. The freeze allows only removals or repairs, and no second candidate cleared the bar.

## Handoffs to the Friday retro

- **Heavy simulation tests on main: resolved.** Red on 36.8 % of main pushes over the 7-day window, and **0 %** since 10-15 (impediment #1195 was fixed in-week). This closes the three-week handoff.
- **17 h with every lane offline** (10-16 16:52Z → 10-17 09:31Z). The app or the machine was down, so it is not a harness item. About 50 pickup slots were lost. Recorded so the throughput dip is not misread as a gate effect.
- **The lane fired off-cycle** (Saturday, not Thursday). Its window overlaps last week's by 5 days. If THR-1950 folds this lane into a combined weekly review, give it a fixed, non-overlapping window.

## Needs Christian

Nothing.
