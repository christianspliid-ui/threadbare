# Action Proposal — the ownership of people-things (THR-1438)

## intent_quote

> "Take the map as far toward its destination as possible … remaining bands (people-things, yield) authored/handed off or shipped" — Christian's brief to the autonomous driver, 2026-09-07 evening.

> "the plan docs for the open bands, with the three generated maps green" — the map's Destination, THR-1396.

> Christian's decisions on THR-1397 (2026-09-03), verbatim on the grid: *"Claim × company — taking command of a leaderless company — one op shared with claim × Army, `take_command`, writing `commanded_by`, gated on the group having no living commander"*; *"Seize × company — a mutiny: motive-gated against the commander … preconditioned on the group's cohesion being low"*; *"Claim × army — … plus the claimant must belong to the army's faction"*; *"Seize × army — a coup against a commander of one's own faction — the usurping fork one rank down, resolved by the faction through `force_succession`'s shape rather than by the blade"*; *"Claim × faction — a candidacy, not a coronation … the phase stays the one arbiter"*; *"Seize × faction — usurping … three outcomes from what exists … The deposed leader is not killed"*; *"Observe × army — scouting an army: writes `knows_of` familiarity"*.

## scope (what this plan does)

Authors the executor plan for the seven people-things cells the grid decided: one command writer shared by the dissolution sweep and the two claim cells; a per-verb ownership override and eligibility hook on the object type (the same shape as THR-1436's gate exemption); `nominateSuccessor` and `forceSuccession` beside an extracted `seatLeader` the succession phase itself calls; `observe × Army` through the shared observe semantic; two grudge causes with provenance; seven grid notes and lexicon lines; the codex cards and roster line that derive. Hands off to Ready for Dev with a coordination block.

## scope (what this plan does NOT do — explicit non-goals)

- No new node or edge type; no new trace category.
- No change to the succession phase's arbitration (it seats at a leader's exit, `priority` desc, as today); a candidacy waits.
- No death: the coup and the usurpation never remove or kill anyone; the plot (THR-1430) owns that.
- No table change to the division rule; the seven cells are reached by the existing rows.
- No yield or leverage cells (the next band); no change to `armySupply`, `battleResolution` or cohesion decay beyond one delta constant.
- No player control: these are mortals' works.

## impact_class

Reversible — every cell is a registry declaration behind the object type; `setCommander` reproduces `promoteNewLeader`'s edge; `seatLeader` is an extraction the phase keeps calling; the two grudge causes are additive.

## evidence cited

- **Linear issue:** THR-1438 (parent THR-1396; decisions THR-1397; band order THR-1399)
- **Vision premises invoked:** `Vision/00-north-star.md` (people who move each other), `Vision/02-non-negotiables.md` (graph; three pillars; mortal sovereignty)
- **UL terms touched:** Undertaking, Company, Army, Faction, Standing, Grudge; no new term (mutiny, coup, candidacy, usurpation are game words for existing operations; no `UL-proposal` needed unless the auditors flag one)
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/world-objects.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/rulebook.md`
- **Prior plan docs this builds on:** `2026-09-03-thr-1392-verb-object-undertakings.md`, `2026-09-07-thr-1430-dormant-kinds-rings-plot.md`, `2026-09-08-thr-1436-registry-reads-writers-edges.md`, `2026-05-14-THR-432-anoint-successor.md`
- **Rejected approaches considered and dismissed:** a new trace category for command changes; seating a candidate without an exit; gating the candidacy on "leaderless" (unreachable by construction); killing the deposed; a new candidacy node

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected: a candidacy is the `will_succeed` edge, a command is `commanded_by`.
- *Relationships are edges, not property fields* — respected; `via` and `conferredVia` are data internal to the edge.
- *Ascendants use the same prerequisite system as agents* — untouched.
- *No inventing node types without verification* — none invented.

## high-impact files touched (from Codesight)

None with ≥100 importers. `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts` and `src/engine/phaseFactionSuccession.ts` are moderate; `src/types/strategicAction.ts` is not edited (the hooks live on the registry's own interface).

## kill criteria

- Mutinies on companies the roster reads as *holding* → the hook reads the wrong node.
- A usurped seat the phase unseats at its next pass → `seatLeader` did not update the snapshot.
- `claim × Faction` offered on a monster-lair faction → the membership test reads `member_of` from the wrong end.
- Any node removed by a coup or usurpation → the plan is misread; only `markMortalDead` writes a death.
If any fires, the cell in question is refused at eligibility (fail closed) and the finding goes on the ticket before the flag on that cell is lifted.
