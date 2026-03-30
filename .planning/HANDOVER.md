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

### TB-077 Layers 2-3 — Goal Edge + Active Encounter Projection (deferred)

**Context:** All 4 sub-phases of Layer 1 complete. Layers 2 (goal edge replacing `movementState.targetEncounterId`) and 3 (active encounters as transient graph nodes) are deferred until UnifiedAction migration settles.

**Design doc:** `Docs/plans/2026-03-29-graph-native-encounter-lifecycle-design.md` — see Decisions 3 and 4.

---

### 2026-03-29: TB-073 Conflict & Destruction — 📐▶ READY FOR IMPLEMENTATION PLANNING

**Context:** Cowork brainstorm session produced comprehensive narrative-first design for M2 Conflict & Destruction. Covers army entities, battle/siege resolution, destruction/aftermath, UI/visibility. Malazan-inspired: gods influence wars through proxies, not direct command.

**Key design decisions:**
- Armies are `actor` graph nodes (no new node type) with `ArmyState` property bag — only internal data (size, quintessence, objective, maintenance). All relationships are graph edges
- New edge types: `commanded_by` (army → commander agent), `participates_in` (army/agent → battle node)
- **Battles are graph nodes** — `located_at` a hex, connected to armies via `participates_in` edges. Agents and factions discover battles through normal graph traversal → emergent convergence (assassin sees battle, paths toward it to kill enemy commander)
- Spotlights are regular child encounters using existing intervention system; POV determined by player's threads
- Army vitality = Quintessence score that silently degrades; threshold crossings spawn encounters (supply crisis, desertion, mutiny, disbandment)
- **Size/modifier model**: warband ~100, regiment ~1k, host ~10k. Situational multipliers (prepared defense 3:1, siege walls 10-30:1, tactical brilliance up to 20:1). Initial battle momentum offset from effective size comparison
- Destruction scales with battle outcome (minor/major/total)
- **IPK keywords** used extensively in battle prose to communicate size, fortification, tactical state, divine intervention
- Prerequisite: **mercenary company vertical slice** (second faction after adventuring guild) with evolving autonomy (hired → autonomous warlord state). NOT a general-purpose faction ambition system

**What Cowork created:**
- `Docs/plans/2026-03-29-conflict-and-destruction-design.md` — Full design doc with NFP compliance, constants tables, trace schemas, fail-soft tables, wiring section. **Reviewed and revised** with user on 2026-03-29
- Obsidian `TheFantasyWorldSimulator/Brainstorms/brainstorm-conflict-and-destruction.md` — Comprehensive brainstorm with content requirements inventory (6 encounter template tables)
- Updated `BACKLOG.md` — TB-073 promoted to 📐 with design doc link
- Updated `ROADMAP.md` — M2.1–M2.4 marked design complete
- **Added CLAUDE.md guardrail**: "Relationships between entities are graph edges, not property fields" — under Load-Bearing Architectural Decisions

**Action for Claude Code — WRITE IMPLEMENTATION PLANS, THEN CODE:**

All dependencies are met (TB-072 ✅, Faction ✅, Encounters ✅, HexMapV2 ✅, Movement ✅). Design doc is reviewed and approved. Write implementation plans and begin coding.

**Recommended plan sequence (7 plans):**

1. **M2-01**: Mercenary Company faction vertical slice + faction ambition system. New `FactionDefinition` for merc company. Faction ambition types as `ambition` graph nodes via `pursues` edges. Evolving autonomy model (hired → autonomous). Test: faction develops ambitions through encounters.
2. **M2-02**: Army entity creation. `ArmyState` on `actor` nodes. `commanded_by` edge type. `member_of` edge army→faction. Army spawn encounter gated by Iron + Gold capability. Test: faction raises army through encounter system.
3. **M2-03**: Army movement + Quintessence attrition. Modified pathfinding costs for armies. Per-tick Quintessence degradation (terrain, road, funding). Threshold encounters (supply crisis, desertion, mutiny, disbandment). Test: army marches, degrades, threshold encounters fire.
4. **M2-04**: Battle node + size/modifier model + spotlight encounters. Battle as graph node with `BattleState`, `located_at` hex, `participates_in` edges. Initial momentum from size/modifier calculation. Spotlight child encounters with existing intervention system. IPK keywords in battle prose. Test: two armies meet, battle node created, spotlights fire, momentum resolves.
5. **M2-05**: Siege variant. `battleType: 'siege'` pacing (slow → accelerating → crescendo). Siege as regional encounter generator (call for aid, smuggle supplies, negotiate terms). Fortification multipliers. Test: army besieges settlement, pacing accelerates, regional encounters spawn.
6. **M2-06**: Destruction + aftermath. Scaled destruction (minor/major/total). Sphere pressure flooding. Graph mutations (sublocations destroyed, trade routes severed, settlement tier downgrade, ruins). Commander fate. Refugee encounters. Test: battle resolves, destruction applied, aftermath ripples.
7. **M2-07**: UI + visibility. Army sprites on HexMapV2. Battle modal (background prose + spotlight + aftermath). Thread-based notification tiers. Debug panel "Armies" tab. Integration smoke test. Test: full cycle visible in game view.

**Critical architectural decisions (non-negotiable):**
- Battles are **graph nodes**, not persistent encounters. `located_at` a hex, connected via `participates_in` edges. Agents converge emergently.
- All relationships are **graph edges**, not property fields. `commanded_by`, `member_of`, `participates_in` — not string IDs in property bags. See new CLAUDE.md guardrail.
- `ArmyState` contains only internal data (size, headcount, quintessence, objective, maintenance). No relationship fields.
- Battle prose uses **IPK keywords** extensively for mechanical state (size, fortification, tactics, divine intervention).
- No new orchestrator phase. Battles processed within existing encounter phase.

**Content requirements:** See Obsidian brainstorm → Content Requirements Inventory section for 6 encounter template tables that must be authored during implementation.
**M2.5 (Monsters/TB-051):** Not covered — needs separate brainstorm before implementation.

---

### 2026-03-29: TB-074 — Encounter Tuning Sessions 2-4 (remaining)

**Context:** Session 1 complete (Phase A + E.2 + E.1). Three sessions remain.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`

**Remaining sessions:**
- [x] **Session 2 (scoring overhaul):** ✅ Complete — B.1 familiarity discount, B.2 exploration bonus, B.3 travel cost dampening, D.1 personality amplification. Commit `8b15f53`.
- [ ] **Session 3 (spawn + progression):** Phase D.2 (born-later spawn at content locations) + C.1 (difficulty tier escalation — early/mid/late based on tick thresholds, applied during cache rebuild).
- [ ] **Session 4 (encounter chains):** Phase C.2 — `EncounterChain` data type, `chainProgress` agent property, wire into `filterByPrerequisites` (Stage 3 placeholder), 3 starter chains.

**Verification:** After each session, export encounter logs and run the `agent-analyser` skill. Baseline in `agent-analyser/references/baseline-seed42.md`.

---

## Completed

- ✅ **TB-078** — AscendantSheet QA Fixes. All 4 bugs (tooltip z-index, sphere.order, ProseKeyword, close button), 3 a11y fixes (aria-label, semantic lists, tooltip portal), and 5 improvements (essence bars, threads prose, archetype title, stagger animation, cycle metadata) verified complete 2026-03-30.
- ✅ **TB-077 Layer 1 (all 4 sub-phases)** — Event nodes, graph queries, prose resolvers, debug visibility. 14 tests. Complete 2026-03-30.

> Older entries archived to `HANDOVER_HISTORY.md` on 2026-03-30.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               