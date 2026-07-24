# Briefing

**Generated:** 2026-07-24 21:09 local (2026-07-24 19:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at this morning's state.** Now **66 commits behind** the server (was 47 an hour ago — the jump is tonight's item-power feature landing, not decay). The blocker is unchanged: a leftover one-line permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite. Until you unfreeze the tree, the copy of this inbox in your local folder is still the 07:09 edition — the Discord doorbell and the server copy are the current ones. Nothing is at risk: zero unique work is stranded locally, and the one stray untracked file is byte-identical to the server copy. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the grant via a small PR instead.

## Queue

**Healthy — 9 ready items, all plan-doc-backed, none blocked, none stale.** Top of queue is surfacing agent ambitions to the player (THR-721, High). One ticket is In Dev: the reopened party-formation remainder (THR-74, active as of 16:06). The sequencing note stands: the "18 templates missing a required field" ticket (THR-736) shares files with THR-74's remaining player-action work and should run after it.

## Freshness

**Home tree: on `main` but 66 behind the server, one tracked edit blocking the self-heal** — see Needs Christian item 1. Last local update was 07:13.

**Cleanup reaper: alive** — last run 20:40 (within the hour), tracking 24 worktrees / 35 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **Items now genuinely make heroes stronger — THR-718 shipped (PR #797, merged 20:32).** The green light the last brief was waiting on came through: a storied blade or enchanted mantle now moves its bearer's actual capability tiers instead of being flavor text. The first nine signature items carry real power; migrating the rest of the item catalog is tracked as its own follow-up ticket.
- **THR-74 (Party Formation) remains In Dev** with the remaining scope: the four authored party moments, the two player actions, the rulebook group/company section, and the map/profile UI.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
