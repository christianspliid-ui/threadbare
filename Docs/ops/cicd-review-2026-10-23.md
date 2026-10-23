# CI/CD review — 2026-10-23 (scheduled run, Thursday)

This is the fourth entry of the weekly series. It ran on its registered day. Its 7-day window (10-16 → 10-23) overlaps the last, off-cycle row (10-10 → 10-17) by one day. Christian was not present.

**The machine was dark for about 58 of the window's 168 hours:** 10-20 20:07Z → 10-21 05:53Z and 10-21 20:53Z → 10-23 21:11Z. `tb-orchestrator` shows the same 48 h gap, so the app or the machine was offline. 10-19 saw only 3 merges. Per-day rates below are diluted by that; on the four full working days (10-17, 10-18, 10-20, 10-21) main took 19–20 merges a day.

## Numbers

| Window | Merges/day | Catch-up % | Slow > 60m % | p90 open→merge | Peak open | CI PR median | CI PR fail % | Heavy red on main |
|---|---|---|---|---|---|---|---|---|
| 09-26 → 10-03 (hourly) | 13.0 | 6.6 | 5.5 | 15 min | 3 | 9.6 min | 5.4 | 65.3 % |
| 10-03 → 10-10 (`*/20`, no gate) | 9.3 | 33.3 | 23.1 | 330 min | 6 | 10.7 min | 4.9 | 68.3 % |
| 10-08 → 10-15 | 11.0 | 15.2 | 16.9 | 112 min | 6 | 10.8 min | 2.2 | 66.3 % |
| 10-10 → 10-17 | 10.0 | 6.9 | 8.6 | 53 min | 3 | 10 min | 2.3 | 36.8 % |
| **10-16 → 10-23** | **8.4** | **6.7** | **5.1** | **44 min** | **2** | **14 min** | **7.9** | **1.7 %** |

