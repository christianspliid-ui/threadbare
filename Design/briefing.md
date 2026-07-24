# Briefing

**Generated:** 2026-07-24 20:09 local (2026-07-24 18:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at this morning's state.** Now **47 commits behind** the server (was 45 an hour ago); the blocker is unchanged — a leftover one-line permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite. Worth knowing: the copy of this very briefing in your local folder is the 07:09 edition — until you unfreeze the tree, your on-disk inbox is thirteen hours stale (the Discord doorbell and the server copy are current). Nothing is at risk: the edit is a minor convenience grant, and the one stray untracked file is byte-identical to the server copy. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the grant via a small PR instead.

## Queue

**Healthy — 9 ready items, all plan-doc-backed, none blocked, none stale.** Top of queue is surfacing agent ambitions to the player (THR-721, High). Two tickets are In Dev: the reopened party-formation remainder (THR-74) and items-move-capability-tiers (THR-718). The sequencing note stands: the "18 templates missing a required field" ticket (THR-736) shares files with THR-74's remaining player-action work and should run after it.

## Freshness

**Home tree: on `main` but 47 behind the server, one tracked edit blocking the self-heal** — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 19:40 (within the hour), tracking 26 worktrees / 35 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The items-give-real-power work (THR-718) is still one green light from landing** — its pull request picked up fresh commits again and the main check restarted at 20:06, still running as this brief was written; auto-merge stays armed, so it lands itself on green. Once it does, a hero carrying a storied blade is actually stronger for it on the character sheet.
- **THR-74 (Party Formation) remains In Dev** with the remaining scope: the four authored party moments, the two player actions, the rulebook group/company section, and the map/profile UI.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
