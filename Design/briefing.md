# Briefing

**Generated:** 2026-07-23 21:15 local (19:15 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Two things, both operational switches — unchanged from the last brief. No design decisions are waiting on you: of your two directives from this morning, one shipped tonight and the other is in development.**

**1. All four old Cowork automations can be switched off now.** The three replacements you trialled and approved yesterday are live and have produced real runs, and the hourly-brief replacement wrote this file. In the Cowork app, disable: `keep-work-flowing`, `daily-backlog-grooming`, `weekly-workflow-retro`, `weekly-project-hygiene`. Leave `weekly-invoice-check` alone — it's personal, not Threadbare. Until you flip them, four jobs run twice; nothing breaks. Details: [`user-actions.md`](user-actions.md) item 1.

**2. Your main project folder is parked on an old work branch and needs two commands.** Nothing is lost — the branch was fully merged yesterday — but the auto-updater won't reattach it (it only self-heals a different kind of park, and a local settings edit sits in the tree), so the folder stays a few merges behind until someone runs, from a terminal in `C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator`:

```
git switch main
git pull --ff-only origin main
```

If the first command complains about `.claude/settings.local.json`, run `git stash push -m home-tree-recovery` first, then the two commands, then `git stash pop`.

## Queue

**Healthy but thin — 2 ready, executor mid-flight, nothing blocked, nothing stale (both filed today). At today's pace the queue drains within a day; the morning grooming run will flag it if it does.**

- **In development: the wiki freshness enforcement gate (THR-730, High)** — your directive from this morning, planned, handed off, and claimed the same day. Actively moving as of ~21:00.
- **Ready:** the world minting ambitions into mortals (THR-726 — world events write themselves into what people want, the last of the three coupling tickets) and a small dead-contract cleanup (THR-722).

## Freshness

**Home tree: parked on a merged branch — see the two-command fix above.** Nothing unique is stranded there; local `main` is 3 behind the server (below the alarm line, and the mirror is keeping the branch itself current even while the checkout is parked). Separate note, not yours: **ten retro write-ups exist only as loose files on this machine** (`Design/retros/`, April–July), same one-machine exposure class as the drafts backed up on 07-21 — flagged in user-actions as agent work.

**Cleanup reaper: alive and healthy** — last run 20:40 (within the hour), tracking 24 worktrees / 33 branches / 1 stash, nothing flagged for a human decision.

## What's moving

- **Divine Receipt shipped tonight (THR-727, 21:01).** Your directive from this morning: when an action card you played resolves, the game now hands you an outcome dialogue telling you what actually happened — in story terms, not numbers. Directive to shipped in under a day.
- **The wiki freshness gate is being built right now** (THR-730, High) — your other directive from today: "keep the design reference wiki current on every relevant PR" becoming a blocking CI check with an explicit exemption token and a weekly escape-net.
- **Earlier today, all unattended:** the systems interface map landed (a live registry of every cross-system contract, with a CI gate that catches contracts going dead), and the coupling audit it enabled shipped two of its three tickets — secrets & favors woke up as an active social dark economy (THR-724), and the economy now talks back to the story, with prosperity and scarcity shaping which scenes fire (THR-725).
- **The PR board remains at zero open** — new PRs are self-merging on green; the 14-deep stale backlog cleared yesterday has not re-formed.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; staleness is visible from the Generated timestamp above and the task's `lastRunAt` in `list_scheduled_tasks`.*
