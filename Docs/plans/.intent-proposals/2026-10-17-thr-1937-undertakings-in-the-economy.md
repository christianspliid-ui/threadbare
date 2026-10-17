# Action proposal — Undertakings in the economy (THR-1937)

## intent_quote

> "the purpose of the economical model is to provide substrate for the world, and drive a lot of the fundamental interaction and behavior of the in game living agents (factions, cities, agents)." — Christian, chat 2026-10-14 (the Mortal economy map's destination, THR-1863)

> "so important that the economic system simulates the cities and factions and locations to have a basic 'kingdom' economy so factions have something to fight over. this is more important than to make the agent model even deeper than it already is on individual agent richness." — Christian, chat 2026-10-14 (priority ruling; recorded on THR-1865 and THR-1863)

> "Keep all three calls as decided. The plan docs can go ahead." — Christian on THR-1863, 2026-10-15 08:29Z, releasing the carve-up (THR-1931..THR-1937) in the map's order.

The ticket (THR-1937, filed by the design lane when it closed the map): "Author one plan doc in `Docs/plans/` through `design-session` and hand it to Ready for Dev. The decisions are settled input; cite each decision ticket inline where it is used." Order: after mortal wealth (THR-1936); reads the settlement economy (THR-1923) and the faction purse (THR-1931). Draws on THR-1873 (decided by the design lane under delegation 2026-10-14T17:32Z; veto day closed 2026-10-15T17:33Z, no veto). The map's close comment: "Order at execution: … mortal wealth, then undertakings, last (Christian's ruling: kingdom before individual richness)."

## scope (what this plan does)

