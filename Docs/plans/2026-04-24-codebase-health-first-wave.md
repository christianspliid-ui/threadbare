# Codebase Health — First-Wave Design

**Linear:** [THR-260](https://linear.app/threadbare/issue/THR-260) (parent)
**Brainstorm:** `Docs/plans/2026-04-24-codebase-health-recurring-process-brainstorm.md`
**Grill-me record:** `Docs/plans/2026-04-24-codebase-health-grill-me.md`
**Project:** Continuous Improvement
**Date:** 2026-04-24
**Status:** Design complete; ready for executor pickup

---

## 1. Summary

First-wave installs four interlocking practices to keep Threadbearer's codebase from degrading as agents produce it:

1. **Ubiquitous Language (UL)** — canonical sharded glossary as project foundation below content taxonomies.
2. **grill-me skill** — adversarial design-concept extraction before non-trivial work begins.
3. **Weekly drift scan** — GitHub Action producing per-signal Linear issues.
4. **Retro × scan cadence sync** — scan runs warm, ~1 hour before the weekly retrospective.

Scope is deliberately narrow. Nine further improvements (THR-261 through THR-270) are captured as deferred Linear issues under Continuous Improvement.

## 2. Principles (reference for all four subsystems)

These are stated explicitly here because they settle recurring tensions in the implementation phase. Executors should treat them as tiebreakers.

**P1. UL is the foundation layer.** Everything depends on UL; UL depends on nothing. Content taxonomies (encounter design, prose generation) sit *above* UL. When docs disagree on terminology, UL wins. *(Memory: `project_ul_foundation`.)*

**P2. User makes verdicts; agent recommends and automates.** Scan output is *data*, not rulings. Retro output is *sense-making*, not a dashboard firing verdicts. As patterns become legible, agents proactively propose automations for user approval. *(Memory: `feedback_user_verdicts_agent_recommends`.)*

**P3. Sense-making over metric thresholds.** No auto-kill or auto-promote rules based on numbers alone. The retro assesses whether each signal is working; thresholds are nudges for human attention, not judges.

**P4. Grill-me auto-invokes rather than working on assumptions.** Aggressive invocation is the point. Better to ask too much than to design on guesses.

**P5. Grill-me is conversational by default, async-batch on request.** One question at a time is the norm; the markdown-checklist mode exists for users who prefer batching.

## 3. Three-pillar status

**Engine: N/A.** Content: N/A. UI: N/A. This is process/tooling infrastructure, not a game feature. The three-pillar rule exists to prevent engine-only or content-only features from shipping half-complete; that risk doesn't apply here. Explicit N/A per `Docs/plans/2026-04-13-linear-coordination-protocol.md` exit criteria.

## 4. Vision audit

No Vision premises contradicted. The first-wave reinforces `feedback_ask_grey_zones`, `feedback_wiring_verification`, `feedback_design_expansiveness`, and the broader "invest in design daily" stance (Kent Beck). No edits to `Vision/` required.

## 5. Subsystem 1 — Ubiquitous Language

### 5.1 Artifact

**Location:** `Docs/ubiquitous-language/` (sharded). Obsidian vault renders each shard as a wiki mirror via existing vault-generator infrastructure.

**Shards (v1):**

| Shard | Content | Content-adjacent |
|---|---|---|
| `Cosmology.md` | Reaches, Spheres, Foundation/Creation, Elder magic, sphere alignment | ✅ |
| `Agents.md` | Agent, Actor, Ascendant, Hero, First, NPC, Rival, Faction, role taxonomy | ✅ |
| `Encounters.md` | Encounter, Template, UnifiedActionTemplate, Aftermath, Reaction, Seed, Hidden Mark | ✅ |
| `Prose.md` | IPK, Enrichment placeholders, Resolver, Strata, Voice, Style | ✅ |
| `Graph.md` | Node types, Edge types, property-vs-edge rule, touching/versioning | ❌ |
| `Coordination.md` | Cowork/CC/Codex, Linear states, claim discipline, WIP, handoff | ❌ |
| `Process.md` | NFPs, Design governance, Three-pillar rule, Vision audit | ❌ |

**Index:** `Docs/ubiquitous-language/README.md` — one-line summary per shard + one-line summary per term, linking to full entries. This is the "always-load" footprint.

**Term entry shape** (within each shard):

```markdown
### Term Name

**Aliases:** comma-separated (if any)
**Also see:** `[[related-term]]`, `[[another-term]]`
**Status:** canonical | deprecated | proposed

One-sentence intent-focused definition. What the concept *is*, not what code does with it.

(Optional) Two or three sentences of context — why this term exists, what it's distinguished from, where it's used.
```

### 5.2 `ubiquitous-language` skill

Lives at `.claude/skills/ubiquitous-language/SKILL.md` (CC-needed → canonical in `.claude`, mirrored to `.agents` per the skill-sync hook).

**Responsibilities:**

1. **Read the UL** — load the README index always; load specific shards on-demand when the task references their terms.
2. **Propose additions** — when encountering an undeclared concept used in code/docs, draft a proposed entry and surface it for user approval via a Linear issue in Continuous Improvement with label `UL-proposal`. Include context: where the term was encountered, candidate definition, proposed shard, content-adjacency flag, and whether it might signal a content-taxonomy expansion.
3. **Propose retirements** — when encountering a canonical term that hasn't appeared in code/docs/plans for >30 days, surface a retirement proposal via the same mechanism.
4. **Serve as the authority on disagreements** — when CLAUDE.md, Obsidian, or code comments disagree with UL, UL wins and the skill opens a Linear issue to reconcile the conflicting artifact.

**Loading strategy (v1):** Always load `README.md` at session start (referenced from CLAUDE.md). Full shards load on-demand when the skill is invoked or when a shard's terms are referenced in the active task. If v1 context budget proves too expensive, v2 shifts to a compact Table-of-Contents always-load + lazy shard load.

**Propose-new-term UX (learning channel):** Because user approval doubles as a learning moment for the solo dev, the proposal Linear issue must include: (a) the proposed term and its definition, (b) **where and why** it was encountered (quote the code/doc context), (c) its relationship to existing canonical terms, (d) content-adjacency assessment and, if adjacent, the proposed content-taxonomy expansion candidate. Approval = human reviews and merges; no auto-merge.

### 5.3 Drift detection

Runs as part of the weekly drift scan (§7). Two signals:

- **A — Canonical-unused:** term is in UL but has not appeared in `src/**`, `Docs/**`, or Obsidian vault for >30 days. Flag for retirement review.
- **B — Used-uncanonical:** capitalized identifier or repeated concept phrase appears in `src/**`/`Docs/**` but not in UL. Flag for addition review.

Semantic-similarity drift (two terms that probably mean the same thing) is out of scope for v1 — it requires LLM judgment and is prone to false positives. Deferred to post-first-wave evaluation.

### 5.4 Seed content

First executor seeds v1 terms by extracting from:
- `CLAUDE.md` Load-Bearing Architectural Decisions and rejected approaches
- `src/types/graph.ts`, `src/types/gameState.ts`, `src/types/traits.ts`
- Obsidian `Vision/`, `Systems/`, and `Index.md`
- Recent plan docs in `Docs/plans/2026-04-*`

Target: ~40–60 terms in v1. Not exhaustive — coverage expands via the propose-new-term flow.

## 6. Subsystem 2 — grill-me skill

### 6.1 Invocation

**All triggers enabled** (user answer B1 = "all of them"):

- Cowork's estimate that the work is >1 day of executor time → auto-asks permission to grill.
- Task touches >1 pillar (Engine/Content/UI) → auto-asks permission.
- User explicitly types `/grill-me` or asks to be grilled → runs immediately.
- Cowork detects ambiguity or grey-zone density in the user's request → auto-asks permission.

Auto-invocation always asks first ("this feels like a large change — want to grill before I draft?"), per P4. User can decline ("no, small tweak") to skip.

### 6.2 Modes

**Conversational (default per F3):** one question at a time in chat. User can interrupt, park, or switch to async-batch mid-grill.

**Async-batch:** produces a markdown checklist (like `Docs/plans/2026-04-24-codebase-health-grill-me.md`) for the user to fill in at their own pace. User triggers async mode via "grill me async" or similar phrase.

Both modes terminate with the same synthesis step: the skill writes a design-concept summary that feeds into subsequent plan-doc drafting.

### 6.3 Question design heuristics

- **Variable count, err high** (per B6). Small idea: ~8–12 questions. Large idea: up to ~40. Absolute ceiling 50 — beyond that, split the work first.
- **Skip inferable questions** (per F2). If the answer to a question can be deduced from adjacent answers (e.g., delivery chunking when success criteria are clear), skip it.
- **Prioritize grey zones over structure.** Don't ask "which pillar does this touch?" if obvious from context. Do ask about tensions, alternatives considered, and why-not.
- **Mark ⚡ where you have a strong lean.** Signals to the user where pushback is most valuable.

### 6.4 "I don't know" handling

Per B5: first-time "I don't know" = **park and loop back later in the same session**. The skill notes the question, proceeds to questions whose answers are already clear, and revisits parked questions after adjacent context is established. Second-time "I don't know" on a revisited question = mark as grey zone in the synthesis output and continue.

### 6.5 Relationship to design governance

Appended to the existing 7-step design checklist as **step 0: grill-me pre-pass (if non-trivial)**. Per B4 refinement, we don't collapse the existing checklist into grill-me — grill-me must remain independently invocable (mid-work, when new uncertainty emerges), not only at design kickoff. The checklist's existing step 1 ("Draft the system design") consumes grill-me's synthesis output when present.

### 6.6 Output artifact

Synthesis written to `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md` (same convention as the 2026-04-24 doc). Becomes part of the design record. The subsequent design doc references it via the same header pattern used here.

## 7. Subsystem 3 — Weekly drift scan

### 7.1 Where it runs

**GitHub Action** (`.github/workflows/drift-scan.yml`), scheduled weekly. Runs against `main` — authoritative state, not working-tree drift. Does not require user's machine to be on. Aligns with THR-269 (advisory review decision) — both are CI-resident signals.

**Triage** runs separately as a Cowork scheduled task (daily backlog grooming; created as part of cadence sync subsystem if not already scheduled).

### 7.2 v1 signals

Four signals ship in v1 (per C2 agreement):

**S1. Coupling creep** — Codesight high-impact files delta, week-over-week. If any file in the top-20 importers list grew by >X% (threshold constant), open an issue.

**S2. Broken-windows tally** — count of `// TODO`, `// DEFERRED`, `@ts-ignore`, `.skip(`, failing/skipped tests, `any`-typed exports. Report week-over-week delta. Issue opens when total rose by >Y%.

**S3. Test suite runtime + flake candidates** — total `npm test` runtime, slowest 10 tests, tests that passed in one run and failed in another during the past week's CI.

**S4. Ubiquitous-language drift** — the two signals from §5.3 (canonical-unused, used-uncanonical). Depends on UL v1 shipping first, per shipping order §10.

**Deferred to v1.1:** complexity outliers (needs cyclomatic tooling wired in), bundle/build trend (nice-to-have, not load-bearing), module depth (blocked by THR-264 metric definition), skill freshness (blocked by THR-265 metadata retrofit).

### 7.3 Output

**One Linear issue per red signal** (per C3), created in the Continuous Improvement project with the `drift-scan` label. Title template: `Drift scan [YYYY-MM-DD]: <signal name> — <short summary>`. Body contains the raw data (tables/diffs) + a one-line recommendation. State: Backlog/Triage.

No issue opens when a signal is green. Silent green is the point.

### 7.4 Thresholds

Named constants at the **top of the scan file** (not a separate config file — YAGNI per C5). Clear section:

```typescript
// Drift scan thresholds — tune here, rebuild, done.
const COUPLING_CREEP_PCT = 10;       // flag if importers grew by >10% week-over-week
const BROKEN_WINDOWS_PCT = 15;       // flag if total broken-windows rose by >15%
const TEST_FLAKE_MIN_RUNS = 3;       // flag only if observed across ≥3 runs
const UL_DRIFT_STALE_DAYS = 30;      // canonical term unused for this many days = retirement candidate
```

Tuning = edit this section, push, done. If tuning gets more elaborate later, promote to config file. Not now.

### 7.5 Triage

The existing daily backlog grooming practice reads `drift-scan`-labeled issues and decides:

- **Groom up** — promote to Todo/Ready for Dev if user agrees it's actionable
- **Accept & park** — keep in Backlog for later grooming
- **Dismiss** — close with a one-line rationale (false positive, already addressed, not worth the churn)

Triage outcomes feed back into the weekly retro (§8), which is where threshold tuning decisions happen.

**If no daily grooming scheduled task exists yet**, this subsystem's implementation creates one. See §10.

### 7.6 Fail-soft

- Scan failure does NOT block CI for other work — runs on its own schedule, not on PR.
- Linear API outage → scan writes local output file in the workflow's artifacts and retries next run.
- Malformed UL shard → skip UL drift signal for that run, report skipped status, continue with other signals.
- Individual signal failure → skip that signal, continue with others. Never fail the whole scan because one metric broke.

## 8. Subsystem 4 — Retro × drift-scan cadence sync

### 8.1 Schedule

Scan runs **same day as retro, ~1 hour before** (per D1 user pushback — warm data). Recommended: scan at Friday 14:00 UTC, retro Friday 15:00 UTC. User adjusts the day as their working rhythm dictates.

### 8.2 Retro reads scan output as input

The `retrospective` skill (existing) gets a new first step: **read the current week's `drift-scan`-labeled Linear issues** from Continuous Improvement. These feed the retro's pattern-recognition pass alongside the impediments log (`Docs/impediments.md`).

Per D3, artifacts stay split:
- Drift scan issues → per-signal Linear issues
- Retro output → existing retrospective format in `Docs/retrospectives/`

Both feed the Continuous Improvement backlog via normal grooming.

### 8.3 Threshold tuning happens in retro

Per principles P2 and P3, the retro is where quantitative signal becomes qualitative judgment:

- Is the scan producing noise? → retro decides whether to tune thresholds.
- Did the scan miss something obvious the impediments log caught? → retro decides whether to add signals.
- Did scan + retro together surface a process fix? → retro opens the improvement issue in Continuous Improvement.

This is the sense-making layer (P3) that bridges raw scan data and user verdicts (P2).

### 8.4 Failure handling (per E4)

If the scan produces no issues for 3 consecutive weeks, the retro asks: "is this working (health is genuinely good), noise (thresholds wrong), or dead signal (kill it)?" **The retro's qualitative assessment decides** — no auto-kill rule. Remain vigilant; absence of signal is information, not a failure.

## 9. Wiring

### 9.1 Artifact flow

```
developer/agent writes code & docs
    ↓
(weekly) GitHub Action drift-scan.yml runs against main
    ↓
per-signal Linear issues created in Continuous Improvement (label: drift-scan)
    ↓
(1 hour later) Cowork retrospective skill reads scan issues + impediments.md
    ↓
retro synthesis → Docs/retrospectives/YYYY-MM-DD.md + grooming decisions
    ↓
(daily) Cowork backlog grooming reads drift-scan issues → triage verdicts
    ↓
user-approved items → Ready for Dev (or executed inline if trivial)
```

### 9.2 Agent context flow

```
session start
    ↓
CLAUDE.md references Docs/ubiquitous-language/README.md (always-load)
    ↓
task triggers load of specific shard (e.g., touches encounter code → Encounters.md loaded)
    ↓
during work: agent encounters new concept
    ↓
ubiquitous-language skill opens UL-proposal Linear issue with context
    ↓
user reviews, approves or rejects
    ↓
approved → UL shard updated, future sessions inherit the canonical term
```

### 9.3 Grill-me flow

```
user request received
    ↓
Cowork assesses: non-trivial? Pillar touches? Grey-zone density? Explicit ask?
    ↓
if any trigger fires → ask permission to grill
    ↓
conversational (default) OR async-batch (on request)
    ↓
synthesis → Docs/plans/YYYY-MM-DD-<topic>-grill-me.md
    ↓
design checklist step 1 consumes synthesis → drafts plan doc
    ↓
design governance 7-step checklist proceeds as normal
```

### 9.4 Existing artifacts touched

- `CLAUDE.md` — add UL reference, add grill-me to design checklist as step 0, note weekly drift scan in Session Workflow
- `.github/workflows/` — new `drift-scan.yml`
- `.claude/skills/` — new `ubiquitous-language/`, new `grill-me/`; mirrored to `.agents/skills/` via the sync hook
- `.claude/skills/retrospective/` — modified to read scan issues as first input
- Cowork scheduled tasks — new (or updated) daily backlog grooming task; new weekly drift scan schedule on the GH Action

### 9.5 Codesight pre-flight

High-impact file check: none of the first-wave changes modify top-20 importers (`graph.ts`, `types/index.ts`, `types/gameState.ts`, etc.). Artifact changes are additive. Low blast radius.

## 10. Shipping plan

**Order (per E1):**

1. **UL v1 static** — ship sharded docs + `ubiquitous-language` skill shell. Drift detection stubbed (returns empty) so the scan can reference the API but UL drift signal stays dark until populated. Unblocks #3.
2. **Grill-me skill** — usable immediately on next non-trivial feature. No prerequisites.
3. **Weekly drift scan** — needs UL v1 for the UL drift signal. Other three signals (S1–S3) don't depend on UL.
4. **Retro cadence sync** — updates retrospective skill to read scan output. Needs scan to exist.

Parallel-safe: #1 and #2 can ship in parallel. #3 waits for #1. #4 waits for #3.

**Single design doc (this one) covers all four** per E5. Four Linear issues for execution, each with a coordination block.

## 11. Constants table

All tunable numbers named with their purpose. Per NFP #1.

| Constant | Default | Location | Purpose |
|---|---|---|---|
| `COUPLING_CREEP_PCT` | 10 | drift-scan workflow | flag threshold for graph.ts-style importer growth |
| `BROKEN_WINDOWS_PCT` | 15 | drift-scan workflow | flag threshold for TODO/skip/any growth |
| `TEST_FLAKE_MIN_RUNS` | 3 | drift-scan workflow | minimum observed runs before a test counts as a flake candidate |
| `UL_DRIFT_STALE_DAYS` | 30 | UL skill + drift-scan | canonical-unused retirement threshold |
| `GRILL_ME_MIN_QUESTIONS` | 8 | grill-me skill | floor for variable question count |
| `GRILL_ME_MAX_QUESTIONS` | 50 | grill-me skill | ceiling before splitting the work |
| `GRILL_ME_DEFAULT_QUESTIONS` | 27 | grill-me skill | target for mid-size features (this grill's length) |
| `SCAN_BEFORE_RETRO_MINUTES` | 60 | schedule config | scan runs this many minutes before retro |

## 12. Tracing

Per NFP #2. Each subsystem emits logs / structured output for post-hoc inspection.

- **UL skill** — logs proposed-term events (term, shard, context source) to `Docs/ubiquitous-language/.log` or a similar append-only file. Aids retrospective analysis of vocabulary growth patterns.
- **Grill-me skill** — synthesis output (`Docs/plans/*-grill-me.md`) IS the trace. No separate log needed.
- **Drift scan** — GH Action output + per-signal Linear issues are the trace. Action stores raw JSON artifacts for 30 days for debugging.
- **Retro** — existing `Docs/retrospectives/YYYY-MM-DD.md` format; now references scan issue IDs it consumed.

## 13. Fail-soft table

Per NFP #4.

| Failure | Degraded behavior |
|---|---|
| UL shard file missing | Skill reports missing shard, continues loading others |
| UL skill crash during propose | Log error to Linear issue, do not retry; user sees absence of proposal |
| Grill-me auto-invoke when user wants to skip | User says "no, proceed" → skill skips without friction |
| Grill-me conversational stall (user goes silent) | Skill offers to save partial state as async-batch doc and resume later |
| Drift scan Linear API outage | Scan writes artifacts to workflow output; next run retries |
| Drift scan single-signal failure | Skip that signal, continue others, log error |
| Drift scan whole-run failure | GH Action surfaces in CI; doesn't block other workflows |
| Retro can't fetch scan issues | Retrospective runs anyway, notes scan data unavailable in synthesis |
| Cowork grooming task missed | Manual grooming on next session; scan issues accumulate (not a disaster) |

## 14. NFP compliance

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All thresholds named constants in one file per subsystem. |
| 2. Inspectability | PASS | Scan output, retro docs, UL logs, grill-me synthesis all persisted. |
| 3. Determinism | PASS | Scan is deterministic given same `main` SHA. Grill-me is user-interactive; determinism N/A. UL is deterministic data. |
| 4. Fail-soft | PASS | Fail-soft table §13 covers all identified failure modes. |
| 5. Narrative over mechanical | N/A | Not a game-feature system. |
| 6. Additive over destructive | PASS | Four additive skills/artifacts; one modification (retro skill gets a new first step, existing behavior preserved). |
| 7. Performance budget | PASS | Drift scan runs weekly on CI, not in dev path. UL always-load costs ~3–5k tokens; budget acceptable per A7. |

## 15. Success criteria (per E3)

**Four weeks after first-wave lands, user assesses:** "faster, cheaper, better end-to-end delivery of quality features."

Qualitative, user-judged per P2. Retro is the review venue; week-4 retro should explicitly include a first-wave assessment agenda item.

**Supporting indicators** (data, not verdicts) that the retro may consider:
- Did grill-me catch a scope ambiguity that would have cost executor time?
- Did the UL skill's propose-new-term flow surface terminology the human learned from?
- Did the drift scan flag coupling growth before it became a multi-day refactor?
- Did the retro's access to scan data produce different/better decisions than retros without it?

No pre-set thresholds on any of these. User judges.

## 16. Failure handling (per E4)

Drift scan produces nothing for 3 consecutive weeks → retro assesses. Options:
- (a) Working — health good → keep running as-is.
- (b) Noise — thresholds wrong → retro proposes tuning.
- (c) Dead signal — kill the signal → retro opens issue to remove it.

No auto-kill. Remain vigilant (user's phrase) — treat it as a complex pattern requiring sense-making.

## 17. Open questions for implementation

Things left for the executor to decide, but noted here for continuity:

- **UL skill drift detection granularity** — does it scan every file on every run, or cache prior scan state? Start simple (full scan weekly); optimize only if run time hurts.
- **Grill-me state across sessions** — if a grill is interrupted mid-session, does the skill resume from where it stopped next session? v1: synthesis file persists; resume is manual (user asks to continue the grill).
- **Content-taxonomy expansion candidate format** — when UL proposal flags a content-adjacent term, what exact shape does the taxonomy-expansion Linear issue take? Defer to content-architecture project when/if it surfaces.
- **Daily backlog grooming scheduled task** — may or may not already exist. Implementation checks; creates it if missing. Task reads Continuous Improvement backlog filtered by `drift-scan` and `UL-proposal` labels.

## 18. Linear issue structure

Four first-wave execution issues, parented to THR-260. Each with coordination blocks per `feedback_cc_coordination_block`. Labels: `model:opus` for the first two (judgment-heavy), `model:sonnet` for the drift scan (mostly CI scripting), `model:sonnet` for the cadence sync (small skill modification).

All four land in Ready for Dev state; each is claimable independently in the order above.

---

*This design is the shared concept. Implementation questions go into the executing issues or back through Cowork. No ad-hoc extension of scope without a grooming pass.*
