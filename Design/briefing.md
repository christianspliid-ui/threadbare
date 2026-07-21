# Briefing

**Generated:** 2026-07-21 04:54 local (02:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still three. One of them may resolve itself before you read this — see below.**

> **1. Your working copy is still frozen — but something is actively cleaning it right now. You may want to do nothing.**

Carried from the last several runs, with a real change this hour. Your local copy is on `main`, **forty-four commits behind** (up from 38), and the hourly auto-sync is still refusing.

**The change:** at 04:02 an executor picked up the cleanup ticket that owns exactly this mess, and it has already landed two batches of work — the fifteen loose design drafts on your machine are now safely committed to the shared copy. Its finish line is literally "your working copy reads clean." So the most likely outcome is that **this item disappears on its own within an hour or two**, without you touching anything.

If you'd rather not wait, the commands have grown by one line, and the new line matters:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git reset
git checkout -- Design/briefing.md Design/user-actions.md
rm Docs/judge-metrics/2026-W29.md Docs/plans/.intent-proposals/*.md Docs/plans/2026-07-0[45]-*.md
git pull --ff-only
```

The `rm` line is new and is **not** optional now — those fifteen files exist both on your machine and, as of an hour ago, in the shared copy, so the pull will refuse until the local copies are out of the way. I compared all fifteen byte for byte against what was committed: **they are identical**. Deleting them loses nothing; the pull brings the same bytes back. Same for the two `Design/` files — superseded leftovers of this task's own earlier behaviour.

**Either path is safe.** Waiting costs nothing; running it takes about five seconds.

> **2. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Unchanged, and now carried into a fourth day. Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-verified again this run: their stated blocker closed on Saturday, all three still carry text claiming they're blocked, and they describe building things that partly already exist — the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **3. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 1 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Healthy but thinning — five waiting, one in development.** Down from six; the executor took one and is mid-flight on it.

- **Nothing is blocked.** The three git/CI tickets still queued all point at a spec readable from anywhere.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.
- **One bookkeeping oddity, not a problem:** the in-flight ticket shows as claimed-by-nobody. That is the known Linear write-drop, not a stalled or abandoned task — it has landed two merges in the last hour, so it is plainly being worked.

If the executor finishes its current ticket and the two stale items are the only thing left worth pulling, the lane will start idling. Not yet, but the trend is one way.

## Freshness

**Same fault, one hour older — and for the first time it now has an owner actively on it.**

Your tree is on `main`, **forty-four behind** (was 38), with three tracked files reading as changed and fifteen untracked. Verified this run rather than assumed:

- The two `Design/` files are the *23:54* copies — five subsequent runs have left them untouched, because since 01:54 this task writes into its own scratch workspace and never touches your tree.
- The third tracked file is byte-identical to the shared copy.
- **All fifteen untracked drafts are byte-identical** to the versions committed to the shared copy an hour ago.

**There is no authored work anywhere in that set.** The behind-count climbing is the auto-sync being blocked, not damage accumulating.

The overnight fix that stops your tree drifting is installed and working — it just doesn't cover this case, because it deliberately refuses to touch anything that looks edited. Right in general, unhelpful here. That gap is written up in `user-actions.md` item 5.

Per the standing rule, this task doesn't repair your tree itself — a scheduled job touching your working copy is precisely what caused the mess it would be cleaning up.

## What's moving

**The git tidy-up went from queued to in-flight, and has already delivered** (PRs #654, #655):

- **Fifteen loose design drafts** — brainstorms, exploration notes, and design-proposal records that existed only on your machine — are now committed and backed up. That closes the "one machine, no backup" exposure this file has carried for days.
- **The cleanup findings were written into the impediment log**, so the pattern stops being rediscovered each run.

Still in that ticket's scope and not yet done: a stash pile that has grown to **38 entries** (it was scoped at 12), and roughly two dozen stale worktrees.

**One backlog worth naming, not acting on:** fourteen pull requests remain open, oldest from 2026-06-12 — unchanged in count for five runs. Thirteen are documentation; **one is a real feature**, a milestone-beat change unmerged since 2026-07-05. The cause is understood: each falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is queued and correctly aimed.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
