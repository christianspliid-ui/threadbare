# Briefing

**Generated:** 2026-07-23 20:29 local (18:29 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view. **First run since 2026-07-22 10:25** — everything below catches up on that ~34-hour window.

## Needs Christian

**Two things, both operational switches. No design decisions are waiting on you — both of your directives from this morning are already in motion (one in development, one top of the queue).**

**1. All four old Cowork automations can be switched off now.** The three replacements you trialled and approved yesterday are live and have produced real runs, and the hourly-brief replacement wrote this file. In the Cowork app, disable: `keep-work-flowing`, `daily-backlog-grooming`, `weekly-workflow-retro`, `weekly-project-hygiene`. Leave `weekly-invoice-check` alone — it's personal, not Threadbare. Until you flip them, four jobs run twice; nothing breaks. Details: [`user-actions.md`](user-actions.md) item 1.

**2. Your main project folder is parked on an old work branch and needs two commands.** Nothing is lost — the branch was fully merged yesterday — but the auto-updater won't reattach it (it only self-heals a different kind of park, and a local settings edit sits in the tree), so the folder falls further behind until someone runs, from a terminal in `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`:

```
git switch main
git pull --ff-only origin main
```

If the first command complains about `.claude/settings.local.json`, run `git stash push -m home-tree-recovery` first, then the two commands, then `git stash pop`.

## Queue

**Healthy — 3 ready, executor mid-flight, nothing blocked, nothing stale (all three filed today).**

- **Top of queue:** the wiki freshness enforcement gate (THR-730, High) — your directive from this morning, planned and handed off same-day.
- Behind it: the world minting ambitions into mortals (THR-726) and a small dead-contract cleanup (THR-722).
- **In development: Divine Receipt (THR-727)** — your other directive from today: the outcome dialogue that tells you what actually happened, in story and game terms, when an action card you played resolves. Actively moving as of ~18:00.

## Freshness

**Home tree: parked on a merged branch — see the two-command fix above.** Nothing unique is stranded there; local `main` is 5 behind the server (below the alarm line, but it grows while parked). Separate note, not yours: **ten retro write-ups exist only as loose files on this machine** (`Design/retros/`, April–July), same one-machine exposure class as the drafts backed up on 07-21 — flagged in user-actions as agent work.

**Cleanup reaper: alive and healthy** — last run 19:40, tracking 23 worktrees / 31 branches / 1 stash, nothing flagged for a human decision.

## What's moving

The 34-hour window was the busiest yet — roughly 200 commits, all merged clean, PR board now at **zero open**:

- **Both halves of the direction question this file carried for days got built.** War got its depth pass: battles with turning points and real texture, sieges that tighten the longer they drag, and notable characters who pursue agendas — feuds, succession claims, and taking command of wars. And the economy became visible in play: cargo moving on trade routes now surfaces as encounters, faction prosperity feeds war triggers, and encounter scoring listens to economic context.
- **The encounter scene chain finished** (slices C, E, F): scenes name the real people and places they happen with, carry a supporting cast, and keep continuity into follow-ups.
- **Secrets and favors woke up** — leverage, blackmail material, and favors owed are now an active social dark economy in the simulation.
- **The systems interface map landed** — a live registry of every cross-system contract with a CI gate that catches contracts going dead. It immediately paid for itself: the coupling audit it enabled produced the three tickets now feeding the queue.
- **The stale-PR backlog is gone.** All 14 old pull requests were triaged to zero; new ones self-merge on green.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
