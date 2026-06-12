# THR-450 — Reconcile retrospective output location

**Date:** 2026-06-11
**Issue:** [THR-450](https://linear.app/threadbare/issue/THR-450/reconcile-retrospective-output-location-designretros-vs)
**Author:** Cowork (keep-work-flowing scheduled session)
**Executor lane:** Ready for Codex (mechanical, well-bounded)
**Project:** Continuous Improvement
**Priority:** P3 (Medium)

## Problem

Two retrospective directories with conflicting conventions. The skill, CLAUDE.md, the `weekly-retro` scheduled-task prompt, the Process canon page, and the `retro-draft` script all point to `Docs/retrospectives/YYYY-MM-DD-retro.md`. The actual live retros land in `Design/retros/retro-YYYY-MM-DD.md`.

```
Design/retros/         (de-facto live — 7 files, latest 2026-05-27)
├── retro-2026-04-18.md
├── retro-2026-04-23.md
├── retro-2026-04-27.md
├── retro-2026-05-11.md
├── retro-2026-05-14.md
├── retro-2026-05-20.md
└── retro-2026-05-27.md

Docs/retrospectives/   (documented but stale — latest 2026-05-05)
├── .gitkeep
├── 2026-03-29-retro.md
├── 2026-04-11-retro.md
├── 2026-04-11-retro-v2.md
├── 2026-04-23-retro-draft.md
├── 2026-05-04-retro-draft.md
└── 2026-05-04-retro.md
```

THR-420 and THR-422 already cite `Design/retros/retro-2026-05-11.md` as their source — downstream agents already trust the live path. Only the documentation surfaces are wrong.

## Decision: Option A — `Design/retros/retro-YYYY-MM-DD.md` is canonical

Rationale:

1. **Recency wins.** 7 weekly retros (Apr 18 → May 27) all in `Design/retros/`. The newest in `Docs/retrospectives/` is May 5, before the cadence stabilised.
2. **Naming is more consistent.** All `Design/retros/` files use `retro-YYYY-MM-DD.md` uniformly. `Docs/retrospectives/` has a mix of `-retro.md`, `-retro-v2.md`, and `-retro-draft.md`.
3. **Downstream agents are already there.** THR-420 / THR-422 cite `Design/retros/retro-2026-05-11.md`.
4. **Lower churn.** Updating 6 doc/skill surfaces is smaller than renaming 7 retro files + maintaining draft-vs-final ambiguity in `Docs/retrospectives/`.

The retros themselves are healthy (weekly cadence intact); only the documented location lags.

## Pillars

Engine N/A · Content N/A · UI N/A — skill + docs reconciliation only. The three-pillar rule is satisfied by explicit N/A with rationale: this work changes no engine code, no content tables, no rendered UI surface. It only updates the strings agents read to know where to write retros.

## Files to touch

### Group 1 — Surfaces that write retros (must point to canonical path)

1. **`.claude/skills/retrospective/SKILL.md`**
   - Line 46: replace `Docs/retrospectives/YYYY-MM-DD-retro-draft.md` with `Design/retros/retro-YYYY-MM-DD-draft.md`
   - Line 119: replace `Docs/retrospectives/YYYY-MM-DD-retro.md` with `Design/retros/retro-YYYY-MM-DD.md`
   - Line 168: replace `Docs/retrospectives/YYYY-MM-DD-retro.md` with `Design/retros/retro-YYYY-MM-DD.md`
   - Bump `last_validated_against` in frontmatter to `2026-06-11` (touched content)

2. **`.agents/skills/retrospective/SKILL.md`**
   - Same three line edits as the `.claude/` copy. `.claude/` is canonical per the skill-tree section in CLAUDE.md; `.agents/` mirrors.
   - Bump `last_validated_against` to `2026-06-11`.
   - Verify with `npm run check:skill-sync` after both edits.

3. **`scripts/retro-draft.ts`**
   - Line 40: `const RETRO_DIR = path.join(REPO_ROOT, "Docs", "retrospectives");` → `const RETRO_DIR = path.join(REPO_ROOT, "Design", "retros");`
   - Line 403: `${outputDate}-retro-draft.md` → `retro-${outputDate}-draft.md` (align filename pattern with the rest of `Design/retros/`)
   - Verify the script still runs end-to-end with `npm run retro-draft` — it should produce a file at `Design/retros/retro-YYYY-MM-DD-draft.md`.

### Group 2 — Surfaces that document retros (must describe canonical path)

4. **`CLAUDE.md`**
   - Line 232: `Retrospectives: Docs/retrospectives/` → `Retrospectives: Design/retros/`
   - Line 435 (inside the `weekly-retro` cron prompt): replace `Write output to Docs/retrospectives/YYYY-MM-DD-retro.md` with `Write output to Design/retros/retro-YYYY-MM-DD.md`
   - Line 521: `Periodically analyze the log, implement quick wins, backlog bigger fixes → Docs/retrospectives/` → `→ Design/retros/`

5. **`Docs/canon/process.md`**
   - Line 45: `Docs/retrospectives/YYYY-MM-DD-retro.md` → `Design/retros/retro-YYYY-MM-DD.md`

6. **`.agents/skills/design-council/SKILL.md`**
   - Line 159: `most recent file in \`Docs/retrospectives/\`` → `most recent file in \`Design/retros/\``
   - Line 165: `recent \`Docs/retrospectives/\`` → `recent \`Design/retros/\``

### Group 3 — Historical / archival (do NOT rewrite history)

7. **`Docs/impediments.md`** — lines 98, 102, 184 cite past retros at their actual historical paths (`Docs/retrospectives/2026-03-29-retro.md`, `Docs/retrospectives/2026-04-11-retro-v2.md`, `Docs/retrospectives/2026-05-04-retro.md`). Those files exist at those paths. **Leave the historical entries alone.** Forward-looking entries (added by `/retrospective` going forward) will pick up the new path automatically once Group 1 surfaces are updated.

8. **`Docs/retrospectives/2026-05-04-retro.md`** — the single finalized retro post-cadence-stabilisation that lives in the old directory. **Move it** to `Design/retros/retro-2026-05-04.md` so the canonical history is complete (`git mv` to preserve history). This means updating `Docs/impediments.md` line 184 — the only forward-pointing impediment that would be affected — to point to the new location. Lines 98 and 102 reference files that genuinely belong in the historical/pre-stabilisation pile and stay put.

9. **`Docs/retrospectives/` cleanup** — after the move in (8):
   - Keep `.gitkeep` removed (delete the directory) if the entire archive is migrated.
   - Recommendation: leave the pre-stabilisation files (`2026-03-29-retro.md`, `2026-04-11-retro.md`, `2026-04-11-retro-v2.md`, `2026-04-23-retro-draft.md`, `2026-05-04-retro-draft.md`) in place and add a one-line `README.md` in `Docs/retrospectives/` explaining "Pre-2026-05-11 archive. Canonical retros now live in `Design/retros/`. See `.claude/skills/retrospective/SKILL.md`."
   - Drafts (`*-retro-draft.md`, `*-retro-v2.md`) are pre-canon and can stay archived under that note. Do not delete — git history preserves attribution.

### Group 4 — Verification (must show clean grep)

10. Confirm `grep -rn "Docs/retrospectives" .claude/ .agents/ CLAUDE.md Docs/canon/ scripts/retro-draft.ts` returns **empty** after edits (the only legitimate references to the old path are the historical impediment-log entries from Group 3).

## Wiring section

Per CLAUDE.md `Docs/plans/wiring-checklist.md` — N/A for engine/UI/orchestrator hooks. The only "wiring" here is the implicit contract between four scripts/skills (`retro-draft`, `retrospective` skill, `weekly-retro` scheduled task, `design-council` skill) that they read/write the same directory. Group 1 + Group 2 edits enforce that contract.

## Constants table (NFP #1)

Two named constants change in `scripts/retro-draft.ts`:

| Constant | Old value | New value | Purpose |
|----------|-----------|-----------|---------|
| `RETRO_DIR` | `Docs/retrospectives` | `Design/retros` | Where `npm run retro-draft` writes the day's draft |
| Output filename pattern | `${outputDate}-retro-draft.md` | `retro-${outputDate}-draft.md` | Filename shape — matches existing `Design/retros/retro-*.md` convention |

No magic numbers introduced.

## Tracing (NFP #2)

N/A — no runtime tracing surface. The `retrospective` skill is interactive; the executor's progress is visible via git diff and shell output.

## Fail-soft table (NFP #4)

| Failure case | Fallback |
|--------------|----------|
| `Design/retros/` does not exist when `npm run retro-draft` runs | Script should `mkdir -p`. Verify the script either creates the directory or errors loudly with an actionable message. Current behaviour: `fs.writeFileSync` on a missing parent will throw — confirm the directory exists in the repo (it does — there are 7 files in it today) and add a `mkdir -p` guard if not present. |
| `Docs/retrospectives/2026-05-04-retro.md` already moved when re-running migration | `git mv` is idempotent if guarded; alternatively check existence before move. Single-shot operation — not a recurring concern. |
| `npm run check:skill-sync` fails after edit | Means `.claude/` and `.agents/` mirrors drifted. Re-run `npm run check:skill-sync:sync` to mirror, then re-verify. |

## NFP compliance

| NFP | Status | Note |
|-----|--------|------|
| #1 Tunability | PASS | Two named constants in `retro-draft.ts`; documented in plan doc constants table. |
| #2 Inspectability | N/A | Doc-only work, no runtime behaviour to trace. |
| #3 Determinism | PASS | No PRNG. Idempotent file edits. |
| #4 Fail-soft | PASS with note | Verify `mkdir -p` guard on `RETRO_DIR` in `retro-draft.ts`. |
| #5 Narrative over mechanical | N/A | No content change. |
| #6 Additive over destructive | PASS | One destructive change (the `git mv` of `2026-05-04-retro.md`) is necessary for canonical-history completeness. All other edits are in-place string replacements. |
| #7 Performance | N/A | Doc work. |

## Verification commands (executor must run before commit)

```bash
# 1. Sanity — no stray references to the old path
grep -rn "Docs/retrospectives" .claude/ .agents/ CLAUDE.md Docs/canon/ scripts/retro-draft.ts
# Expected: empty output (historical entries in Docs/impediments.md are intentional)

# 2. Skill mirror sync
npm run check:skill-sync

# 3. retro-draft smoke — produces a file at the new path
npm run retro-draft
ls -la Design/retros/retro-*-draft.md
# Expected: today's draft file exists at Design/retros/retro-YYYY-MM-DD-draft.md
# Cleanup: rm the draft after verifying — don't commit a generated artifact

# 4. Standard pre-commit gates
npm test
npx tsc --noEmit
npx vite build
```

Engine smoke (30-tick CLI) is **not required** — this change touches no `src/engine/`, no `src/types/gameState.ts`, no `src/types/graph.ts`, no orchestrator file. Browser-verify exempt: doc-only change, no UI pillar touched.

## Done when

- [ ] `.claude/skills/retrospective/SKILL.md` updated (lines 46, 119, 168); `last_validated_against` bumped to 2026-06-11.
- [ ] `.agents/skills/retrospective/SKILL.md` updated to match (lines 46, 119, 168); `last_validated_against` bumped.
- [ ] `scripts/retro-draft.ts` updated (lines 40, 403); script runs end-to-end and produces `Design/retros/retro-YYYY-MM-DD-draft.md`.
- [ ] `CLAUDE.md` updated (lines 232, 435, 521).
- [ ] `Docs/canon/process.md` updated (line 45).
- [ ] `.agents/skills/design-council/SKILL.md` updated (lines 159, 165).
- [ ] `Docs/retrospectives/2026-05-04-retro.md` moved to `Design/retros/retro-2026-05-04.md` via `git mv`.
- [ ] `Docs/impediments.md` line 184 updated to point to the new location of `retro-2026-05-04.md` (the other historical references stay).
- [ ] `Docs/retrospectives/README.md` added with the one-line archive note.
- [ ] Grep verification passes (empty result for `Docs/retrospectives` across the listed surfaces).
- [ ] `npm run check:skill-sync` passes.
- [ ] `npm test`, `npx tsc --noEmit`, `npx vite build` all green.
- [ ] Commit message body includes `Fixes THR-450`.

## Coordination block

**Parallel-safe with:** THR-457, THR-452, THR-455, THR-453, THR-456, THR-449, THR-406 — none of those touch the retrospective skill, `retro-draft.ts`, the Process canon page, or the design-council skill.

**Mutex with:** Any concurrent edit to `.claude/skills/retrospective/SKILL.md`, `.agents/skills/retrospective/SKILL.md`, `.agents/skills/design-council/SKILL.md`, `scripts/retro-draft.ts`, `CLAUDE.md`, or `Docs/canon/process.md`. CLAUDE.md is the largest mutex risk because many tickets touch it; coordinate with whoever is mid-flight on a CLAUDE.md edit before pulling this.

**Codex review:** no — straight doc/skill mechanical work, no review surface required.

## Author's note

This is a clean Codex-fit pickup: every change is a deterministic find-and-replace with a clear before/after, plus one `git mv` and one new README. No design judgment required by the executor. The decision (Option A) is grounded in concrete file inventory at the top of this doc.

If the Codex executor encounters a surface not listed here (e.g. a new skill added between this plan's authoring and pickup that also references `Docs/retrospectives/`), use the Group 4 grep as the source of truth — anything the grep surfaces is in scope.
