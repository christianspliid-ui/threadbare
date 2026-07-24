# Briefing

**Generated:** 2026-07-24 11:16 local (09:16 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One operational item — two commands, nothing creative.**

**1. Your local game folder is frozen at this morning's ~07:15 state.** A session added a one-line tool-permission grant to `.claude/settings.local.json` around 07:45, and the auto-updater refuses to touch a tree with local edits — so local `main` has fallen 17 commits behind the server while the whole morning landed (the refilled queue's plan docs, two newer briefings than the copy on your disk). Nothing is lost or at risk — zero commits are stranded locally and the edit is a harmless permissions line. From a terminal in the project folder:

```
git stash push -m settings-grant-backup .claude/settings.local.json
git pull --ff-only origin main
```

If the pull complains about `Docs/ops/backlog-grooming-2026-07-24.md`, delete that file first — it's already on the server, verified byte-identical. Or simply ask your next chat session to do it. Details: [`user-actions.md`](user-actions.md) item 1.

No design-vision calls are waiting — today's queue was built entirely on verdicts you've already given.

## Queue

**Healthy — 10 ready, 1 in dev.** Yesterday's empty board was refilled this morning by design sessions: top of the queue by priority are **surfacing what mortals want** (THR-721, High — agent ambitions become visible on the character journey instead of hiding behind a high knowledge bar) and **items that actually move capability tiers again** (THR-718, High). Both carry your Tuesday yes, and **player-cast variance** (THR-728) carries your "yes, with a safety floor" from yesterday. Nothing blocked, nothing stale.

## Freshness

**Home tree: flagged above** — on `main`, 17 behind, one tracked edit blocking the auto-sync. Everything else is fine: no parked state, nothing stranded.

**Cleanup reaper: alive and healthy** — last run 10:40 (within the hour), tracking 25 worktrees / 35 branches / 1 stash, nothing flagged for a human decision.

## What's moving

- **The executor is mid-flight on Party Formation & Group Mechanics (THR-74)** — mortals banding into companies that travel, face encounters, and hold together (or don't) as a group. It was touched minutes before this brief was written.
- **THR-74 survived a phantom auto-close overnight:** an unrelated merge whose PR titles carried bare ticket tokens swept it to Done at 00:41 while the executor's own comments said "checkpoint, not a handoff." It was caught, reopened, and a hardening ticket (THR-738) now sits in the queue to close that vector for good.
- **The morning design lane packaged six plan docs into the queue** — the two item-economy tickets (THR-718/719), ambition visibility (THR-721), player-cast variance (THR-728), plus vocabulary proposals and small infrastructure follow-ups. Planning and execution are back in balance after yesterday's fully drained board.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
