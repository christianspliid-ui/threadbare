---
status: current
domain: process
audit_target: design-loop-skills
created: 2026-05-08
related: 2026-04-13-linear-coordination-protocol.md, 2026-04-23-authoring-brief-extraction.md
related_linear: (to be filed — see Recommendations / Linear handoffs at the end)
---

# Audit — Design-Loop Skills through the Fork / Files / Commands Lens

**Trigger:** the user's 2026-05-08 question — *do an assessment of the skills agents use for the Threadbearer project as a game-development project; specifically look at how we can use forks, files, and commands to improve the end-to-end workflow.* The framing comes from Mansel Scheffel's "I Finally Solved Claude Code Skill Chaining" walkthrough (≈85 % token reduction), which decomposes skill orchestration into three context-economy levers:

| Lever | What it means | Why it matters |
|---|---|---|
| **Fork** | Spawn an isolated subagent (Task tool) so its working memory does not pay tokens against the orchestrator's context | The single largest reducer of orchestrator prompt size |
| **Files** | Use disk artifacts as the handoff medium between steps; agents read only the slice they need, not the whole prompt history | Makes state durable, inspectable, and resumable across sessions |
| **Commands** | Inject just-in-time data via shell / npm commands; only the command's *output* enters the prompt | Replaces "load this entire reference" with "fetch this exact answer" |

**Scope:** the **Design / planning loop** — the path from a fresh issue or idea through grill-me, debate, plan-doc drafting, brainstorm-companion, NFP / three-pillar / Vision audit, and Linear handoff. Out of scope this pass: content-authoring pipelines (already best-in-class), executor-side (CC / Codex) loops, and continuous-improvement loop.

**Verdict:** Threadbearer's content-authoring pipelines (`encounter-pipeline`, `attachment-pipeline`) are already best-in-class on all three levers. The **design / planning loop** is one to two notches behind: forks are used in two places (`design-council` Round 1, `game-design-direction` pre-design debate) but the rest of the loop runs single-agent inline; files are used heavily for handoff (good) but rarely for SKILL.md *internal* state (large reference content lives inside SKILL.md); commands are used for housekeeping but not to replace inline reference loads. The headline reducible cost is **state-of-game-design + game-design-direction loaded together at every design pass — 42 KB combined, with a known duplication bug adding ~3 KB of pure waste**. Most of that 42 KB is reference material that could move to disk shards or a compiled brief.

**Why audit now:** The encounter-pipeline pattern (sub-agent per pass + role-prompt files in `agents/` + per-pass model selection + `Docs/authoring-brief.md` as compiled reference) is a working template. The design loop has not yet been refactored to match it, even though design passes are the workflow Cowork runs most often.

---

## Triage tables

### Forks — current usage

| Surface | Status | Notes |
|---|---|---|
| `design-council` Round 1 — parallel perspective subagents | ✅ Done well | One Agent call per perspective in a single message; page-as-shared-state pattern is clean |
| `game-design-direction` pre-design debate — two parallel advocates | ✅ Done well | Same single-message pattern; trade-off card written by orchestrator |
| `encounter-pipeline` — 4 sequential passes with per-pass model selection | ✅ Done well (reference example) | Opus on creative passes, Sonnet on mechanical; auto-retry on REVISE |
| `attachment-pipeline` — same pattern as encounter-pipeline | ✅ Done well | Mirrors encounter-pipeline structure |
| **NFP audit** at plan-finalization (7 priorities × 3 pillars) | ❌ Inline | Currently the same agent that drafted the plan also audits it. Self-audit is weaker than independent audit and burns context that could be parallelized. |
| **Three-pillar coverage check** (Engine / Content / UI) | ❌ Inline | Same problem as NFP audit. The check is structural — perfect fork candidate, one subagent per pillar with the relevant domain skill loaded. |
| **Vision audit at finalization** (5 checks against 5 Vision files) | ❌ Inline | Five sequential file reads in the orchestrator. Forking gives independent verdicts and only the verdict text returns to context. |
| **Wiring-checklist verification** | ❌ Inline checkbox | `Docs/plans/wiring-checklist.md` exists but the agent self-checks. A subagent with that file pre-loaded would be more rigorous and reusable. |
| **Quality-gate / benchmark-moments check** (Section 9) | ❌ Inline | Same shape as NFP audit. Forkable. |
| **Plan-doc structure lint** (NFP table present, three-pillar sections present, constants table, fail-soft table, tracing) | ❌ Not implemented | Better suited to a `npm run` than a fork — see Commands. |

