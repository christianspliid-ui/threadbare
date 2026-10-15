# CI/CD review — 2026-10-15 (scheduled run)

The second entry of the weekly series, and the first written by the `tb-cicd-review` lane itself. Christian was not present.

## Numbers

The standard 7-day window (10-08 → 10-15) still contains the pre-gate drain of 10-08 and 10-09: #2271, #2272 and #2273 alone took 520–717 min. So the table also shows a **post-gate-only** window (10-10 → 10-15, 5 days). That row is the one the WIP gate is judged on.

| Window | Merges/day | Catch-up % | Slow > 60m % | p90 open→merge | Peak open | CI PR median | Heavy red on main |
|---|---|---|---|---|---|---|---|
| 09-12 → 09-19 | 7.7 | 9.3 | 3.7 | 54 min | 2 | 8.7 min | 1.7 % |
| 09-19 → 09-26 | 8.6 | 13.3 | 10 | 56 min | 2 | 7.5 min | 55.4 % |
| 09-26 → 10-03 (hourly) | 13.0 | 6.6 | 5.5 | 15 min | 3 | 9.6 min | 65.3 % |
| 10-03 → 10-10 (`*/20`, no gate) | 9.3 | 33.3 | 23.1 | 330 min | 6 | 10.7 min | 68.3 % |
| **10-08 → 10-15 (7-day row)** | **11.0** | **15.2** | **16.9** | **112 min** | **6** | **10.8 min** | **66.3 %** |
| *10-10 → 10-15 (post-gate only)* | *8.6* | *8.9* | *11.6* | *62 min* | *3* | *8.2 min* | *56.7 %* |

The 7-day row is in `Docs/ops/cicd-metrics.tsv`. Its notes cell carries the post-gate figures. Other columns: 77 ticket PRs and 77 docs PRs merged (the docs count was 34 the week before); CI PR failure rate 2.2 %; open and DIRTY PRs at measurement time: 0 and 0.

**Lane runs** (`tb-opus-pickup`, the last 50 runs, 10-14 18:11Z → 10-15 18:44Z, about 24.5 h): 49 finished, **24 idle** (< 3 min), median 6 min, 0 failed. Nearly every idle run follows a shipping run directly: the scheduler fires the missed slot as soon as the long run ends, and that run finds the new PR still in CI, so the WIP gate holds it (for example the 12:48Z run held for #2425). Throughput is bounded by ship → CI → merge, not by the shelf.

**Two overlapping pickup runs** were seen: the 20:51Z run picked up THR-1757 while the 20:11Z run was still building it, and pushed two commits before it stood down. The 23:31Z run also overlapped 23:51Z. This is the double-build pattern that [THR-1887](https://linear.app/threadbare/issue/THR-1887) fixed. It shipped as [#2418](https://github.com/christianspliid-ui/threadbare/pull/2418) on 10-15 06:31Z, and no overlap has appeared since. Next week's run checks it again.

## Tweak verdicts

| Tweak | Verdict |
|---|---|
| 2026-10-03: pickup `*/20` (THR-1717) | Closed last week (regressed, superseded). |
| 2026-10-09: WIP-until-merged claim gate | **Improved, week 1 of 2.** Catch-up 33.3 → 8.9 % (target ≤ 10 %, met). Slow 23.1 → 11.6 % (target ≤ 8 %, not met). Peak 6 → 3 (target ≤ 2, not met). Merges/day is 8.6, above the revert line of 7, and idle runs are half the lane, so the gate is not starving a stocked shelf. Fail-soft 0, 1 denial in the log. Kept open to confirm slow %. |
| 2026-10-15: sunset the inert Stop hook | New this week, open. |

**Why slow is still above target.** Five post-gate ticket PRs took over 60 min, and only two of them were conflict catch-ups:

- [#2382](https://github.com/christianspliid-ui/threadbare/pull/2382) (62 min): catch-up.
- [#2397](https://github.com/christianspliid-ui/threadbare/pull/2397) (135 min): catch-up.
- [#2410](https://github.com/christianspliid-ui/threadbare/pull/2410) (97 min): deliberate draft park behind THR-1930.
- [#2419](https://github.com/christianspliid-ui/threadbare/pull/2419) (112 min): red CI.
- [#2387](https://github.com/christianspliid-ui/threadbare/pull/2387) (104 min): an attended branch (`feat/luck-loot-and-streaks`), not the lane.

None of these points at a harness lever this week.

## Six-week sunset

| Gate / hook | Age | Catches | Verdict |
|---|---|---|---|
| `session-stop-gate.sh` (Stop) | since 2026-04-13 | None. No log, no impediment cites it, and its output shape (`hookSpecificOutput.continue`) is not one Stop hooks read | **Removed this week** |
| `stop-retro.sh` + `lib/json-get.js` | not registered | n/a, dead file | Removed with it |
| `review-gate.sh` | since 2026-10-02 | under 6 weeks | The gate's own renewal is due **2026-11-13**, counted from `review-gate-receipt` PR comments |
| `worktree-write-guard.mjs` | Node port 2026-10-03 (the `.sh` guard since 2026-07-21) | unknown, because it writes no log | Keep for now. It answers a measured trap (4 of 12 runs on 07-20/21, impediments #387, #417, #421), and its denials show in the session, not on disk. Its catches can't be counted, so next week's run adds a deny log, and it gets judged at the following sunset pass. |
| `wip-gate.ts` | since 2026-10-09 | 1 denial | Under 6 weeks |

## Hot-spot files

These are the files both main and the PR changed, for every catch-up merge on a ticket PR created since 10-08 (12 PRs):

| File | PRs |
|---|---|
| `Docs/changelog.md` | 10 |
| `Docs/project-history.md` | 9 |
| `src/types/trace.ts` | 5 |
| `scripts/interface-contracts.ts`, `public/system-interface-map-reference.html`, `Docs/impediments.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.generated.md` | 4 each |

**After the gate** (#2286, #2382, #2387, #2397, #2410) only the append-only tables still overlap: `Docs/changelog.md` ×3, `Docs/impediments.md` ×3, `Docs/project-history.md` ×2. Docs PRs doubled to 77 a week, and they are the main writers that move `main` under an in-flight ticket PR. GitHub ignores `merge=union`. The next lever, if catch-up rises again, is **one changelog/history fragment per PR**, the way `Docs/status/` already works. This week it is not justified: catch-up is back inside the baseline band, and it would be a DoD-wide procedure change, not a small tweak.

## Stuck now

`check:armed-prs`: healthy, 0 open non-draft PRs. Nothing was stuck for more than 6 h.

## What shipped

- [#2426](https://github.com/christianspliid-ui/threadbare/pull/2426): sunset the inert Stop hook (auto-merge armed). Review gate: 1 round, 0 findings. `npm run gate` and `--final` PASS.

## Handoffs to the Friday retro

- **`Heavy simulation tests` red on 66 % of `main` pushes this week** (56.7 % post-gate; 1.7 % before 09-19). This is the third week it has been handed off. The failure is **deterministic, not a flake**: the last 6 red runs all fail on the same two timeouts.
  - `src/engine/__tests__/debugTickBatch.test.ts` › "emits exactly one aggregate trace per call, never one per tick": about 5.2–6.1 s against a 5 s timeout.
  - `src/engine/__tests__/doomIdentityMilestones.test.ts` › "milestone triggered flag persists — no re-emission after first crossing": about 18.8–22.7 s against a 15 s timeout.

  It needs a product-side owner: raise the two timeouts or make the tests cheaper. Until then, a red heavy run on main carries no signal.

## Needs Christian

Nothing.
