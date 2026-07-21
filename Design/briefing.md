# Briefing

**Generated:** 2026-07-21 03:54 local (01:54 UTC) · by `keep-work-flowing-cc`

This is your inbox. It's rewritten every hour by a Claude Code task — the replacement for the old Cowork "keep-work-flowing" chat brief. Standing switches you need to flip live in [`Design/user-actions.md`](user-actions.md); this file is the fresh-this-hour view.

## Needs Christian

**Three things. Two carried and still keeping; one promoted this hour because it has stopped being cosmetic.**

> **1. Two commands on your machine, next time you sit down. Your working copy has been frozen for seven hours.**

This is new to this section — it has been sitting under "Freshness" for a few runs, and it has now earned the promotion. Your local copy of the project is stuck at yesterday morning and **thirty-eight commits behind** the shared one. The hourly job that normally keeps it level has refused on **seven consecutive runs**, the gap growing 5 → 9 → 16 → 20 → 24 → 32 → 38.

Nothing you wrote is at risk — I verified this rather than assumed it. The three files holding it up are all leftovers from *this* task's earlier behaviour, and every one of them is already safely in the shared copy. Discarding them loses nothing.

```
cd C:\Users\chris\Dev\Projects\TheFantasyWorldSimulator
git reset
git checkout -- Design/briefing.md Design/user-actions.md
git pull --ff-only
```

The `git reset` line is new — earlier briefs omitted it, and without it the pull still refuses. Nothing else on your machine needs touching. **This is safe to run at any time and takes about five seconds.**

> **2. Is the notification rework the next stretch, with war deferred until it's done — or do you want both moving in parallel?**

Three war follow-ons sit written and waiting: deeper battles, sieges that tighten as they drag, and what a war *leaves behind*. Two are high priority. Re-verified again this run: their stated blocker closed on Saturday, all three still carry text claiming they're blocked, and they describe building things that partly already exist — the war system turned out to be dormant rather than missing.

They sit in the planning column, which the executor never pulls from, so they aren't starving anything. **Answer this when you next think about direction, not because this file asked.** If war is later, they sit safely as-is. If it's both, someone re-scopes them against the real code first, so you're choosing against reality rather than a stale plan.

> **3. The old Cowork jobs still need switching off — and one of them needs a preference from you.**

Full detail is item 1 in [`user-actions.md`](user-actions.md). The short version: the move off Cowork is done on this side, but nothing here can reach into Cowork to disable its old copies, so a few jobs run twice. One of the four is safe to switch off immediately. The other three have no replacement yet, and the question is whether you'd rather **paste their instructions out of Cowork** so they can be copied faithfully, or have **fresh versions written and shown to you on a trial run** before switching on. Either answer unblocks the last migration ticket.

Nothing else needs you.

## Queue

**Healthy — six waiting, nothing in development right now.** One item cleared since the last brief. The executor is between turns.

- **Nothing is blocked.** The four git/CI tickets in the queue all point at a spec that is readable from anywhere, so any executor can pick one up cold.
- **The two oldest items are properly stale** — a documentation tidy-up and a console warning, both untouched since 2026-07-05, now **sixteen days** old. Both lowest priority. Naming them rather than counting them as real queue depth.

## Freshness

**Unchanged in kind from the last three runs, worse in degree — and now promoted to "Needs Christian" above, where the fix is.**

The tree is on `main`, **thirty-eight behind** (up from 32), with three tracked files reading as changed. The hourly auto-sync logged its seventh consecutive refusal at 03:50: *uncommitted changes that would be overwritten*.

**Verified this run, not assumed:** both `Design/briefing.md` and `Design/user-actions.md` in your copy hash-match a blob already committed to the shared copy (the 23:54 briefing, committed 22:34 UTC). The third file, the git/CI plan doc, is byte-identical to the shared copy. All three are superseded leftovers. There is no authored work anywhere in that set.

**The residue has stopped growing, as predicted.** Since the 01:54 run this task writes its output in its own scratch workspace and never touches your tree. The two files sitting there are still the *23:54* copies — four subsequent runs have left them untouched. Only the behind-count climbs, and that is the auto-sync being blocked rather than new damage accumulating.

The overnight fix that stops your tree drifting **is installed and working** — it just doesn't cover this case. It deliberately refuses to touch a file that looks edited, which is right in general and unhelpful here. Extending it to recognise its own stale output is a real gap, written up in `user-actions.md` item 5 for a design session rather than filed as a ticket, because this task doesn't create work.

Per the standing rule, this task doesn't repair your tree itself — a scheduled job touching your working copy is precisely what caused the mess it would be cleaning up.

## What's moving

**One solid fix landed since the last brief** (PR #652):

- **Thirty-two pieces of content carried an invalid rarity tier** — a value the game's own rules didn't allow. All thirty-two are corrected, and the hole that let them through was closed at the type level, so the same mistake now fails at build time instead of shipping quietly. The action catalog was regenerated to match. A sandbox limitation found along the way was logged rather than left to be rediscovered.

**One backlog worth naming, not acting on:** fourteen pull requests remain open, oldest from 2026-06-12 — unchanged in count for four runs. Thirteen are documentation; **one is a real feature**, a milestone-beat change that has sat unmerged since 2026-07-05. The cause is understood: the rule that a change must be level with the shared copy before it can go in means each one falls behind the moment anything else lands, and nothing re-freshens them. The fix ("merge it automatically once checks pass") is queued and correctly aimed.

Mildly absurd twist, unchanged: **this briefing lands every hour, and each landing is what pushes the rest further behind.**

---
*Standing asks live in [`Design/user-actions.md`](user-actions.md). This file is regenerated hourly by the `keep-work-flowing-cc` scheduled task; if the timestamp at the top looks old, check the task's `lastRunAt` in the scheduled-task list to tell "nothing new to report" from "task stopped running."*
