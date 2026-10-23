# CI/CD review 2026-10-23 — two harness tweaks

**Shipped 2026-10-23** by the weekly `tb-cicd-review` lane (no ticket; Christian's 2026-10-09 ruling). Both are freeze-compatible (THR-1946): one repairs a check that misread live runs, one removes a step.

1. **pull-work Step 1.6 reads the tail of a recent `succeeded` run.** A run that waits on a background subagent (the review gate's reviewers) ends its turn and shows `succeeded` while still alive. Step 1.6 now calls `list_events(limit: 3)` on each `succeeded` row active within `PREDECESSOR_SILENT_MINUTES`; a tail without `mcp__ccd_turn__wrap_up` counts as an active run. Cited: 14 overlapping pickup pairs in 50 runs on 2026-10-21 (10 after THR-2003), and a WIP-2 claim (THR-1960 beside THR-1937).
2. **CI drops the advisory `Process lint` step.** `continue-on-error: true` since 2026-04-23, so it never failed a PR, and its log was not read. It spent 52–89 s of every `Test · Typecheck · Build` run. Its file checks already run blocking in `Generated artifact freshness` and `Wiki freshness (blocking)`. `npm run check:process` stays for local use.

Ledger: `Docs/ops/cicd-tweaks.md` on `ops`, entries dated 2026-10-23.
