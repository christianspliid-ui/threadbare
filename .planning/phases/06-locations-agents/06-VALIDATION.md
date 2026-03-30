---
phase: 6
slug: locations-agents
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 06-01-01 | 01 | 1 | LOCI-01 | unit | `npx vitest run src/components/HexMap/__tests__/LocationIconMesh.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-02 | 01 | 1 | LOCI-02 | unit | `npx vitest run src/components/HexMap/__tests__/LocationLabelOverlay.test.ts` | ❌ W0 | ⬜ pending |
| 06-01-03 | 01 | 1 | LOCI-04 | unit | `npx vitest run src/components/HexMap/__tests__/LocationSignifierSuppression.test.ts` | ❌ W0 | ⬜ pending |
| 06-02-01 | 02 | 1 | LIART-01..17 | visual | Manual SVG review | N/A | ⬜ pending |
| 06-03-01 | 03 | 2 | AGNT-01 | unit | `npx vitest run src/components/HexMap/__tests__/AgentMesh.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-02 | 03 | 2 | AGNT-02,03 | unit | `npx vitest run src/components/HexMap/__tests__/AgentZoomTier.test.ts` | ❌ W0 | ⬜ pending |
| 06-03-03 | 03 | 2 | COMP-05 | unit | `npx vitest run src/components/HexMap/__tests__/RingSlotLayout.test.ts` | ❌ W0 | ⬜ pending |
| 06-04-01 | 04 | 2 | AGNT-05 | unit | `npx vitest run src/components/HexMap/__tests__/AgentBezierHop.test.ts` | ❌ W0 | ⬜ pending |
| 06-04-02 | 04 | 2 | AGNT-06,07 | unit | `npx vitest run src/components/HexMap/__tests__/AgentActivityIndicator.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Test stubs for LocationIconMesh, LocationLabelOverlay, SignifierSuppression
- [ ] Test stubs for AgentMesh, AgentZoomTier, RingSlotLayout, AgentBezierHop, AgentActivityIndicator
- [ ] Shared fixtures for hex coordinate helpers and mock WorldGraph data

*Existing vitest infrastructure covers framework needs — Wave 0 is test file creation only.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| SVG icon visual quality | LIART-01..17 | Art quality is subjective | Review each SVG at 64px and 128px for clarity and style consistency |
| Label readability on all terrains | LOCI-02 | Visual contrast depends on rendered background | Screenshot labels over each terrain type at hero-local zoom |
| Bezier hop animation smoothness | AGNT-05 | Frame timing and visual feel | Watch agent movement at 60fps, verify no jank or teleporting |
| Agent portrait clarity at zoom | AGNT-02 | Visual fidelity at different zoom levels | Zoom in/out and verify portraits are recognizable |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
