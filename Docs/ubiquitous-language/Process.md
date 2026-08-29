# Ubiquitous Language — Process

Not content-adjacent. Terms covering the development process: NFPs, design governance, definitions, and continuous improvement tooling — plus the project's identity terms.

---

### Threadbearer

**Aliases:** The Game, TFWS (retired)
**Also see:** `[[Ascendant]]`, `[[Quintessence]]`
**Status:** canonical

The game's name — director ruling 2026-08-28 (THR-1333), verbatim: *"the game is called threadbearer, it is available on threadbearer.co on the internet. that is it."* Its home on the internet is [threadbearer.co](https://threadbearer.co). Two other names appear in the project's history and remain valid **only** as identifiers, never as the game's name: **Threadbare** is the repo / Linear-team / codebase codename (`christianspliid-ui/threadbare`), and **The Fantasy World Simulator** is the retired working title that survives in directory names (the vault's `TheFantasyWorldSimulator/` folder, the local project path). Player-facing and design-facing surfaces say Threadbearer; paths and identifiers are not renamed for it.

---

### Non-Functional Priority (NFP)

**Aliases:** NFP, Non-Functional Requirement
**Also see:** `[[Three-Pillar Rule]]`, `[[Definition of Done]]`
**Status:** canonical

One of seven ordered development priorities that govern design trade-offs when in tension: Tunability, Inspectability, Determinism, Fail-soft, Narrative over mechanical, Additive over destructive, Performance budget — higher-numbered yield to lower-numbered. The authoritative statement (with each priority's gloss) is CLAUDE.md § Non-Functional Priorities; this entry defines the term and does not restate the glosses (single-authority rule, 2026-08-25).

---

### Three-Pillar Rule

**Aliases:** Three Pillars, Engine/Content/UI Rule
**Also see:** `[[Non-Functional Priority]]`, `[[Design Governance]]`
**Status:** canonical

Every feature must address all three pillars — **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, player controls, debug visibility) — or explicitly mark each as N/A with rationale. One- or two-pillar designs are not forwarded to the executor. Authoritative statement: `Docs/canon/design-governance.md` § Three-Pillar Rule (THR-760).

---

### Definition of Done

**Aliases:** DoD, Done Criteria, Closeout Checklist
**Also see:** `[[Fixes THR-XX]]`, `[[Coordination Block]]`
**Status:** canonical

The mandatory closeout checklist for every completed issue: commit (with `Fixes THR-XX`), push, merge to main, verify deploy, add a `Docs/status/` fragment (the generated `project-status.md` is untracked), update `project-history.md`, update `changelog.md`, update `wiring-checklist.md` if new surfaces added, update systemic wiring guide if new engine capabilities added, log all deferrals as Linear issues, log impediments. Work is not done until all items are checked.

---

### Design Governance

**Aliases:** Design Checklist, Design Workflow
**Also see:** `[[Three-Pillar Rule]]`, `[[Vision Audit]]`, `[[Grill-me]]`
**Status:** canonical

