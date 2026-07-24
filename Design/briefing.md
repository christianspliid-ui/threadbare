# Briefing

**Generated:** 2026-07-24 23:09 local (2026-07-24 21:09 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still the one thing — same two commands as the last brief.**

**1. Your local game folder is still frozen at this morning's state.** The blocker is unchanged: a leftover one-line permission edit to `.claude/settings.local.json`, which the hourly sync deliberately refuses to overwrite. The gap is now 84 commits (was 71 an hour ago). One new wrinkle: tonight's weekly-retro write-up currently exists **only** as a draft file in your local folder (`Design/retros/retro-2026-07-24-draft.md`), so the stash step below will carry the only copy — still safe, a stash is fully recoverable, and an agent session should land that report on the server via a small PR regardless (flagged under Freshness). Run:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -u -m home-tree-recovery
git pull --ff-only origin main
```

Alternatively, say the word in any chat session and it can land the permission grant and the retro draft via a small PR instead.

## Queue

**Backed up — 17 ready items (was 8 at the last brief), 1 in dev.** Not a fault: the evening sessions promoted nine items in one hour — two finished group-mechanics designs (Reunite & Sunder, and company-vs-band conflict encounters), three improvement tickets from the weekly retro, and four parked ideas moved up for pickup. Nothing is blocked, nothing is stale. Two ride at High priority: hardening the auto-close that keeps sweeping live tickets to Done (THR-738 — see below) and making the hourly cleanup job junction-safe so it can never again empty the real `node_modules` through a link (THR-753, fresh from the retro).

**The board fault from the last brief fixed itself the right way: the party-formation ticket (THR-74) was reopened to In Dev at 23:03.** The third accidental "Done" sweep (21:33) is undone and the remaining scope — authored company moments, the two player actions, the rulebook section, the map/profile UI — is visible to the hourly pickup again. Sequencing note for agents, not you: the missing-field sweep (THR-736) shares files with the in-flight party work and correctly waits its turn.

## Freshness

**Home tree: on `main` but 84 commits behind the server**, one tracked edit blocking the self-heal — see Needs Christian item 1. Two untracked local files: this morning's grooming report (verified byte-identical to the server copy at earlier runs) and tonight's retro draft (the only copy anywhere — see below).

**Cleanup reaper: alive** — last run 22:40 (within the hour), tracking 24 worktrees / 32 branches / 1 stash, nothing awaiting a human decision.

**Last brief's retro mystery is resolved: the Friday retro did run.** It fired on schedule at 17:10, worked long, and filed its three improvement tickets at ~22:31 (THR-753/754/755). But its report landed only as an untracked draft in your local folder, and the three tickets cite `Design/retros/retro-2026-07-24.md` — a filename that exists nowhere on the server yet. **Agent work, not yours:** the next design or grooming session should commit the draft via a docs PR (same move as the 07-23 retro backup, PR #768). The "file the general home-tree ticket" earmark from 07-23 also isn't among tonight's three filings, so it remains outstanding.

## What's moving

- **Mortal ambitions are now visible in play (THR-721 shipped, PR #809).** The journey panel shows what a hero *wants* — their driving ambition plus a history of ambitions completed — without you having to befriend them first.
- **Two group-mechanics designs finished grooming and are ready to build:** *Reunite & Sunder* — your divine hands nudging a broken company back together, or splitting one apart (THR-732) — and *company-vs-band conflict encounters*, whose founding image is your threaded company toppling an assassins' guild (THR-731).
- **The weekly retro filed three process fixes** (THR-753/754/755): junction-safe cleanup, sanctioned headless evidence paths for the browser-verify gate, and a sweep to make every quality gate's output match its verdict.
- **Zero open PRs** — everything merged on green today.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
