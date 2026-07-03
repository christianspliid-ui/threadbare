# Find-First Content Lint — implementation spec (Codex handoff)

**Author:** Cowork · **Date:** 2026-06-23 · **Status:** implementation-ready
**Origin:** THR-414 verdict #3 (2026-06-23) — "Find gates Change/Control" kept **soft per-template + lint**, NOT a hard engine invariant.
**Project:** Content Architecture

## Goal

A headless content-lint that flags action templates which let the player **Change/Control** a
target without a **Find** (perceive/reveal) gate — enforcing the design rule *"you can't Change
what you haven't Found"* as an **advisory lint**, not a runtime engine refusal. Mirrors the existing
`scripts/lint-encounter-content.ts` pattern.

## Load-bearing interpretation (decision — read before implementing)

The Find→Change dependency is **not modeled as a per-template prerequisite field today.** Grounding
(2026-06-22):
- `UnifiedActionTemplate` (`src/types/unifiedAction.ts:636`) carries `crudType: 'create' | 'read' |
  'update' | 'delete'` — the verb discriminator. **read = Find, update = Change/Control,
  create = Create, delete = Destroy.**
- There is **no** `prerequisiteTemplateIds` / `unlockedBy` field. The actual "you must perceive
  before you act" gate in the engine is **layer revelation**: a template with a `narrativeLayer`
  (`'land' | 'soul' | 'people' | 'ruins'`, `src/types/unifiedAction.ts:700`) only appears once that
  layer is revealed on the target hex — and **revealing a layer is the Find/perceive act.**
  `bypassRevelationGate: true` (line 706) opts a template out (used for Create).

**Therefore the lint's operational rule:** treat **"Found" as "the target's narrative layer is
revelation-gated."** A `crudType: 'update'` template (Change/Control) should either be
revelation-gated (`narrativeLayer` present) or be an explicit, documented exemption. This is the
faithful reading of the rule against the architecture that exists; if a future design adds an
explicit Find-prerequisite field, the lint rule moves to it. **Do not add a schema field in this
issue** — implement against `narrativeLayer` + an allowlist constant.

> Director note (flag, non-blocking): this interprets "Found" as "layer revealed." If the director
> later wants a stricter, per-target-entity Find dependency, that's a follow-up schema issue.

## Lint rule (precise)

For every `UnifiedActionTemplate` across the data files:

1. **Scope:** only `crudType === 'update'` templates (Change + Control; Control surfaces as a
   sustained update). Skip `create` (nothing to Find yet), `read` (is itself Find), and `delete`
   (Destroy — out of scope for this verdict; the rule named Change/Control).
2. **Pass** if any of: `narrativeLayer` is set (revelation-gated) · `starter === true` (intentional
   always-visible floor, THR-419) · the template id is in `FIND_GATE_EXEMPT_IDS` (a script-local
   allowlist constant, each entry carrying a one-line rationale comment).
3. **Flag (warning)** otherwise: `"Change/Control template '<id>' is not Find-gated (no
   narrativeLayer, not starter, not exempt)"`, with source file + crudType in the issue record.

**Severity = warning, exit code 0** in v1 (advisory). This is a new rule over existing content that
will likely flag many templates; the violation list **is the worklist**. Flipping to
error/exit-1 (CI-blocking) is a follow-up once the catalog is reconciled — note this in the script
header.

## Files to touch

- **`scripts/lint-find-first.ts`** (new) — mirror `scripts/lint-encounter-content.ts`: load all
  template arrays, apply the rule, accumulate an issue model
  (`{ severity, ruleId, source, templateId, message }`), print grouped findings + a summary
  (`{ scanned, warnings }`), exit 0.
- **`package.json`** — add one script line mirroring `lint:encounter-content`'s esbuild-bundle +
  node invocation: `"lint:find-first": "esbuild scripts/lint-find-first.ts --bundle --platform=node
  --format=esm --outfile=.cache/lint-find-first.mjs --external:fs --external:path --external:process
  --external:url && node .cache/lint-find-first.mjs"`.
- **Reads only** (do not modify): `src/types/unifiedAction.ts` (field names), the template data
  files under `src/data/` (`unified-action-templates.ts`, `*-encounter-content.ts`).
- Optional: a small `scripts/__tests__/lint-find-first.test.ts` with two fixtures (one gated, one
  violating) asserting the rule classifies each correctly.

## Coordination block (Codex handoff)

- **Parallel-safe with:** THR-475 (encounter surface foundation — disjoint files: scoring/surface
  modules, not scripts), THR-473 (content census — different new script), all content-authoring
  work (read-only over templates).
- **Mutex with:** none structural. Touches `package.json` `scripts` (append one line) — if another
  in-flight issue is editing `package.json` scripts, sequence after it to avoid a merge conflict.
- **Files to touch:** `scripts/lint-find-first.ts` (new), `package.json` (one line), optional test.
- **Suggested executor:** Codex (mechanical, pattern-following — clone an existing lint script).

## Done when

- `npm run lint:find-first` runs headlessly, scans all template arrays, prints grouped warnings + a
  summary line, exits 0.
- Rule classifies correctly: a `crudType:'update'` template with no `narrativeLayer` / not starter /
  not exempt is flagged; a revelation-gated or starter or exempt one is not (spot-check ≥2 real
  templates of each kind, or the fixture test).
- Script header documents the layer-revelation interpretation + the "advisory now, CI-blocking
  later" note + the `FIND_GATE_EXEMPT_IDS` rationale convention.
- `npx tsc --noEmit` clean; `npm run lint:find-first` output tail pasted as evidence. Closing commit
  body: `Fixes <this-id>`.

## Three pillars

Dev-tooling addition (a lint script). **Content** — N/A (authors no content; the violation list is
the content worklist). **UI** — N/A (CLI tool, no player surface). **Engine** — N/A (reads
templates; changes no runtime behavior; explicitly NOT a runtime invariant per the verdict). Pillar
table marked N/A-with-rationale is correct here: this is tooling, not a game feature.

## NFP

Determinism: pure read over static data → deterministic. Fail-soft: a malformed template entry →
skip + warn, never abort the scan. Tunability: the `FIND_GATE_EXEMPT_IDS` allowlist + the
warning/error severity are the tunable knobs.
