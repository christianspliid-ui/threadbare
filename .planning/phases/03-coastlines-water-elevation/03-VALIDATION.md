---
phase: 3
slug: coastlines-water-elevation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-21
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vite.config.ts |
| **Quick run command** | `npm test -- --run` |
| **Full suite command** | `npm test -- --run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --run`
- **After every plan wave:** Run `npm test -- --run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 03-01-01 | 01 | 1 | WATR-01 | visual/unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | WATR-02 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | WATR-03 | visual/unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | WATR-04 | visual/unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | WATR-05 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | WATR-06 | visual/unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-03-01 | 03 | 2 | ELEV-01 | visual | manual | N/A | ⬜ pending |
| 03-03-02 | 03 | 2 | ELEV-02 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-03-03 | 03 | 2 | ELEV-03 | unit | `npm test -- --run` | ❌ W0 | ⬜ pending |
| 03-03-05 | 03 | 2 | GRID-01 | visual/unit | `npm test -- --run` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Coastline geometry unit tests (marching squares output validation)
- [ ] River mesh generation unit tests (quad strip vertex count, width scaling)
- [ ] Elevation tick mark generation unit tests (tick count per steepness)
- [ ] Water depth band classification unit tests

*Existing vitest infrastructure covers framework needs. No new dependencies.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Coastlines look organic visually | WATR-01/02 | Aesthetic judgment | Load ?view=hexv2, zoom to coastline, verify curves not hex-aligned |
| Elevation color readability | ELEV-01 | Visual perception | Load map, verify browns=high, greens=low without labels |
| Altitude labels readable | ELEV-04 | Text rendering quality | Zoom to hero-local, verify peak labels render clearly |
| Grid lines non-obtrusive | GRID-01 | Visual balance | Zoom to regional, verify grid visible but terrain dominant |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
