# Action proposal — 2026-10-26-thr-2031-take-up-a-lying-relic

## intent_quote

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, 2026-09-25 (the design lane's mandate, THR-1611)

> Claim × Item: "Picking up an unowned item: the possesses edge, one line. Op needed: `claim_item`. The payoff of the treasure hunt — observe a ruin → clue → treasure map → delve → this — and the reason a found relic on the ground is reachable at all." — the Undertaking Grid verdict, THR-1397, Christian in chat, 2026-09-03 (`scripts/undertaking-grid-dispositions.ts:450`)

> "Done when: A plan doc or a lane spec names the take-up path. A mortal at the relic's place can end it holding the relic (`possesses`, no `lies_at`). After that the relic's Dominion read goes through its bearer." — THR-2031 (filed by the design lane as a consequence of shipped THR-1813/THR-1843 design; process.md rule 4)

> The world remembers plan, Decided 7: a Relic "reads Foreign until a mortal takes it up". The Remembrance card: "It lies unclaimed in this world until someone takes it up."

## scope (what this plan does)

Builds the grid's wanted **Claim × Item** cell: a `claim_item` op on the Item object type that removes an artifact's `lies_at` edge and writes `possesses` to the claimant, an eligibility hook that refuses items lying nowhere, a proximity branch so an artifact target sorts by where it lies (or who bears it), `'claimed'` in `ItemAcquiredVia`, the cell's words, and two ambitions (Uncover Secrets, Chase the Wonder) walking the cell. The grid entry goes live. The live proof gains an `--account sample` flag.

## scope (what this plan does NOT do — explicit non-goals)

- Does not rebind or rewrite *The Unclaimed Relic* encounter, and does not change `spawn_artifact` (its `contains` place branch is noted, not changed).
- Does not add a presence or movement rule: the cell is remote like every undertaking.
- Does not give the god a way to direct the take-up.
- Does not handle legendary artifacts (`artifact_legendary`), a dead bearer's items, or inheritance.
- Does not build the `lies_at` edge itself (THR-2030, the blocker).
- No new UI component.

## impact_class

Reversible.

## evidence cited

- **Linear issue:** THR-2031 (blocked by THR-2030)
- **Vision premises invoked:** `Vision/01-core-loop.md`, `Vision/02-non-negotiables.md` (#4, the relationship is the edge)
- **UL terms touched:** Echo / Relic (Cosmology.md), Item (Encounters.md content-object kinds), Undertaking. No new terms.
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/world-objects.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/canon/rulebook.md` (The world remembers), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1813-the-world-remembers.md` (Decided 7), `Docs/plans/2026-09-03-thr-1392-verb-object-undertakings.md`; THR-2030's lane decision + spec (comments, 2026-10-25)
- **Rejected approaches considered and dismissed:** rebinding The Unclaimed Relic encounter (prose describes one specific cold-iron object; no wild setting; cap starvation); a draw/seed toward the relic (a second door to the grid's act, needs a full encounter-pipeline scene)

## load-bearing decisions touched

- **Everything is a graph node/edge** — respected: the take-up swaps `lies_at` for `possesses`; `takenFrom` is a provenance property on the edge, the same pattern as `via` on `seize_item`'s edge.
- **No inventing node types** — none invented; no new edge type either (`lies_at` is THR-2030's).
- **Relationships are edges, not property fields** — respected.
- **Agent position three-tier** — untouched; artifacts never take `located_at`.
- **World graph mutated in place** — the op runs inside the undertaking resolver, which already touches the world on completion.

## high-impact files touched (from Codesight)

None ≥100 importers: `src/data/undertaking-objects.ts`, `src/engine/strategicActionCandidates.ts`, `src/engine/spellGrant.ts`, `src/data/ambition-templates.ts`, `src/data/undertaking-verb-prose.ts`, `scripts/undertaking-grid-dispositions.ts`, `scripts/undertaking-live-proof.ts`.

## kill criteria

The relic is taken up in under a day on most seeds (so it never reads as lying anywhere): remove the cell from Chase the Wonder and re-measure; still under a day → ship with the cell off both ambitions and file the pacing question.

## explicit user sign-off

N/A (Reversible).

## author notes for the judge

- The Done-when says "a mortal **at** the relic's place". The plan reads that as "a mortal can end holding it", worked as an undertaking from wherever they stand, because every cell in the grid is remote (founding, claiming, hunting). The plan makes this decision 2, vetoable, and the prose carries the journey. If you think this misreads the ticket, say so.
- Measured on main @ 45feeb2f: no `claim_item`; the Item type declares create / control:seize / destroy only; `UNDERTAKING_MODEL = 'cells'`; seed 42 day 20 has 20 Uncover Secrets and 13 Chase the Wonder holders, with 2 seize × Item and 2 create × Item completions.
- The ticket is blocked by THR-2030 (not built yet). The handoff will move it to Todo with the blocker relation, not Ready for Dev.
