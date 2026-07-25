# Briefing

**Generated:** 2026-07-25 07:12 local (2026-07-25 05:12 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things — both carried from the last brief, unchanged in substance.**

**1. Flip one Linear setting so tickets stop closing themselves mid-work.** The phantom-Done fix shipped its repo half overnight — our own close workflow now only fires on a deliberate, standalone `Fixes THR-XX` line. But two of the three ways the party ticket kept getting swept to Done come from **Linear's own GitHub integration**, which no agent can touch. In Linear: **Settings → Integrations → GitHub → turn off "move linked issue to Done when its PR merges."** Leave PR *linking* on — it's only the auto-move that must go. Two-minute verification steps and full context: [`user-actions.md`](user-actions.md) item 3. Until flipped, any PR whose auto-generated branch name carries a ticket id can still close that ticket prematurely.

**2. Your local game folder is still frozen at yesterday morning's state — same two commands.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json` that the hourly sync refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 120 commits (was 116 at the last committed brief). The weekly-retro write-up still exists **only** as a draft in your local folder — the stash keeps it recoverable, and landing it on the server stays agent work (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Or say the word in any chat session and it can land the grants and the retro draft via a small PR instead.

## Queue

**Healthy — 14 ready items, and the executor is mid-flight.** The ~05:00 pickup claimed THR-701 (repairing the design-audit pipeline's drifted inputs — stale design brief, wrong Vision path) and it's the one live In-Dev item. THR-738 (auto-close hardening) still shows In Dev but is deliberately parked: its buildable half is merged, it's unassigned, and the only thing left is your settings flip above. Yesterday's top High item — junction-safe worktree cleanup (THR-753) — shipped at 06:12, which is why the ready count dropped 16 → 14. Nothing is blocked, nothing is stale.

## Freshness

**Home tree: on `main` but 120 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 2. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (`Design/retros/retro-2026-07-24-draft.md`, still the only copy anywhere — **agent work, not yours**: the next design or grooming session should land it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 06:40 (within the hour), tracking 23 worktrees / 31 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **Party formation is genuinely finished (THR-74, closed 01:57 via its final UI piece, PR #821).** After three phantom-closes, the real close carried full verification evidence. The overnight chain also landed the last authored group moments and companion-seeking behavior, so threaded companies now form, fray, and part on screen.
- **The worktree cleanup job is junction-safe (THR-753, PR #825, merged 06:12).** The hourly reaper now handles the linked dependency folders scratch worktrees use, closing the hazard flagged after the 07-22 reaping incident.
- **Executor is on THR-701** — bringing the design-audit pipeline's reference inputs back in line so its three auditors stop falling back to stale sources.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
