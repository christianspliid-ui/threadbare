# Action proposal — Doom's last stage is a stand (THR-2247)

## intent_quote

> "assess what can push the game forward then prepare enough for design and dev that our routines run again."
— Christian, chat, 2026-11-18. The attended session that night filed THR-2247 under this delegation as ticket 3 of 3 of the direction "make the ending a game".

The ticket's own ask (filed under that delegation):

> What does the god do in the final stretch, and what does the player do about a push on the clock?
> 1. The pushes. List every writer that moves Doom besides its own step, with how much each contributed on three seeds. For each kind, say where it lands (a place the player can open), what the player reads when it happens, and the card that answers it there. Reuse Rebuke, tending and Stay before adding a card.
> 2. The last stage. What changes for the god when the last stage begins: what it can still do, what it costs, and what the player reads on entering it. One candidate to weigh: the god's remaining purse has a last use, so essence left unspent at the end is a choice and not an oversight. Law 31 limits what may be done to Doom; the plan states how its answer stays inside it.
> 3. Enough to decide. A predicate for "the final stretch gives the god something to decide", measurable in a headless run, with its value on main today.

## scope (what this plan does)

Measures every Doom writer on three seeds (all non-step movement is failures via two complications, spread over ~50 places). Decides: the Doom's feedings are recorded per place; a failure on ground the god tends feeds nothing; Rebuke can be played on a place where the Doom fed; the last stage adds a notice line, a daily non-pausing alert, and a Doom-panel list of where it fed. Defines a predicate (last-stage decisions per day ≥ 0.5 × the rate before it) and reports it on main (0.10, 0.12, 0.26 — fails). Files two build tickets (engine+content, then UI).

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the Doom's own rate, Stay the Unmaking, the rate floor, the post-bond floor or the age's end.
- Does not add a new god card or a new node/edge type.
- Does not decide whether a run holds a second journey after the Return (reserved for Christian).
- Does not convert unspent essence into anything across runs.
- Does not build on today's two other lane decisions (THR-2245, THR-2246) beyond a file mutex.

## impact_class

Reversible — a plan doc plus two filed tickets; the build is additive optional state and a widened Rebuke target.

## evidence cited

- **Linear issue:** THR-2247
- **Vision premises invoked:** Laws 13, 15, 22, 27, 30, 31, 36, 37, 39 in `Docs/game-design/laws.md`
- **UL terms touched:** Rebuke (THR-2210 proposal defines it as a card and a way of tending a place), Doom, tending, last stage. No new term.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §8 The Clocks, `Docs/game-design/laws.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-13-thr-2202-give-both-clocks-a-verb.md`, `Docs/plans/2026-11-14-thr-2204-put-the-god-in-the-climax.md`, `Docs/plans/2026-11-13-thr-2205-measure-whether-the-player-matters.md`
- **Rejected approaches considered and dismissed:** a card per push; Stay slowing pushes (rejected 2026-11-16, not reopened); unspent essence carrying over; a faster last-stage Doom; a new last-stage card (kept as the next lever).

## load-bearing decisions touched

- Everything is a graph node/edge: the feeding record is flat `GameState` beside the existing `rebukedPlaces`, no relational table. No new node type.
- Agent position three-tier: the feeding resolves a sublocation to its parent place via `sublocationShape.ts`.
- The world graph is mutated in place: no change detection keyed on graph identity.

## high-impact files touched (from Codesight)

- `src/types/gameState.ts` — 922 importers (two optional fields). Plan has a Blast Radius section.

## kill criteria

- The played census arm absorbs or rebukes pushes and its age still ends within one day of today's played arm (t931, t846, t840) on all three seeds → the answer is too small; widen what a Rebuke tends, never speed the Doom.
- The predicate stays below 0.5 with the alert live → the last stage needs a new kind of move; back to the lane with numbers.
