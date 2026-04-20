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

## Divergences / Notes

- `Composition.kind` is validated as non-empty string, with the known v0 set documented in `KNOWN_COMPOSITION_KINDS`. This preserves the brief's "open set" intent while still documenting today's canonical kinds.
- `world-flag` equality uses strict `===` comparisons for v0.

## Known Deferred v1 Features

- Node-class mutability gate enforcement (`generic|promoted|threaded`) is intentionally not implemented in this validator pass (`TODO(THR-224)` marker in `validator.ts`).
- Stated-attribute tripwire extraction is not implemented (`THR-224`).
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
