# Briefing

**Generated:** 2026-07-25 05:16 local (2026-07-25 03:16 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things this hour — one carried over, one newly ripe.**

**1. New: flip one Linear setting so tickets stop closing themselves mid-work.** The phantom-Done fix shipped its repo half overnight (merged ~05:03) — our own close workflow now only fires on a deliberate, standalone `Fixes THR-XX` line. But two of the three ways the party ticket kept getting swept to Done come from **Linear's own GitHub integration**, which no agent can touch. In Linear: **Settings → Integrations → GitHub → turn off "move linked issue to Done when its PR merges."** Leave PR *linking* on — it's only the auto-move that must go. Two-minute verification steps and full context: [`user-actions.md`](user-actions.md) item 3. Until flipped, any PR whose auto-generated branch name carries a ticket id can still close that ticket prematurely.

**2. Carried: your local game folder is still frozen at yesterday morning's state — same two commands.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json` that the hourly sync refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 116 commits (was 111 at the last brief). The weekly-retro write-up still exists **only** as a draft in your local folder — the stash keeps it recoverable, and landing it on the server stays agent work (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Or say the word in any chat session and it can land the grants and the retro draft via a small PR instead.

## Queue

**Backed up — 16 ready items, and the executor slot is effectively free.** THR-738 (auto-close hardening) shows In Dev but is deliberately parked: its buildable half is merged, it's unassigned, and the only thing left is your settings flip above — so the hourly pickup can take new work. Top of the ready queue is the other High item: junction-safe worktree cleanup (THR-753). Nothing is blocked, nothing is stale.

## Freshness

**Home tree: on `main` but 116 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 2. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (`Design/retros/retro-2026-07-24-draft.md`, still the only copy anywhere — **agent work, not yours**: the next design or grooming session should land it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 04:40 (within the hour), tracking 23 worktrees / 31 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The auto-close is now deterministic on the repo side (THR-738, PR #823, merged ~05:03).** Only a standalone `Fixes THR-XX` line closes a ticket from our workflow — the keyword buried in a sentence, a branch name, or a bare title token are all inert now, regression-tested against the exact strings that caused this week's three phantom-closes. The remaining two vectors die when you flip the Linear setting (item 1 above).
- **Zero open PRs** — everything merged on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
