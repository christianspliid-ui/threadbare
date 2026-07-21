# Briefing

**Generated:** 2026-07-21 05:54 local (03:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Still three, all carried. Nothing new was added this hour.**

> **1. Your working copy is still frozen. The ticket that owns it is two hours in and hasn't reached this part yet.**

Unchanged in substance from last hour, one number worse. Your local copy is on `main`, **forty-eight commits behind** (was 44), and the hourly auto-sync is still refusing for the same reason.

The cleanup ticket that owns this is still in flight and has landed more work since the last brief, but it hasn't got to the "leave the working copy clean" step. It may still finish on its own. It may also be worth just doing it yourself now — it takes about five seconds:

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git reset
git checkout -- Design/briefing.md Design/user-actions.md
rm Docs/judge-metrics/2026-W29.md Docs/plans/.intent-proposals/*.md Docs/plans/2026-07-0[45]-*.md
git pull --ff-only
```

Re-verified this run, not assumed: every file that sequence touches already exists in the shared copy, byte for byte. **Nothing you wrote is in that set.** Deleting the local copies loses nothing; the pull brings the same bytes back.

**Either path is safe.** The only cost of waiting is that your machine keeps drifting further from the shared copy, which makes your next morning session start on older code.

> **2. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Unchanged, now into a fifth day. Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-verified again this run — their stated blocker closed on Saturday, all three still carry text claiming they're blocked, and they describe building things that partly already exist, because the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **3. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 1 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Thinning — four waiting, one in development.** Down from five. The executor took another ticket and finished it inside twenty minutes.

- **Nothing is blocked.** The two remaining git/CI tickets both point at a spec readable from anywhere.
- **Half the queue is stale.** The two oldest — a documentation tidy-up and a console warning — are untouched since 2026-07-05, now **sixteen days** old, and both are lowest priority. Naming them rather than counting them as real depth: **the honest live queue is two items.**
- The in-flight ticket has been open **two hours**, longer than anything else this shift, but it is plainly being worked — it has landed merges throughout.

The trend called out last hour has arrived: **once the current ticket lands, the lane is one or two real items from idling.** Worth a grooming pass, not an emergency.

## Freshness

**Same fault, one hour older, no new damage.**

Your tree is on `main`, **forty-eight behind** (was 44), with three tracked files reading as changed and fifteen untracked. Verified this run rather than assumed:

- The two `Design/` files are still the *23:54* copies — six consecutive runs have left them untouched, because since 01:54 this task writes into its own scratch workspace and never touches your tree.
- The third tracked file is byte-identical to the shared copy.
- All fifteen untracked drafts are byte-identical to versions already committed to the shared copy.

**There is no authored work anywhere in that set.** The rising behind-count is the auto-sync being blocked, not damage accumulating. The repair is item 1 above.

Per the standing rule, this task doesn't repair your tree itself — a scheduled job touching your working copy is precisely what caused the mess it would be cleaning up.

## What's moving

**A real one this hour: the pull-request bottleneck got its systemic fix (PR #657).**

Pull requests can now **merge themselves the moment their checks go green**, instead of waiting for a session to come back and press the button. The same change fixed a pre-commit check that had been falsely blocking commits over scratch files — a known repeat offender with sixty-plus mentions in the friction log. Third of the six git/CI tickets to land, and the one that most directly addresses the ageing-PR complaint this file has carried for a week.

**Important caveat, so next hour's brief isn't read as a failure:** this helps *new* pull requests. The **fourteen already open** — thirteen documentation, one real feature — still need a manual refresh each, because they went stale before the fix existed. Expect that count to fall slowly rather than snap to zero. The oldest is still 2026-06-12; the feature one (a milestone-beat change) has sat since 2026-07-05 and needs conflict resolution, not just a nudge.

Still open inside the in-flight cleanup ticket: a stash pile now at **38 entries** (scoped at 12) and **26 stale worktrees**.

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
