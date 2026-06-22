> **title:** `npm run lint:plan-doc — schematic plan-doc structure check — THR-379`
> **linear_issue:** THR-379
> **author:** Cowork
> **created:** 2026-06-12
> **three_pillars:** Engine `N/A — tooling/CLI script` · Content `N/A — tooling/CLI script` · UI `N/A — tooling/CLI script`

# npm run lint:plan-doc — schematic plan-doc structure check — THR-379

*A mechanical structure linter for `Docs/plans/*.md` that catches incomplete plan docs before handoff — the equivalent of `check:process` for plan-doc shape, not content.*

## Why this is load-bearing

The plan-doc skeleton at `Docs/plans/_template.md` shipped today (THR-458) and codifies the structural contract for every Cowork-authored design: NFP-compliance table, three-pillar sections (each non-empty or `N/A — <reason>`), constants table, fail-soft table, tracing section with TypeScript interface, wiring-checklist reference, Vision-audit checkbox, Coordination block. Today the only enforcement of that contract is the author re-reading CLAUDE.md § Design Governance and self-checking. That self-check is the single most-rejected step on Cowork handoffs: a plan ships missing the NFP table, missing the Vision-audit checkbox, missing the Coordination block's "Suggested model" line, etc., and CC bounces it back — wasting one pickup cycle per miss. A schematic linter that runs on every changed plan doc (advisory in pre-commit, eventually a quality gate) catches the structural misses before they leave Cowork's session, freeing the qualitative agent audit (NFP audit, three-pillar coverage, Vision audit) to focus on what humans actually need to judge.

The audit doc (`Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md` § MT-3) names this as one of the highest-leverage WSJF items in the design loop. THR-458 (`_template.md` compile) unblocks it: the linter has a reference for "complete" to compare against.

## Engine pillar

Engine: N/A — this is a Node CLI script in `scripts/`, no tick-loop touch.

## Content pillar

Content: N/A — no encounters, prose, or data tables.

## UI pillar

UI: N/A — CLI tool, no player-facing surface, no DebugPanel additions.

## Tool design

### Module layout

Mirror the existing `scripts/lint-*.ts` family:

- **`scripts/lint-plan-doc.ts`** (new) — TypeScript source.
- **`package.json` script** — `lint:plan-doc`, built via esbuild bundle to `.cache/lint-plan-doc.mjs` then `node`-executed. Same shape as `lint:encounter-content` and `lint:intel-prose-category`.
- **`scripts/check-process.ts`** (edit) — append a call to the new linter so the `check:process` chain runs it too. This piggybacks on the existing advisory CI surface without inventing a new one.
- **`.husky/pre-commit`** (edit) — add an advisory `npm run lint:plan-doc -- --staged` line (warn but don't block, same posture as `check:process`).
- **`CLAUDE.md`** (edit) — add `npm run lint:plan-doc` to the "Pre-commit minimum" list with the same advisory note as `check:process`.

### Invocation surface

```
# Lint a single file
npm run lint:plan-doc -- Docs/plans/2026-06-12-thr-379-lint-plan-doc.md

# Lint all changed plan docs (pre-commit / CI use)
npm run lint:plan-doc -- --staged

# Lint everything (full sweep, used by retro tooling)
npm run lint:plan-doc -- --all
```

`--staged` reuses the `collectCandidateFiles()` logic from `check-process.ts` (`git diff --name-only --cached --diff-filter=ACMR`, falling back to porcelain, falling back to last commit). `--all` walks `Docs/plans/*.md`.

### Required sections / blocks

Cribbed from `Docs/plans/_template.md` and CLAUDE.md § Design Governance. Each check is a single boolean — present-vs-absent, no qualitative judgment.

| # | Check ID | Rule | Heuristic (regex over file text) |
|---|----------|------|---------------------------------|
| 1 | `frontmatter` | Top metadata block present with `linear_issue:`, `author:`, `created:`, `three_pillars:` | `/^> \*\*linear_issue:\*\* THR-\d+/m` and three sibling lines |
| 2 | `engine-pillar` | `## Engine pillar` heading present | `/^## Engine pillar$/m` |
| 3 | `content-pillar` | `## Content pillar` heading present | `/^## Content pillar$/m` |
| 4 | `ui-pillar` | `## UI pillar` heading present | `/^## UI pillar$/m` |
| 5 | `pillar-content` | Each pillar section has either: a `N/A — <reason>` declaration, OR ≥1 non-empty subsection (heading + at least one non-blank line of content before the next `##`) | per-section scan |
| 6 | `wiring` | `## Wiring` section present and references `Docs/plans/wiring-checklist.md` | `/^## Wiring$/m` and `/Docs\/plans\/wiring-checklist\.md/` in body |
| 7 | `constants-table` | `## Constants table` heading present with a markdown table (header + ≥1 row, or explicit `_None._` / `N/A` line) | `/^## Constants table$/m` |
| 8 | `tracing` | `## Tracing` heading present with either a fenced `ts` codeblock OR an explicit `N/A — <reason>` line | `/^## Tracing$/m` |
| 9 | `fail-soft-table` | `## Fail-soft table` heading present with markdown table or `N/A — <reason>` | `/^## Fail-soft table$/m` |
| 10 | `three-pillar-check` | `## Three-pillar check` section with 4 checkbox lines (`- [ ]` or `- [x]`) | count `- \[[ x]\]` under that heading |
| 11 | `vision-audit` | `## Vision audit` checkbox section present | `/^## Vision audit$/m` |
| 12 | `rulebook-impact` | `## Rulebook impact` checkbox section present | `/^## Rulebook impact$/m` |
| 13 | `nfp-table` | `## NFP-compliance table` with table-header row mentioning all 7 NFP numbers (1–7) | `/^## NFP-compliance table$/m` and 7 rows |
| 14 | `done-when` | `## Done when` section with ≥1 `- [ ]` checkbox | `/^## Done when$/m` |
| 15 | `coordination-block` | `## Coordination block` section with `**Suggested model:**`, `**Parallel-safe with:**`, `**Mutex with:**`, `**Codex review:**`, `**Files to touch:**` lines | scan for the 5 required keys |
| 16 | `blast-radius-conditional` | `## Blast Radius` is OPTIONAL; only flagged when **scope hint detected** (filename or body mentions touching a file from the named high-impact list in CLAUDE.md § Codesight — `graph.ts`, `types/index.ts`, `types/gameState.ts`, `types/traits.ts`, `traceBuffer.ts`) AND the section is missing | conditional regex |

Checks 1–15 fire as **errors** when missing. Check 16 fires as a **warning** (heuristic-detected, may false-positive).

The reference target for "what counts as present" is whatever `Docs/plans/_template.md` shipped with — if the template changes, the linter changes alongside it. Add a single constant `TEMPLATE_PATH = 'Docs/plans/_template.md'` so the linter loads the template once at startup and uses its section headings as the canonical heading set (avoids drift between template and linter).

### Finding shape

Reuse the `Finding` type from `check-process.ts`:

```ts
type Severity = 'error' | 'warn';
type Finding = {
  check: string;          // check ID from the table above
  severity: Severity;
  message: string;
  file: string;           // plan-doc path
  line?: number;          // line of the missing/broken section if known
};
```

Print one line per finding in `[LEVEL] check file:line message` format (same as `check-process.ts`), then exit 0 (advisory) or 1 (when `--strict` is passed, for the eventual blocking flip). Default exit is 0 even on errors during the advisory phase — the rollout follows the same path as `check:process` per CLAUDE.md (advisory → stabilizes → blocking).

### Pre-commit hook integration

```sh
#!/usr/bin/env sh
npm run check:skill-sync
npm run lint:plan-doc -- --staged
```

Advisory only — runs but does not block commits. Same posture as `check:process`. The flip-to-blocking is a follow-up ticket once the rule set stabilizes (filed as deferral if any false-positive surfaces in the first 2 weeks).

### Skip cases

- `Docs/plans/_template.md` is the reference — skip linting it.
- `Docs/plans/wiring-checklist.md` is a checklist, not a plan doc — skip.
- `Docs/plans/README.md` if one exists — skip.
- Files matching `Docs/plans/*-brainstorm.md` are brainstorm companions, not plan docs — different schema, skip.
- Files matching `Docs/plans/*-grill-me.md` are grill-me synthesis artifacts — skip.
- Files matching `Docs/plans/audits/*.md` — different doc type, skip (audits live in `Docs/audits/` anyway, but defend against future co-location).

The skip list is a constant `PLAN_DOC_SKIP_PATTERNS` near the top of the script for tunability.

## Wiring

| Module | Trigger | Output | Pre-commit visibility |
|--------|---------|--------|----------------------|
| `scripts/lint-plan-doc.ts` | `npm run lint:plan-doc [-- --staged \| --all \| <path>]` | stdout findings list + exit code (0 advisory, 1 strict) | runs in `.husky/pre-commit` |
| `scripts/check-process.ts` | `npm run check:process` (existing) | chains `lint:plan-doc --staged` after current checks | same hook |
| `package.json` | `lint:plan-doc` script entry | esbuild-bundles + node-runs the script | n/a |
| `.husky/pre-commit` | `git commit` | runs `check:skill-sync` then `lint:plan-doc --staged` | yes |
| `CLAUDE.md § Pre-commit minimum` | doc reference | adds `lint:plan-doc` to the minimum list | n/a |

No tick loop, no GameState, no trace types, no UI components — none of the standard Wiring columns apply. Tooling-only addition.

## Constants table

| Constant | Default | Purpose |
|----------|---------|---------|
| `TEMPLATE_PATH` | `'Docs/plans/_template.md'` | Canonical reference for required heading set; linter loads at startup |
| `PLAN_DOC_GLOB` | `'Docs/plans/*.md'` | Files in scope for `--all` mode |
| `PLAN_DOC_SKIP_PATTERNS` | `[/_template\.md$/, /wiring-checklist\.md$/, /README\.md$/, /-brainstorm\.md$/, /-grill-me\.md$/]` | Files skipped even when matched by `PLAN_DOC_GLOB` |
| `REQUIRED_NFP_COUNT` | `7` | Number of rows the NFP-compliance table must have |
| `REQUIRED_COORDINATION_KEYS` | `['Suggested model', 'Parallel-safe with', 'Mutex with', 'Codex review', 'Files to touch']` | Bold-prefixed lines required inside `## Coordination block` |
| `HIGH_IMPACT_FILES` | `['src/engine/graph.ts', 'src/types/index.ts', 'src/types/gameState.ts', 'src/types/traits.ts', 'src/engine/traceBuffer.ts']` | Used by Check 16 to decide whether a missing Blast Radius section is a warning |
| `STRICT_FLAG` | `'--strict'` | CLI flag that flips exit-1-on-error for the eventual blocking phase |

## Tracing

Tracing: N/A — CLI tool. Output is human-readable stdout findings, not engine traces. Matches the `check-process.ts` posture (no trace events emitted).

## Fail-soft table

| Failure case | Fallback |
|--------------|----------|
| `Docs/plans/_template.md` is missing at startup | Skip Check 5 (`pillar-content`) self-validation against template; emit a single `linter-setup` warning; continue with hardcoded required-headings list as backup |
| Git commands fail in `--staged` mode (e.g. detached HEAD, no commits) | Print `lint:plan-doc skipped (no candidate files found)` and exit 0 (matches `check-process.ts`) |
| A plan-doc file is unreadable (permissions, binary) | Emit a `file-read` warning naming the file; continue with the next file |
| A plan-doc file is empty | Emit `empty-file` error, skip remaining checks for that file |
| A regex check throws on a malformed Markdown table | Catch, emit `parse-error` warning naming check ID + file:line, do not flag the broken-table check itself as failing |
| `PLAN_DOC_SKIP_PATTERNS` matches all candidate files in `--staged` | Print `lint:plan-doc skipped (all candidates filtered)` and exit 0 |
| Pre-commit hook invocation in CI environment without staged files | Same as detached-HEAD case — exit 0 with skip message |

## Blast Radius

No Blast Radius section — none of the files touched are in the named high-impact list (`graph.ts`, `types/index.ts`, `types/gameState.ts`, `types/traits.ts`, `traceBuffer.ts`). New script + minor `package.json` / hook / CLAUDE.md edits.

## Three-pillar check

- [x] Engine pillar present (N/A — tooling/CLI script)
- [x] Content pillar present (N/A — tooling/CLI script)
- [x] UI pillar present (N/A — tooling/CLI script)
- [x] Wiring section connects them (tooling wiring table covers script ↔ package.json ↔ hook ↔ CLAUDE.md)

## Vision audit

- [x] This plan does not contradict any Vision premise
- [x] If it does, the Vision edit is part of this ticket's scope — N/A (no Vision touch; pure tooling)

## Rulebook impact

- [x] This plan does not change a rule of play
- [x] If it does, `Docs/canon/rulebook.md` is updated in the same PR — N/A

## NFP-compliance table

| NFP | Verdict | Note |
|-----|---------|------|
| 1. Tunability | PASS | Every check threshold and pattern is a named constant in the Constants table; pre-commit hook line is single-source |
| 2. Inspectability | PASS | Findings print in `[LEVEL] check file:line message` format; each rule has a stable check ID for grep/diff |
| 3. Determinism | PASS | No randomness — pure file scan + regex match; same input → same output |
| 4. Fail-soft | PASS | Fail-soft table covers missing template, git failures, unreadable files, parse errors. Default exit-0 during advisory phase |
| 5. Narrative over mechanical perfection | PASS with note | Linter is mechanical by design — it catches structure misses so the agent's qualitative NFP/Vision audit can stay narrative-focused. Self-aware about scope. |
| 6. Additive over destructive | PASS | New script + new `package.json` entry + advisory hook line + CLAUDE.md addition. No existing checks removed or refactored |
| 7. Performance budget | PASS | Each plan-doc scan is a single file read + small regex set. `--all` mode walks ~30 files; well under 100 ms total. No profiling needed |

## Done when

*Every closeout commit must include `Fixes THR-379` and verification evidence (npm test, tsc, vite build raw output or green CI link) per CLAUDE.md § Definition of Done.*

- [ ] `scripts/lint-plan-doc.ts` created, mirroring `scripts/lint-encounter-content.ts` build pattern
- [ ] `package.json` has new `lint:plan-doc` script entry (esbuild bundle pattern)
- [ ] `scripts/check-process.ts` chains `lint:plan-doc --staged` after existing checks
- [ ] `.husky/pre-commit` adds advisory `npm run lint:plan-doc -- --staged` line
- [ ] `CLAUDE.md § Pre-commit minimum` updated with `lint:plan-doc` entry and advisory note
- [ ] Linter runs clean on `Docs/plans/2026-06-12-thr-379-lint-plan-doc.md` itself (this plan must self-pass)
- [ ] Linter flags a deliberately-broken sample (create `Docs/plans/__lint-fixture-broken.md` with 3 missing sections, assert linter reports exactly those 3 — then delete the fixture in the same PR or keep gitignored)
- [ ] Pre-commit hook fires on a test commit that touches a plan doc (manual verification — paste hook output in closing comment)
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all pass
- [ ] `npm run check:process` passes (includes the new `lint:plan-doc` chained call)
- [ ] Closing commit body includes `Fixes THR-379`
- [ ] Browser-verify exempt: tooling/CLI script, no UI surface (state this in commit body)

## Coordination block

*These five fields are the handoff. Filling them turns this plan into a Ready-for-Codex candidate.*

**Suggested model:** N/A — routed to Codex (model fixed at automation level per coordination protocol)

**Parallel-safe with:** any non-design-loop work — touches only `scripts/lint-plan-doc.ts` (new), `scripts/check-process.ts` (additive append), `package.json` (new script entry), `.husky/pre-commit` (one additive line), `CLAUDE.md § Pre-commit minimum` (one additive entry). Safe alongside MT-2 (THR-378), MT-5 (THR-381), and any in-flight content / engine work.

**Mutex with:** none — any concurrent edits to `package.json` or `.husky/pre-commit` are textually small and easy to rebase. No file-level mutex required.

**Codex review:** no — pattern-following work cloning `check-process.ts` + `lint-encounter-content.ts`. The reviewer is the linter itself (it self-validates the plan doc that designed it).

**Files to touch:**
- Create: `scripts/lint-plan-doc.ts` (~300 LOC, mirrors `scripts/lint-encounter-content.ts` shape)
- Edit: `package.json` (add `lint:plan-doc` script entry — esbuild bundle pattern matching `lint:encounter-content`)
- Edit: `scripts/check-process.ts` (chain `lint:plan-doc --staged` after current checks; ~5 LOC added at end of `main()`)
- Edit: `.husky/pre-commit` (one line: `npm run lint:plan-doc -- --staged`)
- Edit: `CLAUDE.md` (add `npm run lint:plan-doc` to the "Pre-commit minimum" list in § Testing, with same advisory phrasing as `check:process`)

## Notes for the executor

- **The linter must self-pass on this plan doc.** Treat `Docs/plans/2026-06-12-thr-379-lint-plan-doc.md` as the canary — if your linter flags this doc as broken, the linter is wrong. Fix the linter, not the doc.
- **Do not lint `_template.md`.** It contains placeholders like `<value>` and `<Constant>` rows; linting it would produce noise. The `PLAN_DOC_SKIP_PATTERNS` constant exists to prevent this.
- **Do not invent new required sections.** The 16 checks above are the ceiling for V1. Adding a "Brainstorm companion link present" check or a "Linear-link inline" check belongs in a follow-up issue once the basic structure is enforced. The check:process script already validates inline Linear links.
- **Reuse `Finding` and `parseNewlinePaths` / `safeRunGit` / `collectCandidateFiles` from `check-process.ts`** — duplicate or extract; either is fine. Don't reinvent git plumbing.
- **Advisory exit code on the first land.** Default exit 0 even on findings. The `--strict` flag is wired in but not used yet; the flip-to-blocking is a follow-up ticket, filed at closeout if the rule set survives two weeks of plan-doc traffic without false positives.
- **Heading-set canonicalization:** the simplest correct implementation reads `Docs/plans/_template.md` once at startup, extracts all `^## ` headings into a Set, and asserts each appears in the linted file (modulo the skip list for `## Blast Radius`). This means the template is the single source of truth for required structure — when the template changes, the linter follows automatically. Add a fall-back hardcoded list inside the script body in case the template file is missing (covered in the fail-soft table).
- **Browser-verify exempt** — paste `Browser-verify exempt: tooling/CLI script, no UI surface` in the closing commit body per CLAUDE.md § Definition of Done.
