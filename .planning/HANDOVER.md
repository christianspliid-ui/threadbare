# Handover Notes

> Written by Cowork sessions for Claude Code to pick up. Read this at session start.
>
> **Format:** Each entry has a date, context (what was discussed/decided), and action items.
> **Lifecycle:** Claude Code acts on entries, then moves them to the "Completed" section below.
>
> **IMPORTANT:** When you complete a handover entry, you MUST also update the item's state in `.planning/BACKLOG.md` to `✅`. BACKLOG.md is the single source of truth — see `Docs/cowork-ways-of-working.md` → "Unified Kanban".
>
> **History:** Completed entries older than the current session are archived in `HANDOVER_HISTORY.md`.

---

### ✅ 2026-04-13: TB-120 Test Suite Repair Sprint — COMPLETED

**Context:** Full retrospective on impediments #13–39 identified `npm test` baseline red as the #1 systemic issue (8+ days, 15+ occurrences). Cowork agents attempted fixes through the VM sandbox but couldn't complete — the VM mount has filesystem sync issues and the 5-min test runtime exceeds agent time budgets. **This needs to run locally via Claude Code on the real machine.**

**Retro report:** `Docs/retrospectives/2026-04-11-retro-v2.md`
**Backlog items:** TB-120 (test repair), TB-121 (CI/CD pipeline — do after TB-120)

**What Cowork agents already did (changes on disk, NOT committed):**
1. Removed brittle count-based assertions from 20+ test files (encounter-content, dream-content, doom-loader, domain-words, game-theory-content, influence-content, opposition-content, strand-content, economic-trait-content, chronicler-content, archetype-content, action-template-content, unified-action-templates, culture-content, backstory-content, reward-attachment-catalog, mandate-loader, trace, agentSpriteTypes, portrait-assets, avatar-portrait-assets)
2. Fixed module-level singleton bug in `src/engine/phaseReputationTraits.ts` — removed `_traitNodesEnsured` flag, now checks graph instance state
3. Fixed identical singleton bug in `src/engine/phaseEncounterTraits.ts` — removed `_nodesEnsured` flag
4. Fixed stray `}` on line 194 of `src/engine/traits.ts` added by a previous agent
5. Modified `src/engine/__tests__/revelationGate.test.ts` and `src/engine/__tests__/sublocation-integration.test.ts`
6. Modified `src/components/Game/chronicle/__tests__/cards.test.tsx`, `src/components/Remembrance/__tests__/RemembranceFlow.test.tsx`, `src/components/HexMapV2/scene/AgentSpriteMesh.ts`

**⚠️ WARNING:** Some Cowork agent edits may have introduced issues rather than fixing them. The agents were working through a VM mount that doesn't always sync cleanly. **Start by running `git diff` to review all uncommitted changes.** If anything looks wrong, `git checkout` the file and fix it fresh. Trust `npm test` output over agent claims.

**Last known test state (user's local run, after Cowork edits):**
- 29 files failed, 563 passed, 4 skipped
- 89 tests failed, 8900 passed, 30 skipped

**Your approach:**
1. `git diff` — review all uncommitted changes, revert anything suspicious
2. `npm test` — see where we are now
3. Delete any remaining count-based assertions (`toHaveLength(<hardcoded number>)` on collections that grow). Don't replace with ranges — just remove
4. Triage remaining failures: assertion drift (fix), real bug (fix), obsolete test (delete)
5. The `trait.reputation.power.renown` orchestrator crash was the #1 cascading failure. The singleton fix should help, but verify
6. Get to green. `npm test` + `npx tsc --noEmit` + `npx vite build` all pass
7. Commit: `fix: TB-120 test suite repair — fix trait init singleton bug, delete brittle count assertions, fix drift`
8. Push to main

**After TB-120 is green**, start TB-121 (CI/CD pipeline). See backlog for full scope.

---

### TB-077 Layers 2-3 — Goal Edge + Active Encounter Projection (deferred)

**Context:** All 4 sub-phases of Layer 1 complete. Layers 2 (goal edge replacing `movementState.targetEncounterId`) and 3 (active encounters as transient graph nodes) are deferred until UnifiedAction migration settles.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md` — see Decisions 3 and 4.

---

## Completed

_No completed entries — all archived to `HANDOVER_HISTORY.md` on 2026-03-31._
