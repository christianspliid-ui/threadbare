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

### 2026-03-29: Wire SoulCard into HexChronicle — verify on main

**Context:** The `SoulCard` component was imported but never rendered in HexChronicle's "The Soul" layer. Cowork session wrote the fix (commit `546b99d`): added a "Souls Present" subsection rendering each agent as a `SoulCard` with sphere color, archetype, prose, and click handler. Test updated to handle agent name appearing in both Soul and Places layers. Types clean, all 14 HexChronicle tests pass.

**Action for Claude Code:**
- [ ] **Verify commit is on main:** `git log --oneline -3` — confirm `546b99d` "Wire SoulCard rendering into HexChronicle Soul layer" is on `main`. If not, cherry-pick or rebase.
- [ ] **Push to GitHub:** `git push` (Cowork sandbox couldn't authenticate). This triggers Vercel deploy.
- [ ] **Run full test suite:** `npm test` — confirm no regressions beyond HexChronicle.
- [ ] **Visual verify:** Open `?view=game`, click a hex with agents, confirm "Souls Present" section appears in The Soul layer with SoulCards. Check all three zoom tiers.
- [ ] **Update docs:** Mark complete in BACKLOG if there's a related item; append to `Docs/changelog.md`.

**Files changed:**
- `src/components/Game/HexChronicle.tsx` — added `locationNameById` memo + SoulCard rendering in Soul layer
- `src/components/Game/__tests__/HexChronicle.test.tsx` — `getByText` → `getAllByText` for agent name

---

### 2026-03-29: TB-074 — Encounter Tuning & Agent Variety (📐▶ ready for dev)

**Context:** Encounter log analysis (seed 42, 210 ticks, 16 agents) revealed 7 root causes of broken agent behavior: 31% active rate, 0 movement, 85%+ idle, content deserts, no difficulty escalation, born-later starvation. Full design plan written with 5 phases and NFP compliance.

**Design doc:** `Docs/plans/2026-03-29-encounter-tuning-and-agent-variety-design.md`

**Recommended session grouping:**

- [ ] **Session 1 (highest impact, low risk):** Phase A (broaden template locationTypes to ≥8 per location type) + Phase E.2 (score display fix: `.toFixed(4)` in encounterLogExporter) + Phase E.1 (dynamic cooldowns scaled by pool size). After completing: export logs, run `agent-analyser` skill, compare to baseline.
- [ ] **Session 2 (scoring overhaul):** Phase B.1 (familiarity discount — new `familiarityRecord` agent property + scoring penalty) + B.2 (exploration bonus — new `explorationRecord` agent property + additive bonus) + B.3 (travel cost dampening — `TRAVEL_COST_WEIGHT = 0.5`) + D.1 (personality amplification — `PERSONALITY_SCORE_EXPONENT = 1.5`).
- [ ] **Session 3 (spawn + progression):** Phase D.2 (born-later spawn at content locations) + C.1 (difficulty tier escalation — early/mid/late based on tick thresholds, applied during cache rebuild).
- [ ] **Session 4 (encounter chains):** Phase C.2 — `EncounterChain` data type, `chainProgress` agent property, wire into `filterByPrerequisites` (Stage 3 placeholder), 3 starter chains.

**Key files to modify:**
- `src/data/encounter-content.ts` — expand locationTypes arrays (Phase A)
- `src/data/agent-behavior-constants.ts` — 15 new constants, 4 modified
- `src/engine/encounterScoring.ts` — familiarity, exploration, travel cost, personality
- `src/engine/phaseAgentDecision.ts` — dynamic cooldowns
- `src/engine/encounterFilterPipeline.ts` — chain prerequisites in Stage 3
- `src/engine/encounterCache.ts` — difficulty tier multiplier in rebuild
- `src/engine/encounterLogExporter.ts` — score display fix

**Verification:** After each session, export encounter logs and run the `agent-analyser` skill (new skill in `.claude/skills/agent-analyser/`). Baseline reference in `agent-analyser/references/baseline-seed42.md`.

---

### 2026-03-29: Weekly hygiene sweep — items for Claude Code

**Context:** Automated weekly hygiene sweep identified stale handover entries, a loose file, duplicate skills, and documentation fixes.

**What Cowork already did:**
- Fixed ROADMAP.md Gap G: "in progress" → "✅ complete (2026-03-29)"
- Fixed `Docs/documentation-ownership.md`: corrected STATE.md description (was described as manually-maintained session doc, actually machine-generated GSD executor state)

**Action for Claude Code:**
- [ ] **Archive completed HANDOVER entries:** All active entries below this one dated 2026-03-28 and 2026-03-27 are ✅ in BACKLOG. Move them to the "Completed" section. The 2026-03-28 deploy entry (landing page + product strategy) may still have unchecked file staging — verify those files are committed before archiving.
- [ ] **Delete loose file:** `rm -f image-generation.skill` at repo root (orphan from a plugin build session)
- [ ] **Remove duplicate Obsidian skills:** Delete `.claude/skills/defuddle/`, `.claude/skills/json-canvas/`, `.claude/skills/obsidian-bases/`, `.claude/skills/obsidian-cli/`, `.claude/skills/obsidian-markdown/` — these duplicate the Obsidian plugin skills in `.agents/skills/` and the plugin versions take precedence. (Cowork couldn't delete — files are read-only in sandbox.)
- [ ] **Commit Cowork doc fixes:** `git add .planning/ROADMAP.md Docs/documentation-ownership.md .planning/HANDOVER.md` and commit.
- [ ] **Run `/retrospective`:** 12 impediments logged, zero retrospectives ever run. Patterns worth addressing: VM corruption (#11 + 2026-03-27 event), GSD subagent missing-file commits (#4, 3 occurrences).

**Files changed by Cowork:** `.planning/ROADMAP.md`, `Docs/documentation-ownership.md`, `.planning/HANDOVER.md`, `.claude/skills/hexmap-developer/SKILL.md` (added InstancedMesh lesson #12), `Docs/cowork-ways-of-working.md` (added post-write integrity check), `Docs/impediments.md` (added retro note), `Docs/retrospectives/2026-03-29-retro.md` (new — first retrospective). All need committing.

---

## Completed

> Recent completions only. Full history in `HANDOVER_HISTORY.md`.
