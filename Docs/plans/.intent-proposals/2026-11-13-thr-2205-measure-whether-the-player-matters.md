# Action proposal — Measure whether the player matters (THR-2205)

## intent_quote

> "Yes, file them" — Christian, chat, 2026-11-12, approving the five "make the middle a game" tickets after the attended assessment session.

The ticket he approved (THR-2205) states the ask:

> "What is the smallest honest measure of player agency that a headless run can produce? The plan chooses: 1. The two arms. A hands-off arm (no cards, every fork left to the mortal) and a played arm driven by a simple scripted policy (for example: always play the best affordable hand). Both on the same seed … 2. What is compared. … 3. What "different enough" means, as a predicate, and what it is expected to read today … 4. Where the number lives. It is a KPI beside the existing census measures, reported with the weekly review. It is not a merge gate."

> Done when: "A plan doc is merged … that defines the two arms, the compared outcomes and the predicate. The plan reports the measure's value on current `main` for at least three seeds. The plan covers Engine, Content and UI, or marks a pillar N/A with its reason … Implementation tickets are filed from the plan with their coordination blocks."

> "If the planner judges that it still falls under the freeze, say so in the plan and hold only the wiring, not the design."

## scope (what this plan does)

Defines a two-arm headless census on the seeded route (hands-off vs greedy hand-player, same seed, 300-tick warm-up, run to t900), five headline outcomes read at t800, a difference-not-rank predicate, and an on-demand `npm run census:agency` home. Reports today's value on seeds 42, 99 and 7 from a never-merged proto branch, plus a noise-floor repeat. Files one build ticket that promotes the script with a unit-tested pure verdict function.

## scope (what this plan does NOT do — explicit non-goals)

- Does not change any game rule, tick phase or player-facing text.
- Does not add a merge gate, CI job or weekly-review step. The weekly wiring is held by the pipeline freeze (THR-1946, made permanent 2026-11-13), as the ticket allowed.
- Does not rank runs (Law 32): the predicate tests different, never better.
- Does not measure divine casts (the Mandate census's `godloc` arm does).
- Does not fix whatever the baseline shows; the four sibling tickets do that.

## impact_class

Reversible — a docs PR now, and later one script plus one `package.json` line, neither on the game's runtime path.

## evidence cited

- **Linear issue:** THR-2205 (siblings THR-2201, 2202, 2203, 2204)
- **Vision premises invoked:** north star (a good run leaves a story the player can tell), non-negotiable §1 (forks belong to the mortal)
- **UL terms touched:** none new (Mandate, Doom, The First, Aspect, Apotheosis, hand, held step)
- **Canon pages consulted:** `Docs/game-design/laws.md` (Laws 1, 10, 11, 28, 32), `Docs/canon/session-protocol.md` § Process-work throttle (freeze), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-11-13-thr-2201-make-the-purse-bite.md` (the census route and greedy god)
- **Rejected approaches considered and dismissed:** counting chapter divergence (chaos saturates it); random-play third arm (deferred until a headline moves); cast-playing arm (mixes verbs); merge gate (freeze; design direction is not a fault)

## load-bearing decisions touched

- Engine caches are owned per session — the census creates its own `SimulationRuntime`. Respected.
- The world graph is mutated in place — the census never keys on graph identity. Respected.

## high-impact files touched (from Codesight)

None — no `src/` file is touched. The script imports engine modules read-only.

## kill criteria

If two hands-off runs on the same seed differ, determinism is broken on the seeded route: stop, file an NFP 3 bug, and publish no KPI. If the headline differs on every seed even between near-identical policies (once a random-play arm exists), the headline is too sensitive and the thresholds are re-fitted.