### Files — current usage

| Surface | Status | Notes |
|---|---|---|
| `Docs/plans/YYYY-MM-DD-*.md` plan docs | ✅ Canonical | Plus the `flush-plan-docs` automation closing the commit loop |
| `Brainstorms/YYYY-MM-DD-*.md` companion docs | ✅ Canonical | Co-authored alongside plan, not retrofit |
| `grill-me` synthesis at `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md` | ✅ Done | Exemplary clean handoff to plan drafting |
| `design-council` page at `Docs/design-councils/YYYY-MM-DD-<slug>.md` | ✅ Done | Page-is-the-memory pattern, scales across rounds |
| `Docs/canon/<domain>.md` — domain Step-0 entrypoints | ✅ Done | Already the "thin router" pattern applied to canon |
| `Docs/authoring-brief.md` — compiled brief for content authoring | ✅ Done (reference example) | Has a freshness check (`npm run check:authoring-brief`); content agents read the brief, not the source |
| `encounter-pipeline/agents/<pass>-prompt.md` — role prompts on disk | ✅ Done (reference example) | Orchestrator references the file path; full role prompt only enters the spawned subagent's context |
| **`state-of-game-design/SKILL.md`** — 26 KB single file with **duplicated Parts 6, 7, "After Loading"** (~3 KB of pure waste, lines 350–405 vs 411–461) | ❌ Bug + structural | Loaded as the foundation for **every** design pass. Highest-traffic skill, biggest reducible cost. |
| **`game-design-direction/SKILL.md`** — 16 KB, includes a 3 KB brainstorm-companion template that's only relevant at write-time | ❌ Structural | Template is referenced once per design but loaded every time the skill loads |
| **No `Docs/plans/_template.md`** — plan-doc structure described inline in CLAUDE.md and game-design-direction | ❌ Missing | Agents reconstruct structure from prose every time |
| **No compiled "design-brief"** analogous to authoring-brief | ❌ Missing | Vision/ + state-of-game-design + NFPs + load-bearing decisions are pulled together every pass; could be pre-compiled and freshness-checked |
| **`design-council/SKILL.md`** — 13.8 KB with a ~50-line page template inline | ⚠ Partial | Page template could move to `design-council/reference/page-template.md` |
| **`grill-me`** has no `agents/` or `templates/` subfolder | ⚠ Partial | Question patterns and the synthesis-artifact structure are described in prose; an `agents/grill-prompt.md` would let the orchestrator spawn a dedicated grill subagent rather than running it inline |
| **`design-council` lives in `.agents/` only** | ⚠ Mismatch | Per CLAUDE.md skill-tree convention, audience-separated is fine — but design-council is increasingly relevant to CC review work too (e.g. consenting on ambiguous review findings). Worth re-deciding audience. |

### Commands — current usage

