# Action Proposal — The action library: works, holdings & naming (THR-1297)

## intent_quote

From the carve-up (THR-1276 closing comment, Christian, ratified 2026-08-26):

> **The action library: works, holdings & naming** *(Content + schema)* — the kind-row schema
> (CRUD rows, scarcity-tiered cast declarations with identity requirements, band tables, name
> lexicons), the ten kinds, the `holding` category + `controls` disposition table + seize
> (single-writer, slot-cap exempt), the naming resolver + christening + failure-name register,
> the wilderness fix (chart/expedition at lairs), and the three tier vertical slices.

From the ratified rulings being implemented (THR-1281 §1/§2/§4/§6, verbatim excerpts):

> Kind-first grammar. [...] The schema refuses a kind without a destroy verb [...] Ten-kind v1
> catalog, built as an open registry. [...] Cross-family destroys, motive-gated. [...] One
> `holding` attachment category as the bearer-side face of one ownership-edge type [...]
> **Seize-as-transfer** joins the U column of ownable kinds.

THR-1288 addendum (review ruling 2.3.2): "the explicit `groupKind` discriminator ships with the
network kind [...] the same pass audits every raw `member_of` reader [...] and amends the
`commanded_by` schema description." THR-1291: "names assemble from what the undertaking touched
[...] earned at completion [...] names outlive owners [...] extending the existing worldgen
naming machinery, never a second namer." Session commission: Christian's "continue" (2026-08-27)
after the doc-2 offer; same delegation frame — calibration and implementation-how are the
agent's, veto open.

## scope (what this plan does)

Content+schema plan doc for the action library: the kind-row registry with a schema test refusing
destroy-less kinds; motive-gated cross-family destroys; the ownership decision made explicit
(**new `owns` edge**, grounded in the measured consumer-by-consumer `controls` disposition table)
with the `holding` attachment category, a single-writer three-object mirror, atomic seize, and
free-by-construction slot-cap exemption; `groupKind` + the ~49-site raw `member_of` wrapper sweep
+ the `commanded_by` amendment; the work-naming resolver by generalizing the existing
`groupNames` pattern-set namer (christening at completion, failure-name register as site
properties, names outlive owners, echo names); the wilderness fix as three data gates (the 7th
`wanderer-explorer` pack, ambition profiles, wilderness targets); new mutation ops
(`create_group` restoring THR-1295's producer, `spawn_clue`/`seed_knows_of`/`mint_treasure_map`,
minimal `create_location`); a route-identity subtype node; authored values for all eight doc-1/3
seam fields on the ten kind rows; the Law 56 declaration seam (`completionChanges`); and the
three tier vertical slices, T1-scoped Done-when with T2/T3 issues filed at closeout.

## scope (what this plan does NOT do — explicit non-goals)

