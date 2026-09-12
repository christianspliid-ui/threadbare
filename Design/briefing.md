# Briefing
**Generated:** 2026-09-12 15:58 local (13:58 UTC) · keep-work-flowing-cc

## The one thing

**The nudge stage you redesigned this morning is live. The scene screen looks different from the one the last brief described — go and look at it.**

[THR-1478](https://linear.app/threadbare/issue/THR-1478) merged at 15:44 and is deployed. It was the last thing from your four batches still visibly unfixed, and it was the biggest of them. What you will see on a scene screen now:

- **One block above the prose**, not two. Portrait, name, Mute, location, reach — each drawn once. The panel below the prose is gone.
- **The forecast is a die.** No "Forecast" label, no tier word on screen — five faces, one pip through five, the pip count being the rung on the `doomed … fated` ladder rather than a quantity.
- **The difficulty is a balance that tilts.** The word is gone; the scales lean toward the mortal at *gentle* and fall away at *severe*. It had to become a drawn shape rather than a glyph, because with the word gone the tilt is the reading.
- **The objective line is gone** from the player surface.
- **"The Balance" is dropped as a labelled concept** — you asked whether it needed to be shown. The factor lines already carry their reading in their colour, so the hover became a small first-contact legend under them, dismissed once and remembered.

**Two things on that screen you should see rather than be told about, both already decided:**

1. **The die replaces the tier word, and a written law says marks should annotate words rather than replace them.** Your ask and the law point opposite ways on this one surface. The session judged the binding rule to be the one that lets a mark stand alone if it says its reading one hover away — which the die does — shipped it, and recorded the conflict rather than settling it silently. Yours to overrule on sight if it reads wrong.
2. **Two factor lines are not sentences** — one reads *"Vara is oracle in eye."* They read that way before this change too, but the merge moved them **above** the prose, so a broken one is now among the first things a player reads. Filed as [THR-1494](https://linear.app/threadbare/issue/THR-1494) and queued, not patched in place, because the fault is in what writes the lines, not in what draws them.

**The two encounters you have not opened:**

- [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
- [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)

The question is unchanged, and it is still [THR-1220](https://linear.app/threadbare/issue/THR-1220): **is the integrated encounter experience at an acceptable state?** A pass charters the hub map — factions, war, economy, divine actions all hanging off this interface.

## Also waiting (1)

- **Fog or witness?** Clicking a *stranger*'s name shows you almost nothing. [THR-1477](https://linear.app/threadbare/issue/THR-1477)'s session hit this while building the name-click and would not decide it alone. *(— from tb-orchestrator)*

  If you barely know a mortal, their sheet reads *"Vara carries no known possessions, conditions, powers, or agreements"* — even at the moment the encounter you just watched wounded and exhausted her. The wound is real and on the world's books; the sheet withholds it because you have not earned knowledge of her. For a mortal you are bonded to, everything shows.

  That is the knowledge system working as designed, but it sits against what you asked the name-click *for*. **Should an encounter's own consequences be exempt from the familiarity gate — because you were there and watched it happen — or does the fog stay honest?** Either answer is defensible and the game means something different each way. Saying nothing leaves it as-is, which is also a real answer. You may well meet this during the sitting.

## Queue

**Backed up — 18 ready, 0 in dev, 2 on the design desk.** One fewer than last hour: THR-1478 shipped off the board and nothing replaced it.

- **The pickup lane took THR-1478 at 15:01 and merged it at 15:44** — 44 minutes, claim to live. The empty In Dev column is the gap between that finish and the 16:00 pickup, not a stall.
- **Two of the 18 are High**, and neither needs anything from you — the opening build slices of the two programs designed off your direction: [THR-1485](https://linear.app/threadbare/issue/THR-1485) (any content can hand out any other content, by tag) and [THR-1490](https://linear.app/threadbare/issue/THR-1490) (every thing in the world opens the same card, from wherever it is named). Six further slices sit behind those two and will unblock themselves as each lands.
- **Nothing is parked, nothing is claimed, nothing is stale.** Six of the 18 are low-priority deferrals; the rest were touched in the last two days.
- The design desk carries the appointment primitive ([THR-1479](https://linear.app/threadbare/issue/THR-1479)) and the held town ([THR-1448](https://linear.app/threadbare/issue/THR-1448)). Neither is an ask on you.
- The wider map — fights, items, powers — still waits behind eight questions only you can answer, deliberately not chased while the sitting is live. Say **"work the map"** in a chat when the sitting is done. *(— from tb-orchestrator)*

## Health

- **All green.** Site serving the latest commit on main (`358f9941`, the THR-1478 merge), CI and all three post-merge jobs green, no PRs open anywhere, all nine lanes on schedule, reaper ran at 15:40. Simulation at 60 ms/tick — 30% *below* the 7-day median of 87 across 86 measurements.
- **The lane-silence probe flags the same three old gaps, and they are still not being carried to you.** Worst is 18.6 h on 7–8 September; the most recent ran Friday evening into this morning, which is the weekend shape you ruled normal on 11 September. The two older weekday ones are four and five days past, nothing recorded a pause for them, and the machine has shipped seven times since. An answer now would change nothing. On the record here, not on your list.
