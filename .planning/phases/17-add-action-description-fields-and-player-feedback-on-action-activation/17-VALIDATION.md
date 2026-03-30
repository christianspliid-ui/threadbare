---
phase: 17
slug: add-action-description-fields-and-player-feedback-on-action-activation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 17 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 17-01-01 | 01 | 1 | Type model | unit | `npx vitest run src/data/__tests__/unified-action-templates.test.ts` | ✅ | ⬜ pending |
| 17-01-02 | 01 | 1 | Template migration | unit | `npx vitest run src/data/__tests__/unified-action-templates.test.ts` | ✅ | ⬜ pending |
| 17-02-01 | 02 | 1 | Card layout | unit | `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx` | ✅ | ⬜ pending |
| 17-02-02 | 02 | 1 | Card feedback | unit | `npx vitest run src/components/Game/__tests__/ActionCard-feedback.test.tsx` | ✅ | ⬜ pending |
| 17-03-01 | 03 | 2 | Audio feedback | unit | `npx vitest run src/components/Game/__tests__/useInterventionAudio.test.tsx` | ✅ | ⬜ pending |
| 17-03-02 | 03 | 2 | Toast feedback | unit | `npx vitest run src/components/Game/__tests__/ToastStack.test.tsx` | ✅ | ⬜ pending |
| 17-04-01 | 04 | 2 | Particle system | visual | Manual — WebGL particles | ❌ W0 | ⬜ pending |
| 17-05-01 | 05 | 3 | Content: spell names | unit | `npx vitest run src/data/__tests__/action-template-content.test.ts` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers all phase requirements. Test files already exist for ActionCard, unified-action-templates, ToastStack, and useInterventionAudio.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Particle burst at target hex | Visual feedback | WebGL particles can't be snapshot-tested | Activate action in browser, confirm sphere-colored sparks appear at target hex |
| Card art placeholder rendering | Card layout | Visual appearance | Focus a card, confirm gradient/sigil placeholder in art frame |
| Audio plays on action activation | Audio feedback | Browser audio API | Activate action, confirm sphere-tuned tone plays |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
