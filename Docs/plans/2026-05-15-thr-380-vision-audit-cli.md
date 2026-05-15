# THR-380 — `npm run vision-audit` — mechanical Vision-touchpoint surfacing

**Date:** 2026-05-15
**Author:** Cowork (keep-work-flowing scheduled session)
**Issue:** THR-380 (Continuous Improvement)
**Parent audit:** `Docs/audits/2026-05-08-design-loop-fork-files-commands-audit.md` (THR-375), recommendation MT-4
**Status:** Ready for Dev handoff

---

## 1. Problem

Every Cowork design pass currently runs the Vision audit by re-reading all of the `Vision/` notebook inline — `00-north-star.md`, `01-core-loop.md`, `02-non-negotiables.md`, `03-design-tensions.md`, `README.md`, and `taste-profile.md` — roughly 25 KB of markdown. The audit's qualitative judgment is genuinely valuable and stays with the agent. But the *mechanical* half — "which Vision files did this plan cite? which premises did it name without citing? which did it ignore entirely?" — is pure string-matching that does not need a 25 KB context load to perform.

THR-375's audit (MT-4) proposes a CLI that does the mechanical surface only and emits a ~2 KB structured report. Paired with MT-2 (the forked Vision-auditor subagent, THR-378), the subagent reads the report instead of the whole notebook — the context saving is the point.

This plan covers **only MT-4** — the `vision-audit` script and its wiring into `game-design-direction/SKILL.md`. MT-2 (the subagent fork) is a separate issue and is explicitly out of scope here; this script is designed so MT-2 *can* consume it later, but does not require MT-2 to be useful on its own.

## 2. Where `Vision/` actually lives — load-bearing constraint

`Vision/` is **not in the git repo.** It lives in the Obsidian vault. Per `game-design-direction/SKILL.md` (line 35): *"The `Vision/` folder lives at `TheFantasyWorldSimulator/Vision/` in the vault."* `git ls-tree origin/main` confirms there is no `Vision/` path tracked in the repository, and `Docs/design-brief.md` does not exist on `origin/main` either.

This shapes the whole design:

- The script must **locate the vault**, not assume a repo-relative path. Resolution order: (1) explicit `--vault <path>` flag, (2) `OBSIDIAN_VAULT_PATH` env var (CLAUDE.md §Known Sandbox Limitations documents this as the canonical vault-root variable) joined with `TheFantasyWorldSimulator/Vision`, (3) a repo-relative fallback `<repoRoot>/TheFantasyWorldSimulator/Vision` for checkouts that carry a local vault copy.
- Because `Vision/` is not in the repo, **CI and other contributors' machines will not have it.** The script must therefore be **advisory and fail-soft** — it must never be wired into CI or a blocking pre-commit hook, and a missing vault must produce a warning + `exit 0`, never a hard failure. This mirrors the existing `scripts/check-authoring-brief.ts` pattern, which warns-and-exits-0 when its inputs are absent.
- The Vision notebook in the reference checkout used to author this plan contains **5 files** (`00`–`03` + `README.md`); `taste-profile.md` is referenced by `game-design-direction/SKILL.md` but was **not present** in that checkout. THR-380's issue body says "all six Vision/ files." The implementer must treat the file set as **discovered, not hardcoded** — enumerate `Vision/*.md` at runtime, and handle a missing `taste-profile.md` fail-soft (skip report section 3 with a noted reason). Do not hard-fail on the 5-vs-6 discrepancy.

