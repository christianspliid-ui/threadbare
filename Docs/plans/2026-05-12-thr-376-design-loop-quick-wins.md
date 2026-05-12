# THR-376 — Design-Loop Context-Economy Quick-Wins

**Date:** 2026-05-12
**Author:** Cowork
**Parent issue:** THR-376 (High priority, Continuous Improvement)
**Source audit:** `Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md` (THR-375)
**Status:** Design complete, ready for executor

---

## Premise

The 2026-05-08 design-loop audit (THR-375) identified four quick wins (QW-1..QW-4) on the design / planning agents and skill surfaces. Together they reduce the per-design-pass context cost (smaller monolithic SKILL.md files), produce a compiled brief that lets Cowork load one curated file instead of triangulating across six sources, and lock the plan-doc structure into a real template so the design-governance checklist stops drifting in prose. The four quick wins are bundled because they all edit the same surfaces (design-loop SKILL.md files + the build/check-script pattern) and are best shipped in a single PR to avoid merge churn against future MT-1..MT-6 work.

Cowork verified codebase state today (2026-05-12) before sending this plan to the executor:

- **QW-1 is now obsolete.** `state-of-game-design/SKILL.md` is 398 lines (down from 461), single copy of Part 6 and Part 7, no "After Loading This Skill" duplicate. The dedup happened sometime between the audit (2026-05-08) and now. **Do not re-implement QW-1.** The executor should still run `npm run check:skill-sync` after the bundle lands to confirm the `.claude/` ↔ `.agents/` mirror remains aligned for `state-of-game-design`.
- **QW-2..QW-4 remain.** `Docs/plans/_template.md`, `Docs/design-brief.md`, and `scripts/check-design-brief.ts` do not exist. `game-design-direction/SKILL.md` (259 lines) and `.agents/skills/design-council/SKILL.md` (269 lines) still inline the long templates and role prompts called out in QW-3.

Downstream blocked items:

- **MT-1 (THR-377)** — splitting `state-of-game-design` into router + shards — depended on QW-1's dedup and on QW-4's brief existing as the new front-door. Both gates now resolve once this bundle lands.
- **MT-3 (THR-379)** — `npm run lint:plan-doc` — depends on QW-2's template existing so the linter has a schema to check against.
- **MT-4 (THR-380)** — `npm run vision-audit` — depends on QW-4's brief pattern as the shared compiled-source idiom.

Shipping THR-376 unblocks all three.

## Scope

Three quick wins, in the order they should land within the PR. QW-1 is omitted (already done).

### QW-2 — Author `Docs/plans/_template.md` plan-doc skeleton

Distil the structure described in CLAUDE.md §Design Governance + `game-design-direction/SKILL.md` §Brainstorm Companion into a real template file. The template is the schema MT-3's linter will check against.

Required sections in the template (placeholders, not example content):