| Surface | Status | Notes |
|---|---|---|
| `npm run retro-draft` — deterministic pre-pass before retro narrative | ✅ Done well (reference example) | The agent reads a generated file, not the impediments log directly. Cuts retro context cost dramatically. |
| `npm run check:authoring-brief` — staleness check on compiled brief | ✅ Done well | Pre-commit hook can enforce regeneration |
| `npm run check:process` — process / workflow lint (advisory) | ✅ Done | Catches handoff-protocol drift |
| `npm run mirror-ul` — UL shard mirror to vault | ✅ Done | Decouples vault publication from prose authoring |
| `flush-plan-docs` skill — git commit of label-tagged plan docs | ✅ Done | Closes the Cowork → main commit loop without giving Cowork direct git access |
| `npm run validate-model`, `generate-vault`, `sync-vault`, `rebuild-index` | ✅ Done | Long tail of housekeeping commands |
| **No `npm run lint:plan-doc <path>`** | ❌ Missing | A schematic check — NFP table present, three-pillar headings present, constants table, fail-soft table, tracing section, wiring-checklist references — would catch most "incomplete plan" rejections before handoff. |
| **No `npm run vision-audit <plan-doc>`** | ❌ Missing | Mechanical surface: list which Vision files are referenced, flag uncited Vision premises, flag taste-profile entries the plan invokes. The qualitative judgment still belongs to the agent; the surface is mechanical. |
| **No `npm run design-brief`** | ❌ Missing | Counterpart to `authoring-brief`. Compiles Vision/ summary + state-of-game-design Parts 0–2 + NFPs + load-bearing decisions into one ≤8 KB brief. Enables the design loop to load one brief instead of two large skills. |
| **No `npm run plan-doc-template <slug>`** | ❌ Missing | Generate `Docs/plans/YYYY-MM-DD-<slug>.md` skeleton from `_template.md`. Agents currently reconstruct structure each time. |
| **No `npm run linear-context <THR-id>`** | ❌ Missing | Pre-fetch a Linear issue's description + comments + labels into a flat file the design agent reads once, instead of repeated MCP round-trips. Useful for Cowork pickup of Implementation Planning items and CC pickup of Ready for Dev items. |
| **No `npm run grill-me-template <topic>`** | ❌ Missing | Generate the empty grill-me file from `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md` template — small, but removes a step. |
| **No `npm run worktree-spawn <THR-id>`** | ❌ Missing | Cross-cutting, useful for Codex / CC parallel sessions on independent issues. Could be deferred — not a design-loop blocker. |

---

## Recommendations

The recommendations below are sized in WSJF terms — value (token saved × frequency × error reduction) over effort. The design-loop is the highest-frequency skill load in the project, so even small reductions compound.

### Quick wins (do this week)

**QW-1. Fix `state-of-game-design/SKILL.md` duplication.** Lines 350–405 and 411–461 contain the same Part 6 and Part 7 tables and the same "After Loading This Skill" routing table. Delete the second copy. Saves ~3 KB on every design-loop load. Effort: 10 min. Value: highest-frequency skill in the project. **WSJF: very high.**

**QW-2. Promote `Docs/plans/_template.md`.** Author a plan-doc skeleton from the structure described in `CLAUDE.md` § Design Governance + `game-design-direction` § Brainstorm Companion. Reference it from both files. Removes a recurring "reconstruct structure from prose" step. Effort: 30 min. **WSJF: high.**

**QW-3. Move large templates inside SKILL.md files into `reference/` folders.** Apply the encounter-pipeline `agents/` pattern:
- `game-design-direction/reference/brainstorm-companion-template.md` (currently lines 154–223, ~3 KB)
- `game-design-direction/reference/debate-protocol.md` (currently lines 92–143, ~2 KB)
- `design-council/reference/page-template.md` (currently lines 196–250, ~2 KB)
- `design-council/reference/role-prompts/<perspective>.md` for the four perspective frames (currently lines 142–164)

Each move drops orchestrator load while keeping the content one tool-call away. Effort: 1–2 h. **WSJF: high.**

**QW-4. Compile `Docs/design-brief.md` (analogous to `Docs/authoring-brief.md`).** Condense Vision/ summary + state-of-game-design Parts 0–2 + NFPs + load-bearing decisions into ≤8 KB. Add `npm run check:design-brief` for staleness, mirroring `check:authoring-brief`. Then update `state-of-game-design` and `game-design-direction` to read the brief first and only fall back to source on `check:design-brief` failure. Saves ~30 KB on every design-loop load. Effort: 4–6 h (mostly authoring + freshness-script clone). **WSJF: highest.** This is the single biggest lever in the audit.

### Medium-term improvements (do this month)

**MT-1. Split `state-of-game-design` into router + reference shards** (mirrors UL pattern). Once the design-brief lands, refactor the skill itself:
- `state-of-game-design/SKILL.md` becomes a thin router (~3 KB) pointing at the brief and at on-demand shards
- `state-of-game-design/reference/cosmology.md` (Reaches, Spheres, scales — for content/cosmology work)
- `state-of-game-design/reference/verbs-resolution.md` (5 verbs, sigmoid, prerequisites — for engine work)
- `state-of-game-design/reference/architectural-decisions.md` (load-bearing — for plan / audit work)
- `state-of-game-design/reference/deprecated.md` (rejected approaches — for "should we re-try X?" moments)