> **Implementer note — stale authoring checkout.** This plan was authored from a sandbox checkout ~3 days behind `origin/main`. Before implementing, `git fetch && git pull` and re-verify two things against fresh `origin/main`: (a) the current section structure of `.claude/skills/game-design-direction/SKILL.md` (the "Vision Audit at Plan Finalization" section near line 228 is the edit target), and (b) whether `Docs/plans/_template.md` / `Docs/design-brief.md` now exist (THR-376 closeout claimed `_template.md`; it was absent from `origin/main` at authoring time — not a blocker for this issue, just don't assume it).

## 3. Scope

`npm run vision-audit <plan-doc-path>` reads one plan doc and the `Vision/` notebook and prints a structured Markdown report to stdout. **Mechanical surface only** — string-matching and enumeration. No qualitative judgment: the script never decides whether a contradiction is *real*, only that a premise was *named*.

### 3.1 Report sections (from THR-380 issue body)

1. **Vision files referenced by path** — every `Vision/*.md` mention in the plan doc, with plan-doc line numbers.
2. **Vision premises mentioned by name without citation** — string-match the plan doc against the known premise headings + frontmatter `aliases` from `02-non-negotiables.md` and `03-design-tensions.md`; flag any match that does **not** have an accompanying `Vision/...` file reference within `CITATION_PROXIMITY_LINES` lines.
3. **Taste-profile entries the plan would update** — match plan text against strong-opinion / soft-pattern / anti-pattern entries from `taste-profile.md`; categorise each touched entry as `confirms` / `contradicts` / `introduces`. Skipped with a noted reason if `taste-profile.md` is absent.
4. **Vision premises NOT touched** — Vision files with zero matches anywhere in the plan doc (useful when a player-facing plan should have engaged a premise and didn't).

### 3.2 Output contract

- Default output: structured **Markdown** to stdout (a forked subagent or a human can read it directly).
- `--json` flag: same data as a JSON object (for MT-2 / programmatic consumers).
- Exit codes: `0` for a successful run **and** for every fail-soft case (missing vault, missing `taste-profile.md`, missing individual Vision file). `1` only for a usage error — missing/unreadable `<plan-doc-path>` argument.
- **Never blocking.** Not added to `check:process`, not added to any pre-commit hook, not added to CI. It is a context-saver invoked on demand.

### 3.3 Out of scope

- MT-2 (forked Vision-auditor subagent) — separate issue.
- Any change to the *qualitative* Vision-audit instructions in `game-design-direction/SKILL.md` — those stay; only the *mechanical re-read-everything* step is replaced by a script invocation.
- `Docs/design-brief.md` / `npm run check:design-brief` (THR-376 QW-4) — not required by this script.
- Auto-generating or mirroring `Vision/` into the repo — explicitly not done; the vault stays the source of truth.

## 4. Three-pillar coverage

This is a **dev-tooling / process-infrastructure** issue. Per CLAUDE.md Non-Negotiable #7 and `Vision/02-non-negotiables.md` §7, pure infrastructure may be N/A on the three game pillars *with explicit rationale* — provided here.

| Pillar | Status | Rationale |
|--------|--------|-----------|
| **Engine** | N/A | No game-engine change. Nothing touches the tick loop, orchestrator, graph schema, PRNG, resolution, or any `src/engine/` surface. The deliverable is a standalone `scripts/` CLI. |
| **Content** | N/A | No game content. No encounter templates, prose tables, attachment content, or data tables. The script *reads* design-process markdown; it authors none. |
| **UI** | N/A | No player-facing surface. Output is a terminal report consumed by a design agent. No component, modal, HexMap signifier, or notification. |
| **Tooling** (substituted substance section) | **In scope** | See §5 — the script, its package.json wiring, and the `game-design-direction` skill edit. |

## 5. Tooling design

### 5.1 `scripts/vision-audit.ts` (new)

Clone the structural pattern of `scripts/check-authoring-brief.ts` / `scripts/check-process.ts`: a single-file Node script, `Finding`-style typed records, `main()` entry, explicit fail-soft branches that `process.exit(0)` with a `stderr` warning.

Pipeline:

1. **Parse args.** Require `<plan-doc-path>`. Accept `--vault <path>` and `--json`. Missing/unreadable plan doc → usage error, `exit 1`.
2. **Resolve the Vision directory** via the §2 resolution order. Not found → emit report section 1 only (it needs the plan doc, not the vault), append a "Vision notebook not found — sections 2–4 skipped" note, `exit 0`.
3. **Load the plan doc** once into memory; keep a line-indexed view for line-number reporting.
4. **Enumerate `Vision/*.md`** at runtime. For `02-non-negotiables.md` and `03-design-tensions.md`, parse premise headings with `PREMISE_HEADING_PATTERN` and pull frontmatter `aliases`. For `taste-profile.md` (if present), parse the strong-opinion / soft-pattern / anti-pattern entries.
5. **Section 1** — regex the plan doc for `VISION_FILE_REFERENCE_PATTERN`, collect `{file, line}`.
6. **Section 2** — for each premise heading/alias, search the plan doc; for each hit, check whether a `Vision/...` reference appears within `CITATION_PROXIMITY_LINES`; emit the uncited hits.
7. **Section 3** — for each taste-profile entry, search the plan doc; classify `confirms` / `contradicts` / `introduces` by simple keyword heuristics (e.g. negation tokens near the match → `contradicts`; entry text absent but category keyword present → `introduces`; otherwise `confirms`). Heuristic only — the report labels this column "mechanical guess, agent confirms."
8. **Section 4** — Vision files with zero matches from sections 1–3.
9. **Render** Markdown (or JSON with `--json`) to stdout. `exit 0`.

### 5.2 Constants table (NFP #1)

Every tunable lives as a named `const` at the top of the script.

| Constant | Default | Purpose |
|----------|---------|---------|
| `VISION_DIR_RELATIVE` | `'TheFantasyWorldSimulator/Vision'` | Path of `Vision/` within the Obsidian vault root; also the repo-relative fallback suffix. |
| `PREMISE_SOURCE_FILES` | `['02-non-negotiables.md', '03-design-tensions.md']` | Vision files whose `## N. <title>` headings are treated as named premises. |
| `TASTE_PROFILE_FILE` | `'taste-profile.md'` | Vision file parsed for report section 3; absence is fail-soft. |
| `VISION_FILE_REFERENCE_PATTERN` | `/\bVision\/[\w-]+\.md\b/g` | Matches explicit Vision file path citations in a plan doc. |
| `PREMISE_HEADING_PATTERN` | `/^#{1,3}\s+(\d+)\.\s+(.+?)\s*$/` | Extracts numbered premise headings from the source files. |
| `CITATION_PROXIMITY_LINES` | `3` | Max line distance between a premise mention and a `Vision/` file reference for the mention to count as "cited." |
| `TASTE_CONTRADICTION_TOKENS` | `['not ', 'no longer', 'instead of', 'replace', 'drop ', 'remove ', 'contradict']` | Negation/replacement tokens near a taste-profile match that flip the classification to `contradicts`. |

### 5.3 Fail-soft table (NFP #4)

| Failure case | Behaviour |
|--------------|-----------|
| `<plan-doc-path>` argument missing | Print usage to stderr, `exit 1`. |
| Plan doc path unreadable / not a file | Print error + usage to stderr, `exit 1`. |
| Vault / `Vision/` directory not found (no flag, no env var, no repo fallback) | Warn to stderr; emit report section 1 only with a "sections 2–4 skipped: Vision notebook not found" note; `exit 0`. |
| `taste-profile.md` absent | Warn to stderr; emit sections 1, 2, 4; section 3 rendered as "skipped: taste-profile.md not found"; `exit 0`. |
| An individual premise-source Vision file absent | Warn to stderr; that file contributes zero premises; other files proceed; `exit 0`. |
| A Vision file present but unparseable (no headings / no frontmatter) | Warn to stderr; treat as zero premises/entries; `exit 0`. |
| Plan doc has zero Vision references at all | Valid result — section 1 empty, section 4 lists every Vision file; `exit 0` (this is a meaningful signal, not an error). |

### 5.4 `package.json` (modify)

Add one script entry. Two precedents exist in the repo: the esbuild-bundle pattern (`check:authoring-brief`, `check:process`) and the lighter `node --experimental-strip-types` pattern (`check:canon-staleness`). **Recommend `--experimental-strip-types`** — `vision-audit` is a standalone leaf script with no cross-module imports, so the esbuild bundling step buys nothing:

```json
"vision-audit": "node --experimental-strip-types scripts/vision-audit.ts"
```

Do **not** add `vision-audit` to the `check:process` chain or any pre-commit hook (see §3.2 — advisory only).

### 5.5 `.claude/skills/game-design-direction/SKILL.md` + `.agents/` mirror (modify)

In the **"Vision Audit at Plan Finalization"** section (origin/main ~line 228): replace the inline *"go through each of the Vision files and ask…"* mechanical re-read instruction with:

1. Run `npm run vision-audit <plan-doc-path>` and read the structured report.
2. Use the report's four sections as the *input* to the five qualitative checks — the checks themselves (god/protagonist separation, mortal sovereignty, tension over-pull, taste-profile strong opinions) **stay verbatim**; the script only replaces the "load 25 KB of Vision markdown to find the touchpoints" step.
3. Keep the existing rule: "If any premise is contradicted, the Vision edit is part of this ticket's scope."

`.claude/` is canonical for shared skills; after editing it, mirror to `.agents/` with `npm run check:skill-sync:sync` (THR-192 pre-commit hook enforces parity). Bump `last_validated_against` in the skill frontmatter to today.

### 5.6 Tests

Add `scripts/__tests__/vision-audit.test.ts`, cloning the `scripts/__tests__/build-authoring-brief.test.ts` fixture pattern:

- A fixture plan doc that cites `Vision/02-non-negotiables.md`, names one premise without citation, and ignores `01-core-loop.md` — assert each lands in the correct report section.
- A fixture Vision dir with and without `taste-profile.md` — assert section 3 renders vs. skips.
- No-vault case — assert section 1 still emits and `exit 0`.
- `--json` output — assert it parses and carries the same four sections.
- Missing plan-doc arg — assert `exit 1`.

## 6. Wiring checklist

This issue adds **no** orchestrator phase, modal, GameState field, trace category, or player control — so `Docs/plans/wiring-checklist.md` needs no new entry. The only "wiring" is the `package.json` script and the `game-design-direction` skill pointer, both covered in §5. The implementer should still confirm against `Docs/plans/wiring-checklist.md` that nothing game-facing was missed (expected result: nothing to add).

## 7. NFP compliance

| # | NFP | Verdict |
|---|-----|---------|
| 1 | Tunability | **PASS** — every magic value (file list, regexes, proximity window, contradiction tokens) is a named constant (§5.2). |
| 2 | Inspectability | **PASS with note** — game-engine tracing is N/A (no engine surface). The script's *own* output is the inspectability surface: a structured report with plan-doc line numbers; `--json` for machine inspection. |
| 3 | Determinism | **PASS** — pure function of (plan doc bytes, Vision dir bytes). No PRNG, no clock, no network. Same inputs → same report. |
| 4 | Fail-soft | **PASS** — §5.3 enumerates every failure path; the only non-zero exit is a usage error. A missing vault degrades gracefully rather than throwing. |
| 5 | Narrative over mechanical perfection | **N/A** — no game mechanics or narrative content touched. |
| 6 | Additive over destructive | **PASS** — new script + new test + one `package.json` line + one skill-section rewrite. No file deleted, no module restructured. The skill edit replaces a mechanical instruction with a tool invocation; the qualitative instructions are preserved verbatim. |
| 7 | Performance budget | **PASS** — reads ~6 small markdown files once; sub-second runtime; invoked on demand, never in the tick loop. |

## 8. Vision audit

`Vision/` premises are about the *game*; this issue is dev tooling and touches no game-facing surface, so no Vision premise is contradicted or updated. Worth noting in passing: the tool is *in service of* `Vision/02-non-negotiables.md` §5 ("Expansive design, conservative implementation") and §7 ("the three pillars are always present") — it lowers the friction of the Vision audit so the audit actually happens every pass. The tool reinforces the premises; it does not bend them. No Vision file edit required.

## 9. Coordination block

- **Suggested model:** `sonnet` — pattern-following work (clone `check-authoring-brief.ts` / `check-process.ts` structure) plus a bounded skill-doc edit. Not novel-system, not prose-heavy.
- **Parallel-safe with:** THR-379 (MT-3 `lint:plan-doc`) — independent sibling script in the same `scripts/` folder, no shared file; THR-383, THR-425 (no file overlap).
- **Mutex with:** none. Touches `package.json` (one additive line — negligible collision surface) and `game-design-direction/SKILL.md` (no other open issue edits this file).
- **Codex review:** yes — small surface, a structural review of the new script + skill edit is cheap insurance.
- **Files to touch:** `scripts/vision-audit.ts` (new), `scripts/__tests__/vision-audit.test.ts` (new), `package.json` (add `vision-audit` script), `.claude/skills/game-design-direction/SKILL.md` + `.agents/skills/game-design-direction/SKILL.md` mirror.
- **Done when:**
  - `npm run vision-audit <recent-plan-doc>` produces the four-section structured report against a real plan doc.
  - The report is consumable by a future MT-2 Vision-auditor subagent (Markdown default + `--json` flag both work).
  - Missing-vault and missing-`taste-profile.md` cases warn and `exit 0` (verified by test).
  - `game-design-direction/SKILL.md` points at `npm run vision-audit` and the `.agents/` mirror is synced (`npm run check:skill-sync` clean).
  - `npm test`, `npx tsc --noEmit`, `npx vite build` pass; evidence pasted in the closing commit body or Linear completion comment.
  - Closing commit body includes `Fixes THR-380`.
