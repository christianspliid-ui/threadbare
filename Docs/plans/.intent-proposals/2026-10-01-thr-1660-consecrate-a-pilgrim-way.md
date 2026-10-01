# Action Proposal — Consecrate a pilgrim way (THR-1660)

## intent_quote

The ticket, filed as a deferral from THR-1632 (Linear THR-1660, created 2026-09-28):

> **Design question (undertaking lane):** a faith variant of `create × route` (a class switch on the route verb for a `spread_faith` holder targeting a holy place), or a new faith cell. Decide what happens to the legacy template and its three test files (`encounterCache.test.ts:538+`, `edgeIntegrity.test.ts:141-165`, `strategicBehaviorFamilies.test.ts:371-392`) in the same design.
>
> **Done when:** a plan doc in `Docs/plans/` is merged and handed off, or the design lane records why mid-game consecration is not wanted.

Christian's governing direction on faith (Discord 2026-09-26 16:25 UTC, quoted in the THR-1632 plan):

> "This should be tunable for different scenarios. To begin let's go with something that allows us to test and see balance and interaction"

Christian's ruling sanctioning this lane (chat, 2026-09-25):

> "I think we have reached a state of the game where you can probably iterate and progress designs without me in many situations, for example where we have agreed on a wayfinder map."

## scope (what this plan does)

The plan designs one new undertaking cell, `cell.create.pilgrim_way`. It is the only `create` verb of a new undertaking object type `pilgrim_way`, declared a class of Route on the MONSTER precedent. A mortal holding `ambition_spread_faith` can consecrate a town, city or capital whose own culture has a Temple congregation and which has no pilgrim way yet. On completion it writes, through the existing `createRelationEdge`, one `sacred_route` from that congregation to the town. The existing encounter-cache reader then pools `encounter.pilgrimage_trial` there.

The plan also:
- adds one profile entry and the cell's words (phrase, deed, prose, catalyst);
- adds a Star/Heart reach lean;
- adds Location-sheet and Faction-sheet lines that show every pilgrim way, seeded ones included;
- adds a debug accessor, a rulebook paragraph and interface-map rows.

## scope (what this plan does NOT do — explicit non-goals)

- It does not delete or change the legacy template `strategic_establish_sacred_route`, its pack entry, its three tests or its ratchet line. They are kept and recorded as absorbed (D4).
- No desecrate/destroy verb, and no decay of pilgrim ways (D5).
- No conversion: a zealot does not spread their *own* faith into a foreign town. The way always belongs to the site's own congregation.
- No new node type, no new edge type, no new trace type, no hex-map signifier.
- No tuning of the decision board, the 50–65% window or the verb tables to make faith holders act more. If they still don't act, the census reports it and THR-1689 owns the question.
- No divine (god-card) consecration.
- Shrines, temples and hamlets are not sites.

## impact_class

Reversible. It is an additive registry entry, one profile line, and two read-only UI lines. Removing the profile line disables it, and edges already written are inert apart from pooling one existing encounter.

## evidence cited

- **Linear issue:** THR-1660 (blocked-by THR-1632, Done).
- **Vision premises invoked:** a living world that changes under the player; mortals act while the god nudges (game-design-direction Vision notebook: core loop, non-negotiables).
- **UL terms touched:** Route (pilgrim way, already listed as a class, `Graph.md:65`), Congregation (`Agents.md:133-139`), Undertaking. No new term: "pilgrim way" is already a ratified Route class.
- **Canon pages consulted:** `Docs/canon/world-objects.md` (Route row, Monster-as-class), `Docs/canon/rulebook.md` (undertakings, A hunt), `Docs/canon/interface-map.md` (THR-1632 rows), `Docs/canon/systems-inventory.md` (Ambitions & Undertakings), `Docs/canon/design-governance.md`.
- **Prior plan docs this builds on:** `Docs/plans/2026-09-28-thr-1632-faith-and-politics-settings.md` (lane decision 5, § S1f).
- **Measured substrate:** `Docs/audits/2026-09-25-living-world-data/readers/consecration.ts` → `output/consecration-2026-10-01-thr1660.json`, seeds 42/99/7, 300 ticks. Findings:
  - 0 of 86 faith holders are congregation members;
  - the faith ambition drove 2 works in total;
  - every holder has 3–7 consecratable towns in reach.
- **Rejected approaches considered and dismissed:**
  - a branch inside `ROUTE.verbs.create`: the site rule belongs to the type, and it would leak into merchant profiles;
  - a new verb variant: verb tables are global;
  - reviving the legacy template under cells: it runs the dead model, and its shrine sites gain nothing;
  - membership-gated consecration: measured dead;
  - a hall-gated site: 1–6 candidates per world.

## load-bearing decisions touched

- **Everything is a graph node/edge:** respected. The way is the existing `sacred_route` edge. `projectId` on the edge is a join key to the project record, not a relationship needing traversal.
- **Relationships are edges, not property fields:** respected (as above). The congregation relation *is* the edge's source.
- **No inventing node types:** respected. There are no new node or edge types. `pilgrim_way` is an *undertaking object type* (a registry entry over an existing edge type), not a graph node type, and world-objects.ts already lists it as a Route class.
- **Agent position three-tier / hex-granular awareness:** not touched. The site walk is the existing candidate walk.

## high-impact files touched (from Codesight)

`src/types/strategicAction.ts`: 123 importers (counted by grep; `.codesight/` absent in the worktree). One union member is added. The plan has a Blast Radius section. `graph.ts` and `trace.ts` are not touched.

## kill criteria

- **Census (Done-when 5):** seeds 42/99/7, 300 ticks. If no seed finishes a single consecration, the cell still ships (it is test-proven), and the closeout records which board stage starved it, using the board's own refusal reasons. That feeds THR-1689 and is not tuned here.
- **If consecration floods** (the pilgrimage offered in most towns), the dials are `PILGRIM_WAY_SITE_SUBTYPES` and the profile entry.
- **Veto:** Christian can veto in chat within 24 h, before any build. The lane then reopens the ticket.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- **The biggest judgement call is D2:** the way belongs to the *site's* congregation, not the zealot's. This was forced by the measurement (no holder is a member). It is also the shape the seeded routes already have. The brainstorm records the open tension (should faiths compete or convert?) as out of scope and not foreclosed. I judged that it does not need Christian, because no conversion mechanic exists to fork over, and the narrower choice changes nothing about what faith *means*. It only lets the existing Temples gain destinations.
- **"Is it wanted":** I judged yes from Christian's interaction direction and the idle ambition. The ticket explicitly allows the lane to decide either way.
- **The reach-lean placement** (package override vs. a bounded synthesis-time table) is left to the executor with a stated preference. It is a *how*, under rule 4.
- **Uncertainty:** whether faith holders will actually pick the cell. The board rarely lets them act at all (2 works in 900 world-ticks). The plan does not promise uptake; it promises a correct, reachable cell plus a measured report.
