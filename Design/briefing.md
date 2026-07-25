# Briefing

**Generated:** 2026-07-25 08:09 local (2026-07-25 06:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things this hour — both carried from the last brief, nothing new.**

**1. Flip one Linear setting so tickets stop closing themselves mid-work.** The phantom-Done fix shipped its repo half yesterday night — our own close workflow now only fires on a deliberate, standalone `Fixes THR-XX` line. But two of the three ways the party ticket kept getting swept to Done come from **Linear's own GitHub integration**, which no agent can touch. In Linear: **Settings → Integrations → GitHub → turn off "move linked issue to Done when its PR merges."** Leave PR *linking* on — it's only the auto-move that must go. Two-minute verification steps and full context: [`user-actions.md`](user-actions.md) item 3. Until flipped, any PR whose auto-generated branch name carries a ticket id can still close that ticket prematurely.

**2. Your local game folder is still frozen at yesterday morning's state — same two commands.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json` that the hourly sync refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 122 commits (was 116 at the 05:16 brief). The weekly-retro write-up still exists **only** as a draft in your local folder — the stash keeps it recoverable, and landing it on the server stays agent work (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Or say the word in any chat session and it can land the grants and the retro draft via a small PR instead.

## Queue

**Healthy — 14 ready items, and the executor slot is effectively free.** Overnight the lane cleared both High items (see What's moving), so everything left is Medium/Low. THR-738 (auto-close hardening) still shows In Dev but is deliberately parked and unassigned — its only remaining step is your settings flip above, so the hourly pickup can take new work. Nothing in the ready queue is blocked, nothing is stale; the nearest picks are the two retro-filed hygiene sweeps (gate credibility, browser-verify evidence paths) and the player-cast variance spec that already carries your "yes, with a safety floor."

## Freshness

**Home tree: on `main` but 122 commits behind the server** (was 116 at 05:16), one tracked edit blocking the self-heal — see Needs Christian item 2. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (`Design/retros/retro-2026-07-24-draft.md`, still the only copy anywhere — **agent work, not yours**: the next design or grooming session should land it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 07:40 (within the hour), tracking 23 worktrees / 32 branches / 1 stash, nothing awaiting a human decision.

Housekeeping: the 07:12 run's briefing PR (#828) idled into a merge conflict and was superseded by this refresh — no action needed, no data lost.

## What's moving

- **The worktree reaper can no longer be tricked by junction links (THR-753, merged this morning, PR #825).** Friday's retro flagged that a scratch worktree sharing its `node_modules` via a junction could be reaped in a way that followed the link back into a live tree; the cleanup script now severs junctions safely first. One of the two High items filed by the retro — done inside a day.
- **The design-audit pipeline audits against what it advertises again (THR-701, merged 07:11, PR #827).** Its three quietly-degraded inputs — a stale design-brief rubric, a wrong Vision folder path, a missing taste profile — are repaired, so the NFP/Vision auditors stop silently falling back.
- **Party formation is genuinely finished (THR-74, closed 01:57 with a deliberate close, full evidence).** Its overnight tail landed the companion-seeking behavior, the "Draw Together" formation pull, and the authored Fray/Parting moments — threaded companies now form, strain, and part on screen.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
