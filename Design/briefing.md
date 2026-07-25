# Briefing

**Generated:** 2026-07-25 06:10 local (2026-07-25 04:10 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Same two things as the last brief — nothing new this hour.**

**1. Flip one Linear setting so tickets stop closing themselves mid-work.** The repo half of the phantom-Done fix merged overnight — our own close workflow now only fires on a deliberate, standalone `Fixes THR-XX` line. The remaining two ways tickets kept getting swept to Done come from **Linear's own GitHub integration**, which no agent can touch. In Linear: **Settings → Integrations → GitHub → turn off "move linked issue to Done when its PR merges."** Leave PR *linking* on — only the auto-move must go. Two-minute verification steps: [`user-actions.md`](user-actions.md) item 3. Until flipped, any PR whose auto-generated branch name carries a ticket id can still close that ticket prematurely.

**2. Your local game folder is still frozen at yesterday morning's state — same two commands.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json` that the hourly sync refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 118 commits (was 116 at the last brief). Friday's weekly-retro write-up still exists **only** as a draft in your local folder — the stash keeps it recoverable, and landing it on the server stays agent work (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Or say the word in any chat session and it can land the grants and the retro draft via a small PR instead.

## Queue

**Healthy at the top of the band — 15 ready, and the executor is busy again.** The hourly pickup claimed the High item minutes ago: junction-safe worktree cleanup (THR-753), the guard that stops the cleanup job from ever emptying a live session's dependencies again. THR-738 (auto-close hardening) still shows In Dev but is deliberately parked — unassigned, repo half merged, waiting only on your settings flip (item 1). Nothing is blocked, nothing is stale. Next up after THR-753 is the player-cast outcome variance you approved in Friday's chat (THR-728, "yes with a safety floor").

## Freshness

**Home tree: on `main` but 118 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 2. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (`Design/retros/retro-2026-07-24-draft.md`, still the only copy anywhere — **agent work, not yours**: the next design or grooming session should land it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 05:40 (within the hour), tracking 23 worktrees / 30 local branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The executor claimed THR-753 at ~06:02** — junction-safe worktree reaping, the week's highest-ROI retro filing. First fresh pickup since the overnight shift ended.
- **Overnight recap (from the last brief):** the auto-close hardening's repo half merged ~05:03 (THR-738, PR #823); the party-formation epic (THR-74) closed for real at 01:57 with its final UI PR; zero open PRs — everything merged on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
