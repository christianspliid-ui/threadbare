# Orchestrator — 2026-07-29

## Fifth run — 02:29Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired well before the gate, so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (02:29Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 11 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 40 items (19 `Deferral`, 21 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-646** ("THR-636 follow-up: capture live browser screenshots of encounter card + veil context strip + step replay") — no `Blocked by` line was ever declared; parent feature THR-636 is merged (PR #549) and the ticket's own text states "pure verification-artifact task — no code change expected." Held back by the ceiling across the prior four runs today. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 02:29:11.414Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: anything not touching `EncounterVeil*`/toast-rail/step-navigator; Mutex with: none). Picked over its equal-priority (Low) siblings THR-582 and THR-766 for the smallest blast radius — a read-only DOM screenshot pass touches no engine files, where THR-582 (inline-phase migration in `orchestrator.ts`) and THR-766 (cast-constants tuning) both edit central engine surfaces.

**Declined:**

- **THR-680** ("Stash triage") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across five consecutive sweeps now.
- **THR-735** ("Armed-PR staleness sweep") — new comment landed since the last run (02:05Z, remedy candidate 5 — phase-align the Step 0.8 sweep to the merge cadence) but the ticket still self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 remains `Done`, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers, not implementable units.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.

### T2 — design authoring (02:29Z)

**Not triggered.** Ready for Dev holds 21 non-`Deferral` items after this promotion (THR-646 carries the `Deferral` label, so it doesn't add to this count) — well above the floor of 2.

### T3 — architecture health (02:29Z)

**Not run.** Gated on the first run after 06:00 local; this run fired well before the gate. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (02:29Z)

None this run.

## Fourth run — 01:30Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 03:30 local (before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### Technical note (not Christian-facing)

THR-842 ("GitHub Actions is billing-blocked, so the required merge gate is SKIPPED") still sits in Ready for Dev, but the underlying condition looks resolved: the latest `main` CI run (30412992892, 01:03:53Z) shows `Detect code changes` executing its full step sequence (checkout, paths-filter, ~22s) rather than the ~3s zero-step billing-block signature the ticket describes, and `Test · Typecheck · Build` reads `skipped` for the legitimate reason (docs-only diff, paths-filter gate), not the failure mode. Leaving this for the executor to re-verify and close out items 2–3 (retro-verify the 3 unverified-by-CI PRs; record the SKIPPED-satisfies-branch-protection decision) rather than promoting or touching it myself — it's already Ready for Dev and not a T1 action.

### T1 — unblock sweep (01:30Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 12 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 39 items (19 `Deferral`, 20 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-348** ("Encounter UI post-v1 H3 — TTS implementation") — both named blockers confirmed `Done`: THR-336/ARC-105 (Phase D3 TTS discovery + spec, completed 2026-05-06T02:19:02Z) and THR-338 (Phase E2 detail pages, completed 2026-05-07T05:58:24Z). This is the ticket the prior run (00:31Z) flagged as the strongest next-run candidate, closing out the H1→H2→H3 sequence (H1/THR-346 promoted prior day 23:28Z; H2/THR-347 promoted 00:31Z this run-day). Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 01:29:51.011Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: THR-346, THR-347; Mutex with: none).

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across four consecutive sweeps now.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 re-confirmed `Done` (completed 2026-07-26T10:55:17Z), but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers, not implementable units.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.

### T2 — design authoring (01:30Z)

**Not triggered.** Ready for Dev holds 21 non-`Deferral` items after this promotion — well above the floor of 2.

### T3 — architecture health (01:30Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 03:30 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (01:30Z)

None this run.

## Third run — 00:31Z update (post-merge)

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 02:31 local (before the gate), so only T1 ran and T2's trigger was re-checked. This run also found and fixed a stuck auto-merge from the prior run — see below.*

### Needs Christian

Nothing needs you this run.

### Housekeeping

PR #1043 (prior run's report, promoting THR-346) was armed for auto-merge but stuck at `mergeStateStatus: BEHIND` — several docs/briefing PRs had merged to `main` since it was opened, and nothing was re-updating its branch. Merged `origin/main` into the branch and pushed; auto-merge should now clear on the next green CI run. (Known failure mode — THR-735 tracks the general "armed PR loses the race to main's merge rate" problem; this was one instance of it.)

### T1 — unblock sweep (00:31Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 13 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 38 items — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-347** ("Encounter UI post-v1 H2 — Constants tuning playtest") — both named blockers confirmed `Done`: THR-326 (Phase B4, Detection escalation, completed 2026-05-07T11:30Z) and ARC-98 (Phase B1, Choice resolution + drift accumulator, completed 2026-05-06T17:55Z). This is the sibling ticket the prior two runs (00:31Z, 23:28Z) both flagged as "strongest next-run candidate" once the ceiling allowed another promotion — continuing the H1→H2→H3 sequence (H1/THR-346 promoted 23:28Z). Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 00:30:54.035Z, state stuck) → coordination-block comment posted (Suggested model: opus-4-6; Parallel-safe with: THR-346, THR-348; Mutex with: none).

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live again.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops). Unchanged across three consecutive sweeps now; recommend a groomer close this as resolved-by-other-means or re-scope against the current stash state rather than the 2026-07-21 count.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone" among 4 candidate remedies. T2's input, not T1's. (This run hit a live instance of exactly the problem this ticket describes — see Housekeeping above.)
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate ("Needs its own design finalization before Ready for Dev" / "Needs a full design pass... before any Ready for Dev"). T2's input; T2 did not trigger this run.
- **THR-772** / **THR-778** / **THR-789** (Nudge Model epic, WS5 content-migration container, Traits program epic) — all three explicitly self-declare as staging/tracking containers ("do not implement from this issue" / "this issue is the container and tracks the batch burndown" / "each wave runs design finalization before Ready for Dev"). THR-778's actual blockers (THR-773, THR-776, THR-774) are all Done, but the ticket itself is not the implementable unit — its batch children (e.g. THR-838, already in Ready for Dev) are.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580, no blockers.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task, no blockers.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass, no blockers.
- **THR-348** (Encounter UI post-v1 H3) — blockers confirmed Done (THR-338, ARC-105); already carries a coordination block. Strongest next-run candidate to close out the H1→H2→H3 batch.

