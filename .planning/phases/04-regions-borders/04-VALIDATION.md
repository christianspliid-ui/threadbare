---
phase: 4
slug: regions-borders
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts (vitest section) |
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
| 04-01-01 | 01 | 1 | REGN-01, REGN-02 | unit | `npx vitest run src/engine/__tests__/regionDetection.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | REGN-03 | unit | `npx vitest run src/engine/__tests__/regionDetection.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | REGN-04 | unit | `npx vitest run src/engine/__tests__/regionPolitical.test.ts` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | REGN-05, REGN-09 | visual | `npx vitest run src/components/HexMapV2/scene/__tests__/BorderMesh.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-01 | 03 | 3 | REGN-07, REGN-08 | unit | `npx vitest run src/engine/__tests__/regionLabels.test.ts src/components/HexMapV2/overlay/__tests__/labelCollision.test.ts` | ❌ W0 | ⬜ pending |
| 04-03-02 | 03 | 3 | GRID-02 | unit | `npx vitest run src/engine/__tests__/regionLabels.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/regionDetection.test.ts` — stubs for REGN-01, REGN-02, REGN-03
- [ ] `src/engine/__tests__/regionPolitical.test.ts` — stubs for REGN-04
- [ ] `src/components/HexMapV2/scene/__tests__/BorderMesh.test.ts` — stubs for REGN-05, REGN-09
- [ ] `src/engine/__tests__/regionLabels.test.ts` — stubs for REGN-07, REGN-08, GRID-02
- [ ] `src/components/HexMapV2/overlay/__tests__/labelCollision.test.ts` — stubs for REGN-08

*Existing vitest infrastructure covers framework needs. Only test stubs needed.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Geographic features have NO border lines | REGN-06 | Visual absence check | Inspect rendered map at regional zoom — no polylines around geographic features (forests, mountain ranges). Only political borders render as red lines. |
| Labels do not overlap each other | REGN-08 | Visual layout correctness | Pan across map at continental zoom — verify no label text intersects another label. |
| Capital red dots distinguishable at regional zoom | REGN-09 | Visual contrast check | Zoom to regional level — capitals must be clearly visible red dots against any underlying terrain color. |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
