# Briefing

**Generated:** 2026-07-25 00:09 local (2026-07-24 22:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at yesterday morning's state.** The blocker is unchanged: a leftover one-line permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite. The gap is now 89 commits (was 84 an hour ago). The wrinkle from the last brief still stands: the weekly-retro write-up exists **only** as a draft file in your local folder (`Design/retros/retro-2026-07-24-draft.md`), so the stash step below will carry the only copy — still safe, a stash is fully recoverable, and an agent session should land that report on the server via a small PR regardless (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the permission grant and the retro draft via a small PR instead.

## Queue

**Backed up — 17 ready items, 1 in dev (both unchanged from the last brief).** Nothing is blocked, nothing is stale. Two ride at High priority: hardening the auto-close that keeps sweeping live tickets to Done (THR-738, three phantom-closes on the party ticket in one day) and making the hourly cleanup job junction-safe so it can never again empty the real `node_modules` through a link (THR-753, fresh from the retro). Sequencing note for agents, not you: the missing-field sweep (THR-736) shares files with the in-flight party work and correctly waits its turn.

**The party-formation ticket (THR-74) is moving again after its reopen** — the third of the authored company-lifecycle moments merged just before midnight (see What's moving). Remaining scope: the two player actions, the rulebook group/company subsection, and the map/profile UI.

## Freshness

**Home tree: on `main` but 89 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 1. Two untracked local files: yesterday's grooming report (verified byte-identical to the server copy at earlier runs) and the weekly-retro draft (the only copy anywhere — the three retro tickets THR-753/754/755 cite a report filename that exists nowhere on the server yet; **agent work, not yours** — the next design or grooming session should commit it via a docs PR, same move as the 07-23 retro backup, PR #768).

**Cleanup reaper: alive** — last run 23:40 (within the hour), tracking 24 worktrees / 32 branches / 1 stash, nothing awaiting a human decision.

## What's moving

- **A company's shared history now cuts both ways (PR #813, just before midnight).** *The Shared Spoils / Old Wounds* is the third authored company-lifecycle moment — when a threaded company frays, the scene now draws on what its members actually lived through together, spoils or scars. It joins *The Parting* (dissolution) from earlier in the evening; the party ticket's engine work is landing beat by beat.
- **Earlier tonight:** mortal ambitions became visible in the journey panel (THR-721, PR #809), and two group-mechanics designs finished grooming into the queue — *Reunite & Sunder* (THR-732) and company-vs-band conflict encounters (THR-731).
- **Zero open PRs** — everything merged on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
