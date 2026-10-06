# Action proposal — 2026-10-06-thr-1749-buy-your-spheres

## intent_quote

Christian, chat 2026-10-05, recorded on THR-1745 (ruling 3):

> you buy sphere points in the beginning of the game, and you score based on your affinity to all spheres summed up and factored by your sphere score.

Christian, 2026-09-25, the design-lane mandate (THR-1611):

> I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations

THR-1749 (filed from the ruling): "Plan doc owed before Ready for Dev (design lane)." Done when: a new run stores the bought vector on the ascendant node and the seeded showcase still boots with its preset; essence income per sphere follows the vector in the essence bar's income words; a god with no points in a sphere earns a trickle there (the floor is a named constant), never zero; the two highest weights are what every "primary / secondary" prose surface names.

## scope (what this plan does)

The plan adds a point-buy sub-step to the Remembrance Transformation beat: five points across the eight Creation spheres, at most three in one, one pole per opposed pair, pre-filled from the chosen hunger's preset. The vector is stored on the ascendant node as `spherePoints`. The existing `sphereAlignment` pair stays, now derived from the two largest buys, so ~95 existing readers keep working. The two private income-split copies are replaced by one shared split: a 4% floor per sphere, with the remainder proportional to the points. Three hungers whose pairs break canon (Foundation spheres at chargen, or an opposed pair) are re-paired within Creation. The plan also adds a debug accessor, rulebook sentences, and a Deferral for Foundation-signed cards.

## scope (what this plan does NOT do — explicit non-goals)

- No Dominion read, band, or pricing (THR-1748).
- No map or sheet display of Dominion (THR-1750).
- It does not seed or change the god's grown sphere score (`sphereAffinity.scores`).
- No Foundation-sphere buying, and no ruin-discovery grant for Foundation cards (Deferral).
- No change to thread-upkeep values or source upkeep (THR-1747).
- No change to hunger prose, courts, reach biases or mandates beyond the three sphere pairs.
- No re-spec mid-run: the vector is fixed for the run.
- No save migration: there is no save format; old states fall back at read time.

## impact_class

Reversible: an additive optional field, one shared pure function, one UI sub-step, three data edits.

## evidence cited

- **Linear issue:** THR-1749 (and the ruling comment on THR-1745)
- **Vision premises invoked:** identity as player choice; generated-within-constraints (CLAUDE.md Rejected Approaches)
- **UL terms touched:** Dominion (reads "bought sphere affinities"), Sphere, Foundation, Creation; no new UL term: `spherePoints` is a code field, and the buy screen names no resource noun (the player pours *themselves*). "Power" is avoided because UL Traits.md § Power already owns it
- **Canon pages consulted:** `Docs/canon/rulebook.md` §1, §5; `Docs/canon/rulebook-quick-reference.md`; `Docs/ubiquitous-language/Cosmology.md`; `Docs/design-system/laws.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`, `Docs/plans/2026-10-06-thr-1747-divine-economy-shared-prerequisites.md`
- **Rejected approaches considered and dismissed:** 10-point budget (numerals), pure proportional split (zero income), eight steppers (rule as error), radar control (new primitive), exempting off-canon hungers (contradicts rulebook §5), the `sphereAffinities` name (collision)

## load-bearing decisions touched

- **Reaches and Spheres are orthogonal:** respected. The buy touches spheres only; `domainAffinities` is untouched.
- **Relationships are edges, not properties:** `spherePoints` is the god's own attribute (like `sphereAlignment`), not a relationship. No edge is warranted.
- **No inventing node types:** none invented.
- **The world graph is mutated in place:** the field is written once at creation, so there is no change-detection concern.

## high-impact files touched (from Codesight)

- `src/types/influence.ts`: 135 importers by import-path grep. It gets one additive optional property, and the plan doc has a Blast Radius section.

## kill criteria

- If the next cold playtest round shows testers clicking straight through the buy without reading it, or unable to say which spheres they hold, the step is noise. Flip `REMEMBRANCE_SPHERE_BUY_ENABLED` to `false` (built with this ticket): the preset passes straight through, and the vector and split stay. The plan doc carries these criteria in its own `## Kill criteria` section.
- If THR-1748's Dominion read cannot tell 3/1/1 from 3/2 at band granularity, the budget is too coarse or too fine. Retune `SPHERE_POINT_BUDGET` / `SPHERE_POINT_CAP` (constants only).
- If generalist gods (2/1/1/1) cannot keep their threads under THR-1747's upkeep in a scripted run, raise the floor or charge upkeep across bought spheres. That needs a design follow-up, not a silent constant bump.
