---
domain: process
last_reviewed: 2026-08-06
reviewer: claude-code
ul_shards: [Process]
status: live
---

# Canon — Design Governance

> **Authoritative home for the design-governance contract** (moved out of `CLAUDE.md` § Design Governance by THR-760, 2026-07-26). Unlike most rows on [`process.md`](process.md), this page is not a pointer — the rules below live here. CLAUDE.md keeps a one-paragraph summary and a link to this file.
>
> Split out of `process.md` rather than inlined there because `process.md` was already at 103 lines and the canon budget is ~200; the plan (`Docs/plans/2026-07-25-thr-760-claude-md-slimming.md` item 2a) sanctions this split explicitly.

Every design proposal **must be architecturally compliant before the user ever sees it.** Steps 1–4 happen in a single internal pass — never present a non-compliant design. If an NFP conflict is structural (not just a missing constant), flag it as a trade-off for the user.

## Three-Pillar Rule

Every feature touches three pillars: **Engine** (systems, tick loop, graph), **Content** (encounters, prose, templates, data), and **UI** (components, modals, HexMap, player controls). Designs and plans that cover only one or two pillars produce incomplete features that CC rightfully defers. **Do not move an issue forward unless all three pillars are addressed or explicitly marked N/A with rationale.** See exit criteria in `Docs/plans/2026-04-13-linear-coordination-protocol.md`.

## Design workflow checklist

- [ ] **Step 0 - grill-me pre-pass (if non-trivial)** — run `grill-me` before drafting when scope is large, multi-pillar, ambiguous, or explicitly requested. Auto-trigger asks permission first; synthesis lands in the vault at `Brainstorms/YYYY-MM-DD-<topic>-grill-me.md` (THR-944). **It is an exploratory artifact and stays one** — grill-me runs on work that is still open, before a plan doc exists, which is the exploratory stage by definition, so it owes no git, PR, CI or lint (THR-918 § Plan-doc lifecycle). It is *not* promoted into `Docs/plans/` as a separate committed file: what survived the grilling belongs in the plan doc's own argument, and the vault draft stays as the iteration record. A committed `-grill-me.md` would be a second copy of conclusions the plan doc already has to make.
- [ ] **Step 0.5 - Codesight pre-flight (if change touches `src/`)** — before drafting, query Codesight for blast radius (who imports the affected files?) and dependency chain (what do they import?). Use `.codesight/graph.md` for the dependency graph and the codesight MCP for live queries when available. If any file in scope has **≥100 importers**, the plan doc must include a **Blast Radius** section up front (see Per-system required sections below). Skip this step entirely for process / doc-only / skill-only changes that don't touch `src/`. If `npx codesight` / `.codesight/` is unavailable in the sandbox, fall back to manual `grep -rn "from.*<path>" src/` to count importers and log the missing-tool case as an impediment.
- [ ] **Step 0.6 - Substrate-existence check (mandatory for any Engine-pillar plan)** — Step 0.5 asks "who imports the files I'm changing"; a green-field plan names no files, so it answers nothing. This step asks the opposite question: **does what I'm designing already exist?** Before drafting, (a) load `Docs/canon/systems-inventory.md` and grep it for your premise's domain nouns *and their synonyms* (e.g. war → army, battle, siege, cohesion, TB-073), and (b) `grep -ri` those nouns across `src/engine/`. The plan doc **must open with a `## Substrate inventory` section** stating what already exists and whether the plan **extends / activates / replaces** it. A green-field claim ("this is new") is only valid with the grep evidence in that section — literally "0 hits for X / Y / Z across the inventory and `src/engine/`". A DORMANT badge in the inventory means the system is *built but silent* — you activate or tune it, you do not rebuild it. This exists because THR-614 planned a green-field war system while ~3,300 lines of it sat wired and dormant in `orchestrator.ts`.
- [ ] **Step 0.7 - Interface impact check (mandatory for any subsystem listed in `Docs/canon/interface-map.md` — audited or ⚪ UNAUDITED)** — Step 0.6 asks "does this substrate exist?"; this asks **"which cross-system contracts flow through it, and are they still alive?"** File-import tools cannot see property-bag contracts, which is where 3 of the 5 attachment leaks lived. For an audited subsystem, enumerate its contracts from `Docs/canon/interface-map.generated.md`; for an UNAUDITED one, this plan writes its contract table (audit-on-touch: verify with greps, don't transcribe intentions) — **UNAUDITED is a to-do marker, never an exemption**. The plan doc must include an `## Interface impact` table: contract → preserve / extend (name the new producer or consumer) / add (register the row in `scripts/interface-contracts.ts` in the same change) / retire (explicit, user verdict if player-facing). A plan that adds a cross-system write without naming its production read site is incomplete — a "later" consumer requires a `Deferral`-labeled issue cited in the row. `npm run lint:plan-doc` flags a plan that names a mapped subsystem with no such section (advisory).
- [ ] **Draft** the system design — covering all three pillars (Engine, Content, UI)
- [ ] **Draft the Brainstorm companion** alongside the plan — same pass, not retrofit. Capture considered alternatives, tensions surfaced, Vision premises invoked.
- [ ] **Audit** against all 7 NFPs, load-bearing decisions, and rejected approaches
- [ ] **Revise** — integrate remediations inline (not in a separate appendix)
- [ ] **Summarize** — NFP Compliance table at the end (PASS / PASS with note per priority)
- [ ] **Three-pillar check** — Engine section present? Content section present? UI section present? Wiring section connecting them?
- [ ] **Step 8.5 - Intent-judge verdict** — after summarize and three-pillar check, before presenting. Spawn `intent-judge` as a Task subagent (`model: "opus"`). Author must first produce an action proposal at `Docs/plans/.intent-proposals/<slug>.md` (template at `.claude/skills/intent-judge/proposal-template.md`). Verdict gates the handoff: Allow → proceed; Revise → fix and re-run; Block → rewrite; Escalate → ping user with verbatim finding.
- [ ] **Step 8.6 - Forked structural audit (design-audit-pipeline)** — after intent-judge Allow, before opening the plan-doc PR. Spawn three subagents in one message (NFP / three-pillar / Vision) via `.claude/skills/design-audit-pipeline/SKILL.md`. Each returns ≤300-word verdict. Orchestrator writes verdicts into the plan-doc tail under `## Forked-audit verdicts`. If any FAIL or REVISE, surface to author before transitioning Linear state. Manual invocation: `/design-audit <plan-doc-path>`.
- [ ] **Vision audit** — does this plan contradict or update any Vision premise? If so, the Vision edit is part of this ticket's scope, not a follow-up.
- [ ] **Rulebook impact?** — does this plan change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)? If yes, the rulebook update is part of this ticket's scope, not a follow-up. Update `Docs/canon/rulebook.md` in the same PR and re-verdict the affected section.
- [ ] **Present** the finished, compliant design to the user