### T2 — design authoring (00:31Z)

**Not triggered.** Ready for Dev holds well above 2 non-`Deferral` items after this run (18+ before this promotion).

### T3 — architecture health (00:31Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 02:31 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (00:31Z)

None this run.

## Second run — 23:28Z update

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 23:28 local (before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep (23:28Z)

**Scan:** `list_issues(state:"Todo", limit:50)` → 14 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 37 items (19 `Deferral`, 18 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-346** ("Encounter UI post-v1 H1 — Sound design pass") — both named blockers confirmed `Done`: THR-334 (D1 ThreadOverlay, completed 2026-05-08T06:31:41Z) and THR-335 (D2 EffectRegistration, completed 2026-05-08T08:19:38Z). The ticket's own description states D1/D2 "shipped with `onResolveBeat` and `onEffectLand` callbacks ready" for this ticket to consume — both are live in `main`. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 23:28:57.582Z, state stuck) → coordination-block comment posted (Suggested model: opus-4-6; Parallel-safe with: THR-347/THR-348 and anything not touching `src/audio/*`, `ThreadOverlay.tsx`, `EffectRegistration/*`; Mutex with: none identified). Picked over its equally-ready siblings THR-347 (H2) and THR-348 (H3) — all three have Done blockers and their own coordination blocks — as the first phase of the H1→H2→H3 sequence; the other two remain the strongest next-run candidates.

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate, re-confirmed live.** `git stash list` from this session's worktree still shows only **2** entries (`home-tree-recovery` no-ops), not the 38 cited at filing. Unchanged from the prior sweep's finding; still flagged for a groomer to re-scope or close as resolved-by-other-means.
- **THR-735** ("Armed-PR staleness sweep") — no blocker; self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580.
- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass.
- **THR-347** / **THR-348** (Encounter UI post-v1 H2/H3) — blockers confirmed Done (THR-326/ARC-98 for H2; THR-338/ARC-105 for H3), each already carries a coordination block in its own description. Strongest next-run candidates once the shelf allows more than one promotion.

**Not re-verified this run:** THR-772/778/789 (Nudge Model / Traits program-epic containers — intentionally Todo, explicit "do not implement from this issue").

### T2 — design authoring (23:28Z)

**Not triggered.** Ready for Dev holds 18 non-`Deferral` items after this run — well above the floor of 2.

### T3 — architecture health (23:28Z)

**Not run.** Gated on the first run after 06:00 local; this run fired at 23:28 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations (23:28Z)

None this run.

## First run — 00:31Z

*T3 daily architecture-health sweep is gated on the first run after 06:00 local; this run fired at 00:31 local (well before the gate), so only T1 ran and T2's trigger was re-checked.*

### Needs Christian

Nothing needs you this run.

### T1 — unblock sweep

**Scan:** `list_issues(state:"Todo", limit:50)` → 15 candidates. `list_issues(state:"Ready for Dev", limit:100)` → 35 items (18 `Deferral`, 17 non-`Deferral`) — above `QUEUE_BACKED_UP_MIN=15`, so the shelf-backup ceiling capped this run to **at most one promotion**.

**Promoted (1, at the shelf-backup ceiling):**

- **THR-681** ("Worktree disposition — settle `.claude/worktrees` reaping ownership, act on NEEDS-DISPOSITION escalations") — no `Blocked by` line was ever declared; its stated prerequisite (THR-673, reaper hardening) has been Done since 2026-07-21. Re-verified live this run: `git worktree list` from a fresh session worktree shows **34 worktrees, 32 under `.claude/worktrees/`** — up from the 26 the ticket cited at filing, so the problem hasn't gone stale, it's grown. Picked over the other held-back candidates on priority (Medium vs. Low for THR-646/582/766/346/347/348) and because, unlike its sibling THR-680, it carries no home-tree-instruction caveat. Promoted → verified via `get_issue` (`stateHistory` shows Todo → Ready for Dev at 22:30:28.484Z, state stuck) → coordination-block comment posted (Suggested model: sonnet; Parallel-safe with: anything not touching `pull-work` Step 0 or the git-cleanup task scripts; Mutex with: none identified). The comment also documents a fact worth carrying forward: `git stash`/`git worktree` metadata lives in the **common `.git` dir**, shared across every worktree of this repo — confirmed live (`git rev-parse --git-common-dir` from the session worktree resolves to the home tree's `.git`). So neither stash triage nor worktree disposal actually *requires* running from the home tree; the THR-671/672/797 containment rules (no `checkout`/`switch`/`commit` with the home tree as CWD) still apply, but the read/dispose operations can run from any session worktree.

**Declined:**

- **THR-680** ("Stash triage — bulk-classify the 38-deep home-tree stash stack") — **stale predicate.** The ticket's premise no longer holds: `git stash list` from this session worktree shows only **2** entries (`home-tree-recovery` no-op stashes from routine freshness repairs), not the 38 cited at filing (2026-07-21) or the 26-never-inspected count. Whatever triage was needed appears to have already happened by other means. Declining rather than promoting a now-oversized/wrong-shaped task onto an executor; flagging for a groomer or a future orchestrator run to re-scope or close as resolved-by-other-means (THR-688 rule A: predicates, not stale counts — this predicate has visibly changed).
- **THR-735** ("Armed-PR staleness sweep") — no blocker, self-declares "design pass needed — do not pick one from this ticket alone." T2's input, not T1's.
- **THR-790** / **THR-791** (Traits wave 2 / wave 3) — blocker THR-786 confirmed Done, but both self-declare their own design-finalization gate. T2's input; T2 did not trigger this run.
- **THR-175** ("UI overhaul 08, agent.sphere field") — explicit `Status: DEFERRED`, unmet unblock trigger.

**Held back by the shelf-backup ceiling (no blocker, unchanged from prior sweeps):**

- **THR-646** ("THR-636 follow-up: capture live browser screenshots") — feature complete and merged per its own text; pure verification-artifact task.
- **THR-582** ("Migrate remaining ~46 inline phases to runInlinePhase") — mechanical tail of THR-580.
- **THR-766** ("Tune the god's cast power curve") — parent THR-728 confirmed Done; bounded tuning pass.
- **THR-346** / **THR-347** / **THR-348** (Encounter UI post-v1 H1/H2/H3) — each has its blockers confirmed Done and already carries a coordination block in its own description. Strongest next-run candidates once the shelf allows more than one promotion.

**Not re-verified this run:** THR-772/778/789 (Nudge Model / Traits program-epic containers — intentionally Todo, explicit "do not implement from this issue").

### T2 — design authoring

**Not triggered.** Ready for Dev holds 17 non-`Deferral` items after this run — well above the floor of 2.

### T3 — architecture health

**Not run.** Gated on the first run after 06:00 local; this run fired at 00:31 local. Last sweep: 2026-07-28 07:42Z (see `orchestrator-2026-07-28.md`).

### Escalations

None this run.