- No re-litigation of the agent-strategic `controls` deletion (THR-1303's gate) — the faction
  `controls` population is preserved untouched by construction.
- No encounter templates (the encounter factory's lane); `catalystEncounterIds` reuse existing
  content.
- No player surfaces beyond the mechanical attachment-tab/codex touches — arc panel, moment
  cards, holdings on the character sheet are doc 5 (THR-1299); the factory gates are doc 6.
- No grievance minting rules — the motive gates *feed* doc 4 (THR-1298); the rules are its.
- No deep T2/T3 founding pageantry (site ceremonies, charters, recruiting arcs) — recorded map
  fog; the kind rows + minimal-viable mechanics ship, T2/T3 implementation issues are filed.
- No holdings as reward-pool drops (explicitly forbidden in the executor notes).
- No fix for the three findings filed at execution (runGenome schema violation, lair placeholder
  names, the worldSeed no-op ternary).

## impact_class

Reversible — data authoring + additive schema behind the existing measured gates; the two
mechanical sweeps carry golden comparisons; the one new edge type breaks zero existing consumers
by construction (that is why it is new); T1-scoped shipping with tiered follow-ups.

## evidence cited

- **Linear issue:** THR-1297 (orchestrator-filed doc-2 ticket; claimed In Design this session);
  absorbed deferrals THR-1294, THR-1295
- **Vision premises invoked:** durable named legacy (north star #1 link 5), counter-play as
  sequenced CRUD, every-destroy-narratable, capability-poor texture — via
  `Docs/canon/rulebook-quick-reference.md`
- **UL terms touched:** *undertaking* (settled); **work / holding / kind row / christening /
  failure-name register** — a `UL-proposal` issue is an explicit closeout item (the grammar
  verdict's naming lean, veto open)
- **Canon pages consulted:** `Docs/canon/cosmology.md` roster via encounters canon (eight
  reaches), `Docs/canon/systems-inventory.md`, `Docs/design-system/laws.md` Law 56 (via the
  composition-contract enforcement path read in recon)
- **Prior plan docs this builds on:** docs 1 and 3 of this carve-up (both executed), the THR-1289
  recon, the review record
- **Rejected approaches considered and dismissed:** in the brainstorm companion — `controls`
  reuse (measured, not asserted); extending `pickCulturalName` instead of generalizing
  `groupNames`; route-name-as-edge-property; `create_group` as a creation-effect kind; new
  wilderness targeting machinery; full T2/T3 design now; lootable holdings. Repo-level: fixed
  action count NOT reintroduced (open registry); location-hop awareness untouched.

## load-bearing decisions touched

- **Relationships are edges, never property bags** — ownership IS an edge (`owns`); the holding
  attachment is the bearer-side face, edge-is-authority per the roster-mirror doctrine.
- **Before adding a new edge type, check existing edges** — done as the measured disposition
  table: `controls` (reuse breaks 7 consumers + 5 determinism sites), `possesses`
  (artifact-only target), `bonded_to` (one-to-one), `constructed_by` (reversed, dead),
  `holds_place_of_power` (the precedent FOR a narrow new edge). The check is the plan's §3.
- **No inventing node types without verification** — zero new node types; the route identity is
  a location *subtype*; the network is THR-1288's ratified shape.
- **Everything is a graph node/edge** — kinds' objects are all graph shapes; the failure register
  writes site properties (data internal to a node — scars are facts about the place).
- None of these decisions is being *changed*. The route-identity subtype is flagged veto-open as
  the closest call.

## high-impact files touched (from Codesight)

`src/types/graph.ts` (125+ importers — one union member + schema row), `src/engine/graphQueries.ts`
(wide — sibling accessors + the wrapper sweep's one-line edits), `src/types/strategicAction.ts` /
`src/types/attachments.ts` (additive type work), `encounterScoring.ts`/`phaseAgentDecision.ts`
(one-line wrapper swaps only). Blast Radius section present.

## kill criteria

In the plan doc (§ Kill criteria): census regression reverts per-kind flags; cutover-envelope
residual goes to THR-1302, never chased with payoffs; a vacuously-satisfiable registry gate is
fixed before authoring continues; any seize intermediate state stops the slice; any
faction-membership read changed by the sweep (golden comparison) stops the sweep.

## explicit user sign-off

Not required (Reversible). The rulings are ratified (THR-1281/1288+addendum/1291 + review
§2.3.2/§3, Christian, 2026-08-26); the session was commissioned in chat 2026-08-27.

## author notes for the judge

- The ownership-edge identity was the review's explicit open decision; it is made on measured
  ground (the inventory found the assumed property firewall does not exist and reuse is already
  happening by accident in two writers). If the judge reads the grammar verdict's "genuine
  `controls` convert to ownership" migration clause as implying *reuse*, note it equally reads as
  conversion-to-the-new-edge, which is what the two agent writers get.
- The **route-identity node** is the one genuinely new shape (a location subtype). The vertical
  slice (route vs blockade) is unbuildable without ownable, nameable route identity; the
  trades_with edge remains the economic authority. This is flagged veto-open in the plan and is
  the item most worth the judge's scrutiny.
- "Never a second namer" is honored by *removing* one: `groupNames` (an existing, unruled second
  namer) generalizes into the work namer; `pickCulturalName` stays the personal-name leaf.
- The T1-scoped Done-when with filed T2/T3 issues is a sequencing call inside "each tier ships
  whole" + "strangler, never big-bang" — the alternative (one issue shipping all three tiers) is
  a big-bang by another name.
- The recon record (working lists for both sweeps) is posted as a comment on THR-1297 — the plan
  and handoff reference it as the executor's source of truth.
