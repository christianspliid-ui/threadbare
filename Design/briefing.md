# Briefing

**Generated:** 2026-07-24 12:09 local (10:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One operational item — two commands, nothing creative. Same as last hour, gap still widening.**

**1. Your local game folder is frozen at this morning's ~07:15 state — now 19 commits behind the server** (was 17 an hour ago). A session added a one-line tool-permission grant to `.claude/settings.local.json` around 07:45, and the auto-updater refuses to touch a tree with local edits. Nothing is lost or at risk — zero commits are stranded locally and the edit is a harmless permissions line. From a terminal in the project folder:

```
git stash push -m settings-grant-backup .claude/settings.local.json
git pull --ff-only origin main
```

If the pull complains about `Docs/ops/backlog-grooming-2026-07-24.md`, delete that file first — it's already on the server, re-verified byte-identical this run. Or simply ask your next chat session to do it. Details: [`user-actions.md`](user-actions.md) item 1.

No design-vision calls are waiting — today's queue was built entirely on verdicts you've already given.

## Queue

**Healthy — 10 ready, 1 in dev.** Top of the queue by priority: **surfacing what mortals want** (THR-721, High — agent ambitions become visible on the character journey instead of hiding behind a high knowledge bar) and **items that actually move capability tiers again** (THR-718, High). Both carry your Tuesday yes, and **player-cast variance** (THR-728) carries your "yes, with a safety floor" from yesterday. Nothing blocked, nothing stale.

## Freshness

**Home tree: flagged above** — on `main`, 19 behind, one tracked edit blocking the auto-sync. Everything else is fine: no parked state, nothing stranded.

**Cleanup reaper: alive and healthy** — last run 11:40 (within the hour), tracking 25 worktrees / 35 branches / 1 stash, nothing flagged for a human decision.

## What's moving

- **The executor is still mid-flight on Party Formation & Group Mechanics (THR-74)** — mortals banding into companies that travel, face encounters, and hold together (or don't) as a group. Last touched ~09:06; no feature merges have landed since the last brief, only plan-doc and briefing housekeeping.
- **THR-74's phantom auto-close from overnight remains handled:** it was caught and reopened, and the hardening ticket (THR-738) sits in the queue to close that vector for good.
- **The morning's six plan docs are all on the server** — the two item-economy tickets (THR-718/719), ambition visibility (THR-721), player-cast variance (THR-728), plus vocabulary proposals and small infrastructure follow-ups. Planning and execution remain in balance.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
