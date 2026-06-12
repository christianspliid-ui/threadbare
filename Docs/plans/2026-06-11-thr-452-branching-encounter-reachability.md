# Branching Encounter Reachability — Diagnostic Funnel + Curator Bias + Gate Audit

**Linear:** THR-452 · **Project:** Encounter Format Migration · **Date:** 2026-06-11 · **Author:** Cowork

## Problem

CLI evidence (2026-06-11, seed 42, 120 ticks): **0 of ~30 handcrafted branching encounters in `src/data/encounters/` fired**. All 109 observed encounters were ambient `encounter.*` templates. The game's richest content — courtyard duel, blinded oracle, shadow court audience, flawed steel, mentorship arc, executioner's commission, jury of the ruined, brink rescue, infiltrator's approach, letters of introduction, merchant's favor, oracle consulted, renowned duel, silent chamber, star pilgrim, stones judgement, unmarked crossing, veiled consultation, wandering healer shrine, warlord's tribute, soul ferryman, road ambush, pilgrim's offering, rival shrine betrayal — is unreachable in normal simulation.

**Hypothesis:** branching encounters' prerequisites (reputation tiers, hidden marks, intel, court position, custody/incarceration, faction alignment, mentor relationship, oath state, sublocation type, capability minima, ascended-action seeds) are never satisfied by ambient simulation, and nothing actively steers threaded agents toward maturing those preconditions.

**Caveat:** CLI runs have no bonded First / threads, so player-curation paths aren't exercised. The user reports the same impression in `?seeded` browser play, so the failure mode is real but its magnitude in threaded play is unmeasured. Phase A measures it.

## Strategy — Verify the noun before the verb

Per the issue's explicit instruction and CLAUDE.md's Debugging Protocol: **diagnose first using the eligibility funnel from THR-457, then fix per finding. Do not guess at fixes before the funnel data exists.**

This plan is therefore staged in two phases. Phase A is a measurement pass that produces a per-template blocking-gate report. Phase B is a fix toolkit — three named levers (soften, ladder, bias) that the implementer chooses among per-template based on the Phase A findings, not a deterministic recipe.

## Sequencing & dependencies

| Phase | Depends on | Can start when |
|---|---|---|
| A — Diagnostic pass | THR-457 funnel counters land on `main` | THR-457 merges |
| B — Fix per finding | Phase A report exists | Phase A audit committed to `Docs/audits/` |

The plan can be claimed as a single Linear issue and worked sequentially; the implementer should not start Phase B until Phase A produces evidence. If THR-457 has not merged when CC picks up THR-452, CC should bounce back to Cowork or work a different Ready-for-Dev item — do not stub the funnel.

## Phase A — Diagnostic pass

### Engine pillar (Phase A)

No new engine code in Phase A — only consumers of the funnel that THR-457 builds.

