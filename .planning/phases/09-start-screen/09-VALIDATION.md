---
phase: 9
slug: start-screen
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 9 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
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
| 09-01-01 | 01 | 1 | SC-1 (start screen renders) | component | `npx vitest run src/components/StartPage` | ❌ W0 | ⬜ pending |
| 09-01-02 | 01 | 1 | SC-4 (audio hook) | unit | `npx vitest run src/components/StartPage/useThemeMusic.test.ts` | ❌ W0 | ⬜ pending |
| 09-02-01 | 02 | 1 | SC-2 (transition to worldgen) | integration | `npx vitest run src/App.test.tsx` | ❌ W0 | ⬜ pending |
| 09-02-02 | 02 | 1 | SC-3 (dev shortcuts bypass) | integration | `npx vitest run src/App.test.tsx` | ❌ W0 | ⬜ pending |
| 09-03-01 | 03 | 1 | SC-5 (settings modal) | component | `npx vitest run src/components/StartPage` | ❌ W0 | ⬜ pending |
| 09-03-02 | 03 | 1 | SC-5 (credits modal) | component | `npx vitest run src/components/StartPage` | ❌ W0 | ⬜ pending |
| 09-04-01 | 04 | 1 | SC-6 (graceful degradation) | unit | `npx vitest run src/components/StartPage` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/components/StartPage/__tests__/StartPage.test.tsx` — component render tests (SC-1, SC-5, SC-6)
- [ ] `src/components/StartPage/__tests__/useThemeMusic.test.ts` — audio hook tests (SC-4)
- [ ] `src/__tests__/App.test.tsx` — integration tests for phase transitions and dev shortcuts (SC-2, SC-3)

*Existing vitest infrastructure covers framework needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Title art visual quality | SC-1 | Subjective visual assessment | Open game at root URL, verify title-screen.png renders as full-bleed background |
| Audio playback on interaction | SC-4 | Browser autoplay policy requires real user gesture | Click anywhere on start screen, verify ambient audio begins |
| Fade transition smoothness | SC-2 | CSS animation timing is visual | Click "New World", verify 600ms fade-out looks smooth |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
