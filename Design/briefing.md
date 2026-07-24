# Briefing

**Generated:** 2026-07-24 13:09 local (2026-07-24 11:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing: two commands on your machine.**

**1. Your local game folder is frozen at this morning's state — two commands unstick it.** Since ~07:15 the home tree hasn't picked up anything from the server; it's now 28 commits behind and climbing, so a session started there begins on stale state. The blocker is a leftover one-line permission edit to `.claude/settings.local.json` that a session made on your machine — the hourly sync deliberately refuses to touch a tree with local edits. Nothing is at risk: the edit is a minor convenience grant, and the one stray untracked file (today's grooming report) was re-verified byte-identical to the copy already on the server. Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

The stash keeps both files recoverable. This is the fourth stray-edit jam this month (07-21 ×2, 07-23, now) — today's 17:09 weekly retro should file the ticket that closes the class for good.

## Queue

**Healthy — 10 ready items, all plan-doc-backed, none blocked, none stale.** But the "0 in dev" the board shows is misleading: **the party-formation work (THR-74) is mid-flight and got swept to Done again** — the second phantom-close on this exact ticket in twelve hours (00:41 last night, then 12:47 today, at the moment its prerequisite PR merged). The executor's 13:13 checkpoint explicitly says "stays In Dev — checkpoint, not a handoff," and real scope remains: the four authored party moments (Seeking Companions, The Parting, The Shared Spoils, Old Wounds), the two player actions (Bless this Company, Draw Together), the rulebook section, and the entire map/profile UI. While it shows Done, the hourly pickup can't see it, so the remainder is stranded off-board. **Any interactive session fixes this in one move — say "reopen THR-74 to In Dev" in chat if you get there first.** The hardening ticket for the auto-close itself (THR-738) is already on the board.

## Freshness

**Home tree: on `main` but 28 behind the server, one tracked edit blocking the self-heal** — see Needs Christian for the two-command fix. Last local update was 07:13.

**Cleanup reaper: alive** — last run 12:40 (within the hour), tracking 24 worktrees / 35 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **You flipped the four Cowork switches this morning (~09:35) — the Pure Claude Code Migration is complete.** Every Threadbare automation now runs in the single Claude Code lane; the double-run overlap is gone.
- **Companies can now draw stories a lone hero never sees.** The reachability gate merged at 12:47 (PR #790), and three party-exclusive delves — a sunken vault, a broken span, a hollow watch — are on their way behind it (PR #795, merges itself on green). Each needs a company of two or more; on each step the best-suited companion takes the lead while the others back them.
- **A six-plan-doc morning refilled the board 0 → 10:** surfacing agent ambitions to the player (THR-721), items that move capability tiers again (THR-718), item breakage/consumables/curses (THR-719), and player casts rolling the outcome ladder with your "safety floor" verdict (THR-728) — plus two glossary proposals and two workflow-hardening tickets.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
