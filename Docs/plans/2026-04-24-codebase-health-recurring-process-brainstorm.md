# Codebase Health — Recurring Process Brainstorm

**Status:** Brainstorm (input for design phase)
**Date:** 2026-04-24
**Project:** Continuous Improvement
**Companion to:** (design doc TBD — same topic, will be created in design phase)

---

## 1. Provenance

User asked to think through a **recurring process for keeping the codebase and coding-process fundamentals from degrading over time**. Inspired by:

- **Dave Farley** — *Modern Software Engineering*, *Continuous Delivery*. Core thesis: engineering = optimize for learning (iterative, experimental, fast feedback) + optimize for managing complexity (modularity, cohesion, separation of concerns, abstraction, coupling).
- **Matt Pocock** — talk transcript ("Claude Code for Real Engineers", ~2026). Thesis: **software fundamentals matter *more* in the AI age, not less.** Specs-to-code doesn't work; code is not cheap; AI does great in good codebases, garbage in bad ones. Maps 5 AI-coding failure modes to 5 skills grounded in John Ousterhout (*A Philosophy of Software Design*), Frederick P. Brooks (*The Design of Design*), and DDD (*ubiquitous language*).

Also draws on existing Threadbearer memory and CLAUDE.md: `feedback_design_expansiveness`, `feedback_ask_grey_zones`, `feedback_wiring_verification`, NFP priorities, Load-Bearing Architectural Decisions list.

## 2. User's Quality Attributes

The product's code must be:

1. Easy/cheap to understand **for an agent**
2. Easy to change **for an agent**
3. Easy to test **for an agent**
4. Easy to deploy
5. Stable over the long term
6. Performant
7. Etc. (evolving — treat as open list, not closed)

The **"for an agent"** framing is the key twist. It changes what each attribute means:

- "Easy to understand" → **low cost-to-context**. How much does an agent read before it can do useful work?
- "Easy to change" → **low blast radius + visible coupling**. Agents have no "been burned before" intuition.
- "Easy to test" → **tests that explain intent**, not just assert values.
- "Stable over time" → architecture resists entropy *even when the editor is fast, confident, and may not have read the whole file*.

## 3. Synthesis — Farley × Pocock for Agent-Primary Codebases

Farley gives the *why*: feedback loops, managing complexity, reversibility, deployability. Pocock gives the *operational shape* — named failure modes with named skill remedies. Together they argue:

> The recurring process isn't "keep the code clean." It's **keep the feedback loops short, the drift visible, and the agent-cost low.** Those are the three things that compound.

Pocock's implicit claim (worth stating loud): **in an agent-primary codebase, skills *are* the discipline.** Principles don't enforce themselves; a named, loadable skill does.

## 4. Pocock's 5 Failure Modes × Threadbearer Gap Analysis

| Pocock failure mode | His remedy | Source | Threadbearer status |
|---|---|---|---|
| "AI didn't do what I wanted" | **grill-me** skill — AI interrogates *you* until design concept is shared | Brooks, *Design of Design* — the "design concept" is ephemeral, not an asset | ⚠ Gap. Design governance exists but Cowork is the *proposer*, not adversarial extractor. Contradicts `feedback_ask_grey_zones` memory. |
| "AI is too verbose / talks past me" | **ubiquitous-language** skill — living glossary | DDD | ⚠ Major gap. ~40 load-bearing terms (Reaches, Spheres, Ascendants, Thread, Witness, Hunger, Foundation, Creation, IPK, …) scattered across CLAUDE.md, Obsidian, skills, prose tables. No canonical list. |
| "Code doesn't work" | **TDD** — small steps, test-first, don't outrun headlights | Pragmatic Programmer | ⚠ Gap. Pre-commit checklist is test-*after*. TDD not a named skill. |
| "Testing is hard → architecture is shallow" | **improve-codebase-architecture** — deep modules, narrow interfaces | Ousterhout | Partial. Load-Bearing Decisions lean this way (graph nodes, three-tier positions). No periodic audit for shallow-module rot. |
| "My brain can't keep up" | **gray-box** thinking — design interface, delegate implementation | Ousterhout + Kent Beck "invest in design daily" | Implicit. Code review is structural/NFP-focused, not interface-first. |

