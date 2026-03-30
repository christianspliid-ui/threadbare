---
phase: 18
slug: wire-mercenary-company-seeding-and-encounters-into-the-runtime-pipeline
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-30
---

# Phase 18 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest |
| **Config file** | `vitest.config.ts` |
| **Quick run command** | `npm test -- --reporter=dot` |
| **Full suite command** | `npm test` |
| **Estimated runtime** | ~45 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm test -- --reporter=dot`
- **After every plan wave:** Run `npm test`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 45 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 18-01-01 | 01 | 1 | Two-company seeding via generic path | unit | `npm test -- factionSeeding` | ✅ (extend) | ⬜ pending |
| 18-01-02 | 01 | 1 | Distance constraint | unit | `npm test -- factionSeeding` | ✅ (extend) | ⬜ pending |
| 18-01-03 | 01 | 1 | factionDefId key fix | unit | `npm test -- factionAmbitions` | ✅ (update) | ⬜ pending |
| 18-01-04 | 01 | 1 | Static ambition seeding | unit | `npm test -- factionAmbitions` | ✅ (extend) | ⬜ pending |
| 18-01-05 | 01 | 1 | Army at seed | unit | `npm test -- factionSeeding` | ✅ (extend) | ⬜ pending |
| 18-02-01 | 02 | 2 | mc.* quest candidates | unit | `npm test -- factionQuestGeneration` | ❌ W0 | ⬜ pending |
| 18-02-02 | 02 | 2 | mc.join lifecycle | unit | `npm test -- factionQuestGeneration` | ❌ W0 | ⬜ pending |
| 18-02-03 | 02 | 2 | Rank-gated filtering | unit | `npm test -- factionQuestGeneration` | ❌ W0 | ⬜ pending |
| 18-02-04 | 02 | 2 | Reputation via mc encounter | unit | `npm test -- factionQuestGeneration` | ❌ W0 | ⬜ pending |
| 18-02-05 | 02 | 2 | Promotion trigger | unit | `npm test -- factionQuestGeneration` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/engine/__tests__/factionQuestGeneration.test.ts` — new file for mc.* quest candidate generation, rank-gated filtering, join lifecycle, promotion trigger, reputation-via-encounter
- No framework gaps — vitest already installed and configured

*Existing infrastructure covers most phase requirements. Only factionQuestGeneration tests are new.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Two armies visible on hex map | Army at seed | WebGL canvas not inspectable by automated tests | Run `?view=game`, verify 2 army markers at distant settlements |
| mc.join offered at hall location | mc.join lifecycle | Requires full game UI flow | Move avatar to merc hall, check encounter offers |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 45s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
