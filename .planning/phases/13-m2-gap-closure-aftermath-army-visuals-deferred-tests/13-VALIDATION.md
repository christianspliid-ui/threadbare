---
phase: 13
slug: m2-gap-closure-aftermath-army-visuals-deferred-tests
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 13 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 13-01-01 | 01 | 1 | Aftermath sphere pressure | unit | `npx vitest run src/engine/__tests__/battleAftermath.test.ts` | ✅ | ⬜ pending |
| 13-01-02 | 01 | 1 | Aftermath refugee trace | unit | `npx vitest run src/engine/__tests__/battleAftermath.test.ts` | ✅ | ⬜ pending |
| 13-02-01 | 02 | 1 | hasThreadToBattle | unit | `npx vitest run src/engine/__tests__/battleThreadVisibility.test.ts` | ✅ (.todo) | ⬜ pending |
| 13-02-02 | 02 | 1 | selectSpotlight | unit | `npx vitest run src/engine/__tests__/battleThreadVisibility.test.ts` | ✅ (.todo) | ⬜ pending |
| 13-03-01 | 03 | 1 | generateRegionalEncounters | unit | `npx vitest run src/engine/__tests__/siegeRegionalEncounters.test.ts` | ✅ (.todo) | ⬜ pending |
| 13-04-01 | 04 | 2 | Army sprite mesh | manual+console | browser: `?view=game` check canvas | ❌ new | ⬜ pending |
| 13-04-02 | 04 | 2 | Battle indicator mesh | manual+console | browser: `?view=game` check canvas | ❌ new | ⬜ pending |
| 13-04-03 | 04 | 2 | Siege indicator mesh | manual+console | browser: `?view=game` check canvas | ❌ new | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. The 13 .todo tests already exist with function contracts defined.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Army shields visible on map | Army visuals | Three.js WebGL canvas not inspectable by Playwright | Use Claude in Chrome: navigate to `?view=game`, tick until armies spawn, zoom to army hex, screenshot |
| Battle crossed-swords icon | Battle indicators | WebGL rendering | Same as above — trigger battle via tick advancement |
| Siege ring around settlement | Siege indicators | WebGL rendering | Same as above — trigger siege via tick advancement |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