## 5. Proposals — Expansive Catalog

Captured broadly per `feedback_design_expansiveness`. Design phase will converge.

### 5.1 Scheduled jobs

**A. Weekly drift scan (high signal, low cost).** Monday morning scheduled task. Output: one Linear issue in Continuous Improvement with concrete candidate items for WSJF grooming. Signals:

- **Coupling creep** — Codesight high-impact files list, week-over-week delta. `graph.ts` went from 370 → 395 importers → flag.
- **Broken-windows tally** — `// TODO`, `// DEFERRED`, `@ts-ignore`, `.skip(`, `any`-typed functions, failed/skipped tests. Delta matters, not absolute.
- **Complexity outliers** — files whose cyclomatic complexity jumped >20% this week.
- **Test suite health** — total runtime, slowest 10 tests, flake candidates (passed-then-failed in CI).
- **Bundle size & build time** — trend lines.
- **Module depth deltas** *(Ousterhout)* — for each top-level module, compute `implementation_lines / interface_surface`. Flag modules whose ratio dropped >20% (got shallower).
- **Ubiquitous-language drift** *(DDD)* — diff canonical glossary against terms appearing in code, plan docs, Obsidian. Flag one-off terms and silent disuse.
- **Skill freshness** — skills >60 days without `last_validated_against` update.

The output names specific actions, not metrics-for-metrics'-sake. Farley's discipline: every number should map to a candidate change. No action → kill the metric.

**B. Weekly retrospective pass.** Friday. Reuses existing `retrospective` skill. Scans `Docs/impediments.md`, groups by failure class, opens 1–2 Linear issues for quick wins. Pattern recognition is the value: three separate impediments of the same class = a process bug, not three incidents.

**C. Monthly change-affordance audit.** Pick 3 recently-shipped issues. Measure:

- How many files touched?
- **How many module interfaces changed?** (vs. just implementation) — Ousterhout lens
- How many tests changed that shouldn't have?
- How many abstraction layers did it ripple through?

Consistently high touch-radius or interface-change count → coupling debt → writes up a concrete refactor proposal. Consistently low → evidence the architecture holds.

