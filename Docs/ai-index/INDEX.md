# AI Index

> Added 2026-04-02. Thin, repo-owned orientation docs for AI assistants and humans working on the live codebase.
> Purpose: capture implementation contracts and footguns that are easy to miss from file exploration alone.

## Read Order

When working on engine/runtime changes, read these first:

1. `graph-contract.md`
2. `tick-phases.md`
3. `invariants-and-footguns.md`

When working on specific features, then jump to the relevant design docs in `Docs/plans/`.

## What This Folder Owns

- Runtime contracts that are true in the current codebase
- Short maps of the engine's live structure
- Warnings about assumptions that frequently cause regressions

## What This Folder Does Not Own

- Full system design rationale
- Feature backlog or implementation sequencing
- Canonical domain definitions that already live elsewhere

For "why was this designed this way?", use `Docs/plans/`.
For ongoing project state, use `Docs/project-status.md`.
For documentation ownership rules, use `Docs/documentation-ownership.md`.

## Current Files

### `graph-contract.md`

Read before:
- adding node or edge types
- changing relationship semantics
- introducing new low-fidelity actor variants

### `tick-phases.md`

Read before:
- changing phase order
- inserting new simulation phases
- moving work between orchestrator and phase modules

### `invariants-and-footguns.md`

Read before:
- refactoring caches or selectors
- adding UI that depends on graph changes
- implementing new graph-driven entities such as NPCs, retainers, armies, or factions

## Future Expansions

Likely next useful files:

- `runtime-caches.md`
- `targeting-and-ui-contracts.md`
- `subsystems.md`
- `test-map.md`

Those should only be added if they stay thin and source their truth from live code rather than duplicating plan docs.
