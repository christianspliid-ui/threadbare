---
phase: 7
slug: fog-zoom-grid
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 7 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --run --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | ZOOM-01, ZOOM-02, ZOOM-03, ZOOM-04 | unit | `npx vitest run src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts` | ❌ W0 | ⬜ pending |
| 07-01-02 | 01 | 1 | FOG-01, FOG-02, FOG-03, FOG-04, FOG-05, FOG-06 | unit | `npx vitest run src/components/HexMapV2/scene/__tests__/FogCulling.test.ts` | ❌ W0 | ⬜ pending |
| 07-02-01 | 02 | 1 | GRID-03, GRID-04 | unit | `npx vitest run src/components/HexMapV2/scene/__tests__/RoadMesh.test.ts` | ❌ W0 | ⬜ pending |
| 07-03-01 | 03 | 2 | ZOOM-05, ZOOM-06, FOG-01–06, ZOOM-02–04, GRID-03–04 | build | `npm run build` | N/A | ⬜ pending |
| 07-03-02 | 03 | 2 | all | visual | checkpoint:human-verify | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/HexMapV2/scene/__tests__/ZoomVisibilityMatrix.test.ts` — stubs for ZOOM-01 through ZOOM-06
- [ ] `src/components/HexMapV2/scene/__tests__/FogCulling.test.ts` — stubs for FOG-01 through FOG-06
- [ ] `src/components/HexMapV2/scene/__tests__/RoadMesh.test.ts` — stubs for GRID-03, GRID-04

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Fog reveal animation | FOG-06 | Visual smooth transition timing | Toggle fog state, verify 300ms fade-in or instant flip per CONTEXT decision |
| Zoom tier transitions | ZOOM-03 | Visual fade timing between LOD tiers | Zoom in/out, verify smooth opacity transitions |
| Camera follow mode | GRID-04, ZOOM-05 | Interactive camera behavior | Enable follow mode, advance tick, verify camera tracks agent |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
