# Action proposal — the power runtime (THR-1571)

## intent_quote

Christian's ruling on THR-1230 (settled live in chat, 2026-08-25), carried as the map's destination:

> "some spells should also change what an agent capable of casting it can do on the world map."

> "different types of magic cost different things. a, b, and c are all valid prices, and 'free' for some basic spells."

The Powers & Spellcraft map's closing carve-up (THR-1226, 2026-09-24), which names this ticket:

> "Design: the power runtime, spells carried and cast (THR-1571). This one delivers the destination: a spellcaster carries spells and casts them in threaded encounters, visibly."

> "Design them in parallel; build the runtime first, because a generated spell needs a runtime to be seen."

THR-1571's own description: "a spellcaster carries spells and casts them in threaded encounters, visibly, with prose, cost and consequence, reviewable through `?forceencounters`." It lists four decisions this plan must make (the first cast surface, innate powers at `createNamedElite`, the upkeep budget, faction powers out) and five preconditions (spell prerequisites, the `reach_drain` payment, a gamble on success, `dispel` deleting nodes, four dead movement primitives).

Christian's delegation for the lane (THR-1611, 2026-09-25): "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

## scope (what this plan does)

It designs the spell runtime in three slices:
- **S1 (this ticket):** one cast resolver; `use × Power` repaired to apply effects and backlash; the five preconditions fixed; the caster predicate's hyphen bug fixed; `'spell_cast'` raised; carried (fate-woven) effects on the shared spell node, stateless only; seeded knowing (every caster starts with one tradition spell); two fate-woven spells ported from the prototype; eight strain conditions.
- **S2 (filed):** the step cast. The mortal casts when their pre-card odds are below a courage-keyed threshold; a named odds line; the step's band decides the cast; chips and afterimage lines; `?spell=`.
- **S3 (filed):** innate powers as a third Power class, one per monster family, stamped at `createNamedElite`.

## scope (what this plan does NOT do — explicit non-goals)

- No spell generator (that is THR-1572, the sibling plan doc, mutex).
- No new DecisionFamily for casting; world-map casts use the existing `use × Power` cell.
- No `transfer` / `compel` executors; no fix for `update_property` mutations being dropped.
- No per-bearer effect runtime state (hence the stateless-carried rule).
- No divine-gift or found-tome spell acquisition (filed as a deferral).
- No faction-held powers (ruled out by the map).
- No richer cast surfaces (inspector, codex); no monster casting.
- No review ask to Christian: Powers is not level until the generator fills the shelf.

## impact_class

Reversible. The changes are engine and data changes behind a single ticket per slice. The one behavioural change on a live path is `use × Power`, which is reachable through one ambition profile. Seeding adds ~100 spell holders per medium world; the kill criteria name the one-constant rollback.

## evidence cited

- **Linear issue:** THR-1571; the map THR-1226 and its decisions THR-1228, THR-1229, THR-1230, THR-1231, THR-1232, THR-1233/1238, THR-1237, THR-1530, THR-1268; THR-1562 (shipped); THR-1429 (shipped the Power shape and `learn_spell`)
- **Vision premises invoked:** you shift probabilities, you do not direct-control; failure is plot; prose not numbers; every primitive is clickable (via `Docs/canon/rulebook-quick-reference.md`)
- **UL terms touched:** Power, Spell, Innate Power (gains its code anchor), new Strained
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/ubiquitous-language/Traits.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-07-thr-1429-dormant-kinds-powers-conditions.md`, `Docs/plans/2026-09-23-fight-block.md`, `Docs/plans/2026-09-23-monsters-as-opponents.md`, `Docs/plans/2026-09-24-thr-1562-reach-on-one-scale.md`, `Docs/audits/2026-09-24-twenty-generated-spells.md`
- **Rejected approaches considered and dismissed:** a second die for casts ("No alternative dice"); the god playing a cast card (direct control); a `'cast'` DecisionFamily (THR-1229's recommendation, predating the `use × Power` cell); permanent reach loss for strain ("failure never costs reach" spirit); per-bearer spell nodes (THR-1395).

## load-bearing decisions touched

- **Everything is a graph node/edge.** Respected: no new node or edge type; spells, strain and innate powers are `trait` nodes on `has_trait`/`knows_spell` edges.
- **Relationships are edges, not properties.** `UnifiedAction.stepCasts` is an in-flight record on the action, not a relationship.
- **Agent position is a three-tier model with one `located_at` edge.** Respected: teleport rewrites the single edge, as `rebindLocatedAt` does.
- **Ascendants use the same prerequisite system as agents.** Unchanged: `checkPrerequisites` untouched.
- **No inventing node types.** Respected.
- **Reaches and Spheres orthogonal.** Respected: `castReach` is a Reach, `sphereAffinity` a Sphere.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts` and `src/types/effects.ts` (hundreds of importers; additive optional fields only). `src/types/traits.ts` gains one union member in S3. The plan has a Blast Radius section.

## kill criteria

In the plan: over-magicked world → seed only notable+ casters; tick cost over 5% → the reserve tier gate; casters cast on nearly every step → lower the threshold; a veto of any lane decision → one constant or function.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- The substrate was measured this run by a subagent and one CLI census (seed 42 medium): 0 spell holders at tick 30, 104 casters (103 by role, 1 by Veil, 0 by mastery trait because of the hyphen), 1 in the deciding tier. The plan's § Substrate inventory quotes the lines.
- Two findings changed the design during drafting: (1) `effectStates` is keyed by attachment id, and the spell definition node is shared, so carried effects must be stateless; I dropped the prototype's Last Coin for that reason. (2) `update_property` mutations are dropped by the production applier, so `compel` is dead twice over; it stays out of scope.
- The biggest judgement call is lane decision 2 (a threshold rule over pre-card odds, keyed to courage). I weighed it against "always cast when able" and "god casts". The threshold reads no nudge, so the forecast can show the cast before the god plays cards, and the forecast and roll agree.
- The ticket says "reviewable through `?forceencounters`". I added `?spell=` plus `?spawn=`/`?outcome=` links, because `?forceencounters` alone never gives the hero a spell; the review is for information only.
- I am uncertain whether seeding ~100 casters is too many. It follows ruling 4 ("caster npcRole at seeding") and channel 2 ("the world is magical from tick 0") literally, and the kill criteria name the rollback.
