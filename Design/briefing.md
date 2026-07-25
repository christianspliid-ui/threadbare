# Briefing

**Generated:** 2026-07-25 03:09 local (2026-07-25 01:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at yesterday morning's state.** The blocker is unchanged: a leftover permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite (three added lines, all tool-permission grants — nothing at risk). The gap is now 106 commits (was 100 an hour ago). The wrinkle still stands: the weekly-retro write-up exists **only** as a draft file in your local folder (`Design/retros/retro-2026-07-24-draft.md`), so the stash step below carries the only copy — safe, a stash is fully recoverable, and an agent session should land that report on the server via a small PR regardless (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the permission grants and the retro draft via a small PR instead.

*(No new doorbell sent for this — it's the same ask as the last ping, only the commit count moved.)*

## Queue

**Backed up — 17 ready items, 1 in dev (both unchanged from the last brief).** Nothing is blocked, nothing is stale. Two ride at High priority: hardening the auto-close that keeps sweeping live tickets to Done (THR-738, three phantom-closes on the party ticket in one day) and making the hourly cleanup job junction-safe so it can never again empty the real `node_modules` through a link (THR-753, fresh from the retro). Sequencing note for agents, not you: the missing-field sweep (THR-736) shares files with the in-flight party work and correctly waits its turn.

**The party-formation ticket (THR-74) keeps advancing overnight — the founding scene itself landed this hour** (see What's moving). Remaining scope: the rulebook group/company subsection and the map/profile UI. Still no new phantom-close since the 23:03 reopen.

## Freshness

**Home tree: on `main` but 106 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 1. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (still the only copy anywhere — **agent work, not yours**: the next design or grooming session should commit it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 02:40 (within the hour), tracking 23 worktrees / 32 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **The moment a company first forms is now an authored scene (PR #819, 02:33).** *Seeking Companions* got its founding moment — when scattered wanderers decide to bind their fates together, the game now marks it with written prose instead of a silent state change. This caps the run of party-formation content: founding, blessing, gathering, fraying, and parting are all authored now.
- **THR-74 (party formation) is holding steady in dev** — no new phantom-close since the 23:03 reopen; what's left is the rulebook subsection and the map/profile UI.
- **Zero open PRs** — everything merged on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
