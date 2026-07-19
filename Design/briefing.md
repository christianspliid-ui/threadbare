# Briefing

**Generated:** 2026-07-19 16:28 local (14:28 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One thing came off this list, one thing stays on it.**

**✅ Resolved — the game runs on your machine again.** The broken local install that has led this section for four straight briefs is fixed: the launcher shims are back (99 of them), and `vite` starts. Whatever you did, it worked. You can play and test locally again, and the pre-commit checks stop failing. This item is now retired from the standing list.

**1. The war question — still open, and now cleanly framed.**

Unchanged from the last few briefs, so here it is in one paragraph. Three war follow-ons are written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Their blocker cleared on Saturday when the war activation shipped, but nobody has moved them, because the real question is a taste question rather than a scheduling one:

> **Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Neither answer is urgent this week. The reason to answer at all: all three war tickets still *say* "blocked" and still describe **building** things that turned out to be already built — the war system was dormant, not missing. If you say "war is later," they sit safely as they are. If you say "both," someone should re-scope them against what's actually in the code first, so you're choosing against reality rather than a stale plan.

**2. Your working copy is stuck and can't unstick itself.**

Details under **Freshness** — it's three commands and nothing is at risk. Flagging it here only because the automatic hourly repair gave up on it this morning and will not retry on its own.

## Queue

**Healthy — six waiting, and half of them just became actionable.** The badge that the notification rework hangs off is **built and shipped**. That was the piece everything else was queued behind; removing the map vibration and silencing toasts from agents you hold no thread with are both free to start now.

New since your play session: you filed a report that **the simulation keeps ticking behind open modals** — beat and action-card windows don't pause the world. That's now on the board as a high-priority item.

Two mild caveats:

- **The two oldest items are properly stale** — a motive-receipt documentation tidy-up and an economy-feed warning, both sitting since 2026-07-05, now **fourteen days** old. Neither is important; they're just old enough to name rather than keep quietly counting as queue depth.
- **A process note for the agents, not for you:** two items are marked in-flight against a limit of one, and *both* have nobody attached — the economy phase-2 work and the migration go/no-go gate. Parked rather than lost, but they should be picked back up or released.

## Freshness

**Stuck, and drifting further: 75 commits behind** `origin/main` (69 last hour, 64 before that). The copy on your machine is "detached" — parked on an old snapshot instead of pointed at `main`.

**What changed this run:** the hourly auto-repair has now **stopped trying entirely.** Until this morning it was skipping because the folder had local edits; since roughly 10:00 it logs `skip: on branch 'HEAD' (not main)` every hour and does nothing. It cannot recover this by itself — the drift will keep growing until someone runs the commands below. Yesterday's `.codesight` fix, which stops the folder re-dirtying itself every session, is on `main` and waiting; this copy can't receive it until it re-attaches.

**Nothing is at risk.** Re-verified this run:

- The detached snapshot has **no unique commits** — everything on it is already on `main`.
- The ~85 local edits are **stale echoes of work that already shipped** (this copy is *behind* main's content, not ahead of it). Safe to discard.
- **15 untracked files are unique** — design proposals, brainstorm docs, a judge-metrics file. They exist nowhere else. The commands below deliberately **leave them in place.**

Same three commands as the last two briefs — still correct, still safe:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git fetch origin
git switch -f main
git reset --hard origin/main
```

## What's moving

- **The entity-anchored badge shipped** — encounters now surface on the entity's card in the Threads panel. The foundation of the notification rework is in.
- **Player action progression v1 closed** this morning, along with the six "no-op" ascendant actions that now have real effects, and the Codex-remnant cleanup.
- **The migration gate (urgent) is on track.** Its two-consecutive-days-of-hourly-briefings criterion is being met — the task has fired every hour, including the quiet runs where nothing substantive changed and no commit was made. On the strict reading the two-day bar is cleared **tomorrow morning**; whoever closes it should cite the task's run log rather than this file's commit history, since quiet runs deliberately leave no commit.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
