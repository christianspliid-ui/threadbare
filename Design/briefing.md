# Briefing

**Generated:** 2026-07-21 08:55 local (06:55 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Same four things as an hour ago. Nothing new arrived. Two of them are now the only reason anything is stuck.**

> **1. Your working copy still needs about ten seconds from you. It has now asked three times.**

Unchanged in kind, worse in degree: the shared copy is now **60 commits ahead** of your machine, up from 56. The automatic repair job stood down again at 08:50 with the same verdict it gave at 06:50 and 07:50 — *"manual repair needed."* Three refusals in a row, identical wording.

I re-verified this run, not assumed: nothing exists only on your machine (`origin/main..HEAD` is still zero commits). The three files standing in the way are old copies of this briefing and its companion, plus one design doc already sitting on the shared server.

**Use the repair job's own recommendation:**

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m home-tree-recovery
git switch main
git pull --ff-only origin main
```

> **2. May I file the bug report with Anthropic? Yes or no.**

Unchanged and still the only thing gating that ticket. The write-up is finished and on the shared copy — nothing waits on writing, only on your permission to post it publicly. It would name your setup and quote excerpts from your repository's history, which is why it's your call and not mine.

The fault it describes is the same one behind item 1. A "no" costs nothing: the local containment already works and the write-up simply stays internal.

> **3. The old Cowork jobs still need switching off, and one needs a preference from you.**

Unchanged; full detail is item 1 in [`user-actions.md`](user-actions.md). One of the four is safe to disable now. For the other three: would you rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** first?

> **4. What's the next stretch? This is the one actually costing you now.**

**The queue is down to a single item, and it's a console warning from sixteen days ago.** The documentation tidy-up that shared the queue with it was finished at 08:13 this morning. Nothing substantial is left to pull.

The three war follow-ons remain the nearest ready-made answer: **deeper battles**, **sieges that tighten as they drag**, and **what a war leaves behind**. Two are high priority. I re-checked all three this run — they are still sitting in Todo, and their descriptions still claim they're blocked by the war activation that finished on the 18th. That blocker is stale, not real. They also still describe building pieces that partly exist already, so if war is the answer, someone re-scopes them against the real code first — you should be choosing against reality, not a three-week-old plan.

**War next, or something else?** A rough direction is enough; the queue can be refilled toward it.

## Queue

**Starved — one item, and it isn't real work.** THR-644, a React console warning, untouched since 2026-07-05, now **sixteen days** old and lowest priority. Nothing else is waiting.

- **Nothing is blocked** in the technical sense. The shortage is that planning has run out ahead of execution — which is why item 4 above is time-sensitive rather than merely tidy.
- **Two things sit in development, both unassigned** — the git housekeeping ticket and the bug-report ticket. Neither has anyone working it, and neither can finish without you: one waits on your four commands, the other on your yes/no. They are parked, not stalled by accident.

## Freshness

**Loose from `main`, 60 behind, and confirmed it will not self-correct.** Full explanation and the fix are item 1 above.

Short version: the tree came off `main` at 06:20 yesterday (fifth event in five days), three files block the automatic repair, and every one is verified duplicated elsewhere. The repair job has now printed *manual repair needed* three times running. Nothing is at risk; it needs you at the keyboard briefly.

Per the standing rule, this task doesn't repair your working copy itself. A scheduled job reaching into your files is exactly what caused the mess it would be cleaning up.

## What's moving

**One merge, and it emptied the queue rather than filling it.** The Motive Receipt wiring notes landed at 08:13 — the documentation seam recording how agents explain what a character wants, so future content work uses the system instead of hand-writing the prose. That was the last queued item with substance in it.

The fourteen older pull requests are still open and still unmerged, unchanged in count. That's expected and not a new problem: the auto-merge fix that shipped yesterday morning only helps requests opened *after* it, which is why this task's own hourly updates now land on their own while the backlog doesn't. It drains by hand, gradually.

**Everything on this page is now either waiting on you or waiting on a direction from you.** Once items 1, 2 and 4 are answered, this file should go back to being about the game.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
