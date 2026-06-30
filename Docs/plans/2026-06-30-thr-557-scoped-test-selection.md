> **title:** `Scoped test selection (vitest --changed inner loop) — THR-557`
> **linear_issue:** THR-557
> **author:** Cowork
> **created:** 2026-06-30
> **three_pillars:** Engine `N/A — DX/tooling change, no tick-loop code` · Content `N/A — no content` · UI `N/A — no player-facing surface`

# Scoped test selection (vitest --changed inner loop) — THR-557

*One sentence: the inner dev/agent loop pays a flat ~12-min full-suite tax on every change regardless of blast radius; vitest can already select only the affected tests.*

## Why this is load-bearing

A code change takes <10 min from agent start to first test run, then a flat 12-min `npm test` (737 files) tax — even when the diff touches one engine module or one content file. That tax dominates the loop and, per THR-393, lets the hourly automation start a new ticket while the previous one is still testing. The suite is concentrated in `src/engine/__tests__` (409/737 files) running real simulation work; a localized change exercises a tiny fraction. We're on vitest 4, which selects affected tests from the static import graph against a git diff — the capability exists, it's just not wired into the workflow. THR-489 (closed 2026-06-30) made `npm test` green on `main`, which is the precondition: subset selection is only trustworthy on a green baseline.

This is the **code-change** analogue of THR-491 (which already skips the heavy suite on *doc-only* changes in CI).

## Scope (locked by user 2026-06-30)

**In scope:** the `vitest --changed` inner-loop command + the workflow-doc split (CLAUDE.md + `pull-work`). Nothing else.

**Out of scope** (reduce the *full-run* wall-clock rather than how often it runs — file separately only if needed): parallelism tuning (`poolOptions`/`maxWorkers`, currently unset), CI sharding (`--shard=k/n`), formal fast/slow tiering via vitest `projects`.

## Engine pillar

Engine: N/A — DX/tooling change; touches no tick-loop, orchestrator, graph, or agent-decision code.

## Content pillar

Content: N/A — no encounter, prose, attachment, or data-table content.

## UI pillar

UI: N/A — no player-facing surface, component, modal, or HexMap change. No browser-verify artifact required (types/tooling exemption applies: no runtime UI touched).

## Wiring section

Three touch points, all process/tooling:

1. **`package.json` scripts** — add `"test:changed": "vitest run --changed"`. Leave `test` (`vitest run`) and `test:watch` unchanged. Optionally add `"test:changed:since": "vitest run --changed HEAD~1"` for the "since last commit" form.
2. **`CLAUDE.md` §Testing → Pre-commit minimum** (around lines 252–260) — add a short paragraph above the numbered list establishing the loop model: iterate with `npm run test:changed` for fast proportional feedback; the numbered Pre-commit minimum (full `npm test`, typecheck, build, + engine smoke) stays the certifying gate and is unchanged. Add the caveat that `--changed` follows static imports and can miss runtime data loads (`world-model.json`, dynamic `import()`), snapshot interplay, and generated dashboard artifacts — which is exactly why the full run remains the gate.
3. **`.claude/skills/pull-work/SKILL.md`** — in the implement/verify step, instruct the executor to iterate against `npm run test:changed` and run the full `npm test` once before commit (not after every edit). Do not change the closeout evidence requirement (raw full-suite output still required at closeout).

## Caveats / fail-soft

| Case | Behavior |
|------|----------|
| `--changed` selects zero tests (diff touches only untested files) | vitest exits 0 with "no tests". Acceptable for the inner loop; the full-suite gate still runs pre-commit. The "Done when" measurement step exists to catch a *silently-empty* selection that should not be empty. |
| Change routed through runtime data load (`world-model.json`) not in the static graph | `--changed` may under-select. Mitigation: full `npm test` at commit/CI is unchanged and certifies. Documented as a caveat in CLAUDE.md. |
| Snapshot/generated-artifact interplay | Same as above — full run is the gate. |

No new constants, no PRNG, no traces (tooling change).

## Done when

- [ ] `npm run test:changed` exists and runs only tests affected by the working-tree diff (verify: edit one file, confirm the run selects a small subset, not 737).
- [ ] CLAUDE.md §Testing documents the inner-loop (`test:changed`) vs commit-gate (full `npm test`) split, with the static-import caveat.
- [ ] `pull-work` SKILL.md updated so the executor iterates against the subset and runs the full suite once pre-commit.
- [ ] Measurement note in the closing comment: on 3 representative changes (one content-only, one mid-fanout engine, one high-fanout type e.g. a file imported by `graph.ts`), record selected-file count + wall-clock vs the 737/~12-min full run. Confirms the win is real and selection isn't silently empty.
- [ ] `Fixes THR-557` in the commit body (and PR body).

## NFP compliance

| NFP | Status |
|-----|--------|
| 1. Tunability | N/A — no game constants. |
| 2. Inspectability | PASS — `--changed` selection is observable in vitest output (it lists selected files). |
| 3. Determinism | N/A — no simulation/PRNG. |
| 4. Fail-soft | PASS — empty/under-selection falls back to the unchanged full-suite gate; see fail-soft table. |
| 5. Narrative over mechanical | N/A. |
| 6. Additive over destructive | PASS — adds a script + docs; `test`, `test:watch`, CI, and closeout evidence all unchanged. |
| 7. Performance budget | PASS — this *is* the performance improvement; no profiling regression risk. |
