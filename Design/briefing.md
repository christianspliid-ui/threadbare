# Briefing

**Generated:** 2026-07-21 09:57 local (07:57 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**One new thing, and it's the one holding up all work. Three carried.**

> **1. NEW — the only job left in the queue needs your signature before anyone may start it.**

Overnight the queue emptied and then refilled with a single item: **finish the move off Cowork by deleting the old scaffolding.** It was deliberately written to require your yes first, which is why it's sitting untouched rather than being picked up.

**What gets deleted:** the old plan-document filing pipeline and its safety workflow; the label that drove it; a second, duplicate copy of the skill library that only the old system could read, along with the script and pre-commit check that kept the two copies in step; and the sections of the project's instruction file that describe a two-agent world that no longer exists.

**What could be lost.** Six skills live only in that duplicate copy and would go with it — they cover Obsidian vault editing and a content catalogue. Claude Code can't load any of them today, and it does vault work directly through the filesystem instead, so in practice they're already dead weight. Nothing else here is content or game code; it's all plumbing for a workflow you've already left. Every deletion lands as an ordinary commit that can be reversed.

**My recommendation: yes.** The main argument for it isn't tidiness — that duplicate skill copy is the source of the false pre-commit failures that have been blocking unrelated commits for weeks, and it can't be fixed while it exists.

**One caveat, and it ties to item 3 below.** Three old Cowork jobs still have no replacement, and their instructions exist only inside Cowork. Demolishing the scaffolding doesn't delete those jobs, but it does close the door on copying them out faithfully. If you want them copied rather than rewritten, that's worth doing first — so item 3's question and this one are really one decision.

**Question: go ahead with the demolition — yes or no?**

> **2. Your working copy still needs about ten seconds. Fourth time asking — but the ending changed.**

The shared copy is now **64 commits ahead** of your machine, up from 60. Same three files in the way, and I re-verified this run rather than assuming: nothing exists only on your machine, and all three files are stale copies already superseded on the server. Two are old versions of this very briefing.

**What's new is that the automatic repair shipped last night.** It's live now, and it's refusing on purpose — it won't touch a working copy with loose files in it, which is the correct instinct. Clear those three and it should re-attach on its own from here, meaning this item stops coming back rather than returning next hour.

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git stash push -m home-tree-recovery
git switch main
git pull --ff-only origin main
```

> **3. May I file the bug report with Anthropic? Yes or no.**

Unchanged, and still the only thing gating that ticket. The write-up is finished and on the shared copy — nothing waits on writing, only on your permission to post it publicly. It would name your setup and quote excerpts from your repository's history, which is why it's your call.

This is the same fault behind item 2. A "no" costs nothing: the containment is now live locally and the write-up simply stays internal.

> **4. What's the next stretch?**

Carried, and it's why the queue keeps running dry. The three war follow-ons remain the nearest ready-made answer: **deeper battles**, **sieges that tighten as they drag**, and **what a war leaves behind**. Two are high priority. Re-checked again this run — still in the planning column, still carrying text claiming they're blocked by the war activation that finished on the 18th. That blocker is stale, not real. They also still describe building pieces that partly exist, so if war is the answer, someone re-scopes them against the real code first.

A rough direction is enough; the queue can be refilled toward it.

## Queue

**Starved — one item, and it's waiting on your signature (item 1 above).**

- The single queued job is high priority and gated by design, not by accident. Until you answer, the executor has nothing to pull.
- **One thing sits in development** — the bug-report ticket, unassigned, complete apart from your yes/no. Parked, not stalled.
- **Nothing is blocked in the technical sense.** The shortage is that planning has run out ahead of execution, which is what item 4 addresses.

## Freshness

**Loose from `main`, 64 behind, auto-repair live but declining to act.** Full explanation and the fix are item 2 above.

Short version: the tree came off `main` at 06:20 yesterday, three stale files block the automatic re-attach, and every one is verified duplicated on the server. Nothing is at risk. Unlike the previous three asks, this one should be the last — the repair that was missing has since shipped.

Per the standing rule, this task doesn't repair your working copy itself. A scheduled job reaching into your files is exactly what caused the mess it would be cleaning up.

## What's moving

**A genuinely good night — the git and CI cleanup finished.** Five of the six tickets in that family closed between 22:35 and 09:13:

- **The freshness alarm was fixed** — it had been measuring the wrong thing and inventing an escalating "commits behind" number.
- **The home copy was made inert**, with automatic re-attachment when it gets knocked loose. That's the fix that makes item 2 a one-off.
- **The stale-branch cleanup job was repaired** — it had been failing silently.
- **Pull requests now merge themselves once checks pass**, which is why this briefing's own updates land unattended.
- **The sixteen-day-old console warning closed** at 09:30.

**One closure worth reading honestly:** the one-time git tidy-up was marked done at 09:13, but by *splitting out* its two hard halves rather than finishing them — the stash pile turned out to be 38 entries deep rather than 12, and the 26 leftover work folders live in a directory the executor is explicitly forbidden to touch. Both are now their own tickets. That's the right call, but it means the fifteen stray draft documents on your machine are still there.

**Older pull requests:** fourteen remain open and unmerged, unchanged. The auto-merge fix only helps requests opened after it, so that backlog still drains by hand.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
