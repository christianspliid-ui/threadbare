# Action proposal — famine and glut draws (THR-2040)

## intent_quote

There is no live ask: this is the unattended design lane working agreed design. The chain of agreement:

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map." — Christian, chat, 2026-09-25 (THR-1611)

The [Mortal economy map](https://linear.app/threadbare/issue/THR-1863) (charted with Christian; his test: *"does this give factions something worth fighting over?"*) ordered the outcome-table research [THR-1872](https://linear.app/threadbare/issue/THR-1872), whose ask reads:

> "Famine does not make "granary riot" likelier … Produce a table with one row per money encounter: … the economic condition that should make it likelier (famine, glut, boom, bust, a held town, a lane through)"

The mortal wealth plan (THR-1936, merged) deferred that column to [THR-1954](https://linear.app/threadbare/issue/THR-1954), whose coordination block says *"each item is a small design … best split into its own ticket when picked up"*, and whose list says:

> "**Famine and glut draws** — the *likelier when* column (nothing reads `stockTier` or `scarcityArc` in scoring)"

## scope (what this plan does)

Adds one pure reading of a settlement's larder (famine graded by hunger days; glut as a sustained high food surplus; stock-tier fallback), one additive encounter-scoring term built from it, two optional weights on the existing economic scene affinity rows, 18 rows of weights, a debug readout and a census script. It touches `economicContext.ts`, `economic-scene-affinity.ts`, `encounterScoring.ts`, `types/trace.ts`, `DecisionBreakdown.tsx`.

## scope (what this plan does NOT do — explicit non-goals)

- No economic **writes** (those were S2/S3 of mortal wealth and the debts plan).
- No change to the granary riot's draw (owned by hunger and unrest seeding).
- No new prose, chips, tooltips or player-facing surface.
- No change to the boom/bust prosperity term.
- No claim that the god's Bless the Harvest / Blight now draw these scenes (not measured).
- The other THR-1954 rows (place as holding, lane-bound writes, tribute oaths, quest pay, salt, tolls, threatened lanes).

## impact_class

Reversible — a scoring weight; setting `LARDER_SCORING_WEIGHT` to 0 restores today's behaviour exactly.

## evidence cited

- **Linear issue:** THR-2040 (split from THR-1954; research THR-1872)
- **Vision premises invoked:** rulebook quick reference § The World at Work; Game Design Laws 42, 43, 44
- **UL terms touched:** Unrest (hunger input), Surplus route (sense of "surplus"); no new term. The player word *glut* already appears in the rulebook quick reference.
- **Canon pages consulted:** `Docs/canon/rulebook-quick-reference.md`, `Docs/canon/encounters.md`, `Docs/canon/systems-inventory.md`, `Docs/canon/interface-map.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-15-thr-1936-mortal-wealth.md`, `Docs/plans/2026-10-16-thr-1934-hunger-and-unrest.md`, `Docs/plans/2026-07-23-economy-answers-the-god.md` (THR-725)
- **Rejected approaches considered and dismissed:** stock-tier famine as primary (two hunger tests disagree); scarcity-arc phase (capped, absent on most hungry towns); `foodSurplusDays ≥ 1` as glut (42–67 % of town-days); folding into the prosperity term (loses inspectability); hard eligibility gates (hide scenes).

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: reads node properties only; no new node or edge.
- "Engine caches are owned per session" — no cache added.
- "Agent position is three-tier" — the reading resolves a sublocation to its settlement by one `parentLocationId` hop, as `resolveGoverningProsperity` already does.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` — 133 importers (grep). Plan carries a Blast Radius section: two optional fields on one interface.

## kill criteria

- The census predicate fails at default weight (the famine rows' share of firings in hungry towns does not exceed their share overall): raise `LARDER_SCORING_WEIGHT` once; if still flat, the scoring term cannot move picks at this scale and the plan's premise is wrong — release and record.
- A heavy-test or tick-cost regression above the alarm line attributed to the term: revert to weight 0 and file.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Three calls are made by delegation and listed in the plan for veto: famine = existing hunger; glut threshold (3 days at balance ≥ 0.75); granary riot excluded.
- Census numbers are from `scripts/larder-census.ts` run on main @ e67e0517 in this session; the script is pushed to `proto/thr-2040-larder-census` (never merged) so the executor can land it.
- The plan's UI pillar is a debug readout only. The rationale: the player-facing change *is* which scenes fire, read in the scenes themselves.
