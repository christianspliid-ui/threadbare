# Action proposal — a well-played age can be won (THR-2245)

## intent_quote

> "assess what can push the game forward then prepare enough for design and dev that our routines run again."
> — Christian, chat, 2026-11-18 (quoted in the THR-2245 description; the attended session filed THR-2245 as
> ticket 1 of 3 in the direction "make the ending a game" under that delegation)

The ticket's own ask: "What does a run look like in which the player wins, and how often should that happen?"
with four parts: who the full player is; the fit (hands-off never finishes, the full player finishes on most
seeds before Doom's last stage, chapters-only ends "close" or "far"); what the god gives up (Law 30); what a
win is called and shown (Law 32). "Reuse before adding: the levers are existing constants … A new system
needs a reason the constants cannot meet."

## scope (what this plan does)

Defines the three census arms; records that the shipped agency census never credited chapter spend to the
Mandate (so its 0.06–0.15 reading was a harness gap); measures all three arms on main; picks one lever —
a god's place cast in a Mandate sphere credits the Mandate by its essence cost, through the existing deed
credit pipe and band factors — with the reason each existing constant cannot separate the arms; fits its
one constant by projection from measured runs; defines the win predicate with named thresholds; adds two
Twilight lines (where the Mandate was raised; how far it came on a Doom ending). Three implementation tickets.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change the Mandate targets (87 / 23), Doom's pace, Stay the Unmaking or the god's cast curve.
- Does not decide whether a run holds a second journey after the Return (reserved for Christian).
- Does not design the race on screen (THR-2246) or Doom's last stage (ticket 3 of the direction).
- Does not rank the player: no score, grade or "victory" word is added.
- Does not change sphere aggregation weights.

## impact_class

Reversible — one constant and one credit source behind the existing ledger; two text lines; census script.

## evidence cited

- **Linear issue:** THR-2245; prior decisions on THR-2202 (2026-11-13, 11-15, 11-16), THR-2208, THR-2236, THR-2243
- **Vision premises invoked:** two clocks, one purse (Law 30); a run is not about winning (Law 32)
- **UL terms touched:** Mandate, Doom, Stay the Unmaking, Twilight, essence — no new terms
- **Canon pages consulted:** `Docs/canon/rulebook.md` §8, `Docs/game-design/laws.md`, `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `2026-11-13-thr-2202-give-both-clocks-a-verb.md`, `2026-11-13-thr-2205-measure-whether-the-player-matters.md`
- **Rejected approaches considered and dismissed:** lowering the primary target (moves chapters-only equally); raising deed credit per essence (favours chapters-only); raising place aggregation weight (shared with world aggregation); a new Mandate card or rite (not needed)

## load-bearing decisions touched

"Everything is a graph node/edge" — respected (no new node or edge; credit is GameState ledger as today).
"The world graph is mutated in place" — not touched.

## high-impact files touched (from Codesight)

`unifiedActionResolution.ts` (72 importers) — below the 100 bar; no Blast Radius section. Engine path → the
executor's review-gate.

## kill criteria

In the plan: refit once if the shipped credit misses two seeds; if no value under 2× the fit works, the
lever is wrong and the lane decides again. If chapters-only starts finishing early, refit before quoting.
If warm testers win without knowing why, the Twilight words are wrong.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

The fit constant is a projection: measured snapshots (every 25 ticks) of the full arm's ledger plus K ×
0.75 (the band floor for god casts) × the essence it paid on places in each sphere. Before the projected
crossing the real arm behaved identically (its ledger was below target, so its casting policy did not
change), so the crossing tick is sound; counter-omens earned by an earlier Mandate could slow Doom, which
only makes the projection conservative. The plan is a decision under delegation; Christian can veto in chat.
