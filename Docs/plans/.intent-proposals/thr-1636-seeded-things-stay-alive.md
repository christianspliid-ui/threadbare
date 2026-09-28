# Action proposal — THR-1636 seeded things that stay alive

## intent_quote

> "I agree with your analysis. log it as a design map, and make sure you dont forget the details of this analysis"
> (Christian, 2026-09-25, agreeing the living-world audit and chartering the map [A world that starts alive](https://linear.app/threadbare/issue/THR-1589), whose destination is "a world that starts alive … all of it seeded at worldgen as named constants inside the tick budget")

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."
> (Christian, 2026-09-25, authorising the design lane that authors this plan)

The ticket itself (filed at the map's close, carve-up plan 7 of 7): "every seeded or founded trade lane dies at exactly t36 because no ambient traffic refreshes it; the design call is **lane upkeep**. Separately, **the clue climb**: 0 `located` clues through t300 … Re-measure with `readers/dying.ts` on current `main` before designing."

## scope (what this plan does)

Two engine changes and one small content set, in three slices. S1: inside the existing trade-route decay phase, a lane whose two towns still stand, and that is not blockaded or cursed, is marked traded every tick, and its volume settles toward a traffic level set by the pair's complementarity. A blockade suspends a lane; a razed end or cursed roads let the existing decay kill it. The hex tooltip gains two state words. S2: clue recipient scoring weights deciding mortals; a held lead adds its ruin to its holder's survey candidates; a survey of a site you hold a lead on sharpens the lead instead of refusing; delve admission scans from located-lead holders instead of every actor × every location. S3: a survey that leaves a `narrowed` lead on a ruin arranges an appointment at that ruin (the hunt's shape). The visit is a new seed-only encounter whose band sets the lead to `located`, keeps it `narrowed`, or lets it go cold; a missed visit has its own short template. Lead decay pauses while a visit is pending.

## scope (what this plan does NOT do — explicit non-goals)

- No caravans as agents, no new node or edge type, no new tick phase.
- No change to `INSTANT_COMPLETION_BAND` or `OBSERVE_CLUE_PRECISION_BY_BAND`. No `requiresLocation` switch (THR-1294 owns it).
- No new lanes founded by the world. Founding stays mortal work (`create × route`), the god's verbs, and worldgen.
- No `sacred_route` or culture-coverage decision (routed to the faith-and-politics plan THR-1632).
- No board encounters for elder ruins beyond the two seed-only templates. Ruin content is THR-1634's program.
- No lead hand-off from ambient holders to deciders (the next lever if S2 falls short).
- No prose for lane traffic, and no at-cost prose for the route-event encounters (THR-1634 ranks those).

## impact_class

Reversible. Each slice sits behind a kill switch or an additive field (`LANE_TRAFFIC_ENABLED`, optional `siteClasses`, optional `pendingVisitDueTick`). The admission rewrite is pinned to the old scan's behaviour by a test before the old loop is removed.

## evidence cited

- **Linear issue:** THR-1636 (carve-up 7/7 of THR-1589); inputs THR-1595 and THR-1592.
- **Vision premises invoked:** systemic over scripted; the god acts at one remove; consequences are state (UI Law 56).
- **UL terms touched:** Route (trade_lane class), clue/lead, delve, appointment. No new UL term. "Lead" is already the rulebook's player word for a clue (§10).
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Route row), `Docs/canon/systems-inventory.md` (Economy, Ruins), `Docs/canon/interface-map.md`, `Docs/canon/rulebook.md` §10, `Docs/canon/design-governance.md`, `Docs/design-system/laws.md` (IV, V, XI, XIV).
- **Prior plan docs this builds on:** THR-1320 (founder's grace), THR-1428 (survey leads), THR-1450 (instant band), THR-1519/THR-1560 (appointments, the hunt), THR-1526 (seed-only), THR-1639 (journeys keep their goal), and the sibling carve-up plans THR-1630/1631/1632/1633.
- **Rejected approaches considered and dismissed:** exempt worldgen lanes from decay (THR-1320's reasons); cargo as the life rule (measured empty); a seeded owner as the life rule; a survey that rolls or writes `located`; turning on `requiresLocation`.

## load-bearing decisions touched

- *Everything is a graph node/edge.* Respected: lane state lives on the `trades_with` edge and lead state on `knows_clue_of`.
- *Relationships are edges, not property fields.* Respected: `pendingVisitDueTick` is edge-internal state, not a relationship.
- *Agent position is the three-tier model.* Respected: lane ends resolve through `resolveToParentLocation`; admission compares hexes as today.
- *Encounter awareness is hex-granular.* Respected: the visit is judged at the ruin's Location, and admission is same-hex.
- *Engine caches owned per session.* No new cache.

## high-impact files touched (from Codesight)

`src/types/trace.ts` (131 importers), `src/types/strategicAction.ts` (124), `src/data/strategic-action-constants.ts` (109). All edits are additive; the plan has a Blast Radius section.

## kill criteria

- S1: if the A/B census shows lanes standing at t300 beyond seeded + founded, or a prosperity runaway on lane-dense capitals, lower `LANE_TRAFFIC_MAX_VOLUME`; if that fails, set `LANE_TRAFFIC_ENABLED=false` and reopen the design.
- S2: if the decider share of leads stays under 30% after tuning `CLUE_BIAS_DECIDER`, or the budget line breaks, stop S3 and re-plan (hand-off).
- S3: if no seed produces a `located` lead and a delve in 300 ticks after tuning the visit pull, report the starving rung and re-plan rather than widen the dice.

## explicit user sign-off

Not required (Reversible). Decisions are made by the design lane under delegation (process.md rule 4) and are listed in the plan for veto.

## author notes for the judge

- The surprising finding is the instant band: THR-1450's correct fix for instant cells made the `located` row unreachable. The plan deliberately does not reopen THR-1450. The dice move to a real encounter at the ruin instead.
- "Blockade suspends" is the plan's most arguable call. It follows the blockade verb's own promise and THR-1320's counter-play design, and the veto alternative is one line (noted in the brainstorm).
- The lane's life rule was chosen by measurement: cargo is empty on most seeded lanes at t12.
- Lane traffic is an abstraction, not simulated caravans, following route events' NFP #7 rule.
