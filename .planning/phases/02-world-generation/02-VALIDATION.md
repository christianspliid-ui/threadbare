---
phase: 02
slug: world-generation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | WGEN-01 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | WGEN-02 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | WGEN-07 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | WGEN-03, WGEN-04 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | WGEN-08, WGEN-09, WGEN-10, WGEN-11 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 1 | WGEN-06 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-03-01 | 03 | 2 | WGEN-05 | unit+integration | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-03-02 | 03 | 2 | WGEN-12 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |
| 02-03-03 | 03 | 2 | WGEN-13 | unit | `npx vitest run src/engine/__tests__/worldGenV2` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/worldGenV2/` — test directory for new pipeline
- [ ] Test stubs for province generation, ridge overlay, climate fields, biome classification, hydrology integration
- [ ] Determinism test: same seed produces identical WorldGenData hash

*Existing infrastructure covers vitest framework and simplex-noise library.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Visual coherence of mountain ranges | WGEN-01 | Requires visual inspection of rendered map | Load ?view=hexv2 with seed 42, verify mountain ranges form coherent spines |
| Biome transition naturalness | WGEN-08 | Subjective visual quality | Zoom to biome boundaries, verify no jarring adjacencies |
| River flow visual correctness | WGEN-05 | Requires visual confirmation | Check rivers flow downhill visually, no uphill segments |
| Province distinctiveness | CONTEXT | Visual verification of culture homeland zones | Verify distinct biome regions visible on map |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