Agents pull only the shard their task needs. Effort: 1–2 days. **WSJF: high** — but only after QW-1 and QW-4 land, since those reduce the urgency.

**MT-2. Fork the plan-finalization audit into three parallel subagents.** When a plan doc is ready for handoff, spawn (single message, three Agent calls):
- **NFP-auditor** — checks all 7 NFPs against the plan, returns a NFP-compliance table
- **Three-pillar auditor** — checks Engine / Content / UI sections present and substantive, returns coverage verdict
- **Vision auditor** — runs the 5 Vision-file checks, returns premise touchpoints + any contradictions

Each returns ≤300 words. The orchestrator integrates verdicts. The pattern mirrors `design-council` Round 1 and `game-design-direction` debate. Effort: 1–2 days authoring the role-prompts + integration. **WSJF: high** — every Cowork design pass becomes more rigorous and the orchestrator does less inline auditing.

**MT-3. Add `npm run lint:plan-doc <path>`.** Schematic check — does the doc have a NFP-compliance table, three-pillar sections, a constants table, a fail-soft table, a tracing section, references to `Docs/plans/wiring-checklist.md`. Pre-commit hook can run it on changed files in `Docs/plans/`. Catches incomplete plans before handoff. Effort: half-day. **WSJF: medium-high.** Quality gate equivalent to `check:process` for plan docs.

**MT-4. Add `npm run vision-audit <plan-doc>`.** Mechanical pass — lists which Vision files are referenced by path, flags Vision premises mentioned by name without citation, flags taste-profile entries the plan would update. Output is a structured report the agent reads instead of re-reading all six Vision files. Effort: half-day. **WSJF: medium-high.** Pairs with MT-2's Vision-auditor subagent.

**MT-5. Add `agents/` subfolder to `grill-me` and `design-council`.** Pre-author the grill-question patterns and the four design-council perspective role-prompts on disk. Effort: 1 day. Brings these skills up to the encounter-pipeline pattern. **WSJF: medium.**

**MT-6. Decide design-council audience.** Currently `.agents/` only. CC sometimes asks for council input on ambiguous review findings; if that's still the intended path, it needs to be in `.claude/`. If not, document explicitly that CC escalates to Cowork for council. Effort: 1 h decision + mirror. **WSJF: low effort, medium impact on coordination clarity.**

### Larger structural moves (consider for a future grooming cycle)

**LR-1. Build a `design-pipeline` skill** mirroring `encounter-pipeline` for non-trivial multi-pillar designs:
- Pass 1 (Opus): grill-me synthesis
- Pass 2 (Opus): plan + brainstorm companion drafting
- Pass 3 (Sonnet, three parallel subagents): NFP / three-pillar / Vision audit
- Pass 4 (Sonnet): handoff prep — generates Linear handoff comment, applies `plan-pending-commit` label

Expected outcome: design passes that today take Cowork most of a session compress to a deterministic pipeline that Cowork can supervise rather than execute. Effort: 1–2 weeks. **WSJF: high** but only after MT-1 and MT-2 prove the underlying patterns. Not yet ready to file.

**LR-2. Reduce CLAUDE.md surface area.** CLAUDE.md is ~59 KB and is loaded every session. Sections that could move to dedicated files referenced by CLAUDE.md:
- The full Ubiquitous-Language treatment (already partially extracted to `Docs/ubiquitous-language/README.md`)
- Load-Bearing Architectural Decisions (could move to a `Docs/architecture/decisions.md`)
- Definition of Done / Session Workflow checklists (could move to `Docs/process/session-workflow.md`)

Effort: 1 day per section, plus careful "what does CLAUDE.md need to *always* say versus what can be referenced". **WSJF: high in absolute terms but politically expensive — CLAUDE.md is the trust anchor for every agent.** Defer until QW-4 + MT-1 land and the always-on cost is meaningfully reduced first.

**LR-3. `npm run linear-context <THR-id>`.** Pre-fetch issue body, comments, labels into a flat file the design agent reads once. Useful for Cowork pickup of Implementation Planning items and CC pickup of Ready for Dev. Effort: half-day. **WSJF: medium.** A nice complement to the merge-gated handoff protocol.

