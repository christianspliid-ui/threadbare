# THR-458 — Compile `Docs/plans/_template.md`

> **Linear issue:** THR-458 (Continuous Improvement, Deferral, P3 Medium)
> **Sibling:** THR-449 (compile `Docs/design-brief.md` — same THR-376 partial-ship)
> **Source spec:** THR-376 § QW-2 + CLAUDE.md § Design Governance (lines 313–322) + `game-design-direction/SKILL.md` § Brainstorm Companion (lines 160–225)
> **Author:** Cowork (keep-work-flowing scheduled run, 2026-06-12)
> **Three pillars:** Engine N/A · Content (the file itself + CLAUDE.md pointer wiring) · UI N/A

## 1. Why this is small but load-bearing

THR-376 (QW-2) scoped "Author `Docs/plans/_template.md` plan-doc skeleton" into the design-loop quick-wins bundle and was marked Done 2026-05-12. The template was never written. THR-449 covered the parallel partial-ship gap for `Docs/design-brief.md`; this issue covers the `_template.md` gap.

**Why this matters more than a missing skeleton:** THR-379 (MT-3, `npm run lint:plan-doc`) is explicitly **blocked by THR-376 QW-2** — the linter needs a canonical reference document to lint against. Until `_template.md` exists, THR-379 cannot be picked up, and every new plan doc gets authored from memory of CLAUDE.md § Design Governance, leading to uneven section coverage. Three signals from the last 30 days of plan docs confirm the drift: missing Constants tables on engine-touching plans, missing Fail-soft tables on content plans, and inconsistent NFP-compliance table shape.

This is the **executor pass — not a design dialogue.** All source material is settled. CC compiles, sections are mechanical, the wiring is one CLAUDE.md sentence edit.

## 2. Content pillar — `Docs/plans/_template.md`

### 2.1 Length & format constraint

- **Soft cap:** ≤ 250 lines rendered. The template is a *skeleton with placeholders*, not an example essay.
- **Voice:** instructional — every section has a one-line italicized author-note explaining what goes there.
- **Placeholders use `<…>` not `TODO:`.** Authors fill `<…>`; `TODO:` confuses the future lint pass.
- **Heading levels match CLAUDE.md § Per-system required sections** verbatim (Engine pillar, Content pillar, UI pillar, Wiring, Constants table, Tracing, Fail-soft table, Blast Radius). This is what THR-379's lint will look for.
- **Top of file is a usage block** — 5 lines explaining how to use the template (copy, rename, fill placeholders, delete unused conditional sections).

### 2.2 Section outline (compile from canonical sources)

The template has **the following sections in order**, with placeholder content for each. CC copies the section headings from CLAUDE.md verbatim — the lint will key on heading text.

