# Briefing
**Generated:** 2026-09-12 08:05 local (06:05 UTC) · keep-work-flowing-cc

## The one thing

**Play the five encounters, in one sitting** — [THR-1220](https://linear.app/threadbare/issue/THR-1220)

This is the invitation you have been waiting on since 24 August, and it is the first time it has been allowed to reach you. The verification pass finished last night at 16:25 local and ruled the slice **level**: every component — the writing, the choices, the endings, the rewards, the interface — is shipped to the surface you will open, verified on the live site rather than merely merged.

**The one question for the sitting:** *is the integrated encounter experience at an acceptable state?*

Each link drops you straight into that encounter:

1. [The Unsafe Bridge](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.unsafe_bridge)
2. [Snow on the Pass](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.snow_on_the_pass)
3. [Riders Behind the Caravan](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.riders_behind_caravan)
4. [A Bargain at the Crossroads](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.bargain_at_crossroads)
5. [The Swindled Family](https://threadbearer.co/?view=game&seeded&size=medium&spawn=encounter.slice.swindled_family)

**Two rough edges you will actually meet, named up front so they do not surprise you.** Both were judged noticeable but not session-spoiling, and both are already ticketed:

- A few sentences stumble over a name twice: *"The keeper, The Keeper at the Crossing, takes two coppers."* Three of the five do this once each. ([THR-1466](https://linear.app/threadbare/issue/THR-1466))
- Where an ending grants two blessings of the same kind, the two reward tags read identically — and one word inside them is underlined as if you could click it, but nothing happens. ([THR-1467](https://linear.app/threadbare/issue/THR-1467))

A third ticket ([THR-1468](https://linear.app/threadbare/issue/THR-1468), two encounters having no written "you failed" ending) you cannot see while playing — only a reviewer forcing that outcome can — so it is listed for completeness, not as something to watch for.

If the answer is yes, *"the slice is validated"* becomes true for the first time, and the next chapter — the encounter interface reaching factions, war, economy and divine actions — can be charted. If the answer is no, what is missing gets charted instead.

The full verification record, with the measurement behind every claim above: [the verdict comment on THR-1220](https://linear.app/threadbare/issue/THR-1220).

## Also waiting (0)

Nothing else.

## Queue

**Healthy — 12 ready, 0 in dev, 1 on the design desk.** Nothing claimed, nothing parked, nothing stale.

- **The held-town design is no longer listed as an ask on you** ([THR-1448](https://linear.app/threadbare/issue/THR-1448)). It led the last two briefs asking you to say *"work the held-town design"* — on review, that was this lane mislabelling it. You already gave the direction on 10 September; the four questions the ticket leaves open are questions for the designer, not forks in what the game should mean. It sits staged on the design desk for a design lane to pick up. Nothing is wanted from you; say the word only if you want it moved up or dropped.
- The five slice-polish tickets sit below the sitting ([THR-1459](https://linear.app/threadbare/issue/THR-1459), [THR-1466](https://linear.app/threadbare/issue/THR-1466), [THR-1467](https://linear.app/threadbare/issue/THR-1467), [THR-1461](https://linear.app/threadbare/issue/THR-1461), [THR-1460](https://linear.app/threadbare/issue/THR-1460), [THR-1468](https://linear.app/threadbare/issue/THR-1468)) — all presentation, none re-writing an encounter.
- Longest-dwelling ready items ([THR-876](https://linear.app/threadbare/issue/THR-876), [THR-1026](https://linear.app/threadbare/issue/THR-1026), [THR-1198](https://linear.app/threadbare/issue/THR-1198)) sit behind higher-priority work, not stalled.

## Health

- **Green where it counts.** The site is serving the build the verification ran against (`7fb58715`), CI and all three scheduled jobs healthy, no PRs waiting to merge, the worktree reaper ran 25 minutes ago. The simulation is at 77 ms/tick — 14% *below* the 7-day median of 90 across 78 measurements, so nothing is slowing down.
- **Two probes are red and neither is yours.** Both are the same fact seen twice: this machine was off from yesterday afternoon until 08:01 this morning, so no scheduled lane wrote anything for 15.5 hours. Overnight quiet is normal by your own 8 August ruling. The second probe reads it as `tb-orchestrator` being stalled 15 hours behind — that is a false alarm from its own logic: it treats a lane that fired at 08:01 as proof the machine was up all night, when in fact every lane's last run clusters in that same one-minute wake-up burst. The orchestrator's slot is :26, which this morning has not reached yet. **It should fire at 08:26** — if it has not by the next brief, that becomes a real finding and you will see it here.
