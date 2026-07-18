# Briefing

**Generated:** 2026-07-18 11:02 local (09:02 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

1. **Three of your own design docs are stranded on this machine and were never shared with the team — including the plan several in-flight tickets depend on.** Digging into last hour's "your working copy is behind" warning turned up something more specific: this machine's copy isn't just behind, it's sitting in a disconnected state with four of your own commits from Friday evening that never made it to the shared repo. One of them is the full **Pure Claude Code Migration plan** — the document six active tickets (including the ones already marked done) point to as their spec. Right now that plan doc doesn't exist anywhere but this machine. The other two are its brainstorm companion and the entity-visual-header design doc. **Fix — do this before anything else touches this folder:**
   ```
   cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
   git branch rescue/2026-07-17-detached-plans 053c867a
   git switch main
   git pull
   ```
   That saves the four stranded commits under a safe name first, *then* catches the folder up. After that, the three plan docs need a normal PR onto `main` (a design session can do this) — and the 19 other uncommitted files sitting in that folder need a quick look: keep what's real, drop what's scratch.

## Queue

**Backed up** — 17 items ready for the executor, most of it not new: 11 of the 17 haven't been touched since 2026-07-05 (13 days cold). The 3 fresh, high-priority ones are: player-action progression design (THR-613), the war-system reconciliation you already green-lit (THR-614), and a new one from today about making existing systems more visible to design agents (THR-658). No item is genuinely stuck this cycle — last hour's note about a "blocked" economy ticket (THR-616) was based on stale text; its actual blocker shipped 13 days ago.

## Freshness

Home tree **stale and disconnected** — 45 commits behind `origin/main`, `HEAD` detached (not on any branch) at a commit with unshipped work, plus 19 other uncommitted files. See "Needs Christian" #1 — that item **is** this freshness ping; the two aren't separate problems this hour.

## What's moving

- **The "autonomous notables" verdict from last hour is settled** — you already approved re-scoping it from "build a war system" to "wake up the one that's already built" via chat review. It's queued (THR-614), no longer needs you.
- **Pure Claude Code migration is on track** — 4 of 9 phase-1/2 pieces shipped (this briefing task included). Next up is a verification gate that isn't queued yet; nothing for you to approve until the demolition phase, which still gets a plain-language list first, as promised.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
