# Briefing

**Generated:** 2026-07-24 14:10 local (2026-07-24 12:10 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things, both one-liners.**

**1. Your local game folder is still frozen at this morning's state — two commands unstick it.** Unchanged from the last brief, just wider: since ~07:15 the home tree hasn't picked up anything from the server, now **33 commits behind** (was 28 an hour ago). The blocker is still the leftover one-line permission edit to `.claude/settings.local.json`; the hourly sync deliberately refuses to touch a tree with local edits. Nothing is at risk — the edit is a minor convenience grant, and the one stray untracked file was verified byte-identical to the server copy. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

**2. The party-formation work (THR-74) is still stranded in Done — one chat line reopens it.** Flagged last hour, still true: the ticket was swept to Done at 12:47 (second phantom-close in twelve hours) at the exact moment its prerequisite merged, while the executor's 13:13 checkpoint explicitly says "stays In Dev — checkpoint, not a handoff." Real work remains: the four authored party moments (Seeking Companions, The Parting, The Shared Spoils, Old Wounds — which turn out to need engine wiring, not just prose), the two player actions (Bless this Company, Draw Together), the rulebook section, and the entire map/profile UI. While it shows Done, the hourly pickup can't see it, so that remainder sits off-board. This task isn't allowed to change ticket states — **say "reopen THR-74 to In Dev" in any chat session** and it's fixed. The hardening ticket for the auto-close itself (THR-738) is already queued.

## Queue

**Healthy — 9 ready items, all plan-doc-backed, none blocked, none stale.** Top of queue is surfacing agent ambitions to the player (THR-721, High). One sequencing note: the "18 templates missing a required field" ticket (THR-736) shares files with THR-74's remaining player-action work, so it should run after THR-74's remainder — one more reason to get THR-74 back on the board.

## Freshness

**Home tree: on `main` but 33 behind the server, one tracked edit blocking the self-heal** — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 13:40 (within the hour), tracking 25 worktrees / 33 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The executor is mid-flight on THR-718** — making items move capability tiers again, so a hero carrying a storied blade is actually better with it than without. Active as of 13:44.
- **Companies-only adventures are live.** The reachability gate (PR #790) and the three party-exclusive delves (PR #795) both merged: a sunken vault, a broken span, and a hollow watch that only a company of two or more can attempt — on each step the best-suited companion takes the lead while the others back them. A lone hero never even sees these stories.
- **A finding from that work:** the four authored party *moments* aren't just writing — the engine has no hooks yet that fire them (formation → Seeking Companions, dissolution → The Parting, fraying bonds → The Shared Spoils / Old Wounds). Sized as its own PR inside THR-74's remainder.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
