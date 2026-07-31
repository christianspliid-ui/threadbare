# Scheduled-task prompt mirrors

Copies of the Claude Code scheduled-task prompts, kept under version control.

**These are mirrors, not the source of truth.** The live prompts the scheduler actually executes live at:

```
C:\Users\chris\.claude\scheduled-tasks\<task-id>\SKILL.md
```

That path is outside the repo. Merging a change here does **not** deploy it — the same deployment gap that `threadbare-autosync.ps1` has. Editing a mirror without editing the live file changes nothing operationally.

## Why mirror at all

Three reasons, all learned the hard way:

1. **Recoverability.** The Cowork task prompts were lost precisely because they lived only in app state — THR-677 had to author two of them fresh because nothing on disk or in git could reproduce them.
2. **Reviewability.** A prompt that mutates Linear queue state or commits to `main` deserves the same diff review as code. Outside git, it gets none.
3. **Drift detection.** A mirror that has diverged from its live file is visible; an unmirrored prompt drifting is not.

## Rules

- **Edit the live file first, then update the mirror in the same PR.** Never the reverse.
- Keep the filename equal to the task id, so `list_scheduled_tasks` output maps one-to-one.
- A task registered but not mirrored is a `weekly-project-hygiene` finding (check 3, scheduled-task registry audit).

## Contents

| Mirror | Task id | Cadence | State |
|---|---|---|---|
| `tb-opus-pickup.md` | `tb-opus-pickup` | Hourly ~:00:53 | Live — the sole executor lane |
| `tb-orchestrator.md` | `tb-orchestrator` | Hourly ~:26:16 | Live — registered 2026-07-27 (THR-826) |
| `keep-work-flowing-cc.md` | `keep-work-flowing-cc` | Hourly ~:53:13 | Live |
| `daily-backlog-grooming.md` | `daily-backlog-grooming` | Daily ~09:16 | Live — enabled 2026-07-22 after its attended trial passed (THR-677) |
| `weekly-workflow-retro.md` | `weekly-workflow-retro` | Wed ~11:13 | Live — enabled 2026-07-22 after its attended trial passed (THR-677) |
| `weekly-project-hygiene.md` | `weekly-project-hygiene` | Sun ~10:10 | Live — enabled 2026-07-22 after its attended trial passed (THR-677) |
| `weekly-retro.md` | `weekly-retro` | Fri ~17:09 | Live |
| `weekly-memory-grooming.md` | `weekly-memory-grooming` | Sun ~16:10 | Live |
| `monthly-rulebook-review.md` | `monthly-rulebook-review` | 1st ~09:00 | Live — registered 2026-07-22 (THR-704) |

That is every registered task except one, named below.

## Deliberately unmirrored

One registered task has no mirror **on purpose**. It is listed here so that "missing" and "deliberately absent" stop being indistinguishable — an unmirrored task with no entry reads as an audit finding every time someone counts the directory (THR-850).

| Task id | Why no mirror |
|---|---|
| `website-code-work` | Out of scope — personal site, not Threadbare. Carries no cron, `enabled: false`, fires only by hand. Do not touch, do not enable, do not port. |

The registry's own live-lane table (`Docs/ops/scheduled-tasks-registry.md`) is the authority on which tasks are registered; this directory mirrors their prompts.

Canonical registry — cron, fire times, and slot-allocation rules — is `Docs/ops/scheduled-tasks-registry.md`.