## Per-system required sections (inline, not appendix)

- [ ] **Engine pillar** — systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts
- [ ] **Content pillar** — encounter templates, prose tables, attachment content, data tables
- [ ] **UI pillar** — player-facing display, event notifications (alerts/toasts/chronicle), debug inspection (DebugPanel), visual presence (HexMapV2 signifiers/overlays). No UI pillar = incomplete design. **Closeout produces a screenshot + console artifact at 1920×1080 (Definition of Done §Browser-verify UI changes).** Design plans for new UI surfaces must name *which tool* will produce that artifact: Playwright (DOM), Claude-in-Chrome (Three.js / WebGL), or both.
- [ ] **UI conformance — the UI Law** *(THR-1004)* — **every game concept rendered to the player carries its image (`EntityVisual`), its tooltip, and its link where a page exists; magnitudes render as words, never numerals.** This binds every UI-pillar plan and **a UI ticket's Done-when includes it by default** — an executor does not need it restated, and a plan does not discharge it by saying the sentence names the thing. Two clauses that decide arguments about it: (a) the rule is broken most often *upstream of the component*, in an engine template literal (`${delta.toFixed(2)}`, a raw key like `star.positive`) that the surface then renders faithfully — so a plan touching derived player-facing strings owns banding them at the source, the way `engine/aftermathWords.ts` and `difficultyWord` do; (b) where a surface cannot tell which words are concepts, the **producer declares them** rather than the surface parsing English (see `EncounterAftermathChange.concepts`). Christian has stated this law twice from a screenshot; it is written here so a third time is not needed.
- [ ] **Wiring section** — for each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls. Reference `Docs/plans/wiring-checklist.md`. Module only in test files = not integrated.
- [ ] **Constants table** — every tunable number named, with default and purpose (NFP #1)
- [ ] **Tracing** — trace types emitted, with TypeScript interface definitions (NFP #2)
- [ ] **Fail-soft table** — failure cases and fallback behavior (NFP #4)
- [ ] **Interface impact** — one row per cross-system contract the plan touches, with an action (preserve / extend / add / retire). Required whenever the plan names a subsystem in `Docs/canon/interface-map.md`. See Step 0.7.
- [ ] **Blast Radius (only when high-impact files touched)** — required when the change touches any file with ≥100 importers (see the named list under `CLAUDE.md` § Codesight — Codebase Intelligence). For each high-impact file, list the importer count and a one-line cascade-risk note (e.g., "graph.ts — 531 importers; schema additions ripple through every node-creation site"). Surface up front in the plan doc, not in an appendix. Omit this section entirely when no high-impact file is touched.

## Maintenance and review

- [ ] **Update `Docs/plans/wiring-checklist.md`** when adding orchestrator phases, modals, GameState fields, trace categories, or player controls
- [ ] **Backfill older plans** — if a plan in `Docs/plans/` lacks NFP compliance or wiring, add them before implementing from it

## Last-reviewed

2026-08-06 (THR-1004 — added the UI Law to Per-system required sections § UI pillar; director ruling, stated twice in chat before being written down). Previously 2026-07-26 (THR-760 — content relocated verbatim from CLAUDE.md § Design Governance; no rule changed). Review trigger: when the design workflow gains or loses a step, when a Per-system required section is added or retired, or with the monthly `process.md` review.