Other columns: 60 ticket PRs opened, 59 merged, 17 docs PRs merged; open → merge median 16.2 min; CI PR p90 15.8 min over 89 runs. At measurement there was 1 open non-draft PR ([#2528](https://github.com/christianspliid-ui/threadbare/pull/2528), armed, checks pending) and 0 DIRTY. WIP-gate log: 0 denials and 0 fail-soft allows in the window. The `errors` cell is empty.

Flow is the best in the series on every conflict metric: catch-up 6.7 %, slow 5.1 %, p90 44 min, peak 2. Merges/day dropped only because the machine was off for a third of the week.

Two numbers moved the wrong way:
- **CI PR median 10 → 14 min.** In a green run the `Run tests` step takes about 7.3 min, `Generated artifact freshness` 2.5 min, `Process lint (advisory)` 0.9–1.5 min and typecheck 1.2 min. The test suite is product-side (handoff below); the advisory step is a removal (shipped).
- **CI PR failure 2.3 → 7.9 %:** 3 `failure` runs, all on 10-21 (the 8 runs marked `cancelled` were superseded by a newer push). Below any action line; watch.

**Lane runs** (`tb-opus-pickup`, the last 50 finished runs, 10-20 15:11Z → 10-23 21:26Z): 22 idle (< 3 min), median 7.1 min, 0 failed. Longest 143 min (10-20 17:11Z). No run lasted more than 3 h.

## The finding: subagent waits look like finished runs

**14 pairs of pickup runs overlapped on 10-21**, against 2 in 49 the week before. In each one, a run's turn ended while it was still waiting on something, its row turned `succeeded`, and the scheduler started the next run off-slot (19:47Z, 18:23Z, 16:47Z and so on).

- **Four came before THR-2003** ([#2512](https://github.com/christianspliid-ui/threadbare/pull/2512), merged ~09:50Z). Engine-diff gates then ran 669–942 s, past the 600 s Bash cap, so runs backgrounded them. Two caused real harm:
  - The 08:25Z run took the waiting 08:11Z run for dead and redid 26 min of gate and review on PR [#2510](https://github.com/christianspliid-ui/threadbare/pull/2510). Its push was then rejected (impediment #1209, fixed by THR-2003).
  - The 06:49Z run claimed and shipped THR-1960 ([#2509](https://github.com/christianspliid-ui/threadbare/pull/2509)) while the 05:53Z run still held THR-1937 `In Dev`. That is WIP 2.
- **Ten came after THR-2003**, when every gate already fit the foreground, so Bash no longer explains them. A subagent always runs in the background. A run that hands its diff to the review gate's reviewers ends its turn and waits. Example: the 19:31Z run's round-2 reviewer on THR-1992 handed back after the 19:47Z run had started; the 19:31Z run then pushed and armed [#2525](https://github.com/christianspliid-ui/threadbare/pull/2525). All ten second runs stood down, but on a guess, such as "the previous run … looks like it is still running its review" (16:14Z).

Last week's foreground-Bash tweak was right but incomplete: Step 1.6 trusts a `succeeded` row.

**No fix shipped.** I drafted a Step 1.6 change that read the last three events of each recent `succeeded` row and counted a row as active when its tail had no `wrap_up` call. The review gate's round-1 reviewer showed that pickup runs do not reliably call `wrap_up`. My spot reads confirmed it: the 20:51Z stand-down's tail ends in plain closing text, and the 10-23 21:25Z run's tail shows only `[result] done (success)`. The check would have made each silent stand-down stall the next run, so I withdrew it before push. Since THR-2003 the residual overlaps have all stood down without harm, so waiting a week for a reliable signal costs little.

The overlaps still cost a billed run each (about 1 min), because the scheduler starts a run whenever a turn ends. That cost is small (~10 min of runs on 10-21) and has no agent-side lever.

## Tweak verdicts

| Tweak | Verdict |
|---|---|
| 2026-10-17: pickup runs keep commands in the foreground | **Week 1 of 2: target missed, cause partly elsewhere.** Overlaps 2/49 → 14/50. Four came from >600 s gates that had to be backgrounded (fixed by THR-2003 on 10-21); ten from subagent waits, which this text cannot reach. No foreground gate hit the cap after THR-2003 (104 s on an engine diff). Kept open; judged again next week. |
| 2026-10-23: Step 1.6 reads a recent `succeeded` run's tail | **Withdrawn before ship.** The review gate found the `wrap_up` signal unreliable. |
| 2026-10-23: CI drops the advisory Process lint step | New, open. |

Closed tweaks (the WIP gate and the Stop-hook sunset) held: catch-up 6.7 %, slow 5.1 %, peak 2, fail-soft 0.

## Six-week sunset

| Gate / hook | Age | Catches | Verdict |
|---|---|---|---|
| CI `Process lint (advisory)` | since 2026-04-23 | none possible (`continue-on-error`; no impediment or report cites its CI output) | **Removed this week.** The npm script stays for local and lane use. |
| `review-gate.sh` | since 2026-10-02 | under 6 weeks | Renewal due 2026-11-13 (the Friday retro owns it), counted from `review-gate-receipt` PR comments. |
| `wip-gate.ts` | since 2026-10-09 | 1 deny ever (10-09) | Due 2026-11-20. Weigh the pull-work Step 1.5 text, not the hook's log. |
| `worktree-write-guard.mjs` | since 2026-07-21 | uncountable (no log) | Judge at the first sunset pass after the freeze ends (2026-11-13). |

## Hot-spot files

Two ticket PRs carried a main catch-up:
- [#2510](https://github.com/christianspliid-ui/threadbare/pull/2510) (THR-1937, parked across three review cycles): both sides changed only `Docs/changelog.md` and `Docs/project-history.md`, the append-only ledgers.
- [#2463](https://github.com/christianspliid-ui/threadbare/pull/2463) (THR-1935, the deliberate draft hold from last week, resumed): ten shared files, generated artifacts and registries (`interface-map.generated.md`, `systems-inventory.md`, `scripts/interface-contracts.ts`, `src/data/ui-content.ts`). Expected for a multi-day hold.

Neither points at a lever: catch-up is at 6.7 %.

## Stuck now

`check:armed-prs`: healthy. 1 open non-draft PR, [#2528](https://github.com/christianspliid-ui/threadbare/pull/2528) (THR-1997), armed and waiting on checks for 9 min. Nothing stuck for more than 6 h.

## What shipped

- PR_URL: CI drops the advisory `Process lint` step (freeze-compatible: a removal). The diff is classified code (`ci.yml`). `npm run gate` PASS (101 s), the review gate ran two rounds (receipt on the PR), `npm run gate -- --final` PASS before push, auto-merge armed.
- Withdrawn before push: the Step 1.6 tail-read (see *The finding*).

## Handoffs to the Friday retro

- **Subagent waits make a live pickup run look finished** (10 overlaps on 10-21 after THR-2003, all stood down on a guess). The review gate's reviewers always run in the background, so the run's turn ends while it waits. No agent-readable signal tells "waiting" from "finished" yet; the `wrap_up` tail check was tried and withdrawn. Next week's review looks for a reliable one.

- **CI PR median rose 10 → 14 min.** The `Run tests` step is now about 7.3 min of a green run, and `Generated artifact freshness` 2.5 min. The suite is product-side. Removing the advisory step should take back about 1 min; the rest is suite growth.
- **CI PR failures 2.3 → 7.9 %** (3 runs on 10-21). Below any action line; recorded so a second week is visible.
- **About 58 h with every lane offline** (10-20 20:07Z → 10-21 05:53Z; 10-21 20:53Z → 10-23 21:11Z). The app or the machine was down, so this is not a harness item. Merges/day 8.4 reflects it; full working days ran 19–20 merges.
- **Heavy simulation tests on main: 1.7 % red.** Stays resolved.

## Needs Christian

Nothing.
