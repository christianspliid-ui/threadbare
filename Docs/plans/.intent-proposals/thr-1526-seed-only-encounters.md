# Action Proposal — Seed-only encounters (THR-1526)

## intent_quote

> take a look at the linear board and the wayfinder map and see how far we got last night, then lets finish off what wasn't done and progress the next designs

(Christian, chat, 2026-09-24 07:44 local.) The hourly briefing he reads had listed this design as waiting: *"Design session wanted for THR-1526. Follow-up scenes can fire on their own. It takes about half an hour and has no creative fork. To start it, say 'design THR-1526' in a chat."* The ticket itself (filed by the THR-1524 executor) states the scope: *"Decide the field: a template-level `reachableBy` … — or a tag-driven rule … Apply it to the shipped sequels that are untrue off the board … `check:encounter` warning for a seed target reachable from the board with no board-facing opening."*

## scope (what this plan does)

The plan adds one optional template field, `drawable` (absent means drawable), read by the encounter cache build and the Director's delivery-beat filter, so a flagged template is never offered by the draw but still starts when a seed, appointment, trigger or debug spawn names it. It then:
- flags the four shipped sequels whose openings assume their parent;
- widens the Swindled Family's setting envelope (one new rural opening), so those sequels stay reachable through their parent;
- adds the authoring rule to the Seeded Sequel row and the package format;
- adds two `check:encounter` warnings (a flagged template nothing plants; an `encounter.*` seed target that declares no `drawable`) and four fatal corpus tests.

## scope (what this plan does NOT do — explicit non-goals)

