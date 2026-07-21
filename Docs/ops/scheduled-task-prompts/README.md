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
| `daily-backlog-grooming.md` | `daily-backlog-grooming` | Daily ~09:16 | **Disabled** — pending trial approval (THR-677) |
| `weekly-workflow-retro.md` | `weekly-workflow-retro` | Wed ~11:13 | **Disabled** — pending trial approval (THR-677) |
| `weekly-project-hygiene.md` | `weekly-project-hygiene` | Sun ~10:10 | **Disabled** — pending trial approval (THR-677) |
| `keep-work-flowing-cc.md` | `keep-work-flowing-cc` | Hourly ~:53:13 | Live |
| `weekly-retro.md` | `weekly-retro` | Fri ~17:09 | Live |
| `weekly-memory-grooming.md` | `weekly-memory-grooming` | Sun ~16:10 | Live |

The hourly executor prompt (`tb-opus-pickup`) is mirrored separately, and predates this directory, at [`../cc-hourly-opus-pickup-prompt.md`](../cc-hourly-opus-pickup-prompt.md).

Canonical registry — cron, fire times, and slot-allocation rules — is the `### Scheduled Tasks` table in `CLAUDE.md`.