---

## Brief / Vision / NFP touchpoints

This audit's recommendations interact with the following project commitments — surfaced here so any approval pass catches conflicts.

- **NFP #1 (Tunability):** Compiled briefs are derived artifacts; the source remains the canonical authority. Freshness checks (`check:design-brief`) preserve the named-constants discipline by failing loud on drift.
- **NFP #2 (Inspectability):** Forked audits *improve* inspectability — each subagent's verdict is on disk in the council/audit page, separable from the plan-drafting reasoning.
- **NFP #6 (Additive over destructive):** Every recommendation is additive (new files, new commands) except QW-1 (delete duplicate Part 6/7) and parts of MT-1 (split the skill). The split itself preserves all content; only its location changes.
- **Vision audit:** None of the recommendations contradict any Vision premise. The compiled-brief pattern is parallel to `Docs/authoring-brief.md`, which Vision has already implicitly endorsed by leaving in place.
- **Three-pillar coverage:** This audit is process-pillar work. Engine / Content / UI pillars are not in scope.
- **Coordination protocol (Rules 1–10):** No recommendations violate the protocol. MT-2 (forked audit) requires that the orchestrator owns the integration and the plan doc remains the canonical handoff artifact — which it does.

## Linear handoffs

**Recommended issue creation** (Cowork should file these as new Linear issues in the appropriate project; this audit doc is the design-pillar context for each):

| Linear title | WSJF | State | Project |
|---|---|---|---|
| `Fix state-of-game-design SKILL.md duplicate Part 6/7 sections` | very high | Ready for Codex | Continuous Improvement |
| `Author Docs/plans/_template.md plan-doc skeleton` | high | Ready for Codex | Continuous Improvement |
| `Move design-loop reference content into reference/ subfolders` | high | Ready for Codex | Continuous Improvement |
| `Compile Docs/design-brief.md + check:design-brief script` | highest | Implementation Planning (needs Cowork plan) | Continuous Improvement |
| `Split state-of-game-design into router + reference shards` | high | Implementation Planning (needs Cowork plan) | Continuous Improvement |
| `Fork plan-finalization audit into NFP / three-pillar / Vision subagents` | high | Implementation Planning (needs Cowork plan) | Continuous Improvement |
| `npm run lint:plan-doc — schematic plan-doc structure check` | medium-high | Ready for Codex (after _template.md exists) | Continuous Improvement |
| `npm run vision-audit — mechanical Vision-touchpoint surfacing` | medium-high | Ready for Codex (after design-brief exists) | Continuous Improvement |
| `Add agents/ subfolder to grill-me and design-council` | medium | Ready for Codex | Continuous Improvement |
| `Decide design-council audience (.agents only vs. mirror to .claude)` | low effort | Implementation Planning (1 h decision) | Continuous Improvement |

The two `Implementation Planning (needs Cowork plan)` items merit their own plan-docs because they have multi-step migrations and load-bearing implications.

---

## Closing observation

The pattern this audit recommends is not new to Threadbearer — it is the **encounter-pipeline pattern, applied to design** rather than to content authoring. encounter-pipeline already proves that fork + files + commands works at production scale in this codebase (4 passes, Opus / Sonnet model split, compiled brief, freshness check, auto-retry, file-handoff). The asymmetry between content-authoring and design-authoring tooling is a historical accident — content-authoring needed velocity earlier — not a design choice. Closing the gap is mostly applying a known-good template to the next workflow over.

The largest single reducible cost (state-of-game-design + game-design-direction loading at every design pass) is the only one that can plausibly move the needle by an order of magnitude. The rest is cumulative grinding gain. Both matter; QW-4 / MT-1 matter most.

---

## Next-step note for the user

I cannot file Linear issues from this Cowork session without your verdict on:
- Whether to file all ten as separate issues, or to bundle the four "Quick wins" into one issue and the rest individually.
- Whether the Continuous Improvement project is the right home, or whether some belong in the project that owns the design-loop (no clear owner today — possibly worth its own project).

Once you confirm, I will file the Linear issues and apply `plan-pending-commit` to this audit so the hourly `flush-plan-docs` task commits it.
