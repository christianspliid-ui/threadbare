# Brainstorm companion — The action library: works, holdings & naming (THR-1297)

Companion to `Docs/plans/2026-08-27-thr-1297-action-library-works-holdings-naming.md`. Upstream
exploration lives in the THR-1281/1288/1291 grillings and their vault syntheses; this records the
alternatives weighed and calibration calls made inside this design session. Veto open on all.

## Alternatives considered and rejected

### Ownership: reuse `controls` vs the new `owns` edge

The grammar verdict said "one ownership-edge type" without naming it; the review demanded the
identity be decided explicitly. The measured inventory decided it: the property firewall everyone
assumed (`influence` vs `controlType`) **does not exist** — `influence` has zero readers, exactly
one site anywhere discriminates by any property, and it lives inside the code THR-1303 deletes.
Reuse therefore breaks seven faction-territory consumers outright (sieges targeting agent-held
settlements, armies marching on holdings, prose naming an agent as a controlling faction, the
power-vacuum deleting holdings on a razing) and makes five `[0]?.source` reads order-dependent
(NFP #3). The new edge breaks zero, costs a bounded known list (two tuples, three idempotency
guards, two sibling accessors, one condition repoint), and has in-repo precedent
(`holds_place_of_power` — a narrow ownership edge coexisting with `controls`, integrated at
exactly those tuples). The surprise that sealed it: agent ownership already rides `controls`
un-flagged in two writers, so "reuse" wouldn't even be a decision — it would be ratifying an
accident. Migration of those two writers makes the accident deliberate.

### Naming: extend `pickCulturalName` vs generalize `groupNames`

The verdict says "extending the existing worldgen naming machinery, never a second namer." Recon
found the repo already *has* a second namer — `groupNames.ts` — and it is structurally the ruled
recipe: bound-entity context, additive lexicons keyed by cause and sphere, pattern sets chosen by
input presence, a correct possessive fallback, a reformation grammar, and the eager-render
determinism idiom. Extending `pickCulturalName` instead would mean teaching a personal-name picker
about anchors and patterns it has no shape for, while leaving the actual second namer standing.
Generalizing `groupNames` into THE proper-name resolver (with `pickCulturalName` kept as the
personal-name leaf and `culturePhonetics` gaining a `'work'` mode) is the smaller diff, honors the
verdict's *intent* (one namer), and retires the drift instead of adding to it. "The Saltway Ring"
is grammatically a group-name pattern, not a settlement root+suffix.

### Trade-route identity: node vs edge property

The one place the ruled design forces a new shape. A `routeName` property on the `trades_with`
edge names the route but leaves it unownable (an `owns` edge cannot target an edge), uncastable,
and un-blockadable as an object — which the route-vs-blockade vertical slice cannot accept. A
full route *node type* violates the constitution. The middle path: a location-**subtype**
identity node (additive, like the `bridge` gap the mock census already flagged as a small
subtype addition), with the `trades_with` edge staying the economic authority and the node
carrying identity — the roster-mirror doctrine's third application, same single-writer
discipline. Flagged veto-open in the plan because it is the closest thing here to a new shape.

### `create_group`: creation-effect kind vs mutation hint

Creation effects fire per checkpoint, banded; mutation hints fire once at completion. Founding an
organization is a completion event — the drama is the arc, the org is the payoff — and THR-1295's
own TODO wording ("the `create_group` strategic op") reads as the hint axis. Warband and faction
take different mechanisms under one hint (companies path vs synthesized definition) because the
repo has two proven group-creation paths and inventing a third to unify them would green-field
exactly what the substrate discipline forbids.

### The wilderness fix: new targeting machinery vs three data gates

Tempting to build a `hex_region`/wilderness targeting rule (the existing `hex_region` rule is a
stub). Rejected: the measured idle is three *data* gates — no explorer pack (the
`wanderer-explorer` family is a pre-declared empty slot with UI wired), no ambition profiles
(7 of ~25 carry one; every wilderness ambition generates zero undertakings), and no template
naming wilderness subtypes (lairs/anomalies/ruins are ordinary location nodes the existing
`location_subtype` rule already reaches). Closing data gates with data is the in-catalog fix the
review demanded; the targeting stub stays a stub until something measured needs it.

### T2/T3: design fully now vs kind-row depth + filed slices

The map's own fog list keeps deep T2/T3 founding mechanics (site ceremony, charters, recruiting
pageantry) unspecified, while the grammar's tier plan names the capabilities. Resolved by
authoring all ten rows at kind-row depth (verbs, shapes, ownership, naming, seam values) with
minimal-viable founding mechanics (the undertaking's checkpoints ARE the construction arc), and
scoping this issue's Done-when to T1-shipped-whole plus filed T2/T3 issues. Designing the
pageantry now would be re-litigating recorded fog; shipping T1 without the full row set would
leave doc 6's factory without its schema.

### Holdings as reward-pool drops

Considered letting the reward system draw `holding` attachments. Rejected outright: ownership is
earned through undertakings and events (the ruled acquisition path), and a lootable deed breaks
the three-object mirror's single-writer guarantee. The reward-path arms exist only so the
authoring gate understands the category.

## Tensions carried forward, on the record

- **The `member_of` sweep is wide (~49 sites) and mechanical** — the golden comparison on both
  seeds is the safety net; a sweep that changes any faction read stops the slice (kill criterion).
- **`payoffValue` numbers are first-guess in EVT units.** The cutover envelope is the instrument;
  the kill criterion forbids chasing THR-1302's residual with kind payoffs.
- **The failure register writes site properties, not nodes** — cheapest honest shape; if doc 5
  wants clickable scars, promoting them to nodes is its design call, not pre-built here.
- **Masterwork items own via `possesses`, not `holding`** — they already ARE attachments; forcing
  them through the mirror would double-shape them. The grammar's "not everything created is
  held" covers this.
- **`requiresLocation` authored values ride the census** — the measured world, not the design's
  preference, decides which kinds can afford `true` (THR-1294's lesson institutionalized).

## Vision premises leaned on

- *Durable named legacy* — the kinds are north star #1's final link; names outlive owners is the
  chronicle doing worldbuilding for free.
- *Counter-play is sequenced CRUD* — the no-destroy-no-kind gate is that premise as schema.
- *Every destroy narratable* — motive gates feed doc 4's grievances their culprits.
- *The world is capability-poor* — T1 marks are craftable at mid-competence; founding is hard and
  long; the difficulty ladder respects the texture.
