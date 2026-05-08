# THR-215 — Weekly memory-grooming scheduled task

**Date:** 2026-05-08
**Status:** Ready for Dev (CC pickup)
**Issue:** [THR-215](https://linear.app/threadbare/issue/THR-215)
**Project:** Continuous Improvement
**Suggested model:** Haiku
**Parallel-safe with:** Any non-CLAUDE.md-touching issues
**Mutex with:** None (additive)
**Codex review:** No (mechanical wiring; first manual run is the gate)

## Goal

Stand up a weekly scheduled task that invokes the `consolidate-memory` skill
across all three agent memory directories (Cowork, Claude Code, Codex) so
memory hygiene happens automatically rather than slipping with manual cadence.

## Why now

* The skill exists and has been used manually with positive results.
* THR-288 (UL Obsidian mirror) shipped, so the broader hygiene infrastructure
  is landing — this slot in.
* `weekly-retro` already established the scheduled-task pattern; this reuses
  it.

## Implementation

### Step 1 — Verify per-agent memory directory paths (5 min)

Before creating the task, confirm the actual on-disk paths for each agent's
memory files. CC's path under `.claude/` is well-known; Cowork and Codex
paths must be verified before they're encoded into the task prompt.

Acceptable to discover via a quick dry-run: invoke `consolidate-memory`
manually once for each candidate path, see which exist, encode the live ones.

### Step 2 — Create the scheduled task (interactive CC session)

Per CLAUDE.md "Weekly continuous-improvement cycle" guidance, scheduled
tasks are created from a non-scheduled CC session using
`create_scheduled_task`. Mirror the existing `weekly-retro` template:

```
create_scheduled_task(
  taskId: "weekly-memory-grooming",
  description: "Groom Cowork / CC / Codex memory files via consolidate-memory skill (Sunday evening local)",
  cronExpression: "0 4 * * 1",   // Mon 04:00 UTC ≈ Sun 21:00 Pacific — adjust to user's local Sunday evening before creation
  prompt: "Run the consolidate-memory skill for each agent's memory directory in turn:\n1. Cowork memory dir (verified path from Step 1).\n2. Claude Code memory dir (verified path).\n3. Codex memory dir (verified path).\nFor each, invoke the skill via the Skill tool. If a memory directory is missing, log a one-line warning and continue. Do not delete original memory files; consolidate-memory preserves originals via its own mechanism. After each agent run, log a single line summarizing how many entries were merged, kept, or pruned. Execute autonomously."
)
```

**Cron note:** `0 4 * * 1` UTC fires Monday 04:00 UTC ≈ Sunday 21:00 Pacific.
Adjust at creation time to match the user's preferred local Sunday-evening
slot, then record the chosen UTC time in CLAUDE.md so future agents know.

### Step 3 — Document in CLAUDE.md

Add (or extend) a "Scheduled Tasks" sub-section near the existing
`weekly-retro` example. Suggested table:

| Task | Cadence | Purpose |
|------|---------|---------|
| `flush-plan-docs` | Hourly | Commit plan-pending-commit-labeled docs to main |
| Weekly drift scan | Friday 14:00 UTC | Drift signals → Linear `drift-scan` issues |
| `weekly-retro` | Friday ~15:00 UTC | Weekly retrospective from drift + impediments |
| `weekly-memory-grooming` | Sunday ~21:00 local | Memory consolidation across all agents |

Confirm the existing scheduled tasks before editing the table — don't drop
or rename ones already documented. Read the current "Weekly continuous-improvement
cycle" sub-section first.

### Step 4 — Manual dry-run + verify

Before closing the issue, kick the new task off once on demand and confirm:

* The scheduled task appears in `list_scheduled_tasks` output.
* At least one agent's memory directory was successfully consolidated (no
  thrown errors, no destroyed files).
* The summary line was logged for that agent.

If any agent's memory dir was missing during the dry-run, leave a comment
on the issue noting which path was skipped so the user can investigate
without it gating the closeout.

## Three-pillar coverage

* **Engine:** N/A — tooling/infrastructure; no tick-loop interaction.
* **Content:** N/A — no game content.
* **UI:** N/A — no game UI surface. Task output appears in scheduler logs and
  the agent memory files themselves.
* **Wiring:** Scheduler config (one new task) + CLAUDE.md "Scheduled Tasks"
  table edit.

## NFP compliance

| # | Status | Note |
|---|--------|------|
| 1 Tunability | PASS | Cron expression and per-agent memory paths are constants in the task config; one place to change. |
| 2 Inspectability | PASS | Scheduler logs each run; `consolidate-memory` writes a summary back to memory files; manual `list_scheduled_tasks` exposes presence. |
| 3 Determinism | N/A | Hygiene task, not part of the deterministic sim loop. |
| 4 Fail-soft | PASS | Per fail-soft table below. |
| 5 Narrative over mechanical | N/A | Not narrative work. |
| 6 Additive | PASS | Adds a task; no existing capability removed; `consolidate-memory` skill itself unchanged. |
| 7 Performance budget | PASS | Runs once weekly off-hours; ~5 min per agent per the source brainstorm. |

## Fail-soft table

| Failure | Behavior |
|---------|----------|
| Memory directory missing for one agent | Log one-line warning, skip that agent, continue with the others. |
| `consolidate-memory` skill errors mid-run | Preserve original memory file, log error, continue with the next agent. |
| Cron mis-fires (system asleep, host offline) | Next week's run picks up the slack — memory drift is slow; one missed week is harmless. |
| Newly-introduced agent not yet in the prompt | Add to the prompt in a follow-up issue; current task stays correct for the three agents it knows. |
| User changes memory directory layout | Task continues against old paths until updated; `consolidate-memory` returns "not found" and the warning surfaces in the next manual scheduler check. |

## Done when

* [ ] Memory directory paths for each agent verified (Step 1 evidence in commit body or issue comment).
* [ ] `weekly-memory-grooming` scheduled task created (visible in `list_scheduled_tasks`).
* [ ] First manual dry-run completes for at least one agent's memory dir without throwing.
* [ ] CLAUDE.md "Scheduled Tasks" sub-section lists the new task with cadence.
* [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass (the only code change is the CLAUDE.md table edit, so this should be trivially green).
* [ ] Closing commit body contains `Fixes THR-215`; auto-close fires.

## References

* CLAUDE.md "Weekly continuous-improvement cycle" — `create_scheduled_task`
  template and `weekly-retro` prior art.
* `consolidate-memory` skill — the skill the task invokes.
* Issue THR-215 description — original brainstorm.
