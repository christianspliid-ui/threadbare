# Brainstorm companion — The reactive loop (THR-1298)

Companion to `Docs/plans/2026-09-01-thr-1298-reactive-loop.md`. The design decisions themselves were
settled in the THR-1282 grill-me (vault: `Brainstorms/2026-08-26-reactive-loop-grill-me.md`, resolution +
amendment on the Linear issue) — this companion records the **engineering** alternatives weighed while
turning those rulings into a plan, and the tensions an executor should know were seen.

## Alternatives considered and rejected

### 1. Widen `eventType: 'encounter_outcome'` instead of adding `undertaking_outcome`

The mint lane filters hard on `eventType === 'encounter_outcome'`, so stamping undertaking outcomes with
the same string would make them mintable with **zero** lane changes. Rejected: they would classify through
`classifyMintEvent`'s reach-keyed table — a harm's `reachTested` would route a razing (iron) to generic
"violence" rows with no culprit semantics, and every encounter-history query (`getAgentEncounterHistory`,
`getLocationEncounterHistory`) would silently start returning undertakings. Accidental minting via the
wrong rules table is exactly the disjoint-vocabulary failure class (`hungerResonance`) the ticket flags.
A distinct `eventType` + explicit lane widening costs ~10 lines and keeps both vocabularies honest.

### 2. TickEvent consumption instead of graph event nodes

Doc 1's `buildAbandonMintEvent` already emits a TickEvent "into the THR-726 lane" — teaching
`gatherMintTuples` to also read `state.tickEvents` would avoid graph writes entirely. Rejected:
`recentEvents`/tickEvents are a rolling window (the 100-entry buffer lesson, impediment #405 family), the
mint lane's `MINT_LOOKBACK_TICKS` window assumes durable nodes, and witness classification *requires*
`occurred_at` edges to a location. The graph-node shape is also what gives provenance a clickable target
(`mintedByEventId` → a real node). The TickEvent stays for the chronicle; the node is the durable record.

### 3. A new `grudge` edge type

Cleanest read semantics, but violates the no-new-edge-types-without-verification rule for no gain:
`bandOpposition.writeGrudge` already models group grudges as bidirectional `hostile_to` with provenance,
`undertakingMotive` already reads `hostile_to`-with-injury-provenance as the `'grudge'` motive, and the
rulebook already canonizes the "blood between them" register for it. Promoting the existing pattern to a
shared helper with a unified provenance key extends three live precedents instead of minting a fourth
spelling. (The three-key `cause`/`reason`/`basis` divergence is a pre-existing wart; this doc standardizes
its own writes on `cause` and does not widen the divergence.)

### 4. Grievance state on the ambition node

Rejected immediately: ambition nodes are **shared** per `templateId` (`ambition.${templateId}`) — two
agents pursuing `ambition_seek_revenge` against different culprits would overwrite each other. Edge-side
state is the established pattern (`mintedByEventId` precedent). This also means the one-slot rule is an
edge-count predicate, not a node property.

### 5. A separate grievance scheduler / priority queue

A dedicated "vendetta system" that schedules revenge acts directly would guarantee grievances act. Rejected
as anti-substrate: the whole point of the one-board ruling (substrate §4) is that *everything* competes in
one currency. Heat-as-decaying-board-weight means a grievance can lose to a better opportunity — which is
characterful (a prudent merchant shrugs off an insult a warlord would answer) and self-limiting (vendettas
fizzle unless fed). The `urgencyWeight` seam was pre-declared in `decisionBoard.ts:365-367` for exactly this.

### 6. Per-instance milestone `targetRef` binding for "kill the culprit"

The THR-812 richer option, again: let minted milestones carry a bound node id (`target_agent_eliminated`
on the actual culprit). Rejected in THR-812 for being infrastructure without a producer; now there *is* a
producer, but template-level milestones still evaluate against shared nodes. Chosen shape instead: a
condition (`grievance_culprit_eliminated`) that resolves the culprit **from the pursues-edge properties at
evaluation time** — per-instance semantics without per-instance template copies, and no `$`-ref anywhere.

## Tensions seen and carried

- **Grievances mint on agents who mostly cannot act.** Only spotlight-tier agents run the decision loop
  (steel-man C4; THR-1348). The ruling's chain cap is spotlight-only *beyond link two*, but even link one
  needs an acting owner. The plan resolves the tension honestly: ambient victims get grudge edges (visible,
  re-ignitable), never pursues edges that would render as drives on an agent structurally incapable of
  pursuing them. This narrows observable grievance *action* to the spotlight population — accepted, and it
  is also why the 300-tick observation run reports counts instead of gating on them.
- **Cold-start scarcity.** Destroy verbs are motive-gated, and grievances are themselves a motive source —
  so organic harm events are rare until the loop has turned once. Rivalry/faction-war motives seed the
  first turns. This is why the Done-when demands a *constructed* CLI proof and treats organic runs as
  tuning observations.
- **`named_death` rides doc 3.** The binder (THR-1296) owns honest deaths of bound cast; until it executes,
  that rules row is inert. Shipping the row now costs nothing (fail-soft) and means deaths start minting
  the moment the binder lands, with no cross-doc coordination.
- **Destiny is not a grievance.** `ambition_fulfill_destiny` converts to the wonder-class witness lane
  rather than being force-fitted into harm classes — the pool retirement is complete without pretending
  all four templates are revenge-shaped.
- **Two scales, one bridge.** The review flagged pole inversion as doc 4's signature trap. The plan pins
  the formula, names `signedToCanonical01` as the only legal bridge, and adds the schema test that keeps
  authored `poleAffinities` inside `VALUE_PAIRS` — the same vocabulary-drift class doc 1 §4 repaired for
  motivations.

## Verified facts the plan stands on (recon 2026-09-01)

- Mint lane consumes only `encounter_outcome` graph nodes; undertaking outcomes emit no graph nodes today.
- `MotiveGateResult.ownerId` is computed and discarded; `resolveTargetOwners` does not read `owns` despite
  its docblock promising it.
- `decisionBoard.ts` carries the declared grievance seam verbatim; "heat" has no mechanical meaning
  anywhere in `src/` yet (faction `grievanceDecay` is the nearest analogue, faction-side).
- The reactive pool is never assigned but **is** referenced (template resolution + agent detail), and its
  `strategicProfile`s are the sole home of 7 strategic templates — retirement without conversion would
  orphan them.
- No kin/family edge types exist; `bondType: 'kin'`/`'spouse'`/`basis: 'lineage'` appear only in content no
  writer produces.
- `signedToCanonical01`/`canonical01ToSigned` exist and are declared the canonical bridge
  (`axisRegistry.ts:224-245`).
