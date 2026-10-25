# Weekly review 2026-10-25 — gate test timeouts, resume-path overlap check

**Shipped 2026-10-25** by the weekly `tb-weekly-review` lane (no ticket; Christian's 2026-10-09 ruling). Freeze-compatible (THR-1946): one loosening, one fix to machinery that broke cited runs.

**The gate's `test` run gets looser vitest defaults** (`--testTimeout=15000 --hookTimeout=60000`, constants `GATE_TEST_TIMEOUT_MS` / `GATE_HOOK_TIMEOUT_MS` in `scripts/gate.ts`). Under the gate the suite shares the machine with typecheck and build, and the 5 s / 10 s defaults false-failed files outside the diff at least six times on 10-24..10-25 (impediments #1210, #1221, #1222). CI keeps vitest's defaults.

**pull-work Step 1.6 counts a recently active `succeeded` run as alive, on the resume path only** (`RESUME_RECENT_ACTIVITY_MINUTES` = 15). A run waiting on its review-gate subagents ends its turn and reads `succeeded`; the next run started seconds later and built the same ticket twice (THR-1843, THR-1966; impediments #1215, #1217, #1220). The fresh-claim check is unchanged.

Ledger: `Docs/ops/cicd-tweaks.md` on `ops`, entries dated 2026-10-25.
