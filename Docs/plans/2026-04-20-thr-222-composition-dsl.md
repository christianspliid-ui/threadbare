# Codex brief — THR-222: Composition DSL v0 (grammar + validator)

## Context

Threadbare is unifying all authored content behind one composition DSL. A faction recipe, an agent recipe, an event recipe, a quest recipe — all networks, same grammar. An event is just a bigger recipe that pulls in faction-recipes as nodes. The DSL replaces parallel bespoke content systems with one substrate.

This brief is the **v0 grammar + validator**. Grammar draft below was pinned in a Cowork session; Christian will review and iterate Thursday. **Build against it now** — the refactor cost is expected to be small because the schema is isolated (see "Architecture" below).

## v0 grammar — REVIEW-PENDING (pinned by Claude in Cowork, not yet Christian-reviewed)

### Top-level: Composition

A composition is an authored network that produces game content when it fires.

```ts
type Composition = {
  id: string                          // stable, kebab-case: "the-winnowing-of-luck"
  kind: CompositionKind               // "faction" | "agent" | "event" | "quest" | "location" | "encounter" | "mandate"
  preconditions: Precondition[]       // gating predicates; all must pass for composition to fire
  nodes: Record<string, NodeSpec>     // keyed by author-chosen node name
  effects?: Effect[]                  // optional state changes applied when composition fires
  metadata: {
    author: string
    createdAt: string
    tags: string[]                    // ontology tags on the composition itself (reaches/spheres/archetypes)
  }
}

type CompositionKind =
  | "faction" | "agent" | "event" | "quest" | "location" | "encounter" | "mandate"
// Open set — extensible as the node audit surfaces more types.
```

### Preconditions

```ts
type Precondition = {
  predicate: WorldPredicate           // see Predicate language below
  strength: "hard" | "medium" | "soft"  // default: "medium"
  rationale?: string                    // shown in debug traces when predicate fails
}
```

Strength semantics:
- **hard** — predicate must be true or composition silently non-fires. Reserved for dependencies on other *authored compositions* ("this event only fires if the Winnowing has already fired").
- **medium (default)** — if the predicate depends on a world-state node that doesn't exist yet, the composition's own creation logic creates it. Medium is the working default.
- **soft** — composition fires even if predicate fails, but in a quieter shape (missing flavor nodes dropped, narrative tone shifted down).

### Nodes: three resolution strategies

```ts
type NodeSpec = {
  tier: "essential" | "flavor" | "atmospheric"
  resolve: LiteralResolve | ProceduralResolve | FindRenameCreateResolve
}
```

Tier semantics:
- **essential** — recipe fails (non-fires) if the node can't be resolved
- **flavor** — meaningfully enriches; dropped if unresolvable; composition still fires
- **atmospheric** — background texture; dropped freely; composition fires unaffected

```ts
type LiteralResolve = {
  type: "literal"
  ref: ContentRef                     // e.g. { kind: "agent", id: "wizard-maker" }
}

type ProceduralResolve = {
  type: "procedural"
  generator: string                   // name of a registered procedural generator
  constraints: ConstraintSet          // filters applied during generation (see Filter queries)
}

type FindRenameCreateResolve = {
  type: "find-rename-create"
  find: FilterQuery                   // see Filter queries below
  mark?: MutationSet                  // applied atomically to found node; if any mutation violates
                                      // the node-class gate (THR-224), whole find fails → create
  create: CreationSpec                // fallback used if find yields no valid match
  allowCreate?: boolean               // default true; if false, find-card hard-fails on no match
                                      // (useful when the node must already exist)
}
```

### Predicate language (v0)

Treat as a TypeScript expression tree. Authors compose via helper functions; the tree serializes to JSON for storage.

```ts
type WorldPredicate =
  | { op: "and" | "or"; terms: WorldPredicate[] }
  | { op: "not"; term: WorldPredicate }
  | { op: "has-faction-of-archetype"; archetype: string; count?: { gte?: number; lte?: number } }
  | { op: "has-agent-of-archetype"; archetype: string; count?: { gte?: number; lte?: number } }
  | { op: "doom-clock"; comparator: "gte" | "lte" | "eq"; tier: number }
  | { op: "composition-fired"; id: string }
  | { op: "edge-exists"; fromFilter: FilterQuery; edgeType: string; toFilter?: FilterQuery }
  | { op: "world-flag"; key: string; value: unknown }
```

Author-facing helper surface (suggest — adjust to repo conventions):
```ts
and(pA, pB), or(pA, pB), not(p)
hasFaction({ archetype: "merchant_consortium" })
doomClockAtLeast(1)
firedBefore("the_winnowing_of_luck")
edgeExists({ from: { archetype: "consortium" }, edgeType: "trade_pact" })
```

### Filter queries (v0)

Used both by `FindRenameCreateResolve.find` and by `edge-exists` predicate.

```ts
type FilterQuery =
  | { op: "and" | "or"; terms: FilterQuery[] }
  | { op: "not"; term: FilterQuery }
  | { op: "has-tag"; axis: "archetype" | "reach" | "sphere"; value: string }
  | { op: "has-any-tag"; axis: "archetype" | "reach" | "sphere"; values: string[] }
  | { op: "node-class"; class: "generic" | "promoted" | "threaded" }
  | { op: "has-edge"; edgeType: string; toFilter?: FilterQuery }
  | { op: "prop-equals"; prop: string; value: unknown }  // narrow use; most filtering via tags
```

Tie-breaking (when find returns multiple matches): deterministic, stable-sorted by `(tagMatchCount desc, nodeClass asc where generic < promoted < threaded, id asc)`. Authors can override with `orderBy` (deferred to v1).

