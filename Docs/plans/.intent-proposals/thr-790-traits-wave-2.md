# Action proposal — Traits wave 2 (THR-790)

**Plan doc:** `Docs/plans/2026-09-21-thr-790-traits-wave-2.md`
**Issue:** THR-790 (child of the THR-789 program epic)

## intent_quote

From THR-789's settled verdicts (Christian, chat, 2026-07-26):

> the game-wide reactivity is what i want to support … a system you can use for all game objects (agents, attachments, locations, actions, etc.) that allow these systems to react in particular ways if they connect with another object with a certain trait.

> I like your canon rule, and i would expand that traits on objects should always be visible in the interface.

On unblocking this ticket (attended chat, 2026-09-11, answering the briefing's question *may Traits wave 2 give up the design desk?*):

> you are approved to unblock everything here.

The ticket's own scope: *(1) Location traits go live — minting rules threshold-minted from existing scalars … + consumers; (2) Artifact traits — one additive edge-schema extension; (3) Draw-by-trait — generalize `rewardPool.tagFilters` onto the unified trait vocabulary.*

## scope (what this plan does)

Slice 1 (this ticket): a `phaseLocationTraits` that mints four location traits (`#welcoming`, `#lawless`, `#veil-thin`, `#haunted`) from prosperity, unrest, saturation and deaths with the settlement-promotion hysteresis shape; a pool term in `scoreAndSelect` reading them; effect-table rows so the three existing readers work; the `condition_template` bearer-kind carve that stops the 45 untagged recipes dealing location conditions to mortals; the location page's effect line; trace, debug, UL, rulebook. Slices 2 (draw-by-trait completion) and 3 (artifact traits) are children with their scope stated in the plan.

## scope (what this plan does NOT do — explicit non-goals)

- No `#blood-soaked` — no battle-history substrate exists; a deferral is filed with slice 3.
- No new trait subcategory, node type, or edge type in slice 1.
- No merchant-routing, prose or Broken-state consumer in slice 1 — filed as **slice 4**, a child ticket blocked by slice 1 (the plan's Done-when names it), so the deferral is a ticket and not a sentence.
- No registration of trait catalogs as content catalogs in slice 1 (slice 2).
- No widening of the LEAKED `trait-ref-authoring-vocabulary` contract.

## impact_class

Reversible. One new phase behind named constants, additive definitions and rows, no new field or subcategory, one carve with an opt-in path.

## evidence cited

- **Linear issue:** THR-790 (+ THR-789, THR-786 Done, THR-788, THR-800, THR-1143 / 1175 / 1483, THR-1481)
- **Vision premises invoked:** `Vision/00-north-star.md`, `Vision/02-non-negotiables.md` #3
- **UL terms touched:** Trait, Trait Category (condition), Trait Ref; new sub-entry **Location trait** seated in `Traits.md` under delegated seating
- **Canon pages consulted:** `systems-inventory.md`, `design-governance.md`, `rulebook-quick-reference.md`, `encounters.md`, `content-objects.md`, `world-objects.md`, `interface-map.md`
- **Prior plan docs this builds on:** `2026-07-26-traits-trigger-architecture.md` (§ Waves, the kill criterion), `2026-09-12-thr-1481-content-model.md`
- **Rejected approaches considered and dismissed:** brainstorm companion (eight)

## load-bearing decisions touched

- *Everything is a graph node/edge* — traits stay `has_trait` edges to definition nodes.
- *No inventing node types* — none; no new subcategory either.
- *The world graph is mutated in place* — `assignTrait` / `removeTrait` and the phase's counter writes go through the existing paths; the encounter cache is not invalidated by a trait (the pool term reads live edges per candidate).

## high-impact files touched (from Codesight)

`src/types/trace.ts` (125) — additive. `src/types/traits.ts` (337), `graph.ts` (913), `unifiedAction.ts` (494), `gameState.ts` (599) not edited — the place discriminator is the existing `LOCATION_CONDITION_ID_PREFIX`, not a new field. Blast Radius present.

## kill criteria

No family-share difference at marked vs unmarked locations; mint/release flicker; a mortal dealt a location condition after the carve; a new id in the dead-ref ratchet. Each names what moves first.

## explicit user sign-off

Not required (Reversible). The program verdict and the unblock ruling are quoted verbatim.

## author notes for the judge

- The ticket lists three items; the plan makes item 1 this ticket and files items 2–3 as children, because item 3 is mostly subsumed by THR-1481 and item 2 is a schema line plus a producer that should not wait on the phase.
- The ticket's `#blood-soaked` is declined with the reason (no substrate). If the judge reads the trait as intent rather than the ticket author's example, the plan would take a Revise — but the honest substrate does not exist and the plan says so rather than faking it.
- The bearer-kind carve is not in the ticket. It is in the plan because adding location traits without it worsens a measured live defect; it is stated as scope, not smuggled. Run 1 found the plan proposing a `bearerKind` field beside the substrate's existing prefix predicate (`LOCATION_CONDITION_ID_PREFIX`); the revision drops the field and reads the prefix — one source of truth, zero edits to `traits.ts`.