Specifies THR-1873's cell table and ambition rewrite as three build slices. S1: a founded town gets a ruler (`controls`, the founder's highest derived-rank town-holding faction, ties to a realm, else the founder) and the founder a freehold (`grantHolding`); the cell founds on a free hex (`findUnclaimedSite`), fixing a measured defect where it stacks the new hamlet on an existing settlement's hex; a founded lane gets `controlledBy` = founder and a `constructed_by` edge from its identity node to the founder and fires the existing `trade_route_established` chronicle line; a founded guild gets its founder's two leading Reaches as its reach profile, a guild type from the leading Reach (so the shipped purse's guild work pays it), and an opening purse equal to what the founder paid (0 while founding costs are off; one cost-table row added). S2: a mortal-raised building is the town's own top candidate from the settlement economy's chooser, raised at once if a slot is free, held by the builder; legacy pack types map onto the building table. S3: a trade run pays Means (2 + 1 per unit carried, cap 6, at most once per trader per day); new ambition predicates (Means tier, lanes held, home has a place; `agent_controls_location` widened to lists and founded-by-self) and the four milestone rewrites; a faction's `resource_acquisition` is met while it holds a regional monopoly and gives way to `defensive_consolidation`. UI: founder line and ruler line on the place page, "built by <mortal>" on the building card, existing lane hover and Holdings list, milestone prose, debug accessors.

## scope (what this plan does NOT do — explicit non-goals)

- No smuggling cell (the map's later efforts).
- No change to the faction purse, the crown, holding income or the settlement economy's own phase (it reads them; the chooser is called, never copied).
- No new node or edge types; no new player words (no UL-proposal).
- Does not define regional monopolies (war aims S2 owns the record and the ambition target) or Means/founding costs/the want (mortal wealth owns them); it adds one row to mortal wealth's cost table.
- Does not decide whether founding costs switch on — mortal wealth S2's predicate does; this plan adds a kill line on foundings.
- No Flee the Ravaged Land change (hunger and unrest owns it).
- No mortal lords outside the faction structure as a rule: the founder rules only when they belong to no town-holding faction.
- Does not build anything: S1 waits for mortal wealth S1, per the map's order.

## impact_class

Reversible — every write sits behind `UNDERTAKING_ECONOMY_ENABLED`; old milestone shapes stay behind the flag until S3's Done-when holds.

## evidence cited

- **Linear issue:** THR-1937 (decision source THR-1873; map THR-1863)
- **Vision premises invoked:** the world does not wait for the god; mechanics surface through prose, never numbers; a mortal is a person, not a unit (via the `game-design-direction` notebook)
- **UL terms touched:** Freehold, Means, Route, Undertaking (existing; no new terms)
- **Canon pages consulted:** `Docs/canon/undertakings.md`, `Docs/canon/undertaking-grid.generated.md`, `Docs/ubiquitous-language/Agents.md` (Freehold, Means), `Graph.md` (Route), `Docs/canon/rulebook-quick-reference.md`
- **Prior plan docs this builds on:** `Docs/plans/2026-10-14-thr-1923-settlement-economy.md`, `2026-10-15-thr-1931-faction-purse.md`, `2026-10-15-thr-1936-mortal-wealth.md`, `2026-10-15-thr-1933-war-aims.md`, `2026-10-16-thr-1934-hunger-and-unrest.md`
- **Rejected approaches considered and dismissed:** founder always rules; resource bag on founded towns; any place type; mortal-level monopoly milestones; leave the ambitions (all in THR-1873); pick the building only at completion; pay trade by a roll; mint a guild's starting purse (brainstorm companion)

## load-bearing decisions touched

- Everything is a graph node/edge — respected: ruler, founder, toll holder are edges/edge props; no relational tables.
- Relationships are graph edges, not property fields — the lane's founder is a `constructed_by` edge from the lane's identity node (revised after the Vision audit flagged a first-draft `foundedBy` id property); `controlledBy` is the existing toll-holder field the shipped readers need.
- No inventing node types — none added.
- Agent position three-tier / sublocation tier is `type:'location'` with `parentLocationId` — settlements found via `getLocationNodes` (place tier); buildings are sublocation-tier locations via `createSublocation`.
- The world graph is mutated in place — no identity-keyed caches added.
- Engine caches owned per session — none added.

## high-impact files touched (from Codesight)

- `src/types/ambition.ts` and `src/engine/graphConditions.ts` (wide) — S3 only, additive. Blast Radius section present.

## kill criteria

- S1: no founded town ever paying town tax to its faction ruler in 600 ticks → ruler rule picks nothing in practice; stop and post the census.
- S2: settlement-economy diversity measures fail with mortal-raised buildings on and pass with them off → stop.
- S3: foundings with trade pay and costs on fall below half of foundings with costs off → lower trade pay first (THR-1873's "would change the call").
- S3: Dominate Regional Trade completions above 3× main over 1,200 ticks → tighten to 4 of 5.

## explicit user sign-off

Not required (Reversible).

## author notes for the judge

- Unattended design-lane run. Where design-session says "surface to the user", the lane decides how-level choices and invites a veto in its report.
- How-level choices made here (not in THR-1873): slicing and blockers; derived rank for the ruler; building picked at start and re-checked at end; once-per-trader-per-day trade pay, one number on the trader (canon THR-1440: an instant cell that always pays is a farm); founded guild's `guildType` from the leading Reach (without it the shipped purse pays a founded guild nothing, ever); the `create × faction` cost row (mortal wealth's table has none, yet THR-1873 says the guild's purse starts with what the founder paid).
- Two measured findings the decision's census missed: the cell founds on an existing settlement's hex (`createSite` returns an existing location; only the legacy path uses `findUnclaimedSite`) — fixed in S1; `executeConductTrade` trades the stalest lane at the anchor, not necessarily the named one — pay follows the traded lane.
- S1 is blocked by mortal wealth S1 although it could technically build now (the purse has shipped). I followed the map's stated execution order ("mortal wealth, then undertakings, last") rather than re-reading Christian's priority ruling as kingdom-parts-first.
- THR-1873 calls the ambition "Found Anew"; its display name in code is "Found Something New" (`ambition_found_anew`). The plan uses the code's name.
