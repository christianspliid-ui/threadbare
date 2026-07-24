# Briefing

**Generated:** 2026-07-24 15:11 local (2026-07-24 13:11 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things, both one-liners — the same two as the last brief.**

**1. Your local game folder is still frozen at this morning's state — two commands unstick it.** Since ~07:15 the home tree hasn't picked up anything from the server, now **37 commits behind** (was 33 an hour ago). The blocker is still the leftover one-line permission edit to `.claude/settings.local.json`; the hourly sync deliberately refuses to touch a tree with local edits. Nothing is at risk — the edit is a minor convenience grant, and the one stray untracked file was verified byte-identical to the server copy. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

**2. The party-formation work (THR-74) is still stranded in Done — one chat line reopens it.** Re-verified live this run: the ticket still shows Done from the 12:47 sweep (second phantom-close in twelve hours), while the executor's 13:13 checkpoint explicitly says "stays In Dev — checkpoint, not a handoff." Real work remains: the four authored party moments (Seeking Companions, The Parting, The Shared Spoils, Old Wounds — which need engine wiring, not just prose), the two player actions (Bless this Company, Draw Together), the rulebook section, and the entire map/profile UI. While it shows Done, the hourly pickup can't see it, so that remainder sits off-board. This task isn't allowed to change ticket states — **say "reopen THR-74 to In Dev" in any chat session** and it's fixed. The hardening ticket for the auto-close itself (THR-738) is already queued.

*New since last brief: this task now rings your Discord when this section changes — you should have received its first doorbell DM alongside this refresh. Unchanged asks won't re-ping every hour.*

## Queue

**Healthy — 9 ready items, all plan-doc-backed, none blocked, none stale.** Top of queue is surfacing agent ambitions to the player (THR-721, High). The sequencing note stands: the "18 templates missing a required field" ticket (THR-736) shares files with THR-74's remaining player-action work, so it should run after THR-74's remainder — one more reason to get THR-74 back on the board.

## Freshness

**Home tree: on `main` but 37 behind the server, one tracked edit blocking the self-heal** — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 14:40 (within the hour), tracking 25 worktrees / 34 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The executor is mid-flight on THR-718** — making items move capability tiers again, so a hero carrying a storied blade is actually better with it than without. Active as of 15:03.
- **The Discord doorbell shipped (PR #799).** When something genuinely needs you, this task now sends a short DM pointing at this file — change-gated, so a standing ask nags once, not hourly. The briefing stays the full record; the DM is just the bell.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
