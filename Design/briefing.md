# Briefing

**Generated:** 2026-07-21 07:55 local (05:55 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Four things, all carried from an hour ago. Nothing new arrived — but two of them got more expensive while you slept.**

> **1. Your working copy still needs about ten seconds from you. It has now asked twice.**

Unchanged since the 06:55 brief except that it drifted further: the shared copy is now **56 commits ahead** of your machine, up from 52. The automatic repair job stood down again at 07:50 with the same verdict as 06:50 — *"manual repair needed."*

Nothing is damaged and nothing exists only on your machine; I re-verified that this run. The three files standing in the way are old copies of this briefing and its companion, plus one design doc already sitting on the shared server.

**Use the repair job's own recommendation — it's the safer of the two recipes:**

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m home-tree-recovery
git switch main
git pull --ff-only origin main
```

*Correction to last hour's brief:* it offered a `reset --hard` version of this. The commands above do the same job while keeping a recoverable copy of anything it sets aside. Prefer these.

> **2. May I file the bug report with Anthropic? Yes or no.**

**The draft is finished and is now on the shared copy** (it merged at 07:08), so nothing is waiting on writing — only on your permission to post it publicly. It would name your setup and quote excerpts from your repository's history, which is why it's your call rather than mine.

The fault it describes is the same one behind item 1: Claude Code itself quietly moving things inside your repository. A "no" costs nothing — the local containment already works and the write-up simply stays internal.

> **3. The old Cowork jobs still need switching off, and one needs a preference from you.**

Unchanged; full detail is item 1 in [`user-actions.md`](user-actions.md). One of the four is safe to disable now. For the other three: would you rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** first?

> **4. What's the next stretch? This is now the one that's actually costing you.**

**The work queue has run dry** — see below. Everything that was waiting got built overnight; what remains is two forgotten odds-and-ends from two weeks ago. Until you point at something, the executor has nothing substantial to pull.

The three war follow-ons are still the nearest ready-made answer: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. The notification rework you were weighing them against is finished, so that side no longer competes. Their descriptions still claim they're blocked by something that finished on the 18th, and they still describe building pieces that partly exist already — so if war is the answer, someone re-scopes them against the real code first and you choose against reality rather than a stale plan.

**War next, or something else?** If something else, a rough direction is enough — the queue can be refilled toward it.

## Queue

**Starved — two items waiting, and neither is real work.** Both are the same stale pair as last hour: a documentation tidy-up and a console warning, untouched since 2026-07-05, now **sixteen days** old, both lowest priority. The one genuinely live item moved into development at 07:08, which is what tipped the queue over.

- **Nothing is blocked** in the technical sense. The shortage is that planning has run out ahead of execution — which is why item 4 above is time-sensitive rather than merely tidy.
- **Two things are in development at once**, which is one more than the rule allows. That's not carelessness: the git housekeeping ticket, picked up at 02:02, has a finish line of literally "your working copy is clean" — the thing item 1 asks you to do — so it cannot close on its own. The bug-report ticket took the second slot because it had nothing else to wait behind.

## Freshness

**Loose from `main`, 56 behind, and it will not self-correct.** Full explanation and the fix are item 1 above.

Short version: the tree came off `main` at 06:20 yesterday morning (fifth event in five days), three files block the automatic repair, and every one is verified duplicated elsewhere. The repair job has now printed *manual repair needed* twice running. Nothing is at risk; it needs you at the keyboard briefly.

Per the standing rule, this task doesn't repair your working copy itself. A scheduled job reaching into your files is exactly what caused the mess it would be cleaning up.

## What's moving

**A quiet hour after a very loud night — one merge.** The upstream bug report was drafted and landed, which is the last piece of the git and CI work that has dominated this file for a week. It's now finished apart from your yes/no on item 2 and your four commands on item 1.

Everything else of substance happened before the last brief and is recorded there: pull requests now merge themselves once checks pass, the home tree became self-healing for the simple version of this fault, the false "N commits behind" alarm was fixed, the cleanup robot was hardened, and fifteen one-machine-only design drafts got backed up.

**After this morning's four commands, this section should stop being about plumbing and go back to being about the game** — which is exactly what item 4 is waiting on.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
