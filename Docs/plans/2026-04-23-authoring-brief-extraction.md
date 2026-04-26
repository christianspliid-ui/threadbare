# Authoring Brief — Compiled Content-Pipeline Preamble

**Date:** 2026-04-23
**Status:** Ready for Implementation
**Linear issue:** [THR-239](https://linear.app/threadbare/issue/THR-239)
**Project:** Content Architecture
**Source council:** `Docs/design-councils/2026-04-22-workflow-easier-to-change.md` (Content perspective, item 2)
**Companion issues:** [THR-243](https://linear.app/threadbare/issue/THR-243) (exemplars index), [THR-245](https://linear.app/threadbare/issue/THR-245) (content invariants v2)

---

## Problem

The encounter-pipeline and attachment-pipeline skills both require their draft agents to pre-read two large source documents before authoring anything:

| File | Lines | Purpose |
|---|---:|---|
| `Docs/plans/2026-04-16-systemic-wiring-guide.md` | 966 | The 7 engine capabilities content must wire through |
| `Docs/plans/2026-04-16-game-design-direction.md` | 281 | The 6 principles every encounter/attachment must satisfy |

Every pipeline run re-ingests both documents as fresh context. Every editorial pass must remember to apply the same rubric. Every systems pass must cross-reference the same capabilities. The cost compounds across the 4-pass pipeline (Opus draft, Opus editorial, Sonnet systems, Sonnet implementation) and across every run.

Three frictions fall out of this:

1. **Context cost** — 1,247 lines of source injected into opus-tier prompts on every draft. Attachment and encounter pipelines both pay it.
2. **Subtle drift** — different readers distill the same sources differently. Draft-pass agent emphasises one principle, editorial-pass agent emphasises another, systems-pass agent yet another. The user-facing symptom is inconsistent quality across runs.
3. **Update blast radius** — when either source doc changes, nothing makes it obvious to pipeline authors that their mental model is stale. The skills point at the files but don't pin a version.

## Solution

Extract `Docs/authoring-brief.md` — a compiled, versioned, ≤ 500-line preamble regenerated automatically when either source changes. The brief contains the minimum instruction set that draft, editorial, and systems agents need; pipeline orchestrators inject the brief instead of the full sources. Full sources remain canonical and are read when deeper context is genuinely needed.

**Generation is mechanical, not creative.** The brief is not a new design artefact — it is a compression of existing ones. A human reviews the brief after generation; the generator enforces budget and structure but does not invent content.

---

## Three-Pillar Audit

| Pillar | Touches | Rationale |
|---|---|---|
| **Engine** | **N/A** | No runtime engine behaviour changes. Nothing under `src/engine/` is modified. The game binary is unaffected. |
| **Content** | **Primary** | The artefact *is* content guidance. It changes what every encounter/attachment author reads before writing, and therefore shapes every downstream prose asset. |
| **UI** | **N/A** | No player-facing surface. No developer-facing UI either — consumers are the pipeline skills and their sub-agents. |

Per CLAUDE.md § Three-Pillar Rule: Engine and UI pillars are explicitly marked N/A with rationale. This is infrastructure work, not a feature, and the rule permits N/A marking when the scope is authentically single-pillar.

---

## Deliverables

### 1. `Docs/authoring-brief.md` — the compiled brief

A single markdown file with five fixed sections, generated from the two source documents. Target ≤ 500 lines including header.

**Section A — Header & Version Stamp**

```
# Authoring Brief

> **Generated:** 2026-04-23 by scripts/build-authoring-brief.ts
> **Sources:**
>   - Docs/plans/2026-04-16-systemic-wiring-guide.md (sha1: <hash>)
>   - Docs/plans/2026-04-16-game-design-direction.md (sha1: <hash>)
> **Do not hand-edit.** Regenerate via `npm run build-authoring-brief`.
```

**Section B — The 7 Engine Capabilities** (distilled from the wiring guide)

One subsection per capability. Each subsection is ≤ 40 lines and contains: a one-sentence capability statement, the minimum API a content author must know (placeholder names / effect kinds / trace categories — lifted verbatim from the source's reference tables), and one 2–3 line "why this changes what you write" paragraph. No worked examples, no anti-patterns (those stay in the full guide).

The 7 capabilities:

1. Enrichment placeholders (including conditional blocks)
2. Encounter seeding (aftermath that plants future encounters)
3. Hidden marks (witness / debt / mark-of-origin edges)
4. Reputation flow (how aftermath feeds reputation traits)
5. Graph operations (GraphOps — structural mutations from aftermath)
6. Intelligence & content grants (clues, recipes, map markers)
7. Divine intervention choices (god-verb framing, "let them handle it")

**Section C — The 6 Design Principles** (distilled from game-design-direction)

One subsection per principle, ≤ 15 lines each. Pattern: the principle in two lines, the failure mode in one line, the editorial-rejection trigger in one line. Total target ~90 lines.

1. Emotional read — condition over mechanic
2. Genuine dilemmas — no obvious right answer
3. Cool failure — narrative texture, never dead ends
4. Turn compatibility — works in quick scan and deep dive
5. Prose carries narrative — mechanics communicated through story
6. Content is design — the prose IS the player experience

**Section D — Player-as-God Framing Constraint** (distilled from the encounter-pipeline skill itself, elevated because it's a hard rejection trigger)

Five to ten lines. The constraint: the player is a god, never the character. Choices are god-actions (whisper, send vision, steady, strengthen, withdraw), never mortal-actions. "Let them handle it" must always be valid. Any encounter that has the player "choose how the character responds" is auto-REVISE.

**Section E — Editorial Valid-Rejection Triggers** (lifted from encounter-pipeline `editorial-prompt.md` and the SKILL.md "Automatic REVISE triggers")

The rejection checklist, as a single numbered list — every trigger that forces REVISE BEFORE CONTINUING. Currently seven items in encounter-pipeline plus the player-as-god constraint. The list is the authoritative copy; encounter-pipeline and attachment-pipeline reference it by anchor from their own prompts instead of maintaining their own.

### 2. `scripts/build-authoring-brief.ts` — the generator

TypeScript under `scripts/`, consistent with `scripts/validate-world-model.ts`, `scripts/check-process.ts`, `scripts/retro-draft.ts`. Run via `npm run build-authoring-brief`.

**Responsibilities:**

1. Read `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `Docs/plans/2026-04-16-game-design-direction.md`.
2. Extract the required slices deterministically — section anchors are known and stable in both sources (Part 2's 7 capability headings in the wiring guide; the 6 design principles in the direction doc's "Non-Negotiables" + "The Three-Beat Core Loop" sections).
3. Compute sha1 of each source; compare against the hashes recorded in the current brief header.
4. If either hash differs or the brief is missing: regenerate `Docs/authoring-brief.md` and write the new hashes into the header.
5. If hashes match: exit 0 silently (idempotent — safe to run in CI every push).
6. If generation produces > `AUTHORING_BRIEF_MAX_LINES` output: fail with a clear error asking the author to tighten the source sections or raise the cap.

**Determinism contract:** given the same inputs, the generator produces byte-identical output. No timestamps in the body (only the "Generated" header line, which is pinned to the source-hash change moment, not wall-clock run time — see `AUTHORING_BRIEF_GENERATED_AT` constant below). Section order fixed. No LLM calls — this is mechanical extraction.

### 3. `scripts/check-authoring-brief.ts` — the drift lint

A lightweight companion invoked by `npm run check:process` (the existing process lint, see `Docs/impediments.md` and `scripts/check-process.ts`). It computes source hashes, reads the brief header, and warns when they diverge. Non-blocking in CI (advisory, matching `check:process` policy today). Exit 0 with a stderr warning is sufficient.

### 4. `package.json` wiring

Add two scripts:

```json
{
  "build-authoring-brief": "tsx scripts/build-authoring-brief.ts",
  "check:authoring-brief": "tsx scripts/check-authoring-brief.ts"
}
```

Extend the existing `check:process` pipeline so it calls `check:authoring-brief` as one of its checks. No new CI workflow file — `check:process` is already advisory in CI.

### 5. Skill updates — encounter-pipeline and attachment-pipeline

Update the orchestrator SKILL.md in both pipelines to **prefer the brief** when available, with a **documented fallback** when it isn't:

- **encounter-pipeline** — in `Step 0: Pre-Read Reference Material`, add `Docs/authoring-brief.md` as item 0 (before the existing checklist). The existing items (`encounter-building-checklist.md`, `encounter-branching-templates.md`, Obsidian archetype pages) stay; those are orthogonal to the brief (structural contract + archetypes, not capability/principle rubric). Add one line: "If `Docs/authoring-brief.md` is missing or `check:authoring-brief` reports stale, fall back to reading the full sources: `Docs/plans/2026-04-16-systemic-wiring-guide.md` and `Docs/plans/2026-04-16-game-design-direction.md`."

- **attachment-pipeline** — same treatment in its orchestrator. Attachments don't need `encounter-branching-templates.md`, so the brief is a larger proportional win here.

The draft, editorial, and systems sub-agent prompts keep their current reference lists but have their first-choice source swapped from the full docs to the brief. A single-line edit each.

### 6. Brainstorm companion

`Brainstorms/2026-04-23-authoring-brief-extraction.md` (Obsidian vault) capturing:

- **Premise invoked:** every re-read of a large, versioned artefact is process debt; compile it once (council convergence: "automation over social convention").
- **Alternatives considered:**
  - Do nothing — pay the ingestion cost forever, accept drift. Rejected: cost is linear in pipeline runs and compounds over content volume.
  - Trim the source docs themselves — rejected. The wiring guide and design direction doc are reference documents with wider audiences (human readers, new agents onboarding, vault ingests). They should stay comprehensive. The brief is the tactical preamble.
  - Single-source the principles in the skill (no separate brief) — rejected. Keeps drift risk inside every skill; doesn't help the systems/implementation agents; couples the content rubric to pipeline plumbing.
  - Compile on the fly per run (no persisted file) — rejected. Loses determinism, loses the single artefact humans can read, and doesn't let the brief be diffed in PRs.
  - Two briefs (one per pipeline) — rejected. The overlap is large enough that a shared brief is simpler; pipeline-specific appendices can be added later if needed.
- **Tensions surfaced:** compression vs. fidelity. The 500-line cap is the explicit pressure; the generator should fail loudly when a source adds content that doesn't fit, forcing a conscious decision about whether to trim or to raise the cap. That failure mode is a feature, not a bug.
- **Vision audit:** nothing in `Vision/` changes. The game experience is unaffected. This is pure process.

---

## Constants & Tunables (NFP #1 — Tunability)

Every magic number is a named constant in `scripts/build-authoring-brief.ts`:

| Constant | Default | Purpose |
|---|---:|---|
| `AUTHORING_BRIEF_MAX_LINES` | `500` | Hard cap on generated output. Exceeding fails the build. |
| `AUTHORING_BRIEF_OUTPUT_PATH` | `Docs/authoring-brief.md` | Where the brief is written. |
| `AUTHORING_BRIEF_SOURCES` | `[<wiring guide>, <direction doc>]` | Source files, in order. Adding a source here = one code change. |
| `AUTHORING_BRIEF_HASH_ALGORITHM` | `'sha1'` | Hash used for drift detection. Speed over cryptographic strength; this is not a security boundary. |
| `AUTHORING_BRIEF_CAPABILITY_SECTION_MAX_LINES` | `40` | Per-capability budget in Section B. |
| `AUTHORING_BRIEF_PRINCIPLE_SECTION_MAX_LINES` | `15` | Per-principle budget in Section C. |
| `AUTHORING_BRIEF_GENERATED_AT` | source-hash-pinned ISO date | Written into the header. Changes only when a hash changes, not on every run, so idempotent re-runs produce byte-identical files. |

## Tracing (NFP #2 — Inspectability)

Not applicable at runtime — the generator is a one-shot script. Observability is the generator's own log output:

- `info:` which sources it read, their sha1 hashes
- `info:` whether the brief was regenerated or left unchanged
- `warn:` if drift detected from `check:authoring-brief`
- `error:` if over line budget, with the offending section and line count

No new trace category in the game's trace registry. This is offline tooling.

## Determinism (NFP #3)

The generator must be deterministic. Given the same two source files (byte-for-byte identical), it produces the same output byte-for-byte. Tests:

- `scripts/__tests__/build-authoring-brief.test.ts` — unit tests: extraction produces expected section structure; identical input → identical output over 5 runs; line-budget overflow triggers correct failure; missing source triggers correct failure; stale-hash detection works.

## Fail-Soft (NFP #4)

| Failure case | Fallback |
|---|---|
| `Docs/authoring-brief.md` missing at pipeline runtime | Orchestrator falls back to reading both full sources. Same behaviour as today — slower, not broken. |
| `check:authoring-brief` reports stale | CI warns (non-blocking). Orchestrator still prefers the brief but notes the stale hash in its pre-read log. |
| Generator over line budget | Generator fails with actionable error. Brief is not overwritten. Pipeline runs fall back to full sources until the issue is resolved. |
| Source file anchor missing (someone renamed a heading) | Generator fails with "expected anchor not found in <source>, at line <n>". Pipeline runs fall back to full sources. |

No fail case leaves the pipeline broken. Worst case is "slower" + visible warning, never "stuck".

## Narrative over Mechanical (NFP #5)

N/A — no game narrative involved. The brief's own prose must, however, preserve the source documents' voice: short, directive, specific. Generation extracts verbatim where possible; synthesis is limited to the section-header lines and the cross-reference ("For the full capability explanation, see `Docs/plans/2026-04-16-systemic-wiring-guide.md` § N").

## Additive over Destructive (NFP #6)

Pure addition. Existing source docs unchanged. Existing pipeline skills gain one pre-read item; none are removed. `check:process` gains one check. If the whole experiment fails, removal is `git rm Docs/authoring-brief.md scripts/build-authoring-brief.ts scripts/check-authoring-brief.ts` plus reverting two SKILL.md edits.

## Performance (NFP #7)

Generator runtime budget: < 1 second on the developer's machine. Two file reads, two sha1s, string manipulation, one file write. The check-script path (hashes match) is even faster.

---

## Wiring Checklist

Per `Docs/plans/wiring-checklist.md` — adapted because this is offline tooling, not a game feature:

| Surface | Needed? | Location |
|---|---|---|
| Orchestrator phase | N/A | No tick-phase work. |
| GameState field | N/A | No runtime state. |
| Modal / UI component | N/A | No user-facing UI. |
| Trace category | N/A | See NFP #2. |
| Debug panel view | N/A | See NFP #2. |
| Player controls | N/A | No player surface. |
| **Script registered in package.json** | Yes | `build-authoring-brief`, `check:authoring-brief` |
| **Called from CI** | Yes | Via `check:process` (advisory) |
| **Skill pre-read step** | Yes | encounter-pipeline + attachment-pipeline SKILL.md |
| **Impediment-log note** | Yes | Add one line under "Known Sandbox Limitations"-adjacent note if the brief path becomes load-bearing: "`Docs/authoring-brief.md` is generated — do not hand-edit." Could also live in the brief's own header (currently planned). |
| **Changelog row** | Yes | One row: `| 2026-04-DD | Docs/authoring-brief.md | added compiled brief | pipeline cost / drift |` |
| **project-status update** | Yes | One-line mention under the active Content Architecture project. |

---

## Implementation Plan

Suggested ordering — small, verifiable steps; each step can be committed independently.

1. **Write `scripts/build-authoring-brief.ts`** with constants, extraction functions, hash computation, deterministic output. Unit tests alongside.
2. **Run it once.** Commit the resulting `Docs/authoring-brief.md` as the initial output. Inspect by hand. Trim source sections or raise budgets only if a real section doesn't fit.
3. **Write `scripts/check-authoring-brief.ts`.** Invoke it manually. Then add it to `scripts/check-process.ts`.
4. **Update `package.json`** with both scripts.
5. **Update encounter-pipeline SKILL.md and its agent prompts** — one-line edits each, brief-preferred, full-sources fallback.
6. **Update attachment-pipeline SKILL.md and its agent prompts** — same edits.
7. **Run `/encounter-pipeline draft <trivial premise>`** to confirm the draft agent receives the brief and the pipeline still produces sound output. Compare draft quality against a pre-change baseline.
8. **Update `Docs/changelog.md` and `Docs/project-status.md`** per Definition of Done.
9. **Commit with `Fixes THR-239`.** Merge to main triggers Linear auto-close.

**Estimated effort:** 4–6 hours for an experienced TypeScript dev; mechanical throughout. The only judgment call is tuning the per-section budgets after inspecting the first real output.

---

## Open Questions — none load-bearing

1. **Does the brief belong in `Docs/` or `.claude/` / `.agents/`?** `Docs/` — because both pipeline trees reference it, and it's versioned with the project, not audience-specific. Answered.
2. **Should the brief include exemplar filenames?** No — exemplars are THR-243's scope. The brief references the existence of the exemplar index by one sentence and defers to `Docs/exemplars.md` for the list. The two issues compose cleanly.
3. **Should the brief compile the obsidian archetype pages too?** No — those are per-encounter domain selection, not universal preamble. Keep them as the orchestrator's own pre-read.

---

## NFP Compliance Summary

| NFP | Status | Note |
|---|---|---|
| 1. Tunability | PASS | All budgets and paths are named constants. |
| 2. Inspectability | PASS | Generator logs; source hashes in header; drift lint surfaces staleness. |
| 3. Determinism | PASS | Byte-identical output for identical inputs; tested. |
| 4. Fail-soft | PASS | Every failure path falls back to "read the full sources, slower but correct." |
| 5. Narrative over mechanical | N/A | No runtime narrative. |
| 6. Additive over destructive | PASS | Pure addition; removal is a three-file revert. |
| 7. Performance | PASS | Sub-second generator, effectively free in CI. |

---

## Coordination Notes

- **Parallel-safe with:** THR-243 (`Docs/exemplars.md` — different artefact, clean compose) and any encounter/attachment authoring work already in flight (those would consume the new brief from its first run after merge).
- **Mutex with:** any in-flight edit to `Docs/plans/2026-04-16-systemic-wiring-guide.md` or `Docs/plans/2026-04-16-game-design-direction.md` — the generator and its tests pin the source heading structure, so structural edits to those sources must land first (or coordinate with this work).
- **Codex review:** yes — script is mechanical extraction, tests are structural, changes are small and pattern-following. Good Codex fit.
- **Suggested model:** **sonnet** (matches the issue's existing `model:sonnet` label). Opus isn't needed — no creative writing, no novel system design. Sonnet handles the TypeScript authoring and the skill-file edits.

## Done When

- [ ] `Docs/authoring-brief.md` exists, ≤ 500 lines, sections A–E populated.
- [ ] `scripts/build-authoring-brief.ts` + tests pass.
- [ ] `scripts/check-authoring-brief.ts` integrated into `npm run check:process`.
- [ ] `npm run build-authoring-brief` is idempotent (second run produces no diff).
- [ ] encounter-pipeline and attachment-pipeline SKILL.md updated with brief pre-read + documented fallback.
- [ ] One end-to-end pipeline run (draft mode, trivial premise) confirms the brief loads correctly and quality is unchanged or improved.
- [ ] `Docs/changelog.md` + `Docs/project-status.md` updated.
- [ ] Closing commit includes `Fixes THR-239` and verification evidence (test output, `npx tsc --noEmit`, `npx vite build`).
