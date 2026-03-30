---
phase: 16
slug: expand-retinue-sidebar-threads-area
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 16 — Validation Strategy

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
| 16-01-01 | 01 | 1 | Engine thread queries | unit | `npx vitest run src/engine/__tests__/retinue.test.ts` | ✅ | ⬜ pending |
| 16-01-02 | 01 | 1 | Thread node categorization | unit | `npx vitest run src/engine/__tests__/retinue.test.ts` | ❌ W0 | ⬜ pending |
| 16-02-01 | 02 | 1 | ThreadsPanel rendering | unit | `npx vitest run src/components/Game/__tests__/RetinuePanel.test.tsx` | ✅ | ⬜ pending |
| 16-02-02 | 02 | 1 | Quick detail view positioning | unit | `npx vitest run src/components/Game/__tests__/AgentInfoCard.test.tsx` | ✅ | ⬜ pending |
| 16-03-01 | 03 | 2 | Thread creation actions | unit | `npx vitest run src/engine/__tests__/targetActions.test.ts` | ✅ | ⬜ pending |
| 16-04-01 | 04 | 2 | Stub profile modals | unit | TBD | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] New test stubs for thread node categorization (getThreadedNodes or equivalent)
- [ ] New test stubs for stub profile modals (LocationProfileModal, FactionSheet, ArmySheet, ArtifactSheet)

*Existing infrastructure covers framework and fixture needs.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Detail view positioning | Floats left of sidebar, no overlap | CSS layout verification | Open Threads panel, click any entry, verify detail view appears left of sidebar at 1920x1080 |
| Compact row height | ~25% of current agent card | Visual measurement | Compare old vs new row heights in browser |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
