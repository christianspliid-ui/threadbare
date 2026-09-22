# Briefing
**Generated:** 2026-09-22 12:00 local (10:00 UTC) · keep-work-flowing-cc

## The one thing

**One design hour on [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) — are scenes being handed to exactly the mortals who will refuse them?** Open a chat and say you want to work THR-1525.

When the world picks *which mortal* gets offered a scene, it favours the mortal who leans one way on the scene's named value. But when that scene's choice then forks on the same value, the arm that matters is usually the other one — so the game reliably offers a two-way choice to the person who will take the dull arm. **Measured, not suspected:** A Bargain at the Crossroads fired once in a thousand ticks and was refused, and the meeting it was meant to arrange never happened on any seed. Pointing that one scene at a different value made it fire 3 and 11 times on two seeds.

**The fork is yours because both readings are defensible.** Either the rule was always meant to draw both kinds of mortal — and the code has quietly disagreed with its own documentation for months — or the lopsidedness *is* the design, a Protector really should be drawn to a mercy scene, and the house guide must stop telling authors to reuse that axis for the fork. Whichever you pick, the work after it is ordinary.

**This is still the only thing that refills the shelf.** Nothing buildable remains on the board. The planning lane may hold one design on its desk, THR-1525 is on it, and it comes off in a chat with you or not at all. Three tickets are queued behind it: [untrue prose reaching live mortals](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the), [the attention model](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), and [ground that remembers its battles](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— the same call, independently, from tb-orchestrator*

## Also waiting (6)

- **The builder lane is out of model credit and has now died twice in a row** — 10:11 and 11:11 local, both *"You've reached your Fable limit."* Last hour's brief promised to say so plainly if it happened again; it has. Either top up at [claude.ai usage settings](https://claude.ai/settings/usage) or tell a session to move that lane off Fable — nothing else can restart it. Detail in Health below.
- **[May a lane draft a design doc on its own?](https://linear.app/threadbare/issue/THR-1525)** — your 6 August rule rests on a model choice that has since changed; a yes would let the planning lane write first drafts instead of leaving the shelf empty. Detail in [`user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[Turn off Linear's auto-complete for sub-issues](https://linear.app/threadbare/settings/teams/THR/general)** — it erased five pieces of unbuilt work in four hours on Sunday; all recovered, and a note on the ticket did not stop it.
- **[Finish the review sitting](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left, screen clean: [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Were the stops deliberate?** — four lane-silence episodes, all ended. Today's credit failure is the first hard evidence for the usage-limit explanation you gave in August; the question narrows to whether you paused deliberately.
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the fog stay honest? Silence leaves it as-is.

## Queue

**Starved — 0 ready to build, and the one job in flight cannot move.**

- **Ready to build: nothing.** Unchanged for two hours. [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (traits wave 2, slice 3 — artifact traits) was the last item off the shelf.
- **In flight: THR-1521, claimed at 10:21 local and untouched since.** The builder that took it died sixteen minutes later on the credit limit; no branch was ever pushed and no pull request exists — verified this run, not assumed. The next builder run will step over it and find nothing. The twice-daily stale-claim sweep (next 14:00 local) is what releases it.
- **28 items in Todo, none promotable.** 15 are wayfinder decision tickets waiting on you; of the remaining 13, every one is waiting on a design call rather than on another job. That is the shape behind the lead ask, unchanged for six hours.

## Health

- **The builder lane is dead, not stumbling.** Its 10:11 local run claimed the last job, worked sixteen minutes and stopped; its 11:11 run stopped after **seven seconds**. Both with the same message: *"You've reached your Fable limit."* The next attempt is 12:10 local and will almost certainly do the same. Nothing has been lost — no branch, no half-finished work — and nothing is queued for it to build anyway, so the cost today is one claimed job sitting still. This lane is the only one affected; the planning lane and this one are running normally on a different model. It is on your list above because only you can buy credit, and moving the lane to another model is a change to your own configuration rather than a fix a session should make unasked.
- **The slow post-merge test job is still red** — "Heavy simulation tests" has been failing on the newest commit on `main` for about four hours. It is not a required check, so nothing is blocked by it, but the fix it needs is owed and no session has claimed it. Executor work, not yours.
- **Lane silence — the weekend gap stays declined, per your 8 August and 11 September rulings.** The worst episode (25.1h) ran Saturday 11:33 → Sunday 12:37 local, squarely weekend-shaped. The Monday daytime stop is what keeps the standing question open, and today's credit failure makes the usage-limit explanation considerably more likely than a machine fault.
- **Everything else green.** No pull requests are open or waiting; the live site is serving the newest commit (`f3f9fb60`); CI and the Linear auto-close job are green; all 9 scheduled tasks are within a slot of schedule; the git reaper ran at 11:40; the home checkout is level with `origin/main`; and engine tick cost is 66 ms/tick — 9% *under* the 7-day median of 72.
