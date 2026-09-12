# Briefing
**Generated:** 2026-09-12 14:58 local (12:58 UTC) · keep-work-flowing-cc

## The one thing

**Every fix you named this morning is now live. Nothing on the two unopened encounters is a known defect — the sitting can finish clean.**

The last caveat cleared 26 minutes ago: clicking a mortal's name in an encounter now opens their character sheet, and the ending stays on screen behind it ([THR-1477](https://linear.app/threadbare/issue/THR-1477), merged 14:31, deployed). The brief an hour ago told you that one was still broken on screen. It isn't any more.

So all five things your four batches produced are on the site: chip nouns are character-sheet words ([THR-1472](https://linear.app/threadbare/issue/THR-1472)), a chip sentence is a caption rather than a second ending ([THR-1473](https://linear.app/threadbare/issue/THR-1473)), a condition says what it actually does ([THR-1475](https://linear.app/threadbare/issue/THR-1475)), prose may not promise a place the seed cannot reach ([THR-1476](https://linear.app/threadbare/issue/THR-1476)), and now the name-click.

**The two you have not opened:**

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The question is still the one on [THR-1220](https://linear.app/threadbare/issue/THR-1220): **is the integrated encounter experience at an acceptable state?** A pass is what charters the hub map — factions, war, economy, divine actions all hanging off this interface.

One thing still visibly unfixed, and you already ruled on it: the nudge stage shows two panels instead of one ([THR-1478](https://linear.app/threadbare/issue/THR-1478), High, queued from your batch 4). Not a question for you again.

## Also waiting (1)

- **Fog or witness?** Now that the name-click works, clicking a *stranger*'s name shows you almost nothing — see below. [THR-1477](https://linear.app/threadbare/issue/THR-1477)'s session hit this while building the fix and would not decide it alone. *(— from tb-orchestrator)*

  If you barely know a mortal, their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — even at the moment the encounter you just watched wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You may well meet this during the sitting.

## Queue

**Backed up — 19 ready, 0 in dev, 2 on the design desk.** One fewer than last hour: THR-1477 shipped off the board and nothing replaced it.

- **Three of the 19 are High**, and none needs anything from you: [THR-1478](https://linear.app/threadbare/issue/THR-1478) (your nudge-stage batch), plus the two opening build slices of the programs designed off your direction — [THR-1485](https://linear.app/threadbare/issue/THR-1485) (any content can hand out any other content, by tag) and [THR-1490](https://linear.app/threadbare/issue/THR-1490) (every thing in the world opens the same card, from wherever it is named).
- **The collision flagged last hour partly resolved itself.** [THR-1490](https://linear.app/threadbare/issue/THR-1490) rewrites the routing THR-1477 has now fixed, so the parallel-work hazard is gone; what remains is that THR-1490 must not regress the fix. [THR-1461](https://linear.app/threadbare/issue/THR-1461) — the premonition opening the wrong mortal's sheet — had its coordination block repaired this hour by tb-orchestrator, which found the ticket was prescribing the exact fix that failed on THR-1477 and pointed it at the working primitive instead. Executor's business, recorded here.
- **Nothing is parked, nothing is claimed, nothing is stale.** Five of the 19 are low-priority deferrals; the rest were touched in the last two days.
- The design desk carries the appointment primitive ([THR-1479](https://linear.app/threadbare/issue/THR-1479)) and the held town ([THR-1448](https://linear.app/threadbare/issue/THR-1448)). Neither is an ask on you. The UI Law 21 wording amendment riding with THR-1490 is still on a **veto window**, not a question — say nothing and it ships as designed.
- The wider map — fights, items, powers — still waits behind eight questions only you can answer, deliberately not chased while the sitting is live. Say **"work the map"** in a chat when the sitting is done. *(— from tb-orchestrator)*

## Health

- **All green.** Site serving the latest commit on main (`efdeebf5`, which is the THR-1477 merge), CI and all three post-merge jobs green, no PRs open anywhere, all nine lanes on schedule, reaper ran at 14:40. Simulation at 60 ms/tick — 31% *below* the 7-day median of 87 across 85 measurements.
- **The executor lane is working, despite the empty In Dev column.** The 14:01 pickup claimed THR-1477, shipped it and merged at 14:31; the board is simply between pickups. Zero in flight here is a gap of minutes, not a stall.
- **The lane-silence probe flags the same three old gaps, and they are still not being carried to you.** Worst is 18.6 h on 7–8 September; the most recent ran Friday evening into this morning, which is the weekend shape you ruled normal on 11 September. The two older weekday ones are four and five days past, nothing recorded a pause for them, and the machine has shipped six times since. An answer now would change nothing. On the record here, not on your list.
