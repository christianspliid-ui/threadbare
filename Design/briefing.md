# Briefing
**Generated:** 2026-09-22 11:00 local (09:00 UTC) · keep-work-flowing-cc

## The one thing

**One design hour on [THR-1525](https://linear.app/threadbare/issue/THR-1525/signed-desire-score-vs-the-specs-step-6-a-fork-that-plants-on-its) — are scenes being handed to exactly the mortals who will refuse them?** Open a chat and say you want to work THR-1525.

When the world picks *which mortal* gets offered a scene, it favours the mortal who leans one way on the scene's named value. But when that scene's choice then forks on the same value, the arm that matters is usually the other one — so the game reliably offers a two-way choice to the person who will take the dull arm. **Measured, not suspected:** A Bargain at the Crossroads fired once in a thousand ticks and was refused, and the meeting it was meant to arrange never happened on any seed. Pointing that one scene at a different value made it fire 3 and 11 times on two seeds.

**The fork is yours because both readings are defensible.** Either the rule was always meant to draw both kinds of mortal — and the code has quietly disagreed with its own documentation for months — or the lopsidedness *is* the design, a Protector really should be drawn to a mercy scene, and the house guide must stop telling authors to reuse that axis for the fork. Whichever you pick, the work after it is ordinary.

**This hour the prediction came true: the shelf is empty.** Last hour one job sat on it; the builder took it at 10:21 local, and behind it there is now **nothing buildable at all**. The planning lane may hold only one design on its desk, THR-1525 is on it, and it comes off in a chat with you or not at all. Three tickets are queued behind it: [untrue prose reaching live mortals](https://linear.app/threadbare/issue/THR-1526/sequel-only-encounter-templates-are-reachable-from-the-live-board-the), [the attention model](https://linear.app/threadbare/issue/THR-1523/spotlight-pull-the-swap-pool-is-the-handful-of-ambition-less-seeded), and [ground that remembers its battles](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location). *— the same call, independently, from tb-orchestrator*

## Also waiting (5)

- **[May a lane draft a design doc on its own?](https://linear.app/threadbare/issue/THR-1525)** — your 6 August rule rests on a model choice that has since changed; a yes would let the planning lane write first drafts instead of leaving the shelf empty. Detail in [`user-actions.md`](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).
- **[Turn off Linear's auto-complete for sub-issues](https://linear.app/threadbare/settings/teams/THR/general)** — it erased five pieces of unbuilt work in four hours on Sunday; all recovered, and a note on the ticket did not stop it.
- **[Finish the review sitting](https://linear.app/threadbare/issue/THR-1220/integrated-slice-checkpoint-christian-plays-all-five-encounters-with)** — two encounters left, screen clean: [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan).
- **Were the stops deliberate?** — four lane-silence episodes, all ended; every lane has fired on schedule since Monday 17:41 local, re-verified this run.
- **Fog or witness** — should a stranger's sheet show the wound you just watched an encounter give them, or does the fog stay honest? Silence leaves it as-is.

## Queue

**Starved — 0 ready, and the one job in flight has been abandoned mid-build.**

- **Ready to build: nothing.** [THR-1521](https://linear.app/threadbare/issue/THR-1521/traits-wave-2-slice-3-artifact-traits-the-has-trait-schema-admits) (traits wave 2, slice 3 — artifact traits) was the last item; the builder claimed it at 10:21 local and the shelf has been empty since.
- **In flight: THR-1521, claimed but stalled.** The builder session that took it hit a usage limit sixteen minutes later and died without pushing anything. The job is still marked claimed, so the next builder run will step over it and find nothing. The twice-daily stale-claim sweep (next 14:00 local) is what releases it — see Health.
- **28 items in Todo, none promotable.** 15 are wayfinder decision tickets; of the remaining 13, every one is waiting on a design call rather than on another job. One was added this hour — [THR-1528](https://linear.app/threadbare/issue/THR-1528/battle-history-record-the-substrate-blood-soaked-needs-a-per-location), filed by the builder before it died — and it too needs a design pass first. That is the shape behind the lead ask, unchanged for five hours.

## Health

- **The builder lane ran out of model credit mid-job.** Its 10:11 local run claimed the last job on the shelf, worked for sixteen minutes, then stopped with *"You've reached your Fable limit."* Nothing was lost — no branch was pushed, and the job returns to the shelf when the stale-claim sweep runs at 14:00 local. **First occurrence, so nothing for you to do yet**; if the lane keeps dying this way the fix is credit or a model change, and a session will say so plainly rather than leaving it in Health.
- **The slow post-merge test job is still red** — "Heavy simulation tests" has been failing on the newest commit on `main` for about three hours. It is not a required check, so nothing is blocked by it, but the fix it needs is owed and no session has claimed it. Executor work, not yours.
- **Lane silence — the weekend gap stays declined, per your 8 August and 11 September rulings.** The worst episode (25.1h) ran Saturday 11:33 → Sunday 12:37 local, squarely weekend-shaped. The Monday daytime stop is what keeps the standing question open; nothing new happened this run.
- **Everything else green.** No pull requests are open or waiting; the live site is serving the newest commit (`f3f9fb60`); CI and the Linear auto-close job are green; all 9 scheduled tasks are within a slot of schedule; the git reaper ran at 10:40; the home checkout is level with `origin/main`; and engine tick cost is 66 ms/tick — 10% *under* the 7-day median of 73.
