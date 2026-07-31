# Git/CI-CD clean delivery — root cause and target state

**Date:** 2026-07-20 · **Author:** Fable investigation session (planning only; executor lane implements)
**Origin:** user directive 2026-07-20 ("agents are spending tons of time and resources on perceived issues with CI/CD… needs to be investigated. In depth.") via `Docs/audits/2026-07-20-git-cicd-forensics/investigation-brief.md`
**Evidence:** `Docs/audits/2026-07-20-git-cicd-forensics/` (forensics.txt, staged.patch, unstaged.patch), `C:\Users\chris\bin\threadbare-autosync.log`, `C:/Users/chris/Dev/Projects/clean-stale-git.log`, `.git` reflogs, `~/.claude/scheduled-tasks` registry, session transcripts under `~/.claude/projects/*TheFantasyWorldSimulator*`
**Tickets:** THR-671 (freshness signal), THR-672 (inert home tree), THR-673 (reaper hardening), THR-674 (one-time cleanup), THR-675 (frictionless PRs), THR-676 (upstream report)

---

## 1. Root-cause narrative (causal order; proven vs inferred)

**P = proven** (direct artifact evidence) · **I = inferred** (mechanism fits all observations; no direct witness)

1. **[P] The system runs more sessions than anyone thought.** Three enabled hourly scheduled tasks spawn headless CC sessions: `tb-opus-pickup` (cron `0 * * * *`, jitter 53 s → fires ~:00:53), `flush-plan-docs` (cron `0 * * * *`, jitter 229 s → ~:03:49), `keep-work-flowing-cc` (cron `20 * * * *`, jitter 493 s → ~:28:13). Each spawn gets a harness worktree under `.claude/worktrees/`; subagent forks get their own. Measured: **9 worktrees created 09:01:12–09:03:35 on 07-19 alone**, 16 that day (`.git/worktrees/*` creation timestamps).

2. **[P] The CC app/harness syncs local `refs/heads/main` to `origin/main` at spawn time, via plumbing.** The `main` reflog carries **empty-message updates at :01–:03 past the hour** (e.g. `main@{2026-07-19 11:01:28}`, with worktree `pensive-cannon` created 11:01:29 — same second). Empty reflog messages are the signature of `git update-ref`-style plumbing, not porcelain fetch/merge/reset.

3. **[P for the event, I for the mechanism] Moving `main` under a checked-out tree manufactured the "68 staged files".** On 07-18 20:01:06 the plumbing sync moved `main` forward *while the home tree had `main` checked out* (autosync log at 20:50 confirms `branch == main`; behind-count dropped 30 → 3). `update-ref` moves the branch but touches neither index nor working files — so `git status` afterward reports the difference between new HEAD and old index as **staged changes**. That is exactly the observed pile: 221 insertions / 3,379 deletions that *reverse* freshly-merged work (THR-614's `quintessence`→`cohesion` rename, THR-575's CLAUDE.md trim, deletion of newly-added files like `codexRunState.ts`). **Nobody staged anything; no agent wrote damage.** The earlier theory in the brief ("a `git checkout <old-ref> -- <paths>` staged an older snapshot") is retired — no transcript contains such a command against these paths, and the ref-moved-under-tree mechanism explains the staged/unstaged split precisely (staged = tracked delta vs moved HEAD; unstaged = live `.codesight` regeneration by the SessionStart codesight hook).

