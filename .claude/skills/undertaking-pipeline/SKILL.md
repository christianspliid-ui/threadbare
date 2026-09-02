---
name: undertaking-pipeline
description: The undertaking factory line (THR-1300) — brief keyed on the kind × CRUD grid → draft → bounded critic loop → machine gate (`check:undertaking`) → live proof → compiler → batch report, for contract-complete undertaking templates, one or a batch of six. Triggers on "undertaking pipeline", "draft undertaking", "author undertaking", "undertaking batch", "run the undertaking line", or "/undertaking-pipeline".
model: opus
last_validated_against: 2026-09-03
---

> **Step 0, always:** `Docs/canon/undertakings.md` — the current spec, the kind registry, the gate, the levers, the words. Then `Docs/canon/rulebook-quick-reference.md`. Load `Docs/canon/prose.md` before drafting a single line of prose: undertaking prose is held to the encounter standard (Prose Doctrine v2, narrator mode).
>
> **Copy the encounter line; do not reinvent it.** Every stage here has a sibling in `.claude/skills/encounter-pipeline/` and every script a sibling under `scripts/check-encounter.ts`, `encounter-live-proof.ts`, `compile-encounter.ts`, `encounter-batch-report.ts`. Where a rule differs it is stated in the plan (`Docs/plans/2026-09-02-thr-1300-undertaking-factory.md`); where it is not stated, the encounter line's rule holds.

# The undertaking factory

The production line for **undertakings** — the long works a mortal chooses on the one decision board (build, change, take, undo) — mirroring the encounter factory. It exists so that a template is contract-complete on arrival: in a kind row, undoable, cast-declared, board-authored, reachable, in register. Agents vary; gates do not.

## The line

| Stage | What | Where | Ships in |
|---|---|---|---|
| 0 | **Batch brief**, keyed on the kind × CRUD grid, gap-weighted toward empty cells, the mechanical fix before any premise; Christian-approved in chat | `reference/batch-brief-format.md`, `reference/kind-row-catalog.generated.md` | slice 1 |
| 1 | **Draft** (Fable) against the Undertaking Contract as skeleton — game design before fiction | `agents/draft-prompt.md` | **slice 3** |
| 2 | **Critic loop**, bounded at two passes, then park: systems (the write set is real), editorial (the register), package (assemble, dry-run, refuse) | `agents/systems-prompt.md`, `agents/editorial-prompt.md`, `agents/package-prompt.md` | **slice 3** |
| 3 | **Machine gate** — `npm run check:undertaking -- <id> \| --all` | `scripts/check-undertaking.ts`, `src/data/content-eval/undertakingContract.ts` | **slice 1** |
| 4 | **Live proof** — `npm run check:undertaking-live -- <id>... [--seed N]... [--band <band>\|none]`, non-vacuous by construction; pins `success` by default | `scripts/undertaking-live-proof.ts` | **slice 3** |
| 4b | **Compiler** — `npm run compile:undertaking -- <package.json> [--dry-run] [--force]`: package → `strategic-packs/factory/` module + test, factory aggregate, kind row and profiles registered idempotently; a row-less kind opens only on its first destroy | `scripts/compile-undertaking.ts`, `src/data/content-eval/undertakingPackage.ts`, `reference/undertaking-package-format.md` | **slice 3** |
| 4c | **Implementation** — compile, then the gates in order (typecheck → contract → live proof on seeds 42 + 99 → emitted test → catalog refresh), evidence block quoted from output | `agents/implementation-prompt.md` | **slice 3** |
| 5 | **Batch report** — `npm run undertaking:batch-report`, grid coverage first | `scripts/undertaking-batch-report.ts` | slice 4 |

Stages marked for a later slice are named here so the shape of the line is one document; do not invent a stand-in for a stage that has not shipped.

## The gate (slice 1, live)

`check:undertaking` runs the contract's blocks structural-first: **identity**, **kind membership** (every `multi_tick_project` in exactly one row's C/U/D; a row-less instant carries a `mutationHint`), **counter-play** (a destroy has a `motiveGate` ⊆ `MOTIVE_GATE_KINDS`, a `harmClass`, and an ownable target; the registry as a whole passes `validateKindRegistry`), **cast** (scarcity and identity), **creation** (the write-set non-vacuity rule — Law 56's inverse), **bands** (`checkpointDifficulty` and `payoffValue` inside the tier's band; `projectDuration` set), **board** (`motivations` ≥ 2 distinct value pairs, `payoffValue` present), **reachability** (named in an ambition's `strategicProfile`), **register** (the encounter standard over `activityProse` + `completionProse`), **tokens** (no brace token the strategic prose path does not resolve). One warn channel: the Law 56 write-set lexicon (promoted to a gate on pilot evidence) and past-tense markers.

**No exemptions.** The only escape is `UNDERTAKING_RETROFIT_PENDING` — the 59 shipped templates that predate the contract, named once, shrinking only; the ratchet test fails both a listed template that now passes and an unlisted one that fails. Regenerate only to remove: `npm run check:undertaking -- --all --list-failures`. Green is a precondition for a PR existing; CI runs `--all`.

## Automatic REVISE triggers

1. **A brief that fills only C cells** — works nobody can take back. Rejected on sight.
2. **Fiction before the mechanical fix** — a slot whose premise exists before its `verb`, `tier`, `targetRule`, `cast` and bands are decided.
3. **A destroy without a victim** — `verb: 'destroy'` whose `targetRule` cannot resolve an ownable or commanded object, or with no `motiveGate` / `harmClass`.
4. **A create whose only product is prose** — no `creationEffects` band and no `mutationHint` producing the kind's object.
5. **Prose claiming state the work does not write** — a completion sentence naming a consequence outside the kind's write-set lexicon.
6. **Second person, numerals, exclamation marks, evasive vagueness** in `activityProse` / `completionProse` — the encounter standard, no exceptions for "strategic" text.
7. **A template registered in two of three places** — pack, kind row, ambition profile; the compiler registers all three or the template is unreachable by luck.

## Rulings carried over

- **Batch of six**; briefs agent-drafted, Christian-approved in chat (the one HITL gate).
- **The board and the motive gate are not retuned for a batch.** If six templates move the census envelope, the batch is wrong (plan kill criterion 5); THR-1388 owns the retune question.
- **Review levers are honest or they are nothing** (slice 2): every bypass traced, a below-spotlight actor reported, a target-less destroy reported — and the live proof reads those flags as failed claims.

## Reference

- `reference/batch-brief-format.md` — Stage 0's skeleton and rules.
- `reference/kind-row-catalog.generated.md` — the grid as data (`npm run generate-kind-row-catalog`; under `check:generated-freshness`).
- `reference/undertaking-package-format.md` — the package the compiler consumes: the real template plus `kind` / `profiles` / `docComment`, and the row-less-kind rule.
- `agents/*.md` — the five prompts of the line: draft, systems, editorial, package, implementation.
- `Docs/canon/undertakings.md` — Step 0.
