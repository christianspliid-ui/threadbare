# Action proposal — An away lean waits for the reach (THR-2189)

## intent_quote

The ticket (filed by the design lane from THR-2188's census, 2026-11-07; staged for the design lane by the orchestrator, T2, 18:29Z):

> What should an away lean promise, and is it worth its price? Options, roughly: compute the away word from how often a passed-over leader is retaken (a measured base rate); offer *away* only when the mortal is likely to repeat (e.g. a running work or a journey goal); or let *away* cost less and say plainly that it keeps a road off their next choice. This may touch what the god's lean is *for*. If so, reserve it for Christian.

> Done when: A plan doc in `Docs/plans/` is handed off to Ready for Dev, with the same census run before and after, showing each away forecast word followed at a rate its word honestly describes.

The system's originating ask, Christian, chat 2026-10-14:

> "a generic god action that allows the player to see the top 3 things that a threaded agent is considering doing (encounters and undertakings). and then allowing the player to nudge the choice in a certain direction."

And his ruling: "yes please replace. the old experience suck" (replace God's Will with the lean).

## scope (what this plan does)

It makes the away lean resolve only at the decision where the mortal's unleaned first choice is the leaned road (the day it can matter), within the existing 72-tick hold. Before that it waits, with the existing THR-2188 waiting trace. The away offer gets one conditional forecast line ("If Kael reaches for it again, your hand will likely turn them from it.") instead of three snapshot words, because the three words measured no signal. Away is no longer offered on a work (an undertaking), where it turned the choice once in 27. Four content lines change, one refusal reason is added, one rulebook sentence changes. One revert flag. Census before and after is in the plan.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change toward leans: their words, wait and cap reserve (THR-2188) stay as built.
- It does not change the away lean's price, multiplier (×0.5), or the hold limit.
- It does not add refunds.
- It does not retire the away lean or change what it is for (a weight against the road the mortal favours).
- It does not add a UI surface; it changes words on the existing Crossroads row and toast, and removes the away button from work rows.
- It does not resolve the UL entries for Crossroads / Lean / Road (THR-2190).

## impact_class

Reversible — one flag (`CROSSROADS_AWAY_WAITS_FOR_REACH = false`) restores today's away resolution and forecast; the offer gate is one predicate.

## evidence cited

- **Linear issue:** THR-2189
- **Vision premises invoked:** non-negotiable #1 (influence, not command), design tension #4 (legibility vs mystery), via `Docs/game-design/laws.md` Laws 9, 17, 18, 25 (UI), 36, 45
- **UL terms touched:** none new; "Crossroads", "Lean", "Road" pending THR-2190
- **Canon pages consulted:** `Docs/canon/rulebook.md` §4 (crossroads paragraph), `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1926-the-crossroads.md`, `Docs/plans/2026-11-07-thr-2188-a-lean-waits-for-its-road.md`
- **Rejected approaches considered and dismissed:** base-rate word with today's resolution (still pays for "as you leaned" when the lean did nothing); offer away only on repeating roads (works measured worst); cheaper away (still pays for nothing two in three); retire away (meaning fork); three snapshot words under the wait (no signal). All in the brainstorm companion.

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: `crossroadsLean` stays a node property; no new node or edge.
- Engine caches owned per session — respected: no cache.

## high-impact files touched (from Codesight)

- `src/engine/phaseAgentDecision.ts` — the decision hot path; one boolean OR'd into the existing `leanWaits`. Blast Radius section present.
- No `src/types/trace.ts` change (no new trace).

## kill criteria

- Build census: away followed below 60% of leans that met their road → change the word to "may".
- Away fades above 40% of away leans → re-measure the hold, consider pricing away below toward; never a refund.
- Warm round 4 shows no away leans placed → revert with the flag.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The ticket says "if it touches what the lean is for, reserve it". My reading: the away lean's purpose (push the mortal off the road they favour) is unchanged; only when it is read changes, which mirrors THR-2188's toward wait that is already built. Please check that reading.
- The Law 18 tension is real: the new away word is a measured rate, not the snapshot arithmetic. I argue the arithmetic was on a board that never decides the lean. Recorded in the plan's Vision audit with the flag as the revert. If you think this is an [E] law break that needs Christian's yes/no, say Escalate.
- The census numbers are from a prototype using `process.env` in `src/` on a never-merged branch; the build ports only the census script.
- The "no away on a work" gate rests on small samples (27 today, 7 under the wait). The direction is consistent; it is in the kill criteria implicitly via the census line "no away lean placed on a work".
