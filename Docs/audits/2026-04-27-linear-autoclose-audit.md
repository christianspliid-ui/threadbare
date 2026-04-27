# Linear Auto-Close Audit — 2026-04-24 to 2026-04-27

**Issue:** [THR-276](https://linear.app/threadbare/issue/THR-276) — *Audit `Fixes THR-XX` merges since LINEAR_API_KEY went missing; manually close stragglers.*
**Run on:** 2026-04-27 (Cowork session)
**Window scanned:** `--since=2026-04-24 --until=2026-04-27` on `main`
**Headline:** **0 stragglers found.** Every issue referenced via `Fixes`/`Closes`/`Resolves` keywords in the audit window is in `Done` state at audit time. Three issues (THR-271, THR-272, THR-273) appear to have had their auto-close run skipped and were resolved by manual close before the audit; the remaining eight closed via the auto-close workflow within ≤4.3 seconds of the merge-to-main push.

## 1. Method

```
git log main --grep "Fixes THR-"    --since=2026-04-24 --until=2026-04-27
git log main --grep "Closes THR-"   --since=2026-04-24 --until=2026-04-27
git log main --grep "Resolves THR-" --since=2026-04-24 --until=2026-04-27
```

`Closes` and `Resolves` returned no matches; only `Fixes` is in active use across the executor lanes. Each unique THR-ID found was verified via `get_issue` against the Linear MCP. Bucketing rule per the THR-276 plan:

* **Auto-close fired** — `Done` with `completedAt` ≤ push-to-main commit timestamp + 60 s.
* **Manual close during gap** — `Done` with `completedAt` >> commit timestamp (no leak; close already applied).
* **Straggler** — any non-terminal state. Would require `save_issue(state: "Done")` plus comment.

For PR squash-merges, the push event is the squash commit itself. For PR merge-commits, the push event is the `Merge pull request` commit (used as the auto-close trigger reference). For direct pushes, the push event is the commit itself.

## 2. Commits scanned

13 commit references in 12 distinct merge-to-main events (THR-211 and THR-271 each appear in two events; the second `Fixes` was a no-op against an already-closed issue).

```
b6eb5fd5 2026-04-27 01:26:06 UTC  Fixes THR-275  (PR #47 squash)
d2ed9f2f 2026-04-26 13:21:04 UTC  Fixes THR-211, THR-271  (PR #44 squash — both already closed by earlier commits)
b0607829 2026-04-25 12:05:53 UTC  Fixes THR-271  (Codex retrigger; landed via PR #45 merge ab03e59a 12:16:56 UTC)
1671ea53 2026-04-25 11:07:46 UTC  Fixes THR-271  (PR #42 merge 8df265c2 11:32:25 UTC)
fcbaca1c 2026-04-25 09:28:43 UTC  Fixes THR-274  (PR #41 merge 8df265c2 11:32:25 UTC, batched)
546face3 2026-04-25 08:53:58 UTC  Fixes THR-258  (PR #40 merge 64411f33 09:06:25 UTC)
ead78819 2026-04-25 08:23:27 UTC  Fixes THR-256  (PR #39 merge 42264477 08:43:00 UTC)
eeb073f5 2026-04-24 16:07:50 UTC  Fixes THR-251  (PR #38 merge 589d025b 16:19:24 UTC)
fba8e33e 2026-04-24 15:08:52 UTC  Fixes THR-245  (PR #37 merge b3aad53a 15:23:06 UTC)
8bde63d2 2026-04-24 14:18:59 UTC  Fixes THR-273  (PR #36 merge 9d738605 14:31:24 UTC)
f8035bb4 2026-04-24 13:04:42 UTC  Fixes THR-211  (PR #35 squash)
846e195d 2026-04-24 12:19:08 UTC  Fixes THR-243  (PR #34 squash)
51e4aee7 2026-04-24 11:17:15 UTC  Fixes THR-272  (PR #32 squash)
```

Unique THR-IDs to verify: 11 — THR-211, THR-243, THR-245, THR-251, THR-256, THR-258, THR-271, THR-272, THR-273, THR-274, THR-275.

## 3. Per-ID bucket

| THR-ID | Push-to-main commit | Push UTC | Linear `completedAt` | Δ | Bucket |
|---|---|---|---|---|---|
| THR-211 | f8035bb4 (PR #35 squash) | 2026-04-24 13:04:42 | 2026-04-24 13:04:45.692 | +3.7 s | Auto-close fired |
| THR-243 | 846e195d (PR #34 squash) | 2026-04-24 12:19:08 | 2026-04-24 12:19:12.294 | +4.3 s | Auto-close fired |
| THR-245 | b3aad53a (PR #37 merge) | 2026-04-24 15:23:06 | 2026-04-24 15:23:09.952 | +3.9 s | Auto-close fired |
| THR-251 | 589d025b (PR #38 merge) | 2026-04-24 16:19:24 | 2026-04-24 16:19:27.508 | +3.5 s | Auto-close fired |
| THR-256 | 42264477 (PR #39 merge) | 2026-04-25 08:43:00 | 2026-04-25 08:43:03.975 | +4.0 s | Auto-close fired |
| THR-258 | 64411f33 (PR #40 merge) | 2026-04-25 09:06:25 | 2026-04-25 09:06:28.273 | +3.3 s | Auto-close fired |
| THR-271 | 8df265c2 (PR #42 merge) | 2026-04-25 11:32:25 | 2026-04-25 12:06:18.458 | +33 m 53 s | **Manual close during gap** (close preceded PR #45 retrigger merge ab03e59a at 12:16:56) |
| THR-272 | 51e4aee7 (PR #32 squash) | 2026-04-24 11:17:15 | 2026-04-26 18:11:11.169 | +2 d 6 h 54 m | **Manual close during gap** |
| THR-273 | 9d738605 (PR #36 merge) | 2026-04-24 14:31:24 | 2026-04-26 18:10:49.403 | +2 d 3 h 39 m | **Manual close during gap** |
| THR-274 | 8df265c2 (PR #41 merge, batched with PR #42) | 2026-04-25 11:32:25 | 2026-04-25 11:32:29.127 | +4.1 s | Auto-close fired |
| THR-275 | b6eb5fd5 (PR #47 squash) | 2026-04-27 01:26:06 | 2026-04-27 01:26:09.527 | +3.5 s | Auto-close fired |

**Counts:** 8 auto-close fires, 3 manual closes during gap, **0 stragglers**.

## 4. Refined gap window

The original THR-276 hypothesis ("secret missing roughly 2026-04-24 to 2026-04-26") is partially supported but not clean: auto-close was working on adjacent merges in the same window. The data shows three discontinuous skips rather than a continuous outage:

* **2026-04-24 ~11:17 UTC** — THR-272 skipped (PR #32 squash). Adjacent merges 12:19 and 13:04 the same day fired correctly.
* **2026-04-24 ~14:31 UTC** — THR-273 skipped (PR #36 merge). Adjacent merge at 15:23 the same day fired correctly.
* **2026-04-25 ~11:32 UTC** — THR-271 skipped (PR #42 merge). Notably, **THR-274 in the SAME merge-commit (8df265c2)** fired correctly — both `Fixes THR-274` and `Fixes THR-271` were introduced by 8df265c2, but only THR-274 closed within 4 s; THR-271 sat for ~34 minutes until manual close.

This pattern is inconsistent with a flat "secret missing" hypothesis. Two plausible refinements:

1. **Per-issue API failure.** `LINEAR_API_KEY` was set, but individual `updateIssue` calls failed for unrelated reasons (rate limit, transient 5xx, issue-state-machine rejection of the requested transition). The workflow may not retry per-ID failures. THR-271's skip in the same commit as a successful THR-274 close is strong evidence for this interpretation.
2. **Codex-authored branches.** All three skipped issues (THR-271, THR-272, THR-273) merged from `codex/*`-prefixed branches or at least one Codex-authored commit was the keyword carrier. THR-272's PR #32 was authored by `christianspliid-ui` but the original feature branch was also touched by Codex. The successful auto-closes (THR-211/243/245/251/256/258/274/275) all merged from `christianspliid/`-prefixed branches. Hypothesis: a `paths-ignore`/`branches-ignore` predicate or actor-based filter was rejecting the workflow for one path. Worth a follow-up grep on `.github/workflows/linear-autoclose.yml`.

The audit cannot distinguish (1) vs (2) without inspecting the workflow's run history. Both interpretations are compatible with the observation that **0 issues are currently non-terminal**.

## 5. Actions taken

* No `save_issue(state: "Done")` calls — there are no stragglers to close.
* No comments added to issues — every ID is already in its correct terminal state with a manual-close audit trail (where applicable) implicit in `completedAt` timing.
* Audit report committed: `Docs/audits/2026-04-27-linear-autoclose-audit.md` (this file).
* Changelog row appended: `Docs/changelog.md`.

## 6. Recommendations

1. **Move impediment #85 from "missing secret" to "auto-close skips occur but mechanism unconfirmed"** until run logs are inspected. The data does not support a flat outage window; it supports three intermittent skips.
2. **Add a per-merge auto-close health check** — a daily Cowork sweep that finds commits with `Fixes THR-XX` whose THR-XX is non-terminal would catch any future leaks within 24 h. Cheap to implement (one `git log` + N `get_issue` calls).
3. **Inspect `.github/workflows/linear-autoclose.yml` run logs** for the three confirmed skip events (PR #32 squash 2026-04-24 11:17, PR #36 merge 2026-04-24 14:31, PR #42 merge 2026-04-25 11:32) to see whether the workflow ran at all, ran but the API call failed, or was filtered out by a predicate. This is a 5-minute task in the GitHub Actions UI and would resolve the hypothesis ambiguity above.

## 7. Done-when audit

Per THR-276 plan §"Done when":

* [x] Audit script run on a clean `main` checkout, output captured. *(Bash via Cowork workspace mount, repository at HEAD of `main`, captured in §2.)*
* [x] Every straggler has been `save_issue`-d to Done and verified. *(Vacuously true — no stragglers.)*
* [x] Each straggler has a comment explaining the manual close. *(Vacuously true — no stragglers; the three already-manually-closed issues do not need an audit comment because their close was deliberate at the time.)*
* [x] `Docs/audits/2026-04-27-linear-autoclose-audit.md` exists.
* [x] `Docs/changelog.md` row added.
* [ ] Impediment #85 marked Resolved in the next dashboard regen. *(Recommend marking it Refined-not-Resolved per §6.1.)*
* [ ] Item from `Design/user-actions.md` "Resolved this period" can be retired on next retro day. *(Cleared for retirement.)*

## 8. Source

THR-276 (Continuous Improvement, Urgent). Retro 2026-04-27 Experiment #2. Impediments #85.
