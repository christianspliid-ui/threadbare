# Briefing

**Generated:** 2026-07-21 06:55 local (04:55 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Four things. One is new and has a four-line fix; one is a yes/no; two are carried.**

> **1. NEW — your working copy needs four commands from you. Nothing is damaged; it just can't heal itself.**

The automatic repair job has now refused **ten hours running**, and at 06:50 it stopped trying and printed *"manual repair needed."* That message is correct and it is addressed to you.

What happened: at 06:20 the tree came loose from `main` again — the fifth time in five days, the known fault. The self-healing fix that shipped last night only heals a *clean* loose tree, and this one has three files sitting in the way, so it stands down rather than risk them. Meanwhile the shared copy has moved **52 commits ahead**.

**I checked every file that stands in the way, and all of them are already saved elsewhere:**

- the two "changed" files are `briefing.md` and `user-actions.md` — **old copies of this very file**, from last night's run; both match versions already committed
- the fifteen "new" design drafts are **byte-for-byte identical** to copies already on the shared server (they were backed up around 02:20 last night)

So there is nothing here that exists only on your machine. Running this loses nothing:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git switch main
git fetch origin main
git reset --hard origin/main
```

That last command is normally the one to be careful with. It is safe **in this specific case, this morning**, because I verified each file individually rather than assuming — don't treat it as a general-purpose recipe.

Per the standing rule, this task doesn't repair your working copy itself. A scheduled job reaching into your files is exactly what caused the mess it would be cleaning up.

> **2. NEW — may I file a bug report with Anthropic about this?**

The cause of that recurring fault is understood: it isn't the game, and it isn't any agent — it's Claude Code itself quietly moving things in your repository. **The write-up is now finished and saved** at `Docs/audits/2026-07-20-git-cicd-forensics/upstream-report.md` — but **posting it publicly on Anthropic's issue tracker is your call, not mine.** It would name your setup and include excerpts from your repository's history.

Writing it caught the fault happening live, incidentally: at 07:01:30 this morning Claude Code moved the `main` pointer in your repository, two seconds before it created that session's own workspace. That is now the clearest single piece of evidence in the report.

**Yes or no is all that's needed.** A "no" is fine — the local containment already works, and the report can stay internal.

> **3. Carried — the old Cowork jobs still need switching off, and one needs a preference from you.**

Unchanged from last night; full detail is item 1 in [`user-actions.md`](user-actions.md). One of the four is safe to switch off now. For the other three, the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** first.

> **4. Carried, but it got sharper overnight — what's the next stretch?**

Last night this was a tidy-up question. This morning it's the real one, because **the work queue has almost run dry** (see below). The overnight run cleared nearly everything; what's left is two stale odds-and-ends and the bug report above.

The three war follow-ons — deeper battles, sieges that tighten as they drag, and what a war *leaves behind* — are still sitting in the planning column, two of them high priority. And the notification rework you were weighing them against **landed overnight**, so that side is done. Their descriptions still claim they're blocked by something that finished on the 18th, and they still describe building things that partly already exist.

**So: war next, or something else?** If war, someone re-scopes those three against the real code first so you're choosing against reality rather than a stale plan. If something else, say roughly what and the queue can be refilled toward it.

## Queue

**Nearly starved — three items waiting, and only one is really actionable.** The executor is working on one thing and will likely run out of queue this morning.

- **The one live item is the bug report above** — and it's gated on your yes/no, so it can't fully finish without you.
- **The other two are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real depth.
- **Nothing is blocked** in the technical sense; the shortage is that planning has run out ahead of execution, which is what makes item 4 above time-sensitive rather than merely tidy.
- **One item is in progress:** the git housekeeping ticket, picked up at 02:02. It has shipped two batches of work but its finish line is literally "your working copy is clean" — which is the thing item 1 asks you to do. It has been at it five hours; the manual four commands are now the faster path.

## Freshness

**Loose from `main`, 52 behind, and it will not self-correct.** Full explanation and the fix are item 1 above.

The short version: the tree came off `main` at 06:20 (fifth event in five days), three files block the automatic repair, and every one of those files is verified duplicated elsewhere. The repair job's own log says manual repair needed. Nothing is at risk; it simply needs you at the keyboard for about ten seconds.

## What's moving

**A very productive night — 44 commits and eighteen merges since the last brief.** The git and CI work that has been dominating this file for a week is nearly finished:

- **Pull requests now merge themselves** once their checks go green, so sessions stop waiting around. A pre-commit check that had been falsely blocking commits was fixed in the same change.
- **The home tree became a self-healing mirror** — it now repairs the simple version of the loose-tree fault on its own. (This morning's is the *complicated* version, which is why it needs you.)
- **The freshness signal was reworked** so it stops reporting a false "N commits behind" alarm.
- **The cleanup robot was hardened** — it had been failing silently.
- **Fifteen design drafts that existed on one machine only are now backed up**, closing an exposure this file has carried since the 20th.
- **The "pause the world" fix and the notification threading work both landed**, which is what makes the direction question above answerable.

**Five of the six git tickets are now done or in flight.** After this morning's four commands, this section should stop being about plumbing and go back to being about the game.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
