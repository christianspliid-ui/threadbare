# THR-267 — CLI smoke test as mandatory pre-commit step for engine changes

**Linear:** THR-267
**Project:** Continuous Improvement
**Parent brainstorm:** THR-260 §5.3 item 3
**Date:** 2026-05-08
**Author:** Cowork

## Goal

Promote the headless CLI smoke from informational guidance to an enforced sixth step in the **Pre-commit minimum** checklist, conditional on the change touching engine code. Fast, deterministic signal that the tick pipeline still produces output after orchestrator / phase / graph mutations — Pocock's "don't outrun your headlights," made procedural for engine work specifically.

## Three-pillar declaration

| Pillar | Status | Why |
|---|---|---|
| Engine | N/A | This change adds a *check* that exercises the engine; it does not modify engine code. The check itself uses `npm run cli` which already exists. |
| Content | N/A | No content table or template touched. |
| UI | N/A | No player-facing surface; this is contributor process documentation only. |

The single substantive change is a documentation edit in `CLAUDE.md`. Per the protocol, all three pillars marked N/A with explicit rationale satisfies the three-pillar requirement.

## Files to touch

| File | Action |
|---|---|
| `CLAUDE.md` | Edit — modify the existing **Pre-commit minimum (always do these)** list under the `## Testing` section. Add a new step 6, and update step 5's "steps 1-3" reference to also include step 6 in the evidence requirement. |

No new files. No code touched. No test changes.

## Exact edit specification

The current block in `CLAUDE.md` (lines ~248-253):

```markdown
**Pre-commit minimum (always do these):**
1. `npm test` — all tests pass
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds (confirms Vercel will deploy)
4. `npm run check:process` — advisory workflow/process lint (non-blocking while it stabilizes)
5. Verification evidence is mandatory at closeout: paste raw terminal output for steps 1-3 in the closing commit body or Linear completion comment, or link to a green CI run for the same commit.
```

Replace verbatim with:

```markdown
**Pre-commit minimum (always do these):**
1. `npm test` — all tests pass
2. `npx tsc --noEmit` — type check clean
3. `npx vite build` — production build succeeds (confirms Vercel will deploy)
4. `npm run check:process` — advisory workflow/process lint (non-blocking while it stabilizes)
5. Verification evidence is mandatory at closeout: paste raw terminal output for steps 1-3 (and step 6 when applicable) in the closing commit body or Linear completion comment, or link to a green CI run for the same commit.
6. **Engine smoke (engine changes only):** if the change touches anything under `src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`, or any tick-loop / orchestrator / phase / agent-decision file, run a 30-tick CLI smoke before commit. Invoke as: `printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`. **Pass criterion:** the run reaches tick 30 without thrown exceptions, the `status` block prints a non-zero agent count, and at least one trace/event line appears in the output. Paste the last ~10 lines (the `status` output) into the closing comment as evidence. If the smoke fails or stalls, do not commit — investigate first.
```

Notes for Codex on the exact diff:

- Change is **two lines**: rewrite line 5 to extend the evidence requirement, and append a new line 6.
- Preserve all surrounding markdown structure exactly: blank line before list, no trailing whitespace, list items use `1.` `2.` `3.` style.
- Keep the existing `## Testing` heading and the `> **CI runs these automatically.**` callout that follows the list untouched.

## Why these triggers, why these flags

- **Path-based trigger** (`src/engine/`, `src/types/gameState.ts`, `src/types/graph.ts`, plus tick/orchestrator/phase/decision files) is mechanical and grep-able. It avoids "what counts as an engine change" judgment.
- **`--seed 42 --map medium`** matches the existing "default seed" call out in CLAUDE.md (lines 65, 73-74) and the "What Cowork/Claude sessions" guidance — keeps the smoke deterministic and lightweight (~414 agents, well under the large-map THR-162/163/164/165 stall risk).
- **`tick 30`** matches the existing pipeline-throughput pattern documented in the "When to use the CLI" section: "run 5 for 30+ ticks." Thirty ticks is enough to exercise initialization, agent decisions, encounter creation, and at least one aftermath reaction in default seed.
- **`printf … | npm run cli`** is the standard Unix pattern for non-interactive REPL invocation. PowerShell users on Windows can substitute `'tick 30','status','exit' | npm run cli -- --seed 42 --map medium` — but the spec only commits to the printf form to keep the contract single-shape.
- **Pass criterion is binary**: completes / non-zero agents / non-empty trace stream. No subjective "looks reasonable" — Codex (and CC, and Cowork) can verify.