**D. (Deprioritized candidates — capture but don't build yet)**

- Monthly architecture decision revisit — premature ceremony unless Load-Bearing list starts getting contested
- Documentation drift check — folded into skill freshness
- Flaky-test isolation job — folded into weekly scan

### 5.2 Skill updates (ordered by leverage)

**1. `ubiquitous-language` skill + `Docs/ubiquitous-language.md` artifact** *(DDD)*
- First invocation: extract terminology from CLAUDE.md, Obsidian `Vision/`/`Systems/`, prose tables, `src/types/`. Produce table per domain (Cosmology, Reaches, Agents, Encounters, Prose, Coordination, …).
- Subsequent invocations: drift detection + update.
- Loaded by default at session start for substantive work — not on-demand. It's the shared design concept made durable.
- **Highest single leverage move.** Threadbearer's vocabulary density is unusually high; every session reconstructs it from partial reads.

**2. `grill-me` skill** *(Brooks — Design of Design)*
- Runs before design doc drafting for ideas above a size threshold (~1 day of CC work).
- Interrogates user: which existing node/edge types are affected; which pillar is load-bearing; one-sentence player-facing outcome; which rejected approaches are tempting and why they stay rejected.
- **Cap ~20–30 questions** (not Pocock's 100 — calibrated to solo-dev context and existing design-governance burden).
- Pushes back on the `feedback_ask_grey_zones` failure mode by name.

**3. `tdd-discipline` skill**
- Calibrated, not dogmatic: pure logic (resolution, scoring, prose pipeline) gets test-first default. Integration glue and Three.js rendering keep test-after.
- Skill teaches the *when* (which module class) as much as the *how*.
- Guards against Pocock's "outrunning your headlights."

**4. `gray-box-review` skill**
- For reviewing agent-generated code. Attention order: interface shape first, implementation second.
- Questions: exported surface minimal? Abstraction names intent-revealing or implementation-leaking? Would an agent reading only the interface know what the module does?
- Implementation review only if interface survives.

**5. `module-depth-audit` skill**
- Run quarterly or on-demand when a module feels off.
- Lists shallow modules (small functionality, big exported surface). Proposes consolidation targets.
- Output: Linear issues, not a report.

**6. Skill freshness metadata retrofit**
- Every skill gains `last_validated_against: YYYY-MM-DD` frontmatter.
- Weekly drift scan surfaces stale skills.
- Validation happens as a side effect of use (agent confirms on load), not a separate chore.
- Skills never loaded >90 days → archive candidates.

**7. (Secondary skill candidates)**

- `agent-cost-audit` — measure cost-to-context for a module: how many reads, how many skills, how much CLAUDE.md before first useful edit.
- `interface-naming-review` — targeted: "do these exported names reveal intent or leak implementation?"
- `consolidation-candidate-finder` — repo-wide scan for near-duplicate abstractions.

### 5.3 Toolchain updates

**1. `Docs/ubiquitous-language.md` as first-class orientation artifact.** Alongside `Index.md` and the skill tree. Session-precheck should surface its freshness state.

**2. Browser-in-the-loop discipline.** Existing tools: Claude-in-Chrome, Playwright, debug bridge. Currently optional. Update: any UI-pillar work must produce at least one screenshot + console check before closeout. Not optional. Tools exist → make use procedural.

**3. CLI smoke test as mandatory post-engine-change step.** `npm run cli` + `tick 30` + `status` before commit for any engine change. Add to pre-commit checklist as step 6. Pocock's "don't outrun headlights" made procedural.

**4. Codesight queries before design.** Required pre-flight in design-governance checklist: query blast radius + dependency chain for affected area. If change touches high-impact file, surface it in the plan doc up front. Cheap visibility into coupling.

**5. Kill advisory review OR make it blocking.** Structural review Action currently advisory pending GitHub Pro + branch protection. Optional gates are decorative (Farley). Decide: land GitHub Pro and flip to blocking, or drop the advisory signal entirely. Current limbo state is worst of both worlds.

**6. (Deprioritized) ADR migration.** My first-pass suggestion was to promote Load-Bearing Decisions to formal ADRs. On reflection, ceremony. Ubiquitous-language doc + grill-me skill capture most of the same value at fractional maintenance cost. Keep decisions as prose in CLAUDE.md. Revisit if decisions start getting silently re-litigated.

## 6. Pushbacks & Calibrations

**Pocock's "100 questions" grill is too much for a solo dev.** Already running 7-step design governance + 3-pillar + NFP audits. Cap grill at 20–30 sharp questions weighted toward grey zones.

**Ubiquitous language has a maintenance failure mode Pocock doesn't discuss.** Drift from reality → actively misleading. Automated drift detection is *mandatory*. If it can't be automated, don't ship the doc.

**Process weight risk.** Solo dev + agents. Every scheduled job is triage work. Three reliable jobs > ten noisy ones. Kill any job that doesn't change behavior within a month.

**Measuring vs. changing.** Dashboards feel like progress. Every metric must map to a candidate action. Atmosphere ≠ signal.

**TDD isn't universal here.** World-graph setup cost makes pure TDD painful for integration-style code. Skill must teach the when, not just the how.

**The "for an agent" framing could degrade to "for Claude Code specifically."** Watch for drift. The codebase must remain legible to Cowork, CC, Codex, future executors, *and* to the human solo dev who still reads it.

## 7. First-Wave Scope (locked 2026-04-24)

User confirmed scope for the design phase:

1. **`ubiquitous-language` skill + `Docs/ubiquitous-language.md`** — §5.2 item 1. Highest single leverage given domain vocabulary density. Must include automated drift detection.
2. **`grill-me` skill** — §5.2 item 2. Adversarial design-concept extraction capped at 20–30 questions. Addresses `feedback_ask_grey_zones` memory at its root.
3. **Weekly drift scan** — §5.1 A. Measurement substrate; surfaces coupling creep, broken-windows trend, test health, module depth, ubiquitous-language drift, skill freshness.
4. **Retro × drift-scan cadence sync** — the weekly retrospective and weekly drift scan must be scheduled so they feed each other cleanly (drift scan produces candidates → retro groups patterns and opens quick-win issues, or vice versa). Exact ordering TBD in design phase. This is an *explicit* scope item, not just a consequence of #3.

Everything else is captured as deferred Linear issues — see §10.

## 8. Open Questions for Design Phase

- **Scope of ubiquitous-language doc** — single monolithic file vs. domain-sharded (Cosmology.md, Agents.md, Coordination.md)? Obsidian already has some of this — is the artifact in repo, in vault, or both with sync?
- **Grill-me size threshold** — what rule decides when to invoke? Line count? Three-pillar touch count? Estimated CC day-count?
- **Module depth metric definition** — what counts as "interface surface"? Exported functions? Type exports? Named constants? Needs a concrete formula before the scan can run.
- **Skill freshness validation mechanic** — who/what confirms a skill is still accurate? Agent on load? Periodic manual review? Automated check against code?
- **Advisory review decision** — is GitHub Pro on the near-term roadmap, or should advisory mode be killed now?
- **Deferred jobs list** — which of A/B/C get built first? Sequencing matters for process-weight budget.
- **Impediment logging discipline for the process itself** — how do we detect when one of the new scheduled jobs is noise not signal?

## 9. Source References

- Matt Pocock talk transcript (full, 2026) — in conversation record; key concepts summarized in §4.
- Dave Farley — *Modern Software Engineering* (book), *Continuous Delivery* (book), YouTube channel.
- John Ousterhout — *A Philosophy of Software Design*.
- Frederick P. Brooks — *The Design of Design*.
- Pragmatic Programmer — software entropy, outrunning your headlights.
- Kent Beck — "invest in the design of the system every day."
- Eric Evans — *Domain-Driven Design* (ubiquitous language).

## 10. Deferred work (Linear trail)

Captured 2026-04-24 so nothing from §5 is cut, only sequenced. All parented to [THR-260](https://linear.app/threadbare/issue/THR-260), all in the Continuous Improvement project at Backlog/Idea state:

| Issue | Subject | Brainstorm ref |
|---|---|---|
| [THR-261](https://linear.app/threadbare/issue/THR-261) | Monthly change-affordance audit (Ousterhout lens) | §5.1 C |
| [THR-262](https://linear.app/threadbare/issue/THR-262) | `tdd-discipline` skill (calibrated, not dogmatic) | §5.2 item 3 |
| [THR-263](https://linear.app/threadbare/issue/THR-263) | `gray-box-review` skill (interface-first code review) | §5.2 item 4 |
| [THR-264](https://linear.app/threadbare/issue/THR-264) | `module-depth-audit` skill + metric definition | §5.2 item 5, §8 |
| [THR-265](https://linear.app/threadbare/issue/THR-265) | Skill freshness metadata + validation mechanic | §5.2 item 6, §8 |
| [THR-266](https://linear.app/threadbare/issue/THR-266) | Browser-in-the-loop mandatory for UI-pillar closeout | §5.3 item 2 |
| [THR-267](https://linear.app/threadbare/issue/THR-267) | CLI smoke test as mandatory pre-commit step (engine) | §5.3 item 3 |
| [THR-268](https://linear.app/threadbare/issue/THR-268) | Codesight pre-flight required in design governance | §5.3 item 4 |
| [THR-269](https://linear.app/threadbare/issue/THR-269) | Advisory review decision — blocking or drop | §5.3 item 5, §8 |
| [THR-270](https://linear.app/threadbare/issue/THR-270) | Secondary skill candidates (evaluate after first-wave) | §5.2 item 7 |

THR-264 (module depth metric) is a soft blocker for THR-261 (change-affordance audit) — metric must be defined before the audit can consume it.

THR-265 (skill freshness) interacts with the first-wave drift scan — if first-wave ships without freshness metadata, the scan's skill-freshness signal is empty and THR-265 should groom up soon after.

---

*This is a brainstorm, not a design. Next step: run the (in-development) `grill-me` flow on the first-wave scope before drafting the design doc — test the method while using it.*
