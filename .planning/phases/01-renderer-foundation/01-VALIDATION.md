---
phase: 1
slug: renderer-foundation
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-21
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vite.config.ts` (vitest inline config) |
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
| 01-01-T1 | 01 | 1 | TERR-01, TERR-02, TERR-03, TERR-04, TERR-05 | unit | `npx vitest run src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts` | Plan creates | ⬜ pending |
| 01-01-T2 | 01 | 1 | RNDR-01, RNDR-02, RNDR-06 | compile | `npx tsc --noEmit && npx vite build` | N/A (compile check) | ⬜ pending |
| 01-02-T1 | 02 | 2 | RNDR-04 | unit | `npx vitest run src/components/HexMapV2/camera/__tests__/D3ZoomCamera.test.ts` | Plan creates | ⬜ pending |
| 01-02-T2 | 02 | 2 | RNDR-03, RNDR-05 | unit | `npx vitest run src/components/HexMapV2/interaction/__tests__/HexRaycaster.test.ts` | Plan creates | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

All test files are created inline by the plan tasks that need them — no separate Wave 0 scaffolding required:

- [ ] `src/components/HexMapV2/palette/__tests__/terrainPalette.test.ts` — created by Plan 01 Task 1 (palette colors, water palette, color utils)
- [ ] `src/components/HexMapV2/camera/__tests__/D3ZoomCamera.test.ts` — created by Plan 02 Task 1 (syncCameraToZoom frustum math)
- [ ] `src/components/HexMapV2/interaction/__tests__/HexRaycaster.test.ts` — created by Plan 02 Task 2 (screenToHex bounds, round-trip)

*Existing infrastructure covers framework — vitest already installed and configured.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 60fps rendering at 60K hexes | RNDR-01 | GPU-dependent performance | Open `?view=hexv2`, open DevTools Performance tab, record 5s of pan/zoom, verify no frame > 16.7ms |
| Smooth camera pan/zoom feel | RNDR-03 | Subjective UX quality | Drag to pan, scroll to zoom, verify no jitter or lag at various zoom levels |
| Jump-to animation | RNDR-04 | Visual timing verification | Click sidebar agent, verify camera smoothly flies to target hex in ~500ms |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
