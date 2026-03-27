# Project Status

> Updated 2026-03-27. Split from monolithic status file — see Docs/project-history.md for completed milestone archive.

## Current Focus
**Debug & Tuning Tooling**

**Recent completions:**
- ✅ Reroute teleportation fix (2026-03-27) — agents no longer teleport back to origin on reroute. Both reroute paths now pathfind from movementQueue[0] and preserve road hex traversal state.
- ✅ TB-057: Tick Health Monitor & Crash Log (2026-03-26) — validateTickOutput() with 12 structural checks, try/catch tick loop hardening, crash log buffer, exportDiagnostics(), state cleanup (notification trim, resolved action pruning with completedAtTick), 2 new trace categories, 23 tests.
- ✅ TB-056: Agent Encounter Tuning (2026-03-26) — idle death spiral fix. Wired domainCapabilities into computeRawScore(), tuned 5 constants.
- ✅ TB-055: Tiered Encounter Modal (2026-03-26) — chronicle narrator with thread-tier visibility, multi-step navigation, intervention choices.

## Full Backlog
See: `.planning/BACKLOG.md`

## Completed Work
See: Docs/project-history.md
