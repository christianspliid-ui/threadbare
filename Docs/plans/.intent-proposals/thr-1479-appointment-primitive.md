# Action proposal — Appointment primitive (THR-1479)

**Plan doc:** `Docs/plans/2026-09-21-thr-1479-appointment-primitive.md`
**Issue:** THR-1479

## intent_quote

> creating an encounter that requires the agent to be back at a certain place at a certain time (like this one, be back at the crossroads next full moon) requires an encounter type that makes the agent in the game go back to the same place. i dont think we have functionality for that in the game

> now lets look at how to ensure that the primitive is used by agents designing encounters and undertakings. without that connectivity it is a dead feature.

> the encounter that we gave feedback on that led to this feature, would have to have been built by an agent who knew of and would use the appointment feature as part of building the meet at the crossroads in a month part of the encounter. this is therefore another tool in the encounter builder agent's toolbelt.

(Christian, attended chat 2026-09-12. Rulings recorded on the ticket: a mortal must be able to miss an appointment, rare and personality-driven; only encounters mint appointments for now.)

## scope (what this plan does)

Adds an optional `appointment` block to the encounter seed (place, due tick, window, counterparty, missed branch), a favour edge as the promise, a slack-based lean/depart/wait/lost regime in the decision phase using the existing relocation channel and movement scorer, kept/missed conversion in seed evaluation, four traces, debug levers, the Crossroads bargain re-authored as the first user with its missed sequel, the PATH chip / thread badge / sheet row / broken-promise chip, and — as child slices — the authoring-harness hooks (guide, spec, systems-prompt, die face, quota key, live proof, census, reachability row) and the undertaking-grid payoff + milestone predicate.

## scope (what this plan does NOT do — explicit non-goals)

- The god does not make appointments between mortals (ruling 2; later).
- No new node type, edge type, or Agreement class; no second movement path; no `appointments` property on the mortal.
- No breach machinery on the attachment-layer agreement category.
- No `use × Agreement:appointment` cell (keeping is a journey, not a work) — the ticket's table row is amended.
- No prune of prose rule 7b — it stays law with one exception.
- No third die-B floor.

## impact_class

External (judge-corrected from Reversible, run 1): the skill-file edits change what the encounter-pipeline's systems auditor blocks and what every batch brief rolls, and the composition gate and interface-map generator are CI preconditions. The engine change itself is additive (optional fields, one new module, additive traces); the Crossroads content change is a revert-to-original-intent that THR-1476's rule permits once the block exists.

## evidence cited

- **Linear issue:** THR-1479 (+ THR-1476 Done, THR-1142, THR-1488, THR-1489, THR-1497, THR-1511)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/02-non-negotiables.md` #1, #3
- **UL terms touched:** Seed, Agreement (Traits.md#attachment — two layers named), Favour; new term **Appointment** (seated in the slice-1 PR, Encounters.md)
- **Canon pages consulted:** `Docs/canon/encounters.md`, `world-objects.md`, `content-objects.md`, `systems-inventory.md`, `design-governance.md`, `rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `2026-09-12-thr-1481-content-model.md`, `2026-09-09-thr-1287-control-upkeep.md` (pattern), THR-1142's relocation plan (via `relocationIntent.ts` header), vault `Brainstorms/2026-09-12-appointment-primitive.md`
- **Rejected approaches considered and dismissed:** see the brainstorm companion (A–G)

## load-bearing decisions touched

- *Everything is a graph node/edge* — respected: the promise is an `owes_favor` edge; the meeting is the existing seed record.
- *No inventing node types without verification / new node types require full design* — respected by declining a node type.
- *Relationships are edges, not property fields* — the promise between mortal and counterparty is an edge; the seed's `counterpartyId` is the seed's own scene binding (existing shape).
- *Agent position is the three-tier model; encounter awareness is hex-granular* — kept requires the hex.
- *The world graph is mutated in place* — the favour edge write calls `touchWorld` at the plant site as the aftermath dispatcher does.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` (476 importers) — two optional fields. `src/types/trace.ts` (~120) — additive members. Blast Radius section present. `gameState.ts` not edited.

## kill criteria

Keep rate ≥ 95% across temperaments (margin never negative in practice); undertakings halted by journeys above the halt baseline on the census seeds; zero authored appointments two batches after slice 2; a second appointment record on the mortal node. Each names the constant or rule that moves first.

## explicit user sign-off

Not required (Reversible). The two rulings and the connectivity requirement are quoted verbatim above from the ticket body.

## author notes for the judge

- The ticket's connectivity table names an Agreement class `appointment` and a `use ×` cell; the plan declines both with reasons (registry class discriminator is edge type; keeping is not a work). If the judge reads either as intent rather than the ticket author's sketch, that is a Revise I would take.
- The plan chooses the world-object favour edge over the attachment-layer agreement for the promise. The vault draft said "agreement gains an on-broken consequence" without naming which layer; two exist.
- The seed-is-the-record decision departs from the vault draft's two-record sketch; the reasons are in the plan and the companion.
- Three slices: the primitive with its first user and its surfaces lands whole (rule 5, no half-landed review); the harness and the grid follow as children blocked by slice 1.
