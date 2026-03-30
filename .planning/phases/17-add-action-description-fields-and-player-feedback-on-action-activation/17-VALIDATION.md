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
| 17-01-01 | 01 | 1 | PH17-01 type extension | unit | `npx vitest run src/engine/__tests__/targetActions.test.ts` | Yes | pending |
| 17-01-02 | 01 | 1 | PH17-02 slot wiring | unit | `npx vitest run src/engine/__tests__/targetActions.test.ts` | Yes | pending |
| 17-02-01 | 02 | 2 | PH17-03 content (CRUD) | unit | `npx vitest run src/data/__tests__/unified-action-templates.test.ts` | Yes | pending |
| 17-02-02 | 02 | 2 | PH17-03 content (divine+encounter) | unit | `npx vitest run src/data/__tests__/unified-action-templates.test.ts` | Yes | pending |
| 17-03-01 | 03 | 3 | PH17-04 MTG layout | unit | `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx` | Yes | pending |
| 17-03-02 | 03 | 3 | PH17-05 hand art-only | unit | `npx vitest run src/components/Game/__tests__/ActionCard.test.tsx` | Yes | pending |
| 17-03-03 | 03 | 3 | PH17-04/05 glow burst | unit | `npx vitest run src/components/Game/__tests__/ActionCard-feedback.test.tsx` | Yes | pending |
| 17-03-04 | 03 | 3 | PH17-06 feedback (audio+toast) | unit | `npx vitest run src/components/Game/__tests__/useAgentInteraction-effects.test.tsx` | Yes | pending |
| 17-04-01 | 04 | 4 | PH17-07 particle system | unit | `npx vitest run src/components/HexMapV2/scene/__tests__/ParticleBurstMesh.test.ts` | W0 | pending |
| 17-04-02 | 04 | 4 | PH17-07 particle wiring | visual | Manual — WebGL particles at target hex | N/A | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

Task 17-04-01 creates `ParticleBurstMesh.test.ts` as part of its implementation (test file created alongside module). All other test files already exist.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Particle burst at target hex | PH17-07 | WebGL particles can't be snapshot-tested | Activate action in browser, confirm sphere-colored sparks appear at target hex |
| Card art placeholder rendering | PH17-04 | Visual appearance | Focus a card, confirm gradient/sigil placeholder in art frame |
| Audio plays on action activation | PH17-06 | Browser audio API | Activate action, confirm sphere-tuned tone plays |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