## Verification (how Codex confirms the change works)

After making the edit, Codex must:

1. Read back `CLAUDE.md` lines ~248-256 to confirm the new step 6 appears verbatim and step 5 references "steps 1-3 (and step 6 when applicable)".
2. Run the documented smoke once on a clean tree to confirm the printf invocation actually works:
   ```
   printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium
   ```
   The run must complete (no thrown exception, no hang), reach tick 30, print a `status` block with a non-zero agent count, and exit cleanly. Paste the final ~10 lines of output into the closing commit body or Linear completion comment as evidence.
3. Run the existing Pre-commit minimum checklist:
   - `npm test`
   - `npx tsc --noEmit`
   - `npx vite build`
   - `npm run check:process`

If the smoke produces zero agents or never reaches tick 30, **stop**: that's a real engine bug, not a doc bug. File a Continuous Improvement issue describing the failure and bounce the change to Cowork rather than committing.

## Done when

- [ ] `CLAUDE.md` has the new step 6 inserted exactly as specified above (verbatim string match).
- [ ] `CLAUDE.md` step 5 references "steps 1-3 (and step 6 when applicable)" for the evidence requirement.
- [ ] No other lines in `CLAUDE.md` are modified.
- [ ] The documented smoke (`printf "tick 30\nstatus\nexit\n" | npm run cli -- --seed 42 --map medium`) was run once, reached tick 30, printed non-zero agents, and exited cleanly.
- [ ] Last ~10 lines of the smoke `status` block pasted into the closing commit body or Linear comment.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green (output pasted as evidence per existing step 5).
- [ ] Commit message body includes `Fixes THR-267` for auto-close on merge.

## NFP compliance

| # | Status | Note |
|---|---|---|
| 1 Tunability | N/A | No constants introduced. |
| 2 Inspectability | PASS | The smoke produces evidence pasted into the commit; future regressions are diff-traceable. |
| 3 Determinism | PASS | Seed 42, map medium are explicit and reproducible. |
| 4 Fail-soft | PASS | If the smoke fails, the explicit guidance is "do not commit — investigate first," matching the rest of the checklist. The new step does not crash any existing flow; it adds a check only. |
| 5 Narrative over mechanical perfection | N/A | Process documentation. |
| 6 Additive over destructive | PASS | Adds step 6, lightly amends step 5 evidence wording. No existing step removed or weakened. |
| 7 Performance budget | PASS | Medium-map 30-tick smoke runs in well under a minute on dev hardware. |

## Out of scope (do not do)

- Do not add a new `scripts/cli-smoke.ts` or any non-interactive flag to `scripts/cli.ts`. The piped-stdin form is sufficient and avoids a second source of truth.
- Do not change `package.json` to add a `npm run cli:smoke` alias. Keep the smoke as an inline one-liner in the docs so it's visible at the point of obligation.
- Do not extend the smoke to other map sizes, archetypes, or tick counts. THR-293 covers the per-archetype smoke; this issue is the single-default-config ritual.
- Do not modify `Docs/plans/wiring-checklist.md` or any skill — those changes (THR-266, THR-268) are sibling brainstorm items with separate issues.
- Do not promote `npm run check:process` from advisory to blocking in this issue (separate concern, separate ticket).

## Coordination

- **Parallel-safe with:** any work that does not edit `CLAUDE.md`. Specifically parallel-safe with all in-flight encounter UI work (THR-334, THR-335, THR-265, THR-363).
- **Mutex with:** any other issue that edits `CLAUDE.md`. As of 2026-05-08 the only sibling brainstorm item that touches CLAUDE.md is THR-268 (Codesight pre-flight) — currently in Idea state, not in any executor queue. If THR-268 lands first, rebase this edit against it and re-verify the line numbers in the spec.
- **Codex review:** no — single-file doc edit, review via diff.