| # | Section | Source | Notes |
|---|---------|--------|-------|
| — | **Frontmatter** | THR-449 plan doc as pattern | `title`, `linear_issue`, `author`, `created`, `three_pillars` (Engine / Content / UI line — each `done` / `N/A — <reason>`) |
| — | **Top-of-file usage note** | new | 5 lines: "Copy to `Docs/plans/YYYY-MM-DD-thr-<id>-<slug>.md`. Fill placeholders. Delete sections marked CONDITIONAL if they don't apply. The closing NFP table is required even on doc-only changes." |
| 1 | **Why this is load-bearing** (or "Why now") | THR-449 pattern §1 | One paragraph framing — the *narrative* hook before the spec |
| 2 | **Engine pillar** | CLAUDE.md § Per-system required sections | Subsections: systems design, graph nodes/edges, tick phases, resolution logic, PRNG callouts. Author-note: "If N/A, state `Engine: N/A — <one-line reason>` and remove the subsections below." |
| 3 | **Content pillar** | CLAUDE.md | Subsections: encounter templates, prose tables, attachment content, data tables. Same N/A escape hatch. |
| 4 | **UI pillar** | CLAUDE.md | Subsections: player-facing display, event notifications, debug inspection, visual presence. **Author-note: name which tool produces the 1920×1080 screenshot — Playwright (DOM) / Claude-in-Chrome (WebGL) / both.** Same N/A escape hatch. |
| 5 | **Wiring section** | CLAUDE.md + `Docs/plans/wiring-checklist.md` | For each module: orchestrator phase, UI component, GameState flow, traces, debug visibility, prose pipeline (`enrichProse()`?), player controls. Explicit pointer line: `> See checklist: Docs/plans/wiring-checklist.md` |
| 6 | **Constants table** | CLAUDE.md (NFP #1) | 3-column markdown table: `Constant | Default | Purpose`. Placeholder row + author-note "every tunable number named". |
| 7 | **Tracing** | CLAUDE.md (NFP #2) | TypeScript interface block (\`\`\`ts fence) for each trace type. Placeholder interface + author-note. |
| 8 | **Fail-soft table** | CLAUDE.md (NFP #4) | 2-column markdown table: `Failure case | Fallback`. Placeholder row. |
| 9 | **Blast Radius (CONDITIONAL)** | CLAUDE.md § Per-system required sections | Author-note: "Required when any file in scope has ≥100 importers. See CLAUDE.md § Codesight — Codebase Intelligence for the named list. Delete this section if no high-impact file is touched." |
| 10 | **Three-pillar check** | CLAUDE.md § Design workflow checklist | `- [ ] Engine pillar present (or N/A with rationale)` × 3 + `- [ ] Wiring section connects them` |
| 11 | **Vision audit** | CLAUDE.md § Design workflow checklist | `- [ ] This plan does not contradict any Vision premise` + `- [ ] If it does, the Vision edit is part of this ticket's scope` |
| 12 | **Rulebook impact** | CLAUDE.md § Design workflow checklist | `- [ ] This plan does not change a rule of play (turn structure, action verb, prerequisite, resource, encounter, clock, win/loss)` + `- [ ] If it does, the rulebook update is part of this ticket's scope and `Docs/canon/rulebook.md` is updated in the same PR` |
| 13 | **Brainstorm companion pointer** | `game-design-direction/SKILL.md` § Brainstorm Companion | One line: `> Brainstorm companion: Docs/plans/<this-filename>-brainstorm.md (write alongside, not after).` + author-note pointing at the Brainstorm Companion template in `game-design-direction/SKILL.md` |
| 14 | **NFP-compliance table (required, even for doc-only)** | CLAUDE.md § Design workflow checklist | 7-row table — one row per NFP — columns: `NFP \| Verdict (PASS / PASS with note / FAIL) \| Note`. All 7 NFPs named: Tunability, Inspectability, Determinism, Fail-soft, Narrative over mechanical perfection, Additive over destructive, Performance budget. |
| 15 | **Done when** | THR-449 pattern §6 | Empty checklist with placeholder bullets + author-note "every closeout commit must include `Fixes THR-XXX` and verification evidence (npm test, tsc, vite build raw output or green CI link) per CLAUDE.md § Definition of Done" |
| 16 | **Coordination block** | THR-449 pattern §7 | Labelled subfields: `Suggested model:`, `Parallel-safe with:`, `Mutex with:`, `Codex review:`, `Files to touch:` (bulleted list). Author-note: "These five fields are the handoff. Filling them turns this plan into a Ready-for-Dev candidate." |
| 17 | **Notes for the executor (optional)** | THR-449 pattern §8 | Free-form list. Author-note: "Use for clarifications that don't fit the spec — what to NOT do, scope traps, judgment calls already made." |

**Total:** ~250 lines including author-notes. Well within the soft cap.

### 2.3 Heading text — copy verbatim from CLAUDE.md

CC: heading text matters for THR-379's future lint. Copy these strings verbatim — do not paraphrase:

- `## Engine pillar`
- `## Content pillar`
- `## UI pillar`
- `## Wiring`
- `## Constants table`
- `## Tracing`
- `## Fail-soft table`
- `## Blast Radius` (conditional — see CLAUDE.md)
- `## NFP-compliance table`

Other section names (`## Why this is load-bearing`, `## Done when`, `## Coordination block`, etc.) are not lint-keyed and can be lightly varied — match THR-449's plan doc as the established pattern.

## 3. Wiring pillar — CLAUDE.md pointer

### 3.1 CLAUDE.md edit

The existing sentence:
> Design docs live in `Docs/plans/` (named `YYYY-MM-DD-topic.md`). Find them by browsing the directory or loading the relevant domain skill.

Becomes:
> Design docs live in `Docs/plans/` (named `YYYY-MM-DD-topic.md`). New plans copy `Docs/plans/_template.md` as a skeleton. Find existing plans by browsing the directory or loading the relevant domain skill.

Single sentence change. No other CLAUDE.md edits.

### 3.2 `npm run lint:plan-doc` — explicitly out of scope

THR-379 (MT-3) is a separate Linear issue. **This ticket only ships `_template.md`.** It unblocks THR-379, it does not implement THR-379. If CC drifts into authoring the lint script, the ticket has grown — bounce the work back into the Linear comment and ship just the template.

## 4. Three-pillar coverage

| Pillar | Status | Note |
|--------|--------|------|
| Engine | N/A | No engine code touched. No tick phase, no graph node, no resolver. |
| Content | ✅ | The template itself — one new ≤250-line skeleton compiled from settled material. |
| UI | N/A | No player-facing surface. The template is read by agents authoring plan docs, not by players. **Browser-verify exempt** per CLAUDE.md § Definition of Done (doc-only change, snapshot tests cover render — there is no render). |

## 5. NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | No constants in the template content; the template *teaches* the Constants table convention. |
| 2. Inspectability | PASS | The template makes the NFP-compliance and Tracing sections explicit on every new plan — improving inspectability of future plans. |
| 3. Determinism | PASS | No code. |
| 4. Fail-soft | PASS — see fail-soft table | Author-noted fallback for missing sections; the template's "delete if N/A" pattern is itself a fail-soft for the per-system required sections. |
| 5. Narrative over mechanical perfection | PASS | The "Why this is load-bearing" section is required first — narrative framing before spec. |
| 6. Additive over destructive | PASS | One new file; one one-sentence CLAUDE.md edit that closes a known gap. |
| 7. Performance budget | N/A | No runtime. |

## 6. Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| Author copies template but deletes a required section without N/A note | THR-379's future lint catches it. Until then, plan-finalization audit (CLAUDE.md § Design workflow checklist Step 8.5 — intent-judge verdict) catches it. |
| Author over-runs the 250-line soft cap | Soft cap, not hard. Reviewer flags if the template grows by >20% — the template is a skeleton, not an example essay. |
| Heading text drifts from the lint-keyed strings in §2.3 | THR-379's lint catches it on the next plan that uses the template. Until then, harmless — template still serves as orientation. |
| CC merges the template with placeholder content still in `<…>` form | Easy to spot in PR review. The placeholders are intentionally `<…>`-bracketed for visual distinctness. |

## 7. Done when

- [ ] `Docs/plans/_template.md` exists, ≤ 250 lines, follows the §2.2 outline above
- [ ] Heading text in §2.3 matches CLAUDE.md verbatim (case-sensitive)
- [ ] Every section has placeholder content (or `<…>` brackets) and a one-line italicized author-note
- [ ] Top-of-file 5-line usage block present
- [ ] CLAUDE.md "Design docs live in `Docs/plans/`" sentence updated per §3.1
- [ ] Plan doc references `Docs/plans/wiring-checklist.md` from the Wiring section template
- [ ] NFP-compliance table at end with all 7 NFPs as rows
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` pass — doc-only change, but run them to confirm nothing unexpected broke
- [ ] Closing commit body includes `Fixes THR-458` and `Browser-verify exempt: doc-only change, no UI pillar touched`
- [ ] Linear completion comment links to the template and notes CLAUDE.md updated; flag that THR-379 (lint:plan-doc) is now unblocked

## 8. Coordination block

**Suggested model:** sonnet (250-line doc compile from settled material — no novel reasoning, but the lint-keyed heading discipline + 7-NFP table needs sonnet-level care; haiku risks paraphrasing the headings and breaking the future lint)

**Parallel-safe with:** THR-449 (different file: `_template.md` vs `design-brief.md` — both compile from settled material, no overlap), THR-455, THR-453, THR-456, THR-452, THR-451, THR-450 (all Ready for Dev; none touch `Docs/plans/_template.md` or the CLAUDE.md "Design docs live in" sentence)

**Mutex with:** THR-379 (lint:plan-doc) — only because THR-379 will key on this file's heading text once authored. Land this first; THR-379 can be unblocked in a follow-up grooming pass.

**Codex review:** no (doc-only change, no source code touched; structural review surface skipped per CLAUDE.md exemption convention)

**Files to touch:**
- Create: `Docs/plans/_template.md`
- Edit: `CLAUDE.md` (one sentence per §3.1)

## 9. Notes for the executor

1. **Don't write an example essay.** The template is a skeleton — every section is a heading + one-line author-note + minimal placeholder. If a section runs >15 lines, you've drifted into authoring an example. Cut.
2. **Heading text discipline.** §2.3 lists the verbatim strings. Copy them exactly. Casing matters, punctuation matters. The future THR-379 lint will key on these strings.
3. **The N/A escape hatch is the load-bearing part of the Engine/Content/UI sections.** Most plans only touch one or two pillars. The template must make it cheap to declare the other pillars N/A without deleting the headings (the lint expects them present).
4. **Don't scope-grow into THR-379.** If you find yourself writing the lint script, stop. The lint is a separate Linear issue. This ticket ships when the template exists.
5. **One CLAUDE.md edit.** Don't reorganize CLAUDE.md. Don't add a new section. Find the existing "Design docs live in `Docs/plans/`" sentence and replace it per §3.1.
