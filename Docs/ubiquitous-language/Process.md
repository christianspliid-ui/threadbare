# Ubiquitous Language — Process

Not content-adjacent. Terms covering the development process: NFPs, design governance, definitions, and continuous improvement tooling.

---

### Non-Functional Priority (NFP)

**Aliases:** NFP, Non-Functional Requirement
**Also see:** `[[Three-Pillar Rule]]`, `[[Definition of Done]]`
**Status:** canonical

One of seven ordered development priorities that govern design trade-offs when in tension. In order: (1) Tunability, (2) Inspectability, (3) Determinism, (4) Fail-soft, (5) Narrative over mechanical, (6) Additive over destructive, (7) Performance budget. Higher-numbered NFPs yield to lower-numbered ones when they conflict.

---

### Three-Pillar Rule

**Aliases:** Three Pillars, Engine/Content/UI Rule
**Also see:** `[[Non-Functional Priority]]`, `[[Design Governance]]`
**Status:** canonical

Every feature must address all three pillars — **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, player controls, debug visibility) — or explicitly mark each as N/A with rationale. Designs and plans covering only one or two pillars produce incomplete features. Incomplete features are not forwarded to executors.

---

### Definition of Done

**Aliases:** DoD, Done Criteria, Closeout Checklist
**Also see:** `[[Fixes THR-XX]]`, `[[Coordination Block]]`
**Status:** canonical

The mandatory closeout checklist for every completed issue: commit (with `Fixes THR-XX`), push, merge to main, verify deploy, update `project-status.md` and `project-history.md`, update `changelog.md`, update `wiring-checklist.md` if new surfaces added, update systemic wiring guide if new engine capabilities added, log all deferrals as Linear issues, log impediments. Work is not done until all items are checked.

---

### Design Governance

**Aliases:** Design Checklist, Design Workflow
**Also see:** `[[Three-Pillar Rule]]`, `[[Vision Audit]]`, `[[Grill-me]]`
**Status:** canonical

The 8-step checklist governing how features are designed before implementation: (0) grill-me pre-pass, (1) draft covering all three pillars, (2) draft brainstorm companion, (3) audit against NFPs, (4) revise inline, (5) add NFP compliance table, (6) three-pillar check, (7) Vision audit, (8) present finished design. Steps 1–4 happen in a single internal pass — never present a non-compliant design.

---

### Ubiquitous Language (UL)

**Aliases:** UL, Glossary, Canonical Terms
**Also see:** `[[Drift Scan]]`, `[[UL-proposal]]`
**Status:** canonical

The sharded canonical glossary (`Docs/ubiquitous-language/`) establishing the authoritative definition of every domain concept used across code, documentation, and agent communication. When CLAUDE.md, Obsidian, code comments, or agent output disagree on terminology, UL wins. UL is the foundation layer — content taxonomies sit above it, not the other way around.

---

### Domain Canon Page

**Aliases:** Canon Page
**Also see:** `[[Ubiquitous Language]]`, `[[Documentation Ownership]]`
**Status:** canonical

A short (<=200 lines) navigation document at `Docs/canon/<domain>.md` used as the agent Step 0 entrypoint for authoring work in that domain. A Domain Canon Page does not own term definitions (UL owns those) or implementation rationale (plan docs own that). It lists current spec pointers, current rejected approaches, current open questions, and a `last_reviewed` field with reviewer attribution. Authoring skills load the relevant Domain Canon Page before any other reference material.

---

### Grill-me

**Aliases:** Grill-me Skill, Adversarial Questioning
**Also see:** `[[Design Governance]]`
**Status:** canonical

The adversarial pre-design questioning skill that extracts scope ambiguities, alternative approaches, and grey zones before implementation begins. Invoked as step 0 of Design Governance for non-trivial work. Auto-triggers on large scope, multi-pillar tasks, or explicit user request. Output is written to `Docs/plans/YYYY-MM-DD-<topic>-grill-me.md` and consumed by step 1 of the design checklist.

---

### Vision Audit

**Aliases:** Vision Check
**Also see:** `[[Design Governance]]`
**Status:** canonical

Step 7 of Design Governance: verifying that a design does not contradict or silently update any Vision premise. If a Vision premise is contradicted, the edit to `Vision/` is part of the current ticket's scope — not a follow-up. Vision premises are in the Obsidian vault under `Vision/`.

---

### Wiring Checklist

**Aliases:** Integration Checklist
**Also see:** `[[Definition of Done]]`, `[[Three-Pillar Rule]]`
**Status:** canonical

The verification document (`Docs/plans/wiring-checklist.md`) confirming that every new module is connected across all required surfaces: orchestrator phase, UI component, GameState fields, traces emitted, player controls connected. Updated as part of every Definition of Done that adds new surfaces.

---

### Drift Scan

**Aliases:** Weekly Drift Scan, Codebase Drift Scan
**Also see:** `[[Retrospective]]`, `[[UL-proposal]]`
**Status:** canonical

The weekly GitHub Action (`.github/workflows/drift-scan.yml`) that runs four signals against `main` and produces per-signal Linear issues (label: `drift-scan`) in Continuous Improvement. Signals: coupling creep, broken-windows tally, test suite health, and UL drift. The retrospective reads `drift-scan`-labeled issues as its first input. The scan runs ~1 hour before the retrospective on Fridays.

---

### Retrospective

**Aliases:** Weekly Retro, Retrospective Skill
**Also see:** `[[Drift Scan]]`, `[[Non-Functional Priority]]`
**Status:** canonical

The weekly synthesis of the impediment log (`Docs/impediments.md`) + drift scan issues into a structured retrospective document (`Design/retros/retro-YYYY-MM-DD.md`). Run via the `retrospective` skill. The retrospective implements quick wins inline and opens Linear issues for larger improvements. It is the sense-making layer that converts quantitative scan data into qualitative judgment.

---

### UL-proposal

**Aliases:** UL Proposal, Terminology Proposal
**Also see:** `[[Ubiquitous Language]]`, `[[Drift Scan]]`
**Status:** canonical

The Linear issue label used by the `ubiquitous-language` skill when proposing a new canonical term or a retirement of a stale term. Issues land in Continuous Improvement with this label. A `UL-proposal` issue must include: proposed term + definition, where/why it was encountered (with quote), its relationship to existing terms, and content-adjacency assessment. Approval is always human — no auto-merge.

---

### Implementation Plan

**Aliases:** Plan Doc, Design Doc, Plan
**Also see:** `[[Design Governance]]`, `[[Definition of Done]]`, `[[Coordination Block]]`
**Status:** canonical

The Cowork-authored design artifact in `Docs/plans/YYYY-MM-DD-<topic>.md` that turns a Linear issue into something an executor can implement. Each plan covers all three pillars (Engine, Content, UI), runs the NFP audit, lists constants and traces, marks fail-soft cases, and produces the wiring section that connects new modules to orchestrator phases, UI components, and trace categories. The plan-pending-commit label gates an hourly scheduled task that commits the file to `origin/main`. Distinct from the Linear state **Implementation Planning**, which is the workflow phase where the plan is being written.
