# Action proposal — a road's encounters write to that road (THR-2046)

## intent_quote

There is no live ask: this is the unattended design lane working agreed design. The chain of agreement:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611)

The Mortal economy map (THR-1863) was charted with Christian, toward *"a basic 'kingdom' economy so factions have something to fight over"*. Its outcome research (THR-1872) listed, for the lane events: *"S clear `threatened` on this lane"*, *"S toll set for one faction"*, and defect 8: *"Lane-event seeds drop their lane … so trade ops guess the busiest/stalest lane."* The mortal wealth plan (THR-1936, merged and built) deferred them to THR-1954:

> "**Writes bound to one lane** — the three lane events; their seeds drop the lane (`routeEvents.ts:211-221`, research defect 8), so trade ops guess."

S3's builder added to that list (2026-10-24): *"Toll writes. Toll bridge's success ('a toll on the anchor lane') and the toll dispute need a toll stamped for a faction, not the actor"* and *"'Threatened' lanes. Pirate raid's sea lane threatened, the overdue caravan's and the escort's critical failures. S3 … never severs or marks a lane."* The coordination block on THR-1954 says each item is *"best split into its own ticket when picked up"*.

## scope (what this plan does)

Route-event seeds carry their lane onto the encounter they spawn, and lane writes in its outcome table use that lane. `economy_shift` gains `lane_threat` (mark or clear `threatened`) and `lane_toll` (set `controlledBy` to the town's faction, else the acting mortal). The three lane events get outcome rows; toll bridge, pirate raid, overdue caravan and caravan escort gain their toll or threat rows; the lane events' dead `village` gate becomes `hamlet`. The aftermath receipt gains a toll row; the existing threatened rows show threats. Debug accessor fields and trace fields.

## scope (what this plan does NOT do — explicit non-goals)

- No severing of a lane (the volume floor stays).
- No change to when lane events are seeded (the toll dispute stays dark on measured worlds).
- No change to embargo prose (defect 5) or the scarcity-arc rollback.
- No place-as-holding, bounty, salt or tribute-oath rows (they stay on THR-1954).
- No new map drawing (the red road and the trade lens exist).
- No change to toll rates (`taxRate`) or toll income formulas.

## impact_class

Reversible. `ENCOUNTER_LANE_WRITES_ENABLED = false` restores today's behaviour; all new fields are optional.

## evidence cited

- **Linear issue:** THR-2046 (split from THR-1954)
- **Vision premises invoked:** `Vision/02-non-negotiables.md` (prose not numbers; graph substrate), `Vision/01-core-loop.md` (consequences compound); Laws 22, 41, 42, 45, 56
- **UL terms touched:** Means (existing). "toll", "road", "threatened" are existing player words (trade lens, receipt). No new term.
- **Canon pages consulted:** `Docs/ubiquitous-language/README.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/rulebook.md` (money encounters), `Docs/game-design/laws.md` IV–VII, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/plans/2026-10-15-thr-1931-faction-purse.md`
- **Rejected approaches:** a support binding for the lane (bindings are node-typed); re-deriving the lane at resolution (today's guess); a new effect kind (Law 41); step graph ops (binary bands); toll to the banner only (dead write in banner-less towns); toll to the mortal always (contradicts the research row).

## load-bearing decisions touched

- **Everything is a graph node/edge.** The writes are properties on the existing `trades_with` edge (`threatened`, `threatenedSinceTick`, `controlledBy`), each of which already has writers. `laneEdgeId` on a seed/action is a reference held by transient action state, like `opposingGroupId`, not a relationship between world entities.
- **No inventing node types.** None.
- **The world graph is mutated in place.** Through `graph.updateEdge`, as `shiftLaneVolume` does.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` (129 importers): optional fields and union members.
- `src/types/unifiedAction.ts` (wide-blast): optional fields and union members. Blast Radius section present.

## kill criteria

If the census shows a town losing a whole prosperity tier to encounter-set threats that main does not show, halve the threat's life and re-measure. If it is still there, ship with `lane_threat` marks off.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The census is `scripts/lane-event-census.ts` on `proto/thr-2046-lane-census` (output file beside it), one seed per process. Every file:line in the plan was read on main @ 1d578d8f.
- I am least sure of decision 3's fallback, where the mortal holds the toll if no faction does. It leans toward the deferred place-as-holding question. It is kept so that a toll bridge success is never a dead write, and it carries a veto line.
- Revision history: run 1 Revise (missing Substrate inventory, Player-facing text and Playtest signal headings; trace fields in prose; PC-6 wording differed from the lens; an unnamed kill-criteria constant). Now: all sections present, trace fields as a `ts` block, the toll row reuses the lens's "tolled by {holder}", the before-lines are quoted, and `ENCOUNTER_THREAT_CLEAR_TICKS` is in the Constants table.
- I am also unsure whether `resolveLaneAnchor` re-anchoring on the lane's source end, when the actor moved, is the right receipt town.
