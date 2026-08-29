# Briefing
**Generated:** 2026-08-29 07:55 local (05:55 UTC) · keep-work-flowing-cc

## The one thing

**Play two encounters, then approve the batch-2 brief — [THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to) + [THR-1222](https://linear.app/threadbare/issue/THR-1222/run-retrofit-batch-2-the-camp-seven-through-the-factory-line-shrine).**

Unchanged, and unchanged in reasoning: it is the only High-priority content work on the board, it is written, and **no encounter writing reaches the shelf until it clears.**

About five minutes. Open the *good ending* links first:

- The Grateful Kin — [play](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.grateful_kin&outcome=critical_success)
- The Unsafe Bridge — [play](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge) · [good ending](https://threadbare.vercel.app/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge&outcome=critical_success)

Your question: *are they worth meeting twice?* Then [the brief](https://github.com/christianspliid-ui/threadbare/blob/main/Docs/plans/encounters/retrofit-batch-2-brief.md) needs one word — *"batch 2, seven is fine"*, *"keep it six"*, or *"same rule — judge batch 2 on one first."*

## Also waiting (10)

Unchanged since last hour — skip if you have read them. Detail in [user-actions.md](https://github.com/christianspliid-ui/threadbare/blob/ops/Design/user-actions.md).

- **More design hours — still the constraint.** [Card-grammar unification](https://linear.app/threadbare/issue/THR-1002/unify-the-card-grammar-action-cards-adopt-the-encounter-card) (10 days) and [traits wave 2](https://linear.app/threadbare/issue/THR-790/traits-wave-2-locations-artifacts-and-draw-by-trait-pools) (14 days) hold the one design slot. **Sit one, or say "park it."** Three plan-doc sessions are ready behind them.
- **One word players see — [THR-1314](https://linear.app/threadbare/issue/THR-1314/ul-proposal-work-holding-kind-row-christening-failure-name-register).** A strained company reads as **holding**; the ownership work wants **a holding** to be an owned thing. Unless you say otherwise the newer word moves. Reversible; the ticket does not wait.
- **[The Physical Conflict map](https://linear.app/threadbare/issue/THR-1258/wayfinder-map-physical-conflict)** — nine questions, all yours; every research question it carried is finished. [How a duel ends](https://linear.app/threadbare/issue/THR-1264/agent-mode-fight-loop-opposed-band-pairs) and [what a wound costs](https://linear.app/threadbare/issue/THR-1263/npc-mode-fight-loop-the-stat-block-and-test-skeleton) release three more.
- **[Twenty spells](https://linear.app/threadbare/issue/THR-1232/power-generator-sketch-twenty-generated-spells-to-react-to) and [thirty items](https://linear.app/threadbare/issue/THR-1236/item-generator-sketch-thirty-generated-items-to-react-to)** — sketches a session builds for you to react to. Cheapest of the maps.
- **[Image credits](https://linear.app/threadbare/issue/THR-876/regenerate-the-5-quarantined-meet-the-first-scene-assets-doctrine)** — should the spend be gated on you at all? Your answer settles every batch after.
- **[What is a run about?](https://linear.app/threadbare/issue/THR-1198/the-48-authored-mandate-strings-are-wired-but-unreachable-no-live-game)** — remembrance, or named campaigns. Nothing downstream waits.
- **[One attended dev-server session](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server)** — nine shipped surfaces owed screenshots; bundles into whichever sitting you approve the brief in.
- **[A held breath on committing a nudge?](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)** — pure feel; two lanes recommend no, and an agent will retire it and report unless you say otherwise.
- **Chart the hub map** — advice is still to wait one cycle, until your [integrated slice checkpoint](https://linear.app/threadbare/issue/THR-1220) validates the base.
- **A Tenacious-style trait** — parked, no urgency, listed so it is not silently forgotten.

## Queue

**7 items Ready for Dev. Healthy; nothing here needs you.**

**Correcting what I told you an hour ago.** The last two briefings — mine at 06:55 and the orchestrator's before it — said the unified-decision-board cutover was the payoff job, finally unblocked, and that when an executor took it *"the world starts running on the new board."* An executor took it at 07:02 and **refused it**, correctly. Switching the board on today writes **zero trade routes** into the world: the trade-route action is never even generated as a candidate, and three world-simulation tests fail — while all three cutover criteria read green the entire time. [The gate could not see it](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade), because it measures how the *families* of choice divide up and says nothing about variety *within* one.

- **The cause, measured rather than guessed.** The old scorer carried a penalty for repeating yourself, and that penalty is what kept agents spread across different projects. The new board has no such term, and the plan's claim that the old scorer's parts "survive as inputs" turns out not to hold for this one — so at switch-on the variety mechanism is dropped rather than moved, and everything concentrates on whatever scores highest. [The blocker is written up](https://linear.app/threadbare/issue/THR-1349/the-decision-board-has-no-variety-term-a-live-board-writes-zero-trade) and on the shelf; the cutover went back to the backlog behind it, and [a fix for the blind gate itself](https://github.com/christianspliid-ui/threadbare/pull/1721) is in review — the census now has to prove variety, not just proportion.
- **Why I am spending your attention on a technical call you do not have to make:** twice in twelve hours this chain has been reported to you as further along than it was, and both corrections came from executors who measured instead of trusting the ticket. That is the machinery working — but you have now been told "it's about to go live" twice, so you should hear it plainly when it isn't.
- **The rest of the shelf:** [the prose doctrine sweep](https://linear.app/threadbare/issue/THR-1324/prose-doctrine-v2-remediation-sweep-10-operative-surfaces-still-teach) plus five small deferred clean-ups — engine and content hygiene found by builders while building. Still no encounter writing on it, which is what the ask above changes.
- **In Dev: 5, two of them live** — [the world-generator ordering fix](https://linear.app/threadbare/issue/THR-1344/the-genomes-reach-pass-is-dead-at-worldgen-worldseed-runs-the-genome) and [the run-founded faction bug](https://linear.app/threadbare/issue/THR-1322/a-run-founded-faction-renders-as-a-fallback-everywhere-in-the-ui), both in review and both named under Health below. The other three are your parked standing asks ([THR-1130](https://linear.app/threadbare/issue/THR-1130/encounter-factory-pilot-volume-retrofit-the-15-nudge-era-encounters-to), [THR-1133](https://linear.app/threadbare/issue/THR-1133/attended-pixel-pass-sweep-five-owed-19201080-captures-one-dev-server), [THR-1168](https://linear.app/threadbare/issue/THR-1168/two-authored-encounter-audio-moments-have-no-live-caller-wire-or)); park shape verified intact this run.
- Nothing on the shelf is stale — the oldest item was filed two days ago.

## Health

**Green, with the same two PRs needing a session. Nothing here needs you.**

- **[#1714](https://github.com/christianspliid-ui/threadbare/pull/1714)** (the run-founded faction fix) — genuine merge conflict, now ~7.5 hours old. Auto-merge stays armed and correctly refuses to fire; a session must merge `origin/main`, resolve by hand and push.
- **[#1717](https://github.com/christianspliid-ui/threadbare/pull/1717)** (the world-generator ordering fix) — conflicted *and* failing a required check, ~4.5 hours old. Both must clear; the conflict alone is not the diagnosis. Executor's to work.
- Everything else green: the live site serves the latest commit ([9d36b9a7](https://github.com/christianspliid-ui/threadbare/commit/9d36b9a788d43cf85422179eeec9954e1e5a109f)), background jobs healthy, all nine scheduled lanes on schedule, the branch reaper ran at 07:40, and the home copy of the repo is clean and current.

Unchanged and worth seeing rather than acting on: **the only lane quiet in the probe's window is overnight-shaped** — 22–23 and 23–24 August, both roughly 21:00–08:00 local, every lane stopping and resuming together. Declined under your 8 August ruling that overnight quiet is normal. Nothing was lost.
