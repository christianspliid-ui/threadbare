---
phase: 12
slug: flesh-reach-migration-to-quintessence
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-29
---

# Phase 12 — Validation Strategy

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
| 12-01-01 | 01 | 1 | Type system 9→8 | unit | `npm test -- --grep "ReachDomain"` | ✅ | ⬜ pending |
| 12-01-02 | 01 | 1 | ValuePair 10→9 | unit | `npm test -- --grep "ValuePair"` | ✅ | ⬜ pending |
| 12-02-01 | 02 | 1 | Mechanical propagation | unit+integration | `npm test` | ✅ | ⬜ pending |
| 12-03-01 | 03 | 2 | Content rewrite | unit | `npm test -- --grep "content"` | ✅ | ⬜ pending |
| 12-04-01 | 04 | 2 | Quintessence runtime | unit | `npm test -- --grep "quintessence"` | ❌ W0 | ⬜ pending |
| 12-05-01 | 05 | 3 | UI grid 2×4 | unit | `npm test -- --grep "AgentDetail"` | ✅ | ⬜ pending |
| 12-06-01 | 06 | 3 | Archetype epithets | unit | `npm test -- --grep "archetype"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Quintessence unit tests — stubs for erosion, recovery, zero-state, lexicon mapping
- [ ] Archetype epithet tests — stubs for threshold, hybrid naming, knowledge gating

*Existing test infrastructure covers type system, mechanical propagation, content, and UI grid tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Reach color contrast on dark background | Color adoption | Visual assessment | Preview AgentDetailPanel, verify badge text readable on Threadbare dark |
| Quintessence IPK prose display | IPK integration | WebGL + prose rendering | Use CLI `agent <name>` to verify quintessence level text, browser for IPK hover |
| Archetype epithet in meeting encounter | Epithet framing | Narrative prose quality | Run CLI `tick 50`, check `encounters` for archetype-framed meeting text |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
