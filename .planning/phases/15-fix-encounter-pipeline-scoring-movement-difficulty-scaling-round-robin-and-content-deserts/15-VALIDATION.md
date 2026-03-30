---
phase: 15
slug: fix-encounter-pipeline-scoring-movement-difficulty-scaling-round-robin-and-content-deserts
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 15 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (existing config at vitest.config.ts) |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --testPathPattern encounterScoring\|encounterFilter\|phaseAgentDecision` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --testPathPattern encounterScoring\|encounterFilter\|phaseAgentDecision`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 15-01-01 | 01 | 1 | Score bug fix | unit | `npm test -- --testPathPattern encounterScoring` | Partial — new assertion needed | ⬜ pending |
| 15-01-02 | 01 | 1 | TRAVEL_COST_WEIGHT reduction | unit | `npm test -- --testPathPattern encounterScoring` | Partial | ⬜ pending |
| 15-02-01 | 02 | 1 | Familiarity retirement | unit | `npm test -- --testPathPattern encounterFilter\|encounterScoring` | Partial — familiarity tests exist | ⬜ pending |
| 15-02-02 | 02 | 1 | Outgrowth lock | unit | `npm test -- --testPathPattern encounterFilter` | Partial | ⬜ pending |
| 15-03-01 | 03 | 2 | Forced travel trigger | unit | `npm test -- --testPathPattern phaseAgentDecision` | ❌ W0 | ⬜ pending |
| 15-04-01 | 04 | 2 | Universal encounter templates | unit | `npm test -- --testPathPattern encounter-content` | Partial | ⬜ pending |
| 15-05-01 | 05 | 2 | Score components in DECIDE log | integration | `npm run cli -- --seed 42` | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/phaseAgentDecision-forced-travel.test.ts` — unit test for forced travel trigger after N idle ticks
- [ ] Assertion in `encounterScoring.test.ts` verifying `scoreAndSelect` returns matched candidates with real scores (confirms bug fix coverage)

*Existing infrastructure covers most scenarios. Two targeted additions needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Score components visible in DECIDE log | Score display fix | Requires CLI run + log inspection | `npm run cli -- --seed 42`, run `tick 50`, export encounter log, verify `score>0` and `desire!=?` |
| Agents travel to different locations | Movement incentives | Requires multi-tick simulation | `npm run cli -- --seed 42`, run `tick 200`, check `agents` for different hex positions than start |
| Round-robin broken | Pool expansion | Requires encounter variety inspection | `npm run cli -- --seed 42`, run `tick 200`, export logs, verify >10 unique encounter types per agent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
