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

### 2026-03-29: TB-073 Conflict & Destruction — Full Design Document Ready

**Context:** Cowork brainstorm session produced comprehensive narrative-first design for M2 Conflict & Destruction. Covers army entities, battle/siege resolution, destruction/aftermath, UI/visibility. Malazan-inspired: gods influence wars through proxies, not direct command.

**Key design decisions:**
- Armies are `actor` graph nodes (no new node type) with `ArmyState` property bag
- Armies are faction-level agents in the encounter system — no separate war system
- Battles are **persistent encounters** (multi-tick encounters within existing encounter phase) — no new orchestrator phase
- Spotlights are regular child encounters using existing intervention system
- Spotlight POV determined by player's threads
- Army vitality = Quintessence score that silently degrades; threshold crossings spawn encounters
- Destruction scales with battle outcome (minor/major/total)
- Prerequisite: faction ambition system (extension of agent ambition to factions)

**What Cowork created:**
- `Docs/plans/2026-03-29-conflict-and-destruction-design.md` — Full design doc with NFP compliance, constants tables, trace schemas, fail-soft tables, wiring section
- Obsidian `TheFantasyWorldSimulator/Brainstorms/brainstorm-conflict-and-destruction.md` — Comprehensive brainstorm with content requirements inventory (6 encounter template tables)
- Updated `BACKLOG.md` — TB-073 promoted to 📐 with design doc link
- Updated `ROADMAP.md` — M2.1–M2.4 marked design complete

**Action for Claude Code:**
- No immediate implementation needed — TB-072 (sphere affinity) and Phase 11 (character sheet) are current priorities
- When M2 implementation begins, start with **Phase 0: Faction Ambition System** — this is a prerequisite for everything else
- Note Quintessence (TB-075) dependency — army attrition model uses Quintessence as vitality score. If TB-075 isn't built yet, use an interim vitality score
- M2.5 (Monster Encounters / TB-051) still needs separate brainstorm — not covered by this design

---

### 2026-03-29: TB-074 — Encounter Tuning Sessions 2-4 (remaining)

**Context:** Session 1 complete (Phase A + E.2 + E.1). Three sessions remain.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`

**Remaining sessions:**
- [ ] **Session 2 (scoring overhaul):** Phase B.1 (familiarity discount — new `familiarityRecord` agent property + scoring penalty) + B.2 (exploration bonus — new `explorationRecord` agent property + additive bonus) + B.3 (travel cost dampening — `TRAVEL_COST_WEIGHT = 0.5`) + D.1 (personality amplification — `PERSONALITY_SCORE_EXPONENT = 1.5`).
- [ ] **Session 3 (spawn + progression):** Phase D.2 (born-later spawn at content locations) + C.1 (difficulty tier escalation — early/mid/late based on tick thresholds, applied during cache rebuild).
- [ ] **Session 4 (encounter chains):** Phase C.2 — `EncounterChain` data type, `chainProgress` agent property, wire into `filterByPrerequisites` (Stage 3 placeholder), 3 starter chains.

**Verification:** After each session, export encounter logs and run the `agent-analyser` skill. Baseline in `agent-analyser/references/baseline-seed42.md`.

---

## Completed

> Recent completions only. Full history in `HANDOVER_HISTORY.md`.

### 2026-03-29: TB-074 Session 1 — Template coverage + score display + dynamic cooldowns ✅
- Phase A: expanded locationTypes on 15 templates — all location types ≥8 matching templates
- Phase E.2: score display .toFixed(2)→.toFixed(4), added desireMultiplier to DECIDE events
- Phase E.1: dynamic cooldowns getEffectiveCooldown() + base 8→6 + COOLDOWN_FULL_POOL_SIZE=15 + COOLDOWN_MINIMUM=2

### 2026-03-29: Wire SoulCard into HexChronicle ✅
Verified on main, pushed, tests pass. Commit `546b99d`.

### 2026-03-29: Ways-of-working overhaul + weekly hygiene ✅
Cowork docs committed (57ce692), duplicate skills deleted, loose files cleaned, test failures fixed (c8c0676).
