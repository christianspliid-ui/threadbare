# Action proposal — 2026-10-13-thr-1793-every-town-has-a-people

## intent_quote

From the Linear issue THR-1793 (filed by Christian's account, 2026-10-08, from the THR-1768 closeout):

> 216 of 509 seed-42 mortals have no culture edge, so their sphere bag is empty — 203 settlement NPCs never get a belongs_to

> **Question for the design lane:** should worldgen give every settlement NPC its home settlement's culture edge (the place's current `belongs_to`), the way fringe links do for settlements? That is a culture-writer fix, not a sphere fix; the sphere seed would follow on the next sweep with no change to THR-1768's code.

Standing direction this rests on (THR-1632 faith-and-politics brainstorm, considered alternatives): *"Leave the frontier cultureless — No — half of all mortals have no culture, and the culture content line (THR-1635) never reaches half the towns."* And the delegation: Christian, 2026-09-25 — *"I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations."*

## scope (what this plan does)

Answers the ticket's question with a measurement (NPCs already copy their town's culture; the cultureless NPCs all live in towns with no culture) and fixes the real gap: the default fringe reach `DEFAULT_WORLD_SCENARIO.cultureFringeMaxHexes` moves from 4 to the existing ceiling `CULTURE_FRINGE_MAX_HEXES_MAX` (24), so every settlement-type place present at worldgen takes its nearest heartland culture as a fringe. No code path changes; the fringe pass, its subtype list, strength, flag and the never-territory invariant are untouched. Tick cost measured paired (+5.6 % steady).

## scope (what this plan does NOT do — explicit non-goals)

- Does not change NPC minting, birth inheritance, or protagonist culture assignment (`assignCulturesToActors`, 10 % designed cultureless roll).
- Does not add a new culture tier, label, UL term, culture node, or any UI.
- Does not give lairs, ruins, waypoints or wonders a culture.
- Does not fix places founded during play or mining sites (filed as THR-1839).
- Does not change THR-1768's sphere seeding.

## impact_class

Reversible — one default value; the "today" scenario and the reach knob remain.

## evidence cited

- **Linear issue:** THR-1793
- **Vision premises invoked:** narrative over mechanical perfection (NFP 5)
- **UL terms touched:** Fringe (Docs/ubiquitous-language/Agents.md:177) — used as defined, no change
- **Canon pages consulted:** Docs/ubiquitous-language/README.md, Docs/canon/rulebook-quick-reference.md, Docs/canon/systems-inventory.md (Culture), Docs/canon/interface-map.md (culture-custom-reaches-encounter-opening)
- **Prior plan docs this builds on:** Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md (+ brainstorm), Docs/plans/2026-10-06-thr-1768-sphere-score-seeding.md
- **Rejected approaches considered and dismissed:** see brainstorm companion — NPC-level copy (already happens), frontier tier, minting local cultures, sphere fallback, protagonist change

## load-bearing decisions touched

- "Everything is a graph node/edge" — respected: more `belongs_to` edges of an existing shape.
- "Relationships between entities are graph edges" — respected.

## high-impact files touched (from Codesight)

None. `src/data/world-scenario.ts` (default value only).

## kill criteria

Steady tick cost > +10 % vs same-session baseline on seed 42 or 99 (three pairs) → reach 8, re-measure. A fringe link reaching promotion/Realm holding → revert.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

All census numbers were measured this run with the headless CLI `eval` on seeds 42 and 99 medium (tick 0 and 240), with the reach overridden through a throwaway env read that was reverted. Tick cost via `npm run measure:tick-cost` seed 99 medium 200 ticks, three alternating pairs: 210.6 → 222.4 ms steady. Reach 24 and 64 produced identical census on medium. The one leftover settlement ("Sacred Grove" shrine at 16,12 on both seeds) is *likely* the god's starting shrine minted after the pass — I did not trace its writer and the plan says "likely". The ticket's question had a false premise; the plan reframes it, and I consider that within intent because the ticket itself called it "a culture-writer fix".