The checklist governing how features are designed before implementation — draft through audits to presentation, with the invariant that a non-compliant design is never presented. The authoritative checklist lives at `Docs/canon/design-governance.md` (THR-760) and has grown well past the "8 steps" this entry once restated (substrate-existence, interface-impact, intent-judge, and forked-audit gates among the additions); this entry deliberately does not carry a copy, because the copy drifted (caught by the 2026-08-28 audit at 8 steps vs the authority's 15).

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

The adversarial pre-design questioning skill that extracts scope ambiguities, alternative approaches, and grey zones before implementation begins. Invoked as step 0 of Design Governance for non-trivial work. Auto-triggers on large scope, multi-pillar tasks, or explicit user request. Output is written to the **vault** at `Brainstorms/YYYY-MM-DD-<topic>-grill-me.md` — an exploratory artifact, never committed to `Docs/plans/` (THR-918/THR-944; this entry previously taught the repo path, contradicting the authority — caught by the 2026-08-28 audit). Its surviving conclusions ride the plan doc's own argument.

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

The design artifact in `Docs/plans/YYYY-MM-DD-<topic>.md`, authored in a design session, that turns a Linear issue into something an executor can implement. Each plan covers all three pillars (Engine, Content, UI), runs the NFP audit, lists constants and traces, marks fail-soft cases, and produces the wiring section that connects new modules to orchestrator phases, UI components, and trace categories. The design session commits the file directly via its own `docs/plan-*` PR. Distinct from the Linear state **Implementation Planning**, which is the workflow phase where the plan is being written.

---

### claim-without-anchor

**Aliases:** Law 56-hollow, hollow chip
**Also see:** `[[write-without-consumer]]`, `[[render-private-pipeline]]`, `[[Consequence Chip]]`, `[[WorldRef]]`, `[[Wiring Checklist]]`
**Status:** canonical

**Interface text names a simulation object without declaring a referent.** The surface tells the player something about the world; nothing in the payload says *which* world object it means, so no consumer can route to it, verify it, or notice when it stops being true. The canonical instance is a `[[Consequence Chip]]` reporting a change no game-state write backs — the violation UI Law 56 forbids (`Docs/design-system/laws.md`, law 56).

**The alias is recorded rather than replaced.** "Law-56-hollow" was already in-tree at `src/types/unifiedAction.ts` before this entry existed. Minting a competing term would have left the code and the glossary naming the same defect two ways, which is the drift the UL exists to end — so `claim-without-anchor` is the UL head term and *Law 56-hollow* is its alias, not a rival.

**Detected in two populations, because one gate cannot see both.** `check:chip-anchors` clause 2 fails a chip that *declares* a referent and anchors nothing. Chips declaring neither a `stateNoun` nor a `concepts` list are outside that clause by construction, and green there means **unmeasured, not clean** — so `check:chip-anchors -- --baseline` counts that population against the committed `chip-referent-baseline.json` and fails on an increase. Measured population at the ratchet's introduction (THR-1212 slice 3): **443 chips**, drained at batch cadence by the encounter-factory retrofit line rather than swept, because a gate red on arrival blocks every PR. The ratchet compares totals, so anchoring three chips while authoring three unanchored ones passes — a stated limitation, not coverage.

The referent vocabulary a chip should declare against is `[[WorldRef]]`. On the interface map this class carries its own badge (🟣 HOLLOW), defined by pointer to this entry — the map points here; it does not restate the definition.

---

### write-without-consumer

**Aliases:** unconsumed write, dead write
**Also see:** `[[claim-without-anchor]]`, `[[render-private-pipeline]]`, `[[Wiring Checklist]]`, `[[Definition of Done]]`
**Status:** canonical

**A write nothing acts on.** A producer keeps writing a property, edge, event or trace whose consumer was rewritten away — or never existed. Tests still assert the write, typecheck passes, and the game silently loses the richness the write was for. This is the defect class the system interface map was built to catch, where it is badged 🔴 LEAKED; the two are the same class under two names, the UL term being the general one and the badge its expression on one registry.

**It is now derived rather than asserted.** `Docs/canon/consumption-ledger.generated.md` (THR-1212 slice 4) classifies every aftermath effect kind and GraphOp by *what reads it*, so membership in this class falls out of each row's consumer list instead of being authored per row — a ledger that asks what the reader does, not whether one exists. An empty-consumer row is legal only with a cited `Deferral` ticket; the generator exits non-zero otherwise.

**"Something will read this later" without a ticket is how features leak** — the interface map's second stewardship rule states the obligation directly: a plan that adds a write must name the production read site in the same plan, or open a `Deferral` issue and cite it in the contract row.

---

### render-private-pipeline

**Aliases:** private-pipeline render
**Also see:** `[[claim-without-anchor]]`, `[[write-without-consumer]]`, `[[Wiring Checklist]]`
**Status:** canonical

**A surface renders from a pipeline no other consumer can reach.** The display works, so nothing looks broken; but the data path feeding it is private to that one surface, so no other system can read the same state, no gate can verify it, and a second surface wanting the same fact must build a parallel path rather than share one. The failure is architectural rather than visible — it surfaces later as two surfaces disagreeing about the same world fact.

The interface map covers this class **partially**: a private pipeline whose producer and consumer are the same subsystem passes every symbol check, because both halves genuinely exist. What the map catches is the downstream shape — the second consumer that cannot reach the data — not the privacy itself. Recorded here with that gap stated, rather than badged as covered.
