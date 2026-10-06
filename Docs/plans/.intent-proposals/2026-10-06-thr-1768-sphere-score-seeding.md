# Action proposal — 2026-10-06-thr-1768-sphere-score-seeding

## intent_quote

Christian, 2026-10-05, chat (recorded on THR-1745, the ruling the Dominion map executes):

> you buy sphere points in the beginning of the game, and you score based on your affinity to all spheres summed up and factored by your sphere score.

Christian, 2026-09-25, chat (the design lane's mandate, THR-1611):

> I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map.

THR-1768 (filed 2026-10-06 by the Dominion map's research step, project Dominion — Player Power Progression), verbatim excerpt:

> The Dominion formula reads the god's sphere power, the object's sphere scores and the faction's aggregate. None of the three exists today, so the formula ticket (THR-1760) cannot be prototyped until this lands. Plan doc owed before Ready for Dev (design lane); it is a seeding and bookkeeping fix, not a design.

> Fix: derive a mortal's seed from something the world already knows (their culture's first sphere, their calling, or their home location's dominant sphere — the design lane picks one and names it) and apply it on every mint path.

## scope (what this plan does)

Seeds a sphere bag on the god (from its existing alignment pair), on every individual and culture (from the culture's venerated spheres), and on every location node including those minted after worldgen (terrain + location table + a declared-sphere bonus for lairs and ruins), through pure helpers plus one backfill sweep run at init and at the head of the existing sphere-pressure phase. Adds a derived per-faction aggregate (mean of members) in the existing aggregation phase, read by battle aftermath. Fixes two bookkeeping defects: sphere-pressure traces are emitted (with every writer's source), and erosion removes whole points only. Adds a debug census accessor.

## scope (what this plan does NOT do — explicit non-goals)

- Does not define the Dominion formula, bands, normalisation or the god's power factor (THR-1760).
- Does not seed the god from the full point-buy vector (THR-1749 / THR-1765); reads `sphereAlignment` only.
- Does not store sphere scores on hex tiles (they are not graph nodes).
- Does not show sphere scores to the player; no UI component changes.
- Does not change any pressure writer's magnitude, cadence or target, except battle aftermath no longer inventing `chaos` for an all-zero faction.
- Does not re-key reach gates or signatures to spheres (THR-870, parked).

## impact_class

Reversible — internal state seeding and two phase edits; no save-format break (new optional property), no player-facing change.

## evidence cited

- **Linear issue:** THR-1768 (map THR-1758; research THR-1759; blocks THR-1760)
- **Vision premises invoked:** numbers never reach the player; Reaches and Spheres orthogonal; measure before tuning
- **UL terms touched:** Dominion, Sphere, Sphere Alignment (`Docs/ubiquitous-language/Cosmology.md`) — no new term
- **Canon pages consulted:** `Docs/canon/cosmology.md`, `Docs/canon/systems-inventory.md` (Spheres & Quintessence 🟠 DORMANT), `Docs/canon/interface-map.md` (THR-1635 place-sphere contract)
- **Prior plan docs this builds on:** `Docs/plans/2026-10-05-thr-1745-player-power-progression-models.md`, `Docs/plans/2026-10-06-thr-1749-buy-your-spheres.md` (only for the fact that `sphereAlignment` stays derived), `Docs/plans/2026-03-28-world-soul-connection-design.md` (original seeding design), audit `Docs/audits/2026-10-06-thr-1759-dominion-writers-and-read-research.md`
- **Rejected approaches considered and dismissed:** calling-based mortal seeds (fuses Reaches and Spheres); per-mint-site seeding as the primary route (misses future mint paths); overwriting the faction bag with the aggregate (erases birth seed and pressure)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: new data is a node property; members/cultures via existing edges.
- Reaches and Spheres are orthogonal — respected and cited as D1's reason.
- No inventing node types — none invented.
- Relationships are edges, not property fields — `sphereAggregate` is a derived numeric summary, not a relationship.
- Agent position three-tier / sublocation is `type: 'location'` with `parentLocationId` — the place seeder uses the parent for sublocations without terrain.
- World graph mutated in place; never key change detection on identity — writes go through `updateNode` + `touchWorld`.

## high-impact files touched (from Codesight)

- `src/types/trace.ts` (~120 importers) — additive union members; Blast Radius section present.

## kill criteria

- The re-run THR-1759 read shows culture-seeded mortals or declared-sphere lairs dominate every band (e.g. >80 % of individuals in one sphere on seed 42) — then lower `ARCHETYPE_SPHERE_BONUS_*` for mortals via a separate constant, or drop D4.
- Tick cost rises more than 2 ms over the 115 ms baseline — move the backfill to a cadence or to `touchStructure` changes.
- The THR-1635 place-sphere encounter-opening tests fail because newly seeded ruins pick unwanted openings — exclude `elder_ruin` from that consumer, not from seeding.

## explicit user sign-off

Not required (Reversible). Decisions made under the 2026-09-11 delegation; veto invited through the design-lane report.

## author notes for the judge

- This is the design lane, unattended. D1 is the one choice the ticket explicitly delegated; D2–D6 are mechanism choices. All six carry a veto invitation in the lane report.
- I deliberately avoided depending on THR-1749 (its veto window runs to 2026-10-07T06:45Z): the god seeds from `sphereAlignment`, which exists today and which THR-1749 keeps as a derived field.
- The ticket said "one helper every location-minting path calls"; I chose a sweep instead and explain why (D2). If the judge reads that as a scope deviation, the plan allows seeding at mint as well.
- UI pillar is N/A for the player by design (Law 13); only a debug accessor is added.
