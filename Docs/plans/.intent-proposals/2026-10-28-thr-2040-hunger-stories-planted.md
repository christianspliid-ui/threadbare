# Action proposal — hunger's stories are planted (THR-2040 re-plan)

## intent_quote

There is no live ask: this is the unattended design lane working agreed design. The chain of agreement:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611)

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) (charted with Christian) ordered the outcome-table research [THR-1872](https://linear.app/threadbare/issue/THR-1872):

> "Famine does not make "granary riot" likelier … Produce a table with one row per money encounter: … the economic condition that should make it likelier (famine, glut, boom, bust, a held town, a lane through)"

[THR-1954](https://linear.app/threadbare/issue/THR-1954) listed the row:

> "**Famine and glut draws** — the *likelier when* column (nothing reads `stockTier` or `scarcityArc` in scoring)"

The ticket's goal, in its title, is *"a hungry town tells hunger's stories, a town with grain to spare tells plenty's"*. The first plan shipped nothing: its kill criterion tripped. The pickup's comment of 2026-10-26: *"The predicate fails … Measure pool presence before tuning weights."* This re-plan measured it, prototyped a stronger lean, found that flat too, and moved to the mechanism the game already uses for "this condition causes this story".

## scope (what this plan does)

When a settlement reaches its second hungry day, one living resident is handed a seeded famine scene that suits the town. When a glut run begins, one resident is handed a plenty scene. The cooldown is one per town per 10 days, and the riot takes precedence on the same day. The plan adds a new module `larderSeeds.ts`, a new config `larder-seed-config.ts` (17 positive-weight rows drawn from the first plan's table), one call in `unrestPressure.ts` `dailyPass`, a `larder.seed` trace, two seed labels, and a two-arm census. The first plan's scoring term and board pull are dropped.

## scope (what this plan does NOT do — explicit non-goals)

- No change to encounter scoring, the filter pipeline, the cap, the forecast window or the decision board.
- No change to the granary riot's seed (it keeps precedence).
- No new prose lines, templates, chips or tooltips beyond the two seed labels.
- No economic writes.
- No claim measured about the god's Bless the Harvest / Blight the Fields.
- No change to THR-2071 or THR-725.

## impact_class

Reversible: `LARDER_SEEDS_ENABLED = false` restores today exactly, and the module and config are new.

## evidence cited

- **Linear issue:** THR-2040 (the pickup kill record of 2026-10-26; the 2026-10-25 decision record)
- **Vision premises invoked:** `Vision/00-north-star.md` ("watch what the world does next"); `Vision/02-non-negotiables.md` (narrative over mechanics, additive)
- **UL terms touched:** none new
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md` § The World at Work; `Docs/game-design/laws.md` Laws 18, 20, 42, 45
- **Prior plan docs this builds on:** `Docs/plans/2026-10-25-thr-2040-famine-and-glut-draws.md` (engine pillar superseded); `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md` (the riot seed, the seam); `Docs/plans/2026-10-26-thr-2071-board-reads-the-place.md` (unaffected)
- **Rejected approaches considered and dismissed:** a louder score term; a multiplicative pull (prototyped, flat); a reserved shortlist slot; bypassing the window; doing nothing

## load-bearing decisions touched

- "Agent position is three-tier": respected. The resident pick reuses `pickTargetAgent`, which walks sublocations.
- "Everything is a graph node/edge": respected. Two settlement properties are written, of the kind the riot's cooldown already writes.
- "The world graph is mutated in place": the props are written in the unrest pass exactly as the riot's are (no change detection keyed on identity).

## high-impact files touched (from Codesight)

None with ≥100 importers.

## kill criteria

The census runs both arms (seeds off / on) over six seeds × 360 ticks. Seeds on must raise the share of hungry spells in which someone in the town plays a famine scene to at least 50 %, and at least 25 points above the off arm (prototype: 22 % → 66 %). Glut runs with a plenty scene must rise at least 15 points (prototype: 43 % → 74 %). Fed-town shares must move by no more than 1 point, and at least half of the seeds must be taken up by their target (prototype: 68 %). If the hungry-spell predicate fails, retry once with `FAMINE_SEED_DAY = 1`. If it fails again, ship nothing and return the ticket to Todo. If the fed-town guard fails, ship nothing.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- This is the second design for the ticket. The first failed its own census, and this run's prototype of a stronger lean also failed. Both are measured in the plan's § Why, and that is why the mechanism changed.
- The seeding prototype ran *outside* the tick, planting on day boundaries from the census loop. The real planter sits inside `dailyPass`. The predicates are relative to the off arm for that reason.
- The hungry-town sample is small: a few hundred firings over six seeds. The predicates are pooled and relative.
- A `templateId` seed skips the eligibility filter by design (a consequence must arrive). The planter therefore filters rows by the town's location subtypes and drops `requiresHold` rows at plant time.
- The famine/glut readings and their thresholds come from the 2026-10-25 lane decision, which is outside its veto window. The mechanism change is this run's decision, and the handoff carries its veto window as `Claimable from`.