Add a new CLI subcommand `kpi:branching-audit` in `scripts/cli.ts` (existing switch-dispatch pattern from THR-457's `kpi` command):

- Runs N seeds × T ticks headless (defaults `BRANCHING_AUDIT_SEEDS = [42, 99, 7]`, `BRANCHING_AUDIT_TICKS = 180` — longer than the 120-tick baseline because branching encounters intentionally take longer to mature than ambient ones).
- Pulls the per-template eligibility funnel from `EligibilityFunnelCounters` (THR-457 Phase 2).
- Filters to templates whose category is `branching` (defined by template registry source/category field — not by id-prefix matching, per THR-457 §Phase 1).
- For each branching template that never reached `selected`, computes:
  - **Primary blocker:** the `prerequisite-type` with the highest `gatedBy` count across seeds.
  - **Considered/gated ratio:** how often the template was even a candidate.
  - **Distance-to-eligibility heuristic:** for the primary blocker, sample 5 agents nearest to satisfying it and report the gap (reputation delta, missing intel item, capability delta, etc.). The heuristic lives in a new `src/engine/kpi/branchingDistance.ts` and is per-prerequisite-type.

### Content pillar (Phase A)

Audit output written to `Docs/audits/2026-MM-DD-branching-encounter-reachability-audit.md`. Per template:

- Template id, file, scale, category
- Primary blocker (prerequisite type + value)
- Considered count, gated count, scored count, selected count (across seeds × ticks)
- Distance-to-eligibility samples (5 nearest agents, what they're missing)
- Suggested lever: `soften` | `ladder` | `bias` | `accept-as-rare` (the latter for genuinely climactic encounters that *should* be rare — e.g. shadow court audience)

This audit doc becomes the input to Phase B. It is also the artifact the creative director can scan to spot-check whether the gating intent matches the content intent.

### UI pillar (Phase A)

N/A — diagnostic phase produces an audit doc and CLI output only. No player-facing surface. (DebugPanel KPI tab from THR-457 already exists for live inspection.)

## Phase B — Fix toolkit

Three named levers. The implementer picks the appropriate one per finding from the Phase A audit. A given template may receive more than one (e.g. soften the reputation gate *and* add a curator bias).

### Lever 1 — Soften gate (Content + Engine)

**Content:** lower the gate value in the template file directly. Every gate value must remain a named constant or a clearly-commented inline literal — no magic numbers (NFP #1). Add a comment line above each softened gate: `// THR-452 retune: was X, lowered to Y because <blocker-name> never matured in audit`.

**Engine:** no logic change — gates are already data-driven via `EncounterPrerequisite`. Just verify that softened values still pass schema validation.

**Floor:** `BRANCHING_GATE_MIN_FLOOR = 1` (reputation tiers, capability tiers). Soften must never zero a gate — that destroys the gating intent. If audit suggests "remove gate entirely," that's an `accept-as-rare → promote-to-ambient` decision, not a soften.

### Lever 2 — Ladder gate (Content)

Add intermediate seeding encounters that mature the prerequisite. Example: if `the-courtyard-duel` requires `reputation:martial >= 3` but ambient simulation never lifts threaded agents past 2, author 2–3 ambient encounter templates that grant `+1 reputation:martial` on success and naturally seed for capable threaded agents.

This is pure content authoring under the existing `encounter-pipeline` skill. New ladder templates live alongside the branching encounter they unblock, named `<branching-id>-ladder-N.ts`. They are tagged `category: ambient-ladder` so the eligibility funnel can attribute upstream firings to the branching encounter they're maturing toward.

### Lever 3 — Curator bias (Engine + Content)

A new `src/engine/encounter/branchingCurator.ts` module that, during encounter scoring, gives a multiplicative score boost to branching templates that are **nearly eligible** for the current actor. "Nearly eligible" means: all prerequisites satisfied except one, and that one is within `BRANCHING_CURATOR_NUDGE_RADIUS` of satisfaction (e.g. reputation 2 when 3 required).

The boost only applies to **threaded agents** (agents with an active player thread). Ambient agents continue to roll normally — branching content is for the player's stories, not background noise.

Hook point: `src/engine/encounterScoring.ts`, after base score is computed, before final selection. Boost factor `BRANCHING_CURATOR_BIAS_WEIGHT` is multiplicative and gated by:

1. Agent has at least one thread edge
2. Template category is `branching`
3. Distance-to-eligibility ≤ `BRANCHING_CURATOR_NUDGE_RADIUS`
4. Template has not fired for this agent in the last `BRANCHING_CURATOR_COOLDOWN` ticks (avoid loops)

Emits a `BranchingCuratorNudgeTrace` on every boost — visible in the DebugPanel and aggregable by KPI.

### Lever 4 — Accept-as-rare (no code change)

Some branching encounters *should* be rare (shadow court audience, jury of the ruined — climactic). If Phase A finds 0 fires but the prerequisites match the narrative intent, the lever is "accept and document." Add a `expectedFireRate: 'climactic'` field to the template metadata (additive, NFP #6) and the KPI red-zone check excludes climactic templates from the branching-fire floor.

## Three-pillar summary

| Pillar | Phase A | Phase B |
|---|---|---|
| Engine | `kpi:branching-audit` CLI command, `branchingDistance.ts` heuristic | `branchingCurator.ts` module, scoring-hook integration, new trace type |
| Content | Audit doc enumerating each of ~30 templates | Per-template soften/ladder/accept-as-rare edits + new ladder templates |
| UI | N/A (audit doc + CLI output) | DebugPanel already shows KPI via THR-457; curator nudges visible in trace explorer |

## Constants (NFP #1)

| Constant | Default | Purpose |
|---|---|---|
| `BRANCHING_AUDIT_SEEDS` | `[42, 99, 7]` | Phase A diagnostic seeds |
| `BRANCHING_AUDIT_TICKS` | 180 | Phase A run length (60% longer than KPI baseline; branching matures slower) |
| `BRANCHING_GATE_MIN_FLOOR` | 1 | Soften must never zero a gate |
| `BRANCHING_CURATOR_NUDGE_RADIUS` | 1 | How close to eligibility before curator boosts (e.g. 1 reputation tier short) |
| `BRANCHING_CURATOR_BIAS_WEIGHT` | 1.75 | Multiplicative score boost for nearly-eligible branching templates |
| `BRANCHING_CURATOR_COOLDOWN` | 40 | Ticks before the same template re-boosts for the same agent |
| `BRANCHING_TARGET_FIRE_PER_30T` | 1 | Per threaded agent — matches `KPI_BRANCHING_FIRE_MIN_PER_30T` from THR-457 |
| `BRANCHING_NEARLY_ELIGIBLE_SAMPLE_SIZE` | 5 | Agents sampled for distance-to-eligibility in audit |

All in a new `src/engine/encounter/branchingConstants.ts`. Defaults are first-guess and will be retuned from Phase A evidence.

## Tracing (NFP #2)

```ts
export interface BranchingCuratorNudgeTrace extends BaseTrace {
  category: 'encounter';                   // existing category
  subcategory: 'branching-curator-nudge';  // new discriminant
  agentId: string;
  templateId: string;
  baseScore: number;
  boostedScore: number;
  distanceToEligibility: number;
  blockingPrerequisite: string;
}

export interface BranchingAuditEntryTrace extends BaseTrace {
  category: 'kpi';                         // reuses THR-457 'kpi' category
  subcategory: 'branching-audit';
  templateId: string;
  primaryBlocker: string;
  consideredCount: number;
  gatedCount: number;
  selectedCount: number;
}
```

The audit trace is only emitted during `kpi:branching-audit` runs (not per tick) — aggregate-time, not steady-state.

## Fail-soft (NFP #4)

| Failure | Behavior |
|---|---|
| THR-457 funnel not present (CC picks up Phase A early) | `kpi:branching-audit` prints a clear error and exits 2 — do not stub data |
| Template registry missing a branching template at audit time | Skip with `console.warn`, continue audit |
| Distance heuristic unsupported for a prerequisite type | Report `distance: 'unknown'`, suggested lever defaults to `soften` |
| Curator hook fires before threads exist (early-tick races) | Skip boost, no trace, no error |
| Softened gate violates schema validation | Build fails — content edits go through the same validator as authored content |
| Curator scoring throws | Catch at scoring boundary, fall back to base score, emit a `scoring_fallback` trace |

## Blast radius (Codesight pre-flight)

Phase B touches:

- `src/engine/encounterScoring.ts` — imported by ~25 files (medium impact). Curator hook is additive (one call after base score, no signature change).
- `src/engine/encounter/` (new module `branchingCurator.ts`) — net-new file, no importers yet.
- `src/types/trace.ts` — extends `TRACE_CATEGORIES` enum if `'kpi'` isn't already added by THR-457; new subcategory string is data, not a type change. **Low cascade risk** if `'kpi'` already exists from THR-457.
- `src/data/encounters/*.ts` — content edits only; each file is leaf, not imported by other content.
- No touch to high-impact files (`graph.ts` 370, `types/index.ts` 186, `gameState.ts` 176, `traits.ts` 156, `traceBuffer.ts` 106).

**Blast Radius section is not required** (no file with ≥100 importers touched).

## Wiring checklist (per `Docs/plans/wiring-checklist.md`)

- [ ] Orchestrator phase: curator is called from existing encounter-scoring phase — no new phase, no new orchestrator entry
- [ ] GameState fields: none added (counters live on `SimulationRuntime`, traces are ephemeral)
- [ ] Modal/panel render: KPI tab from THR-457 already renders the funnel; curator nudges appear in trace explorer
- [ ] Traces emitted: `BranchingCuratorNudgeTrace`, `BranchingAuditEntryTrace`
- [ ] Player controls: N/A (director tooling)
- [ ] Prose pipeline: N/A (mechanical/gating change, not content authoring)
- [ ] Constants registered in `src/engine/encounter/branchingConstants.ts`

## Rejected approaches

- ❌ **Lower all branching gates uniformly.** Destroys the gating intent; turns climactic encounters into common chatter. Use per-template audit-driven softening instead.
- ❌ **Hard-fire one branching encounter per threaded agent per N ticks.** Reduces curation to a quota; breaks the prerequisite contract. Curator bias respects the gates, only boosts the *nearly-eligible*.
- ❌ **Drop the prerequisite system in favor of pure scoring.** Prerequisites carry meaningful narrative information ("only fires if agent has been marked as a betrayer") — removing them collapses content variety.
- ❌ **Author a new branching encounter per gap.** Phase A may find gaps, but the first fix should be making existing rich content reachable. New authoring is the *next* project (Encounter Format Migration), not this issue.

## Definition of done

- [ ] Phase A audit doc committed to `Docs/audits/2026-MM-DD-branching-encounter-reachability-audit.md`
- [ ] Audit enumerates all ~30 branching templates with primary blocker + suggested lever
- [ ] Phase B fixes applied per template per audit recommendation
- [ ] `kpi:branching-audit` re-run shows ≥1 branching fire per 30 ticks per threaded agent across 3 seeds (`BRANCHING_TARGET_FIRE_PER_30T` met)
- [ ] At least 5 distinct branching templates fire over 180 ticks across seeds (variety check)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` green; engine smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) green
- [ ] Curator nudges visible as traces in DebugPanel
- [ ] Closing commit body includes `Fixes THR-452` and verification evidence

## Coordination block

- **Suggested model:** sonnet
- **Parallel-safe with:** THR-453 (template novelty pressure — different scoring concern; both touch `encounterScoring.ts` but in different code paths, but **review for merge conflict** when both land), THR-455 (story-so-far digest — pure UI), THR-456 (event feed hygiene — different files)
- **Mutex with:** THR-457 (observability — strict dependency; Phase A cannot run until THR-457's funnel exists. **Do not claim THR-452 until THR-457 is in `Done`.**)
- **Codex review:** yes (mechanical/audit work fits Codex's strengths; the curator module follows existing scoring patterns)
- **Files to touch (Phase A):** `scripts/cli.ts` (add subcommand), `src/engine/kpi/branchingDistance.ts` (new), `Docs/audits/2026-MM-DD-branching-encounter-reachability-audit.md` (new)
- **Files to touch (Phase B):** `src/engine/encounter/branchingCurator.ts` (new), `src/engine/encounter/branchingConstants.ts` (new), `src/engine/encounterScoring.ts` (hook), `src/types/trace.ts` (subcategory), `src/data/encounters/*.ts` (per-template content edits), possibly new `src/data/encounters/<branching-id>-ladder-N.ts` files for laddering

## Vision audit

This plan does not contradict or update any Vision premise. It operationalises the existing premise that "the game promises one complex story at a time" by making the rich content that carries those stories actually reach the player. No Vision edit is in scope.

## Rulebook impact

This plan does not change any rule of play (turn structure, action verbs, prerequisites, resources, encounter resolution, clocks, win/loss). It changes *gate values* on individual content items and adds a curator that respects existing gates. No rulebook update is in scope.

## NFP compliance

| Priority | Status | Note |
|---|---|---|
| #1 Tunability | PASS | All knobs in `branchingConstants.ts`; per-template gate values stay as named/commented numbers |
| #2 Inspectability | PASS | Two new trace types; curator boosts traceable per-agent-per-template |
| #3 Determinism | PASS | Curator is a pure function of (agent state, template state, runtime constants); no PRNG outside existing scoring path |
| #4 Fail-soft | PASS | Six failure modes enumerated; build-time validation catches malformed content; runtime falls back to base score |
| #5 Narrative over mechanical perfection | PASS | Curator only bumps *nearly-eligible* — preserves the narrative contract that branching content is earned |
| #6 Additive over destructive | PASS | New module, new constants, new trace subcategories; existing scoring path untouched except for one additive hook call |
| #7 Performance budget | PASS | Funnel counters are O(1); curator runs once per scoring evaluation; distance heuristic only runs during audit, not steady-state |
