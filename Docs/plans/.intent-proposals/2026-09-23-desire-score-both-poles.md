# Action Proposal — a scene draws both poles of the value it is about (THR-1525)

## intent_quote

The design session put the ticket's fork to Christian in chat (2026-09-23). The session recommended option A: draw both sides, and add an optional way to name one side for the rare scene meant only for it. It checked the library before the switch. It asked:

> **Should scenes draw mortals who lean strongly *either* way on their value (A)?**

Christian's verbatim answer:

> yes, go with A

Before that, his ask for the session was:

> 1. analyse compare recommend

This referred to item 1 of the session's list, THR-1525.

## scope (what this plan does)

The desire score changes. Each named motivation now reads the absolute value of the mortal's profile, so both poles are drawn. There is one exception: a template may pin an axis to one pole through a new optional `motivationPoles` map, and a pinned axis reads signed in that direction. A named constant (`DESIRE_SCORE_POLE_MODE`) holds the reading, so the old behaviour stays reachable for the census and for rollback. The same change flows through encounter scoring, the divine-overlay delta, the encounter cache entry and the undertaking decision board. The content work has four parts:
- a pre-flip census of authored intent, which adds pins only where written evidence exists
- a fork audit
- an amendment to spec step 6
- a `check:encounter` warning for a template that pins its own fork axis

The documentation work covers the UL entry, one rulebook sentence, two wiki pages and the wiring guide. Tests that pinned the signed reading are rewritten, and a mirrored-mortal liveness test is added. A before/after selection census on seeds 42 and 99 is the Done-when evidence.

## scope (what this plan does NOT do — explicit non-goals)

- It does not rewrite `ENCOUNTER_TYPE_MOTIVATIONS` or any literal `motivations` set. The flip is the fix.
- It does not add pins from titles or themes. It adds them only from written evidence of one-pole intent.
- It does not revert the Crossroads' THR-1524 content choice. It updates the comment rationale only.
- It does not change the THR-1349 empty-set neutral branch.
- It does not change `PERSONALITY_SELECTION_WEIGHT`, `PERSONALITY_SCORE_EXPONENT` or `MINIMUM_DESIRE`. No retuning is included. If play reads wrong afterward, tuning is a follow-up.
- It adds no player-facing UI, no new trace type and no new node or edge.
- It does not touch how forks resolve (`decidedBy`). It changes only who is drawn to arrive at them.
- THR-1526 (sequel-only templates reachable from the live board) is a sibling defect and is out of scope.

## impact_class

Reversible. Behaviour changes world-wide on the first tick, but one constant (`'signed'`) restores the prior reading exactly, and every type change is additive and optional.

## evidence cited

- **Linear issue:** THR-1525. It was found by THR-1524, and the ruling comment is recorded on THR-1525 (2026-09-23).
- **Vision premises invoked:** the living-world premise (stories for every kind of mortal), via the `game-design-direction` framing. No Vision text changes.
- **UL terms touched:** `AxiologicalProfile` and `ValuePair` (Agents shard; read, unchanged). A new `Motivations` entry is agent-seated under the 2026-09-11 blanket for UL seating.
- **Canon pages consulted:** `Docs/canon/rulebook.md` §7, `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/systems-inventory.md` (`encounter`, `decision` rows), `Docs/canon/interface-map.md` (no desire contract).
- **Prior plan docs / tickets this builds on:** THR-1524 (the measurement), THR-1349 and THR-1377 (undertaking silence-is-neutral), THR-531 (personality selection weight), THR-641 (divine overlay delta).
- **Rejected approaches considered and dismissed:** the spec-only reading, absolute with no pin, pole markers inside `ValuePair` strings, separate selection and fork axis fields, and asymmetric pole weights. The reasons are in the brainstorm companion.

## load-bearing decisions touched

- **Relationships are graph edges, not property fields.** Respected. `motivationPoles` is template-internal data and not a relationship between entities.
- **Reaches and Spheres are orthogonal.** Not touched. Value pairs are reach-bound by the existing `REACH_VALUE_PAIR`, and that is unchanged.
- No load-bearing decision changes.

## high-impact files touched (from Codesight)

- `src/types/unifiedAction.ts` has ~475 importers. It gains one additive optional field.
- `src/types/strategicAction.ts` has ~114 importers. It gains one additive optional field.
- The plan doc carries a Blast Radius section.

## kill criteria

- If the selection census under `'absolute'` shows idle rate at least doubling, or total picks per tick collapsing, on either seed, stop and surface it before merge. Do not ship a flip that empties the board.
- If the pole-balance line under `'absolute'` does not come within ±10 points of the population share, the reading is not doing what was ruled. Diagnose it (for example a caller not passing through, or a cached entry missing the field) before merge.
- If the mix reads wrong after merge in play, the mitigation is to set `DESIRE_SCORE_POLE_MODE = 'signed'` (one constant) while a retune is designed.

## explicit user sign-off

N/A. The class is Reversible. The director ruling is quoted above: "yes, go with A" (Christian, chat, 2026-09-23).

## author notes for the judge

- The ticket said option 1 "needs a census of the corpus's `motivations` intent before flipping". The plan puts that census first in the executor's branch, and it gates which pins are authored. The design session did a direction-level sample (the type table, eight hand-authored flaw-flavoured scenes and ~35 undertakings), and all of them name an axis rather than a pole. That sample is why Christian was comfortable ruling now. The full census remains the executor's first commit.
- The ±10-point pass bar and the "idle doubling" stop are agent-set calibrations, which is the agent's domain per the 2026-08-12 rule. They are not director asks.
- I am least certain about the census tooling. `content-model-census.ts` may or may not be the right host, so the plan leaves extend-vs-new to the executor.
