---
phase: 5
slug: hex-composition-landscape-signifiers
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
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
| 05-01-01 | 01 | 1 | COMP-01 | unit | `npx vitest run src/engine/hex-composition` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | COMP-02 | unit | `npx vitest run src/engine/hex-composition` | ❌ W0 | ⬜ pending |
| 05-01-03 | 01 | 1 | COMP-03 | unit | `npx vitest run src/engine/hex-composition` | ❌ W0 | ⬜ pending |
| 05-01-04 | 01 | 1 | COMP-04 | unit | `npx vitest run src/engine/hex-composition` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 2 | LSIG-01 | visual | `npx vitest run src/components/HexMap` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 2 | LSIG-02 | unit | `npx vitest run src/components/HexMap` | ❌ W0 | ⬜ pending |
| 05-02-03 | 02 | 2 | LSIG-03 | unit | `npx vitest run src/components/HexMap` | ❌ W0 | ⬜ pending |
| 05-02-04 | 02 | 2 | LSIG-04 | visual | manual | N/A | ⬜ pending |
| 05-02-05 | 02 | 2 | LSIG-05 | visual | manual | N/A | ⬜ pending |
| 05-03-01 | 03 | 2 | LART-01..12 | visual | manual + `npx vitest run` | ❌ W0 | ⬜ pending |
| 05-04-01 | 04 | 2 | LART-13..30 | visual | manual + `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/hex-composition/__tests__/` — test stubs for composition system (COMP-01..04)
- [ ] `src/components/HexMap/__tests__/signifier-renderer.test.ts` — test stubs for rendering pipeline (LSIG-01..05)

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Silhouette visual quality | LSIG-04, LSIG-05 | Aesthetic judgment of hand-drawn style | Preview at 1920×1080, zoom to hex-level, verify dark silhouettes match Threadbare style |
| Adjacent hex variant diversity | LSIG-02 | Visual inspection of neighbor variation | Find 3+ adjacent same-terrain hexes, verify no identical signifiers |
| Organic jitter feel | LSIG-03 | Subjective hand-placed appearance | Pan across map, verify signifiers don't look grid-aligned |
| SVG asset quality per terrain | LART-01..30 | Artistic style compliance | Compare each terrain's signifier against STYLE.md silhouette guidelines |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
