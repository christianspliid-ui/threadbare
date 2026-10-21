# Workflow Retro — 2026-10-21

Covers 2026-10-14T09:20Z → 2026-10-21T09:20Z. Previous report: [`workflow-retro-2026-10-14.md`](https://github.com/christianspliid-ui/threadbare/blob/main/Design/retros/workflow-retro-2026-10-14.md).

## Needs Christian

**One thing waits on you: the pipeline trim you approved on 10-15 is stuck at the first step.**

- You approved six "slim the pipeline" tickets in chat on 10-15. One shipped: the freeze itself, [THR-1946](https://linear.app/threadbare/issue/THR-1946).
- [THR-1947](https://linear.app/threadbare/issue/THR-1947) cuts per-PR paperwork and makes the wiki check a warning. The unattended run claimed it on 10-20, and the permission layer refused every edit to the gate and CI files ("CI Bypass"). It is parked In Dev with nobody on it. Its sibling [THR-1949](https://linear.app/threadbare/issue/THR-1949) will hit the same wall.
- **Recommendation:** either run THR-1947 in an attended session, or allow the unattended lane to edit `scripts/gate.ts`, `.github/workflows/ci.yml` and `Docs/canon/definition-of-done.md`. The second unblocks all three tickets that touch the gate, including the new one below.
- Reply "attended" or "allow it" in chat.

The other two siblings, [THR-1948](https://linear.app/threadbare/issue/THR-1948) and [THR-1950](https://linear.app/threadbare/issue/THR-1950), are not blocked. They have waited six days in Ready for Dev because the pickup lane takes at most one process ticket per three runs and fills that slot with product work first. That is the throttle working as written, so no ticket was filed for it. If you want the trim done before the freeze ends on 11-13, say so and the groomer can raise their priority.

## Throughput

- **About 106 issues completed** in the window, against 86 last week and 79 the week before. About 13 of them are wayfinder decision tickets: the Mortal Economy map was decided and closed 10-15.
- **153 pull requests merged**, and none is open right now. There were **551 non-merge commits** on `main`.
- **Commits per day (local):** `10-14: 75 · 10-15: 94 · 10-16: 96 · 10-17: 71 · 10-18: 86 · 10-19: 20 · 10-20: 93 · 10-21 (to 11:20): 16`.
  - There were two quiet stretches. The first ran from 10-18 20:26 to 10-19 19:42 local, about 23 h with no commits. The second ran from 10-20 20:07Z to 10-21 05:53Z, about 10 h with no pickup runs.
  - The run history doesn't show a cause for either. The pattern fits the machine sleeping or a usage-limit pause, not a lane fault. See Notes.
- **Composition.** Continuous Improvement completions were THR-1887, THR-1891, THR-1927, THR-1946 and THR-1995. Two of those (THR-1927, THR-1995) were incident fixes for heavy tests going red on `main`. The rest was product: the UI carve-up (Inspector S2–S6, the Stage slices 2–4, screen frame, lenses, icons, minimap), the economy plan docs and their S2 slices, and cold playtest round 4.
- **Pickup run outcomes.** The newest 50 of 2,231 runs reach back to 10-19 19:11Z (about 38 h):
  - **26 did real work**, from 7 to 140 min each.
  - **24 exited in under 5 min.** Almost all were the WIP-until-merged gate waiting on an armed PR's checks, which is correct.
  - **1 overlapped a live run** (10-21 08:25Z), which became THR-2003.
  - Last week the same sample showed 11 working runs in 21.5 h. Utilisation is clearly up.
- **Queue depth: healthy.** Ready for Dev holds **29** today (25 on 10-18, per the design lane's claim note). It never ran dry.
  - 4 of the 29 are the freeze-trim process tickets above, plus THR-1888 from last week (7 days, still unpicked).
  - Several cold-round-4 items carried `Claimable from:` holds that have now expired.

## Findings filed

- **[THR-2003](https://linear.app/threadbare/issue/THR-2003): an engine-diff gate now runs past the 600 s command cap, so pickup runs must background it, and on 10-21 a second run took over a live one.**
  - Impediment 1209 has 8 occurrences in about 2 days. The gate measured 669–942 s, and `test-heavy` alone takes 578–648 s.
  - The pickup skill's liveness check relies on runs never ending their turn early. That can't hold when the gate is longer than the cap.
  - Cost so far: about 26 min of duplicated review-gate work on [PR #2510](https://github.com/christianspliid-ui/threadbare/pull/2510), plus a fix left as an unpushed patch.
  - Preferred fix: drop `test-heavy` from the local gate, since CI's post-merge heavy lane already owns it. That is a removal, so it fits the freeze.
  - Filed as High, `Ready for Dev`, Continuous Improvement, Improvement + Infrastructure, coordination block inline (mutex with THR-1947/1949).
  - Re-read with `get_issue`: state `Ready for Dev`, assignee null.

Only one ticket was filed, deliberately. The freeze ([THR-1946](https://linear.app/threadbare/issue/THR-1946)) allows only removals and fixes for broken runs, and this is the only finding that broke a run.

## Clean checks

- **Ship mechanics: PASS.**
  - **78 distinct line-anchored `Fixes THR-XX` closers** on `main` in the window. Every one landed on an issue that is now Done.
  - No merged PR left its issue open, and no PR is open.
  - The Done issues without an in-window commit-body closer are all accounted for:
    - Nine (THR-1858, 1893, 1900, 1903, 1909, 1915, 1935, 1937, 1963) have merged landing PRs. They closed from the PR body or branch, and the commit body lacks the line. That is cosmetic drift against the DoD wording, not a false close.
    - THR-1819's closer predates the window.
    - Wayfinder tickets fall under the carve-out.
    - Six design-lane closures (THR-1980, 1981, 1982, 1983, 1939, 1842) each carry a decision record with linked outputs. That is the practice [THR-1888](https://linear.app/threadbare/issue/THR-1888) proposes to ratify.
  - No false close (THR-540 pattern) found.
- **CI: PASS.** `ci.yml` since 10-14 shows 306 success, 12 failure and 43 cancelled (superseded pushes).
  - The post-merge heavy lane went red twice. Both times an incident ticket landed within a day ([THR-1927](https://linear.app/threadbare/issue/THR-1927) on 10-14, [THR-1995](https://linear.app/threadbare/issue/THR-1995) on 10-20), and it has been green since.
- **WIP and claim discipline: PASS apart from THR-2003.**
  - In Dev holds one item, THR-1947, parked and unassigned with a full checkpoint (Needs Christian above).
  - No issue sat claimed for 24 h+ without a checkpoint.
  - No executor wrote `state:"Done"`.
  - The THR-1887 claim-time check held: no duplicate *claim* this week. The one overlap came through the PR-takeover path.
- **Checkpoint hygiene: PASS.**
  - Unfinished runs leave checkpoint comments or `wip(...)` commits ("checkpoint before verify") with clear next steps.
  - No issue reached 3+ checkpoints without shipping. THR-1937 took four runs across review-gate rounds and merged at 09:18Z today.
- **Handoff quality: PASS (sampled).**
  - Design-lane decisions keep the Decision / Why / Options / Would change / Outputs shape with code-cited evidence and `Claimable from:` holds ([THR-1981](https://linear.app/threadbare/issue/THR-1981)).
  - Build tickets name their plan doc in the description ([THR-1984](https://linear.app/threadbare/issue/THR-1984)).
  - Orchestrator promotions restate the full block with mutex reasons and promotion evidence ([THR-1999](https://linear.app/threadbare/issue/THR-1999)).
  - I saw no pickup bounces for a missing block.

## Handoffs to the Friday retro

- **The heavy lane went red twice in 7 days** on timing budgets: a frame budget at 17.2 ms against 16 ms, and two simulation timeouts. Both were fixed fast, but timing assertions on shared CI runners are flaky. This is test health.
- **The commit-body closer line is drifting.** Nine landings closed via PR body only. That's harmless to auto-close, but the DoD says both. If the freeze-trim tickets cut paperwork, this rule is a candidate for the same cut.

## Notes

- **Why THR-2003 is High and in scope during the freeze.** It meets the Rule 0 recurrence bar (8 in about 2 days) and it cost a run. The freeze's exception (b) covers "fixing machinery that broke or blocked a run, with the run cited".
  - The recommended shape removes a local gate step instead of adding a new one.
  - It touches `scripts/gate.ts`, the same file the permission layer refused for THR-1947, so it may need the same unblock. The ticket says to park, not retry.
- **Why the 08:25Z run took over a live run, from its transcript.**
  - The 08:11Z run had pushed a fix with no checkpoint comment, and its gate was running in the background, so its turn had ended and it looked dead.
  - The 08:25Z run took the PR over. The 08:11Z run was then woken by its background notification and pushed first.
  - The 08:25Z run stood down correctly when its push was rejected. Its unpushed patch is in that session's scratchpad.
  - The skill already forbids backgrounding, but the gate's length makes that rule impossible to follow. That is why the fix goes at the gate, not at the rule text.
- **The quiet stretches are not filed.** The 10-18/19 gap starts before the oldest run in the 50-row history, so I can't tell a machine sleep from a usage-limit pause. The 10-20/21 gap shows no runs at all, not failed ones, which points to the host, not the lane. If the hourly brief's lane-silence probe didn't flag either, the Friday retro can look at that.
- **The process-ticket queue is starving, not broken.** THR-1888 (7 days), THR-1948 and THR-1950 (6 days) sit unpicked. The throttle is a ceiling, and product work outranks them. I report it under Needs Christian rather than filing a rule change, because the freeze forbids new standing lane rules.
- **No queue mutation.** This retro claimed nothing, moved nothing and closed nothing. It created one issue (THR-2003).