1. Header block — `Date`, `Author`, `Parent issue` (Linear ID), `Project`, `Status`
2. **Premise** — why this work matters now, in narrative paragraphs
3. **Scope** — concrete deliverables, ordered
4. **Three-Pillar Coverage** — Engine / Content / UI subsections; each pillar must be present, marked `N/A — <rationale>` if not applicable
5. **NFP compliance table** — one row per NFP (1–7), columns `PASS` / `PASS with note` / explanation
6. **Constants table** — every tunable named, default value, purpose (NFP #1)
7. **Tracing** — trace categories emitted with TypeScript interface stubs (NFP #2)
8. **Fail-soft table** — failure case → fallback behaviour (NFP #4)
9. **Wiring** — orchestrator phase / UI mount / GameState fields / traces / debug visibility / prose pipeline / player controls, per `Docs/plans/wiring-checklist.md`
10. **Blast Radius** — required when touching any file with ≥100 importers (Codesight pre-flight); omitted otherwise
11. **Rejected approaches** — bullets for alternatives considered and dropped
12. **Risks** — what could break this plan after handoff
13. **Done when** — explicit checklist mirroring Definition of Done

Reference the new template from both CLAUDE.md §Design Governance and `.claude/skills/game-design-direction/SKILL.md` (mirror to `.agents/`). One-line reference in each: "*Start from `Docs/plans/_template.md` when drafting a new plan.*"

### QW-3 — Move large inline templates into `reference/` folders

Apply the encounter-pipeline `agents/` pattern to the three design-loop skills. Verify line numbers when claiming — they may have drifted since the 2026-05-08 audit. Use section-heading anchors (e.g. `## Brainstorm Companion`, `## Pre-Design Debate`) instead of literal line numbers, since the SKILL.md files are still being edited.

| Source file | Section to extract | New file path | What stays in SKILL.md |
|---|---|---|---|
| `.claude/skills/game-design-direction/SKILL.md` | `## Brainstorm Companion` (the long "Minimal Template" block + sections list) | `.claude/skills/game-design-direction/reference/brainstorm-companion-template.md` | 1-line pointer: "*See `reference/brainstorm-companion-template.md` for the full structure.*" |
| `.claude/skills/game-design-direction/SKILL.md` | `## Pre-Design Debate` (the protocol body — orchestrator steps, role prompts, pitfalls) | `.claude/skills/game-design-direction/reference/debate-protocol.md` | 1-line pointer + when-to-trigger summary |
| `.agents/skills/design-council/SKILL.md` | `## Page Template` (the full markdown skeleton) | `.agents/skills/design-council/reference/page-template.md` | 1-line pointer |
| `.agents/skills/design-council/SKILL.md` | Each role-prompt block (`### Content iteration perspective`, `### Engine architecture perspective`, etc.) | `.agents/skills/design-council/reference/role-prompts/<perspective>.md` — one file per perspective | The list of available perspectives stays; each becomes a 1-line pointer |

After moves, mirror `.claude/` ↔ `.agents/` for any shared skill (`game-design-direction` is in `.claude/`; `design-council` is `.agents/`-only — confirm `npm run check:skill-sync` is still clean).

Each SKILL.md edit must bump `last_validated_against` to today's date per the CLAUDE.md skill-edit convention.

### QW-4 — Compile `Docs/design-brief.md` + `npm run check:design-brief`

Mirror of `Docs/authoring-brief.md` + `npm run check:authoring-brief`. Two new scripts, one new doc, two npm script entries.

**Brief contents (`Docs/design-brief.md`, ≤8 KB):**

1. Vision/ summary — one paragraph per Vision file (`00-north-star`, `01-core-loop`, `02-non-negotiables`, `03-design-tensions`, `taste-profile`). Source: read each, distil to the smallest faithful summary.
2. `state-of-game-design` Parts 0–2 (cosmology, reaches, spheres). Verbatim or near-verbatim — these are the high-traffic reference.
3. Non-Functional Priorities 1–7 from CLAUDE.md, one line each.
4. Load-Bearing Architectural Decisions — bullet list from CLAUDE.md.

Cap: 8 KB. If sources grow, the brief gets denser, not bigger.

**Build / check pattern (clone of `scripts/build-authoring-brief.ts` + `scripts/check-authoring-brief.ts`):**

- `scripts/build-design-brief.ts` — exports `DESIGN_BRIEF_OUTPUT_PATH = "Docs/design-brief.md"`, `DESIGN_BRIEF_SOURCES` (array of relpaths to Vision/* + state-of-game-design SKILL.md + CLAUDE.md sections — see authoring-brief for the hash-stamp pattern), `hashContent`, `extractHashesFromBrief`. Writes the brief; embeds source content-hash stamps in a fenced block so drift can be detected without reparsing.
- `scripts/check-design-brief.ts` — clone of `scripts/check-authoring-brief.ts` line-for-line. Reads the brief, hashes current sources, warns to stderr (exit 0) if stale. Never blocks commits.
- `package.json` — two new scripts: `build-design-brief` (esbuild + node, mirror authoring-brief pattern) and `check:design-brief` (same). Append `&& npm run check:design-brief` to the existing `check:process` script chain so the freshness signal fires every commit.
- Reference from `.claude/skills/state-of-game-design/SKILL.md` and `.claude/skills/game-design-direction/SKILL.md` (mirror to `.agents/`): "*Read `Docs/design-brief.md` first; fall back to source files if `npm run check:design-brief` warns of drift.*"

## Three-Pillar Coverage

- **Engine pillar** — Scripts (`scripts/build-design-brief.ts`, `scripts/check-design-brief.ts`), npm script entries, skill-file edits, template authoring, reference-folder file moves. All work concentrates here. No graph nodes, no tick phase, no PRNG.
- **Content pillar — N/A.** This bundle touches agent-facing skill files and developer-facing template/brief files. No game content (no encounter templates, prose tables, attachment content, faction data, agent backstories). The skills *describe* design conventions; they do not author player-facing fiction. Marking N/A with rationale per CLAUDE.md §Three-Pillar Rule.
- **UI pillar — N/A.** No player-facing UI is changed. The only surfaces touched are: (a) SKILL.md files read by AI agents, (b) `Docs/plans/_template.md` read by AI agents and developers, (c) `Docs/design-brief.md` read by AI agents, (d) two new CLI scripts that produce stderr warnings. There is no HexMapV2 signifier, no DOM component, no chronicle/alert/toast, no DebugPanel addition. The "UI" for these scripts is the CLI output; the conventional UI pillar (player-facing) is genuinely empty. Marking N/A with rationale per CLAUDE.md §Three-Pillar Rule.

**Browser-verify exemption:** Per CLAUDE.md §Definition of Done — *Browser-verify UI changes* — this bundle qualifies for the types-and-tooling exemption. No file under `src/components/`, `src/views/`, `src/hooks/use*UI*`, `src/styles/`, `index.css`, or HexMapV2 surfaces is touched. The closing commit body must state: `Browser-verify exempt: design-loop tooling only, no runtime UI changes`.

## NFP Compliance

| # | NFP | Verdict | Note |
|---|---|---|---|
| 1 | Tunability | PASS | Two named constants introduced: `DESIGN_BRIEF_MAX_BYTES = 8192` in `scripts/build-design-brief.ts`; staleness behaviour is inherited from the authoring-brief pattern (warn only, exit 0). All other "tunables" are documentation conventions, not runtime values. |
| 2 | Inspectability | PASS | The compiled brief carries source content-hashes in a fenced block; the check script names the drifted source by relpath. The plan-doc template's Tracing section is now mandatory for future plans, improving inspectability of every subsequent design. |
| 3 | Determinism | PASS | `hashContent` reuses the authoring-brief implementation (SHA-256 over decoded UTF-8 source contents). Same sources → same brief → same hashes. No PRNG involved. |
| 4 | Fail-soft | PASS | `check:design-brief` writes to stderr with `exit 0` on every failure path: brief absent, sources absent, hash stamps absent, hashes mismatched. Mirrors authoring-brief's "warn, never block" contract. |
| 5 | Narrative over mechanical | PASS with note | This bundle is mechanical infra; the narrative is *enabling* future designs to land cleaner. No story content authored. |
| 6 | Additive over destructive | PASS with note | One destructive operation: moving inline content out of SKILL.md files into `reference/` files. Mitigated by: (a) every move leaves a 1-line pointer in the SKILL.md so the path is still discoverable, (b) the `npm run check:skill-sync` pre-commit hook catches any unmirrored deletions, (c) total SKILL.md line-count reduction ≥ 250 (the audit's target) is achieved by *moving*, not deleting. |
| 7 | Performance budget | PASS | `build-design-brief` runs once per source-file edit (manual `npm run build-design-brief`) and once per `check:process` invocation. The check script is read-only and hashes ~5 small files — sub-100ms expected, well within the existing `check:process` budget. |

## Constants

| Constant | Default | Defined in | Purpose |
|---|---|---|---|
| `DESIGN_BRIEF_OUTPUT_PATH` | `"Docs/design-brief.md"` | `scripts/build-design-brief.ts` | Output path for the compiled brief |
| `DESIGN_BRIEF_SOURCES` | `[Vision/00-..., Vision/01-..., Vision/02-..., Vision/03-..., Vision/taste-profile.md, .claude/skills/state-of-game-design/SKILL.md, CLAUDE.md]` | `scripts/build-design-brief.ts` | List of source relpaths whose content-hash is embedded in the brief |
| `DESIGN_BRIEF_MAX_BYTES` | `8192` | `scripts/build-design-brief.ts` | Brief size cap; build fails (`exit 1`) if exceeded |
| Plan-doc template path | `"Docs/plans/_template.md"` | CLAUDE.md, `game-design-direction/SKILL.md` | Canonical starting point for new plan docs |

## Tracing

N/A for runtime; the scripts emit stderr warnings with structured prefix (`warn: `, `info: `) matching the authoring-brief pattern. No game traces. No new `traceBuffer` categories.

## Fail-soft

| Failure case | Behaviour |
|---|---|
| `Docs/design-brief.md` missing | `check:design-brief` writes `warn: Docs/design-brief.md does not exist — run \`npm run build-design-brief\` to generate it.` and exits 0. Build continues. |
| Source file missing (Vision/* or state-of-game-design/SKILL.md or CLAUDE.md) | `check:design-brief` writes `warn: one or more source files missing — skipping design-brief drift check.` and exits 0. Same as authoring-brief. |
| Brief has no hash stamps (older format / hand-edited) | `check:design-brief` writes warning and exits 0. Build continues. |
| Source content drift detected | `check:design-brief` names the drifted file(s) by relpath, writes `Run \`npm run build-design-brief\` to update.`, exits 0. Non-blocking. |
| Brief exceeds 8 KB at build time | `build-design-brief` writes `error: brief exceeds DESIGN_BRIEF_MAX_BYTES` and exits 1. The build script is opt-in (manual), so failure here doesn't block normal development; it blocks the rebuild. Forces the author to densify. |

## Wiring

| Surface | Wire-up |
|---|---|
| Skill-load flow | `state-of-game-design` and `game-design-direction` SKILL.md files instruct agents to load `Docs/design-brief.md` first; sources are fallback. |
| Pre-commit hook | `check:process` already runs `check:authoring-brief` at the tail; append `check:design-brief` to the same chain in `package.json`. No new git hook needed — husky already wires `check:process`. |
| Plan-doc authoring | CLAUDE.md §Design Governance gains a one-line reference: "*Start from `Docs/plans/_template.md` when drafting a new plan.*" `game-design-direction/SKILL.md` gains the same reference. |
| Downstream MT-1 / MT-3 / MT-4 | `Docs/design-brief.md` becomes the front-door for MT-1's router-shard refactor. `Docs/plans/_template.md` becomes the schema for MT-3's linter. The build/check pattern becomes the template for MT-4's `vision-audit` script. No code coupling — just reference patterns. |

No new orchestrator phase, no GameState field, no UI mount, no player control.

## Blast Radius

N/A — no file under `src/` is touched. Codesight pre-flight not required for documentation/script-only changes.

## Rejected approaches

- **Author the design-brief by hand instead of compiling from sources.** Rejected — guarantees drift. The authoring-brief precedent already shows the compiled-with-hash-stamps pattern works and stays fresh.
- **Make `check:design-brief` block commits instead of warning.** Rejected — matches authoring-brief's contract (warn, never block) so the design-loop tooling stays consistent. Blocking would also race against any in-flight Vision/* edits and create surprise CI failures.
- **Replace SKILL.md inline sections with `@include` directives or similar templating.** Rejected — no current skill loader supports includes; the simplest path is direct file references with 1-line pointers. Future skill-loader work could revisit this, but that is out of scope for QW-3.
- **Split `state-of-game-design` into router + shards as part of this bundle.** Rejected — that is explicitly MT-1 (THR-377), which depends on QW-4's brief existing first. Keeping the bundle narrowly scoped prevents merge churn with MT-1.

## Risks

1. **Line-number drift in QW-3.** The audit cited line ranges; the SKILL.md files have been edited since. Mitigation: extract by section-heading anchors, not literal line numbers, and verify each extraction round-trips by re-reading the SKILL.md after the move and confirming the pointer resolves.
2. **Brief-size pressure as Vision/ grows.** Vision/* is still actively edited (Vision/02-non-negotiables was edited 2026-05-11 per THR-402). The 8 KB cap may bite. Mitigation: the cap is a named constant; if it bites, the author densifies first. Long-term answer is router-shard pattern (MT-1).
3. **Skill-sync hook divergence.** Moving content out of `game-design-direction/SKILL.md` into a `reference/` subfolder is mirrored across `.claude/` ↔ `.agents/` by `npm run check:skill-sync:sync`. If the hook doesn't recurse into `reference/`, the mirror will silently desync. Mitigation: the executor must verify both trees after the move and run the sync explicitly.
4. **QW-1-already-done assumption is local-only.** Cowork verified on the in-session checkout; if some unmerged branch still has the duplicate, that branch will re-introduce it on rebase. Mitigation: noted in the plan; CC's first action is re-verify on whatever branch they cut.

## Done when

- [ ] **QW-1:** Confirmed obsolete on the branch this PR cuts from (state-of-game-design SKILL.md still single-copy Part 6 / Part 7); no edits required. Note in PR description.
- [ ] **QW-2:** `Docs/plans/_template.md` exists with all 13 sections listed above; referenced from CLAUDE.md §Design Governance and `game-design-direction/SKILL.md` (mirror to `.agents/`).
- [ ] **QW-3:** Four reference files exist (`game-design-direction/reference/brainstorm-companion-template.md`, `game-design-direction/reference/debate-protocol.md`, `design-council/reference/page-template.md`, plus N role-prompt files under `design-council/reference/role-prompts/`). Each parent SKILL.md has a 1-line pointer in place of the moved content. Total SKILL.md line-count reduction ≥ 250 across the three skills. `last_validated_against` bumped to 2026-05-12 on every edited SKILL.md.
- [ ] **QW-4:** `Docs/design-brief.md` exists, ≤8 KB, carries source content-hash stamps. `scripts/build-design-brief.ts` and `scripts/check-design-brief.ts` exist. `package.json` has `build-design-brief` and `check:design-brief` scripts; `check:process` chain includes `check:design-brief`. `npm run build-design-brief` succeeds. `npm run check:design-brief` exits 0 with `info: Docs/design-brief.md is up to date.`
- [ ] **Skill-sync clean:** `npm run check:skill-sync` passes after all moves; the mirror is aligned.
- [ ] **CI green:** `npm test`, `npx tsc --noEmit`, `npx vite build`, `npm run check:process` all pass locally before push. Paste the four terminal outputs (or a green CI link) into the closing Linear comment as verification evidence.
- [ ] **Closing commit body:** Includes `Fixes THR-376` for auto-close. Includes the line `Browser-verify exempt: design-loop tooling only, no runtime UI changes`.
- [ ] **Definition-of-Done sweep:** Linear comment posted with completion summary; if any TODO/DEFERRED comments were added during the work, each has a tracked Linear issue.