- It does not change seed resolution. Seeds never read the cache (verified path by path).
- It does not remove any template from `LOCATION_BRANCHING_ENCOUNTER_TEMPLATES`. That array is also the query catalog the missed branch reads.
- It does not widen the three other wayside-only templates (the Unsafe Bridge, Snow on the Pass, Riders Behind the Caravan). They are filed as THR-1567.
- It does not fix three story mismatches found along the way (the Healer's seed into the Grateful Kin, the Family's self-seed, `shrine_offering`'s empty seed). They are filed as THR-1565.
- It narrows the ticket's third bullet (a warning for "a seed target reachable from the board with no board-facing opening") to what a check can read. Whether an opening faces the board is prose semantics, so the plan instead makes every `encounter.*` seed target in a cache-fed array declare `drawable` (about ten today), and gates the two cases that can never be board-true. Seed targets outside `encounter.*` (the faction, social and tavern follow-ups, board-true by design) stay under the authoring rule.
- It does not touch the fight or hunt plans' spawn-only templates.

## impact_class

External (raised by the first judge pass from Reversible). The engine and content change is reversible: an optional field defaulting to today's behaviour, applied to four content entries plus one envelope widening, and removing the flag restores the old state exactly. What makes it External is the authoring surface: the plan edits two encounter-pipeline references other agents follow (`nudge-authoring-spec.md`, the Seeded Sequel row; `encounter-package-format.md`, the new field) and adds a fatal corpus gate every future content PR must pass.

**Affected systems:** the encounter cache build; the Director delivery beats; the encounter-pipeline skill's authoring spec and package format; `check:encounter`; the corpus tests in `encounterSeedLiveness.test.ts`; every future content PR that plants a sequel or writes an `encounter_template` query.

## evidence cited

- **Linear issue:** THR-1526 (from THR-1524's census: the Reckoning fired 1× and the Swindler Found 16× from the board on seed 42 in 200 ticks, while their parents fired 0×).
- **Vision premises invoked:** `Vision/00-north-star.md:31` ("The pleasure is witnessing, not steering") and `:43` ("a story the player can tell in prose"); `Vision/02-non-negotiables.md` (narrative over mechanical perfection).
- **UL terms touched:** Encounter Seed and Appointment (read); **Drawable** (new, seated in the implementation PR, Encounters shard).
- **Canon pages consulted:** `Docs/canon/encounters.md` (the appointment section, the content-query section), `Docs/canon/content-objects.md` (`tags` precedent, `:98`, `:128`), `Docs/canon/rulebook-quick-reference.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-21-thr-1479-appointment-primitive.md` (the two-sequel rule); `Docs/plans/2026-07-30-encounter-authoring-frameworks.md` (setting envelopes).
- **Rejected approaches considered and dismissed:**
  - empty `locationSubtypes` (fails envelope honesty; means "anywhere" to `eligibleAt`);
  - a content tag (query semantics on a presentation axis);
  - array membership (invisible, and it breaks the query catalog);
  - a two-valued `reachableBy` (nothing needs board-only).

## load-bearing decisions touched

- **"Everything is a graph node/edge"**: not touched. The flag is template data, like `locationSubtypes`.
- **"Encounter awareness is hex-granular"**: not touched. Awareness reads cache entries the flag never creates, and seeds bypass awareness as today.

## high-impact files touched (from Codesight)

`src/types/unifiedAction.ts`, 507 importers (`.codesight/graph.md:7`). The plan carries a Blast Radius section: one optional field on `UnifiedActionTemplate`, no existing member changes shape, and the typecheck ratchet must show zero net-new errors.

## kill criteria

- If the census shows a flagged sequel firing from the board after the change, the predicate missed a cache append. That is a bug in the slice, not a design flaw.
- If the Swindled Family still fires zero times on both seeds, its sequels are reachable only through the Healer. File a Deferral to widen the Family further. Do not unflag the sequels.
- If a future content author flags a template that nothing plants, the `check:encounter` warning names it.

## explicit user sign-off

Not required. The External class asks for a strong judge pass with the affected systems named, not a user sign-off. The change follows an agreed outcome (THR-1479's two-sequel rule, whose promise this makes true).

## author notes for the judge

- The research agent traced every seed path and every cache reader before this was drafted. The crux ("seeds never read the cache") is what makes a single build-time predicate sufficient.
- The Family widening is the one creative choice, rural over urban: a family on the road with a handcart fits a farm track, and a market square would be a different scene. It follows the THR-1524 precedent.
- The ticket sketched `reachableBy`. I chose a boolean named for the property the board reads, which the codebase already names (`drawableWhileBroken`).

## revision notes (second judge pass)

The first pass returned Revise. Every required finding is applied in the plan:
- **Blast Radius** section added (`unifiedAction.ts`, 507 importers).
- **Coordination** corrected: FB7, M2, E1 and H2 (THR-1543, THR-1545, THR-1556, THR-1560) also edit `unifiedAction.ts` and share four docs, so they are mutex (keep both sides on conflict), not parallel-safe.
- **Kill criteria** carried into the plan.
- **Foreign-query pin** added as a fatal corpus test, over every `encounter_template` query site (seed `query`, `appointment.missed.query`, strategic-pack `catalystQuery`, undertaking-cell meeting/missed).
- **Census instrument** named: new `scripts/firing-census.ts`, harvesting each tick's new actions and attributing each by `spawnedFromSeedId`.
- **Rural opening** authored in the plan, not left to the executor.
- **Corpus audit table** added, grouped by target.
- **Wayside siblings** filed (THR-1567).
- **The `encounterPackage.ts` allowlist** claim was wrong (the package template is typed, not key-checked); replaced by a pass-through test.
- **Impact class** raised to External, with the affected systems named above.

## revision notes (third judge pass)

The second pass returned Revise with three GAPs, all applied:
- **Wiki pages** the blocking gate owes are in the Done-when: `encounters-manual-reference` and `divine-actions-reference`.
- **The forgotten-flag shape now has a guard.** A second `check:encounter` warning makes every `encounter.*` seed target in a cache-fed array declare `drawable` (about ten today). There is a fail-soft row for it, and the "about 90 templates" figure is corrected. The residual outside `encounter.*` is stated.
- **Coordination:** M2 adds `requiresLiveMonster?` to `UnifiedActionTemplate` itself, and `Docs/canon/content-objects.md` joins the shared-docs mutex.
- **Test path and envelope:** `src/data/encounters/__tests__/vertical-slice.test.ts`; `settings` and `locationSubtypes` widen together.
- **Citations corrected:**
  - the tag-axis sentence is now cited to `Encounters.md:337` and `content-tags.ts:35`;
  - `UNDERTAKING_CELL_APPOINTMENTS` is at `:231`;
  - "Locations" replaces "places";
  - the four seed query sites plus the missed query are named;
  - the openings compile is at `settingClasses.ts:141-170`.
- **Kept as is:** the Vision citation `00-north-star.md:43`. `grep -n` on the vault file confirms the line.
- **Optional items adopted:** the deprecated array-scored path gets `isDrawable`, and the census records the spawn route.