4. **[P for events, I for the actor's code path] A bare `git checkout HEAD` detached the home tree three mornings running** — 07-17 10:36:13 (from `main`), 07-18 09:01:41 (from `claude/sad-bartik-421eef`, **48 seconds after the :00:53 tb-opus spawn instant**), 07-19 10:55:03 (from `main`). Transcript search across every `*TheFantasyWorldSimulator*` project directory finds **no executed bare `git checkout HEAD` in any agent session** — only the harmless pathspec form and *discussions* of the mystery. Agent shell commands always appear in transcripts; harness git operations do not. Conclusion: **the actor is the CC app/harness layer** — the same non-transcript layer doing the plumbing ref-syncs in (2). The exact trigger inside the closed binary is **unproven**; the effect correlates with session-spawn/setup windows.

5. **[P] Scheduled sessions also used the home tree as a working surface.** The HEAD reflog shows the 07-17 flush-plan-docs run checking out `claude/sad-bartik-421eef` and doing its plan-flush branch dance *in the home tree* (17:05–17:07), leaving the tree parked on a session branch; the 07-19 05:31 keep-work-flowing run did its `docs/briefing-*` checkout-commit-checkout cycle in the home tree too. This is how the home tree ends up on random branches even before any harness detach.

6. **[P] The freshness signals then measured the wreckage wrongly and escalated it.** `keep-work-flowing-cc` § 2 computes `HEAD..origin/main` — on a parked/detached HEAD that number is the frozen snapshot vs a moving main: "58 → 79 behind and climbing", while local `main` was **0 ahead / 0 behind the entire time** (kept current by the harness ref-sync of (2), ironically). `session-precheck.ts` returns `freshness=detached` (status unknown) with no guidance, and CLAUDE.md's session-workflow bullet doesn't map `detached` at all — so agents treated it as a hard stop and re-diagnosed from scratch, hourly. The repair, once correctly diagnosed, was `git stash push` + `git switch main` — **the multi-day cost was diagnosis, not damage.**

7. **[P] Cleanup exists but leaks.** `clean-stale-git.sh` + the daily "Threadbare Git Cleanup" Windows task genuinely work (07-19 09:00 run: down to 12 worktrees / 32 branches) — but the log shows a 07-06→07-17 outage, the 07-20 09:55 attempt was refused by Task Scheduler (result `-2147020576`) with **no alerting**, and a daily cadence loses to ~15 worktree-creations/day: the count regrew 12 → 27 within a day. Worktrees holding unmerged branches (7 from 07-05) are kept forever with no escalation path. The 12-deep stash stack (four separate "THR-409 worktree graveyard cleanup" WIPs) is the recurrence record of sessions each re-doing this cleanup by hand.

8. **[P] The guards that exist behaved correctly.** `threadbare-autosync.ps1` (created 07-18 18:48) never destroyed anything: it skipped on phantom dirt, then skipped on detachment, exactly as designed. Branch protection kept the phantom reversal pile off `main` for its entire life. THR-660 (untrack `.codesight/`, landed 07-19) already removed the biggest recurring dirt source.

## 2. Premise test — "we are only running one agent at a time"

- **At the Linear claim level: true.** WIP = 1 holds; there is a single executor lane and one `Ready for Dev` queue.
- **At the session/process level: false.** Two scheduled sessions spawn within ~3 minutes of each other at the top of every hour, a third at :28, plus Christian's interactive morning session, plus Task-tool subagent forks — 9 worktrees in a 2.5-minute window on 07-19 is direct evidence of concurrent session existence.

**Consequence for H2b (drop worktrees?): No — keep them, but make them cheap.** Sessions genuinely overlap, so shared-tree execution would produce real collisions, not phantom ones. The worktrees themselves were never the disease: creation is harness-automatic and free; the costs were (a) nobody reaping them reliably, (b) the home tree not being inert, and (c) signals that read the resulting mess as decay. The middle option (one persistent reusable executor worktree) is rejected: worktree lifecycle is harness-controlled, not ours to pool, and it retains the bare-path footgun (`feedback_worktree_edit_paths`) while giving up crash isolation. The dev-server/DoD friction (`feedback_worktree_preview_server`) is real but is a verification-workflow cost, not a reason to serialize all execution into one tree.

## 3. Cost quantification (defensible estimate, method stated)

- **Impediment log:** 92 of 409 lines (~22%) in `Docs/impediments.md` mention dirty-tree / worktree / stale / rebase / freshness / detach friction; 62 lines mention the `check:skill-sync` hook workaround.
- **Whole sessions lost to this class, 07-17 → 07-20 alone:** the 07-17 rescue session (`rescue/2026-07-17-detached-plans`), the 07-20 repair session (~half a morning), and 6+ briefing runs that each spent their budget re-deriving and re-wording the false "behind" alarm. Historically: four abandoned THR-409 cleanup attempts (stash evidence), plus amnesty tickets THR-395, THR-409, THR-488.
- **Recurring tax:** every pickup session runs precheck + sweep + upstream-check overhead (~1–3 min/session × ~24 spawns/day); every ship poll-waits on CI (~3–8 min).
- **Estimate:** on the trailing week, **roughly 10–20% of automation-lane wall-clock and tokens** went to git/staleness handling rather than product work, concentrated in bursts around the three detach mornings; at least three full sessions were lost outright. Uncertainty is ±half; the number is bounded below by the artifact-documented session losses alone.

## 4. Hypothesis verdicts

| # | Hypothesis | Verdict |
|---|---|---|
| H1 | Freshness signal miscalibrated, manufactures alarm | **Confirmed.** `HEAD..origin/main` on a parked HEAD + unmapped `detached` key + hard-stop protocol. → THR-671 |
| H2 | Something runs bare `git checkout HEAD` daily | **Confirmed as events; actor is the CC harness (transcript-absence proof); exact code path unproven.** → THR-672 (containment), THR-676 (upstream) |
| H2b | Worktrees net-negative at concurrency 1 — drop them? | **Rejected — concurrency is not 1 at the session level.** Keep worktrees; fix reaping + home-tree inertness. § 2 |
| H3 | Nothing owns cleanup | **Partially wrong.** A reaper exists and works, but fails silently, ran daily against ~15/day creation, and never escalates unmerged strays. → THR-673, THR-674 |
| H4 | Home tree used as a working surface | **Confirmed, two actors:** harness ref-sync/detach + scheduled-session branch dances (07-17, 07-19 reflog). The "68 staged edits" were phantom, not writes. → THR-672 |
| H5 | Pre-commit hooks add route-around friction | **Confirmed** (62 impediment-log mentions of skill-sync). → THR-675 |
| H6 | Branch protection heavier than a single-executor system needs | **Rejected.** The PR gate is what kept the phantom 3,379-line reversal off `main`. Keep protection + CI; remove the cost via auto-merge. → THR-675 |

## 5. Target state — "clean delivery every time", mechanically

- **Where agents work:** scheduled/executor sessions in harness worktrees (unchanged); Christian's interactive session in the home tree.
- **Who owns the home tree:** `threadbare-autosync.ps1`. To every automated session the home tree is a **read-only mirror of `main`**; only interactive sessions (and the one-time THR-674 salvage) may mutate it. Scheduled sessions do commit/branch work in their own worktree — branches are repo-global, push works from any worktree (THR-672).
- **Self-healing park recovery:** autosync gains a reattach step — detached + `rev-list --count origin/main..HEAD` = 0 + no tracked modifications → `git switch main` automatically. The known harness re-park recurs and heals within the hour instead of festering for days (THR-672).
- **Worktree lifecycle:** created by the harness per session; reaped **hourly** by `clean-stale-git.sh` (merged + clean → removed; unmerged + >14 days → `NEEDS-DISPOSITION` escalation into the briefing, never auto-deleted). Reaper health is visible in the briefing within an hour of failure (THR-673).
- **Freshness signal states** (exhaustive, each with its action): `current` · `ahead:N` (push pending) · `behind:N` (pull) · `stale-branch` (close it) · **`parked-at-ancestor`** (run the two-command repair — safe, loses nothing) · **`parked-with-unique-commits:N`** (stop; hand SHAs to a session) · `unknown` (surface). The briefing never reports a behind-count for a HEAD that is not on `main` (THR-671).
- **Shipping:** PR + required `Test · Typecheck · Build` check stays; `gh pr merge --auto` on every executor PR so no session waits on CI; skill-sync hook stops false-positive blocking (THR-675).

## 6. Fast mechanical repair path (deliverable #4 — runnable without judgment)

```powershell
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git fetch origin main
git rev-list --count origin/main..HEAD    # SAFETY CHECK — read the number
```

- **Prints `0`** → nothing unique is stranded; proceed (loses nothing authored — untracked files survive, the stash is recoverable):

```powershell
git stash push -m "home-tree-recovery"    # harmless no-op if the tree is clean
git switch main
git pull --ff-only origin main
```

- **Prints anything else** → STOP. Real commits are stranded off-branch. Run `git log origin/main..HEAD --oneline` and hand the SHAs to a session; do not reset, do not force.

Do **not** use `git rebase origin/main` (fails from detached HEAD) or `git switch main && git pull` without the stash (drags tracked edits). This block also lands in `Design/user-actions.md` item #4 and, via THR-671, in the precheck's own output.

## 7. Tickets and sequencing

| Order | Ticket | Scope (§ ref) | Priority | Constraint |
|---|---|---|---|---|
| 1 | **THR-671** | Freshness signal rework (§ 5 states; precheck + kwf skill + CLAUDE.md) | High | Parallel-safe with all |
| 1 | **THR-672** | Inert home tree: autosync reattach + no scheduled-session git state ops in home tree | High | Mutex THR-673 (kwf skill) |
| 2 | **THR-674** | One-time cleanup: 15 untracked docs, 12 stashes, 07-05 worktrees/branches | Medium | Mutex THR-673; land before it |
| 3 | **THR-673** | Reaper hardening: fix task refusal, hourly at :40, age escalation, briefing line | Medium | After THR-674 |
| any | **THR-675** | Frictionless PRs: auto-merge, skill-sync hook fix (H6 verdict: keep protection) | Medium | — |
| any | **THR-676** | Upstream harness report (file only after Christian's chat yes) | Medium | External post gated |

All in project **Continuous Improvement**; coordination blocks posted on each issue.

## 8. Briefing-narrative correction (deliverable #6)

The 2026-07-20 10:22 `keep-work-flowing-cc` run already replaced "77 behind, climbing, needs manual triage" with the parked-snapshot framing in `Design/briefing.md` and `Design/user-actions.md`. This investigation additionally corrects, in `Design/user-actions.md` (same-day edit alongside this doc): item #4's "cause unidentified / agent-tooling inference" → the transcript-absence finding and harness attribution with ticket pointers; and the Resolved-section claim that the staged pile came from a `git checkout <old-ref> -- <paths>` → the ref-moved-under-checked-out-tree mechanism (§ 1.3). The durable wording fix for future briefings is THR-671 scope.

## 9. Governance notes

- **Three-pillar check: N/A — deliberate.** This plan touches no Engine, Content, or UI surface; it is agent-workflow infrastructure with zero player-visible behavior. Marked explicitly per the investigation brief rather than skipped.
- **Forked audits / intent-judge:** consciously not spawned — those gates exist for game-design plan docs heading into the Cowork handoff; this is an infra investigation executed under the Fable planning-only protocol, and the originating intent is quoted verbatim in § header. If a reviewer wants the judge pass anyway, run `/intent-judge Docs/plans/2026-07-20-git-cicd-clean-delivery.md`.
- **Substrate check:** no engine systems involved; the "existing substrate" here is the script/skill inventory audited in § 1 (autosync, reaper, precheck, pull-work, kwf) — all extended, none green-fielded. THR-660's `.codesight` untracking is prior art already landed.

## 9b. Armed-PR stall classification (THR-897, added 2026-07-31)

H6 kept branch protection and removed the waiting cost via `gh pr merge --auto` (THR-675). That trade assumed an armed PR eventually merges on its own. Two defects in the same mechanism say otherwise, and they are **not** the same defect:

| | THR-735 (open) | THR-897 (this section) |
|---|---|---|
| Nature | **Drain rate** — `BEHIND` PRs drain at 1/hour vs `main`'s ~4 merges/hour | **Classification** — `DIRTY` PRs were never in the drain set at all |
| Symptom | A PR that loses a race it usually loses | A PR that cannot merge by any amount of sweeping |
| Remedy | Merge queue / drop strict mode / batch docs traffic (undecided) | Classify and report — shipped |

**The classification gap.** pull-work Step 0.8 matched `mergeStateStatus === "BEHIND"` and applied `gh pr update-branch`. A conflicted PR is not `BEHIND`, so it was skipped; `update-branch` would not have helped anyway. The step's prose did mention `DIRTY`, but with no mechanism and a log line reporting only what it drained — so every run stepped past it truthfully claiming success.

Measured 2026-07-31 during THR-897's own pickup: **3 of 4 armed PRs were `DIRTY`**, the oldest armed 19 hours carrying THR-883's authoring-contract rewrite (the deliverable unblocking 11 content tickets), across three consecutive sweeps that each reported success.

**Shipped:** `scripts/check-armed-prs.ts` (`npm run check:armed-prs`) classifies each armed PR into `drainable` / `conflicted` / `waiting` / `indeterminate` and computes conflicting file names read-only via `git merge-tree --write-tree`. Consumed by pull-work Step 0.8 (per-run action) and `keep-work-flowing-cc` step 2.5c (durable surface in `Design/briefing.md`), so the two cannot drift about what "stuck" means.

**Two design points worth keeping:**

- **`UNKNOWN` is not "fine".** GitHub computes `mergeStateStatus` lazily; a first read returns `UNKNOWN` and merely schedules the computation. PRs #1132 and #1166 each read `DIRTY` then `UNKNOWN` minutes apart with no intervening push — a single-read classifier would call a conflicted PR healthy on roughly every other run. Unrecognised states classify `indeterminate`, never `waiting`, because `waiting` asserts nobody needs to act.
- **A conflict is an agent's job until it isn't.** Per THR-608, technical verdicts are the agent's, so the first age tier escalates to a *session* (`needsSession`), not to Christian. Only past `ARMED_DIRTY_ABANDONED_HOURS` — ~12 hourly runs that each had a chance and none took it — does the stall become systemic enough to be his.

## 10. Constants

| Constant | Default | Where | Purpose |
|---|---|---|---|
| `WORKTREE_ESCALATE_DAYS` | 14 | clean-stale-git.sh (THR-673) | Unmerged worktree age → NEEDS-DISPOSITION escalation |
| Reaper cadence | hourly, :40 | Windows task (THR-673) | Free slot per CLAUDE.md slot-allocation table |
| `STALENESS_BEHIND_THRESHOLD` | 5 (existing) | session-precheck.ts | Behind-count that flips freshness to warning |
| Autosync reattach guard | detached ∧ unique-commits=0 ∧ tracked-clean | threadbare-autosync.ps1 (THR-672) | Only self-heal the provably-loss-free case |
| `FRESHNESS_BEHIND_THRESHOLD` | 10 (existing) | kwf skill | Briefing flag threshold — applies to `main..origin/main` only after THR-671 |
| `ARMED_SWEEP_MAX_UPDATES` | 1 (existing) | pull-work Step 0.8 (THR-702) | Drains one PR per run; more re-stales the rest (O(N²) CI) |
| `ARMED_DIRTY_ESCALATE_MINUTES` | 90 | check-armed-prs.ts (THR-897) | Conflict age at which a session must pick the PR up |
| `ARMED_DIRTY_ABANDONED_HOURS` | 12 | check-armed-prs.ts (THR-897) | Conflict age at which the stall becomes Christian's |
| `ARMED_UNKNOWN_REQUERIES` | 3 | check-armed-prs.ts (THR-897) | Re-reads before believing an `UNKNOWN` merge state |

## 11. Fail-soft table

| Failure case | Behavior |
|---|---|
| Repair path finds unique commits (`rev-list` ≠ 0) | Hard stop with SHA list; no reset ever |
| Autosync reattach guard partially true (e.g. detached but dirty) | No action; one loud log line with the manual repair block |
| Reaper Task Scheduler refusal recurs | Summary line missing from log → kwf briefing flags "reaper silent > 2h" (THR-673) |
| Plan doc not yet flushed when a pickup claims a ticket | Ticket descriptions carry the § summary + "defer one cycle" note |
| Harness re-parks the tree despite everything | Contained: autosync reattaches within the hour; freshness reports `parked-at-ancestor` with the repair, not a behind-count |
| Deleting salvage debris that later proves wanted | THR-674 requires per-item verdicts in the PR body; stashes/branches verified against origin/main before drop |
| `check-armed-prs` cannot reach GitHub | Degrades to `verdict: "unknown"`, exits 0; Step 0.8 logs one warning and continues to pickup (THR-897) |
| A PR head ref is unfetchable, so conflicting files cannot be computed | `conflictFiles: []` with the `conflicted` verdict intact — the stall is still reported, just without the diagnosis |
| GitHub returns an enum member the probe does not know | Classified `indeterminate`, never `waiting` — the probe declines to assert nobody needs to act |

## NFP Compliance

| Priority | Verdict |
|---|---|
| 1 Tunability | PASS — every threshold/cadence is a named constant (§ 10) |
| 2 Inspectability | PASS — every script logs one-line traces; reaper health surfaces in the briefing; reflog evidence preserved in the audit dir |
| 3 Determinism | N/A — no simulation surface |
| 4 Fail-soft | PASS — § 11; no destructive default anywhere in the design |
| 5 Narrative over mechanics | N/A |
| 6 Additive over destructive | PASS — extends existing scripts/skills; deletions confined to the audited one-time cleanup with per-item verdicts |
| 7 Performance budget | PASS — reaper is idempotent and cheap at hourly cadence; no new per-tick cost anywhere |
