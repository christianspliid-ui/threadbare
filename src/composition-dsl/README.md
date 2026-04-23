# Composition DSL v0 (THR-222)

This folder contains the v0 authored composition DSL schema, validator, examples, and a small harness.

## Files

- `schema.ts`: isolated grammar types + Zod schemas.
- `validator.ts`: recipe × world-state validator.
- `harness.ts`: test-harness entry helpers (`runValidationHarness`, `formatValidationReport`).
- `examples/faction.recipe.ts`: small faction composition example.
- `examples/event-winnowing-of-luck.recipe.ts`: larger event composition example.

## Validator Output

The validator report distinguishes:

- `willFire`: whether the composition should fire now.
- `preconditions`: pass/fail status with `hard|medium|soft` semantics.
- `nodes`: per-node resolution status (`resolved`, `would-create`, `dropped`, `error`).
- `creations`: creation preview.
- `mutations`: mutation preview.
- `errors` and `warnings`.

## How Find-Cards Resolve

`find-rename-create` nodes are resolved by `findCard.ts` and emit structured `FindCardLog` entries for author debugging.

Resolution outcomes:

- `FOUND_AND_MARKED`: one candidate wins deterministic tie-break; optional mutations apply atomically.
- `FOUND_BUT_REJECTED`: a candidate matched, but stub mutability gate/tripwire checks rejected mutation; fallback create path is used.
- `CREATED`: no candidates matched and fallback creation ran.
- `HARD_FAILED`: no candidates matched (or mutation was rejected) and `allowCreate=false`.

Tie-break order is deterministic:

1. Tag match score descending
2. Node class ascending (`generic`, then `promoted`, then `threaded`)
3. Node id ascending

Filter evaluation is cached for the duration of one composition validation pass, so repeated subqueries reuse the same world-snapshot results.

## Mutability Gate + Tripwire (THR-224)

Mutations are validated through `mutationGate.ts` before they are accepted:

- `generic` nodes are mutable.
- `promoted` nodes require `mutationContext.respectsPromoted=true`.
- `threaded` nodes require the node id in `mutationContext.ownsThreads`.

Tripwire checks run on stated attributes (`node.statedAttributes`) and reject contradictory writes unless an explicit author override is supplied (`overrideTripwire=true` with rationale). Additive array growth is allowed.

`promoteIfGeneric` is called during validation report rendering to model first player-surface promotion (`generic -> promoted`) and to persist a stated `name` attribute when available.

## Divergences / Notes

- `Composition.kind` is validated as non-empty string, with the known v0 set documented in `KNOWN_COMPOSITION_KINDS`. This preserves the brief's "open set" intent while still documenting today's canonical kinds.
- `world-flag` equality uses strict `===` comparisons for v0.

## Known Deferred v1 Features

- LLM-backed stated-attribute extraction from generated prose is not implemented. v0 only protects author-declared stated attributes.
- `find` ordering overrides (author-specified `orderBy`) are deferred.
- Mutation operations remain limited to:
  - `rename`
  - `promoteClass`
  - `addEdges`
- Deferred mutation operations:
  - tag mutation
  - arbitrary property mutation
  - edge removal
- No CMS write-path integration (in-memory world-state validation only).
- No YAML/custom DSL surface syntax; authoring is TypeScript object-based in v0.
