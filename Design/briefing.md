# Briefing

**Generated:** 2026-07-24 16:12 local (2026-07-24 14:12 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing left — the other ask from the last brief resolved itself.**

**1. Your local game folder is still frozen at this morning's state — two commands unstick it.** Since ~07:15 the home tree hasn't picked up anything from the server, now **39 commits behind** (was 37 an hour ago). The blocker is still the leftover one-line permission edit to `.claude/settings.local.json`; the hourly sync deliberately refuses to touch a tree with local edits. Nothing is at risk — the edit is a minor convenience grant, and the one stray untracked file is byte-identical to the server copy (re-verified this run). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

**Resolved since the last brief: THR-74 (Party Formation) is back on the board.** It was reopened to In Dev at ~15:59 — the "say one chat line" ask from the last two briefs is done. The remaining party work (the four authored party moments, the two player actions, the rulebook section, the map/profile UI) is visible to the pickup lane again. Nothing more needed from you on it.

## Queue

**Healthy — 9 ready items, all plan-doc-backed, none blocked, none stale.** Top of queue is surfacing agent ambitions to the player (THR-721, High). Two tickets are In Dev: the reopened party-formation remainder (THR-74) and items-move-capability-tiers (THR-718, active ~15:03). The sequencing note stands: the "18 templates missing a required field" ticket (THR-736) shares files with THR-74's remaining player-action work and should run after it — now enforceable again since THR-74 is back In Dev.

## Freshness

**Home tree: on `main` but 39 behind the server, one tracked edit blocking the self-heal** — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 15:40 (within the hour), tracking 25 worktrees / 34 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **THR-74 reopened at ~15:59** — the phantom-close is undone and the remaining party-formation scope (authored moments, player actions, rulebook, UI) is back in flight. The auto-close hardening ticket (THR-738) stays queued.
- **The executor is mid-flight on THR-718** — making items move capability tiers again, so a hero carrying a storied blade is actually better with it than without.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
