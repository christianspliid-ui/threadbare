# CI/CD review — 2026-10-09 (attended, first entry)

The first entry of the weekly series. It was written by hand, in the attended session that built the `tb-cicd-review` lane. The question was Christian's: *did moving the executor from hourly to every 20 minutes improve anything, or break our setup?*

## Numbers

Window columns are 7 days ending on the date. The last row is a partial week, through 10-09 05:00Z.

| Week ending | Merges/day | Catch-up % | Slow > 60m % | p90 open→merge | Peak open | CI PR median | Heavy red on main |
|---|---|---|---|---|---|---|---|
| 09-19 | 7.7 | 9.3 | 3.7 | 54 min | 2 | 8.7 min | 1.7 % |
| 09-26 | 8.6 | 13.3 | 10 | 56 min | 2 | 7.5 min | 55.4 % |
| 10-03 (hourly) | 13.0 | 6.6 | 5.5 | 15 min | 3 | 9.6 min | 65.3 % |
| **10-10 (`*/20`)** | **9.3** | **33.3** | **23.1** | **330 min** | **6** | 10.7 min | 68.3 % |

Full row: `Docs/ops/cicd-metrics.tsv`.

## Verdict on THR-1717's `*/20` cadence: regressed

- **No throughput gain.** Supply was the bound. On 10-06 the lane ran about 40 one-minute runs against Ready-for-Dev tickets still inside their veto windows. On 10-07 nothing ran at all, in any lane; the app or machine was probably off.
- **Conflicts tripled.** The mechanism has three parts:
  1. WIP = 1 counted only In Dev claims, and an armed PR was "discharged".
  2. At `*/20` the next run branched before the previous PR's ~13 min CI landed. The hourly cron's ~30 min idle gap had hidden this.
  3. Every ticket PR touches `Docs/changelog.md`, `Docs/project-history.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.generated.md` and `public/*-reference.html`. GitHub's mergeability ignores `merge=union`: #2275 and #2277 read `DIRTY` on GitHub while `git merge-tree` merged them cleanly.
- **The unstick duty cascaded.** It fixes one PR per run, and each merge re-broke the rest. #2271 was fixed at 04:53Z and dirty again at 04:58Z.

## What shipped

- **WIP-until-merged claim gate.** A `save_issue` hook, plus the pickup text. Ledger entry in `Docs/ops/cicd-tweaks.md`.
- **This lane.** `cicd-review` skill, `npm run cicd:metrics`, Thursdays 15:17.
- **Serial drain of the stuck PRs.** #2271, #2272, #2273, #2275 and #2277 are being merged one at a time, with the pickup lane paused for the drain.

## Hot spots, for the next tweak

The conflicting files across this week's catch-ups were the ledgers, `systems-inventory.md`, `interface-map.generated.md`, `public/run-lifecycle-reference.html`, `public/system-interface-map-reference.html` and `src/types/trace.ts`. The gate removes the overlap. If concurrency returns (a second executor, THR-1719), the next lever is to **stop committing generated artifacts in feature PRs** and regenerate them on `main` after merge. A per-PR changelog fragment instead of a shared table would also help, since GitHub won't union-merge.

## Handoffs to the Friday retro

- **`Heavy simulation tests` is red on 55–68 % of `main` pushes since the week ending 09-26** (1.7 % before). It isn't a required check, so nothing surfaced it. Impediment #1161 (a wall-clock trace-order flake under the heavy run) is one known cause. Triage it as product test health: flake vs. real regression.

## Needs Christian

Nothing.