### Mutations (v0)

```ts
type MutationSet = {
  rename?: string                     // new display name
  promoteClass?: "promoted" | "threaded"  // one-way; generic → promoted, promoted → threaded
  addEdges?: Array<{ edgeType: string; toNodeKey: string }>  // toNodeKey references other recipe nodes
}
```

Omitted from v0: tag mutation, custom-prop mutation, edge removal. All deferred to v1.

### Creation spec (v0)

```ts
type CreationSpec = {
  kind: CompositionKind               // usually matches parent composition's node kind expectations
  tags: { archetype?: string[]; reach?: string[]; sphere?: string[] }
  initialEdges?: Array<{ edgeType: string; toNodeKey: string }>
  proceduralFill?: boolean            // default true; invoke procedural flavor generation after create
}
```

No authored narrative in CreationSpec — that's for procedural generation or subsequent promotion.

### Effects (v0, optional on composition)

```ts
type Effect =
  | { op: "set-world-flag"; key: string; value: unknown }
  | { op: "advance-doom-clock"; by: number }
  | { op: "mark-composition-fired"; id: string }
```

Keep minimal; most state change happens implicitly via node creation and edge addition.

## Architecture (isolate the schema for cheap iteration)

Put the grammar in a single module (e.g. `packages/composition-dsl/schema.ts`). The validator, examples, and runtime all import from it. When Christian iterates the grammar Thursday, the changes should be: edit the schema module, re-run the validator (types flow), adjust any affected examples. No runtime surgery.

Use **Zod** (or the repo's existing schema validation lib — check first) for the schema so parse-with-rich-errors and type inference both fall out of one definition.

## Goal

Implement:
1. The v0 schema as TypeScript + Zod (or repo equivalent)
2. A validator that takes a recipe object and a simulated world state and answers:
   - Can this composition fire? (preconditions check)
   - What nodes would resolve? (essential/flavor/atmospheric with per-node status)
   - What would be created? (preview of creations and mutations)
   - Expected errors and warnings
3. Two reference recipes under `examples/compositions/`:
   - A **faction** recipe: small (~3-5 nodes) — demonstrates literal + find-rename-create node resolution
   - A **doom-clock event** recipe: large (~8-12 nodes) — demonstrates all three resolution strategies, all three tiers, all three precondition strengths. Suggested recipe: "The Winnowing of Luck" — merchant consortium + wizard tower + luck stone + trade war + displaced barbarian tribe. The Cowork session has a sketched version in THR-219's comments.
4. A CLI or test harness that takes a recipe file + a world-state JSON and prints the validator output.

## Approach

1. Locate or create the package (`packages/composition-dsl/` or equivalent — check repo conventions).
2. Implement the schema module.
3. Implement the validator. Worlds are in-memory JSON for v0 — no CMS round-trip required.
4. Write the two reference recipes in the same syntax.
5. Write a test harness that round-trips both recipes through the validator with a few world states (empty world, world with consortium, world with consortium + wizard tower, etc.).
6. Write a README in the package documenting the grammar, examples, and known-deferred features.

## Output

New package/folder with:
- `schema.ts` — the DSL types + validators, ISOLATED (nothing else lives in this file)
- `validator.ts` — the recipe × world-state → report logic
- `cli.ts` (or test harness)
- `examples/faction.recipe.ts` — reference faction
- `examples/event-winnowing-of-luck.recipe.ts` — reference event
- `README.md` — grammar summary, examples, known-deferred features
- Tests: at minimum, both examples round-trip through the validator against 3+ world states

## Acceptance criteria

- The schema matches the spec above. Divergences are flagged in the README with rationale.
- Both reference recipes validate clean against a world state that satisfies their preconditions.
- Both reference recipes fail to fire (with readable error messages) against a world state that doesn't.
- The event recipe exercises all three resolution strategies, all three tiers, and all three precondition strengths.
- Validator output distinguishes: composition will fire / won't fire, node resolution status per node, mutations/creations preview, errors/warnings.
- Schema module is isolated — changing a type there should not require changes in more than the validator and examples.
- README documents known-deferred v1 features listed in "Omitted from v0" blocks above.

## Non-goals

- Do **not** implement the node-class mutability gate (THR-224) — the validator can assume all nodes are generic for v0. Leave a TODO at the mutation-check point.
- Do **not** implement LLM-backed stated-attribute extraction. That's also THR-224.
- Do **not** wire the DSL into the actual CMS write path. Validator runs against in-memory world state only.
- Do **not** design a surface syntax (YAML/custom DSL). v0 authors write recipes as TypeScript objects importing the schema types. Surface-syntax design is a v1 call.
- Do **not** extend the grammar beyond the spec above. If you hit something missing, add it to the README as "grammar gap — discussed with Christian" rather than inventing it.

## Linear

- This brief: THR-222 — https://linear.app/threadbare/issue/THR-222/composition-dsl-v0-general-spec-for-authored-content-networks
- Uses: THR-223 (find-card detail spec), THR-224 (mutability gate) — separate briefs
- Source: THR-219 — https://linear.app/threadbare/issue/THR-219/actors-procedural-floor-authored-layer-for-threaded-agents-brainstorm

## Note for Christian

This grammar was pinned in a Cowork session without your review. Expected iterations Thursday:
- Kind enum — probably needs additions from node audit
- Predicate ops — you may want richer predicates (e.g., world-geography queries)
- Mutation set — you may want tag mutation in v0
- Surface syntax — YAML vs. TS-objects, if authors will be non-engineers

Codex's output should be surgically refactorable for any of those changes because the schema is isolated.
