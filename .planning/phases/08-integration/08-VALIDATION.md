---
phase: 8
slug: integration
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-22
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npm test -- --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 08-01-01 | 01 | 1 | INTG-01 | integration | `npm test -- src/components/GameView` | ✅ | ⬜ pending |
| 08-01-02 | 01 | 1 | INTG-02 | integration | `npm test -- src/components/GameView` | ✅ | ⬜ pending |
| 08-01-03 | 01 | 1 | INTG-03 | unit | `npm test -- src/components/GameView` | ✅ | ⬜ pending |
| 08-01-04 | 01 | 1 | INTG-04 | integration | `npm test -- src/components/GameView` | ✅ | ⬜ pending |
| 08-02-01 | 02 | 2 | WGEN-14 | unit | `npm test -- src/engine/worldgen` | ✅ | ⬜ pending |
| 08-02-02 | 02 | 2 | INTG-05 | integration | `npm test -- src/components` | ✅ | ⬜ pending |
| 08-02-03 | 02 | 2 | INTG-06 | regression | `npm test` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*Existing infrastructure covers all phase requirements.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| WebGL hex map renders correctly at 1920×1080 | INTG-01 | WebGL canvas not inspectable via jsdom | Use Claude in Chrome: navigate to ?view=game, screenshot, verify hex map visible |
| Click hex → chronicle opens | INTG-02 | Requires visual canvas + React interaction | Use Claude in Chrome: click hex, verify chronicle panel appears |
| Agent/location dots visible on map | INTG-03 | WebGL visual verification | Use Claude in Chrome: screenshot, verify dots on map |
| Fog toggle works | INTG-04 | WebGL visual state change | Use Claude in Chrome: toggle fog in debug panel, screenshot before/after |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
