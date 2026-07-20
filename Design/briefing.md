# Briefing

**Generated:** 2026-07-20 10:05 local (08:05 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One item, and it's the same taste call as the last few days.**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Their blocker cleared on Saturday. Nobody has moved them, because the choice is yours:

> **Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Not urgent, but now three days open and holding two high-priority tickets. The reason to answer at all is that all three currently *describe building things that turned out to already exist* — the war system was dormant, not missing. Say "war is later" and they sit safely as they are. Say "both" and someone should re-scope them against the actual code first, so you're choosing against reality rather than a stale plan.

**The working-copy nag is gone.** It's been repaired — details under Freshness. You don't need to do anything.

## Queue

**Healthy — five waiting, one in development.** Removing the map vibration (and putting thread tugs on the entity's card instead) is being worked on now. At the front of the line:

- **The simulation ticking behind open modals** — your report from the play session. High priority, free to start.
- **Silencing toasts from agents you hold no thread with** — the other half of the notification cleanup, also free.

Two mild caveats, unchanged:

- **The two oldest items are properly stale** — a motive-receipt documentation tidy-up and an economy-feed warning, both sitting since 2026-07-05, now **fifteen days** old. Neither matters; naming them rather than counting them as queue depth.
- **A process note for the agents, not for you:** two items sit "in flight" with nobody attached — the economy phase-2 work and the migration go/no-go gate. Parked rather than lost, but they should be picked back up or released.

## Freshness

**Fixed.** Your working copy is back on `main`, fully current, with no leftover edits. The hourly auto-repair can do its job again, so this section should go quiet.

Worth correcting the record, because this file got it wrong for several days: the alarming number it kept reporting — "77 commits behind, climbing" — was measuring a *parked snapshot*, not your actual branch. **`main` itself was perfectly up to date the entire time.** The tree had been left standing beside it rather than falling behind it. Nothing was ever decaying and nothing was ever at risk.

The repair took two commands and lost nothing. The leftover edits turned out to be a stale snapshot that would have *undone* shipped work if committed, so clearing them was the correct outcome rather than a sacrifice; they're stashed and recoverable regardless. Your 15 in-progress design drafts were deliberately left untouched and are still there.

**This will probably recur.** Something unidentified re-parks the tree roughly once a morning — it has happened three days running. That is now the subject of a dedicated investigation (below) rather than another manual repair.

## What's moving

- **A quiet night.** Nothing shipped since yesterday evening; the only commit was this briefing's own.
- **The recurring git/CI friction is being investigated properly.** You flagged that agents burn significant time on staleness and CI/CD alarms. That is now a scoped investigation with the forensics already gathered — including the finding above that the headline number was misleading. The goal is that every agent either delivers cleanly or repairs in one mechanical step.
- **An open question in that work:** whether to stop running every agent in its own isolated copy of the repo. There are 27 such copies now, 16 created in a single day, and they may be causing more mess than they prevent. A recommendation will come back to you.
- **The migration gate (urgent) has met its two-day criterion.** This brief regenerated hourly across 2026-07-18 and 2026-07-19. Whoever closes that ticket should cite the scheduled task's run log rather than this file's commit history, since quiet runs deliberately leave no commit.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
