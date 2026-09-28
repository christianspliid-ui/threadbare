# Action proposal — THR-1631 A world with a past

## intent_quote

> "a is fine" — Christian in chat, 2026-09-25, choosing option A ("explain the map") on [A world with a past](https://linear.app/threadbare/issue/THR-1591), as recorded in that ticket's decision comment.

> Option A as offered to him (the lane's prototype comment, same ticket): "A thin past, derived from what is already placed … Every settlement gets a founding date. One elder war comes from the battlefield ruins … 2–3 wars in living memory between neighbouring realms. Each leaves one of the plain ruins as a burned town and one fallen commander. 5–10 dead notables (founders, fallen commanders, the first to find a wonder), kept as `deceased` actors where they rest. Descent from a dead empire for some of the mortals who live on its land. … The player meets it in three places: a 'Before you woke' first chapter in the chronicle; one line on every settlement sheet; one line on every ruin sheet."

> The lane's standing authority: "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, 2026-09-25 (THR-1611).

## scope (what this plan does)

Designs a worldgen history pass (`seedWorldPast`) that writes, after ruins are seeded: founding ages on every settlement, named founders for capitals, one elder war event from the battlefield ruins, 2–3 living-memory war events between neighbouring Realms each with a burned town and a fallen commander, up to 4 wonder finders, descent on a share of mortals on dead-empire land (the first writer of `backstoryStrata`), and explicit ambition mints (`seek_revenge`, `chase_the_wonder`) on protagonists only. A pure selector reads it back for a pinned "Before you woke" chronicle section and one line on settlement, ruin and dead-person pages, with specifics gated on fog. Three slices plus one deferral.

## scope (what this plan does NOT do — explicit non-goals)

- No rival god in the past (decided sub-call).
- No rumour content kind (map disposition).
- No ruin encounter templates (THR-1598's job; hooks named only).
- No deep simulated history (option C).
- No `reclaim_homeland` mint at t0 (deferral filed).
- No Great Chronicle volume UI.
- No fix to the culture-name biome-id leak (THR-1622).
- No new node or edge type; no edit to `gameState.ts`.

## impact_class

Reversible. Additive worldgen pass behind `WORLDGEN_PAST_ENABLED`, own PRNG stream running after every other draw; UI additions in S2.

## evidence cited

- **Linear issue:** THR-1631 (carve-up of map THR-1589; decision THR-1591; budget THR-1592; hooks for THR-1598)
- **Vision premises invoked:** north star (mortals known by name), fog of war, game prose not novel prose
- **UL terms touched:** none new; uses Kin (added by THR-1630), Realm, Location, Place, Mortal, Event
- **Canon pages consulted:** `Docs/canon/world-objects.md`, `Docs/canon/cosmology.md`, `Docs/canon/rulebook-quick-reference.md`, `Docs/design-system/laws.md`, `Docs/canon/systems-inventory.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-09-27-thr-1630-notables-and-ties.md`; audit `Docs/audits/2026-09-25-living-world-and-content-coverage.md`
- **Rejected approaches considered and dismissed:** GameState field; Great Chronicle volume; numeral ages; adverb ladders; founders for every settlement; minting on ambient mortals (see brainstorm companion)

## load-bearing decisions touched

- Everything is a graph node/edge — respected (events, actors, existing edges).
- No inventing node types — respected (none).
- Relationships are edges, not property fields — respected (founder via `constructed_by`, burned town via `occurred_at`; `winnerId`/`loserId` on the event are data about the event, and both Realms also hold `participated_in` edges).
- The world graph is mutated in place — the reader memoises on `worldVersion`.
- Agent position three-tier model — the dead are `located_at` places, like run-time dead.

## high-impact files touched (from Codesight)

None edited: `graph.ts`, `gameState.ts`, `types/graph.ts` untouched. If `eventType` is a closed union in a ≥100-importer file, two members are added (stated in Blast Radius).

## kill criteria

Steady-state tick cost > +4% or worldgen > +50 ms on seeds 42/99 → find the reader; a seeded dead actor treated as living in the 200-tick census → fix the reader; clue scoring moves the delve rate by more than a quarter → lower the descent share. (Plan § Kill criteria.)

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Six lane decisions are listed at the top of the plan, each marked where used. The riskiest against intent are (2) words instead of the example's numerals — forced by Law 13 — and (5) not minting `reclaim_homeland`, which the prototype named as fed by descent: the fact is written, the mint is deferred because its rule needs a living culprit.
- The decision said the chapter could live in the Great Chronicle "or its own field"; the plan chooses neither literally — graph plus selector — which honours the constraint's purpose (never `chronicleEntries`, which empties).
- Every code claim in the re-measure table was read on `7178b4b6` by a research subagent with file:line; the CLI numbers are from one seed-42 run.
