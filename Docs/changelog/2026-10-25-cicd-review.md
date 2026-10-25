| Date | Files | Change | Why |
|------|-------|--------|-----|
| 2026-10-25 | `scripts/gate.ts` (`GATE_TEST_TIMEOUT_MS`, `GATE_HOOK_TIMEOUT_MS`) | Weekly review: the gate's `test` run passes `--testTimeout=15000 --hookTimeout=60000`; CI unchanged | ≥6 gate false-reds on 10-24..10-25 from timeouts in files outside the diff (#1210, #1221, #1222) |
| 2026-10-25 | `.claude/skills/pull-work/SKILL.md` (Step 1.6, `RESUME_RECENT_ACTIVITY_MINUTES`) | Weekly review: on the resume path, another pickup row active within 15 min counts as alive whatever its `status` | A run waiting on review-gate subagents reads `succeeded`; THR-1843 and THR-1966 were built twice (#1215, #1217, #1220) |
